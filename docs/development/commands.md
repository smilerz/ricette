# Canonical developer commands

`./bin/verify` is the single verification entry point. CI invokes the same
targets, so a green local run means the same checks pass in CI. New checks are
added to this script rather than to a parallel command.

```text
./bin/verify                        run every target
./bin/verify lint                   Markdown, YAML, JSON, GitHub Actions, spelling
./bin/verify dco                    every commit is signed off (DCO 1.1)
./bin/verify contribution-policy    tests + docs + translations for behavioral changes
./bin/verify selftest               tests for the checks themselves
./bin/format                        apply automatic formatting
```

## Requirements

`node` (for `npx`), `jq`, and either `uvx` or `pipx`. Tool versions are pinned
inside the scripts.

## Targets

| Target | Purpose | CI check name |
| --- | --- | --- |
| `lint` | Repo-wide, language-independent lint (Foundation 0 §30) | `lint` |
| `dco` | Sign-off enforcement (§10); range from `DCO_BASE`/`DCO_HEAD`, default `origin/main..HEAD` | `dco` |
| `contribution-policy` | Contribution contract (§25-29, §48); range from `CP_BASE`/`CP_HEAD`, labels from `CP_LABELS` | `contribution-policy` |
| `selftest` | Runs each check against throwaway repositories, including failing cases | `checks-selftest` |

## Contribution-policy rules

A change under a behavioral path (`app/`, `src/`, `routes/`, `database/`,
`resources/`, `config/`, `docker/`, `Dockerfile`) requires a test change and a
documentation change. A change to user-facing paths (`resources/js/`,
`resources/views/`, `resources/css/`) also requires translation keys under
`lang/` or `resources/lang/`. Path classes are extended as the application
layout appears.

The `exception:no-test` and `exception:no-doc` labels waive the test and
documentation requirements respectively. They are **maintainer-applied**; a
contributor or agent cannot self-exempt (see `CONTRIBUTING.md`, "Exceptions").

The check cannot verify that a bug-fix regression test fails before the fix;
that remains a review responsibility.

## Adding a check

Add an executable under `bin/checks/`, register it as a target in
`bin/verify`, cover its passing and failing paths in `tests/bin/run.sh`, and
add a workflow that calls `./bin/verify <target>`.
