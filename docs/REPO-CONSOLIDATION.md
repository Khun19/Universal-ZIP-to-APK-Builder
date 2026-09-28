# Repository Consolidation Plan

## Objective

Reduce architectural drift without disrupting the validated build pipeline.

## Order

### Phase 0 — Baseline
- Work from latest `main`.
- Create one focused consolidation branch.
- Record the target structure.
- Do not claim code migration from directory creation alone.

### Phase 1 — Boundary inventory
Classify every top-level/core component as:
- CANONICAL
- SECONDARY
- LEGACY
- TEST/FIXTURE
- TOOLING
- DOCUMENTATION
- UNKNOWN

### Phase 2 — Canonical core
Consolidate ownership around:
- analyzer
- security
- build-engine
- strategies
- adapters
- apk
- shared

### Phase 3 — Evidence model
Make input SHA-256, detection evidence, selected strategy, environment, command/result, APK metadata, and runtime evidence first-class build evidence.

### Phase 4 — M6 gate
Keep React Native on the canonical branch until G1–G13 are resolved. Build success or APK creation alone is never M6 PASS.

### Phase 5 — Environment boundary
Keep Termux setup/diagnostics in `scripts/`. Do not duplicate framework build logic there.

### Phase 6 — Legacy retirement
After dependencies and imports are removed, delete or archive retired Replit/API/DB/queue/worker/container components in focused commits.

## Safety rules

- No mass rename without import/test verification.
- No simultaneous framework milestone expansion while M6 is unresolved.
- No silent fallback from a native framework to WebView.
- No PASS without the required evidence.
- No second roadmap.
- No legacy component becomes canonical by accidental import.

## Current target

**M6 → Consolidation → M7**

M6 remains the active product gate. Repository consolidation is supporting work and must not become an excuse to bypass M6 runtime validation.
