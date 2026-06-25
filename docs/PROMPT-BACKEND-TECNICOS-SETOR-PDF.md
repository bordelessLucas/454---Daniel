# Prompt — Técnicos (Admin) na lista + Setores fora do corpo do PDF

Copie este documento inteiro para o Cursor no repositório **454-backend** (`C:\Users\Franklyn\Documents\454-backend`).

---

## Contexto

Dois ajustes de negócio identificados no fluxo de **Relatório Técnico**:

1. **Admins também são técnicos** — usuários com role `ADMIN` criam relatórios e devem aparecer na lista "Técnicos Envolvidos" ao criar/editar relatório. Exemplo real: conta `dfrizon` (ADMIN) não aparecia na lista.
2. **Setores não devem aparecer no corpo "Detalhamento dos Serviços"** — setores são selecionados em campo próprio no formulário e exibidos em seção separada na tela de detalhe. Não devem ser repetidos dentro do bloco de detalhamento (nem no PDF).

### O que o frontend já fez (repo **454---Daniel**)

| Ajuste | Arquivo | Comportamento |
|--------|---------|---------------|
| Workaround parcial para admins | `hooks/use-tecnicos.ts` | Se logado como ADMIN, mescla `GET /users` com `GET /users/tecnico` |
| Preview do formulário | `components/report-form.tsx` | Removeu linha `Setores:` do bloco "Detalhamento dos Serviços" no resumo |
| Tela de detalhe | `src/pages/dashboard/RelatorioDetalhePage.tsx` | Setores já ficam em seção própria "Detalhes dos Setores"; `observacoes` só no "Detalhamento dos Serviços" |

**Limitação do workaround no front:** um usuário `TECNICO` ainda não consegue listar admins via `GET /users` (rota restrita a ADMIN). A correção definitiva é no backend.

---

## Objetivo da tarefa

### Tarefa A — `GET /users/tecnico` incluir ADMINs

Alterar o endpoint para retornar **todos os usuários elegíveis para relatório técnico**:

- `role IN ('ADMIN', 'TECNICO')`
- `ativo = true`
- Escopo por `unidadeId` (mesma regra dos demais endpoints de usuário)
- Ordenar por `nome` ASC

### Tarefa B — PDF: setores fora de "Detalhamento dos Serviços"

Alterar o template HTML do Puppeteer (`RelatorioPdfService` / template do `GET /relatorios/:id/pdf-file`) para **não** renderizar setores dentro da seção "Detalhamento dos Serviços".

Setores devem aparecer **apenas** em seção dedicada (se houver conteúdo), espelhando o frontend.

---

## Tarefa A — Detalhes do endpoint

### Rota atual (referência)

```
GET /users/tecnico
Auth: cookie JWT httpOnly (usuário autenticado)
```

### Comportamento atual (problema)

Provavelmente filtra apenas `role = 'TECNICO'`, excluindo admins como `dfrizon`.

### Comportamento esperado

```typescript
// Pseudocódigo — user.repository ou equivalente
async findTecnicosParaRelatorio(scopedUnidadeId: number): Promise<User[]> {
  return prisma.user.findMany({
    where: {
      ativo: true,
      role: { in: ['ADMIN', 'TECNICO'] },
      unidadeId: scopedUnidadeId, // manter regra de escopo existente
    },
    select: {
      id: true,
      username: true,
      nome: true,
      email: true,
      role: true,
      clienteId: true,
      ativo: true,
      createdAt: true,
      updatedAt: true,
      cliente: { select: { id: true, nomeFantasia: true } },
    },
    orderBy: { nome: 'asc' },
  });
}
```

### Contrato de resposta (inalterado)

Mesmo shape de `ApiUser` que o front já consome:

```typescript
interface ApiUser {
  id: number;
  username: string;
  nome: string;
  email: string;
  role: 'ADMIN' | 'TECNICO';
  clienteId: number | null;
  ativo: boolean;
  createdAt: string;
  updatedAt: string;
  cliente?: { id: number; nomeFantasia: string };
}
```

### Permissão

- `TECNICO` e `ADMIN` autenticados podem chamar `GET /users/tecnico` (já usado no formulário de relatório).
- **Não** exigir role ADMIN para este endpoint — técnicos precisam listar colegas e admins ao criar relatório.

### Critérios de aceite — Tarefa A

- [ ] `GET /users/tecnico` retorna usuários `ADMIN` e `TECNICO` ativos da unidade
- [ ] Conta `dfrizon` (ADMIN) aparece na lista
- [ ] Usuários inativos (`ativo = false`) **não** aparecem
- [ ] Técnico logado consegue ver admins na lista sem chamar `GET /users`
- [ ] Após deploy, o front pode simplificar `hooks/use-tecnicos.ts` (opcional) — mas não é bloqueante

### Arquivos prováveis no backend

- `src/modules/users/user.repository.ts`
- `src/modules/users/user.service.ts`
- `src/modules/users/user.controller.ts` ou router equivalente

---

## Tarefa B — Detalhes do PDF

### Problema

O doc `PROMPT-BACKEND-PDF-PUPPETEER.md` (seção "Layout do PDF") instrui:

> **Detalhamento dos Serviços**: Para cada setor: título UPPERCASE + `• observacao`

