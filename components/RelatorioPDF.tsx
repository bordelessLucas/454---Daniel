import {
  Document,
  Image,
  Page,
  StyleSheet,
  Text,
  View,
  pdf,
} from "@react-pdf/renderer";
import type { ApiReport } from "@/lib/types";
import { tipTapHtmlToPdfParagraphs } from "@/lib/tiptap-html-to-pdf";

const LINQ_ADDRESS = [
  "LINQ INFORMÁTICA",
  "Rua Geraldo Pereira, 338 - Sala 704",
  "Alto da Bronze, Estrela/RS - CEP: 95.880-000",
  "Suporte: 51 3720-4462",
  "www.linq.com.br",
] as const;

const LEGAL =
  "A LINQ INFORMÁTICA EIRELI-ME, seus diretores, sócios e funcionários, ficam ISENTOS DE QUAISQUER RESPONSABILIDADES, " +
  "sejam elas jurídicas, cíveis, penais ou criminais, referentes ao USO DE LICENÇAS DE SOFTWARE pela EMPRESA CONTRATANTE, " +
  "na sua sede matriz e respectivas filiais.";

const styles = StyleSheet.create({
  page: {
    fontFamily: "Helvetica",
    fontSize: 10,
    color: "#111827",
    paddingTop: 28,
    paddingBottom: 36,
    paddingHorizontal: 28,
  },
  header: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "flex-start",
    marginBottom: 14,
  },
  logoBox: {
    width: 160,
    minHeight: 48,
    justifyContent: "center",
  },
  logoFallback: {
    fontSize: 20,
    fontWeight: "bold",
    color: "#b91c1c",
  },
  company: {
    alignItems: "flex-end",
    maxWidth: 220,
  },
  companyLine: {
    fontSize: 9,
    lineHeight: 1.4,
    textAlign: "right",
  },
  companyStrong: {
    fontFamily: "Helvetica-Bold",
    fontSize: 9,
    marginBottom: 2,
    textAlign: "right",
  },
  title: {
    fontSize: 16,
    fontFamily: "Helvetica-Bold",
    textTransform: "uppercase",
    marginBottom: 4,
  },
  subtitle: {
    fontSize: 10,
    color: "#4b5563",
    marginBottom: 10,
  },
  section: {
    borderTopWidth: 1,
    borderTopColor: "#d1d5db",
    paddingTop: 10,
    marginTop: 10,
  },
  sectionTitle: {
    fontSize: 11,
    fontFamily: "Helvetica-Bold",
    textTransform: "uppercase",
    marginBottom: 8,
  },
  infoGrid: {
    flexDirection: "row",
    flexWrap: "wrap",
    marginTop: 4,
  },
  infoItem: {
    width: "50%",
    borderBottomWidth: 1,
    borderBottomColor: "#e5e7eb",
    paddingBottom: 5,
    paddingRight: 8,
    marginBottom: 6,
  },
  label: {
    fontFamily: "Helvetica-Bold",
    color: "#374151",
  },
  servicoParagraph: {
    lineHeight: 1.5,
    marginBottom: 6,
  },
  servicoLine: {
    lineHeight: 1.45,
    marginBottom: 2,
  },
  table: {
    borderWidth: 1,
    borderColor: "#d1d5db",
    marginTop: 4,
  },
  tableRow: {
    flexDirection: "row",
    borderBottomWidth: 1,
    borderBottomColor: "#d1d5db",
  },
  tableRowLast: {
    flexDirection: "row",
    borderBottomWidth: 0,
  },
  th: {
    flex: 1,
    backgroundColor: "#f9fafb",
    padding: 6,
    fontFamily: "Helvetica-Bold",
    fontSize: 9,
    borderRightWidth: 1,
    borderRightColor: "#d1d5db",
  },
  thLast: {
    flex: 1,
    backgroundColor: "#f9fafb",
    padding: 6,
    fontFamily: "Helvetica-Bold",
    fontSize: 9,
  },
  td: {
    flex: 1,
    padding: 6,
    fontSize: 9,
    borderRightWidth: 1,
    borderRightColor: "#d1d5db",
  },
  tdLast: {
    flex: 1,
    padding: 6,
    fontSize: 9,
  },
  tableFooter: {
    marginTop: 6,
    textAlign: "right",
    fontFamily: "Helvetica-Bold",
    fontSize: 9,
  },
  legal: {
    marginTop: 12,
    fontSize: 9,
    color: "#374151",
    lineHeight: 1.45,
  },
  signatures: {
    flexDirection: "row",
    justifyContent: "space-between",
    marginTop: 28,
    paddingTop: 8,
  },
  signCol: {
    width: "42%",
    alignItems: "center",
  },
  signLine: {
    borderTopWidth: 1,
    borderTopColor: "#111827",
    width: "100%",
    marginBottom: 6,
    marginTop: 22,
  },
  signName: {
    fontFamily: "Helvetica-Bold",
    fontSize: 10,
    textAlign: "center",
  },
  signHint: {
    fontSize: 9,
    textAlign: "center",
    color: "#4b5563",
  },
});

