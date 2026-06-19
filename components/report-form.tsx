import { useState, useEffect, useMemo, useRef } from "react";
import { useNavigate } from "react-router-dom";
import { useClientes } from "@/hooks/use-clientes";
import { useSetores } from "@/hooks/use-setores";
import { useTecnicos } from "@/hooks/use-tecnicos";
import { useChecklists } from "@/hooks/use-checklists";
import { useRelatorio } from "@/hooks/use-relatorio";
import { useAuth } from "@/lib/auth-context";
import { userCanEditRelatorio } from "@/lib/relatorio-permissions";
import { formatRelatorioTitulo } from "@/lib/relatorio-naming";
import { sanitizeTipTapHtmlForSave } from "@/lib/sanitize-tip-tap-html";
import { apiRequest } from "@/lib/api-client";
import {
  buildHorariosPayload,
  computeDurationHhmm,
  formatDataVisitaBr,
  normalizeDataVisitaForApi,
  parseLocalDate,
  resolveDataVisitaInput,
  resolveHoraChegadaHhmm,
  resolveHoraSaidaHhmm,
} from "@/lib/relatorio-datetime";
import type { ReportHorario } from "@/lib/types";
import { Button, Input, Label, SelectionField } from "@/components/index";
import { RichTextEditor } from "@/components/RichTextEditor";
import { CheckCircle2, ArrowLeft, X } from "lucide-react";
import { toast } from "sonner";

interface Horario {
  id: string;
  periodo: "Manhã" | "Tarde" | "Noite";
  horaChegada: string;
  horaSaida: string;
}

interface ReportFormProps {
  reportId?: string;
}

const MODALIDADES_COM_CONTRATO = ["Contrato - local", "Contrato - remoto"];
const MODALIDADES_SEM_CONTRATO = [
  "Sem contrato - local",
  "Sem contrato - remoto",
];

