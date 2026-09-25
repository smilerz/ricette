# ADR-0024 — Translation Architecture

## Status

Accepted. Decided by the maintainer on 2026-09-25 (ICU MessageFormat, with framework and server messages routed through the same catalogs).

## Context

ADR-0014 requires one canonical translation architecture with plural and interpolation support, locale-aware formatting, a fallback locale, CI validation and pseudo-localization, but does not choose the mechanism. Ricette is open source and international by nature, so it should expect community translators and a translation platform such as Weblate, and it must handle languages whose plural rules go beyond singular and other.

## Decision

- **One catalog per locale**: a flat JSON file `lang/{locale}.json` mapping dotted keys (`home.title`) to **ICU MessageFormat** strings. `lang/en.json` is the reference; the fallback locale is `en`.
- **ICU MessageFormat is the message syntax.** It is an established, interoperable standard with translation-platform support, and it expresses plurals for every CLDR category (zero, one, two, few, many, other), selects, and formatted numbers and dates: `{count, plural, one {# item} other {# items}}`, `Hello, {name}`.
- **Browser rendering**: the server merges the active locale over the fallback and shares the result with every Inertia page as the `translations` prop. Svelte code translates through one function, `t(key, params)`, from `resources/js/lib/i18n.ts`, which uses the `intl-messageformat` library (FormatJS). A missing key, an unparseable message, or a missing argument renders as the key so the gap is visible.
- **Server rendering**: server-side text that needs ICU features (for example email) uses PHP's `MessageFormatter` from `ext-intl`, which the image already includes, against the same catalogs. No extra dependency is needed.
- **Framework and server messages use the same catalogs.** Laravel consults JSON catalogs before its own language files, so a catalog key named like a framework message (`auth.failed`, `validation.required`, `validation.max.string`) replaces the framework's English text. Messages our own code raises are catalog keys, which the frontend translates. When a framework message reaches a user, add its key to the catalog. There is no separate server-side message path. Parameterized framework messages (`:attribute`, `:min`) are not yet expressed as ICU arguments; until they are, catalog text for those is fixed.
- **Formatting**: dates and numbers use the `Intl` APIs for the active locale, also through the translator.
- **Validation in CI**: `scripts/i18n.mjs validate` parses every message as ICU, checks that every catalog has the same keys and arguments as `en`, checks that every plural covers the categories its language requires, and checks that every key used in source exists in `en`.
- **Pseudo-localization**: `scripts/i18n.mjs pseudo` generates an accented, lengthened pseudo locale (`en-XA`) and a right-to-left variant (`en-XB`) that preserve the ICU structure, for selecting as the application locale to expose layout assumptions.

## Alternatives Considered

- **A frontend i18n framework (Paraglide, svelte-i18n).** Offers typed messages and tooling but replaces the `t()` seam with a framework; unnecessary now, and adoptable later behind `t()`.
- **A bespoke plural-key convention (`items.one`, `items.other`).** The first version of this ADR. Rejected: it is not an interoperable format, and it does not express select or formatted arguments.
- **`@messageformat/core`.** Compiles messages to functions with `new Function`, which conflicts with a strict Content-Security-Policy.
- **Laravel PHP language files only.** Poor fit for the frontend and for translation tools.

## Rationale

ICU MessageFormat is the established standard for exactly the linguistic requirements Ricette will meet, and one small, actively maintained library provides it in the browser while the image already provides it on the server. Keeping `t()` as our interface keeps the choice reversible.

## Consequences

- Adds one dependency, `intl-messageformat` (BSD-3-Clause, two small transitive dependencies), and `@formatjs/icu-messageformat-parser` for CI validation and pseudo-localization.
- Translators edit JSON files containing ICU syntax; platforms that understand ICU can check them.
- The `translations` prop ships the whole catalog on each page; if catalogs grow large, splitting by area is a later optimization.
- Framework message parameters are not yet ICU arguments (see above).

## Conditions for Reconsideration

Revisit if catalogs grow large enough that shipping them per page costs noticeably, if the library's maintenance lapses, or if a translation platform requires a different format.

## Supersession

None. Implements ADR-0014.
