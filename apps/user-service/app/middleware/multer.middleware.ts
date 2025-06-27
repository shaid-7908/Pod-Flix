import multer from "multer";
import { S3Client, PutObjectCommand } from "@aws-sdk/client-s3";
import { Request, Response, NextFunction } from "express";
import envConfig from "../config/env.config";
import { v4 as uuid } from "uuid";

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
  limits: { fileSize: 10 * 1024 * 1024 }, // 10MB limit
  fileFilter: (req, file, cb) => {
    console.log("Received file:")
    if (file.mimetype.startsWith("image/")) {
      cb(null, true);
    } else {
      cb(new Error("Only image files are allowed!"));
    }
  },
});

// Async middleware to upload image to S3
const uploadImageToS3 = async (
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    if (!req.file) {
      res.status(400).json({ message: "No image file uploaded" });
      return;
    }

    const fileBuffer = req.file.buffer;
    const extension = req.file.mimetype.split("/")[1];
    const uniqueFilename = `${uuid()}.${extension}`;
    const fileKey = `images/${uniqueFilename}`;

    const uploadParams = {
      Bucket: envConfig.AWS_S3_UPLOAD_BUCKET_NAME!,
      Key: fileKey,
      Body: fileBuffer,
      ContentType: req.file.mimetype,
    };

    await s3.send(new PutObjectCommand(uploadParams));

    // Attach S3 URL to request
    req.body.imageUrl = `https://${envConfig.AWS_S3_UPLOAD_BUCKET_NAME}.s3.${envConfig.AWS_REGION}.amazonaws.com/${fileKey}`;
    req.body.uniqueImageKey = uniqueFilename.split('.')[0];

    next();
  } catch (error) {
    console.error("S3 Image Upload Error:", error);
    res.status(500).json({ message: "S3 image upload failed", error });
  }
};

export const imageUpload = upload.single("image");
export const s3ImageUploader = uploadImageToS3;
