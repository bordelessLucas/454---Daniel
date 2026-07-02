import { apiRequest, apiRequestBlob } from "@/lib/api-client";
import { downloadBlobFile } from "@/lib/utils";
import type {
  ApiAuditLog,
  GerencialJsonResponse,
  GerencialQueryParams,
  GerencialTipo,
} from "@/lib/types";

function buildGerencialEndpoint(params: GerencialQueryParams): string {
  const search = new URLSearchParams({
    tipo: params.tipo,
    periodo: params.periodo,
  });

  if (params.formato) {
    search.set("formato", params.formato);
  }

  if (params.clienteId != null) {
    search.set("clienteId", String(params.clienteId));
  }
  if (params.tecnicoId != null) {
    search.set("tecnicoId", String(params.tecnicoId));
  }
  if (params.unidadeId != null) {
    search.set("unidadeId", String(params.unidadeId));
  }

  return `/relatorios/gerencial?${search.toString()}`;
}

function buildXlsxFilename(tipo: GerencialTipo, periodo: string): string {
  return `relatorio-gerencial-${tipo}-${periodo}.xlsx`;
}

export async function fetchRelatorioGerencial(
  params: GerencialQueryParams,
): Promise<GerencialJsonResponse> {
  const payload = await apiRequest<GerencialJsonResponse>(
    buildGerencialEndpoint({ ...params, formato: "json" }),
  );

  return {
    tipo: payload.tipo ?? params.tipo,
    itens: Array.isArray(payload.itens) ? payload.itens : [],
  };
}

export async function downloadRelatorioGerencialXlsx(
  params: GerencialQueryParams,
): Promise<void> {
  const { blob, filename } = await apiRequestBlob(
    buildGerencialEndpoint({ ...params, formato: "xlsx" }),
    {
      method: "GET",
      headers: {
        Accept:
          "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
      },
    },
  );

  downloadBlobFile(
    blob,
    filename ?? buildXlsxFilename(params.tipo, params.periodo),
  );
}

export async function fetchRelatorioAuditLogs(
  reportId: number,
): Promise<ApiAuditLog[]> {
  return apiRequest<ApiAuditLog[]>(`/relatorios/${reportId}/audit-logs`);
}
