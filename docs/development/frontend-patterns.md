# Frontend Patterns

Guidance for Svelte and Inertia code. It refines ADR-0003 and ADR-0004 and does not replace them: domain logic stays server-side, and the browser owns only transient presentation state.

## Settings and defaults

- **Store only what the user changed.** A saved full copy of a setting freezes today's default, so a default added later never reaches existing users. Persist overrides and resolve against current defaults when reading.
- **Read a setting from its persisted source at the point of use**, or inject it explicitly. Avoid globals that a store registers a callback into; they depend on creation order.
- **Anything a gesture opens must also be reachable without one**, and never only through a list the user can trim. Every power-user route ends in the same effect as the click route (`docs/product/principles.md`).

## Structure

- **Cross-cutting client behavior lives in one place** (a request interceptor, for example) with an explicit per-call opt-out. Per-screen flags drift.
- **One owner per dialog.** Whatever triggers it emits an event; the owner opens it.
- **One shared component for each view of a thing.** A recipe summary is one component used by every list and preview, so a fix reaches all of them. Views declare their density instead of receiving a flag per call.
- **Expensive per-row answers are opt-in and scoped to the visible page**, with three states: unknown (null), yes, no. Do not cache without an invalidation plan.
- **Separate refresh from new search.** A refresh keeps the selection and scroll position.

## Interaction

- **A gesture handler handles the whole lifecycle**: movement tolerance, a second finger, the click that follows, stale state, touch callouts, and cleanup. Treat it as a small component of its own, not inline handlers.
- **Async list editing**: capture ids when the action starts, recompute positions after the await, guard against double activation, and ignore stale responses.

See `docs/development/testing.md` for how to test these, and `docs/development/accessibility.md` for the non-gesture and keyboard requirements.
