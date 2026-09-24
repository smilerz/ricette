# ADR-0011 — Local Independent AI Development Review

## Status

Superseded by ADR-0022 (2026-09-24). The maintainer decided not to implement this reviewer and to use their existing local harness instead, so nothing described below was built or will be built. The text is retained as the historical record of the design.

**Revision note (2026-08-29):** this ADR originally specified an external OpenAI-based reviewer (two model roles, a narrow credential-isolated service). That mechanism has been replaced with a dedicated, user-level Claude Code subagent reviewer — see "Mechanism" and "Alternatives Considered" below for why. The requirement weakens from "independent second-model review" to **"independent fresh-context review with separately controlled instructions, tools, and authority"** — model/provider diversity is desirable, not fundamental, for this specific (personal, non-adversarial) reviewer. ADR-0019's PR reviewer is unaffected by this change and keeps its cross-vendor design; see "Relationship to ADR-0019."

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
second, independently-instructed reviewer checking the agent's work at
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

Adopt **independent fresh-context review of the maintainer's own coding
agent**, invoked at three checkpoints during agent-driven development.

### Mechanism: a dedicated Claude Code subagent, not a separate vendor

The reviewer is a **user-level custom Claude Code subagent**, defined
outside this repository (e.g. `~/.claude/agents/ricette-local-reviewer.md`),
with its own system prompt and its own, deliberately restricted tool
access — **read-only tools only** (`Read`, `Grep`, `Glob`; no `Edit`,
`Write`, or `Bash` that could mutate anything). It can inspect code,
diffs, tests, and evidence; it cannot fix the work itself, only judge it.

It never receives Claude's (the implementer's) chain of reasoning or
conversation history. It receives only:

- **trusted task authority** (see "Task authority" below);
- protected-`main` governance (`AGENTS.md`, `docs/adr/**`,
  `docs/architecture/**`, `docs/security/**`);
- the plan (plan gate) or the diff (completion gate);
- deterministic evidence (test output, `./bin/verify` results, once that
  exists).

**Model roles** — two named roles, referenced by role name, not a
hardcoded model string:

```text
LOCAL_REVIEWER_MODEL_ROUTINE=claude-sonnet-5    # routine completion/decision checks, moderate effort
LOCAL_REVIEWER_MODEL_ELEVATED=claude-opus-5     # plan gate, architecture/security decisions, escalation, high effort
```

The point of the split is not "the reviewer must always be smarter than
the implementer" — it's giving the review a fresh problem representation
and a deliberately reviewer-postured prompt, rather than letting the
implementer grade its own homework, while reserving stronger
reasoning effort for consequential judgment calls.

**Hook implementation choice**: Claude Code's native `PreToolUse`/
`TaskCompleted`/`Stop` hooks support a `type: "agent"` variant that spawns
a subagent directly and returns a decision. Anthropic's own hooks
reference documents this and states plainly that **agent-based hooks are
experimental and the format may change** — confirmed directly against
that documentation, not assumed. Given this ADR's harness needs to persist
state (approval records — see the completion gate below) that a
read-only reviewer subagent cannot itself write, and given "experimental"
is a real, documented caveat for infrastructure this ADR wants to rely on
continuously, the gates are implemented as **`command`-type hooks (stable,
not experimental) that shell out to a `claude -p` subprocess** running the
dedicated reviewer agent definition, parse its structured response, and
have the wrapping script itself persist the approval record and return
the hook's JSON decision. This achieves the same design goal — a fresh,
separately-instructed Claude reviewer with its own tools and authority —
on non-experimental infrastructure. Native agent-based hooks remain a
future option if their behavior proves reliable in practice; do not switch
to them without re-running the full acceptance matrix below.

1. **Plan gate** — before the agent proceeds from planning to execution
   (in Claude Code, a hook on `ExitPlanMode`), the reviewer evaluates the
   proposed plan against trusted task authority and accepted ADRs/
   `AGENTS.md`. Response is `APPROVE`, `REVISE` (hook denies the exit and
   returns feedback for the agent to act on), or `ESCALATE_TO_HUMAN`.
   Mechanism: the wrapping `PreToolUse` command hook must return
   `permissionDecision: "allow"` together with `hookSpecificOutput.
   updatedInput` echoing every unchanged input field (since `updatedInput`
   replaces the whole object) for an `APPROVE` to actually take effect.
