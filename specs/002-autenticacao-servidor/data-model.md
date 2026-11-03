# Data Model: Autenticação e autorização no servidor

Nenhuma tabela do DynamoDB muda e nenhuma migração é necessária: o `user_id` continua sendo o `sub` do Google (FR-024).

## AuthConfig (servidor, em memória)

| campo          | origem                    | regra                                                        |
|----------------|---------------------------|--------------------------------------------------------------|
| `sessionSecret`| `SESSION_SECRET`          | obrigatório; `Buffer.byteLength(utf8) >= 32`; nunca logado    |
| `oauthClientId`| `NEXT_PUBLIC_OAUTH_ID`    | obrigatório, não vazio; usado como `audience`                |

Resultado de `loadAuthConfig(env)`: `{ ok: true, config: AuthConfig } | { ok: false }`. Com `ok: false`, as duas
entradas falham fechadas (FR-004, G5, A10).

Constantes fixas no código: `SESSION_ALGORITHM = 'HS256'` e `SESSION_TTL_SECONDS = 24 * 60 * 60` (D1).

## GoogleIdentity (entrada da criação de sessão)

Payload devolvido por `verifyIdToken(...).getPayload()`, depois que a biblioteca já validou assinatura, `iss`, `exp`
e `aud`.

| campo     | uso                                         |
|-----------|---------------------------------------------|
| `sub`     | obrigatório, string não vazia → `sub` da sessão |
| `email`   | opcional → `email` da sessão                |
| `name` / `given_name` | opcional → `name` (prefere `given_name`, como hoje) |
| `picture` | opcional → `picture`                        |

O token do Google **não** é guardado em lugar nenhum.

## SessionClaims (token de sessão do app)

JWT compacto, cabeçalho `{ "typ": "JWT", "alg": "HS256" }`, assinado com `sessionSecret`.

| claim     | tipo   | regra                                                      |
|-----------|--------|------------------------------------------------------------|
| `sub`     | string | obrigatório, não vazio (A8)                                |
| `email`   | string | opcional (vazio se o Google não informar)                  |
| `name`    | string | opcional, só para a interface                              |
| `picture` | string | opcional, só para a interface                              |
| `iat`     | number | segundos; momento da emissão                               |
| `exp`     | number | obrigatório; `iat + SESSION_TTL_SECONDS` (G1, FR-022)       |

**Validação no servidor** (`verifySession`), nesta ordem. Qualquer falha resulta em `UNAUTHENTICATED`:

1. três segmentos; cabeçalho é JSON com `alg === 'HS256'` (A4, A7, A11);
2. `jwt.decode(token, secret, false, 'HS256')` não lança (A5, A7 `none`);
3. `exp` é número e `exp * 1000 > now` (A6; também recusa sessão sem `exp`);
4. `sub` é string não vazia (A8).

**Ciclo de vida**: emitida no login → enviada em toda requisição → expira em 24h, ou é descartada pelo cliente ao
receber `UNAUTHENTICATED` ou no logout. Não há revogação no servidor (fora de escopo). Trocar `SESSION_SECRET`
invalida todas as sessões.

## AuthenticatedUser (contexto GraphQL)

```text
{ id: string /* = sub */, email: string }
```

Única fonte de identidade para os resolvers (FR-009, FR-010). Fica em `context.user`, não opcional.

## Documento (tabela de cálculo), DynamoDB `AWS_DOCUMENTS_TABLE`

Sem mudança de estrutura: chave `id` (partição) + `user_id` (ordenação).

| operação | chave usada                                  | mudança                                                |
|----------|----------------------------------------------|--------------------------------------------------------|
| listar   | filtro `user_id = context.user.id`           | o argumento `id` sai                                   |
| salvar   | `(id do documento ou novo, context.user.id)` | o argumento `user` sai; `user_id` do corpo é ignorado  |
| apagar   | `(id do documento, context.user.id)` + `attribute_exists(id)` | aguardado; falha da condição → `NOT_FOUND` |

## Usuário, DynamoDB `AWS_USER_TABLE`

Sem mudança de estrutura: chave `uid`, atributo `email`. `getUser` e `setUser` usam `context.user.id` e
`context.user.email` (R5, R6).

## Sessão no cliente (`localStorage`)

| chave           | conteúdo                    | ciclo                                                        |
|-----------------|-----------------------------|--------------------------------------------------------------|
| `inui.session`  | token de sessão (string JSON) | gravada após a troca; removida ao expirar, no `UNAUTHENTICATED` ou no logout |
| `inui.token`    | legado (token do Google)    | removida na inicialização; nunca mais gravada                |
| `inui.token-exp`| legado                      | removida na inicialização                                    |

Estados no cliente: `sem sessão` → (login + troca ok) → `autenticado` → (`exp` passou, ou `UNAUTHENTICATED`) →
`expirado`, que mostra a mensagem → (login) → `autenticado`. O logout leva a `sem sessão`, sem mensagem.
