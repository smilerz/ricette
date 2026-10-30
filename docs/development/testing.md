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

## Test Quality Practices

Tests exist to catch wrong behavior, not to show that code ran.

- **Test the effect, not the forwarding.** A prop or flag that is declared but never used passes a test that only checks the value was passed. Assert what the user or the caller observes.
- **Give every negative assertion a positive control.** "X is not shown" proves nothing unless the same test shows X appears when it should. Assert the real outcome (the router navigated, the request was sent), not a framework side effect.
- **Test the whole chain once.** Exercise the real client with only the network mocked, and assert what goes on the wire, so a bug between the component and the request cannot hide behind mocks.
- **Use realistic data.** Long names, many items and non-Latin text expose layout and truncation problems that short fake data hides. When a screenshot is part of the check, read it; a full-page capture can hide the viewport problem.
- **Label tests honestly.** Say whether a test was written first for new behavior or is regression coverage of existing behavior. A bug fix still needs a test that fails before the fix.
- **Believe a result only after seeing it fail first**, then pass for the reason you expect. A real browser check beats a diagnosis from reading code.
- **Check that what you are looking at is what you changed.** A stale service worker, cached assets, or a server started in the wrong mode produce false "it did not work" results. Confirm the served build is the current one before concluding anything.
