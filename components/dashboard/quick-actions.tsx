import { Link } from "react-router-dom";
import type { UserRole } from "@/lib/types";
import { getQuickActionsForRole } from "@/lib/quick-actions-config";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/index";
import { cn } from "@/lib/utils";

interface QuickActionsProps {
  role: UserRole;
  className?: string;
}

export function QuickActions({ role, className }: QuickActionsProps) {
  const actions = getQuickActionsForRole(role);

  return (
    <section
      aria-labelledby="quick-actions-title"
      className={cn("space-y-3", className)}
    >
      <div>
        <h2 id="quick-actions-title" className="text-lg font-semibold tracking-tight">
          Ações Rápidas
        </h2>
        <p className="text-sm text-muted-foreground">
          Atalhos para as funcionalidades mais usadas no sistema.
        </p>
      </div>

      <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-3">
        {actions.map((action) => {
          const Icon = action.icon;

          return (
            <Link
              key={action.id}
              to={action.href}
              className="group block rounded-2xl focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:ring-offset-background"
            >
              <Card className="h-full border-border transition-colors hover:border-primary/40 hover:bg-accent/40">
                <CardHeader className="flex flex-row items-start gap-3 space-y-0 pb-2">
                  <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-primary/10 text-primary transition-colors group-hover:bg-primary group-hover:text-primary-foreground">
                    <Icon className="h-5 w-5" aria-hidden="true" />
                  </div>
                  <div className="min-w-0 space-y-1">
                    <CardTitle className="text-base">{action.label}</CardTitle>
                    <p className="text-sm text-muted-foreground">
                      {action.description}
                    </p>
                  </div>
                </CardHeader>
                <CardContent className="pt-0">
                  <span className="text-xs font-medium text-primary opacity-0 transition-opacity group-hover:opacity-100 group-focus-visible:opacity-100">
                    Acessar
                  </span>
                </CardContent>
              </Card>
            </Link>
          );
        })}
      </div>
    </section>
  );
}
