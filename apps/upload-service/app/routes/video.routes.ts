import express from 'express'
import { videoUpload } from '../middleware/multer.middleware'
import { s3Uploader } from '../middleware/multer.middleware'
import { videoController } from '../controllers/video.controller'
import authMiddleware from '../middleware/auth.middleware'

const videoRouter = express.Router()

videoRouter.use(authMiddleware)
videoRouter.post('/upload-video-test',videoUpload,s3Uploader,videoController.testUpload)
videoRouter.post('/upload-video',videoUpload,s3Uploader,videoController.uploadVideowithDbSync)


export default videoRouter