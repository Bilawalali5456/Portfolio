/**
 * Wire optimized image paths into HTML. Run after optimize-images.mjs
 */
import fs from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");

const projects = [
  { slug: "vyva-nutrition", name: "Vyva Nutrition", platform: "Shopify" },
  { slug: "adforce-builders", name: "Adforce Builders", platform: "WordPress" },
  { slug: "daichi", name: "Daichi", platform: "WooCommerce" },
  { slug: "appealmate", name: "AppealMate", platform: "WordPress" },
  { slug: "adforce-solutions", name: "Adforce Solutions", platform: "WordPress" },
  { slug: "adforce-billing", name: "Adforce Billing", platform: "WordPress" },
];

function heroAlt(p) {
  return `${p.name} ${p.platform} website by Bilawal Ali`;
}
function mobileAlt(p) {
  return `${p.name} mobile view by Bilawal Ali`;
}
function deskAlt(p) {
  return `${p.name} full page by Bilawal Ali`;
}

function picture(srcWebp, srcJpg, alt, { w, h, loading = "lazy", className = "", style = "", fetchpriority = "" } = {}) {
  const cls = className ? ` class="${className}"` : "";
  const st = style ? ` style="${style}"` : "";
  const fp = fetchpriority ? ` fetchpriority="${fetchpriority}"` : "";
  const jpg = srcJpg
    ? `<source srcset="${srcWebp}" type="image/webp">
          <img src="${srcJpg}" alt="${alt}" width="${w}" height="${h}" loading="${loading}" decoding="async"${cls}${st}${fp}>`
    : `<img src="${srcWebp}" alt="${alt}" width="${w}" height="${h}" loading="${loading}" decoding="async"${cls}${st}${fp}>`;
  return srcJpg
    ? `<picture>
          <source srcset="${srcWebp}" type="image/webp">
          <img src="${srcJpg}" alt="${alt}" width="${w}" height="${h}" loading="${loading}" decoding="async"${cls}${st}${fp}>
        </picture>`
    : `<img src="${srcWebp}" alt="${alt}" width="${w}" height="${h}" loading="${loading}" decoding="async"${cls}${st}${fp}>`;
}

function fullPageBlock(p, prefix = "../") {
  const desk = `${prefix}assets/projects/${p.slug}-desk.webp`;
  const mobile = `${prefix}assets/projects/${p.slug}-mobile.webp`;
  return `
      <section class="case-study__fullpage" aria-labelledby="fullpage-heading">
        <h2 class="case-study__heading" id="fullpage-heading">Full page</h2>
        <div class="case-study__frames">
          <div class="browser-frame" tabindex="0">
            <div class="browser-frame__bar" aria-hidden="true">
              <span></span><span></span><span></span>
            </div>
            <div class="browser-frame__viewport js-hover-scroll">
              <img
                src="${desk}"
                alt="${deskAlt(p)}"
                width="1440"
                height="2400"
                loading="lazy"
                decoding="async"
                class="js-hover-scroll__img"
              >
            </div>
          </div>
          <div class="phone-frame" tabindex="0">
            <div class="phone-frame__viewport js-hover-scroll">
              <img
                src="${mobile}"
                alt="${mobileAlt(p)}"
                width="780"
                height="1600"
                loading="lazy"
                decoding="async"
                class="js-hover-scroll__img"
                style="object-position: top"
              >
            </div>
          </div>
        </div>
      </section>`;
}

let index = await fs.readFile(path.join(root, "index.html"), "utf8");

// Favicon: drop photo png
index = index.replace(
  /  <link rel="icon" href="assets\/images\/favicon\.png" type="image\/png">\r?\n/,
  ""
);

// Hero bg
index = index.replace(
  /<div class="hero__bg" aria-hidden="true">[\s\S]*?<\/div>\s*<div class="hero__bg-overlay"><\/div>\s*<\/div>/,
  `<div class="hero__bg" aria-hidden="true">
        <picture>
          <source srcset="assets/images/portrait-1.webp" type="image/webp">
          <img
            src="assets/images/portrait-1.jpg"
            alt=""
            class="hero__bg-img"
            width="1400"
            height="1867"
            loading="eager"
            fetchpriority="high"
            decoding="async"
          >
        </picture>
        <div class="hero__bg-overlay"></div>
      </div>`
);

