# Security Policy

## Scope

This policy covers the Ricette application (community/self-hosted and
hosted editions) and its supporting infrastructure once that exists.
Foundation-level security requirements are recorded in `docs/security/
threat-model.md` and ADR-0016 (Security Baseline).

## Supported versions

This project is pre-1.0 and still in Foundation 0 (no application code has
shipped yet). Once releases begin, this section will list which released
versions receive security fixes, per the versioning policy in ADR-0017.

## Reporting a vulnerability

Please use GitHub's **private vulnerability reporting** feature on this
repository once it exists on GitHub, rather than a public issue. If
private reporting is not yet available, do not disclose details in a
public issue — hold the report until a private channel is confirmed.

Please include:

- affected version/commit
- a clear description of the vulnerability and its impact
- steps to reproduce, or a proof of concept if you have one

## Response expectations

Community support, including security triage, is best effort with no SLA
(see `SUPPORT.md`). We aim to acknowledge reports promptly and will work
with you on a coordinated disclosure timeline before any public
disclosure.

## Coordinated disclosure

Please give us a reasonable opportunity to investigate and address a
report before any public disclosure. We will credit reporters who request
it, once a fix is released.

## Security invariants (not subject to plan-tier gating)

Per Foundation 0 §12 and ADR-0009:

- Security fixes and basic account protection are never withheld based on
  subscription plan.
- Backup and data portability are always available to community users —
  never premium-gated.

## Related documents

- `docs/security/threat-model.md` — the living threat model.
- ADR-0016 — Security Baseline.
- ADR-0019 — Independent Pull Request Semantic Review (security review
  responsibilities applied to every PR, regardless of author).
- ADR-0011 — Local Independent AI Development Review (security
  consideration during the maintainer's own agent-driven development,
  before a PR even exists).
- `AGENTS.md` — security rules binding on AI coding agents.
