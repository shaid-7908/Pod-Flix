import { JwtPayload } from "@shared/types"
import { asyncHandler } from "../utils/async.handler"
import { Request ,Response} from "express"
import { S3Client, GetObjectCommand } from "@aws-sdk/client-s3";
import { getSignedUrl } from "@aws-sdk/s3-request-presigner";
import envConfig from "../config/env.config";
import { ProcessedVideoModel, UnprocessedVideoModel, VideoViewModel } from "@shared/database";
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

// Helper function to track video views
const trackVideoView = async (videoId: string, userId?: string, ipAddress?: string) => {
  try {
    await VideoViewModel.create({
      video_id: new mongoose.Types.ObjectId(videoId),
      user_id: userId ? new mongoose.Types.ObjectId(userId) : undefined,
      ip_address: ipAddress,
      viewed_at: new Date()
    });
  } catch (error) {
    console.error('Error tracking video view:', error);
    // Don't throw error to avoid breaking the main flow
  }
};

class StreamingController{
    streamVideo = asyncHandler(async (req:Request,res:Response)=>{
         const {videoId} = req.params
         const user = req.user as JwtPayload | undefined
         const ipAddress = req.ip || req.connection.remoteAddress || req.headers['x-forwarded-for'] as string
         
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

         // Track the view (non-blocking)
         trackVideoView(videoId, user?.user_id, ipAddress);

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

    getVideoViews = asyncHandler(async (req: Request, res: Response) => {
      const { videoId } = req.params;
      
      if (!videoId || !mongoose.Types.ObjectId.isValid(videoId)) {
        return sendError(res, 'Invalid video ID', null, STATUS_CODES.BAD_REQUEST);
      }

      try {
        // Get total views
        const totalViews = await VideoViewModel.countDocuments({
          video_id: new mongoose.Types.ObjectId(videoId)
        });

        // Get unique views (by user_id and ip_address)
        const uniqueViews = await VideoViewModel.aggregate([
          {
            $match: {
              video_id: new mongoose.Types.ObjectId(videoId)
            }
          },
          {
            $group: {
              _id: {
                user_id: '$user_id',
                ip_address: '$ip_address'
              }
            }
          },
          {
            $count: 'unique_views'
          }
        ]);

        const viewStats = {
          video_id: videoId,
          total_views: totalViews,
          unique_views: uniqueViews[0]?.unique_views || 0
        };

        return sendSuccess(res, 'View statistics retrieved successfully', viewStats, STATUS_CODES.OK);
      } catch (error) {
        console.error('Error getting video views:', error);
        return sendError(res, 'Failed to get view statistics', null, STATUS_CODES.INTERNAL_SERVER_ERROR);
      }
    });

    getProcessedVideos = asyncHandler(async (req: Request, res: Response) => {
      const page = parseInt(req.query.page as string) || 1;
      const limit = parseInt(req.query.limit as string) || 10;
      const skip = (page - 1) * limit;
    
      const query = { status: 'PRCD' };
      const total = await UnprocessedVideoModel.countDocuments(query);
    
      const videos = await UnprocessedVideoModel.aggregate([
        { $match: { status: 'PRCD' } },
        { $sort: { createdAt: -1 } },
        {
          $lookup: {
            from: 'processed_videos',
            localField: '_id',
            foreignField: 'video_id',
            as: 'processed_data'
          }
        },
        {
          $unwind: {
            path: '$processed_data',
            preserveNullAndEmptyArrays: true
          }
        },
        {
          $lookup: {
            from: 'video_views',
            localField: 'processed_data._id',
            foreignField: 'video_id',
            as: 'views'
          }
        },
        {
          $addFields: {
            total_views: { $size: '$views' }
          }
        },
        // 👇 Add pagination here
        { $skip: skip },
        { $limit: limit },
        {
          $project: {
            _id: 1,
            title: 1,
            description: 1,
            channel_id: 1,
            createdAt: 1,
            'processed_data._id': 1,
            'processed_data.duration': 1,
            total_views: 1
          }
        }
      ]);
    
      return sendSuccess(res, 'Processed videos fetched successfully', {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit),
        videos
      }, STATUS_CODES.OK);
    });
    
}

const streamingController = new StreamingController()

export default streamingController