// What I do flies — 6 heroes
const flyOrder = [
  "vyva-nutrition",
  "adforce-builders",
  "daichi",
  "appealmate",
  "adforce-solutions",
  "adforce-billing",
];
const flyHtml = flyOrder
  .map((slug, i) => {
    const p = projects.find((x) => x.slug === slug);
    const cols = ["left", "center", "right", "left", "center", "right"];
    const speeds = ["1", "1.25", "0.85", "1", "1.25", "0.85"];
    const rots = ["-2", "1.5", "-1", "2", "-1.5", "1"];
    const offset = i >= 3 ? ' data-offset="1"' : "";
    return `          <figure class="whatido__fly whatido__fly--${i + 1}" data-col="${cols[i]}" data-speed="${speeds[i]}" data-rot="${rots[i]}"${offset}>
            <img src="assets/projects/${slug}-hero.webp" alt="${heroAlt(p)}" width="1600" height="960" loading="lazy" decoding="async">
          </figure>`;
  })
  .join("\n");

index = index.replace(
  /<div class="whatido__flies" aria-hidden="true">[\s\S]*?<\/div>\n\n      <ul class="whatido__grid"/,
  `<div class="whatido__flies" aria-hidden="true">\n${flyHtml}\n        </div>\n\n      <ul class="whatido__grid"`
);

// What I do grid
const gridHtml = flyOrder
  .map((slug) => {
    const p = projects.find((x) => x.slug === slug);
    const mod =
      slug === "vyva-nutrition"
        ? "vyva"
        : slug === "adforce-builders"
          ? "builders"
          : slug === "adforce-solutions"
            ? "solutions"
            : slug === "adforce-billing"
              ? "billing"
              : slug;
    return `        <li>
          <figure class="whatido__grid-card whatido__grid-card--${mod}">
            <img src="assets/projects/${slug}-hero.webp" alt="${heroAlt(p)}" width="1600" height="960" loading="lazy" decoding="async">
            <span class="project-media__label" aria-hidden="true">
              <span class="project-media__name">${p.name}</span>
              <span class="project-media__platform">${p.platform}</span>
            </span>
          </figure>
        </li>`;
  })
  .join("\n");

index = index.replace(
  /<ul class="whatido__grid" role="list">[\s\S]*?<\/ul>\n    <\/section>/,
  `<ul class="whatido__grid" role="list">\n${gridHtml}\n      </ul>\n    </section>`
);

// Featured work rows — first 4
const featured = [
  "vyva-nutrition",
  "adforce-builders",
  "daichi",
  "appealmate",
];
for (const slug of featured) {
  const p = projects.find((x) => x.slug === slug);
  // main img
  index = index.replace(
    new RegExp(
      `src="assets/project[^"]+"\\s*\\n\\s*alt="[^"]*"\\s*\\n\\s*class="work-row__img"`
    ),
    `src="assets/projects/${slug}-hero.webp"\n                alt="${heroAlt(p)}"\n                class="work-row__img"`
  );
}

// More precise featured replacements by row id
const featuredMeta = {
  "work-row-1": "vyva-nutrition",
  "work-row-2": "adforce-builders",
  "work-row-3": "daichi",
  "work-row-4": "appealmate",
};

