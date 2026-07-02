import type { ApiConfiguracoes } from "@/lib/types";

export function hhmmToMinutes(hhmm: string): number {
  const [h, m] = hhmm.split(":").map(Number);
  if (Number.isNaN(h) || Number.isNaN(m)) {
    return 0;
  }
  return h * 60 + m;
}

export function horarioFromConfig(config: Pick<
  ApiConfiguracoes,
  "horaInicio" | "horaFim" | "dataInicio" | "dataFim"
>): { inicio: string; fim: string } {
  return {
    inicio:
      config.horaInicio?.trim() ||
      config.dataInicio?.slice(11, 16) ||
      "08:00",
    fim:
      config.horaFim?.trim() || config.dataFim?.slice(11, 16) || "18:00",
  };
}

export function isHorarioAtualDentroDoIntervalo(
  horaInicio: string,
  horaFim: string,
  agora = new Date(),
): boolean {
  const start = hhmmToMinutes(horaInicio);
  const end = hhmmToMinutes(horaFim);
  const now = agora.getHours() * 60 + agora.getMinutes();

  if (start <= end) {
    return now >= start && now <= end;
  }

  return now >= start || now <= end;
}
