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