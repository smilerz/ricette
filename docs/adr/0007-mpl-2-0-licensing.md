# ADR-0007 — MPL-2.0 Licensing

## Status

Accepted, subject to a focused legal sanity check before public release (Foundation 0 §9)

## Context

The project ships two deployment paths — a genuinely free, self-hosted community edition, and a hosted/freemium edition with proprietary services and commercial capabilities layered around the same core. The license must make the community edition real open-source software while still allowing commercial operation, hosted use, and proprietary services/files to coexist with the MPL-covered core where legally appropriate. Commercial value must not require closing community contributions.

## Decision

Use the Mozilla Public License 2.0 (MPL-2.0) for the core application.

- The community application is genuine open-source software.
- Modifications to MPL-covered files remain subject to MPL obligations when distributed.
- Commercial use is permitted.
- Hosted use is permitted.
- Proprietary services and separate proprietary files may coexist with the MPL-covered application where legally appropriate (file-level copyleft, not project-level).

## Alternatives Considered

- **Permissive license (MIT/Apache-2.0):** rejected — would allow the core to be forked and relicensed proprietary wholesale, undermining the intent that modifications to the community core stay open.
- **Strong copyleft (AGPL-3.0):** rejected — AGPL's network-use clause would complicate the hosted/freemium model's coexistence with proprietary services more than the project needs; MPL's file-level scope is a better fit for "proprietary services around an open core."
- **Dual licensing (open core company model with a separate commercial license):** rejected for now as unnecessary complexity — the capability/entitlement architecture (ADR-0009) already separates commercial packaging from the codebase without needing two licenses.

## Rationale

MPL-2.0's file-level copyleft is the closest fit to "modifications to the open core stay open, but proprietary services/files can coexist" without the network-copyleft complications of AGPL or the total-relicensing risk of a permissive license.

## Consequences

- Contributors must be comfortable with file-level copyleft obligations when they modify MPL-covered files.
- Proprietary hosted-only code must live in separate files/services, not mixed into MPL-covered files, to preserve the coexistence property.
- **This decision is not final until the legal sanity check named in Foundation 0 §9 has been performed.** Treat "Accepted" here as "accepted pending that check," not as a closed question.
- **That check has not yet been performed, and the repository was made public anyway** on 2026-08-29, by the maintainer's explicit, direct decision during GitHub bootstrap (public visibility was required to enable branch protection on this GitHub account's plan). This is a deliberate waiver of the "before public release" sequencing, recorded here rather than left implicit — the legal check itself remains genuinely outstanding and should still be completed; it no longer blocks visibility, since that decision has already been made.

## Conditions for Reconsideration

- If the focused legal sanity check surfaces a problem with MPL-2.0 for this project's specific commercial model.
- If a future proprietary-relicensing need for community-contributed core files arises — per ADR-0008, that would require revisiting the contribution model, not just the license.

## Supersession

None. This is the initial ADR for this decision area.
