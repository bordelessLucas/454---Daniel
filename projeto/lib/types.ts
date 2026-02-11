export type UserRole = "admin" | "tecnico"

export interface User {
  id: string
  name: string
  email: string
  role: UserRole
  status: "ativo" | "inativo"
  avatar?: string
}

export interface Client {
  id: string
  name: string
  cnpjCpf: string
  contact: string
  phone: string
  email: string
  address: string
  city: string
  observations: string
}

export interface Technician {
  id: string
  name: string
  email: string
  status: "ativo" | "inativo"
}

export interface ChecklistItem {
  id: string
  text: string
  order: number
}

export interface Checklist {
  id: string
  name: string
  items: ChecklistItem[]
}

export interface Sector {
  id: string
  name: string
}

export type ServiceModality =
  | "Sem contrato - Remoto"
  | "Sem contrato - Local"
  | "Contrato - Local"
  | "Contrato - Remoto"

export type ReportStatus = "rascunho" | "finalizado"

export interface ReportShift {
  id: string
  shift: "manha" | "tarde" | "noite"
  startTime: string
  endTime: string
}

export interface ReportChecklistItem {
  checklistId: string
  itemId: string
  checked: boolean
}

export interface Report {
  id: string
  date: string
  clientId: string
  clientName: string
  contact: string
  modality: ServiceModality
  technicianIds: string[]
  technicianNames: string[]
  sectorIds: string[]
  sectorNames: string[]
  serviceDetails: string
  checklistItems: ReportChecklistItem[]
  shifts: ReportShift[]
  status: ReportStatus
  createdAt: string
  updatedAt: string
}

export interface LoginSettings {
  startTime: string
  endTime: string
}