function fieldOrNA(value: string | null | undefined): string {
  if (value == null || String(value).trim() === "") {
    return "N/A";
  }
  return String(value);
}

function parseDate(iso: string): Date | null {
  const d = new Date(iso);
  return Number.isNaN(d.getTime()) ? null : d;
}

function formatDatePdf(d: Date): string {
  return d.toLocaleDateString("pt-BR", {
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
  });
}

function formatTimePdf(d: Date): string {
  return d.toLocaleTimeString("pt-BR", {
    hour: "2-digit",
    minute: "2-digit",
    hour12: false,
  });
}

function formatDateTimePdf(d: Date): string {
  return d.toLocaleString("pt-BR", {
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
}

function getPeriodo(hora: Date): string {
  const h = hora.getHours();
  if (h < 12) return "Manhã";
  if (h < 18) return "Tarde";
  return "Noite";
}

function formatDuration(start: Date, end: Date): string {
  const diffMs = end.getTime() - start.getTime();
  if (diffMs <= 0) return "00:00";
  const totalMinutes = Math.round(diffMs / (1000 * 60));
  const hours = Math.floor(totalMinutes / 60);
  const minutes = totalMinutes % 60;
  return `${String(hours).padStart(2, "0")}:${String(minutes).padStart(2, "0")}`;
}

function buildCidadeCliente(r: ApiReport): string {
  const c = r.cliente?.cidade?.trim();
  const e = r.cliente?.estado?.trim();
  if (c && e) return `${c}/${e}`;
  if (c || e) return fieldOrNA(c ?? e);
  const lc = r.localizacaoCidade?.trim();
  const le = r.localizacaoEstado?.trim();
  if (lc && le) return `${lc}/${le}`;
  if (lc || le) return fieldOrNA(lc ?? le);
  return "N/A";
}

export type RelatorioPDFProps = {
  relatorio: ApiReport;
  /** URL absoluta do logo (ex.: variável de ambiente). */
  logoUrl?: string;
};

export function RelatorioPDF({ relatorio, logoUrl }: RelatorioPDFProps) {
  const envLogo =
    logoUrl?.trim() ||
    (typeof import.meta.env.VITE_RELATORIO_LOGO_URL === "string"
      ? import.meta.env.VITE_RELATORIO_LOGO_URL.trim()
      : "");

  const tecnicosList = relatorio.tecnicos ?? [];
  const horariosList = [...(relatorio.horarios ?? [])].sort((a, b) => {
    const da = parseDate(a.horaChegada)?.getTime() ?? 0;
    const db = parseDate(b.horaChegada)?.getTime() ?? 0;
    return da - db;
  });

  const tecnicoNome = fieldOrNA(
    tecnicosList[0]?.nome ?? relatorio.criadoPor?.nome,
  );
  const contatoNome = fieldOrNA(relatorio.contato?.nome);
  const clienteNome = fieldOrNA(relatorio.cliente?.nomeFantasia);
  const dataVisita = parseDate(relatorio.dataVisita);

  const servicoParagraphs = tipTapHtmlToPdfParagraphs(relatorio.observacoes);
  const showServicoPlaceholder = servicoParagraphs.length === 0;

  let totalMs = 0;
  for (const h of horariosList) {
    const chegada = parseDate(h.horaChegada);
    const saida = parseDate(h.horaSaida);
    if (chegada && saida) {
      totalMs += Math.max(0, saida.getTime() - chegada.getTime());
    }
  }
  const totalHorasFmt =
    totalMs > 0
      ? formatDuration(new Date(0), new Date(totalMs))
      : "00:00";

  const setoresList = relatorio.setores ?? [];
  const checklistsList = relatorio.checklists ?? [];

  const responsavelCliente =
    contatoNome !== "N/A" ? contatoNome : "Responsável do Cliente";

  return (
    <Document>
      <Page size="A4" style={styles.page} wrap>
        <View style={styles.header}>
          <View style={styles.logoBox}>
            {envLogo ? (
              <Image src={envLogo} style={{ width: 140, height: 48 }} />
            ) : (
              <Text style={styles.logoFallback}>LINQ</Text>
            )}
          </View>
          <View style={styles.company}>
            <Text style={styles.companyStrong}>{LINQ_ADDRESS[0]}</Text>
            <Text style={styles.companyLine}>{LINQ_ADDRESS[1]}</Text>
            <Text style={styles.companyLine}>{LINQ_ADDRESS[2]}</Text>
            <Text style={styles.companyLine}>{LINQ_ADDRESS[3]}</Text>
            <Text style={styles.companyLine}>{LINQ_ADDRESS[4]}</Text>
          </View>
        </View>

        <Text style={styles.title}>Relatório de Atendimento Técnico</Text>
        <Text style={styles.subtitle}>
          Relatório Nº {relatorio.id ?? "N/A"} • Data:{" "}
          {dataVisita ? formatDatePdf(dataVisita) : "N/A"}
        </Text>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Informações do Cliente</Text>
          <View style={styles.infoGrid}>
            <View style={styles.infoItem}>
              <Text>
                <Text style={styles.label}>Cliente: </Text>
                {clienteNome}
              </Text>
            </View>
            <View style={styles.infoItem}>
              <Text>
                <Text style={styles.label}>Relatório N°: </Text>
                {relatorio.id ?? "N/A"}
              </Text>
            </View>
            <View style={styles.infoItem}>
              <Text>
                <Text style={styles.label}>Data: </Text>
                {dataVisita ? formatDatePdf(dataVisita) : "N/A"}
              </Text>
            </View>
            <View style={styles.infoItem}>
              <Text>
                <Text style={styles.label}>Contato: </Text>
                {contatoNome}
              </Text>
            </View>
            <View style={styles.infoItem}>
              <Text>
                <Text style={styles.label}>Cidade: </Text>
                {buildCidadeCliente(relatorio)}
              </Text>
            </View>
            <View style={styles.infoItem}>
              <Text>
                <Text style={styles.label}>Modalidade: </Text>
                {fieldOrNA(relatorio.modalidadeServico)}
              </Text>
            </View>
            <View style={styles.infoItem}>
              <Text>
                <Text style={styles.label}>Técnico Designado: </Text>
                {tecnicoNome}
              </Text>
            </View>
            <View style={styles.infoItem}>
              <Text>
                <Text style={styles.label}>Emitido em: </Text>
                {formatDateTimePdf(new Date())}
              </Text>
            </View>
          </View>
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Detalhamento dos Serviços</Text>
          {showServicoPlaceholder ? (
            <Text style={styles.servicoParagraph}>-</Text>
          ) : (
            servicoParagraphs.map((block, idx) => (
              <View key={`srv-${idx}`} style={{ marginBottom: 8 }}>
                {block.split("\n").map((line, li) => (
                  <Text key={`srv-${idx}-l-${li}`} style={styles.servicoLine}>
                    {line}
                  </Text>
                ))}
              </View>
            ))
          )}
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Detalhamento de Horários</Text>
          <View style={styles.table}>
            <View style={styles.tableRow}>
              <Text style={styles.th}>Período</Text>
              <Text style={styles.th}>Início</Text>
              <Text style={styles.th}>Fim</Text>
              <Text style={styles.thLast}>Total</Text>
            </View>
            {horariosList.length === 0 ? (
              <View style={styles.tableRowLast}>
                <Text style={[styles.tdLast, { flex: 4 }]}>
                  Sem horários informados
                </Text>
              </View>
            ) : (
              horariosList.map((h, idx) => {
                const chegada = parseDate(h.horaChegada);
                const saida = parseDate(h.horaSaida);
                const isLast = idx === horariosList.length - 1;
                const Row = isLast ? styles.tableRowLast : styles.tableRow;
                return (
                  <View key={h.id ?? idx} style={Row}>
                    <Text style={styles.td}>
                      {chegada ? getPeriodo(chegada) : "N/A"}
                    </Text>
                    <Text style={styles.td}>
                      {chegada ? formatTimePdf(chegada) : "N/A"}
                    </Text>
                    <Text style={styles.td}>
                      {saida ? formatTimePdf(saida) : "N/A"}
                    </Text>
                    <Text style={styles.tdLast}>
                      {chegada && saida
                        ? formatDuration(chegada, saida)
                        : "N/A"}
                    </Text>
                  </View>
                );
              })
            )}
          </View>
          <Text style={styles.tableFooter}>
            Total de horas: {totalHorasFmt}
          </Text>
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Setores visitados</Text>
          <View style={styles.table}>
            <View style={styles.tableRow}>
              <Text style={styles.th}>Setor</Text>
              <Text style={styles.thLast}>Observação</Text>
            </View>
            {setoresList.length === 0 ? (
              <View style={styles.tableRowLast}>
                <Text style={[styles.tdLast, { flex: 2 }]}>
                  Nenhum setor informado
                </Text>
              </View>
            ) : (
              setoresList.map((rs, idx) => {
                const isLast = idx === setoresList.length - 1;
                const Row = isLast ? styles.tableRowLast : styles.tableRow;
                return (
                  <View key={rs.id ?? idx} style={Row}>
                    <Text style={styles.td}>
                      {fieldOrNA(rs.setor?.nome)}
                    </Text>
                    <Text style={styles.tdLast}>
                      {fieldOrNA(rs.observacao)}
                    </Text>
                  </View>
                );
              })
            )}
          </View>
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Checklists</Text>
          <View style={styles.table}>
            <View style={styles.tableRow}>
              <Text style={styles.thLast}>Nome</Text>
            </View>
            {checklistsList.length === 0 ? (
              <View style={styles.tableRowLast}>
                <Text style={styles.tdLast}>
                  Nenhum checklist vinculado
                </Text>
              </View>
            ) : (
              checklistsList.map((rc, idx) => {
                const isLast = idx === checklistsList.length - 1;
                const Row = isLast ? styles.tableRowLast : styles.tableRow;
                return (
                  <View key={rc.id ?? idx} style={Row}>
                    <Text style={styles.tdLast}>
                      {fieldOrNA(rc.checklist?.nome)}
                    </Text>
                  </View>
                );
              })
            )}
          </View>
        </View>

        <Text style={styles.legal}>{LEGAL}</Text>

        <View style={styles.signatures} wrap={false}>
          <View style={styles.signCol}>
            <View style={styles.signLine} />
            <Text style={styles.signName}>{tecnicoNome}</Text>
            <Text style={styles.signHint}>Técnico Responsável</Text>
            <Text style={styles.signHint}>LINQ INFORMÁTICA</Text>
          </View>
          <View style={styles.signCol}>
            <View style={styles.signLine} />
            <Text style={styles.signName}>{responsavelCliente}</Text>
            <Text style={styles.signHint}>Responsável pelo Cliente</Text>
            <Text style={styles.signHint}>{clienteNome}</Text>
          </View>
        </View>
      </Page>
    </Document>
  );
}

/** Gera o Blob do PDF no browser para download. */
export async function buildRelatorioPdfBlob(
  relatorio: ApiReport,
  logoUrl?: string,
): Promise<Blob> {
  return pdf(
    <RelatorioPDF relatorio={relatorio} logoUrl={logoUrl} />,
  ).toBlob();
}
