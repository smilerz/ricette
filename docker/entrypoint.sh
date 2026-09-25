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

# The application key protects sessions and anything the app encrypts. Use the one the operator supplied;
# otherwise create one on first start and keep it in the data volume, so it survives restarts and upgrades.
# Whoever can read the volume (or a backup of it) can read the key, so treat the volume as a secret.
if [ -z "${APP_KEY:-}" ]; then
  key_file=${APP_KEY_FILE:-/data/app.key}
  if [ ! -s "$key_file" ]; then
    mkdir -p "$(dirname "$key_file")"
    (umask 077 && php artisan key:generate --show >"$key_file.tmp") && mv "$key_file.tmp" "$key_file"
  fi
  APP_KEY=$(cat "$key_file")
  export APP_KEY
fi

php artisan app:wait-for-database
php artisan migrate --force

exec "$@"
