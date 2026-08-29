# ADR-0013 — Dependency Governance

## Status

Accepted

## Context

Foundation 0 §7.8 establishes framework-before-dependency as a core architectural invariant: before adding a package, determine whether Laravel/Svelte already provides the capability, evaluate a mature package only if not, and build custom infrastructure only when justified. Without a documented admission process, this invariant erodes one convenient package at a time, and an AI-driven development model (§17) makes that erosion faster, not slower, since an agent can add a dependency in the time it takes to solve a problem the framework already solves.

## Decision

Adopt the following dependency admission policy (§34):

1. **Decision order**: framework-native implementation, then a mature community dependency, then custom implementation.
2. **Justification required** for every new package, documenting: problem solved; why current framework capability is insufficient; project maturity; maintenance activity; license; transitive dependency impact; security implications; self-hosting consequences; replacement difficulty.
3. **Committed lockfiles are mandatory** (composer.lock, the JS package manager's lockfile).
4. **One JavaScript package manager only.** Recommended initial choice: pnpm, unless Laravel's official scaffolding creates meaningful friction outweighing pnpm's dependency-management advantages. The final choice gets its own small tooling decision record (§68) — that record is a lighter-weight operational note, not a re-opening of this ADR's policy.
5. **Supply-chain tooling** (§35): Dependabot, dependency review, secret scanning, push protection, container vulnerability scanning, package-license checks, SBOM generation, artifact provenance, pinned external GitHub Actions to immutable revisions where practical; short-lived federated/OIDC credentials preferred over long-lived cloud secrets for hosted deploys when supported.

## Alternatives Considered

- **No formal admission process, trust reviewer judgment case by case.** Rejected: reviewer judgment alone doesn't scale against an AI-driven contribution model that can propose dependencies faster than ad hoc review can catch unjustified ones (§20 "dependencies introduced to avoid simple native code" is a named AI failure mode).
- **Allow either npm or pnpm depending on contributor preference.** Rejected: two lockfiles for the same ecosystem produce silent drift and doubled CI/cache surface for no benefit.

## Rationale

Matches §7.8 and closes the specific AI-review gap named in §20/§22 (dependencies added to avoid simple native code, or duplicating framework functionality). The justification fields make dependency admission an explicit, reviewable decision rather than an implicit one.

## Consequences

- Every dependency-adding PR must include the justification fields above; the `project-policy-review` check (§21) and human CODEOWNER review (composer.json/package.json are CODEOWNERS-protected per §24) both check for this.
- The pnpm-vs-alternative choice remains open as an operational detail, not blocked by this ADR.
- Adds a small amount of friction to adding dependencies, by design — friction on this specific action is the point.

## Conditions for Reconsideration

- If the justification-field process proves to be pure ceremony (never actually blocks an unjustified dependency) rather than a working gate.
- If Laravel's official scaffolding makes a non-pnpm package manager clearly preferable — recorded as the small tooling decision record referenced above, not a supersession of this ADR.

## Supersession

None. This is the initial ADR for this decision area.
