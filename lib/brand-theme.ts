export type BrandThemeModeTokens = {
  primary: string;
  primaryForeground: string;
  ring: string;
  accent: string;
  accentForeground: string;
  brandSurface: string;
  brandSurfaceForeground: string;
  chart1: string;
};

export type BrandThemePalette = {
  light: BrandThemeModeTokens;
  dark: BrandThemeModeTokens;
};

export const BRAND_THEME_CSS_VARS = [
  "--primary",
  "--primary-foreground",
  "--ring",
  "--accent",
  "--accent-foreground",
  "--brand-surface",
  "--brand-surface-foreground",
  "--chart-1",
] as const;

const LEGACY_TOKEN_KEYS = ["primary", "primaryForeground", "ring"] as const;

export function isBrandThemePalette(value: unknown): value is BrandThemePalette {
  if (!value || typeof value !== "object") {
    return false;
  }

  const palette = value as BrandThemePalette;
  return (["light", "dark"] as const).every((mode) => {
    const tokens = palette[mode];
    if (!tokens || typeof tokens !== "object") {
      return false;
    }

    return LEGACY_TOKEN_KEYS.every(
      (key) => typeof tokens[key] === "string" && tokens[key].length > 0,
    );
  });
}

function parseHslToken(token: string): { h: number; s: number; l: number } | null {
  const match = token.match(
    /^(\d+(?:\.\d+)?)\s+(\d+(?:\.\d+)?)%\s+(\d+(?:\.\d+)?)%$/,
  );
  if (!match) {
    return null;
  }

  return {
    h: Number(match[1]),
    s: Number(match[2]),
    l: Number(match[3]),
  };
}

function hslToCss(h: number, s: number, l: number): string {
  return `${Math.round(h)} ${Math.round(s)}% ${Math.round(l)}%`;
}

function expandLegacyTokens(
  tokens: Pick<BrandThemeModeTokens, "primary" | "primaryForeground" | "ring">,
  mode: "light" | "dark",
): BrandThemeModeTokens {
  const parsed = parseHslToken(tokens.primary) ?? { h: 217, s: 91, l: 55 };
  const isLight = mode === "light";

  return {
    ...tokens,
    accent: hslToCss(
      parsed.h,
      Math.min(parsed.s * 0.45, 55),
      isLight ? 95 : 18,
    ),
    accentForeground: tokens.primary,
    brandSurface: hslToCss(
      parsed.h,
      Math.min(parsed.s * 0.55, 70),
      isLight ? 94 : 20,
    ),
    brandSurfaceForeground: tokens.primary,
    chart1: hslToCss(
      parsed.h,
      Math.min(parsed.s, 85),
      isLight ? 50 : 60,
    ),
  };
}

export function normalizeBrandThemePalette(
  palette: BrandThemePalette,
): BrandThemePalette {
  return {
    light: expandLegacyTokens(palette.light, "light"),
    dark: expandLegacyTokens(palette.dark, "dark"),
  };
}

export function applyBrandTheme(
  palette: BrandThemePalette | null,
  mode: "light" | "dark",
): void {
  const root = document.documentElement;

  if (!palette) {
    for (const cssVar of BRAND_THEME_CSS_VARS) {
      root.style.removeProperty(cssVar);
    }
    root.removeAttribute("data-brand-theme");
    return;
  }

  const tokens = normalizeBrandThemePalette(palette)[mode];
  root.style.setProperty("--primary", tokens.primary);
  root.style.setProperty("--primary-foreground", tokens.primaryForeground);
  root.style.setProperty("--ring", tokens.ring);
  root.style.setProperty("--accent", tokens.accent);
  root.style.setProperty("--accent-foreground", tokens.accentForeground);
  root.style.setProperty("--brand-surface", tokens.brandSurface);
  root.style.setProperty(
    "--brand-surface-foreground",
    tokens.brandSurfaceForeground,
  );
  root.style.setProperty("--chart-1", tokens.chart1);
  root.setAttribute("data-brand-theme", "active");
}

export const BRAND_THEME_UPDATED_EVENT = "brand-theme-updated";

export function notifyBrandThemeUpdated(palette: BrandThemePalette | null): void {
  window.dispatchEvent(
    new CustomEvent<BrandThemePalette | null>(BRAND_THEME_UPDATED_EVENT, {
      detail: palette,
    }),
  );
}
