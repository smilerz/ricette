# Foundation 0 Implementation Plan

Source: `Foundation 0 — Nameless Recipe App.md` (Chris's design baseline).
Purpose: sequence every Foundation 0 control into actionable, ordered work so the
"Repository Gate" (§64) can be honestly declared satisfied before any application
code is written (§7.1, status banner). Section numbers below (`§N`) map back to the
source document for traceability. Check items off as PRs land; each checked item
should point at the PR/commit that satisfied it.

No phase here authorizes writing Laravel/Svelte product code — that only starts at
Phase 16 (§65), after Phase 15's gate audit passes.

---

## Auto-mode enforcement split (tooling note, not a §-numbered item)

Claude Code's auto-mode policy for this repo is split across trust tiers so the repo being worked on cannot edit the rules constraining the work done in it:

- `/home/smilerz/ricette/.claude/settings.json` (committed, project-level): trusted-repo description, normal-development allows, dependency-source policy, environment context, soft-blocked governance-file edits, re-baseline triggers.
- `~/.claude/settings.json` (user-level, outside this repo): hard-deny authority-boundary invariants scoped to `/home/smilerz/ricette` (no direct/force push to `main`, no self-merge, no bypassing required review/CI, no weakening branch protection/CODEOWNERS, no publishing outside the configured repo, no package/container/release publication before configured, no secret exfiltration, no destructive prod ops).

**Honest status of this split**: the hard-deny rules are *independent of project-controlled state, but not tamper-proof* — the scoping to `/home/smilerz/ricette` is semantic (rule text a classifier interprets), not a hard security boundary, and `~/.claude/settings.json` is outside the repo but still writable by the same user account running Claude Code. This is a real trust improvement for Foundation bootstrap, not a finished enforcement guarantee. Don't describe this split as "done" beyond that.

**Follow-up**: once Ricette's controls are proven out and the impact on other projects on this machine (WeekFare, Tandoor) has been assessed, revisit whether any of these hard-deny invariants should be promoted to true machine-wide managed policy at `/etc/claude-code/managed-settings.json` — the only tier documented as non-overridable by project/user settings. Not done yet: creating that file needs root and applies to every Claude Code session on the machine, which is a decision to make deliberately rather than as a side effect of Ricette setup.

**Auto-mode control verification (must pass before this portion is considered done, not just configured):** in a Ricette session, demonstrate —
1. normal autonomous development proceeds without prompting (branch/file edits, tests, local container build, an approved-registry dependency install, a commit, a feature-branch push, `gh pr create`);
2. each representative hard-denied action is actually blocked when attempted (direct push to `main`, self-merge, bypassing a required check, publishing outside the configured repo, committing a fake secret, a `prod`-named destructive action);
3. a representative governance-file edit (e.g. `AGENTS.md` or CODEOWNERS) is soft-blocked — flagged conspicuously rather than either silently allowed or hard-blocked;
4. every configured hook (including `untrusted-content-note.sh`) executes successfully and produces its intended output under the same shell/environment Claude Code actually uses — not just a permissions check.
   - `untrusted-content-note.sh`: **verified 2026-08-29.** Was failing with `Permission denied` (missing executable bit); fixed by the user directly (`chmod +x`, outside Claude's own tool access per guardrail). Pipe-tested all four cases: `WebFetch` fires with correct JSON, `Bash` containing `gh pr view`/`gh api ...issues|pulls|comments` fires with correct JSON, an unrelated `Bash` command exits 0 silently, an unmatched tool (`Read`) exits 0 silently. Also confirmed firing live inside the actual Claude Code harness (its `additionalContext` was injected automatically during the `gh pr view` test above), not just as a standalone script. Items 1–3 of this checklist remain unverified — pending Git init and at least one representative PR/branch to exercise allow/hard-deny/soft-deny behavior against.

This step turns the policy from "configuration looks right" into tested enforcement, and should be run again after any change to either settings file or to the eventual managed-policy tier.

---

## Phase 0 — Repo Bootstrap (prerequisite, not a §-numbered item)

- [ ] Choose temporary generic repo name (§68 "Temporary repository name")
- [ ] `git init`, push empty repo to GitHub, set default branch `main` (§2)
- [ ] Add root `.gitignore`, `.editorconfig` (§30 "Repository-wide")

## Phase 1 — Legal

- [ ] `LICENSE` — MPL-2.0 text, pending focused legal sanity check before public release (§9)
- [ ] `PROVENANCE.md` — independent-implementation policy; explicit prohibited list (source translation, file-by-file ports, schema/migration/fixture/test/asset/doc copying, "inspect old source and recreate" instructions); behavioral requirement-writing example (§8)
- [ ] DCO 1.1 policy text + sign-off enforcement (DCO GitHub Action on PRs) (§10)

## Phase 2 — Governance Scaffolding

- [ ] Create doc tree exactly as specified: `GOVERNANCE.md`, `CONTRIBUTING.md`, `SECURITY.md`, `SUPPORT.md`, `CODE_OF_CONDUCT.md`, `README.md`, `docs/adr/`, `docs/architecture/principles.md`, `docs/security/threat-model.md`, `docs/development/{setup,testing,style,dependencies,ai-development}.md`, `docs/product/{principles,glossary}.md` (§14)
- [ ] `GOVERNANCE.md`: state governance lives in this repo (not a separate one) until multiple product repos exist (§13, §55)
- [ ] Adopt MADR-style ADR template (status/context/decision/alternatives/rationale/consequences/reconsideration/supersession) (§15)
- [ ] Write Foundation ADR set (ADR-0001 through ADR-0018) per the topic list in §16 — each ADR "Accepted" status, ready for later supersession rather than rewriting
- [ ] Document AI trust model in `AGENTS.md`/`docs/security/threat-model.md`: untrusted-input list (issues, PR comments, uploads, imported pages, recipe content, external docs, embedded prompts); explicit statement that untrusted content never supersedes policy/ADRs/maintainer instructions; no production/unrestricted credentials for agents (§18)

## Phase 3 — AI Development Contract

- [ ] `AGENTS.md`: architecture invariants, provenance restrictions, security rules, dependency rules, test/doc/translation/accessibility requirements, canonical commands, Definition of Done, prohibited shortcuts, governance-file protection rules (§17)
- [ ] Ensure any model-specific instruction files (e.g. `CLAUDE.md`, `.cursor/rules`) reference `AGENTS.md` rather than forking policy (§17)
- [ ] Design Layer 1: enable GitHub-native AI PR review (§21)
- [ ] Design Layer 2: trusted project-policy reviewer — reads PR diff/changed source/tests/docs + accepted ADRs + canonical policy from protected repo state (not contributor branch); must not execute PR code; reports required check `project-policy-review` with categories Architecture/Security/Test/Documentation Review (§21)
- [ ] Encode AI-on-AI review checklist (invented APIs, implementation-derived tests, silent fallbacks, swallowed exceptions, excessive defensive abstraction, unjustified dependencies, invalidating mocks, unsupported comments, superficial coverage) into reviewer prompt/policy (§20, §22)

### Phase 3a — Independent-reviewer gate design (extends §21 Layer 2, feeds ADR-0011)

Three Claude Code hook-driven checkpoints against an externally hosted reviewer (`ricette-reviewer`), so a second, independently-instructed model checks Claude's work at each stage rather than only at PR time:

- [ ] **Plan gate** — `PreToolUse` hook on `ExitPlanMode`: sends the proposed plan + accepted ADRs + `AGENTS.md` + relevant requirements to the reviewer; on `REVISE` the hook denies the exit and returns feedback for Claude to act on; on `ESCALATE_TO_HUMAN` (genuine product/governance judgment calls) it surfaces to the maintainer instead of auto-looping
- [ ] **Decision gate** — an MCP tool (`review_decision(question, proposed_decision, alternatives, evidence)`) that `AGENTS.md` requires Claude to call before: adding a dependency, introducing a new architectural abstraction, choosing a lasting DB representation, diverging SQLite/PostgreSQL behavior, changing a security boundary, changing an entitlement/commercial boundary, adding an infrastructure requirement, deviating from an accepted ADR, or adding a new persistent public API
- [ ] **Completion gate** — `Stop` hook: runs `./bin/verify`, then sends implementation/tests/docs to the reviewer for a requirements-vs-implementation check (meaningful tests, doc/translation/ADR completeness, architecture drift, security, AI-shortcut smells per §22); on failure the hook blocks stop and feeds the reason back so Claude repairs and retries
- [ ] Reviewer service loads its governing context (`AGENTS.md`, `docs/adr/**`, `docs/architecture/**`, `docs/security/**`) from protected `main`, never from the contributor/agent branch — preserves the "authoritative policy isn't controlled by the branch under review" property from §21
- [ ] Model tiering via two named roles, not a hardcoded model string in hook logic — `REVIEW_MODEL_CRITICAL` (plan gate, architecture/security decisions, escalation) currently `gpt-5.6-sol`; `REVIEW_MODEL_ROUTINE` (routine completion/dependency/doc-completeness checks, PR-semantic review) currently `gpt-5.6-terra`. ADR-0011 (draft: `docs/adr/0011-ai-code-review-model.md`) specifies "independent second-model review via configurable critical/routine roles" as the architectural decision — swapping which model fills a role later is an operational config change, not an ADR-triggering architecture change, unless reviewer capability/behavior materially changes
- [ ] Register the mandatory hook(s) in **user-level or managed** Claude Code settings, not the project's own `.claude/settings.json` — the repo (which agents actively modify) should describe this policy, but shouldn't be the thing that can disable its own enforcement
- [ ] Credential handling: the OpenAI API key is supplied to the trusted reviewer service from **outside** the Ricette repo (deployment/host-level secret, e.g. env var on the box running the reviewer) — never committed, never placed in project `.env`/`.env.example`, and never readable from application/agent-controlled configuration
- [ ] Deferred until repo init + canonical governance/ADR/security docs exist (Phase 0 through Phase 2): building the actual hook scripts, MCP server, and reviewer service. This phase entry stays design-only until then.

## Phase 4 — Repository Protection

- [ ] Protect `main`: require PRs, required status checks, required review, resolved conversations, no force-push, no branch deletion, protected release tags, controlled merge strategy (§23)
- [ ] `CODEOWNERS` covering: `.github/**`, `.claude/**` (added beyond §24's list — a change to the auto-mode classifier policy is at least as sensitive as a change to `AGENTS.md`), `AGENTS.md`, `GOVERNANCE.md`, `PROVENANCE.md`, `LICENSE*`, `SECURITY.md`, `CONTRIBUTING.md`, `docs/adr/**`, `docs/security/**`, `composer.json`/`composer.lock`, `package.json`/frontend lockfile, `database/migrations/**`, auth/authz/entitlement/billing-adapter code, deployment config, security-sensitive code (§24)

## Phase 5 — Contribution Policy

- [ ] `CONTRIBUTING.md`: contribution contract = implementation + tests + documentation (§25); feature requirements (§26); bug-fix requirements incl. "regression test must fail before the fix" (§27); architecture-change requirements incl. ADR update (§28)
- [ ] Define `exception:no-test` / `exception:no-doc` maintainer-controlled labels (§29)
- [ ] Implement required CI check `contribution-policy`: verifies tests+docs present for behavior changes, translation keys for user-facing changes, honors exception labels (§48)

## Phase 6 — Machine-Enforced Style

- [ ] PHP: Laravel Pint config committed (§30)
- [ ] Frontend: Prettier + ESLint + `tsconfig` strict mode (no implicit `any`) + `svelte-check`, suppressions require justification (§30)
- [ ] Repo-wide: Markdown lint/format, YAML validation, JSON formatting, GitHub Actions linting, Dockerfile linting, spelling check (§30)

## Phase 7 — Canonical Developer Commands

- [ ] `./bin/format` — auto-fixes formatting across PHP/TS/repo-wide tooling (§31)
- [ ] `./bin/verify` — single command proving admissibility; starts as a stub and grows checks as later phases land (formatting, PHPStan, TS/Svelte checks, unit/feature/component tests, SQLite+PostgreSQL integration, browser tests, a11y checks, translation validation, doc validation, dependency-policy checks, security scans, coverage incl. changed-code coverage, prod frontend build, container build sanity) (§31, §32)
- [ ] Wire CI to invoke the same `./bin/verify` targets as local — no drift between local/remote "done" (§32)

## Phase 8 — Static Analysis

- [ ] PHPStan + Larastan targeting level 10 from the start; no large ignore baseline (§33)
- [ ] TS strict mode + ESLint + svelte-check wired into CI; treat warnings as non-permanent (§33)

## Phase 9 — Dependency Governance & Supply Chain

- [ ] Document dependency decision order (framework-native → mature package → custom) and required justification fields (problem, why framework is insufficient, maturity, maintenance activity, license, transitive cost, security implications, self-hosting consequences, replacement difficulty) in `docs/development/dependencies.md` (§34)
- [ ] Decide JS package manager (lean: pnpm, unless Laravel scaffolding friction outweighs it) — write small tooling decision record (§34, §68)
- [ ] Commit lockfiles as mandatory CI check
- [ ] Enable Dependabot, dependency review, secret scanning + push protection, container vulnerability scanning, package-license checks, SBOM generation, artifact provenance, pinned external GitHub Actions (pin to immutable SHAs) (§35)
- [ ] Plan short-lived OIDC/federated credentials for future hosted cloud deploys instead of long-lived secrets (§35)

## Phase 10 — Security Foundations

- [ ] `docs/security/threat-model.md` covering: auth, sessions, household authorization, recipe import, uploads, user-generated content, background processing, AI integrations, billing/entitlements, self-hosted defaults (§36)
- [ ] Household isolation test plan: same-household access, cross-household denial, ID guessing, indirect relationships, background-job authorization, shared-link behavior — treat horizontal authz failures as high severity (§37)
- [ ] Recipe-import security design: SSRF/private-address/cloud-metadata protection, redirect validation, timeouts, size limits, content-type handling, safe parsing boundaries (§38)
- [ ] Upload security design: type validation, size limits, safe image processing, malformed-file handling, decompression-bomb protection, storage isolation, generated (not user-supplied) filenames (§39)
- [ ] AI security controls doc: prompt injection, cross-user leakage, tool-use escalation, unbounded spend, malformed structured output, hallucinated actions, malicious imported content, server-side validation of AI-generated structured data (§40)
- [ ] Automated security tooling: Semgrep, Larastan/PHPStan, Composer audit (PHP); CodeQL, package audit, lint security rules, secret scanning, dependency review (TS/repo) (§41)
- [ ] Confirm CODEOWNERS enforces human review on all security-sensitive paths (§41, ties to Phase 4)

## Phase 11 — Testing Architecture

- [ ] Domain/unit: Pest — quantities, unit conversion, food hierarchy, entitlement logic, transformations, invariants (§42)
- [ ] Laravel feature/integration tests: routing, authz, validation, transactions, persistence, jobs, Inertia responses, security boundaries (§42)
- [ ] Svelte component tests: Vitest + Testing Library — interactions, state transitions, component contracts, a11y behavior (§42)
- [ ] Browser tests: Playwright, reserved for meaningful e2e journeys (account creation, household setup, recipe create/edit, food hierarchy manipulation, recipe import, meal planning, shopping, inventory) — do not duplicate unit coverage (§42, §43)
- [ ] Dual-database CI matrix (SQLite + PostgreSQL) covering migrations, constraints, model behavior, hierarchy queries, transactions, queue persistence, search abstractions, upgrade paths; green PostgreSQL is not sufficient if SQLite is broken (§44)
- [ ] Configure coverage tooling + thresholds: PHP global ≥85% / changed ≥95%; frontend global line/stmt ≥85%, branch ≥80%, changed ≥95% (§45, §68 "Coverage implementation")
- [ ] Identify critical-path code requiring near-complete meaningful coverage: authorization, household boundaries, entitlement logic, unit conversion, quantity calc, importer security, billing state changes (§46)
- [ ] Select PHP mutation-testing framework; apply selectively to units/quantities/entitlement rules/permission predicates/hierarchy invariants/billing transitions (§47, §68)

## Phase 12 — Internationalization & Accessibility

- [ ] i18n architecture ADR/doc: no hardcoded strings, consistent keys, one canonical architecture, plural/interpolation support, locale-aware dates/numbers/units, fallback locale, CI translation validation (§49)
- [ ] Pseudo-localization + RTL test/pseudo-locale support early (§49)
- [ ] Translation contribution rule: user-visible PRs include keys in the same PR; machine translation assists but isn't auto-authoritative (§50)
- [ ] Accessibility baseline WCAG 2.2 AA documented; canonical-control requirements (keyboard nav, focus visibility, semantic HTML, accessible names, screen-reader behavior, dialog/drawer focus mgmt, touch targets, reduced motion, drag/drop alternatives, non-color-only indicators) folded into component definitions, not remediation backlog (§51)
- [ ] UI component strategy doc: commodity primitives via established libs (dialog, popover, select, combobox, tabs, menu, toast, date controls) vs. domain-owned components (`FoodTree`, `IngredientRow`, `QuantityInput`, `UnitSelector`, `RecipeCard`, `RecipeEditor`, `RecipeImporter`, `MealSlot`, `MealPlanner`, `ShoppingItem`) (§52)

## Phase 13 — Documentation & Support Model

- [ ] Confirm docs categories populated: architecture (why), developer (how structured/extended), user (how features work), operations (install/upgrade/backup/restore/troubleshoot), security (threat model + disclosure) (§53)
- [ ] State Wiki policy: GitHub Wiki never authoritative for architecture/security/AI/governance/contribution/release policy (§54)
- [ ] Support model doc: GitHub Discussions (install help, questions, community support) vs Issues (defects, feature proposals) vs private vulnerability reporting; community = best effort, no SLA; note hosted gets separate commercial support (§56)
- [ ] `SECURITY.md`: supported versions, private disclosure mechanism, response expectations, scope, coordinated disclosure; enable GitHub private vulnerability reporting (§57)

## Phase 14 — Release Engineering

- [ ] Container-first release model: OCI/Docker image, `linux/amd64` + `linux/arm64` targets (§58)
- [ ] Release pipeline eventually emits: semver, immutable image, release notes, migration info, SBOM, build provenance/attestation, upgrade docs; production artifacts only from trusted release workflows (§58)
- [ ] Versioning policy doc: SemVer once compatibility matters; pre-1.0 breaking changes allowed but must be intentional/documented; DB upgrade paths are product functionality (§59)
- [ ] Migration testing plan: upgrade fixtures verifying migration success, data survival, constraint validity, app boot — on both SQLite and PostgreSQL (§60)

## Phase 15 — PR Funnel, Review Tiers & Gate Audit

- [ ] Wire full required-check funnel from §61 diagram into branch protection: format/style, static analysis, PHP tests, Svelte tests, SQLite tests, PostgreSQL tests, browser tests, a11y checks, dependency review, security scanning, translation checks, doc checks, coverage, changed coverage, contribution-policy, AI policy review, human review
- [ ] Document risk-based review tiers: ordinary changes (checks + AI review + 1 human approval); sensitive changes — auth/authz/entitlements/billing/migrations/dependencies/CI/deployment/security/`AGENTS.md` (checks + AI review + CODEOWNER approval); governance changes — license/provenance/architecture invariants/security policy/AI review policy/contribution requirements (explicit maintainer approval) (§62)
- [ ] Publish Definition of Done checklist (§63) as the canonical merge bar
- [ ] **Gate audit**: walk every bullet in §64 (Legal, Governance, Development, Security, Testing, AI, Product architecture, Release) and confirm each is actually enforced, not just documented, before declaring Foundation 0 complete

## Phase 16 — First Application PR (§65)

Only after Phase 15's gate audit passes. Deliberately near-zero product functionality; must prove:
- [ ] Laravel 13 boots, Svelte 5 boots, TS strict mode works, Inertia works
- [ ] SQLite works, PostgreSQL works
- [ ] One page renders; frontend assets compile
- [ ] One background job executes
- [ ] Container builds for both supported architectures
- [ ] Formatting, static analysis, tests, coverage reporting all run
- [ ] AI review runs; documentation checks run; contribution-policy checks run
- [ ] `./bin/verify` succeeds end-to-end

## Phase 17 — First Product Vertical Slice (§66)

Narrow slice in this order, validating domain design, permissions, client interaction, Svelte conventions, Inertia patterns, migrations, SQLite/PostgreSQL portability, translation, accessibility, test/doc practices, and AI development behavior at small scale before broader feature work accelerates:
- [ ] Household
- [ ] User
- [ ] Food
- [ ] Unit
- [ ] Recipe
- [ ] Recipe ingredient
- [ ] Recipe editor
- [ ] Media
- [ ] Basic search

---

## Notes on sequencing

- Phases 1–4 are pure documentation/config and can proceed largely in parallel; they're ordered above by dependency (license before contribution docs before branch protection referencing those docs).
- Phases 5–14 build out the enforcement machinery (`./bin/verify` in Phase 7 is the spine — it starts as a near-empty stub and each later phase adds a real check to it rather than inventing a parallel command).
- Phase 15's gate audit is the actual gate referenced in the source doc's status line ("no application/domain code... until Foundation 0 controls... are established or explicitly deferred by an approved ADR") — any item skipped here must be deferred via an explicit ADR, not silently dropped.
- §67 ("Decisions Settled by Foundation 0") and §69 (success criterion) aren't separate work items — they're the acceptance criteria this whole plan is building toward. §68's small tooling choices are folded into the phase where each belongs (noted inline above) rather than tracked separately.
