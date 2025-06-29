import { ChannelModel, UnprocessedVideoModel,VideoCommentModel } from "@shared/database";
import { asyncHandler } from "../utils/async.handler";
import { Request,Response } from "express";
import { channelSchema } from "../validation/channelschema.validation";
import { sendError, sendSuccess } from "../utils/unified.response";
import { STATUS_CODES } from "@shared/utils";
import mongoose from "mongoose";
import { JwtPayload } from "@shared/types";
import { ChannelSubscriptionModel } from "@shared/database";

class ChannelController{
    createChannel=asyncHandler(async( req:Request,res:Response)=>{
       //console.log(req.user)
       const validateChannelCreationRequest = channelSchema.safeParse(req.body)
       if(!validateChannelCreationRequest.success){
        return sendError(res,'Data validation failed',validateChannelCreationRequest.error.errors,STATUS_CODES.BAD_REQUEST)
       }
       const {channel_name,channel_description,channel_unique_name} = validateChannelCreationRequest.data

       const createdChannel = await ChannelModel.create({channel_description,channel_name,channel_unique_name,owner_id:req.user?.user_id ,profile_image:req.body.profile_image,banner_image:req.body.banner_image})

       return sendSuccess(res,"Channel created successfully",createdChannel,STATUS_CODES.CREATED)

    })

    getOwnChannelInfo=asyncHandler(async (req:Request,res:Response)=>{
          const user_id = req.user?.user_id
          const channel = await ChannelModel.findOne({owner_id:user_id})
          if(!channel){
            
            return sendError(res,"Channel not found or is not created",null,STATUS_CODES.NOT_FOUND)
          }
          const TotalVideos = await UnprocessedVideoModel.aggregate([
            {$match:{channel_id:new mongoose.Types.ObjectId(channel._id as string)}},
            {$count:"total_videos"}
          ])
          const totalComments = await VideoCommentModel.aggregate([
            {
              $lookup: {
                from: "unprocessed_videos", // ← collection name (plural of model)
                localField: "video_id",
                foreignField: "_id",
                as: "video",
              },
            },
            { $unwind: "$video" },
            {
              $match: {
                "video.channel_id": new mongoose.Types.ObjectId(channel._id as string),
              },
            },
            {
              $count: "total",
            },
          ]);
          let overAllDetails ={}
           if(TotalVideos.length === 0){
             overAllDetails = {
            total_videos:0,
            total_comments:0,
            channel_info:channel
          }
           }else{
            overAllDetails = {
              total_videos:TotalVideos[0].total_videos,
              total_comments:0,
              channel_info:channel
            }
          }
          


         return sendSuccess(res,"Channel info",
            overAllDetails,STATUS_CODES.OK)
    })

    getOtherChannelInfoOnVideoCard=asyncHandler(async(req:Request,res:Response)=>{
      const channel_id = req.params.channelId
      const user = req.user as JwtPayload
      const channel = await ChannelModel.findOne({_id:channel_id})
      const isSubscribed = await ChannelSubscriptionModel.findOne({channel_id:channel_id,user_id:user.user_id})
      if(!channel){
        return sendError(res,"Channel not found",null,STATUS_CODES.NOT_FOUND)
      }
      const payload_data={
        channel_info:channel,
        is_subscribed:isSubscribed ? true : false
      }
      return sendSuccess(res,"Channel info",payload_data,STATUS_CODES.OK)
    })
    
    
}

const channelController = new ChannelController()

export default channelController