# Prompt — Otimizar performance do login (`POST /auth/login`)

Copie este documento inteiro para o Cursor no repositório **454-backend** (`C:\Users\Franklyn\Documents\454-backend`).

---

## Contexto

O frontend (Vite + React) consome o backend hospedado no **Render**:

```
VITE_API_URL=https://four54-backend-kk0h.onrender.com
```

A autenticação é via **cookie httpOnly** (JWT). O usuário relatou que o login está **demorando muito** para entrar na plataforma.

Fizemos o mapeamento no frontend e a conclusão é que o gargalo principal está no **backend**, não no React.

---

## Evidências coletadas no frontend

### Medições externas (PowerShell → Render, servidor aquecido)

| Endpoint | Tempo observado | Observação |
|----------|-----------------|------------|
| `GET /health` | ~230–760 ms | Latência de rede + Render |
| `GET /auth/me` | ~250 ms | Sem sessão (401) |
| `POST /auth/login` | **~800–1450 ms** | Mesmo com credencial inválida (401) |

### Fluxo atual no frontend (`lib/auth-context.tsx`)

1. Ao abrir o app: `GET /auth/me` (bootstrap de sessão)
2. Ao clicar "Entrar": `POST /auth/login`
3. **Se o backend NÃO retornar `user` no body do login**, o front faz uma **2ª viagem**: `GET /auth/me` (+ ~250 ms)
4. Após entrar, em paralelo:
   - `GET /relatorios` (página inicial)
   - `GET /configuracoes/pdf` (logo na sidebar)

O botão "Entrando..." só cobre o passo 2 (e eventualmente o passo 3). Se o passo 2 demora ~1 s+, a percepção é de login lento.

### Instrumentação no front (dev)

O frontend loga no console:

```
[auth-perf] POST /auth/login: XXXXms
[auth-perf] GET /auth/me (fallback): XXXXms   ← só aparece se /login não retornar user
[auth-perf] login total: XXXXms
```

Use isso para validar melhorias após deploy.

---

## Objetivo da tarefa

Reduzir o tempo de resposta do login para **< 500 ms** (servidor aquecido) e eliminar viagens HTTP desnecessárias, **sem quebrar** o contrato atual do frontend.

---

## Contrato que o frontend espera

### `POST /auth/login`

**Request:**
```json
{
  "username": "string",
  "password": "string"
}
```

**Headers:** `Content-Type: application/json`  
**Cookies:** `credentials: include` (front envia e espera receber cookie httpOnly)

**Resposta sucesso (200):**
```json
{
  "token": "jwt...",
  "user": {
    "id": 1,
    "username": "admin",
    "nome": "Administrador",
    "role": "ADMIN",
    "clienteId": null,
    "unidadeId": 1
  }
}
```

**Requisitos críticos:**
- O campo **`user` é obrigatório** no body — o front usa isso para entrar imediatamente
- O cookie httpOnly deve ser setado na **mesma resposta** do login
- `role` deve ser `"ADMIN"` ou `"TECNICO"` (uppercase)
- Não depender de uma 2ª chamada a `/auth/me` para o fluxo de login funcionar

**Resposta erro (401):**
```json
{
  "error": "Usuário ou senha inválidos."
}
```

### `GET /auth/me`

**Auth:** cookie httpOnly  
**Resposta (200):** mesmo shape de `user` acima (sem wrapper)

### `POST /auth/logout`

Invalida cookie/sessão. Front chama com `credentials: include`.

### CORS

O frontend roda em origens como `http://localhost:5173` (dev) e domínio de produção. Garantir:

- `Access-Control-Allow-Credentials: true`
- `Access-Control-Allow-Origin` com origem explícita (não `*` quando usa cookie)
- Cookies com `SameSite=None; Secure` se front e back estiverem em domínios diferentes

---

## Suspeitas principais (investigar no backend)

### 1. Bcrypt com rounds altos

Se `bcrypt.hash` usa rounds ≥ 12, cada `compare` pode custar **300–800 ms+**.

**Ações:**
- Verificar `bcrypt rounds` na criação e no compare
- Usar **10–12 rounds** (10 é padrão aceitável; 14+ é lento demais para login síncrono)
- Garantir que senha inválida **não** dispara lógica extra (ex.: múltiplos compares, queries repetidas)

### 2. Cold start do Render

Plano free/spin-down: primeira requisição após inatividade pode levar **30–60 s**.

**Ações:**
- Confirmar se o serviço "dorme" após inatividade
- Avaliar:
  - Upgrade de plano (always-on)
  - Cron externo batendo em `GET /health` a cada 10–14 min
  - Otimizar boot da aplicação (lazy load de Puppeteer/Chromium se estiver no mesmo processo)

### 3. Query lenta ou N+1 no login

**Ações:**
- Logar tempo de cada etapa no `AuthService.login`:
  - busca do usuário no banco
  - `bcrypt.compare`
  - geração do JWT
  - set do cookie
- Garantir índice em `users.username` (ou campo usado no login)
- Evitar joins desnecessários só para montar o `user` do response

### 4. `/auth/login` não retorna `user`

Se hoje o endpoint só seta cookie e retorna `{ token }` sem `user`, o front faz **round-trip extra** para `/auth/me`.

