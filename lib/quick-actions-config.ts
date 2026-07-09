import type { LucideIcon } from "lucide-react";
import {
  BarChart3,
  Calendar,
  ClipboardCheck,
  FilePlus2,
  FileText,
  Settings,
  User,
  Users,
} from "lucide-react";
import type { UserRole } from "@/lib/types";

export type QuickActionItem = {
  id: string;
  label: string;
  description: string;
  href: string;
  icon: LucideIcon;
  roles: UserRole[];
};

const sharedActions: QuickActionItem[] = [
  {
    id: "novo-relatorio",
    label: "Novo Relatório",
    description: "Criar um relatório de visita",
    href: "/dashboard/relatorios/novo",
    icon: FilePlus2,
    roles: ["ADMIN", "TECNICO"],
  },
  {
    id: "relatorios",
    label: "Relatórios",
    description: "Consultar e gerenciar relatórios",
    href: "/dashboard/relatorios",
    icon: FileText,
    roles: ["ADMIN", "TECNICO"],
  },
  {
    id: "agenda",
    label: "Agenda",
    description: "Ver visitas e agendamentos",
    href: "/dashboard/agenda",
    icon: Calendar,
    roles: ["ADMIN", "TECNICO"],
  },
  {
    id: "clientes",
    label: "Clientes",
    description: "Acessar cadastro de clientes",
    href: "/dashboard/clientes",
    icon: Users,
    roles: ["ADMIN", "TECNICO"],
  },
  {
    id: "gerenciais",
    label: "Gerenciais",
    description: "Relatórios gerenciais e indicadores",
    href: "/dashboard/relatorios/gerenciais",
    icon: BarChart3,
    roles: ["ADMIN", "TECNICO"],
  },
];

const adminOnlyActions: QuickActionItem[] = [
  {
    id: "usuarios",
    label: "Usuários",
    description: "Gerenciar contas e permissões",
    href: "/dashboard/usuarios",
    icon: User,
    roles: ["ADMIN"],
  },
  {
    id: "checklists",
    label: "Checklists",
    description: "Modelos de checklist de visita",
    href: "/dashboard/checklists",
    icon: ClipboardCheck,
    roles: ["ADMIN"],
  },
  {
    id: "configuracoes",
    label: "Configurações",
    description: "Logo, horários e rodapé do PDF",
    href: "/dashboard/configuracoes",
    icon: Settings,
    roles: ["ADMIN"],
  },
];

export function getQuickActionsForRole(role: UserRole): QuickActionItem[] {
  const allActions = [...sharedActions, ...adminOnlyActions];
  return allActions.filter((action) => action.roles.includes(role));
}
