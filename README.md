# Ricette

[![CI](https://github.com/smilerz/ricette/actions/workflows/ci.yml/badge.svg?branch=main)](https://github.com/smilerz/ricette/actions/workflows/ci.yml)
[![PHP coverage](https://img.shields.io/endpoint?url=https%3A%2F%2Fraw.githubusercontent.com%2Fsmilerz%2Fricette%2Fbadges%2Fcoverage-php.json)](docs/development/testing.md)
[![JS coverage](https://img.shields.io/endpoint?url=https%3A%2F%2Fraw.githubusercontent.com%2Fsmilerz%2Fricette%2Fbadges%2Fcoverage-js.json)](docs/development/testing.md)
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

Today you can register, sign in and create a household. Recipes, meal plans and shopping lists come next. There is no release yet.

## Self-hosting

You need Docker. Nothing else is installed on your machine.

```bash
git clone https://github.com/smilerz/ricette.git
cd ricette
docker compose up -d
```

Open <http://localhost:8080> and register an account. The database is created and upgraded automatically, and your
data lives in the `ricette-data` volume. The container creates its own secret key on first start and keeps it in
that volume, so protect and back up the volume.

Anyone who can reach the server can register. Once you have your account, set `REGISTRATION_ENABLED=false` to close
sign-up, and put the app behind a reverse proxy that handles HTTPS before exposing it to the internet.
[Deployment](docs/operations/deployment.md) covers PostgreSQL, proxies, keys and upgrades.

There is no published image yet, so `docker compose` builds it from this repository.

## Developing

Open the repository in the dev container (VS Code "Reopen in Container", or GitHub Codespaces); it installs
everything. Then run `./bin/dev --seed` for the app with hot reload at <http://localhost:8000>. See
[CONTRIBUTING.md](CONTRIBUTING.md) and [docs/development/setup.md](docs/development/setup.md).

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
