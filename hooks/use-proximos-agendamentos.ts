import { useEffect, useState } from "react";
import { fetchProximosAgendamentos } from "@/lib/dashboard-service";
import type { DashboardProximoAgendamento } from "@/lib/types";

export function useProximosAgendamentos(enabled = true) {
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
        const response = await fetchProximosAgendamentos();
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
  }, [enabled]);

  return { items, isLoading, error };
}
