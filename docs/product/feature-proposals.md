# Feature Proposals (Draft)

> **Status: Draft. Not normative, not accepted, not scheduled.** Behavioral requirements gathered ahead of the Phase 16/17
> product-design phase so they are not lost. Each is meant to become a `proposal` Issue (see
> `.github/ISSUE_TEMPLATE/feature_proposal.yml`) and be triaged by the maintainer. Writing them here does not authorize
> implementing them (ADR-0027). Principle numbers refer to `docs/product/principles.md`.
>
> They state user-visible behavior only, with no implementation prescription and no reference to any other application
> (`PROVENANCE.md`). Keep it that way when editing.

---

## 1. "Can I cook this now?" visible on recipe cards

### The problem

When deciding what to cook, a household has to open each recipe and compare it against what is in the pantry. The
question people actually ask ("what can we make tonight?") is not answerable from a list of recipes.

### What you would like

- Every recipe card can show whether the household can cook it from its pantry now, and if not, how many ingredients are
  missing (principle 3: automation is visible and inspectable; principle 2: expose food, not machinery).
- Three honest states: can cook, missing N, and unknown (pantry has no information yet). Unknown is never shown as "can't".
- Tapping the marker shows which ingredients are missing (principle 3: correctable at the moment it happens).
- Always on for the household's own recipes, not a setting to hunt for; the cost of showing it must not slow browsing
  large collections (acceptance: browsing a household with a few thousand recipes stays responsive; to be defined as a
  measurable budget).
- Household isolation applies: the result reflects only the viewing household's pantry (AGENTS.md security rules; needs the
  same-household, cross-household, ID-guessing and shared-link tests).
- Readiness reflects pantry and recipe changes promptly, with no manual refresh.

### Alternatives you considered

- Opt-in per page or per search: simpler but hides the feature, which conflicts with principle 3 ("progressive
  disclosure hides complexity, never existence").
- A listed substitute in the pantry satisfies an ingredient, and the card says so ("can cook, using X for Y"). A missing
  optional ingredient never counts against "can cook"; it is shown separately ("+2 optional missing").

---

## 2. Quick preview of a recipe without leaving the list

### The problem

Judging whether a recipe is the one you meant means opening it, losing your place in the search, collection or plan
(principle 2: preserve context).

### What you would like

- A lightweight preview of a recipe from any place recipes are listed, without navigating away and without losing scroll
  position or selection.
- Reachable by every input route: touch, mouse, keyboard, and a visible menu item. A gesture is never the only way in
  (accessibility section; principle 3).
- The preview shows the same recipe summary as everywhere else, in a compact density (see proposal 4).
- Closing it returns exactly to where the user was.

### Alternatives you considered

- Always navigate to the recipe page: rejected by principle 2.
- The recipe summary component owns the preview, so every place it appears behaves the same. A list supplies context
  (where focus returns, what next means) and may opt out explicitly where the gesture already means something else
  (for example a draggable meal-plan slot). Default on.

---

## 3. Manage a recipe's collections from the recipe itself

### The problem

Adding a recipe to a collection (recipe book) or taking it out means going to the collection, not the recipe.

### What you would like

- On the recipe, see the collections it belongs to; add to another with one control; remove with an Undo, not a confirm
  and not a Save step (principle 1: do, feedback, Undo).
- Changes apply immediately; a failure is visible and reverts (principle 5).
- Two people changing the same recipe's collections converge without silently losing either change.

### Alternatives you considered

- Edit only from the collection side: forces the user to leave the recipe they are looking at.
- Collections are opt-in, user-authored organization (principle 6), unlike taxonomy upkeep the system should shoulder
  (principle 2). The principles doc only says they are not a top-level navigation destination.
- Open for the maintainer: name, personal vs household-shared, and whether any collections are automatic.

---

## 4. Recipe detail density: full on the recipe page, compact elsewhere

### The problem

Ingredient notes and similar detail belong on the recipe page but clutter compact views such as collections and previews.

### What you would like

- Each view of a recipe declares how dense it is (full or compact) and shows the right amount of detail, with one
  consistent meaning of density across the product.
- The same recipe summary looks and behaves the same in every view; a fix or change to it shows up everywhere (principle 4:
  consistency lives in shared semantics and components).
- Authored text is never altered by density; compact only hides, never rewrites (principle 6).

### Alternatives you considered

- Each view decides ad hoc what to show: drifts over time.

---

## 5. Paging controls for a collection view

### The problem

Moving through a collection one recipe at a time requires going back to the list.

### What you would like

- Previous / next controls placed outside the content, disabled (not hidden) at the first and last recipe.
- Sensible behavior when the user arrives at an arbitrary position (from search, a link, or a jump), including when the
  collection changes underneath them.
- Operable by keyboard and screen reader (accessibility section).

### Alternatives you considered

- Swipe only: violates the rule that gestures are never the only route.
