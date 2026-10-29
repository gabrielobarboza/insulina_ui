# Quickstart: Validating the Characterization Test Suite

This guide proves the feature works end-to-end once implemented (Phase 2/3). It does
not contain implementation code — see [data-model.md](./data-model.md) for fixture
shapes and [plan.md](./plan.md) for file layout.

## Prerequisites

- Node 20 LTS (or compatible — locally verified against Node v22.17.1).
- Repo dependencies installed (`yarn install`).
- No network access required for the test run itself.
- No environment variables required.

## Step 1 — Capture the baseline

Before adding any dependency, confirm the current state:

```bash
yarn type-check
```

Expected: exits 0 (already confirmed in this session's terminal history).

## Step 2 — Install the test runner (dev-only)

```bash
yarn add -D vitest
```

Per [research.md](./research.md#1-test-runner-version-vitest), start with
`vitest@1.6.1`. Do not add `@vitest/ui` or `@vitest/coverage-v8` (out of scope).

## Step 3 — Add configuration

Add `vitest.config.ts` at the repo root (resolves `@/` → `src/`, Node environment,
no globals required since tests import `describe`/`it`/`expect` explicitly).

Add to `package.json` `scripts`:

```json
"test": "vitest run"
```

## Step 4 — Re-verify the baseline did not regress

```bash
yarn type-check
```

Expected: exits 0, identical result to Step 1. If it fails, follow the fallback in
[research.md §1](./research.md#1-test-runner-version-vitest) (downgrade to
`vitest@0.34.6`) and repeat this step.

## Step 5 — Add test files and run the suite

Add the five test files listed in [plan.md](./plan.md#project-structure) under
`src/utils/__tests__/`, covering every case in
[spec.md's Test Cases section](./spec.md#test-cases-reference-data-for-implementation).

```bash
yarn test
```

Expected: all tests pass (per SC-001), suite runs once and exits (no watch mode),
no network calls, no env vars read.

## Step 6 — Confirm no production files changed

```bash
git diff --stat
```

Expected (per SC-002): only `package.json`, the yarn lockfile, `vitest.config.ts`,
and files under `src/utils/__tests__/` appear. No other file under `src/` appears.

## Step 7 — Sensitivity check (manual, discardable branch — never commit)

On a throwaway branch, make each of these changes **one at a time** to
`src/utils/validateUnits.ts`, run `yarn test` after each, confirm at least one test
fails, then discard the branch (per SC-003):

1. Replace `curr >= val` (or `>= val` in the triggers loop) with `curr > val`.
2. Replace `Math.floor(...)` with `Math.round(...)`.
3. Replace `limit < result ? limit : result` with `result < limit ? limit : result`
   (i.e., flip the ternary condition).

If any of the three changes does **not** break at least one test, the suite is
missing a case — return to Step 5 and add coverage before considering the feature
done.

## Step 8 — Review `ISSUE-n` documentation

Open `src/utils/__tests__/validateUnits.knownIssues.test.ts` and confirm each
`ISSUE-1`..`ISSUE-5` test has a comment explaining the current/undesired behavior
and the expected/correct one (per SC-004), and that `B5`, `I4`, `T7` (help-screen
examples) are present and correctly covered (per SC-005).
