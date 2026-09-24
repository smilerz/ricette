# ADR-0020 — JavaScript Package Manager

## Status

Proposed (becomes Accepted when the maintainer merges the PR that introduces it)

## Context

Foundation 0 §34 requires committed lockfiles and a single JavaScript package manager. `docs/development/dependencies.md` recommends **pnpm** "unless Laravel's official scaffolding creates meaningful friction that outweighs its dependency-management advantages" and defers the final choice to a small tooling decision record. No JavaScript project exists yet; the first Application Foundation PR introduces it, so the choice must exist before that PR.

## Decision

Use **pnpm** as the only JavaScript package manager. The committed lockfile is `pnpm-lock.yaml`; no other package manager's lockfile is committed. CI installs with a frozen lockfile.

## Alternatives Considered

- **npm** — the default in Laravel's scaffolding and the lowest-friction path. Rejected as the primary choice because pnpm's strict, non-flattened `node_modules` surfaces undeclared (phantom) dependencies that npm silently allows, which serves the dependency-governance goals in §34.
- **Yarn** — comparable to pnpm in capability, with a more fragmented ecosystem across major versions. No advantage over pnpm here.
- **Bun** — combines runtime and package manager, adding a second JavaScript runtime to the toolchain that the supported deployment model (§5) does not otherwise need.

## Rationale

pnpm gives deterministic installs from a single committed lockfile, strictness that catches undeclared dependencies, and efficient CI caching, while remaining compatible with Vite and the Svelte/Inertia toolchain the stack (ADR-0004) uses. It matches the recommendation already recorded in `docs/development/dependencies.md`.

## Consequences

- Contributors need pnpm (activated through Corepack) to work on the frontend.
- Laravel scaffolding defaults to npm, so the Application Foundation PR converts the scaffold to pnpm and commits `pnpm-lock.yaml`.
- Dependabot and CI configuration for the frontend use the `npm` ecosystem identifier, which GitHub applies to pnpm lockfiles.

## Conditions for Reconsideration

Revisit if the Application Foundation PR shows that pnpm cannot be used with the Laravel/Vite/Svelte toolchain without workarounds that cost more than they save, or if pnpm ceases to be maintained.

## Supersession

None.
