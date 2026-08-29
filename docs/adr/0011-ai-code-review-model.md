# ADR-0011 — AI Code Review Model

## Status

Accepted (design specification only — the reviewer service, hooks, and MCP tool described below are not yet implemented; see Consequences and `IMPLEMENTATION_PLAN.md` Phase 3a)

## Context

Foundation 0 (§19–§22) requires AI review of every PR, mandatory but non-authoritative, supplementing deterministic CI and human review. §21 describes two layers: Layer 1 (GitHub-native AI review) and Layer 2 (a trusted project-policy reviewer whose authoritative policy comes from protected repo state, not the contributor's branch).

Reviewing only at PR time means an agent (Claude Code, or any future coding agent) can invest significant effort in a flawed plan, an unjustified architectural decision, or an incomplete implementation before any independent check occurs. A second, independently-instructed model checking work at earlier checkpoints — before a plan is acted on, before a consequential decision is made, and before the agent declares work complete — catches problems earlier and cheaper than PR review alone, and reduces how often the human maintainer is the only check on the primary coding agent's judgment.

## Decision

Adopt **independent second-model review via two configurable model roles**, invoked at three checkpoints during agent-driven development, in addition to (not instead of) the existing Layer 1/Layer 2 PR-time review from §21:

1. **Plan gate** — before an agent proceeds from planning to execution (in Claude Code, a `PreToolUse` hook on `ExitPlanMode`), the reviewer evaluates the proposed plan against accepted ADRs, `AGENTS.md`, and relevant requirements. Response is `APPROVE`, `REVISE` (hook denies the exit and returns feedback for the agent to act on), or `ESCALATE_TO_HUMAN` for genuine product/governance judgment calls that policy doesn't resolve.
2. **Decision gate** — exposed as a callable tool (e.g. an MCP tool `review_decision(question, proposed_decision, alternatives, evidence)`) that `AGENTS.md` requires the agent to invoke before: adding a dependency, introducing a new architectural abstraction, choosing a lasting database representation, diverging SQLite/PostgreSQL behavior, changing a security boundary, changing an entitlement/commercial boundary, adding an infrastructure requirement, deviating from an accepted ADR, or adding a new persistent public API. Structured response: `decision` (APPROVE/REVISE/ESCALATE), `rationale`, `blocking_concerns`, `adr_required`, `required_actions`.
3. **Completion gate** — before the agent treats a task as finished (in Claude Code, a `Stop` hook), after deterministic checks (`./bin/verify`) pass, the reviewer checks implementation against requirements: meaningful tests (not superficial or implementation-derived per §22), doc/translation/ADR completeness, architecture drift, security, and AI failure-mode smells (§20, §22). On failure the hook blocks stop and returns feedback so the agent repairs and retries.

### Independence properties

- The reviewer service (working name: `ricette-reviewer`) loads its governing context — `AGENTS.md`, `docs/adr/**`, `docs/architecture/**`, `docs/security/**` — from **protected `main`**, never from the branch under review. The agent can supply a plan, question, diff, test results, or evidence, but cannot supply or rewrite the reviewer's governing instructions.
- The hooks that make these gates mandatory are registered in **user-level or managed** Claude Code settings, not the project's own `.claude/settings.json`. The repository (which the agent actively modifies) may describe this policy in documentation, but must not be the thing that can disable its own enforcement. This mirrors the auto-mode hard-deny split already in effect for other authority boundaries (see `IMPLEMENTATION_PLAN.md`, "Auto-mode enforcement split") — same principle, applied to the review gates specifically.
- The reviewer **must not execute code from the branch or PR under review** — it reads the diff, the plan, the question/evidence supplied, and its own governing context from protected `main`; it never runs untrusted code to form its judgment. This is the same non-execution constraint Foundation 0 §21 places on the Layer 2 project-policy reviewer, extended here to the plan/decision/completion gates.
- The human maintainer is the **appellate authority**, not the primary reviewer at each of these three gates. Routine plan/decision/completion review happens between the coding agent and the independent reviewer without maintainer involvement; the maintainer is pulled in only on `ESCALATE`/`ESCALATE_TO_HUMAN`, i.e. when the two models disagree or a genuine product/governance judgment call isn't resolved by existing policy. This keeps the maintainer's attention on real decisions rather than routine plumbing, consistent with the risk-based human-review tiers already established (see `GOVERNANCE.md`, "Decision authority").

### Model roles

Two named roles, referenced by role name everywhere in hook/tool logic — never a literal model string inline:

```text
REVIEW_MODEL_CRITICAL=gpt-5.6-sol     # plan gate, architecture/security decisions, escalation
REVIEW_MODEL_ROUTINE=gpt-5.6-terra    # routine completion checks, dependency/doc-completeness, PR-semantic review
```

Swapping which underlying model fills a role is an **operational configuration change**, not an architecture change requiring a new ADR — unless the reviewer's actual capability or behavior contract materially changes (e.g. moving off structured-output support, or changing which provider is used entirely).

### Credential handling

The reviewer service's API credential is supplied from **outside** the Ricette repository (host/deployment-level secret). It must never be committed, never placed in project `.env`/`.env.example`, and never readable from application- or agent-controlled configuration.

## Alternatives Considered

- **PR-time review only (§21 as originally scoped, no earlier gates).** Rejected as insufficient on its own: an agent can sink substantial effort into a flawed plan or an unjustified decision before any independent check occurs. This ADR extends, not replaces, that PR-time review.
- **Self-review only (agent critiques its own output, no second model).** Rejected: does not provide genuine independence — the same model/instance is subject to the same blind spots described in §22 (AI-on-AI review policy exists precisely because a model cannot be trusted to catch its own failure modes).
- **Single model for all gates (no critical/routine split).** Rejected on cost grounds: continuous gating at every decision and completion point is only sustainable if routine checks use a cheaper/faster model, reserving the stronger model for plans, architecture/security decisions, and disagreement escalation.
- **Hardcoding a specific model string throughout hook/tool code.** Rejected: couples the architectural decision ("independent second-model review exists") to a specific vendor/model generation. The role-based env-var indirection (`REVIEW_MODEL_CRITICAL` / `REVIEW_MODEL_ROUTINE`) keeps model choice an operational detail.

## Rationale

Matches Foundation 0's stated goal (§1) of "maximum safe development velocity under explicit, reviewable, machine-enforced engineering constraints" — earlier, cheaper intervention points reduce wasted agent effort and reduce how often the human maintainer is the sole check on agent judgment, while preserving human authority for genuine escalations (§18, §62).

## Consequences

- Requires standing infrastructure (reviewer service, hooks, MCP tool) before it can be turned on — this ADR documents the design; implementation is deferred (see Foundation Implementation Plan, Phase 3a) until repo initialization and the canonical governance/ADR/security documents exist (Phases 0–2).
- Adds latency to plan/decision/completion transitions during agent-driven development in exchange for earlier defect/drift detection.
- Introduces an operational dependency on an external model API and its credential; outage or misconfiguration of the reviewer service must not silently disable the gates (fail closed, not open) — exact failure-mode handling to be specified when the service is built.
- Does not change or weaken the existing §21 Layer 1/Layer 2 PR-time review — this is additive.

## Conditions for Reconsideration

- If the reviewer service's false-positive/false-negative rate materially undermines developer trust or velocity.
- If Claude Code's hook model changes in a way that breaks the plan-gate/completion-gate mechanism described here.
- If the underlying models filling either role are deprecated with no compatible replacement.

## Supersession

None. This is the initial ADR for this decision area.
