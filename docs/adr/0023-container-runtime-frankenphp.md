# ADR-0023 — Container Runtime: FrankenPHP

## Status

Accepted. Decided by the maintainer on 2026-09-25 after a review of the alternatives (Apache with PHP, nginx with php-fpm, Laravel Octane). The reasons: it keeps the single-application-container operator experience simple, and it is cheaply reversible.

## Context

ADR-0005 commits the community edition to one application container, one persistent volume, SQLite and database-backed background processing, and says users should not need to understand Laravel's serving architecture. The first application PR (Foundation 0 section 65) must therefore ship a container that serves the application by itself, without a separate web server or process manager in the image.

## Decision

The runtime image is built from the official **FrankenPHP** image (PHP 8.4). FrankenPHP embeds PHP inside the Caddy web server, so one process serves HTTP and PHP. The container listens on plain HTTP port 8080 and runs as the unprivileged `www-data` user; TLS and public hostnames belong to whatever reverse proxy the operator uses. The SQLite database and other persistent state live under the `/data` volume.

The image is built for `linux/amd64` and `linux/arm64` (ADR-0017). Configuration comes from environment variables; the image contains no `.env` file and no secrets.

## Alternatives Considered

- **php-fpm behind nginx or Caddy.** Two processes need a supervisor or two containers, which conflicts with the single-container contract.
- **Laravel Octane on Swoole or RoadRunner.** Adds a package and a long-running worker model that the community edition does not need yet.
- **`php artisan serve`.** Not a production server.

## Rationale

FrankenPHP is the smallest way to serve PHP from a single self-contained process with a maintained multi-architecture image, which is what ADR-0005 requires. It adds no Composer dependency to the application.

## Constraint

Ricette must not adopt FrankenPHP-specific application or runtime capabilities that materially increase the cost of switching runtimes without a new, human-approved architectural decision. Plain Laravel portability is intentional: the application should run unchanged on Apache or nginx with php-fpm, and only the `Dockerfile` and web-server configuration should be FrankenPHP-specific.

## Consequences

- Switching runtimes is estimated at about half a day of `Dockerfile` and configuration work, with no data migration.
- The FrankenPHP binary bundles Go libraries that only its maintainers can patch; the vulnerability scan has already needed three accepted advisories for it (`.grype.yaml`). Watch this, and replace the runtime if it becomes a burden.
- The application depends on the FrankenPHP project for the serving layer; the image tag is pinned and updated through Dependabot's Docker ecosystem.
- Running the queue worker and scheduler alongside the web process is not settled by this ADR. It is part of the deployment/boot work tracked separately (migration-on-boot and the entrypoint).
- Reverse-proxy header trust is configured in the application, not in this ADR.

## Conditions for Reconsideration

Revisit if FrankenPHP's maintenance, multi-architecture support or PHP version coverage lapses, or if the community edition needs a process model FrankenPHP cannot host.

## Supersession

None.
