# ADR-0014 — Internationalization Architecture

## Status

Accepted

## Context

Foundation 0 §49 treats internationalization as foundational rather than a later retrofit. Recipe and meal-planning content is inherently locale-sensitive (units, dates, quantities, RTL scripts for some locales), and retrofitting i18n onto a UI that assumed hardcoded strings and LTR layout is expensive. The decision needs to be made before component conventions solidify (§66 lists translation practices as one of the things the first vertical slice must validate).

## Decision

Adopt one canonical translation architecture (§49) with these rules:

- No hardcoded user-facing strings.
- Consistent translation keys across the codebase.
- Plural support and interpolation support.
- Locale-aware dates, numbers, and unit display.
- Fallback locale defined.
- Translation validation enforced in CI.
- Pseudo-localization used to expose layout assumptions; RTL testing/pseudo-locale support included early enough to expose directional assumptions, rather than deferred until a real RTL locale is requested.

Contribution rule (§50): user-visible contributions require translation keys in the same PR. Machine translation may assist translators but must not automatically become an authoritative production translation without appropriate review.

## Alternatives Considered

- **Add translation infrastructure later, once English-only UI stabilizes.** Rejected: Foundation 0 explicitly treats this as foundational (§49) because retrofitting is expensive — components built against hardcoded strings need rework, and layout assumptions that silently depend on LTR/short-string English text are hard to find after the fact without pseudo-localization already in place.
- **Defer RTL/pseudo-locale testing until an actual RTL locale is requested.** Rejected: §49 explicitly calls for including this "early enough to expose directional assumptions" — the value is in catching layout bugs while the component library is still small, not in supporting a specific locale.

## Rationale

Consistent with §7 (framework before dependency — use Laravel's/Svelte's native i18n primitives where they exist before adding tooling) and with the Definition of Done (§63), which lists "translations added" as a merge-blocking item for user-visible functionality.

## Consequences

- Every user-visible feature PR carries a translation-key cost; the `contribution-policy` check (§48) enforces this for user-facing functionality.
- Pseudo-localization and RTL pseudo-locale support are part of the test/dev tooling from early on, not bolted on later.
- Machine-translated strings need a review workflow before being treated as production-quality — this ADR does not specify that workflow's mechanics, only the constraint that machine translation isn't automatically authoritative.

## Conditions for Reconsideration

- If the chosen translation library/architecture proves inadequate for plural/interpolation/locale-aware formatting needs once real locales are added.

## Supersession

None. This is the initial ADR for this decision area.
