# ADR-0011 — Local Independent AI Development Review

## Status

Accepted. Implementation is the **mandatory next harness milestone**: build and verify this reviewer once reviewed Foundation governance reaches trusted `main`, and before substantive application implementation begins (see `IMPLEMENTATION_PLAN.md` Phase 3a). Not yet implemented as of this writing.

## Context

This ADR is scoped to **the maintainer's personal development harness**, not
Ricette project governance. It exists to keep a coding agent (Claude Code,
or any future coding agent) productive without constantly returning to the
human maintainer for routine judgment calls. It is a distinct concern from
ADR-0019 (Independent Pull Request Semantic Review), which protects the
project from *any* contributor's PR regardless of who or what authored it.
The two must not be the same service wearing two hats — see "Relationship
to ADR-0019" below for why.

Reviewing an agent's work only at PR time means the agent can invest
significant effort in a flawed plan, an unjustified architectural decision,
or an incomplete implementation before any independent check occurs. A
second, independently-instructed model checking the agent's work at
earlier checkpoints — before a plan is acted on, before a consequential
decision is made, and before the agent declares work complete — catches
problems earlier and cheaper, and reduces how often the maintainer is the
only check on the primary coding agent's judgment.

**Local task completion under this ADR is not the same thing as the
Definition of Done in `AGENTS.md`.** This reviewer's `APPROVE` means "the
agent's immediate task is locally sound and it may continue or stop
working." It says nothing about merge-readiness, which still requires the
full Definition of Done — including human review — per `AGENTS.md` and
Foundation 0 §63. See "Authority: this reviewer can act without the
maintainer" below.

## Decision

Adopt **independent second-model review of the maintainer's own coding
agent**, via two configurable model roles, invoked at three checkpoints
during agent-driven development:

1. **Plan gate** — before the agent proceeds from planning to execution
   (in Claude Code, a `PreToolUse` hook on `ExitPlanMode`), the reviewer
   evaluates the proposed plan against **trusted task authority** (see
   "Task authority" below) and accepted ADRs/`AGENTS.md`. Response is
   `APPROVE`, `REVISE` (hook denies the exit and returns feedback for the
   agent to act on), or `ESCALATE_TO_HUMAN`. **Mechanism:**
   `permissionDecision: "allow"` alone does not auto-approve `ExitPlanMode`
   (or `AskUserQuestion`); `hookSpecificOutput.updatedInput` must also be
   supplied, and since `updatedInput` replaces the entire input object,
   the hook must echo every unchanged field, not send a partial patch.
2. **Decision gate** — exposed as a callable tool (e.g. an MCP tool
   `review_decision(question, proposed_decision, alternatives, evidence)`).
   **Once this tool is built and installed**, `AGENTS.md` must be updated
   to require the agent invoke it before consequential implementation
   decisions (adding a dependency, introducing a new architectural
   abstraction, choosing a lasting database representation, diverging
   SQLite/PostgreSQL behavior, changing a security boundary, changing an
   entitlement/commercial boundary, adding an infrastructure requirement,
   deviating from an accepted ADR, or adding a new persistent public API).
   `AGENTS.md` does **not** currently contain this rule — the tool doesn't
   exist yet, so requiring its use now would point agents at nothing.
   Installing that `AGENTS.md` rule is an explicit acceptance test for
   Phase 3a's implementation (see `IMPLEMENTATION_PLAN.md`), not something
   this ADR gets to claim is already true. Structured response: `decision`
   (`APPROVE`/`REVISE`/`ESCALATE`), `rationale`, `blocking_concerns`,
   `adr_required`, `required_actions`.
