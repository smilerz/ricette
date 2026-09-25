# ADR-0027 — Agent Decision Authority

## Status

Proposed (governance change; requires explicit maintainer approval)

## Context

A written ADR can look like a decision. In practice an agent chose the container runtime (ADR-0023), the translation architecture (ADR-0024) and, at first, a hand-built authentication layer, and only afterward recorded them. Writing an ADR after building, or building while an ADR sits in Proposed status, does not make the choice the agent's to make. Requirements documents and the Issue catalog say what to deliver; they do not always say how, and some choices are the maintainer's.

## Decision

**An agent may decide, on its own, choices that stay inside an Issue's acceptance criteria and inside existing decisions**: code structure, names, test design, and picking among options that the approved ADRs, dependency policy and Issue leave to it.

**An agent must bring the maintainer the options, with a recommendation and the trade-offs, and wait for a decision, before building, when a choice does any of the following:**

1. adds or replaces a runtime, framework, service, package or other dependency (after applying the dependency policy: framework, then mature package, then custom code);
2. chooses among several ways to satisfy a requirement that the requirement or Issue marks as open;
3. sets security or privacy posture (for example privilege boundaries, what an error reveals, password rules);
4. changes what a self-hosting operator must provision, configure or run;
5. shapes data, schema or interfaces that several later Issues will depend on;
6. changes a governance file or a check that gates merging.

An agent that is unsure whether a choice is in this list treats it as if it were.

**ADR status.** An ADR an agent writes is Proposed. It becomes Accepted only when the maintainer says so, and the ADR records that decision and its date. An ADR does not authorize the work it describes.

**Presenting a decision.** The agent presents it as a discussion in plain terms: the problem, the options with their trade-offs, a recommendation, and the questions that decide it. It does not build the recommended option first.

## Alternatives Considered

- **Leave it to agent judgment.** This is what allowed the choices above to be made without review.
- **Require approval for every choice.** Stops routine work; the list above targets the choices that are costly to reverse or that shape what others must live with.

## Rationale

The maintainer is accountable for the project's direction, its security posture and what it asks of people who run it. Those choices need to be made by them, on options that are laid out clearly, before code makes them expensive to change.

## Consequences

- Agents will sometimes pause for a decision that turns out to be routine. That is the intended trade.
- Existing Proposed ADRs (0023, 0024) stay Proposed until the maintainer decides them.

## Conditions for Reconsideration

Revisit if the pause rate blocks routine work, or if a decision outside the list proves costly.

## Supersession

None. Complements ADR-0010 (agent authority and trust boundaries).
