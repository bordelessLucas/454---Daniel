import { Fragment, useState } from "react";
import { ChevronDown, ChevronRight } from "lucide-react";
import type { ActivityLog } from "@/lib/types";
import {
  ACTIVITY_ACTION_BADGE_CLASS,
  formatActivityEntityDisplay,
  formatActivityTimestamp,
  getActivityActionLabel,
  USER_ROLE_BADGE_CLASS,
  USER_ROLE_LABELS,
} from "@/lib/activity-log-labels";
import { Badge, Button, Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/index";

interface ActivityLogTableProps {
  logs: ActivityLog[];
}

function MetadataPanel({ log }: { log: ActivityLog }) {
  const metadata = log.metadata;

  return (
    <div className="grid gap-2 rounded-lg border border-border bg-muted/40 p-4 text-sm sm:grid-cols-2">
      {metadata?.method ? (
        <p>
          <span className="font-medium text-foreground">Método:</span>{" "}
          <span className="text-muted-foreground">{metadata.method}</span>
        </p>
      ) : null}
      {metadata?.path ? (
        <p className="sm:col-span-2">
          <span className="font-medium text-foreground">Caminho:</span>{" "}
          <span className="break-all font-mono text-xs text-muted-foreground">
            {metadata.path}
          </span>
        </p>
      ) : null}
      {metadata?.username ? (
        <p>
          <span className="font-medium text-foreground">Username:</span>{" "}
          <span className="text-muted-foreground">@{metadata.username}</span>
        </p>
      ) : null}
      {metadata?.targetUsername ? (
        <p>
          <span className="font-medium text-foreground">Usuário alvo:</span>{" "}
          <span className="text-muted-foreground">
            @{metadata.targetUsername}
          </span>
        </p>
      ) : null}
      {metadata?.adminUsername ? (
        <p>
          <span className="font-medium text-foreground">Admin:</span>{" "}
          <span className="text-muted-foreground">
            @{metadata.adminUsername}
          </span>
        </p>
      ) : null}
      {metadata?.role ? (
        <p>
          <span className="font-medium text-foreground">Perfil na ação:</span>{" "}
          <span className="text-muted-foreground">{metadata.role}</span>
        </p>
      ) : null}
      {log.ipAddress ? (
        <p>
          <span className="font-medium text-foreground">IP:</span>{" "}
          <span className="text-muted-foreground">{log.ipAddress}</span>
        </p>
      ) : null}
      {!metadata && !log.ipAddress ? (
        <p className="text-muted-foreground sm:col-span-2">
          Nenhum detalhe adicional disponível.
        </p>
      ) : null}
    </div>
  );
}

export function ActivityLogTable({ logs }: ActivityLogTableProps) {
  const [expandedIds, setExpandedIds] = useState<Set<number>>(new Set());

  function toggleExpanded(id: number) {
    setExpandedIds((prev) => {
      const next = new Set(prev);
      if (next.has(id)) {
        next.delete(id);
      } else {
        next.add(id);
      }
      return next;
    });
  }

  return (
    <div className="overflow-x-auto rounded-xl border border-border">
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead className="w-10" />
            <TableHead>Data/Hora</TableHead>
            <TableHead>Usuário</TableHead>
            <TableHead>Perfil</TableHead>
            <TableHead>Ação</TableHead>
            <TableHead>Descrição</TableHead>
            <TableHead>Entidade</TableHead>
            <TableHead className="hidden md:table-cell">IP</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {logs.map((log) => {
            const isExpanded = expandedIds.has(log.id);
            return (
              <Fragment key={log.id}>
                <TableRow>
                  <TableCell>
                    <Button
                      type="button"
                      variant="ghost"
                      size="icon"
                      className="h-8 w-8"
                      onClick={() => toggleExpanded(log.id)}
                      aria-label={
                        isExpanded ? "Recolher detalhes" : "Expandir detalhes"
                      }
                      aria-expanded={isExpanded}
                    >
                      {isExpanded ? (
                        <ChevronDown className="h-4 w-4" />
                      ) : (
                        <ChevronRight className="h-4 w-4" />
                      )}
                    </Button>
                  </TableCell>
                  <TableCell className="whitespace-nowrap text-sm">
                    {formatActivityTimestamp(log.timestamp)}
                  </TableCell>
                  <TableCell>
                    <div className="min-w-[8rem]">
                      {log.usuario ? (
                        <>
                          <p className="font-medium text-foreground">
                            {log.usuario.nome}
                          </p>
                          <p className="text-xs text-muted-foreground">
                            @{log.usuario.username}
                          </p>
                        </>
                      ) : (
                        <p className="text-sm text-muted-foreground">Sistema</p>
                      )}
                    </div>
                  </TableCell>
                  <TableCell>
                    {log.usuario ? (
                      <Badge
                        className={USER_ROLE_BADGE_CLASS[log.usuario.role]}
                      >
                        {USER_ROLE_LABELS[log.usuario.role]}
                      </Badge>
                    ) : (
                      <span className="text-sm text-muted-foreground">—</span>
                    )}
                  </TableCell>
                  <TableCell>
                    <Badge className={ACTIVITY_ACTION_BADGE_CLASS[log.acao]}>
                      {getActivityActionLabel(log.acao)}
                    </Badge>
                  </TableCell>
                  <TableCell className="max-w-xs">
                    <p className="truncate text-sm" title={log.descricao ?? ""}>
                      {log.descricao || "—"}
                    </p>
                  </TableCell>
                  <TableCell className="whitespace-nowrap text-sm">
                    {formatActivityEntityDisplay(log.entidade, log.entidadeId)}
                  </TableCell>
                  <TableCell className="hidden text-sm text-muted-foreground md:table-cell">
                    {log.ipAddress || "—"}
                  </TableCell>
                </TableRow>
                {isExpanded ? (
                  <TableRow>
                    <TableCell colSpan={8} className="bg-muted/20 p-4">
                      <MetadataPanel log={log} />
                    </TableCell>
                  </TableRow>
                ) : null}
              </Fragment>
            );
          })}
        </TableBody>
      </Table>
    </div>
  );
}
