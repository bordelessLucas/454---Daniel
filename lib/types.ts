export type UserRole = "ADMIN" | "TECNICO";

export interface AuthUser {
  id: number;
  username: string;
  nome: string;
  role: UserRole;
  clienteId: number | null;
  unidadeId: number | null;
}

export interface LoginResponse {
  token: string;
  user: AuthUser;
}

export interface CreateUserPayload {
  username: string;
  password: string;
  nome: string;
  email: string;
  role: UserRole;
  clienteId?: number;
}

export type User = AuthUser;

export interface RamoAtividade {
  id: number;
  nome: string;
}

export interface Contact {
  id: number;
  clienteId: number;
  nome: string;
  cargo: string | null;
  telefone: string | null;
  email: string | null;
  principal: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface Contract {
  id: number;
  clienteId: number;
  numeroContrato: string;
  dataInicio: string | null;
  dataFim: string | null;
  valorMensal: number;
  descricaoServicos: string;
  condicoes: string | null;
  ativo: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface Client {
  id: number;
  razaoSocial: string;
  nomeFantasia: string;
  cnpj: string;
  inscricaoEstadual: string | null;
  endereco: string;
  cidade: string;
  estado: string;
  cep: string;
  telefone: string | null;
  email: string | null;
  ramoAtividadeId: number;
  ativo: boolean;
  createdAt: string;
  updatedAt: string;
  ramoAtividade: RamoAtividade;
  contatos: Contact[];
  contratos: Contract[];
}

export interface ApiUser {
  id: number;
  username: string;
  nome: string;
  email: string;
  role: "ADMIN" | "TECNICO";
  clienteId: number | null;
  unidadeId?: number | null;
  unidade?: {
    id: number;
    nome: string;
  } | null;
  ativo: boolean;
  createdAt: string;
  updatedAt: string;
  cliente?: {
    id: number;
    nomeFantasia: string;
  };
}

// Checklist API
export type ChecklistItem = {
  id: number;
  checklistId: number;
  texto: string;
  ordem: number;
  createdAt: string;
  updatedAt: string;
};

export type Checklist = {
  id: number;
  nome: string;
  descricao: string | null;
  indice: number;
  ativo: boolean;
  createdAt: string;
  updatedAt: string;
  itens: ChecklistItem[];
};

export type ApiChecklist = Checklist;

export interface Sector {
  id: number;
  nome: string;
  descricao: string | null;
  createdAt: string;
  updatedAt: string;
}

// Configurações API
export interface ApiConfiguracoes {
  id: number | null;
  /** HH:mm — preferencial para inputs type="time". */
  horaInicio: string;
  /** HH:mm — preferencial para inputs type="time". */
  horaFim: string;
  /** ISO âncora 1970 — não usar new Date() para exibir horário. */
  dataInicio: string;
  /** ISO âncora 1970 — não usar new Date() para exibir horário. */
  dataFim: string;
  createdAt?: string;
  updatedAt?: string;
  /** Texto do rodapé do relatório/PDF (coluna `texto_rodape_relatorio`). */
  textoRodapeRelatorio?: string | null;
  /** URL pública da logo do sistema (PDF, sidebar, etc.). */
  logoUrl?: string | null;
  /** Data URL da logo (opcional; prioridade sobre logoUrl no preview). */
  logoDataUrl?: string | null;
}

export interface SalvarHorarioPayload {
  horaInicio: string;
  horaFim: string;
}

/** Configurações públicas para PDF/sidebar (sem horário de login). */
export interface ApiConfiguracoesPdf {
  logoUrl?: string | null;
  /** Data URL da logo (opcional; prioridade sobre logoUrl no preview). */
  logoDataUrl?: string | null;
  textoRodapeRelatorio?: string | null;
}

export type AuditAction = "CREATE" | "UPDATE" | "DELETE";

export interface ApiAuditLog {
  id: number;
  relatorioId: number;
  usuarioId: number;
  acao: AuditAction;
  timestamp: string;
  usuario: {
    id: number;
    nome: string;
    username: string;
  };
}

// Tipos para API de Relatórios
export interface ReportTecnico {
  id: number;
  nome: string;
}

export interface ReportContato {
  id: number;
  nome: string;
  cargo?: string | null;
}

export interface ReportCliente {
  id: number;
  razaoSocial: string;
  nomeFantasia: string;
  /** Presentes na API quando o backend envia o cliente completo (ex.: PDF). */
  cidade?: string;
  estado?: string;
}

export interface ReportCriadoPor {
  id: number;
  nome: string;
}

export interface ReportSetor {
  id: number;
  setorId: number;
  observacao: string | null;
  setor: {
    id: number;
    nome: string;
    descricao?: string | null;
  };
}

export interface ReportChecklist {
  id: number;
  checklistId: number;
  checklist: {
    id: number;
    nome: string;
    descricao?: string | null;
    itens?: ChecklistItem[];
  };
}

export interface ReportHorario {
  id: number;
  relatorioId?: number;
  periodo?: "Manhã" | "Tarde" | "Noite";
  horaChegada: string;
  horaSaida: string;
  horaChegadaHhmm?: string;
  horaSaidaHhmm?: string;
  totalHoras?: string;
}

export interface ApiReport {
  id: number;
  clienteId: number;
  contatoId: number | null;
  contatoCargo?: string | null;
  criadoPorId: number;
  dataVisita: string;
  dataVisitaHhmm?: string;
  modalidadeServico?: string;
  numeroContrato?: string | null;
  localizacaoCidade?: string | null;
  localizacaoEstado?: string | null;
  observacoes: string | null;
  impresso: boolean;
  createdAt: string;
  updatedAt: string;
  cliente: ReportCliente;
  contato: ReportContato | null;
  criadoPor: ReportCriadoPor;
  tecnicos: ReportTecnico[];
  setores: ReportSetor[];
  horarios: ReportHorario[];
  checklists: ReportChecklist[];
  statusAgenda?: RelatorioAgendaStatus;
  horaVisita?: string | null;
}

// Relatórios Gerenciais
export type GerencialTipo =
  | "resumo-cliente"
  | "produtividade-tecnico"
  | "sla-contratos";

export type GerencialFormato = "json" | "xlsx";

export type GerencialSlaStatus = "DENTRO" | "ABAIXO" | "SEM_META";

export interface GerencialResumoClienteRow {
  clienteId: number;
  clienteNome: string;
  totalVisitas: number;
  totalHoras: number;
  totalSetoresVisitados: number;
  periodo: string;
}

export interface GerencialProdutividadeTecnicoRow {
  tecnicoNome: string;
  totalVisitas: number;
  totalHoras: number;
  clientesAtendidos: number;
  periodo: string;
}

export interface GerencialSlaContratoRow {
  contratoId: number;
  clienteNome: string;
  visitasRealizadas: number;
  visitasEsperadas: number;
  slaPercentual: number;
  slaStatus: GerencialSlaStatus;
  periodo: string;
}

export type GerencialJsonRow =
  | GerencialResumoClienteRow
  | GerencialProdutividadeTecnicoRow
  | GerencialSlaContratoRow;

export type GerencialJsonData = GerencialJsonRow[];

export interface GerencialJsonResponse {
  tipo: GerencialTipo;
  itens: GerencialJsonData;
}

export interface GerencialQueryParams {
  tipo: GerencialTipo;
  periodo: string;
  formato?: GerencialFormato;
  clienteId?: number;
  tecnicoId?: number;
  unidadeId?: number;
}

// Agenda / Calendário
export type RelatorioAgendaStatus = "AGENDADO" | "FINALIZADO" | "CANCELADO";

export interface CalendarioEventoTecnico {
  id: number;
  nome: string;
}

export interface CalendarioEventoCliente {
  id: number;
  nomeFantasia: string;
}

export interface CalendarioEvento {
  id: number;
  title: string;
  start: string;
  end?: string | null;
  status: RelatorioAgendaStatus;
  cliente: CalendarioEventoCliente;
  tecnicos: CalendarioEventoTecnico[];
  modalidadeServico?: string | null;
  criadoPorId: number;
  /** Quando true, exibe como evento de dia inteiro no mês. */
  allDay?: boolean;
}

export interface AgendamentoPayload {
  clienteId: number;
  /** YYYY-MM-DD ou datetime-local (será normalizado). */
  dataVisita: string;
  /** HH:mm — opcional. */
  horaVisita?: string;
  /** Nomes dos técnicos (mesmo formato do POST /relatorios). */
  tecnicos: string[];
  modalidadeServico?: string;
}

export interface ReagendarDataVisitaPayload {
  dataVisita: string;
  horaVisita?: string;
}

// Activity logs (auditoria)
export type ActivityAction =
  | "CREATE"
  | "UPDATE"
  | "DELETE"
  | "LOGIN"
  | "RESET_PASSWORD"
  | "CHANGE_PASSWORD"
  | "UPLOAD";

export type ActivityEntity =
  | "USER"
  | "CLIENTE"
  | "RELATORIO"
  | "CHECKLIST"
  | "SETOR"
  | "RAMO_ATIVIDADE"
  | "CONFIGURACAO"
  | "AUTH";

export interface ActivityLogMetadata {
  method?: string;
  path?: string;
  role?: string;
  username?: string;
  targetUsername?: string;
  adminUsername?: string;
}

export interface ActivityLogUsuario {
  id: number;
  nome: string;
  username: string;
  role: UserRole;
}

export interface ActivityLog {
  id: number;
  usuarioId: number;
  acao: ActivityAction;
  entidade: ActivityEntity;
  entidadeId: number | null;
  descricao: string | null;
  metadata: ActivityLogMetadata | null;
  ipAddress: string | null;
  timestamp: string;
  usuario: ActivityLogUsuario;
}

export interface ActivityLogsPagination {
  page: number;
  limit: number;
  total: number;
  totalPages: number;
}

export interface ActivityLogsResponse {
  data: ActivityLog[];
  pagination: ActivityLogsPagination;
}

export interface ActivityLogFilters {
  usuarioId?: number;
  entidade?: ActivityEntity;
  acao?: ActivityAction;
  from?: string;
  to?: string;
  page?: number;
  limit?: number;
}

// Dashboard KPIs
export interface Unidade {
  id: number;
  nome: string;
}

export interface DashboardKpisFilters {
  dataInicio?: string;
  dataFim?: string;
  unidadeId?: number;
  tecnicoId?: number;
  clienteId?: number;
  setorId?: number;
}

export interface DashboardVisitasSla {
  realizadas: number;
  esperadas: number;
  percentual: number;
}

export interface DashboardVisitasTecnico {
  realizadas: number;
  agendadas: number;
}

export interface DashboardContratoRisco {
  clienteId: number;
  clienteNome: string;
  visitasRealizadas: number;
  visitasEsperadas: number;
  percentualConcluido: number;
}

export interface DashboardProdutividadeTecnico {
  tecnicoId: number;
  tecnicoNome: string;
  totalHoras: string;
}

export interface DashboardTopCliente {
  clienteId: number;
  clienteNome: string;
  totalVisitas: number;
}

export interface DashboardProximoAgendamento {
  relatorioId: number;
  clienteNome: string;
  dataVisita: string;
}

export interface DashboardAdminKpis {
  visitasSla: DashboardVisitasSla;
  totalHoras: string;
  contratosSlaRisco: DashboardContratoRisco[];
  produtividadeTecnicos: DashboardProdutividadeTecnico[];
  topClientes: DashboardTopCliente[];
}

export interface DashboardTecnicoKpis {
  visitas: DashboardVisitasTecnico;
  totalHoras: string;
  topClientes: DashboardTopCliente[];
}

export type DashboardKpisApiResponse =
  | DashboardAdminKpis
  | DashboardTecnicoKpis;

export function isDashboardAdminKpis(
  data: DashboardKpisApiResponse,
): data is DashboardAdminKpis {
  return "visitasSla" in data;
}
