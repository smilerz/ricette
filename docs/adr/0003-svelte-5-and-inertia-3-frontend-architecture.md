# ADR-0003 — Svelte 5 and Inertia 3 Frontend Architecture

## Status

Accepted

## Context

The product is explicitly client-interactive (§4): ingredient editing, autocomplete, tree expansion, drag-and-drop, food reparenting, filtering/sorting, recipe scaling presentation, meal-plan manipulation, shopping and inventory interaction, and rich drawers/sheets/dialogs all need to live in the browser without round-tripping to the server for every interaction. Foundation 0 requires one canonical product frontend architecture (§7.5) — no second frontend paradigm emerging for ordinary features — while avoiding standing up and maintaining a separate REST API surface purely to connect frontend and backend.

## Decision

Use **Svelte 5** (TypeScript) as the single canonical product UI framework, connected to Laravel via **Inertia 3**, rather than a separate SPA calling a REST/GraphQL API.

## Alternatives Considered

- **React or Vue + a separate REST/GraphQL API.** Rejected: would require building and maintaining a second API contract layer purely for frontend/backend communication, duplicating validation and serialization logic Laravel already owns, and doing nothing Inertia doesn't already solve for a single first-party frontend.
- **Server-rendered Blade views with light JS (Livewire/Alpine-style).** Rejected as the *sole* interaction model: rich, transient client-side interaction (drag-and-drop reparenting, live tree manipulation, batch editing) is central to the product per §4, and a primarily server-round-trip interaction model would work against that.
- **Multiple frontend approaches for different feature areas.** Rejected explicitly by §7.5 — product UI must not fragment into competing interaction frameworks.

## Rationale

Inertia lets Svelte own all product UI and transient interaction state while Laravel remains the single source of durable truth, without requiring the web application to become a separate REST application (§3). Svelte 5's reactivity model suits the app's data-shape-driven UI (trees, lists, quantity/unit editing) with less boilerplate than heavier frontend frameworks.

## Consequences

- All product UI work happens in Svelte; no parallel React/Vue components should appear for ordinary features (deviation would need its own ADR per §28).
- Server-side rendering may still be used for initial page delivery, public content, SEO, or performance, but does not change the browser-owned interaction model after hydration (§4).
- Frontend and backend stay coupled through Inertia's page-response model rather than a versioned API contract — simplifies the common case, but means alternate/future clients (e.g. a native mobile app) will need a different integration approach when that becomes relevant (§55).

## Conditions for Reconsideration

- If Inertia's Laravel/Svelte support becomes unmaintained with no viable successor.
- If a genuine second client (native mobile, third-party integration) requires a stable versioned API — that would be a new, additive ADR, not a reversal of this one.

## Supersession

None. This is the initial ADR for this decision area.
