# Phase 1 Data Model: Congelar o cálculo de dose (testes de caracterização)

This feature introduces no new persisted entities or production types. The "data
model" here is the shape of **test fixtures** used to drive `it.each` against the
existing `Document` type (unchanged, defined in
[src/interfaces/index.ts](../../src/interfaces/index.ts)).

## Existing type consumed (read-only reference)

```ts
// src/interfaces/index.ts — UNCHANGED, reproduced here for reference only
export interface DocumentValues {
  list: number[]
  custom?: number
}

export interface Document {
  id?: string
  name: string
  units: number
  values: DocumentValues
  limit?: number
}
```

## Test fixture types (new, test-only, no `any`)

```ts
// Conceptual shape — actual code lives in src/utils/__tests__/*.test.ts

/** One row of a table-driven (it.each) test case. */
interface GlucoseCase {
  id: string          // e.g. "B1", "T7", "L2" — matches spec.md Test Cases table
  curr: number        // glicemia informada (gl)
  expected: number     // resultado esperado
}

/** Minimal factory to build a Document fixture without `any`. */
function makeTable(params: {
  units: number
  list: number[]
  custom?: number
  limit?: number
}): Document {
  return {
    name: "test-table", // Document.name is required but not under test
    units: params.units,
    values: { list: params.list, custom: params.custom },
    limit: params.limit,
  }
}
```

## Fixture-to-table mapping

| Test file | Table in spec.md | Fixture shape |
|-----------|-------------------|----------------|
| `validateUnits.base.test.ts` | Modo base | `makeTable({ units: 2, list: [80] })`, cases B1–B6 |
| `validateUnits.incremental.test.ts` | Modo incremental | `makeTable({ units: 2, list: [80], custom: 60 })`, cases I1–I4 |
| `validateUnits.triggers.test.ts` | Modo gatilhos | `makeTable({ units: 3, list: [80,120,170,210] })`, cases T1–T9; T10 adds `custom: 60` |
| `validateUnits.limit.test.ts` | Limite | Per-row table/limit combination, cases L1–L7 |
| `validateUnits.knownIssues.test.ts` | Bordas e problemas conhecidos | Individual fixtures per case: E1, ISSUE-1..5, E4r, E5r |

## Validation rules (from spec Functional Requirements)

- Every fixture MUST be passed to the real `validateUnits` import from
  `@/utils/validateUnits` (FR-001) — never a reimplementation.
- Every call MUST be `await`ed (function is `Promise<number>`).
- Each `ISSUE-n` test MUST include a comment documenting: (a) the current/undesired
  result, (b) why it's a problem, (c) what the expected/correct behavior would be
  (FR-005), and MUST sit next to its reference case (`E4r` for `ISSUE-1`, `E5r` for
  `ISSUE-5`) per FR-006.
- No fixture or assertion may use `any` (FR-011).

## State transitions

N/A — `validateUnits` is a pure, stateless async function; there is no entity
lifecycle to model.
