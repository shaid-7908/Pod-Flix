import {Request,Response} from 'express'

class VideoController{
    testUpload = async(req:Request,res:Response)=>{
        console.log(req.file)
        console.log(req.body)
    }
}

export const videoController = new VideoController()