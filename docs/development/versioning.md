# Versioning

Foundation 0 §59; the architectural decision is recorded in
[ADR-0017](../adr/0017-release-and-supply-chain-architecture.md).

## Policy

- **Semantic Versioning** applies once compatibility becomes meaningful,
  that is, once releases are offered for others to run and upgrade.
- **Before 1.0**, versions may break more readily than after it. A breaking
  change must still be **intentional and documented**: it appears in the
  release notes and, when it affects operators, in the upgrade documentation.
- **Database upgrade paths are product functionality.** An upgrade that
  cannot carry an installation's existing data forward is a defect in the
  release, not an operator problem. Migrations are maintained and tested
  against supported previous states (Foundation 0 §60), on both SQLite and
  PostgreSQL.

## What a release includes

The release model (Foundation 0 §58, ADR-0017) names the artifacts a release
eventually carries: a semantic version, an immutable image, release notes,
migration information, an SBOM, build provenance, and upgrade documentation.
Production artifacts come only from trusted release workflows.

## For contributors

- Do not change the version number in a feature or fix PR; versions are set
  when a release is cut.
- A change that breaks an upgrade path, a public interface, or existing data
  needs an explicit note in the PR description so it can reach the release
  notes.
