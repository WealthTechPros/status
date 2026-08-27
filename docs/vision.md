# Vision — WTP Status

**Vision:** For WealthTech Pros staff, clients, and counterparties who need to know whether
a WTP-hosted service is working right now, **status** is the public uptime monitor and
incident record that turns "is it down for everyone or just me?" into a 10-second answer,
without asking anyone to page an engineer or dig through GitHub Actions logs.

## Why we exist

Every WTP product (`client-onboarding`, `sge`, `trust-fabric`, `wtp-mcp`,
`wtp-assistant`, `adviser-mcp`, the marketing site, project management, the client
document portal) runs as an independent deployment with its own on-call reality of zero
— a solo/two-person team. When something goes down, the fastest and cheapest way to
answer "is this a real outage" for both the team and anyone watching from outside is a
public, git-native status page that needs no separate infrastructure, database, or
on-call rotation to operate. This repo is that page: Upptime-based, config-as-code,
GitHub Actions as the monitor, GitHub Issues as the incident log, GitHub Pages as the
host.

## What good looks like

- A real outage on a monitored WTP endpoint is visibly reflected on
  `status.wealthtechpros.com` within one check interval, with an auto-opened incident
  issue and an auto-closed one when it recovers.
- The monitor list matches what's actually live in production — no monitors for
  never-deployed hosts (false-alarm risk), no live production endpoint left unmonitored.
- The page carries the WTP brand skin (navy/Raleway, from `wtp-org/brand-assets`) so it
  reads as a WTP-operated surface, not a stock Upptime template.
- Anyone triaging a red status can tell, from the incident issue alone, whether it's a
  real outage, a false alarm from an auth/gateway quirk, or a known planned gap — without
  needing repo-specific tribal knowledge.

## MVP framing

The "MVP" here isn't a build milestone — the page has been live and operating since
initial setup. The next committed milestone is **governance catch-up**: this repo has
been operated correctly (see the monitor-config comments accumulated over months of real
incidents) but never had its operating knowledge written down as SGE artefacts. This
seeding closes that gap, in place, without changing behaviour.

## Non-goals

- **Not an incident-management or paging system.** No on-call rotation, no escalation
  policy, no SLA tracking. It reports state; it does not orchestrate response.
- **Not a general observability platform.** No logs, no traces, no metrics beyond
  Upptime's uptime/response-time pair. Deep application health (e.g. Trust Fabric's
  `/api/health/deep`) is exposed *by the product repo*; this repo only polls it.
- **Not authoritative on product architecture.** It does not decide what "up" means for
  a product (that's the product repo's job, expressed as the URL/expected-status-codes
  chosen here) — it only executes the check.
- **Not a client-facing SLA guarantee.** Uptime percentages shown are informational, not
  a contractual commitment.
- **No secrets, no PII.** History/API data is public by design (ODbL-licensed); nothing
  monitored here should require an auth header to prove "up" in a way that would leak a
  credential into a public repo.

## Success measures

| ID | Measure | Baseline (2026-08-27) | Target |
|----|---------|------------------------|--------|
| SM-1 | Real outages on a monitored endpoint produce an auto-opened incident issue within one check cycle (currently 5 min per `uptime.yml`) | Working as designed since setup; no measured miss on file | Zero missed real outages (verified against product-repo incident history each quarter) |
| SM-2 | False-alarm rate: incidents auto-opened for a monitor that was never actually down (auth-gate/gateway quirks, never-deployed hosts) | 1 known historical false alarm (Platform Automation Proxy, wtp-org#53, since removed) | Zero new false alarms per quarter; every gateway/auth quirk gets an `expectedStatusCodes` fix or a documented decision, not a silent re-open |
| SM-3 | Monitor-list accuracy: every monitored URL corresponds to a currently-live production endpoint, and every live production endpoint the org depends on has a monitor | 14 active monitors, 2 explicitly-deferred (documented in `.upptimerc.yml` comments) | Reviewed at each new product's Cloudflare DNS cutover (`wtp-org/infra/cloudflare`) — new live subdomain gets a monitor within the same sprint |
| SM-4 | Brand-skin fidelity: the public page renders with WTP navy/Raleway branding, not the stock Upptime template | Brand skin live (`assets/wtp-status.css` + Raleway woff2 + logo/favicon) | Brand skin survives every Upptime template auto-sync (`update-template.yml`) without manual re-application |

## Constraints

- **Template auto-sync.** Upptime's `update-template.yml` overwrites `.github/**/*` files
  that match its own template set weekly. Any repo-specific workflow (e.g.
  `wtp-graphs.yml`) must live *outside* that overwritten set or be re-applied after each
  sync — this is already handled (see ADR-0001) but is a standing constraint on any
  future workflow change.
- **No app server, no database.** Everything is static generation + GitHub Actions +
  GitHub Pages. Any capability that needs persistent state beyond git history is out of
  scope for this repo.
- **Public repo, public data.** `history/` and `api/` are openly licensed (ODbL) and
  world-readable — never add anything here (auth tokens, internal-only endpoints,
  client-identifying URLs) that shouldn't be public.
