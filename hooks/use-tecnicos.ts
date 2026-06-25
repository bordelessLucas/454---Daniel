import { useEffect, useState } from "react";
import { apiRequest } from "@/lib/api-client";
import type { ApiUser } from "@/lib/types";

export function useTecnicos(refetchTrigger = 0) {
  const [tecnicos, setTecnicos] = useState<ApiUser[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    async function fetchTecnicos() {
      try {
        setLoading(true);
        setError(null);
        const data = await apiRequest<ApiUser[]>("/users/tecnico");
        setTecnicos(
          [...data].sort((a, b) => a.nome.localeCompare(b.nome, "pt-BR")),
        );
      } catch (err) {
        setError(
          err instanceof Error ? err.message : "Erro ao buscar técnicos",
        );
        setTecnicos([]);
      } finally {
        setLoading(false);
      }
    }

    void fetchTecnicos();
  }, [refetchTrigger]);

  return { tecnicos, loading, error };
}
