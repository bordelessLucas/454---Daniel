export type BrandThemeModeTokens = {
  primary: string;
  primaryForeground: string;
  ring: string;
};

export type BrandThemePalette = {
  light: BrandThemeModeTokens;
  dark: BrandThemeModeTokens;
};

export const BRAND_THEME_CSS_VARS = [
  "--primary",
  "--primary-foreground",
  "--ring",
] as const;

export function isBrandThemePalette(value: unknown): value is BrandThemePalette {
  if (!value || typeof value !== "object") {
    return false;
  }

  const palette = value as BrandThemePalette;
  return (["light", "dark"] as const).every((mode) => {
    const tokens = palette[mode];
    return (
      tokens &&
      typeof tokens.primary === "string" &&
      typeof tokens.primaryForeground === "string" &&
      typeof tokens.ring === "string"
    );
  });
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
    return;
  }

  const tokens = palette[mode];
  root.style.setProperty("--primary", tokens.primary);
  root.style.setProperty("--primary-foreground", tokens.primaryForeground);
  root.style.setProperty("--ring", tokens.ring);
}

export const BRAND_THEME_UPDATED_EVENT = "brand-theme-updated";

export function notifyBrandThemeUpdated(palette: BrandThemePalette | null): void {
  window.dispatchEvent(
    new CustomEvent<BrandThemePalette | null>(BRAND_THEME_UPDATED_EVENT, {
      detail: palette,
    }),
  );
}
