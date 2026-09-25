## Summary

<!-- What changes and why, in a few sentences. -->

## Issue

<!-- Refs #123 (or Closes #123). Every change should trace to an Issue. -->

## How it was tested

<!-- Tests added or changed, and anything you checked by hand. -->

## Checklist

- [ ] Tests for the behavior, including negative paths (and a regression test that fails before a bug fix)
- [ ] Documentation updated in this change
- [ ] Translation keys added for any user-visible text
- [ ] `./bin/verify` (or `./bin/verify lint php-static php-test frontend`) passes locally
- [ ] Every commit is signed off (`-s`)
- [ ] No secrets, credentials or personal data
- [ ] Migrations run on both SQLite and PostgreSQL (if the schema changed)

## Protected paths or material decisions

<!-- Does this touch AGENTS.md, GOVERNANCE.md, LICENSE, SECURITY.md, CONTRIBUTING.md, docs/adr/**, docs/security/**,
.github/**, dependency manifests or the Dockerfile? Does it involve a choice that needs the maintainer's decision
(ADR-0027)? Say so here. -->
