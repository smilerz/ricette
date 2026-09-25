# Development setup

The application is Laravel 13 with Svelte 5 and Inertia 3 (ADR-0002, ADR-0003).

## Requirements

- PHP 8.4 with the `pdo_sqlite`, `pdo_pgsql`, `intl`, `zip` and `mbstring` extensions, and Composer 2
- Node 25 (what CI and the container image use; 22 or newer works) and pnpm (ADR-0020; the exact version is pinned in `package.json`)
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

## Live review and debugging in VS Code

`./bin/dev` starts what you need to watch the app change as code is written: the PHP server on
`http://localhost:8000` and Vite hot module replacement on `:5173`, both bound to localhost. Saving a Svelte page,
a stylesheet or a PHP file shows up in the browser without a rebuild. It creates `.env`, an application key and the
database on first run and applies migrations every time. Add `--seed` to create a demo account
(`demo@example.com`, password `correct horse battery staple`) with a household. The demo seeder refuses to run in
production because those credentials are public.

In VS Code (or VS Code attached to WSL with the Remote - WSL extension), accept the recommended extensions and pick
**Ricette: app + PHP debugger + browser** in Run and Debug. It starts `./bin/dev`, listens for Xdebug on port 9003
and opens the app in Edge; change `msedge` to `chrome` in `.vscode/launch.json` if you prefer. Breakpoints in PHP
and in the Svelte source both work.

PHP debugging needs the Xdebug extension for the PHP you run. Without it `./bin/dev` still works and says the debugger
is off. With Xdebug installed it is switched on automatically (`XDEBUG_MODE=debug`, client port 9003).

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

### How CI builds the image

Each architecture (`linux/amd64`, `linux/arm64`) builds natively on its own runner with its own layer cache; the
vulnerability scan and the boot acceptance tests load the amd64 image from that cache instead of rebuilding it.
The build job's summary shows the image size and the largest layers. To keep the image small, PHP extensions are
compiled only when the base image lacks them and test suites, docs and examples in dependencies are removed.
