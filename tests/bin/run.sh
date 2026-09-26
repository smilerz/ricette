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
case "$*" in *key:generate*) echo "base64:generated-key-for-tests" ;; esac
echo "key=${APP_KEY-unset}" >>"$ENTRYPOINT_LOG"
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
  env -i PATH="$d/bin:/usr/bin:/bin" APP_DIR="$d/app" ENTRYPOINT_LOG="$d/log" DB_CONNECTION=sqlite DB_DATABASE="$d/data/db.sqlite" APP_KEY=base64:default "$@" \
    "$here/docker/entrypoint.sh" server --flag
}

e=$(setup_entrypoint ep-default)
expect 0 "entrypoint: default boot succeeds" run_entrypoint "$e"
expect 0 "entrypoint: creates the SQLite file" test -f "$e/data/db.sqlite"
expect 0 "entrypoint: waits for the database before migrating" \
  bash -c "grep -n 'php artisan' '$e/log' | head -2 | tr '\n' ' ' | grep -q 'app:wait-for-database.*migrate --force'"
expect 0 "entrypoint: starts the server with its arguments after migrating" \
  bash -c "tail -1 '$e/log' | grep -q '^server --flag'"

e=$(setup_entrypoint ep-key)
expect 0 "entrypoint: creates an application key when none is supplied" run_entrypoint "$e" APP_KEY_FILE="$e/data/app.key" APP_KEY=
expect 0 "entrypoint: stores the generated key in the data volume" grep -q 'base64:generated-key-for-tests' "$e/data/app.key"
expect 0 "entrypoint: the generated key file is private to its owner" test "$(stat -c %a "$e/data/app.key")" = 600
expect 0 "entrypoint: the application runs with the generated key" grep -q '^key=base64:generated-key-for-tests' "$e/log"
echo "base64:kept-key" >"$e/data/app.key"
expect 0 "entrypoint: a restart reuses the stored key" run_entrypoint "$e" APP_KEY_FILE="$e/data/app.key" APP_KEY=
expect 1 "entrypoint: a restart does not generate a second key" grep -q key:generate "$e/log"
expect 0 "entrypoint: the stored key is what the application uses" grep -q '^key=base64:kept-key' "$e/log"

e=$(setup_entrypoint ep-key-supplied)
expect 0 "entrypoint: a supplied key is used" run_entrypoint "$e" APP_KEY_FILE="$e/data/app.key" APP_KEY=base64:from-operator
expect 1 "entrypoint: a supplied key is not replaced or stored" test -e "$e/data/app.key"
expect 0 "entrypoint: the supplied key reaches the application" grep -q '^key=base64:from-operator' "$e/log"

e=$(setup_entrypoint ep-migrate-fails)
expect 1 "entrypoint: a failed migration stops the boot" run_entrypoint "$e" FAKE_PHP_FAIL_ON="migrate --force"
expect 1 "entrypoint: the server never starts after a failed migration" bash -c "grep -q '^server' '$e/log'"

e=$(setup_entrypoint ep-db-unreachable)
expect 1 "entrypoint: an unreachable database stops the boot" run_entrypoint "$e" FAKE_PHP_FAIL_ON="app:wait-for-database"
expect 1 "entrypoint: nothing is migrated when the database is unreachable" bash -c "grep -q 'migrate --force' '$e/log'"

e=$(setup_entrypoint ep-postgres)
expect 0 "entrypoint: PostgreSQL boot does not create a SQLite file" run_entrypoint "$e" DB_CONNECTION=pgsql
expect 1 "entrypoint: no SQLite file for PostgreSQL" test -e "$e/data/db.sqlite"


# --- bin/coverage-badge
b=$tmp/badge
mkdir -p "$b"
cat >"$b/clover.xml" <<'XML'
<?xml version="1.0"?><coverage><project><metrics statements="200" coveredstatements="181"/></project></coverage>
XML
cat >"$b/cobertura.xml" <<'XML'
<?xml version="1.0"?><coverage line-rate="0.5"></coverage>
XML
expect 0 "coverage-badge: writes both badges" "$here/bin/coverage-badge" "$b/out" --php "$b/clover.xml" --js "$b/cobertura.xml"
expect 0 "coverage-badge: rounds the PHP figure down, never up" grep -q '"message": "90%"' "$b/out/coverage-php.json"
expect 0 "coverage-badge: colours by threshold" grep -q '"color": "orange"' "$b/out/coverage-js.json"
expect 0 "coverage-badge: output is the shields endpoint schema" grep -q '"schemaVersion": 1' "$b/out/coverage-php.json"
expect 1 "coverage-badge: a report of the wrong kind fails" "$here/bin/coverage-badge" "$b/bad" --php "$b/cobertura.xml"
expect 1 "coverage-badge: no report given fails" "$here/bin/coverage-badge" "$b/none"

