import type { ApiReport, ReportHorario } from "@/lib/types";

/** "YYYY-MM-DD" para `<input type="date">`. */
export function resolveDataVisitaInput(
  relatorio: Pick<ApiReport, "dataVisita" | "dataVisitaHhmm">,
): string {
  const hhmm = relatorio.dataVisitaHhmm?.trim();
  if (hhmm) {
    return hhmm;
  }

  return relatorio.dataVisita?.slice(0, 10) ?? "";
}

/** Extrai HH:mm de ISO UTC sem aplicar fuso local. */
export function extractHhmmFromIso(iso?: string | null): string {
  if (!iso?.trim()) {
    return "";
  }

  if (!iso.includes("T")) {
    return iso.trim();
  }

  return iso.slice(11, 16);
}

/** "HH:mm" para `<input type="time">` — sem fuso. */
export function resolveHoraChegadaHhmm(
  horario: Pick<ReportHorario, "horaChegada" | "horaChegadaHhmm">,
): string {
  const hhmm = horario.horaChegadaHhmm?.trim();
  if (hhmm) {
    return hhmm;
  }

  return extractHhmmFromIso(horario.horaChegada);
}

export function resolveHoraSaidaHhmm(
  horario: Pick<ReportHorario, "horaSaida" | "horaSaidaHhmm">,
): string {
  const hhmm = horario.horaSaidaHhmm?.trim();
  if (hhmm) {
    return hhmm;
  }

  return extractHhmmFromIso(horario.horaSaida);
}

/** Formata data da visita em pt-BR sem conversão de fuso. */
export function formatDataVisitaBr(
  dateStr?: string | null,
  dataVisitaHhmm?: string | null,
): string {
  const source = dataVisitaHhmm?.trim() || dateStr?.slice(0, 10) || "";
  if (!source) {
    return "";
  }

  const [year, month, day] = source.split("-");
  if (!year || !month || !day) {
    return source;
  }

  return `${day}/${month}/${year}`;
}

/** Interpreta "YYYY-MM-DD" como data local (sem UTC). */
export function parseLocalDate(dateStr: string): Date | null {
  const part = dateStr.trim().slice(0, 10);
  const [year, month, day] = part.split("-").map(Number);
  if (!year || !month || !day) {
    return null;
  }

  const date = new Date(year, month - 1, day);
  return Number.isNaN(date.getTime()) ? null : date;
}

export function computeDurationHhmm(chegada: string, saida: string): string {
  const startMatch = /^(\d{1,2}):(\d{2})/.exec(chegada.trim());
  const endMatch = /^(\d{1,2}):(\d{2})/.exec(saida.trim());
  if (!startMatch || !endMatch) {
    return "00:00";
  }

  const startMinutes = Number(startMatch[1]) * 60 + Number(startMatch[2]);
  const endMinutes = Number(endMatch[1]) * 60 + Number(endMatch[2]);
  const delta = Math.max(0, endMinutes - startMinutes);
  const hours = Math.floor(delta / 60);
  const minutes = delta % 60;
  return `${String(hours).padStart(2, "0")}:${String(minutes).padStart(2, "0")}`;
}

export function normalizeDataVisitaForApi(dateStr: string): string {
  return dateStr.trim().slice(0, 10);
}

export function buildHorariosPayload(
  horarios: Array<{ horaChegada: string; horaSaida: string }>,
): Array<{ horaChegada: string; horaSaida: string }> {
  return horarios
    .filter((horario) => horario.horaChegada?.trim() && horario.horaSaida?.trim())
    .map((horario) => ({
      horaChegada: horario.horaChegada.trim(),
      horaSaida: horario.horaSaida.trim(),
    }));
}