3. **Completion gate** — before the agent treats its current task as
   finished. **Mechanism:** `TaskCompleted` fires when a task is marked
   complete via `TaskUpdate`, or when an agent-team teammate finishes with
   in-progress tasks; exit code 2 blocks completion and returns stderr
   feedback to the model. This exposes the coverage gap this ADR must
   design around: **a plain session that never creates or updates a Task
   object never fires `TaskCompleted` at all** — so it cannot be the sole
   completion gate. `Stop` fires whenever Claude finishes responding to
   any turn (turn-level, a different and more frequent granularity than
   task completion), and its decision control is `decision: "block"`
   (with a `reason` shown to Claude) plus `additionalContext` as a second,
   non-blocking continuation mechanism — both share the same loop
   protection, under which Claude Code overrides the hook and ends the
   turn after **8 consecutive blocks**. This ADR requires an invariant
   that holds regardless of exactly when `TaskCompleted` fires in
   practice: **every substantive local work unit must receive exactly one
   completion-review verdict, whether or not Claude ever creates a Task
   object for it — and the backstop must never let Claude Code's own
   8-consecutive-block override silently stand in for an actual review.**
   Concretely:
   - `TaskCompleted` is the primary gate whenever Task-tracking is in use:
     after deterministic checks (`./bin/verify`, once it exists) pass, the
     reviewer checks implementation against **trusted task authority**
     (see "Task authority" below), not the agent's own paraphrase of it:
     meaningful tests (not superficial or implementation-derived per §22);
     doc/translation/ADR completeness; architecture drift; security; AI
     failure-mode smells per §20/§22. On `REVISE`, exit code 2 blocks
     completion and returns feedback so the agent repairs and retries.
   - A successful review produces an **approval record** bound to the
     **authoritative task/spec identity** it was checked against (see
     "Task authority" below), the evidence/diff reviewed, and the policy
     revision (commit hash on `main`) — not just an in-memory "yes."
   - `Stop` is registered as a **stateful backstop, not a second fresh
     review**: it checks whether a valid, matching approval record already
     exists for the work just done. If one does, `Stop` proceeds normally
     (no `decision: "block"`). If **substantive mutating work** occurred
     with no matching approval record (e.g. a session that never created a
     Task object, or a meaningful project-state change — a migration run,
     an external API call with side effects, a config change — that
     doesn't produce a tracked diff), `Stop` returns `decision: "block"`
     with a `reason` and routes to the same completion review
     `TaskCompleted` would have triggered. An ordinary conversational
     pause or a request for user input must not be mistaken for a
     completed work unit needing review — only `Stop` invocations
     following substantive mutating work matter here, not merely file/code
     changes narrowly construed.
   - **Bounded retry, well under the 8-block ceiling**: the backstop's own
     block-and-review cycle must use a retry budget smaller than Claude
     Code's built-in 8-consecutive-block override (the same default
     Routine/Elevated limits from "Authority tiers" below — 3 and 2 — both
     comfortably under 8). If the reviewer cannot produce a verdict within
     that budget, this is treated as retry-limit exhaustion under
     "Human-decision" below and escalates to the maintainer — it must
     never simply keep blocking until Claude Code's override forces the
     turn to end anyway, since that would silently release the turn with
     no valid approval record and no human awareness that review never
     completed.
   - This design avoids two failure modes symmetrically: treating every
     `Stop` as a fresh independent review (expensive, and exactly the
     "wrong granularity" problem turn-level `Stop` has), and trusting
     `TaskCompleted` alone in a way an agent could silently bypass by
     simply never using Task-tracking tools.

### Task authority: what the reviewer treats as the actual task

The same authority-vs-evidence separation ADR-0019 requires for PR review
applies here to what the local reviewer treats as the task it is
reviewing against. **The reviewer must not evaluate the agent against the
agent's own paraphrase of the task.**

- **Task authority** — what the reviewer treats as the actual, binding
  task: the maintainer's actual direct instruction and any explicitly
  approved spec/design or later direct correction, captured through a
  harness-controlled source such as the trusted session/transcript — not
  a summary the agent generated of what it believes it was asked to do.
  Protected-`main` governance (`AGENTS.md`, `docs/adr/**`,
  `docs/architecture/**`, `docs/security/**`) remains **project**
  authority, unchanged from "Independence properties" above; task
  authority is the additional, narrower question of what this specific
  unit of work was actually asked to accomplish.
- **Supporting/untrusted inputs** — the agent's own summary or paraphrase
  of the task, issue/PR text (unless explicitly adopted by the
  maintainer), other external content, and the diff/tests/evidence the
  agent produced. These describe what the agent did and believes it was
  asked to do; they do not get to define what it was actually asked to
  do. This mirrors ADR-0019's Authority vs. Evidence split for the same
  reason: a reviewer that lets the thing being reviewed define its own
  success criteria isn't independent of it.
