# Implementation Plan: Remover o legado do Google Sheets e impor o Princípio VII por teste

**Branch**: `003-remover-legado-sheets` | **Date**: 2026-11-16 | **Spec**: [spec.md](./spec.md)

**Input**: Feature specification from `/specs/003-remover-legado-sheets/spec.md`

## Summary

Apagar o código morto do banco antigo em planilhas (`src/pages/api/utils/connectors/` e
`src/pages/api/utils/service/`), a reexportação que carregava a credencial da conta de serviço a cada importação
dos resolvers, o `vi.mock` que só existia por causa dela e as dependências `google-spreadsheet` e
`@types/google-spreadsheet`. Em seguida, transformar o Princípio VII em teste: `src/__tests__/publicEnv.test.ts`
caminha pelo disco a partir da raiz, coleta todo `NEXT_PUBLIC_[A-Z0-9_]+` nos arquivos-fonte e falha se algum
nome tiver `KEY`, `SECRET`, `PRIVATE` ou `TOKEN` fora da exceção `NEXT_PUBLIC_APP_KEY`, se um nome do legado
reaparecer (fontes e `package.json`), se uma exceção ficar obsoleta ou se a coleta vier vazia. Nenhum
comportamento do app muda; a credencial antiga é revogada pelo dono depois do deploy.

## Technical Context

**Language/Version**: TypeScript 4.x (`strict: false`), Next.js `latest` (pages router), Node v22 LTS.

**Primary Dependencies**: nenhuma nova. Removidas: `google-spreadsheet`, `@types/google-spreadsheet`. Mantida:
`google-auth-library` 9 (Spec 02). O teste usa só `fs` e `path` do Node.

**Storage**: DynamoDB, sem mudança. Nada muda no `localStorage` nem no `dataToken`.

**Testing**: Vitest 1.6.1, `environment: node`, `include: src/**/__tests__/**/*.test.ts` (sem mudança de
configuração). Linha de base: 106 verificações em 11 arquivos; depois: 12 arquivos, 106 + casos E1–E9.

**Target Platform**: Vercel (funções serverless Node) + PWA (`next-pwa`) no celular.

**Project Type**: aplicação web Next.js única (front e API no mesmo projeto).

**Performance Goals**: o teste lê algumas centenas de arquivos pequenos; alvo < 1 s dentro do `yarn test`.

**Constraints**: varredura por `fs`, não por `git` (Windows, sem depender do git); caminhos com `/` nas
mensagens; nada de teste em `src/pages/`; não tocar `src/utils/validateUnits.ts` nem os testes da Spec 01; Yarn 1
para regravar o `yarn.lock`.

**Scale/Scope**: 5 arquivos apagados, 3 editados (`utils/index.ts`, `resolvers.test.ts`, `package.json`) mais o
`yarn.lock`, 1 teste novo.

Nenhum `NEEDS CLARIFICATION`: o direcionamento técnico e a [research.md](./research.md) cobrem tudo.

## Constitution Check

*GATE: Must pass before Phase 0 research. Re-check after Phase 1 design.*

| Princípio / gate | Como o plano atende | Status |
|---|---|---|
| I. Spec antes do código | Spec 003 escrita e revisada; plano só referencia os FRs dela | ✅ |
| II. Cálculo congelado | `validateUnits.ts` e `src/utils/__tests__/` fora de qualquer tarefa; quickstart §1 confere com `git diff origin/main` | ✅ |
| III. Gates verdes | `yarn test` + `yarn type-check` na quickstart §1 e como última tarefa | ✅ |
| IV. Sem `any` | O teste novo tem tipos explícitos (`{ path; text }`, `string[]`); as linhas editadas só removem código | ✅ |
| V. Orientação médica prevalece | Sem mudança de cálculo nem de texto clínico | ✅ (n/a) |
| VI. Servidor não confia na identidade do cliente | Autenticação da Spec 02 intocada | ✅ (n/a) |
| VII. Segredos no servidor | É o objetivo: remove a chave privada com prefixo público e passa a impor a regra por teste; `NEXT_PUBLIC_APP_KEY` vira exceção justificada no próprio teste | ✅ |
| Gate login/dados/deploy | Mexe em dependências e variáveis de deploy: reversão documentada (quickstart §7) e verificação no PWA instalado (quickstart §5) | ✅ |

**Pós-design (re-check)**: ✅ sem violações. Risco aceito: a varredura por disco lê também arquivos locais não
versionados fora das pastas excluídas; o pior efeito é um falso positivo local (research R2).

## Project Structure

### Documentation (this feature)

```text
specs/003-remover-legado-sheets/
├── spec.md
├── plan.md              # este arquivo
├── research.md          # Fase 0
├── data-model.md        # Fase 1
├── quickstart.md        # Fase 1
├── contracts/
│   └── public-env-test.md
├── checklists/
│   └── requirements.md
└── tasks.md             # Fase 2 (/speckit-tasks)
```

### Source Code (repository root)

```text
package.json                         # EDITAR: remover google-spreadsheet e @types/google-spreadsheet
yarn.lock                            # REGRAVAR: yarn install
src/
├── __tests__/
│   └── publicEnv.test.ts            # NOVO: E1–E9, PUBLIC_ENV_EXCEPTIONS
├── pages/api/utils/
│   ├── index.ts                     # EDITAR: remover export * from './service'
│   ├── connectors/                  # APAGAR (index.ts, tablesConnect.ts, usersConnect.ts)
│   └── service/                     # APAGAR (index.ts, auth.ts)
├── server/__tests__/
│   └── resolvers.test.ts            # EDITAR: remover vi.mock('@/pages/api/utils/service') e comentário
└── utils/validateUnits.ts           # NÃO TOCAR (nem src/utils/__tests__/)
```

**Structure Decision**: aplicação Next.js única. O teste novo fica em `src/__tests__/` (coberto pelo `include`
atual do Vitest e fora de `src/pages/`); a lógica do coletor vive no próprio teste, porque só o teste a usa.

## Complexity Tracking

Sem violações a justificar.
