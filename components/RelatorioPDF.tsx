import React from "react";
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
  getDefaultPdfFooter,
  type BuildRelatorioPdfOptions,
  type RelatorioPdfFooterConfig,
} from "@/lib/relatorio-pdf-footer";
import {
  tipTapHtmlToServicoPdfBlocks,
  mergeAdjacentSegments,
  type ServicoPdfSegment,
} from "@/lib/tiptap-html-to-pdf";

/** Altura reservada na página para rodapé + bloco fixo de horários/assinaturas. */
const FOOTER_BOTTOM_OFFSET = 25;
const FOOTER_BLOCK_HEIGHT = 58;
const BOTTOM_ANCHOR_HEIGHT = 148;
const PAGE_BOTTOM_RESERVE =
  FOOTER_BOTTOM_OFFSET + FOOTER_BLOCK_HEIGHT + BOTTOM_ANCHOR_HEIGHT + 12;
const BOTTOM_ANCHOR_BOTTOM = FOOTER_BOTTOM_OFFSET + FOOTER_BLOCK_HEIGHT + 6;

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
    paddingBottom: PAGE_BOTTOM_RESERVE,
    paddingHorizontal: 16,
  },
  pageMain: {
    flexGrow: 1,
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
  servicoParagraphBlock: {
    marginBottom: 0,
    paddingBottom: 0,
  },
  servicoLine: {
    // Compacto, mas com legibilidade (evita aspecto “amontoado”)
    lineHeight: 1.15,
    marginBottom: 0,
    paddingBottom: 0,
  },
  emptyLine: {
    color: "#4b5563",
  },
  pageBottomAnchor: {
    position: "absolute",
    bottom: BOTTOM_ANCHOR_BOTTOM,
    left: 16,
    right: 16,
  },
  bottomGrid: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "flex-start",
  },
  bottomColSm: {
    width: "42%",
    alignSelf: "flex-start",
  },
  bottomColLg: {
    width: "56%",
    alignSelf: "flex-start",
  },
  highlightCard: {
    width: "100%",
  },
  highlightTitleWrap: {
    backgroundColor: "#eab308",
    borderWidth: 1,
    borderColor: "#111111",
    paddingVertical: 3,
    paddingHorizontal: 8,
    width: "100%",
  },
  highlightTitle: {
    fontFamily: "Helvetica-Bold",
    fontSize: 9.5,
    textTransform: "uppercase",
  },
  /** Corpo do card — mesma largura do título; altura só do conteúdo. */
  highlightBody: {
    borderWidth: 1,
    borderTopWidth: 0,
    borderColor: "#111111",
    paddingVertical: 5,
    paddingHorizontal: 6,
    width: "100%",
    flexGrow: 0,
    flexShrink: 0,
  },
  horarioTable: {
    width: "100%",
  },
  horarioTableHead: {
    flexDirection: "row",
    borderBottomWidth: 1,
    borderBottomColor: "#d1d5db",
    paddingBottom: 2,
    marginBottom: 3,
  },
  horarioTableRow: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 2,
  },
  horarioCellPeriodo: {
    width: 44,
    fontFamily: "Helvetica-Bold",
    fontSize: 8,
  },
  horarioCellPeriodoEmpty: {
    fontFamily: "Helvetica",
  },
  horarioCellIntervalo: {
    width: 82,
    fontSize: 8,
    fontFamily: "Helvetica",
  },
  horarioCellDuracao: {
    width: 38,
    fontSize: 8,
    fontFamily: "Helvetica",
    textAlign: "right",
  },
  horarioHeadText: {
    fontSize: 7,
    fontFamily: "Helvetica-Bold",
    color: "#4b5563",
    textTransform: "uppercase",
  },
  horarioHeadPeriodo: {
    width: 44,
  },
  horarioHeadIntervalo: {
    width: 82,
  },
  horarioHeadDuracao: {
    width: 38,
    textAlign: "right",
  },
  totalHorasRow: {
    flexDirection: "row",
    marginTop: 4,
    paddingTop: 3,
    borderTopWidth: 1,
    borderTopColor: "#111111",
  },
  totalHorasLabel: {
    flex: 1,
    fontFamily: "Helvetica-Bold",
    fontSize: 8.5,
  },
  totalHorasValue: {
    width: 38,
    fontFamily: "Helvetica-Bold",
    fontSize: 8.5,
    textAlign: "right",
  },
  legalText: {
    fontSize: 7.5,
    lineHeight: 1.25,
    marginBottom: 10,
  },
  signatures: {
    flexDirection: "row",
    justifyContent: "space-between",
    marginTop: 10,
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
  footerLogoBox: {
    width: 40,
    alignItems: "flex-end",
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

function getPeriodo(hora: Date): string {
  const h = hora.getHours();
  if (h < 12) return "Manhã";
  if (h < 18) return "Tarde";
  return "Noite";
}

function ServicoStyledBlock({ lines }: { lines: ServicoPdfSegment[][] }) {
  if (lines.length === 0) {
    return null;
  }

  return (
    <>
      {lines.map((segments, li) => (
        <Text key={`line-${li}`} style={styles.servicoLine}>
          {segments.map((seg, si) => (
            <Text
              key={`seg-${li}-${si}`}
              style={{
                fontWeight: seg.bold ? "bold" : "normal",
                fontStyle: seg.italic ? "italic" : "normal",
              }}
            >
              {seg.text}
            </Text>
          ))}
        </Text>
      ))}
    </>
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

type HorarioTableRowData = {
  key: string;
  periodo: string;
  showPeriodo: boolean;
  intervalo: string;
  duracao: string;
};

function buildHorarioTableRows(
  grupos: Record<
    string,
    { h: { id?: number }; chegada: Date | null; saida: Date | null }[]
  >,
  ordemPeriodos: string[],
): HorarioTableRowData[] {
  const rows: HorarioTableRowData[] = [];

  for (const periodo of ordemPeriodos) {
    const items = grupos[periodo] ?? [];
    items.forEach((item, idx) => {
      const { h, chegada, saida } = item;
      const intervalo =
        chegada && saida
          ? `${formatTimePdf(chegada)} - ${formatTimePdf(saida)}`
          : "N/A";
      const duracao = chegada && saida ? formatDuration(chegada, saida) : "N/A";

      rows.push({
        key: String(h.id ?? `${periodo}-${idx}`),
        periodo,
        showPeriodo: idx === 0,
        intervalo,
        duracao,
      });
    });
  }

  return rows;
}

function PdfHorariosTable({
  rows,
  totalHorasFmt,
}: {
  rows: HorarioTableRowData[];
  totalHorasFmt: string;
}) {
  return (
    <View style={styles.horarioTable}>
      <View style={styles.horarioTableHead}>
        <Text style={[styles.horarioHeadText, styles.horarioHeadPeriodo]}>
          Período
        </Text>
        <Text style={[styles.horarioHeadText, styles.horarioHeadIntervalo]}>
          Horário
        </Text>
        <Text style={[styles.horarioHeadText, styles.horarioHeadDuracao]}>
          Total
        </Text>
      </View>

      {rows.map((row) => (
        <View key={row.key} style={styles.horarioTableRow}>
          <Text
            style={[
              styles.horarioCellPeriodo,
              !row.showPeriodo && styles.horarioCellPeriodoEmpty,
            ]}
          >
            {row.showPeriodo ? row.periodo : " "}
          </Text>
          <Text style={styles.horarioCellIntervalo}>{row.intervalo}</Text>
          <Text style={styles.horarioCellDuracao}>({row.duracao})</Text>
        </View>
      ))}

      <View style={styles.totalHorasRow}>
        <Text style={styles.totalHorasLabel}>Total de Horas</Text>
        <Text style={styles.totalHorasValue}>{totalHorasFmt}</Text>
      </View>
    </View>
  );
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

export type {
  BuildRelatorioPdfOptions,
  RelatorioPdfFooterConfig,
} from "@/lib/relatorio-pdf-footer";

export type RelatorioPDFProps = {
  relatorio: ApiReport;
  /** URL absoluta do logo (ex.: variável de ambiente). */
  logoUrl?: string;
  /** Textos do rodapé (ex.: vindos de GET /configuracoes via mapConfiguracoesToPdfFooter). */
  footer?: RelatorioPdfFooterConfig;
};

function PdfFooter({
  logoUrl,
  footer,
}: {
  logoUrl: string;
  footer: RelatorioPdfFooterConfig;
}) {
  const websiteTitle = footer.websiteTitle ?? "linqbr";
  const websiteSubtitle = footer.websiteSubtitle ?? "www.linq.com.br";

  return (
    <View style={styles.footer} fixed>
      <View style={{ flex: 1, paddingRight: 8 }}>
        {footer.lines.map((line, i) => (
          <Text key={`footer-line-${i}`} style={styles.footerLeftLine}>
            {line}
          </Text>
        ))}
      </View>
      <View style={styles.footerCenter}>
        <Text style={styles.footerWeb1}>{websiteTitle}</Text>
        <Text style={styles.footerWeb2}>{websiteSubtitle}</Text>
      </View>
      <View style={styles.footerLogoBox}>
        <Image src={logoUrl} style={{ width: 32, height: 41 }} />
      </View>
    </View>
  );
}

type PdfBottomAnchorProps = {
  horariosList: ApiReport["horarios"];
  totalHorasFmt: string;
  tecnicoNome: string;
  responsavelCliente: string;
  clienteNome: string;
};

function PdfBottomAnchor({
  horariosList,
  totalHorasFmt,
  tecnicoNome,
  responsavelCliente,
  clienteNome,
}: PdfBottomAnchorProps) {
  const sorted = [...(horariosList ?? [])].sort((a, b) => {
    const da = parseDate(a.horaChegada)?.getTime() ?? 0;
    const db = parseDate(b.horaChegada)?.getTime() ?? 0;
    return da - db;
  });

  const grupos = sorted.reduce(
    (acc, h) => {
      const chegada = parseDate(h.horaChegada);
      const saida = parseDate(h.horaSaida);
      const key = chegada ? getPeriodo(chegada) : "N/A";
      acc[key] = acc[key] ?? [];
      acc[key].push({ h, chegada, saida });
      return acc;
    },
    {} as Record<
      string,
      { h: (typeof sorted)[number]; chegada: Date | null; saida: Date | null }[]
    >,
  );

  const ordemPeriodos = ["Manhã", "Tarde", "Noite", "N/A"];
  const horarioRows = buildHorarioTableRows(grupos, ordemPeriodos);

  return (
    <View style={styles.pageBottomAnchor} fixed>
      <View style={styles.bottomGrid}>
        <View style={styles.bottomColSm}>
          <View style={styles.highlightCard}>
            <View style={styles.highlightTitleWrap}>
              <Text style={styles.highlightTitle}>
                Detalhamento de Horários
              </Text>
            </View>
            <View style={styles.highlightBody}>
              {sorted.length === 0 ? (
                <Text style={styles.emptyLine}>Sem horários informados.</Text>
              ) : (
                <PdfHorariosTable
                  rows={horarioRows}
                  totalHorasFmt={totalHorasFmt}
                />
              )}
            </View>
          </View>
        </View>

        <View style={styles.bottomColLg}>
          <View style={styles.highlightCard}>
            <View style={styles.highlightTitleWrap}>
              <Text style={styles.highlightTitle}>
                Assinatura dos Responsáveis
              </Text>
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
      </View>
    </View>
  );
}

export function RelatorioPDF({
  relatorio,
  logoUrl,
  footer: footerProp,
}: RelatorioPDFProps) {
  const origin = typeof window !== "undefined" ? window.location.origin : "";
  const iconUrl = logoUrl?.trim() || `${origin}/placeholder-logo.svg`;
  const footer = footerProp ?? getDefaultPdfFooter();

  const tecnicosList = relatorio.tecnicos ?? [];
  const setoresList = relatorio.setores ?? [];

  const tecnicoNome = fieldOrNA(
    tecnicosList[0]?.nome ?? relatorio.criadoPor?.nome,
  );
  const contatoNome = fieldOrNA(relatorio.contato?.nome);
  const contatoCargo = fieldOrNA(
    relatorio.contatoCargo ?? relatorio.contato?.cargo,
  );
  const clienteNome = fieldOrNA(relatorio.cliente?.nomeFantasia);
  const dataVisita = parseDate(relatorio.dataVisita);

  const servicoBlocks = tipTapHtmlToServicoPdfBlocks(relatorio.observacoes);
  const showServicoPlaceholder = servicoBlocks.length === 0;
  const responsavelCliente =
    contatoNome !== "N/A" ? contatoNome : "Responsável pelo Cliente";

  let totalMs = 0;
  for (const h of relatorio.horarios ?? []) {
    const chegada = parseDate(h.horaChegada);
    const saida = parseDate(h.horaSaida);
    if (chegada && saida) {
      totalMs += Math.max(0, saida.getTime() - chegada.getTime());
    }
  }
  const totalHorasFmt =
    totalMs > 0 ? formatDuration(new Date(0), new Date(totalMs)) : "00:00";

  return (
    <Document>
      <Page size="A4" style={styles.page} wrap>
        <View style={styles.pageMain}>
          <View style={styles.header}>
            <View style={styles.logoBox}>
              <Image src={iconUrl} style={{ width: 32, height: 41 }} />
              <Text style={styles.logoText}>Linq</Text>
            </View>
            <View style={styles.titleBox}>
              <Text style={styles.pageTitle}>
                Relatório de Atendimento Técnico
              </Text>
            </View>
            <View style={styles.headerMeta}>
              <Text style={styles.metaLine}>
                Relatório Nº {relatorio.id ?? "N/A"}
              </Text>
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
                <Text style={styles.label}>
                  Função/Cargo Responsável de TI:{" "}
                </Text>
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
                <View key={`srv-${idx}`} style={styles.servicoParagraphBlock}>
                  <ServicoStyledBlock lines={block.lines} />
                </View>
              ))
            )}
          </View>
        </View>

        <PdfBottomAnchor
          horariosList={relatorio.horarios}
          totalHorasFmt={totalHorasFmt}
          tecnicoNome={tecnicoNome}
          responsavelCliente={responsavelCliente}
          clienteNome={clienteNome}
        />

        <PdfFooter logoUrl={iconUrl} footer={footer} />
      </Page>
    </Document>
  );
}

/** Gera o Blob do PDF no browser para download. */
export async function buildRelatorioPdfBlob(
  relatorio: ApiReport,
  options?: BuildRelatorioPdfOptions,
): Promise<Blob> {
  return pdf(
    <RelatorioPDF
      relatorio={relatorio}
      logoUrl={options?.logoUrl}
      footer={options?.footer}
    />,
  ).toBlob();
}
