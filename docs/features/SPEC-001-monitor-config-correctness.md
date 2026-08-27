---
ref: SPEC-001
title: Monitor Configuration Correctness
capability: CAP-01
capability_model_version: 1.0.0
status: implemented
success_measure_moved: SM-3
questions: [QD-01]
---

## Business intent

Moves **SM-3** (monitor-list accuracy): every monitored URL corresponds to a currently
live production endpoint, and every live production endpoint the org depends on has a
monitor, reviewed at each new product's DNS cutover. A stale or wrong monitor list is
worse than no monitor at all — it either misses a real outage silently, or cries wolf on
a host that was never live, burning down trust in the page (see `wtp-org#53`, the
Platform Automation Proxy false alarm).

## User story

As a WTP staff member or client checking `status.wealthtechpros.com`, I want the listed
services to reflect what's actually running in production, with any non-standard check
behaviour (auth gates, deferred hosts) explained in place, so that a red status always
means something real happened.

## Data model

Monitor config lives entirely in `.upptimerc.yml`, under `sites:`. Each entry:

```yaml
- name: <display name, matches the product repo's canonical name>
  url: <fully-qualified https:// or tcp:// URL>
  expectedStatusCodes:      # optional — only when 200 alone is wrong
    - 200
    - 302                   # e.g. auth redirect
```

Deferred/excluded monitors are kept as **commented-out stanzas with a dated reason**
directly in `.upptimerc.yml`, not deleted — so the decision not to monitor something
survives as visible history, not tribal memory.

## Contract

- Upptime's own `uptime.yml` (template-generated, not hand-edited) reads `sites:` and
  checks each URL on a 5-minute cron, writing results to `history/<slug>.yml` and
  `api/<slug>/*.json`.
- Adding, removing, or changing a monitor is a one-line PR to `.upptimerc.yml` — no other
  file needs manual editing (README/site tables regenerate on the next `summary.yml` /
  `site.yml` run).

## Acceptance criteria

```gherkin
Feature: Monitor configuration correctness

  Scenario: A new product goes live in production
    Given a new WTP product subdomain has been cut over in infra/cloudflare
      And the endpoint has been curl-verified to respond
    When a monitor entry is added to .upptimerc.yml for that URL
    Then the monitor appears in the next generated status-page build
      And it begins reporting real up/down data within one check cycle

  Scenario: An endpoint returns a non-200 status while genuinely up
    Given a monitored endpoint is gated by auth (e.g. Cloudflare Access) or redirects
    When the endpoint is polled without expectedStatusCodes configured
    Then Upptime would misreport it as down
    But when expectedStatusCodes is set to include the endpoint's real healthy response codes
    Then the monitor correctly reports "up" for that endpoint

  Scenario: A host is deliberately not monitored
    Given a real, resolvable host that the org has decided not to monitor yet (cost, parked demo, not-yet-deployed)
    When the monitor list is reviewed
    Then a commented-out stanza with a dated reason exists in .upptimerc.yml for that host
      And no incident is silently expected or missing for it

  Scenario: A monitor is removed for a host that never actually launched
    Given a monitor exists for a host that turns out to never have been deployed
    When the monitor is removed from .upptimerc.yml
    Then any incident issue it auto-opened is manually closed with the false-alarm reason recorded
      And the removal itself is noted as a commented-out stanza (see prior scenario), not silently dropped
```

## Edge cases

- **Same-origin duplicates.** Two monitored names resolving to the same underlying
  origin (e.g. `www` vs. root) add no signal — skip, and note why in the comment (see
  `www / benchmark.wealthtechpros.com / staging.sgd.` in current config).
- **DNS exists but service doesn't serve yet.** A CNAME can resolve while the app behind
  it 404s or resets the TLS handshake — verify by curl/openssl, not by DNS resolution
  alone, before flipping a monitor URL (see the `sgd.` → `sge.` deferral, wtp-org#28).
- **Page-level check misses a sub-route failure.** A root-domain monitor proves the app
  boots, not that every authenticated area works (Trust Fabric `/internal` 500,
  2026-08-02) — a dedicated monitor for a known-critical sub-route is warranted when a
  root check has already missed a real outage there.

## Dependencies

- `wtp-org/infra/cloudflare` — DNS cutover is the trigger event for "should this get a
  monitor."
- Each product repo's own health/status endpoint design (if one exists) — this repo only
  polls what the product exposes; it does not design the product's health contract.

## Open questions

- `QD-01` — see `docs/sge/questions.md`.

## Scenarios

### S1 — New product monitor added after DNS cutover

Given `.upptimerc.yml` gains a new `sites:` entry for a curl-verified live URL
When the next scheduled `uptime.yml` run executes
Then `history/<new-slug>.yml` and `api/<new-slug>/uptime.json` are created and populated with a real status, not left absent

```typescript
// tests/monitor-config.spec.test.ts — companion to spec S1 above
test('S1 — every configured site has a corresponding history file after a run', () => {
  // TODO: arrange — read sites: from .upptimerc.yml, slugify each name
  // act — list history/*.yml
  // assert the concrete outcome named in the Gherkin "Then":
  // expect(historySlugs).toEqual(expect.arrayContaining(configuredSlugs));
});
```

### S2 — expectedStatusCodes prevents a false-down report

Given a monitor entry declares `expectedStatusCodes: [200, 302, 403]`
When the checked endpoint responds with 403 (Cloudflare Access gate)
Then the monitor's recorded status is "up", not "down"

```typescript
test.skip('S2 — expectedStatusCodes 403 reports up, not down', () => {
  // not yet built: no local harness runs Upptime's checker function directly today;
  // this would need vendoring/invoking @upptime/uptime-monitor's status-code logic
  // against a mock response rather than hitting the real endpoint.
});
```

## Validation

<!-- TODO: no reconciliation/boundary invariant identified from intake — monitor-list
     accuracy is a set-membership property (live endpoints ⊆ monitored, monitored ⊆ real),
     not a numeric invariant. A concrete check could compare .upptimerc.yml `sites:` URLs
     against infra/cloudflare's DNS record list on a schedule; not built yet — fill in
     id/name/rule/assert rows if that reconciliation job is ever added, or leave this
     stub in place until then. -->
