---

description: "Lista de tarefas da Spec 03: remover o legado do Google Sheets e impor o Princípio VII por teste"
---

# Tasks: Remover o legado do Google Sheets e impor o Princípio VII por teste

**Input**: documentos em `specs/003-remover-legado-sheets/`
**Prerequisites**: [plan.md](./plan.md), [spec.md](./spec.md), [research.md](./research.md),
[data-model.md](./data-model.md), [contracts/public-env-test.md](./contracts/public-env-test.md),
[quickstart.md](./quickstart.md)

**Tests**: pedidos pela spec (FR-005, FR-006) e escritos ANTES da remoção: o teste novo precisa falhar contra o
código atual e ficar verde só depois da limpeza.

## Format: `[ID] [P?] [Story] Description`

- **[P]**: pode rodar em paralelo (arquivos diferentes, sem dependência de tarefa incompleta)
- **[Story]**: história de usuário da tarefa (US1, US2, US3)
- **[DONO]**: tarefa manual do dono do projeto. O Claude Code NÃO executa; só lista.

## Regras que valem para todas as tarefas

- NÃO tocar `src/utils/validateUnits.ts` nem `src/utils/__tests__/` (Princípio II, FR-008).
- Sem `any` em código novo (Princípio IV); tipos explícitos.
- Nada de teste dentro de `src/pages/`. O teste novo fica em `src/__tests__/publicEnv.test.ts`.
- O teste nunca lê valores de variáveis de ambiente nem `.env.local`; trabalha só com nomes e caminhos.
- Evidências registradas (seção "Evidências" no fim deste arquivo) contêm só nomes e caminhos, nunca valores.
- Não alterar `vitest.config.ts`, `next.config.js`, `config.ts` nem o uso de `NEXT_PUBLIC_APP_KEY` (D1).

---

## Phase 1: Setup

**Purpose**: confirmar a linha de base antes de qualquer mudança.

- [ ] T001 Confirmar a linha de base no branch `003-remover-legado-sheets`: `git fetch origin`; `git status` sem mudanças em `src/`, `package.json` e `yarn.lock`; `yarn test` = 106 verificações em 11 arquivos; `yarn type-check` sem erros. Registrar os números em "Evidências"

---

## Phase 2: Foundational

Não há pré-requisito bloqueante além da Phase 1: nenhuma dependência nova, nenhuma mudança de configuração.

---

## Phase 3: User Story 2 - Nenhum segredo chega ao navegador, e um teste impede que volte (Priority: P1) 🎯 primeiro

**Goal**: o teste `src/__tests__/publicEnv.test.ts` existe e, contra o código ATUAL, falha pelos motivos certos.

**Independent Test**: `yarn test src/__tests__/publicEnv.test.ts` falha citando
`NEXT_PUBLIC_GOOGLE_SERVICE_ACCOUNT_KEY` e os nomes do legado com arquivo; E1–E6 e E8 passam.

