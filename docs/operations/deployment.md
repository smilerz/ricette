# Deployment

The supported artifact is the container image (ADR-0005, ADR-0017, ADR-0023). It serves HTTP on port 8080 as an
unprivileged user and keeps its state under `/data`.

## Docker Compose

`compose.yaml` in the repository root builds the image and runs it with a data volume:

```bash
docker compose up -d
```

## Minimal run

```bash
docker run -d --name ricette -p 8080:8080 -v ricette-data:/data ricette
```

Put the container behind a reverse proxy that terminates TLS.

## The application key

The key protects sessions and signed links (ADR-0028). On first start the container creates one and keeps it in
`/data/app.key`, so it survives restarts and upgrades. **The data volume is therefore the secret:** anyone who can
read it or a backup of it can read the key and the database. Restrict access to it and store backups accordingly.

To manage the key yourself, set `APP_KEY` (for example `docker run --rm ricette php artisan key:generate --show`
prints one). A supplied key is used as is and nothing is written to the volume. Set it explicitly whenever more
than one container serves the same data, so they all agree.

Changing the key logs everyone out and makes anything encrypted with the old key unreadable. To rotate without
that, put the old key in `APP_PREVIOUS_KEYS` (comma-separated) while the new one is in `APP_KEY`, and remove the
old key once sessions have turned over.

## Closing registration

Anyone who can reach the server can create an account. To stop that, set `REGISTRATION_ENABLED=false`. The
`/register` page and the sign-up links disappear and sign-in is unaffected. Only a clear true value leaves it
open; an empty or misspelled value closes it. Create your own account first, then close registration.

## What happens at start

The entrypoint waits for the database, migrates it to the current schema, then starts the server (ADR-0025).
No manual database step is needed on first install or on upgrade. If the database is unreachable for
`DB_WAIT_TIMEOUT` seconds, or a migration fails, the container exits instead of serving; check `docker logs`.

## Database

| Setting | Meaning |
| --- | --- |
| `DB_CONNECTION` | `sqlite` (default) or `pgsql` |
| `DB_DATABASE` | For SQLite, the file path (default `/data/database.sqlite`). For PostgreSQL, the database name. |
| `DB_HOST`, `DB_PORT`, `DB_USERNAME`, `DB_PASSWORD` | PostgreSQL connection |
| `DB_WAIT_TIMEOUT` | Seconds to wait for the database at boot, retrying with backoff (default 60) |

Migration and the running application use the same database login, so it needs the right to create and alter
tables in its database.

## Reverse proxy

Behind a proxy, the application must know which peers to trust for `X-Forwarded-For`, `X-Forwarded-Host`,
`X-Forwarded-Port` and `X-Forwarded-Proto`; otherwise it sees the proxy's address and plain HTTP, which breaks
login redirects, secure cookies and absolute URLs.

| Setting | Meaning |
| --- | --- |
| `TRUSTED_PROXIES` | Comma-separated proxy IP addresses or CIDR ranges. Empty (the default) trusts no proxy, and forwarded headers are ignored. |

Set it to the proxy's address or network, for example `TRUSTED_PROXIES=172.18.0.0/16`. `TRUSTED_PROXIES=*` trusts
whichever peer connects and is only safe when the container is reachable solely through the proxy.
