---
name: Bug report
about: Report a reproducible problem in the ZIP-to-APK build or validation workflow
title: "[Bug]: "
labels: bug
assignees: ""
---

## Affected component / path
<!-- Framework, workflow, ZIP handling, APK validation, provenance, UI, or repository path. -->

## Describe the issue
<!-- State the observed problem and its impact. -->

## Steps to reproduce
1.
2.
3.

## Expected behavior
<!-- What should happen according to the documented workflow? -->

## Actual behavior
<!-- What happened instead? Include exact error messages where possible. -->

## Environment
- Source commit / branch:
- Workflow run or CI job:
- Framework / toolchain:
- Device and Android version (if relevant):

## Logs, screenshots, or artifacts
<!-- Add relevant logs, screenshots, CI links, artifact path/details, and SHA-256 where applicable. Remove secrets before posting. -->

## Validation and evidence
- CI/build result: PASS / FAIL / BLOCKED / NOT RUN / NOT APPLICABLE
- APK produced and validated: YES / NO / NOT VERIFIED / NOT APPLICABLE
- Real-device test: PASS / FAIL / BLOCKED / NOT RUN / NOT APPLICABLE
- What was verified:
- What remains an assumption or is unverified:

Please distinguish confirmed, reproducible behavior from assumptions. A local/workspace build alone does not prove an Android APK was produced; link evidence to the exact commit when making APK claims.

**Security:** Do not report suspected vulnerabilities in public issues. Follow the private reporting instructions in [`SECURITY.md`](../../SECURITY.md).
