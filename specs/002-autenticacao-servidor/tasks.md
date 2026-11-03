---

description: "Lista de tarefas da Spec 02: autenticação e autorização no servidor"
---

# Tasks: Autenticação e autorização no servidor

**Input**: documentos de design em `specs/002-autenticacao-servidor/`

**Prerequisites**: [plan.md](./plan.md), [spec.md](./spec.md), [research.md](./research.md),
[data-model.md](./data-model.md), [contracts/session-api.md](./contracts/session-api.md),
[contracts/graphql-schema.md](./contracts/graphql-schema.md), [quickstart.md](./quickstart.md)

**Tests**: pedidos explicitamente pela spec (casos G1–G5, A1–A11, R1–R7, C1–C4). Em cada história, os testes vêm
**antes** da implementação e devem falhar primeiro.

**Organization**: tarefas agrupadas por história de usuário. US1 e US2 são P1 e vão juntas para produção (com US3);
US4 é a implantação.

## Format: `[ID] [P?] [Story] Description`

- **[P]**: pode rodar em paralelo (arquivos diferentes, sem dependência de tarefa incompleta)
- **[Story]**: história de usuário da tarefa (US1, US2, US3, US4)

## Regras que valem para todas as tarefas

- NÃO tocar `src/utils/validateUnits.ts` nem nenhum arquivo da Spec 01 em `src/utils/__tests__/` (Princípio II). Só `src/utils/__tests__/session.test.ts` é novo nessa pasta.
- Sem `any` em código novo nem nas linhas tocadas (Princípio IV); tipos explícitos.
- Nenhuma lógica nem teste de auth dentro de `src/pages/` (exceto a entrada fina `src/pages/api/session.ts`).
- Nenhum `console.*` com token, sessão, e-mail ou id de usuário (FR-023). Erros de `verifyIdToken` incluem o token
  inteiro: nunca logar nem repassar (research R1).
- Nenhum teste acessa rede, AWS ou `.env.local`: configuração passada explicitamente, `now` injetado.
- Testes ficam em `src/**/__tests__/**/*.test.ts` (padrão do `vitest.config.ts`, que não muda); alias `@/` = `src/`.

---

## Phase 1: Setup (infraestrutura compartilhada)

**Purpose**: preparar diretórios e o segredo local. Nenhuma dependência nova é instalada.

- [ ] T001 Criar os diretórios `src/server/auth/` e `src/server/__tests__/helpers/` (estrutura do plan.md)
- [ ] T002 [P] Adicionar `SESSION_SECRET` ao `.env.local` (gerado com `openssl rand -base64 48`; conferir que `.env.local` continua ignorado pelo `.gitignore`) e confirmar que `NEXT_PUBLIC_OAUTH_ID` já existe lá; NÃO adicionar `SESSION_SECRET` ao bloco `env` de `next.config.js`

---

## Phase 2: Foundational (pré-requisitos bloqueantes)

**Purpose**: configuração, erros e assinatura/verificação da sessão, usados por US1 (verificar) e US2 (emitir).

**⚠️ CRITICAL**: nenhuma história começa antes desta fase terminar.

