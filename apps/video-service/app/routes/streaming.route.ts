import express from 'express'
import authMiddleware from '../middlewares/auth.middleware'
import streamingController from '../controllers/streaming.controller'


const streaminRouter = express.Router()

streaminRouter.use(authMiddleware)
streaminRouter.post('/stream/:videoId',streamingController.streamVideo)

export default streaminRouter