# ADR-0004 — Browser-Owned Transient Interaction State

## Status

Accepted

## Context

Given ADR-0003's Svelte/Inertia architecture, a further boundary is needed: which state lives in the browser versus the server. Without an explicit line, transient UI state (e.g. "is this tree node expanded") risks becoming server-persisted for consistency's sake, adding needless round-trips and server complexity; conversely, canonical business state (e.g. "who owns this household") risks leaking into client-only logic, creating authorization and data-integrity gaps (§7.6).

## Decision

The **browser owns transient interaction state**; the **server owns durable truth**.

Browser-owned (§4): ingredient editing, autocomplete, tree expansion, drag and drop, food reparenting, list selection, filtering, sorting, recipe scaling presentation, meal-plan manipulation, shopping interaction, inventory batch editing, optimistic state where appropriate, drawers/sheets/dialogs/contextual interactions, responsive/mobile interaction state.

Server-owned: permissions, canonical quantities, persisted relationships, household ownership, entitlement decisions, validation, transactions, durable workflows.

Server-side rendering may be used for initial page delivery, public content, SEO, or performance, but does not change this split after hydration.

## Alternatives Considered

- **Server-authoritative state for all interactions (round-trip every UI change).** Rejected: works against the client-interactive product goal (§4) and would make ordinary interactions like tree expansion or drag-and-drop noticeably slower.
- **Client-computed canonical values (e.g. client-side quantity/unit conversion treated as authoritative).** Rejected: canonical business rules belong in the server/domain layer (§7.6) — client-side calculation is presentation-only and must be re-validated/recomputed server-side before being treated as truth.

## Rationale

Keeps the product feeling responsive (browser-owned transient interaction) without compromising data integrity or authorization (server-owned durable truth) — directly implements Foundation 0 invariant §7.6.

## Consequences

- Any new feature must be designed with this split in mind: a new interactive component should default to owning its transient state client-side, but must submit changes to the server for canonical persistence and validation.
- Optimistic UI updates are permitted where appropriate but must reconcile with server-confirmed state, not replace it.
- Test strategy follows this split: Svelte component tests cover transient interaction/state transitions (§42), Laravel feature tests cover authorization/validation/persistence (§42) — the two layers are tested separately by design.

## Conditions for Reconsideration

- None anticipated absent a fundamental architecture change (e.g. moving to an offline-first model with local durable state), which would itself require a new ADR.

## Supersession

None. This is the initial ADR for this decision area.
