/** Início do dia local em ISO (para filtro "De"). */
export function dateInputStartToIso(dateValue: string): string {
  if (!dateValue.trim()) {
    return "";
  }
  return new Date(`${dateValue}T00:00:00`).toISOString();
}

/** Fim do dia local em ISO (para filtro "Até"). */
export function dateInputEndToIso(dateValue: string): string {
  if (!dateValue.trim()) {
    return "";
  }
  return new Date(`${dateValue}T23:59:59.999`).toISOString();
}

/** Extrai YYYY-MM-DD de ISO para input date. */
export function isoToDateInput(iso: string | null | undefined): string {
  if (!iso?.trim()) {
    return "";
  }
  return iso.slice(0, 10);
}
