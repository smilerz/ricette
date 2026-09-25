# ADR-0025 — Boot Sequence and Migration Privilege

## Status

Proposed (becomes Accepted when the maintainer merges the PR that introduces it)

## Context

Foundation 0's MVP scope requires that a supported deployment reaches the required schema version before serving traffic, without undocumented manual database work, and that boot tolerates a database that is slow to start. The mechanism was deliberately left open: in particular, whether the long-running application process must hold schema-altering privilege.

## Decision

The container entrypoint (`docker/entrypoint.sh`) runs a fixed sequence and then replaces itself with the server process:

1. For SQLite, create the database file and its directory if missing.
2. `php artisan app:wait-for-database`: retry the connection with exponential backoff (1s, 2s, 4s, then 5s) until `DB_WAIT_TIMEOUT` seconds (default 60) pass, then fail the boot.
3. `php artisan migrate --force`: bring the schema to the current version. A failure stops the boot.
4. `exec` the server (FrankenPHP, ADR-0023).

The server therefore never starts against an unreachable or outdated database.

**Migration credentials are separate and optional.** If `DB_MIGRATION_USERNAME` (and `DB_MIGRATION_PASSWORD`) are set, only steps 2 and 3 run with them; they are then unset, so the server process holds only the runtime credentials `DB_USERNAME` and `DB_PASSWORD`. If they are unset, the runtime credentials are used for migration. That is the normal case for SQLite, where the application owns its database file.

## Alternatives Considered

- **A separate init container or one-shot migration command.** Cleanest privilege separation, but it breaks the single-container contract (ADR-0005).
- **Migrate from inside the running application at first request.** Serves traffic before the schema is ready and races between workers.
- **Require an administrator to run migrations.** Contradicts the no-manual-database-work requirement.
- **Always use one credential.** Simplest, but forces PostgreSQL deployments to give the running application schema-altering rights.

## Rationale

An entrypoint step keeps one container while letting operators who care about least privilege split the credentials. Failing the boot instead of serving is safer than serving an unmigrated schema.

## Consequences

- Concurrent first boots of several containers against one PostgreSQL database are not coordinated; the community edition is a single container. Hosted deployments run migrations as a separate release step.
- The queue worker and scheduler are not started by this entrypoint; their process model is separate work.
- `DB_MIGRATION_*` must be provided by the operator's secret mechanism; the image never contains them.

## Conditions for Reconsideration

Revisit when the queue worker and scheduler need to share the container, or if a supported deployment needs several application containers per database.

## Supersession

None.
