# Product Principles

> **Status: Draft — exploratory product-design material. Not yet normative.**
>
> This document is written well ahead of Foundation 0's own sequencing
> (§66, Phase 17 — the first product vertical slice doesn't begin until
> Phase 15's gate audit passes). It exists so that real design thinking
> accumulated during Foundation 0 isn't lost to drift, not to quietly
> bypass that sequencing. **Promotion to normative product governance
> happens explicitly in the Phase 16/17 product-design phase, not here.**
> Nothing in this document is referenced from `AGENTS.md`, and no
> contribution is required to comply with it yet. Treat it as the
> working position of an ongoing design conversation, not a checklist to
> enforce.

Ricette should have a short UX constitution rather than rely on "make it
intuitive" as a design instruction. The six principles below are the
top tier; nearly everything else discussed during drafting is
subordinate to one of them and is filed underneath rather than treated
as a co-equal seventh, eighth, or twenty-fifth rule. A constitution that
itself requires holding twenty-five flat principles in working memory
has already violated principle 3.

Two framings sit above all six, and should be read as the lens the rest
of this document is trying to make concrete:

> **The user should manipulate their food and plans, not operate the
> software.**

> **Domain complexity may exist underneath the product without becoming
> interaction complexity for the user.**

---

## 1. Intent maps directly to effect

> An unambiguous user action should perform the intended operation
> without requiring the user to restate, confirm, or enter a mode first.

Selecting a recipe for Tuesday dinner should put it on Tuesday dinner.
Checking milk should check milk. The Tandoor pattern of select → click
Next → confirm what you plainly just selected is unnecessary ceremony
whenever the first action was already unambiguous. Confirmation
earns its place only when an action is genuinely ambiguous, expensive,
destructive, or when it would surface information the user didn't
already have — not merely to restate a selection back at the user.

**Autosave's actual unresolved design problem is undo boundaries, not
whether Save exists.** Immediate response and one-intent-one-action
already settle autosave-vs-explicit-Save in favor of autosave for
ordinary edits. What remains genuinely open is edit-session
granularity: Undo needs to mean "undo my edit to this recipe," not
"undo my last keystroke."

Subordinate to this principle:
- Direct manipulation of the object itself, not forms/wizards for
  ordinary operations (drag a meal, reorder an ingredient, click a
  serving count and change it in place).
- Minimize modes — edit mode, selection mode, rearrange mode should
  exist only where they materially prevent ambiguity.
- Don't confuse selection with action — clicking something should
  ordinarily open it or act on it; "select, then choose what selection
  means" is mainly for multiselect/bulk workflows.
- For cheap, reversible actions, prefer **do → immediate feedback →
  Undo** over "Are you sure?"
- Friction should be proportional to consequence — adding milk is zero
  ceremony; deleting 600 household recipes is substantial friction. Not
  every operation is equally dangerous, and the UI shouldn't treat it
  as such.
- Forms are for actual data entry, not the universal interaction
  language for operations users could just perform directly.

## 2. Users manipulate their food and plans, not the software

> Ricette should expose recipes, meals, ingredients, shopping items and
> household activity directly rather than forcing users to operate its
> internal machinery.

This is probably the sharpest anti-Tandoor principle alongside #4.
Users think "what's for dinner," "where was that chicken recipe," "what
do we need from the store" — not "I'd like to manage my recipe
information architecture."

Subordinate to this principle:
- Preserve context — a small action shouldn't eject the user from what
  they were doing. Opening a recipe from search shouldn't destroy the
  search state. Prefer inline editing → popover → drawer/sheet → full
  workspace, in roughly that escalation order, before reaching for full
  navigation.
- Recognition over recall — autocomplete, recent items, thumbnails,
  contextual suggestions, and visible state should do the remembering;
  users shouldn't have to recall internal vocabulary or where something
  lives.
- Optimize ruthlessly for the common path — "add this recipe to Tuesday
  dinner" should be trivial even though Ricette also supports elaborate
  meal-planning scenarios. The 80% operation shouldn't pay for the
  flexibility the 2% operation needs.
- Don't make users curate the system for its own benefit — merging
  foods, maintaining taxonomy, cleaning units, reconciling duplicate
  ingredients is Ricette's work to shoulder, not a chore users perform
  so the software stays happy.
- Search is infrastructure, available nearly everywhere and
  understanding useful objects/actions — but it accelerates *retrieval*
  of flat objects. It is not a substitute for structural interaction:
  understanding or editing the food hierarchy is a tree-navigation task,
  not a search task, and gets its own direct-manipulation UI
  (`FoodTree`) rather than being routed through a command palette.
- Power is additive — a novice operates by obvious clicking/tapping; an
  experienced user gradually discovers keyboard shortcuts, drag/drop,
  multiselect, bulk actions, and a command palette. Every power-user
  entry point must terminate in the exact same effect as its equivalent
  click path — power changes speed, never behavior.

## 3. The system carries the burden of its own complexity — visibly

> Domain complexity belongs in Ricette, not in the user's head.
> Automation and progressive disclosure should remove work without
> making system behavior mysterious.

**Litmus test:** if explaining what just happened to a first-time user
requires naming an internal Ricette rule or entity, the interaction has
failed this principle — no matter how clean the screen looks. This is
the test that will actually catch violations once archaeology surfaces
the domain's legitimate edge cases dressed up as innocuous screens.

Subordinate to this principle:
- Progressive disclosure hides complexity, **never existence**.
  Provenance, alternate yields, advanced shopping rules, hierarchy
  management, nutrition metadata should appear when relevant, not
  because the fields exist — but an advanced option always gets a
  visible, low-cost affordance (a toggle, a small icon), never only a
  keyboard shortcut or menu path nobody was told about.
- Automate confidently, disclose immediately. If Ricette deduplicates
  ingredients, adjusts shopping quantities, uses pantry inventory,
  interprets an imported recipe, or has AI infer something, the user
  can see what happened and correct it at the moment it happens — not
  buried in a settings page. Automation without inspectability becomes
  distrust.
- Smart defaults should eliminate decisions, not conceal them. Infer
  household, meal slot, serving count, last-used unit, preferred store
  when confidence is high — but make the assumption visible and easy to
  reverse. "Smart" behavior that can't be understood becomes hostile.
- Errors should explain recovery, not just failure. "Could not import
  recipe" is weak; show what was understood, what wasn't, and let the
  user repair it without restarting or losing entered data.

## 4. Navigation follows user goals; workspace follows the task

> Navigation is organized around what users are trying to accomplish,
> while workspace geometry adapts to the nature of that work.

This formalizes the resolution to what would otherwise look like an
open "productivity shell vs. consumer shell vs. adaptive hybrid"
debate. It isn't actually a free choice: principles #1 and #2 (preserve
context, direct manipulation) already rule out both a rigid
persistent-sidebar shell and a full-page-content-transition shell, since
both fight against staying where the user is. An adaptive workspace
under one consistent navigation model is a consequence of the earlier
principles, not an independent fourth option weighed against them.

