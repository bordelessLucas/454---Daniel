import { useEffect, useState } from "react";
import { History, Loader2 } from "lucide-react";
import { Badge } from "@/components/index";
import { fetchRelatorioAuditLogs } from "@/lib/relatorios-service";
import type { ApiAuditLog, AuditAction } from "@/lib/types";

const ACAO_LABELS: Record<AuditAction, string> = {
  CREATE: "Criação",
  UPDATE: "Alteração",
  DELETE: "Exclusão",
};

const ACAO_VARIANTS: Record<
  AuditAction,
  "default" | "secondary" | "destructive"
> = {
  CREATE: "default",
  UPDATE: "secondary",
  DELETE: "destructive",
};

function formatAuditTimestamp(iso: string): string {
  const date = new Date(iso);
  if (Number.isNaN(date.getTime())) {
    return iso;
  }
  return date.toLocaleString("pt-BR", {
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
}

interface RelatorioAuditLogSectionProps {
  relatorioId: number;
}

export function RelatorioAuditLogSection({
  relatorioId,
}: RelatorioAuditLogSectionProps) {
  const [logs, setLogs] = useState<ApiAuditLog[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;

    async function load() {
      setLoading(true);
      setError(null);
      try {
        const data = await fetchRelatorioAuditLogs(relatorioId);
        if (!cancelled) {
          setLogs(data);
        }
      } catch {
        if (!cancelled) {
          setError("Não foi possível carregar o histórico de alterações.");
          setLogs([]);
        }
      } finally {
        if (!cancelled) {
          setLoading(false);
        }
      }
    }

    void load();
    return () => {
      cancelled = true;
    };
  }, [relatorioId]);

  return (
    <section className="rounded-2xl border border-border p-6">
      <h2 className="mb-4 flex items-center gap-2 text-lg font-medium text-foreground">
        <History className="h-5 w-5" />
        Histórico de alterações
      </h2>

      {loading ? (
        <div className="flex items-center gap-2 text-sm text-muted-foreground">
          <Loader2 className="h-4 w-4 animate-spin" />
          Carregando histórico...
        </div>
      ) : error ? (
        <p className="text-sm text-muted-foreground">{error}</p>
      ) : logs.length === 0 ? (
        <p className="text-sm text-muted-foreground">
          Nenhum registro de auditoria para este relatório.
        </p>
      ) : (
        <ul className="flex flex-col gap-3">
          {logs.map((log) => (
            <li
              key={log.id}
              className="flex flex-col gap-2 rounded-lg border border-border bg-muted/30 px-4 py-3 sm:flex-row sm:items-center sm:justify-between"
            >
              <div className="flex flex-wrap items-center gap-2">
                <Badge variant={ACAO_VARIANTS[log.acao]}>
                  {ACAO_LABELS[log.acao]}
                </Badge>
                <span className="text-sm font-medium text-foreground">
                  {log.usuario.nome}
                </span>
                <span className="text-xs text-muted-foreground">
                  @{log.usuario.username}
                </span>
              </div>
              <time
                className="text-xs font-mono text-muted-foreground"
                dateTime={log.timestamp}
              >
                {formatAuditTimestamp(log.timestamp)}
              </time>
            </li>
          ))}
        </ul>
      )}
    </section>
  );
}
