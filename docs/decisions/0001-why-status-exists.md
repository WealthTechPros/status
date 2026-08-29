---
status: accepted
vision_element_protected: "Non-goals — not a general observability platform, not an incident-management/paging system"
---

# ADR-0001: Why `status` exists

## Context

WTP runs a growing number of independently-deployed products
(`client-onboarding`, `sge`, `trust-fabric`, `wtp-mcp`, `wtp-assistant`,
`adviser-mcp`, the marketing site, project management, the client document
portal) with no dedicated on-call team — Rob and Dave carry it informally.
When a product goes down, both internal staff and external clients/
counterparties need a fast, low-trust-required way to answer "is this
actually down, or is it just me" without paging anyone or reading GitHub
Actions logs.

Building a bespoke monitoring stack (a database, an alerting service, a
custom status page app) would mean maintaining infrastructure whose only
job is to say "up" or "down" — disproportionate for a team this size.

Upptime (`upptime/upptime`) solves exactly this: GitHub Actions as the
monitor, GitHub Issues as the incident log, GitHub Pages as the host,
config-as-code via `.upptimerc.yml`. No server to run, no database to
back up, and the incident history is git history — auditable, public,
free.

## Decision

Adopt Upptime as-is for uptime monitoring and the public status page,
with two deliberate deviations from a stock Upptime install:

1. **A repo-specific Graphs CI workflow (`wtp-graphs.yml`)** replaces the
   stock `graphs.yml`, because `npx @upptime/graphs` depends on
   `canvas@2.x`, which has no prebuilt binaries for Node 22+ — the stock
   workflow silently produces nothing on current GitHub Actions runners.
   `wtp-graphs.yml` pins Node 20 (the last ABI with `canvas@2` prebuilts)
   before running the generator. It is kept under a filename **outside**
   Upptime's own template file set specifically so `update-template.yml`'s
   weekly sync never deletes it — the stock `graphs.yml` is left in place
   as a harmless no-op rather than removed, so a future upstream fix to
   `upptime/graphs` is picked up automatically if it lands.
2. **A WTP brand skin** (`assets/wtp-status.css` + Raleway fonts + logo/
   favicon, wired via `.upptimerc.yml`'s `status-website:` block) replaces
   the stock Upptime template look, sourced from
   `wtp-org/brand-assets/tokens.json`.

## Consequences

- **We accept** the constraint that any future repo-specific workflow must
  follow the same "outside the template file set" pattern, or be
  re-applied after every weekly template sync — this is now a standing
  rule, not a one-off fix (see `docs/vision.md` Constraints).
- **We accept** that this repo has no application code, no test suite in
  the conventional sense, and no deployment pipeline beyond GitHub Pages —
  the SGE artefacts seeded alongside this ADR are deliberately lightweight
  (2 anchor specs, not 5; 3 capabilities, not 6 domains) to match.
- **We explicitly do not** build incident management, paging, SLA
  tracking, or general observability (logs/traces/deep metrics) into this
  repo — see `docs/vision.md` Non-goals. A future need for those is a
  decision for a *different* system, not scope creep into this one.
- **We accept** that uptime/incident data is public by design (ODbL
  license on `history/`) — nothing added to monitor config should require
  a secret to prove "up" in a way that would leak a credential into a
  public repo.
