import { useNavigate, useParams } from "react-router-dom";
import { useRelatorio } from "@/hooks/use-relatorio";
import { Badge, Button, Separator } from "@/components/index";
import { ArrowLeft, Pencil, FileDown } from "lucide-react";
import { toast } from "sonner";

export default function RelatorioDetalhePage() {
  const { id } = useParams();
  const navigate = useNavigate();
  const { relatorio: report, loading, error } = useRelatorio(id);

  // Debug - verificar se modalidadeServico está vindo do backend
  if (report) {
    console.log("[Relatório Detalhe] Dados completos:", report);
    console.log(
      "[Relatório Detalhe] modalidadeServico:",
      report.modalidadeServico,
    );
  }

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center py-16">
        <p className="text-muted-foreground">Carregando relatório...</p>
      </div>
    );
  }

  if (error || !report) {
    return (
      <div className="flex flex-col items-center justify-center py-16">
        <p className="text-muted-foreground">
          {error ? `Erro: ${error}` : "Relatório não encontrado."}
        </p>
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
    try {
      return new Date(dateStr).toLocaleDateString("pt-BR");
    } catch {
      return dateStr;
    }
  }

  function formatTime(timeStr: string) {
    try {
      // Se for um timestamp ISO completo
      if (timeStr.includes("T") || timeStr.includes("Z")) {
        const date = new Date(timeStr);
        return date.toLocaleTimeString("pt-BR", {
          hour: "2-digit",
          minute: "2-digit",
          hour12: false,
        });
      }
      // Se já for no formato HH:mm, retorna direto
      return timeStr;
    } catch {
      return timeStr;
    }
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
            Relatório #{report.id}
          </h1>
          <Badge variant={report.impresso ? "default" : "secondary"}>
            {report.impresso ? "Impresso" : "Não Impresso"}
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
              toast.info("A geração de PDF será implementada futuramente.")
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
            Informações Gerais
          </h2>
          <div className="grid gap-4 text-sm sm:grid-cols-2">
            <div>
              <span className="text-muted-foreground">Data da Visita</span>
              <p className="font-medium text-foreground">
                {formatDate(report.dataVisita)}
              </p>
            </div>
            {report.modalidadeServico && (
              <div>
                <span className="text-muted-foreground">
                  Modalidade de Serviço
                </span>
                <p className="font-medium text-foreground">
                  {report.modalidadeServico}
                </p>
              </div>
            )}
            <div>
              <span className="text-muted-foreground">Cliente</span>
              <p className="font-medium text-foreground">
                {report.cliente.nomeFantasia}
              </p>
            </div>
            {report.contato && (
              <div>
                <span className="text-muted-foreground">Contato</span>
                <p className="font-medium text-foreground">
                  {report.contato.nome}
                </p>
              </div>
            )}
            <div>
              <span className="text-muted-foreground">Criado por</span>
              <p className="font-medium text-foreground">
                {report.criadoPor.nome}
              </p>
            </div>
            {report.tecnicos.length > 0 && (
              <div>
                <span className="text-muted-foreground">Técnicos</span>
                <div className="mt-1 flex flex-wrap gap-1">
                  {report.tecnicos.map((tech) => (
                    <Badge key={tech.id} variant="secondary">
                      {tech.nome}
                    </Badge>
                  ))}
                </div>
              </div>
            )}
            {report.setores.length > 0 && (
              <div>
                <span className="text-muted-foreground">Setores</span>
                <div className="mt-1 flex flex-wrap gap-1">
                  {report.setores.map((setor) => (
                    <Badge key={setor.id} variant="secondary">
                      {setor.setor.nome}
                    </Badge>
                  ))}
                </div>
              </div>
            )}
          </div>
        </section>

        {report.observacoes && (
          <section className="rounded-2xl border border-border p-6">
            <h2 className="mb-4 text-lg font-medium text-foreground">
              Observações
            </h2>
            <p className="text-sm text-foreground whitespace-pre-wrap">
              {report.observacoes}
            </p>
          </section>
        )}

        {report.setores.length > 0 && (
          <section className="rounded-2xl border border-border p-6">
            <h2 className="mb-4 text-lg font-medium text-foreground">
              Detalhes dos Setores
            </h2>
            <div className="flex flex-col gap-3">
              {report.setores.map((setor) => (
                <div
                  key={setor.id}
                  className="rounded-lg border border-border p-3"
                >
                  <span className="font-medium text-foreground">
                    {setor.setor.nome}
                  </span>
                  {setor.setor.descricao && (
                    <p className="mt-2 text-sm text-muted-foreground">
                      {setor.setor.descricao}
                    </p>
                  )}
                </div>
              ))}
            </div>
          </section>
        )}

        {report.checklists.length > 0 && (
          <section className="rounded-2xl border border-border p-6">
            <h2 className="mb-4 text-lg font-medium text-foreground">
              Checklists
            </h2>
            <div className="flex flex-col gap-3">
              {report.checklists.map((checklistItem) => (
                <div
                  key={checklistItem.id}
                  className="rounded-lg border border-border p-3"
                >
                  <span className="font-medium text-foreground">
                    {checklistItem.checklist.nome}
                  </span>
                  {checklistItem.checklist.descricao && (
                    <p className="mt-2 text-sm text-muted-foreground">
                      {checklistItem.checklist.descricao}
                    </p>
                  )}
                </div>
              ))}
            </div>
          </section>
        )}

        {report.horarios && report.horarios.length > 0 && (
          <section className="rounded-2xl border border-border p-6">
            <h2 className="mb-4 text-lg font-medium text-foreground">
              Horários
            </h2>
            <div className="flex flex-col gap-2">
              {report.horarios.map((horario, index) => (
                <div
                  key={horario.id || index}
                  className="flex items-center gap-2 rounded-lg bg-muted px-4 py-3 text-sm"
                >
                  <span className="font-medium text-foreground">
                    {formatTime(horario.horaChegada)} -{" "}
                    {formatTime(horario.horaSaida)}
                  </span>
                </div>
              ))}
            </div>
          </section>
        )}

        <section className="rounded-2xl border border-border p-6 bg-muted/30">
          <h2 className="mb-4 text-sm font-medium text-muted-foreground">
            Informações do Sistema
          </h2>
          <div className="grid gap-3 text-xs">
            <div className="flex justify-between">
              <span className="text-muted-foreground">Criado em:</span>
              <span className="font-mono">{formatDate(report.createdAt)}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-muted-foreground">Atualizado em:</span>
              <span className="font-mono">{formatDate(report.updatedAt)}</span>
            </div>
          </div>
        </section>
      </div>
    </div>
  );
}
