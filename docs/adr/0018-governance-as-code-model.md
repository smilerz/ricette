# ADR-0018 — Governance-as-Code Model

## Status

Accepted

## Context

The project needs somewhere authoritative to record architecture, security, AI, and contribution policy that outlives any single contributor's or agent's memory of a conversation. A GitHub Wiki is a common default for this kind of content but isn't PR-reviewed or protected the way code is, which conflicts with the project's broader principle that policy should be machine-enforced and reviewable (§1) rather than tribal knowledge.

## Decision

- **Governance lives in the application repository** (§13), not a separate governance repo — a separate repo isn't justified while the organization has only one substantive product repository. Governance becomes a separate shared repository only if multiple products later need common governance (§55 sketches the future shape: `org/governance`, `org/recipe-app`, `org/mobile`, `org/ai-service`, `org/hosted-infrastructure` — cross-project decisions would move to `governance`, implementation-specific ADRs stay beside their code). This structure is explicitly not to be created prematurely.
- **Repository documentation structure** (§14): `README.md`, `LICENSE`, `GOVERNANCE.md`, `AGENTS.md`, `PROVENANCE.md`, `CONTRIBUTING.md`, `SECURITY.md`, `SUPPORT.md`, `CODE_OF_CONDUCT.md`, plus `docs/adr/`, `docs/architecture/`, `docs/security/`, `docs/development/`, `docs/product/`. Governance documents are source-controlled, pull-request reviewed, and protected like code (via CODEOWNERS, §24).
- **Wiki policy** (§54): GitHub Wiki is not the authoritative project record. A wiki may eventually serve community-created or convenience documentation, but must not be the sole source of truth for architecture, security policy, AI policy, governance, contribution rules, or release policy — those remain PR-reviewed Git artifacts.
- **ADR format and process** (§15): consistent MADR-style format (status, context, decision, alternatives considered, rationale, consequences, conditions for reconsideration, supersession information). ADRs are normally not rewritten when the project changes direction — instead a new ADR supersedes an old one (e.g. "ADR-0002 Accepted; ADR-0041 Supersedes ADR-0002"), preserving an honest architectural history rather than a rewritten one.

## Alternatives Considered

- **GitHub Wiki as the primary governance store.** Rejected: not PR-reviewed, not protected by CODEOWNERS, and editable outside the same review discipline applied to code — directly conflicts with §1's "reviewable, machine-enforced" development model.
- **A separate governance repository from day one.** Rejected as premature: with a single product repo, splitting governance out adds cross-repo coordination cost with no present benefit; §55 explicitly defers this until multiple substantial repositories exist.
- **Rewrite ADRs in place when direction changes, rather than superseding them.** Rejected: destroys the historical record of *why* an earlier decision was made and later reversed, which is itself valuable context for future decisions.

## Rationale

Keeping governance as version-controlled, PR-reviewed Markdown makes policy changes go through the same review discipline as code changes (§62 — governance changes require explicit maintainer approval), and makes the current state of policy always answerable by reading the repository rather than institutional memory (§69, Foundation 0's own success criterion).

## Consequences

- Every governance file (`AGENTS.md`, `GOVERNANCE.md`, ADRs, security policy) is CODEOWNERS-protected and goes through the same PR funnel as code (§61, §62).
- A wiki, if one is ever enabled, must be explicitly scoped to non-authoritative convenience content to avoid becoming a shadow source of truth.
- Superseding rather than rewriting ADRs means the `docs/adr/` directory grows monotonically and old (superseded) ADRs are kept, not deleted.

## Conditions for Reconsideration

- If the organization adds a second substantial product repository requiring shared governance — triggers the §55 migration to a dedicated `org/governance` repository.

## Supersession

None. This is the initial ADR for this decision area.