- [ ] T003 [P] Criar `src/server/auth/config.ts`: exportar `SESSION_ALGORITHM = 'HS256'` e `SESSION_TTL_SECONDS = 24 * 60 * 60`; tipo `AuthConfig = { sessionSecret: string; oauthClientId: string }`; `loadAuthConfig(env: Record<string, string | undefined>)` lê `SESSION_SECRET` e `NEXT_PUBLIC_OAUTH_ID` e devolve `{ ok: true, config } | { ok: false }`. Regras do data-model: `sessionSecret` "obrigatório; `Buffer.byteLength(utf8) >= 32`; nunca logado"; `oauthClientId` "obrigatório, não vazio". Exportar também a mensagem fixa `CONFIG_ERROR_MESSAGE = 'auth: configuração ausente ou inválida'` (sem nomes nem valores de variáveis)
- [ ] T004 [P] Criar `src/server/auth/errors.ts`: `UnauthenticatedError` estendendo `AuthenticationError` de `apollo-server-micro` (código `UNAUTHENTICATED`, mensagem genérica sem motivo da recusa) e `ConfigError` (erro interno genérico, mensagem `'Internal server error'`, para virar HTTP 500 no Apollo — research R4)
- [ ] T005 Criar `src/server/auth/session.ts` (depende de T003, T004): tipo `SessionClaims = { sub: string; email: string; name?: string; picture?: string; iat: number; exp: number }`; `signSession(claims: Omit<SessionClaims, 'iat' | 'exp'>, secret: string, now: number): string` que define `iat = floor(now/1000)` e `exp = iat + SESSION_TTL_SECONDS` e chama `jwt.encode(payload, secret, 'HS256')` com algoritmo explícito; `verifySession(token: string, secret: string, now: number): SessionClaims` que, nesta ordem (data-model), lança `UnauthenticatedError` se: (1) não tiver três segmentos ou o cabeçalho base64url não for JSON com `alg === 'HS256'`; (2) `jwt.decode(token, secret, false, 'HS256')` lançar; (3) `exp` não for número ou `exp * 1000 <= now`; (4) `sub` não for string não vazia. Nunca incluir o token ou o erro da biblioteca na mensagem
- [ ] T006 [P] Criar o helper de teste `src/server/__tests__/helpers/googleTokens.ts` (research R1): gerar par RSA com `crypto.generateKeyPairSync('rsa', { modulusLength: 2048 })`, expor `kid`, um mapa de certificados PEM para devolver de `getFederatedSignonCertsAsync` (formato `{ certs: { [kid]: pem }, format: CertificateFormat.PEM }`), e `signGoogleIdToken(payload, { kid, privateKey })` que monta o JWT RS256 com `crypto.sign('RSA-SHA256', ...)` em base64url; incluir uma fábrica `googlePayload(overrides)` com `iss: 'https://accounts.google.com'`, `aud`, `sub`, `email`, `given_name`, `picture`, `iat`, `exp` (+1h). Sem rede e sem dependência nova

**Checkpoint**: `yarn type-check` passa; histórias podem começar.

---

## Phase 3: User Story 1 - Ninguém lê ou altera as tabelas de outra pessoa (Priority: P1) 🎯 MVP

**Goal**: toda operação GraphQL exige sessão válida; os resolvers usam só `context.user`; argumentos de identidade
saem do contrato; apagar é condicional e aguardado.

**Independent Test**: `yarn test` roda A1–A11 (`getAuthenticatedUser`), R1–R6 (resolvers com `client.send`
simulado) e R7 (schema) com sessões assinadas no próprio teste; todos verdes.

### Tests for User Story 1 ⚠️ (escrever primeiro; devem falhar)