Navigation destinations are Recipes, Plan, Shopping, Pantry — not
Foods, Units, Keywords, RecipeBooks, MealTypes, or other internal
entities that happen to exist in the data model. Workspace geometry is
free to vary by task: recipe discovery can be visual and image-forward;
meal planning can be spatial/calendar-shaped; shopping can be
touch-first and dense; pantry management can be dense and list-shaped;
recipe editing can use a canvas-plus-inspector layout. Mobile is a
different physical circumstance (shopping in a store, cooking with wet
hands, planning on a couch), not a smaller desktop, and interaction
should adapt to the device while preserving the same concepts and
semantics.

**Consistency is enforced in interaction semantics and shared
components, not page geometry.** Selection, editing, destructive
actions, Undo, menus, keyboard behavior, and feedback should mean the
same thing everywhere, built as literal shared components (one Undo
pattern, one destructive-confirmation pattern, one sync-state
indicator) — while a calendar is free not to look like a recipe
library.

## 5. Shared state must converge, and the truth must remain legible

> Household data is assumed to be concurrently used. Local interactions
> should feel immediate where safe, remote changes should converge
> promptly, and persistence or conflict failures must never be silent.

This earns top-tier status because household collaboration is
structural to the product, not an implementation detail: a household's
shopping list is realistically being viewed and edited from more than
one phone at the same time, and the interaction model needs an actual
answer for that, not just a single-user assumption inherited from
generic "optimistic UI" advice.

