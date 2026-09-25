#!/bin/sh
# Container entrypoint: wait for the database, bring the schema to the current
# version, then start the server. The server never starts against an outdated or
# unreachable database (ADR-0025).
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

php artisan app:wait-for-database
php artisan migrate --force

exec "$@"
