import { useNavigate, useParams } from "react-router-dom";
import { useReports } from "@/lib/reports-context";
import { mockChecklists } from "@/lib/mock-data";
import { Badge, Button, Checkbox, Separator } from "@/components/index";
import { ArrowLeft, Pencil, FileDown } from "lucide-react";
import { toast } from "sonner";

const SHIFT_LABELS = {
  manha: "Manha",
  tarde: "Tarde",
  noite: "Noite",
} as const;

export default function RelatorioDetalhePage() {
  const { id } = useParams();
  const navigate = useNavigate();
  const { getReport } = useReports();
  const report = id ? getReport(id) : undefined;

  if (!report) {
    return (
      <div className="flex flex-col items-center justify-center py-16">
        <p className="text-muted-foreground">Relatorio nao encontrado.</p>
        <Button
          variant="outline"
          className="mt-4 bg-transparent"
          onClick={() => navigate(-1)}
        >
          Voltar
        </Button>
      </div>
    );
  }

  function formatDate(dateStr: string) {
    const [y, m, d] = dateStr.split("-");
    return `${d}/${m}/${y}`;
  }

  return (
    <div className="mx-auto max-w-4xl">
      <div className="mb-6 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <Button
            variant="ghost"
            size="icon"
            onClick={() => navigate(-1)}
            aria-label="Voltar"
          >
            <ArrowLeft className="h-4 w-4" />
          </Button>
          <h1 className="text-2xl font-semibold tracking-tight text-foreground">
            Relatorio
          </h1>
          <Badge
            variant={report.status === "finalizado" ? "default" : "secondary"}
          >
            {report.status === "finalizado" ? "Finalizado" : "Rascunho"}
          </Badge>
        </div>
        <div className="flex gap-2">
          <Button
            variant="outline"
            size="sm"
            onClick={() =>
              navigate(`/dashboard/relatorios/${report.id}/editar`)
            }
          >
            <Pencil className="mr-2 h-4 w-4" />
            Editar
          </Button>
          <Button
            variant="outline"
            size="sm"
            onClick={() =>
              toast.info("A geracao de PDF sera implementada futuramente.")
            }
          >
            <FileDown className="mr-2 h-4 w-4" />
            Gerar PDF
          </Button>
        </div>
      </div>

      <div className="flex flex-col gap-6">
        <section className="rounded-2xl border border-border p-6">
          <h2 className="mb-4 text-lg font-medium text-foreground">
            Informacoes Gerais
          </h2>
          <div className="grid gap-4 text-sm sm:grid-cols-2">
            <div>
              <span className="text-muted-foreground">Data</span>
              <p className="font-medium text-foreground">
                {formatDate(report.date)}
              </p>
            </div>
            <div>
              <span className="text-muted-foreground">Modalidade</span>
              <p className="font-medium text-foreground">{report.modality}</p>
            </div>
            <div>
              <span className="text-muted-foreground">Cliente</span>
              <p className="font-medium text-foreground">{report.clientName}</p>
            </div>
            <div>
              <span className="text-muted-foreground">Contato</span>
              <p className="font-medium text-foreground">{report.contact}</p>
            </div>
            <div>
              <span className="text-muted-foreground">Tecnicos</span>
              <div className="mt-1 flex flex-wrap gap-1">
                {report.technicianNames.map((name) => (
                  <Badge key={name} variant="secondary">
                    {name}
                  </Badge>
                ))}
              </div>
            </div>
            <div>
              <span className="text-muted-foreground">Setores</span>
              <div className="mt-1 flex flex-wrap gap-1">
                {report.sectorNames.map((name) => (
                  <Badge key={name} variant="secondary">
                    {name}
                  </Badge>
                ))}
              </div>
            </div>
          </div>
        </section>

        <section className="rounded-2xl border border-border p-6">
          <h2 className="mb-4 text-lg font-medium text-foreground">
            Detalhes do Servico
          </h2>
          <div
            className="prose prose-sm max-w-none text-foreground dark:prose-invert"
            dangerouslySetInnerHTML={{
              __html:
                report.serviceDetails ||
                "<p class='text-muted-foreground'>Sem detalhes.</p>",
            }}
          />
        </section>

        {report.checklistItems.length > 0 && (
          <section className="rounded-2xl border border-border p-6">
            <h2 className="mb-4 text-lg font-medium text-foreground">
              Checklists
            </h2>
            <div className="flex flex-col gap-4">
              {mockChecklists.map((checklist) => {
                const relevantItems = report.checklistItems.filter(
                  (ci) => ci.checklistId === checklist.id,
                );
                if (relevantItems.length === 0) return null;
                return (
                  <div key={checklist.id}>
                    <h3 className="mb-2 text-sm font-medium text-foreground">
                      {checklist.name}
                    </h3>
                    <div className="flex flex-col gap-1">
                      {checklist.items.map((item) => {
                        const ci = relevantItems.find(
                          (r) => r.itemId === item.id,
                        );
                        if (!ci) return null;
                        return (
                          <div
                            key={item.id}
                            className="flex items-center gap-3 rounded-lg px-3 py-2"
                          >
                            <Checkbox checked={ci.checked} disabled />
                            <span
                              className={`text-sm ${ci.checked ? "text-foreground" : "text-muted-foreground"}`}
                            >
                              {item.text}
                            </span>
                          </div>
                        );
                      })}
                    </div>
                    <Separator className="mt-3" />
                  </div>
                );
              })}
            </div>
          </section>
        )}

        {report.shifts.length > 0 && (
          <section className="rounded-2xl border border-border p-6">
            <h2 className="mb-4 text-lg font-medium text-foreground">
              Horarios
            </h2>
            <div className="flex flex-col gap-2">
              {report.shifts.map((shift) => (
                <div
                  key={shift.id}
                  className="flex items-center gap-4 rounded-xl bg-muted px-4 py-3 text-sm"
                >
                  <Badge variant="outline">{SHIFT_LABELS[shift.shift]}</Badge>
                  <span className="text-foreground">
                    {shift.startTime} - {shift.endTime}
                  </span>
                </div>
              ))}
            </div>
          </section>
        )}
      </div>
    </div>
  );
}
