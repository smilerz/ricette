# Foundation 0 Implementation Plan

Source: `docs/architecture/foundation-0-design-baseline.md` (Chris's design
baseline, reproduced verbatim in-repo so the `§N` citations throughout this
plan and every ADR actually resolve to something committed, rather than an
external file that was only ever read from outside the repository).
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

- [x] Choose temporary generic repo name (§68 "Temporary repository name") — "Ricette (working name)", per `README.md`
- [x] `git init` — done, local repo exists
- [x] Push bootstrap repo to GitHub (§2) — `github.com/smilerz/ricette` created (initially private, later made public — see legal-check note below), `main` established pointing only at the bootstrap commit (`4f855f8`), `chore/foundation-0-bootstrap` pushed as a real PR (#1) against it. Basic branch protection enabled on `main` (no force-push, no deletion) — required review/required status checks deliberately deferred to Phase 4 (need CI/CODEOWNERS first; enabling them before the maintainer's first PR merge risked a self-lockout).
- [ ] Set default branch `main` with the reviewed Foundation content merged onto it (§2) — **not done as of this writing**: `main` currently has only the bootstrap commit; the governance/ADR content lives on `chore/foundation-0-bootstrap` pending PR #1 merge.
- [x] Add root `.gitignore`, `.editorconfig` (§30 "Repository-wide")

## Phase 1 — Legal

- [x] `LICENSE` — MPL-2.0 text committed
- [ ] **MPL-2.0 legal sanity check (ADR-0007)** — still open, and the repository is now public without it having been done first. ADR-0007 requires this "before public release" as a pre-push condition; the repo went public anyway on 2026-08-29 by the maintainer's **explicit, direct decision** during the GitHub bootstrap (public visibility was needed to enable GitHub branch protection on this account's plan). This is recorded here as a deliberate waiver of the pre-publication sequencing, not an oversight — the check itself remains genuinely outstanding and should still be completed; it just no longer gates the repo's visibility, since that decision has already been made.
- [x] `PROVENANCE.md` — independent-implementation policy; explicit prohibited list (source translation, file-by-file ports, schema/migration/fixture/test/asset/doc copying, "inspect old source and recreate" instructions); behavioral requirement-writing example (§8)
- [x] DCO 1.1 policy text (in `CONTRIBUTING.md`) (§10)
- [ ] DCO sign-off enforcement (actual CI/GitHub Action) — **not done**; no CI exists yet. `CONTRIBUTING.md` now says this explicitly rather than claiming CI already enforces it.

## Phase 2 — Governance Scaffolding

- [ ] Create doc tree exactly as specified (§14) — **mostly done, not exact.** Present: `GOVERNANCE.md`, `CONTRIBUTING.md`, `SECURITY.md`, `SUPPORT.md`, `CODE_OF_CONDUCT.md`, `README.md`, `docs/adr/`, `docs/architecture/principles.md`, `docs/security/threat-model.md`, `docs/development/{style,dependencies,testing,documentation,translation,accessibility,ai-development}.md`. `docs/product/principles.md` also now exists, but as an explicitly non-normative **draft** captured ahead of Phase 16/17's own product-design sequencing (not referenced from `AGENTS.md`, no compliance required yet — see the file's own status banner). **Still absent, genuinely deferred (not stubbed):** `docs/development/setup.md` (nothing to document until Laravel/Svelte exist, Phase 16), `docs/product/glossary.md` (product-design work, out of Foundation-0 scope). `GOVERNANCE.md`'s own repo-structure tree now annotates which of these are deferred rather than silently listing them as if present.
- [x] `GOVERNANCE.md`: state governance lives in this repo (not a separate one) until multiple product repos exist (§13, §55)
- [x] Adopt MADR-style ADR template (status/context/decision/alternatives/rationale/consequences/reconsideration/supersession) (§15)
- [x] Write Foundation ADR set (ADR-0001 through ADR-0018) per the topic list in §16 — each ADR "Accepted" status. **Evolved beyond the original set**: ADR-0011 was later split (narrowed to the local harness reviewer) and ADR-0019 added (independent PR reviewer) — see Phase 3/3a/3b.
- [x] Document AI trust model in `AGENTS.md`/`docs/security/threat-model.md`: untrusted-input list (issues, PR comments, uploads, imported pages, recipe content, external docs, embedded prompts); explicit statement that untrusted content never supersedes policy/ADRs/maintainer instructions; no production/unrestricted credentials for agents (§18)

