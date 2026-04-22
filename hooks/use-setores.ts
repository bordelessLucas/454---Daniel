import { useEffect, useState } from "react";
import { Sector } from "@/lib/types";
import { apiRequest } from "@/lib/api-client";

export function useSetores(refetchTrigger?: number) {
  const [setores, setSetores] = useState<Sector[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    async function fetchSetores() {
      try {
        setLoading(true);
        setError(null);
        const data = await apiRequest<Sector[]>("/setores");
        setSetores(data);
      } catch (err) {
        setError(err instanceof Error ? err.message : "Erro ao buscar setores");
      } finally {
        setLoading(false);
      }
    }

    fetchSetores();
  }, [refetchTrigger]);

  return { setores, loading, error };
}
