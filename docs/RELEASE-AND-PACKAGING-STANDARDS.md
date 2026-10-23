# Release, Development, and Package Standards

This document defines the GitHub-facing delivery contract for Universal ZIP-to-APK Builder. It does not declare any framework supported and does not bypass milestone acceptance gates.

## 1. Product identity

Universal ZIP-to-APK Builder is a framework-aware build orchestrator. GitHub Actions on Ubuntu is the canonical build execution environment. A release must never imply that arbitrary ZIP files can be converted successfully or that framework detection alone proves support.

## 2. Release channels

| Channel | Purpose | Required evidence | Public status |
|---|---|---|---|
| Development / PR | Propose one focused change | Exact-head CI, review, security checks; runtime evidence where required | Not a product release |
| Pre-release (vX.Y.Z-alpha.N, beta.N, or rc.N) | Share a bounded, testable milestone | All required gates for the named scope, release notes, checksums, provenance | Marked as prerelease |
| Stable (vX.Y.Z) | Declare a production-quality version | All required release gates, no unresolved P0/P1 blocker, tested migration/restore notes, artifact verification | Stable release |
| Workflow evidence artifact | Inspect one CI run | Exact commit and run metadata; retention is limited | Not a release and not a permanent download promise |

A tag is not proof of acceptance. The release workflow must fail closed when required tests fail. Do not create a release tag merely to make a workflow run.

## 3. Versioning

Use Semantic Versioning for public product releases:

- MAJOR: incompatible public CLI/configuration or artifact contract change.
- MINOR: backward-compatible user-visible capability.
- PATCH: backward-compatible fixes.
- Use prerelease identifiers such as 0.9.0-beta.1 while the product remains in beta.
- Do not use 0.0.0 or a workspace placeholder as a public product version.
- The tag, release title, changelog heading, and provenance version must agree exactly.

Until the required acceptance gates are met, publish no stable version.

## 4. Release asset contract

Every official release must include, where applicable:

1. SOURCE-CODE.tar.gz — source at the tagged commit, not an arbitrary working tree.
2. SHA256SUMS — checksums for every uploaded binary/archive/metadata asset except the checksum file itself.
3. release-provenance.json — schema version, release tag, source commit, workflow commit, workflow run ID/attempt, creation time, asset names, sizes and SHA-256 digests.
4. CHANGELOG.md or generated release notes — user-visible changes, limitations, known issues, and upgrade/recovery instructions.
5. Verified APKs only when the APK was built from the exact release source and passed the applicable APK structure, package identity, provenance, and runtime/device gates.

Do not attach a sample, fixture, stale workflow artifact, or APK from another commit and label it as the official release APK. If no APK meets the gates, say explicitly that the release contains no verified APK; do not fabricate one.

## 5. APK identity and evidence

For every APK distributed as an official Builder result, record:

- repository and release tag;
- source_commit separately from workflow_sha;
- workflow run ID and attempt;
- artifact ID/name and download origin;
- application/package ID;
- APK byte size and SHA-256;
- ZIP/manifest structure validation result;
- build and test workflow links;
- emulator result and physical-device acceptance (PASS, FAIL, NOT_RUN, or BLOCKED) as separate fields.

A physical-device PASS applies only to the exact APK SHA-256 tested. A different build, commit, or hash requires new acceptance evidence. CI build PASS is not runtime PASS.

## 6. Development workflow

1. Keep main releasable; work in a focused branch and PR.
2. One PR should address one coherent goal and list scope, risks, test evidence, and out-of-scope work.
3. Run CI against the exact PR head. After any new commit, treat prior CI/review/artifact evidence as stale until rechecked.
4. Resolve security findings and review threads with code changes and tests; do not close them with documentation-only claims.
5. Keep build/CI, emulator, and physical-device results distinct.
6. Do not merge with required checks failing, a P0/P1 security blocker open, unresolved required review, mismatched provenance, or missing acceptance evidence.
7. Do not start the next framework milestone while the current milestone or security gates are blocked.
8. Prefer small changes and explicit rollback notes. Never merge a bulk branch merely to synchronize unrelated work.

## 7. Package registry policy

GitHub Packages is for future reusable, versioned Builder libraries (for example analyzer, build-engine, APK-validator, and shared contracts), not for storing APK downloads.

Package publication is deliberately deferred until:
- the package boundary and public API are stable;
- each package has its own name, version, license, exports, supported Node.js range, and README;
- dependency boundaries and workspace builds are verified;
- unit/integration tests and security checks pass on the exact release commit;
- package contents are reviewed to exclude secrets, fixtures, temporary workspaces, generated APKs, and private CI evidence;
- provenance and checksums are generated and a publish dry-run is inspected.

Do not publish placeholder packages or split the monolith prematurely. First stabilize the current Builder and complete the required ZIP security/resource-limit acceptance gates. APKs belong in GitHub Releases when verified; short-lived CI evidence belongs in Actions artifacts.

## 8. Release checklist

- [ ] Release tag points to the intended, reviewed commit.
- [ ] Changelog accurately lists changes and limitations.
- [ ] Required quality gates pass on the exact tag commit.
- [ ] No unresolved P0/P1 security blocker or mandatory review.
- [ ] Source archive matches the tag.
- [ ] Every release asset has a verified SHA-256.
- [ ] Provenance fields agree with the workflow run and commit.
- [ ] APK identity and runtime/device evidence are attached if an APK is claimed.
- [ ] Release notes clearly distinguish verified capabilities from planned capabilities.
- [ ] Rollback/recovery instructions are present.
- [ ] Stable vs prerelease classification is correct.