## Phase 3 — AI Development Contract

- [x] `AGENTS.md`: architecture invariants, provenance restrictions, security rules, dependency rules, test/doc/translation/accessibility requirements, canonical commands, Definition of Done, prohibited shortcuts, governance-file protection rules (§17)
- [ ] Ensure any model-specific instruction files (e.g. `CLAUDE.md`, `.cursor/rules`) reference `AGENTS.md` rather than forking policy (§17) — **N/A for now**: no such file exists in this repo yet to check; revisit if one is added
- [ ] Enable Layer 1: GitHub-native AI PR review (§21) — design-only until a GitHub remote exists; nothing is actually enabled
- [x] Design Layer 2: independent PR semantic reviewer — see ADR-0019 (`docs/adr/0019-independent-pull-request-semantic-review.md`) for the full specification: reads PR diff/changed source/tests/docs + accepted ADRs + canonical policy from protected repo state (not the PR branch); must not execute PR code; author-blind (applies identically to maintainer, Claude Code, and third-party contributor PRs); reports required check `project-policy-review` with categories Architecture/Security/Test/Documentation Review (§21). Design complete; implementation tracked separately in Phase 3b.
- [x] Encode AI-on-AI review checklist (invented APIs, implementation-derived tests, silent fallbacks, swallowed exceptions, excessive defensive abstraction, unjustified dependencies, invalidating mocks, unsupported comments, superficial coverage) into `AGENTS.md`, referenced by both ADR-0011 and ADR-0019 (§20, §22). The checklist is documented; it is not yet embedded in an actual reviewer service prompt, because that service doesn't exist yet (Phase 3a/3b).

### Phase 3a — Local harness reviewer (personal productivity harness, feeds ADR-0011)

**MANDATORY NEXT HARNESS MILESTONE.** The maintainer has decided to build this: implement and verify the personal local reviewer once reviewed Foundation governance reaches trusted `main`, and **before** substantive application implementation (Phase 16+) begins. This is no longer deferred-by-choice — only the PR reviewer (Phase 3b) remains deferred, until GitHub/PR infrastructure exists.

**Not project governance** — this is the maintainer's personal development harness, kept deliberately separate from the project-governed PR reviewer in Phase 3b/ADR-0019 (they must not be the same service wearing two hats: different authority, different audience, different policy source, different posture — collaborative here, adversarial there). Three Claude Code hook-driven checkpoints against an externally hosted reviewer, so a second, independently-instructed model checks Claude's work at each stage and can let Claude continue **without the maintainer in the loop**, rather than only reviewing at PR time:

