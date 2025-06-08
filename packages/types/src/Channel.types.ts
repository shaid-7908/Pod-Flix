import { Types,Document } from "mongoose";

export interface ChannelDocument extends Document{
    channel_name:string,
    channel_description:string,
    channel_unique_name:string,
    owner_id:Types.ObjectId,
    profile_image:string,
    banner_image:string,
}

export interface ChannelSubscriberDocument extends Document{
    channel_id:Types.ObjectId,
    subscribers:Types.ObjectId[]
}