import { useEffect, useState } from "react";
import { apiRequest } from "@/lib/api-client";
import type { ApiUser, Unidade } from "@/lib/types";

function extractUnidadesFromUsers(users: ApiUser[]): Unidade[] {
  const map = new Map<number, Unidade>();

  for (const user of users) {
    if (user.unidadeId == null || user.unidadeId <= 0) {
      continue;
    }

    if (!map.has(user.unidadeId)) {
      map.set(user.unidadeId, {
        id: user.unidadeId,
        nome: user.unidade?.nome?.trim() || `Unidade ${user.unidadeId}`,
      });
    }
  }

  return [...map.values()].sort((a, b) =>
    a.nome.localeCompare(b.nome, "pt-BR"),
  );
}

export function useUnidades(enabled = true, refetchTrigger = 0) {
  const [unidades, setUnidades] = useState<Unidade[]>([]);
  const [loading, setLoading] = useState(enabled);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!enabled) {
      setUnidades([]);
      setLoading(false);
      setError(null);
      return;
    }

    async function fetchUnidades() {
      try {
        setLoading(true);
        setError(null);
        const users = await apiRequest<ApiUser[]>("/users");
        setUnidades(extractUnidadesFromUsers(users));
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
  }, [enabled, refetchTrigger]);

  return { unidades, loading, error };
}
