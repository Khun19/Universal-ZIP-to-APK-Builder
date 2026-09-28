# Repository Ownership Inventory

**Baseline:** `chore/repo-consolidation-foundation-v2`  
**Baseline commit:** `d788ee56bf56112fc9a25d86e9d6a8252948224c`  
**Inventory branch:** `chore/phase1-ownership-inventory`  
**Purpose:** classify existing repository areas before any physical migration or deletion.

## 1. Classification rules

- **CANONICAL** — belongs to the current three-layer phone-first Builder architecture.
- **TRANSITIONAL** — active implementation that is still in an older location/boundary; do not move until imports and tests are mapped.
- **SECONDARY** — useful compatibility, generated/client, development, or supporting infrastructure but not a canonical product layer.
- **LEGACY** — retired architecture or deployment model; do not introduce new dependencies.
- **TEST / FIXTURE** — verification assets, fixtures, acceptance evidence, or test-only code.
- **TOOLING** — setup, diagnostics, CI, or repository automation.
- **DOCUMENTATION** — source-of-truth project documentation.
- **REVIEW REQUIRED** — classification needs dependency/usage analysis before migration or removal.

## 2. Canonical three-layer map

| Area | Classification | Ownership | Action |
|---|---|---|---|
| `artifacts/zip-to-apk-builder/` | CANONICAL | Layer 1 — Android Builder UI | Keep as primary UI source/prototype; later remove backend assumptions through a separate focused change |
| `scripts/setup-termux.sh` | CANONICAL / TOOLING | Layer 2 — Termux environment | Keep; verify environment boundary |
| `scripts/setup-sdk.sh` | TOOLING | Layer 2 — Termux environment | Keep; audit against phone-first setup |
| `scripts/test-real-build.ts` | TOOLING | Layer 2 / validation | Keep; align with evidence workflow |
| `lib/` | CANONICAL + TRANSITIONAL | Layer 3 — Builder code | Consolidate by ownership; do not mass-move |
| `tests/` | CANONICAL | Layer 3 verification | Keep; progressively align subdirectories with test categories |
| `docs/` | DOCUMENTATION | Project source of truth | Keep; avoid competing architecture/roadmap docs |
| `templates/` | CANONICAL SUPPORT ASSETS | Builder strategy/template inputs | Keep; templates must not become fake build evidence |

## 3. `lib/` ownership inventory

### Canonical implementation

| Path | Classification | Reason / boundary |
|---|---|---|
| `lib/security/` | CANONICAL | Untrusted ZIP/input security and validation |
| `lib/analyzer/` | CANONICAL | Evidence-based project detection; current package contains `src/index.ts` |
| `lib/build-engine/` | CANONICAL | Shared process/build lifecycle boundary |
| `lib/shared/` | CANONICAL | Shared contracts/types/utilities |
| `lib/capacitor-builder.ts` | TRANSITIONAL | Framework-specific build orchestration; should eventually live behind official-flow strategy/adapter ownership |
| `lib/extractor.ts` | TRANSITIONAL | Core secure extraction behavior; ownership overlaps with security boundary |
| `lib/strategy.ts` | TRANSITIONAL | Strategy selection currently exists at root; target is strategy registry/strategy ownership |
| `lib/pipeline.ts` | TRANSITIONAL | Main orchestration; must remain stable while boundaries are migrated |
| `lib/template-generator.ts` | CANONICAL SUPPORT | Template generation used by current builder flow |
| `lib/template-registry.ts` | CANONICAL SUPPORT | Template registry used by current builder flow |
| `lib/template.ts` | CANONICAL SUPPORT | Template contracts |
| `lib/web-builder.ts` | TRANSITIONAL | Web/PWA build support; keep Replit URL sanitization only where it is a real portability/security concern |
| `lib/cli.ts` | CANONICAL TOOLING | Direct builder CLI entry point |
| `lib/server.ts` | TRANSITIONAL | Current pipeline imports it; it must not be deleted until the pipeline is re-owned by the canonical build-engine/strategy boundary |
| `lib/server-http.ts` | SECONDARY / REVIEW REQUIRED | HTTP entry point around the current server flow; not a canonical product layer |
| `lib/worker.ts` | REVIEW REQUIRED | Root worker entry point; inspect whether it duplicates the legacy worker architecture before removal |

### Canonical target directories that are not yet populated

| Path | Classification | Current state |
|---|---|---|
| `lib/adapters/` | CANONICAL TARGET | README boundary only; no implementation migration yet |
| `lib/apk/` | CANONICAL TARGET | README boundary only; no implementation migration yet |
| `lib/strategies/` | CANONICAL TARGET | README boundary only; no implementation migration yet |

These directories are **ownership contracts, not permission to move files blindly**.

### API / hosted-backend related packages

| Path | Classification | Action |
|---|---|---|
| `lib/api-client-react/` | SECONDARY / LEGACY-BRIDGE | Used directly by the current UI; keep until UI is decoupled from hosted API assumptions |
| `lib/api-spec/` | SECONDARY / LEGACY-BRIDGE | OpenAPI/orval generation tied to API architecture; audit before removal |
| `lib/api-zod/` | SECONDARY / LEGACY-BRIDGE | API contract package; audit consumers before removal |
| `lib/build-queue/` | LEGACY | Queue/Redis architecture explicitly outside canonical three layers |
| `lib/db/` | LEGACY | Database/PostgreSQL architecture explicitly outside canonical three layers |

## 4. `artifacts/` inventory

