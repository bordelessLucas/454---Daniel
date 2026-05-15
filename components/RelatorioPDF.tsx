import {
  Document,
  Font,
  Image,
  Page,
  StyleSheet,
  Text,
  View,
  pdf,
} from "@react-pdf/renderer";
import type { ApiReport } from "@/lib/types";
import {
  tipTapHtmlToServicoPdfBlocks,
  type ServicoPdfSegment,
} from "@/lib/tiptap-html-to-pdf";

Font.register({
  family: "Inter",
  fonts: [
    {
      src: `${typeof window !== "undefined" ? window.location.origin : ""}/fonts/Inter-Regular.woff`,
      fontWeight: 400,
    },
    {
      src: `${typeof window !== "undefined" ? window.location.origin : ""}/fonts/Inter-SemiBold.woff`,
      fontWeight: 600,
    },
    {
      src: `${typeof window !== "undefined" ? window.location.origin : ""}/fonts/Inter-Bold.woff`,
      fontWeight: 700,
    },
  ],
});

const LINQ_ADDRESS = [
  "LINQ INFORMÁTICA",
  "Rua Geraldo Pereira, 338 - Sala 704",
  "Alto da Bronze, Estrela/RS - CEP: 95.880-000",
  "Suporte: 51 3720-4462",
] as const;

const LEGAL =
  "A LINQ INFORMÁTICA EIRELI-ME, seus diretores, sócios e funcionários, ficam ISENTOS DE QUAISQUER RESPONSABILIDADES, " +
  "sejam elas jurídicas, cíveis, penais ou criminais, referentes ao USO DE LICENÇAS DE SOFTWARE pela EMPRESA CONTRATANTE, " +
  "na sua sede matriz e respectivas filiais.";

