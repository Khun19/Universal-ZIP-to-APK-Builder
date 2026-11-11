#!/usr/bin/env bash
set -euo pipefail

: "${JOB_STATUS:?JOB_STATUS is required}"
: "${GITHUB_STEP_SUMMARY:?GITHUB_STEP_SUMMARY is required}"
: "${WORKFLOW_NAME:?WORKFLOW_NAME is required}"
: "${EVIDENCE_SCOPE:?EVIDENCE_SCOPE is required}"
: "${RUN_ID:?RUN_ID is required}"
: "${RUN_ATTEMPT:?RUN_ATTEMPT is required}"
: "${COMMIT_SHA:?COMMIT_SHA is required}"
: "${EVENT_NAME:?EVENT_NAME is required}"
: "${SERVER_URL:?SERVER_URL is required}"
: "${REPOSITORY:?REPOSITORY is required}"

escape_command_data() {
  local value="$1"
  value="${value//'%'/'%25'}"
  value="${value//$'\r'/'%0D'}"
  value="${value//$'\n'/'%0A'}"
  printf '%s' "$value"
}

SAFE_WORKFLOW="$(escape_command_data "$WORKFLOW_NAME")"
SAFE_SCOPE="$(escape_command_data "$EVIDENCE_SCOPE")"

case "$JOB_STATUS" in
  success)
    printf '::notice title=Workflow job passed::%s completed successfully. Scope: %s\n' "$SAFE_WORKFLOW" "$SAFE_SCOPE"
    RESULT="PASS"
    ;;
  failure)
    printf '::error title=Workflow job failed::%s failed. Inspect the failed step and its uploaded evidence. Scope: %s\n' "$SAFE_WORKFLOW" "$SAFE_SCOPE"
    RESULT="FAIL"
    ;;
  cancelled)
    printf '::warning title=Workflow job cancelled::%s was cancelled; this is not a passing result. Scope: %s\n' "$SAFE_WORKFLOW" "$SAFE_SCOPE"
    RESULT="CANCELLED"
    ;;
  *)
    printf '::warning title=Workflow job incomplete::%s ended with status %s. Treat as not verified.\n' "$SAFE_WORKFLOW" "$(escape_command_data "$JOB_STATUS")"
    RESULT="NOT_VERIFIED"
    ;;
esac

{
  printf '## Workflow result annotation\n\n'
  printf -- '- Result: **%s**\n' "$RESULT"
  printf -- '- Workflow: %s\n' "$WORKFLOW_NAME"
  printf -- '- Run: [%s / attempt %s](%s/%s/actions/runs/%s)\n' "$RUN_ID" "$RUN_ATTEMPT" "$SERVER_URL" "$REPOSITORY" "$RUN_ID"
  printf -- '- Event: %s\n' "$EVENT_NAME"
  printf -- '- Commit: `%s`\n' "$COMMIT_SHA"
  printf -- '- Evidence scope: %s\n\n' "$EVIDENCE_SCOPE"
  printf 'This annotation reports the job outcome only. It does not upgrade an unrun validation, emulator test, or physical-device acceptance to PASS.\n'
} >> "$GITHUB_STEP_SUMMARY"
