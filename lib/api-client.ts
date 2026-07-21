const defaultApiUrl = "http://localhost:3000";

export const API_URL = import.meta.env.VITE_API_URL || defaultApiUrl;

function extractApiErrorMessage(
  responseText: string,
  status: number,
  statusText: string,
): string {
  if (responseText) {
    try {
      const parsed = JSON.parse(responseText) as {
        error?: unknown;
        message?: unknown;
      };
      if (typeof parsed.error === "string" && parsed.error.trim()) {
        return parsed.error;
      }
      if (typeof parsed.message === "string" && parsed.message.trim()) {
        return parsed.message;
      }
    } catch {
      return responseText;
    }
  }

  return `Erro ${status}: ${statusText}`;
}

export class ApiError extends Error {
  status: number;
  statusText: string;
  responseText: string;

  constructor(status: number, statusText: string, responseText = "") {
    super(extractApiErrorMessage(responseText, status, statusText));
    this.name = "ApiError";
    this.status = status;
    this.statusText = statusText;
    this.responseText = responseText;
  }
}

const HORARIO_ACCESS_ERROR_MARKERS = ["horario configurado"] as const;

function redirectToLogin(): void {
  if (window.location.pathname !== "/") {
    window.location.href = "/";
  }
}

function isHorarioAccessDenied(responseText: string): boolean {
  const message = extractApiErrorMessage(responseText, 403, "Forbidden")
    .toLowerCase()
    .normalize("NFD")
    .replace(/\p{M}/gu, "");
  return HORARIO_ACCESS_ERROR_MARKERS.some((marker) =>
    message.includes(
      marker.normalize("NFD").replace(/\p{M}/gu, ""),
    ),
  );
}

export interface BlobResponse {
  blob: Blob;
  filename: string | null;
  contentType: string | null;
}

function buildHeaders(options: RequestInit): Record<string, string> {
  const headers: Record<string, string> = {
    ...(options.headers as Record<string, string>),
  };

  if (
    options.body &&
    !(options.body instanceof FormData) &&
    !headers["Content-Type"]
  ) {
    headers["Content-Type"] = "application/json";
  }

  return headers;
}

export type ApiRequestOptions = RequestInit & {
  /** Redireciona para login em 401. Padrão: true */
  redirectOnUnauthorized?: boolean;
};

async function performRequest(
  endpoint: string,
  options: ApiRequestOptions = {},
): Promise<Response> {
  const { redirectOnUnauthorized = true, ...fetchOptions } = options;
  const headers = buildHeaders(fetchOptions);

  const response = await fetch(`${API_URL}${endpoint}`, {
    ...fetchOptions,
    headers,
    credentials: fetchOptions.credentials ?? "include",
  });

  if (!response.ok) {
    const responseText = await response.text();

    if (response.status === 401 && redirectOnUnauthorized) {
      redirectToLogin();
    } else if (
      response.status === 403 &&
      redirectOnUnauthorized &&
      isHorarioAccessDenied(responseText)
    ) {
      redirectToLogin();
    }

    throw new ApiError(response.status, response.statusText, responseText);
  }

  return response;
}

function getFilenameFromContentDisposition(
  contentDisposition: string | null,
): string | null {
  if (!contentDisposition) {
    return null;
  }

  const utfMatch = contentDisposition.match(/filename\*=UTF-8''([^;]+)/i);
  if (utfMatch?.[1]) {
    try {
      return decodeURIComponent(utfMatch[1]);
    } catch {
      return utfMatch[1];
    }
  }

  const quotedMatch = contentDisposition.match(/filename="([^"]+)"/i);
  if (quotedMatch?.[1]) {
    return quotedMatch[1];
  }

  const plainMatch = contentDisposition.match(/filename=([^;]+)/i);
  return plainMatch?.[1]?.trim() || null;
}

export async function apiRequest<T>(
  endpoint: string,
  options: ApiRequestOptions = {},
): Promise<T> {
  const response = await performRequest(endpoint, options);

  // 204 No Content - não tem body para parsear
  if (response.status === 204) {
    return null as T;
  }

  return response.json();
}

export async function apiRequestFormData<T>(
  endpoint: string,
  formData: FormData,
  options: Omit<ApiRequestOptions, "body"> = {},
): Promise<T> {
  const response = await performRequest(endpoint, {
    ...options,
    method: options.method ?? "POST",
    body: formData,
  });

  if (response.status === 204) {
    return null as T;
  }

  return response.json();
}

export async function apiRequestBlob(
  endpoint: string,
  options: ApiRequestOptions = {},
): Promise<BlobResponse> {
  const response = await performRequest(endpoint, options);
  const contentDisposition = response.headers.get("Content-Disposition");
  const contentType = response.headers.get("Content-Type");
  const filename = getFilenameFromContentDisposition(contentDisposition);
  const blob = await response.blob();

  return {
    blob,
    filename,
    contentType,
  };
}
