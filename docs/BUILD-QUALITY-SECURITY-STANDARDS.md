# Build Quality, Security, and Evidence Standards

**Status:** Normative supporting standard  
**Scope:** ZIP intake, project detection, reproducible fixtures/builds, APK validation, device acceptance, diagnostics, and support claims  
**Governance:** This document supplements `ROADMAP.md`; it does not change milestone numbering, approve a new framework, or claim implementation exists merely because a requirement is documented.

## 1. Enforcement principle

Every normative requirement must map to at least one of:
1. an automated test/check;
2. a recorded manual acceptance step where automation is unavailable; or
3. an explicit `NOT IMPLEMENTED` / `BLOCKED` record.

Documentation-only requirements must never be presented as implemented capabilities. CI, artifact, installation, runtime, and feature evidence are separate evidence classes.

## 2. ZIP intake and security boundary

Validate the archive before extraction and validate the extracted tree before project detection/build.

### Required checks
- Reject absolute paths, parent traversal, invalid path encodings, paths escaping the extraction root, and unsafe symlink entries.
- Detect duplicate paths and case-colliding paths; reject ambiguous archives instead of relying on filesystem-specific overwrite behavior.
- Verify ZIP central-directory consistency and entry integrity/CRC where supported.
- Apply configurable limits to compressed bytes, total uncompressed bytes, entry count, per-entry bytes, path depth, and compression ratio.
- Enforce limits while streaming/extracting, not only from attacker-controlled archive metadata.
- Reject or safely handle special files, device entries, and unsupported archive features.
- Extract into a fresh isolated workspace; never merge untrusted content into a previous build directory.
- Ensure cancellation, extraction errors, and build failures do not leave child processes or partially trusted output presented as a successful artifact.

### Secret and sensitive-file checks
- Scan archive paths and relevant text files for likely credentials, private keys, keystores, tokens, and unsafe environment files.
- Treat secret scanning as a detection aid, not proof that no secret exists.
- Never print secret values in diagnostics. Redact command arguments and environment values known to contain credentials.
- Do not include production signing keys or private credentials in fixtures, source ZIPs, repository history, or build artifacts.

### Required security tests
At minimum, test traversal, absolute paths, duplicate entries, symlink escapes, malformed ZIPs, excessive entry counts, high expansion ratios, cancellation cleanup, and secret redaction. Limits must be explicit, configurable, and tested at boundary values. Do not claim archive-bomb protection until adversarial fixtures exercise the enforced limits.

## 3. Detection and strategy selection

- Derive project type from multiple independent signals where available: manifest, lockfile, entry point, framework config, native project, and declared build scripts.
- Record detected type, selected strategy/adapter, supporting signals, conflicting signals, and confidence/ambiguity.
- A single generic marker such as `package.json` must not by itself prove a framework.
- If evidence is conflicting or below the defined decision threshold, return a deterministic ambiguous/unsupported result with actionable details.
- Once a strategy is selected, do not silently fall back to a different strategy. Any explicit user-approved alternative must be visible in the result.
- Fixture tests must verify both positive detections and negative/conflicting cases.

## 4. Reproducible fixture and build provenance

Each fixture record must include:
- stable fixture ID, purpose, expected detector result, and expected strategy;
- generator/template name, immutable version or source commit, and generation command;
- source revision and ZIP filename, byte size, SHA-256, and archive-integrity result;
- lockfile type and SHA-256, package-manager version, and dependency-resolution policy;
- framework/runtime, Node, JDK, Gradle, Android Gradle Plugin, Android SDK/build-tools, and relevant architecture/Hermes settings;
- build command, environment/runner identity, CI run, exit code, and relevant log reference;
- APK filename, byte size, SHA-256, package ID, version metadata, signing type, and artifact link;
- device model, Android/API version, ABI, test steps, evidence source, and limitations.

Pin exact versions for acceptance fixtures. Avoid floating `latest` tags and unpinned template generation. Record whether dependencies were fetched from the network or resolved from a pre-populated cache. A lockfile improves reproducibility but does not alone guarantee an identical build.

Byte-identical APKs are desirable where practical but are not a universal gate unless the build is explicitly designed for reproducibility. Always retain source/build provenance and the produced APK hash.

## 5. APK validation levels

Use separate results rather than one overloaded “success” flag.

| Level | Required evidence | What it does not prove |
|---|---|---|
| A — Artifact | APK exists, non-empty, archive integrity, SHA-256 | Valid Android app or installable |
| B — Structure | Manifest/package ID, SDK metadata, expected bundle/assets, native ABI checks as applicable | Installs or launches |
| C — Install | Installation succeeds on a declared device/emulator | Runtime or feature correctness |
| D — Runtime | Launch, initialization, UI rendering, no observed fatal crash during test | Every feature works |
| E — Feature | Fixture-specific interactions and state assertions pass | Universal framework compatibility |

