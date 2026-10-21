import sharp from "sharp";
import path from "path";
import { fileURLToPath } from "url";
import fs from "fs";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const outDir = path.join(__dirname, "..", "assets", "projects");
fs.mkdirSync(outDir, { recursive: true });

const projects = [
  {
    slug: "kynetix",
    name: "Kynetix",
    sub: "Next.js · GSAP",
    bg: "#0b0b0f",
    accent: "#cfc4aa",
  },
  {
    slug: "adforce-hrms",
    name: "Adforce HRMS",
    sub: "React · Node · PostgreSQL",
    bg: "#101820",
    accent: "#5b8cff",
  },
];

function svgCard(w, h, { name, sub, bg, accent }) {
  const titleSize = Math.round(w * 0.08);
  const subSize = Math.round(w * 0.035);
  return Buffer.from(`<?xml version="1.0" encoding="UTF-8"?>
<svg xmlns="http://www.w3.org/2000/svg" width="${w}" height="${h}" viewBox="0 0 ${w} ${h}">
  <defs>
    <linearGradient id="g" x1="0" y1="0" x2="1" y2="1">
      <stop offset="0%" stop-color="${bg}"/>
      <stop offset="100%" stop-color="${accent}" stop-opacity="0.35"/>
    </linearGradient>
  </defs>
  <rect width="${w}" height="${h}" fill="url(#g)"/>
  <rect x="${w * 0.08}" y="${h * 0.72}" width="${w * 0.84}" height="2" fill="${accent}" opacity="0.5"/>
  <text x="${w * 0.08}" y="${h * 0.82}" fill="${accent}" font-family="Arial, sans-serif" font-size="${titleSize}" font-weight="700">${name}</text>
  <text x="${w * 0.08}" y="${h * 0.9}" fill="${accent}" font-family="Arial, sans-serif" font-size="${subSize}" opacity="0.75">${sub}</text>
</svg>`);
}

async function writeSet(project) {
  const square = await sharp(svgCard(1200, 1200, project)).webp({ quality: 82 }).toBuffer();
  const cover = await sharp(svgCard(1600, 1200, project)).webp({ quality: 82 }).toBuffer();
  const detail = await sharp(svgCard(600, 600, project)).webp({ quality: 82 }).toBuffer();
  const desk = await sharp(svgCard(1440, 3200, project)).webp({ quality: 80 }).toBuffer();
  const mobile = await sharp(svgCard(390, 2800, project)).webp({ quality: 80 }).toBuffer();

  await fs.promises.writeFile(path.join(outDir, `${project.slug}-square.webp`), square);
  await fs.promises.writeFile(path.join(outDir, `${project.slug}-cover.webp`), cover);
  await fs.promises.writeFile(path.join(outDir, `${project.slug}-detail.webp`), detail);
  await fs.promises.writeFile(path.join(outDir, `${project.slug}-desk.webp`), desk);
  await fs.promises.writeFile(path.join(outDir, `${project.slug}-mobile.webp`), mobile);
  console.log("wrote", project.slug);
}

for (const p of projects) await writeSet(p);
console.log("done");
