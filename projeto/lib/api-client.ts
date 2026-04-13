const defaultApiUrl = import.meta.env.DEV
  ? "http://localhost:3000"
  : "https://four54-backend.onrender.com";

export const API_URL = import.meta.env.VITE_API_URL || defaultApiUrl;

export class ApiError extends Error {
  status: number;
  statusText: string;
  responseText: string;

  constructor(status: number, statusText: string, responseText = "") {
    super(`API Error ${status}: ${statusText}`);
    this.name = "ApiError";
    this.status = status;
    this.statusText = statusText;
    this.responseText = responseText;
  }
}

export interface BlobResponse {
  blob: Blob;
  filename: string | null;
  contentType: string | null;
}

function getAuthHeaders(options: RequestInit): Record<string, string> {
  const headers: Record<string, string> = {
    ...(options.headers as Record<string, string>),
  };

  if (options.body && !headers["Content-Type"]) {
    headers["Content-Type"] = "application/json";
  }

  const token = localStorage.getItem("authToken");
  console.log(
    `[API-CLIENT] Token encontrado: ${token ? "Sim (length: " + token.length + ")" : "Não"}`,
  );

  if (token) {
    headers.Authorization = `Bearer ${token}`;
    console.log(`[API-CLIENT] Header Authorization adicionado`);
  }

  return headers;
}

async function performRequest(
  endpoint: string,
  options: RequestInit = {},
): Promise<Response> {
  console.log(`[API-CLIENT] Requisição para: ${endpoint}`);
  console.log(`[API-CLIENT] Método: ${options.method || "GET"}`);

  const headers = getAuthHeaders(options);

  console.log(`[API-CLIENT] URL completa: ${API_URL}${endpoint}`);
  console.log(`[API-CLIENT] Headers:`, headers);

  if (options.body) {
    console.log(`[API-CLIENT] Body:`, options.body);
  }

  const response = await fetch(`${API_URL}${endpoint}`, {
    ...options,
    headers,
  });

  console.log(
    `[API-CLIENT] Status da resposta: ${response.status} ${response.statusText}`,
  );

  if (!response.ok) {
    const responseText = await response.text();
    console.log(`[API-CLIENT] Resposta de erro:`, responseText);

    if (response.status === 401) {
      console.log(`[API-CLIENT] Status 401 - Limpando auth e redirecionando`);
      localStorage.removeItem("authToken");
      localStorage.removeItem("user");
      window.location.href = "/login";
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
  options: RequestInit = {},
): Promise<T> {
  const response = await performRequest(endpoint, options);

  // 204 No Content - não tem body para parsear
  if (response.status === 204) {
    console.log(`[API-CLIENT] Status 204 - No Content`);
    return null as T;
  }

  const data = await response.json();
  console.log(`[API-CLIENT] Resposta de sucesso:`, data);
  return data;
}

export async function apiRequestBlob(
  endpoint: string,
  options: RequestInit = {},
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