- [x] **Plan gate** design — `PreToolUse` hook on `ExitPlanMode`: sends the proposed plan + trusted task authority (see below) + accepted ADRs + `AGENTS.md` to the reviewer; on `REVISE` the hook denies the exit and returns feedback for Claude to act on; on `ESCALATE_TO_HUMAN` it surfaces to the maintainer instead of auto-looping. Mechanism: `updatedInput` must accompany `permissionDecision: "allow"` for `ExitPlanMode` auto-approval, echoing every unchanged input field since `updatedInput` replaces the whole object. **Acceptance test**: hook semantics are version-sensitive — empirically confirm this against the actual installed Claude Code version before trusting it; on mismatch, fail closed and escalate rather than enabling autonomous gating on an unconfirmed mechanism.
- [x] **Decision gate** design — an MCP tool (`review_decision(question, proposed_decision, alternatives, evidence)`). **Not yet true, and must not be presented as true**: `AGENTS.md` does not currently require Claude to call this tool, because the tool doesn't exist. **Acceptance test for this phase's implementation**: once the tool is built and installed, update `AGENTS.md` to require its use before the consequential-decision classes listed in ADR-0011 (dependency, new architectural abstraction, lasting DB representation, SQLite/PostgreSQL divergence, security-boundary change, entitlement/commercial-boundary change, new infrastructure requirement, ADR deviation, new persistent public API) — verify that update actually landed, don't just assume it will.
- [x] **Completion gate** design — `TaskCompleted` (fires via `TaskUpdate` or an agent-team teammate finishing with in-progress tasks; exit code 2 blocks with feedback) as primary gate whenever Task-tracking is in use — a plain session with no Task object never fires it at all. `Stop` (turn-level; decision control is `decision: "block"` + `reason`, plus `additionalContext`, both under an 8-consecutive-block Claude-Code-enforced ceiling) retained as a **stateful backstop**, not a second fresh review: checks for a valid completion-approval record (bound to authoritative task/spec identity, evidence/diff, and policy revision) before letting Claude stop, routes to full review if none exists on any **substantive mutating work** (not just tracked file/code diffs — a migration run or a side-effecting external call counts too). The backstop's own retry budget must stay well under the 8-block ceiling (reusing the 3/2 Routine/Elevated limits) and escalate to the maintainer on exhaustion — it must never keep blocking until Claude Code's own override silently releases the turn with no valid review. Runs `./bin/verify` (once it exists), then sends implementation/tests/docs to the reviewer for a requirements-vs-implementation check against trusted task authority (meaningful tests, doc/translation/ADR completeness, architecture drift, security, AI-shortcut smells per §22). **Acceptance test**: prove the `TaskCompleted` path, the no-Task `Stop`-backstop path, `REVISE`-then-repair convergence, `ESCALATE`, fail-closed infrastructure-failure handling, and the bounded-retry-before-8-block-ceiling behavior all work against synthetic cases before relying on this in real development; version-sensitive hook mechanics fail closed on any runtime/documentation mismatch.
- [x] **Task authority** design: the reviewer evaluates the agent against the maintainer's actual direct instruction and any explicitly approved spec/design or later direct correction, captured via a harness-controlled source (e.g. the trusted session/transcript) — never the agent's own paraphrase of the task. Protected-`main` governance remains separate, unchanged project authority. Issue/PR text (unless explicitly adopted), other external content, and the agent's own diff/tests/evidence are supporting/untrusted inputs, not authority. Approval records bind to authoritative task/spec identity in addition to evidence/diff identity and policy revision.
- [x] Authority-tier design: Routine and Elevated (deterministic-classification-based, not self-reported-confidence-based, per ADR-0011) resolve without the maintainer with default 3/2 revise-cycle limits (adjustable via personal policy); Human-decision escalates on genuine product/commercial/license/provenance/irreversible-tradeoff calls, changing (not implementing within) a security boundary, or retry exhaustion; infrastructure failures fail closed, distinct from content-based `REVISE`
- [x] Reviewer service design loads its governing context (`AGENTS.md`, `docs/adr/**`, `docs/architecture/**`, `docs/security/**`) from protected `main`, never from the branch under review
- [x] Model tiering via two named roles, not a hardcoded model string in hook logic — `REVIEW_MODEL_CRITICAL` (plan gate, architecture/security decisions, escalation) currently `gpt-5.6-sol`; `REVIEW_MODEL_ROUTINE` (routine completion/dependency/doc-completeness checks) currently `gpt-5.6-terra`. ADR-0011 (`docs/adr/0011-local-ai-development-review.md`) specifies "independent second-model review via configurable critical/routine roles" as the architectural decision — swapping which model fills a role later is an operational config change, not an ADR-triggering architecture change, unless reviewer capability/behavior materially changes
- [x] Design specifies the mandatory hook(s) register in the maintainer's **personal** Claude Code configuration (user-level settings), not the project's own `.claude/settings.json` — same "the repo can't disable what constrains it" principle as the auto-mode hard-deny split, applied here to a personal rather than project boundary
- [x] Design specifies personal policy (autonomy level, retry/convergence limits, personally-preferred escalation triggers, model/cost preferences) lives outside the repo (e.g. `~/.claude/reviewer-policy/`) — it is not subject to CODEOWNER review or community contribution rules, because it governs the maintainer's working style, not the project's engineering contract
- [x] Credential/service-isolation design: the reviewer API key is supplied from **outside** the Ricette repo (deployment/host-level secret) — never committed, never placed in project `.env`/`.env.example`, never readable from application/agent-controlled configuration, and the reviewer runs as a narrow fixed-operation service rather than a generic model proxy
- [x] Design states: **do not feed this reviewer's conversation/reasoning into the Phase 3b PR reviewer** — that would anchor the "independent" PR check on whatever already convinced this collaborative one
- [ ] **Not done, now mandatory**: build the actual hook scripts, MCP server, and reviewer service, and run every acceptance test listed above — the next harness milestone once reviewed Foundation governance lands on trusted `main`.

