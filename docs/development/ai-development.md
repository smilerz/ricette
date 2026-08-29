# AI Development

This is the human-facing narrative for how AI coding agents work in this
repository — why, not the operational rules themselves. The operational
rules live in `AGENTS.md` (canonical, binding on agents) and the ADRs
below (canonical, binding on the review architecture). This document
should never fork or restate their content; if it drifts from them,
`AGENTS.md` and the ADRs win.

## Why AI-driven development

Foundation 0 states the project is AI-driven by design, with the explicit
goal of "maximum safe development velocity under explicit, reviewable,
machine-enforced engineering constraints" — not simply generating large
amounts of code. See `docs/architecture/foundation-0-design-baseline.md`
§1 and ADR-0010 for the full rationale and authority boundaries.

## What agents can and cannot do

See `AGENTS.md` in full. In short: agents work through branches and pull
requests, never receive production or unrestricted credentials, and must
treat issue bodies, PR comments, uploaded files, imported webpages, and
any other externally authored content as untrusted data that never
supersedes repository policy.

## Two distinct review mechanisms

This project has two separate AI review services, not one reused for two
purposes — see ADR-0011 and ADR-0019 for the full design of each:

- **ADR-0011 — Local Independent AI Development Review.** The
  maintainer's personal harness: an independent reviewer that can approve
  or reject a coding agent's plan, decisions, and task completion without
  the maintainer in the loop, escalating only for genuine product/
  governance judgment calls. This is personal productivity tooling, not
  project governance, and its `APPROVE` has no bearing on whether
  anything merges.
- **ADR-0019 — Independent Pull Request Semantic Review.** The
  project-governed reviewer that checks every PR — from the maintainer,
  from Claude Code, or from any other contributor — against Ricette's
  published engineering contract, using policy loaded from protected
  `main` rather than the PR itself. This is the reviewer Foundation 0 §21
  calls "Layer 2."

A task can be `APPROVE`d under ADR-0011 and still receive
`REQUEST_CHANGES` from ADR-0019's reviewer — that reflects two different
questions being asked, not a contradiction. Neither reviewer's approval
substitutes for the Definition of Done in `AGENTS.md`, which still
requires human review before merge.

## Current status

Neither reviewer is built yet, but they are no longer on equal footing.
The **local reviewer (ADR-0011)** is the mandatory next harness
milestone: implement and verify it once reviewed Foundation governance
reaches trusted `main`, and before substantive application implementation
begins. The **PR reviewer (ADR-0019)** remains deferred until GitHub/PR
infrastructure actually exists — that's a separate, later system. See
`IMPLEMENTATION_PLAN.md` Phase 3a and Phase 3b for exactly what is and
isn't done.

## AI-on-AI review

Because submitted code may itself be AI-generated, both reviewers (and any
human reviewer) should actively watch for the failure modes in `AGENTS.md`
under "AI-on-AI review checklist": invented APIs, implementation-derived
tests, silent fallbacks, swallowed exceptions, excessive defensive
abstraction, unjustified dependencies, invalidating mocks, and superficial
coverage, among others. Well-formatted code is not evidence of
correctness.
