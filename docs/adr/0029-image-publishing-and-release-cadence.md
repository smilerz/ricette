# ADR-0029 - Image Publishing and Release Cadence

## Status

Proposed. The cadence, tags, rebuild rules and the scan gate policy below were decided by the maintainer on 2026-09-26.
This ADR stays Proposed until the maintainer accepts it as a record, and nothing in it authorizes publishing until then.

## Context

ADR-0017 makes the container image the release artifact and requires trusted release workflows, an SBOM, provenance and
pinned actions. It does not say when images are published, how they are named, or what makes a release. Self-hosters
need a way to run Ricette without building it, and a tag they can follow.

## Decision

- **Registry and architectures.** `ghcr.io/smilerz/ricette`, for `linux/amd64` and `linux/arm64`, built natively.
- **Weekly releases.** A semantic version is cut every Monday, only if something that can change the image changed, or
  the base image did. Tags: `X.Y.Z`, `X.Y`, `X` from 1.0, `latest` (the newest release), and `sha-<short>`.
- **Nightly.** A moving `nightly` tag, built daily only if `main` changed or the base image did. Dated pin tags are deferred
  until someone asks; the image digest is the pin, and the release notes print it.
- **Version from commits.** Before 1.0 a breaking change or a feature bumps the minor and anything else the patch. From 1.0 a
  breaking change bumps the major, a feature the minor, anything else the patch. A Dependabot commit counts only through
  its subject, never through a changelog it quotes.
- **What "changed" means.** Any changed file that is inside the Docker build context, that is, not excluded by
  `.dockerignore`. There is one list, `.dockerignore`. A new base image is also a change: it ships the same commit again as a
  patch release.
- **The tag drives the build.** The weekly job decides, creates the `vX.Y.Z` tag, and then calls the build for that tag.
  A tag pushed by the maintainer goes straight to the build. A failed publish is a failed run for that tag and is re-run;
  the plan is not re-run. The build refuses a tag whose commit is not on `main`. The moving tags (`X.Y`, `X`, `latest`) move
  only when the tag is the highest version in its series, so re-running an old release never moves anyone backwards.
  A tag with no published image stops the next release with an error until it is fixed.
- **Scan before push; block only what is worse than the published image.** The new image and the currently published
  image are scanned in the same job with the same vulnerability database, and the gate asks one question: is the new image
  worse than the one already out there? A High or Critical finding with a fix blocks only if it is new (present in the new
  scan and absent from the fresh scan of `latest`, matched by vulnerability id and package). A finding the published
  image already has never blocks, at any severity, because stopping the release would not remove it from anyone already
  running it; it would only withhold what else the release fixes. Carried-forward findings stay visible without anyone
  doing anything: they are listed in the release notes, and the workflow keeps one issue per finding, opened when it
  appears and closed when a later scan no longer finds it. The first release has nothing to compare with, so the gate is
  absolute for it and the upgrade test is skipped and says why. `.grype.yaml` is for false positives only.
  A base-image bump that fixes two Critical findings and adds a new one is blocked, so a person decides that case.
- **Release notes.** Built from the same reading of the history as the version: breaking changes (with the author's
  upgrade instruction), features and fixes; an Upgrading section derived from the diff (migrations, changed settings,
  a changed base image); the exact image digest. The GitHub release is the changelog; no bot commits a changelog file.

## Alternatives Considered

- **Dated nightly tags.** Deferred. GHCR tags are mutable, so a dated tag pins nothing that a digest does not, and it needs
  retention and suffix logic. Nobody has asked to pin a nightly.
- **A separate list of paths that skip a rebuild.** Rejected in favor of `.dockerignore`, so there is one list.
- **An absolute scan gate, or "Critical always blocks" with expiring exceptions.** A release that does not remove a
  finding from users who already run it protects nobody by being blocked, and an exception only moves the stall to its
  expiry date and needs someone to intervene in a workflow meant to run unattended.
- **A third planning state for a tag whose image failed to publish.** Replaced by tag-driven builds.
- **GitHub's generated release notes.** They list pull request titles and dependency bumps and do not say whether to upgrade.

## Consequences

- Publishing needs a workflow with permission to write packages, tags and releases. That is a security-posture change and
  is reviewed as such.
- The first published package is private until the maintainer makes it public.
- A release depends on `bin/release-plan` and `bin/scan-gate`, both covered by self-tests, and on a full run against a
  throwaway package before the real one.
- Migrations run on start, so a release that changes `database/migrations/` says so in its notes; an upgrade test from
  the last shipped image is part of the release path once a first image exists.
