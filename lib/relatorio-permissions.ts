import type { AuthUser } from "@/lib/types";

/** Admin edita qualquer relatório; técnico apenas os que criou (`criadoPorId`). */
export function userCanEditRelatorio(
  user: Pick<AuthUser, "id" | "role"> | null | undefined,
  criadoPorId: number,
): boolean {
  if (!user) {
    return false;
  }
  if (user.role === "ADMIN") {
    return true;
  }
  return user.id === criadoPorId;
}
