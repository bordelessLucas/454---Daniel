import { useCallback, useEffect, useState } from "react";
import { useTheme } from "next-themes";
import {
  hasConfiguredLogo,
  resolveLogoDisplaySrc,
  resolveLogoDarkDisplaySrc,
  resolveThemeAwareLogoSrc,
  resolveDefaultLogoForMode,
  resolveColorMode,
  type LogoConfigSource,
} from "@/lib/configuracao-logo";
import { getConfiguracoesPdf } from "@/lib/configuracoes-service";

const LOGO_UPDATED_EVENT = "system-logo-updated";

export function notifySystemLogoUpdated(config?: LogoConfigSource | null): void {
  window.dispatchEvent(
    new CustomEvent<LogoConfigSource>(LOGO_UPDATED_EVENT, {
      detail: config ?? {},
    }),
  );
}

export function useSystemLogo() {
  const { resolvedTheme } = useTheme();
  const [isThemeReady, setIsThemeReady] = useState(false);
  const [logoConfig, setLogoConfig] = useState<LogoConfigSource | null>(null);
  const [hasCustomLogo, setHasCustomLogo] = useState(false);
  const [loading, setLoading] = useState(true);
  const [version, setVersion] = useState(() => Date.now());

  const reload = useCallback(() => {
    setVersion(Date.now());
  }, []);

  useEffect(() => {
    setIsThemeReady(true);
  }, []);

  useEffect(() => {
    let cancelled = false;

    async function load() {
      setLoading(true);
      try {
        const config = await getConfiguracoesPdf();
        if (!cancelled) {
          setLogoConfig(config);
          setHasCustomLogo(hasConfiguredLogo(config));
        }
      } catch (error) {
        if (import.meta.env.DEV) {
          console.warn(
            "[useSystemLogo] Falha ao carregar GET /configuracoes/pdf:",
            error,
          );
        }
      } finally {
        if (!cancelled) {
          setLoading(false);
        }
      }
    }

    load();
    return () => {
      cancelled = true;
    };
  }, [version]);

  useEffect(() => {
    const onUpdate = (event: Event) => {
      const detail = (event as CustomEvent<LogoConfigSource>).detail;
      setLogoConfig(detail);
      setHasCustomLogo(hasConfiguredLogo(detail));
      reload();
    };
    window.addEventListener(LOGO_UPDATED_EVENT, onUpdate);
    return () => window.removeEventListener(LOGO_UPDATED_EVENT, onUpdate);
  }, [reload]);

  const colorMode = resolveColorMode(resolvedTheme, isThemeReady);
  const logoSrc = resolveLogoDisplaySrc(logoConfig, version);
  const logoDarkSrc = resolveLogoDarkDisplaySrc(logoConfig, version);
  const activeLogoSrc = resolveThemeAwareLogoSrc(logoConfig, resolvedTheme, {
    isMounted: isThemeReady,
    cacheBuster: version,
  });
  const fallbackLogoSrc = resolveDefaultLogoForMode(colorMode);

  return {
    logoSrc,
    logoDarkSrc,
    activeLogoSrc,
    fallbackLogoSrc,
    colorMode,
    isThemeReady,
    hasCustomLogo,
    loading,
    reload,
    logoConfig,
  };
}
