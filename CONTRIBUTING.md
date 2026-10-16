# Contributing

## Before contributing

Read the current project guidance before making changes:

- `README.md`
- `ROADMAP.md`
- `docs/ARCHITECTURE.md`
- `docs/VALIDATION-WORKFLOW.md`
- `docs/TEST-MATRIX.md`

These documents define the supported scope, architecture, milestone sequence, and evidence required for acceptance.

## Contribution expectations

- Keep pull requests focused and small, with one clear purpose.
- Explain what changed, why it is needed, and any relevant scope or behavior impact.
- Avoid unrelated refactors and changes that blur review or validation results.
- Keep framework support and milestone claims within the repository's documented, verified scope.

## Validation expectations

When the environment supports it, run the relevant checks:

```sh
pnpm install
pnpm run typecheck
pnpm run build
pnpm test
```

Run only the checks relevant to the change when a full set is not applicable, and report anything skipped or blocked. A successful local or workspace build does not by itself prove that an Android APK was produced. APK claims must be supported by the relevant CI run, linked to the exact commit under review, and backed by the required artifact validation and provenance. Perform and report real-device acceptance separately when required; do not treat CI success as device-test evidence.

## Evidence in pull requests

Include relevant logs, screenshots, CI run links, artifact details (including checksum and commit linkage where applicable), and test results. Mark each result accurately as PASS, FAIL, BLOCKED, or NOT RUN where useful. Distinguish observed, reproducible results from assumptions or unverified expectations.

## Security

Do not report suspected vulnerabilities in public issues. Follow the private reporting guidance in [`SECURITY.md`](SECURITY.md).

## Scope and source of truth

Keep changes consistent with the canonical documentation, approved roadmap, current repository rules, and applicable validation gates. If guidance conflicts or a requirement is unclear, document the conflict and resolve it explicitly rather than silently following legacy behavior.
