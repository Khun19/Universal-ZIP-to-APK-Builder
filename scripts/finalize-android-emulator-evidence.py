#!/usr/bin/env python3
"""Write the final Android Emulator runtime status before evidence upload."""
from __future__ import annotations

import argparse
import json
import os
from pathlib import Path


def determine_status(outcomes: dict[str, str], cancelled: bool) -> tuple[str, str]:
    """Return a final runtime status; incomplete or cancelled work never passes."""
    if cancelled or "cancelled" in outcomes.values():
        return "CANCELLED", "The workflow or a required step was cancelled before a final runtime result."
    if outcomes.get("provenance") != "success":
        return "NOT_RUN", "APK provenance was not completed, so the emulator runtime test did not start."
    if any(
        value == "failure"
        for key, value in outcomes.items()
        if key != "provenance"
    ):
        return "FAIL", "A required emulator setup, boot, install, launch, UI, or crash-validation step failed."
    required = ("provenance", "create_avd", "boot_emulator", "runtime_test")
    if all(outcomes.get(step) == "success" for step in required):
        return "PASS", "APK install, launch, UI interactions, and app-specific crash validation completed successfully."
    return "NOT_RUN", "At least one required runtime step was skipped or never started; it was not marked PASS."


def write_json_atomic(path: Path, record: dict[str, object]) -> None:
    temporary = path.with_suffix(path.suffix + ".tmp")
    temporary.write_text(json.dumps(record, indent=2, sort_keys=True) + "\n")
    temporary.replace(path)


def finalize_evidence(
    evidence: Path,
    outcomes: dict[str, str],
    cancelled: bool = False,
) -> tuple[str, str]:
    evidence.mkdir(parents=True, exist_ok=True)
    status, reason = determine_status(outcomes, cancelled)
    provenance_path = evidence / "emulator-test-provenance.json"
    if provenance_path.exists():
        record = json.loads(provenance_path.read_text())
        record["runtime_test_status"] = status
        record["runtime_test_status_reason"] = reason
        record["runtime_test_step_outcomes"] = outcomes
        if status == "PASS":
            record["test_scope"] = [
                "install", "launch", "communities-screen", "open-community-chat",
                "send-local-message", "profile-screen", "app-specific-crash-validation",
            ]
        write_json_atomic(provenance_path, record)
    else:
        write_json_atomic(
            evidence / "emulator-runtime-result.json",
            {
                "schema_version": 1,
                "evidence_type": "android-emulator-runtime-result",
                "runtime_test_status": status,
                "status_reason": reason,
                "step_outcomes": outcomes,
            },
        )
    return status, reason


def main() -> None:
    parser = argparse.ArgumentParser()
    parser.add_argument("--evidence-dir", required=True, type=Path)
    args = parser.parse_args()
    outcomes = {
        "provenance": os.environ.get("PROVENANCE_OUTCOME", "unknown"),
        "create_avd": os.environ.get("CREATE_AVD_OUTCOME", "unknown"),
        "boot_emulator": os.environ.get("BOOT_EMULATOR_OUTCOME", "unknown"),
        "runtime_test": os.environ.get("RUNTIME_TEST_OUTCOME", "unknown"),
    }
    cancelled = os.environ.get("CANCELLED", "false").lower() == "true"
    status, reason = finalize_evidence(args.evidence_dir, outcomes, cancelled)
    print(f"ANDROID_EMULATOR_RUNTIME_STATUS={status}: {reason}")
    if status in {"FAIL", "NOT_RUN"}:
        raise SystemExit(1)


if __name__ == "__main__":
    main()
