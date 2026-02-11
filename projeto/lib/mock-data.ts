import type {
  User,
  Client,
  Technician,
  Checklist,
  Sector,
  Report,
  LoginSettings,
} from "./types"

export const mockUsers: User[] = [
  {
    id: "1",
    name: "Carlos Silva",
    email: "admin@empresa.com",
    role: "admin",
    status: "ativo",
  },
  {
    id: "2",
    name: "Ana Santos",
    email: "ana@empresa.com",
    role: "tecnico",
    status: "ativo",
  },
]

export const mockClients: Client[] = [
  {
    id: "1",
    name: "TechCorp Ltda",
    cnpjCpf: "12.345.678/0001-90",
    contact: "Roberto Lima",
    phone: "(11) 98765-4321",
    email: "contato@techcorp.com",
    address: "Rua das Flores, 123",
    city: "São Paulo",
    observations: "Cliente prioritário",
  },
  {
    id: "2",
    name: "Industria ABC S.A.",
    cnpjCpf: "98.765.432/0001-10",
    contact: "Mariana Costa",
    phone: "(21) 91234-5678",
    email: "mariana@abc.com",
    address: "Av. Principal, 456",
    city: "Rio de Janeiro",
    observations: "",
  },
  {
    id: "3",
    name: "Soluções XYZ",
    cnpjCpf: "45.678.901/0001-23",
    contact: "Pedro Alves",
    phone: "(31) 99876-5432",
    email: "pedro@xyz.com",
    address: "Rua Central, 789",
    city: "Belo Horizonte",
    observations: "Contrato anual vigente",
  },
  {
    id: "4",
    name: "Global Services",
    cnpjCpf: "11.222.333/0001-44",
    contact: "Fernanda Reis",
    phone: "(41) 93456-7890",
    email: "fernanda@global.com",
    address: "Rua do Comércio, 321",
    city: "Curitiba",
    observations: "",
  },
]

export const mockTechnicians: Technician[] = [
  { id: "1", name: "Carlos Silva", email: "carlos@empresa.com", status: "ativo" },
  { id: "2", name: "Ana Santos", email: "ana@empresa.com", status: "ativo" },
  { id: "3", name: "Bruno Oliveira", email: "bruno@empresa.com", status: "ativo" },
  { id: "4", name: "Julia Ferreira", email: "julia@empresa.com", status: "inativo" },
]

export const mockChecklists: Checklist[] = [
  {
    id: "1",
    name: "Inspeção Elétrica",
    items: [
      { id: "1-1", text: "Verificar quadro de distribuição", order: 0 },
      { id: "1-2", text: "Testar disjuntores", order: 1 },
      { id: "1-3", text: "Verificar aterramento", order: 2 },
      { id: "1-4", text: "Inspecionar fiação exposta", order: 3 },
    ],
  },
  {
    id: "2",
    name: "Manutenção Preventiva",
    items: [
      { id: "2-1", text: "Limpeza de filtros", order: 0 },
      { id: "2-2", text: "Verificar nível de óleo", order: 1 },
      { id: "2-3", text: "Calibrar sensores", order: 2 },
    ],
  },
  {
    id: "3",
    name: "Segurança do Trabalho",
    items: [
      { id: "3-1", text: "EPIs verificados", order: 0 },
      { id: "3-2", text: "Área sinalizada", order: 1 },
      { id: "3-3", text: "Extintores dentro da validade", order: 2 },
      { id: "3-4", text: "Saídas de emergência desobstruídas", order: 3 },
      { id: "3-5", text: "Documentação de segurança atualizada", order: 4 },
    ],
  },
]

export const mockSectors: Sector[] = [
  { id: "1", name: "Elétrica" },
  { id: "2", name: "Hidráulica" },
  { id: "3", name: "Mecânica" },
  { id: "4", name: "Automação" },
  { id: "5", name: "TI" },
]

