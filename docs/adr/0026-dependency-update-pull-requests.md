# ADR-0026 — Dependency Update Pull Requests

## Status

Accepted. Decided by the maintainer on 2026-09-25.

## Context

Dependabot opens pull requests to keep dependencies current. Two repository rules cannot sensibly apply to a bot: the DCO check requires a `Signed-off-by` line certifying that a person wrote or may submit the change, and the contribution-policy check requires new tests and documentation whenever a governed file such as the `Dockerfile` changes. Left as they are, both fail on every Dependabot PR.

## Decision

- **DCO.** Commits authored by Dependabot are exempt from the sign-off requirement. The exemption is identity-scoped: the pull request must be authored by `dependabot[bot]` and the commit's author must be Dependabot's own noreply identity. Any other unsigned commit, including a human commit added to a Dependabot branch, still fails.
- **Contribution policy.** A Dependabot pull request that changes only dependency and pipeline files (`composer.json`, `composer.lock`, `package.json`, `pnpm-lock.yaml`, `Dockerfile`, workflow files) is exempt from the requirement to author new tests and documentation. A Dependabot PR that touches anything else follows the normal rules.
- **Everything else still applies.** Dependabot PRs must pass every existing CI, build, test, dependency-review and security check, and still require the maintainer's merge. Auto-merge is not enabled.
- **Version policy.** Patch and minor updates are routine when the required checks pass. Major-version updates require an explicit compatibility and release-note review before merge. A release line is not rejected merely for being non-LTS; it must be supported by the toolchain and pass the required checks.
- **No generic bypass.** The exemptions are not a bot or dependency-update label that other authors can use.

## Alternatives Considered

- **Exempt only the sign-off rule and have the maintainer waive the tests and docs rule per PR.** Manual work on every update.
- **Change nothing and override red checks.** Noisy, and it teaches everyone to ignore red checks.
- **Configure Dependabot to add a sign-off.** The sign-off would be attributed to a bot, which weakens what it certifies.
- **Auto-merge patch and minor updates.** Deferred until the test suite is mature enough to trust.

## Rationale

The exemptions remove requirements that cannot be met honestly while keeping the checks that show an update actually works.

## Consequences

- The DCO and contribution-policy checks read the pull request author from the event and have self-tests for the exemption and its limits.
- Changing the exempt file list or the trusted identity is a governance change (CODEOWNERS covers the checks and workflows).

## Conditions for Reconsideration

Revisit when the test suite is mature enough for auto-merging routine updates, or if the exempt identity or file list needs to change.

## Supersession

None.