### Phase 3b — Independent PR semantic reviewer design (formal Layer 2 spec, feeds ADR-0019)

**Project governance** — protects the project from any contributor's PR (maintainer, Claude Code, first-time outside contributor, or Dependabot-style automated change) identically. Separate service from Phase 3a, deliberately adversarial rather than collaborative:

- [x] Design specifies review against: **authorized requirements only** (protected-`main` ADRs/policy, plus an explicitly maintainer-accepted product/task spec — never the PR/issue text alone, which is untrusted evidence, per the ADR-0019 fix for the "contributor authors their own rubric" bug), accepted ADRs/architecture, `docs/security/threat-model.md`, tests-prove-requirements (not superficial/implementation-derived, per §20/§22), coverage, documentation, translation, accessibility, dependency policy, `PROVENANCE.md`, and the `CONTRIBUTING.md` contribution contract
- [x] Design specifies fresh context every time — never receives the Phase 3a local-reviewer conversation history, even when the PR originated from Claude Code under that gate
- [x] Design specifies loading `AGENTS.md`/`GOVERNANCE.md`/`docs/adr/**`/`docs/security/**`/`docs/development/**`/`CONTRIBUTING.md` from protected `main` — a PR editing any of these is reviewed against the `main` version, not its own proposed edits, so a contributor cannot weaken the reviewer from inside the PR being reviewed
- [x] Design specifies read-only: must not execute code from the PR under review
- [x] Design specifies author-blind: prompt does not condition on who opened the PR
- [x] Design specifies the required status check `project-policy-review` (`PASS`/`REQUEST_CHANGES`, categories Architecture/Security/Test/Documentation Review per §21); `PASS` satisfies the automated gate only — it does not itself merge the PR
- [x] Design specifies risk tiers: Standard PR (CI + `project-policy-review` PASS + one human approval); Sensitive PR (touches auth/authz/security/dependencies/migrations/entitlements/`.github/**`/`.claude/**`/`AGENTS.md`/`docs/adr/**`/release machinery — adds CODEOWNER review); Governance-changing PR (reviewer output is advisory only — explicit maintainer approval required regardless, since the reviewer cannot bless its own new rules into existence)
- [x] Design specifies a separate model configuration namespace from Phase 3a — `PR_REVIEWER_MODEL_STANDARD` (currently `gpt-5.6-terra`) / `PR_REVIEWER_MODEL_SENSITIVE` (currently `gpt-5.6-sol`) — distinct service, not the Phase 3a reviewer reused
- [x] Design specifies credential/service-isolation handling: same external-secret and narrow-fixed-operation constraints as Phase 3a, configured separately
- [ ] **Not done**: implementation waits until the repository has a GitHub remote and at least one real PR to exercise the required-check wiring against

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
