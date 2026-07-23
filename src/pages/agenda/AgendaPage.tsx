import { useEffect, useMemo, useState } from "react";
import { Plus } from "lucide-react";
import { useAuth } from "@/lib/auth-context";
import { useTecnicos } from "@/hooks/use-tecnicos";
import { PageHeader } from "@/components/page-header";
import { VisitCalendar } from "@/components/agenda/VisitCalendar";
import { Button, Label, Select } from "@/components/index";

export default function AgendaPage() {
  const { isAdmin } = useAuth();
  const { tecnicos, loading: loadingTecnicos } = useTecnicos();
  const [criadoPorFilter, setCriadoPorFilter] = useState<string>("all");
  const [novoEventoOpen, setNovoEventoOpen] = useState(false);
  const [refreshKey, setRefreshKey] = useState(0);

  const criadoPorId = useMemo(() => {
    if (!isAdmin || criadoPorFilter === "all") {
      return undefined;
    }
    return Number(criadoPorFilter);
  }, [isAdmin, criadoPorFilter]);

  useEffect(() => {
    if (!isAdmin) {
      setCriadoPorFilter("all");
    }
  }, [isAdmin]);

  return (
    <div className="flex min-h-[32rem] flex-col gap-4 md:h-[calc(100vh-7rem)]">
      <PageHeader
        title="Calendário"
        description="Organize demandas e eventos da equipe. Não cria relatório de visita."
        action={
          <Button type="button" onClick={() => setNovoEventoOpen(true)}>
            <Plus className="mr-2 h-4 w-4" />
            Novo evento
          </Button>
        }
      />

      {isAdmin ? (
        <div className="flex flex-wrap items-end gap-3">
          <div className="min-w-[12rem] flex-1 space-y-2 sm:max-w-xs">
            <Label htmlFor="agenda-criado-por">Criado por</Label>
            <Select
              id="agenda-criado-por"
              value={criadoPorFilter}
              disabled={loadingTecnicos}
              onChange={(event) => setCriadoPorFilter(event.target.value)}
            >
              <option value="all">Todos</option>
              {tecnicos.map((tecnico) => (
                <option key={tecnico.id} value={String(tecnico.id)}>
                  {tecnico.nome}
                </option>
              ))}
            </Select>
          </div>
        </div>
      ) : null}

      <VisitCalendar
        criadoPorId={criadoPorId}
        refreshKey={refreshKey}
        novoAgendamentoOpen={novoEventoOpen}
        onNovoAgendamentoOpenChange={setNovoEventoOpen}
        onAgendamentoCreated={() => setRefreshKey((prev) => prev + 1)}
      />
    </div>
  );
}
