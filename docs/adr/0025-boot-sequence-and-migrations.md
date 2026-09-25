# ADR-0025 — Boot Sequence and Migrations

## Status

Accepted. Decided by the maintainer on 2026-09-25 (option C below).

## Context

Foundation 0's MVP scope requires that a supported deployment reaches the required schema version before serving traffic, without undocumented manual database work, and that boot tolerates a database that is slow to start. The frozen specification left open whether the long-running application process must be kept free of schema-altering privilege.

Ricette is open source and self-hosted. Requiring operators to provision a separate administrative database account just to upgrade would make it materially harder to run. In the default SQLite deployment there is no separate database privilege to withhold: the application owns its database file.

## Decision

The container entrypoint (`docker/entrypoint.sh`) runs a fixed sequence and then replaces itself with the server process:

1. For SQLite, create the database file and its directory if missing.
2. `php artisan app:wait-for-database`: retry the connection with exponential backoff (1s, 2s, 4s, then 5s) until `DB_WAIT_TIMEOUT` seconds (default 60) pass, then fail the boot.
3. `php artisan migrate --force`: bring the schema to the current version. A failure stops the boot.
4. `exec` the server (FrankenPHP, ADR-0023).

The server therefore never starts against an unreachable or outdated database.

**One set of database credentials.** Migration and the running application use the same `DB_*` settings. There is no separate migration account.

## Alternatives Considered

- **Optional separate migration credentials, used only for the migration step.** Implemented and then removed. It lets a PostgreSQL operator keep the running application from altering the schema, but that protection is modest (the application can still read and change all data) and it adds settings and a role-provisioning step for every operator who wants it.
- **A separate init container or one-shot migration command.** Cleanest privilege separation, but it breaks the single-container contract (ADR-0005).
- **Migrate from inside the running application at first request.** Serves traffic before the schema is ready and races between workers.
- **Require an administrator to run migrations.** Contradicts the no-manual-database-work requirement.

## Rationale

Easy self-hosting is a core goal. Defense in depth against a compromised web layer is better served by the controls that prevent bad input from reaching the database (parameterized queries, server-derived tenant scope) and by the container running as an unprivileged user than by a second database account most operators will not set up.

## Consequences

- On PostgreSQL the running application can alter its own schema. Operators who need stricter separation must arrange it outside the image; the image does not support it.
- Concurrent first boots of several containers against one PostgreSQL database are not coordinated; the community edition is a single container. Hosted deployments run migrations as a separate release step under their own privileged account.
- The queue worker and scheduler are not started by this entrypoint; their process model is separate work.

## Conditions for Reconsideration

Revisit if a supported deployment needs several application containers per database, if hosted operation needs the running application to hold fewer privileges, or if a security incident shows the shared credential mattered.

## Supersession

None.
