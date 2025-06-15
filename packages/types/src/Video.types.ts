import {Document,Types} from 'mongoose'

export interface UnprocessedVideoDocument extends Document{
    title:string,
    description:string,
    org_video_url:string,
    thumbnail_url:string,
    channel_id:Types.ObjectId,
    status:string,
    duration:number,
    resolution:string

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