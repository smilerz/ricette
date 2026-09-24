#!/usr/bin/env bash
# Shared helpers for bin/checks/*. Source this file; do not execute it.

# py_tool <package> <version> <command> [args...]
py_tool() {
  local pkg=$1 ver=$2 cmd=$3
  shift 3
  if command -v uvx >/dev/null 2>&1; then
    uvx --from "$pkg==$ver" "$cmd" "$@"
  elif command -v pipx >/dev/null 2>&1; then
    pipx run --spec "$pkg==$ver" "$cmd" "$@"
  else
    echo "need uvx or pipx to run $cmd" >&2
    return 127
  fi
}

# Runs each named step, continues after a failure, and returns non-zero if any failed.
_steps_failed=0
step() {
  local name=$1
  shift
  echo "-- $name"
  if ! "$@"; then
    echo "FAILED: $name" >&2
    _steps_failed=1
  fi
}
steps_result() { return $_steps_failed; }

require_tool() {
  command -v "$1" >/dev/null 2>&1 || {
    echo "missing required tool: $1 ($2)" >&2
    return 127
  }
}
