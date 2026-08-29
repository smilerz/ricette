# Provenance

This project is an **independent implementation**. It is not a port, fork, or
derivative of any existing recipe or meal-planning application.

## What prior applications may inform

Prior recipe and meal-planning applications (including but not limited to
Tandoor) may inform:

- requirements
- domain understanding
- product expectations
- workflow understanding
- user pain points

They must **not** be implementation templates.

## Explicitly prohibited

The following are prohibited, for both human contributors and AI coding agents:

- source translation from Tandoor or another protected implementation
- file-by-file ports
- schema copying
- migration copying
- fixture copying
- test copying
- translation copying
- asset copying
- documentation copying
- copying distinctive implementation structures
- instructing an AI agent to inspect old source and recreate its implementation

## How to write requirements

Requirements must be expressed **behaviorally** — as product/domain statements,
not as instructions to reproduce another project's implementation.

**Correct:**

> Foods can form hierarchical relationships and support ancestor, descendant,
> subtree, and reparenting operations.

**Incorrect:**

> Rebuild Tandoor's food tree.

This applies to issues, PR descriptions, design docs, and any prompt given to
an AI coding agent working on this repository.

## External material

- External code snippets must have a known origin and license compatible with
  MPL-2.0.
- Test fixtures must be original or appropriately licensed — never copied from
  another project's test suite or sample data.

## Enforcement

This policy is referenced by `AGENTS.md` (binding on AI coding agents working
in this repository) and by ADR-0001 (Independent Implementation and
Provenance), which records the rationale for this policy. Violations are
treated the same as any other rule in `AGENTS.md`: they block merge and are a
CODEOWNER review concern (see `CODEOWNERS` once the repository is on GitHub).
