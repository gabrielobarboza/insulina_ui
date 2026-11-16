# Research: Remover o legado do Google Sheets e impor o Princípio VII por teste

**Feature**: [spec.md](./spec.md) · **Plan**: [plan.md](./plan.md) · **Date**: 2026-11-16

Fatos verificados no código em 2026-11-16 (branch `003-remover-legado-sheets`, atualizado com `origin/main`).

## R1 — Onde fica o teste e como descobre a raiz do repositório

- **Decision**: `src/__tests__/publicEnv.test.ts`. A raiz é `path.resolve(__dirname, '..', '..')`.
- **Rationale**: o `vitest.config.ts` só inclui `src/**/__tests__/**/*.test.ts`; nada de teste em `src/pages/`
  (tudo ali vira rota). O Vitest (vite-node) define `__dirname` em arquivos de teste, então a raiz não depende do
  diretório de onde `yarn test` é chamado. `@types/node` 12 já tipa `__dirname`, `fs` e `path` para o `tsc`.
- **Alternatives considered**: `process.cwd()` (depende de onde o comando roda); mudar o `include` do Vitest para
  aceitar um teste na raiz (mexe em configuração sem ganho).

## R2 — Como listar os arquivos varridos

- **Decision**: caminhada recursiva com `fs.readdirSync(dir, { withFileTypes: true })` a partir da raiz,
  pulando os diretórios `node_modules`, `.next`, `.git` e `public`, e aceitando só as extensões `.ts`, `.tsx`,
  `.js`, `.mjs`. Depois, remove-se da lista o próprio teste e os arquivos gerados (R3). Os caminhos são
  convertidos para relativos à raiz com `/` como separador (`path.relative(...).split(path.sep).join('/')`), e a
  lista é ordenada para mensagens estáveis.
- **Rationale**: portável no Windows, sem depender de `git` instalado nem de estar dentro de um repositório.
  Hoje os arquivos-fonte versionados fora de `src/` são `config.ts`, `next.config.js`, `vitest.config.ts`,
  `babel.config.js`, `images.d.ts`, `next-env.d.ts`, `@types/*.d.ts` e `public/sw.js`; todos entram, exceto
  `public/sw.js` (gerado). `.claude/`, `.specify/` e `illustrator/` não têm `.ts/.tsx/.js/.mjs` hoje.
- **Consequência aceita**: por ser varredura de disco, um arquivo local não versionado com essas extensões fora
  das pastas excluídas também é lido. O efeito possível é só um falso positivo local, nunca um falso negativo.
- **Alternatives considered**: `git ls-files` (descartado pelo direcionamento: depende do git e do ambiente);
  glob do Vitest/fast-glob (dependência indireta, sem ganho sobre `fs`).

## R3 — Arquivos excluídos além das pastas

- **Decision**: excluir `src/__tests__/publicEnv.test.ts` (ele cita os nomes proibidos e as exceções) e o gerado
  `src/api/graphql.tsx` (saída do `graphql-codegen`). A pasta `public/` cobre `sw.js`, `sw.js.map` e `workbox-*.js`,
  que são gerados pelo `next-pwa` e versionados.
- **Verificado**: `src/api/graphql.tsx` tem 0 ocorrências de `NEXT_PUBLIC_`, `google-spreadsheet`,
  `serviceAccountAuth` e `connectors/`. Excluí-lo não esconde nada hoje; e o codegen só gera tipos a partir do
  schema, que não referencia variáveis de ambiente.
- **Alternatives considered**: varrer o gerado (inofensivo hoje, mas o direcionamento e a spec excluem gerados).

## R4 — Coletor e classificação

- **Decision**: o coletor é uma função pura `collectPublicEnvNames(text) → string[]` com a expressão
  `/NEXT_PUBLIC_[A-Z0-9_]+/g`, aplicada ao texto inteiro (código, strings e comentários). Um nome é proibido se a
  parte depois de `NEXT_PUBLIC_` contém `KEY`, `SECRET`, `PRIVATE` ou `TOKEN` como substring. Violação = nome
  proibido que não está em `PUBLIC_ENV_EXCEPTIONS`.
- **Rationale**: é a regra literal do FR-005: falso positivo custa uma exceção justificada, falso negativo custa um
  segredo no navegador. Substring pega `NEXT_PUBLIC_PRIVATEKEY_X` e `NEXT_PUBLIC_X_TOKEN_URL`. Só maiúsculas
  bastam: o Next.js só expõe ao navegador o prefixo exato `NEXT_PUBLIC_`.
- **Alternatives considered**: AST do TypeScript (mais preciso, mas deixaria passar texto e comentários e exigiria
  entender desestruturação e acessos dinâmicos: exatamente o falso negativo que a spec quer evitar).

