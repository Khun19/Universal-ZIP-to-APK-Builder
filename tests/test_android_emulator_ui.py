"""Focused regression tests for Android Emulator UI evidence checks."""
from __future__ import annotations

import importlib.util
import json
import subprocess
import tempfile
import unittest
from pathlib import Path
from unittest.mock import patch
import xml.etree.ElementTree as ET


SCRIPT_PATH = Path(__file__).resolve().parents[1] / "scripts" / "android-emulator-ui-test.py"
SPEC = importlib.util.spec_from_file_location("android_emulator_ui_test", SCRIPT_PATH)
if SPEC is None or SPEC.loader is None:
    raise RuntimeError(f"Could not load UI test script at {SCRIPT_PATH}")
ui_test = importlib.util.module_from_spec(SPEC)
SPEC.loader.exec_module(ui_test)

FINALIZER_PATH = Path(__file__).resolve().parents[1] / "scripts" / "finalize-android-emulator-evidence.py"
FINALIZER_SPEC = importlib.util.spec_from_file_location("finalize_android_emulator_evidence", FINALIZER_PATH)
if FINALIZER_SPEC is None or FINALIZER_SPEC.loader is None:
    raise RuntimeError(f"Could not load evidence finalizer at {FINALIZER_PATH}")
finalizer = importlib.util.module_from_spec(FINALIZER_SPEC)
FINALIZER_SPEC.loader.exec_module(finalizer)


def screenshot_result(returncode: int, stdout: bytes = b"", stderr: bytes = b"") -> subprocess.CompletedProcess[bytes]:
    return subprocess.CompletedProcess(
        args=["adb", "exec-out", "screencap", "-p"],
        returncode=returncode,
        stdout=stdout,
        stderr=stderr,
    )


class ScreenshotStateTests(unittest.TestCase):
    def setUp(self) -> None:
        ui_test.SCREENSHOT_FAILURES.clear()

    def test_failure_then_success_resolves_same_required_screenshot(self) -> None:
        png = b"\x89PNG\r\n\x1a\nvalid-test-image"
        with tempfile.TemporaryDirectory() as directory:
            evidence = Path(directory)
            results = [screenshot_result(1, stderr=b"temporary capture failure") for _ in range(3)]
            results.append(screenshot_result(0, stdout=png))
            with patch.object(ui_test.subprocess, "run", side_effect=results), patch.object(ui_test.time, "sleep"):
                ui_test.capture_screenshot(evidence, "04-profile-after-send")
                self.assertIn("04-profile-after-send", ui_test.SCREENSHOT_FAILURES)
                self.assertTrue((evidence / "04-profile-after-send-screenshot-error.txt").exists())

                ui_test.capture_screenshot(evidence, "04-profile-after-send")

            self.assertNotIn("04-profile-after-send", ui_test.SCREENSHOT_FAILURES)
            self.assertEqual((evidence / "04-profile-after-send.png").read_bytes(), png)
            self.assertFalse((evidence / "04-profile-after-send-screenshot-error.txt").exists())

    def test_persistent_screenshot_failure_remains_a_final_failure(self) -> None:
        with tempfile.TemporaryDirectory() as directory:
            evidence = Path(directory)
            failures = [screenshot_result(1, stderr=b"device capture unavailable") for _ in range(3)]
            with patch.object(ui_test.subprocess, "run", side_effect=failures), patch.object(ui_test.time, "sleep"):
                ui_test.capture_screenshot(evidence, "06-message-sent")

            self.assertEqual(ui_test.SCREENSHOT_FAILURES, {"06-message-sent"})
            self.assertFalse((evidence / "06-message-sent.png").exists())
            self.assertIn("device capture unavailable", (evidence / "06-message-sent-screenshot-error.txt").read_text())


class ProfileCounterTests(unittest.TestCase):
    def test_reads_exact_counter_textview_in_the_labeled_row(self) -> None:
        root = ET.fromstring(
            '<hierarchy><node class="android.view.ViewGroup">'
            '<node class="android.widget.TextView" text="Messages sent" bounds="[10,100][150,120]" />'
            '<node class="android.widget.TextView" text="1" bounds="[200,100][220,120]" />'
            '<node class="android.widget.TextView" text="Interactions tested" bounds="[10,130][170,150]" />'
            '<node class="android.widget.TextView" text="0" bounds="[200,130][220,150]" />'
            '</node></hierarchy>'
        )

        value_node = ui_test.assert_profile_counter(root, "Messages sent", "1")

        self.assertEqual(value_node.attrib["class"], "android.widget.TextView")
        self.assertEqual(value_node.attrib["text"], "1")

    def test_unrelated_one_does_not_satisfy_messages_sent_counter(self) -> None:
        root = ET.fromstring(
            '<hierarchy><node class="android.view.ViewGroup">'
            '<node class="android.widget.TextView" text="Messages sent" bounds="[10,100][150,120]" />'
            '<node class="android.widget.TextView" text="0" bounds="[200,100][220,120]" />'
            '<node class="android.widget.TextView" text="Interactions tested" bounds="[10,130][170,150]" />'
            '<node class="android.widget.TextView" text="1" bounds="[200,130][220,150]" />'
            '</node></hierarchy>'
        )

        with self.assertRaisesRegex(AssertionError, "Messages sent.*expected exact value '1'"):
            ui_test.assert_profile_counter(root, "Messages sent", "1")


class RuntimeEvidenceTests(unittest.TestCase):
    def write_pending_provenance(self, evidence: Path) -> Path:
        evidence.mkdir(parents=True)
        path = evidence / "emulator-test-provenance.json"
        path.write_text(json.dumps({"runtime_test_status": "PENDING", "apk_sha256": "test-sha"}))
        return path

    def test_runtime_failure_replaces_pending_before_upload(self) -> None:
        with tempfile.TemporaryDirectory() as directory:
            evidence = Path(directory) / ".ci-evidence"
            provenance = self.write_pending_provenance(evidence)
            outcomes = {
                "provenance": "success",
                "create_avd": "success",
                "boot_emulator": "failure",
                "runtime_test": "skipped",
            }

            status, _ = finalizer.finalize_evidence(evidence, outcomes)

            self.assertEqual(status, "FAIL")
            record = json.loads(provenance.read_text())
            self.assertEqual(record["runtime_test_status"], "FAIL")
            self.assertEqual(record["runtime_test_step_outcomes"], outcomes)

    def test_cancelled_and_never_started_runtime_never_pass(self) -> None:
        outcomes = {
            "provenance": "success",
            "create_avd": "success",
            "boot_emulator": "cancelled",
            "runtime_test": "skipped",
        }
        self.assertEqual(finalizer.determine_status(outcomes, False)[0], "CANCELLED")

        outcomes["boot_emulator"] = "success"
        self.assertEqual(finalizer.determine_status(outcomes, False)[0], "NOT_RUN")

    def test_pass_requires_every_runtime_step_to_succeed(self) -> None:
        outcomes = {
            "provenance": "success",
            "create_avd": "success",
            "boot_emulator": "success",
            "runtime_test": "success",
        }
        self.assertEqual(finalizer.determine_status(outcomes, False)[0], "PASS")
        self.assertEqual(finalizer.determine_status(outcomes, True)[0], "CANCELLED")


if __name__ == "__main__":
    unittest.main()
