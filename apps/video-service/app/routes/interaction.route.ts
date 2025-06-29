import express from 'express'
import interactionController from '../controllers/interaction.controller'
import authMiddleware from '../middlewares/auth.middleware'

const interactionRouter = express.Router()



interactionRouter.post('/update-interaction',authMiddleware,interactionController.updateLikesOfVideo)
interactionRouter.get('/getall-likes',interactionController.getLikesOfVideo)
interactionRouter.post('/add-comment',authMiddleware,interactionController.addComment)
interactionRouter.post('/reply-comment',authMiddleware,interactionController.addReplyComment)
interactionRouter.get('/get-comments/:videoId',authMiddleware,interactionController.getComments)
interactionRouter.delete('/delete-comment',authMiddleware,interactionController.deleteComment)

export default interactionRouter