# --- bin/release-plan
rp_repo() { # rp_repo <name>: an empty repo with a first commit; echoes its path
  local d=$tmp/$1
  mkdir -p "$d"
  git -C "$d" init -q
  git -C "$d" config user.name t
  git -C "$d" config user.email t@t
  git -C "$d" config commit.gpgsign false
  printf '%s\n' docs tests .vscode .github '*.md' >"$d/.dockerignore"
  echo "$d"
}
rp_commit() { # rp_commit <repo> <message> <file>: a commit that changes <file>
  mkdir -p "$(dirname "$1/$3")"
  echo "$RANDOM$RANDOM" >>"$1/$3"
  git -C "$1" add -A
  git -C "$1" commit -q -m "$2"
}
rp() { # rp <repo> <args...>: run bin/release-plan inside the repo
  local d=$1
  shift
  (cd "$d" && "$here/bin/release-plan" "$@")
}
rp_has() { # rp_has <repo> <mode> _ <line>: the plan prints that exact line
  local o
  o=$(rp "$1" "${@:2:2}") || return 1
  grep -qxF "${@:4}" <<<"$o"
}

r=$(rp_repo rp-first)
rp_commit "$r" "feat: first thing" app/a.php
expect 0 "release-plan: the first release is 0.1.0" rp_has "$r" release x "version=0.1.0"
expect 0 "release-plan: a release is tagged with X.Y.Z, X.Y, latest and the commit" bash -c "cd '$r' && '$here/bin/release-plan' release | grep -q '^tags=0.1.0,0.1,latest,sha-'"
git -C "$r" tag v0.1.0
expect 0 "release-plan: nothing new since the tag is skipped" bash -c "cd '$r' && '$here/bin/release-plan' release | grep -qx 'skip=true'"
rp_commit "$r" "docs: reword" docs/x.md
rp_commit "$r" "test: add a case" tests/Feature/x.php
expect 0 "release-plan: docs and tests alone do not make a release" bash -c "cd '$r' && '$here/bin/release-plan' release | grep -qx 'skip=true'"
rp_commit "$r" "fix: a bug" app/b.php
expect 0 "release-plan: a fix before 1.0 bumps the patch" rp_has "$r" release x "version=0.1.1"
git -C "$r" tag v0.1.1
rp_commit "$r" "feat: something new" app/c.php
expect 0 "release-plan: a feature before 1.0 bumps the minor" rp_has "$r" release x "version=0.2.0"
git -C "$r" tag v0.2.0
rp_commit "$r" "refactor!: rename a thing" app/d.php
expect 0 "release-plan: a breaking change before 1.0 bumps the minor" rp_has "$r" release x "version=0.3.0"
expect 0 "release-plan: a pre-1.0 release has no bare major tag" bash -c "cd '$r' && ! '$here/bin/release-plan' release | grep '^tags=' | grep -Eq ',0,'"

r=$(rp_repo rp-one)
rp_commit "$r" "feat: start" app/a.php
git -C "$r" tag v1.2.3
rp_commit "$r" "fix: small" app/b.php
expect 0 "release-plan: from 1.0 a fix bumps the patch" rp_has "$r" release x "version=1.2.4"
rp_commit "$r" "feat(ui): new page" app/c.php
expect 0 "release-plan: from 1.0 a feature bumps the minor" rp_has "$r" release x "version=1.3.0"
expect 0 "release-plan: from 1.0 the release also gets a major tag" bash -c "cd '$r' && '$here/bin/release-plan' release | grep -q '^tags=1.3.0,1.3,1,latest,'"
rp_commit "$r" "chore: drop a thing

BREAKING CHANGE: the setting is gone" app/d.php
expect 0 "release-plan: from 1.0 a breaking change bumps the major" rp_has "$r" release x "version=2.0.0"

