import { apiRequest } from "@/lib/api-client";

/**
 * Gera o PDF e envia por e-mail ao contato do cliente.
 * Rota: POST /relatorios/:id/enviar-email
 */
export async function enviarRelatorioPorEmail(reportId: number): Promise<void> {
  await apiRequest(`/relatorios/${reportId}/enviar-email`, {
    method: "POST",
  });
}
