# Implementation Plan: Autenticação e autorização no servidor

**Branch**: `spec-02-autenticacao-no-servidor` | **Date**: 2026-10-30 | **Spec**: [spec.md](./spec.md)

**Input**: Feature specification from `/specs/002-autenticacao-servidor/spec.md` (v2: sessão própria de 24h)

## Summary

Hoje o servidor aceita a identidade que o navegador manda. O plano faz o servidor verificar o token do Google
**uma vez**, no login, por uma rota fina `POST /api/session`, e emitir uma sessão própria HS256 de 24h. O contexto
do Apollo Server exige essa sessão em toda operação GraphQL e entrega aos resolvers um `context.user` verificado.
Os argumentos de identidade saem do schema. Apagar tabela vira um `DeleteItem` condicional, aguardado, com a chave
do usuário autenticado. No cliente, a troca de token acontece no login, a sessão fica em `inui.session`, um
`authLink` envia o `Bearer` a cada requisição e um `errorLink` leva à tela de login com a mensagem de sessão
expirada. Toda a lógica nova fica em `src/server/` e `src/utils/session.ts`, testada sem rede e sem AWS.

## Technical Context

**Language/Version**: TypeScript 4.5.4 (`strict: false`, então o "sem `any`" é garantido por tipagem explícita e
revisão), Next.js `latest` (pages router), React 17, Node v22.23.4 (Jod) LTS.

**Primary Dependencies (todas já instaladas; nenhuma nova)**: `google-auth-library` 9.0.0 (`OAuth2Client`),
`jwt-simple` 0.5.6, `apollo-server-micro`/`apollo-server-core` 3.12, `@apollo/client` 3.7 (`setContext`,
`onError`), `jwt-decode` 3 (só leitura de claims no cliente), `graphql` (`buildSchema` no teste R7),
`@aws-sdk/client-dynamodb` v3.

**Storage**: DynamoDB (`AWS_DOCUMENTS_TABLE` com chave `id` + `user_id`; `AWS_USER_TABLE` com chave `uid`), sem
mudança de estrutura. No cliente, `localStorage` `inui.session`.

**Testing**: Vitest 1.6.1, `environment: node`, `include: src/**/__tests__/**/*.test.ts` (sem mudança de
configuração). DynamoDB com `vi.mock` do módulo `client`; Google com um `OAuth2Client` real e certificados gerados
no teste (research R1); tempo com `now` injetado.
Os testes C1–C4 de `src/utils/__tests__/session.test.ts` incluem `isUnauthenticatedError` com os dois formatos
(`graphQLErrors` e `networkError.result.errors` vindo de HTTP 400) e um caso negativo (erro 500 ou falha de rede
não é UNAUTHENTICATED).

**Target Platform**: Vercel (funções serverless Node) + PWA (`next-pwa` 5.4.4) no celular.

**Project Type**: aplicação web Next.js única (front e API no mesmo projeto).

**Performance Goals**: verificar a sessão é um HMAC por requisição, desprezível. A criação de sessão faz uma busca
de certificados do Google por login (a biblioteca guarda em cache).

**Constraints**: nenhuma dependência nova; segredo só de servidor com ≥ 32 bytes; HS256 fixo; falha fechada; sem
log de tokens, e-mails ou ids; código e testes de auth fora de `src/pages/`; não tocar
`src/utils/validateUnits.ts` nem os testes da Spec 01.

**Scale/Scope**: um usuário ativo hoje; 5 operações GraphQL; cerca de 30 casos de teste novos (G1–G5, A1–A11,
R1–R7, C1–C4).

Nenhum `NEEDS CLARIFICATION`: o direcionamento técnico e a pesquisa ([research.md](./research.md)) cobrem tudo.

## Constitution Check

*GATE: Must pass before Phase 0 research. Re-check after Phase 1 design.*

