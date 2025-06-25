import { JwtPayload } from "@shared/types"
import { asyncHandler } from "../utils/async.handler"
import { Request ,Response} from "express"
import { S3Client, GetObjectCommand } from "@aws-sdk/client-s3";
import { getSignedUrl } from "@aws-sdk/s3-request-presigner";
import envConfig from "../config/env.config";
import { ProcessedVideoModel, UnprocessedVideoModel } from "@shared/database";
import { sendError, sendSuccess } from "../utils/unified.response";
import { STATUS_CODES } from "@shared/utils";

import { getCachedVideoData,cacheVideoData , invalidateVideoCache } from "@shared/redis";
import mongoose from "mongoose";

const s3 = new S3Client({
    region:envConfig.AWS_REGION,
    credentials:{
        accessKeyId:envConfig.AWS_ACCESS_KEY,
        secretAccessKey:envConfig.AWS_SECRET_KEY
    }
})


class StreamingController{
    streamVideo = asyncHandler(async (req:Request,res:Response)=>{
         const {videoId} = req.params
         const user = req.user as JwtPayload | undefined
         let processedVideo = await getCachedVideoData(videoId)
         if(!processedVideo){
          console.log('cache not exists')
          const result = await UnprocessedVideoModel.aggregate([
            {
              $match: {
                _id: new mongoose.Types.ObjectId(videoId),
                status: "PRCD",
              },
            },
            {
              $lookup: {
                from: "processed_videos",
                let: { videoId: "$_id" },
                pipeline: [
                  {
                    $match: {
                      $expr: { $eq: ["$video_id", "$$videoId"] },
                    },
                  },
                  {
                    $project: {
                      _id: 1,
                      resolutions: 1,
                      duration: 1,
                      // All other fields will be excluded automatically
                    },
                  },
                ],
                as: "processed_data",
              },
            },
          ]);
          await cacheVideoData(videoId,result)
          processedVideo=result
        }
        
        

         if(!processedVideo || processedVideo.length <= 0){
           return sendError(res,'Video is not available',null,STATUS_CODES.BAD_GATEWAY)
         }
         
         
         const s3FolderName = processedVideo[0].processed_data[0].resolutions[0].playlistUrl
         const s3Array = s3FolderName.split('/')
         const s3bb = s3Array[s3Array.length - 2]
         const s3Key = `hls/${s3bb}/master.m3u8`
         const command = new GetObjectCommand({
           Bucket: envConfig.AWS_S3_UPLOAD_BUCKET_NAME,
           Key: s3Key,
         });

         const signedUrl = await getSignedUrl(s3, command, { expiresIn: 3600 });

         const videoWithMetadata = {
           signed_url: signedUrl,
           channel_id: processedVideo[0].channel_id,
           orginal_video_id: processedVideo[0]._id,
           video_title: processedVideo[0].title,
           video_description: processedVideo[0].description,
         };
         
         return sendSuccess(res,'Video fetched successfully',videoWithMetadata,STATUS_CODES.OK);

       // return sendSuccess(res,'op',processedVideo,STATUS_CODES.ACCEPTED)

         
    })
    
}

const streamingController = new StreamingController()

export default streamingController