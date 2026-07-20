import { useEffect, useState } from "react";
import { ApiReport, RelatorioAgendaStatus } from "@/lib/types";
import { apiRequest } from "@/lib/api-client";

interface RelatoriosFilters {
  clienteId?: number;
  criadoPorId?: number;
  dataInicio?: string;
  dataFim?: string;
  impresso?: boolean;
  /** Um ou mais status de agenda enviados como `?status=`. */
  status?: RelatorioAgendaStatus | RelatorioAgendaStatus[];
  refetchTrigger?: number;
}

export function useRelatorios(filters?: RelatoriosFilters) {
  const [relatorios, setRelatorios] = useState<ApiReport[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const statusKey = Array.isArray(filters?.status)
    ? filters.status.join(",")
    : (filters?.status ?? "");

  useEffect(() => {
    async function fetchRelatorios() {
      try {
        setLoading(true);
        setError(null);

        const params = new URLSearchParams();
        if (filters?.clienteId !== undefined) {
          params.append("clienteId", String(filters.clienteId));
        }
        if (filters?.criadoPorId !== undefined) {
          params.append("criadoPorId", String(filters.criadoPorId));
        }
        if (filters?.dataInicio) {
          params.append("dataInicio", filters.dataInicio);
        }
        if (filters?.dataFim) {
          params.append("dataFim", filters.dataFim);
        }
        if (filters?.impresso !== undefined) {
          params.append("impresso", String(filters.impresso));
        }
        if (filters?.status !== undefined) {
          const statuses = Array.isArray(filters.status)
            ? filters.status
            : [filters.status];
          if (statuses.length > 0) {
            params.append("status", statuses.join(","));
          }
        }

        const queryString = params.toString();
        const url = `/relatorios${queryString ? `?${queryString}` : ""}`;

        const data = await apiRequest<ApiReport[]>(url);
        setRelatorios(data);
      } catch (err) {
        setError(
          err instanceof Error ? err.message : "Erro ao buscar relatórios",
        );
      } finally {
        setLoading(false);
      }
    }

    fetchRelatorios();
  }, [
    filters?.clienteId,
    filters?.criadoPorId,
    filters?.dataInicio,
    filters?.dataFim,
    filters?.impresso,
    statusKey,
    filters?.refetchTrigger,
  ]);

  return { relatorios, loading, error };
}
