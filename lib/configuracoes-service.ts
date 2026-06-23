import { apiRequest, apiRequestFormData } from "./api-client";
import { hasConfiguredLogo } from "./configuracao-logo";
import type { ApiConfiguracoes, ApiConfiguracoesPdf } from "./types";

export type UpdateConfiguracoesPayload = {
  dataInicio?: string;
  dataFim?: string;
  textoRodapeRelatorio?: string | null;
};

function toPdfConfig(
  data: ApiConfiguracoes | ApiConfiguracoesPdf | null | undefined,
): ApiConfiguracoesPdf | null {
  if (!data) {
    return null;
  }

  return {
    logoUrl: data.logoUrl ?? null,
    logoDataUrl: data.logoDataUrl ?? null,
    textoRodapeRelatorio: data.textoRodapeRelatorio ?? null,
  };
}

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
): Promise<ApiConfiguracoesPdf> {
  const formData = new FormData();
  formData.append("logo", file);

  const updated = await apiRequestFormData<ApiConfiguracoes>(
    "/configuracoes/logo",
    formData,
  );

  const normalized = toPdfConfig(updated);
  if (normalized && hasConfiguredLogo(normalized)) {
    return normalized;
  }

  // Backend pode retornar 204/corpo vazio ou omitir logoUrl — recarrega do endpoint público.
  return getConfiguracoesPdf();
}