- [ ] T002 [US2] Criar `src/__tests__/publicEnv.test.ts` com a infraestrutura do teste (research R1–R7; data-model): `ROOT = path.resolve(__dirname, '..', '..')`; `EXCLUDED_DIRS = ['node_modules', '.next', '.git', 'public']`; `SOURCE_EXTENSIONS = ['.ts', '.tsx', '.js', '.mjs']`; `EXCLUDED_FILES = ['src/__tests__/publicEnv.test.ts', 'src/api/graphql.tsx']`; `toPosix(rel)` com `split(path.sep).join('/')`; `listSourceFiles(): ScannedFile[]` com `fs.readdirSync(dir, { withFileTypes: true })` recursivo, pulando `EXCLUDED_DIRS` em qualquer nível, filtrando extensões e `EXCLUDED_FILES`, ordenado por `path`; tipo `ScannedFile = { path: string; text: string }` ("`path` relativo à raiz, separador `/`"); `collectPublicEnvNames(text: string): string[]` com `/NEXT_PUBLIC_[A-Z0-9_]+/g` no texto inteiro; `isForbiddenPublicName(name)` = parte após `NEXT_PUBLIC_` contém `KEY`, `SECRET`, `PRIVATE` ou `TOKEN` (substring, maiúsculas); `findPublicEnvViolations(files): Violation[]` (proibido e fora das exceções); `findLegacyNames(files): Violation[]` por substring; tipo `Violation = { name: string; path: string }` e formatação `nome em caminho`. Exportar `PUBLIC_ENV_EXCEPTIONS = ['NEXT_PUBLIC_APP_KEY'] as const` com o comentário: chave de assinatura do `dataToken`, o token de configuração das tabelas guardado no navegador; por ser `NEXT_PUBLIC_` é pública por definição e não protege nada; uso e valor não mudam nesta spec; trocar o mecanismo fica para spec futura (PWA e uso sem rede); nova exceção exige alterar este teste de propósito. Constantes `LEGACY_NAMES` (os seis nomes do FR-001: `google-spreadsheet`, `serviceAccountAuth`, `connectors/`, `NEXT_PUBLIC_GOOGLE_SERVICE_ACCOUNT_`, `NEXT_PUBLIC_USERS_SHEET_ID`, `NEXT_PUBLIC_TABLES_SHEET_ID`) e `ANCHOR_NAMES = ['NEXT_PUBLIC_API_URL', 'NEXT_PUBLIC_OAUTH_ID']`
- [ ] T003 [US2] Em `src/__tests__/publicEnv.test.ts`, escrever os casos com texto sintético em memória, sem ler disco (contrato E1–E4): **E1** um texto com `const { NEXT_PUBLIC_X_TOKEN } = process.env`, `process.env.NEXT_PUBLIC_A_SECRET`, `process.env['NEXT_PUBLIC_B_PRIVATE']`, bloco `env: { NEXT_PUBLIC_C_KEY: 1 }`, comentário `// NEXT_PUBLIC_D_TOKEN` e string solta `'NEXT_PUBLIC_E_KEY'` → o coletor devolve os seis nomes; **E2** `NEXT_PUBLIC_PRIVATEKEY_X` e `NEXT_PUBLIC_X_TOKEN_URL` são violações; **E3** `NEXT_PUBLIC_API_URL` não é violação e `NEXT_PUBLIC_APP_KEY` não é violação (exceção); **E4** `findLegacyNames([{ path: 'package.json', text: '"google-spreadsheet": "^4.0.2"' }])` devolve `google-spreadsheet em package.json`
- [ ] T004 [US2] Em `src/__tests__/publicEnv.test.ts`, escrever os casos contra o repositório real (contrato E5–E9): **E5** os caminhos varridos incluem `config.ts`, `next.config.js` e ao menos um `src/...`; nenhum começa por `node_modules/`, `.next/`, `.git/` ou `public/`; não incluem `EXCLUDED_FILES`; **E6** os nomes coletados incluem `ANCHOR_NAMES` (anti "passar vazio"); **E7** `findPublicEnvViolations` vazio, com a mensagem de falha listando cada `nome em caminho`; **E8** cada item de `PUBLIC_ENV_EXCEPTIONS` aparece em algum arquivo varrido, senão falha com `exceção obsoleta: NOME`; **E9** `findLegacyNames` sobre os arquivos varridos mais `package.json` (lido como texto da raiz) vazio, listando `nome em caminho`. `yarn.lock` NÃO entra (FR-006b)
- [ ] T005 [US2] Rodar `yarn test src/__tests__/publicEnv.test.ts` contra o código ATUAL (antes de qualquer remoção). Esperado: **FALHA**; E7 cita `NEXT_PUBLIC_GOOGLE_SERVICE_ACCOUNT_KEY em src/pages/api/utils/service/auth.ts`; E9 cita os nomes do legado em `src/pages/api/utils/connectors/*`, `src/pages/api/utils/service/*` e `package.json`; E1–E6 e E8 passam. Se falhar por outro motivo (ou passar), corrigir o teste antes de seguir. Registrar em "Evidências" a lista de falhas (nomes e caminhos, sem valores)

