import {Document,Types} from 'mongoose'

export interface UnprocessedVideoDocument extends Document{
    title:string,
    description:string,
    org_video_url:string,
    thumbnail_url:string,
    channel_id:Types.ObjectId,
    status:string,
    duration:number,
    resolution:string,
    unique_file_name_key:string

}

export interface ResolutionVariant {
  label: string; // e.g., "720p"
  resolution: string; // e.g., "1280x720"
  bitrate: string; // e.g., "2500k"
  playlistUrl: string; // HLS path or S3 URL
}

export interface ProcessedVideoDocument extends Document {
  video_id: Types.ObjectId; // Reference to uploaded video record
  channel_id: Types.ObjectId; // Who uploaded it (optional)
  originalFileName: string;
  bucket: string;
  s3Key: string;
  status: "UPLOADED" | "PROCESSING" | "DONE" | "ERROR";
  resolutions: ResolutionVariant[]; // All generated HLS variants
  duration: number; // In seconds
  errorMessage?: string; // Optional error description
  createdAt: Date;
  updatedAt: Date;
}

export interface Dbb{
    _id:Types.ObjectId
}


export interface VideoReaction {
  video_id: Types.ObjectId;
  user_id: Types.ObjectId;
  reaction: "LIKE" | "DISLIKE";
  createdAt?: Date;
  updatedAt?: Date;
}

export interface VideoReactionDocument extends VideoReaction, Document {}


export interface VideoComment {
  video_id: Types.ObjectId;
  user_id: Types.ObjectId;
  comment_text: string;
  parent_comment_id?: Types.ObjectId | null;
  createdAt?: Date;
  updatedAt?: Date;
}

export interface VideoCommentDocument extends VideoComment, Document {}


export interface VideoView {
  video_id: Types.ObjectId;
  user_id?: Types.ObjectId; // Optional, in case of anonymous views
  ip_address?: string; // Optional, to support user-less tracking
  viewed_at?: Date; // Optional, defaulted to Date.now by schema
}

export interface VideoViewDocument extends VideoView, Document {}