2. **Decision gate** — rather than a bespoke MCP tool, `AGENTS.md` requires
   the agent to invoke the reviewer subagent directly (Claude Code's
   existing `Agent`-tool/subagent mechanism, the same mechanism this
   session already uses for `subagent_type` dispatch) before consequential
   implementation decisions: adding a dependency, introducing a new
   architectural abstraction, choosing a lasting database representation,
   diverging SQLite/PostgreSQL behavior, changing a security boundary,
   changing an entitlement/commercial boundary, adding an infrastructure
   requirement, deviating from an accepted ADR, or adding a new persistent
   public API. The agent must supply the reviewer with the question,
   proposed decision, alternatives, and evidence, and act on a structured
   response: `decision` (`APPROVE`/`REVISE`/`ESCALATE`), `rationale`,
   `blocking_concerns`, `adr_required`, `required_actions`. **Not yet
   true, and must not be presented as true**: `AGENTS.md` does not
   currently contain this rule, because the reviewer subagent doesn't
   exist yet. Installing that rule is an explicit acceptance test for this
   phase's implementation.
3. **Completion gate** — before the agent treats its current task as
   finished. `TaskCompleted` fires when a task is marked complete via
   `TaskUpdate`, or when an agent-team teammate finishes with in-progress
   tasks; a plain session that never creates or updates a Task object
   never fires it at all, so it cannot be the sole completion gate. `Stop`
   fires whenever Claude finishes responding to any turn (turn-level, more
   frequent than task completion), with `decision: "block"` (plus a
   `reason`) as its blocking mechanism, under an 8-consecutive-block
   Claude-Code-enforced ceiling. This ADR requires an invariant that holds
   regardless of exactly when `TaskCompleted` fires in practice: **every
   substantive local work unit must receive exactly one completion-review
   verdict, whether or not Claude ever creates a Task object for it — and
   the backstop must never let Claude Code's own 8-consecutive-block
   override silently stand in for an actual review.** Concretely:
   - `TaskCompleted` is the primary gate whenever Task-tracking is in use:
     after deterministic checks (`./bin/verify`, once it exists) pass, the
     reviewer checks implementation against trusted task authority
     (meaningful tests, not superficial or implementation-derived per
     §22; doc/translation/ADR completeness; architecture drift; security;
     AI failure-mode smells per §20/§22). On `REVISE`, the hook blocks
     completion and returns feedback so the agent repairs and retries.
   - A successful review produces an **approval record** — written by the
     wrapping command-hook script, not the read-only reviewer subagent —
     bound to the authoritative task/spec identity, the evidence/diff
     reviewed, and the policy revision (commit hash on `main`) it was
     checked against.
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
     completed work unit needing review.
   - **Bounded retry, well under the 8-block ceiling**: the backstop's own
     block-and-review cycle must use a retry budget smaller than Claude
     Code's built-in 8-consecutive-block override (the same default
     Routine/Elevated limits below — 3 and 2 — both comfortably under 8).
     If the reviewer cannot produce a verdict within that budget, this is
     treated as retry-limit exhaustion under "Human-decision" below and
     escalates to the maintainer — it must never simply keep blocking
     until Claude Code's override forces the turn to end anyway.
   - This design avoids two failure modes symmetrically: treating every
     `Stop` as a fresh independent review, and trusting `TaskCompleted`
     alone in a way an agent could silently bypass by never using
     Task-tracking tools.

### Task authority: what the reviewer treats as the actual task

**The reviewer must not evaluate the agent against the agent's own
paraphrase of the task.**

- **Task authority** — what the reviewer treats as the actual, binding
  task: the maintainer's actual direct instruction and any explicitly
  approved spec/design or later direct correction, captured through a
  harness-controlled source such as the trusted session/transcript — not
  a summary the agent generated of what it believes it was asked to do.
  Protected-`main` governance remains **project** authority, unchanged;
  task authority is the additional, narrower question of what this
  specific unit of work was actually asked to accomplish.
- **Supporting/untrusted inputs** — the agent's own summary or paraphrase
  of the task, issue/PR text (unless explicitly adopted by the
  maintainer), other external content, and the diff/tests/evidence the
  agent produced. These describe what the agent did and believes it was
  asked to do; they do not get to define what it was actually asked to
  do. This mirrors ADR-0019's Authority vs. Evidence split for the same
  reason: a reviewer that lets the thing being reviewed define its own
  success criteria isn't independent of it.
