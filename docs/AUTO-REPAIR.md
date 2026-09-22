# Build-Readiness Auto-Repair

Auto-Repair runs between secure extraction and the existing analyzer/strategy/build handoff. It never changes the uploaded ZIP or extracted source tree. Repairs are applied to a unique sibling workspace and the canonical analyzer and strategy are then used for the build.

## Lifecycle

`ANALYZE → CLASSIFY → REPAIR PLAN → POLICY VALIDATION → APPLY SAFE REPAIRS → RE-ANALYZE → BUILD READINESS → EXISTING BUILD STRATEGY`

Only `AUTO_REPAIR` issues may be changed. `NEEDS_INPUT`, `BLOCKED`, and `UNSAFE` issues prevent the worker from being called. Safe repairs may still be applied in the isolated copy when another issue is blocked; the response retains the blocker and does not build.

Current deterministic rules:

- Generate an npm, pnpm, Yarn, or Bun lockfile using the declared dependency graph, with lifecycle scripts disabled. Registry or graph resolution failure blocks the build. Yarn plugin/executable hooks are blocked rather than executed.
- Convert `workspace:*`, `workspace:^`, and `workspace:~` to a local `file:` dependency only when a matching package manifest and source directory exist in the uploaded context.
- Resolve `catalog:` references only from `workspaces.catalog` in the root `package.json` or a supported `catalog` / `catalogs` section in `pnpm-workspace.yaml`.
- Preserve TypeScript project references only when their targets exist inside the uploaded source context. Missing or escaping references block the build.
- Recognize managed Expo projects without `android/` and leave native scaffolding generation to the existing Expo prebuild build strategy. This does not run prebuild during analysis or repair.

The current external-reference detector is intentionally limited to package `file:` dependencies and TypeScript project `references`. Other arbitrary path syntaxes are not rewritten. Unknown or unsupported cases must be handled as build errors rather than guessed repairs.

## Security and Isolation

ZIP paths are checked using raw stored entry names, normalized names are checked for duplicates, absolute/traversal paths are rejected, and symbolic links and special files are rejected. Extraction checks canonical parents and existing symlinks. Repair copies reject symlinks and stay inside the per-build workspace. Analysis and repair do not execute project scripts or binaries. Lock resolution invokes only the declared npm, pnpm, Yarn, or Bun executable with lifecycle scripts disabled. Any package-manager scratch workspace is isolated and removed after resolution.

The repair allowlist currently permits package manifest dependency normalization and lockfile creation. Any new mutation class requires an explicit rule and tests before it may write files.

## Evidence and API

Applied changes are recorded at `.builder/auto-repair-evidence.json` in the repaired workspace. Each record includes repair/issue IDs, rule, before/after state, reason, source evidence, source ZIP hash when the caller supplies a ZIP path, project hash, repaired project hash, workspace path, and timestamp.

The shared `handleBuildRequest` response includes `repairIssues` and `repairEvidence`; blocked results include the structured blocking issue and do not invoke the build worker. The ZIP CLI supports a no-write inspection mode:

```sh
pnpm exec tsx lib/cli.ts build-zip /path/to/source.zip --dry-run
```

Dry-run reports classifications and planned changes without creating a repair workspace or changing extracted project files. Lockfile resolution may access the configured package registry, but always disables lifecycle scripts.

## Known Boundaries

- Local workspace packages must include valid `package.json` metadata and source in the uploaded context.
- Catalog entries must be available in the supported project-local catalog formats.
- Private packages, unavailable registries, ambiguous package metadata, missing source, and unrecognized package managers block the build.
- A successful repair or Gradle build does not prove APK installation, launch, or runtime behavior.
- The Expense Tracker candidate may receive safe partial repairs and still be correctly blocked on unavailable `@workspace/api-client-react` source or missing catalog definitions.
