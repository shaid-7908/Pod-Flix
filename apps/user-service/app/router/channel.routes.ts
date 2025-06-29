import express from 'express'
import channelController from '../controllers/channel.controller'
import authMiddleware from '../middleware/auth.middleware'
import { channelImageUpload, s3ChannelImageUploader } from '../middleware/multer.middleware'
//import { asyncHandler } from '../utils/async.handler'

const channelRouter = express.Router()
channelRouter.use(authMiddleware)
channelRouter.post('/create-channel',channelImageUpload,s3ChannelImageUploader,channelController.createChannel)
channelRouter.get('/get-own-channel-info',channelController.getOwnChannelInfo)

export default channelRouter

