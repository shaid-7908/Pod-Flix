import { model, Schema } from "mongoose";
import { UnprocessedVideoDocument } from "@shared/types";

const UnprocessedVideoSchema = new Schema<UnprocessedVideoDocument>({
    title:{
        type:String,
        required:true
    },
    description:{
        type:String
    },
    org_video_url:{
        type:String
    },
    thumbnail_url:{
        type:String
    },
    channel_id:{
        type:Schema.Types.ObjectId,
        ref:'channels',
        required:true
    },
    status:{
        type:String,
        enum:["UNPR","PRNG","PRCD","FLD"],
        default:"UNPR"
    },
    duration:{
        type:Number
    },
    resolution:{
        type:String
    }
})

export const UnprocessedVideoModel = model<UnprocessedVideoDocument>('unprocessed_video',UnprocessedVideoSchema)