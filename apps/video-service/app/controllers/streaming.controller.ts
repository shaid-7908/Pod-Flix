import { JwtPayload } from "@shared/types"
import { asyncHandler } from "../utils/async.handler"
import { Request ,Response} from "express"
import { S3Client, GetObjectCommand } from "@aws-sdk/client-s3";
import { getSignedUrl } from "@aws-sdk/s3-request-presigner";
import envConfig from "../config/env.config";
import { ProcessedVideoModel } from "@shared/database";
import { sendError } from "../utils/unified.response";
import { STATUS_CODES } from "@shared/utils";


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

         const processedVideo = await ProcessedVideoModel.findOne({
            _id:videoId,
            status:'DONE'
         })

         if(!processedVideo){
           return sendError(res,'Video is not available',null,STATUS_CODES.BAD_GATEWAY)
         }
         
         const s3FolderName = processedVideo.resolutions[0].playlistUrl
         const s3Array = s3FolderName.split('/')
         const s3bb = s3Array[s3Array.length - 2]
         const s3Key = `hls/${s3bb}/master.m3u8`
         const command = new GetObjectCommand({
           Bucket: envConfig.AWS_S3_UPLOAD_BUCKET_NAME,
           Key: s3Key,
         });

         const signedUrl = await getSignedUrl(s3, command, { expiresIn: 3600 });

         return res.json({ url: signedUrl });

        console.log(processedVideo)

         
    })
}

const streamingController = new StreamingController()

export default streamingController