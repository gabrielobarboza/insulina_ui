---
description: "Task list template for feature implementation"
---

# Tasks: Congelar o cálculo de dose (testes de caracterização)

**Input**: Design documents from `/specs/001-congelar-calculo-dose/`

**Prerequisites**: [plan.md](./plan.md), [spec.md](./spec.md), [research.md](./research.md), [data-model.md](./data-model.md), [quickstart.md](./quickstart.md)

**Tests**: This entire feature *is* a test suite (characterization tests). There is
no separate "implementation" to test against — writing the test files is the
deliverable. Task phases below therefore use the test files themselves as the
"Implementation for User Story 1" tasks.

**Organization**: Single user story (P1 — see [spec.md](./spec.md#user-story-1---rede-de-segurança-para-o-cálculo-de-dose-atual-priority-p1)).

## Format: `[ID] [P?] [Story] Description`

- **[P]**: Can run in parallel (different files, no dependencies)
- **[Story]**: Which user story this task belongs to (US1)
- Include exact file paths in descriptions

## Path Conventions

Single existing Next.js project. All new files live under `src/utils/__tests__/`
(never `src/pages/`) plus repo-root config, per [plan.md's Project Structure](./plan.md#project-structure).

---

## Phase 1: Setup (Shared Infrastructure)

**Purpose**: Capture baseline, install the test runner, wire configuration — no test
content yet.

- [X] T001 Capture baseline by running `yarn type-check` and recording the result (expected: exit 0, matches prior session) — no file changes, verification only, per [quickstart.md Step 1](./quickstart.md#step-1--capture-the-baseline)
- [X] T002 Add `vitest@1.6.1` to `devDependencies` in [package.json](../../package.json) via `yarn add -D vitest@1.6.1` (do NOT add `@vitest/ui` or `@vitest/coverage-v8` — out of scope per [research.md §1](./research.md#1-test-runner-version-vitest))
- [X] T003 Add `"test": "vitest run"` to the `scripts` section of [package.json](../../package.json) (no watch mode, per FR-007)
- [X] T004 Create `vitest.config.ts` at the repo root configuring `resolve.alias` to map `@` → absolute path of `src/`, Node test environment, matching test files only under `src/**/__tests__/**/*.test.ts` (per [research.md §2](./research.md#2-path-alias--→-src))
- [X] T005 Re-run `yarn type-check` and compare against the T001 baseline — if it newly fails, apply the fallback in [research.md §1](./research.md#1-test-runner-version-vitest) (downgrade to `vitest@0.34.6`, re-verify, and update [research.md](./research.md) with the version actually used and why)

**Checkpoint**: Test runner installed and configured; `yarn type-check` still green; `yarn test` runs (with zero test files, trivially passes/no-ops).

---

## Phase 2: Foundational (Blocking Prerequisites)

**Purpose**: Shared test fixture helper used by every test file — must exist before
any user-story test file is written.

**⚠️ CRITICAL**: T006 blocks all of Phase 3.

- [X] T006 Create shared fixture helper `makeTable()` and `GlucoseCase` type (no `any`) in `src/utils/__tests__/fixtures.ts`, per the shapes defined in [data-model.md](./data-model.md#test-fixture-types-new-test-only-no-any)

**Checkpoint**: Fixture helper ready — all five test files in Phase 3 can now be written (in parallel, since each is an independent file).

---

## Phase 3: User Story 1 - Rede de segurança para o cálculo de dose atual (Priority: P1) 🎯 MVP

**Goal**: A complete, passing Vitest suite that characterizes every documented mode
(base, incremental, triggers), limit behavior, and known-bad edge cases of
`validateUnits`, importing the real function, with `ISSUE-n` tests individually
commented and reference cases alongside them.

**Independent Test**: Run `yarn test` — all test files pass, covering every case ID
in [spec.md's Test Cases table](./spec.md#test-cases-reference-data-for-implementation).

### Implementation for User Story 1

- [X] T007 [P] [US1] Write `describe('modo base', ...)` with `it.each` over cases B1–B6 in `src/utils/__tests__/validateUnits.base.test.ts`, importing `validateUnits` from `@/utils/validateUnits` and `makeTable` from `./fixtures`, each call `await`ed (table: `units: 2, list: [80]`) — case B5 MUST be labeled as the CalcTableForm help-screen example 1 (FR-004)
- [X] T008 [P] [US1] Write `describe('modo incremental', ...)` with `it.each` over cases I1–I4 in `src/utils/__tests__/validateUnits.incremental.test.ts` (table: `units: 2, list: [80], custom: 60`) — case I4 MUST be labeled as the CalcTableForm help-screen example 2 (FR-004)
- [X] T009 [P] [US1] Write `describe('modo gatilhos', ...)` with `it.each` over cases T1–T10 in `src/utils/__tests__/validateUnits.triggers.test.ts` (table: `units: 3, list: [80,120,170,210]`; T10 additionally sets `custom: 60` to prove it's ignored) — case T7 MUST be labeled as the CalcTableForm help-screen example 3 (FR-004)
- [X] T010 [P] [US1] Write `describe('limite', ...)` with `it.each` over cases L1–L7 in `src/utils/__tests__/validateUnits.limit.test.ts`, each row supplying its own table/`limit` combination per [spec.md's Limite table](./spec.md#limite)
- [X] T011 [P] [US1] Write individual (non-table-driven) tests for case `E1` (empty `list`) in `src/utils/__tests__/validateUnits.knownIssues.test.ts`
- [X] T012 [US1] In the same file (`src/utils/__tests__/validateUnits.knownIssues.test.ts`), add `ISSUE-1` test (gatilhos `[80,210,120]`, `ui 3`, gl 150 → current result 5) immediately followed by its reference case `E4r` (gatilhos `[80,120,210]`, `ui 3`, gl 150 → 4), with a comment on `ISSUE-1` explaining the out-of-order-triggers problem and the expected behavior, per FR-005/FR-006 (depends on T011 for file existence)
- [X] T013 [US1] In the same file, add `ISSUE-2` test (base `[80]`, `ui 2`, gl -5 → 0) with a comment explaining negative glucose is silently accepted (depends on T012)
- [X] T014 [US1] In the same file, add `ISSUE-3` test, covering both `lim 0` (case `L4`-equivalent) and no-`limit` (case `L5`-equivalent) inputs with gl 9999 → 125, with a comment explaining the unbounded-dose risk (depends on T013) — NOTE: L4/L5 themselves are already covered by T010; this task adds the `ISSUE-3`-labeled test(s) that specifically carry the explanatory comment
- [X] T015 [US1] In the same file, add `ISSUE-4` test (base `[80]`, `ui 2`, gl 79 → 0) with a comment explaining the function cannot signal "low glucose" distinctly from "no dose needed" (depends on T014)
- [X] T016 [US1] In the same file, add `ISSUE-5` test (gatilhos `[80,120,120]`, `ui 3`, gl 130 → current result 5) immediately followed by its reference case `E5r` (gatilhos `[80,120]`, `ui 3`, gl 130 → 4), with a comment explaining the duplicate-trigger level-skip problem, per FR-005/FR-006 (depends on T015)
- [X] T017 [US1] Run `yarn test` and confirm every case ID from [spec.md's Test Cases section](./spec.md#test-cases-reference-data-for-implementation) (B1–B6, I1–I4, T1–T10, L1–L7, E1, ISSUE-1..5, E4r, E5r) is present and passing (depends on T007–T016)

**Checkpoint**: `yarn test` passes with full coverage of every spec case; User Story 1 is fully functional and independently verifiable.

---

## Phase 4: Polish & Cross-Cutting Concerns

**Purpose**: Final verification against the spec's Definition of Done / Success
Criteria — no new test content, only checks.

- [ ] T018 Run `git diff --stat` and confirm only `package.json`, the yarn lockfile, `vitest.config.ts`, and files under `src/utils/__tests__/` appear — no other `src/` file was modified (SC-002), per [quickstart.md Step 6](./quickstart.md#step-6--confirm-no-production-files-changed)
- [ ] T019 On a throwaway branch (never committed), apply each of the three sensitivity-test mutations to `src/utils/validateUnits.ts` one at a time (`>=`→`>`, `Math.floor`→`Math.round`, flip the `limit < result` ternary), run `yarn test` after each, confirm at least one test fails each time, then discard the branch (SC-003), per [quickstart.md Step 7](./quickstart.md#step-7--sensitivity-check-manual-discardable-branch--never-commit)
- [ ] T020 [P] Review `src/utils/__tests__/validateUnits.knownIssues.test.ts` to confirm every `ISSUE-1`..`ISSUE-5` test has an explanatory comment (current + expected behavior) and that B5/I4/T7 are correctly present and labeled as help-screen examples (SC-004, SC-005)
- [ ] T021 Final run of `yarn test` and `yarn type-check` together, confirming both are green, satisfying Constitution Principle III (Green Gates Always) and this feature's Definition of Done

---

## Dependencies & Execution Order

### Phase Dependencies

- **Setup (Phase 1)**: T001 → T002 → T003 → T004 → T005, strictly sequential (each step depends on the prior one's output/verification).
- **Foundational (Phase 2)**: T006 depends on Phase 1 completion (needs `vitest.config.ts`/alias in place to be type-checked meaningfully). Blocks all of Phase 3.
- **User Story 1 (Phase 3)**: T007–T010 are parallel (`[P]`, independent files) once T006 is done. T011 starts the known-issues file; T012–T016 are sequential within that same file (each adds to it). T017 depends on all of T007–T016.
- **Polish (Phase 4)**: T018–T021 depend on Phase 3 completion (T017).

### Parallel Opportunities

- T007, T008, T009, T010 can be written in parallel (four different files, all depending only on T006).
- T020 can run in parallel with T018/T019 (read-only review vs. git/branch operations).

---

## Implementation Strategy

### MVP = This Entire Feature

There is only one user story (P1), and it IS the MVP: a complete, passing
characterization suite. There is no smaller independently-shippable slice — partial
coverage (e.g., only the base mode) would not satisfy FR-002 ("cada caso... deve
existir como um teste") or the Definition of Done in [spec.md](./spec.md#success-criteria-mandatory).

### Suggested Execution Order

1. Phase 1 (Setup) sequentially — T001 → T005.
2. Phase 2 (Foundational) — T006.
3. Phase 3 (User Story 1) — T007–T010 in parallel, then T011–T016 sequentially in the known-issues file, then T017 to verify.
4. Phase 4 (Polish) — T018, T019, T020 (T020 parallel with T018/T019), then T021 last.
