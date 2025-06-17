import { Types,Document } from "mongoose";

export interface ChannelDocument extends Document{
    channel_name:string,
    channel_description:string,
    channel_unique_name:string,
    owner_id:Types.ObjectId,
    profile_image:string,
    banner_image:string,
}

export interface ChannelSubscription {
  channel_id: Types.ObjectId;
  user_id: Types.ObjectId;
  subscribed_at?: Date; // Optional because of default value
  createdAt?: Date;
  updatedAt?: Date;
}

export interface ChannelSubscriptionDocument extends ChannelSubscription,Document {}