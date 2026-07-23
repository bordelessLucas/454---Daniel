import { API_URL } from "@/lib/api-client";

/** Ícone genérico (fallback final). */
const DEFAULT_LOGO_PATH = "/LogoIcon.png";

/**
 * Assets padrão por contraste com o fundo:
 * - light background → logoWhite (texto escuro em fundo claro)
 * - dark background  → LogoBlack (texto claro em fundo escuro)
 */
const DEFAULT_LOGO_FOR_LIGHT_THEME = "/logoWhite.png";
const DEFAULT_LOGO_FOR_DARK_THEME = "/LogoBlack.png";

export type AppColorMode = "light" | "dark";

export type LogoConfigSource = {
  logoUrl?: string | null;
  logoDataUrl?: string | null;
  logoDarkUrl?: string | null;
  logoDarkDataUrl?: string | null;
};

function getApiBaseUrl(): string {
  return API_URL.replace(/\/$/, "");
}

/**
 * Garante que /uploads/* e URLs localhost do backend apontem para VITE_API_URL.
 * Evita ERR_CONNECTION_REFUSED quando PUBLIC_API_URL do backend está em localhost.
 */
function normalizeLogoAssetUrl(logoUrl: string): string {
  const apiBase = getApiBaseUrl();

  if (logoUrl.startsWith("/")) {
    return `${apiBase}${logoUrl}`;
  }

  if (/^https?:\/\//i.test(logoUrl)) {
    try {
      const parsed = new URL(logoUrl);
      const isUploadsPath = parsed.pathname.startsWith("/uploads/");
      const isLocalhost = /localhost|127\.0\.0\.1/i.test(parsed.hostname);

      if (isUploadsPath || isLocalhost) {
        return `${apiBase}${parsed.pathname}${parsed.search}`;
      }
    } catch {
      return logoUrl;
    }
    return logoUrl;
  }

  return `${apiBase}/${logoUrl}`;
}

export function resolveColorMode(
  resolvedTheme?: string | null,
  isMounted = true,
): AppColorMode {
  // Antes da hidratação do next-themes, defaultTheme="dark" — evita flash da logo clara.
  if (!isMounted || !resolvedTheme) {
    return "dark";
  }

  return resolvedTheme === "light" ? "light" : "dark";
}

/**
 * Logo da tela de login conforme o tema (contraste com o fundo).
 * Light → logo escura; Dark → logo clara.
 */
export function resolveLoginLogoUrl(
  resolvedTheme?: string,
  isMounted = true,
): string {
  const mode = resolveColorMode(resolvedTheme, isMounted);
  return mode === "light"
    ? DEFAULT_LOGO_FOR_LIGHT_THEME
    : DEFAULT_LOGO_FOR_DARK_THEME;
}

export function resolveDefaultLogoForMode(mode: AppColorMode): string {
  return mode === "light"
    ? DEFAULT_LOGO_FOR_LIGHT_THEME
    : DEFAULT_LOGO_FOR_DARK_THEME;
}

/** URL absoluta da logo para exibição no app (sidebar, configurações). */
export function resolveConfiguracaoLogoUrl(
  logoUrl?: string | null,
  origin = typeof window !== "undefined" ? window.location.origin : "",
): string {
  const trimmed = logoUrl?.trim();
  if (!trimmed) {
    return `${origin}${DEFAULT_LOGO_PATH}`;
  }

  return normalizeLogoAssetUrl(trimmed);
}

function isDataUrl(value: string): boolean {
  return value.startsWith("data:");
}

export function isServerHostedLogoUrl(url: string): boolean {
  return /\/uploads\//i.test(url);
}

export function hasConfiguredLogo(
  source?: string | null | LogoConfigSource,
): boolean {
  if (source && typeof source === "object") {
    return Boolean(
      source.logoDataUrl?.trim() ||
        source.logoUrl?.trim() ||
        source.logoDarkDataUrl?.trim() ||
        source.logoDarkUrl?.trim(),
    );
  }

  return Boolean(source?.trim());
}

export function hasConfiguredLightLogo(
  source?: LogoConfigSource | null,
): boolean {
  return Boolean(source?.logoDataUrl?.trim() || source?.logoUrl?.trim());
}

