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

## Reconciliation note (2026-09-23)

This plan's checkboxes had drifted from reality in both directions — some items were
unchecked despite a substantive, matching artifact already existing (stale
bookkeeping); the auto-mode verification checklist and the ADR-0011 reviewer-mechanism
pivot existed on unmerged branches never folded into this file. This pass reconciles
both: checks off items with real evidence (cited inline), and folds in the
`feature/auto-mode-verification` and `feature/adr-0011-claude-subagent-reviewer`
branches, which is why ADR-0011 and the auto-mode section below changed materially in
this same commit.

**The gate model is also refined here.** The original phase numbering (1–15 before
Phase 16) reads as a strict linear order, but several items in Phases 6/7/8/9/10/11/14
are language/application-dependent tooling (PHP/TS linters, Pest/Vitest/Playwright,
dual-database test execution, a real container build) that cannot meaningfully exist
before Laravel/Svelte are scaffolded. Treating those as pre-Phase-16 prerequisites
creates a bootstrap paradox. Every remaining item is now tagged with one of three
execution gates instead:

- **[A] — required before Phase 16 may begin.** Governance/control-plane mechanisms
  that can and must exist independently of application code (trusted-`main`
  governance, DCO enforcement, branch protection, CODEOWNERS, `bin/verify`
  orchestration, the AI review controls Foundation 0 made mandatory, security/repo
  controls that don't need app code, and the Phase 15 audit itself).
- **[B] — required before the first Phase-16 application PR may merge.**
  Application-dependent tooling whose substrate that PR itself introduces. The PR may
  install/configure these tools, but cannot merge until every applicable one is wired
  through `./bin/verify`, runs in CI, and passes. This is a merge condition of the
  first application PR, not a prerequisite to opening it.
- **[C] — explicitly deferred**, with a concrete trigger, because the work is
  unnecessary for safe first application development.

The target is not 109/109 checkboxes. It's a trustworthy control plane operational
before application development begins, with the application-specific portion of that
control plane becoming operational as a merge condition of the first application PR.

---

## Auto-mode enforcement split (tooling note, not a §-numbered item)

Claude Code's auto-mode policy for this repo is split across trust tiers so the repo being worked on cannot edit the rules constraining the work done in it:

- `/home/smilerz/ricette/.claude/settings.json` (**local only as of 2026-09-02** — see reversal note below): trusted-repo description, normal-development allows, dependency-source policy, environment context, soft-blocked governance-file edits, re-baseline triggers.
- `~/.claude/settings.json` (user-level, outside this repo): hard-deny authority-boundary invariants scoped to `/home/smilerz/ricette` (no direct/force push to `main`, no self-merge, no bypassing required review/CI, no weakening branch protection/CODEOWNERS, no publishing outside the configured repo, no package/container/release publication before configured, no secret exfiltration, no destructive prod ops).

**Reversal note (2026-09-02)**: `.claude/settings.json` was originally committed and shared (Phase 0) so the project-level auto-mode policy would be reviewable governance like any other file. The maintainer explicitly reversed that: the entire `.claude/` directory is now gitignored, so this file is local-only, not committed, not shared, and not visible to anyone else who clones the repo. Consequently every reference elsewhere in this repo's governance to `.claude/**` being CODEOWNER-protected or a tracked "protected path" (`GOVERNANCE.md`, `AGENTS.md`'s "Rules protecting governance files", this file's own Phase 4 CODEOWNERS/PR-risk-tier lists) is currently **moot**, not enforceable — there is nothing tracked under `.claude/` for CODEOWNERS to gate. Those references are left in place as forward-looking guidance in case a future decision re-tracks something under `.claude/`, not because they currently do anything.

**Honest status of this split**: the hard-deny rules are *independent of project-controlled state, but not tamper-proof* — the scoping to `/home/smilerz/ricette` is semantic (rule text a classifier interprets), not a hard security boundary, and `~/.claude/settings.json` is outside the repo but still writable by the same user account running Claude Code. This is a real trust improvement for Foundation bootstrap, not a finished enforcement guarantee. Don't describe this split as "done" beyond that.

**Follow-up**: once Ricette's controls are proven out and the impact on other projects on this machine (WeekFare, Tandoor) has been assessed, revisit whether any of these hard-deny invariants should be promoted to true machine-wide managed policy at `/etc/claude-code/managed-settings.json` — the only tier documented as non-overridable by project/user settings. Not done yet: creating that file needs root and applies to every Claude Code session on the machine, which is a decision to make deliberately rather than as a side effect of Ricette setup.

**Auto-mode control verification — [A], substantially DONE, verified 2026-08-29 against the real repo** (`github.com/smilerz/ricette`, public, `main` protected against force-push/deletion, PR #1 merged):

1. **Ordinary allowed actions — verified.** Branch creation, file edits, commit/push/PR all proceed without blocking. Local container build and an approved-registry dependency install are **not yet applicable** (no Dockerfile/package.json exists prior to Phase 16) — re-verify those two specifically once Phase 16 scaffolding lands.
2. **Hard-deny actions, each attempted directly — verified, with 3 narrow gaps:**
   - Direct commit to `main`: **BLOCKED** (two independent layers).
   - Committing a fake secret: **BLOCKED** (two independent layers).
   - Publishing outside the configured repo (`gh gist create --public`): **BLOCKED**.
   - Self-merge: **BLOCKED** (`gh pr merge` against a real open PR refused).
   - `prod`-named destructive action: **gap** — a generic dangerous-command guard fired before any semantic "prod" classification could be isolated; the action class is covered either way, but this specific test can't confirm the `prod`-naming heuristic is what's doing the work.
   - Bypassing a required check: **gap, not yet testable** — no required status checks exist on `main` yet (depends on Phase 4/CI). Revisit once those land.
3. **Soft-deny (governance-file edit)**: edit succeeded without hard-blocking, consistent with "allowed, not hard-blocked." **Gap**: whether it was *visibly conspicuous* to the maintainer (vs. routine) is only visible from the permission-prompt UI, not from tool results — unconfirmed from the agent side.
4. **Hook execution**: `untrusted-content-note.sh` verified 2026-08-29, all four cases pipe-tested plus one live-fire confirmation.

**Remaining for full closure (small, tracked here not as a new phase item)**: re-run gap 2's `prod`-naming-specificity test and gap 3's conspicuousness question once meaningful to isolate; re-verify item 1's container/dependency-install cases once Phase 16 lands; confirm required-check bypass is blocked once Phase 4/CI exist.

This step should be run again after any change to either settings file or the eventual managed-policy tier.

---

## Phase 0 — Repo Bootstrap (prerequisite, not a §-numbered item)

- [x] Choose temporary generic repo name (§68 "Temporary repository name") — "Ricette (working name)", per `README.md`
- [x] `git init` — done, local repo exists
- [x] Push bootstrap repo to GitHub (§2) — `github.com/smilerz/ricette` created (initially private, later made public — see legal-check note below), `main` established, `chore/foundation-0-bootstrap` pushed as PR #1. Basic branch protection enabled on `main` (no force-push, no deletion).
- [x] **[A] Set default branch `main` with the reviewed Foundation content merged onto it (§2) — DONE.** PR #1 merged 2026-08-29 (`5086f74`). *(This item's own note previously said "not done" — that was itself stale; verified directly against `git log main`, not assumed from prior notes.)* Three further branches with real Foundation-0-relevant content existed unmerged as of this reconciliation and are folded into this same pass: `feature/auto-mode-verification` (PR #2, auto-mode verification results — merged into this branch above), `feature/adr-0011-claude-subagent-reviewer` (not yet a PR — ADR-0011 reviewer-mechanism pivot, merged into this branch above). `feature/product-principles-draft` (PR #3) is unrelated product-design work, not Foundation-0 governance — left untouched, not part of this gate.
- [x] Add root `.gitignore`, `.editorconfig` (§30 "Repository-wide")

## Phase 1 — Legal

- [x] `LICENSE` — MPL-2.0 text committed
- [ ] **[C] MPL-2.0 legal sanity check (ADR-0007)** — deferred. The repo went public on 2026-08-29 by explicit maintainer decision before this check (recorded, not an oversight) because public visibility was needed to enable branch protection on this GitHub plan. **Waiver scope now explicitly extended through the Phase 15 gate**: this check is not required to declare Foundation 0's control plane complete — there is little value in outside legal review before writing private application code, considerable value before actually distributing the software. **New trigger: before first public release/distribution of a usable build**, not before Phase 16 application code, and not merely "repo visibility" (already true and not the gating event).
- [x] `PROVENANCE.md` — independent-implementation policy; explicit prohibited list (source translation, file-by-file ports, schema/migration/fixture/test/asset/doc copying, "inspect old source and recreate" instructions); behavioral requirement-writing example (§8)
- [x] DCO 1.1 policy text (in `CONTRIBUTING.md`) (§10)
- [ ] **[A] DCO sign-off enforcement (actual CI/GitHub Action)** — not done, no CI exists yet. Language-independent (checks commit trailers, not code) — belongs pre-Phase-16.

## Phase 2 — Governance Scaffolding

- [x] **Create doc tree exactly as specified (§14) — DONE, with two explicitly deferred exceptions.** Present: `GOVERNANCE.md`, `CONTRIBUTING.md`, `SECURITY.md`, `SUPPORT.md`, `CODE_OF_CONDUCT.md`, `README.md`, `docs/adr/`, `docs/architecture/principles.md`, `docs/security/threat-model.md`, `docs/development/{style,dependencies,testing,documentation,translation,accessibility,ai-development}.md`. **[C] deferred**: `docs/development/setup.md` (nothing to document until Laravel/Svelte exist — trigger: Phase 16), `docs/product/glossary.md` (product-design work, out of Foundation-0 scope entirely — not gated by anything here). `docs/product/principles.md` now exists as an explicitly non-normative **draft** (PR #3; see the file's own status banner), not yet referenced from `AGENTS.md`.
- [x] `GOVERNANCE.md`: state governance lives in this repo (not a separate one) until multiple product repos exist (§13, §55)
- [x] Adopt MADR-style ADR template (status/context/decision/alternatives/rationale/consequences/reconsideration/supersession) (§15)
- [x] Write Foundation ADR set (ADR-0001 through ADR-0018) per the topic list in §16 — each ADR "Accepted" status. **Evolved beyond the original set**: ADR-0011 was later split (narrowed to the local harness reviewer, then revised again to a Claude-subagent mechanism — see Phase 3a) and ADR-0019 added (independent PR reviewer).
- [x] Document AI trust model in `AGENTS.md`/`docs/security/threat-model.md`: untrusted-input list (issues, PR comments, uploads, imported pages, recipe content, external docs, embedded prompts); explicit statement that untrusted content never supersedes policy/ADRs/maintainer instructions; no production/unrestricted credentials for agents (§18)

## Phase 3 — AI Development Contract

- [x] `AGENTS.md`: architecture invariants, provenance restrictions, security rules, dependency rules, test/doc/translation/accessibility requirements, canonical commands, Definition of Done, prohibited shortcuts, governance-file protection rules (§17)
- [x] **N/A** Ensure any model-specific instruction files (e.g. `CLAUDE.md`, `.cursor/rules`) reference `AGENTS.md` (§17) — no such file exists in this repo; nothing to check. Revisit if one is added.
- [ ] **[A] Enable Layer 1: GitHub-native AI PR review (§21)** — GitHub-settings-only, language-independent, actionable now that the remote exists. Not yet enabled.
- [x] Design Layer 2: independent PR semantic reviewer — see ADR-0019 for full specification. Design complete; implementation tracked in Phase 3b.
- [x] Encode AI-on-AI review checklist into `AGENTS.md`, referenced by both ADR-0011 and ADR-0019 (§20, §22).

### Phase 3a — Local harness reviewer (personal productivity harness, feeds ADR-0011) — SUPERSEDED

**Superseded 2026-09-24 (ADR-0022): the maintainer will not implement these hooks and will use their existing local harness. Removed from the Foundation Gate; the items below are retained as history and will not be built.** Not project governance — the maintainer's personal development harness, deliberately separate from Phase 3b/ADR-0019 (different authority, audience, policy source, posture).

**Design-currentness check performed 2026-09-23** (per explicit instruction, before committing engineering effort to a possibly-superseded design): read `AGENTS.md`, `docs/development/ai-development.md`, ADR-0011, ADR-0019, and the local session-state scratchpad end to end. Finding: the design **was** revised on an unmerged branch (`feature/adr-0011-claude-subagent-reviewer`) — the original external-OpenAI-service mechanism is replaced by a dedicated, user-level Claude Code subagent reviewer (own system prompt, read-only tools, invoked via `command`-type hooks shelling out to `claude -p`, no MCP server, no external credential/service-isolation concern). ADR-0011 itself documents this as a revision, not a supersession ("Supersession: None... revised in place"), and is now folded into this branch. **No further design change found necessary** — the revised design is internally consistent with ADR-0019 and `AGENTS.md`, and no contradiction was found. Proceeding to build the revised design, not the original one.

- [x] **Mechanism design**: reviewer defined at `~/.claude/agents/ricette-local-reviewer.md` (user-level, outside repo), tools restricted to `Read`/`Grep`/`Glob` only. Gates are `command`-type hooks shelling out to `claude -p` (not experimental native agent-hooks). Model roles: `LOCAL_REVIEWER_MODEL_ROUTINE=claude-sonnet-5`, `LOCAL_REVIEWER_MODEL_ELEVATED=claude-opus-5`.
- [x] **Plan gate** design — hook on `ExitPlanMode`. Acceptance test: hook semantics are version-sensitive, empirically confirm before trusting.
- [x] **Decision gate** design — direct subagent invocation, no bespoke MCP tool. Acceptance test: `AGENTS.md` must be updated to require this once the subagent exists — verify the update actually landed.
- [x] **Completion gate** design — `TaskCompleted` primary, `Stop` stateful backstop. Acceptance test: prove all listed paths (TaskCompleted, no-Task backstop, REVISE-repair convergence, ESCALATE, fail-closed infra-failure, bounded-retry) against synthetic cases first.
- [x] **Task authority** design — evaluates against the maintainer's actual instruction/approved spec, never the agent's paraphrase, never the reviewer's own conversation with the implementer.
- [x] Authority-tier design (Routine/Elevated/Human-decision, deterministic classification not self-reported confidence).
- [x] Reviewer context loads from protected `main`, never the branch under review.
- [x] Hooks register in the maintainer's personal Claude Code config, not the project's.
- [x] Personal policy lives outside the repo, not subject to CODEOWNER review.
- [x] Do not feed this reviewer's conversation into the Phase 3b PR reviewer; correlated same-vendor blind spots accepted here specifically, not extended to ADR-0019.
- [ ] **[A] Not done — build the reviewer agent definition file, the command-hook wrapper scripts, approval-record storage, and run every acceptance test above.** This is the actual remaining engineering work.

### Phase 3b — Independent PR semantic reviewer (formal Layer 2, feeds ADR-0019) — [A]

**Project governance**, not personal harness — protects the project from any contributor's PR identically. Deliberately adversarial, cross-vendor by design (unaffected by the Phase 3a mechanism pivot — see ADR-0011's "Relationship to ADR-0019").

**Design-currentness check**: no evidence found of any revision to ADR-0019 or Phase 3b's design anywhere in this repo (tracked or unmerged branches). Design remains current.

- [x] Design specifies review against authorized requirements only (protected-`main` policy + explicitly maintainer-accepted spec, never PR/issue text alone).
- [x] Fresh context every time; never receives Phase 3a's conversation history.
- [x] Loads governance from protected `main`, never the PR's own proposed edits.
- [x] Read-only; must not execute PR code.
- [x] Author-blind.
- [x] Required status check `project-policy-review` (PASS/REQUEST_CHANGES); PASS satisfies the automated gate only.
- [x] Risk tiers: Standard/Sensitive/Governance-changing, with CODEOWNER/explicit-maintainer escalation as appropriate.
- [x] Separate model-config namespace from Phase 3a.
- [x] Credential/service-isolation handling specified.
- [ ] **[A] Not done — build the reviewer service and wire the `project-policy-review` required check.** Its own stated precondition ("GitHub remote + a real PR exist") is already met — nothing external blocks starting this.

## Phase 4 — Repository Protection — [A]

- [ ] Protect `main`: require PRs, required status checks, required review, resolved conversations, no force-push, no branch deletion, protected release tags, controlled merge strategy (§23)
- [ ] `CODEOWNERS` covering the paths listed in §24. Note: several listed paths (`composer.json`, `database/migrations/**`, etc.) don't exist yet — create the file now covering what exists (governance files, `docs/adr/**`, `.github/**`), and add the application-specific paths as part of the Phase-16 PR itself (a [B] addition to this same file, not a new phase item).

## Phase 5 — Contribution Policy

- [x] **`CONTRIBUTING.md`: contribution contract — DONE.** §"The contribution contract" already matches §25–28 verbatim (implementation+tests+documentation; feature/bug-fix/architecture-change requirements incl. regression-test-must-fail-first and required ADR updates).
- [x] **Define `exception:no-test`/`exception:no-doc` labels — policy DONE** (`CONTRIBUTING.md` §"Exceptions"). **[A] residual**: create the actual GitHub labels (trivial, bundle with Phase 4's GitHub-config work).
- [ ] **[A] Implement required CI check `contribution-policy`** (§48) — not done, no CI exists.

## Phase 6 — Machine-Enforced Style

- [ ] **[A] Repo-wide: Markdown lint/format, YAML validation, JSON formatting, GitHub Actions linting, spelling check (§30)** — operates on files that already exist (docs, this plan, future workflow files); language-independent, belongs pre-Phase-16.
- [ ] **[B] PHP: Laravel Pint config committed (§30)** — needs a PHP project to configure against meaningfully; installed/wired as part of the Phase-16 PR.
- [ ] **[B] Frontend: Prettier + ESLint + `tsconfig` strict + `svelte-check` (§30)** — same reasoning, Phase-16 PR.
- [ ] **[B] Dockerfile linting** — needs a Dockerfile to exist; Phase-16 PR.

*(Policy/tool choices for all of the above are already documented in `docs/development/style.md` — that's the decision, not the enforcement. Documenting intent isn't the same as the machine-enforced thing existing.)*

## Phase 7 — Canonical Developer Commands

- [ ] **[A] `./bin/format`, `./bin/verify` (the spine)** — start as stubs covering the [A]-gate checks (repo-wide lint, DCO, contribution-policy, security scanning); each [B] check is added to the same script, not a parallel command, as Phase 16 introduces its substrate.
- [ ] **[A] Wire CI to invoke the same `./bin/verify` targets as local.**

## Phase 8 — Static Analysis — [B] (both items — PHPStan/Larastan and TS-strict/ESLint/svelte-check both need the respective language project to exist; wired as part of the Phase-16 PR, per §33's targets already documented in `docs/development/style.md`)

## Phase 9 — Dependency Governance & Supply Chain

- [x] **Document dependency decision order — DONE** (`docs/development/dependencies.md`, matches §34 verbatim).
- [ ] **[A] Decide JS package manager, write the small tooling decision record** — small, no code dependency, actionable now (`docs/development/dependencies.md` already recommends pnpm pending this record).
- [ ] **[B] Commit lockfiles as mandatory CI check** — no lockfiles exist until Phase 16 introduces `composer.lock`/a JS lockfile.
- [ ] **[A] Enable Dependabot, dependency review, secret scanning + push protection, container vulnerability scanning, package-license checks, SBOM generation, pinned external GitHub Actions** — GitHub-native, language-agnostic, actionable now regardless of app code.
- [ ] **[C] Plan short-lived OIDC/federated credentials for future hosted cloud deploys** — explicitly scoped to future *hosted* deployment (not the self-hosted community path Phase 16 targets, ADR-0005). Trigger: when hosted-deployment work begins.

## Phase 10 — Security Foundations

- [x] **`docs/security/threat-model.md` — DONE**, covers all 9 required categories (§36).
- [x] **Household isolation test *plan* — DONE** (same doc, explicit scenario list matching §37; test *implementation* correctly deferred to Phase 17 when household code exists).
- [x] **Recipe-import security *design* — DONE** (§38, matches verbatim).
- [x] **Upload security *design* — DONE** (§39, matches verbatim).
- [x] **AI security controls doc — DONE** (§40, matches verbatim, plus an AI-reviewer-specific attack-surface section beyond what §40 required).
- [ ] **[A] Automated security tooling: Semgrep, CodeQL, secret scanning, dependency review** — GitHub-native/language-agnostic-enough to enable now. **[B] Larastan, Composer audit** specifically — PHP-dependent, Phase-16 PR.
- [ ] **[A] Confirm CODEOWNERS enforces security-sensitive paths** — depends on Phase 4's CODEOWNERS existing; the paths that exist pre-Phase-16 (governance files) can be confirmed now, app-specific security paths confirmed as part of the Phase-16 PR.

## Phase 11 — Testing Architecture — all [B]

Every item (Pest/domain-unit, Laravel feature tests, Svelte/Vitest component tests, Playwright browser tests, dual-database CI matrix, coverage tooling wiring, mutation-testing framework selection) needs the respective language project to exist. **Caveat, not a loophole**: this doesn't mean "write meaningful tests before Phase 16" — there's nothing to test yet. What's gateable is the harness (test runners installed, dual-DB CI matrix configured, coverage tooling wired) existing and running in CI as part of the Phase-16 PR, with real test content arriving alongside that PR's actual code.

- [x] **Coverage thresholds — DONE** (`docs/development/testing.md`, exact numbers match §45).
- [x] **Critical-path coverage list — DONE** (same doc, matches §46 verbatim).
- [ ] **[B]** Everything else in this phase.

## Phase 12 — Internationalization & Accessibility — entirely already satisfied at the policy/doc level

- [x] **i18n architecture doc — DONE** (`docs/development/translation.md`, matches §49 verbatim).
- [x] **Pseudo-localization/RTL *policy* — DONE** (same doc; implementation correctly deferred to Phase 16+, no frontend exists yet).
- [x] **Translation contribution rule — DONE** (same doc, matches §50).
- [x] **Accessibility baseline + canonical controls — DONE** (`docs/development/accessibility.md`, matches §51 verbatim).
- [x] **UI component strategy doc — DONE** (same doc, matches §52 verbatim).
- [ ] **[B] CI translation validation** — the only genuinely remaining item, needs a real translation-key extraction pipeline once frontend code exists.

## Phase 13 — Documentation & Support Model — entirely already satisfied except one toggle

- [x] **Doc categories — DONE** (`docs/development/documentation.md`, matches §53).
- [x] **Wiki policy — DONE** (same doc, matches §54).
- [x] **Support model doc — DONE** (`SUPPORT.md`, matches §56 verbatim).
- [x] **`SECURITY.md` content — DONE** (matches §57: supported versions, disclosure mechanism, response expectations, scope, coordinated disclosure).
- [ ] **[A] Actually enable GitHub's private-vulnerability-reporting feature** — the doc is satisfied; the repo-settings toggle isn't flipped yet. Small, actionable now.

## Phase 14 — Release Engineering

- [ ] **[B] Container-first release model: basic OCI image, both architectures (§58)** — needed for Phase 16's own "container builds" bullet; nothing to containerize before then.
- [ ] **[C] Full release pipeline: SBOM, provenance attestation, immutable-image signing, trusted-workflow-only production artifacts** — can't meaningfully exist before there's a first real release to attach it to. Trigger: first tagged release.
- [ ] **[A] Versioning policy doc (§59)** — pure writing, no code dependency, actionable now.
- [ ] **[C] Migration-upgrade-fixture testing across versions (§60)** — structurally impossible with zero shipped versions (nothing to upgrade *from*). Trigger: after the first schema exists and a second migration is added.

## Phase 15 — PR Funnel, Review Tiers & Gate Audit

- [ ] **[A]+[B], split by check**: wire the full required-check funnel (§61) into branch protection. The [A]-tooling checks (format/lint, DCO, contribution-policy, security scanning, AI review) go in now, pre-Phase-16. The [B]-tooling checks (PHP/Svelte/browser tests, dual-DB, coverage, container-build) are added as required checks *as part of* the Phase-16 PR that introduces their substrate — this is the concrete mechanism behind the "B items are merge conditions of the first application PR" invariant.
- [x] **Document risk-based review tiers — DONE** (`CONTRIBUTING.md` §"Review process", matches §62 verbatim).
- [x] **Publish Definition of Done checklist — DONE** (`AGENTS.md` §"Definition of Done", matches §63).
- [ ] **[A] Gate audit**: walk every §64 bullet and confirm each is actually enforced, not just documented, before declaring the pre-Phase-16 control plane complete. This is the capstone — mechanically incapable of being true until the [A] items above are real.

## Phase 16 — First Application PR (§65)

Only after Phase 15's [A]-gate audit passes. Deliberately near-zero product functionality; must prove — **and every [B] item above becomes a merge condition of this specific PR, not a separate later phase**:
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
- Phases 5–14 build out the enforcement machinery (`./bin/verify` in Phase 7 is the spine — it starts as a near-empty stub and each later phase adds a real check to it rather than inventing a parallel command). As of this reconciliation, that spine only needs to carry [A] checks pre-Phase-16; [B] checks are added to it by the Phase-16 PR itself.
- Phase 15's gate audit is the actual gate referenced in the source doc's status line ("no application/domain code... until Foundation 0 controls... are established or explicitly deferred by an approved ADR") — any item skipped here must be deferred via an explicit ADR, not silently dropped. The audit's scope is the [A] set; [B] items are audited as part of Phase-16 PR review instead.
- §67 ("Decisions Settled by Foundation 0") and §69 (success criterion) aren't separate work items — they're the acceptance criteria this whole plan is building toward. §68's small tooling choices are folded into the phase where each belongs (noted inline above) rather than tracked separately.
