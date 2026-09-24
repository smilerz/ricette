# ADR-0022 — Local Review Harness Is Not Built by This Project

## Status

Proposed (governance change; supersedes ADR-0011)

## Context

ADR-0011 specified a personal, user-level local reviewer (a dedicated Claude Code subagent invoked through plan, decision and completion hooks) and `IMPLEMENTATION_PLAN.md` Phase 3a made building it the mandatory next milestone before application code. Nothing in the project's merge bar depended on it: `AGENTS.md` states that a local `APPROVE` carries no weight toward whether a PR merges, and Foundation 0 section 64 requires automatic AI review and the trusted project-policy review design (ADR-0019), not a personal harness.

The maintainer decided on 2026-09-24 not to implement the Phase 3a hooks and to use their existing, lower-friction local harness instead.

## Decision

The project does not build, specify or maintain a local review harness. The Phase 3a reviewer, hook scripts, approval-record storage and acceptance matrix will not be implemented. Whatever local review tooling the maintainer uses is personal, lives outside this repository's governance, and is deliberately not specified here.

ADR-0011 is superseded. ADR-0019 (the independent, project-governed PR reviewer) is unaffected and remains the project's AI review of every PR.

## Alternatives Considered

- **Build ADR-0011 as designed.** Rejected by the maintainer in favor of the existing harness. The design also depended on version-sensitive hook mechanics and on editing user-level agent settings.
- **Specify the maintainer's existing harness in a new ADR.** Rejected: it is personal tooling with no bearing on the merge bar, so the repository should not govern it.

## Rationale

The local reviewer was always non-authoritative for merging. Removing it from the Foundation Gate removes an engineering item that protected no project control, while every control that does gate merges (deterministic checks, ADR-0019, human review) is unchanged.

## Consequences

- Phase 3a leaves the Foundation Gate; the Foundation Gate audit (section 64) does not depend on it.
- Existing references to "ADR-0011's local reviewer" in `AGENTS.md`, `CONTRIBUTING.md`, `docs/development/ai-development.md` and ADR-0019 describe a personal harness in general terms and carry no merge weight. They are left as written; a later cleanup may reword them.
- `~/.claude/agents/ricette-local-reviewer.md` was created earlier under ADR-0011. It is the maintainer's file to keep or remove.

## Conditions for Reconsideration

Revisit if the project decides to require a shared, project-defined local review step for contributors.

## Supersession

Supersedes ADR-0011.
