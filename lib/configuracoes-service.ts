import { apiRequest, apiRequestFormData } from "./api-client";
import { hasConfiguredLogo } from "./configuracao-logo";
import type {
  ApiConfiguracoes,
  ApiConfiguracoesPdf,
  BrandThemePalette,
  SalvarHorarioPayload,
} from "./types";

export type UpdateConfiguracoesPayload = Partial<SalvarHorarioPayload> & {
  textoRodapeRelatorio?: string | null;
  themePalette?: BrandThemePalette | null;
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
    logoDarkUrl: data.logoDarkUrl ?? null,
    logoDarkDataUrl: data.logoDarkDataUrl ?? null,
    textoRodapeRelatorio: data.textoRodapeRelatorio ?? null,
    themePalette: data.themePalette ?? null,
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

export async function salvarHorarioLogin(
  horaInicio: string,
  horaFim: string,
): Promise<ApiConfiguracoes> {
  return updateConfiguracoes({ horaInicio, horaFim });
}

/**
 * Envia nova logo (multipart). Requer perfil ADMIN.
 * Campo obrigatório no FormData: `logo` (nome exato exigido pelo multer no backend).
 * Não definir Content-Type manualmente — o browser inclui o boundary.
 */
export async function uploadConfiguracaoLogo(
  file: File,
  themePalette?: BrandThemePalette,
): Promise<ApiConfiguracoesPdf> {
  const formData = new FormData();
  formData.append("logo", file);
  if (themePalette) {
    formData.append("themePalette", JSON.stringify(themePalette));
  }

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

/**
 * Envia nova logo para o tema escuro. Requer perfil ADMIN.
 */
export async function uploadConfiguracaoLogoDark(
  file: File,
  themePalette?: BrandThemePalette,
): Promise<ApiConfiguracoesPdf> {
  const formData = new FormData();
  formData.append("logo", file);
  if (themePalette) {
    formData.append("themePalette", JSON.stringify(themePalette));
  }

  const updated = await apiRequestFormData<ApiConfiguracoes>(
    "/configuracoes/logo-dark",
    formData,
  );

  const normalized = toPdfConfig(updated);
  if (normalized && hasConfiguredLogo(normalized)) {
    return normalized;
  }

  return getConfiguracoesPdf();
}
