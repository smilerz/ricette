# Testing Policy

## Testing Architecture

### Domain/unit

Use Pest. Focus on: quantities, unit conversion, food hierarchy, entitlement logic, transformations, domain invariants.

### Laravel feature/integration

Test: routing, authorization, validation, transactions, persistence, jobs, Inertia responses, security boundaries.

### Svelte component

Use Vitest and Testing Library. Test: user interactions, state transitions, component contracts, accessibility behavior.

### Browser

Use Playwright. Reserve browser tests for meaningful end-to-end workflows.

## Browser-Test Priorities

Initial user journeys eventually include:

- account creation
- household setup
- recipe creation
- recipe editing
- food hierarchy manipulation
- recipe importing
- meal planning
- shopping interaction
- inventory interaction

Do not reproduce every unit test through Playwright.

## Dual-Database Testing

CI must test core persistence against SQLite and PostgreSQL. At minimum: migrations, constraints, model behavior, hierarchy queries, transactions, queue persistence behavior, search abstractions, upgrade paths.

A green PostgreSQL test suite is not sufficient if community SQLite is broken.

## Coverage Policy

Coverage is a floor, not proof of correctness.

### PHP

- global line coverage >= 85%
- changed-code coverage >= 95%

### Frontend

- global line/statement coverage >= 85%
- global branch coverage >= 80%
- changed-code coverage >= 95%

Changed-code coverage prevents accumulated historical coverage from hiding poorly tested new work.

## Critical-Code Coverage

Critical decision paths should approach complete meaningful coverage. Examples: authorization, household boundaries, entitlement logic, unit conversion, quantity calculations, importer security, billing state changes. Line coverage alone is insufficient.

## Mutation Testing

Use selective mutation testing for critical pure logic. Likely targets: units, quantities, entitlement rules, permission predicates, hierarchy invariants, billing state transitions.

Mutation testing is particularly valuable in an AI-heavy environment because superficially impressive tests may simply encode the implementation.
