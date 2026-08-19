# Universal ZIP-to-APK Builder

## Build truth

The API creates a real job. A job may become `SUCCESS` only after the isolated Android builder returns zero, an APK exists, the file is a valid ZIP/APK, `AndroidManifest.xml` is readable, and SHA-256 has been calculated. No mock artifact or fabricated progress is permitted.

## Pipeline

1. Upload bytes to storage outside PostgreSQL.
2. Inspect ZIP entries before extraction. Reject absolute paths, traversal, symlinks, excessive file count, oversized archives, and suspicious compression ratios.
3. Extract into a per-job temporary directory.
4. Run the detector registry and persist structured analysis.
5. Queue a BullMQ job in Redis.
6. Run the native Gradle project as-is, or the web-to-Capacitor strategy, inside `docker/android-builder`.
7. Stream child-process output into the build log store.
8. Validate the APK and persist artifact metadata.

## Current MVP boundary

The analyzer, API contract, secure extraction primitives, native/web build command selection, database schema, and worker image are present. The local preview environment does not ship an Android SDK or Redis, so an Android build must be executed by the container worker; the API intentionally does not claim a build succeeded when that worker is unavailable.