**Checkpoint**: o teste vermelho prova que detecta o problema real. Só então começa a Phase 4.

---

## Phase 4: User Story 1 - O app continua funcionando igual depois da limpeza (Priority: P1)

**Goal**: remover o legado sem mudar comportamento; o teste da Phase 3 fica verde e as 106 verificações continuam.

**Independent Test**: `yarn test` = 106 + E1–E9 verdes; rotas `/api/utils/connectors/*` respondem 404 em local.

- [ ] T006 [P] [US1] Apagar `src/pages/api/utils/connectors/` inteiro (`index.ts`, `tablesConnect.ts`, `usersConnect.ts`) (FR-002)
- [ ] T007 [P] [US1] Apagar `src/pages/api/utils/service/` inteiro (`index.ts`, `auth.ts`) e remover a linha `export * from './service'` de `src/pages/api/utils/index.ts`, mantendo `./parsers` e `./dynamoDB` (FR-002)
- [ ] T008 [P] [US1] Em `src/server/__tests__/resolvers.test.ts`, remover `vi.mock('@/pages/api/utils/service', () => ({}))` e o comentário acima dele; nenhuma outra linha muda (FR-009)
- [ ] T009 [US1] Em `package.json`, remover `google-spreadsheet` e `@types/google-spreadsheet` de `dependencies`, mantendo `google-auth-library`; rodar `yarn install` (Yarn 1) para regravar `yarn.lock` (FR-004)
- [ ] T010 [US1] Conferir `git diff yarn.lock` (depende de T009): `git diff yarn.lock | grep -nE "^[+-].*google-auth-library"` vazio (entrada e versão de `google-auth-library` intactas); o diff só REMOVE blocos inteiros (`@types/google-spreadsheet`, `google-spreadsheet` e dependências usadas só por
eles). Uma linha `+` só é aceitável se for o cabeçalho de uma entrada que sobrou com a lista de intervalos de versão
reduzida (mesma versão resolvida); qualquer `+` que traga versão nova ou entrada nova: parar e investigar.
- [ ] T011 [US1] Rodar `yarn test src/__tests__/publicEnv.test.ts` de novo (depende de T006–T010): E1–E9 verdes. Registrar em "Evidências"
- [ ] T012 [US1] Rodar `yarn test` completo: 12 arquivos, 106 verificações anteriores + E1–E9, tudo verde; os testes de `resolvers.test.ts` passam sem o `vi.mock` (FR-007, FR-009, SC-002). Registrar o total em "Evidências"
- [ ] T013 [US1] Com `yarn dev` (porta 9090), rodar os três `curl` da quickstart §3 para `/api/utils/connectors`, `/api/utils/connectors/tablesConnect` e `/api/utils/connectors/usersConnect`: os três `404` (FR-003). Registrar em "Evidências". Encerrar o `yarn dev` ao final

**Checkpoint**: limpeza feita e coberta por teste; comportamento local inalterado.

---

## Phase 5: Polish & gates finais

**Purpose**: gates da constituição e conferências da quickstart §1 antes de entregar para o dono.

- [ ] T014 Rodar `yarn type-check`: sem erros (FR-010)
- [ ] T015 Rodar `yarn build`: termina sem erro (dependências removidas não quebram o build)
- [ ] T016 Rodar `git fetch origin` e `git diff --stat origin/main -- src/utils/validateUnits.ts src/utils/__tests__/`: saída vazia (FR-008). Rodar a busca SC-001 da quickstart §1 (`git grep` dos seis nomes, excluindo `specs/` e `src/__tests__/publicEnv.test.ts`): saída vazia, incluindo `package.json` e `yarn.lock`
- [ ] T017 Limpeza do repositório: se o `yarn build` (T015) reescreveu `public/sw.js` ou `public/workbox-*.js(.map)`, rodar `git restore public/`; `git status` deve mostrar só: `src/__tests__/publicEnv.test.ts` (novo), as remoções de `connectors/` e `service/`, `src/pages/api/utils/index.ts`, `src/server/__tests__/resolvers.test.ts`, `package.json`, `yarn.lock` e os documentos desta spec. Nenhuma mudança em `.env.local`, `next.config.js` ou `config.ts`

