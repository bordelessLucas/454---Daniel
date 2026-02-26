import { apiRequest } from "@/lib/api-client";
import { Sector } from "@/lib/types";

export async function createSetor(
  nome: string,
  descricao?: string,
): Promise<Sector> {
  return apiRequest<Sector>("/setores", {
    method: "POST",
    body: JSON.stringify({
      nome,
      descricao: descricao || undefined,
    }),
  });
}

export async function updateSetor(
  id: number,
  nome?: string,
  descricao?: string,
): Promise<Sector> {
  return apiRequest<Sector>(`/setores/${id}`, {
    method: "PUT",
    body: JSON.stringify({
      nome,
      descricao,
    }),
  });
}

export async function deleteSetor(id: number): Promise<void> {
  return apiRequest<void>(`/setores/${id}`, {
    method: "DELETE",
  });
}