- [ ] T007 [P] [US1] Criar `src/server/__tests__/getAuthenticatedUser.test.ts` com A1–A11 chamando `getAuthenticatedUser(authorizationHeader, configResult, now)`: A1 `undefined`; A2 `'Basic abc'`; A3 `'Bearer '` (e `'Bearer'`, `''`); A4 `'Bearer abc.def'` e `'Bearer x.y.z'`; A5 sessão assinada com outro segredo de 32+ bytes; A6 sessão com `exp` no passado em relação a `now`; A7 cabeçalho `alg: 'none'` com assinatura vazia e cabeçalho `alg: 'HS512'` assinado em HS256 com o segredo certo; A8 sessão válida sem `sub`; A9 sessão válida → `{ id: sub, email }`; A10 `{ ok: false }` (segredo ausente e segredo de 31 bytes via `loadAuthConfig`) → lança `ConfigError`, nunca devolve usuário; A11 token RS256 de `googleTokens.ts` → `UNAUTHENTICATED`. Para A1–A8 e A11, conferir `extensions.code === 'UNAUTHENTICATED'`. Incluir também casos de `loadAuthConfig` (secret com exatamente 32 bytes aceito; `NEXT_PUBLIC_OAUTH_ID` vazio → `ok: false`); A6 inclui as bordas de 24h com `now` injetado: sessão emitida em `iat` é aceita em `iat + 24h − 1s` e recusada em `iat + 24h` (`exp * 1000 <= now`).
- [ ] T008 [P] [US1] Criar `src/server/__tests__/schema.test.ts` (R7): ler `src/pages/api/schemas/schema.graphql` com `fs`, `buildSchema` do pacote `graphql`, e conferir que nenhum campo de `Query` e `Mutation` tem argumento `user`, `email` ou `id`, exceto `deleteUserDocument(id: ID!)` (id do documento); conferir também as assinaturas exatas do contrato (`getUser`, `getUserDocuments`, `setUser` sem argumentos; `saveUserDocument(document: DocumentInput!)`)
- [ ] T009 [P] [US1] Criar `src/server/__tests__/resolvers.test.ts` (R1–R6): `vi.spyOn(client, 'send')` no `client` exportado por `@/pages/api/utils/dynamoDB` (nenhuma chamada real à AWS); definir `process.env.AWS_DOCUMENTS_TABLE`/`AWS_USER_TABLE` fictícios no teste. R1: `buildContext({ req: { headers: {} } })` lança `UNAUTHENTICATED` e `client.send` não é chamado (não lista vazia). R2: `getUserDocuments(_, {}, { user: A })` → o `ScanCommand` enviado tem `ExpressionAttributeValues` com `:ID = A`, e argumentos extras `{ id: B }` são ignorados. R3: `saveUserDocument(_, { document: { ..., user_id: B } , user: B }, { user: A })` → `UpdateItemCommand` com `Key.user_id = A`. R4: `deleteUserDocument(_, { id: docDeB }, { user: A })` com `send` rejeitando `ConditionalCheckFailedException` → erro `extensions.code === 'NOT_FOUND'` e mensagem "Tabela não encontrada"; o `DeleteItemCommand` tem `Key { id, user_id: A }` e `ConditionExpression: 'attribute_exists(id)'`; sucesso → `true`; outro erro do banco → lança (nunca `false`). R5: `setUser(_, { id: B, email: 'b@x' }, { user: { id: A, email: 'a@x' } })` grava `uid = A`, `email = 'a@x'`; com `email` vazio na sessão, não grava `email` e não falha. R6: `getUser(_, { id: B }, { user: A })` → `GetItemCommand` com `Key.uid = A`. Os resolvers importam `../utils`, que carrega `service/auth.ts` (cria um `JWT` na importação). Sempre incluir `vi.mock('@/pages/api/utils/service', () => ({}))` no topo do arquivo, para que a importação de `../utils` não crie o `JWT` da conta de serviço. Em todo o arquivo, definir antes de cada teste `vi.stubEnv('SESSION_SECRET', '<texto fictício com 32+ bytes>')` e `vi.stubEnv('NEXT_PUBLIC_OAUTH_ID', 'test-client-id')` e restaurar com `vi.unstubAllEnvs()` no `afterEach`. R1 exige `UNAUTHENTICATED`, nunca `ConfigError`.

### Implementation for User Story 1

