# Deployment

The supported artifact is the container image (ADR-0005, ADR-0017, ADR-0023). It serves HTTP on port 8080 as an
unprivileged user and keeps its state under `/data`.

## Minimal run

```bash
docker run -d --name ricette -p 8080:8080 \
  -e APP_KEY="base64:..." \
  -v ricette-data:/data \
  ricette
```

Generate an application key once with `php artisan key:generate --show` and keep it: changing it invalidates
sessions and encrypted data. Put the container behind a reverse proxy that terminates TLS.

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
