---
name: Android build truth
description: Durable rules for the ZIP-to-APK builder's trust boundary.
---

Uploaded source is untrusted and must execute only inside the Android builder container. The API may queue a job, but it must not mark success from a process exit alone: an APK must exist, contain AndroidManifest.xml, expose an application ID when tooling permits, and have a recorded SHA-256.

**Why:** The product's central promise is honest build output, and the local development environment may not have Android SDK, Docker, or Redis available.

**How to apply:** Keep analyzer, secure extraction, build execution, and APK validation modular. When extending support to new frameworks, add a strategy without weakening the success gate.