r=$(rp_repo rp-bot)
rp_commit "$r" "feat: start" app/a.php
git -C "$r" tag v0.1.0
mkdir -p "$r/app"
echo bot >>"$r/app/b.php"
git -C "$r" add -A
git -C "$r" -c user.name=dependabot -c user.email=49699333+dependabot[bot]@users.noreply.github.com commit -q -m "build(deps): bump thing" -m "Release notes from upstream:
BREAKING CHANGE: the old API is removed"
expect 0 "release-plan: a quoted BREAKING CHANGE in a Dependabot body does not bump the minor" rp_has "$r" release x "version=0.1.1"
rp_commit "$r" "fix: human change

BREAKING CHANGE: a person meant this" app/c.php
expect 0 "release-plan: a BREAKING CHANGE footer written by a person does" rp_has "$r" release x "version=0.2.0"
r=$(rp_repo rp-taken)
rp_commit "$r" "feat: start" app/a.php
expect 1 "release-plan: a version already in the registry is refused, not overwritten" bash -c "cd '$r' && TAKEN_VERSION_TAGS=0.1.0 '$here/bin/release-plan' release"
r=$(rp_repo rp-migr)
rp_commit "$r" "feat: start" app/a.php
git -C "$r" tag v0.1.0
rp_commit "$r" "feat: a table" database/migrations/2026_01_01_000000_x.php
expect 0 "release-plan: a change under database/migrations is flagged for the release notes" rp_has "$r" release x "migrations=true"
rp_commit "$r" "fix: unrelated" app/z.php

r=$(rp_repo rp-notes)
mkdir -p "$r/database/migrations"
printf 'APP_NAME=Ricette\nOLD_SETTING=1\n' >"$r/.env.example"
rp_commit "$r" "feat: start" app/a.php
git -C "$r" tag v0.1.0
rp_commit "$r" "feat(ui): add the pantry page" app/b.php
rp_commit "$r" "fix: stop a crash on empty recipes" app/c.php
rp_commit "$r" "docs: reword the readme" docs/a.md
rp_commit "$r" "chore: tidy" app/d.php
rp_commit "$r" "ci: faster jobs" .github/x.yml
rp_commit "$r" "feat!: rename the database setting

BREAKING CHANGE: rename DB_HOST to DATABASE_HOST in your environment before upgrading" app/e.php
rp_commit "$r" "refactor!: drop a thing" app/f.php
printf 'APP_NAME=Ricette\nNEW_SETTING=2\n' >"$r/.env.example"
rp_commit "$r" "feat: add a table" database/migrations/2026_01_01_000000_x.php
git -C "$r" add -A
git -C "$r" -c user.name=dependabot -c user.email=1+dependabot[bot]@users.noreply.github.com commit -q --allow-empty -m "build(deps): bump x" -m "BREAKING CHANGE: quoted"
notes() { (cd "$r" && "$here/bin/release-plan" notes "$@"); }
expect 0 "release-plan notes: features are listed" bash -c "cd '$r' && '$here/bin/release-plan' notes | grep -q 'add the pantry page'"
expect 0 "release-plan notes: fixes are listed" bash -c "cd '$r' && '$here/bin/release-plan' notes | grep -q 'stop a crash on empty recipes'"
expect 1 "release-plan notes: docs, chore and ci commits are left out" bash -c "cd '$r' && '$here/bin/release-plan' notes | grep -Eq 'reword the readme|tidy|faster jobs'"
expect 0 "release-plan notes: a breaking change carries the author's upgrade instruction as written" bash -c "cd '$r' && '$here/bin/release-plan' notes | grep -q 'rename DB_HOST to DATABASE_HOST in your environment before upgrading'"
expect 0 "release-plan notes: a breaking change with no instruction is called out" bash -c "cd '$r' && '$here/bin/release-plan' notes | grep -q 'gave no upgrade instructions'"
expect 1 "release-plan notes: a bot's quoted BREAKING CHANGE is not reported as breaking" bash -c "cd '$r' && '$here/bin/release-plan' notes | grep -q 'quoted'"
expect 0 "release-plan notes: migrations produce a back-up warning" bash -c "cd '$r' && '$here/bin/release-plan' notes | grep -q 'changes the database'"
expect 0 "release-plan notes: new settings are listed" bash -c "cd '$r' && '$here/bin/release-plan' notes | grep -q 'NEW_SETTING'"
expect 0 "release-plan notes: removed settings are listed" bash -c "cd '$r' && '$here/bin/release-plan' notes | grep -q 'OLD_SETTING'"
expect 0 "release-plan notes: dependency updates are counted, not listed" bash -c "cd '$r' && '$here/bin/release-plan' notes | grep -q '1 dependency update'"
expect 0 "release-plan notes: the exact image pin is printed when the workflow supplies it" bash -c "cd '$r' && IMAGE_NAME=ghcr.io/x/y IMAGE_DIGEST=sha256:abc '$here/bin/release-plan' notes | grep -qF 'docker pull ghcr.io/x/y@sha256:abc'"
expect 0 "release-plan notes: a base-image note appears under Upgrading" bash -c "cd '$r' && BASE_IMAGE_NOTE='The base image was updated.' '$here/bin/release-plan' notes | grep -q 'The base image was updated'"

