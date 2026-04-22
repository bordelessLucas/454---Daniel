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
        console.log("[use-tecnicos] Buscando técnicos...");
        setLoading(true);
        setError(null);
        const data = await apiRequest<ApiUser[]>("/users/tecnico");
        console.log("[use-tecnicos] Técnicos recebidos:", data);
        setTecnicos(data);
      } catch (err) {
        setError(
          err instanceof Error ? err.message : "Erro ao buscar técnicos",
        );
      } finally {
        setLoading(false);
      }
    }

    fetchTecnicos();
  }, [refetchTrigger]);

  return { tecnicos, loading, error };
}
