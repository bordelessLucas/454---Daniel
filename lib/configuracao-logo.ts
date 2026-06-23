import { API_URL } from "@/lib/api-client";

const DEFAULT_LOGO_PATH = "/LogoIcon.png";

const LOGIN_LOGO_DARK = "/LogoBlack.png";
const LOGIN_LOGO_LIGHT = "/logoWhite.png";

export type LogoConfigSource = {
  logoUrl?: string | null;
  logoDataUrl?: string | null;
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

/**
 * Logo da tela de login conforme o tema.
 * Antes da hidratação do next-themes, usa a variante escura (defaultTheme="dark").
 */
export function resolveLoginLogoUrl(
  resolvedTheme?: string,
  isMounted = true,
): string {
  const isLight = isMounted && resolvedTheme === "light";
  return isLight ? LOGIN_LOGO_LIGHT : LOGIN_LOGO_DARK;
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
    return Boolean(source.logoDataUrl?.trim() || source.logoUrl?.trim());
  }

  return Boolean(source?.trim());
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

  const resolved = resolveConfiguracaoLogoUrl(config?.logoUrl);
  if (!hasConfiguredLogo(config)) {
    return resolved;
  }

  const needsCacheBust =
    isServerHostedLogoUrl(resolved) ||
    isServerHostedLogoUrl(config?.logoUrl ?? "");

  if (needsCacheBust && cacheBuster !== undefined) {
    return withLogoCacheBuster(resolved, cacheBuster);
  }

  return resolved;
}

/** Evita cache do browser após upload (mesmo URL, arquivo novo no servidor). */
export function withLogoCacheBuster(
  url: string,
  version: number | string = Date.now(),
): string {
  const separator = url.includes("?") ? "&" : "?";
  return `${url}${separator}v=${version}`;
}