| Princípio / gate | Como o plano atende | Status |
|---|---|---|
| I. Spec antes do código | Spec 002 v2 escrita e revisada; este plano só referencia FRs dela | ✅ |
| II. Cálculo congelado | `validateUnits.ts` e `src/utils/__tests__/validateUnits.*` fora de qualquer tarefa; DoD 2 confere com `git diff` | ✅ |
| III. Gates verdes | `yarn test` + `yarn type-check` são a última tarefa e o DoD 1 | ✅ |
| IV. Sem `any` | Tipos explícitos para config, claims, contexto, verificador e `fetch` injetado; os resolvers tocados ganham tipos de argumento e contexto (as linhas tocadas não podem ficar com `any` implícito) | ✅ |
| V. Orientação médica prevalece | Sem mudança de cálculo nem de texto clínico | ✅ (n/a) |
| VI. Servidor não confia na identidade do cliente | Identidade só em `context.user`, vinda da sessão verificada; argumentos removidos do schema (R7); falha de auth é erro explícito no contexto, antes de qualquer resolver | ✅ |
| VII. Segredos no servidor | `SESSION_SECRET` sem `NEXT_PUBLIC_` e fora do `env` do `next.config.js`; testes usam segredos fictícios; `NEXT_PUBLIC_OAUTH_ID` é público, o que é permitido | ✅ |
| Gate login/dados/deploy | Reversão documentada (quickstart §6); verificação no preview e no PWA instalado (quickstart §4–5) | ✅ |

**Pós-design (re-check)**: ✅ sem violações. Um risco aceito ficou registrado: a comparação HMAC não constante do
`jwt-simple` (research R2), que não viola princípio nenhum e vai para spec futura.

## Project Structure

### Documentation (this feature)

```text
specs/002-autenticacao-servidor/
├── spec.md
├── plan.md              # este arquivo
├── research.md          # Fase 0
├── data-model.md        # Fase 1
├── quickstart.md        # Fase 1: validação, implantação e reversão
├── contracts/
│   ├── session-api.md   # POST /api/session
│   └── graphql-schema.md
├── checklists/requirements.md
└── tasks.md             # /speckit-tasks
```

### Source Code (repository root)

```text
src/
├── server/                                  # NOVO: lógica de servidor fora de src/pages/
│   ├── auth/
│   │   ├── config.ts                        # loadAuthConfig(env), constantes HS256 / 24h
│   │   ├── session.ts                       # signSession(claims, secret, now) / verifySession(token, secret, now)
│   │   ├── createSession.ts                 # createSession(credential, { verifier, config, now }) → token
│   │   ├── getAuthenticatedUser.ts          # (authorizationHeader, config, now) → AuthenticatedUser | lança
│   │   ├── sessionRoute.ts                  # handler HTTP: só POST, no-store, 200/401/405/500
│   │   └── errors.ts                        # UnauthenticatedError (AuthenticationError), ConfigError
│   ├── graphqlContext.ts                    # buildContext({ req }) → { user }
│   └── __tests__/
│       ├── helpers/googleTokens.ts          # chave RSA + certs locais, assinatura RS256 (sem rede)
│       ├── createSession.test.ts            # G1–G5
│       ├── sessionRoute.test.ts             # 405, no-store, mapeamento 401/500
│       ├── getAuthenticatedUser.test.ts     # A1–A11
│       ├── resolvers.test.ts                # R1–R6 (client DynamoDB simulado)
│       └── schema.test.ts                   # R7
├── pages/api/
│   ├── session.ts                           # NOVO: só `export default` do sessionRoute com deps de produção
│   ├── graphql.ts                           # + context: buildContext
│   ├── resolvers/handleUser.ts              # getUser/setUser leem context.user; setUser grava o e-mail da sessão, nunca do cliente
│   ├── resolvers/handleUserDocuments.ts     # list/save/delete leem context.user; delete condicional aguardado
│   └── schemas/schema.graphql + gql/**      # argumentos de identidade removidos; .gql regenerados
├── api/
│   ├── apolloClient.ts                      # authLink lê inui.session por requisição; errorLink UNAUTHENTICATED
│   └── graphql.tsx                          # regenerado pelo codegen
├── utils/
│   ├── session.ts                           # NOVO: storage, claims, expiração, troca, eventos (puro)
│   └── __tests__/session.test.ts            # NOVO: C1–C4 (os testes da Spec 01 não são tocados)
├── contexts/
│   ├── AuthProvider/index.tsx               # troca no login, estado da sessão, mensagem de expiração
│   ├── AuthProvider/AuthContextProps.ts     # + sessionExpiredMessage; tipos sem `any` nas linhas tocadas
│   ├── SettingsProvider/index.tsx           # remove variáveis de identidade; queries seguem com skip até haver sessão
│   └── CalcTablesProvider/index.tsx         # remove `user`
└── components/
    ├── Authenticator/index.tsx              # mostra sessionExpiredMessage acima do botão
    └── CalcTableList/index.tsx              # deleteCalcTable(id) sem userData.id
codegen.yml                                  # schema: src/pages/api/schemas/schema.graphql
```

