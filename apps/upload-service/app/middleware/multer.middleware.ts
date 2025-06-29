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
    if (
      file.mimetype.startsWith("video/") ||
      file.mimetype.startsWith("image/")
    ) {
      cb(null, true);
    } else {
      cb(new Error("Only video and image files are allowed!"));
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
    const files = req.files as {
      video?: Express.Multer.File[];
      thumbnail?: Express.Multer.File[];
    };

    const videoFile = files?.video?.[0];
    const thumbnailFile = files?.thumbnail?.[0];

    if (!videoFile) {
       res.status(400).json({ message: "No video file uploaded" });
       return
    }

    // Upload video
    const videoExt = videoFile.mimetype.split("/")[1];
    const videoKey = `videos/${uuid()}.${videoExt}`;
    await s3.send(
      new PutObjectCommand({
        Bucket: envConfig.AWS_S3_DOWNLOAD_BUCKET_NAME!,
        Key: videoKey,
        Body: videoFile.buffer,
        ContentType: videoFile.mimetype,
      })
    );

    req.body.videoUrl = `https://${envConfig.AWS_S3_DOWNLOAD_BUCKET_NAME}.s3.${envConfig.AWS_REGION}.amazonaws.com/${videoKey}`;
    req.body.uniqueFileNameKey = videoKey.split("/")[1].split(".")[0];

    // Upload thumbnail if present
    if (thumbnailFile) {
      const thumbExt = thumbnailFile.mimetype.split("/")[1];
      const thumbKey = `thumbnails/${uuid()}.${thumbExt}`;
      await s3.send(
        new PutObjectCommand({
          Bucket: envConfig.AWS_S3_DOWNLOAD_BUCKET_NAME!,
          Key: thumbKey,
          Body: thumbnailFile.buffer,
          ContentType: thumbnailFile.mimetype,
        })
      );
      req.body.thumbnailUrl = `https://${envConfig.AWS_S3_DOWNLOAD_BUCKET_NAME}.s3.${envConfig.AWS_REGION}.amazonaws.com/${thumbKey}`;
    }

    next();
  } catch (error) {
    console.error("S3 Upload Error:", error);
    res.status(500).json({ message: "S3 upload failed", error });
  }
};


export const videoUpload = upload.fields([
  { name: "video", maxCount: 1 },
  { name: "thumbnail", maxCount: 1 }, // optional
]);
export const s3Uploader = uploadVideoToS3;