- [ ] T010 [US1] Criar `src/server/auth/getAuthenticatedUser.ts` (depende de T005): tipo `AuthenticatedUser = { id: string; email: string }`; `getAuthenticatedUser(authorizationHeader: string | undefined, configResult: ReturnType<typeof loadAuthConfig>, now: number): AuthenticatedUser`. Com `ok: false`: `console.error(CONFIG_ERROR_MESSAGE)` e lança `ConfigError`. Exige `/^Bearer (\S+)$/` exato; senão `UnauthenticatedError`. Chama `verifySession` e devolve `{ id: claims.sub, email: claims.email || '' }`. Faz T007 passar
- [ ] T011 [US1] Criar `src/server/graphqlContext.ts` (depende de T010): tipo `GraphQLContext = { user: AuthenticatedUser }`; `buildContext({ req }: { req: { headers: { authorization?: string } } }): GraphQLContext` que chama `getAuthenticatedUser(req.headers.authorization, loadAuthConfig(process.env), Date.now())`
- [ ] T012 [US1] Em `src/pages/api/graphql.ts`, passar `context: buildContext` ao `new ApolloServer({...})` (import de `@/server/graphqlContext`); nada mais muda no handler/CORS
- [ ] T013 [US1] Em `src/pages/api/schemas/schema.graphql`, aplicar o contrato de `contracts/graphql-schema.md`: `getUser: User!`, `getUserDocuments: UserDocuments`, `setUser: User!`, `saveUserDocument(document: DocumentInput!): Document`, `deleteUserDocument(id: ID!): Boolean`; tipos `User`, `Document`, `UserDocuments`, `DocumentInput` sem mudança. Faz T008 passar
- [ ] T014 [US1] Em `codegen.yml`, trocar `schema: 'http://localhost:9090/api/graphql'` por `schema: 'src/pages/api/schemas/schema.graphql'`; rodar `yarn graphql-generator` para regenerar `src/pages/api/schemas/gql/**` e `src/api/graphql.tsx`; conferir no diff que os hooks gerados (`useGetUserQuery`, `useGetUserDocumentsQuery`, `useSetUserMutation`, `useSaveUserDocumentMutation`, `useDeleteUserDocumentMutation`) perderam as variáveis de identidade (depende de T013)
- [ ] T015 [US1] Em `src/pages/api/resolvers/handleUserDocuments.ts`: os três resolvers recebem `(_parent: unknown, args, context: GraphQLContext)` com tipos explícitos de argumento. `getUserDocuments` filtra por `context.user.id` (remover `{ id }` e o `if(!id)`); `saveUserDocument(_, { document }, { user })` grava `user_id: user.id` sobrescrevendo qualquer `user_id` do corpo (espalhar `document` antes de `user_id`); `deleteUserDocument(_, { id }, { user })` faz `await client.send(new DeleteItemCommand({ TableName, Key: marshall({ id, user_id: user.id }), ConditionExpression: 'attribute_exists(id)' }))`, devolve `true`, converte `ConditionalCheckFailedException` (checar `err.name`) em `new ApolloError('Tabela não encontrada', 'NOT_FOUND')` e relança qualquer outro erro como erro genérico sem detalhes (nunca `false`); não logar ids. Manter o tratamento atual de erros do banco em list/save (research R10)
- [ ] T016 [US1] Em `src/pages/api/resolvers/handleUser.ts`: `getUser(_, _args, { user })` usa `handleGetUser(user.id)`; `setUser(_, _args, { user })` usa `handleSetUser({ id: user.id, email: user.email })`; em `handleSetUser`, exigir só `id` e gravar `email` apenas se não vazio (Item `{ uid: id, ...(email ? { email } : {}) }`), sem falhar por falta de e-mail; tipar parâmetros e contexto. Remover dos `console.error` qualquer valor de id/e-mail. T009 passa (depende de T011, T015)
- [ ] T017 [US1] Remover os argumentos de identidade do cliente para o type-check continuar verde (depende de T014): em `src/contexts/SettingsProvider/index.tsx` tirar `variables: { id: userData.id }` de `useGetUserQuery`/`useGetUserDocumentsQuery` mantendo `skip: !userData.id`, e `variables: { id, email }` de `setUser`; em `src/contexts/CalcTablesProvider/index.tsx` tirar `user: userData.id` de `saveUserTable` e mudar `deleteCalcTable(id, user)` para `deleteCalcTable(id)` com `variables: { id }`; em `src/components/CalcTableList/index.tsx` chamar `deleteCalcTable(expandTable.id)` e remover `userData` se ficar sem uso; tratar o erro `NOT_FOUND` do delete sem quebrar a tela (manter a tabela na lista e o fluxo atual de mensagem)

**Checkpoint**: `yarn test` (A1–A11, R1–R7) e `yarn type-check` verdes. Ainda não implantável sozinha: o cliente
não envia sessão (US2/US3).

---

## Phase 4: User Story 2 - Login uma vez por dia, como hoje (Priority: P1)

**Goal**: `POST /api/session` troca o token do Google por uma sessão HS256 de 24h; o cliente guarda só a sessão e
continua mostrando nome e foto.

**Independent Test**: G1–G5 em `createSession.test.ts`, mapeamento HTTP em `sessionRoute.test.ts` e C1 em
`src/utils/__tests__/session.test.ts`, com `OAuth2Client` real e certificados locais; todos verdes.

### Tests for User Story 2 ⚠️ (escrever primeiro; devem falhar)

