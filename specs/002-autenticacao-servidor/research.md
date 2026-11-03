# Research: Autenticação e autorização no servidor (Spec 02 v2)

Fatos verificados lendo o código do projeto e o código-fonte das bibliotecas instaladas em `node_modules`
(versões travadas: `jwt-simple` 0.5.6, `google-auth-library` 9.0.0, `apollo-server-core` 3.12.0,
`next-pwa` 5.4.4, TypeScript 4.5.4, `strict: false`).

## R1. Verificação do token do Google

- **Decision**: `OAuth2Client.verifyIdToken({ idToken, audience })` da `google-auth-library`. O verificador entra
  por injeção com o tipo `Pick<OAuth2Client, 'verifyIdToken'>`. Em produção é um `new OAuth2Client()`.
  O `audience` vem de `NEXT_PUBLIC_OAUTH_ID`, a mesma variável que o botão de login usa. Depois da verificação,
  o código exige `payload.sub` como string não vazia.
- **Rationale**: `verifyIdTokenAsync` busca os certificados (`getFederatedSignonCertsAsync`) e chama
  `verifySignedJwtWithCertsAsync`, que valida a assinatura, `iat`/`exp` (incluindo o "Token used too late"), o
  emissor (`ISSUERS_`) e o público ("Wrong recipient"). Usar a variável do cliente garante que o `aud` aceito pelo
  servidor seja o mesmo ID de cliente que emitiu o token. O valor é público, e o Princípio VII permite isso.
- **Testes sem rede (G1, G3, G4)**: os testes usam um `OAuth2Client` **real** e substituem só
  `getFederatedSignonCertsAsync` (com `vi.spyOn`) para devolver um certificado gerado no próprio teste com
  `crypto.generateKeyPairSync('rsa')` (Node, sem dependência nova). Os tokens são assinados em RS256 com
  `crypto.sign`. Assim, expiração, `aud` e assinatura são verificados pela biblioteca de verdade, sem rede.
  G2 (ausente/malformado) e G5 (configuração ausente) dispensam o verificador.
- **Achado de segurança**: as mensagens de erro da biblioteca **incluem o token inteiro**
  (`'Invalid token signature: ' + jwt`, `'Wrong number of segments in token: ' + jwt`). Por isso nenhum erro vindo de
  `verifyIdToken` é registrado em log nem repassado ao cliente (FR-023). Recusas viram `UNAUTHENTICATED` sem log.
- **Alternatives considered**: verificar o JWT do Google à mão (reimplementa o que a biblioteca já faz);
  `GOOGLE_OAUTH_CLIENT_ID` separado e só de servidor (duas fontes do mesmo valor público podem divergir e quebrar
  todo login sem nenhum ganho de segurança).

## R2. Assinatura e verificação da sessão com `jwt-simple`

Comportamento lido em `node_modules/jwt-simple/lib/jwt.js`:

- `decode(token, key, noVerify, algorithm)` usa `algorithmMap[algorithm || header.alg]`. Passando `'HS256'`
  explicitamente, a assinatura é **sempre** verificada com HMAC-SHA256. Um token `alg: none` com assinatura vazia
  falha em "Signature verification failed".
- **Lacuna 1**: o `alg` do cabeçalho **não** é comparado com o algoritmo pedido. Um token com cabeçalho `HS512`,
  mas assinado em HS256 com o segredo certo, passaria. → **Decision**: antes de chamar `decode`, decodificar o
  cabeçalho e exigir `header.alg === 'HS256'` (A7: "outro algoritmo").
- **Lacuna 2**: `exp` só é verificado **se existir**. Um token sem `exp` nunca expira. → **Decision**: exigir que
  `payload.exp` seja número e que `exp * 1000 > now`, com `now` injetável. `jwt-simple` também confere `exp` com
  `Date.now()`, então a regra própria é a autoridade e a da biblioteca vira redundância inofensiva (A6).
