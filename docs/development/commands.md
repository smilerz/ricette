# Canonical developer commands

Other commands: `./bin/setup` checks your tools and installs dependencies, `./bin/dev` runs the app with hot reload
and PHP debugging (`--seed` adds a demo account), and `./bin/format` applies formatting.

`./bin/verify` is the single verification entry point. CI invokes the same
targets, so a green local run means the same checks pass in CI. New checks are
added to this script rather than to a parallel command.

```text
./bin/verify                        run every target
./bin/verify lint                   Markdown, YAML, JSON, GitHub Actions, spelling
./bin/verify dco                    every commit is signed off (DCO 1.1)
./bin/verify contribution-policy    tests + docs + translations for behavioral changes
./bin/verify selftest               tests for the checks themselves
./bin/verify lockfiles              lockfiles committed and current
./bin/verify php-static             composer validate, Pint, PHPStan (level 10)
./bin/verify php-test               Pest (database from the environment)
./bin/verify frontend               Prettier, ESLint, svelte-check + tsc, Vitest, translations
./bin/verify dockerfile             Dockerfile lint
./bin/verify composer-audit         known-vulnerability audit (Composer and pnpm)
./bin/verify coverage               coverage floors and changed-code coverage
./bin/verify mutation               selective mutation testing
./bin/verify container-acceptance        deployment acceptance tests against the built image (needs Docker)
./bin/format                        apply automatic formatting
```

## Requirements

`node` (for `npx`), `jq`, and either `uvx` or `pipx`. Tool versions are pinned
inside the scripts. The PHP and frontend targets also need the toolchain in
[`docs/development/setup.md`](setup.md).

## Targets

| Target | Purpose | CI check name |
| --- | --- | --- |
| `lint` | Repo-wide, language-independent lint (Foundation 0 §30) | `lint` |
| `dco` | Sign-off enforcement (§10); range from `DCO_BASE`/`DCO_HEAD`, default `origin/main..HEAD` | `dco` |
| `contribution-policy` | Contribution contract (§25-29, §48); range from `CP_BASE`/`CP_HEAD`, labels from `CP_LABELS` | `contribution-policy` |
| `selftest` | Runs each check against throwaway repositories, including failing cases | `checks-selftest` |
| `lockfiles` | Lockfiles committed, current, and only one JavaScript package manager | `lockfiles` |
| `php-static` | Composer validation, Pint, PHPStan level 10 | `php-static` |
| `php-test` | Pest; SQLite by default, PostgreSQL via `DB_CONNECTION=pgsql` | `php-test (sqlite)`, `php-test (pgsql)` |
| `frontend` | Prettier, ESLint, svelte-check and tsc, Vitest, translation validation | `frontend` |
| `dockerfile` | Dockerfile lint | `dockerfile-lint` |
| `composer-audit` | Known-vulnerability audit for Composer and pnpm dependencies | `dependency-audit` |
| `coverage` | PHP and frontend coverage floors plus changed-code coverage | `coverage` |
| `mutation` | Mutation testing of critical pure logic | `mutation` |
| `container-acceptance` | Install, upgrade, database-wait and reverse-proxy tests against the built image (`IMAGE`, default `ricette:ci`) | `container-acceptance` |

## Contribution-policy rules

A change under a behavioral path ([`app/`](../../app/), `src/`, [`routes/`](../../routes/), [`database/`](../../database/),
[`resources/`](../../resources/), [`config/`](../../config/), [`docker/`](../../docker/), `Dockerfile`) requires a test change and a
documentation change. A change to user-facing paths ([`resources/js/`](../../resources/js/),
[`resources/views/`](../../resources/views/), [`resources/css/`](../../resources/css/)) also requires translation keys under
[`lang/`](../../lang/) or `resources/lang/`. Path classes are extended as the application
layout appears.

The `exception:no-test` and `exception:no-doc` labels waive the test and
documentation requirements respectively. They are **maintainer-applied**; a
contributor or agent cannot self-exempt (see [`CONTRIBUTING.md`](../../CONTRIBUTING.md), "Exceptions").

The check cannot verify that a bug-fix regression test fails before the fix;
that remains a review responsibility.

## Adding a check

Add an executable under [`bin/checks/`](../../bin/checks/), register it as a target in
[`bin/verify`](../../bin/verify), cover its passing and failing paths in [`tests/bin/run.sh`](../../tests/bin/run.sh), and
add a workflow that calls `./bin/verify <target>`.
