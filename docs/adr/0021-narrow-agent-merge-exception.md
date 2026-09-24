# ADR-0021 — Narrow Standing Exception for Agent Self-Merge

## Status

Proposed (requires explicit maintainer approval; this is a governance change)

## Context

ADR-0010 and `AGENTS.md` prohibit an agent from merging its own pull request, and ADR-0010 rejects "full agent autonomy (agents merge their own PRs)" because unrestrained authority is the failure mode the AI-driven model exists to prevent. Every agent PR currently waits for the maintainer to press merge, including PRs that change nothing sensitive and have passed every machine check.

The maintainer has asked for a **narrow standing exception**. The goal is to remove the human step only where the machine controls already carry the decision, and to leave every governance, security and sensitive change with a human.

## Decision

An AI coding agent may merge a pull request **it authored** if and only if **every** condition below holds when it merges. Any doubt means it does not merge.

1. **Active.** The exception is dormant until its enforcement prerequisites exist: branch protection on `main` requiring pull requests and the required status checks, configured so the agent's identity cannot bypass them; and the project-governed PR reviewer (ADR-0019, the `project-policy-review` check) operating as a required check. While dormant, the agent merges nothing.
2. **Ordinary tier only.** No changed file is covered by `CODEOWNERS`. That covers the protected governance paths (`AGENTS.md`, `GOVERNANCE.md`, `PROVENANCE.md`, `LICENSE*`, `SECURITY.md`, `CONTRIBUTING.md`, `docs/adr/**`, `docs/security/**`, `.github/**`) and the Sensitive-tier areas once `CODEOWNERS` lists them (dependency manifests and lockfiles, migrations, authentication, authorization, entitlements, billing, deployment and container configuration, security-sensitive code). A path-based check against `CODEOWNERS` is the test, not the agent's judgment about sensitivity.
3. **Issue-authorized.** The PR implements an Active Issue in the Ricette Project whose blockers and gates are satisfied, and stays within that Issue's scope. The agent does not create its own authority.
4. **Green on the merged commit.** Every required check passes on the exact head commit; the `project-policy-review` verdict is PASS with no unresolved requested changes; all review conversations are resolved; the branch is current with `main`.
5. **No waivers.** The PR carries no `exception:*` label. Exceptions to the test and documentation requirements remain maintainer decisions, so an exempted PR is not eligible.
6. **Not held.** The PR does not carry the `no-agent-merge` label, and no human has requested changes on it.
7. **Not an attestation.** The PR does not record a governance decision or gate result (for example a Foundation Gate audit pass). Those remain maintainer decisions.
8. **Plain merge.** The agent merges through the normal pull-request merge using the repository's configured merge strategy. It never uses an administrator override, bypasses a check, or pushes to `main`.

The agent never merges a PR authored by anyone else.

### Audit and revocation

- Each agent merge is accompanied by a PR comment recording the Issue, head commit, the result of each required check, the reviewer verdict, and the `CODEOWNERS` path determination. The Issue is then updated with the same evidence.
- The exception **suspends automatically** if a merged agent PR is reverted for a defect, or if the agent attempts an action outside these conditions. It resumes only when the maintainer reinstates it.
- The maintainer can revoke it at any time by removing the enforcement described below; revocation needs no further ADR to take effect, though a superseding ADR should record it.

## Alternatives Considered

- **Keep the ADR-0010 rule unchanged.** Safest, but every ordinary PR waits on a human click even when all machine controls already pass. The maintainer has asked to relax this narrowly.
- **Broad autonomy for all agent PRs.** Rejected for the reason ADR-0010 gives: sensitive and governance changes must keep a human decision.
- **Per-PR approval only ("merge #N").** Compatible with today's rule, and it remains available, but it is not a standing exception and costs the maintainer a decision per PR.
- **Judgment-based eligibility ("merge if it looks low-risk").** Rejected: an agent grading its own risk is not a control. Eligibility is determined by `CODEOWNERS` paths and check results.

## Rationale

The Definition of Done already puts most of the merge bar on deterministic checks and the independent ADR-0019 reviewer, with human review as the last layer. For changes that touch no protected or sensitive path, and only once those checks are actually enforced, the marginal safety of the human click is small and the delay is real. Tying eligibility to `CODEOWNERS` paths and required-check results keeps the exception machine-verifiable, and dormancy prevents it from operating before the controls it relies on exist.

## Consequences

- Ordinary agent PRs can merge without the maintainer once the prerequisites exist. The human-approval line in the Ordinary tier is replaced, for agent-authored PRs meeting these conditions, by the machine controls above.
- **Identity.** The agent must act under an identity distinct from the maintainer's (a machine user or GitHub App). If both share one account, GitHub cannot tell them apart, a required approving review cannot be met by the maintainer on their own PR, and the ruleset cannot grant the agent a narrow merge permission. Condition 1 cannot be satisfied until this is resolved.
- **Maintainer-applied enforcement, outside the repo.** The user-level hard-deny "no self-merge" (`~/.claude/settings.json`) must be narrowed to allow only a merge that satisfies these conditions, and the GitHub ruleset must be configured to match. The agent does not edit either. Until the maintainer applies both, the exception is inert regardless of this ADR's status.
- Prerequisites tracked as Issues: #32 (branch protection) and #28 (`project-policy-review`).
- `AGENTS.md`, `CONTRIBUTING.md` and `GOVERNANCE.md` are updated to state the exception and point here.

## Conditions for Reconsideration

Revisit if an agent-merged PR causes a production or security defect, if the `project-policy-review` check proves unreliable, if the machine-checked eligibility test is found to admit a change that should have had a human decision, or if the maintainer wants the scope widened or removed.

## Supersession

Amends ADR-0010 in part: the prohibition on agent self-merge no longer applies to a PR that meets every condition above. ADR-0010's other decisions, including that agents receive no administrative access and cannot bypass branch protection, are unchanged.