- [ ] T018 [P] [US2] Criar `src/server/__tests__/createSession.test.ts` (G1–G5): usar `new OAuth2Client()` real com `vi.spyOn(client, 'getFederatedSignonCertsAsync')` devolvendo os certificados de `googleTokens.ts`; `now` injetado. G1: token válido → sessão que `verifySession` aceita, com `sub`, `email`, `name` (preferindo `given_name`), `picture` e `exp === iat + 86400`. G2: `credential` `undefined`, `''`, `123`, `'abc'`, token com assinatura de outra chave → `UnauthenticatedError`. G3: token com `exp` no passado → `UNAUTHENTICATED`. G4: `aud` de outro app → `UNAUTHENTICATED`. G5: config `{ ok: false }` (sem `NEXT_PUBLIC_OAUTH_ID`) → `ConfigError` sem chamar o verificador. Extra: payload sem `sub` → `UNAUTHENTICATED`; payload sem `email` → sessão com `email: ''`. Conferir que nenhuma mensagem de erro lançada contém o token
- [ ] T019 [P] [US2] Criar `src/server/__tests__/sessionRoute.test.ts`: `req`/`res` falsos (objeto com `status`, `setHeader`, `json`/`end` gravando chamadas) e `createSession` injetado. Conferir: `GET` → 405 `{ error: 'METHOD_NOT_ALLOWED' }` + `Allow: POST`; toda resposta tem `Cache-Control: no-store`; sucesso → 200 `{ session }`; `UnauthenticatedError` → 401 `{ error: 'UNAUTHENTICATED' }` sem `console.*`; `ConfigError` ou erro inesperado → 500 `{ error: 'INTERNAL' }`; nenhuma resposta traz detalhes do erro
- [ ] T020 [P] [US2] Criar `src/utils/__tests__/session.test.ts` com C1 usando um `Storage` falso em memória (`getItem`/`setItem`/`removeItem`) e `fetch` falso: `exchangeGoogleCredential(fetchFn, credential)` faz `POST /api/session` com `content-type: application/json`, `cache: 'no-store'` e corpo `{ credential }`, devolve a sessão em 200 e lança em 401/500/falha de rede; `saveSession` grava só em `inui.session` (nenhuma chave guarda o token do Google); `readSession` devolve o token salvo; `clearLegacyKeys` remove `inui.token` e `inui.token-exp`; `decodeSessionClaims` devolve `sub`, `email`, `name`, `picture`, `exp`. NÃO tocar os testes da Spec 01

### Implementation for User Story 2

- [ ] T021 [US2] Criar `src/server/auth/createSession.ts` (depende de T005): `createSession(credential: unknown, deps: { verifier: Pick<OAuth2Client, 'verifyIdToken'>; configResult: ReturnType<typeof loadAuthConfig>; now: number }): Promise<string>`. Com `ok: false`: `console.error(CONFIG_ERROR_MESSAGE)` e lança `ConfigError`. `credential` não string ou vazio → `UnauthenticatedError`. `await verifier.verifyIdToken({ idToken, audience: config.oauthClientId })` dentro de `try/catch` que descarta o erro original (contém o token, research R1) e lança `UnauthenticatedError` sem log. Exige `payload.sub` string não vazia. Devolve `signSession({ sub, email: payload.email || '', name: payload.given_name || payload.name || '', picture: payload.picture || '' }, config.sessionSecret, now)`. Faz T018 passar
- [ ] T022 [US2] Criar `src/server/auth/sessionRoute.ts` (depende de T021): `createSessionRoute(deps: { createSession: (credential: unknown) => Promise<string> })` devolve um `NextApiHandler` que sempre envia `Cache-Control: no-store`, aceita só `POST` (senão 405 + `Allow: POST` + `{ error: 'METHOD_NOT_ALLOWED' }`), lê `req.body?.credential`, responde 200 `{ session }`, 401 `{ error: 'UNAUTHENTICATED' }` para `UnauthenticatedError` e 500 `{ error: 'INTERNAL' }` para o resto, sem detalhes nem log de token. Exportar também `productionSessionRoute` montado com `new OAuth2Client()`, `loadAuthConfig(process.env)` e `Date.now()` por requisição. Faz T019 passar
- [ ] T023 [US2] Criar `src/pages/api/session.ts` com uma única linha útil: `export { productionSessionRoute as default } from '@/server/auth/sessionRoute'` (sem lógica; bodyParser padrão do Next mantido)
- [ ] T024 [US2] Criar `src/utils/session.ts` (módulo puro, sem React nem `window`; storage e fetch injetados): constantes `SESSION_STORAGE_KEY = 'inui.session'`, `LEGACY_KEYS = ['inui.token', 'inui.token-exp']`; `readSession(storage)`, `saveSession(storage, token)`, `clearSession(storage)`, `clearLegacyKeys(storage)`; tipo `SessionUserClaims = { sub: string; email?: string; name?: string; picture?: string; exp: number }` e `decodeSessionClaims(token): SessionUserClaims | null` com `jwt-decode` (devolve `null` se lançar); `exchangeGoogleCredential(fetchFn: typeof fetch, credential: string): Promise<string>` conforme T020. O valor em `inui.session` é a string JSON do token, compatível com o formato do hook `useLocalStorage` atual. Faz T020 passar
- [ ] T025 [US2] Em `src/contexts/AuthProvider/AuthContextProps.ts`: trocar `JwtData { [key: string]: any }` por um tipo explícito baseado em `SessionUserClaims`; tipar `onLoginError: (error?: unknown) => void` e `handleLogout: () => void`; remover o índice `[key: string]: any` de `AuthContextType` (ajustar quem dependia dele, se houver)
- [ ] T026 [US2] Em `src/contexts/AuthProvider/index.tsx` (depende de T024, T025): substituir `useLocalStorage('inui.token')`/`('inui.token-exp')` por estado React `session` inicializado no cliente com `clearLegacyKeys(localStorage)` + `readSession(localStorage)`; `userData` derivado de `decodeSessionClaims(session)` (`id: sub`, `email`, `picture`, `name`); `authorized = Boolean(session)`; `onLoginSuccess({ credential })` chama `exchangeGoogleCredential(fetch, credential)` e, no sucesso, `saveSession` + `setSession`; na falha, chama `onLoginError` (alerta atual) e não guarda nada (FR-017b); o token do Google nunca é guardado; `handleLogout` chama `clearSession` e limpa estado; manter `googleLogout()` quando não houver sessão; remover `validateTokenExp` e o cálculo local "hoje + 1 dia"; `console.error` sem o token

