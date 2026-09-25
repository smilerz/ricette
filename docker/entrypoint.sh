#!/bin/sh
# Container entrypoint: wait for the database, bring the schema to the current
# version, then start the server. The server never starts against an outdated or
# unreachable database, and never holds the migration credentials.
#
# DB_MIGRATION_USERNAME / DB_MIGRATION_PASSWORD (optional): schema-altering
# credentials used only by the migration step. When unset, the runtime
# credentials are used, which is the normal SQLite case (docs/operations/deployment.md).
set -eu

APP_DIR=${APP_DIR:-/app}
cd "$APP_DIR"

if [ "${DB_CONNECTION:-sqlite}" = "sqlite" ]; then
  db_path=${DB_DATABASE:-/data/database.sqlite}
  if [ "$db_path" != ":memory:" ]; then
    mkdir -p "$(dirname "$db_path")"
    [ -e "$db_path" ] || : >"$db_path"
  fi
fi

migrate() {
  php artisan app:wait-for-database
  php artisan migrate --force
}

if [ -n "${DB_MIGRATION_USERNAME:-}" ]; then
  DB_USERNAME=$DB_MIGRATION_USERNAME DB_PASSWORD=${DB_MIGRATION_PASSWORD:-} migrate
else
  migrate
fi

unset DB_MIGRATION_USERNAME DB_MIGRATION_PASSWORD

exec "$@"