r=$(rp_repo rp-quiet)
rp_commit "$r" "feat: start" app/a.php
git -C "$r" tag v0.1.0
rp_commit "$r" "docs: only words" docs/a.md
expect 0 "release-plan notes: nothing to say and no action needed" bash -c "cd '$r' && '$here/bin/release-plan' notes | grep -q 'No action needed'"

r=$(rp_repo rp-rebuild)
rp_commit "$r" "feat: start" app/a.php
git -C "$r" tag v1.4.0
expect 0 "release-plan: no commits and no new base image is skipped" bash -c "cd '$r' && '$here/bin/release-plan' release | grep -qx 'skip=true'"
expect 0 "release-plan: a base-image rebuild is a patch release" bash -c "cd '$r' && REBUILD_REASON=base '$here/bin/release-plan' release | grep -qx 'version=1.4.1'"
expect 0 "release-plan: a rebuild is marked as one" bash -c "cd '$r' && REBUILD_REASON=base '$here/bin/release-plan' release | grep -qx 'rebuild=true'"
expect 1 "release-plan: a rebuild does not take the commit tag, which must stay immutable" bash -c "cd '$r' && REBUILD_REASON=base '$here/bin/release-plan' release | grep '^tags=' | grep -q 'sha-'"
git -C "$r" tag v1.4.1
expect 0 "release-plan: with two tags on one commit the highest version is the base" bash -c "cd '$r' && REBUILD_REASON=base '$here/bin/release-plan' release | grep -qx 'previous=v1.4.1'"
expect 0 "release-plan: the next rebuild is 1.4.2, not 1.4.1 again" bash -c "cd '$r' && REBUILD_REASON=base '$here/bin/release-plan' release | grep -qx 'version=1.4.2'"
rp_commit "$r" "fix: a real change" app/b.php
expect 0 "release-plan: a real change with a new base image is one release, not two" bash -c "cd '$r' && REBUILD_REASON=base '$here/bin/release-plan' release | grep -qx 'rebuild=false'"
rp_commit "$r" "docs: words only" docs/z.md
r2=$(rp_repo rp-rebuild-docs)
rp_commit "$r2" "feat: start" app/a.php
git -C "$r2" tag v0.3.0
rp_commit "$r2" "docs: words only" docs/z.md
expect 0 "release-plan: docs only plus a new base image still ships a rebuild" bash -c "cd '$r2' && REBUILD_REASON=base '$here/bin/release-plan' release | grep -qx 'version=0.3.1'"

r=$(rp_repo rp-tag)
rp_commit "$r" "feat: one" app/a.php
git -C "$r" branch -M main
git -C "$r" tag v1.2.0
rp_commit "$r" "fix: two" app/b.php
git -C "$r" tag v1.2.1
rp_commit "$r" "feat: three" app/c.php
git -C "$r" tag v1.3.0
tg() { (cd "$r" && MAIN_REF=main "$here/bin/release-plan" tag "$@"); }
expect 0 "release-plan tag: the newest release moves latest, its series tags and gets a commit tag" bash -c "cd '$r' && MAIN_REF=main '$here/bin/release-plan' tag v1.3.0 | grep -q '^tags=1.3.0,1.3,1,latest,sha-'"
expect 0 "release-plan tag: re-running an older release does not move latest" bash -c "cd '$r' && MAIN_REF=main '$here/bin/release-plan' tag v1.2.1 | grep -q '^tags=1.2.1,1.2,sha-'"
expect 1 "release-plan tag: re-running an older release never carries latest" bash -c "cd '$r' && MAIN_REF=main '$here/bin/release-plan' tag v1.2.1 | grep '^tags=' | grep -q latest"
expect 1 "release-plan tag: re-running v1.2.0 does not move the 1.2 series tag off 1.2.1" bash -c "cd '$r' && MAIN_REF=main '$here/bin/release-plan' tag v1.2.0 | grep '^tags=' | grep -q ',1.2,'"
expect 1 "release-plan tag: a tag that does not exist is refused" tg v9.9.9
expect 1 "release-plan tag: a malformed tag is refused" tg 1.2
git -C "$r" checkout -q -b topic
rp_commit "$r" "feat: unreviewed branch work" app/d.php
git -C "$r" tag v1.4.0
expect 1 "release-plan tag: a tag on a commit that is not on main is refused" tg v1.4.0
git -C "$r" checkout -q main
git -C "$r" tag v1.3.1 "$(git -C "$r" rev-parse v1.3.0)"
expect 1 "release-plan tag: a rebuilt commit (two tags) does not take the commit tag" bash -c "cd '$r' && MAIN_REF=main '$here/bin/release-plan' tag v1.3.1 | grep '^tags=' | grep -q sha-"

