import { publishToLikeQueue } from "@shared/rabbitmq";
import { asyncHandler } from "../utils/async.handler"
import { Request,Response } from "express"
import { JwtPayload } from "@shared/types";
import { sendError, sendSuccess } from "../utils/unified.response";
import { STATUS_CODES } from "@shared/utils";
import { VideoCommentModel, VideoReactionModel } from "@shared/database";

const data = [
  { videoId: "vid_001", like: 1, dislike: 0 },
  { videoId: "vid_002", like: 0, dislike: 1 },
  { videoId: "vid_003", like: 1, dislike: 0 },
  { videoId: "vid_004", like: 1, dislike: 0 },
  { videoId: "vid_005", like: 0, dislike: 1 },
  { videoId: "vid_006", like: 1, dislike: 0 },
  { videoId: "vid_007", like: 0, dislike: 1 },
  { videoId: "vid_008", like: 1, dislike: 0 },
  { videoId: "vid_009", like: 0, dislike: 1 },
  { videoId: "vid_010", like: 1, dislike: 0 },
];
  

class InteractionController{


    testLikeBulkUpdate = asyncHandler(async (req:Request,res:Response)=>{
           data.map((el)=>{
            publishToLikeQueue(el)
           })
    })

    updateLikesOfVideo = asyncHandler(async (req:Request,res:Response)=>{
       const user = req.user as JwtPayload
       const {video_id,interaction_value} = req.body
       const check_if_liked =  await VideoReactionModel.findOne({user_id:user.user_id})
       console.log(check_if_liked)
       if(check_if_liked) {
        return sendError(res,'Already liked',null,STATUS_CODES.BAD_REQUEST)
       }
       const prepareMessage = {
        'video_id':video_id,
        'user_id':user.user_id,
        'reaction': interaction_value == 1 ? 'LIKE' : 'DISLIKE'
       }
       publishToLikeQueue(prepareMessage)

       return sendSuccess(res,'Interaction added successfully',null,STATUS_CODES.OK)
    })

    addComment = asyncHandler(async (req:Request,res:Response)=>{
       const user = req.user as JwtPayload
       const { video_id, comment_text } = req.body;
       const addedComment = await VideoCommentModel.create({video_id,comment_text,user_id:user.user_id})
       return sendSuccess(res,'Comment added successfully',addedComment,STATUS_CODES.ACCEPTED)
    })
}

const interactionController = new InteractionController()

export default interactionController