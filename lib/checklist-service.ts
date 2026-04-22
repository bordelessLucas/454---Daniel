import { apiRequest } from "./api-client";
import type { ApiChecklist } from "./types";

type ChecklistItemInput = {
  texto: string;
  ordem: number;
};

export interface CreateChecklistPayload {
  nome: string;
  descricao?: string;
  itens?: ChecklistItemInput[];
}

export interface UpdateChecklistPayload {
  nome?: string;
  descricao?: string;
  itens?: ChecklistItemInput[];
  ativo?: boolean;
}

export async function createChecklist(
  data: CreateChecklistPayload,
): Promise<ApiChecklist> {
  return apiRequest<ApiChecklist>("/checklists", {
    method: "POST",
    body: JSON.stringify(data),
  });
}

export async function updateChecklist(
  id: number,
  data: UpdateChecklistPayload,
): Promise<ApiChecklist> {
  return apiRequest<ApiChecklist>(`/checklists/${id}`, {
    method: "PUT",
    body: JSON.stringify(data),
  });
}

export async function deleteChecklist(id: number): Promise<void> {
  return apiRequest<void>(`/checklists/${id}`, {
    method: "DELETE",
  });
}

export async function getChecklists(): Promise<ApiChecklist[]> {
  return apiRequest<ApiChecklist[]>("/checklists");
}
