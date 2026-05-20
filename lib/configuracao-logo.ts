import { API_URL } from "@/lib/api-client";

const DEFAULT_LOGO_PATH = "/placeholder-logo.svg";

/** URL absoluta da logo para exibição no app ou no PDF. */
export function resolveConfiguracaoLogoUrl(
  logoUrl?: string | null,
  origin = typeof window !== "undefined" ? window.location.origin : "",
): string {
  const trimmed = logoUrl?.trim();
  if (!trimmed) {
    return `${origin}${DEFAULT_LOGO_PATH}`;
  }
  if (/^https?:\/\//i.test(trimmed)) {
    return trimmed;
  }
  const base = API_URL.replace(/\/$/, "");
  return `${base}${trimmed.startsWith("/") ? trimmed : `/${trimmed}`}`;
}