**Checkpoint**: G1–G5, rota e C1 verdes; login local (`yarn dev`) cria `inui.session` e não `inui.token`.

---

## Phase 5: User Story 3 - Sessão expirada leva a um novo login claro (Priority: P2)

**Goal**: toda requisição leva `Authorization: Bearer <sessão>`; sessão com `exp` passado ou resposta
`UNAUTHENTICATED` leva à tela de login com "Sua sessão expirou. Entre novamente.".

**Independent Test**: C2–C4 em `src/utils/__tests__/session.test.ts` verdes; no preview, adulterar `inui.session`
mostra a tela de login com a mensagem (quickstart §4.4).

### Tests for User Story 3 ⚠️ (escrever primeiro; devem falhar)

- [ ] T027 [US3] Adicionar a `src/utils/__tests__/session.test.ts` (mesmo arquivo de T020, por isso sem [P]): C2 `getAuthorizationHeaders(storage, now)` com sessão válida → `{ authorization: 'Bearer <sessão>' }`; sem sessão → `{}`. C3 `isUnauthenticatedError` reconhece `{ graphQLErrors: [{ extensions: { code: 'UNAUTHENTICATED' } }] }` e `{ networkError: { statusCode: 400, result: { errors: [{ extensions: { code: 'UNAUTHENTICATED' } }] } } }`; NÃO reconhece erro 500 `INTERNAL_SERVER_ERROR`, `networkError` sem `result` (falha de rede) nem `NOT_FOUND`; `expireSession(storage)` remove `inui.session` e chama os listeners de `onSessionExpired` (e a função de cancelamento devolvida por `onSessionExpired` remove o listener). C4 `isSessionExpired(claims, now)` é `true` para `exp * 1000 <= now` e para claims `null`; `getAuthorizationHeaders` com sessão expirada devolve `{}`, remove a sessão e notifica os listeners antes de qualquer chamada

### Implementation for User Story 3

- [ ] T028 [US3] Em `src/utils/session.ts`: adicionar `isSessionExpired(claims, now)`, `onSessionExpired(listener): () => void` e `expireSession(storage)` (assinante simples em nível de módulo), `isUnauthenticatedError(error: ErrorResponse-like)` olhando `graphQLErrors[].extensions.code` e `networkError.result.errors[].extensions.code`, e `getAuthorizationHeaders(storage, now)` (lê, checa expiração via `decodeSessionClaims`, expira se preciso, devolve o cabeçalho). Tipos explícitos, sem `any`. Faz T027 passar
- [ ] T029 [US3] Em `src/api/apolloClient.ts`: o `authLink` (`setContext`) passa a mesclar `getAuthorizationHeaders(window.localStorage, Date.now())` nos `headers` a cada requisição (só no navegador; no SSR sem cabeçalho); adicionar `errorLink` com `onError` de `@apollo/client/link/error` que chama `expireSession(window.localStorage)` quando `isUnauthenticatedError(error)`; ordem `ApolloLink.from([errorLink, authLink, uploadLink])`; remover o código comentado do token antigo
- [ ] T030 [US3] Em `src/contexts/AuthProvider/index.tsx` e `AuthContextProps.ts`: adicionar `sessionExpiredMessage: string` ao contexto; assinar `onSessionExpired` em `useEffect` (com cancelamento) para limpar `session`/`userData` e definir "Sua sessão expirou. Entre novamente."; na inicialização, se a sessão lida já estiver expirada (`isSessionExpired`), descartar e definir a mesma mensagem; limpar a mensagem após login bem-sucedido; logout NÃO mostra a mensagem
- [ ] T031 [P] [US3] Em `src/components/Authenticator/index.tsx`: ler `sessionExpiredMessage` de `useAuth()` e exibi-la acima do botão `GoogleLogin` quando não vazia (componente de texto/alerta do MUI já usado no projeto)
- [ ] T032 [US3] Verificar (sem mudança nova se a T017 já cobriu). Em `src/contexts/SettingsProvider/index.tsx`: garantir que `useGetUserQuery` e `useGetUserDocumentsQuery` continuam com `skip` enquanto não houver sessão válida (`skip: !userData.id`, com `userData` vindo do `AuthProvider` novo) e que a mutation `setUser` só roda autenticada; conferir que, após expirar, as queries não disparam antes do novo login

