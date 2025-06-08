import { ChannelModel } from "@shared/database";
import { asyncHandler } from "../utils/async.handler";
import { Request,Response } from "express";
import { channelSchema } from "../validation/channelschema.validation";
import { sendError, sendSuccess } from "../utils/unified.response";
import { STATUS_CODES } from "@shared/utils";

class ChannelController{
    createChannel=asyncHandler(async( req:Request,res:Response)=>{
       //console.log(req.user)
       const validateChannelCreationRequest = channelSchema.safeParse(req.body)
       if(!validateChannelCreationRequest.success){
        return sendError(res,'Data validation failed',validateChannelCreationRequest.error.errors,STATUS_CODES.BAD_REQUEST)
       }
       const {channel_name,channel_description,channel_unique_name} = validateChannelCreationRequest.data

       const createdChannel = await ChannelModel.create({channel_description,channel_name,channel_unique_name,owner_id:req.user?.user_id})

       return sendSuccess(res,"Channel created successfully",createdChannel,STATUS_CODES.CREATED)

    })
    
}
const channelController = new ChannelController()
export default channelController