import type { BrandThemePalette } from "@/lib/brand-theme";

type Rgb = { r: number; g: number; b: number };

function clamp(value: number, min: number, max: number): number {
  return Math.min(max, Math.max(min, value));
}

function rgbToHsl({ r, g, b }: Rgb): { h: number; s: number; l: number } {
  const rn = r / 255;
  const gn = g / 255;
  const bn = b / 255;
  const max = Math.max(rn, gn, bn);
  const min = Math.min(rn, gn, bn);
  const delta = max - min;
  let h = 0;
  let s = 0;
  const l = (max + min) / 2;

  if (delta !== 0) {
    s = delta / (1 - Math.abs(2 * l - 1));
    switch (max) {
      case rn:
        h = ((gn - bn) / delta) % 6;
        break;
      case gn:
        h = (bn - rn) / delta + 2;
        break;
      default:
        h = (rn - gn) / delta + 4;
        break;
    }
    h *= 60;
    if (h < 0) {
      h += 360;
    }
  }

  return { h, s: s * 100, l: l * 100 };
}

function hslToCss(h: number, s: number, l: number): string {
  return `${Math.round(h)} ${Math.round(s)}% ${Math.round(l)}%`;
}

function isNeutralPixel({ r, g, b }: Rgb, alpha: number): boolean {
  if (alpha < 0.2) {
    return true;
  }

  const max = Math.max(r, g, b);
  const min = Math.min(r, g, b);
  const saturation = max === 0 ? 0 : (max - min) / max;

  if (max > 245 && min > 235) {
    return true;
  }

  if (max < 25 && min < 15) {
    return true;
  }

  return saturation < 0.12;
}

function loadImageSource(
  source: File | string,
): Promise<HTMLImageElement> {
  return new Promise((resolve, reject) => {
    const image = new Image();
    image.crossOrigin = "anonymous";

    const objectUrl =
      typeof source === "string" ? null : URL.createObjectURL(source);

    image.onload = () => {
      if (objectUrl) {
        URL.revokeObjectURL(objectUrl);
      }
      resolve(image);
    };

    image.onerror = () => {
      if (objectUrl) {
        URL.revokeObjectURL(objectUrl);
      }
      reject(new Error("Não foi possível carregar a imagem da logo."));
    };

    image.src = typeof source === "string" ? source : objectUrl!;
  });
}

function extractDominantHue(image: HTMLImageElement): { h: number; s: number } {
  const canvas = document.createElement("canvas");
  const size = 64;
  canvas.width = size;
  canvas.height = size;

  const context = canvas.getContext("2d", { willReadFrequently: true });
  if (!context) {
    throw new Error("Canvas indisponível para extrair cores da logo.");
  }

  context.drawImage(image, 0, 0, size, size);
  const { data } = context.getImageData(0, 0, size, size);

  const buckets = new Map<number, { weight: number; saturation: number }>();

  for (let index = 0; index < data.length; index += 4) {
    const rgb: Rgb = {
      r: data[index]!,
      g: data[index + 1]!,
      b: data[index + 2]!,
    };
    const alpha = data[index + 3]! / 255;

    if (isNeutralPixel(rgb, alpha)) {
      continue;
    }

    const { h, s } = rgbToHsl(rgb);
    const bucket = Math.round(h / 10) * 10;
    const current = buckets.get(bucket) ?? { weight: 0, saturation: 0 };
    current.weight += 1;
    current.saturation += s;
    buckets.set(bucket, current);
  }

  if (buckets.size === 0) {
    return { h: 217, s: 91 };
  }

  let bestBucket = 217;
  let bestWeight = 0;
  let bestSaturation = 0;

  for (const [bucket, stats] of buckets.entries()) {
    if (stats.weight > bestWeight) {
      bestWeight = stats.weight;
      bestBucket = bucket;
      bestSaturation = stats.saturation / stats.weight;
    }
  }

  return {
    h: bestBucket,
    s: clamp(bestSaturation, 35, 92),
  };
}

function buildPaletteFromHue(h: number, s: number): BrandThemePalette {
  const lightPrimary = hslToCss(h, clamp(s * 0.55, 30, 55), 30);
  const darkPrimary = hslToCss(h, clamp(s, 45, 92), 55);
  const lightForeground = "0 0% 100%";
  const darkForeground = "0 0% 100%";

  return {
    light: {
      primary: lightPrimary,
      primaryForeground: lightForeground,
      ring: lightPrimary,
    },
    dark: {
      primary: darkPrimary,
      primaryForeground: darkForeground,
      ring: darkPrimary,
    },
  };
}

export async function extractPaletteFromImage(
  source: File | string,
): Promise<BrandThemePalette> {
  const image = await loadImageSource(source);
  const { h, s } = extractDominantHue(image);
  return buildPaletteFromHue(h, s);
}