**Checkpoint**: `yarn test` e `yarn type-check` verdes; `yarn dev` + curl da quickstart §3 respondem 400
`UNAUTHENTICATED` e 405; login local mostra as tabelas.

---

## Phase 6: User Story 4 - Implantação segura, sem deixar a pessoa sem acesso (Priority: P3)
> Executar **depois** da Phase 7 (T037–T041). T033 pode ser feita antes, sem risco.

**Goal**: publicar sem deixar a pessoa sem calcular a dose, com verificação no preview e no PWA e reversão
conhecida.

**Independent Test**: roteiro da quickstart §4–§6 executado e registrado.

- [ ] T033 [US4] Gerar dois segredos com `openssl rand -base64 48` e criar `SESSION_SECRET` como **Sensitive** na Vercel (Preview = segredo 1, Production = segredo 2, valores diferentes); confirmar `NEXT_PUBLIC_OAUTH_ID` em Preview e Production (quickstart §2; DoD 4)
- [ ] T034 [US4] Deploy de preview: rodar as chamadas da quickstart §3 contra a URL do preview (400 `UNAUTHENTICATED` em `/api/graphql` sem sessão; 405 em `GET /api/session`); entrar com o Google e conferir tabelas, nome e foto, `inui.session` presente e `inui.token` ausente, `Authorization: Bearer` nas chamadas; adulterar `inui.session` e ver a mensagem de expiração. Antes do login, conferir a origem do preview nas Origens JavaScript autorizadas do cliente OAuth (quickstart §4.2); Teste da falha de troca (FR-017b): em DevTools → Network → bloquear a URL `/api/session` (Request blocking) e
tentar entrar; esperado: continua na tela de login, o alerta de erro aparece e o Local Storage não tem `inui.session`. Desbloquear depois.
depois do login, fazer logout e conferir que a mensagem de sessão expirada não aparece. **Não** criar, editar nem apagar tabelas (quickstart §4; DoD 5)
- [ ] T035 [US4] Antes da produção: combinar a janela fora do horário das refeições com a pessoa que usa o app e avisar sobre o login único pós-deploy; anotar o deployment de produção atual como alvo de reversão (quickstart §5.1–5.2, §6; DoD 7)
- [ ] T036 [US4] Merge em `main`, aguardar o deploy de produção, repetir as chamadas da §3 contra produção; no celular com o PWA instalado, fechar e reabrir até o service worker novo assumir, fazer login e conferir as tabelas; acompanhar almoço e jantar sem novo login (quickstart §5.3–5.6; DoD 6; SC-004, SC-005). Em falha, executar a reversão da quickstart §6

---

## Phase 7: Polish & Cross-Cutting Concerns

**Purpose**: gates da constituição e Definição de pronto 1–3, antes de T033.

