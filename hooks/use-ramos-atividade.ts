import { useEffect, useState } from "react";
import { RamoAtividade } from "@/lib/types";
import { apiRequest } from "@/lib/api-client";

export function useRamosAtividade(refetchTrigger?: number) {
  const [ramos, setRamos] = useState<RamoAtividade[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    async function fetchRamos() {
      try {
        setLoading(true);
        setError(null);
        const data = await apiRequest<RamoAtividade[]>("/ramos");
        setRamos(data);
      } catch (err) {
        setError(
          err instanceof Error
            ? err.message
            : "Erro ao buscar ramos de atividade",
        );
      } finally {
        setLoading(false);
      }
    }

    fetchRamos();
  }, [refetchTrigger]);

  return { ramos, loading, error };
}
