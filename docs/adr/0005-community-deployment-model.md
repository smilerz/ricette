# ADR-0005 — Community Deployment Model

## Status

Accepted

## Context

The project has two deployment paths: community/self-hosted (free, no vendor account, fully useful offline from hosted services) and hosted/freemium (§1). Without an explicit deployment contract, hosted-engineering convenience (e.g. "just require Redis, it's easier") tends to leak into the community path over time, eroding the "extremely simple to deploy" goal and creating a two-tier product where self-hosting becomes second-class.

## Decision

The normal self-hosted installation requires only: one application container, one persistent volume, SQLite, local media storage, and database-backed background processing.

It must **not** require: PostgreSQL, Redis, an external queue, Elasticsearch/Typesense/Meilisearch, a message broker, external object storage, an application-specific reverse-proxy configuration, a vendor account, a license server, hosted telemetry, or external AI services.

Optional infrastructure may be supported, but cannot become mandatory for core community functionality without a new approved ADR. The supported deployment artifact is the container image; users should not need to understand Laravel's underlying serving architecture.

## Alternatives Considered

- **Require PostgreSQL even for self-hosting, for engineering simplicity (one database to support).** Rejected: directly increases the self-hosting barrier (§1's "extremely simple to deploy, no required external infrastructure") in exchange for developer convenience; addressed instead via ADR-0006's dual-database first-class support.
- **Require Redis/an external queue for background jobs universally.** Rejected: Laravel's database-backed queue driver is sufficient for community scale and keeps the "one container, one volume" deployment story intact.

## Rationale

Preserves the self-hosted product as genuinely simple and infrastructure-free (§1, §5), while hosted deployment (ADR to be captured when that architecture is built out) can layer on additional infrastructure where it earns its cost (§6).

## Consequences

- Any feature requiring one of the excluded infrastructure pieces as a hard dependency needs either a community-compatible fallback or a new ADR explicitly relaxing this contract.
- CI must exercise the community deployment path (SQLite, single container) so this contract doesn't silently rot as features are added (feeds Foundation Implementation Plan Phase 11/44 dual-database testing).
- Constrains architecture choices in every subsequent feature ADR — e.g. search must have a community-compatible abstraction rather than assuming Elasticsearch/Typesense/Meilisearch.

## Conditions for Reconsideration

- If a specific optional infrastructure piece becomes so central to core functionality that community usefulness is genuinely degraded without it — that would require an explicit new ADR, not a silent requirements creep.

## Supersession

None. This is the initial ADR for this decision area.
