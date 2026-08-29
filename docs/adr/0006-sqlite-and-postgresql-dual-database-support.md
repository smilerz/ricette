# ADR-0006 — SQLite and PostgreSQL Dual-Database Support

## Status

Accepted

## Context

ADR-0005 requires SQLite for community self-hosting; the hosted edition (§6) needs to scale to PostgreSQL. Supporting both without one silently degrading into a second-class citizen requires an explicit commitment and a testing strategy, not just "SQLite for dev, Postgres for prod" as an informal convention that erodes as Postgres-specific features get added under deadline pressure.

## Decision

Both **SQLite** and **PostgreSQL** are first-class databases (§7.2, §7.3):

- Core functionality and migrations must operate on SQLite.
- PostgreSQL-specific behavior may exist behind explicitly designed abstractions, but cannot silently become required for core functionality.
- Hosted behavior must be continuously tested against PostgreSQL.
- CI tests core persistence (migrations, constraints, model behavior, hierarchy queries, transactions, queue persistence behavior, search abstractions, upgrade paths) against **both** databases (§44). A green PostgreSQL suite is not sufficient if community SQLite is broken.

## Alternatives Considered

- **SQLite only, add PostgreSQL support later if hosted scale demands it.** Rejected: retrofitting portability after Postgres-specific assumptions (JSON operators, full-text search, concurrent-write patterns) have accreted into the domain layer is materially harder than designing for both from the start.
- **PostgreSQL only, drop SQLite for self-hosting.** Rejected: directly conflicts with ADR-0005's community deployment contract, which depends on SQLite requiring no external database server.
- **Support both, but only test PostgreSQL in CI (treat SQLite as "probably fine").** Rejected: this is exactly the failure mode §44 calls out — a green PostgreSQL suite provides no assurance SQLite still works, and portability bugs (e.g. an unsupported SQL construct) would only surface for self-hosted users after release.

## Rationale

Moving from SQLite to PostgreSQL, or from one process to many, should extend rather than replace core product behavior (§7.7) — dual-database CI is what keeps that invariant true in practice rather than aspiration.

## Consequences

- Every migration and query touching core domain behavior must be written (or abstracted) to work on both engines; database-specific SQL requires an explicit abstraction boundary.
- CI cost roughly doubles for persistence-layer tests (run against both engines) — accepted as the cost of the portability guarantee.
- Search and other engine-sensitive capabilities need a database-agnostic abstraction at the community tier, with room for a specialized backend (Elasticsearch/Typesense/Meilisearch) only as optional hosted-tier infrastructure (§5, §6).

## Conditions for Reconsideration

- If SQLite's write-concurrency characteristics genuinely block a core community feature with no workable abstraction — that would require an explicit ADR weighing the community deployment contract (ADR-0005) against the specific feature need, not a quiet drop of SQLite support.

## Supersession

None. This is the initial ADR for this decision area.
