import { useCallback } from "react";
import type { EventInput } from "@fullcalendar/core";
import {
  fetchCalendarioEventos,
  buildCalendarioRangeFromFullCalendar,
} from "@/lib/calendario-service";
import type { CalendarioEvento, RelatorioAgendaStatus } from "@/lib/types";

const STATUS_COLORS: Record<
  RelatorioAgendaStatus,
  { backgroundColor: string; borderColor: string }
> = {
  AGENDADO: { backgroundColor: "#3b82f6", borderColor: "#2563eb" },
  FINALIZADO: { backgroundColor: "#22c55e", borderColor: "#16a34a" },
  CANCELADO: { backgroundColor: "#ef4444", borderColor: "#dc2626" },
};

function mapEventoToFullCalendar(evento: CalendarioEvento): EventInput {
  const colors =
    STATUS_COLORS[evento.status] ?? STATUS_COLORS.AGENDADO;
  const title =
    evento.title?.trim() || evento.cliente.nomeFantasia || "Visita";

  const tecnicosResumo =
    evento.tecnicos.length > 0
      ? evento.tecnicos.map((t) => t.nome).join(", ")
      : "";

  const displayTitle = tecnicosResumo
    ? `${title} · ${tecnicosResumo}`
    : title;

  return {
    id: String(evento.id),
    title: displayTitle,
    start: evento.start,
    end: evento.end ?? undefined,
    allDay: evento.allDay ?? !evento.start.includes("T"),
    backgroundColor: colors.backgroundColor,
    borderColor: colors.borderColor,
    textColor: "#ffffff",
    classNames:
      evento.status === "CANCELADO" ? ["fc-event-cancelado"] : undefined,
    editable: evento.status === "AGENDADO",
    extendedProps: { evento },
  };
}

export function useCalendarioEventos(tecnicoId?: number) {
  const fetchEvents = useCallback(
    async (start: string, end: string): Promise<EventInput[]> => {
      const range = buildCalendarioRangeFromFullCalendar(start, end);
      const eventos = await fetchCalendarioEventos({
        ...range,
        tecnicoId,
      });
      return eventos.map(mapEventoToFullCalendar);
    },
    [tecnicoId],
  );

  return { fetchEvents };
}
