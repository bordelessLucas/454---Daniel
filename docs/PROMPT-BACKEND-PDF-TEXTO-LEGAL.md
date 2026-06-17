# Prompt — Ajustar texto legal no PDF (`GET /relatorios/:id/pdf-file`)

Copie este documento inteiro para o Cursor no repositório **454-backend** (`C:\Users\Franklyn\Documents\454-backend`).

---

## Contexto

O frontend gera PDF pelo **servidor** por padrão:

```
VITE_PDF_GENERATOR=server   (padrão quando não definido)
GET /relatorios/:id/pdf-file → PDF binário (Puppeteer + HTML/CSS)
```

As alterações feitas em `RelatorioPDF.tsx` (react-pdf no browser) **não aparecem** no PDF baixado pelo usuário, porque o fluxo de produção usa o template HTML do backend.

**Feedback do cliente:** o bloco de isenção de responsabilidade (texto legal) precisa:
1. Ficar **fora** do card de assinaturas, **logo abaixo** dele
2. Ter **fonte um pouco maior** (era ~5.5px, muito pequena)
3. Estar **alinhado à esquerda** (não centralizado)
4. Ter **respiro claro** entre o quadro de assinaturas e o texto legal

---

## Objetivo da tarefa

Ajustar o template HTML/CSS do PDF gerado por Puppeteer para que o texto legal siga o layout abaixo, alinhado ao que o frontend já implementou no fallback react-pdf (`components/RelatorioPDF.tsx`).

---

## Layout correto do bottom stack (ordem vertical)

Margens laterais da página: **16px**.

```
┌─────────────────────────────────────────────┐
│  CARD: Detalhamento de Horários             │
└─────────────────────────────────────────────┘
        ↓ margin-top: 10px
┌─────────────────────────────────────────────┐
│  CARD: Assinatura dos Responsáveis          │
│  (título amarelo + corpo com borda)         │
│  [área assinatura] [área assinatura]        │
│  ─────────────     ─────────────            │
│  Nome técnico      Nome responsável         │
│  LINQ INFORMÁTICA  Nome fantasia cliente    │
└─────────────────────────────────────────────┘
        ↓ margin-top: 16px  ← FORA do card
  Texto legal alinhado à esquerda, fonte 7px
        ↓ margin-bottom: 8px
┌─────────────────────────────────────────────┐
│  RODAPÉ CORPORATIVO (border-top)            │
│  endereço/contato | site | logo 40×51       │
└─────────────────────────────────────────────┘
```

**Importante:** o texto legal **não** pode estar dentro de `.highlight-body`, `.signatures-card` ou qualquer container do card de assinaturas. Deve ser um elemento **irmão** do card, após o fechamento do card.

---

## Texto legal (constante)

Usar este texto (com **EIRELI-ME**, conforme documento original e PDF em produção):

```
A LINQ INFORMÁTICA EIRELI-ME, seus diretores, sócios e funcionários, ficam ISENTOS DE QUAISQUER RESPONSABILIDADES, sejam elas jurídicas, cíveis, penais ou criminais, referentes ao USO DE LICENÇAS DE SOFTWARE pela EMPRESA CONTRATANTE, na sua sede matriz e respectivas filiais.
```

*(Futuro opcional: campo na API/configurações para texto dinâmico — por ora, constante no template.)*

---

## CSS esperado

Substituir o estilo antigo (`font-size: 5.5px; text-align: center`) por:

```css
.legal-text {
  width: 100%;
  margin-top: 16px;        /* respiro após o card de assinaturas */
  margin-bottom: 8px;      /* folga antes do rodapé corporativo */
  padding: 0;
  font-size: 7px;          /* era 5.5px — aumento moderado pedido pelo cliente */
  line-height: 1.2;
  text-align: left;        /* era center */
  color: #374151;
  font-family: Helvetica, Arial, sans-serif;
}
```

**Não** usar `text-align: center` nem `font-size: 5.5px`.

---

## HTML esperado (estrutura)

O bloco legal deve ficar **depois** do card de assinaturas e **antes** do rodapé corporativo:

```html
<div class="page-bottom-stack">
  <!-- Card horários -->
  <div class="highlight-card">...</div>

  <!-- Card assinaturas -->
  <div class="highlight-card signatures-card">
    <div class="highlight-title">Assinatura dos Responsáveis</div>
    <div class="highlight-body highlight-body-signatures">
      <div class="signatures">...</div>
    </div>
  </div>

  <!-- TEXTO LEGAL — FORA do card de assinaturas -->
  <p class="legal-text">
    A LINQ INFORMÁTICA EIRELI-ME, seus diretores, sócios e funcionários, ficam ISENTOS DE QUAISQUER RESPONSABILIDADES, sejam elas jurídicas, cíveis, penais ou criminais, referentes ao USO DE LICENÇAS DE SOFTWARE pela EMPRESA CONTRATANTE, na sua sede matriz e respectivas filiais.
  </p>
</div>

<footer class="corporate-footer">...</footer>
```