Subordinate to this principle:
- Optimistic UI only where failure semantics are actually understood.
  An action that's applied instantly and then silently reversed because
  the server rejected it is worse than a plain confirm would have been
  — it briefly lies to the user.
- Entitlement, auth, and quota rejection get a **preflight** check
  before the optimistic apply, distinct from both "instant apply" and
  a confirmation dialog — a household-count limit or an AI-import quota
  is a known, plannable rejection path, not a generic error.
- An ambient, low-key sync-state indicator ("Saving…/Saved"-style) for
  the normal path; successful ordinary persistence can stay quiet.
- Optimistic failure gets a distinct, more assertive treatment: toast,
  automatic revert, one-tap retry. Silence is fine when things work;
  failure must never be silent.
- Simple, idempotent state (a checked shopping item) can converge
  automatically across devices; genuinely conflicting substantive edits
  (two people editing the same recipe's ingredient list) need stronger
  handling than last-writer-wins.
- Interruption should be cheap — recipe apps are unusually
  interruption-prone (cooking, shopping, switching devices) — draft
  state, scroll position, checked items, and partially edited recipes
  should survive interruption without deliberate save actions.

## 6. Preserve what the user meant and what the user entered

> Ricette may interpret, normalize, and enrich user data for its own
> reasoning, but it does not silently rewrite the user's authored
> expression.

`2 lbs chicken breast` can resolve internally to `Food: chicken breast,
Quantity: 2, Unit: pound` for Ricette's own matching, substitution, and
shopping-list-consolidation purposes — but the recipe continues to
*display* "2 lbs chicken breast," exactly as entered, unless the user
chooses to change it. This creates a clean architectural distinction
between **authored truth** (what the user actually said) and **system
interpretation** (what Ricette inferred from it), and it gives a
concrete rule to apply when archaeology presents a normalization edge
case: attach the interpretation, never overwrite the authorship.

This applies beyond ingredient lines — imported recipe text, source
attribution, recipe adaptations, meal notes, names, and AI-parsed
content all get the same treatment: Ricette's inference sits alongside
what was entered, not in place of it.

---

## Accessibility (cross-cutting)

Accessibility isn't a seventh principle — it's a set of concrete
obligations that fall out of the six above and would disappear
organizationally if left implicit, so it gets its own explicit section
rather than being assumed:

- Every drag action needs a non-drag alternative; every hover affordance
  needs another path (principles #1/#2 — direct manipulation must have
  an accessible equivalent, not just a mouse-shaped one).
- Touch targets matter, especially given shopping and mobile use are
  first-class contexts, not afterthoughts (#4).
- Focus must be predictable; color cannot carry meaning alone (#5 —
  legible state must be legible to everyone).
- This is designed in from the start, not audited in afterward.

---

## Open Interaction Decisions

These are deliberately left unresolved rather than forced into a
principle prematurely. This is the right place to continue design
discussion, not the six principles above:

- Undo/edit-session boundaries — what exactly constitutes one
  undo-able unit for a multi-field autosaving edit (e.g. the recipe
  editor)?
- Concurrent recipe-edit conflict UX — what actually happens when two
  household members edit the same recipe's ingredient list at once?
- How presence of another editor is surfaced, if at all (a "someone
  else is editing this" indicator vs. silent convergence).
- The exact preflight pattern for quota/entitlement checks before an
  optimistic action is allowed to proceed.
- Where the drawer-vs-full-workspace escalation threshold actually
  sits for each domain object (a recipe? a shopping list? a household
  setting?).
- Mobile meal-planner geometry specifically — a calendar's spatial
  metaphor doesn't trivially collapse to a phone screen.
- How much of the canonical food hierarchy a normal user ever
  encounters directly, versus only feeling its effects.
- When AI assistance is ambient (happening without being asked) versus
  explicit (a deliberate action the user invokes) — and how that line
  is communicated.
- What counts as a "staged" operation requiring an explicit
  Done/Apply step despite principle #1's default toward direct,
  confirmation-free action (a candidate: multi-step recipe import
  review, where the user is confirming Ricette's *interpretation* of
  imported content, not merely restating their own selection).
