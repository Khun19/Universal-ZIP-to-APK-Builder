# Release, Deployment, and Package Standards

**Status:** Proposed implementation contract; becomes canonical after review and merge.  
**Repository:** `Khun19/Universal-ZIP-to-APK-Builder`

## 1. Product identity and delivery boundaries

This repository is a framework-aware ZIP-to-APK build orchestrator. Its canonical build executor is GitHub Actions on Ubuntu. It is not currently a hosted web service, and the root `package.json` is a private workspace (`private: true`, version `0.0.0`).

Therefore the repository must not present generic hosting deployments or an npm package as a finished Builder product when neither is actually shipped.

| GitHub area | Correct purpose for this project | Current truth / rule |
|---|---|---|
| Releases | Versioned source bundle, changelog, checksum, and release provenance | A release listing check returned no published releases. Do not invent a first release or attach a demo APK as the Builder APK. |
| Deployments | Record a real deployed service/environment and its tested source revision | Use only when a real service or documented environment is deployed. CI jobs, workflow artifacts, and emulator tests are not deployments. No hosted Builder service is declared by this policy. |
| Packages | Versioned installable/distributable component with a defined consumer and install procedure | The root workspace is private and is not eligible for npm publication. Do not publish the monorepo or a fixture/demo APK as a generic package. |
| Actions artifacts | Temporary evidence from a particular workflow run | Keep run-scoped APKs, logs, checksums, provenance, emulator evidence, and test reports here; do not confuse retention-limited artifacts with releases. |

## 2. Version and release policy

- Use SemVer tags in the form `vMAJOR.MINOR.PATCH`; pre-releases use `vMAJOR.MINOR.PATCH-rc.N`.
- A release tag must point to a commit that has passed the release workflow's locked dependency install, typecheck, unit/regression tests, and workspace build.
- The release workflow must check out the tag's exact commit and record the tag, commit SHA, workflow run ID, workflow attempt, UTC creation time, and validation results.
- Publish a source archive, SHA-256 checksum, and machine-readable manifest. The archive is a source release, not a compiled Builder executable or APK.
- Release notes must identify supported strategies only from accepted evidence. Detection-only or fixture-only work must not be described as broad framework support.
- Do not publish a Builder APK until a workflow builds the actual intended Builder application and the APK identity, provenance, and required runtime/device gates pass for that exact commit. A Community Chat fixture APK is a test fixture, not the Builder product.
- Failed or cancelled release validation must not create or update a GitHub Release. Never overwrite an existing immutable version tag to replace failed evidence; create a new version after correction.

## 3. Deployment policy

A deployment is valid only when all of these are recorded:

1. Named target/environment and its purpose.
2. Exact source commit and deployment workflow/run.
3. Successful build and target-specific validation.
4. Deployment URL or resource identifier, where applicable.
5. Health/readiness result and rollback/recovery instructions.
6. Whether the deployment is production, staging, preview, or documentation-only.

The Builder's Ubuntu CI execution and APK artifact delivery do not by themselves create a hosted service. Until the project defines a real hosted target, leave the Deployments area unused rather than manufacturing deployment records. If GitHub Pages is introduced later, label it as project documentation only, not as the APK-building backend.

## 4. Package registry policy

Before publishing any package, define its product boundary, consumer, supported OS/runtime, install/upgrade/uninstall commands, version source, license, provenance, and security/update policy.

- Keep the root workspace private until it is intentionally split into a distributable package.
- Do not run `npm publish` against the current root workspace.
- A future CLI package must have its own publishable package manifest, explicit public files, pinned version, tested install smoke test, and release provenance.
- A container image is not appropriate unless the architecture explicitly adopts containers; Ubuntu Actions is currently the canonical executor.
- APKs intended for humans should be distributed as release assets only after the exact-commit APK and device-acceptance rules are satisfied. Use Actions artifacts for candidate builds.

## 5. Required release evidence

Every source release should include:

- `source-archive.tar.gz`
- `SHA256SUMS`
- `release-manifest.json`
- Git tag and source commit SHA
- GitHub Actions run ID and attempt
- Typecheck, unit/regression test, and workspace-build outcomes
- A clear statement that the archive is source-only and does not imply APK/device acceptance

For any future APK release, additionally require actual APK SHA-256 and size, package/application ID, provenance, Builder-vs-fixture identity, exact workflow run, and required device/emulator acceptance evidence.

## 6. Acceptance checklist

- [ ] Release workflow triggers only for version tags and can be run manually for validation without publishing.
- [ ] Release publishing occurs only after every required check succeeds.
- [ ] Source archive, checksum, and manifest agree on the same tag and commit.
- [ ] No fixture APK is labelled as the Builder APK.
- [ ] No npm/container package is published from the private root workspace.
- [ ] Deployment records correspond to an actual named environment, not CI artifacts.
- [ ] Release/deployment/package claims are reflected in README and release notes without overstating framework support.
