import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { useReports } from "@/lib/reports-context";
import {
  mockClients,
  mockTechnicians,
  mockChecklists,
  mockSectors,
} from "@/lib/mock-data";
import type {
  Report,
  ServiceModality,
  ReportShift,
  ReportChecklistItem,
} from "@/lib/types";
import {
  Badge,
  Button,
  Checkbox,
  Input,
  Label,
  Select,
  Separator,
  Textarea,
} from "@/components/index";
import {
  Plus,
  Trash2,
  Save,
  CheckCircle2,
  FileDown,
  ArrowLeft,
  X,
} from "lucide-react";
import { toast } from "sonner";

const SERVICE_MODALITIES: ServiceModality[] = [
  "Sem contrato - Remoto",
  "Sem contrato - Local",
  "Contrato - Local",
  "Contrato - Remoto",
];

const SHIFT_LABELS = {
  manha: "Manhã",
  tarde: "Tarde",
  noite: "Noite",
} as const;

interface ReportFormProps {
  reportId?: string;
}

export function ReportForm({ reportId }: ReportFormProps) {
  const navigate = useNavigate();
  const { addReport, updateReport, getReport } = useReports();
  const isEditing = !!reportId;

  const [date, setDate] = useState("");
  const [clientId, setClientId] = useState("");
  const [contact, setContact] = useState("");
  const [modality, setModality] = useState<ServiceModality>(
    "Sem contrato - Remoto",
  );
  const [selectedTechnicians, setSelectedTechnicians] = useState<string[]>([]);
  const [selectedSectors, setSelectedSectors] = useState<string[]>([]);
  const [serviceDetails, setServiceDetails] = useState("");
  const [checklistItems, setChecklistItems] = useState<ReportChecklistItem[]>(
    [],
  );
  const [shifts, setShifts] = useState<ReportShift[]>([]);
  const [clientSearch, setClientSearch] = useState("");

  useEffect(() => {
    if (isEditing) {
      const report = getReport(reportId);
      if (report) {
        setDate(report.date);
        setClientId(report.clientId);
        setContact(report.contact);
        setModality(report.modality);
        setSelectedTechnicians(report.technicianIds);
        setSelectedSectors(report.sectorIds);
        setServiceDetails(report.serviceDetails);
        setChecklistItems(report.checklistItems);
        setShifts(report.shifts);
      }
    } else {
      const today = new Date().toISOString().split("T")[0];
      setDate(today);
      const allItems: ReportChecklistItem[] = [];
      for (const cl of mockChecklists) {
        for (const item of cl.items) {
          allItems.push({
            checklistId: cl.id,
            itemId: item.id,
            checked: false,
          });
        }
      }
      setChecklistItems(allItems);
    }
  }, [isEditing, reportId, getReport]);

  useEffect(() => {
    if (clientId) {
      const client = mockClients.find((c) => c.id === clientId);
      if (client) {
        setContact(client.contact);
      }
    }
  }, [clientId]);

  const filteredClients = clientSearch
    ? mockClients.filter((c) =>
        c.name.toLowerCase().includes(clientSearch.toLowerCase()),
      )
    : mockClients;

  function toggleTechnician(techId: string) {
    setSelectedTechnicians((prev) =>
      prev.includes(techId)
        ? prev.filter((id) => id !== techId)
        : [...prev, techId],
    );
  }

  function toggleSector(sectorId: string) {
    setSelectedSectors((prev) =>
      prev.includes(sectorId)
        ? prev.filter((id) => id !== sectorId)
        : [...prev, sectorId],
    );
  }

  function toggleChecklistItem(checklistId: string, itemId: string) {
    setChecklistItems((prev) =>
      prev.map((ci) =>
        ci.checklistId === checklistId && ci.itemId === itemId
          ? { ...ci, checked: !ci.checked }
          : ci,
      ),
    );
  }

  function addShift() {
    const newShift: ReportShift = {
      id: crypto.randomUUID(),
      shift: "manha",
      startTime: "08:00",
      endTime: "12:00",
    };
    setShifts((prev) => [...prev, newShift]);
  }

  function removeShift(id: string) {
    setShifts((prev) => prev.filter((s) => s.id !== id));
  }

  function updateShift(id: string, field: keyof ReportShift, value: string) {
    setShifts((prev) =>
      prev.map((s) => (s.id === id ? { ...s, [field]: value } : s)),
    );
  }

  function buildReport(status: "rascunho" | "finalizado"): Report {
    const client = mockClients.find((c) => c.id === clientId);
    const techNames = selectedTechnicians
      .map((id) => mockTechnicians.find((t) => t.id === id)?.name ?? "")
      .filter(Boolean);
    const sectorNames = selectedSectors
      .map((id) => mockSectors.find((s) => s.id === id)?.name ?? "")
      .filter(Boolean);

    return {
      id: isEditing ? reportId : crypto.randomUUID(),
      date,
      clientId,
      clientName: client?.name ?? "",
      contact,
      modality,
      technicianIds: selectedTechnicians,
      technicianNames: techNames,
      sectorIds: selectedSectors,
      sectorNames: sectorNames,
      serviceDetails,
      checklistItems,
      shifts,
      status,
      createdAt: isEditing
        ? (getReport(reportId)?.createdAt ?? new Date().toISOString())
        : new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };
  }

  function handleSaveDraft() {
    const report = buildReport("rascunho");
    if (isEditing) {
      updateReport(report);
      toast.success("Rascunho atualizado.");
    } else {
      addReport(report);
      toast.success("Rascunho salvo.");
    }
    navigate("/dashboard/relatorios");
  }

  function handleFinalize() {
    if (!clientId || !date) {
      toast.error("Preencha ao menos a data e o cliente.");
      return;
    }
    const report = buildReport("finalizado");
    if (isEditing) {
      updateReport(report);
      toast.success("Relatório finalizado.");
    } else {
      addReport(report);
      toast.success("Relatório criado e finalizado.");
    }
    navigate("/dashboard/relatorios");
  }

  return (
    <div className="mx-auto max-w-4xl">
      <div className="sticky top-0 z-20 -mx-4 mb-6 flex items-center gap-3 border-b border-border bg-background/95 px-4 py-3 backdrop-blur">
        <Button
          variant="ghost"
          size="icon"
          onClick={() => navigate(-1)}
          aria-label="Voltar"
        >
          <ArrowLeft className="h-4 w-4" />
        </Button>
        <h1 className="text-2xl font-semibold tracking-tight text-foreground">
          {isEditing ? "Editar Relatório" : "Novo Relatório"}
        </h1>
      </div>

      <div className="flex flex-col gap-8">
        {/* Section 1 - General Info */}
        <section className="rounded-2xl border border-border p-6">
          <h2 className="mb-4 text-lg font-medium text-foreground">
            Informações Gerais
          </h2>
          <div className="grid gap-4 sm:grid-cols-2">
            <div className="flex flex-col gap-2">
              <Label htmlFor="report-date">Data</Label>
              <Input
                id="report-date"
                type="date"
                value={date}
                onChange={(e) => setDate(e.target.value)}
              />
            </div>
            <div className="flex flex-col gap-2">
              <Label htmlFor="report-modality">Modalidade do Serviço</Label>
              <Select
                id="report-modality"
                value={modality}
                onChange={(event) =>
                  setModality(event.target.value as ServiceModality)
                }
              >
                {SERVICE_MODALITIES.map((m) => (
                  <option key={m} value={m}>
                    {m}
                  </option>
                ))}
              </Select>
            </div>
            <div className="flex flex-col gap-2 sm:col-span-2">
              <Label>Cliente</Label>
              <Input
                placeholder="Buscar cliente..."
                value={clientSearch}
                onChange={(e) => setClientSearch(e.target.value)}
                className="mb-2"
              />
              <div className="flex max-h-32 flex-col gap-1 overflow-y-auto rounded-xl border border-border p-2">
                {filteredClients.map((client) => (
                  <button
                    key={client.id}
                    type="button"
                    onClick={() => {
                      setClientId(client.id);
                      setClientSearch("");
                    }}
                    className={`rounded-lg px-3 py-2 text-left text-sm transition-colors ${
                      clientId === client.id
                        ? "bg-primary text-primary-foreground"
                        : "hover:bg-muted text-foreground"
                    }`}
                  >
                    {client.name}
                    <span className="ml-2 text-xs opacity-70">
                      {client.city}
                    </span>
                  </button>
                ))}
              </div>
            </div>
            <div className="flex flex-col gap-2">
              <Label htmlFor="report-contact">Contato</Label>
              <Input
                id="report-contact"
                value={contact}
                onChange={(e) => setContact(e.target.value)}
              />
            </div>
            <div className="flex flex-col gap-2">
              <Label>Técnicos Envolvidos</Label>
              <div className="flex flex-wrap gap-2">
                {mockTechnicians
                  .filter((t) => t.status === "ativo")
                  .map((tech) => (
                    <button
                      key={tech.id}
                      type="button"
                      onClick={() => toggleTechnician(tech.id)}
                      className="inline-block"
                    >
                      <Badge
                        variant={
                          selectedTechnicians.includes(tech.id)
                            ? "default"
                            : "outline"
                        }
                        className="cursor-pointer"
                      >
                        {tech.name}
                      </Badge>
                    </button>
                  ))}
              </div>
            </div>
            <div className="flex flex-col gap-2 sm:col-span-2">
              <Label>Setores</Label>
              <div className="flex flex-wrap gap-2">
                {mockSectors.map((sector) => (
                  <button
                    key={sector.id}
                    type="button"
                    onClick={() => toggleSector(sector.id)}
                    className="inline-block"
                  >
                    <Badge
                      variant={
                        selectedSectors.includes(sector.id)
                          ? "default"
                          : "outline"
                      }
                      className="cursor-pointer"
                    >
                      {sector.name}
                    </Badge>
                  </button>
                ))}
              </div>
            </div>
          </div>
        </section>

        {/* Section 2 - Service Details */}
        <section className="rounded-2xl border border-border p-6">
          <h2 className="mb-4 text-lg font-medium text-foreground">
            Detalhes do Serviço
          </h2>
          <div className="flex flex-col gap-2">
            <div className="flex flex-wrap gap-2 rounded-t-xl border border-b-0 border-border bg-muted p-2">
              <Button
                type="button"
                variant="ghost"
                size="sm"
                className="h-7 text-xs"
                onClick={() => setServiceDetails((prev) => `${prev}<b></b>`)}
              >
                <span className="font-bold">B</span>
              </Button>
              <Button
                type="button"
                variant="ghost"
                size="sm"
                className="h-7 text-xs"
                onClick={() => setServiceDetails((prev) => `${prev}<i></i>`)}
              >
                <span className="italic">I</span>
              </Button>
              <Button
                type="button"
                variant="ghost"
                size="sm"
                className="h-7 text-xs"
                onClick={() => setServiceDetails((prev) => `${prev}<h3></h3>`)}
              >
                H
              </Button>
              <Button
                type="button"
                variant="ghost"
                size="sm"
                className="h-7 text-xs"
                onClick={() =>
                  setServiceDetails((prev) => `${prev}<ul><li></li></ul>`)
                }
              >
                Lista
              </Button>
            </div>
            <Textarea
              value={serviceDetails}
              onChange={(e) => setServiceDetails(e.target.value)}
              rows={8}
              className="rounded-t-none"
              placeholder="Descreva os detalhes do serviço realizado..."
            />
          </div>
        </section>

        {/* Section 3 - Checklists */}
        <section className="rounded-2xl border border-border p-6">
          <h2 className="mb-4 text-lg font-medium text-foreground">
            Checklists
          </h2>
          <div className="flex flex-col gap-6">
            {mockChecklists.map((checklist) => (
              <div key={checklist.id}>
                <h3 className="mb-3 text-sm font-medium text-foreground">
                  {checklist.name}
                </h3>
                <div className="flex flex-col gap-2">
                  {checklist.items.map((item) => {
                    const ci = checklistItems.find(
                      (c) =>
                        c.checklistId === checklist.id && c.itemId === item.id,
                    );
                    return (
                      <label
                        key={item.id}
                        className="flex cursor-pointer items-center gap-3 rounded-lg px-3 py-2 transition-colors hover:bg-muted"
                      >
                        <Checkbox
                          checked={ci?.checked ?? false}
                          onCheckedChange={() =>
                            toggleChecklistItem(checklist.id, item.id)
                          }
                        />
                        <span className="text-sm text-foreground">
                          {item.text}
                        </span>
                      </label>
                    );
                  })}
                </div>
                <Separator className="mt-4" />
              </div>
            ))}
          </div>
        </section>

        {/* Section 4 - Shifts */}
        <section className="rounded-2xl border border-border p-6">
          <div className="mb-4 flex items-center justify-between">
            <h2 className="text-lg font-medium text-foreground">Horários</h2>
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={addShift}
            >
              <Plus className="mr-2 h-4 w-4" />
              Adicionar Turno
            </Button>
          </div>
          {shifts.length === 0 ? (
            <p className="py-4 text-center text-sm text-muted-foreground">
              Nenhum turno adicionado. Clique em "Adicionar Turno" para começar.
            </p>
          ) : (
            <div className="flex flex-col gap-3">
              {shifts.map((shift) => (
                <div
                  key={shift.id}
                  className="flex flex-wrap items-end gap-3 rounded-xl bg-muted p-3"
                >
                  <div className="flex flex-col gap-1">
                    <Label className="text-xs">Turno</Label>
                    <Select
                      value={shift.shift}
                      onChange={(event) =>
                        updateShift(shift.id, "shift", event.target.value)
                      }
                      className="w-28 bg-background"
                    >
                      <option value="manha">Manhã</option>
                      <option value="tarde">Tarde</option>
                      <option value="noite">Noite</option>
                    </Select>
                  </div>
                  <div className="flex flex-col gap-1">
                    <Label className="text-xs">Início</Label>
                    <Input
                      type="time"
                      value={shift.startTime}
                      onChange={(e) =>
                        updateShift(shift.id, "startTime", e.target.value)
                      }
                      className="w-28 bg-background"
                    />
                  </div>
                  <div className="flex flex-col gap-1">
                    <Label className="text-xs">Final</Label>
                    <Input
                      type="time"
                      value={shift.endTime}
                      onChange={(e) =>
                        updateShift(shift.id, "endTime", e.target.value)
                      }
                      className="w-28 bg-background"
                    />
                  </div>
                  <Button
                    type="button"
                    variant="ghost"
                    size="icon"
                    className="h-9 w-9 text-destructive hover:text-destructive"
                    onClick={() => removeShift(shift.id)}
                    aria-label="Remover turno"
                  >
                    <X className="h-4 w-4" />
                  </Button>
                </div>
              ))}
            </div>
          )}
        </section>

        {/* Section 5 - Review / Actions */}
        <section className="rounded-2xl border border-border p-6">
          <h2 className="mb-4 text-lg font-medium text-foreground">Revisão</h2>
          <div className="mb-4 grid gap-3 text-sm sm:grid-cols-2">
            <div>
              <span className="text-muted-foreground">Data:</span>{" "}
              <span className="text-foreground">{date || "-"}</span>
            </div>
            <div>
              <span className="text-muted-foreground">Cliente:</span>{" "}
              <span className="text-foreground">
                {mockClients.find((c) => c.id === clientId)?.name || "-"}
              </span>
            </div>
            <div>
              <span className="text-muted-foreground">Modalidade:</span>{" "}
              <span className="text-foreground">{modality}</span>
            </div>
            <div>
              <span className="text-muted-foreground">Técnicos:</span>{" "}
              <span className="text-foreground">
                {selectedTechnicians
                  .map((id) => mockTechnicians.find((t) => t.id === id)?.name)
                  .filter(Boolean)
                  .join(", ") || "-"}
              </span>
            </div>
            <div>
              <span className="text-muted-foreground">Setores:</span>{" "}
              <span className="text-foreground">
                {selectedSectors
                  .map((id) => mockSectors.find((s) => s.id === id)?.name)
                  .filter(Boolean)
                  .join(", ") || "-"}
              </span>
            </div>
            <div>
              <span className="text-muted-foreground">Turnos:</span>{" "}
              <span className="text-foreground">
                {shifts.length > 0
                  ? shifts
                      .map(
                        (s) =>
                          `${SHIFT_LABELS[s.shift]} ${s.startTime}-${s.endTime}`,
                      )
                      .join(", ")
                  : "-"}
              </span>
            </div>
          </div>

          <Separator className="my-4" />

          <div className="flex flex-wrap gap-3">
            <Button type="button" variant="outline" onClick={handleSaveDraft}>
              <Save className="mr-2 h-4 w-4" />
              Salvar Rascunho
            </Button>
            <Button type="button" onClick={handleFinalize}>
              <CheckCircle2 className="mr-2 h-4 w-4" />
              Finalizar Relatório
            </Button>
            <Button
              type="button"
              variant="outline"
              onClick={() =>
                toast.info("A geração de PDF será implementada futuramente.")
              }
            >
              <FileDown className="mr-2 h-4 w-4" />
              Gerar PDF
            </Button>
          </div>
        </section>
      </div>
    </div>
  );
}