r=$(rp_repo rp-dockerignore)
printf '%s\n' docs tests .github .vscode '*.md' 'database/*.sqlite' 'storage/logs/*' >"$r/.dockerignore"
rp_commit "$r" "feat: start" app/a.php
git -C "$r" tag v0.1.0
ctx() { (cd "$r" && "$here/bin/release-plan" context-changed v0.1.0 | grep -qx "relevant=$1"); }
rp_commit "$r" "docs: words" docs/a.md
rp_commit "$r" "docs: root readme" README.md
expect 0 "context: docs and a root markdown file are outside the build context" ctx false
rp_commit "$r" "test: a test" tests/Feature/x.php
rp_commit "$r" "chore: editor" .vscode/settings.json
expect 0 "context: tests and editor settings are outside the build context" ctx false
rp_commit "$r" "docs: nested markdown" resources/notes/n.md
expect 0 "context: a markdown file below the root is inside the context, as Docker reads *.md" ctx true
git -C "$r" reset -q --hard HEAD~1
rp_commit "$r" "chore: sqlite" database/local.sqlite
expect 0 "context: database/*.sqlite is excluded" ctx false
rp_commit "$r" "fix: code" app/b.php
expect 0 "context: application code is inside the context" ctx true
git -C "$r" reset -q --hard HEAD~1
rp_commit "$r" "chore: new dockerignore" .dockerignore
expect 0 "context: a change to .dockerignore itself counts" ctx true
git -C "$r" reset -q --hard HEAD~1
printf '%s\n' docs '**/*.md' >"$r/.dockerignore"
git -C "$r" add -A
git -C "$r" commit -q -m "chore: fancy ignore"
rp_commit "$r" "docs: words again" docs/b.md
expect 0 "context: syntax the script cannot read makes every change count (safe direction)" ctx true
r=$(rp_repo rp-extra)
printf '%s\n' .github >"$r/.dockerignore"
rp_commit "$r" "feat: start" app/a.php
git -C "$r" tag v0.1.0
rp_commit "$r" "ci: a workflow" .github/workflows/container.yml
expect 0 "context: an ignored path is still relevant when CI lists it as extra" bash -c "cd '$r' && EXTRA_RELEVANT='^\\.github/workflows/container\\.yml$' '$here/bin/release-plan' context-changed v0.1.0 | grep -qx relevant=true"
expect 0 "context: without the extra rule the same change is not relevant" bash -c "cd '$r' && '$here/bin/release-plan' context-changed v0.1.0 | grep -qx relevant=false"

r=$(rp_repo rp-nightly)
rp_commit "$r" "feat: start" app/a.php
expect 0 "release-plan: the first nightly has the moving tag and the commit tag" bash -c "cd '$r' && '$here/bin/release-plan' nightly | grep -q '^tags=nightly,sha-'"
old=$(git -C "$r" rev-parse HEAD)
expect 0 "release-plan: an unchanged main is not rebuilt" bash -c "cd '$r' && LAST_NIGHTLY_SHA=$old '$here/bin/release-plan' nightly | grep -qx 'skip=true'"
rp_commit "$r" "docs: words" docs/y.md
expect 0 "release-plan: a docs-only change is not rebuilt" bash -c "cd '$r' && LAST_NIGHTLY_SHA=$old '$here/bin/release-plan' nightly | grep -qx 'skip=true'"
rp_commit "$r" "fix: real change" app/e.php
expect 0 "release-plan: a real change is rebuilt" bash -c "cd '$r' && LAST_NIGHTLY_SHA=$old '$here/bin/release-plan' nightly | grep -qx 'skip=false'"
expect 1 "release-plan: an unknown mode is refused" bash -c "cd '$r' && '$here/bin/release-plan' weekly"

