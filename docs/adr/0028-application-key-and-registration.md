# ADR-0028 - Application Key and Open Registration

## Status

Accepted. Decided by the maintainer on 2026-09-25 (option A for the key, and a switch for registration).

## Context

A self-hosted operator should be able to start Ricette with one command and no tools on the host. Two things
stood in the way. The application needs a secret key (`APP_KEY`), and creating one required PHP on the host or a
separate container run. And registration is open to anyone who can reach the server, with no way to close it.

`APP_KEY` is Laravel's encryption and signing key. It protects cookie values (including the session cookie),
signed URLs and anything encrypted with the `encrypted` cast or `Crypt`. It does not protect passwords, which use
Argon2id with a random salt each, and it does not encrypt recipes or household data. Sessions are stored in the
database. Losing or changing the key logs everyone out and makes previously encrypted values unreadable.

## Decision

**The container creates the key on first start.** If `APP_KEY` is set, it is used and nothing is stored.
Otherwise the entrypoint reads `/data/app.key`, creating it (mode 600, from `php artisan key:generate --show`)
when it is missing or empty, and exports it to the application. The key therefore survives restarts and upgrades
with the data volume.

**The data volume is the secret.** Whoever can read the volume or a backup of it can read the key and the
database. Operators must protect and back up the volume accordingly. Deployments with more than one container,
or where the volume is shared or replicated, must set `APP_KEY` explicitly so all containers agree.

**Registration is open by default and can be closed.** `REGISTRATION_ENABLED=false` removes the `/register`
routes and the sign-up links. Only a clear true value keeps it open; an empty or misspelled value closes it, so a
typo never leaves sign-up open.

## Alternatives Considered

- **Operator always supplies `APP_KEY`.** Simplest and keeps the key out of the volume, but needs PHP or an extra
  container run before first start. Still available, and it takes precedence over the stored key.
- **Registration closed by default.** Safer on the internet, but the first person could not create an account
  without knowing the switch. A first-account bootstrap could revisit this.

## Consequences

- One-command self-hosting works with no tools on the host.
- The key sits next to the data it does not protect today. If Ricette later encrypts sensitive values with it,
  this decision should be revisited so the key can live apart from backups.
- Key rotation is supported through Laravel's `APP_PREVIOUS_KEYS`; procedure is in the deployment guide.
- There is no self-service way to add users to a household once registration is closed; that belongs to the
  invitation work, not to this switch.