export function ReportForm({ reportId }: ReportFormProps) {
  const navigate = useNavigate();
  const { user } = useAuth();
  const isEditing = !!reportId;
  const editAccessDeniedToast = useRef(false);

  const { clientes, loading: loadingClientes } = useClientes();
  const { setores, loading: loadingSetores } = useSetores();
  const { tecnicos, loading: loadingTecnicos } = useTecnicos();
  const { checklists, loading: loadingChecklists } = useChecklists();
  const { relatorio, loading: loadingRelatorio } = useRelatorio(reportId);

  const [dataVisita, setDataVisita] = useState("");
  const [clienteId, setClienteId] = useState<number | null>(null);
  const [contatoId, setContatoId] = useState<number | null>(null);
  const [contatoCargo, setContatoCargo] = useState("");
  const [modalidadeServico, setModalidadeServico] = useState<string>(
    "Sem contrato - remoto",
  );
  const [numeroContrato, setNumeroContrato] = useState("");
  const [localizacaoCidade, setLocalizacaoCidade] = useState("");
  const [localizacaoEstado, setLocalizacaoEstado] = useState("");
  const [observacoes, setObservacoes] = useState("");
  const [selectedTecnicos, setSelectedTecnicos] = useState<string[]>([]);
  const [selectedChecklists, setSelectedChecklists] = useState<number[]>([]);
  const [selectedSetores, setSelectedSetores] = useState<string[]>([]);
  const [horarios, setHorarios] = useState<Horario[]>([]);
  const [saving, setSaving] = useState(false);

  // Preencher formulário ao editar
  useEffect(() => {
    if (isEditing && relatorio) {
      setDataVisita(resolveDataVisitaInput(relatorio));
      setClienteId(relatorio.clienteId);
      setContatoId(relatorio.contatoId ?? null);
      setContatoCargo(relatorio.contatoCargo ?? relatorio.contato?.cargo ?? "");
      setModalidadeServico(
        relatorio.modalidadeServico || "Sem contrato - remoto",
      );
      setNumeroContrato(relatorio.numeroContrato ?? "");
      setLocalizacaoCidade(relatorio.localizacaoCidade ?? "");
      setLocalizacaoEstado(relatorio.localizacaoEstado ?? "");
      setObservacoes(relatorio.observacoes ?? "");
      setSelectedTecnicos(relatorio.tecnicos.map((t) => String(t.id)));
      setSelectedChecklists(relatorio.checklists.map((c) => c.checklistId));
      setSelectedSetores(relatorio.setores.map((s) => String(s.setorId)));
      if (relatorio.horarios && Array.isArray(relatorio.horarios)) {
        const horariosEditando = relatorio.horarios.map((h: ReportHorario) => ({
          id: crypto.randomUUID(),
          periodo: (h.periodo as "Manhã" | "Tarde" | "Noite") || "Manhã",
          horaChegada: resolveHoraChegadaHhmm(h),
          horaSaida: resolveHoraSaidaHhmm(h),
        }));
        setHorarios(horariosEditando);
      }
    } else if (!isEditing) {
      setDataVisita(new Date().toISOString().split("T")[0]);
    }
  }, [isEditing, relatorio]);

  useEffect(() => {
    if (!isEditing || loadingRelatorio || !relatorio || !user) {
      return;
    }
    if (userCanEditRelatorio(user, relatorio.criadoPorId)) {
      return;
    }
    if (!editAccessDeniedToast.current) {
      editAccessDeniedToast.current = true;
      toast.error("Você só pode editar relatórios criados por você.");
    }
    navigate(`/dashboard/relatorios/${relatorio.id}`, { replace: true });
  }, [isEditing, loadingRelatorio, relatorio, user, navigate]);

  // Limpar contato ao trocar cliente
  useEffect(() => {
    if (!isEditing) {
      setContatoId(null);
      setContatoCargo("");
    }
  }, [clienteId]);

  const clienteSelecionado = clientes.find((c) => c.id === clienteId) ?? null;
  const contatoSelecionado =
    clienteSelecionado?.contatos.find((contato) => contato.id === contatoId) ??
    null;

  const contratosVigentes = useMemo(() => {
    if (!clienteSelecionado || !dataVisita) return [];

    const visitDate = parseLocalDate(dataVisita);
    if (!visitDate) return [];

    return clienteSelecionado.contratos.filter((contrato) => {
      if (!contrato.ativo) return false;
      const contractStart = parseLocalDate(contrato.dataInicio.slice(0, 10));
      const contractEnd = parseLocalDate(contrato.dataFim.slice(0, 10));
      if (!contractStart || !contractEnd) {
        return false;
      }
      return visitDate >= contractStart && visitDate <= contractEnd;
    });
  }, [clienteSelecionado, dataVisita]);

  function hasActiveContractForDate() {
    if (!clienteSelecionado || !dataVisita) return false;

    const visitDate = parseLocalDate(dataVisita);
    if (!visitDate) return false;

    return clienteSelecionado.contratos.some((contrato) => {
      if (!contrato.ativo) return false;

      const contractStart = parseLocalDate(contrato.dataInicio.slice(0, 10));
      const contractEnd = parseLocalDate(contrato.dataFim.slice(0, 10));

      if (!contractStart || !contractEnd) {
        return false;
      }

      return visitDate >= contractStart && visitDate <= contractEnd;
    });
  }

  const clienteTemContratoVigente = hasActiveContractForDate();
  const modalidadeEhContrato = MODALIDADES_COM_CONTRATO.includes(modalidadeServico);
  const modalidadeEhSemContrato =
    MODALIDADES_SEM_CONTRATO.includes(modalidadeServico);

  const modalidadeValidaParaCliente =
    !clienteSelecionado ||
    (clienteTemContratoVigente && modalidadeEhContrato) ||
    (!clienteTemContratoVigente && modalidadeEhSemContrato);

  const modalidadesPermitidas = clienteTemContratoVigente
    ? MODALIDADES_COM_CONTRATO
    : MODALIDADES_SEM_CONTRATO;

  const exibirContrato = modalidadeEhContrato && contratosVigentes.length > 0;

  const totalHorasGerais = useMemo(() => {
    const totalMinutos = horarios.reduce((acc, horario) => {
      const [iniH, iniM] = horario.horaChegada.split(":").map(Number);
      const [fimH, fimM] = horario.horaSaida.split(":").map(Number);
      if (
        Number.isNaN(iniH) ||
        Number.isNaN(iniM) ||
        Number.isNaN(fimH) ||
        Number.isNaN(fimM)
      ) {
        return acc;
      }
      const delta = Math.max(0, fimH * 60 + fimM - (iniH * 60 + iniM));
      return acc + delta;
    }, 0);

    const horas = String(Math.floor(totalMinutos / 60)).padStart(2, "0");
    const minutos = String(totalMinutos % 60).padStart(2, "0");
    return `${horas}:${minutos}`;
  }, [horarios]);

  useEffect(() => {
    if (!clienteSelecionado) return;

    const allowed = clienteTemContratoVigente
      ? MODALIDADES_COM_CONTRATO
      : MODALIDADES_SEM_CONTRATO;

    if (!allowed.includes(modalidadeServico)) {
      setModalidadeServico(allowed[0]);
    }
  }, [clienteSelecionado, clienteTemContratoVigente, modalidadeServico]);

  useEffect(() => {
    if (!contatoSelecionado) {
      if (!contatoId) {
        setContatoCargo("");
      }
      return;
    }

    setContatoCargo(contatoSelecionado.cargo ?? "");
  }, [contatoSelecionado, contatoId]);

  useEffect(() => {
    if (!clienteSelecionado) {
      setNumeroContrato("");
      setLocalizacaoCidade("");
      setLocalizacaoEstado("");
      return;
    }

    setLocalizacaoCidade(clienteSelecionado.cidade ?? "");
    setLocalizacaoEstado(clienteSelecionado.estado ?? "");
  }, [clienteSelecionado]);

  useEffect(() => {
    if (!exibirContrato) {
      setNumeroContrato("");
      return;
    }

    if (
      !numeroContrato ||
      !contratosVigentes.some((c) => c.numeroContrato === numeroContrato)
    ) {
      setNumeroContrato(contratosVigentes[0]?.numeroContrato ?? "");
    }
  }, [exibirContrato, contratosVigentes, numeroContrato]);

  const clienteOptions = useMemo(
    () =>
      clientes.map((cliente) => ({
        value: String(cliente.id),
        label: cliente.cidade
          ? `${cliente.nomeFantasia} · ${cliente.cidade}`
          : cliente.nomeFantasia,
        searchText: [
          cliente.nomeFantasia,
          cliente.razaoSocial,
          cliente.cidade,
          cliente.estado,
        ]
          .filter(Boolean)
          .join(" "),
      })),
    [clientes],
  );

  const tecnicoOptions = useMemo(
    () =>
      tecnicos.map((tecnico) => ({
        value: String(tecnico.id),
        label: tecnico.nome,
        searchText: [tecnico.nome, tecnico.username, tecnico.email]
          .filter(Boolean)
          .join(" "),
      })),
    [tecnicos],
  );

  const setorOptions = useMemo(
    () =>
      setores.map((setor) => ({
        value: String(setor.id),
        label: setor.nome,
        searchText: [setor.nome, setor.descricao].filter(Boolean).join(" "),
      })),
    [setores],
  );

  const checklistOptions = useMemo(
    () =>
      checklists.map((checklist) => ({
        value: String(checklist.id),
        label: checklist.nome,
        searchText: [checklist.nome, checklist.descricao]
          .filter(Boolean)
          .join(" "),
      })),
    [checklists],
  );

  const tecnicosSelecionadosNomes = selectedTecnicos
    .map((id) => tecnicos.find((t) => String(t.id) === id)?.nome)
    .filter((nome): nome is string => Boolean(nome));

  const checklistsSelecionadosNomes = selectedChecklists
    .map((id) => checklists.find((checklist) => checklist.id === id)?.nome)
    .filter((nome): nome is string => Boolean(nome));

  const setoresSelecionadosNomes = selectedSetores
    .map((id) => setores.find((setor) => String(setor.id) === id)?.nome)
    .filter((nome): nome is string => Boolean(nome));

  const observacoesPreview = useMemo(() => {
    if (!observacoes) return "";
    return observacoes
      .replace(/<[^>]*>/g, " ")
      .replace(/&nbsp;/g, " ")
      .replace(/\s+/g, " ")
      .trim();
  }, [observacoes]);

  const dataVisitaPreview = useMemo(() => {
    if (!dataVisita) return "-";
    return formatDataVisitaBr(dataVisita) || dataVisita;
  }, [dataVisita]);

  function addHorario() {
    const novoHorario: Horario = {
      id: crypto.randomUUID(),
      periodo: "Manhã",
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

  async function handleSubmit() {
    if (!clienteId || !dataVisita) {
      toast.error("Preencha ao menos a data e o cliente.");
      return;
    }

    if (!modalidadeValidaParaCliente) {
      toast.error(
        clienteTemContratoVigente
          ? "Este cliente possui contrato vigente. Selecione uma modalidade de contrato."
          : "Este cliente nao possui contrato vigente. Selecione uma modalidade sem contrato.",
      );
      return;
    }

    if (exibirContrato && !numeroContrato) {
      toast.error("Selecione o número do contrato para atendimento em contrato.");
      return;
    }

    setSaving(true);

    let observacoesSanitized: string | undefined;
    try {
      observacoesSanitized =
        sanitizeTipTapHtmlForSave(observacoes) || undefined;
    } catch (error) {
      setSaving(false);
      toast.error(
        error instanceof Error
          ? error.message
          : "Conteúdo do detalhamento inválido.",
      );
      return;
    }

    const payload = {
      clienteId,
      contatoId: contatoId ?? undefined,
      contatoCargo: contatoCargo.trim() || undefined,
      dataVisita: normalizeDataVisitaForApi(dataVisita),
      modalidadeServico,
      numeroContrato: exibirContrato ? numeroContrato || undefined : undefined,
      localizacaoCidade: localizacaoCidade.trim() || undefined,
      localizacaoEstado: localizacaoEstado.trim() || undefined,
      observacoes: observacoesSanitized,
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
      horarios: buildHorariosPayload(horarios),
      checklists: selectedChecklists.map((id) => ({ checklistId: id })),
    };

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

  if (
    isEditing &&
    !loadingRelatorio &&
    relatorio &&
    user &&
    !userCanEditRelatorio(user, relatorio.criadoPorId)
  ) {
    return (
      <div className="flex items-center justify-center py-16">
        <p className="text-muted-foreground">Redirecionando...</p>
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
                className={`flex h-10 w-full rounded-md border bg-background px-3 py-2 text-sm ring-offset-background file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50 ${
                  modalidadeValidaParaCliente
                    ? "border-border focus-visible:ring-ring"
                    : "border-destructive focus-visible:ring-destructive"
                }`}
              >
                <option
                  value="Sem contrato - remoto"
                  disabled={
                    !!clienteSelecionado &&
                    !modalidadesPermitidas.includes("Sem contrato - remoto")
                  }
                >
                  Sem contrato - remoto
                </option>
                <option
                  value="Sem contrato - local"
                  disabled={
                    !!clienteSelecionado &&
                    !modalidadesPermitidas.includes("Sem contrato - local")
                  }
                >
                  Sem contrato - local
                </option>
                <option
                  value="Contrato - local"
                  disabled={
                    !!clienteSelecionado &&
                    !modalidadesPermitidas.includes("Contrato - local")
                  }
                >
                  Contrato - local
                </option>
                <option
                  value="Contrato - remoto"
                  disabled={
                    !!clienteSelecionado &&
                    !modalidadesPermitidas.includes("Contrato - remoto")
                  }
                >
                  Contrato - remoto
                </option>
              </select>
              {clienteSelecionado && (
                <p
                  className={`text-xs ${
                    modalidadeValidaParaCliente
                      ? "text-muted-foreground"
                      : "text-destructive"
                  }`}
                >
                  {clienteTemContratoVigente
                    ? "Cliente com contrato vigente na data da visita: use modalidades de contrato."
                    : "Cliente sem contrato vigente na data da visita: use modalidades sem contrato."}
                </p>
              )}
            </div>

            {exibirContrato && (
              <div className="flex flex-col gap-2">
                <Label htmlFor="numero-contrato">Número do Contrato</Label>
                <select
                  id="numero-contrato"
                  value={numeroContrato}
                  onChange={(e) => setNumeroContrato(e.target.value)}
                  className="flex h-10 w-full rounded-md border border-border bg-background px-3 py-2 text-sm ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
                >
                  {contratosVigentes.map((contrato) => (
                    <option key={contrato.id} value={contrato.numeroContrato}>
                      {contrato.numeroContrato}
                    </option>
                  ))}
                </select>
              </div>
            )}

            <SelectionField
              className="sm:col-span-2"
              label="Cliente"
              searchable
              searchPlaceholder="Buscar cliente..."
              placeholder={
                loadingClientes
                  ? "Carregando clientes..."
                  : "Selecione um cliente"
              }
              options={clienteOptions}
              value={clienteId ? String(clienteId) : ""}
              onChange={(value) => {
                const nextValue = typeof value === "string" ? value : "";
                setClienteId(nextValue ? Number(nextValue) : null);
              }}
              disabled={loadingClientes}
            />

            <div className="flex flex-col gap-2">
              <Label htmlFor="localizacao-cidade">Cidade</Label>
              <Input
                id="localizacao-cidade"
                value={localizacaoCidade}
                onChange={(e) => setLocalizacaoCidade(e.target.value)}
                placeholder="Cidade do atendimento"
              />
            </div>
            <div className="flex flex-col gap-2">
              <Label htmlFor="localizacao-estado">Estado</Label>
              <Input
                id="localizacao-estado"
                value={localizacaoEstado}
                onChange={(e) => setLocalizacaoEstado(e.target.value)}
                placeholder="UF"
              />
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
                <div className="mt-2 flex flex-col gap-2">
                  <Label htmlFor="contato-cargo">Função/Cargo</Label>
                  <Input
                    id="contato-cargo"
                    value={contatoCargo}
                    onChange={(e) => setContatoCargo(e.target.value)}
                    placeholder="Informe o cargo do contato"
                  />
                </div>
              </div>
            )}

            {clienteSelecionado && clienteSelecionado.contatos.length === 0 && (
              <div className="flex flex-col gap-2 sm:col-span-2">
                <Label htmlFor="contato-cargo">Função/Cargo</Label>
                <Input
                  id="contato-cargo"
                  value={contatoCargo}
                  onChange={(e) => setContatoCargo(e.target.value)}
                  placeholder="Informe o cargo do contato"
                />
              </div>
            )}

            <SelectionField
              className="sm:col-span-2"
              label="Técnicos Envolvidos"
              selectionMode="multiple"
              searchable
              searchPlaceholder="Buscar técnico..."
              value={selectedTecnicos}
              onChange={(value) => setSelectedTecnicos(value as string[])}
              options={tecnicoOptions}
              placeholder={
                loadingTecnicos
                  ? "Carregando técnicos..."
                  : "Selecione os técnicos"
              }
              disabled={loadingTecnicos}
            />
          </div>
        </section>

        {/* Seção 2 - Detalhamento dos Serviços */}
        <section className="rounded-2xl border border-border p-6">
          <h2 className="mb-4 text-lg font-medium text-foreground">
            Detalhamento dos Serviços
          </h2>
          <RichTextEditor
            value={observacoes}
            onChange={setObservacoes}
            placeholder="Descreva o detalhamento dos serviços realizados..."
          />
        </section>

        {/* Seção 3 - Setores */}
        <section className="rounded-2xl border border-border p-6">
          <h2 className="mb-4 text-lg font-medium text-foreground">Setores</h2>
          <SelectionField
            label=""
            selectionMode="multiple"
            searchable
            searchPlaceholder="Buscar setor..."
            value={selectedSetores}
            onChange={(value) => setSelectedSetores(value as string[])}
            options={setorOptions}
            placeholder={
              loadingSetores ? "Carregando setores..." : "Selecione os setores"
            }
            disabled={loadingSetores}
          />
        </section>

        {/* Seção 4 - Checklists */}
        <section className="rounded-2xl border border-border p-6">
          <h2 className="mb-4 text-lg font-medium text-foreground">
            Checklists
          </h2>
          <SelectionField
            label=""
            selectionMode="multiple"
            searchable
            searchPlaceholder="Buscar checklist..."
            value={selectedChecklists.map(String)}
            onChange={(value) =>
              setSelectedChecklists((value as string[]).map((id) => Number(id)))
            }
            options={checklistOptions}
            placeholder={
              loadingChecklists
                ? "Carregando checklists..."
                : "Selecione os checklists"
            }
            disabled={loadingChecklists || checklists.length === 0}
          />
          {!loadingChecklists && checklists.length === 0 ? (
            <p className="mt-2 text-sm text-muted-foreground">
              Nenhum checklist cadastrado.
            </p>
          ) : null}
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
                <div className="grid flex-1 gap-2 sm:grid-cols-4">
                  <div className="flex flex-col gap-1">
                    <Label className="text-xs">Período</Label>
                    <select
                      value={horario.periodo}
                      onChange={(e) =>
                        updateHorario(
                          horario.id,
                          "periodo",
                          e.target.value as "Manhã" | "Tarde" | "Noite",
                        )
                      }
                      className="flex h-10 w-full rounded-md border border-border bg-background px-3 py-2 text-sm ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
                    >
                      <option value="Manhã">Manhã</option>
                      <option value="Tarde">Tarde</option>
                      <option value="Noite">Noite</option>
                    </select>
                  </div>
                  <div className="flex flex-col gap-1">
                    <Label className="text-xs">Hora Inicial</Label>
                    <Input
                      type="time"
                      value={horario.horaChegada}
                      onChange={(e) =>
                        updateHorario(horario.id, "horaChegada", e.target.value)
                      }
                    />
                  </div>
                  <div className="flex flex-col gap-1">
                    <Label className="text-xs">Hora Final</Label>
                    <Input
                      type="time"
                      value={horario.horaSaida}
                      onChange={(e) =>
                        updateHorario(horario.id, "horaSaida", e.target.value)
                      }
                    />
                  </div>
                  <div className="flex flex-col gap-1">
                    <Label className="text-xs">Total de Horas</Label>
                    <Input
                      value={computeDurationHhmm(
                        horario.horaChegada,
                        horario.horaSaida,
                      )}
                      readOnly
                    />
                  </div>
                </div>
                <Button
                  type="button"
                  variant="ghost"
                  size="icon"
                  className="self-end"
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

        {/* Seção 6 - Resumo de Revisão (Preview PDF) */}
        <section className="rounded-2xl border border-border p-6">
          <h2 className="mb-2 text-lg font-medium text-foreground">
            Resumo de Revisão
          </h2>
          <p className="mb-4 text-sm text-muted-foreground">
            Pré-visualização dos dados no formato do relatório final.
          </p>

          <div className="space-y-4 rounded-xl border border-border bg-background p-4">
            <div className="text-center">
              <p className="text-sm font-semibold">
                {isEditing && reportId
                  ? formatRelatorioTitulo(Number(reportId)).toUpperCase()
                  : "RELATÓRIO TÉCNICO — NOVO"}
              </p>
              <p className="text-xs text-muted-foreground">
                Data: {dataVisitaPreview}
              </p>
            </div>

            <div className="rounded-lg border border-border p-3">
              <p className="mb-2 text-xs uppercase tracking-wide text-muted-foreground">
                Informações do Cliente
              </p>
              <p className="text-sm">
                <span className="font-medium">Cliente:</span>{" "}
                {clienteSelecionado?.nomeFantasia || "-"}
              </p>
              <p className="text-sm">
                <span className="font-medium">Contato:</span>{" "}
                {contatoSelecionado?.nome || "-"}{" "}
                <span className="font-medium">Função/Cargo:</span>{" "}
                {contatoCargo || "-"}{" "}
                <span className="font-medium">Cidade:</span>{" "}
                {[localizacaoCidade, localizacaoEstado]
                  .filter(Boolean)
                  .join("/") || "-"}
              </p>
              <p className="text-sm">
                <span className="font-medium">Modalidade de atendimento:</span>{" "}
                {modalidadeServico}
                {exibirContrato && numeroContrato
                  ? ` | Nº contrato: ${numeroContrato}`
                  : ""}
              </p>
              <p className="text-sm">
                <span className="font-medium">Técnico designado:</span>{" "}
                {tecnicosSelecionadosNomes.join(", ") || "-"}
              </p>
            </div>

            <div className="rounded-lg border border-border p-3">
              <p className="mb-2 text-xs uppercase tracking-wide text-muted-foreground">
                Detalhamento dos Serviços
              </p>
              <p className="text-sm">
                <span className="font-medium">Setores:</span>{" "}
                {setoresSelecionadosNomes.join(", ") || "-"}
              </p>
              <p className="text-sm">
                <span className="font-medium">Checklists:</span>{" "}
                {checklistsSelecionadosNomes.join(", ") || "-"}
              </p>
              <p className="text-sm">
                {observacoesPreview || "Sem detalhamento dos serviços preenchido."}
              </p>
            </div>

            <div className="rounded-lg border border-border p-3">
              <p className="mb-2 text-xs uppercase tracking-wide text-muted-foreground">
                Detalhamento de Horários
              </p>
              {horarios.length === 0 ? (
                <p className="text-sm text-muted-foreground">
                  Nenhum horário informado.
                </p>
              ) : (
                <div className="space-y-2">
                  {horarios.map((horario, index) => (
                    <div
                      key={horario.id}
                      className="rounded-lg border border-border bg-background p-3 text-sm"
                    >
                      <p>
                        <span className="font-medium">Linha {index + 1}:</span>{" "}
                        {horario.periodo}
                      </p>
                      <p>
                        Hora Inicial: {horario.horaChegada} | Hora Final:{" "}
                        {horario.horaSaida}
                      </p>
                      <p>
                        Total de Horas:{" "}
                        {computeDurationHhmm(horario.horaChegada, horario.horaSaida)}
                      </p>
                    </div>
                  ))}
                  <p className="text-sm font-medium">
                    Total Geral de Horas: {totalHorasGerais}
                  </p>
                </div>
              )}
            </div>

            <div className="rounded-lg border border-border p-3">
              <p className="mb-3 text-xs uppercase tracking-wide text-muted-foreground">
                Assinatura dos Responsáveis
              </p>
              <div className="grid gap-3 sm:grid-cols-2">
                <div className="rounded-md border border-dashed border-border p-3 text-sm">
                  <p className="font-medium">
                    {tecnicosSelecionadosNomes[0] || "Técnico Responsável"}
                  </p>
                  <p className="text-xs text-muted-foreground">LINQ INFORMÁTICA</p>
                </div>
                <div className="rounded-md border border-dashed border-border p-3 text-sm">
                  <p className="font-medium">{contatoSelecionado?.nome || "Contato"}</p>
                  <p className="text-xs text-muted-foreground">
                    {clienteSelecionado?.nomeFantasia || "Cliente"}
                  </p>
                </div>
              </div>
              <p className="mt-3 text-xs text-muted-foreground">
                LINQ INFORMÁTICA - Rua Geraldo Pereira, 338 - Sala 704 - Estrela/RS
              </p>
            </div>
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
