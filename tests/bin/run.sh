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

dco() { CHECK_REPO=$1 DCO_BASE=main DCO_HEAD=topic "$here/bin/checks/dco"; }
cp_check() { CHECK_REPO=$1 CP_BASE=main CP_HEAD=topic CP_LABELS=${2:-} "$here/bin/checks/contribution-policy"; }

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

echo "selftest: $pass passed, $fail failed"
[ $fail -eq 0 ]