| Path | Classification | Decision |
|---|---|---|
| `artifacts/zip-to-apk-builder/` | CANONICAL | Primary UI source/prototype |
| `artifacts/api-server/` | LEGACY | Retained only for cleanup/history until dependency audit permits removal |
| `artifacts/mockup-sandbox/` | SECONDARY / LEGACY | UI exploration/mockup; must never establish build evidence |

The API server and mockup sandbox must not become new product dependencies.

## 5. Tests and fixtures

### Test categories

| Path | Classification | Decision |
|---|---|---|
| `tests/unit/` | TEST | Unit verification boundary |
| `tests/integration/` | TEST | Integration verification boundary |
| `tests/security/` | TEST | Security verification boundary |
| `tests/acceptance/` | TEST | Milestone/runtime acceptance evidence boundary |
| `tests/fixtures/` | TEST / FIXTURE | Real project fixtures |
| `tests/*.test.ts` | TEST / TRANSITIONAL | Existing tests remain valid; migrate by ownership only after test behavior is preserved |

Current root-level tests include analyzer, extractor, pipeline, server, strategy, template, web-builder, and worker coverage. They should not be bulk-renamed until their implementation ownership is established.

## 6. Templates

`templates/` contains Builder-generated/support templates for native Android, React/Vite, PWA, Capacitor, web-basic, and other sample project types.

**Classification: CANONICAL SUPPORT ASSETS.**

A template is not evidence that a framework is supported. Framework support still requires the real fixture/build/APK/runtime evidence defined by the milestone.

## 7. Scripts and automation

| Path | Classification | Decision |
|---|---|---|
| `scripts/setup-termux.sh` | CANONICAL TOOLING | Preserve as phone environment setup |
| `scripts/setup-sdk.sh` | CANONICAL TOOLING | Preserve; audit platform assumptions |
| `scripts/test-real-build.ts` | CANONICAL TOOLING | Preserve; align with evidence capture |
| `scripts/src/` | TOOLING | Review each utility |
| `scripts/post-merge.sh` | REVIEW REQUIRED | CI/repository automation; not product runtime |
| `scripts/*directory-picker*` | REVIEW REQUIRED | One-time/diagnostic automation; determine whether still active before retirement |

## 8. Root-level infrastructure

| Path | Classification | Decision |
|---|---|---|
| `.env.example` | CANONICAL CONFIG SURFACE | Keep only variables required by current architecture; PR #21 already removed three retired hosted-builder variables |
| `.replit` | LEGACY | Still present on the inventory baseline; removal must be a separate focused change because PR #21 did not remove it |
| `.replitignore` | LEGACY | Same as above |
| `replit.md` | LEGACY | Same as above |
| `docker/` | LEGACY | Container/hosted builder infrastructure; do not introduce new dependencies |
| `docker-compose.yml` | LEGACY | Database/Redis/server orchestration; outside canonical architecture |
| `worker/` | LEGACY | Hosted queue/worker architecture; outside canonical architecture |
| `.github/workflows/` | TOOLING | CI automation; keep only workflows that support current validation/repository health |
| `.agents/` | REVIEW REQUIRED | Repository agent/memory material; audit for obsolete workflow residue before changing |
| `AGENTS.md` | DOCUMENTATION / GOVERNANCE | Keep as engineering rules; must remain consistent with canonical workflow |
| `ROADMAP.md` | DOCUMENTATION | Master milestone source of truth |
| `README.md` | DOCUMENTATION | Product/project overview |
| `pnpm-workspace.yaml` | CANONICAL BUILD CONFIG + REVIEW | Workspace still includes legacy packages; should be narrowed only after dependency migration |
| `package.json` | CANONICAL BUILD CONFIG + REVIEW | Root scripts/workspaces still reference both canonical and legacy packages |

## 9. Important dependency findings

1. The UI currently imports `@workspace/api-client-react`, so the API client cannot simply be deleted.
2. `lib/pipeline.ts` and `lib/cli.ts` currently depend on `lib/server.ts`; that root server implementation must be migrated deliberately rather than removed blindly.
3. `worker/` imports `@workspace/build-queue` and `@workspace/db`, confirming the hosted queue/database path is a distinct legacy subsystem.
4. Replit packages are still present in the root package/catalog and UI build configuration. This is **not** evidence that the whole UI should be deleted. Replit dependency removal requires a focused UI portability audit and lockfile update.
5. `pnpm-workspace.yaml` still declares legacy workspace packages. Workspace cleanup must follow dependency migration, not precede it.
6. The current architecture documents already define the three-layer boundary and explicitly identify API server, DB, build queue, worker, Docker, and Replit infrastructure as non-canonical.

## 10. Migration order

No mass move is authorized by this inventory.

Recommended order:

1. Preserve current M6 implementation and local validation state.
2. Decouple canonical UI from legacy API-client assumptions.
3. Establish real adapter/strategy/APK ownership behind stable interfaces.
4. Move implementation files one ownership group at a time.
5. Update imports/workspaces/tests together.
6. Run typecheck + test suite.
7. Pull exact commit into Termux and validate.
8. Only after evidence passes, retire the corresponding legacy component.

## 11. Current status

- Phase 1 inventory: **defined**
- Physical migration: **NOT STARTED**
- Legacy deletion: **NOT STARTED**
- M6 React Native runtime gates: **NOT PASSED**
- M7: **NOT STARTED**

**Rule:** This document classifies the repository; it does not claim that any framework, runtime milestone, or legacy deletion has passed.
