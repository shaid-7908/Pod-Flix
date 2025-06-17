import { Schema,model,Types } from "mongoose";
import { ChannelDocument ,ChannelSubscriptionDocument} from "@shared/types";

const ChannelSchema = new Schema<ChannelDocument>({
    channel_name:{
        type:String,
    },
    channel_unique_name:{
        type:String,
        unique:true
    },
    channel_description:{
        type:String
    },
    profile_image:{
        type:String,
        default:''
    },
    banner_image:{
        type:String,
        default:''
    },
    owner_id:{
        type:Schema.Types.ObjectId,
        ref:'users',
        required:true
    }
})

const ChannelSubscriptionSchema = new Schema<ChannelSubscriptionDocument>(
  {
    channel_id: {
      type: Schema.Types.ObjectId,
      ref: "channels",
      required: true,
    },
    user_id: {
      type: Schema.Types.ObjectId,
      ref: "users",
      required: true,
    },
    subscribed_at: {
      type: Date,
      default: Date.now,
    },
  },
  { timestamps: true }
);

ChannelSubscriptionSchema.index(
  { channel_id: 1, user_id: 1 },
  { unique: true }
);

export const ChannelModel = model<ChannelDocument>('channels',ChannelSchema)
export const ChannelSubscriptionModel = model<ChannelSubscriptionDocument>(
  "channel_subscriptions",
  ChannelSubscriptionSchema
);