- `encode(payload, key, 'HS256')` sempre com o algoritmo explícito.
- **Lacuna 3 (risco aceito)**: a comparação HMAC usa `===` (não é de tempo constante). Explorar isso pela rede, em
  função serverless e com HMAC de 256 bits, não é prático. O direcionamento técnico pede `jwt-simple`. Fica
  registrado para spec futura (verificar com `crypto.timingSafeEqual`).
- O token do Google enviado à API de dados (A11) é RS256: cai na checagem de `alg` e também falharia na assinatura.
- **Alternatives considered**: `jsonwebtoken`/`jose` (dependência nova, proibida); HMAC manual completo (sairia do
  direcionamento técnico; seria a primeira opção se `jwt-simple` não fosse exigida).

## R3. Segredo e configuração (falha fechada)

- **Decision**: `loadAuthConfig(env)` lê `SESSION_SECRET` e `NEXT_PUBLIC_OAUTH_ID` **a cada requisição** (barato) e
  devolve `{ ok: true, config }` ou `{ ok: false }`. O segredo precisa ter `Buffer.byteLength(secret, 'utf8') >= 32`.
  Se a configuração não estiver ok, as duas entradas registram uma mensagem fixa
  (`"auth: configuração ausente ou inválida"`, sem nomes nem valores) e respondem um erro genérico.
- O segredo **não** entra no bloco `env` do `next.config.js` e não tem prefixo `NEXT_PUBLIC_` (Princípio VII).
- Geração recomendada: `openssl rand -base64 48` (64 caracteres, 48 bytes de entropia), com valores diferentes em
  Preview e em Production.
- **Alternatives considered**: validar só na inicialização do módulo (em serverless, um erro na carga vira 500
  opaco e é mais difícil de testar); exigir 32 bytes *decodificados* de base64 (complica a regra sem ganho real).

## R4. Contexto do Apollo Server 3 e código de erro

Lido em `apollo-server-core/dist/runHttpQuery.js`: um erro lançado pela função `context` vira resposta HTTP
**400** com `errors[0].extensions.code` preservado, se o código não for `INTERNAL_SERVER_ERROR`; caso contrário,
HTTP 500. A mensagem ganha o prefixo `"Context creation failed: "`.

- **Decision**: a função `context` chama `getAuthenticatedUser(req.headers.authorization, config, now)`. Uma sessão
  inválida lança `AuthenticationError` (de `apollo-server-micro`, código `UNAUTHENTICATED`) e o resultado é HTTP 400.
  Configuração ausente lança `Error('Internal server error')` genérico, com resultado HTTP 500 sem detalhes.
  Nenhum resolver roda sem contexto válido (FR-007).
- Os resolvers recebem `context.user: AuthenticatedUser` (não opcional). A tipagem dispensa checagem repetida, e
  testar os resolvers com usuário é direto.
- **Alternatives considered**: guarda em cada resolver (`requireUser`) (repete código e deixa uma porta aberta se
  alguém esquecer a guarda num resolver novo); diretiva `@auth` no schema (mais peças para o mesmo resultado).

## R5. Rota de sessão (D4)

- **Decision**: rota própria `src/pages/api/session.ts`, de uma linha, que exporta o handler montado com as
  dependências de produção. Toda a lógica HTTP fica em `src/server/auth/sessionRoute.ts` e é testável:
  - aceita só `POST` (outros métodos → 405 com `Allow: POST`);
  - corpo JSON `{ credential: string }` (o `bodyParser` padrão do Next já faz o parse);
  - sempre envia `Cache-Control: no-store`;
  - respostas: 200 `{ session }`, 401 `{ error: 'UNAUTHENTICATED' }`, 500 `{ error: 'INTERNAL' }`.
- **Rationale**: é a única entrada sem sessão (FR-005). Ficar fora do schema GraphQL mantém a regra "toda
  operação GraphQL exige sessão" sem exceções no contexto.
- **Alternatives considered**: mutation pública `createSession` (exigiria abrir uma exceção na função de
  contexto, o que contraria R4).

## R6. Cache do service worker (next-pwa)

Lido em `next-pwa/cache.js` (5.4.4): a única regra para `/api/*` da mesma origem é `NetworkFirst` com
`method: 'GET'` (cache `apis`, 24h). Requisições `POST` não são interceptadas para cache (a Cache API nem guarda
POST). O padrão é `register: true, skipWaiting: true`.

