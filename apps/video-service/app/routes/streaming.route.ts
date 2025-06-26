import express from 'express'
import authMiddleware from '../middlewares/auth.middleware'
import streamingController from '../controllers/streaming.controller'


const streaminRouter = express.Router()

// Stream endpoint - accessible without auth for anonymous view tracking
streaminRouter.post('/stream/:videoId',streamingController.streamVideo)

// Get all processed videos (paginated, latest first)
streaminRouter.get('/processed-videos', streamingController.getProcessedVideos)

// View statistics endpoint - requires authentication
streaminRouter.use(authMiddleware)
streaminRouter.get('/views/:videoId', streamingController.getVideoViews)

export default streaminRouter