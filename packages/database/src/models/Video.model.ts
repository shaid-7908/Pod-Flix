import { model, Schema } from "mongoose";
import { UnprocessedVideoDocument ,ResolutionVariant,ProcessedVideoDocument} from "@shared/types";

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

const ResolutionVariantSchema = new Schema<ResolutionVariant>({
    bitrate:String,
    label:String,
    playlistUrl:String,
    resolution:String,
})

const ProcessedVideoSchema = new Schema<ProcessedVideoDocument>({
  video_id: {
    type: Schema.Types.ObjectId,
    ref: "unprocessed_video",
    required: true,
  },
  channel_id: { type: Schema.Types.ObjectId, ref: "channels", required: true },
  bucket: { type: String },
  s3Key: { type: String },
  status: {
    type: String,
    enum: ["UPLOADED", "PROCESSING", "DONE", "ERROR"],
    default: "UPLOADED",
  },
  resolutions:[ResolutionVariantSchema],
  duration:{type:Number},
  errorMessage:{type:String}
},{timestamps:true});

export const UnprocessedVideoModel = model<UnprocessedVideoDocument>('unprocessed_video',UnprocessedVideoSchema)
export const ProcessedVideoModel = model<ProcessedVideoDocument>('processed_video',ProcessedVideoSchema)