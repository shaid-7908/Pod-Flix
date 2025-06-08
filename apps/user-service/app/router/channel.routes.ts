import express from 'express'
import channelController from '../controllers/channel.controller'
import authMiddleware from '../middleware/auth.middleware'
//import { asyncHandler } from '../utils/async.handler'

const channelRouter = express.Router()
channelRouter.use(authMiddleware)
channelRouter.post('/create-channel',channelController.createChannel)

export default channelRouter

