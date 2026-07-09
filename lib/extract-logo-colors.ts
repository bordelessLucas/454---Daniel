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

  return saturation < 0.1;
}

function loadImageSource(source: File | string): Promise<HTMLImageElement> {
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
  const size = 72;
  canvas.width = size;
  canvas.height = size;

  const context = canvas.getContext("2d", { willReadFrequently: true });
  if (!context) {
    throw new Error("Canvas indisponível para extrair cores da logo.");
  }

  context.drawImage(image, 0, 0, size, size);
  const { data } = context.getImageData(0, 0, size, size);

  const buckets = new Map<
    number,
    { weight: number; saturation: number; lightness: number }
  >();

  for (let y = 0; y < size; y += 1) {
    for (let x = 0; x < size; x += 1) {
      const index = (y * size + x) * 4;
      const rgb: Rgb = {
        r: data[index]!,
        g: data[index + 1]!,
        b: data[index + 2]!,
      };
      const alpha = data[index + 3]! / 255;

      if (isNeutralPixel(rgb, alpha)) {
        continue;
      }

      const { h, s, l } = rgbToHsl(rgb);
      const bucket = Math.round(h / 8) * 8;
      const centerBoost =
        1 + (1 - Math.hypot(x - size / 2, y - size / 2) / (size * 0.7)) * 0.8;
      const vividBoost = 1 + (s / 100) * 0.75;
      const weight = centerBoost * vividBoost;

      const current = buckets.get(bucket) ?? {
        weight: 0,
        saturation: 0,
        lightness: 0,
      };
      current.weight += weight;
      current.saturation += s * weight;
      current.lightness += l * weight;
      buckets.set(bucket, current);
    }
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
    s: clamp(bestSaturation, 45, 96),
  };
}

function buildPaletteFromHue(h: number, s: number): BrandThemePalette {
  const lightPrimary = hslToCss(h, clamp(s * 0.9, 55, 92), 46);
  const darkPrimary = hslToCss(h, clamp(s, 60, 96), 62);
  const foreground = "0 0% 100%";

  const buildMode = (primary: string, mode: "light" | "dark") => {
    const isLight = mode === "light";
    return {
      primary,
      primaryForeground: foreground,
      ring: primary,
      accent: hslToCss(h, clamp(s * 0.45, 35, 70), isLight ? 95 : 18),
      accentForeground: primary,
      brandSurface: hslToCss(h, clamp(s * 0.55, 40, 78), isLight ? 94 : 20),
      brandSurfaceForeground: primary,
      chart1: hslToCss(h, clamp(s, 55, 90), isLight ? 50 : 60),
    };
  };

  return {
    light: buildMode(lightPrimary, "light"),
    dark: buildMode(darkPrimary, "dark"),
  };
}

export async function extractPaletteFromImage(
  source: File | string,
): Promise<BrandThemePalette> {
  const image = await loadImageSource(source);
  const { h, s } = extractDominantHue(image);
  return buildPaletteFromHue(h, s);
}
