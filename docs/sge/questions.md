# Stakeholder Questions (QD Registry)

One entry per open or closed question raised during SGE governance work on this repo.
IDs are sequential and never reused — a closed number stays closed. Format is
mechanically parsed by `check-qd-registry.sh`; keep the `### QD-NN` heading + field-list
shape exactly as shown.

### QD-01

- **Question:** SM-3 says the monitor list is "reviewed at each new product's DNS
  cutover" — is that review currently a manual step someone remembers to do, or should
  it be enforced (e.g. a checklist item in `wtp-org/infra/cloudflare`'s own PR template,
  or an automated diff between DNS records and `.upptimerc.yml` `sites:`)?
- **Stakeholder:** Rob Duncan
- **Raised:** 2026-08-27
- **Status:** Open

### QD-02

- **Question:** `assets/wtp-status.css` and the Raleway fonts are copied from
  `wtp-org/brand-assets/tokens.json` with no automated sync back to that source — if the
  brand kit changes (new palette, new font), is manual re-copy acceptable indefinitely,
  or should this repo pull from the source kit on a schedule (mirroring how
  `/wtp:apply-brand` applies the kit elsewhere)?
- **Stakeholder:** Rob Duncan
- **Raised:** 2026-08-27
- **Status:** Open

### QD-03

- **Question:** `.githooks/commit-msg` is a warn-only local hook, but the CI workflow
  `require-commit-trailer.yml` copied alongside it already exits non-zero on a missing
  trailer — it is code-level blocking already, not advisory. It only becomes an actual
  merge gate once it's added to this repo's branch protection as a required status
  check, which has NOT been done as part of this seeding. Should it be added now, or
  left un-required for a probation period first? Proposed criterion if deferred: 2 weeks
  of green non-required runs with no missing-trailer PR merged, then add to required
  checks.
- **Stakeholder:** Rob Duncan
- **Raised:** 2026-08-27
- **Status:** Open

### QD-04

- **Question:** Existing issues #28 ("Flip status monitor URL to sge.wealthtechpros.com
  once it serves") and #29 ("Decide whether to migrate .sgd/config.yml path after the
  SGD -> SGE rename") predate this SGE seeding — should they be re-filed as spec-linked
  follow-ups against SPEC-001 (monitor config) now that governance artefacts exist, or
  left as-is since they're already tracked in GitHub Issues?
- **Stakeholder:** Rob Duncan
- **Raised:** 2026-08-27
- **Status:** Open