- **Decision**: a sessão e o GraphQL usam só `POST`. A rota de sessão responde `Cache-Control: no-store`, e o
  `fetch` do cliente usa `cache: 'no-store'`. Não é preciso mudar o `next.config.js`. A verificação no PWA
  instalado (DoD 6) confirma na prática.
- Como `skipWaiting` é `true`, o service worker novo assume quando o app é reaberto. Até isso acontecer, o cliente
  antigo (sem sessão) recebe `UNAUTHENTICATED`. Esse é o motivo de fazer o deploy fora do horário das refeições.

## R7. Cliente: sessão, `authLink` e expiração

- **Decision**: um módulo puro `src/utils/session.ts`, testável em ambiente Node sem jsdom:
  - `readSession(storage, now)`, `saveSession(storage, token)`, `clearSession(storage)`, com chave nova
    `inui.session`. `clearLegacyKeys(storage)` remove `inui.token` e `inui.token-exp`.
  - `decodeSessionClaims(token)` usa `jwt-decode`, que já está instalada. Ela **só lê** `exp`, `sub`, `name`,
    `picture` e `email` para a interface. Quem decide de fato é o servidor.
  - `isSessionExpired(claims, now)` usa `exp * 1000 <= now` (FR-020, C4).
  - `exchangeGoogleCredential(fetchFn, credential)` faz `POST /api/session` e devolve o token ou lança erro
    (FR-017, FR-017b, C1).
  - `isUnauthenticatedError(error)` reconhece `extensions.code === 'UNAUTHENTICATED'` tanto em `graphQLErrors`
    quanto em `networkError.result.errors`. A resposta HTTP 400 do contexto (R4) chega como `networkError`.
  - `onSessionExpired(listener)` e `expireSession(storage)` formam um assinante simples em nível de módulo, que
    liga o link do Apollo (fora do React) ao `AuthProvider`.
- O `authLink` (`setContext`) lê a sessão do `localStorage` **a cada requisição**. Se ela existir e estiver válida,
  o link envia `authorization: Bearer <sessão>` (C2). Se estiver expirada, chama `expireSession` e não envia (C4).
  Um `errorLink` (`@apollo/client/link/error`, já incluído em `@apollo/client`) chama `expireSession` quando
  recebe `UNAUTHENTICATED` (C3).
- O `AuthProvider` passa a guardar a sessão em estado React, inicializado por `readSession`. Ele assina
  `onSessionExpired` e, quando recebe o aviso, limpa o estado e guarda a mensagem
  "Sua sessão expirou. Entre novamente.", que o `Authenticator` exibe acima do botão. Uma falha na troca mantém a
  pessoa na tela de login com o alerta que já existe (FR-017b).
- **Limite de teste**: C1–C4 são testados no módulo puro, sem DOM. A exibição da mensagem na tela é verificada
  manualmente no preview (quickstart). Testes de componente exigiriam jsdom/Testing Library, que seriam
  dependências novas.
