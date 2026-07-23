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

const LOGO_CONFIG_KEYS = [
  "logoUrl",
  "logoDataUrl",
  "logoDarkUrl",
  "logoDarkDataUrl",
] as const;

function mergeLogoConfig(
  prev: LogoConfigSource | null | undefined,
  next: Partial<LogoConfigSource>,
): LogoConfigSource {
  const merged: LogoConfigSource = { ...(prev ?? {}) };
  for (const key of LOGO_CONFIG_KEYS) {
    if (next[key] !== undefined) {
      merged[key] = next[key];
    }
  }
  return merged;
}

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
  /** Só para cache-bust de <img>; não dispara GET. */
  const [version, setVersion] = useState(() => Date.now());
  /** Incrementar para refetch de GET /configuracoes/pdf. */
  const [fetchToken, setFetchToken] = useState(0);

  const reload = useCallback(() => {
    setFetchToken((current) => current + 1);
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
          setLogoConfig((prev) => {
            const merged = mergeLogoConfig(prev, config);
            setHasCustomLogo(hasConfiguredLogo(merged));
            return merged;
          });
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
  }, [fetchToken]);

  useEffect(() => {
    const onUpdate = (event: Event) => {
      const detail = (event as CustomEvent<LogoConfigSource>).detail ?? {};
      // Aplica a resposta do upload sem refetch — evita /pdf apagar logoDarkUrl.
      setLogoConfig((prev) => {
        const merged = mergeLogoConfig(prev, detail);
        setHasCustomLogo(hasConfiguredLogo(merged));
        return merged;
      });
      setVersion(Date.now());
    };
    window.addEventListener(LOGO_UPDATED_EVENT, onUpdate);
    return () => window.removeEventListener(LOGO_UPDATED_EVENT, onUpdate);
  }, []);

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
    version,
  };
}
