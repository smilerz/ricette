# Households

A household is the tenant: the boundary that later features (recipes, meal plans, shopping lists) belong to.

## Data model

- `households`: a name and timestamps. There is **no owner column**.
- `household_user` (the membership record, `App\Models\Membership`): household, user and a `role` (`owner` or
  `member`). It is the only source of truth for who belongs to a household and who owns it. A user can belong to
  several households; the pair (household, user) is unique.

Exactly one owner is created with a household. Ownership transfer and multiple-owner policy are not decided yet.

## Creating a household

A signed-in user creates a household from `/households/create` with a name. The household and the creator's
owner membership are written in one transaction, so both exist or neither does (`App\Actions\Households\CreateHousehold`).

The requirement's optional initial member list is **deferred** (issue #74): admitting other people safely needs a
consent or invitation mechanism, and a capability to add other users directly would let any signed-in person
force-add others. The creation request accepts only a name and ignores any other field. Admission is later
membership work and should use invitation and acceptance, or another design decided under ADR-0027.

## Which household a request acts in

`App\Support\ActiveHousehold` selects it, on the server: the id kept in the session, or the user's only
membership. The selection is always checked against the authenticated user's own memberships. A household id
sent by the browser (a parameter, a header, a forged session value) never establishes scope by itself: an id the
user does not belong to is ignored, and with several households and none selected the household is left unset
rather than guessed. Creating a household makes it the active one.

The active household, and the user's role in it, are shared with every page as the `household` prop.
