# ADR-0019 — Independent Pull Request Semantic Review

## Status

Accepted (design specification only — the reviewer service and required
status check described below are not yet implemented)

## Context

Foundation 0 §19–§22 requires AI review of every PR: mandatory but
non-authoritative, supplementing deterministic CI and human review, never
replacing them. §21 describes two layers — Layer 1 (GitHub-native AI
review) and Layer 2 (a trusted project-policy reviewer whose authoritative
policy comes from protected repo state, not the contributor's branch),
reporting a required check such as `project-policy-review`. This ADR is
the concrete specification of that Layer 2 reviewer.

This is a **project-governance concern**, distinct from ADR-0011's local
harness reviewer, which exists solely to help the maintainer's own coding
agent work efficiently without constant check-ins. This reviewer instead
protects the project itself: it must treat a PR from the maintainer, from
Claude Code, from a first-time outside contributor, or from a
Dependabot-style automated change, identically. Its question is never "did
this author mean well" — it is:

> Does this proposed contribution satisfy Ricette's published engineering
> contract?

**A specific failure mode this ADR must avoid:** Foundation 0 §18's trust
model treats issue bodies and PR content as untrusted input. If this
reviewer treated the PR/issue description as the authoritative statement
of "the requirement," a contributor could write a requirement that
trivially matches their own diff and receive `PASS` for having
"satisfied" a rubric they authored themselves. The design below separates
**authority** (what the reviewer treats as the actual requirement) from
**evidence** (what the PR merely claims or demonstrates) to close this
gap.

## Decision

Every pull request receives review from an independent, project-controlled
reviewer, regardless of who or what authored it.

### Authority vs. evidence

- **Authority** — what the reviewer treats as actually binding: accepted
  ADRs and policy on protected `main` (`docs/adr/**`,
  `docs/architecture/**`, `docs/security/**`, `docs/development/**`,
  `AGENTS.md`, `GOVERNANCE.md`, `CONTRIBUTING.md`), plus an **explicitly
  maintainer-accepted** product/task specification where one exists (e.g.
  an issue a maintainer has labeled or referenced as accepted scope, a
  roadmap item, or a spec an accepted ADR points to).
- **Untrusted evidence** — informative only, never authoritative on its
  own: the PR body, issue text (unless explicitly accepted per above),
  PR comments, the diff itself, the tests included, and any external
  documents referenced. These describe what the contribution *claims* to
  do and *how* it does it; they do not get to define what the
  contribution was *supposed* to do.
- **When a PR implements behavior with no trusted requirement backing
  it**, the reviewer must not treat the PR's own description as
  sufficient justification. The correct response in that case is
  something like:

  > Engineering implementation is internally coherent, but product scope
  > is not authorized.

  The reviewer can still assess whether the code is well-built, but it
  must not "congratulate a contributor for correctly implementing a
  requirement the contributor invented." Whether unauthorized-but-sound
  scope should be accepted is a product/governance question — see
  ADR-0011's Human-decision tier and `GOVERNANCE.md`'s decision-authority
  tiers — not something this reviewer resolves by itself.

### What it checks (evidence, evaluated against authority above)

- accepted ADRs (`docs/adr/**`) and architecture (`docs/architecture/**`);
- security (`docs/security/threat-model.md`, ADR-0016);
- tests — whether they prove the (authorized) requirement rather than
  merely execute code, per the AI-on-AI review checklist in `AGENTS.md`
  and Foundation 0 §20/§22 (invented APIs, implementation-derived tests,
  silent fallbacks, swallowed exceptions, excessive defensive abstraction,
  unjustified dependencies, invalidating mocks, unsupported comments,
  superficial coverage);
- coverage (`docs/development/testing.md`);
- documentation (`docs/development/documentation.md`);
- translations (`docs/development/translation.md`);
- accessibility (`docs/development/accessibility.md`);
- dependency policy (`docs/development/dependencies.md`);
- provenance (`PROVENANCE.md`) — flags anything resembling source
  translation, file-by-file porting, or copied schemas/migrations/
  fixtures/tests/docs from another implementation;
- the contribution contract itself (`CONTRIBUTING.md`): implementation +
  tests + documentation present, or a maintainer-controlled exception
  label applied.

### Independence properties

- **Fresh context, every time.** The reviewer receives the PR diff and
  the artifacts above — nothing else. ADR-0011's local reviewer
  conversation (if the PR originated from Claude Code under that gate) is
  deliberately **not** fed into this reviewer. Feeding it in would anchor
  this reviewer on whatever reasoning already convinced the first one,
  defeating the purpose of a second, independent check.
- **Policy from trusted `main`, never from the PR branch.** This reviewer
  loads `AGENTS.md`, `GOVERNANCE.md`, `docs/adr/**`, `docs/security/**`,
  `docs/development/**`, and `CONTRIBUTING.md` from protected `main`. A
  PR that edits any of these files is reviewed *against the version on
  `main`*, not against its own proposed edits — a contributor (human or
  agent) cannot weaken the reviewer by modifying the review rules inside
  the very PR being reviewed.
- **Read-only.** The reviewer must not execute code from the PR under
  review. It reads the diff and the governance artifacts; it never runs
  untrusted code to form its judgment.
- **Deliberately adversarial.** Unlike ADR-0011's collaborative local
  reviewer, this reviewer assumes the contribution may be wrong and looks
  for reasons it should not merge — e.g. "requirement says X, diff
  provides Y, test only demonstrates Y: block." This posture applies
  uniformly regardless of authorship, including to the maintainer's own
  PRs and to Claude Code's PRs.
- **Author-blind in effect, not just intent.** The reviewer's prompt does
  not condition on who opened the PR. The same bar applies to a
  first-time outside contributor and to a maintainer PR.

### Response and required check

Reports a required status check (`project-policy-review` per Foundation 0
§21), with `PASS` or `REQUEST_CHANGES` plus internal categories
(Architecture / Security / Test / Documentation Review, per §21). `PASS`
means "this PR satisfies the automated semantic review gate against
authorized requirements and published policy" — it does **not** itself
merge the PR; human/CODEOWNER approval requirements below still apply
wherever project governance requires them.

### Risk-tiered requirements

- **Standard PR** — `CI PASS` + `project-policy-review PASS` + one human
  approval per repository rules.
- **Sensitive PR** — touches auth, authorization, security, dependencies,
  migrations, entitlements, `.github/**`, `.claude/**`, `AGENTS.md`,
  `docs/adr/**`, or release machinery: `CI PASS` + `project-policy-review
  PASS` + CODEOWNER review (see `GOVERNANCE.md`, "Decision authority").
- **Governance-changing PR** — the reviewer may still report `PASS`/
  `REQUEST_CHANGES` on mechanical criteria, but it **cannot bless its own
  new rules into existence**: explicit maintainer approval is required
  regardless of what the reviewer reports, because this is a
  project-governance property, not something an automated check can
  authorize on the project's behalf.

### Model configuration

Separate configuration namespace from ADR-0011's local reviewer — a
distinct service, not the same one reused:

```text
PR_REVIEWER_MODEL_STANDARD=gpt-5.6-terra   # standard PRs
PR_REVIEWER_MODEL_SENSITIVE=gpt-5.6-sol    # sensitive/governance-adjacent PRs
```

As with ADR-0011, model identity is an operational detail, not an
architectural commitment — the architecture is "independent PR-time
semantic review exists, evaluates against authorized requirements rather
than contributor-supplied ones, and cannot be weakened by the PR under
review," not "this specific model forever."

### Credential and service isolation

Same constraint as ADR-0011: the reviewer service's API credential is
supplied from outside the Ricette repository, never committed, never
placed in project `.env`/`.env.example`, and never readable from
application- or agent-controlled configuration. As with ADR-0011, this
reviewer must run as a narrow service exposing only fixed review
operations (never a generic model-completion proxy), so that a PR's
author — human or agent — has no path to use the reviewer's own
credential for anything beyond receiving a review verdict.

## Alternatives Considered

- **Reuse ADR-0011's local reviewer for PR review too.** Rejected —
  different authority (this reviewer never lets anything merge itself;
  ADR-0011's reviewer can let an agent continue unsupervised), different
  audience (any contributor vs. the maintainer's own agent), different
  policy source (protected project governance vs. personal preference),
  and different posture (adversarial vs. collaborative). A shared service
  would either weaken the PR reviewer's independence or make the local
  reviewer needlessly adversarial toward the maintainer's own agent.
- **GitHub-native AI review only (Layer 1, no project-controlled Layer
  2).** Insufficient per Foundation 0 §21 — broad advisory review only,
  with no way to enforce that authoritative policy comes from protected
  repo state rather than the contributor's branch.
- **Feed the PR reviewer the full local-review conversation history when
  available.** Rejected: anchors the "independent" review on reasoning
  that already convinced a different, more collaborative reviewer,
  undermining the value of a second check.
- **Treat the PR/issue description as the authoritative requirement.**
  Rejected — this was an actual design flaw in an earlier draft of this
  ADR: since PR/issue text is untrusted input per §18, a contributor
  could author a requirement that trivially matches their own diff and
  be rubber-stamped for satisfying it. Requirements now must come from
  protected `main` policy or explicit maintainer acceptance; PR/issue
  text is evidence about the contribution, never authority over what the
  contribution was supposed to be.

## Rationale

The local reviewer (ADR-0011) exists to minimize how often the maintainer
needs to be involved in routine agent work. This reviewer exists to
minimize how much trust the project must place in whoever — or
whatever — wrote the code, including the maintainer and their own tools.
Those are different jobs and need different authority, so they get
different ADRs and different services. Separating authority from evidence
is what makes that trust-minimization real rather than nominal: a
reviewer that lets contributors define their own success criteria isn't
actually independent of the contribution it's reviewing.

## Consequences

- Requires standing infrastructure (reviewer service, required status
  check wiring) before it can be turned on; implementation is deferred
  until the repository has a GitHub remote and at least one real PR to
  exercise it against.
- Adds a mandatory review step to every PR, including the maintainer's
  own and Claude Code's — no author is exempt.
- A PR proposing behavior with no trusted requirement backing it gets an
  honest "implementation coherent, scope not authorized" response rather
  than an automatic pass — this may surprise contributors used to
  reviewers that only check code quality, and should be documented in
  contributor-facing guidance when the reviewer is built.
- A task can legitimately be `APPROVE`d by ADR-0011's local reviewer and
  still receive `REQUEST_CHANGES` here; this is expected behavior, not a
  conflict to resolve by making the two reviewers agree.
- Outage or misconfiguration of this reviewer must not silently waive the
  required check (fail closed, matching ADR-0011's infrastructure-failure
  handling) — exact failure-mode handling to be specified when the
  service is built.
- Does not replace human/CODEOWNER review — it supplements deterministic
  CI and human review per Foundation 0 §19.

## Conditions for Reconsideration

- If the reviewer's false-positive/false-negative rate materially
  undermines contributor trust or throughput.
- If evidence emerges that the reviewer's judgment varies by perceived
  authorship despite the author-blind design — that would be a defect in
  this ADR's implementation, not grounds to abandon author-blindness.
- If the underlying models filling either role are deprecated with no
  compatible replacement.
- If "explicitly maintainer-accepted specification" proves too narrow or
  too slow in practice for legitimate contributions with no pre-existing
  issue — revisit how scope gets accepted, not whether scope needs
  accepting.

## Supersession

None. This is the initial ADR for this decision area, split out from what
was originally drafted as part of ADR-0011, and since revised to separate
trusted authority from untrusted PR-supplied evidence.
