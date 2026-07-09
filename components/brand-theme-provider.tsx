import { useCallback, useEffect, useState } from "react";
import { useTheme } from "next-themes";
import { useAuth } from "@/lib/auth-context";
import {
  applyBrandTheme,
  BRAND_THEME_UPDATED_EVENT,
  isBrandThemePalette,
  type BrandThemePalette,
} from "@/lib/brand-theme";
import { extractPaletteFromImage } from "@/lib/extract-logo-colors";
import { hasConfiguredLogo, resolveLogoDisplaySrc } from "@/lib/configuracao-logo";
import { getConfiguracoesPdf } from "@/lib/configuracoes-service";

export function BrandThemeProvider({ children }: { children: React.ReactNode }) {
  const { user } = useAuth();
  const { resolvedTheme } = useTheme();
  const [palette, setPalette] = useState<BrandThemePalette | null>(null);

  const applyForCurrentTheme = useCallback(
    (nextPalette: BrandThemePalette | null) => {
      const mode = resolvedTheme === "light" ? "light" : "dark";
      applyBrandTheme(nextPalette, mode);
    },
    [resolvedTheme],
  );

  const loadBrandTheme = useCallback(async () => {
    if (!user) {
      setPalette(null);
      applyBrandTheme(null, resolvedTheme === "light" ? "light" : "dark");
      return;
    }

    try {
      const config = await getConfiguracoesPdf();

      if (hasConfiguredLogo(config)) {
        const logoSrc = resolveLogoDisplaySrc(config);
        const derived = await extractPaletteFromImage(logoSrc);
        setPalette(derived);
        return;
      }

      if (isBrandThemePalette(config.themePalette)) {
        setPalette(config.themePalette);
        return;
      }

      setPalette(null);
    } catch (error) {
      if (import.meta.env.DEV) {
        console.warn("[BrandThemeProvider] Falha ao carregar tema da marca:", error);
      }
      setPalette(null);
    }
  }, [resolvedTheme, user]);

  useEffect(() => {
    void loadBrandTheme();
  }, [loadBrandTheme]);

  useEffect(() => {
    applyForCurrentTheme(palette);
  }, [applyForCurrentTheme, palette]);

  useEffect(() => {
    const onThemeUpdated = (event: Event) => {
      const detail = (event as CustomEvent<BrandThemePalette | null>).detail;
      if (detail === undefined) {
        void loadBrandTheme();
        return;
      }
      setPalette(detail);
    };

    window.addEventListener(BRAND_THEME_UPDATED_EVENT, onThemeUpdated);
    return () => {
      window.removeEventListener(BRAND_THEME_UPDATED_EVENT, onThemeUpdated);
    };
  }, [loadBrandTheme]);

  return <>{children}</>;
}
