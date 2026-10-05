import sharp from "sharp";
import path from "path";
import { fileURLToPath } from "url";
import fs from "fs";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const root = path.resolve(__dirname, "..");
const src = path.join(
  process.env.USERPROFILE || "",
  ".cursor/projects/d-My-Portfolio/assets/c__Users_USER_AppData_Roaming_Cursor_User_workspaceStorage_91938c46af3684b16220d7ee9cf32362_images_ChatGPT_Image_Oct_1__2026__06_00_37_PM-5619f536-61af-44a3-b714-0a3c32686fd4.jpg"
);
const outDir = path.join(root, "assets", "images");

if (!fs.existsSync(src)) {
  console.error("Source not found:", src);
  process.exit(1);
}

fs.mkdirSync(outDir, { recursive: true });

const meta = await sharp(src).metadata();
const w = meta.width;
const h = meta.height;
console.log("source", w, h);

/* Already square — crop upper face/shoulders so it reads at 16–32px */
const side = Math.round(Math.min(w, h) * 0.55);
const left = Math.round((w - side) / 2);
const top = Math.round(h * 0.04);
const topClamped = Math.min(Math.max(0, top), h - side);

console.log("crop", { left, top: topClamped, side });

const cropped = sharp(src).extract({
  left,
  top: topClamped,
  width: side,
  height: side,
});

await cropped
  .clone()
  .resize(512, 512)
  .png()
  .toFile(path.join(outDir, "favicon-source.png"));

await cropped
  .clone()
  .resize(180, 180)
  .png()
  .toFile(path.join(outDir, "apple-touch-icon.png"));

await cropped
  .clone()
  .resize(32, 32)
  .png()
  .toFile(path.join(outDir, "favicon-32.png"));

await cropped
  .clone()
  .resize(16, 16)
  .png()
  .toFile(path.join(outDir, "favicon-16.png"));

await cropped
  .clone()
  .resize(48, 48)
  .png()
  .toFile(path.join(outDir, "favicon.png"));

async function pngToIco(pngPaths, icoPath) {
  const pngs = [];
  for (const p of pngPaths) {
    pngs.push(await fs.promises.readFile(p));
  }

  const count = pngs.length;
  const headerSize = 6 + count * 16;
  let offset = headerSize;
  const entries = [];

  for (let i = 0; i < count; i++) {
    const buf = pngs[i];
    const metaPng = await sharp(buf).metadata();
    const size = metaPng.width >= 256 ? 0 : metaPng.width;
    entries.push({
      width: size,
      height: size,
      bytes: buf.length,
      offset,
      buf,
    });
    offset += buf.length;
  }

  const out = Buffer.alloc(offset);
  out.writeUInt16LE(0, 0);
  out.writeUInt16LE(1, 2);
  out.writeUInt16LE(count, 4);

  let entryAt = 6;
  for (const e of entries) {
    out.writeUInt8(e.width, entryAt);
    out.writeUInt8(e.height, entryAt + 1);
    out.writeUInt8(0, entryAt + 2);
    out.writeUInt8(0, entryAt + 3);
    out.writeUInt16LE(1, entryAt + 4);
    out.writeUInt16LE(32, entryAt + 6);
    out.writeUInt32LE(e.bytes, entryAt + 8);
    out.writeUInt32LE(e.offset, entryAt + 12);
    e.buf.copy(out, e.offset);
    entryAt += 16;
  }

  await fs.promises.writeFile(icoPath, out);
}

await pngToIco(
  [
    path.join(outDir, "favicon-16.png"),
    path.join(outDir, "favicon-32.png"),
    path.join(outDir, "favicon.png"),
  ],
  path.join(outDir, "favicon.ico")
);

/* Also keep a clean square source copy in assets for reuse */
await sharp(src)
  .resize(512, 512, { fit: "cover" })
  .jpeg({ quality: 90 })
  .toFile(path.join(outDir, "favicon-portrait.jpg"));

console.log("Wrote favicon.ico, favicon.png, apple-touch-icon.png to", outDir);
