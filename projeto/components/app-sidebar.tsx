import { Link, useLocation } from "react-router-dom";
import {
  FileText,
  Users,
  Wrench,
  ClipboardCheck,
  Layers,
  Settings,
  LogOut,
  User,
} from "lucide-react";
import { useAuth } from "@/lib/auth-context";
import { Separator } from "@/components/index";
import {
  Sidebar,
  SidebarContent,
  SidebarFooter,
  SidebarGroup,
  SidebarGroupContent,
  SidebarGroupLabel,
  SidebarHeader,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  SidebarRail,
  useSidebar,
} from "@/components/ui/sidebar";

const mainNav = [
  { label: "Relatórios", href: "/dashboard/relatorios", icon: FileText },
  { label: "Clientes", href: "/dashboard/clientes", icon: Users },
];

const adminNav = [
  { label: "Técnicos", href: "/dashboard/tecnicos", icon: Wrench },
  { label: "Checklists", href: "/dashboard/checklists", icon: ClipboardCheck },
  { label: "Setores", href: "/dashboard/setores", icon: Layers },
  { label: "Configurações", href: "/dashboard/configuracoes", icon: Settings },
];

export function AppSidebar() {
  const location = useLocation();
  const pathname = location.pathname;
  const { user, logout } = useAuth();
  const { state } = useSidebar();
  const isAdmin = true;
  return (
    <Sidebar collapsible="icon">
      <SidebarHeader className="p-4">
        <Link to="/dashboard/relatorios" className="flex items-center gap-3">
          <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-foreground">
            <span className="text-xs font-bold text-background">Lq</span>
          </div>
          <span
            className={
              state === "collapsed"
                ? "sr-only"
                : "truncate text-sm font-semibold text-foreground"
            }
          >
            Linq
          </span>
        </Link>
      </SidebarHeader>

      <SidebarContent>
        <SidebarGroup>
          <SidebarGroupLabel
            className={state === "collapsed" ? "sr-only" : undefined}
          >
            Navegação
          </SidebarGroupLabel>
          <SidebarGroupContent>
            <SidebarMenu>
              {mainNav.map((item) => (
                <SidebarMenuItem key={item.href}>
                  <SidebarMenuButton
                    asChild
                    isActive={pathname.startsWith(item.href)}
                    tooltip={item.label}
                    className={
                      state === "collapsed" ? "justify-center" : undefined
                    }
                  >
                    <Link to={item.href}>
                      <item.icon />
                      <span
                        className={
                          state === "collapsed" ? "sr-only" : undefined
                        }
                      >
                        {item.label}
                      </span>
                    </Link>
                  </SidebarMenuButton>
                </SidebarMenuItem>
              ))}
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>

        {isAdmin && (
          <SidebarGroup>
            <SidebarGroupLabel
              className={state === "collapsed" ? "sr-only" : undefined}
            >
              Administração
            </SidebarGroupLabel>
            <SidebarGroupContent>
              <SidebarMenu>
                {adminNav.map((item) => (
                  <SidebarMenuItem key={item.href}>
                    <SidebarMenuButton
                      asChild
                      isActive={pathname.startsWith(item.href)}
                      tooltip={item.label}
                      className={
                        state === "collapsed" ? "justify-center" : undefined
                      }
                    >
                      <Link to={item.href}>
                        <item.icon />
                        <span
                          className={
                            state === "collapsed" ? "sr-only" : undefined
                          }
                        >
                          {item.label}
                        </span>
                      </Link>
                    </SidebarMenuButton>
                  </SidebarMenuItem>
                ))}
              </SidebarMenu>
            </SidebarGroupContent>
          </SidebarGroup>
        )}
      </SidebarContent>

      <Separator className="mx-2 w-auto" />

      <SidebarFooter>
        <SidebarMenu>
          <SidebarMenuItem>
            <SidebarMenuButton
              tooltip={user?.name ?? "Perfil"}
              className={state === "collapsed" ? "justify-center" : undefined}
            >
              <User className="h-4 w-4 shrink-0" />
              <span className={state === "collapsed" ? "sr-only" : "truncate"}>
                {user?.name}
              </span>
            </SidebarMenuButton>
          </SidebarMenuItem>
          <SidebarMenuItem>
            <SidebarMenuButton
              tooltip="Sair"
              onClick={logout}
              className={
                state === "collapsed"
                  ? "justify-center text-destructive hover:text-destructive"
                  : "text-destructive hover:text-destructive"
              }
            >
              <LogOut className="h-4 w-4 shrink-0" />
              <span className={state === "collapsed" ? "sr-only" : undefined}>
                Sair
              </span>
            </SidebarMenuButton>
          </SidebarMenuItem>
        </SidebarMenu>
      </SidebarFooter>

      <SidebarRail />
    </Sidebar>
  );
}
