import { apiRequestBlob } from '@/lib/api-client'

export async function downloadRelatorioPdf(reportId: number) {
  return apiRequestBlob(`/relatorios/${reportId}/pdf`, {
    method: 'GET',
  })
}