**Ação:** sempre retornar `user` no login (reutilizar o mesmo mapper de `/auth/me`).

### 5. Validação de horário de acesso no login

O front trata `403` com mensagem de horário como redirect para login (`api-client.ts`). Se a validação de horário for pesada ou bloquear após autenticação bem-sucedida, revisar ordem:

1. Validar credenciais (rápido)
2. Validar horário (se necessário, com mensagem clara)
3. Retornar user + cookie

---

## Implementação sugerida

### A. Adicionar logs de performance (temporários)

No controller/service de login:

```typescript
const t0 = performance.now();
const user = await userRepository.findByUsername(username);
console.info(`[login-perf] findUser: ${(performance.now() - t0).toFixed(0)}ms`);

const t1 = performance.now();
const valid = await bcrypt.compare(password, user.passwordHash);
console.info(`[login-perf] bcrypt: ${(performance.now() - t1).toFixed(0)}ms`);

const t2 = performance.now();
const token = signJwt(user);
console.info(`[login-perf] jwt: ${(performance.now() - t2).toFixed(0)}ms`);
```

Deploy, testar um login real, identificar o maior bloco.

### B. Garantir resposta completa no login

```typescript
return res
  .cookie("token", jwt, cookieOptions)
  .status(200)
  .json({
    token: jwt,
    user: toAuthUserDto(user),
  });
```

`toAuthUserDto` deve ser **o mesmo** usado em `GET /auth/me`.

### C. Endpoint de health leve

`GET /health` deve responder em < 100 ms (sem DB pesado, sem Chromium):

```json
{ "status": "ok", "uptime": 12345 }
```

Útil para keep-alive e monitoramento.

### D. (Opcional) Rate limit no login

Proteger contra brute force **sem** atrasar login legítimo:
- rate limit por IP/username
- não adicionar `sleep` artificial em falha de senha

---

## Critérios de aceite

- [ ] `POST /auth/login` com credenciais válidas responde em **< 500 ms** (servidor aquecido, medido via curl/Postman)
- [ ] Resposta inclui **`user` completo** + cookie httpOnly
- [ ] Front **não** dispara `GET /auth/me (fallback)` após login bem-sucedido
- [ ] `POST /auth/login` com credencial inválida responde em **< 500 ms** (sem degradação absurda)
- [ ] Logs `[login-perf]` identificam onde estava o tempo antes/depois
- [ ] Cold start documentado (se plano Render dorme, informar tempo esperado na 1ª req do dia)
- [ ] CORS + cookies funcionando entre front (localhost e produção) e Render

---

## Como validar (checklist pós-deploy)

### 1. curl — login

```bash
curl -w "\nTTFB: %{time_starttransfer}s | Total: %{time_total}s\n" \
  -X POST "https://four54-backend-kk0h.onrender.com/auth/login" \
  -H "Content-Type: application/json" \
  -d '{"username":"SEU_USER","password":"SUA_SENHA"}' \
  -c cookies.txt -v
```

Verificar:
- body contém `user`
- header `Set-Cookie`
- `Total` < 0.5s (aquecido)

### 2. curl — /me com cookie

```bash
curl -w "\nTotal: %{time_total}s\n" \
  "https://four54-backend-kk0h.onrender.com/auth/me" \
  -b cookies.txt
```

### 3. Frontend

1. `npm run dev` no front
2. Login real
3. Console deve mostrar só:
   ```
   [auth-perf] POST /auth/login: <500ms
   [auth-perf] login total: <500ms
   ```
4. **Não** deve aparecer `GET /auth/me (fallback)`

---

## Arquivos prováveis no backend (ajustar conforme estrutura real)

- `src/modules/auth/auth.controller.ts` (ou equivalente)
- `src/modules/auth/auth.service.ts`
- `src/modules/auth/auth.routes.ts`
- middleware JWT / cookie parser
- `src/modules/users/user.repository.ts`
- config CORS (`app.ts` / `main.ts`)
- variáveis de ambiente: `JWT_SECRET`, `COOKIE_DOMAIN`, `NODE_ENV`

---

## Não fazer

- Não remover cookie httpOnly em favor só de token no body (front usa `credentials: include`)
- Não mudar shape de `user` (front tipa `AuthUser` com `id`, `username`, `nome`, `role`, `clienteId`, `unidadeId`)
- Não adicionar `sleep` em falha de login como "proteção" (piora UX e não substitui rate limit)
- Não carregar Puppeteer/Chromium no boot se não for necessário para rotas de auth

---

## Referência — tipos no frontend

Arquivo: `lib/types.ts`

```typescript
export type UserRole = "ADMIN" | "TECNICO";

export interface AuthUser {
  id: number;
  username: string;
  nome: string;
  role: UserRole;
  clienteId: number | null;
  unidadeId: number | null;
}

export interface LoginResponse {
  token: string;
  user: AuthUser;
}
```

Arquivo: `lib/auth-context.tsx` — fluxo de login e fallback `/auth/me`.

---

## Resultado esperado para o usuário final

- Clicar "Entrar" → entrar no dashboard em **menos de 1 segundo** (servidor aquecido)
- Sem "travamento" perceptível no botão "Entrando..."
- Primeira requisição do dia pode ainda ser lenta se Render estiver cold — documentar ou mitigar com keep-alive
