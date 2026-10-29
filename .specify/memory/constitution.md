<!--
Sync Impact Report
- Version change: (template, unratified) → 1.0.0
- Modified principles: n/a (initial adoption)
- Added sections: Core Principles (5), Quality Gates, Governance
- Removed sections: none
- Templates requiring updates:
  - .specify/templates/plan-template.md ⚠ pending manual review (verify Constitution Check gates reference these principles)
  - .specify/templates/spec-template.md ⚠ pending manual review
  - .specify/templates/tasks-template.md ⚠ pending manual review
- Follow-up TODOs: none
-->

# insulina_ui Constitution

## Core Principles

### I. Spec-Before-Code
Production code changes MUST be preceded by an approved spec. No change to
application behavior under `src/` (or any production surface) may be made
without a corresponding spec document that has been reviewed and approved.
Rationale: this is a medical-adjacent dosing tool; undocumented, unreviewed
changes to behavior carry outsized risk and must be traceable to an intent.

### II. Dose Calculation Is Frozen Without Characterization Tests (NON-NEGOTIABLE)
`src/utils/validateUnits.ts` (the insulin dose calculation) MUST NOT be
modified unless characterization tests already exist that capture its current
behavior. Any change to this file MUST be accompanied by tests that prove the
intended behavior change, including explicit before/after cases for every
altered rule. Rationale: this function directly produces a medication dose;
regressions here are the highest-severity class of bug in this project.

### III. Green Gates Always
`yarn test` and `yarn type-check` MUST pass before any change is merged or
considered complete. A task or PR that leaves either command failing is not
done, regardless of how much other work it completed. Rationale: a passing
test/type-check baseline is the minimum signal that nothing provably broke.

### IV. No `any` in New Code
Newly written or newly modified TypeScript code MUST NOT use the `any` type
(including implicit `any` escapes such as unchecked casts to `any`). Existing
`any` usages MAY remain until touched, but any line changed MUST be typed
properly. Rationale: this codebase computes medical dosing values; type
safety is a cheap, continuous defense against class-of-bug errors.

### V. Medical Guidance Prevails
The application is a support/calculation aid, not a medical authority. Where
any feature, copy, default, or behavior could be read as overriding or
second-guessing a clinician's or medical team's guidance, the medical
guidance MUST prevail. Features MUST be designed to assist and inform, never
to silently replace professional medical judgment. Rationale: user safety and
legal/ethical responsibility require the app to defer to medical authority.

## Quality Gates

- Every PR/change touching `src/utils/validateUnits.ts` MUST reference the
  spec that authorized it and MUST include or extend characterization tests
  covering the previous behavior before introducing new behavior.
- `yarn test` and `yarn type-check` are required CI/local gates; a red run on
  either blocks merge.
- Code review MUST reject new `any` usages in changed lines.

## Governance

This constitution supersedes ad-hoc practices for this project. Amendments
require: (1) a written proposal describing the change and rationale, (2)
review against existing specs/plans for conflicts, (3) an explicit version
bump following semantic versioning (MAJOR for incompatible principle removal
or redefinition, MINOR for new principles or materially expanded guidance,
PATCH for clarifications/wording). All specs, plans, and PR reviews MUST
verify compliance with these principles; deviations require documented
justification in the relevant spec's Complexity Tracking section (or
equivalent) and reviewer sign-off.

**Version**: 1.0.0 | **Ratified**: 2026-10-29 | **Last Amended**: 2026-10-29
