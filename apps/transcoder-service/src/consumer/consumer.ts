import { downloadFromS3 } from "../utils/s3Downloader";
import { transcodeVideo } from "../processor/transcoder";
import { UnprocessedVideoModel } from "@shared/database";
import { uploadTranscodedFolder } from "../utils/uploadTranscodedFolder";
import path from 'path'
import { ProcessedVideoModel } from "@shared/database";
import {UnprocessedVideoDocument} from '@shared/types'
import fs from 'fs'




export const handleIncomingVideo = async (msg: Record<string, any>) => {
  
  const bucket = msg["bucket-name"];

  const unprocessedVideoId = msg["unpProcessedVideoDocumentId"];
  const channelID = msg["channelID"];
  const s3Filename = msg["s3Filename"];
  const s3FolderName = msg["s3FolderName"];
  const s3BucketName = msg["s3BucketName"];
  const videoKey = `${s3FolderName}/${s3Filename}`;
  if (
    !unprocessedVideoId ||
    !channelID ||
    !s3Filename ||
    !s3FolderName ||
    !s3BucketName
  ) {
    console.warn("[⚠️] Invalid message format.");
    return;
  }

  const dbVideoUrl = `https://${s3BucketName}.s3.ap-south-1.amazonaws.com/${s3FolderName}/${s3Filename}`;
  const videoData = await UnprocessedVideoModel.findOne({
    _id: unprocessedVideoId,
  }) as any ;

  if (!videoData) {
    console.warn("[⚠️] No matching DB record found.");
    return;
  }

  try {
    const localFilePath = await downloadFromS3(videoKey);
    await transcodeVideo(localFilePath, videoData);
    const TO_DELETE_DIR = path.join(__dirname,"..","..", "tmp");

    const transcodedPath = path.join(
      __dirname,
      "..",
      "..",
      "transcoded",
    );

    const results = await uploadTranscodedFolder(
      transcodedPath,
      videoData._id.toString()
    );

    // Save to ProcessedVideoModel
    await ProcessedVideoModel.create({
      video_id: videoData._id,
      channel_id: videoData.channel_id,
      bucket,
      s3Key: videoKey,
      status: "DONE",
      resolutions: results,
      duration: videoData.duration || undefined, // optionally compute using ffprobe
    });

    // Optional: update status in UnprocessedVideoModel
    await UnprocessedVideoModel.updateOne(
      { _id: videoData._id },
      { $set: { status: "PRCD" } }
    );

    console.log(`✅ Video metadata saved to DB for video ID: ${videoData._id}`);
  }catch (err: any) {
    console.error("❌ Failed during processing:", err.message);

    await ProcessedVideoModel.create({
      video_id: videoData._id,
      channel_id: videoData.channel_id,
      bucket,
      s3Key: videoKey,
      status: "ERROR",
      errorMessage: err.message,
    });

    await UnprocessedVideoModel.updateOne(
      { _id: videoData._id },
      { $set: { status: "FLD" } }
    );
  }finally{
    // 4. CLEANUP
    const TMP_DIR = path.join(__dirname, "..", "..", "tmp");
    const TRANSCODED_DIR = path.join(__dirname, "..", "..", "transcoded");

    try {
      if (fs.existsSync(TMP_DIR)) {
        fs.rmSync(TMP_DIR, { recursive: true, force: true });
        console.log("🧹 Deleted tmp folder.");
      }

      if (fs.existsSync(TRANSCODED_DIR)) {
        fs.rmSync(TRANSCODED_DIR, { recursive: true, force: true });
        console.log("🧹 Deleted transcoded folder.");
      }
    } catch (cleanupErr) {
      console.warn("⚠️ Cleanup failed:", cleanupErr);
    }
  }
  
};