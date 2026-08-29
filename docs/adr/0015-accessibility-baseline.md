# ADR-0015 — Accessibility Baseline

## Status

Accepted

## Context

Foundation 0 §51 sets an explicit accessibility baseline rather than leaving it to be discovered via remediation tickets after launch. The product's domain-specific components (food hierarchy trees, drag-and-drop meal planning, ingredient editing) are exactly the kind of rich-interaction UI that commonly fails accessibility if not designed in from the start (§52 names these as components the project must own, not borrow).

## Decision

Baseline: **WCAG 2.2 AA** (§51).

Canonical controls must support: keyboard navigation; focus visibility; semantic HTML; accessible names; screen-reader behavior; dialog/drawer focus management; adequate touch targets; reduced-motion considerations; alternatives for drag/drop interactions; non-color-only indicators.

Accessibility requirements belong in component definitions, not remediation tickets.

UI component strategy (§52): use established libraries for commodity primitives — dialog, popover, select, combobox, tabs, menu, toast, basic date controls — where accessibility is already solved well by mature implementations. Own the domain-specific components — `FoodTree`, `IngredientRow`, `QuantityInput`, `UnitSelector`, `RecipeCard`, `RecipeEditor`, `RecipeImporter`, `MealSlot`, `MealPlanner`, `ShoppingItem` — since these are where the project's actual accessibility risk concentrates, and where a mature off-the-shelf library won't exist.

## Alternatives Considered

- **WCAG 2.1 AA.** Rejected in favor of 2.2 AA — Foundation 0 names 2.2 explicitly, which adds criteria (e.g. focus-appearance, dragging-movements alternatives) directly relevant to this product's drag/drop-heavy interaction model (§4).
- **Build all UI components in-house, including commodity primitives.** Rejected: §52 explicitly directs using established libraries for commodity primitives — reimplementing an accessible dialog/combobox/menu from scratch duplicates already-solved problems and risks a worse accessibility outcome than a mature library, contrary to §7.8 (framework/mature-dependency before custom).
- **Treat accessibility as a post-launch remediation pass.** Rejected: explicitly ruled out by §51 ("accessibility requirements belong in component definitions, not remediation tickets").

## Rationale

Given the product's specific interaction model (drag-and-drop food reparenting, tree manipulation, meal-plan drag/drop — §4), deferring accessibility design is higher-risk than for a conventional CRUD UI. Baking requirements into component definitions from the start is cheaper than remediation.

## Consequences

- Every domain-specific component (`FoodTree`, `MealPlanner`, etc.) needs an accessible alternative to any drag/drop interaction at design time, not as a follow-up.
- Component tests (§42, Svelte component testing layer) must cover accessibility behavior, not just interaction/state.
- Adds design cost to each new domain-specific component; commodity primitives are deliberately exempted from this cost by sourcing them from mature libraries instead.

## Conditions for Reconsideration

- If WCAG guidance is superseded by a later version before this project reaches a stage where re-baselining is disruptive.

## Supersession

None. This is the initial ADR for this decision area.
