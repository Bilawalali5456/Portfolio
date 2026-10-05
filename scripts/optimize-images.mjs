/**
 * Optimize portfolio images with sharp.
 * Reads from assets/_raw, writes WebP (+ JPG for portraits) to assets/projects|images.
 * Usage: node scripts/optimize-images.mjs
 */
import fs from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";
import sharp from "sharp";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const root = path.resolve(__dirname, "..");
const rawDir = path.join(root, "assets", "_raw");
const projectsDir = path.join(root, "assets", "projects");
const imagesDir = path.join(root, "assets", "images");

const MAX_BYTES = 600 * 1024;

const jobs = [
  // heroes
  ...[
    "adforce-billing",
    "adforce-builders",
    "adforce-solutions",
    "appealmate",
    "daichi",
    "vyva-nutrition",
  ].flatMap((slug) => [
    {
      in: `${slug}-hero.png`,
      out: path.join(projectsDir, `${slug}-hero.webp`),
      width: 1600,
      quality: 80,
      kind: "hero",
    },
    {
      in: `${slug}-desk.png`,
      out: path.join(projectsDir, `${slug}-desk.webp`),
      width: 1440,
      quality: 75,
      kind: "desk",
    },
    {
      in: `${slug}-mobile.png`,
      out: path.join(projectsDir, `${slug}-mobile.webp`),
      width: 780,
      quality: 78,
      kind: "mobile",
    },
  ]),
  {
    in: "portrait-1.jpg",
    out: path.join(imagesDir, "portrait-1.webp"),
    width: 1400,
    quality: 80,
    kind: "portrait",
    alsoJpg: path.join(imagesDir, "portrait-1.jpg"),
  },
  {
    in: "about-2.png",
    out: path.join(imagesDir, "about-2.webp"),
    width: 1400,
    quality: 80,
    kind: "portrait",
    alsoJpg: path.join(imagesDir, "about-2.jpg"),
  },
];

async function ensureDirs() {
  await fs.mkdir(projectsDir, { recursive: true });
  await fs.mkdir(imagesDir, { recursive: true });
}

async function writeUnderBudget(pipelineFactory, outPath, startQuality) {
  let quality = startQuality;
  let lastBuf = null;
  while (quality >= 40) {
    const buf = await pipelineFactory(quality).toBuffer();
    lastBuf = buf;
    if (buf.length <= MAX_BYTES) {
      await fs.writeFile(outPath, buf);
      return { bytes: buf.length, quality };
    }
    quality -= 5;
  }
  await fs.writeFile(outPath, lastBuf);
  return { bytes: lastBuf.length, quality: quality + 5 };
}

function kb(n) {
  return (n / 1024).toFixed(1) + " KB";
}

async function processJob(job) {
  const input = path.join(rawDir, job.in);
  try {
    await fs.access(input);
  } catch {
    console.warn("SKIP missing:", job.in);
    return null;
  }

  const meta = await sharp(input).metadata();
  const WEBP_MAX = 16000;
  let width = job.width;
  if (meta.width && meta.height) {
    const scale = width / meta.width;
    const projectedH = Math.round(meta.height * Math.min(scale, 1));
    if (projectedH > WEBP_MAX) {
      width = Math.floor((meta.width * WEBP_MAX) / meta.height);
    }
  }

  const resize = {
    width,
    withoutEnlargement: true,
  };

  const webpResult = await writeUnderBudget(
    (q) =>
      sharp(input)
        .rotate()
        .resize(resize)
        .webp({ quality: q, effort: 4 }),
    job.out,
    job.quality
  );

  let jpgResult = null;
  if (job.alsoJpg) {
    jpgResult = await writeUnderBudget(
      (q) =>
        sharp(input)
          .rotate()
          .resize(resize)
          .jpeg({ quality: q, mozjpeg: true }),
      job.alsoJpg,
      Math.min(job.quality, 82)
    );
  }

  const outMeta = await sharp(job.out).metadata();
  return {
    file: path.relative(root, job.out).replace(/\\/g, "/"),
    kind: job.kind,
    src: `${meta.width}x${meta.height}`,
    out: `${outMeta.width}x${outMeta.height}`,
    size: kb(webpResult.bytes),
    bytes: webpResult.bytes,
    quality: webpResult.quality,
    jpg: jpgResult
      ? {
          file: path.relative(root, job.alsoJpg).replace(/\\/g, "/"),
          size: kb(jpgResult.bytes),
          quality: jpgResult.quality,
        }
      : null,
  };
}

await ensureDirs();
const results = [];
for (const job of jobs) {
  const r = await processJob(job);
  if (r) {
    results.push(r);
    const flag = r.bytes > MAX_BYTES ? " ⚠ OVER 600KB" : "";
    console.log(
      `${r.file}  ${r.out}  q=${r.quality}  ${r.size}${flag}` +
        (r.jpg ? ` | ${r.jpg.file} q=${r.jpg.quality} ${r.jpg.size}` : "")
    );
  }
}

console.log("\n--- summary ---");
console.log(`optimized ${results.length} outputs`);
const overs = results.filter((r) => r.bytes > MAX_BYTES);
if (overs.length) {
  console.log("still over 600KB:", overs.map((r) => r.file).join(", "));
  process.exitCode = 1;
}
