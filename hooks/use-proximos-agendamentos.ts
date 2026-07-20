import { useEffect, useState } from "react";
import { fetchProximosAgendamentos } from "@/lib/dashboard-service";
import type { DashboardProximoAgendamento } from "@/lib/types";

interface UseProximosAgendamentosOptions {
  enabled?: boolean;
  tecnicoId?: number;
  limit?: number;
}

export function useProximosAgendamentos(
  options: UseProximosAgendamentosOptions | boolean = true,
) {
  const normalized =
    typeof options === "boolean" ? { enabled: options } : options;
  const { enabled = true, tecnicoId, limit } = normalized;

  const [items, setItems] = useState<DashboardProximoAgendamento[]>([]);
  const [isLoading, setIsLoading] = useState(enabled);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!enabled) {
      setItems([]);
      setIsLoading(false);
      setError(null);
      return;
    }

    let cancelled = false;

    async function load() {
      setIsLoading(true);
      setError(null);

      try {
        const response = await fetchProximosAgendamentos({ tecnicoId, limit });
        if (!cancelled) {
          setItems(response);
        }
      } catch (err) {
        if (!cancelled) {
          const message =
            err instanceof Error
              ? err.message
              : "Erro ao carregar próximos agendamentos.";
          setError(message);
          setItems([]);
        }
      } finally {
        if (!cancelled) {
          setIsLoading(false);
        }
      }
    }

    void load();

    return () => {
      cancelled = true;
    };
  }, [enabled, tecnicoId, limit]);

  return { items, isLoading, error };
}
