# Termux setup

The primary local build environment is Android + Termux.

Run:

```bash
pnpm run setup:termux
```

The setup prepares the local toolchain and runs the Environment Doctor. Tool paths are discovered at runtime.

Expected tool families:
- Node.js + pnpm
- Java/JDK
- Gradle
- Android SDK command-line tools
- Android platform/build tools
- AAPT2
- zipalign
- apksigner
- framework-specific native toolchains when required

No Docker, PostgreSQL, Redis, or remote API service is required for the phone-first build path.

Manual diagnostics:

```bash
bash scripts/environment-doctor.sh
```
