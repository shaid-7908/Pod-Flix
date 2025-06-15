import fs from "fs";
import path from "path";

// Same RESOLUTIONS used during transcoding
const RESOLUTIONS = [
  { label: "240p", resolution: "426x240", bitrate: "300000" },
  { label: "144p", resolution: "256x144", bitrate: "150000" },
];

export const generateMasterPlaylist = (videoId: string): void => {
  const outputDir = path.join(__dirname, "..", "..", "transcoded", videoId);
  const masterPath = path.join(outputDir, "master.m3u8");

  const lines = ["#EXTM3U", "#EXT-X-VERSION:3"];

  for (const { label, resolution, bitrate } of RESOLUTIONS) {
    const [width, height] = resolution.split("x");

    lines.push(
      `#EXT-X-STREAM-INF:BANDWIDTH=${bitrate},RESOLUTION=${resolution}`,
      `${label}.m3u8`
    );
  }

  fs.writeFileSync(masterPath, lines.join("\n"), "utf-8");
  console.log(`✅ master.m3u8 generated at: ${masterPath}`);
};