const styles = StyleSheet.create({
  page: {
    fontFamily: "Helvetica",
    fontSize: 9,
    color: "#111111",
    paddingTop: 16,
    paddingBottom: 90,
    paddingHorizontal: 16,
  },
  header: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 8,
    borderBottomWidth: 2,
    borderBottomColor: "#111111",
    paddingBottom: 8,
  },
  logoBox: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    width: 130,
  },
  logoText: {
    fontFamily: "Inter",
    fontWeight: 600,
    fontSize: 17,
    color: "#111111",
  },
  titleBox: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    paddingHorizontal: 10,
  },
  pageTitle: {
    fontFamily: "Inter",
    fontWeight: 700,
    fontSize: 13,
    textTransform: "uppercase",
    textAlign: "center",
  },
  headerMeta: {
    width: 110,
    alignItems: "flex-end",
  },
  logoFallback: {
    fontFamily: "Inter",
    fontWeight: 600,
    fontSize: 17,
    color: "#111111",
  },
  metaLine: {
    fontFamily: "Inter",
    fontWeight: 400,
    fontSize: 9,
    textAlign: "right",
    marginBottom: 2,
  },
  sectionTitleWrap: {
    backgroundColor: "#111111",
    borderWidth: 1,
    borderColor: "#111111",
    paddingVertical: 4,
    paddingHorizontal: 8,
  },
  sectionTitle: {
    color: "#ffffff",
    fontSize: 10,
    fontFamily: "Helvetica-Bold",
    textTransform: "uppercase",
  },
  sectionBody: {
    borderWidth: 1,
    borderTopWidth: 0,
    borderColor: "#111111",
    padding: 8,
    marginBottom: 10,
  },
  infoRow: {
    flexDirection: "row",
    flexWrap: "wrap",
    marginBottom: 3,
  },
  infoLine: {
    marginRight: 14,
    marginBottom: 2,
  },
  infoLineFull: {
    width: "100%",
    marginBottom: 2,
  },
  label: {
    fontFamily: "Helvetica-Bold",
  },
  servicesBody: {
    borderWidth: 1,
    borderTopWidth: 0,
    borderColor: "#111111",
    paddingTop: 8,
    paddingBottom: 8,
    paddingHorizontal: 8,
    marginBottom: 10,
  },
  setorTitle: {
    fontFamily: "Helvetica-Bold",
    textTransform: "uppercase",
    marginBottom: 2,
  },
  bulletLine: {
    marginLeft: 10,
    marginBottom: 3,
  },
  paragraphBlock: {
    marginBottom: 7,
  },
  servicoLine: {
    lineHeight: 1.4,
    marginBottom: 2,
  },
  emptyLine: {
    color: "#4b5563",
  },
  bottomGrid: {
    flexDirection: "row",
    justifyContent: "space-between",
    marginBottom: 10,
  },
  bottomColSm: {
    width: "36%",
  },
  bottomColLg: {
    width: "62%",
  },
  highlightTitleWrap: {
    backgroundColor: "#eab308",
    borderWidth: 1,
    borderColor: "#111111",
    paddingVertical: 3,
    paddingHorizontal: 8,
  },
  highlightTitle: {
    fontFamily: "Helvetica-Bold",
    fontSize: 9.5,
    textTransform: "uppercase",
  },
  highlightBody: {
    borderWidth: 1,
    borderTopWidth: 0,
    borderColor: "#111111",
    padding: 8,
    minHeight: 120,
  },
  horarioLine: {
    marginBottom: 4,
  },
  totalHoras: {
    marginTop: 2,
    fontFamily: "Helvetica-Bold",
  },
  legalText: {
    fontSize: 7.5,
    lineHeight: 1.25,
    marginBottom: 10,
  },
  signatures: {
    flexDirection: "row",
    justifyContent: "space-between",
    marginTop: 20,
  },
  signCol: {
    width: "46%",
    alignItems: "center",
  },
  signLine: {
    width: "100%",
    borderTopWidth: 1,
    borderTopColor: "#111111",
    marginBottom: 5,
  },
  signName: {
    fontFamily: "Helvetica-Bold",
    textAlign: "center",
  },
  signHint: {
    fontSize: 8,
    textAlign: "center",
  },
  footer: {
    position: "absolute",
    bottom: 25,
    left: 40,
    right: 40,
    borderTopWidth: 1,
    borderTopColor: "#111111",
    paddingTop: 10,
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "flex-end",
  },
  footerLeftLine: {
    fontSize: 8,
    lineHeight: 1.35,
  },
  footerCenter: {
    alignItems: "center",
  },
  footerWeb1: {
    fontSize: 15,
    fontFamily: "Helvetica-Bold",
  },
  footerWeb2: {
    fontSize: 12,
    fontFamily: "Helvetica-Bold",
  },
  qrPlaceholder: {
    width: 46,
    height: 46,
    borderWidth: 1,
    borderColor: "#111111",
    alignItems: "center",
    justifyContent: "center",
  },
  qrText: {
    fontSize: 8,
    fontFamily: "Helvetica-Bold",
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

function formatTimePdf(d: Date): string {
  return d.toLocaleTimeString("pt-BR", {
    hour: "2-digit",
    minute: "2-digit",
    hour12: false,
  });
}

function formatDatePdf(d: Date): string {
  return d.toLocaleDateString("pt-BR", {
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
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

function ServicoStyledLine({
  segments,
}: {
  segments: ServicoPdfSegment[];
}) {
  return (
    <Text style={styles.servicoLine}>
      {segments.map((seg, i) => (
        <Text
          key={i}
          style={{
            fontWeight: seg.bold ? "bold" : "normal",
            fontStyle: seg.italic ? "italic" : "normal",
          }}
        >
          {seg.text}
        </Text>
      ))}
    </Text>
  );
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
  const origin = typeof window !== "undefined" ? window.location.origin : "";
  const iconUrl = logoUrl?.trim() || `${origin}/placeholder-logo.svg`;

  const tecnicosList = relatorio.tecnicos ?? [];
  const horariosList = [...(relatorio.horarios ?? [])].sort((a, b) => {
    const da = parseDate(a.horaChegada)?.getTime() ?? 0;
    const db = parseDate(b.horaChegada)?.getTime() ?? 0;
    return da - db;
  });
  const setoresList = relatorio.setores ?? [];

  const tecnicoNome = fieldOrNA(
    tecnicosList[0]?.nome ?? relatorio.criadoPor?.nome,
  );
  const contatoNome = fieldOrNA(relatorio.contato?.nome);
  const contatoCargo = fieldOrNA(relatorio.contatoCargo ?? relatorio.contato?.cargo);
  const clienteNome = fieldOrNA(relatorio.cliente?.nomeFantasia);
  const dataVisita = parseDate(relatorio.dataVisita);

  const servicoBlocks = tipTapHtmlToServicoPdfBlocks(relatorio.observacoes);
  const showServicoPlaceholder = servicoBlocks.length === 0;
  const responsavelCliente =
    contatoNome !== "N/A" ? contatoNome : "Responsável pelo Cliente";

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

  return (
    <Document>
      <Page size="A4" style={styles.page} wrap>
        <View style={styles.header}>
          <View style={styles.logoBox}>
            <Image src={iconUrl} style={{ width: 32, height: 41 }} />
            <Text style={styles.logoText}>Linq</Text>
          </View>
          <View style={styles.titleBox}>
            <Text style={styles.pageTitle}>Relatório de Atendimento Técnico</Text>
          </View>
          <View style={styles.headerMeta}>
            <Text style={styles.metaLine}>Relatório Nº {relatorio.id ?? "N/A"}</Text>
            <Text style={styles.metaLine}>
              Data: {dataVisita ? formatDatePdf(dataVisita) : "N/A"}
            </Text>
          </View>
        </View>

        <View style={styles.sectionTitleWrap}>
          <Text style={styles.sectionTitle}>Informações do Cliente</Text>
        </View>
        <View style={styles.sectionBody}>
          <View style={styles.infoRow}>
            <Text style={styles.infoLineFull}>
              <Text style={styles.label}>Cliente: </Text>
              {clienteNome}
            </Text>
          </View>
          <View style={styles.infoRow}>
            <Text style={styles.infoLine}>
              <Text style={styles.label}>Contato: </Text>
              {contatoNome}
            </Text>
            <Text style={styles.infoLine}>
              <Text style={styles.label}>Função/Cargo Responsável de TI: </Text>
              {contatoCargo}
            </Text>
            <Text style={styles.infoLine}>
              <Text style={styles.label}>Cidade: </Text>
              {buildCidadeCliente(relatorio)}
            </Text>
          </View>
          <View style={styles.infoRow}>
            <Text style={styles.infoLine}>
              <Text style={styles.label}>Modalidade de atendimento: </Text>
              {fieldOrNA(relatorio.modalidadeServico)}
            </Text>
            <Text style={styles.infoLine}>
              <Text style={styles.label}>N° contrato: </Text>
              {fieldOrNA(relatorio.numeroContrato)}
            </Text>
          </View>
          <View style={styles.infoRow}>
            <Text style={styles.infoLine}>
              <Text style={styles.label}>Técnico designado: </Text>
              {tecnicoNome}
            </Text>
            <Text style={styles.infoLine}>
              <Text style={styles.label}>Data da visita: </Text>
              {dataVisita ? formatDatePdf(dataVisita) : "N/A"}
            </Text>
          </View>
        </View>

        <View style={styles.sectionTitleWrap}>
          <Text style={styles.sectionTitle}>Detalhamento dos Serviços</Text>
        </View>
        <View style={styles.servicesBody}>
          {setoresList.length > 0 &&
            setoresList.map((setor, idx) => (
              <View key={setor.id ?? idx} style={styles.paragraphBlock}>
                <Text style={styles.setorTitle}>
                  {fieldOrNA(setor.setor?.nome)}
                </Text>
                {setor.observacao ? (
                  <Text style={styles.bulletLine}>• {setor.observacao}</Text>
                ) : null}
              </View>
            ))}
          {showServicoPlaceholder ? (
            <Text style={styles.emptyLine}>Sem detalhamento informado.</Text>
          ) : (
            servicoBlocks.map((block, idx) => (
              <View key={`srv-${idx}`} style={styles.paragraphBlock}>
                {block.lines.map((segments, li) => (
                  <ServicoStyledLine
                    key={`srv-${idx}-l-${li}`}
                    segments={segments}
                  />
                ))}
              </View>
            ))
          )}
        </View>

        <View style={styles.bottomGrid}>
          <View style={styles.bottomColSm}>
            <View style={styles.highlightTitleWrap}>
              <Text style={styles.highlightTitle}>Detalhamento de Horários</Text>
            </View>
            <View style={styles.highlightBody}>
              {horariosList.length === 0 ? (
                <Text style={styles.emptyLine}>Sem horários informados.</Text>
              ) : (
                horariosList.map((h, idx) => {
                  const chegada = parseDate(h.horaChegada);
                  const saida = parseDate(h.horaSaida);
                  return (
                    <View key={h.id ?? idx} style={{ marginBottom: 6 }}>
                      <Text style={styles.horarioLine}>
                        {chegada ? getPeriodo(chegada) : "Período N/A"}
                      </Text>
                      <Text style={styles.horarioLine}>
                        Hora Inicial: {chegada ? formatTimePdf(chegada) : "N/A"}{" "}
                        Hora Final: {saida ? formatTimePdf(saida) : "N/A"}
                      </Text>
                      <Text style={styles.horarioLine}>
                        Total de Horas:{" "}
                        {chegada && saida ? formatDuration(chegada, saida) : "N/A"}
                      </Text>
                    </View>
                  );
                })
              )}
              <Text style={styles.totalHoras}>Total de Horas: {totalHorasFmt}</Text>
            </View>
          </View>

          <View style={styles.bottomColLg}>
            <View style={styles.highlightTitleWrap}>
              <Text style={styles.highlightTitle}>Assinatura dos Responsáveis</Text>
            </View>
            <View style={styles.highlightBody}>
              <Text style={styles.legalText}>{LEGAL}</Text>
              <View style={styles.signatures}>
                <View style={styles.signCol}>
                  <View style={styles.signLine} />
                  <Text style={styles.signName}>{tecnicoNome}</Text>
                  <Text style={styles.signHint}>LINQ INFORMÁTICA</Text>
                </View>
                <View style={styles.signCol}>
                  <View style={styles.signLine} />
                  <Text style={styles.signName}>{responsavelCliente}</Text>
                  <Text style={styles.signHint}>{clienteNome}</Text>
                </View>
              </View>
            </View>
          </View>
        </View>

        <View style={styles.footer} fixed>
          <View>
            <Text style={styles.footerLeftLine}>{LINQ_ADDRESS[0]}</Text>
            <Text style={styles.footerLeftLine}>{LINQ_ADDRESS[1]}</Text>
            <Text style={styles.footerLeftLine}>{LINQ_ADDRESS[2]}</Text>
            <Text style={styles.footerLeftLine}>{LINQ_ADDRESS[3]}</Text>
          </View>
          <View style={styles.footerCenter}>
            <Text style={styles.footerWeb1}>linqbr</Text>
            <Text style={styles.footerWeb2}>www.linq.com.br</Text>
          </View>
          <View style={styles.qrPlaceholder}>
            <Text style={styles.qrText}>QR</Text>
          </View>
        </View>
        <Text style={{ fontSize: 8, color: "#4b5563", marginTop: 4 }}>
          Emitido em {formatDateTimePdf(new Date())}
        </Text>
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
