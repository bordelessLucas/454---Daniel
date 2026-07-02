import { useCallback, useState } from "react";
import { ApiError } from "@/lib/api-client";
import {
  downloadRelatorioGerencialXlsx,
  fetchRelatorioGerencial,
} from "@/lib/relatorios-service";
import type {
  GerencialJsonData,
  GerencialQueryParams,
  GerencialTipo,
} from "@/lib/types";

function extractApiErrorMessage(err: unknown): string {
  if (err instanceof ApiError) {
    return err.message;
  }
  if (err instanceof Error) {
    return err.message;
  }
  return "Erro ao processar relatório gerencial.";
}

export function useRelatoriosGerenciais() {
  const [data, setData] = useState<GerencialJsonData | null>(null);
  const [responseTipo, setResponseTipo] = useState<GerencialTipo | null>(null);
  const [loading, setLoading] = useState(false);
  const [exporting, setExporting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fetchGerencial = useCallback(async (params: GerencialQueryParams) => {
    setLoading(true);
    setError(null);

    try {
      const response = await fetchRelatorioGerencial(params);
      setData(response.itens);
      setResponseTipo(response.tipo);
      return response;
    } catch (err) {
      const message = extractApiErrorMessage(err);
      setError(message);
      setData(null);
      setResponseTipo(null);
      throw err;
    } finally {
      setLoading(false);
    }
  }, []);

  const exportGerencial = useCallback(async (params: GerencialQueryParams) => {
    setExporting(true);
    setError(null);

    try {
      await downloadRelatorioGerencialXlsx(params);
    } catch (err) {
      const message = extractApiErrorMessage(err);
      setError(message);
      throw err;
    } finally {
      setExporting(false);
    }
  }, []);

  const reset = useCallback(() => {
    setData(null);
    setResponseTipo(null);
    setError(null);
  }, []);

  return {
    data,
    responseTipo,
    loading,
    exporting,
    error,
    fetchGerencial,
    exportGerencial,
    reset,
  };
}
