# Prompt — Gerar PDF de Relatório no Backend (Puppeteer)

Copie este documento inteiro para o Cursor no repositório **454-backend** (`C:\Users\Franklyn\Documents\454-backend`).

---

## Contexto

O frontend (Vite + React) hoje gera PDF no browser com `@react-pdf/renderer`, mas o rich text do TipTap (`observacoes` em HTML) não renderiza com fidelidade — espaçamentos incorretos, negrito/itálico instáveis.

**Decisão:** o backend deve gerar o PDF com **Puppeteer + Chromium**, renderizando um **template HTML/CSS** (como o navegador). O frontend já está preparado para consumir:

```
GET /relatorios/:id/pdf-file
→ Content-Type: application/pdf
→ Content-Disposition: attachment; filename="Relatório Técnico - {id}.pdf"
```

Enquanto o endpoint não existir (404/501/503), o front faz **fallback** para react-pdf local.

Variável no front: `VITE_PDF_GENERATOR=server` (padrão).

---

## Objetivo da tarefa

1. Criar serviço `RelatorioPdfService` que gera PDF binário via Puppeteer.
2. Adicionar rota `GET /relatorios/:id/pdf-file` (autenticada, mesmo escopo de unidade que `getRelatorioParaPdf`).
3. Marcar `impresso: true` no relatório ao gerar o PDF (igual ao endpoint JSON atual).
4. Retornar PDF com nome `Relatório Técnico - {id}.pdf`.
5. Injetar HTML do TipTap (`observacoes`) **sem re-parse manual** — usar CSS de impressão.
6. Carregar logo e rodapé de `GET /configuracoes/pdf` (ou reutilizar service existente).

**Manter** `GET /relatorios/:id/pdf` retornando JSON (fallback legado do front).

---

## Stack sugerida (Render.com)

```bash
npm install puppeteer-core @sparticuz/chromium
```

- `@sparticuz/chromium` — Chromium empacotado para serverless/Linux (Render).
- `puppeteer-core` — sem Chromium bundled.

Render: usar instância com **≥ 512 MB RAM**. Cold start do Chromium é esperado.

---

## Contrato da API

### `GET /relatorios/:id/pdf-file`

**Auth:** cookie JWT httpOnly (mesmo middleware `protectedMiddleware`).

**Escopo:** igual `RelatorioService.getRelatorioParaPdf` — filtrar por `scopedUnidadeId` do usuário.

**Resposta sucesso (200):**
```
Content-Type: application/pdf
Content-Disposition: attachment; filename="Relatório Técnico - 3.pdf"
Cache-Control: no-store
Body: <binary PDF>
```

**Erros:**
| Status | Quando |
|--------|--------|
| 400 | ID inválido |
| 403 | Sem unidade / sem permissão |
| 404 | Relatório não encontrado |
| 500 | Falha ao gerar PDF |
| 503 | Chromium indisponível (opcional) |

**Efeito colateral:** `impresso = true` no banco (mesmo comportamento do JSON `/pdf`).

---

## Dados do relatório

Reutilizar `getRelatorioParaPdf(id, scopedUnidadeId)` ou `RELATORIO_INCLUDE_COMPLETO`:

```typescript
interface RelatorioPdfData {
  id: number;
  dataVisita: string;           // ISO
  modalidadeServico?: string;
  numeroContrato?: string | null;
  localizacaoCidade?: string | null;
  localizacaoEstado?: string | null;
  observacoes: string | null;   // HTML TipTap — injetar direto no template
  contatoCargo?: string | null;
  cliente: {
    nomeFantasia: string;
    cidade?: string;
    estado?: string;
  };
  contato: { nome: string; cargo?: string | null } | null;
  criadoPor: { nome: string };
  tecnicos: { nome: string }[];
  setores: {
    observacao: string | null;
    setor: { nome: string };
  }[];
  horarios: {
    horaChegada: string;  // ISO
    horaSaida: string;
  }[];
  checklists: { checklist: { nome: string } }[];
}
```

---

## Configurações PDF e logo (header + footer)

### Upload da logo (ADMIN)
`POST /configuracoes/logo` — campo multipart **`logo`** (nome exato).
Salva em `/uploads/system-logo.{png|jpg|svg|webp}` e grava `logoUrl: "/uploads/system-logo.png"` no banco.

### Na geração do PDF (obrigatório)
**Não** esperar o frontend enviar a logo no `GET /pdf-file`.

