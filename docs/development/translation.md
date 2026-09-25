# Translation / Internationalization Policy

Internationalization is foundational.

## Rules

- no hardcoded user-facing strings
- consistent translation keys
- one canonical translation architecture
- plural support
- interpolation support
- locale-aware dates
- locale-aware numbers
- locale-aware unit display
- fallback locale
- translation validation in CI

Use pseudo-localization to expose layout assumptions. Include RTL testing/pseudo-locale support early enough to expose directional assumptions.

## Translation Contributions

User-visible contributions require translation keys in the same PR.

Machine translation may assist translators. Machine-produced translations should not automatically become authoritative production translations without appropriate review.

## Writing and adding strings

Messages live in `lang/*.json` as ICU MessageFormat strings (ADR-0024). Write plurals with the ICU plural
syntax, for example `{count, plural, one {# recipe} other {# recipes}}`, and name the arguments. Use
`t('key', { count: 3 })` in Svelte and `__('key')` or a catalog key in PHP. Every language needs every plural
category it uses; `pnpm run i18n:validate` checks this along with keys and arguments. A message that Laravel
itself raises reaches the user through the same catalog: add a key named like the framework's (for example
`auth.failed`) to `lang/en.json`.
