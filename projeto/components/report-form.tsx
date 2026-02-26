import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { useClientes } from "@/hooks/use-clientes";
import { useSetores } from "@/hooks/use-setores";
import { useTecnicos } from "@/hooks/use-tecnicos";
import { useChecklists } from "@/hooks/use-checklists";
import { useRelatorio } from "@/hooks/use-relatorio";
import { apiRequest } from "@/lib/api-client";
import {
  Button,
  Checkbox,
  Input,
  Label,
  SelectionField,
  Textarea,
} from "@/components/index";
import { CheckCircle2, ArrowLeft, X } from "lucide-react";
import { toast } from "sonner";

interface Horario {
  id: string;
  horaChegada: string;
  horaSaida: string;
}

interface ReportFormProps {
  reportId?: string;
}

export function ReportForm({ reportId }: ReportFormProps) {
  const navigate = useNavigate();
  const isEditing = !!reportId;

  const { clientes, loading: loadingClientes } = useClientes();
  const { setores, loading: loadingSetores } = useSetores();
  const { tecnicos, loading: loadingTecnicos } = useTecnicos();
  const { checklists, loading: loadingChecklists } = useChecklists();
  const { relatorio, loading: loadingRelatorio } = useRelatorio(reportId);

  const [dataVisita, setDataVisita] = useState("");
  const [clienteId, setClienteId] = useState<number | null>(null);
  const [contatoId, setContatoId] = useState<number | null>(null);
  const [modalidadeServico, setModalidadeServico] = useState<string>(
    "Sem contrato - remoto",
  );
  const [observacoes, setObservacoes] = useState("");
  const [selectedTecnicos, setSelectedTecnicos] = useState<string[]>([]);
  const [selectedChecklists, setSelectedChecklists] = useState<number[]>([]);
  const [selectedSetores, setSelectedSetores] = useState<string[]>([]);
  const [horarios, setHorarios] = useState<Horario[]>([]);
  const [clientSearch, setClientSearch] = useState("");
  const [saving, setSaving] = useState(false);

  // Preencher formulário ao editar
  useEffect(() => {
    if (isEditing && relatorio) {
      setDataVisita(relatorio.dataVisita.split("T")[0]);
      setClienteId(relatorio.clienteId);
      setContatoId(relatorio.contatoId ?? null);
      setModalidadeServico(
        relatorio.modalidadeServico || "Sem contrato - remoto",
      );
      setObservacoes(relatorio.observacoes ?? "");
      setSelectedTecnicos(relatorio.tecnicos.map((t) => String(t.id)));
      setSelectedChecklists(relatorio.checklists.map((c) => c.checklistId));
      setSelectedSetores(relatorio.setores.map((s) => String(s.setorId)));
      if (relatorio.horarios && Array.isArray(relatorio.horarios)) {
        const horariosEditando = relatorio.horarios.map((h: any) => ({
          id: crypto.randomUUID(),
          horaChegada: new Date(h.horaChegada).toLocaleTimeString("pt-BR", {
            hour: "2-digit",
            minute: "2-digit",
            hour12: false,
          }),
          horaSaida: new Date(h.horaSaida).toLocaleTimeString("pt-BR", {
            hour: "2-digit",
            minute: "2-digit",
            hour12: false,
          }),
        }));
        setHorarios(horariosEditando);
      }
    } else if (!isEditing) {
      setDataVisita(new Date().toISOString().split("T")[0]);
    }
  }, [isEditing, relatorio]);

  // Limpar contato ao trocar cliente
  useEffect(() => {
    if (!isEditing) {
      setContatoId(null);
    }
  }, [clienteId]);

  const clienteSelecionado = clientes.find((c) => c.id === clienteId) ?? null;

  const filteredClientes = clientSearch
    ? clientes.filter(
        (c) =>
          c.nomeFantasia.toLowerCase().includes(clientSearch.toLowerCase()) ||
          c.razaoSocial.toLowerCase().includes(clientSearch.toLowerCase()),
      )
    : clientes;

  function addHorario() {
    const novoHorario: Horario = {
      id: crypto.randomUUID(),
      horaChegada: "08:00",
      horaSaida: "12:00",
    };
    setHorarios((prev) => [...prev, novoHorario]);
  }

  function removeHorario(id: string) {
    setHorarios((prev) => prev.filter((h) => h.id !== id));
  }

  function updateHorario(id: string, field: keyof Horario, value: string) {
    setHorarios((prev) =>
      prev.map((h) => (h.id === id ? { ...h, [field]: value } : h)),
    );
  }

  function toggleChecklist(id: number) {
    setSelectedChecklists((prev) =>
      prev.includes(id) ? prev.filter((c) => c !== id) : [...prev, id],
    );
  }

  async function handleSubmit() {
    if (!clienteId || !dataVisita) {
      toast.error("Preencha ao menos a data e o cliente.");
      return;
    }

    setSaving(true);

    const payload = {
      clienteId,
      contatoId: contatoId ?? undefined,
      dataVisita: new Date(dataVisita).toISOString(),
      modalidadeServico,
      observacoes: observacoes.trim() || undefined,
      tecnicos: selectedTecnicos
        .map((id) => {
          const tecnico = tecnicos.find((t) => String(t.id) === id);
          return tecnico?.nome ?? "";
        })
        .filter(Boolean),
      setores: selectedSetores.map((id) => ({
        setorId: Number(id),
        observacao: undefined,
      })),
      horarios: horarios.map((h) => ({
        horaChegada: h.horaChegada,
        horaSaida: h.horaSaida,
      })),
      checklists: selectedChecklists.map((id) => ({ checklistId: id })),
    };

    console.log("[Report Form] Payload sendo enviado:", payload);
    console.log("[Report Form] modalidadeServico:", modalidadeServico);

    try {
      if (isEditing) {
        await apiRequest(`/relatorios/${reportId}`, {
          method: "PUT",
          body: JSON.stringify(payload),
        });
        toast.success("Relatório atualizado com sucesso.");
      } else {
        await apiRequest("/relatorios", {
          method: "POST",
          body: JSON.stringify(payload),
        });
        toast.success("Relatório criado com sucesso.");
      }
      navigate("/dashboard/relatorios");
    } catch {
      toast.error("Erro ao salvar relatório.");
    } finally {
      setSaving(false);
    }
  }

  if (isEditing && loadingRelatorio) {
    return (
      <div className="flex items-center justify-center py-16">
        <p className="text-muted-foreground">Carregando relatório...</p>
      </div>
    );
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
        {/* Seção 1 - Informações Gerais */}
        <section className="rounded-2xl border border-border p-6">
          <h2 className="mb-4 text-lg font-medium text-foreground">
            Informações Gerais
          </h2>
          <div className="grid gap-4 sm:grid-cols-2">
            <div className="flex flex-col gap-2">
              <Label htmlFor="report-date">Data da Visita</Label>
              <Input
                id="report-date"
                type="date"
                value={dataVisita}
                onChange={(e) => setDataVisita(e.target.value)}
              />
            </div>

            <div className="flex flex-col gap-2">
              <Label htmlFor="modalidade-servico">Modalidade de Serviço</Label>
              <select
                id="modalidade-servico"
                value={modalidadeServico}
                onChange={(e) => setModalidadeServico(e.target.value)}
                className="flex h-10 w-full rounded-md border border-border bg-background px-3 py-2 text-sm ring-offset-background file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
              >
                <option value="Sem contrato - remoto">
                  Sem contrato - remoto
                </option>
                <option value="Sem contrato - local">
                  Sem contrato - local
                </option>
                <option value="Contrato - local">Contrato - local</option>
                <option value="Contrato - remoto">Contrato - remoto</option>
              </select>
            </div>

            {/* Cliente */}
            <div className="flex flex-col gap-2 sm:col-span-2">
              <Label>Cliente</Label>
              {clienteSelecionado ? (
                <div className="flex items-center justify-between rounded-xl border border-border bg-muted px-3 py-2">
                  <span className="text-sm font-medium text-foreground">
                    {clienteSelecionado.nomeFantasia}
                  </span>
                  <Button
                    type="button"
                    variant="ghost"
                    size="icon"
                    className="h-6 w-6 text-muted-foreground"
                    onClick={() => {
                      setClienteId(null);
                      setContatoId(null);
                    }}
                  >
                    <X className="h-4 w-4" />
                  </Button>
                </div>
              ) : (
                <>
                  <Input
                    placeholder="Buscar cliente..."
                    value={clientSearch}
                    onChange={(e) => setClientSearch(e.target.value)}
                    disabled={loadingClientes}
                  />
                  {clientSearch && (
                    <div className="flex max-h-40 flex-col gap-1 overflow-y-auto rounded-xl border border-border p-2">
                      {filteredClientes.length === 0 ? (
                        <p className="px-2 py-1 text-sm text-muted-foreground">
                          Nenhum cliente encontrado.
                        </p>
                      ) : (
                        filteredClientes.map((client) => (
                          <button
                            key={client.id}
                            type="button"
                            onClick={() => {
                              setClienteId(client.id);
                              setClientSearch("");
                            }}
                            className="rounded-lg px-3 py-2 text-left text-sm text-foreground transition-colors hover:bg-muted"
                          >
                            {client.nomeFantasia}
                            <span className="ml-2 text-xs text-muted-foreground">
                              {client.cidade}
                            </span>
                          </button>
                        ))
                      )}
                    </div>
                  )}
                </>
              )}
            </div>

            {/* Contato - só mostra se cliente selecionado tem contatos */}
            {clienteSelecionado && clienteSelecionado.contatos.length > 0 && (
              <div className="flex flex-col gap-2 sm:col-span-2">
                <Label>Contato</Label>
                <div className="flex flex-wrap gap-2">
                  <button
                    type="button"
                    onClick={() => setContatoId(null)}
                    className={`rounded-lg border px-3 py-1.5 text-sm transition-colors ${
                      contatoId === null
                        ? "border-primary bg-primary text-primary-foreground"
                        : "border-border text-foreground hover:bg-muted"
                    }`}
                  >
                    Nenhum
                  </button>
                  {clienteSelecionado.contatos.map((contato) => (
                    <button
                      key={contato.id}
                      type="button"
                      onClick={() => setContatoId(contato.id)}
                      className={`rounded-lg border px-3 py-1.5 text-sm transition-colors ${
                        contatoId === contato.id
                          ? "border-primary bg-primary text-primary-foreground"
                          : "border-border text-foreground hover:bg-muted"
                      }`}
                    >
                      {contato.nome}
                      {contato.cargo && (
                        <span className="ml-1 text-xs opacity-70">
                          ({contato.cargo})
                        </span>
                      )}
                    </button>
                  ))}
                </div>
              </div>
            )}

            {/* Técnicos */}
            <div className="flex flex-col gap-2 sm:col-span-2">
              <SelectionField
                label="Técnicos Envolvidos"
                selectionMode="multiple"
                value={selectedTecnicos}
                onChange={(value) => setSelectedTecnicos(value as string[])}
                options={tecnicos.map((t) => ({
                  value: String(t.id),
                  label: t.nome,
                }))}
                placeholder="Selecione os técnicos"
                disabled={loadingTecnicos}
              />
            </div>
          </div>
        </section>

        {/* Seção 2 - Observações */}
        <section className="rounded-2xl border border-border p-6">
          <h2 className="mb-4 text-lg font-medium text-foreground">
            Observações
          </h2>
          <Textarea
            value={observacoes}
            onChange={(e) => setObservacoes(e.target.value)}
            rows={6}
            placeholder="Descreva as observações do serviço realizado..."
          />
        </section>

        {/* Seção 3 - Setores */}
        <section className="rounded-2xl border border-border p-6">
          <h2 className="mb-4 text-lg font-medium text-foreground">Setores</h2>
          <SelectionField
            label=""
            selectionMode="multiple"
            value={selectedSetores}
            onChange={(value) => setSelectedSetores(value as string[])}
            options={setores.map((s) => ({
              value: String(s.id),
              label: s.nome,
            }))}
            placeholder="Selecione os setores"
            disabled={loadingSetores}
          />
        </section>

        {/* Seção 4 - Checklists */}
        <section className="rounded-2xl border border-border p-6">
          <h2 className="mb-4 text-lg font-medium text-foreground">
            Checklists
          </h2>
          {loadingChecklists ? (
            <p className="text-sm text-muted-foreground">
              Carregando checklists...
            </p>
          ) : checklists.length === 0 ? (
            <p className="text-sm text-muted-foreground">
              Nenhum checklist cadastrado.
            </p>
          ) : (
            <div className="flex flex-col gap-2">
              {checklists.map((checklist) => (
                <label
                  key={checklist.id}
                  className="flex cursor-pointer items-start gap-3 rounded-xl border border-border p-3 transition-colors hover:bg-muted"
                >
                  <Checkbox
                    checked={selectedChecklists.includes(checklist.id)}
                    onCheckedChange={() => toggleChecklist(checklist.id)}
                    className="mt-0.5"
                  />
                  <div>
                    <p className="text-sm font-medium text-foreground">
                      {checklist.nome}
                    </p>
                    {checklist.descricao && (
                      <p className="text-xs text-muted-foreground">
                        {checklist.descricao}
                      </p>
                    )}
                  </div>
                </label>
              ))}
            </div>
          )}
        </section>

        {/* Seção 5 - Horários */}
        <section className="rounded-2xl border border-border p-6">
          <div className="mb-4 flex items-center justify-between">
            <h2 className="text-lg font-medium text-foreground">Horários</h2>
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={addHorario}
            >
              Adicionar Horário
            </Button>
          </div>
          <div className="flex flex-col gap-3">
            {horarios.map((horario) => (
              <div
                key={horario.id}
                className="flex items-center gap-2 rounded-lg border border-border p-3"
              >
                <div className="flex flex-1 items-center gap-2">
                  <div className="flex flex-col gap-1 flex-1">
                    <Label className="text-xs">Início</Label>
                    <Input
                      type="time"
                      value={horario.horaChegada}
                      onChange={(e) =>
                        updateHorario(horario.id, "horaChegada", e.target.value)
                      }
                    />
                  </div>
                  <span className="text-muted-foreground mt-5">–</span>
                  <div className="flex flex-col gap-1 flex-1">
                    <Label className="text-xs">Fim</Label>
                    <Input
                      type="time"
                      value={horario.horaSaida}
                      onChange={(e) =>
                        updateHorario(horario.id, "horaSaida", e.target.value)
                      }
                    />
                  </div>
                </div>
                <Button
                  type="button"
                  variant="ghost"
                  size="icon"
                  className="mt-5"
                  onClick={() => removeHorario(horario.id)}
                >
                  <X className="h-4 w-4" />
                </Button>
              </div>
            ))}
            {horarios.length === 0 && (
              <p className="text-sm text-muted-foreground">
                Nenhum horário adicionado. Clique em "Adicionar Horário" para
                começar.
              </p>
            )}
          </div>
        </section>

        {/* Ações */}
        <div className="flex flex-wrap gap-3 pb-8">
          <Button type="button" onClick={handleSubmit} disabled={saving}>
            <CheckCircle2 className="mr-2 h-4 w-4" />
            {saving
              ? "Salvando..."
              : isEditing
                ? "Salvar Alterações"
                : "Criar Relatório"}
          </Button>
          <Button
            type="button"
            variant="outline"
            onClick={() => navigate(-1)}
            disabled={saving}
          >
            Cancelar
          </Button>
        </div>
      </div>
    </div>
  );
}
