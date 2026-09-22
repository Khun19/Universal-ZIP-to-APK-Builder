<div align="center">📦 Universal ZIP-to-APK Builder

Build Android APKs from structured ZIP projects — automatically.

""License" (https://img.shields.io/badge/License-MIT-yellow.svg)" (LICENSE)
""PRs Welcome" (https://img.shields.io/badge/PRs-welcome-brightgreen.svg)" (CONTRIBUTING.md)]

Universal ZIP-to-APK Builder is a developer-focused build platform that analyzes
structured ZIP projects, selects an appropriate Android build strategy, executes
the build pipeline, validates the resulting APK, and makes the final artifact
available for download.

## Project Governance

The active development and release workflow is [RZ Governance](docs/rz/README.md). It requires one milestone at a time and separates source, build, artifact, Termux, device-runtime, and release evidence. Older workflow pages are retained for context but are superseded by RZ. Retained BMAD skill files are not the project's active workflow.

The project is designed to support local Android build environments, including
phone-based development environments such as Termux, as well as containerized
build environments.

---

"✨ Features" (#-features) ·
"🏗️ Architecture" (#️-architecture) ·
"🚀 Quick Start" (#-quick-start) ·
"📦 Supported Projects" (#-supported-project-types) ·
"📁 Project Structure" (#-project-structure) ·
"🐳 Docker" (#-docker) ·
"🔧 Build Pipeline" (#-build-pipeline) ·
"🧪 Testing" (#-testing) ·
"🤝 Contributing" (#-contributing) ·
"📄 License" (#-license)

---

</div>✨ Features

- ZIP → APK pipeline — Upload a structured ZIP project and build an Android APK.
- Automatic project detection — Detects Native Android, Capacitor, React/Vite, and plain Web projects.
- Strategy-based builds — Selects the appropriate build strategy based on project analysis.
- Native Android builds — Supports existing Android/Gradle projects.
- Web-to-APK builds — Web projects can be prepared for Android through the web-wrapper build pipeline.
- Capacitor builds — Supports projects using Capacitor.
- Secure ZIP extraction — ZIP files are validated before extraction to reduce path-traversal and unsafe archive risks.
- APK validation — Generated APKs are checked to ensure they are valid Android package artifacts.
- SHA-256 verification — The final APK can be hashed for artifact integrity verification.
- Build logs — The build engine exposes detailed build information and logs.
- Environment detection — Android SDK, JDK, Gradle, Node.js, npm, AAPT2, and related tooling can be checked before building.
- Developer dashboard — Provides a browser-based interface for managing builds and artifacts.
- Termux-friendly architecture — The build engine can operate in a local Android/Termux development environment.
- Docker support — A dedicated Android builder environment is available under "docker/android-builder".
- Monorepo architecture — Shared packages separate analysis, security, build execution, API contracts, database access, and frontend functionality.

---

🏗️ Architecture

The project consists of several major layers.

Shared Build Libraries

The "lib/" directory contains reusable build infrastructure:

- "shared" — Shared types and utilities.
- "security" — ZIP validation, safe extraction, hashing, and APK validation.
- "analyzer" — Project-type detection and analysis.
- "build-engine" — Build strategy selection and process execution.
- "build-queue" — Build queue infrastructure.
- "db" — Database and repository layer.
- "api-spec" — API contracts and OpenAPI definitions.
- "api-client-react" — Generated React API client/hooks.
- "api-zod" — Generated validation schemas.

Web Application

The frontend lives under:

artifacts/zip-to-apk-builder/

It is built with a modern React/Vite stack and provides the user-facing dashboard for:

- Uploading projects
- Viewing project analysis
- Monitoring builds
- Viewing logs
- Inspecting artifacts
- Downloading APKs

API Server

The API implementation is located under:

artifacts/api-server/

It provides the application API and connects the frontend to project/build data.

Local Build Pipeline

The legacy/local HTTP entry point and local build executor live under "lib/".

The local build pipeline is particularly important for environments such as
Termux, where the actual Android build is performed on the local machine.

Worker Infrastructure

The "worker/" directory contains background build infrastructure intended for
containerized/queued build workflows.

---

📦 Supported Project Types

The analyzer can identify several common project structures.

Native Android

Typical indicators include:

- "settings.gradle"
- "settings.gradle.kts"
- Android "app/" module
- "AndroidManifest.xml"
- Gradle build files

Strategy:

native-gradle

Capacitor

Projects containing Capacitor configuration can use the Capacitor build pipeline.

Strategy:

capacitor

Typical flow:

Web Build
    ↓
Capacitor Sync
    ↓
Gradle Build
    ↓
APK Validation

React / Vite

Web projects can be prepared for Android through the web-wrapper pipeline.

Strategy:

web-wrapper

Typical flow:

Web Build
    ↓
Android Wrapper
    ↓
Gradle Build
    ↓
APK Validation

Plain HTML / JavaScript

Supported web projects can also be wrapped into an Android application through
the web-wrapper strategy.

Unknown Projects

If the analyzer cannot confidently identify a supported project structure, the
build can be blocked rather than attempting an unsafe or invalid build.

---

🔧 Build Pipeline

The Builder Engine follows a phase-based pipeline.

ZIP Upload
    ↓
EXTRACTING
    ↓
ANALYZING
    ↓
PREPARING_ENV
    ↓
WEB_BUILD          (when required)
    ↓
CAPACITOR_SYNC     (when required)
    ↓
GRADLE_BUILD
    ↓
LOCATING_APK
    ↓
VALIDATING_APK
    ↓
HASHING
    ↓
SUCCESS

Depending on the project type, some phases are skipped.

For example, a Native Android project normally follows:

EXTRACTING
    ↓
ANALYZING
    ↓
PREPARING_ENV
    ↓
GRADLE_BUILD
    ↓
LOCATING_APK
    ↓
VALIDATING_APK
    ↓
HASHING
    ↓
SUCCESS

Build States

The application can represent states such as:

QUEUED
EXTRACTING
ANALYZING
PREPARING_ENV
WEB_BUILD
CAPACITOR_SYNC
GRADLE_BUILD
LOCATING_APK
VALIDATING_APK
HASHING
SUCCESS
FAILED
BLOCKED

The UI should display these real build phases rather than inventing artificial
percentage-based progress.

---

🔐 ZIP Security

Uploaded ZIP archives are processed through security checks before being used
as build input.

The extraction pipeline is designed to protect against common unsafe archive
conditions, including:

- Absolute paths
- Directory traversal
- Windows drive paths
- NUL characters
- Unsafe extracted paths
- Symlink-related risks
- Excessive file counts
- Excessive uncompressed archive size
- Abnormally high compression ratios

Only validated project contents should be passed into the build pipeline.

---

📱 Termux / Local Android Builds

The Builder Engine is designed to support local Android build environments.

A typical Termux environment may provide:

Android SDK
Build Tools
JDK 17 / JDK 21
Gradle
Node.js
npm
unzip
AAPT2

The Android SDK location is supplied through the environment rather than being
hard-coded into the application.

For example:

export ANDROID_HOME="$HOME/android-sdk"
export ANDROID_SDK_ROOT="$HOME/android-sdk"

The exact SDK path depends on the host environment.

---

🚀 Quick Start

1. Clone the Repository

git clone https://github.com/Khun19/Universal-ZIP-to-APK-Builder.git
cd Universal-ZIP-to-APK-Builder

2. Install Dependencies

This repository uses pnpm workspace tooling.

Install pnpm if necessary, then run:

pnpm install

3. Configure Environment

If environment configuration is required:

cp .env.example .env

Review the variables in ".env.example" and configure only the values required
by your environment.

4. Development

Use the development scripts defined in the repository's "package.json".

To inspect the available scripts:

cat package.json

or:

node -e "console.log(require('./package.json').scripts)"

Then start the appropriate development service.

5. Production Build

Build the workspace with:

pnpm run build

Type-check the workspace with:

pnpm run typecheck

«The exact development command may vary depending on which workspace/service
you are running. Check the corresponding "package.json" before starting a
specific service.»

---

🌐 Development Services

The repository contains multiple application layers rather than a single
standalone server.

Depending on the development setup, the project may expose:

Frontend UI
API Server
Local Build Executor

The local build environment can use a browser-accessible dashboard together
with the local Builder Engine.

The actual ports should be taken from the current development configuration
rather than assumed in documentation.

---

📁 Project Structure

Universal-ZIP-to-APK-Builder/
│
├── .agents/
│   └── memory/
│
├── .claude/
│   └── skills/
│
├── .github/
│   └── workflows/
│
├── .workspace/
│
├── _bmad/
│
├── artifacts/
│   ├── api-server/
│   │   └── API implementation
│   │
│   └── zip-to-apk-builder/
│       └── React/Vite web application
│
├── docker/
│   └── android-builder/
│       └── Android builder environment
│
├── docs/
│   └── Documentation
│
├── lib/
│   ├── analyzer/
│   ├── api-client-react/
│   ├── api-spec/
│   ├── api-zod/
│   ├── build-engine/
│   ├── build-queue/
│   ├── db/
│   ├── security/
│   ├── shared/
│   ├── analyzer.ts
│   ├── capacitor-builder.ts
│   ├── server-http.ts
│   ├── strategy.ts
│   ├── template.ts
│   ├── web-builder.ts
│   └── worker.ts
│
├── public/
│
├── scripts/
│
├── tests/
│
├── worker/
│
├── dashboard.html
├── package.json
├── pnpm-lock.yaml
├── pnpm-workspace.yaml
└── .env.example

«Project structure can evolve as the Builder Engine and frontend continue to
be developed.»

---

🐳 Docker

The repository includes an Android builder environment under:

docker/android-builder/

Docker can be used when a reproducible containerized Android build environment
is desired.

Example:

docker compose up

«Docker configuration depends on the files and services currently included in
the repository. For local Termux builds, the native/local Builder Engine may
be used instead of Docker.»

---

📱 Termux Setup

For a new Android phone running Termux, clone the repository and run:

    git clone https://github.com/Khun19/Universal-ZIP-to-APK-Builder.git
    cd Universal-ZIP-to-APK-Builder
    ./scripts/setup-termux.sh
    pnpm test

The setup script is idempotent: it keeps existing Node.js, pnpm, Java, Gradle, and Android SDK installations, installs only missing components, persists the Android/Java environment in ~/.profile and ~/.bashrc, and installs dependencies with the frozen pnpm-lock.yaml when available. It does not force-install disabled Android ARM64 native packages or rewrite the repository's package overrides.

The default SDK target is Android API 33 with build-tools 33.0.2. Override ANDROID_API_LEVEL, ANDROID_BUILD_TOOLS_VERSION, or ANDROID_SDK_ROOT before running the script when a project requires another installed SDK target.

---

🧪 Testing

Run the repository's type-checking workflow:

pnpm run typecheck

Run the configured build:

pnpm run build

Run the project's test command if configured:

pnpm test

To inspect all available scripts:

node -e "console.log(require('./package.json').scripts)"

The project should be tested against:

- ZIP validation
- Safe extraction
- Project detection
- Build strategy selection
- Android build execution
- APK discovery
- APK validation
- SHA-256 hashing
- API responses
- Frontend build state handling

---

📡 API

The application is designed around API-driven project and build management.

Important API operations include:

GET  /api/healthz
GET  /api/environment

GET  /api/builds
POST /api/builds

GET  /api/builds/:id
GET  /api/builds/:id/logs
GET  /api/builds/:id/analysis
GET  /api/builds/:id/artifact
GET  /api/builds/:id/artifact/download

The exact availability of an endpoint depends on the currently deployed backend
implementation.

API contracts are maintained under:

lib/api-spec/

---

📦 APK Artifacts

After a successful build, the Builder Engine locates the generated APK and
validates it before exposing it as an artifact.

Artifact information can include:

Filename
File Size
SHA-256
Build ID
Download URL

The APK validation process checks that the generated file is a real APK artifact
and contains the expected Android package structure.

---

🛠️ Build Strategies

Native Gradle

Used for existing Android projects.

Project
  ↓
Android Project Detection
  ↓
Environment Preparation
  ↓
Gradle assembleDebug
  ↓
APK Validation

Capacitor

Used for projects containing Capacitor.

Project
  ↓
Web Build
  ↓
Capacitor Sync
  ↓
Gradle Build
  ↓
APK Validation

Web Wrapper

Used for supported web applications.

Web Project
  ↓
Web Build
  ↓
Android Wrapper
  ↓
Gradle Build
  ↓
APK Validation

---

📊 Design Principles

The Builder Engine and its UI follow several important principles.

Real Build State

The UI should reflect actual backend state.

REAL BUILD STATE
      >
FAKE VISUAL PROGRESS

If the backend does not provide exact percentage progress, the UI should use
phase-based progress instead.

Fail Clearly

Build failures should expose the failed phase and useful technical information
instead of hiding the error behind generic messages.

Validate Before Delivery

An APK should not be presented as successfully built until it has passed the
required validation checks.

Separate Concerns

The project separates:

Security
Analysis
Build Execution
API
Database
Frontend
Worker Infrastructure

This allows individual layers to evolve without unnecessarily rewriting the
entire build system.

---

🤝 Contributing

Contributions, bug reports, improvements, and feature requests are welcome.

Report a Bug

Please provide:

- Project type
- ZIP structure
- Build strategy
- Build phase where the problem occurred
- Relevant logs
- Environment information
- Error message

Avoid uploading secrets, API keys, private certificates, or sensitive project
files.

Pull Requests

Before submitting a pull request:

pnpm install
pnpm run typecheck
pnpm run build

Run the project's configured test suite when applicable.

---

📄 License

This project is distributed under the MIT License.

See:

LICENSE

for the complete license text.

---

<div align="center">Universal ZIP-to-APK Builder

Built for developers who want a simpler path from project ZIP to Android APK.

"Khun19" (https://github.com/Khun19)

</div>
