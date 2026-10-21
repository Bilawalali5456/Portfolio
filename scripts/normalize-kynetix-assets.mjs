import sharp from "sharp";
import path from "path";
import fs from "fs";
import { fileURLToPath } from "url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const dir = path.join(__dirname, "..", "assets", "projects");

const srcCover = path.join(dir, "kynetix.png");
const srcMobile = path.join(dir, "kynetix mob.png");
const srcVideo = path.join(dir, "kynetix video.mp4");

for (const f of [srcCover, srcMobile, srcVideo]) {
  if (!fs.existsSync(f)) {
    console.error("Missing:", f);
    process.exit(1);
  }
}

const outVideo = path.join(dir, "kynetix-cover.mp4");
fs.copyFileSync(srcVideo, outVideo);
console.log("copied video -> kynetix-cover.mp4");

/* Cover 1600x1200 — cover-crop landscape */
await sharp(srcCover)
  .rotate()
  .resize(1600, 1200, { fit: "cover", position: "top" })
  .webp({ quality: 84 })
  .toFile(path.join(dir, "kynetix-cover.webp"));
console.log("kynetix-cover.webp");

/* Square + detail from cover */
await sharp(srcCover)
  .rotate()
  .resize(1200, 1200, { fit: "cover", position: "attention" })
  .webp({ quality: 84 })
  .toFile(path.join(dir, "kynetix-square.webp"));
console.log("kynetix-square.webp");

await sharp(srcCover)
  .rotate()
  .resize(600, 600, { fit: "cover", position: "attention" })
  .webp({ quality: 84 })
  .toFile(path.join(dir, "kynetix-detail.webp"));
console.log("kynetix-detail.webp");

/* Desk — full width, keep height */
const deskMeta = await sharp(srcCover).rotate().metadata();
const deskW = 1440;
const deskH = Math.round((deskMeta.height / deskMeta.width) * deskW);
await sharp(srcCover)
  .rotate()
  .resize(deskW, deskH, { fit: "fill" })
  .webp({ quality: 82 })
  .toFile(path.join(dir, "kynetix-desk.webp"));
console.log("kynetix-desk.webp", deskW + "x" + deskH);

/* Mobile long scroll */
const mobMeta = await sharp(srcMobile).rotate().metadata();
const mobW = 390;
const mobH = Math.round((mobMeta.height / mobMeta.width) * mobW);
await sharp(srcMobile)
  .rotate()
  .resize(mobW, mobH, { fit: "inside", withoutEnlargement: false })
  .webp({ quality: 80 })
  .toFile(path.join(dir, "kynetix-mobile.webp"));
console.log("kynetix-mobile.webp", mobW + "x" + (await sharp(path.join(dir, "kynetix-mobile.webp")).metadata()).height);

console.log("done");
