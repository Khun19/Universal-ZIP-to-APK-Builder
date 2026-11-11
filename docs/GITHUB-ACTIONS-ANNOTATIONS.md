# GitHub Actions Workflow Annotations

## Purpose

The local composite action at `.github/actions/workflow-annotation` publishes one job-level annotation and a matching Step Summary entry after each selected CI workflow job.

## Severity mapping

- `success` → `notice`: the GitHub Actions job completed successfully.
- `failure` → `error`: at least one required step failed. The action does not mask or replace the failed job result.
- `cancelled` → `warning`: cancellation is explicitly not a pass.
- Any other status → `warning`: result remains unverified.

## Evidence boundary

The annotation is a summary of the job result, not a replacement for individual validation evidence. Its evidence-scope text states what the workflow actually verifies. A successful build job does not imply APK runtime acceptance; an emulator pass does not imply physical-device acceptance; and a skipped or unrun gate must remain unverified.

## Integrated workflows

- Builder Quality Gates
- CodeQL Advanced
- Android Emulator Device Test
- M6 Exact APK Emulator Acceptance
- M6 Isolated Community Chat Demo ZIP to APK
- Ubuntu M4 Vite PWA APK Build Test
- M5 Flutter Build Test
- Ubuntu M6 Build Test

The action runs with `if: always()` so failed jobs still publish the annotation. It does not use write permissions, alter artifacts, or change job conclusions.
