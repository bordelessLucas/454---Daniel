import { apiRequest, API_URL, ApiError } from "./api-client";
import type { ApiConfiguracoes, ApiConfiguracoesPdf } from "./types";

export type UpdateConfiguracoesPayload = {
  dataInicio?: string;
  dataFim?: string;
  textoRodapeRelatorio?: string | null;
};

/** Configurações completas — requer perfil ADMIN. */
export async function getConfiguracoes(): Promise<ApiConfiguracoes | null> {
  return apiRequest<ApiConfiguracoes | null>("/configuracoes");
}

/** Logo e rodapé do PDF — qualquer usuário autenticado. */
export async function getConfiguracoesPdf(): Promise<ApiConfiguracoesPdf> {
  return apiRequest<ApiConfiguracoesPdf>("/configuracoes/pdf");
}

export async function updateConfiguracoes(
  payload: UpdateConfiguracoesPayload,
): Promise<ApiConfiguracoes> {
  return apiRequest<ApiConfiguracoes>("/configuracoes", {
    method: "PUT",
    body: JSON.stringify(payload),
  });
}

/**
 * Envia nova logo (multipart). Requer perfil ADMIN.
 * Campo obrigatório no FormData: `logo` (nome exato exigido pelo multer no backend).
 * Não definir Content-Type manualmente — o browser inclui o boundary.
 */
export async function uploadConfiguracaoLogo(
  file: File,
): Promise<ApiConfiguracoes> {
  const formData = new FormData();
  formData.append("logo", file);

  const response = await fetch(`${API_URL}/configuracoes/logo`, {
    method: "POST",
    body: formData,
    credentials: "include",
  });

  const responseText = await response.text();

  if (!response.ok) {
    if (response.status === 401) {
      window.location.href = "/";
    }
    throw new ApiError(response.status, response.statusText, responseText);
  }

  return responseText ? (JSON.parse(responseText) as ApiConfiguracoes) : ({} as ApiConfiguracoes);
}
