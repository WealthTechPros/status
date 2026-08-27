#!/usr/bin/env bash
# commit-trailer-bypass.sh — decide whether the require-commit-trailer gate
# should bypass a PR because it is a genuine dependabot PR (issue #1536).
#
# The gate previously keyed its bypass on github.actor, the *triggering-event*
# actor. A maintainer running `gh pr update-branch` on a dependabot PR becomes
# the synchronize event's actor, voiding the bypass and failing the gate on
# dependabot's own trailer-less commits. This decision keys on DURABLE PR
# provenance instead:
#
#   bypass  <=>  PR author login is exactly "dependabot[bot]"
#                AND every non-skip commit in the PR range is authored by
#                    dependabot.
#
# Inputs:
#   PR_AUTHOR_LOGIN  env — github.event.pull_request.user.login, taken from the
#                    event payload / API. NEVER a branch name or commit subject
#                    (those are attacker-controlled free text).
#   stdin            newline-separated VERIFIED GitHub author login of each
#                    non-skip commit in the PR (the caller reads `.author.login`
#                    from GET /pulls/{n}/commits, NOT git %an/%ae which are
#                    attacker-settable). A commit GitHub cannot link to an account
#                    MUST arrive as a concrete non-dependabot token (the caller
#                    emits the sentinel "(none)"), never as an empty line — blank
#                    lines are dropped here as the stdin trailing-newline artifact.
#
# Exit status:
#   0  bypass — a genuine dependabot PR; the trailer check is skipped.
#   1  do NOT bypass — the caller must run the trailer check on every commit.
#
# Fails CLOSED: any ambiguity (empty PR author, empty commit range, a single
# non-dependabot commit author, a PR author that only resembles dependabot)
# returns 1 so a human can never impersonate dependabot to skip the gate.
set -uo pipefail

DEPENDABOT="dependabot[bot]"

PR_AUTHOR="${PR_AUTHOR_LOGIN:-}"

# 1. PR author must be EXACTLY dependabot[bot] — exact match, no substring.
if [ "$PR_AUTHOR" != "$DEPENDABOT" ]; then
  exit 1
fi

# 2. Every commit author on the PR must be dependabot, and there must be at
#    least one commit (empty range proves nothing -> fail closed).
seen=0
while IFS= read -r author || [ -n "$author" ]; do
  # Ignore blank lines from a trailing newline, but a range that yields ONLY
  # blank lines still leaves seen=0 and falls through to the fail-closed exit.
  [ -n "$author" ] || continue
  seen=1
  if [ "$author" != "$DEPENDABOT" ]; then
    exit 1
  fi
done

if [ "$seen" -eq 0 ]; then
  exit 1
fi

exit 0
