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
