import { publishToLikeQueue } from "@shared/rabbitmq";
import { asyncHandler } from "../utils/async.handler"
import { Request,Response } from "express"
import { JwtPayload } from "@shared/types";
import { sendError, sendSuccess } from "../utils/unified.response";
import { STATUS_CODES } from "@shared/utils";
import { VideoCommentModel, VideoReactionModel } from "@shared/database";
import mongoose from "mongoose";



class InteractionController{


    

    updateLikesOfVideo = asyncHandler(async (req:Request,res:Response)=>{
       const user = req.user as JwtPayload
       const {video_id,interaction_value} = req.body
       const check_if_liked =  await VideoReactionModel.findOne({user_id:user.user_id})
       console.log(check_if_liked)
       if(check_if_liked) {
         const like_status = check_if_liked.reaction 
         const current_like_status = interaction_value === 1 ? 'LIKE' : 'DISLIKE'
         if (like_status === current_like_status){

            return sendError(res,'Action already performed',null,STATUS_CODES.BAD_REQUEST)
         }
       }
       const prepareMessage = {
        'video_id':video_id,
        'user_id':user.user_id,
        'reaction': interaction_value == 1 ? 'LIKE' : 'DISLIKE'
       }
       publishToLikeQueue(prepareMessage)

       return sendSuccess(res,'Interaction added successfully',null,STATUS_CODES.OK)
    })

    getLikesOfVideo = asyncHandler(async (req,res)=>{
      const {video_id} = req.body
      const totalLikes = await VideoReactionModel.aggregate([
        {
          $match:{
          video_id:new mongoose.Types.ObjectId(video_id),
          reaction:'LIKE'
        }
      },
      {
        $count:'likecount'
      }
      ])

      return sendSuccess(res,'Total number of likes',totalLikes,STATUS_CODES.OK)

    })

    addComment = asyncHandler(async (req:Request,res:Response)=>{
       const user = req.user as JwtPayload
       console.log(req.body,'comment check')
       const { video_id, comment_text } = req.body;
       const addedComment = await VideoCommentModel.create({video_id,comment_text,user_id:user.user_id})
       return sendSuccess(res,'Comment added successfully',addedComment,STATUS_CODES.ACCEPTED)
    })
    addReplyComment = asyncHandler(async (req:Request,res:Response)=>{
      const user = req.user as JwtPayload
      const {video_id,comment_text , parent_comment_id} = req.body
      const addReply = await VideoCommentModel.create({video_id,comment_text,user_id:user.user_id,parent_comment_id:parent_comment_id})
      return sendSuccess(res,'Reply added successfully',addReply,STATUS_CODES.ACCEPTED)
    })
    deleteComment = asyncHandler(async (req:Request,res:Response)=>{
      const user = req.user as JwtPayload
      const {comment_id} = req.body
      const deletedComment = await VideoCommentModel.deleteOne({_id:comment_id})

      const deleteReplies = await VideoCommentModel.deleteMany({parent_comment_id:comment_id})

     return sendSuccess(res,'Deleted all comments',deleteReplies,STATUS_CODES.ACCEPTED)
      
    })
    getComments = asyncHandler(async (req:Request,res:Response)=>{
      const video_id = req.params.videoId
      const comments = await VideoCommentModel.aggregate([
        { $match: { 
         video_id: new mongoose.Types.ObjectId(video_id), 
         parent_comment_id: null 
      } },
        {
          $lookup: {
            from: "users",
            localField: "user_id",
            foreignField: "_id",
            as: "user",
          },
        },
        { $unwind: "$user" },
        {
          $lookup: {
            from: "video_comments", // same collection
            localField: "_id",
            foreignField: "parent_comment_id",
            as: "replies",
          },
        },
        {
          $project: {
            _id: 1,
            comment_text: 1,
            createdAt: 1,
            user: {
              _id: "$user._id",
              user_name: "$user.user_name",
            },
            replyCount: { $size: "$replies" },
          },
        },
      ]);

      return sendSuccess(res,'Comments fetched successfully',comments,STATUS_CODES.OK)
    })
}

const interactionController = new InteractionController()

export default interactionController