- Approval records (see the completion gate above) are bound to the
  **authoritative task/spec identity** in addition to evidence/diff
  identity and policy revision — so a later audit can confirm not just
  *what* was reviewed, but *against what the maintainer actually asked
  for*.

### Authority: this reviewer can act without the maintainer

Unlike ADR-0019's PR reviewer, this reviewer's `APPROVE` has real local
effect: it lets the coding agent continue working, or treat a task as
locally complete, **without the maintainer in the loop**. It can also
reject a completion claim outright —

> REVISE — missing negative authorization test; documentation does not
> describe new behavior.

— and the agent fixes and resubmits automatically. `APPROVE` here means
only "the agent may continue" or "this task is locally done." It is
**not** the Definition of Done in `AGENTS.md`, which still requires the
full checklist there (including human review) before anything merges —
that question belongs entirely to ADR-0019's PR reviewer, deterministic
CI, and project governance (see "Relationship to ADR-0019").

### Authority tiers: deterministic classification, not self-reported confidence

Authority for a given piece of work comes from **deterministic
classification of the work plus required evidence plus explicit
uncertainty handling** — never from a model's self-reported numerical
confidence, which is not calibrated well enough to serve as an
authorization boundary.

- **Routine** — proceeds autonomously when all deterministic checks pass,
  all required evidence is present, no Elevated/Human-decision trigger
  applies, and the reviewer returns `APPROVE`. A `REVISE` goes back to the
  agent to fix and resubmit. Default starting limit (adjustable via
  personal policy, not project governance): **3 revise cycles** before
  escalating to Human-decision.
- **Elevated** — covers migrations, dependency additions, substantial
  refactors, new reusable components, new APIs within an already-accepted
  architecture, and security-sensitive *implementation* within an
  already-accepted security model (as opposed to *changing* the security
  boundary itself, which is Human-decision — see below). Uses the
  stronger/critical model role. Still resolves autonomously on `APPROVE`
  whenever accepted project policy gives the reviewer enough basis.
  Default starting limit: **2 revise cycles** before escalating.
- **Human-decision** — escalate to the maintainer. Deliberately narrow:
  a new or superseded accepted ADR; product behavior not determined by
  existing requirements; a conflicting requirement; a commercial or
  packaging decision; a license/provenance question; *changing* a
  security boundary (as opposed to implementing within one); accepting an
  irreversible or destructive tradeoff; weakening a control; retry-limit
  exhaustion at either tier above. Not ordinary implementation decisions —
  a migration, a new dependency, a new component, a meaningful refactor,
  or an implementation-level security fix does **not** automatically
  escalate.

### Infrastructure failure is distinct from content disagreement

A `REVISE` from the reviewer is a content judgment and is handled by the
tiers above. An **infrastructure failure** — the reviewer API is
unreachable, returns invalid/unparseable structured output, the governing
policy context is missing, or the policy commit hash the reviewer loaded
is stale relative to `main` — is a different failure class and must
**fail closed**: retry a small fixed number of times, then pause and
escalate to the maintainer rather than silently treating the failure as
an implicit `APPROVE`. A gate that cannot get a real verdict must never
default to letting the agent proceed.

### Independence properties

- The reviewer service loads its governing context — `AGENTS.md`,
  `docs/adr/**`, `docs/architecture/**`, `docs/security/**` — from
  **protected `main`**, never from the branch under review. The agent can
  supply a plan, question, diff, test results, or evidence, but cannot
  supply or rewrite the reviewer's governing instructions.
- The hooks that make these gates mandatory are registered in the
  maintainer's **personal Claude Code configuration** (e.g. user-level
  settings), not the project's own `.claude/settings.json`. This is a
  personal-harness boundary, not a project-authority boundary: the repo
  being worked on should not be the thing that can disable the
  maintainer's own review harness, the same way it should not be able to
  disable the auto-mode hard-deny policy (see `IMPLEMENTATION_PLAN.md`,
  "Auto-mode enforcement split") — same principle, different scope.
