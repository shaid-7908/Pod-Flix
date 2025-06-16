import fs from "fs";
import path from "path";
import ffmpeg from "fluent-ffmpeg";

// Define input/output directories
const INPUT_DIR = path.join(__dirname,"..","..", "tmp");
const OUTPUT_DIR = path.join(__dirname,"..","..", "transcoded");

// HLS variants
const RESOLUTIONS = [
  
  { label: "240p", resolution: "426x240", bitrate: "300k" },
  { label: "144p", resolution: "256x144", bitrate: "150k" },
];


// Ensure output dir exists
if (!fs.existsSync(OUTPUT_DIR)) {
  fs.mkdirSync(OUTPUT_DIR, { recursive: true });
}

// Function to process one video into HLS variants
export const transcodeVideo = async (
  filename: string,
  unprocessedVideoData: any
): Promise<void> => {
  const inputPath = path.join(INPUT_DIR, filename);
  const baseName = path.parse(filename).name;
  const outputPath = path.join(OUTPUT_DIR, unprocessedVideoData._id.toString());

  if (!fs.existsSync(outputPath)) {
    fs.mkdirSync(outputPath, { recursive: true });
  }

  return new Promise((resolve, reject) => {
    const command = ffmpeg(inputPath);

    RESOLUTIONS.forEach(({ label, resolution, bitrate }) => {
      const streamPath = `${outputPath}/${label}.m3u8`;
      command
        .output(streamPath)
        .videoCodec("libx264")
        .audioCodec("aac")
        .addOptions([
          `-vf scale=${resolution}`,
          `-b:v ${bitrate}`,
          "-hls_time 10",
          "-hls_list_size 0",
          `-hls_segment_filename ${outputPath}/${label}_%03d.ts`,
        ]);
    });

    command
      .on("start", (cmdLine) => {
        console.log("FFmpeg started with command:", cmdLine);
      })
      .on("progress", (progress) => {
        console.log(`Processing: ${progress.percent?.toFixed(2)}%`);
      })
      .on("end", () => {
        console.log(`✅ Transcoding completed: ${filename}`);
        fs.promises
          .unlink(inputPath)
          .then(() => {
            console.log(`🗑️ Deleted original file: ${filename}`);
            resolve(); // Now resolve after deletion
          })
          .catch((err) => {
            console.error(
              `⚠️ Failed to delete original file ${filename}:`,
              err.message
            );
            resolve(); // Still resolve to continue flow
          });
      })
      .on("error", (err) => {
        console.error(`❌ Error processing ${filename}:`, err.message);
        reject(err); // ✅ catch failure
      })
      .run();
  });
};