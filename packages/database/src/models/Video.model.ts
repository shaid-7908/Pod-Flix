import { model, Schema } from "mongoose";
import {
  UnprocessedVideoDocument,
  ResolutionVariant,
  ProcessedVideoDocument,
  VideoCommentDocument,
  VideoViewDocument,
  VideoReactionDocument
} from "@shared/types";

const UnprocessedVideoSchema = new Schema<UnprocessedVideoDocument>({
  title: {
    type: String,
    required: true,
  },
  description: {
    type: String,
  },
  org_video_url: {
    type: String,
  },
  thumbnail_url: {
    type: String,
  },
  channel_id: {
    type: Schema.Types.ObjectId,
    ref: "channels",
    required: true,
  },
  unique_file_name_key: {
    type: String,
    required: true,
    unique: true,
  },
  status: {
    type: String,
    enum: ["UNPR", "PRNG", "PRCD", "FLD"],
    default: "UNPR",
  },
  duration: {
    type: Number,
  },
  resolution: {
    type: String,
  },
});

const ResolutionVariantSchema = new Schema<ResolutionVariant>({
  bitrate: String,
  label: String,
  playlistUrl: String,
  resolution: String,
});

const ProcessedVideoSchema = new Schema<ProcessedVideoDocument>(
  {
    video_id: {
      type: Schema.Types.ObjectId,
      ref: "unprocessed_video",
      required: true,
    },
    channel_id: {
      type: Schema.Types.ObjectId,
      ref: "channels",
      required: true,
    },
    bucket: { type: String },
    s3Key: { type: String },
    status: {
      type: String,
      enum: ["UPLOADED", "PROCESSING", "DONE", "ERROR"],
      default: "UPLOADED",
    },
    resolutions: [ResolutionVariantSchema],
    duration: { type: Number },
    errorMessage: { type: String },
  },
  { timestamps: true }
);

const VideoCommentSchema = new Schema<VideoCommentDocument>(
  {
    video_id: {
      type: Schema.Types.ObjectId,
      ref: "unprocessed_video",
      required: true,
    },
    user_id: {
      type: Schema.Types.ObjectId,
      ref: "users",
      required: true,
    },
    comment_text: {
      type: String,
      required: true,
    },
    parent_comment_id: {
      type: Schema.Types.ObjectId,
      ref: "video_comments",
      default: null,
    },
  },
  { timestamps: true }
);


const VideoReactionSchema = new Schema<VideoReactionDocument>(
  {
    video_id: {
      type: Schema.Types.ObjectId,
      ref: "unprocessed_video",
      required: true,
    },
    user_id: {
      type: Schema.Types.ObjectId,
      ref: "users",
      required: true,
    },
    reaction: {
      type: String,
      enum: ["LIKE", "DISLIKE"],
      required: true,
    },
  },
  { timestamps: true }
);
  
VideoReactionSchema.index({video_id:1,user_id:1},{unique:true})

const VideoViewSchema = new Schema<VideoViewDocument>({
  video_id: {
    type: Schema.Types.ObjectId,
    ref: "processed_video",
    required: true,
  },
  user_id: {
    type: Schema.Types.ObjectId,
    ref: "users",
  },
  ip_address: {
    type: String,
  },
  viewed_at: {
    type: Date,
    default: Date.now,
  },
});



export const UnprocessedVideoModel = model<UnprocessedVideoDocument>(
  "unprocessed_video",
  UnprocessedVideoSchema
);
export const ProcessedVideoModel = model<ProcessedVideoDocument>(
  "processed_video",
  ProcessedVideoSchema
);
export const VideoCommentModel = model<VideoCommentDocument>(
  "video_comments",
  VideoCommentSchema
);

export const VideoReactionModel = model<VideoReactionDocument>(
  "video_reactions",
  VideoReactionSchema
);

export const VideoViewModel = model<VideoViewDocument>(
  "video_views",
  VideoViewSchema
);
