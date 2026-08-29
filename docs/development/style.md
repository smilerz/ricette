# Style Policy

Style is not a human-review subject. The project has one canonical style, machine-enforced.

## PHP

Use Laravel Pint. Committed configuration defines the exact style.

## Svelte / TypeScript

Use:

- Prettier
- ESLint
- TypeScript strict mode
- `svelte-check`

No implicit `any`. Suppressions require justification.

## Repository-wide

Use:

- `.editorconfig`
- Markdown linting/formatting
- YAML validation
- JSON formatting
- GitHub Actions linting
- Dockerfile linting where practical
- documentation spelling checks

## Static Analysis

### PHP

Use PHPStan and Larastan. Start at the highest practical strictness, targeting level 10. Do not establish a large baseline of ignored debt.

### TypeScript

Use `strict: true`, plus ESLint and Svelte checking. Warnings should not become permanent background noise.
