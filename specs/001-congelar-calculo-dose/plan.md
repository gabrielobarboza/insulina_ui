# Implementation Plan: Congelar o cálculo de dose (testes de caracterização)

**Branch**: `001-congelar-calculo-dose` | **Date**: 2026-10-29 | **Spec**: [spec.md](./spec.md)

**Input**: Feature specification from `/specs/001-congelar-calculo-dose/spec.md`

**Note**: This template is filled in by the `/speckit-plan` command; its definition describes the execution workflow.

## Summary

Add a standalone, Next.js-version-independent test suite (Vitest) that characterizes
the current behavior of `validateUnits` (`src/utils/validateUnits.ts`) exactly as it
behaves today, including known-bad edge cases (`ISSUE-1`..`ISSUE-5`), without changing
any production file. Tests live under `src/utils/__tests__/`, run via `vitest run`
(no watch) through `yarn test`, use `it.each` over the exact case table from the spec,
`await` every call (the function is `async`), and resolve the `@/` import alias to
`src/`. The plan verifies `yarn type-check` keeps the same (passing) result after
adding the dev-only tooling, and documents the Vitest version choice given the
project's TypeScript 4.3.2.

## Technical Context

**Language/Version**: TypeScript 4.3.2 (existing, unchanged) on Node 20 LTS (project
constraint; locally available Node is v22.17.1, which satisfies Vitest's `engines`
range for all candidate versions below — 20 LTS remains the target/CI baseline).

**Primary Dependencies (new, dev-only)**: `vitest` (test runner), `@vitest/coverage-v8`
— NOT required by this spec and therefore NOT added (no coverage requirement in
scope). No `@types/node` bump required beyond what's already present, see Research.

**Storage**: N/A (pure function, no persistence).

**Testing**: Vitest (`vitest run`), invoked through `yarn test`. No jsdom/happy-dom
needed — `validateUnits` is a plain async function with no DOM dependency.

**Target Platform**: Node.js (local dev machine / future CI), not a browser.

**Project Type**: Existing single Next.js application (`src/`) — this feature only
adds a test layer; no new project/package is created.

**Performance Goals**: N/A — test suite execution time is not a tracked metric for
this feature (dozens of pure-function assertions; expected to run in well under 1s).

**Constraints**:
- MUST NOT modify `src/utils/validateUnits.ts` or any other production file.
- MUST NOT depend on the installed Next.js version.
- MUST NOT access network or environment variables during `yarn test`.
- MUST NOT introduce `any` in new test code.
- MUST keep `yarn type-check` passing with no new errors attributable to this change.

**Scale/Scope**: ~30 individual test cases (per the spec's Test Cases table), all
targeting one exported function, in one new test file (or a small number of files
grouped by mode).

## Constitution Check

*GATE: Must pass before Phase 0 research. Re-check after Phase 1 design.*

| Principle | Check | Status |
|-----------|-------|--------|
| I. Spec-Before-Code | This plan is driven by the approved spec at [spec.md](./spec.md). | PASS |
| II. Dose Calculation Is Frozen Without Characterization Tests | This feature *is* the characterization suite; `validateUnits.ts` itself is not touched. | PASS |
| III. Green Gates Always | Plan explicitly requires `yarn test` to pass and `yarn type-check` to keep its prior (passing) result. | PASS (verification step defined in Research/Quickstart) |
| IV. No `any` in New Code | All new test files are typed without `any` (FR-011); `it.each` tuples typed explicitly. | PASS |
| V. Medical Guidance Prevails | N/A to this feature (no UI/guidance change); known-bad behaviors are documented, not silently fixed. | PASS |

No violations requiring justification. Complexity Tracking table is omitted (not needed).

## Project Structure

### Documentation (this feature)

```text
specs/001-congelar-calculo-dose/
├── plan.md              # This file (/speckit-plan command output)
├── research.md          # Phase 0 output (/speckit-plan command)
├── data-model.md        # Phase 1 output (/speckit-plan command)
├── quickstart.md        # Phase 1 output (/speckit-plan command)
├── checklists/
│   └── requirements.md  # Spec quality checklist (/speckit-specify command)
└── tasks.md             # Phase 2 output (/speckit-tasks command - NOT created by /speckit-plan)
```

### Source Code (repository root)

```text
# Option 1: Single project (this repo's actual layout — existing Next.js app)
src/
├── utils/
│   ├── validateUnits.ts        # UNCHANGED production file (target of characterization)
│   └── __tests__/               # NEW — test files live here, never under src/pages/
│       ├── validateUnits.base.test.ts         # Modo base (B1–B6)
│       ├── validateUnits.incremental.test.ts  # Modo incremental (I1–I4)
│       ├── validateUnits.triggers.test.ts     # Modo gatilhos (T1–T10)
│       ├── validateUnits.limit.test.ts        # Limite (L1–L7)
│       └── validateUnits.knownIssues.test.ts  # Bordas/ISSUE-n/E1/E4r/E5r
├── interfaces/
│   └── index.ts                 # UNCHANGED — Document type consumed, not modified
└── pages/                       # UNCHANGED — tests MUST NOT live here

# Repo-root additions (config only, no new "project")
vitest.config.ts                 # NEW — @/ alias, node environment, no watch default
package.json                     # MODIFIED — add "test" script + devDependencies only
```

**Structure Decision**: Single existing project (Option 1). Test files are grouped by
calculation mode (base/incremental/triggers/limit/known-issues) under
`src/utils/__tests__/`, mirroring the spec's Test Cases sections so each file maps
1:1 to a spec table and reviewers can trace FR-002 coverage easily. No `tests/`
top-level directory is introduced, since the project convention favors co-located
`__tests__` folders (consistent with existing patterns like
`src/pages/api/resolvers/`, `src/pages/api/utils/` groupings) and keeps the test
runner config (`vitest.config.ts`) scoped to find tests without touching
`src/pages/**`.

## Complexity Tracking

> No Constitution Check violations — table intentionally omitted.
