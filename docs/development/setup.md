# Development setup

The application is Laravel 13 with Svelte 5 and Inertia 3 (ADR-0002, ADR-0003).

## Requirements

- PHP 8.4 with the `pdo_sqlite`, `pdo_pgsql`, `intl`, `zip` and `mbstring` extensions, and Composer 2
- Node 22 or newer and pnpm (ADR-0020; the exact version is pinned in `package.json`)
- `uvx` or `pipx`, `jq`, and `npx` for the repository-wide checks
- A PHP coverage driver (`pcov` or `xdebug`) to run the coverage and mutation checks locally

## First run

```bash
composer install
pnpm install
cp .env.example .env
php artisan key:generate
php artisan migrate
pnpm run build
php artisan serve
```

Use `pnpm run dev` for hot module replacement while developing.

## Everything CI runs

```bash
./bin/verify
```

Targets run individually with `./bin/verify <target>`; see `docs/development/commands.md`.
`./bin/format` applies the automatic formatting.

## Databases

SQLite is the default and needs no setup. To run the tests against PostgreSQL, set `DB_CONNECTION=pgsql`
with the `DB_HOST`, `DB_PORT`, `DB_DATABASE`, `DB_USERNAME` and `DB_PASSWORD` variables before
`./bin/verify php-test`. CI runs both (ADR-0006).

## Translations

All user-visible text lives in `lang/en.json` (ADR-0024). `pnpm run i18n:validate` checks the catalogs;
`node scripts/i18n.mjs pseudo` writes a pseudo locale you can select with `APP_LOCALE=en-XA`.

## Container

```bash
docker build -t ricette .
docker run --rm -p 8080:8080 -e APP_KEY="$(php artisan key:generate --show)" -v ricette-data:/data ricette
```

Migrations do not run automatically yet; that is separate deployment work.
