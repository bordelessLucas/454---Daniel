import { apiRequest } from "@/lib/api-client";
import type { ApiUser, CreateUserPayload } from "@/lib/types";

interface UpdateUsuarioData {
  nome?: string;
  email?: string;
  role?: "ADMIN" | "TECNICO";
  clienteId?: number | null;
  ativo?: boolean;
}

interface ChangePasswordData {
  currentPassword?: string;
  newPassword: string;
}

export async function createUsuario(data: CreateUserPayload): Promise<ApiUser> {
  const payload = {
    username: data.username,
    password: data.password,
    nome: data.nome,
    email: data.email,
    role: data.role,
    ...(typeof data.clienteId === "number" ? { clienteId: data.clienteId } : {}),
  };

  return apiRequest<ApiUser>("/users", {
    method: "POST",
    body: JSON.stringify(payload),
  });
}

export async function updateUsuario(
  id: number,
  data: UpdateUsuarioData,
): Promise<ApiUser> {
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
  return apiRequest<void>(`/users/${id}`, {
    method: "DELETE",
  });
}
