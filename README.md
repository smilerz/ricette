# Ricette (working name)

A recipe and meal-planning application, currently in its **Foundation 0**
phase: establishing technical, security, governance, development, testing,
documentation, licensing, commercial, and AI-development rules before any
application/domain code is written.

The application begins deliberately nameless and is developed publicly on
GitHub. `Ricette` (Italian for "recipes") is a working directory name, not
a final product name.

## Two deployment paths

- **Community / self-hosted** — open source, free to use, no required
  vendor account or external infrastructure, fully useful when
  disconnected from the project's hosted services.
- **Hosted / freemium** — the same core application, plus managed
  infrastructure and commercial capabilities, monetized through
  capabilities and entitlements rather than a forked codebase.

## Stack

Laravel 13 (backend) · Svelte 5 + TypeScript (frontend) · Inertia 3 (web
integration) · SQLite (self-hosted) · PostgreSQL (hosted) · OCI/Docker
image (release artifact).

See `docs/adr/` for the reasoning behind each of these choices.

## Where to look

| Question | Where |
|---|---|
| Why does the architecture look like this? | `docs/architecture/principles.md`, `docs/adr/` |
| What am I allowed to change, and how? | `GOVERNANCE.md`, `CONTRIBUTING.md` |
| Where did this project's requirements come from? | `PROVENANCE.md` |
| What can AI coding agents do here? | `AGENTS.md` |
| What's the threat model? | `docs/security/threat-model.md` |
| How do I test, style, document, translate, and make things accessible? | `docs/development/` |
| What's left before application code can start? | `IMPLEMENTATION_PLAN.md` |
| How do I report a security issue? | `SECURITY.md` |
| Where do I ask for help? | `SUPPORT.md` |

## License

MPL-2.0 — see `LICENSE`. Contributions are certified under the Developer
Certificate of Origin (DCO), not a CLA — see `CONTRIBUTING.md`.

## Status

No application code yet. This repository currently contains only
Foundation 0 governance: licensing, provenance, ADRs, and policy
documents. See `IMPLEMENTATION_PLAN.md` for the sequencing toward the
first application PR.
