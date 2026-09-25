# Ricette (working name)

A recipe and meal-planning application. Foundation 0 (licensing, governance, security,
testing, documentation and AI-development rules) is established, and the first application
slices are being built from the Issues on the Ricette Project board.

The application begins deliberately nameless and is developed publicly on
GitHub. `Ricette` (Italian for "recipes") is a working directory name, not
a final product name.

## Quick start

```bash
./bin/setup        # check your tools and install dependencies
./bin/dev --seed   # run the app with hot reload and a demo account at http://localhost:8000
./bin/verify       # run every check CI runs
```

See `docs/development/setup.md` for the tools you need and the VS Code debugging setup, and `CONTRIBUTING.md` for
how to make a change.

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
| How do I set up my machine and run the app? | `docs/development/setup.md`, `./bin/setup` |
| What should I work on? | The Issues on the Ricette Project board (`IMPLEMENTATION_PLAN.md` is historical provenance) |
| How do I run the app in production? | `docs/operations/deployment.md` |
| How do I report a security issue? | `SECURITY.md` |
| Where do I ask for help? | `SUPPORT.md` |

## License

MPL-2.0 — see `LICENSE`. Contributions are certified under the Developer
Certificate of Origin (DCO), not a CLA — see `CONTRIBUTING.md`.

## Status

Early development. Each slice of the application is built from an Issue with acceptance criteria and merged only
when the checks pass. Nothing here is released yet.
