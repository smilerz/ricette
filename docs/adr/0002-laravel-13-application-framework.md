# ADR-0002 — Laravel 13 Application Framework

## Status

Accepted

## Context

The application needs a single backend framework to own domain models, canonical business rules, persistence, migrations, authentication, authorization, validation, transactions, background jobs, imports, storage abstractions, server-side search abstractions, application routing, and entitlement evaluation (§3), across both a self-hosted SQLite deployment and a hosted PostgreSQL deployment (§5, §6). Foundation 0's dependency principle (§7.8) requires checking framework-native capability before reaching for a package, and custom infrastructure only when justified — which favors a framework with broad first-party coverage of these concerns over assembling them from smaller libraries.

## Decision

Use **Laravel 13** as the backend application framework, owning all responsibilities listed in §3.

## Alternatives Considered

- **Ruby on Rails.** Comparable batteries-included philosophy; rejected in favor of Laravel for this project's PHP-ecosystem fit and first-party coverage of the specific needs (queues, Eloquent ORM behavior across SQLite/PostgreSQL, first-party auth/authorization primitives).
- **Elixir/Phoenix.** Strong for real-time/concurrent workloads, but a smaller ecosystem match for this domain's needs (import/parsing, ORM-driven hierarchical data, broad package availability) and a steeper adoption cost for contributors.
- **Django.** Comparable batteries-included Python framework; rejected in favor of staying within a framework/ecosystem better aligned with the chosen frontend integration path (Inertia has first-class Laravel support) and the target deployment simplicity (§5).
- **Lighter/micro-frameworks (e.g. Slim, Lumen-style).** Rejected: would require assembling auth, authorization, queues, migrations, and ORM from separate packages, working against §7.8's framework-before-dependency principle and increasing the community deployment's operational surface.

## Rationale

Laravel provides first-party, well-maintained implementations of nearly every responsibility §3 assigns to the backend, works well against both SQLite and PostgreSQL (§7.2, §7.3), and has first-class Inertia integration, directly supporting the single-frontend architecture in ADR-0003.

## Consequences

- The application's domain logic, persistence, and authorization all live inside Laravel conventions (Eloquent, policies, form requests, jobs) — deviating from these conventions later would be a meaningful architecture change requiring its own ADR (§28).
- Community deployment can rely on Laravel's built-in queue-via-database and SQLite support to avoid mandating Redis or an external queue (§5).
- Ties core application development to the PHP/Laravel release and support cadence.

## Conditions for Reconsideration

- If Laravel drops or degrades first-class SQLite support, or Inertia support for Laravel becomes unmaintained with no viable alternative.
- If a future major version introduces breaking changes incompatible with the dual-database (§7.2/§7.3) or community deployment (§5) invariants.

## Supersession

None. This is the initial ADR for this decision area.
