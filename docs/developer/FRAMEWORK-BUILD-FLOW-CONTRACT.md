# Framework Build Flow Contract

## Purpose

This is the developer-facing contract for implementing and maintaining framework build strategies.

It defines what a developer must specify before claiming that a framework build flow is complete.

It does not describe how an end user operates the Builder.

## Contract

Every supported framework strategy must define these stages.

### 1. DETECT
Define project evidence/signatures, required files/manifests, nested-project handling, ambiguity rules, unsupported-project behavior, and selected strategy/Official Flow Adapter.

Gate: detection is deterministic and evidence-backed.

### 2. REQUIREMENTS
Define minimum project requirements, Android capabilities, native project state, framework prerequisites, and known incompatibilities.

Gate: missing requirements produce an explicit diagnostic rather than a false build attempt.

### 3. TOOLCHAIN
Define framework SDK/runtime, language/runtime, Node/package manager where applicable, Java/JDK, Android SDK/build-tools, Gradle/NDK/native tooling where applicable, Termux/ARM64 constraints, and environment detection.

Gate: required tools are detected and compatible before build.

### 4. PREPARE
Define project generation/scaffolding when legitimately required, Android platform generation, configuration generation, environment adaptation, AAPT2/native-tool overrides when required, and user-source preservation rules.

Gate: the project is valid for the framework's real build flow.

### 5. DEPENDENCIES
Define package manager, dependency installation, lockfile policy, native dependency preparation, cache policy, and offline/online requirements.

Gate: dependency resolution succeeds deterministically.

### 6. BUILD
Define the official/upstream build procedure, exact command sequence, working directory, expected exit behavior, timeout/resource limits, expected APK location(s), and failure classification.

Gate: a real Android artifact is produced by the intended framework-native flow.

### 7. APK / ARTIFACT VALIDATION
Define artifact discovery, APK structure, AndroidManifest, package/application ID, native libraries when relevant, signing/debug-signing expectations, byte size, SHA-256, and framework-specific checks.

Gate: artifact validation passes.

### 8. INSTALL
Define the supported validation procedure for the target environment.

Gate: APK installs successfully when installation is part of acceptance criteria.

### 9. RUNTIME
Define launch procedure, expected process/activity behavior, native runtime requirements, framework runtime initialization, known device constraints, and crash/log evidence.

Gate: application launches and reaches the required runtime state.

### 10. FUNCTIONAL VALIDATION
Define the minimum real-device behavior proving that the framework integration is usable.

Examples include UI rendering, navigation, JavaScript/native bridge initialization, camera/storage/network permissions, and framework-specific smoke tests.

Gate: required feature behavior passes on the target validation environment.

### 11. EVIDENCE
Record as applicable:
- branch
- commit SHA
- fixture and fixture SHA-256
- detected project type
- toolchain versions
- commands
- build result
- APK path/size
- APK SHA-256
- install result
- runtime result
- device information
- failure logs
- limitations

### 12. FAILURE / RECOVERY
Every framework strategy must document failure stage, classification, retry safety, deterministic repair/recovery, required developer input, BLOCKED conditions, and conditions where the strategy must stop rather than fall back.

Silent fallback to an unrelated strategy is prohibited.

### 13. DEFINITION OF DONE

A framework implementation is complete only when all applicable contract stages have implementation and evidence, including the required real fixture and runtime acceptance for runtime-sensitive milestones.

~~~
DETECT
  ✓
REQUIREMENTS
  ✓
TOOLCHAIN
  ✓
PREPARE
  ✓
DEPENDENCIES
  ✓
BUILD
  ✓
APK VALIDATION
  ✓
INSTALL
  ✓
RUNTIME
  ✓
FUNCTIONAL
  ✓
EVIDENCE
  ✓
MILESTONE GATE
  ✓
~~~

## Official Flow Adapter rule

If a framework has an established official/native Android build flow, implement an Official Flow Adapter that invokes the real framework tooling.

The Builder may adapt the execution environment for phone/Termux/ARM64 constraints, but must not replace native framework semantics with:
- fake or mock APKs
- generic WebView replacement
- unrelated fallback strategy
- compile-only evidence presented as runtime success

## Framework contract template

When a framework enters active implementation, its dedicated contract should define:

~~~
Framework
├── Detection
├── Requirements
├── Toolchain
├── Preparation
├── Dependencies
├── Build
├── Artifact Validation
├── Install
├── Runtime
├── Functional Validation
├── Failure / Recovery
├── Evidence
└── Definition of Done
~~~

Dedicated framework documents must link back to the canonical roadmap, architecture, test matrix, and validation workflow instead of duplicating their rules.