**Structure Decision**: aplicação Next.js única. A lógica nova de servidor fica em `src/server/` porque tudo dentro
de `src/pages/api/` vira rota. Os resolvers continuam onde estão (movê-los está registrado para spec futura) e só
passam a ler `context.user`. A lógica de sessão do cliente é um módulo puro em `src/utils/session.ts`, para que
C1–C4 rodem em Vitest com ambiente Node, sem jsdom.

## Desenho por fluxo

1. **Login** (US2): `GoogleLogin.onSuccess(credential)` → `exchangeGoogleCredential(fetch, credential)` →
   `POST /api/session` → `sessionRoute` → `loadAuthConfig` (falha fechada) → `createSession` →
   `verifier.verifyIdToken({ idToken, audience: oauthClientId })` → exige `sub` → `signSession` (HS256, `exp` =
   `now + 24h`) → 200 `{ session }` → `saveSession` em `inui.session` → `AuthProvider` decodifica as claims para nome
   e foto. Se a troca falhar: alerta atual, nada guardado (FR-017b).
2. **Cada requisição** (US1): `authLink` → `readSession(localStorage, Date.now())` → expirada? `expireSession()` e
   segue sem cabeçalho : `authorization: Bearer <sessão>` → `graphql.ts` `context` → `buildContext` →
   `getAuthenticatedUser` (`Bearer` exato → `alg === 'HS256'` → `jwt.decode(..., 'HS256')` → `exp` → `sub`) →
   `{ user }` → resolver.
3. **Recusa** (US3): o contexto lança `AuthenticationError` → o Apollo Server responde **HTTP 400** com o corpo
   `{ errors: [{ extensions: { code: 'UNAUTHENTICATED' } }] }`. Como o status não é 2xx, o Apollo Client **não**
   preenche `graphQLErrors`: ele entrega um `networkError` (`ServerError`) com o corpo em `networkError.result.errors`.
   O `errorLink` usa `isUnauthenticatedError(error)`, que MUST olhar os dois lugares: `graphQLErrors[].extensions.code`
   e `networkError.result.errors[].extensions.code`. Ao detectar `UNAUTHENTICATED` → `expireSession(localStorage)` →
   listeners → `AuthProvider` limpa o estado e define a mensagem → `pages/index.tsx` mostra o `Authenticator` com a
   mensagem. Qualquer outro erro de rede ou servidor NÃO encerra a sessão.
4. **Apagar** (US1/R4): `DeleteItemCommand({ Key: { id, user_id: user.id }, ConditionExpression:
   'attribute_exists(id)' })` **aguardado** → `ConditionalCheckFailedException` → `ApolloError('Tabela não
   encontrada', 'NOT_FOUND')`.
5. **Gravar usuário** (R5): `setUser` não recebe `id` nem `email` do cliente (removidos do schema, R7). Usa
   `context.user.id` (`sub`) e `context.user.email`, que `createSession` copia do payload do token Google
   **verificado** para as claims da sessão. Se a claim `email` não existir no token, o e-mail não é gravado; a
   operação não falha por isso. O `SettingsProvider` deixa de enviar `userData.email` na mutation.
   
## Ordem de implementação sugerida (para `/speckit-tasks`)

1. `src/server/auth/*` + testes G/A (puro, sem tocar no app).
2. Schema, `codegen.yml` e regeneração (`yarn graphql-generator`) + teste R7.
3. Resolvers lendo `context.user` + delete condicional + testes R1–R6; `graphql.ts` com `context`.
4. `src/pages/api/session.ts` + teste do `sessionRoute`.
5. `src/utils/session.ts` + testes C1–C4; `apolloClient.ts`, `AuthProvider`, providers e componentes. No
   `SettingsProvider`, `useGetUserQuery` e `useGetUserDocumentsQuery` perdem a variável `id`, mas MUST manter
   `skip` enquanto não houver sessão válida (hoje `skip: !userData.id`; passa a depender de `userData` vindo do
   `AuthProvider`). Sem isso as queries disparam antes do login e já recebem UNAUTHENTICATED.
6. `yarn test`, `yarn type-check`, conferências do DoD 2 e 3.
7. Implantação conforme [quickstart.md](./quickstart.md) §2, §4, §5, com a reversão em §6.

## Complexity Tracking

Sem violações da constituição. Nada a justificar.
