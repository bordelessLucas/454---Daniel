import type { ActivityAction, ActivityEntity, UserRole } from "@/lib/types";

export const ACTIVITY_ACTION_OPTIONS: ReadonlyArray<{
  value: ActivityAction;
  label: string;
}> = [
  { value: "CREATE", label: "Criação" },
  { value: "UPDATE", label: "Atualização" },
  { value: "DELETE", label: "Exclusão" },
  { value: "LOGIN", label: "Login" },
  { value: "RESET_PASSWORD", label: "Redefinição de senha" },
  { value: "CHANGE_PASSWORD", label: "Alteração de senha" },
  { value: "UPLOAD", label: "Upload de arquivo" },
];

export const ACTIVITY_ENTITY_OPTIONS: ReadonlyArray<{
  value: ActivityEntity;
  label: string;
}> = [
  { value: "USER", label: "Usuário" },
  { value: "CLIENTE", label: "Cliente" },
  { value: "RELATORIO", label: "Relatório" },
  { value: "CHECKLIST", label: "Checklist" },
  { value: "SETOR", label: "Setor" },
  { value: "RAMO_ATIVIDADE", label: "Ramo de atividade" },
  { value: "CONFIGURACAO", label: "Configuração" },
  { value: "AUTH", label: "Autenticação" },
];

export const USER_ROLE_LABELS: Record<UserRole, string> = {
  ADMIN: "Administrador",
  TECNICO: "Técnico",
};

const ACTION_LABEL_MAP = Object.fromEntries(
  ACTIVITY_ACTION_OPTIONS.map((item) => [item.value, item.label]),
) as Record<ActivityAction, string>;

const ENTITY_LABEL_MAP = Object.fromEntries(
  ACTIVITY_ENTITY_OPTIONS.map((item) => [item.value, item.label]),
) as Record<ActivityEntity, string>;

export function getActivityActionLabel(acao: ActivityAction): string {
  return ACTION_LABEL_MAP[acao] ?? acao;
}

export function getActivityEntityLabel(entidade: ActivityEntity): string {
  return ENTITY_LABEL_MAP[entidade] ?? entidade;
}

export const ACTIVITY_ACTION_BADGE_CLASS: Record<ActivityAction, string> = {
  CREATE: "border-transparent bg-emerald-600 text-white",
  UPDATE: "border-transparent bg-blue-600 text-white",
  DELETE: "border-transparent bg-red-600 text-white",
  LOGIN: "border-transparent bg-muted text-muted-foreground",
  RESET_PASSWORD: "border-transparent bg-orange-500 text-white",
  CHANGE_PASSWORD: "border-transparent bg-orange-500 text-white",
  UPLOAD: "border-transparent bg-violet-600 text-white",
};

export const USER_ROLE_BADGE_CLASS: Record<UserRole, string> = {
  ADMIN: "border-transparent bg-blue-700 text-white",
  TECNICO: "border-transparent bg-muted text-muted-foreground",
};

export function formatActivityEntityDisplay(
  entidade: ActivityEntity,
  entidadeId: number | null,
): string {
  const label = getActivityEntityLabel(entidade);
  if (entidadeId == null) {
    return label;
  }
  return `${label} #${entidadeId}`;
}

export function formatActivityTimestamp(iso: string): string {
  const date = new Date(iso);
  if (Number.isNaN(date.getTime())) {
    return iso;
  }
  return new Intl.DateTimeFormat("pt-BR", {
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
    second: "2-digit",
    hour12: false,
  }).format(date);
}
