import { Modal, ModalFooter } from "./Modal";
import { Button } from "./Button";
import { Label } from "./Label";
import { Select } from "./Select";
import { Input } from "./Input";
import type { RelatorioAgendaStatus } from "@/lib/types";
import { RELATORIO_AGENDA_STATUS_LABELS } from "@/lib/relatorio-status";

export type ReportsAgendaStatusFilter = "all" | RelatorioAgendaStatus;

export interface ReportsFilters {
  clientId: string;
  dateStart: string;
  dateEnd: string;
  createdById: string;
  printed: "all" | "yes" | "no";
  agendaStatus: ReportsAgendaStatusFilter;
}

interface ReportsFilterModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  filters: ReportsFilters;
  onFiltersChange: (filters: ReportsFilters) => void;
  clients: Array<{ id: string; name: string }>;
  users: Array<{ id: string; name: string }>;
}

export function ReportsFilterModal({
  open,
  onOpenChange,
  filters,
  onFiltersChange,
  clients,
  users,
}: ReportsFilterModalProps) {
  const handleReset = () => {
    onFiltersChange({
      clientId: "all",
      dateStart: "",
      dateEnd: "",
      createdById: "all",
      printed: "all",
      agendaStatus: "all",
    });
  };

  const handleApply = () => {
    onOpenChange(false);
  };

  return (
    <Modal
      open={open}
      onOpenChange={onOpenChange}
      title="Filtrar Relatórios"
      description="Aplique filtros para refinar sua busca"
    >
      <div className="space-y-5">
        <div className="space-y-2">
          <Label htmlFor="filter-client">Cliente</Label>
          <Select
            id="filter-client"
            value={filters.clientId}
            onChange={(e) =>
              onFiltersChange({ ...filters, clientId: e.target.value })
            }
          >
            <option value="all">Todos os clientes</option>
            {clients.map((client) => (
              <option key={client.id} value={client.id}>
                {client.name}
              </option>
            ))}
          </Select>
        </div>

        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
          <div className="space-y-2">
            <Label htmlFor="filter-date-start">Data Início</Label>
            <Input
              id="filter-date-start"
              type="date"
              value={filters.dateStart}
              onChange={(e) =>
                onFiltersChange({ ...filters, dateStart: e.target.value })
              }
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="filter-date-end">Data Fim</Label>
            <Input
              id="filter-date-end"
              type="date"
              value={filters.dateEnd}
              onChange={(e) =>
                onFiltersChange({ ...filters, dateEnd: e.target.value })
              }
            />
          </div>
        </div>

        <div className="space-y-2">
          <Label htmlFor="filter-created-by">Criado por</Label>
          <Select
            id="filter-created-by"
            value={filters.createdById}
            onChange={(e) =>
              onFiltersChange({ ...filters, createdById: e.target.value })
            }
          >
            <option value="all">Todos os usuários</option>
            {users.map((user) => (
              <option key={user.id} value={user.id}>
                {user.name}
              </option>
            ))}
          </Select>
        </div>

        <div className="space-y-2">
          <Label htmlFor="filter-agenda-status">Status da visita</Label>
          <Select
            id="filter-agenda-status"
            value={filters.agendaStatus}
            onChange={(e) =>
              onFiltersChange({
                ...filters,
                agendaStatus: e.target.value as ReportsAgendaStatusFilter,
              })
            }
          >
            <option value="all">Todos</option>
            {(
              Object.keys(RELATORIO_AGENDA_STATUS_LABELS) as RelatorioAgendaStatus[]
            ).map((status) => (
              <option key={status} value={status}>
                {RELATORIO_AGENDA_STATUS_LABELS[status]}
              </option>
            ))}
          </Select>
        </div>

        <div className="space-y-2">
          <Label htmlFor="filter-printed">Impresso</Label>
          <Select
            id="filter-printed"
            value={filters.printed}
            onChange={(e) =>
              onFiltersChange({
                ...filters,
                printed: e.target.value as "all" | "yes" | "no",
              })
            }
          >
            <option value="all">Todos</option>
            <option value="yes">Sim</option>
            <option value="no">Não</option>
          </Select>
        </div>

        <ModalFooter className="mt-2 [&_button]:w-full sm:[&_button]:w-auto">
          <Button variant="outline" onClick={handleReset}>
            Limpar Filtros
          </Button>
          <Button onClick={handleApply}>Aplicar Filtros</Button>
        </ModalFooter>
      </div>
    </Modal>
  );
}
