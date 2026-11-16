# Data Model: Remover o legado do Google Sheets e impor o Princípio VII por teste

Sem mudança de dados persistidos: DynamoDB, `localStorage` e o `dataToken` ficam como estão. As entidades abaixo
existem só dentro do teste `src/__tests__/publicEnv.test.ts`.

| Entidade | Forma | Regras |
|---|---|---|
| **Arquivo varrido** | `{ path: string; text: string }` | `path` relativo à raiz, separador `/`. Extensão `.ts`, `.tsx`, `.js` ou `.mjs`. Fora de `node_modules/`, `.next/`, `.git/`, `public/`. Não é o próprio teste nem `src/api/graphql.tsx` (research R2–R3). |
| **Nome público** | `string` que casa com `NEXT_PUBLIC_[A-Z0-9_]+` | Coletado em qualquer lugar do texto (research R4). |
| **Nome proibido** | Nome público cuja parte após `NEXT_PUBLIC_` contém `KEY`, `SECRET`, `PRIVATE` ou `TOKEN` | Substring, só maiúsculas. |
| **Exceção** | Item de `PUBLIC_ENV_EXCEPTIONS` (exportada) | Hoje só `NEXT_PUBLIC_APP_KEY`, com comentário de justificativa. Deve aparecer em algum arquivo varrido, senão é "exceção obsoleta". |
| **Nome do legado** | Item de `LEGACY_NAMES` | Os seis nomes do FR-001; procurado por substring nos arquivos varridos e em `package.json`. |
| **Violação** | `{ name: string; path: string }` | Nome proibido fora das exceções, ou nome do legado encontrado. A mensagem de falha lista todas as violações como `nome em caminho`. |
| **Nome âncora** | `NEXT_PUBLIC_API_URL`, `NEXT_PUBLIC_OAUTH_ID` | Devem estar entre os coletados; protegem contra "passar vazio" (research R6). |

Não há transições de estado.