- **Alternatives considered**: manter `useLocalStorage` para a sessão (o link do Apollo não alcança o estado do
  hook, e o estado e o storage divergiriam); cookie httpOnly (melhor contra XSS, mas fora de escopo: "sessão em
  `localStorage`" está registrada para spec futura).

## R8. Apagar tabela

- **Decision**: `DeleteItemCommand` com `Key: { id, user_id: context.user.id }`,
  `ConditionExpression: 'attribute_exists(id)'`, **aguardado**. `ConditionalCheckFailedException` vira
  `ApolloError('Tabela não encontrada', 'NOT_FOUND')`. Sucesso devolve `true`. Qualquer outro erro é relançado
  como erro genérico, nunca `false` (FR-014).
- **Rationale**: a tabela de documentos tem chave composta (`id` + `user_id`, ver `PutOrUpdate` com
  `sortKey: 'user_id'`). Com o `user_id` vindo da sessão, a tabela de B simplesmente não existe na chave de A, e a
  resposta fica indistinguível de "não existe" (R4).
- Pelo mesmo motivo, salvar como A com o `id` de um documento de B grava um item **de A** e não toca no item de B
  (R3).

## R9. Contrato GraphQL e codegen

- **Decision**: remover os argumentos de identidade do `schema.graphql` (ver `contracts/graphql-schema.md`).
  Trocar `schema:` do `codegen.yml` para `src/pages/api/schemas/schema.graphql` e rodar `yarn graphql-generator`
  (`gqlgen` + `codegen`) para regenerar os `.gql` e `src/api/graphql.tsx`. O codegen deixa de depender do servidor
  local rodando.
- O teste R7 lê o `schema.graphql` com `fs` e `buildSchema` (do pacote `graphql`, já instalado) e confere que
  nenhum campo de `Query`/`Mutation` tem argumento `user`, `email` ou `id` de usuário. Só sobra `id` em
  `deleteUserDocument`, que identifica o documento.

## R10. Registrado para specs futuras (descoberto aqui)

Pendências (fora do escopo desta spec; nenhuma bloqueia o deploy):

1. `getUserDocuments`, `saveUserDocument`, `getUser` e `setUser` ainda convertem **erros do banco** (não de
   autenticação) em lista vazia, `{}` ou usuário padrão. Só a falha de autenticação é erro explícito (FR-016),
   porque acontece no contexto, antes dos resolvers. Esses `catch` também fazem `console.error` do objeto de erro
   do SDK inteiro (código anterior à spec).
2. O ramo de `handleSetUser` que devolve o usuário padrão é inalcançável: `id` e `email` sempre vêm da sessão.
3. Uma resposta `UNAUTHENTICATED` atrasada, de uma requisição feita com a sessão anterior, pode apagar a sessão
   nova obtida num novo login. Correção: só limpar se o token da requisição for igual ao token atual.
4. A sessão não é sincronizada entre abas (login/logout/expiração numa aba não reflete nas outras).
5. As tabelas locais (`dataToken` / `CalcTablesProvider`) persistem no logout explícito e na troca de conta.
   Correção: limpar no logout explícito e quando o `sub` mudar; **não** limpar na expiração, para manter o uso
   sem rede.
6. Arquivos de utilitário em `src/pages/api/` viram rotas públicas (ver T042 abaixo). Mover para fora de
   `src/pages/`.
7. Apagar a mesma tabela duas vezes responde `NOT_FOUND` e a tabela continua na lista do cliente. Correção: refazer
   a busca ao receber `NOT_FOUND`.
8. Comparação HMAC não constante no `jwt-simple` (R2, lacuna 3).
9. CORS com origem `*` e sem limite de requisições em `/api/session`.
10. Código morto do Google Sheets e variáveis `NEXT_PUBLIC_GOOGLE_SERVICE_ACCOUNT_*` (expostas ao bundle):
    remover o código e rotacionar a chave.
11. `getUserDocuments` faz `Scan` na tabela de documentos filtrando por `user_id`. Trocar por `Query` com índice.
12. Verificar que a resposta de erro em produção não inclui stacktrace (quickstart §4/§5). Em `yarn dev` o corpo
    traz stack (esperado em desenvolvimento).
13. `parseUser` quebra se o usuário ainda não estiver registrado (`Item` indefinido). O comportamento atual não muda.

**Resultado do T042** (2026-11-03, `yarn dev` local, sem sessão, `GET` e `POST` com corpo `{}`):

| Rota | GET | POST | Erro | Dados de tabela no corpo |
|------|-----|------|------|--------------------------|
| `/api/utils/dynamoDB` | 500 | 500 | `TypeError: resolver is not a function` | não |
| `/api/utils/dynamoDB/PutOrUpdate` | 500 | 500 | `TypeError: Cannot convert undefined or null to object` | não |
| `/api/utils/connectors` | 500 | 500 | `TypeError: resolver is not a function` | não |

Nenhuma devolve dado; nenhum valor de variável de ambiente apareceu no corpo. As rotas existem só por estarem em
`src/pages/api/` (item 6) e falham antes de tocar o banco. O corpo de desenvolvimento traz stack (item 12).
