import { useCallback, useState } from "react";
import { reagendarRelatorioDataVisita } from "@/lib/calendario-service";
import type { ReagendarDataVisitaPayload } from "@/lib/types";

export function useReagendarRelatorio() {
  const [loading, setLoading] = useState(false);

  const reagendar = useCallback(
    async (relatorioId: number, payload: ReagendarDataVisitaPayload) => {
      setLoading(true);
      try {
        await reagendarRelatorioDataVisita(relatorioId, payload);
      } finally {
        setLoading(false);
      }
    },
    [],
  );

  return { reagendar, loading };
}