---

## Referência no frontend (fallback react-pdf)

Arquivo: `components/RelatorioPDF.tsx`

Constantes e estilos equivalentes (para espelhar no HTML):

| Propriedade | Valor |
|-------------|-------|
| `LEGAL_GAP_BELOW_SIGNATURES` | `16px` (margin-top do legal) |
| `LEGAL_GAP_ABOVE_FOOTER` | `8px` |
| `legalText.fontSize` | `7` |
| `legalText.textAlign` | `left` |
| `legalText.color` | `#374151` |
| `legalText.lineHeight` | `1.2` |

Componente `PdfLegalText` renderizado em `PdfBottomAnchor` **após** o fechamento do card de assinaturas (não dentro dele).

---

## Arquivos prováveis no backend

Ajustar conforme a estrutura real do projeto:

- `src/modules/relatorios/templates/relatorio-pdf.html` (ou `.ejs` / `.hbs`)
- `src/modules/relatorios/templates/relatorio-pdf.css`
- `src/modules/relatorios/RelatorioPdfService.ts` (se CSS é inline)
- Qualquer partial de "footer" / "bottom stack" que hoje inclua o legal **dentro** do card de assinaturas

**Buscar no código:** `legal`, `isenção`, `ISENTOS`, `5.5px`, `text-align: center`, `EIRELI-ME`.

---

## O que corrigir (checklist de bugs comuns)

- [ ] Texto legal estava **dentro** do `.highlight-body` do card de assinaturas → mover para fora
- [ ] `font-size: 5.5px` → alterar para `7px`
- [ ] `text-align: center` → alterar para `left`
- [ ] Falta de `margin-top` entre assinaturas e legal → adicionar `16px`
- [ ] Texto colado no rodapé corporativo → `margin-bottom: 8px` no legal
- [ ] `@page` / `padding-bottom` insuficiente → garantir que conteúdo dinâmico não sobreponha o bottom stack

---

## Critérios de aceite

- [ ] PDF gerado via `GET /relatorios/:id/pdf-file` exibe texto legal **abaixo** do card de assinaturas, **fora** da borda do card
- [ ] Texto alinhado à **esquerda**, fonte **7px**, cor `#374151`
- [ ] Espaço visível (~16px) entre a borda inferior do card de assinaturas e o início do texto legal
- [ ] Texto legível (maior que o 5.5px anterior) sem sobrepor o rodapé corporativo
- [ ] Conteúdo do texto inclui **"A LINQ INFORMÁTICA EIRELI-ME"**
- [ ] Frontend continua baixando PDF sem mudança de contrato (`Content-Type: application/pdf`)

---

## Como validar

### 1. Backend direto

```bash
curl -o teste.pdf \
  -b "seu_cookie_de_sessao" \
  -H "Accept: application/pdf" \
  "https://four54-backend-kk0h.onrender.com/relatorios/ID/pdf-file"
```

Abrir `teste.pdf` e inspecionar visualmente o bloco legal.

### 2. Pelo frontend

1. Deploy do backend com a correção
2. No front, **não** definir `VITE_PDF_GENERATOR=client` (manter padrão `server`)
3. Baixar PDF em Relatórios → ícone PDF
4. DevTools → Network: confirmar requisição `pdf-file` (não é geração local)

### 3. Comparação antes/depois

| Item | Antes (incorreto) | Depois (esperado) |
|------|-------------------|-------------------|
| Posição | Dentro ou colado ao card / centralizado flutuante | Fora do card, abaixo das assinaturas |
| Alinhamento | `center` | `left` |
| Fonte | `5.5px` | `7px` |
| Margem superior | Pouca ou nenhuma | `16px` |

---

## Não fazer

- Não alterar o contrato de `GET /relatorios/:id/pdf-file` (continua retornando PDF binário)
- Não remover o card de assinaturas nem o rodapé corporativo
- Não centralizar o texto legal (feedback explícito do cliente)
- Não depender do `RelatorioPDF.tsx` do frontend — a correção é **só no template Puppeteer**

---

## Atualizar também

Se existir documentação interna ou comentário no template com:

> "Texto legal (fonte 5.5px, cinza, centralizado)"

Atualizar para:

> "Texto legal fora do card de assinaturas: fonte 7px, cor #374151, alinhado à esquerda, margin-top 16px"

Referência cruzada: `docs/PROMPT-BACKEND-PDF-PUPPETEER.md` (seção bottom stack) — alinhar com este documento após o fix.
