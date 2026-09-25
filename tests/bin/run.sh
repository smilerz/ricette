#!/usr/bin/env bash
# Self-tests for the bin/checks/* enforcement scripts. Each check is run
# against throwaway git repositories so both the passing and failing paths
# are exercised (a check that can never fail is not a control).
set -uo pipefail
here=$(cd "$(dirname "${BASH_SOURCE[0]}")/../.." && pwd)
tmp=$(mktemp -d)
trap 'rm -rf "$tmp"' EXIT

pass=0
fail=0
expect() { # expect <0|1> <description> <command...>
  local want=$1 desc=$2
  shift 2
  "$@" >/dev/null 2>&1
  local got=$?
  [ $got -ne 0 ] && got=1
  if [ "$got" -eq "$want" ]; then
    pass=$((pass + 1))
  else
    fail=$((fail + 1))
    echo "FAIL: $desc (expected exit $want, got $got)" >&2
  fi
}

new_repo() {
  local d=$tmp/$1
  mkdir -p "$d"
  git -C "$d" init -q -b main
  git -C "$d" config user.name "Test"
  git -C "$d" config user.email "test@example.com"
  git -C "$d" config commit.gpgsign false
  echo base >"$d/README.md"
  git -C "$d" add -A
  git -C "$d" commit -q -s -m "base"
  git -C "$d" switch -q -c topic
  echo "$d"
}

add_commit() { # add_commit <repo> <signoff:yes|no> <path>...
  local d=$1 s=$2
  shift 2
  local p
  for p in "$@"; do
    mkdir -p "$d/$(dirname "$p")"
    echo "$RANDOM" >>"$d/$p"
  done
  git -C "$d" add -A
  if [ "$s" = yes ]; then git -C "$d" commit -q -s -m "change"; else git -C "$d" commit -q -m "change"; fi
}

dco() { CHECK_REPO=$1 DCO_BASE=main DCO_HEAD=topic DCO_PR_AUTHOR=${2:-} "$here/bin/checks/dco"; }
cp_check() { CHECK_REPO=$1 CP_BASE=main CP_HEAD=topic CP_LABELS=${2:-} CP_PR_AUTHOR=${3:-} "$here/bin/checks/contribution-policy"; }

# --- DCO
r=$(new_repo dco-signed); add_commit "$r" yes docs/a.md
expect 0 "dco: signed commit passes" dco "$r"
r=$(new_repo dco-unsigned); add_commit "$r" no docs/a.md
expect 1 "dco: unsigned commit fails" dco "$r"
r=$(new_repo dco-mixed); add_commit "$r" yes docs/a.md; add_commit "$r" no docs/b.md
expect 1 "dco: one unsigned commit among signed fails" dco "$r"
r=$(new_repo dco-body-only); d=$r
echo x >>"$d/docs.md"; git -C "$d" add -A; git -C "$d" commit -q -m "change" -m "Signed-off-by: Test <test@example.com> is not a trailer when inline text follows"
expect 1 "dco: non-trailer text does not count as sign-off" dco "$r"

# --- contribution-policy
r=$(new_repo cp-docs); add_commit "$r" yes docs/a.md
expect 0 "cp: docs-only change passes" cp_check "$r"
r=$(new_repo cp-code-only); add_commit "$r" yes app/Thing.php
expect 1 "cp: behavioral change without tests/docs fails" cp_check "$r"
r=$(new_repo cp-code-tests-docs); add_commit "$r" yes app/Thing.php tests/ThingTest.php docs/thing.md
expect 0 "cp: behavioral change with tests and docs passes" cp_check "$r"
r=$(new_repo cp-code-no-doc); add_commit "$r" yes app/Thing.php tests/ThingTest.php
expect 1 "cp: missing docs fails" cp_check "$r"
expect 0 "cp: exception:no-doc label lets missing docs pass" cp_check "$r" "bug,exception:no-doc"
r=$(new_repo cp-code-no-test); add_commit "$r" yes app/Thing.php docs/thing.md
expect 1 "cp: missing tests fails" cp_check "$r"
expect 0 "cp: exception:no-test label lets missing tests pass" cp_check "$r" "exception:no-test"
expect 1 "cp: exception:no-doc does not excuse missing tests" cp_check "$r" "exception:no-doc"
r=$(new_repo cp-ui-no-lang); add_commit "$r" yes resources/js/App.svelte tests/app.test.js docs/ui.md
expect 1 "cp: user-facing change without translation keys fails" cp_check "$r"
r=$(new_repo cp-ui-lang); add_commit "$r" yes resources/js/App.svelte tests/app.test.js docs/ui.md lang/en/app.json
expect 0 "cp: user-facing change with translation keys passes" cp_check "$r"


