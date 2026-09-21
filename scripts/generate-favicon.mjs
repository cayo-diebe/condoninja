import sharp from "sharp";
import { fileURLToPath } from "node:url";

// Reuse the original blue Ninja artwork; only resize and compress it for browser tabs.
await sharp(fileURLToPath(new URL("../public/condo-brand-transparent.png", import.meta.url)))
  .resize(64, 64, { fit: "contain", background: { r: 0, g: 0, b: 0, alpha: 0 } })
  .png({ compressionLevel: 9, palette: true })
  .toFile(fileURLToPath(new URL("../app/icon.png", import.meta.url)));
