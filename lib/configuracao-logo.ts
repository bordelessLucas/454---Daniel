import { API_URL } from "@/lib/api-client";

const DEFAULT_LOGO_PATH = "/placeholder-logo.svg";

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

export function hasConfiguredLogo(logoUrl?: string | null): boolean {
  return Boolean(logoUrl?.trim());
}

/** Evita cache do browser após upload (mesmo URL, arquivo novo no servidor). */
export function withLogoCacheBuster(
  url: string,
  version: number | string = Date.now(),
): string {
  const separator = url.includes("?") ? "&" : "?";
  return `${url}${separator}v=${version}`;
}

function blobToDataUrl(blob: Blob): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(String(reader.result));
    reader.onerror = () => reject(reader.error);
    reader.readAsDataURL(blob);
  });
}

/**
 * Converte a logo em data URL para o react-pdf (header/rodapé).
 * URLs cross-origin (ex.: Render /uploads) costumam falhar no <Image> do react-pdf sem isso.
 */
export async function resolveLogoForPdfEmbed(
  logoUrl?: string | null,
  origin = typeof window !== "undefined" ? window.location.origin : "",
): Promise<string> {
  const resolved = resolveConfiguracaoLogoUrl(logoUrl, origin);

  if (resolved.startsWith("data:")) {
    return resolved;
  }

  if (resolved.includes("placeholder-logo")) {
    return resolved;
  }

  try {
    const response = await fetch(resolved, { credentials: "include" });
    if (!response.ok) {
      return resolved;
    }
    const blob = await response.blob();
    return await blobToDataUrl(blob);
  } catch {
    return resolved;
  }
}