# --- Dependabot exemption (ADR-0026)
bot_email='49699333+dependabot[bot]@users.noreply.github.com'
add_bot_commit() { # add_bot_commit <repo> <author-email> <path>...
  local d=$1 email=$2
  shift 2
  local p
  for p in "$@"; do
    mkdir -p "$d/$(dirname "$p")"
    echo "$RANDOM" >>"$d/$p"
  done
  git -C "$d" add -A
  git -C "$d" commit -q -m "bump" --author="dependabot[bot] <$email>"
}
r=$(new_repo dco-bot); add_bot_commit "$r" "$bot_email" composer.lock
expect 0 "dco: unsigned Dependabot commit passes for a Dependabot PR" dco "$r" "dependabot[bot]"
expect 1 "dco: the same commit fails for a PR opened by anyone else" dco "$r" "someone"
expect 1 "dco: the same commit fails when no PR author is known" dco "$r"
r=$(new_repo dco-bot-impostor); add_bot_commit "$r" "human@example.com" composer.lock
expect 1 "dco: a Dependabot PR carrying a non-Dependabot unsigned commit fails" dco "$r" "dependabot[bot]"
r=$(new_repo dco-bot-mixed); add_bot_commit "$r" "$bot_email" composer.lock; add_commit "$r" no docs/a.md
expect 1 "dco: an unsigned human commit on a Dependabot PR fails" dco "$r" "dependabot[bot]"

r=$(new_repo cp-bot-deps); add_bot_commit "$r" "$bot_email" Dockerfile composer.lock package.json pnpm-lock.yaml .github/workflows/ci.yml
expect 0 "cp: Dependabot dependency update needs no new tests or docs" cp_check "$r" "" "dependabot[bot]"
expect 1 "cp: the same change from another author still needs tests and docs" cp_check "$r" "" "someone"
r=$(new_repo cp-bot-code); add_bot_commit "$r" "$bot_email" Dockerfile app/Thing.php
expect 1 "cp: a Dependabot PR that also changes application code follows the normal rules" cp_check "$r" "" "dependabot[bot]"

# --- docker/entrypoint.sh
setup_entrypoint() { # setup_entrypoint <name>: fake php and server on PATH, echoes the sandbox dir
  local d=$tmp/$1
  mkdir -p "$d/bin" "$d/app"
  cat >"$d/bin/php" <<'PHP'
#!/bin/sh
echo "php $* [user=${DB_USERNAME-unset} pass=${DB_PASSWORD-unset}]" >>"$ENTRYPOINT_LOG"
case "$*" in *"${FAKE_PHP_FAIL_ON:-__none__}"*) exit 1 ;; esac
PHP
  cat >"$d/bin/server" <<'SERVER'
#!/bin/sh
echo "server $*" >>"$ENTRYPOINT_LOG"
SERVER
  chmod +x "$d/bin/php" "$d/bin/server"
  echo "$d"
}

run_entrypoint() { # run_entrypoint <sandbox> [env assignments...]; log in <sandbox>/log
  local d=$1
  shift
  : >"$d/log"
  env -i PATH="$d/bin:/usr/bin:/bin" APP_DIR="$d/app" ENTRYPOINT_LOG="$d/log" DB_CONNECTION=sqlite DB_DATABASE="$d/data/db.sqlite" "$@" \
    "$here/docker/entrypoint.sh" server --flag
}

e=$(setup_entrypoint ep-default)
expect 0 "entrypoint: default boot succeeds" run_entrypoint "$e"
expect 0 "entrypoint: creates the SQLite file" test -f "$e/data/db.sqlite"
expect 0 "entrypoint: waits for the database before migrating" \
  bash -c "grep -n 'php artisan' '$e/log' | head -2 | tr '\n' ' ' | grep -q 'app:wait-for-database.*migrate --force'"
expect 0 "entrypoint: starts the server with its arguments after migrating" \
  bash -c "tail -1 '$e/log' | grep -q '^server --flag'"

e=$(setup_entrypoint ep-migrate-fails)
expect 1 "entrypoint: a failed migration stops the boot" run_entrypoint "$e" FAKE_PHP_FAIL_ON="migrate --force"
expect 1 "entrypoint: the server never starts after a failed migration" bash -c "grep -q '^server' '$e/log'"

e=$(setup_entrypoint ep-db-unreachable)
expect 1 "entrypoint: an unreachable database stops the boot" run_entrypoint "$e" FAKE_PHP_FAIL_ON="app:wait-for-database"
expect 1 "entrypoint: nothing is migrated when the database is unreachable" bash -c "grep -q 'migrate --force' '$e/log'"

e=$(setup_entrypoint ep-postgres)
expect 0 "entrypoint: PostgreSQL boot does not create a SQLite file" run_entrypoint "$e" DB_CONNECTION=pgsql
expect 1 "entrypoint: no SQLite file for PostgreSQL" test -e "$e/data/db.sqlite"


# --- bin/dev
expect 0 "bin/dev: is valid shell" bash -n "$here/bin/dev"
expect 0 "bin/setup: is valid shell" bash -n "$here/bin/setup"

echo "selftest: $pass passed, $fail failed"
[ $fail -eq 0 ]
