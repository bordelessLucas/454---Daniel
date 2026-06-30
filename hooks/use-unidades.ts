import { useEffect, useState } from "react";
import { apiRequest } from "@/lib/api-client";
import type { Unidade } from "@/lib/types";

export function useUnidades(refetchTrigger = 0) {
  const [unidades, setUnidades] = useState<Unidade[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    async function fetchUnidades() {
      try {
        setLoading(true);
        setError(null);
        const data = await apiRequest<Unidade[]>("/unidades");
        setUnidades(
          [...data].sort((a, b) => a.nome.localeCompare(b.nome, "pt-BR")),
        );
      } catch (err) {
        setError(
          err instanceof Error ? err.message : "Erro ao buscar unidades",
        );
        setUnidades([]);
      } finally {
        setLoading(false);
      }
    }

    void fetchUnidades();
  }, [refetchTrigger]);

  return { unidades, loading, error };
}
