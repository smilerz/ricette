# Accessibility Policy

Baseline: **WCAG 2.2 AA**.

## Canonical control requirements

Canonical controls must support:

- keyboard navigation
- focus visibility
- semantic HTML
- accessible names
- screen-reader behavior
- dialog/drawer focus management
- adequate touch targets
- reduced-motion considerations
- alternatives for drag/drop interactions
- non-color-only indicators

Accessibility requirements belong in component definitions, not remediation tickets.

## UI Component Strategy

Use established libraries for commodity primitives where useful:

- dialog
- popover
- select
- combobox
- tabs
- menu
- toast
- basic date controls

Own the domain-specific components. Examples:

- `FoodTree`
- `IngredientRow`
- `QuantityInput`
- `UnitSelector`
- `RecipeCard`
- `RecipeEditor`
- `RecipeImporter`
- `MealSlot`
- `MealPlanner`
- `ShoppingItem`

These become part of the product design language.