1. Buscar `Configuracao` no banco (`logoUrl`)
2. Ler arquivo de `/app/uploads/system-logo.*` (ou path do disco)
3. Converter para **base64** (`data:image/png;base64,...`)
4. Injetar no HTML do template:
   - **Header:** `<img class="header-logo" src="data:..." />` (esquerda, ao lado de "Linq")
   - **Footer:** `<img class="footer-logo" src="data:..." />` (direita, no rodapé corporativo)
   - CSS da logo (header e footer):
     ```css
     .header-logo,
     .footer-logo {
       width: 40px;
       height: 51px;
       object-fit: contain;
     }
     ```

Se `logoUrl` for null ou arquivo ausente → usar placeholder ou omitir.

### Leitura para UI (referência)
`GET /configuracoes/pdf` — retorna `logoUrl` absoluta para sidebar/preview do front.

Campos usados:
- `logoUrl` — URL absoluta ou `/uploads/...`
- `textoRodapeRelatorio` — HTML ou texto do rodapé (endereço, telefone)

Rodapé padrão se vazio:
```
LINQ INFORMÁTICA
Rua Geraldo Pereira, 338 - Sala 704
Alto da Bronze, Estrela/RS - CEP: 95.880-000
Suporte: 51 3720-4462
linqbr / www.linq.com.br
```

---

## Layout do PDF (espelhar frontend)

Referência visual: `components/RelatorioPDF.tsx` no repo **454---Daniel**.

### Estrutura da página A4

1. **Cabeçalho**
   - Logo + "Linq" à esquerda (logo: **40×51 px**, mesma proporção do react-pdf)
   - Título central: `Relatório Técnico - {id}` (uppercase)
   - Meta à direita: `Nº {id}` e `Data: dd/mm/aaaa`

2. **Informações do Cliente** (faixa preta + caixa)
   - Cliente, Contato, Cargo TI, Cidade
   - Modalidade, N° contrato
   - Técnico designado, Data da visita

3. **Detalhamento dos Serviços** (faixa preta + caixa)
   - Para cada setor: título **UPPERCASE** + `• observacao`
   - **HTML TipTap** em `observacoes`:
     ```html
     <div class="servicos-html">
       {{{observacoes}}}  <!-- HTML sanitizado do banco -->
     </div>
     ```
   - CSS crítico para TipTap:
     ```css
     .servicos-html p { margin: 0 0 4px 0; }
     .servicos-html p:last-child { margin-bottom: 0; }
     .servicos-html ul, .servicos-html ol { margin: 4px 0; padding-left: 20px; }
     .servicos-html li { margin: 0; }
     ```

4. **Rodapé fixo (bottom stack)** — empilhado verticalmente, margens laterais 16px:
   - Card amarelo **Detalhamento de Horários** (tabela)
   - Card amarelo **Assinatura dos Responsáveis** (área 44px acima da linha + linha + nomes)
   - Texto legal (fonte 5.5px, cinza, centralizado, 1 linha se possível)
   - Rodapé corporativo (border-top, logo **40×51 px**, site)

### Texto legal (constante)

```
A LINQ INFORMÁTICA EIRELI-ME, seus diretores, sócios e funcionários, ficam ISENTOS DE QUAISQUER RESPONSABILIDADES, sejam elas jurídicas, cíveis, penais ou criminais, referentes ao USO DE LICENÇAS DE SOFTWARE pela EMPRESA CONTRATANTE, na sua sede matriz e respectivas filiais.
```

### Horários — agrupar por período

Períodos: Manhã (< 12h), Tarde (< 18h), Noite (resto).

**Uma linha por período**, horários separados por ` | `:

| Período | Horário | Total |
| Manhã | 05:00 - 09:00 \| 14:00 - 18:00 | (04:00) \| (04:00) |

Total geral na última linha: **Total de Horas**.

### Assinaturas

Duas colunas 48.5%, `space-between`:
- Esquerda: linha → nome do técnico → "LINQ INFORMÁTICA"
- Direita: linha → responsável cliente → nome fantasia cliente

### Nome do arquivo

```
Relatório Técnico - {id}.pdf
```

---

## Implementação sugerida

### Arquivos novos no backend

