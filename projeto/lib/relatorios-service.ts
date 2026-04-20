import { apiRequest } from '@/lib/api-client'
import type { ApiReport } from '@/lib/types'

/** JSON completo do relatório (marca impresso no servidor). Rota: GET /relatorios/:id/pdf */
export async function fetchRelatorioParaPdf(
  reportId: number,
): Promise<ApiReport> {
  return apiRequest<ApiReport>(`/relatorios/${reportId}/pdf`, {
    method: 'GET',
  })
}