# --- bin/scan-gate
sg=$tmp/scan-gate
mkdir -p "$sg"
sgjson() { # sgjson <file> <id:pkg:version:severity:fixstate>...: a minimal Grype report
  local f=$1
  shift
  python3 - "$f" "$@" <<'PY'
import json, sys
matches = []
for spec in sys.argv[2:]:
    vid, pkg, ver, sev, fix = spec.split(":")
    matches.append({"vulnerability": {"id": vid, "severity": sev, "fix": {"state": fix}}, "artifact": {"name": pkg, "version": ver}})
json.dump({"matches": matches}, open(sys.argv[1], "w"))
PY
}
: >"$sg/none.yaml"
gate() { GRYPE_CONFIG="$sg/none.yaml" TODAY=2026-09-26 "$here/bin/scan-gate" "$@"; }
sgjson "$sg/clean.json"
sgjson "$sg/high.json" CVE-1:openssl:3.0:High:fixed
sgjson "$sg/high-unfixed.json" CVE-2:openssl:3.0:High:not-fixed
sgjson "$sg/high-bumped.json" CVE-1:openssl:3.1:High:fixed
sgjson "$sg/high-other-pkg.json" CVE-1:libssl:3.0:High:fixed
sgjson "$sg/crit.json" CVE-9:zlib:1.2:Critical:fixed
sgjson "$sg/medium.json" CVE-3:curl:8:Medium:fixed
expect 0 "scan-gate: a clean first release passes" gate "$sg/clean.json"
expect 1 "scan-gate: the first release is absolute, so a fixable High blocks" gate "$sg/high.json"
expect 0 "scan-gate: a High with no fix available never blocks" gate "$sg/high-unfixed.json"
expect 0 "scan-gate: Medium findings never block" gate "$sg/medium.json"
expect 0 "scan-gate: a High the published image already has does not block" gate "$sg/high.json" "$sg/high.json"
expect 0 "scan-gate: the same CVE in a bumped package version is not new" gate "$sg/high-bumped.json" "$sg/high.json"
expect 1 "scan-gate: the same CVE in a different package is new" gate "$sg/high-other-pkg.json" "$sg/high.json"
expect 1 "scan-gate: a new High compared with a clean published image blocks" gate "$sg/high.json" "$sg/clean.json"
expect 1 "scan-gate: a Critical blocks even when the published image has it too" gate "$sg/crit.json" "$sg/crit.json"
expect 1 "scan-gate: a new Critical blocks" gate "$sg/crit.json" "$sg/clean.json"
expect 0 "scan-gate: fixing findings is reported and passes" gate "$sg/clean.json" "$sg/high.json"
printf 'ignore:\n  - vulnerability: CVE-9 # reason (expires: 2026-12-31)\n' >"$sg/ok.yaml"
printf 'ignore:\n  - vulnerability: CVE-9 # reason only\n' >"$sg/noexp.yaml"
printf 'ignore:\n  - vulnerability: CVE-9 # reason (expires: 2026-01-01)\n' >"$sg/old.yaml"
expect 0 "scan-gate: an exception with a reason and a future expiry is accepted" env GRYPE_CONFIG="$sg/ok.yaml" TODAY=2026-09-26 "$here/bin/scan-gate" "$sg/clean.json" "$sg/clean.json"
expect 1 "scan-gate: an exception with no expiry blocks the release" env GRYPE_CONFIG="$sg/noexp.yaml" TODAY=2026-09-26 "$here/bin/scan-gate" "$sg/clean.json" "$sg/clean.json"
expect 1 "scan-gate: an expired exception blocks the release" env GRYPE_CONFIG="$sg/old.yaml" TODAY=2026-09-26 "$here/bin/scan-gate" "$sg/clean.json" "$sg/clean.json"
expect 0 "scan-gate: the repository's own .grype.yaml has valid expiries" env GRYPE_CONFIG="$here/.grype.yaml" TODAY=2026-09-26 "$here/bin/scan-gate" "$sg/clean.json" "$sg/clean.json"

# --- bin/dev
expect 0 "bin/dev: is valid shell" bash -n "$here/bin/dev"
expect 0 "bin/setup: is valid shell" bash -n "$here/bin/setup"

echo "selftest: $pass passed, $fail failed"
[ $fail -eq 0 ]
