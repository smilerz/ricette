# ADR-0001 — Independent Implementation and Provenance

## Status

Accepted

## Context

The product domain (recipes, food hierarchies, meal planning, shopping, inventory) is well-trodden ground; several prior open-source and commercial applications solve overlapping problems. Without an explicit boundary, "prior art informs the design" easily slides into copying schemas, migrations, fixtures, tests, or distinctive implementation structures from a specific prior project — creating provenance and licensing risk, and producing a codebase that is a derivative work in substance even if not in literal source.

## Decision

Ricette is an **independent implementation**. Prior recipe applications (e.g. Tandoor) may inform requirements, domain understanding, product expectations, workflow understanding, and known user pain points — but must never be implementation templates.

`PROVENANCE.md` explicitly prohibits:

- source translation from Tandoor or another protected implementation
- file-by-file ports
- schema, migration, fixture, test, translation, asset, or documentation copying
- copying distinctive implementation structures
- instructing an AI agent to inspect old source and recreate its implementation

Requirements are expressed **behaviorally**. Example: "Foods can form hierarchical relationships and support ancestor, descendant, subtree, and reparenting operations" — not "rebuild Tandoor's food tree." External snippets must have known origin and compatible licensing; test fixtures must be original or appropriately licensed.

## Alternatives Considered

- **Fork an existing project.** Rejected: forking (or close-porting) an existing implementation would inherit its architecture, licensing posture, and technical debt wholesale, and is explicitly what this ADR exists to avoid — the goal is a new implementation informed by domain knowledge, not a derivative of a specific codebase.
- **No formal provenance policy, rely on developer judgment.** Rejected: judgment calls about "how similar is too similar" are exactly where an AI-driven development process (§17, §18) needs an explicit, checkable rule rather than an assumption that no one will get too close under time pressure.

## Rationale

Protects the project legally and reputationally, and keeps the codebase a genuine independent implementation rather than a disguised derivative — consistent with the project's stated identity as an independent implementation developed publicly (Foundation 0 status banner, §1).

## Consequences

- Requires `PROVENANCE.md` to exist and be enforced before meaningful application code is written (Foundation 0 §64 gate).
- Contributors and AI agents must phrase requirements behaviorally; code review (human and AI, §20 "AI-on-AI Review Policy") should flag suspiciously close structural resemblance to known prior implementations.
- Slightly increases design effort versus directly porting a known-good structure, in exchange for provenance safety.

## Conditions for Reconsideration

- If a specific prior-art license is confirmed compatible and a maintainer explicitly authorizes bounded reuse of a specific artifact (e.g. a data fixture) — such an exception would be scoped and documented, not a blanket policy change.

## Supersession

None. This is the initial ADR for this decision area.
