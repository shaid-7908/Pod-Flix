import express from 'express'
import { videoUpload } from '../middleware/multer.middleware'
import { s3Uploader } from '../middleware/multer.middleware'
import { videoController } from '../controllers/video.controller'

const videoRouter = express.Router()

videoRouter.post('/upload-video',videoUpload,s3Uploader,videoController.testUpload)


export default videoRouter