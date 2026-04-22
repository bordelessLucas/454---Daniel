import { apiRequest } from "@/lib/api-client";
import { RamoAtividade } from "@/lib/types";

export async function createRamoAtividade(
  nome: string,
): Promise<RamoAtividade> {
  return apiRequest<RamoAtividade>("/ramos", {
    method: "POST",
    body: JSON.stringify({ nome }),
  });
}

export async function updateRamoAtividade(
  id: number,
  nome: string,
): Promise<RamoAtividade> {
  return apiRequest<RamoAtividade>(`/ramos/${id}`, {
    method: "PUT",
    body: JSON.stringify({ nome }),
  });
}

export async function deleteRamoAtividade(id: number): Promise<void> {
  return apiRequest<void>(`/ramos/${id}`, {
    method: "DELETE",
  });
}
