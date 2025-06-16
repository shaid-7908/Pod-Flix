// middleware/uploadToS3.ts
import multer from "multer";
import { S3Client, PutObjectCommand } from "@aws-sdk/client-s3";
import { Request, Response, NextFunction } from "express";
import envConfig from "../config/env.config";

import {v4 as uuid} from 'uuid'

// Configure AWS S3 client (v3)
const s3 = new S3Client({
  region: envConfig.AWS_REGION!,
  credentials: {
    accessKeyId: envConfig.AWS_ACCESS_KEY!,
    secretAccessKey: envConfig.AWS_SECRET_KEY!,
  },
});

// Multer configuration - use memory storage
const upload = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: 100 * 1024 * 1024 }, // 100MB
  fileFilter: (req, file, cb) => {
    if (file.mimetype.startsWith("video/")) {
      cb(null, true);
    } else {
      cb(new Error("Only video files are allowed!"));
    }
  },
});

// Async middleware to upload file to S3
const uploadVideoToS3 = async (
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    if (!req.file) {
      res.status(400).json({ message: "No file uploaded" });
      return;
    }

    const fileBuffer = req.file.buffer;
    const extention = req.file.mimetype.split('/')[1]
    const uniquefilename = `${uuid()}.${extention}`
    const fileKey = `videos/${uniquefilename}`;

    const uploadParams = {
      Bucket: envConfig.AWS_S3_BUCKET_NAME!,
      Key: fileKey,
      Body: fileBuffer,
      ContentType: req.file.mimetype,
      
    };

    await s3.send(new PutObjectCommand(uploadParams));

    // Attach public S3 URL to req.body
    req.body.videoUrl = `https://${envConfig.AWS_S3_BUCKET_NAME}.s3.${envConfig.AWS_REGION}.amazonaws.com/${fileKey}`;
    req.body.uniqueFileNameKey = uniquefilename.split('.')[0]
    next(); // Pass to next middleware/controller
  } catch (error) {
    console.error("S3 Upload Error:", error);
    res.status(500).json({ message: "S3 upload failed", error });
  }
};

export const videoUpload = upload.single("video");
export const s3Uploader = uploadVideoToS3;
