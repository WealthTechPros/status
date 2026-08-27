# SGE Change Protocol

Every change in this repo follows the SGE 7-step protocol, so config/doc changes trace
back to an approved spec and the audit trail is complete. This repo has no application
code — "IMPLEMENT" and "TEST" below mean editing `.upptimerc.yml` / `assets/` /
`docs/` and confirming the change behaves as expected (e.g. the new monitor shows up in
the next Actions run), not running a unit-test suite.

## The 7 steps

1. **LOCATE** — find the spec(s) and capability the change serves
   (`docs/features/` / `.claude/product-context/capability-model.yaml`). Most changes
   here fall under `SPEC-001` (monitor config) or `SPEC-002` (brand skin).
2. **READ** — read the relevant spec's acceptance criteria and edge cases before
   editing `.upptimerc.yml` or `assets/`. This repo is small enough that "read the
   spec" is the whole governance-read step — no separate digest file yet.
3. **IMPACT** — assess blast radius: does this change a monitor's URL/expected codes
   (risk: false alarm or missed outage), or the brand skin (risk: broken build via the
   Sapper root-relative-URL trap documented in SPEC-002)?
4. **PROPOSE** — for anything beyond a one-line monitor tweak, state the change and
   why before editing.
5. **IMPLEMENT** — edit `.upptimerc.yml` / `assets/` / workflow files directly; no
   build step for config changes.
6. **TEST** — for monitor changes: curl-verify the target URL responds as expected
   before adding it, and confirm the next scheduled Actions run picks it up. For brand
   changes: verify `customHeadHtml` URLs are fully qualified (SPEC-002 edge case)
   before merging.
7. **UPDATE** — keep `docs/vision.md` success measures, the relevant spec, and this
   repo's ADRs in lockstep with the change — e.g. a new monitor added outside a DNS
   cutover event should update SM-3's baseline note.

## Commit trailer (traceability)

Every commit must carry exactly one of these trailers — enforced (warn-only for now) by
`.githooks/commit-msg`:

- `Spec: SPEC-NNN` (or `SGD-NNN`) — the feature spec this commit implements.
- `SGE-Override: <STEP>; <reason ≥10 chars>` — an intentional bypass, for a
  governance / infra / docs change that maps to no single feature spec.
  `STEP ∈ { LOCATE, READ, IMPACT, PROPOSE, IMPLEMENT, TEST, UPDATE, ALL }`.

## Setup

Each clone runs once:

```sh
git config core.hooksPath .githooks
```

## Enforcement

- `.githooks/commit-msg` — local nudge, warns only; never blocks a commit.
- `.github/workflows/require-commit-trailer.yml` — CI backstop copied from the
  framework repo's own workflow. **This workflow itself fails the PR check
  (`exit 1`)** on any commit missing the trailer — it is not advisory code. Whether
  it actually blocks a merge depends on whether it's added to this repo's branch
  protection as a required status check, which is a separate, not-yet-taken step
  (see `docs/sge/questions.md` QD-03 — treat "add to required checks" as part of
  that graduation decision, not something already done by installing the file).
