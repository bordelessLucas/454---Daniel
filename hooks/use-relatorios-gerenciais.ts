import { useCallback, useState } from "react";
import { apiRequest, apiRequestBlob } from "@/lib/api-client";
import type {
  GerencialJsonData,
  GerencialQueryParams,
  GerencialTipo,
} from "@/lib/types";
import { downloadBlobFile } from "@/lib/utils";

function buildGerencialEndpoint(params: GerencialQueryParams): string {
  const search = new URLSearchParams({
    tipo: params.tipo,
    periodo: params.periodo,
    formato: params.formato,
  });
  return `/relatorios/gerencial?${search.toString()}`;
}

function buildXlsxFilename(tipo: GerencialTipo, periodo: string): string {
  return `relatorio-gerencial-${tipo}-${periodo}.xlsx`;
}

function normalizeGerencialResponse(
  payload: unknown,
): GerencialJsonData | null {
  if (Array.isArray(payload)) {
    return payload as GerencialJsonData;
  }

  if (payload && typeof payload === "object") {
    const candidate = payload as { data?: unknown; rows?: unknown };
    if (Array.isArray(candidate.data)) {
      return candidate.data as GerencialJsonData;
    }
    if (Array.isArray(candidate.rows)) {
      return candidate.rows as GerencialJsonData;
    }
  }

  return null;
}

export function useRelatoriosGerenciais() {
  const [data, setData] = useState<GerencialJsonData | null>(null);
  const [loading, setLoading] = useState(false);
  const [exporting, setExporting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fetchGerencial = useCallback(async (params: GerencialQueryParams) => {
    setLoading(true);
    setError(null);

    try {
      const payload = await apiRequest<unknown>(
        buildGerencialEndpoint({ ...params, formato: "json" }),
      );
      const normalized = normalizeGerencialResponse(payload);
      setData(normalized ?? []);
      return normalized ?? [];
    } catch (err) {
      const message =
        err instanceof Error
          ? err.message
          : "Erro ao gerar relatório gerencial.";
      setError(message);
      setData(null);
      throw err;
    } finally {
      setLoading(false);
    }
  }, []);

  const exportGerencial = useCallback(async (params: GerencialQueryParams) => {
    setExporting(true);
    setError(null);

    try {
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
    } catch (err) {
      const message =
        err instanceof Error ? err.message : "Erro ao exportar relatório.";
      setError(message);
      throw err;
    } finally {
      setExporting(false);
    }
  }, []);

  const reset = useCallback(() => {
    setData(null);
    setError(null);
  }, []);

  return {
    data,
    loading,
    exporting,
    error,
    fetchGerencial,
    exportGerencial,
    reset,
  };
}