```
src/
  services/
    relatorio-pdf.service.ts      # Puppeteer + template
  templates/
    relatorio-pdf.html            # Handlebars ou template string
    relatorio-pdf.css             # Estilos @media print
  controllers/
    relatorio.controller.ts       # + downloadPdfFile()
  routes/
    relatorios.routes.ts          # + GET /:id/pdf-file
```

### Exemplo `relatorio-pdf.service.ts`

```typescript
import chromium from "@sparticuz/chromium";
import puppeteer from "puppeteer-core";
import { readFileSync } from "fs";
import { join } from "path";

export class RelatorioPdfService {
  async generatePdfBuffer(relatorio: RelatorioPdfData, config: PdfConfig): Promise<Buffer> {
    const html = this.buildHtml(relatorio, config);

    const browser = await puppeteer.launch({
      args: chromium.args,
      defaultViewport: chromium.defaultViewport,
      executablePath: await chromium.executablePath(),
      headless: chromium.headless,
    });

    try {
      const page = await browser.newPage();
      await page.setContent(html, { waitUntil: "networkidle0" });

      const pdf = await page.pdf({
        format: "A4",
        printBackground: true,
        margin: { top: "16px", right: "16px", bottom: "16px", left: "16px" },
      });

      return Buffer.from(pdf);
    } finally {
      await browser.close();
    }
  }
}
```

### Rota

```typescript
// relatorios.routes.ts — ANTES de /:id para não conflitar
router.get("/:id/pdf-file", RelatorioController.downloadPdfFile);
```

### Controller

```typescript
static async downloadPdfFile(req: AuthRequest, res: Response) {
  const id = parseInt(req.params.id, 10);
  const relatorio = await relatorioService.getRelatorioParaPdf(id, scopedUnidadeId);
  const config = await configuracaoService.findPdfSettings(...);

  const buffer = await relatorioPdfService.generatePdfBuffer(relatorio, config);

  const filename = `Relatório Técnico - ${relatorio.id}.pdf`;
  res.setHeader("Content-Type", "application/pdf");
  res.setHeader("Content-Disposition", `attachment; filename="${filename}"`);
  res.setHeader("Cache-Control", "no-store");
  res.send(buffer);
}
```

**Atenção:** `getRelatorioParaPdf` já marca `impresso`. Não duplicar update.

---

## Sanitização HTML

O banco já sanitiza `observacoes` no save (`sanitizeRichTextHtml` no backend).

No template, **não** executar scripts. Usar biblioteca existente ou DOMPurify no servidor antes de injetar.

---

## Testes manuais

1. Relatório com 3 linhas TipTap (Enter simples) — espaçamento igual ao editor.
2. Negrito e itálico preservados.
3. Listas `ul`/`ol`.
4. Múltiplos horários no mesmo período com `|`.
5. Logo e rodapé customizados de configurações.
6. Técnico sem permissão em outra unidade → 403/404.
7. Filename correto no download do front.
8. `impresso: true` após download.

---

## Integração com frontend (já pronto)

Arquivo: `lib/relatorio-pdf-download.ts`

```typescript
// Padrão: tenta servidor
GET /relatorios/:id/pdf-file
Accept: application/pdf
credentials: include

// Fallback automático se 404/501/503 → react-pdf local
// Forçar legado: VITE_PDF_GENERATOR=client
```

Após deploy do backend, testar com `VITE_PDF_GENERATOR=server` e baixar PDF na listagem/detalhe do relatório.

---

## Checklist de entrega backend

- [ ] `puppeteer-core` + `@sparticuz/chromium` instalados
- [ ] Template HTML/CSS do relatório
- [ ] `GET /relatorios/:id/pdf-file` funcionando
- [ ] `Content-Disposition` com nome correto
- [ ] TipTap HTML renderizado com CSS (sem espaçamento fantasma)
- [ ] Horários agrupados por período com `|`
- [ ] Assinaturas + texto legal + rodapé corporativo
- [ ] Logo/configurações do banco
- [ ] Deploy Render com memória suficiente
- [ ] CORS mantém `credentials: true` para cookie JWT

---

## Referências no frontend

| Arquivo | Conteúdo |
|---------|----------|
| `components/RelatorioPDF.tsx` | Layout completo (referência visual) |
| `lib/relatorio-pdf-download.ts` | Consumo do endpoint |
| `lib/relatorio-naming.ts` | Nome do arquivo |
| `lib/relatorio-pdf-footer.ts` | Rodapé padrão |
| `lib/types.ts` → `ApiReport` | Shape dos dados |