export const mockReports: Report[] = [
  {
    id: "1",
    date: "2026-02-10",
    clientId: "1",
    clientName: "TechCorp Ltda",
    contact: "Roberto Lima",
    modality: "Contrato - Local",
    technicianIds: ["1", "2"],
    technicianNames: ["Carlos Silva", "Ana Santos"],
    sectorIds: ["1", "4"],
    sectorNames: ["Elétrica", "Automação"],
    serviceDetails: "<p>Realizada manutenção preventiva no quadro de distribuição principal. Substituídos 3 disjuntores com falha. Atualização do sistema de automação do setor B.</p>",
    checklistItems: [
      { checklistId: "1", itemId: "1-1", checked: true },
      { checklistId: "1", itemId: "1-2", checked: true },
      { checklistId: "1", itemId: "1-3", checked: true },
      { checklistId: "1", itemId: "1-4", checked: false },
    ],
    shifts: [
      { id: "s1", shift: "manha", startTime: "08:00", endTime: "12:00" },
      { id: "s2", shift: "tarde", startTime: "13:00", endTime: "17:00" },
    ],
    status: "finalizado",
    createdAt: "2026-02-10T08:00:00Z",
    updatedAt: "2026-02-10T17:30:00Z",
  },
  {
    id: "2",
    date: "2026-02-09",
    clientId: "2",
    clientName: "Industria ABC S.A.",
    contact: "Mariana Costa",
    modality: "Sem contrato - Remoto",
    technicianIds: ["3"],
    technicianNames: ["Bruno Oliveira"],
    sectorIds: ["5"],
    sectorNames: ["TI"],
    serviceDetails: "<p>Suporte remoto para configuração de rede. Ajustes no firewall e configuração de VPN.</p>",
    checklistItems: [],
    shifts: [
      { id: "s3", shift: "manha", startTime: "09:00", endTime: "11:30" },
    ],
    status: "finalizado",
    createdAt: "2026-02-09T09:00:00Z",
    updatedAt: "2026-02-09T11:45:00Z",
  },
  {
    id: "3",
    date: "2026-02-08",
    clientId: "3",
    clientName: "Soluções XYZ",
    contact: "Pedro Alves",
    modality: "Contrato - Remoto",
    technicianIds: ["1"],
    technicianNames: ["Carlos Silva"],
    sectorIds: ["3"],
    sectorNames: ["Mecânica"],
    serviceDetails: "<p>Análise remota de dados dos sensores de vibração. Relatório de diagnóstico enviado ao cliente.</p>",
    checklistItems: [
      { checklistId: "2", itemId: "2-1", checked: true },
      { checklistId: "2", itemId: "2-2", checked: true },
      { checklistId: "2", itemId: "2-3", checked: false },
    ],
    shifts: [
      { id: "s4", shift: "tarde", startTime: "14:00", endTime: "18:00" },
    ],
    status: "rascunho",
    createdAt: "2026-02-08T14:00:00Z",
    updatedAt: "2026-02-08T18:15:00Z",
  },
  {
    id: "4",
    date: "2026-02-07",
    clientId: "4",
    clientName: "Global Services",
    contact: "Fernanda Reis",
    modality: "Sem contrato - Local",
    technicianIds: ["2", "3"],
    technicianNames: ["Ana Santos", "Bruno Oliveira"],
    sectorIds: ["2"],
    sectorNames: ["Hidráulica"],
    serviceDetails: "<p>Reparo emergencial em tubulação principal. Substituição de válvulas danificadas no setor de produção.</p>",
    checklistItems: [
      { checklistId: "3", itemId: "3-1", checked: true },
      { checklistId: "3", itemId: "3-2", checked: true },
      { checklistId: "3", itemId: "3-3", checked: true },
      { checklistId: "3", itemId: "3-4", checked: true },
      { checklistId: "3", itemId: "3-5", checked: false },
    ],
    shifts: [
      { id: "s5", shift: "manha", startTime: "07:00", endTime: "12:00" },
      { id: "s6", shift: "tarde", startTime: "13:00", endTime: "16:00" },
    ],
    status: "finalizado",
    createdAt: "2026-02-07T07:00:00Z",
    updatedAt: "2026-02-07T16:30:00Z",
  },
]

export const mockLoginSettings: LoginSettings = {
  startTime: "07:00",
  endTime: "22:00",
}
