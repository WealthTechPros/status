# CLAUDE.md — status

## Project context

Public Upptime-based uptime monitor and status page for WealthTech Pros
(`status.wealthtechpros.com`). No application code — config-as-code
(`.upptimerc.yml`), GitHub Actions as the monitor, GitHub Issues as the
incident log, GitHub Pages as the host. See `docs/vision.md` for why this
repo exists and what it deliberately does not do.

## SGE artefact map

- **L0 Vision:** `docs/vision.md` (success measures `SM-1`…`SM-4`)
- **L1 Capability model:** `.claude/product-context/capability-model.yaml`
  (`version: 1.0.0`) — 3 capabilities: monitor config, incident reporting,
  brand-skin maintenance. Deliberately small — this repo has no
  application code to decompose further.
- **L3 Feature specs:** `docs/features/SPEC-NNN-*.md`
  - `SPEC-001` — Monitor Configuration Correctness
  - `SPEC-002` — Brand Skin Maintenance
- **L4 ADRs:** `docs/decisions/NNNN-*.md`
  - `ADR-0001` — Why `status` exists
- **QD registry:** `docs/sge/questions.md`
- **Change protocol:** `docs/sge/change-protocol.md`
- **Commit-trailer hook:** `.githooks/commit-msg` (run
  `git config core.hooksPath .githooks` once per clone) + CI backstop
  `.github/workflows/require-commit-trailer.yml` — **this CI workflow
  itself is blocking (exits non-zero) on a missing trailer**, but it is
  NOT yet added to branch protection as a required status check (see
  `docs/sge/questions.md` QD-03).
- **Agent Security (C11) baseline:** not seeded — this repo has CI but no
  MCP/agent-facing surface (no tool endpoints, no user-input processing
  boundary an agent could cross); C11 is treated as N/A here, same
  exclusion as a pure library.

## Working in this repo

- Monitor changes go in `.upptimerc.yml` under `sites:` — never hand-edit
  the generated `README.md` status table, `api/`, or `history/` (Upptime's
  own Actions regenerate them).
- Deferred/excluded monitors are kept as commented-out stanzas with a
  dated reason, not deleted — see `SPEC-001` edge cases.
- Any repo-specific workflow (like `wtp-graphs.yml`) must use a filename
  outside Upptime's own template file set, or `update-template.yml`'s
  weekly sync will delete it — see `ADR-0001`.
- `customHeadHtml` asset URLs in `.upptimerc.yml` must be fully qualified
  (`https://status.wealthtechpros.com/...`), never root-relative — a
  root-relative href breaks the static-site build (see `SPEC-002` edge
  cases).
