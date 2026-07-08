import { useEffect, useMemo, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { useRelatorio } from "@/hooks/use-relatorio";
import { useChecklists } from "@/hooks/use-checklists";
import { Badge, Button } from "@/components/index";
import { ArrowLeft, Pencil, FileDown, Loader2, Mail } from "lucide-react";
import { ApiError } from "@/lib/api-client";
import { downloadRelatorioPdf } from "@/lib/relatorio-pdf-download";
import { enviarRelatorioPorEmail } from "@/lib/relatorio-enviar-email";
import { downloadBlobFile } from "@/lib/utils";
import { formatRelatorioTitulo } from "@/lib/relatorio-naming";
import { toast } from "sonner";
import { RichTextReadonly } from "@/components/RichTextReadonly";
import { useAuth } from "@/lib/auth-context";
import { userCanEditRelatorio } from "@/lib/relatorio-permissions";
import {
  formatDataVisitaBr,
  resolveHoraChegadaHhmm,
  resolveHoraSaidaHhmm,
} from "@/lib/relatorio-datetime";
import { RelatorioAuditLogSection } from "@/components/relatorio-audit-log-section";

export default function RelatorioDetalhePage() {
  const { id } = useParams();
  const navigate = useNavigate();
  const { user } = useAuth();
  const { relatorio: report, loading, error } = useRelatorio(id);
  const { checklists } = useChecklists();
  const [downloadingPdf, setDownloadingPdf] = useState(false);
  const [sendingEmail, setSendingEmail] = useState(false);
  const [isPrinted, setIsPrinted] = useState(false);

  const checklistsById = useMemo(
    () => new Map(checklists.map((item) => [item.id, item])),
    [checklists],
  );

  useEffect(() => {
    setIsPrinted(!!report?.impresso);
  }, [report?.impresso]);

  function getPdfErrorMessage(downloadError: unknown) {
    if (downloadError instanceof ApiError) {
      if (downloadError.status === 400) return "ID do relatorio invalido.";
      if (downloadError.status === 401 || downloadError.status === 403)
        return "Sem permissao para baixar o PDF.";
      if (downloadError.status === 404) return "Relatorio nao encontrado.";
      if (downloadError.status === 500)
        return "Falha ao gerar PDF no servidor. Tente novamente.";
    }

    return "Erro ao baixar PDF.";
  }

  async function handleDownloadPdf() {
    if (!report || downloadingPdf) {
      return;
    }

    setDownloadingPdf(true);

    try {
      const { blob, filename } = await downloadRelatorioPdf(report.id);
      downloadBlobFile(blob, filename);
      setIsPrinted(true);
      toast.success("PDF baixado com sucesso.");
    } catch (downloadError) {
      toast.error(getPdfErrorMessage(downloadError));
    } finally {
      setDownloadingPdf(false);
    }
  }

  async function handleEnviarEmail() {
    if (!report || sendingEmail) {
      return;
    }

    setSendingEmail(true);

    try {
      await enviarRelatorioPorEmail(report.id);
      toast.success("E-mail enviado com sucesso para o cliente.");
    } catch (sendError) {
      toast.error(
        sendError instanceof ApiError
          ? sendError.message
          : "Erro ao enviar e-mail do relatório.",
      );
    } finally {
      setSendingEmail(false);
    }
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

  function formatDate(dateStr: string, dataVisitaHhmm?: string | null) {
    return formatDataVisitaBr(dateStr, dataVisitaHhmm) || dateStr;
  }

  function formatHorario(horario: {
    horaChegada: string;
    horaSaida: string;
    horaChegadaHhmm?: string;
    horaSaidaHhmm?: string;
  }) {
    return `${resolveHoraChegadaHhmm(horario)} - ${resolveHoraSaidaHhmm(horario)}`;
  }

  function formatDateTime(dateStr: string) {
    try {
      return new Date(dateStr).toLocaleString("pt-BR");
    } catch {
      return dateStr;
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
            {formatRelatorioTitulo(report.id)}
          </h1>
          <Badge variant={isPrinted ? "default" : "secondary"}>
            {isPrinted ? "Impresso" : "Não Impresso"}
          </Badge>
        </div>
        <div className="flex gap-2">
          {userCanEditRelatorio(user, report.criadoPorId) ? (
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
          ) : null}
          <Button
            variant="outline"
            size="sm"
            onClick={handleDownloadPdf}
            disabled={downloadingPdf || sendingEmail}
          >
            {downloadingPdf ? (
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
            ) : (
              <FileDown className="mr-2 h-4 w-4" />
            )}
            {downloadingPdf ? "Baixando..." : "Gerar PDF"}
          </Button>
          <Button
            variant="outline"
            size="sm"
            onClick={handleEnviarEmail}
            disabled={sendingEmail || downloadingPdf}
          >
            {sendingEmail ? (
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
            ) : (
              <Mail className="mr-2 h-4 w-4" />
            )}
            {sendingEmail ? "Enviando..." : "Enviar por E-mail"}
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
                {formatDate(report.dataVisita, report.dataVisitaHhmm)}
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
              Detalhamento dos Serviços
            </h2>
            <RichTextReadonly html={report.observacoes} />
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
                  {setor.observacao ? (
                    <p className="mt-2 text-sm text-foreground">
                      {setor.observacao}
                    </p>
                  ) : null}
                  {setor.setor.descricao ? (
                    <p className="mt-2 text-sm text-muted-foreground">
                      {setor.setor.descricao}
                    </p>
                  ) : null}
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
              {report.checklists.map((checklistItem) => {
                const checklistCompleto = checklistsById.get(
                  checklistItem.checklistId,
                );
                const checklistNome =
                  checklistCompleto?.nome || checklistItem.checklist.nome;
                const checklistDescricao =
                  checklistCompleto?.descricao ??
                  checklistItem.checklist.descricao ??
                  null;
                const checklistItens =
                  checklistCompleto?.itens ?? checklistItem.checklist.itens ?? [];

                return (
                  <div
                    key={checklistItem.id}
                    className="rounded-lg border border-border p-3"
                  >
                    <span className="font-medium text-foreground">
                      {checklistNome}
                    </span>
                    <p className="mt-2 text-sm text-muted-foreground">
                      {checklistDescricao || "Sem descricao informada."}
                    </p>
                    <div className="mt-3">
                      <p className="mb-1 text-xs font-medium uppercase tracking-wide text-muted-foreground">
                        Itens do checklist
                      </p>
                      {checklistItens.length > 0 ? (
                        <ul className="space-y-1 text-sm text-foreground">
                          {[...checklistItens]
                            .sort((a, b) => a.ordem - b.ordem)
                            .map((item) => (
                              <li
                                key={
                                  item.id ??
                                  `${checklistItem.checklistId}-${item.ordem}`
                                }
                              >
                                {item.ordem}. {item.texto}
                              </li>
                            ))}
                        </ul>
                      ) : (
                        <p className="text-sm text-muted-foreground">
                          Nenhum item cadastrado.
                        </p>
                      )}
                    </div>
                  </div>
                );
              })}
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
                    {formatHorario(horario)}
                  </span>
                </div>
              ))}
            </div>
          </section>
        )}

        <RelatorioAuditLogSection relatorioId={report.id} />

        <section className="rounded-2xl border border-border p-6 bg-muted/30">
          <h2 className="mb-4 text-sm font-medium text-muted-foreground">
            Informações do Sistema
          </h2>
          <div className="grid gap-3 text-xs">
            <div className="flex justify-between">
              <span className="text-muted-foreground">Criado em:</span>
              <span className="font-mono">{formatDateTime(report.createdAt)}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-muted-foreground">Atualizado em:</span>
              <span className="font-mono">{formatDateTime(report.updatedAt)}</span>
            </div>
          </div>
        </section>
      </div>
    </div>
  );
}
