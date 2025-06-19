import express from 'express'
import interactionController from '../controllers/interaction.controller'
import authMiddleware from '../middlewares/auth.middleware'

const interactionRouter = express.Router()


interactionRouter.get('/test-like',interactionController.testLikeBulkUpdate)
interactionRouter.post('/update-interaction',authMiddleware,interactionController.updateLikesOfVideo)
interactionRouter.post('/add-comment',authMiddleware,interactionController.addComment)

export default interactionRouter