- Approval records are bound to the **authoritative task/spec identity**
  in addition to evidence/diff identity and policy revision — so a later
  audit can confirm not just *what* was reviewed, but *against what the
  maintainer actually asked for*.

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
  stronger/elevated reviewer role. Still resolves autonomously on
  `APPROVE` whenever accepted project policy gives the reviewer enough
  basis. Default starting limit: **2 revise cycles** before escalating.
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
tiers above. An **infrastructure failure** — the `claude -p` subprocess
fails to launch, times out, returns unparseable output, the governing
policy context is missing, or the policy commit hash the reviewer loaded
is stale relative to `main` — is a different failure class and must
**fail closed**: retry a small fixed number of times, then pause and
escalate to the maintainer rather than silently treating the failure as
an implicit `APPROVE`. A gate that cannot get a real verdict must never
default to letting the agent proceed.

### Independence properties

- The reviewer subagent's context — `AGENTS.md`, `docs/adr/**`,
  `docs/architecture/**`, `docs/security/**` — is loaded from **protected
  `main`**, never from the branch under review. The agent can supply a
  plan, question, diff, test results, or evidence, but cannot supply or
  rewrite the reviewer's own system prompt/instructions.
- The hooks that make these gates mandatory are registered in the
  maintainer's **personal Claude Code configuration** (user-level
  settings, `~/.claude/settings.json`), not the project's own
  `.claude/settings.json`. This is a personal-harness boundary, not a
  project-authority boundary: the repo being worked on should not be the
  thing that can disable the maintainer's own review harness, the same
  way it should not be able to disable the auto-mode hard-deny policy
  (see `IMPLEMENTATION_PLAN.md`, "Auto-mode enforcement split") — same
  principle, different scope.
- The reviewer subagent is **read-only** — it cannot execute or modify
  code from the branch under review; it can only inspect it.
- The human maintainer is the **appellate authority**, not the primary
  reviewer at each of these three gates. Routine plan/decision/completion
  review happens between the coding agent and the reviewer subagent
  without maintainer involvement; the maintainer is pulled in only on
  `ESCALATE`/`ESCALATE_TO_HUMAN` or retry-limit exhaustion.

### Policy source: personal, not project governance

This reviewer's policy may include the maintainer's private productivity
preferences — how much autonomy the coding agent gets, retry/convergence
limits beyond the starting defaults above, which categories of decision
the maintainer personally wants escalated beyond the defaults, and
model/effort preferences. That configuration lives in the maintainer's
personal environment (e.g. `~/.claude/reviewer-policy/`), not in the
Ricette repository, and is **not** project governance.

### Relationship to ADR-0019

This reviewer and the PR reviewer (ADR-0019) are **separate mechanisms
with separate authority, separate policy sources, and separate
prompts** — not one reviewer used in two modes, and this revision does
**not** extend to ADR-0019:

- This reviewer's job is to help the implementing agent reach a correct
  solution efficiently; it can be collaborative and it sees the agent's
  plan and task context (though never the agent's reasoning/conversation
  — see "Mechanism" above).
- ADR-0019's PR reviewer assumes the contribution may be wrong and looks
  for reasons it should not merge; it is deliberately adversarial,
  receives fresh context, and **remains cross-vendor** (a different model
  lineage than the implementing agent) — that stronger, vendor-level
  independence is worth its operational cost specifically for the
  reviewer that protects the project from any contributor, not just the
  maintainer's own tooling. Do not migrate ADR-0019 onto this same
  Claude-subagent mechanism without a separate ADR revision explicitly
  weighing that tradeoff.
- This reviewer's `APPROVE` only means the agent may continue, or that a
  task is locally complete. It carries no weight toward whether a PR
  merges, and none toward the Definition of Done in `AGENTS.md`.

## Alternatives Considered

- **PR-time review only (§21 as originally scoped, no earlier gates).**
  Rejected as insufficient on its own: an agent can sink substantial
  effort into a flawed plan or an unjustified decision before any
  independent check occurs.
- **Self-review only (agent critiques its own output, no second
  reviewer).** Rejected: does not provide genuine independence — the same
  model/instance is subject to the same blind spots described in §22.