- The reviewer **must not execute code from the branch under review** — it
  reads the diff, the plan, and the question/evidence supplied, plus its
  own governing context from protected `main`; it never runs untrusted
  code to form its judgment.
- The human maintainer is the **appellate authority**, not the primary
  reviewer at each of these three gates. Routine plan/decision/completion
  review happens between the coding agent and the independent reviewer
  without maintainer involvement; the maintainer is pulled in only on
  `ESCALATE`/`ESCALATE_TO_HUMAN` or retry-limit exhaustion. This keeps the
  maintainer's attention on real decisions rather than routine plumbing.

### Model roles

Two named roles, referenced by role name everywhere in hook/tool logic —
never a literal model string inline:

```text
REVIEW_MODEL_CRITICAL=gpt-5.6-sol     # plan gate, architecture/security decisions, escalation
REVIEW_MODEL_ROUTINE=gpt-5.6-terra    # routine completion checks, dependency/doc-completeness checks
```

Swapping which underlying model fills a role is an **operational
configuration change**, not an architecture change requiring a new ADR —
unless the reviewer's actual capability or behavior contract materially
changes (e.g. moving off structured-output support, or changing which
provider is used entirely).

### Credential and service isolation

The reviewer service's API credential is supplied from **outside** the
Ricette repository (host/deployment-level secret). It must never be
committed, never placed in project `.env`/`.env.example`, and never
readable from application- or agent-controlled configuration. This is a
necessary but not sufficient condition: putting the credential in a hook
or service's environment is not itself a trust boundary if that process
runs as the same accessible user Claude's own tool execution runs as, and
could in principle be introspected from that environment. The reviewer
must run as a **narrow service** that exposes only fixed review
operations (`review_plan`, `review_decision`, `review_completion` or
equivalent) — never a generic model-completion proxy — so that even a
compromised or overly-curious coding agent cannot use the reviewer as a
way to make arbitrary calls against the underlying model API using its
credential.

### Policy source: personal, not project governance

Unlike ADR-0019's PR reviewer, this reviewer's policy may include the
maintainer's private productivity preferences — how much autonomy the
coding agent gets, retry/convergence limits beyond the starting defaults
above, which categories of decision the maintainer personally wants
escalated beyond the defaults, and model/cost preferences. That
configuration lives in the maintainer's personal environment (e.g.
`~/.claude/reviewer-policy/`), not in the Ricette repository, and is
**not** project governance — it is not subject to CODEOWNER review, ADR
process, or community contribution rules, because it governs the
maintainer's own working style, not the project's engineering contract.

### Relationship to ADR-0019

This reviewer and the PR reviewer (ADR-0019) are **separate services with
separate authority, separate policy sources, and separate prompts** — not
one service used in two modes:

- This reviewer's job is to help the implementing agent reach a correct
  solution efficiently; it can be collaborative ("the approach is sound,
  but revise the migration strategy before proceeding") and it sees the
  agent's plan and task context.
- ADR-0019's PR reviewer assumes the contribution may be wrong and looks
  for reasons it should not merge; it is deliberately adversarial and
  receives fresh context — this reviewer's conversation and reasoning are
  **not** fed into the PR reviewer, so the PR reviewer never anchors on
  whatever already convinced this one.
- This reviewer's `APPROVE` only means the agent may continue, or that a
  task is locally complete. It carries no weight toward whether a PR
  merges, and none toward the Definition of Done in `AGENTS.md`. A task
  can legitimately be `APPROVE`d here and then receive `REQUEST_CHANGES`
  from the PR reviewer — that is not a contradiction, it reflects the two
  reviewers asking different questions.

## Alternatives Considered

- **PR-time review only (§21 as originally scoped, no earlier gates).**
  Rejected as insufficient on its own: an agent can sink substantial
  effort into a flawed plan or an unjustified decision before any
  independent check occurs.
- **Self-review only (agent critiques its own output, no second model).**
  Rejected: does not provide genuine independence — the same model/
  instance is subject to the same blind spots described in §22.
- **Single model for all gates (no critical/routine split).** Rejected on
  cost grounds: continuous gating at every decision and completion point
  is only sustainable if routine checks use a cheaper/faster model.
- **Hardcoding a specific model string throughout hook/tool code.**
  Rejected: couples the architectural decision ("independent second-model
  review exists") to a specific vendor/model generation.
- **One reviewer service for both local and PR review.** Rejected — see
  "Relationship to ADR-0019." Different authority, audience, policy
  source, and posture make a shared service the wrong design even though
  the underlying gate mechanics look similar.
- **Using `Stop` as the sole completion gate.** Rejected once
  `TaskCompleted` was confirmed to exist and to be purpose-built for
  exactly this (gating task completion specifically, as opposed to
  turn-level stopping). `Stop` is retained only as a failsafe.
- **Using a model's self-reported confidence score as the tier boundary.**
  Rejected: not sufficiently calibrated to serve as an authorization
  mechanism. Authority instead comes from deterministic classification of
  the work plus required evidence plus explicit fail-closed handling of
  genuine uncertainty (missing policy, invalid output, etc.).

## Rationale

Matches Foundation 0's stated goal (§1) of "maximum safe development
velocity under explicit, reviewable, machine-enforced engineering
constraints" — earlier, cheaper intervention points reduce wasted agent
effort and reduce how often the maintainer is the sole check on agent
judgment, while preserving human authority for genuine escalations (§18,
§62).

## Consequences

- Requires standing infrastructure (reviewer service, hooks, MCP tool)
  before it can be turned on — this ADR documents the design;
  implementation is the mandatory next harness milestone (see
  `IMPLEMENTATION_PLAN.md` Phase 3a), not yet built as of this writing.
  Governance content for Phases 0–2 has been drafted, but see
  `IMPLEMENTATION_PLAN.md` for which specific checklist items are actually
  complete — this ADR does not itself assert that status.
- Adds latency to plan/decision/completion transitions during agent-driven
  development in exchange for earlier defect/drift detection.
- Introduces an operational dependency on an external model API and its
  credential; an infrastructure failure (unreachable API, invalid
  structured output, missing/stale policy context) must fail closed with
  a bounded retry and then escalate — never silently treated as
  `APPROVE`.
- Does not replace or weaken ADR-0019's independent PR review, nor the
  Definition of Done in `AGENTS.md` — a task can be locally `APPROVE`d and
  still receive `REQUEST_CHANGES` at PR time, and still requires human
  review before merge regardless of what this reviewer said.
- Because policy here is personal rather than project-governed, this ADR
  records the *existence and shape* of the local reviewer as a project
  fact (so future maintainers understand why hooks reference an external
  reviewer), without making the maintainer's specific autonomy/escalation
  preferences a governance artifact subject to community review.
- **Hook semantics are version-sensitive.** `ExitPlanMode`/`updatedInput`,
  `TaskCompleted`'s trigger conditions, and `Stop`'s `decision: "block"`/
  8-consecutive-block behavior are all specific to the installed Claude
  Code version. This ADR's description of them is not a substitute for
  observing them: **every one of these mechanisms must be
  empirically acceptance-tested against the actual installed Claude Code
  version before autonomous gating is enabled on top of it.** If observed
  runtime behavior doesn't match what this ADR describes, that is a
  runtime/documentation mismatch, and the harness **fails closed** —
  escalate to the maintainer and do not enable autonomous plan/decision/
  completion gating on an unconfirmed mechanism.

## Conditions for Reconsideration

- If the reviewer service's false-positive/false-negative rate materially
  undermines developer trust or velocity.
- If Claude Code's hook model changes in a way that breaks the
  plan-gate/completion-gate mechanism described here (including if
  `TaskCompleted` is removed, renamed, or its semantics change).
- If the underlying models filling either role are deprecated with no
  compatible replacement.
- If the boundary with ADR-0019 stops holding in practice (e.g. local
  `APPROVE` starts being treated as sufficient for merge) — that would
  indicate the separation needs to be re-examined, not quietly eroded.

## Supersession

None. This ADR was revised in place (not superseded) first to narrow its
scope to the local harness reviewer once ADR-0019 was split out, and
again to correct the completion-gate mechanism (`Stop` → `TaskCompleted`),
clarify authority-tier classification, and add fail-closed
infrastructure-failure handling.