export function hasConfiguredDarkLogo(
  source?: LogoConfigSource | null,
): boolean {
  return Boolean(
    source?.logoDarkDataUrl?.trim() || source?.logoDarkUrl?.trim(),
  );
}

/**
 * Resolve a URL/data URL da logo para exibição (sidebar, configurações).
 * Prioriza logoDataUrl; aplica cache bust em logos servidas pelo backend (/uploads/).
 */
export function resolveLogoDisplaySrc(
  config?: LogoConfigSource | null,
  cacheBuster?: number | string,
): string {
  const dataUrl = config?.logoDataUrl?.trim();
  if (dataUrl && isDataUrl(dataUrl)) {
    return dataUrl;
  }

  if (!hasConfiguredLightLogo(config)) {
    return DEFAULT_LOGO_FOR_LIGHT_THEME;
  }

  const resolved = resolveConfiguracaoLogoUrl(config?.logoUrl);
  const needsCacheBust =
    isServerHostedLogoUrl(resolved) ||
    isServerHostedLogoUrl(config?.logoUrl ?? "");

  if (needsCacheBust && cacheBuster !== undefined) {
    return withLogoCacheBuster(resolved, cacheBuster);
  }

  return resolved;
}

/**
 * Resolve a URL/data URL da logo escura para exibição (sidebar dark mode).
 * Retorna null se não houver logo escura configurada, permitindo fallback controlado.
 */
export function resolveLogoDarkDisplaySrc(
  config?: LogoConfigSource | null,
  cacheBuster?: number | string,
): string | null {
  const dataUrl = config?.logoDarkDataUrl?.trim();
  if (dataUrl && isDataUrl(dataUrl)) {
    return dataUrl;
  }

  const url = config?.logoDarkUrl?.trim();
  if (!url) {
    return null;
  }

  const resolved = normalizeLogoAssetUrl(url);
  const needsCacheBust =
    isServerHostedLogoUrl(resolved) || isServerHostedLogoUrl(url);

  if (needsCacheBust && cacheBuster !== undefined) {
    return withLogoCacheBuster(resolved, cacheBuster);
  }

  return resolved;
}

/**
 * Logo para sidebar/header conforme tema.
 * Dark: logoDarkUrl → fallback logoUrl (se a API já tiver logo) → asset padrão.
 * Light: logoUrl → asset padrão.
 */
export function resolveSidebarLogoSrc(
  config: LogoConfigSource | null | undefined,
  mode: AppColorMode,
  cacheBuster?: number | string,
): string {
  if (mode === "dark") {
    const darkSrc = resolveLogoDarkDisplaySrc(config, cacheBuster);
    if (darkSrc) {
      return darkSrc;
    }
    // Sem logo dark: usa a clara configurada — não força asset LINQ se a API já tiver logo.
    if (hasConfiguredLightLogo(config)) {
      return resolveLogoDisplaySrc(config, cacheBuster);
    }
    return DEFAULT_LOGO_FOR_DARK_THEME;
  }

  if (hasConfiguredLightLogo(config)) {
    return resolveLogoDisplaySrc(config, cacheBuster);
  }

  return DEFAULT_LOGO_FOR_LIGHT_THEME;
}

/**
 * Escolhe a logo correta para o tema atual.
 * Preferir o componente ThemedBrandLogo para alternância instantânea light/dark.
 */
export function resolveThemeAwareLogoSrc(
  config: LogoConfigSource | null | undefined,
  resolvedTheme?: string | null,
  options?: {
    isMounted?: boolean;
    cacheBuster?: number | string;
  },
): string {
  const mode = resolveColorMode(resolvedTheme, options?.isMounted ?? true);
  return resolveSidebarLogoSrc(config, mode, options?.cacheBuster);
}

/**
 * Evita cache do browser após upload (mesmo path, arquivo novo no servidor).
 * Se a API já enviou `?v=` (cache-bust por updatedAt), preserva a URL intacta.
 */
export function withLogoCacheBuster(
  url: string,
  version: number | string = Date.now(),
): string {
  if (/[?&]v=/.test(url)) {
    return url;
  }
  const separator = url.includes("?") ? "&" : "?";
  return `${url}${separator}v=${version}`;
}
