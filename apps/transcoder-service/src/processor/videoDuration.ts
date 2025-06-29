import ffmpeg from "fluent-ffmpeg";
import path from "path";
ffmpeg.setFfmpegPath('C:\\ffmpeg\\ffmpeg-2025-06-26-git-09cd38e9d5-full_build\\bin\\ffmpeg.exe');
export const getVideoDuration = (filePath: string): Promise<number> => {
  const fullFilePath = path.join(__dirname,'..','..','tmp',filePath)
  return new Promise((resolve, reject) => {
    ffmpeg.ffprobe(fullFilePath, (err, metadata) => {
      if (err) return reject(err);
      const duration = metadata.format.duration;
      if (typeof duration === "number") {
        resolve(duration);
      } else {
        reject(new Error("Could not determine video duration"));
      }
    });
  });
};
