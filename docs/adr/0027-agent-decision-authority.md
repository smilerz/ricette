# ADR-0027 — Agent Decision Authority

## Status

Proposed (governance change; requires explicit maintainer approval)

## Context

A written ADR can look like a decision. In practice an agent chose the container runtime (ADR-0023), the translation architecture (ADR-0024) and, at first, a hand-built authentication layer, and only afterward recorded them. Writing an ADR after building, or building while an ADR sits in Proposed status, does not make the choice the agent's to make.

The boundary between an agent's discretion and the maintainer's authority is not "whatever the Issue left unspecified": an Issue can state an outcome and leave a consequential architectural choice open, while almost every requirement leaves many trivial choices open. The boundary is **materiality and authority**.

## Decision

### Implementation discretion

Agents may make implementation choices on their own when they are consistent with authoritative requirements and accepted decisions, stay within the Issue's acceptance envelope, and do not materially alter product behavior, architecture, security or privacy posture, operator obligations, persistent data or interfaces, governance, or future architectural optionality. Routine choices remain agent discretion even when the requirement does not specify them.

### Human decision required before implementation

Agents must surface alternatives, with a recommendation and the trade-offs, and obtain human approval before making a previously unauthorized choice that materially establishes or changes:

- product or user-visible behavior where the requirements intentionally leave a meaningful trade-off open;
- application or deployment architecture;
- major frameworks, runtimes, infrastructure services or persistent dependencies;
- security, privacy, trust, authentication or authorization posture;
- operator deployment or provisioning obligations;
- persistent data models, or externally visible or shared interfaces, whose choice creates significant migration or compatibility cost;
- governance, authority or enforcement policy;
- anything expensive or difficult to reverse.

An agent unsure whether a choice is material treats it as material.

### ADRs

An agent may identify the need for an architectural decision and draft an ADR. An agent-authored ADR that needs human authority remains **Proposed**; writing or committing it does not authorize implementing what it proposes. Human acceptance must precede implementation unless an existing authoritative decision already determines the outcome.

## Alternatives Considered

- **Leave it to agent judgment.** This is what allowed the choices above to be made without review.
- **Require approval for every unspecified choice.** Stops routine work over choices nobody cares about.
- **Decide by whether the Issue specified it.** Too broad in one direction (a consequential choice can hide inside an unspecified detail) and too narrow in the other (nearly everything is unspecified).

## Rationale

The maintainer is accountable for the project's direction, its security posture and what it asks of the people who run it. Those choices need to be made by them, on options laid out clearly, before code makes them expensive to change. Everything else should move without asking.

## Consequences

- Agents will sometimes pause for a choice that turns out to be routine. That is the intended trade.
- ADR-0023 and ADR-0024 stay Proposed until the maintainer decides them.

## Conditions for Reconsideration

Revisit if the pause rate blocks routine work, or if a costly decision slips through.

## Supersession

None. Complements ADR-0010 (agent authority and trust boundaries).
