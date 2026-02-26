import { Modal } from "./Modal";
import { Button } from "./Button";
import { Label } from "./Label";
import { Select } from "./Select";
import { Input } from "./Input";

export interface ReportsFilters {
  clientId: string;
  dateStart: string;
  dateEnd: string;
  createdById: string;
  printed: "all" | "yes" | "no";
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
    });
  };

  const handleApply = () => {
    onOpenChange(false);
  };

  return (
    <Modal open={open} onOpenChange={onOpenChange} title="Filtrar Relatórios">
      <p className="mb-4 text-sm text-muted-foreground">
        Aplique filtros para refinar sua busca
      </p>
      <div className="space-y-4">
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

        <div className="grid grid-cols-2 gap-4">
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

        <div className="flex justify-end gap-2 pt-4">
          <Button variant="outline" onClick={handleReset}>
            Limpar Filtros
          </Button>
          <Button onClick={handleApply}>Aplicar Filtros</Button>
        </div>
      </div>
    </Modal>
  );
}
