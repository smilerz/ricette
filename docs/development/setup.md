# Development setup

The application is Laravel 13 with Svelte 5 and Inertia 3 (ADR-0002, ADR-0003).

## Quick start

```bash
./bin/setup        # checks your tools, says exactly what is missing, then installs the project's dependencies
./bin/dev --seed   # runs the app with hot reload and a demo account at http://localhost:8000
```

`./bin/setup --check` only checks and changes nothing. `./bin/setup` never installs system software for you; it
tells you what to install and how.

## What you need

| Tool | Version | Notes |
| --- | --- | --- |
| PHP | 8.3 or newer (CI and the image use 8.4) | Extensions: `pdo_sqlite`, `intl`, `mbstring`, `zip`, `sodium`, `xml`, `curl`. Add `pdo_pgsql` to run the tests against PostgreSQL. |
| Composer | 2 | |
| Node | 22 or newer (CI and the image use 25) | |
| pnpm | 12.6 (pinned in `package.json`, ADR-0020) | `npm install --global pnpm@12.6.0` |
| `jq`, `npx`, and `uvx` or `pipx` | any | Used by the repository-wide checks. |
| Git identity | | `user.name` and `user.email` are used by the DCO sign-off (`-s`) on every commit. |

Optional: **Xdebug** (PHP debugging), **Playwright browsers** (`pnpm exec playwright install --with-deps chromium`,
for end-to-end tests), **Docker** (only for `./bin/verify container-acceptance` and building the image), and a PHP
coverage driver (`pcov` or Xdebug) for the coverage and mutation checks.

The easiest way to get PHP and Composer on any platform is <https://php.new>. On Windows, develop inside WSL and
follow the Linux instructions there.

## Live review and debugging in VS Code

`./bin/dev` starts what you need to watch the app change as code is written: the PHP server on
`http://localhost:8000` and Vite hot module replacement on `:5173`, both bound to localhost. Saving a Svelte page,
a stylesheet or a PHP file shows up in the browser without a rebuild. It creates `.env`, an application key and the
database on first run and applies migrations every time. Add `--seed` to create a demo account
(`demo@example.com`, password `correct horse battery staple`) with a household. The demo seeder refuses to run in
production because those credentials are public.

Open the repository in VS Code (on Windows, use the **WSL** extension and open the folder inside WSL), accept the
recommended extensions, then in Run and Debug pick **Ricette: app + PHP debugger + browser**. It starts `./bin/dev`,
listens for Xdebug on port 9003 and opens the app in Edge; change `msedge` to `chrome` in `.vscode/launch.json` if you
prefer. Breakpoints in PHP and in the Svelte source both work.

### Turning on the PHP debugger

PHP debugging needs the Xdebug extension for the PHP you run. `./bin/dev` switches it on automatically when it is
installed (`XDEBUG_MODE=debug`, client port 9003) and says so; without it everything else still works.

1. Install it: Debian, Ubuntu and WSL `sudo apt install php8.4-xdebug`; macOS `pecl install xdebug`.
2. Check it: `php -m | grep -i xdebug`, or run `./bin/setup --check`.
3. In VS Code, start **PHP: Listen for Xdebug** (or the compound launch), set a breakpoint, and load a page.

Under WSL, run VS Code through the WSL extension so the debugger, PHP and the files are all inside WSL; then
`localhost` in your Windows browser reaches the servers automatically.

## Everything in VS Code

Run a task from **Terminal > Run Task** (or the Command Palette, "Tasks: Run Task"). Shared settings, tasks and
launch configurations live in `.vscode/`.

| Task or launch | What it does |
| --- | --- |
| Ricette: set up this machine | `./bin/setup` |
| Ricette: start dev servers (with demo data) | `./bin/dev` (`--seed`) |
| Ricette: test PHP / frontend / end to end | Pest, Vitest, Playwright |
| Ricette: format everything | `./bin/format` |
| Ricette: check before pushing | the fast subset of `./bin/verify` |
| Ricette: run every CI check | `./bin/verify` |
| Launch: Pest: debug current test file | Debug the open test with Xdebug |
| Launch: Vitest: debug current test file | Debug the open frontend test |

PHP files are formatted by Laravel Pint through `./bin/format` (not on save), so run it, or the check task, before you
push. TypeScript, Svelte and CSS are formatted with Prettier on save.

## Everything CI runs

```bash
./bin/verify
```

Targets run individually with `./bin/verify <target>`; see [`docs/development/commands.md`](commands.md).
`./bin/format` applies the automatic formatting.

## Databases

SQLite is the default and needs no setup. To run the tests against PostgreSQL, set `DB_CONNECTION=pgsql`
with the `DB_HOST`, `DB_PORT`, `DB_DATABASE`, `DB_USERNAME` and `DB_PASSWORD` variables before
`./bin/verify php-test`. CI runs both (ADR-0006).

## Translations

All user-visible text lives in [`lang/en.json`](../../lang/en.json) (ADR-0024). `pnpm run i18n:validate` checks the catalogs;
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
