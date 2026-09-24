# Dependency Policy

Before adding a package: (1) determine whether Laravel/Svelte already provides the capability; (2) evaluate a mature package if not; (3) build custom infrastructure only when justified. This is the framework-before-dependency invariant (Architecture Principles §7.8).

## Decision order

1. framework-native implementation
2. mature community dependency
3. custom implementation

## Required justification

Every new package requires justification. At minimum document:

- problem solved
- why current framework capability is insufficient
- project maturity
- maintenance activity
- license
- transitive dependency impact
- security implications
- self-hosting consequences
- replacement difficulty

## Lockfiles and package manager

Committed lockfiles are mandatory. Use one JavaScript package manager only.

Recommended initial choice: **pnpm**, unless Laravel's official scaffolding creates meaningful friction that outweighs its dependency-management advantages. The final choice receives a small tooling decision record.

## Supply-Chain Security

Enable from the beginning:

- Dependabot
- dependency review
- secret scanning
- push protection
- container vulnerability scanning
- package-license checks
- SBOM generation
- artifact provenance
- pinned external GitHub Actions

## GitHub Actions pinning

Every external GitHub Action (any `uses:` that is not a local `./` path) is
pinned to a **full 40-character commit SHA**, with the release tag in a trailing
comment for readability:

```yaml
- uses: actions/checkout@3d3c42e5aac5ba805825da76410c181273ba90b1 # v7.0.1
```

Tags and branches are mutable, so they are not accepted. Dependabot's
`github-actions` ecosystem proposes SHA updates. A workflow that cannot be
pinned (for example, an action distributed only through a mutable reference)
needs an explicit justification in the PR that adds it.

Hosted cloud deployments should use short-lived federated/OIDC credentials instead of long-lived cloud secrets when supported.
