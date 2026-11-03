# Contrato: API GraphQL `POST /api/graphql`

## Autenticação (toda operação)

```http
Authorization: Bearer <sessão do app>
```

| situação                                                                 | HTTP | resposta                                                       |
|--------------------------------------------------------------------------|------|----------------------------------------------------------------|
| sessão válida                                                            | 200  | dados                                                          |
| sem cabeçalho, outro esquema, `Bearer ` vazio, sessão malformada, outro segredo, expirada, `alg` ≠ HS256, sem `sub`, token do Google | 400 | `errors[0].extensions.code = "UNAUTHENTICATED"`; nenhum resolver executado |
| configuração do servidor ausente/inválida                                | 500  | `errors[0].extensions.code = "INTERNAL_SERVER_ERROR"`, mensagem genérica |

O HTTP 400 vem do Apollo Server 3 quando a função `context` lança um erro com código diferente de
`INTERNAL_SERVER_ERROR` (research R4). O cliente identifica a recusa pelo `extensions.code`, nunca pelo status.

## Schema (depois da mudança)

```graphql
type Query {
  getUser: User!
  getUserDocuments: UserDocuments
}

type Mutation {
  setUser: User!
  saveUserDocument(document: DocumentInput!): Document
  deleteUserDocument(id: ID!): Boolean
}
```

Tipos `User`, `Document`, `UserDocuments` e `DocumentInput` não mudam.

| campo                 | antes                                   | depois                       | identidade vem de |
|-----------------------|-----------------------------------------|------------------------------|-------------------|
| `getUser`             | `(id: ID!)`                             | sem argumentos               | `context.user.id` |
| `getUserDocuments`    | `(id: ID!)`                             | sem argumentos               | `context.user.id` |
| `setUser`             | `(id: ID!, email: String!)`             | sem argumentos               | `context.user.{id,email}` |
| `saveUserDocument`    | `(user: ID!, document: DocumentInput!)` | `(document: DocumentInput!)` | `context.user.id` |
| `deleteUserDocument`  | `(id: ID!, user: ID!)`                  | `(id: ID!)`, id do **documento** | `context.user.id` |

## Erros de domínio

| operação             | situação                                   | resposta                                             |
|----------------------|--------------------------------------------|------------------------------------------------------|
| `deleteUserDocument` | tabela inexistente **ou** de outro usuário | erro `extensions.code = "NOT_FOUND"`, mensagem "Tabela não encontrada" (R4) |
| `deleteUserDocument` | apagada                                    | `true`                                               |
| `deleteUserDocument` | outra falha do banco                       | erro genérico (nunca `false`)                        |

Os outros resolvers mantêm o tratamento atual de erros **do banco** (registrado em research R10).

## Compatibilidade

É uma quebra intencional (D3): um cliente antigo (PWA em cache) que mande os argumentos removidos, ou que não
mande sessão, recebe erro. Por isso o deploy acontece fora do horário das refeições (quickstart, seção de implantação).