**Checkpoint**: entrega do código pronta para PR. O resto é do dono.

---

## Phase 6: Ações do dono [DONO] (NÃO executadas pelo Claude Code)

**Purpose**: deploy e revogação da credencial, na ordem obrigatória da seção "Ação manual do dono" da spec.
Roteiro detalhado em [quickstart.md](./quickstart.md) §4–§7.

- [ ] T018 [US1] [DONO] Preview na Vercel (quickstart §4): build sem erro, três `curl` com `404`, login, tabelas e cálculo como antes
- [ ] T019 [US1] [DONO] Produção (quickstart §5; passo 1): anotar o deployment atual como alvo de reversão, merge em `main`, três `curl` com `404`, PWA instalado no celular com login, tabelas e cálculo iguais (SC-004). Em falha, reverter pela quickstart §7
- [ ] T020 [US3] [DONO] Passo 2, só depois de T019: Google Cloud → IAM → Contas de serviço → Chaves: revogar a chave da conta de serviço das planilhas (ou excluir a conta). A partir daqui a reversão deixa de ser garantida
- [ ] T021 [US3] [DONO] Passo 3: remover `NEXT_PUBLIC_GOOGLE_SERVICE_ACCOUNT_*`, `NEXT_PUBLIC_USERS_SHEET_ID` e `NEXT_PUBLIC_TABLES_SHEET_ID` da Vercel (Preview e Production) e do `.env.local` (SC-005)
- [ ] T022 [US3] [DONO] Passo 4: revogar o compartilhamento das planilhas antigas com a conta de serviço

---

## Dependencies & Execution Order

- **Phase 1 → Phase 3 → Phase 4 → Phase 5 → Phase 6**, estritamente. A ordem "teste vermelho → remoção → teste
  verde" é obrigatória: T005 precisa terminar antes de T006.
- Dentro da Phase 3: T002 → T003 → T004 → T005 (mesmo arquivo).
- Dentro da Phase 4: T006, T007, T008 em paralelo; T009 → T010; T011 depende de T006–T010; T012 depende de T011;
  T013 depende de T006–T007.
- Phase 5: T014–T016 depois de T012; T017 depois de T015.
- Phase 6: T018 → T019 → T020 → T021 → T022. T020 nunca antes de T019 concluída (FR-012).
- **Histórias**: US2 vem primeiro porque o teste é a prova da limpeza; US1 depende de US2 (T005); US3 depende do
  deploy verificado de US1 (T019).

## Parallel Example

```text
# Phase 4, depois de T005:
T006 Apagar src/pages/api/utils/connectors/
T007 Apagar src/pages/api/utils/service/ e o export em src/pages/api/utils/index.ts
T008 Remover o vi.mock em src/server/__tests__/resolvers.test.ts
```

## Implementation Strategy

1. **MVP = Phase 3 + Phase 4 + Phase 5**: código limpo, regra do Princípio VII imposta por teste, gates verdes.
   É o que vai para o PR.
2. **Entrega completa** = MVP + Phase 6 executada pelo dono (deploy, verificação no PWA e revogação da credencial).

## Evidências

> Preenchido durante a implementação. Só nomes, caminhos e contagens; nunca valores de variáveis.

- T001 linha de base: _
- T005 execução vermelha: _
- T010 blocos removidos do `yarn.lock`: _
- T011 execução verde: _
- T012 total da suíte: _
- T013 respostas dos `curl`: _