## R5 — Lista de exceções

- **Decision**: `export const PUBLIC_ENV_EXCEPTIONS = ['NEXT_PUBLIC_APP_KEY'] as const` no próprio teste, com o
  comentário da justificativa (chave de assinatura do `dataToken`, token de configuração das tabelas guardado no
  navegador; pública por definição; troca do mecanismo fica para spec futura por mexer no PWA e no uso sem rede).
- **Rationale**: FR-005 exige que nova exceção só entre alterando o teste de propósito.

## R6 — Autoteste contra "passar vazio" e exceção obsoleta

- **Decision**: depois da varredura real, o teste exige que o conjunto coletado contenha `NEXT_PUBLIC_API_URL` e
  `NEXT_PUBLIC_OAUTH_ID` (lidas em `config.ts`) e cada item de `PUBLIC_ENV_EXCEPTIONS` (senão: "exceção obsoleta").
  Exige também que a lista de arquivos varridos contenha `config.ts`, `next.config.js` e pelo menos um arquivo de
  `src/`, e que nenhum caminho comece por `node_modules/`, `.next/`, `.git/` ou `public/`.
- **Rationale**: se a raiz, as extensões ou as exclusões quebrarem, o teste falha em vez de passar sem ter lido
  nada (FR-005, último trecho; FR-006c).

## R7 — Nomes do legado (FR-001 / FR-006b)

- **Decision**: lista `LEGACY_NAMES = ['google-spreadsheet', 'serviceAccountAuth', 'connectors/',
  'NEXT_PUBLIC_GOOGLE_SERVICE_ACCOUNT_', 'NEXT_PUBLIC_USERS_SHEET_ID', 'NEXT_PUBLIC_TABLES_SHEET_ID']`, procurada
  por substring nos arquivos varridos e em `package.json` lido como texto. `yarn.lock` fica fora do teste e é
  conferido manualmente (SC-001, quickstart §1).
- **Verificado**: hoje esses nomes aparecem só em `src/pages/api/utils/connectors/*`,
  `src/pages/api/utils/service/auth.ts` e `package.json` (mais `yarn.lock`). O comentário do `vi.mock` em
  `resolvers.test.ts` cita "conta de serviço", não um nome proibido, e sai junto com o mock.

## R8 — Provar que o coletor pega violações sem editar arquivos reais

- **Decision**: casos com texto sintético em memória: desestruturação `const { NEXT_PUBLIC_X_TOKEN } = process.env`,
  `process.env.NEXT_PUBLIC_A_SECRET`, `process.env['NEXT_PUBLIC_B_PRIVATE']`, bloco `env: { NEXT_PUBLIC_C_KEY: ... }`,
  comentário `// NEXT_PUBLIC_D_TOKEN`, string solta; mais um caso negativo (`NEXT_PUBLIC_API_URL` não é violação) e
  um de exceção (`NEXT_PUBLIC_APP_KEY` não é violação). A mesma função de busca de legado é exercitada com texto
  sintético contendo `"google-spreadsheet": "^4.0.2"`.
- **Rationale**: cobre SC-003 sem tocar em arquivos do repositório.

## R9 — Remoção e dependências

- **Decision**: apagar `src/pages/api/utils/connectors/` e `src/pages/api/utils/service/`; tirar
  `export * from './service'` de `src/pages/api/utils/index.ts`; tirar o `vi.mock('@/pages/api/utils/service', ...)`
  e seu comentário de `src/server/__tests__/resolvers.test.ts`; remover `google-spreadsheet` e
  `@types/google-spreadsheet` do `package.json` e rodar `yarn install` (Yarn 1) para regravar o `yarn.lock`.
- **Verificado**: ninguém importa `connectors`; `serviceAccountAuth` só é usado pelos conectores; no `yarn.lock`,
  `google-spreadsheet@*` vem só de `@types/google-spreadsheet`. `google-auth-library@^9.0.0` continua como
  dependência direta (usada pela Spec 02). O `vi.mock` precisa sair junto: apontaria para um módulo inexistente.
- **Alternatives considered**: `yarn remove` (equivalente; o `yarn install` após editar o `package.json` deixa o
  diff mais explícito).

## R10 — Rotas removidas e reversão

- **Decision**: como `src/pages/api/**` vira rota, apagar os arquivos basta para que `/api/utils/connectors`,
  `/api/utils/connectors/tablesConnect` e `/api/utils/connectors/usersConnect` respondam 404. Verificação manual
  com `curl` em local, preview e produção (quickstart §3–§5). Reversão: promover o deployment de produção anterior
  na Vercel, possível até o passo 2 da "Ação manual do dono".
- **Rationale**: o cliente não chama essas rotas; um PWA com versão antiga em cache não é afetado.
