import fs from "node:fs";
import path from "node:path";
import sharp from "sharp";

const src = "public/LogoIcon.png";
const out = "public/icons";

fs.mkdirSync(out, { recursive: true });

const meta = await sharp(src).metadata();
console.log(`source: ${meta.width}x${meta.height}`);

for (const size of [192, 512]) {
  await sharp(src)
    .resize(size, size, {
      fit: "contain",
      background: { r: 255, g: 255, b: 255, alpha: 1 },
    })
    .png()
    .toFile(path.join(out, `icon-${size}x${size}.png`));

  const pad = Math.round(size * 0.12);
  const inner = size - pad * 2;

  await sharp(src)
    .resize(inner, inner, {
      fit: "contain",
      background: { r: 255, g: 255, b: 255, alpha: 0 },
    })
    .extend({
      top: pad,
      bottom: pad,
      left: pad,
      right: pad,
      background: { r: 255, g: 255, b: 255, alpha: 1 },
    })
    .png()
    .toFile(path.join(out, `maskable-${size}x${size}.png`));
}

await sharp(src)
  .resize(180, 180, {
    fit: "contain",
    background: { r: 255, g: 255, b: 255, alpha: 1 },
  })
  .png()
  .toFile(path.join(out, "apple-touch-icon.png"));

console.log("PWA icons generated in public/icons");
