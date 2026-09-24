# ADR-0024 — Translation Architecture

## Status

Proposed (becomes Accepted when the maintainer merges the PR that introduces it)

## Context

ADR-0014 requires one canonical translation architecture with plural and interpolation support, locale-aware formatting, a fallback locale, CI validation and pseudo-localization, but does not choose the mechanism. The first application PR renders a page and must not hardcode user-visible text, so the mechanism has to exist now.

## Decision

- **One catalog per locale**: a flat JSON file `lang/{locale}.json` mapping dotted keys (`home.title`) to strings. `lang/en.json` is the reference; the fallback locale is `en`.
- **Delivery**: the server merges the active locale over the fallback and shares the result with every Inertia page as the `translations` prop. Svelte code translates through one function, `t(key, params)`, from `resources/js/lib/i18n.ts`. Server-side code uses Laravel's `__()` against the same files.
- **Interpolation**: `{name}` placeholders.
- **Plurals**: CLDR plural categories as key suffixes (`items.one`, `items.other`), chosen with `Intl.PluralRules` from a numeric `count` parameter.
- **Formatting**: dates and numbers use the `Intl` APIs for the active locale through the same translator.
- **Validation in CI**: `scripts/i18n.mjs validate` checks every catalog against `en` for missing and unknown keys and mismatched placeholders, and checks that every key used in source exists in `en`.
- **Pseudo-localization**: `scripts/i18n.mjs pseudo` generates an accented, lengthened pseudo locale (`en-XA`) and a right-to-left variant (`en-XB`) that can be selected as the application locale to expose layout assumptions.

## Alternatives Considered

- **A frontend i18n library (for example svelte-i18n or Paraglide).** Adds a dependency for behavior the platform's `Intl` APIs already provide, against the framework-before-dependency rule (ADR-0013).
- **Laravel PHP array language files only.** Poor fit for keys consumed by the frontend and for plural categories beyond Laravel's two-form syntax.
- **ICU MessageFormat.** More expressive than the current need; can be adopted later behind `t()` without changing call sites.

## Rationale

Flat JSON files are readable by both the server and the browser, keep one source of truth, and need no new dependency. Category-suffixed keys give correct plurals for every locale.

## Consequences

- Translators edit JSON files; a missing key renders as the key itself so the gap is visible.
- Server-originated pluralized messages are not yet needed; a server-side helper for the same suffix convention is added with the first such message.
- The `translations` prop ships the whole catalog on each page; if catalogs grow large, splitting by area is a later optimization.

## Conditions for Reconsideration

Revisit if catalogs grow large enough that shipping them per page costs noticeably, or if messages need formatting that suffix keys and placeholders cannot express.

## Supersession

None. Implements ADR-0014.
