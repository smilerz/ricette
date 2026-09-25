# Ricette

[![CI](https://github.com/smilerz/ricette/actions/workflows/ci.yml/badge.svg?branch=main)](https://github.com/smilerz/ricette/actions/workflows/ci.yml)
[![Container](https://github.com/smilerz/ricette/actions/workflows/container.yml/badge.svg?branch=main)](https://github.com/smilerz/ricette/actions/workflows/container.yml)
[![Verify](https://github.com/smilerz/ricette/actions/workflows/verify.yml/badge.svg?branch=main)](https://github.com/smilerz/ricette/actions/workflows/verify.yml)
[![Code scanning](https://img.shields.io/badge/code%20scanning-CodeQL-informational.svg)](https://github.com/smilerz/ricette/security/code-scanning)
[![License: MPL-2.0](https://img.shields.io/badge/license-MPL--2.0-blue.svg)](LICENSE)
[![Last commit](https://img.shields.io/github/last-commit/smilerz/ricette)](https://github.com/smilerz/ricette/commits/main)
[![Open issues](https://img.shields.io/github/issues/smilerz/ricette)](https://github.com/smilerz/ricette/issues)
![PHP 8.4](https://img.shields.io/badge/PHP-8.4-777bb4.svg)
![Laravel 13](https://img.shields.io/badge/Laravel-13-ff2d20.svg)
![Svelte 5](https://img.shields.io/badge/Svelte-5-ff3e00.svg)
![Status: early development](https://img.shields.io/badge/status-early%20development-orange.svg)

Ricette is a self-hostable recipe and meal-planning app. The name is a working title.

Today you can register, sign in and create a household. Recipes, meal plans and shopping lists come next. There is no release yet, so nothing is published to a registry.

## Run it

Open the repository in the [dev container](.devcontainer/devcontainer.json): VS Code with the Dev Containers extension ("Reopen in Container"), or GitHub Codespaces. The first start installs everything, including PHP, Node, the project dependencies and the test browser. Then:

```bash
./bin/dev --seed
```

The app is at <http://localhost:8000>. Log in as `demo@example.com` with `correct horse battery staple`. Saving a Svelte, CSS or PHP file updates the page without a rebuild.

Without a container, `./bin/setup` tells you which tools your machine is missing. Details, including debugging, are in [docs/development/setup.md](docs/development/setup.md).

## Checks

`./bin/verify` runs the same checks CI does. [docs/development/commands.md](docs/development/commands.md) lists them.

## Stack

Laravel 13, Svelte 5 and Inertia 3, on SQLite by default or PostgreSQL. Deployed as a container image. The reasons are in the [ADRs](docs/adr/).

## Contributing

Start with [CONTRIBUTING.md](CONTRIBUTING.md). Work is tracked as issues on the project board. Commits need a DCO sign-off (the `-s` flag); there is no CLA. Questions go in [SUPPORT.md](SUPPORT.md). Report security problems as described in [SECURITY.md](SECURITY.md), not as public issues.

## More

- [Deployment](docs/operations/deployment.md)
- [Architecture principles](docs/architecture/principles.md)
- [Governance](GOVERNANCE.md)
- [Rules for AI coding agents](AGENTS.md)
- [Provenance](PROVENANCE.md)

## License

[MPL-2.0](LICENSE)
