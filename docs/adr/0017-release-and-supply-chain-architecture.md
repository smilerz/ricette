# ADR-0017 — Release and Supply-Chain Architecture

## Status

Accepted

## Context

Foundation 0 §5 commits the community edition to a single-container deployment model, and §58 names the container image as the supported release artifact. Self-hosted users need a trustworthy, reproducible way to receive updates without operating infrastructure beyond the container itself; hosted operation needs the same artifact to remain the basis for scaling (§7.7 — scale extends rather than replaces).

## Decision

- **Supported artifact**: OCI/Docker image. Target architectures: `linux/amd64` and `linux/arm64` (§58).
- **Release artifacts** eventually include: semantic version, immutable image, release notes, migration information, SBOM, build provenance/attestation, upgrade documentation. Production artifacts come only from trusted release workflows (§58).
- **Versioning** (§59): Semantic Versioning once compatibility becomes meaningful. Pre-1.0 versions may break more readily, but breaking changes must still be intentional and documented. Database upgrade paths are product functionality and must be maintained, not an afterthought.
- **Migration testing** (§60): migrations tested against supported previous states. Upgrade fixtures verify migration succeeds, existing data survives, constraints remain valid, and the application boots afterward — tested on both SQLite and PostgreSQL.
- **Supply-chain security** (§35): Dependabot, dependency review, secret scanning, push protection, container vulnerability scanning, package-license checks, SBOM generation, artifact provenance, pinned external GitHub Actions to immutable revisions where practical. Short-lived federated/OIDC credentials preferred over long-lived cloud secrets for hosted deploys when supported.

## Alternatives Considered

- **Ship platform-native packages (deb/rpm/Homebrew) instead of/alongside a container.** Rejected for the initial release model: a single container artifact matches the community deployment contract's "one application container, one persistent volume" requirement (§5) more directly, and avoids maintaining multiple packaging pipelines before the project has proven its core.
- **Skip SBOM/provenance/attestation until the project has real users.** Rejected: supply-chain tooling is cheap to establish early and expensive to retrofit once a release history exists without it (§35 lists it as day-one tooling, not a later hardening pass).
- **amd64-only initial target.** Rejected: arm64 is explicitly named alongside amd64 in §58, reflecting real self-hosting hardware (e.g. Raspberry Pi-class devices, Apple Silicon dev/prod parity) rather than a later nice-to-have.

## Rationale

A single trustworthy artifact keeps the community deployment contract (§5) honest — "users should not need to understand Laravel's underlying serving architecture" only holds if the container is genuinely the interface, backed by real provenance and migration guarantees rather than an unverified build.

## Consequences

- CI must build and test both target architectures before a release is considered valid.
- Migration upgrade-fixture testing is required infrastructure, not optional — this is real ongoing test-maintenance cost as the schema evolves.
- Production artifacts require a trusted release workflow to exist before any release can happen — this is a prerequisite that must be built before the first tagged release, not before Foundation 0 is considered complete.

## Conditions for Reconsideration

- If self-hosting demand for a non-container packaging format (e.g. a native package manager) becomes significant enough to justify a second supported artifact.
- If SemVer's pre-1.0 breaking-change allowance causes real upgrade pain for early self-hosters, prompting an earlier-than-planned 1.0.

## Supersession

None. This is the initial ADR for this decision area.
