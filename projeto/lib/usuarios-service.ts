import { apiRequest } from "@/lib/api-client";
import type { ApiUser } from "@/lib/types";

interface CreateUsuarioData {
  username: string;
  password: string;
  nome: string;
  email: string;
  role: "ADMIN" | "TECNICO";
  clienteId?: number | null;
}

interface UpdateUsuarioData {
  nome?: string;
  email?: string;
  role?: "ADMIN" | "TECNICO";
  clienteId?: number | null;
  ativo?: boolean;
}

interface ChangePasswordData {
  currentPassword: string;
  newPassword: string;
}

export async function createUsuario(data: CreateUsuarioData): Promise<ApiUser> {
  console.log("[usuarios-service] Criando usuário:", data);
  return apiRequest<ApiUser>("/users", {
    method: "POST",
    body: JSON.stringify(data),
  });
}

export async function updateUsuario(
  id: number,
  data: UpdateUsuarioData,
): Promise<ApiUser> {
  console.log("[usuarios-service] Atualizando usuário:", id, data);
  return apiRequest<ApiUser>(`/users/${id}`, {
    method: "PUT",
    body: JSON.stringify(data),
  });
}

export async function changePassword(
  id: number,
  data: ChangePasswordData,
): Promise<{ message: string }> {
  return apiRequest<{ message: string }>(`/users/${id}/password`, {
    method: "PUT",
    body: JSON.stringify(data),
  });
}

export async function deleteUsuario(id: number): Promise<void> {
  console.log("[usuarios-service] Deletando usuário:", id);
  return apiRequest<void>(`/users/${id}`, {
    method: "DELETE",
  });
}
