# PROJECT GOAL & MISSION MEMORY: Universal ZIP-to-APK Builder

**TARGET REPOSITORY:** `Universal-ZIP-to-APK-Builder-main`  
**HIGHEST PRIORITY MISSION DIRECTIVE:**
You are the dedicated autonomous software engineer for `Universal-ZIP-to-APK-Builder-main`. Your supreme objective is to complete, harden, debug, test, and expand this project until it becomes an industry-grade, fully autonomous, phone-first Universal ZIP to APK build system operating natively on Android via Termux.

---

## 1. Core Mission Statement
Transform any source code archive (`.zip`) directly on Android into a fully functional, aligned, v2/v3-signed, and installable `.apk` without requiring an external PC, cloud server, or remote compilation pipeline. The system must operate reliably, securely, and offline-first within the Termux userland runtime.

---

## 2. Current Completed Features
- **Deterministic Extraction Engine:**
  - Secure `.zip` extraction with strict `Zip Slip` path-traversal prevention.
  - Automatic archive root directory un-nesting and sanitization.
- **Framework Auto-Detection (Phase 1):**
  - Heuristic analysis of `package.json`, build scripts, directory structures, and entry points.
  - Initial support for:
    - Vite-based Single Page Applications (React, Vue, Svelte, Vanilla TS/JS).
    - Basic Capacitor projects with existing `android/` directory.
    - Pure static web applications (`index.html` + asset bundles).
- **Toolchain Orchestration:**
  - Node.js / pnpm execution within Termux environment.
  - Android SDK build-tools integration (`aapt2`, `d8`, `zipalign`, `apksigner`).
  - OpenJDK 17 headless compiler integration with ECJ / R8 dexing fallbacks.
- **Standalone APK Packaging & Signing:**
  - Template Android Shell injection with custom WebView bridge for Web SPAs.
  - Alignment verification using `zipalign -c -v 4`.
  - Debug keystore generation and cryptographic signing via `apksigner`.
  - SHA-256 checksum and package metadata calculation.
- **Safety Policy & Sandbox Enforcement:**
  - Protection against unintended destructive commands (`rm -rf`, system package alteration).
  - Explicit approval workflow for dangerous operations.

---

## 3. Supported Framework Expansion
Expand framework detection and compilation capabilities to cover all major web and mobile frameworks:

### Tier 1: Modern Web & Hybrid Frameworks
- **Capacitor (Full Lifecycle):**
  - Auto-scaffold `@capacitor/core` and `@capacitor/android` if missing from web projects.
  - Dynamic `capacitor.config.json` / `capacitor.config.ts` synthesis.
  - Automated `npx cap sync android` and native Gradle headless build invocation.
- **React Native / Expo:**
  - Expo prebuild / bare workflow detection and bundle generation.
- **Apache Cordova / PhoneGap:**
  - Parse `config.xml`, map Cordova plugins to native Android dependencies, and compile via Gradle.
- **Ionic / SvelteKit / Nuxt / Next.js (Static Export):**
  - Detect `next export` or SSG builds and package client bundles into an offline Android runtime.

### Tier 2: Native & Multiplatform Frameworks
- **Vanilla Android (Gradle):**
  - Detect root `build.gradle` / `build.gradle.kts` and invoke `gradle assembleDebug`.
- **Flutter:**
  - Support pre-compiled Flutter asset bundles and headless Gradle builds.
- **Godot / HTML5 Games:**
  - Specialized canvas fullscreen shells with low-latency WebGL acceleration.

---

## 4. Future Roadmap & Milestones

### Phase 1: Engine Hardening & Error Diagnostics
- Implement fine-grained AST and package dependency analysis to pinpoint missing build dependencies before running builds.
- Dynamic Polyfill & Headless Webview Compatibility Layer (Android 5.0+ to Android 15+).
- Real-time build log streaming with automated failure classification (e.g., memory limits, syntax errors, missing asset paths).

### Phase 2: Autonomous Self-Repair (5-Attempt Closed Loop)
- Automatic resolution of missing node modules, incompatible peer dependencies, or mismatched Gradle/AGP versions.
- Intelligent code patching for outdated deprecated APIs or broken import paths.
- Comprehensive automated testing using Vitest/Jest and APK smoke testing via Robolectric/AAPT dumping.

### Phase 3: Resource & Manifest Customization
- Dynamic extraction and vectorization of app icons (`res/mipmap-*`, adaptive icons).
- Automatic extraction and injection of app title, version code, version name, package ID, and target permissions from configuration files.
- Splash screen injection with dynamic Android 12+ Splash Screen API support.

### Phase 4: Performance & Caching Architecture
- Incremental compilation caching in Termux to reduce repeated build durations by >70%.
- Dex deduplication and ProGuard/R8 minification optimization for smaller APK footprints.

---

## 5. Production Quality & Reliability Goals
- **100% Zero PC Dependency:** The entire extraction, compilation, packaging, alignment, and signing pipeline must complete locally on the phone.
- **Resilience Against Malformed Archives:** Gracefully handle deeply nested folders, symlinks, corrupted files, and non-standard project roots with descriptive feedback.
- **Strict Play Store Policy Alignment:**
  - Zero dynamic executable code loading (no unauthorized `.dex` downloading at runtime).
  - Modern target SDK compliance (Android 14/15, API 34+).
  - Correct permission declarations without over-requesting sensitive APIs.
- **Zero-Hallucination Engineering:** The agent must only claim successful builds when the output APK physically exists, passes `apksigner verify`, and passes `aapt2 dump badging`.

---

## 6. Execution Guidelines for the AI Agent
1. **Always Consult This Goal:** Treat this document as your non-negotiable mission benchmark. Every action, fix, plan, or recommendation must directly advance these milestones.
2. **Autonomous Iteration:** If a build or test fails, automatically diagnose the failure, generate targeted fixes, apply them, and re-test across up to 5 iterative cycles.
3. **Transparent Reporting:** Report exact commands run, files modified, test outcomes, and APK validation metrics (file size, SHA-256 hash, signature verification status).
