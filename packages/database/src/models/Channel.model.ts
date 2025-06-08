import { Schema,model,Types } from "mongoose";
import { ChannelDocument } from "@shared/types";

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

export const ChannelModel = model<ChannelDocument>('channels',ChannelSchema)