- **External OpenAI-based reviewer (this ADR's original design).**
  Rejected on reconsideration: bought cross-vendor independence at the
  cost of a second metered service, a credential-isolation service, HTTP/
  MCP model-proxy plumbing, and pay-as-you-go accounting — solving a
  problem this specific (personal, non-adversarial) reviewer doesn't
  actually have. If the maintainer's Claude Code usage is already covered
  by a subscription plan, a dedicated subagent reviewer draws on that
  existing capacity rather than creating a new billing relationship.
  Cross-vendor independence is deliberately preserved where it matters
  more — ADR-0019's PR reviewer, which evaluates contributions from
  parties who are not the maintainer.
- **Native experimental `type: "agent"` hooks as the gate mechanism.**
  Considered and not (yet) chosen: Anthropic's own documentation labels
  these experimental with a format that may change, and they don't
  obviously support the wrapping script persisting an approval record
  written by something other than the (deliberately read-only) reviewer
  subagent itself. `command`-type hooks that shell out to `claude -p` are
  stable infrastructure that achieve the same design goal. Revisit native
  agent hooks if they mature and simplify the implementation.
- **Using a model's self-reported confidence score as the tier
  boundary.** Rejected: not sufficiently calibrated to serve as an
  authorization mechanism.

## Rationale

Matches Foundation 0's stated goal (§1) of "maximum safe development
velocity under explicit, reviewable, machine-enforced engineering
constraints" — earlier, cheaper intervention points reduce wasted agent
effort and reduce how often the maintainer is the sole check on agent
judgment, while preserving human authority for genuine escalations (§18,
§62). Using a dedicated, fresh-context Claude subagent rather than a
separate vendor keeps that benefit while removing operational complexity
that wasn't buying much independence for a reviewer whose main job is
catching the maintainer's own agent wandering off-spec, not adjudicating
an adversarial contribution.

## Consequences

- Requires standing infrastructure (reviewer subagent definition, hook
  wrapper scripts, approval-record storage) before it can be turned on —
  this ADR documents the design; implementation is the mandatory next
  harness milestone (see `IMPLEMENTATION_PLAN.md` Phase 3a), not yet built
  as of this writing.
- Adds latency to plan/decision/completion transitions during agent-driven
  development in exchange for earlier defect/drift detection.
- Because the reviewer is the same model vendor/lineage as the
  implementing agent, correlated blind spots are more likely than with a
  cross-vendor reviewer. Accepted for this personal-harness reviewer;
  explicitly not accepted for ADR-0019's PR reviewer.
- If the maintainer's Claude Code usage is subscription-covered, this
  reviewer consumes that same usage/subscription capacity rather than
  creating separate API billing — but subagent calls still count against
  whatever usage limits apply, so heavy plan/decision/completion gating
  will use meaningfully more of that capacity.
- An infrastructure failure (subprocess launch failure, timeout, invalid
  output, missing/stale policy context) must fail closed with a bounded
  retry and then escalate — never silently treated as `APPROVE`.
- Does not replace or weaken ADR-0019's independent PR review, nor the
  Definition of Done in `AGENTS.md` — a task can be locally `APPROVE`d and
  still receive `REQUEST_CHANGES` at PR time, and still requires human
  review before merge regardless of what this reviewer said.
- **Hook semantics are version-sensitive.** `ExitPlanMode`/`updatedInput`,
  `TaskCompleted`'s trigger conditions, `Stop`'s `decision: "block"`/
  8-consecutive-block behavior, and the exact behavior of agent-based vs.
  command-based hooks are all specific to the installed Claude Code
  version. **Every one of these mechanisms must be empirically
  acceptance-tested against the actual installed Claude Code version
  before autonomous gating is enabled on top of it.** If observed runtime
  behavior doesn't match what this ADR describes, that is a runtime/
  documentation mismatch, and the harness **fails closed** — escalate to
  the maintainer and do not enable autonomous plan/decision/completion
  gating on an unconfirmed mechanism.

## Conditions for Reconsideration

- If the reviewer subagent's false-positive/false-negative rate materially
  undermines developer trust or velocity.
- If Claude Code's hook model changes in a way that breaks the
  plan-gate/completion-gate mechanism described here (including if
  `TaskCompleted` is removed, renamed, or its semantics change, or if
  `command`-type hooks lose the ability to shell out to `claude -p`).
- If native agent-based hooks mature out of "experimental" and materially
  simplify this implementation.
- If correlated same-vendor blind spots prove to be a real problem in
  practice for this reviewer specifically — that would be grounds to
  reconsider cross-vendor review here too, not just for ADR-0019.
- If the boundary with ADR-0019 stops holding in practice (e.g. local
  `APPROVE` starts being treated as sufficient for merge) — that would
  indicate the separation needs to be re-examined, not quietly eroded.

## Supersession

None. This ADR has been revised in place multiple times (narrowed from
the original combined AI-review ADR once ADR-0019 was split out; hook
mechanics corrected per empirical documentation checks; task-authority
section added; and now the reviewer mechanism itself changed from an
external OpenAI service to a dedicated Claude Code subagent) rather than
superseded, since each revision refined the same underlying decision
rather than replacing it.

Superseded by ADR-0022, which records the decision not to build this reviewer.
