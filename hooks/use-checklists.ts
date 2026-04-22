import { useEffect, useState } from "react";
import { getChecklists } from "@/lib/checklist-service";
import type { ApiChecklist } from "@/lib/types";

export function useChecklists(refetchTrigger = 0) {
  const [checklists, setChecklists] = useState<ApiChecklist[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    async function fetchChecklists() {
      try {
        setLoading(true);
        setError(null);
        const data = await getChecklists();
        setChecklists(data);
      } catch (err) {
        setError(
          err instanceof Error ? err.message : "Erro ao buscar checklists",
        );
      } finally {
        setLoading(false);
      }
    }

    fetchChecklists();
  }, [refetchTrigger]);

  return { checklists, loading, error };
}