- [ ] T037 Rodar `yarn test` (36 testes da Spec 01 + novos) e `yarn type-check`; ambos verdes (DoD 1; SC-007)
- [ ] T038 [P] Conferir que `git diff --stat main -- src/utils/validateUnits.ts src/utils/__tests__/ ':(exclude)src/utils/__tests__/session.test.ts'` sai vazio (DoD 2)
- [ ] T039 [P] Conferir que `git ls-files src/pages | grep -iE "auth|session|__tests__"` lista só `src/pages/api/session.ts` e o já existente `src/pages/api/utils/service/auth.ts` (DoD 3)
- [ ] T040 [P] Revisar `src/server/**`, `src/pages/api/resolvers/**`, `src/utils/session.ts` e `src/contexts/AuthProvider/**` com `grep -rn "console\." ` e confirmar que nenhum log inclui token, sessão, e-mail, id ou erro de `verifyIdToken` (FR-023); confirmar com `grep -rn "SESSION_SECRET" src next.config.js` que o nome só aparece em `src/server/auth/config.ts` e
nos testes de `src/server/__tests__/` (com valores fictícios), nunca em `next.config.js` (Princípio VII)
- [ ] T041 [P] Atualizar `specs/002-autenticacao-servidor/checklists/requirements.md` marcando os itens atendidos e registrar no fim de `research.md` (R10) qualquer pendência descoberta na implementação
- [ ] T042 [P] Com `yarn dev`, chamar diretamente `GET` e `POST` em `/api/utils/dynamoDB`,
  `/api/utils/dynamoDB/PutOrUpdate` e `/api/utils/connectors` (sem sessão) e confirmar status ≥ 400 e corpo sem
  dados de tabela. Anotar o resultado em `research.md` (R10). Se algum devolver dado, parar e abrir spec futura
  antes do deploy (FR-005)

---

## Dependencies & Execution Order

### Phase Dependencies

- **Setup (Phase 1)**: sem dependências.
- **Foundational (Phase 2)**: depende do Setup; BLOQUEIA todas as histórias.
- **US1 (Phase 3)** e **US2 (Phase 4)**: dependem só da Phase 2; podem andar em paralelo (arquivos de servidor
  diferentes). Exceção: T026 (AuthProvider) e T017 tocam o cliente; fazer T017 antes de T026 para evitar conflito em
  `SettingsProvider`.
- **US3 (Phase 5)**: depende de T024/T026 (US2: módulo `session.ts` e AuthProvider) e de T014 (US1: hooks gerados).
- **Polish (Phase 7)**: depois de US1–US3.
- **US4 (Phase 6)**: por último, depois do Polish verde. US1, US2 e US3 vão juntas para produção.

### Within Each User Story

- Testes primeiro, falhando; depois implementação até ficarem verdes.
- `config`/`errors` → `session` → `getAuthenticatedUser`/`createSession` → contexto/rota → entrada em `src/pages/`.
- Schema (T013) → codegen (T014) → ajustes do cliente (T017).

### Parallel Opportunities

- Setup: T002 com T001.
- Foundational: T003, T004 e T006 em paralelo; T005 depois de T003 e T004.
- US1: T007, T008 e T009 em paralelo.
- US2: T018, T019 e T020 em paralelo; US2 inteira em paralelo com US1 (exceto o cliente, ver acima).
- US3: T031 em paralelo com T029/T030.
- Polish: T038, T039, T040 e T041 em paralelo depois de T037.

---

## Parallel Example: User Story 1

```text
Task: "Criar src/server/__tests__/getAuthenticatedUser.test.ts com A1–A11"
Task: "Criar src/server/__tests__/schema.test.ts (R7)"
Task: "Criar src/server/__tests__/resolvers.test.ts (R1–R6)"
```

## Parallel Example: User Story 2

```text
Task: "Criar src/server/__tests__/createSession.test.ts (G1–G5)"
Task: "Criar src/server/__tests__/sessionRoute.test.ts"
Task: "Criar src/utils/__tests__/session.test.ts com C1"
```

---

## Implementation Strategy

### MVP (US1 + US2 + US3 juntas)

US1 sozinha fecha a vulnerabilidade mas deixa o app sem login funcional, e US2 sem US3 não envia a sessão nas
requisições. Por isso o MVP implantável é **Phases 1–5 + Polish**:

1. Phase 1 e Phase 2.
2. Phase 3 (US1) → validar A1–A11, R1–R7 isoladamente.
3. Phase 4 (US2) → validar G1–G5, rota e C1.
4. Phase 5 (US3) → validar C2–C4 e o fluxo local com `yarn dev`.
5. Phase 7 → gates verdes.
6. Phase 6 (US4) → preview, produção e PWA, com reversão anotada.

### Incremental

Cada fase de história termina com checkpoint verde (`yarn test` + `yarn type-check`) e pode virar um commit
próprio no branch; só o merge em `main` (T036) publica.
