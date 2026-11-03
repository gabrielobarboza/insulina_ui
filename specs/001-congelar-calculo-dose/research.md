# Phase 0 Research: Congelar o cálculo de dose (testes de caracterização)

## 1. Test runner version: Vitest

**Decision**: Use **Vitest 1.6.1** (latest stable 1.x release) as the test runner,
invoked as `vitest run` (no watch) via the `yarn test` script.

**Rationale**:
- Vitest does **not** declare `typescript` as a `peerDependency` in any 0.x/1.x/2.x
  release inspected (`0.34.6`, `1.6.1`, `2.1.9`) — it transpiles TypeScript itself via
  esbuild at test-run time, so the installed project TypeScript (4.3.2, used only for
  `tsc --noEmit` type-checking) does not need to satisfy any Vitest-imposed minimum.
- The actual compatibility risk is whether the **TypeScript compiler** (`tsc`, used by
  `yarn type-check`) can parse Vitest's own `.d.ts` declaration files when test files
  `import { describe, it, expect } from 'vitest'`. The project's [tsconfig.json](../../tsconfig.json)
  already sets `"skipLibCheck": true`, which skips type-checking of all declaration
  files from `node_modules` (including Vitest's), substantially reducing this risk —
  `tsc` still needs to *parse* those `.d.ts` files to resolve imported symbol types,
  but does not deep-check them.
- `engines.node` for Vitest 1.6.1 is `"^18.0.0 || >=20.0.0"`, which is satisfied by
  the Node 20 LTS target (and by the locally available Node v22.17.1).
- Vitest 1.x is the last major line before the 2.x/3.x rewrites that introduced
  broader internal use of newer TypeScript syntax; picking the latest stable 1.x
  release (1.6.1) minimizes exposure to bleeding-edge declaration-file syntax while
  still being a fully supported, non-beta release with active-at-the-time
  documentation.
- No coverage reporting is required by the spec, so `@vitest/coverage-v8` /
  `@vitest/ui` are deliberately **not** added (keeps the dependency surface minimal,
  per FR-010).

**Alternatives considered**:
- **Vitest 2.x / 3.x / 4.x (latest)**: Rejected for this spec — same "no TS peer dep"
  situation applies, so they would likely also work, but they are a materially larger
  jump from the project's current (2021-era) toolchain, increasing the surface for an
  unrelated incompatibility to surface during a test-only change. Nothing in the spec
  requires bleeding-edge Vitest features (`it.each`, `describe`, `expect` have been
  stable since early Vitest versions). If Phase 2 implementation finds 1.6.1
  incompatible in practice, the next candidate is 1.6.x (latest patch) before
  escalating to 2.x.
- **Jest**: Rejected per spec constraint — "infraestrutura de teste não pode depender
  da versão do Next" is easier to satisfy with Vitest's standalone config, and the
  spec explicitly names Vitest as the preferred tool (confirmed by user's technical
  direction in the planning prompt).
- **ts-node + node:test**: Rejected — more manual wiring for the `@/` alias and no
  built-in `it.each`-equivalent ergonomics matching the spec's requirement to use
  `it.each` directly.

**Verification step (to run during/after implementation, not research)**:
1. Record the output of `yarn type-check` **before** any dependency is added
   (baseline: exit code 0, per the terminal history already captured for this
   session).
2. Add `vitest` (and `@types/node` only if the installed version is insufficient —
   see Decision 3 below) as `devDependencies`.
3. Re-run `yarn type-check` and diff the result against the baseline.
4. If `yarn type-check` newly fails because of Vitest's declaration files, downgrade
   to the latest Vitest 0.34.x (`0.34.6`) — same "no TS peer dep" property, older
   codebase, lower syntax-compatibility risk — and re-verify. Document whichever
   version is actually used and why in this file's Decision if it changes.

## 2. Path alias `@/` → `src/`

**Decision**: Configure the alias directly in `vitest.config.ts` using
`resolve.alias`, mapping `@` to the absolute path of `src/`, rather than relying on
`tsconfig-paths`/`vite-tsconfig-paths`.

**Rationale**:
- The project already defines `"@/*": ["src/*"]` in [tsconfig.json](../../tsconfig.json)
  for editor/type-checking purposes (consumed by `validateUnits.ts`'s own
  `import { Document } from "@/interfaces"`).
- Vitest (built on Vite) resolves module specifiers through its own `resolve.alias`
  at run time; it does **not** automatically read `tsconfig.json` `paths` without an
  extra plugin. Adding a plugin dependency (`vite-tsconfig-paths`) is avoidable
  complexity for a single, static alias — a two-line `resolve.alias` entry is
  simpler, has zero extra dependencies, and cannot silently diverge from the
  intended mapping.
- No change to `tsconfig.json` itself is required (it already exists and is correct
  for `tsc`'s own resolution); `vitest.config.ts` is additive config only.

**Alternatives considered**:
- `vite-tsconfig-paths` plugin: Rejected — unnecessary extra dependency for a
  single static alias; would also need its own compatibility check.
- Relative imports in test files (no alias): Rejected — spec explicitly directs
  configuring the `@/` alias, and production code (`validateUnits.ts`) itself
  imports via `@/interfaces`, so tests importing via relative paths would still work
  but the alias must be configured regardless if a test needs to import `@/interfaces`
  types directly (e.g., to type-annotate a `Document` fixture without `any`, per
  FR-011).

## 3. `@types/node` compatibility

**Decision**: Keep the existing `@types/node@^12.12.21` as-is; do **not** bump it as
part of this feature unless `yarn type-check` verification (Research §1, step 3)
reveals a concrete incompatibility.

**Rationale**:
- Vitest 1.6.1's own `peerDependencies` list `"@types/node": "^18.0.0 || >=20.0.0"`,
  but this is a `peerDependency` of **Vitest itself** for its internal Node API
  typings — it is a soft (often `peerDependenciesMeta.optional`) signal, not a hard
  install blocker, and does not retroactively break the project's own `tsc` run
  against existing source files.
- Bumping `@types/node` is a change with a blast radius beyond this test-only
  feature (it affects type-checking of all `src/` files, including
  `src/pages/api/**`, which use Node/AWS SDK types). The spec explicitly restricts
  changes to `devDependencies`, the `test` script, and config/test files — a
  `@types/node` bump is technically an allowed `devDependencies` change, but
  **only if required**; this plan defers it unless the verification step proves it
  necessary, to minimize unrelated blast radius per the "fora de escopo" fence.
- If the verification step shows a real conflict, the fallback is to add a scoped
  `tsconfig` override or accept a minimal `@types/node` bump — to be decided with a
  concrete error message in hand, not speculatively.

## 4. Test file layout and `it.each`

**Decision**: One test file per spec section (base, incremental, triggers, limit,
known-issues/edge-cases), each using `describe` + `it.each` with a typed tuple array
mirroring the corresponding Markdown table in [spec.md](./spec.md#test-cases-reference-data-for-implementation).

**Rationale**:
- Mirrors the spec's own table structure 1:1, so FR-002 ("cada caso... deve existir
  como um teste") is trivially auditable: each row in the spec maps to one row in an
  `it.each` array in a correspondingly-named file.
- `it.each` requires an explicit element type for the tuple array to avoid `any`
  (FR-011) — e.g. `Array<[id: string, curr: number, expected: number]>` or an object
  literal type `{ id: string; curr: number; expected: number }[]`.
- `validateUnits` is `async`; every `it.each` callback is declared `async` and
  `await`s the call, per the spec's technical direction and FR-001.
- Known-issue tests (`ISSUE-1`..`ISSUE-5`) are NOT mixed into the `it.each` arrays of
  "normal" behavior — they get individual `it(...)` blocks (not table-driven) so each
  can carry its own explanatory comment block per FR-005, which would be awkward to
  attach per-row in a shared `it.each` table. Reference cases `E4r`/`E5r` are placed
  directly adjacent to their corresponding `ISSUE-n` test for easy visual comparison.

**Alternatives considered**:
- Single monolithic test file: Rejected — harder to review against the spec's
  sectioned tables; mixes concerns (mode logic vs. limit vs. known bugs).
- Mixing `ISSUE-n` into the same `it.each` tables as normal cases: Rejected — loses
  the per-case explanatory comment required by FR-005 and makes it too easy to
  "accidentally" treat a documented bug as unremarkable input data in future edits.

## 5. Script wiring (`package.json`)

**Decision**: Add `"test": "vitest run"` to the `scripts` section. No `"test:watch"`
or other variants are added (out of scope — spec only requires the one command).

**Rationale**: Directly satisfies FR-007 (no watch mode, deterministic single run,
no network/env dependency — Vitest's default config for a Node-environment, no
network-calling test suite already satisfies "sem rede e sem variáveis de ambiente"
with zero extra configuration).
