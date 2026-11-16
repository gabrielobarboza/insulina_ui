# Contrato: teste `src/__tests__/publicEnv.test.ts` e rotas removidas

Esta feature não cria interface externa. Ela **remove** rotas e cria um teste que funciona como regra do
repositório. Este contrato fixa o que o teste garante; os nomes de casos (E1–E9) são usados em `tasks.md`.

## Rotas removidas

| Rota | Antes | Depois |
|---|---|---|
| `/api/utils/connectors` | publicada (código morto) | 404 |
| `/api/utils/connectors/tablesConnect` | publicada (código morto) | 404 |
| `/api/utils/connectors/usersConnect` | publicada (código morto) | 404 |

Nenhuma outra rota, operação GraphQL ou variável de ambiente em uso muda.

## Exportações do teste

- `PUBLIC_ENV_EXCEPTIONS`: `readonly string[]`, hoje `['NEXT_PUBLIC_APP_KEY']`, com comentário de justificativa.

## Casos

Coletor e classificação, com texto sintético em memória (sem ler disco):

- **E1** — coleta o nome em: desestruturação de `process.env`, `process.env.NOME`, `process.env['NOME']`, chave do
  bloco `env`, comentário e string solta.
- **E2** — nomes com `KEY`, `SECRET`, `PRIVATE` ou `TOKEN` em qualquer parte após o prefixo viram violação.
- **E3** — `NEXT_PUBLIC_API_URL` não é violação; `NEXT_PUBLIC_APP_KEY` não é violação por estar nas exceções.
- **E4** — a busca de legado acha `google-spreadsheet` num `package.json` sintético e informa o caminho.

Repositório real:

- **E5** — a varredura inclui `config.ts`, `next.config.js` e arquivos de `src/`; não inclui nada em
  `node_modules/`, `.next/`, `.git/`, `public/`, nem o próprio teste, nem `src/api/graphql.tsx`.
- **E6** — os nomes coletados incluem `NEXT_PUBLIC_API_URL` e `NEXT_PUBLIC_OAUTH_ID` (anti "passar vazio").
- **E7** — nenhuma violação de FR-005; a falha lista cada `nome em caminho`.
- **E8** — cada exceção aparece em pelo menos um arquivo varrido; senão falha com "exceção obsoleta: NOME".
- **E9** — nenhum nome do legado nos arquivos varridos nem em `package.json`; a falha lista `nome em caminho`.

Mensagens usam caminhos relativos à raiz com `/`.
