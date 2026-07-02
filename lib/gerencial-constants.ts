import type { GerencialFormato, GerencialTipo, UserRole } from "@/lib/types";

export const GERENCIAL_TIPOS = [
  { value: "resumo-cliente", label: "Resumo por Cliente" },
  { value: "produtividade-tecnico", label: "Produtividade por Técnico" },
  { value: "sla-contratos", label: "SLA de Contratos" },
] as const satisfies ReadonlyArray<{ value: GerencialTipo; label: string }>;

export const GERENCIAL_FORMATOS = [
  { value: "json", label: "Visualizar" },
  { value: "xlsx", label: "Exportar Excel" },
] as const satisfies ReadonlyArray<{ value: GerencialFormato; label: string }>;

const TECNICO_ALLOWED_TIPOS: GerencialTipo[] = ["resumo-cliente"];

export function getGerencialTiposForRole(
  role: UserRole | undefined,
): ReadonlyArray<(typeof GERENCIAL_TIPOS)[number]> {
  if (role === "ADMIN") {
    return GERENCIAL_TIPOS;
  }
  return GERENCIAL_TIPOS.filter((item) =>
    TECNICO_ALLOWED_TIPOS.includes(item.value),
  );
}

export function isGerencialTipoAllowedForRole(
  tipo: GerencialTipo,
  role: UserRole | undefined,
): boolean {
  if (role === "ADMIN") {
    return true;
  }
  return TECNICO_ALLOWED_TIPOS.includes(tipo);
}

export function canUseGerencialUnidadeFilter(
  role: UserRole | undefined,
): boolean {
  return role === "ADMIN";
}

export function parseGerencialTipo(value: string | null): GerencialTipo {
  const match = GERENCIAL_TIPOS.find((item) => item.value === value);
  return match?.value ?? "resumo-cliente";
}

export function parseGerencialFormato(value: string | null): GerencialFormato {
  return value === "xlsx" ? "xlsx" : "json";
}
