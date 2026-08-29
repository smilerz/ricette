# ADR-0012 — Testing and Coverage Policy

## Status

Accepted

## Context

The project needs testing layers matched to its stack (Laravel domain/backend, Svelte frontend, dual-database persistence) and quality gates that catch AI-generated superficial or implementation-derived tests, not just raw line coverage.

## Decision

### Testing layers

- **Domain/unit (Pest):** quantities, unit conversion, food hierarchy, entitlement logic, transformations, domain invariants.
- **Laravel feature/integration:** routing, authorization, validation, transactions, persistence, jobs, Inertia responses, security boundaries.
- **Svelte component (Vitest + Testing Library):** user interactions, state transitions, component contracts, accessibility behavior.
- **Browser (Playwright):** reserved for meaningful end-to-end journeys (account creation, household setup, recipe create/edit, food hierarchy manipulation, recipe import, meal planning, shopping, inventory). Do not reproduce every unit test through Playwright.

### Dual-database testing

CI must test core persistence against both SQLite and PostgreSQL: migrations, constraints, model behavior, hierarchy queries, transactions, queue persistence behavior, search abstractions, upgrade paths. A green PostgreSQL suite is not sufficient if community SQLite is broken.

### Coverage policy

Coverage is a floor, not proof of correctness.

- PHP: global line coverage ≥85%, changed-code coverage ≥95%.
- Frontend: global line/statement coverage ≥85%, global branch coverage ≥80%, changed-code coverage ≥95%.

Changed-code coverage prevents accumulated historical coverage from hiding poorly tested new work.

### Critical-code coverage

Critical decision paths (authorization, household boundaries, entitlement logic, unit conversion, quantity calculations, importer security, billing state changes) should approach complete *meaningful* coverage. Line coverage alone is insufficient for these paths.

### Mutation testing

Use selective mutation testing for critical pure logic: units, quantities, entitlement rules, permission predicates, hierarchy invariants, billing state transitions. This is particularly valuable in an AI-heavy environment because superficially impressive tests may simply encode the implementation rather than the requirement.

## Alternatives Considered

- **A single test layer (e.g. only feature tests, or only browser tests):** rejected — feature/browser-only testing is too slow and coarse for domain-logic edge cases (unit conversion, entitlement predicates), while unit-only testing misses integration/authorization/persistence failures.
- **Line coverage as the sole quality gate:** rejected — explicitly insufficient per Foundation 0; a test suite can hit high line coverage while asserting nothing meaningful, especially with AI-generated tests derived from the implementation rather than the requirement.
- **Testing only against PostgreSQL (the "real" production database) and treating SQLite as best-effort:** rejected — directly contradicts the community deployment model (ADR-0005/0006), where SQLite is the default and must be first-class, not an afterthought.

## Rationale

Layered testing matched to each part of the stack, combined with changed-code coverage and selective mutation testing, catches the specific AI-development failure modes (superficial coverage, implementation-derived tests) that raw aggregate coverage numbers would miss.

## Consequences

- CI must run a real SQLite+PostgreSQL matrix, which adds pipeline time and complexity from day one of application development.
- Mutation testing tooling must be selected (tracked as a small tooling decision, not gating this ADR) and scoped narrowly to avoid prohibitive CI cost.
- Coverage thresholds are enforced as CI gates; a PR that drops below them fails `contribution-policy`/`./bin/verify` rather than merging on a promise to fix it later.

## Conditions for Reconsideration

If coverage thresholds prove to generate meaningless test churn rather than genuine defect prevention, or if the dual-database CI matrix becomes a disproportionate maintenance burden relative to the defects it catches.

## Supersession

None. This is the initial ADR for this decision area.
