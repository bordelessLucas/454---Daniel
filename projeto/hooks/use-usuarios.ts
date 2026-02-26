import { useState, useEffect } from "react";
import { apiRequest } from "@/lib/api-client";
import type { ApiUser } from "@/lib/types";

export function useUsuarios(refetchTrigger = 0) {
  const [usuarios, setUsuarios] = useState<ApiUser[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    async function fetchUsuarios() {
      console.log("[use-usuarios] Iniciando busca de usuários...");
      setLoading(true);
      setError(null);
      try {
        console.log("[use-usuarios] Fazendo requisição GET /users");
        const data = await apiRequest<ApiUser[]>("/users", {
          method: "GET",
        });
        console.log("[use-usuarios] Resposta recebida:", data);
        console.log("[use-usuarios] Tipo da resposta:", typeof data);
        console.log("[use-usuarios] É array?", Array.isArray(data));
        console.log("[use-usuarios] Quantidade de usuários:", data?.length);
        setUsuarios(data);
        console.log("[use-usuarios] Estado atualizado com sucesso");
      } catch (err) {
        console.error("[use-usuarios] ERRO ao buscar usuários:", err);
        console.error(
          "[use-usuarios] Erro completo:",
          JSON.stringify(err, null, 2),
        );
        setError(err instanceof Error ? err.message : "Erro desconhecido");
      } finally {
        setLoading(false);
        console.log("[use-usuarios] Loading finalizado");
      }
    }

    fetchUsuarios();
  }, [refetchTrigger]);

  return { usuarios, loading, error };
}
