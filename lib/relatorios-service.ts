import { apiRequest } from '@/lib/api-client'
import type { ApiAuditLog } from '@/lib/types'

export async function fetchRelatorioAuditLogs(
  reportId: number,
): Promise<ApiAuditLog[]> {
  return apiRequest<ApiAuditLog[]>(`/relatorios/${reportId}/audit-logs`)
}
