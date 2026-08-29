# ADR-0008 — DCO Contribution Certification

## Status

Accepted

## Context

Contributions need a certification mechanism confirming contributors have the right to submit their work under the project's license (ADR-0007, MPL-2.0). The two common mechanisms are a Developer Certificate of Origin (DCO) sign-off or a Contributor License Agreement (CLA). The project wants a mechanism that confirms provenance/rights without granting the project extra unilateral rights over contributed code.

## Decision

Use the Developer Certificate of Origin 1.1 (DCO) rather than a CLA. Every contribution must carry the required sign-off.

The DCO confirms contributors have the right to submit their work under the project's license. It does **not** prevent the project from:

- commercially operating contributed code;
- hosting contributed code;
- charging for managed service;
- combining MPL-covered code with proprietary services or separate proprietary files where permitted by MPL.

The project does not receive unilateral rights to convert third-party MPL-covered contributions into proprietary code.

## Alternatives Considered

- **Contributor License Agreement (CLA):** rejected for now — a CLA would grant the project broader rights over contributed code (typically including the right to relicense) than is currently justified. A speculative future business need is insufficient reason to impose a CLA today.
- **No certification mechanism:** rejected — provides no record of contributors' right to submit under the project license, which is a real legal gap once the project is public and accepting outside contributions.

## Rationale

DCO gives the provenance guarantee the project needs (contributors affirm they have the right to submit their work) without granting the project rights beyond what MPL-2.0 already provides. This matches the project's stance that commercial value does not require closing community contributions (ADR-0007).

## Consequences

- Every PR requires DCO sign-off enforcement (a required CI check) before merge.
- The project cannot unilaterally relicense community-contributed core files to proprietary terms; any such need would require either per-contribution agreement or a contribution-model change, not a policy reinterpretation.

## Conditions for Reconsideration

If a future business requirement genuinely requires proprietary relicensing of community-written core files, the contribution model may be reconsidered — but a speculative future possibility is insufficient reason to impose a CLA today.

## Supersession

None. This is the initial ADR for this decision area.
