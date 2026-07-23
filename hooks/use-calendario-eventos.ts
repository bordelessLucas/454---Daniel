import { useCallback } from "react";
import type { EventInput } from "@fullcalendar/core";
import {
  fetchCalendarioEventos,
  buildCalendarioRangeFromFullCalendar,
} from "@/lib/calendario-service";
import type { CalendarioEvento } from "@/lib/types";

export function mapEventoToFullCalendar(evento: CalendarioEvento): EventInput {
  const subtitle = evento.clienteNome?.trim();
  const displayTitle = subtitle
    ? `${evento.title} · ${subtitle}`
    : evento.title;

  return {
    id: String(evento.id),
    title: displayTitle,
    start: evento.start,
    end: evento.end ?? undefined,
    allDay: evento.allDay !== false,
    classNames: ["calendario-evento"],
    editable: true,
    extendedProps: {
      evento,
      dataInicio: evento.dataInicio,
      dataFim: evento.dataFim,
      descricao: evento.descricao,
      clienteId: evento.clienteId,
      clienteNome: evento.clienteNome,
      criadoPorId: evento.criadoPorId,
      criadoPorNome: evento.criadoPorNome,
    },
  };
}

export interface UseCalendarioEventosOptions {
  criadoPorId?: number;
  clienteId?: number;
}

export function useCalendarioEventos(
  options: UseCalendarioEventosOptions | number | undefined = {},
) {
  const normalized: UseCalendarioEventosOptions =
    typeof options === "number"
      ? { criadoPorId: options }
      : (options ?? {});

  const { criadoPorId, clienteId } = normalized;

  const fetchEvents = useCallback(
    async (start: string, end: string): Promise<EventInput[]> => {
      const range = buildCalendarioRangeFromFullCalendar(start, end);
      const eventos = await fetchCalendarioEventos({
        ...range,
        criadoPorId,
        clienteId,
      });
      return eventos.map(mapEventoToFullCalendar);
    },
    [criadoPorId, clienteId],
  );

  return { fetchEvents };
}
