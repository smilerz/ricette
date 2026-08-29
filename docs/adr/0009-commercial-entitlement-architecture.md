# ADR-0009 — Commercial Entitlement Architecture

## Status

Accepted

## Context

The project has both a free community edition and a hosted/freemium edition sharing one core application (per the community/hosted deployment model). Commercial capabilities (hosted AI processing, premium AI workflows, enhanced mobile functionality, additional households, commercial integrations, advanced automation, hosted operational features) need to be gated by subscription/environment without hardcoding plan checks throughout the domain code, and without ever gating security or basic data rights.

## Decision

Commercial logic must use capability abstractions, never direct plan checks.

Forbidden:

```text
if user.plan == "premium"
```

Required conceptually:

```text
entitlements.can("ai_import")
```

Establish abstractions equivalent to:

- `CapabilityRegistry`
- `EntitlementResolver`
- `BillingGateway`

This separates **product capability** (what the application can do) from **packaging** (which subscription or environment grants that capability). Packaging may change without rewriting features.

Commercial invariants that hold regardless of packaging:

- Community installs require no license server.
- Community telemetry is opt-in; no required behavioral tracking.
- The billing provider (e.g. Stripe) is an adapter behind `BillingGateway`, never a fundamental domain dependency.
- Security fixes and basic account protection cannot be withheld based on plan.
- Backup and data portability are not premium — users can always back up and export their own data.
- Hosted operation itself (hosting, upgrades, backups, support, availability, AI services, integrations, premium capabilities) is legitimate commercial value without intentionally degrading the open product.

## Alternatives Considered

- **Direct plan-string checks scattered through domain code (`if user.plan == "premium"`):** rejected — couples domain logic to packaging, makes packaging changes require code changes throughout the codebase, and is explicitly the forbidden pattern.
- **A single monolithic "PremiumFeatures" flag/service instead of granular capabilities:** rejected — doesn't scale to multiple independent commercial capabilities (AI, mobile, integrations, automation) each with potentially different packaging rules; a capability registry with per-capability resolution is more composable.
- **Forking the application into separate community/commercial codebases:** rejected — explicitly contrary to the "one application core" invariant; would require maintaining two implementations and defeats the stated monetization model (capabilities/entitlements, not a forked app).

## Rationale

Separating capability from packaging lets the business change pricing/packaging without touching feature code, and structurally prevents the anti-patterns (billing coupling, premium-gated security/data-rights) that would undermine the community edition's genuineness.

## Consequences

- Every commercial feature must be built behind an entitlement check from day one, even before a real billing system exists — retrofitting entitlement abstractions onto features built with direct plan checks is expensive.
- `EntitlementResolver`/`CapabilityRegistry`/`BillingGateway` need concrete design (data model for capabilities, resolution rules, adapter interface) before the first commercial feature ships — tracked as implementation work, not resolved by this ADR alone.
- Any PR introducing a plan-string check in domain code should fail review under this ADR.

## Conditions for Reconsideration

If the capability/entitlement abstraction proves to add meaningful overhead without corresponding flexibility benefit once real commercial features exist.

## Supersession

None. This is the initial ADR for this decision area.
