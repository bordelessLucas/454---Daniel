import { apiRequest } from '@/lib/api-client'
import type { ApiAuditLog, ApiReport } from '@/lib/types'

/**
 * JSON completo do relatório (marca impresso no servidor).
 * Usado pelo fallback react-pdf no browser. Preferir GET /relatorios/:id/pdf-file.
 */
export async function fetchRelatorioParaPdf(
  reportId: number,
): Promise<ApiReport> {
  return apiRequest<ApiReport>(`/relatorios/${reportId}/pdf`, {
    method: 'GET',
  })
}

export async function fetchRelatorioAuditLogs(
  reportId: number,
): Promise<ApiAuditLog[]> {
  return apiRequest<ApiAuditLog[]>(`/relatorios/${reportId}/audit-logs`)
}
