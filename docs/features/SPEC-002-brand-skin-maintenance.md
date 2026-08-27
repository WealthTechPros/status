---
ref: SPEC-002
title: Brand Skin Maintenance
capability: CAP-03
capability_model_version: 1.0.0
status: implemented
success_measure_moved: SM-4
questions: [QD-02]
---

## Business intent

Moves **SM-4** (brand-skin fidelity): the public page renders with WTP navy/Raleway
branding, not the stock Upptime template, and that skin survives every weekly Upptime
template auto-sync without manual re-application. Upptime's `update-template.yml`
overwrites `.github/**/*` files matching its own template set — a brand-skin mechanism
that lives inside that overwritten set would silently revert every week.

## User story

As anyone landing on `status.wealthtechpros.com`, I want the page to look like a
WTP-operated surface (navy background, Raleway type, WTP logo/favicon) so that it reads
as an authoritative, owned status page rather than a generic open-source template — and
as the maintainer, I want that to keep being true after Upptime's automatic template
updates, without a recurring manual fix-up task.

## Data model

- **Source of truth for brand tokens:** `wtp-org/brand-assets/tokens.json` (navy/Raleway
  kit) — this repo copies from it, it does not redefine brand values independently.
- **Applied assets** (`assets/`): `wtp-status.css`, `raleway-400.woff2`,
  `raleway-700.woff2`, `logo.png`, `favicon.svg`, `CNAME`. Served from the site root by
  the static-site build.
- **Wiring** (`.upptimerc.yml` → `status-website:`): `theme: dark` (fallback base),
  `customHeadHtml` (font preloads + stylesheet link, **fully-qualified URLs only** — see
  Edge cases), `cname`, `logoUrl`, `favicon`, `navbar`.

## Contract

- `assets/**` changes trigger `site.yml`'s `Static Site CI` (push-path trigger already
  wired in the stock template — no repo-specific change needed there).
- Any workflow that must *not* be overwritten by `update-template.yml` (e.g.
  `wtp-graphs.yml`, the Node-20 pin for the canvas dependency) must use a filename outside
  the stock Upptime template's own filename set (see ADR-0001) — this is the mechanism
  that makes the brand-skin's supporting infra sync-safe.

## Acceptance criteria

```gherkin
Feature: Brand skin maintenance

  Scenario: Public page renders with WTP branding
    Given the static site has been built and deployed
    When a visitor loads status.wealthtechpros.com
    Then the page uses the navy theme, Raleway type, WTP logo and favicon
      And no stock Upptime template branding is visible

  Scenario: Upptime's weekly template sync runs
    Given update-template.yml runs its scheduled weekly sync
    When it overwrites .github/**/* files matching the stock template set
    Then wtp-graphs.yml and any other repo-specific workflow survive unchanged
      And the brand-skin assets and .upptimerc.yml status-website: block are untouched
      because neither lives inside the synced .github/**/* set

  Scenario: An asset URL is added to customHeadHtml
    Given a new font or stylesheet needs to be preloaded or linked
    When the URL is written into customHeadHtml
    Then it is fully qualified (https://status.wealthtechpros.com/...), never root-relative
      because a root-relative href is followed by the Sapper export crawler as a route,
      writes a 404 page at that path, and breaks the later asset copy with EISDIR
```

## Edge cases

- **Root-relative asset URLs break the build.** Documented failure mode from PR #10
  review — the Sapper export crawler treats any root-relative href in
  `customHeadHtml` as a route to crawl, writes a 404 page there, and the asset copy step
  then fails with `EISDIR`. Always use the fully-qualified `https://status.wealthtechpros.com/...`
  form.
- **Brand token drift.** If `wtp-org/brand-assets/tokens.json` changes (new palette,
  font), the copied assets here go stale silently — there's no automated sync back to
  the source kit today (see QD-02).
- **Upptime major-version template changes.** A future Upptime template restructuring
  could change which files count as "the template set" that `update-template.yml`
  overwrites — re-verify the sync-safe filename convention (ADR-0001) after any Upptime
  version bump that changes `.templaterc.json` behaviour.

## Dependencies

- `wtp-org/brand-assets/tokens.json` — canonical brand source; this repo consumes it, does
  not own it.
- Upptime upstream (`upptime/upptime`) template release cadence — out of this repo's
  control, only reacted to.

## Open questions

- `QD-02` — see `docs/sge/questions.md`.

## Scenarios

### S1 — Repo-specific workflow survives template sync

Given `wtp-graphs.yml` exists with a filename outside the stock Upptime template set
When `update-template.yml` runs its sync
Then `wtp-graphs.yml` is present and unchanged after the sync completes

```typescript
// tests/brand-skin.spec.test.ts — companion to spec S1 above
test.skip('S1 — wtp-graphs.yml survives template sync', () => {
  // not yet built: requires either a recorded fixture of a template-sync run's diff,
  // or a dry-run mode against .templaterc.json's file list — neither exists today.
  // TODO: fill in the real assertion once a sync-diff fixture is captured.
});
```

### S2 — customHeadHtml URLs are fully qualified

Given the current `.upptimerc.yml` `status-website.customHeadHtml` value
When each href/src attribute in it is parsed
Then every one starts with `https://status.wealthtechpros.com/` (no root-relative paths)

```typescript
test('S2 — customHeadHtml has no root-relative asset URLs', () => {
  // TODO: arrange — read .upptimerc.yml, extract customHeadHtml string
  // act — regex-match href="..."/src="..." attribute values
  // assert the concrete outcome named in the Gherkin "Then":
  // expect(urls.every(u => u.startsWith('https://status.wealthtechpros.com/'))).toBe(true);
});
```

## Validation

<!-- TODO: no numeric/structural business-rule invariant identified from intake — brand-skin
     fidelity is a visual/structural property, not a reconciled quantity. If a future
     regression test asserts a fixed set of expected asset URLs against customHeadHtml
     (as sketched in S2 above), promote that into a real id/name/rule/assert row here. -->
