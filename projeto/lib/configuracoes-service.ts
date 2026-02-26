import { apiRequest } from "./api-client";
import type { ApiConfiguracoes } from "./types";

export async function getConfiguracoes(): Promise<ApiConfiguracoes> {
  return apiRequest<ApiConfiguracoes>("/configuracoes");
}

export async function updateConfiguracoes(
  dataInicio: string,
  dataFim: string,
): Promise<ApiConfiguracoes> {
  return apiRequest<ApiConfiguracoes>("/configuracoes", {
    method: "PUT",
    body: JSON.stringify({ dataInicio, dataFim }),
  });
}
