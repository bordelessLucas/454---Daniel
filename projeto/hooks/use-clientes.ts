import { useEffect, useState } from "react";
import type { Client } from "@/lib/types";
import { apiRequest } from "@/lib/api-client";

interface ClientesFilters {
  nomeFantasia?: string;
  cnpj?: string;
  ramoAtividadeId?: number;
}

export function useClientes(filters?: ClientesFilters) {
  const [clientes, setClientes] = useState<Client[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    async function fetchClientes() {
      try {
        setLoading(true);
        setError(null);

        const params = new URLSearchParams();
        if (filters?.nomeFantasia) {
          params.append("nomeFantasia", filters.nomeFantasia);
        }
        if (filters?.cnpj) {
          params.append("cnpj", filters.cnpj);
        }
        if (filters?.ramoAtividadeId) {
          params.append("ramoAtividadeId", filters.ramoAtividadeId.toString());
        }

        const queryString = params.toString();
        const endpoint = queryString ? `/clientes?${queryString}` : "/clientes";

        const data = await apiRequest<Client[]>(endpoint);
        setClientes(data);
      } catch (err) {
        const message =
          err instanceof Error ? err.message : "Erro ao buscar clientes";
        setError(message);
        console.error("Erro ao buscar clientes:", err);
      } finally {
        setLoading(false);
      }
    }

    fetchClientes();
  }, [filters?.nomeFantasia, filters?.cnpj, filters?.ramoAtividadeId]);

  return { clientes, loading, error };
}