The fixture contract defines which levels are mandatory. For runtime-sensitive support claims, A–E are required unless a documented fixture-specific reason makes a level inapplicable. A skipped test is not a pass.

## 6. Device and resource acceptance

Record Android version/API, ABI, device/emulator model, available storage and memory where practical, installation method, and test evidence source. Keep CI/Linux build evidence distinct from Termux build evidence and physical-device runtime evidence.

For phone-first execution:
- check free storage before expensive work and fail early with a clear diagnostic when below the configured safe threshold;
- define per-build timeout, process cleanup, and workspace cleanup behavior;
- prevent concurrent builds from sharing mutable workspaces;
- cancel child processes and mark partial outputs invalid when cancellation occurs;
- preserve reusable caches only when cache keys and isolation rules prevent cross-project contamination;
- record resource-related failures as specific failures or `BLOCKED`, never PASS.

Do not assert universal hardware compatibility from one reference phone. Publish only the tested device/API/ABI range.

## 7. Offline claims

Distinguish:
- **Offline runtime:** specified app features work with network connectivity disabled.
- **Offline build:** a project can be built with network access disabled after required toolchains/dependencies are already available.
- **Online build:** dependency/toolchain downloads require connectivity.

An offline-runtime claim requires a device test with network disabled and a declared list of features tested. An offline-build claim requires a clean, documented offline build attempt. Neither claim implies the other.

## 8. Diagnostics, repair, and recovery

Use stable error categories where applicable:
- `ZIP_INVALID`
- `ZIP_SECURITY_REJECTED`
- `PROJECT_AMBIGUOUS`
- `PROJECT_UNSUPPORTED`
- `DEPENDENCY_RESOLUTION_FAILED`
- `TOOLCHAIN_MISMATCH`
- `BUILD_COMMAND_FAILED`
- `APK_NOT_FOUND`
- `APK_INVALID`
- `INSTALL_FAILED`
- `RUNTIME_CRASH`
- `FEATURE_CHECK_FAILED`
- `RESOURCE_LIMIT`
- `CANCELLED`

Every failure record should contain the failed phase, safe command identifier/arguments, exit code where applicable, relevant redacted log excerpt, and next diagnostic action. Preserve the original failure even if a retry succeeds.

Any auto-repair must record the original state, exact files/settings changed, repair reason, retry command, and retry result. It must not silently alter the submitted source ZIP or turn an unsuccessful mandatory test into PASS.

## 9. APK identity, signing, and permissions

- Record the application ID and whether it was preserved or intentionally changed.
- Identify debug versus release signing clearly; debug signing is not release readiness.
- Never embed private signing keys in the project ZIP, repository, logs, or public CI artifacts.
- Inspect declared permissions and flag high-impact/unnecessary permissions for review.
- Report relevant network-security settings, including cleartext traffic when detectable.
- Do not claim a security audit solely because the manifest was parsed.

## 10. Support status vocabulary

Use the following independent statuses:
- **DOCUMENTED** — requirements/specification exist.
- **IMPLEMENTED** — code path exists; this alone is not evidence of correctness.
- **AUTOMATED-TESTED** — named automated tests passed at a named revision.
- **CI-VERIFIED** — required CI checks passed for the named source revision/fixture.
- **DEVICE-VERIFIED** — named device/runtime checks passed with evidence source recorded.
- **BLOCKED** — a required environment, device, or permission prevented the check.
- **NOT RUN** — the check has not been executed.
- **FAIL** — a required check ran and failed.

These are not interchangeable and should not be collapsed into one universal support badge. State the fixture, versions, and test scope next to any compatibility claim.

## 11. Change control and implementation order

This document defines standards; it does not assert that every check is already implemented. Each requirement must be mapped to code/tests or marked as pending. Add tests before or with implementation where practical.

For the current work sequence:
1. Adopt and link these standards without changing roadmap scope.
2. Establish the RN-1 minimal bare React Native fixture and validate its ZIP/checksum.
3. Run CI build and APK structural checks.
4. Perform device install/launch/UI/interaction checks and record their evidence source.
5. Proceed through RN-2 to RN-6 one fixture at a time.
6. Review the compatibility evidence before any separate M7/Expo decision.

Do not begin a later fixture while the current fixture has an unresolved mandatory failure. A CI-only pass does not satisfy a device gate.
