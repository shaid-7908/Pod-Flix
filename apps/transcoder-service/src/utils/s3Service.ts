import fs from "fs";
import path from "path";
import { Readable } from "stream";
import {
  S3Client,
  GetObjectCommand,
  PutObjectCommand,
} from "@aws-sdk/client-s3";
import envConfig from "../config/env.config";

const s3 = new S3Client({
  region: envConfig.AWS_REGION,
  credentials: {
    accessKeyId: envConfig.AWS_ACCESS_KEY!,
    secretAccessKey: envConfig.AWS_SECRET_KEY!,
  },
});

export const downloadFromS3 = async (videoKey: string): Promise<string> => {
  const fileName = path.basename(videoKey);
  const outputPath = path.join(__dirname, "..", "..", "tmp", fileName);

  fs.mkdirSync(path.dirname(outputPath), { recursive: true });

  const response = await s3.send(
    new GetObjectCommand({
      Bucket: envConfig.AWS_S3_DOWNLOAD_BUCKET_NAME,
      Key: videoKey,
    })
  );

  if (!(response.Body instanceof Readable))
    throw new Error("Expected stream from S3");

  const writeStream = fs.createWriteStream(outputPath);
  response.Body.pipe(writeStream);

  await new Promise<void>((resolve, reject) => {
    writeStream.on("finish", resolve);
    writeStream.on("error", reject);
  });

  return fileName;
};

export const uploadHLSFolder = async (
  localFolder: string,
  videoId: string
): Promise<{ label: string; playlistUrl: string }[]> => {
  const fullPath = path.join(localFolder, videoId);
  const files = fs
    .readdirSync(fullPath)
    .filter((file) => fs.statSync(path.join(fullPath, file)).isFile());

  const results: { label: string; playlistUrl: string }[] = [];

  for (const file of files) {
    const filePath = path.join(fullPath, file);
    const contentType = file.endsWith(".m3u8")
      ? "application/x-mpegURL"
      : "video/MP2T";

    await s3.send(
      new PutObjectCommand({
        Bucket: envConfig.AWS_S3_UPLOAD_BUCKET_NAME,
        Key: `hls/${videoId}/${file}`,
        Body: fs.readFileSync(filePath),
        ContentType: contentType,
      })
    );

    if (file.endsWith(".m3u8")) {
      results.push({
        label: file.replace(".m3u8", ""),
        playlistUrl: `https://${envConfig.AWS_S3_UPLOAD_BUCKET_NAME}.s3.${envConfig.AWS_REGION}.amazonaws.com/hls/${videoId}/${file}`,
      });
    }
  }
  try {
    fs.rmSync(fullPath, { recursive: true, force: true });
    console.log(`🗑️ Deleted folder: ${fullPath}`);
  } catch (err) {
    console.error(
      `❌ Failed to delete folder ${fullPath}:`,
      (err as Error).message
    );
  }

  return results;
};
