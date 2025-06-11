import { Request, Response } from "express";
import { sendError, sendSuccess } from "../utils/unified.response";
import { asyncHandler } from "../utils/async.handler";
import { STATUS_CODES } from "@shared/utils";
import { ChannelModel, UnprocessedVideoModel } from "@shared/database";

class VideoController {
  testUpload = asyncHandler(async (req: Request, res: Response) => {
    console.log(req.file);
    console.log(req.body);
    console.log(req.user)
    return sendSuccess(res, "test", null, STATUS_CODES.ACCEPTED);
  });
  uploadVideowithDbSync = asyncHandler(async (req:Request,res:Response)=>{
        const user_id = req.user?.user_id
        const user_channel = await ChannelModel.findOne({owner_id:user_id})
        if(!user_channel){
            return sendError(res,'No channel found',null,STATUS_CODES.BAD_REQUEST)
        }
        const {title , description,videoUrl } = req.body

        const createVideoMetadata = await UnprocessedVideoModel.create({
            title:title,
            description:description,
            org_video_url:videoUrl,
            channel_id:user_channel._id
        })
        return sendSuccess(res, "Video uploaded and saved successfully", {
          video_id: createVideoMetadata._id,
          title: createVideoMetadata.title,
          url: createVideoMetadata.org_video_url,
        });

  })
}

export const videoController = new VideoController();
