import { useCallback, useEffect, useState } from "react";
import { ApiReport } from "@/lib/types";
import { apiRequest } from "@/lib/api-client";

export function useRelatorio(id?: string | number) {
  const [relatorio, setRelatorio] = useState<ApiReport | null>(null);
  const [loading, setLoading] = useState(!!id);
  const [error, setError] = useState<string | null>(null);
  const [refetchTrigger, setRefetchTrigger] = useState(0);

  const refetch = useCallback(() => {
    setRefetchTrigger((prev) => prev + 1);
  }, []);

  useEffect(() => {
    if (!id) {
      setLoading(false);
      setRelatorio(null);
      return;
    }

    async function fetchRelatorio() {
      try {
        setLoading(true);
        setError(null);
        const data = await apiRequest<ApiReport>(`/relatorios/${id}`);
        setRelatorio(data);
      } catch (err) {
        const message =
          err instanceof Error ? err.message : "Erro ao buscar relatório";
        setError(message);
        setRelatorio(null);
      } finally {
        setLoading(false);
      }
    }

    fetchRelatorio();
  }, [id, refetchTrigger]);

  return { relatorio, setRelatorio, loading, error, refetch };
}
