# M1–M12 GitHub Actions Coverage Matrix

**Last evidence refresh:** 2026-10-20  
**Authority:** `ROADMAP.md` remains the milestone source of truth. This document tracks evidence only; it does not redefine scope or convert CI success into device acceptance.

## Evidence rules

- **PASS** applies only to the named scope and exact source commit/artifact with required evidence.
- **FAIL** means a required check ran and failed; record the root cause and a revalidation.
- **BLOCKED** means required evidence or a prerequisite is missing.
- **NOT RUN** is not a pass or a failure.
- The APK SHA-256 is the hash of the APK bytes, not the Actions artifact ZIP digest.
- Never transfer device results between APK hashes or use a prior commit's APK as evidence for a newer commit.

## Current status

| Area | Current status | Evidence and next gate |
|---|---|---|
| M1 ZIP resource limits | **Implementation merged; HTTP precheck follow-up PR #86 in CI; acceptance NOT PASS** | PR #70 merged as `9db8edf90527d2612f797a97b42469ba647974c0`; its exact head `80e905ba3476e57d71079677adad14d3c5adbaa0` passed 9 checks. PR #86 switches the HTTP upload path from `new AdmZip(uploadedFile.filepath)` + `safeExtractAdmZip` to path-based `safeExtract`, which checks file type/size before parsing; its exact-head checks must pass on the updated base. Review boundary tests for entry count, compressed bytes, ratio, per-entry/aggregate bytes, path depth/collisions, CRC, symlink/special files and cleanup. The in-memory compatibility wrapper `safeExtractAdmZip` itself cannot enforce a pre-allocation compressed-size bound; production upload paths should use `safeExtract`. |
| M4 Vite PWA → APK | **CI build PASS; device behavior NOT RUN** | Current-main-based PR #80 run `39038465214` passed “Build and validate real M4 APK”. PR #85 now records the PR source-head SHA separately from the workflow/merge SHA in M4 provenance and asserts both identities. Verify the exact run artifact's checksum/provenance when sharing a candidate. Real-device button interaction and offline behavior still need their own evidence. PR #57 was closed as stale/superseded because the workflow and test content are already on main. |
| M5 Flutter → APK | **Build/provenance workflow fix merged; device linkage pending** | PR #67 merged the JSON-safe provenance correction. PR #85 now records M5 `commit_sha` as the PR source head and stores the synthetic workflow SHA separately; exact-head CI passed on PR #85 head `af511b37f7c89cd2d45890899ac7b39a04c1335e`. Keep install/launch acceptance tied to the exact APK SHA-256, source commit and run; do not infer it from CI. |
| M6 canonical React Native fixture | **PASS for the accepted fixture only** | Accepted source `52e550907cb8da345c4d19b74611d7b9945479ef`, run `38656253893`, APK SHA-256 `05c864b61fec5ce89077323ae52627d87db9fc1972f12e87b507f2c1357f8688`; user reported install, launch, UI and interaction PASS. |
| Community Chat demo ZIP → APK | **PASS for the exact demo artifact** | Source `2a956c701d70e402d89685dc55cd0e4008f4f8a9`, run `38665909498`, APK SHA-256 `fee45be9d3b63a7e7a80afc397a1227f878158ea57928eca6775a5943c9eba4c`; user-reported install, navigation, chat send, profile and interaction PASS. Issue #41 remains closed with this evidence recorded. |
| M6 bare React Native scaffold | **PR #85 exact-head CI PASS; post-merge main run in progress; device acceptance NOT RUN** | PR #77 added the bare-scaffold test; PR #85 merged as `231660b04fd8160b622e645bbe2dad487b5ecbc9` with deterministic NDK 25.2/26.1 installation and exact-head provenance. PR #85 exact-head run `39304968123` passed: canonical APK SHA-256 `90891a3ecd7f0480a80a0a475ca0be8ce7b98d7eb2519b1d297f4ac09d8a2bb1` (109,260,611 bytes), bare-scaffold APK SHA-256 `c547c16f28fc844f3aec314fd4fc307910811de55240e9a58ed5fc3b2b08e1a3` (110,564,257 bytes), source head `af511b37f7c89cd2d45890899ac7b39a04c1335e`, workflow SHA `781d346d1e15222c5a4a484400b1e3fa8b196d0e`. Post-merge run `39305971642` must complete before recording current-main artifact hashes. Neither new APK is claimed device-tested. |
| APK identity registry | **Registry update merged** | PR #81 merged as `a6567a94f03ffd2114df538053878239bdc6ff4c`. Registry contains 3 valid records with unique 64-character SHA-256 values; each record is scoped to its exact APK/source/run. |
| SAF WebView hardening | **BLOCKED from merge** | PR #82 source `c0221b0fd642c4137109297e53eb4afe9723a0db`. PR #83 run `39299812852` passed generated-source validation, Gradle compile, APK structure, SHA-256 and provenance on validation commit `9d6eac11e857b5f574cad9ee3d0ff8f6b6264f48`. Validation APK SHA-256 `eca7ac7fe1abdd090c5c11df94429414dbb27b748b25821ff22ce643aefbe512`, package `com.builder.safvalidation`, size 1,176,761 bytes. Runtime WebView bridge isolation, external/POST/form navigation, real SAF operations and physical-device acceptance remain NOT RUN. |
| Shared quality-gate provenance | **In progress in this PR** | This PR adds a provenance JSON artifact to the shared quality-gates workflow, including exact commit/run identity, job status, runner/tool versions, dependency-manifest hashes and PR head/base SHA when available. It must pass on its own exact head before the change is accepted. |

## Backlog hygiene decisions

- PR #80 was merged; duplicate PR #53 was closed because it contained stale, unrelated lockfile churn.
- PR #70 was merged; stale-base PR #54 was closed as superseded. This does not mark M1 acceptance PASS.
- PR #79 was closed as superseded by PR #83's newer exact-source SAF validation.
- PR #43 was closed as superseded by the focused current-main Community Chat work in PR #64; its broad README rewrite was not imported.
- PR #57 was closed as superseded because its workflow and tests are already on current main.
- PR #42 remains a draft proposal for framework-specific generators. It is not authorization to begin Expo/M7 work.
- PR #56 still contains the original stale-base shared-provenance proposal; this current-main PR ports the quality-gate provenance change without replacing the existing M6 workflow.
- PR #55 and PR #68 are stale documentation branches; compare/close only after this current evidence matrix passes and is merged.

## Ordered next actions

1. Complete the shared quality-gates provenance PR and verify its artifact against the exact PR head.
2. Finish PR #82 runtime/security acceptance: prove third-party iframe/script isolation from the native directory bridge, external and POST/form navigation handling, and SAF pick/list/create/write/remove behavior. Then obtain physical-device evidence tied to the actual APK hash.
3. Review M1 ZIP adversarial test coverage on current main and record explicit below/equal/above-limit results and cleanup behavior before marking M1 PASS.
4. Verify the post-merge M6 bare-scaffold run; keep its CI result separate from device acceptance.
5. Complete M4 button/offline device behavior and M5 exact-hash device linkage.
6. Keep M7/Expo blocked until predecessor gates are explicitly accepted and recorded.