Essa regra está **desatualizada**. O cliente pediu que setores **não** apareçam no corpo do detalhamento.

### Layout correto (atualizado)

#### Seção: Informações do Cliente

Sem alteração. Continua exibindo:

- Cliente, Contato, Cargo, Cidade/UF
- Modalidade, Nº contrato (se aplicável)
- **Técnico designado** (nomes de `relatorio.tecnicos`)
- Data da visita

#### Seção: Detalhamento dos Serviços

Conteúdo **apenas**:

1. HTML TipTap de `observacoes` (rich text do campo "Detalhamento dos Serviços" do formulário)
2. *(Opcional)* lista de checklists — o front hoje mostra checklists no preview; no detalhe web ficam em seção separada. **Não** incluir setores aqui.

```html
<section class="detalhamento-servicos">
  <div class="section-header">Detalhamento dos Serviços</div>
  <div class="section-body">
    <!-- REMOVER qualquer loop de setores daqui -->
    <div class="servicos-html">
      {{{observacoes}}}  <!-- HTML sanitizado; pode ser null/vazio -->
    </div>
  </div>
</section>
```

Se `observacoes` for null ou vazio, exibir texto discreto: *"Sem detalhamento dos serviços preenchido."*

#### Seção: Detalhes dos Setores *(nova seção no PDF, condicional)*

Renderizar **somente se** `relatorio.setores.length > 0`.

Espelhar `RelatorioDetalhePage.tsx` no front:

```html
{{#if setores.length}}
<section class="detalhes-setores">
  <div class="section-header">Detalhes dos Setores</div>
  <div class="section-body">
    {{#each setores}}
    <div class="setor-card">
      <p class="setor-nome">{{setor.nome}}</p>
      {{#if setor.descricao}}
      <p class="setor-descricao">{{setor.descricao}}</p>
      {{/if}}
      {{#if observacao}}
      <p class="setor-observacao">{{observacao}}</p>
      {{/if}}
    </div>
    {{/each}}
  </div>
</section>
{{/if}}
```

**Nota:** `setor.descricao` vem do cadastro de setores; `observacao` é o campo por-relacionamento (hoje o front envia `undefined` — manter suporte para uso futuro).

#### Seção: Checklists *(condicional, se já existir no template)*

Manter em seção própria, **fora** de "Detalhamento dos Serviços", como no front.

### O que REMOVER do template

- Loop `{{#each setores}}` dentro de `.detalhamento-servicos` / `.servicos-html`
- Linha textual `Setores: Nome1, Nome2` no corpo do detalhamento
- Qualquer listagem de nomes de setores misturada com `observacoes`

### Atualizar documentação interna

Corrigir `PROMPT-BACKEND-PDF-PUPPETEER.md` no repo do front (ou comentário no backend) para não instruir mais setores dentro do detalhamento.

### Critérios de aceite — Tarefa B

- [ ] PDF gerado **não** lista setores dentro de "Detalhamento dos Serviços"
- [ ] `observacoes` (HTML TipTap) renderiza normalmente na mesma seção
- [ ] Se o relatório tiver setores, aparecem em seção separada "Detalhes dos Setores"
- [ ] Relatório sem setores não exibe seção vazia de setores
- [ ] `GET /relatorios/:id/pdf` (JSON legado) permanece compatível

### Arquivos prováveis no backend

- `src/modules/relatorios/relatorio-pdf.service.ts`
- Template HTML Handlebars/EJS do PDF
- CSS de impressão do relatório

---

## Payload do relatório (referência front → API)

Ao salvar relatório, o front envia:

```typescript
{
  // ...demais campos
  tecnicos: string[];           // nomes dos técnicos selecionados
  setores: {
    setorId: number;
    observacao?: string;
  }[];
  observacoes?: string;         // HTML TipTap — único conteúdo do "corpo" do detalhamento
  checklists: { checklistId: number }[];
}
```

O backend deve continuar aceitando admins em `tecnicos` (vincular por nome ou ID conforme implementação atual).

---

## Testes manuais sugeridos

### Tarefa A

1. Login como `dfrizon` (ADMIN) → criar relatório → campo "Técnicos Envolvidos" deve listar `dfrizon`
2. Login como técnico → mesma lista deve incluir admins da unidade
3. Desativar um admin → não deve aparecer em `GET /users/tecnico`

### Tarefa B

1. Criar relatório com setores selecionados + texto em "Detalhamento dos Serviços"
2. Baixar PDF (`GET /relatorios/:id/pdf-file`)
3. Verificar:
   - Corpo do detalhamento = só o rich text
   - Setores em seção separada abaixo (ou posição definida no template, mas **não** no corpo)
4. Relatório sem setores → PDF sem seção de setores

---

## Resumo executivo

| # | Onde | O quê |
|---|------|-------|
| A | `GET /users/tecnico` | Incluir `ADMIN` + `TECNICO` ativos (escopo por unidade) |
| B | Template PDF Puppeteer | Tirar setores de "Detalhamento dos Serviços"; seção própria condicional |

Após deploy do backend, o workaround em `hooks/use-tecnicos.ts` no front continua funcionando, mas pode ser simplificado para usar apenas `GET /users/tecnico`.