for (const [rowId, slug] of Object.entries(featuredMeta)) {
  const p = projects.find((x) => x.slug === slug);
  const rowRe = new RegExp(
    `(<article class="work-row" id="${rowId}">[\\s\\S]*?<img\\s+class="work-row__img"[\\s\\S]*?src=")[^"]+("[\\s\\S]*?alt=")[^"]+(")`,
    "m"
  );
  // simpler: replace within each article block
  const articleRe = new RegExp(
    `<article class="work-row" id="${rowId}">[\\s\\S]*?</article>`
  );
  index = index.replace(articleRe, (block) => {
    block = block.replace(
      /src="assets\/project[^"]+"(\s|\n)+alt="[^"]*"(\s|\n)+class="work-row__img"/,
      `src="assets/projects/${slug}-hero.webp"\n                alt="${heroAlt(p)}"\n                class="work-row__img"`
    );
    block = block.replace(
      /class="work-row__img"\s*\n\s*src="[^"]+"\s*\n\s*alt="[^"]+"/,
      `class="work-row__img"\n                src="assets/projects/${slug}-hero.webp"\n                alt="${heroAlt(p)}"`
    );
    block = block.replace(
      /class="work-row__detail-img"[\s\S]*?src="[^"]+"[\s\S]*?data-fallback="[^"]+"/,
      `class="work-row__detail-img"\n                src="assets/projects/${slug}-mobile.webp"\n                data-fallback="assets/projects/${slug}-hero.webp"`
    );
    // alt on detail
    block = block.replace(
      /(class="work-row__detail-img"[\s\S]*?alt=")[^"]*(")/,
      `$1${mobileAlt(p)}$2`
    );
    return block;
  });
}

// Results thumbs
index = index.replace(
  /(<article class="results-card" data-type="result" data-rot="-2">[\s\S]*?<img class="results-card__thumb" src=")[^"]+/,
  `$1assets/projects/vyva-nutrition-hero.webp`
);
index = index.replace(
  /(<article class="results-card" data-type="result" data-rot="1\.5">[\s\S]*?<img class="results-card__thumb" src=")[^"]+/,
  `$1assets/projects/adforce-builders-hero.webp`
);
index = index.replace(
  /(<article class="results-card" data-type="result" data-rot="-1">[\s\S]*?<img class="results-card__thumb" src=")[^"]+/,
  `$1assets/projects/appealmate-hero.webp`
);

// About photos
index = index.replace(
  /src="assets\/images\/about-1\.jpg"\s*\n\s*data-fallback="assets\/images\/1\.JPG"/,
  `src="assets/images/portrait-1.webp"\n              data-fallback="assets/images/portrait-1.jpg"`
);
index = index.replace(
  /src="assets\/images\/about-2\.jpg"\s*\n\s*data-fallback="assets\/images\/1\.JPG"/,
  `src="assets/images/about-2.webp"\n              data-fallback="assets/images/about-2.jpg"`
);

// CTA scatter: 6 heroes + 6 mobiles
const ctaHero = flyOrder.map((slug, i) => {
  const styles = [
    "--x:8%;--y:12%;--w:280px;--h:170px;--op:top left",
    "--x:62%;--y:8%;--w:320px;--h:200px;--op:center",
    "--x:78%;--y:38%;--w:240px;--h:150px;--op:top",
    "--x:12%;--y:48%;--w:300px;--h:190px;--op:bottom",
    "--x:48%;--y:58%;--w:260px;--h:160px;--op:left",
    "--x:70%;--y:72%;--w:340px;--h:210px;--op:right",
  ];
  const speeds = ["0.6", "1.2", "0.9", "1.4", "0.7", "1.1"];
  return `        <img class="cta__shot" src="assets/projects/${slug}-hero.webp" alt="" data-speed="${speeds[i]}" style="${styles[i]}" width="1600" height="960" loading="lazy" decoding="async">`;
});
const ctaMobile = flyOrder.map((slug, i) => {
  const styles = [
    "--x:28%;--y:18%;--w:250px;--h:155px;--op:top",
    "--x:5%;--y:70%;--w:290px;--h:180px;--op:top",
    "--x:55%;--y:30%;--w:360px;--h:230px;--op:top",
    "--x:85%;--y:18%;--w:255px;--h:160px;--op:top",
    "--x:35%;--y:75%;--w:310px;--h:195px;--op:top",
    "--x:18%;--y:32%;--w:270px;--h:165px;--op:top",
  ];
  const speeds = ["1.5", "0.5", "1.3", "0.8", "1.6", "1.0"];
  return `        <img class="cta__shot cta__shot--extra" src="assets/projects/${slug}-mobile.webp" alt="" data-speed="${speeds[i]}" style="${styles[i]};object-position:top" width="780" height="1600" loading="lazy" decoding="async">`;
});

index = index.replace(
  /<div class="cta__scatter" aria-hidden="true">[\s\S]*?<\/div>\n\n      <div class="cta__content">/,
  `<div class="cta__scatter" aria-hidden="true">\n${[...ctaHero, ...ctaMobile].join("\n")}\n      </div>\n\n      <div class="cta__content">`
);

// JSON-LD image path
index = index.replace(
  "assets/images/1.JPG",
  "assets/images/portrait-1.jpg"
);

await fs.writeFile(path.join(root, "index.html"), index);
console.log("updated index.html");

// work/index.html
let workIndex = await fs.readFile(path.join(root, "work", "index.html"), "utf8");
workIndex = workIndex.replace(
  /  <link rel="icon" href="\.\.\/assets\/images\/favicon\.png" type="image\/png">\r?\n/,
  ""
);
for (const p of projects) {
  const oldPatterns = [
    "../assets/project-7.jpg",
    "../assets/project-adforce-builders.jpg",
    "../assets/project-3.jpg",
    "../assets/project-4.jpg",
    "../assets/project-1.jpg",
    "../assets/project-2.jpg",
  ];
}
// Replace each card image by matching alt/name context
for (const p of projects) {
  const re = new RegExp(
    `(${p.name.replace(/[.*+?^${}()|[\]\\]/g, "\\$&")}[\\s\\S]{0,400}?<img src=")[^"]+(" alt=")${heroAlt(p).replace(/[.*+?^${}()|[\]\\]/g, "\\$&")}`,
    "i"
  );
  // fallback simpler: replace known old paths mapped
}

const pathMap = {
  "../assets/project-7.jpg": "../assets/projects/vyva-nutrition-hero.webp",
  "../assets/project-adforce-builders.jpg": "../assets/projects/adforce-builders-hero.webp",
  "../assets/project-3.jpg": "../assets/projects/daichi-hero.webp",
  "../assets/project-4.jpg": "../assets/projects/appealmate-hero.webp",
  "../assets/project-1.jpg": "../assets/projects/adforce-solutions-hero.webp",
  "../assets/project-2.jpg": "../assets/projects/adforce-billing-hero.webp",
};
for (const [from, to] of Object.entries(pathMap)) {
  workIndex = workIndex.split(from).join(to);
}
await fs.writeFile(path.join(root, "work", "index.html"), workIndex);
console.log("updated work/index.html");

// Case study pages
const caseFiles = {
  "vyva-nutrition.html": "vyva-nutrition",
  "adforce-builders.html": "adforce-builders",
  "daichi.html": "daichi",
  "appealmate.html": "appealmate",
  "adforce-solutions.html": "adforce-solutions",
  "adforce-billing.html": "adforce-billing",
};

for (const [file, slug] of Object.entries(caseFiles)) {
  const p = projects.find((x) => x.slug === slug);
  let html = await fs.readFile(path.join(root, "work", file), "utf8");
  html = html.replace(
    /  <link rel="icon" href="\.\.\/assets\/images\/favicon\.png" type="image\/png">\r?\n/,
    ""
  );

  // Replace top media image
  html = html.replace(
    /<figure class="case-study__media[\s\S]*?<\/figure>/,
    `<figure class="case-study__media" data-reveal data-reveal-delay="0.1">
        <img
          src="../assets/projects/${slug}-hero.webp"
          alt="${heroAlt(p)}"
          class="case-study__img"
          width="1600"
          height="960"
          loading="eager"
          decoding="async"
        >
      </figure>`
  );

  // Insert full page block before body or after hero media
  if (!html.includes("case-study__fullpage")) {
    html = html.replace(
      /<\/figure>\s*\n\s*<div class="case-study__body">/,
      `</figure>\n\n${fullPageBlock(p)}\n\n      <div class="case-study__body">`
    );
  }

  await fs.writeFile(path.join(root, "work", file), html);
  console.log("updated work/" + file);
}

console.log("done");
