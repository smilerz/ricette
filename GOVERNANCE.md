# Governance

## Where governance lives

Foundation-level governance for this project lives in **this repository**,
not in a separate governance repository, and not in a GitHub Wiki.

A separate governance repository is not justified while the organization has
only one substantive product repository. Governance becomes a separate
shared repository only if multiple products later need common governance
(see "Future Multi-Repository Governance" below).

A GitHub Wiki is never the authoritative store for architecture, security
policy, AI policy, governance, contribution rules, or release policy. A wiki
may eventually host community-created or convenience documentation, but it is
never the source of truth for anything listed above. All of that content is
version-controlled Markdown, reviewed the same way code is reviewed.

## Repository documentation structure

```text
README.md
LICENSE
GOVERNANCE.md
AGENTS.md
PROVENANCE.md
CONTRIBUTING.md
SECURITY.md
SUPPORT.md
CODE_OF_CONDUCT.md

docs/
  adr/

  architecture/
    principles.md

  security/
    threat-model.md

  development/
    setup.md
    testing.md
    style.md
    dependencies.md
    documentation.md
    translation.md
    accessibility.md
    ai-development.md

  product/
    principles.md
    glossary.md
```

Governance documents are source-controlled, pull-request reviewed, and
protected like code. Once the repository is on GitHub, sensitive paths
(including this document, `AGENTS.md`, `PROVENANCE.md`, `LICENSE*`,
`SECURITY.md`, `CONTRIBUTING.md`, `docs/adr/**`, `docs/security/**`, and
`.claude/**`) are protected via `CODEOWNERS` — see `CONTRIBUTING.md` and
ADR-0018.

## Architecture Decision Records

Every Foundation-level decision gets a real Architecture Decision Record
(ADR) under `docs/adr/`, in a consistent MADR-style format. Each ADR states:

- status
- context
- decision
- alternatives considered
- rationale
- consequences
- conditions for reconsideration
- supersession information, where applicable

ADRs are normally **not rewritten** when the project changes direction.
Instead, a new ADR supersedes an old one — for example, "ADR-0002 Accepted;
ADR-0041 Supersedes ADR-0002." This preserves an honest architectural
history rather than a rewritten one.

The initial Foundation ADR set is ADR-0001 through ADR-0018. Their titles
and rationale are recorded in `docs/adr/`; ADR-0018 records why this
governance-as-code model was chosen in the first place.

## Decision authority

Three tiers of change, each with its own review bar (also stated in
`CONTRIBUTING.md`):

- **Ordinary changes** — deterministic checks, AI review, one human
  approval.
- **Sensitive changes** (auth, authorization, entitlements, billing,
  migrations, dependencies, CI, deployment, security, `AGENTS.md`) —
  deterministic checks, AI review, CODEOWNER approval.
- **Governance changes** (license, provenance, architecture invariants,
  security policy, AI review policy, contribution requirements) — explicit
  maintainer approval.

Governance cannot be silently changed by the same agent or contributor
constrained by that governance — see `CODEOWNERS` once established, and the
auto-mode enforcement split recorded in `IMPLEMENTATION_PLAN.md`, which
applies the same principle to AI coding agents specifically.

## AI development governance

AI coding agents operate under `AGENTS.md`, which is the canonical
operational instruction set for development agents. `AGENTS.md` is itself a
protected governance file. See ADR-0010 (AI-Driven Development Model) and
ADR-0011 (AI Code Review Model) for the rationale and mechanics.

## Future multi-repository governance

If the project later expands into multiple substantial repositories (for
example, a native mobile app, a hosted infrastructure repo, or a separate AI
service repo), create an organization-level `governance` repository for
decisions that must be shared across all of them. Cross-project decisions
move there; implementation-specific ADRs remain beside the code they
govern. Do not create this structure prematurely — it is not justified
while Ricette is the organization's only substantive product repository.
