#!/usr/bin/env python3
"""Android Emulator smoke test for Builder-produced APKs.

Uses Android's built-in UIAutomator hierarchy and adb input so the test does not
need app-specific instrumentation dependencies. Fails closed when expected UI
elements are missing.
"""
from __future__ import annotations

import argparse
import subprocess
import time
import xml.etree.ElementTree as ET
from pathlib import Path


def adb(*args: str, check: bool = True) -> str:
    result = subprocess.run(
        ["adb", *args],
        check=False,
        capture_output=True,
        text=True,
        timeout=30,
    )
    if check and result.returncode:
        raise RuntimeError(
            f"adb {' '.join(args)} failed ({result.returncode}): "
            f"{(result.stderr or result.stdout).strip()}"
        )
    return result.stdout


SCREENSHOT_FAILURES: list[str] = []


def capture_screenshot(evidence: Path, name: str) -> None:
    """Capture PNG bytes directly from adb and preserve failures for the final gate."""
    target = evidence / f"{name}.png"
    errors = []
    for attempt in range(1, 4):
        result = subprocess.run(
            ["adb", "exec-out", "screencap", "-p"],
            check=False,
            capture_output=True,
            timeout=30,
        )
        if result.returncode == 0 and result.stdout.startswith(b"\x89PNG\r\n\x1a\n"):
            target.write_bytes(result.stdout)
            return
        errors.append(
            f"attempt={attempt} exit={result.returncode} "
            f"stderr={result.stderr.decode(errors='replace').strip()!r} "
            f"stdout_bytes={len(result.stdout)}"
        )
        time.sleep(1)
    SCREENSHOT_FAILURES.append(name)
    (evidence / f"{name}-screenshot-error.txt").write_text("\n".join(errors) + "\n")


def snapshot(evidence: Path, name: str) -> ET.Element:
    evidence.mkdir(parents=True, exist_ok=True)
    remote = f"/data/local/tmp/{name}.xml"
    local = evidence / f"{name}.xml"
    dump_messages = []

    # Capture the screen before the hierarchy. Use adb exec-out so the PNG is
    # written directly to the runner instead of relying on a remote temp file
    # and a second adb pull, which failed on the API 35 runner.
    capture_screenshot(evidence, name)

    # Avoid --compressed while diagnosing Android API 35's null-root behavior.
    for attempt in range(1, 4):
        result = subprocess.run(
            ["adb", "shell", "uiautomator", "dump", remote],
            check=False,
            capture_output=True,
            text=True,
            timeout=45,
        )
        dump_messages.append(
            f"attempt={attempt} exit={result.returncode} "
            f"stdout={result.stdout.strip()!r} stderr={result.stderr.strip()!r}"
        )
        # Use adb's exit status for the remote file test instead of nested
        # shell quoting. `adb shell sh -c` can return no stdout on API 35 even
        # when UIAutomator reports success, making a valid dump look missing.
        remote_check = subprocess.run(
            ["adb", "shell", "test", "-s", remote],
            check=False,
            capture_output=True,
            text=True,
            timeout=15,
        )
        dump_messages.append(
            f"remote_file_check_exit={remote_check.returncode} "
            f"stderr={remote_check.stderr.strip()!r}"
        )
        if result.returncode == 0 and remote_check.returncode == 0:
            try:
                adb("pull", remote, str(local))
                return ET.parse(local).getroot()
            except (RuntimeError, ET.ParseError) as exc:
                dump_messages.append(f"pull_or_parse_error={exc}")
        time.sleep(2)

    diagnostics = {}
    for label, command in (
        ("activity", ["shell", "dumpsys", "activity", "activities"]),
        ("window", ["shell", "dumpsys", "window", "windows"]),
        ("process", ["shell", "pidof", "com.communitychatdemo"]),
        ("logcat", ["logcat", "-d", "-v", "threadtime"]),
        ("temp_listing", ["shell", "ls", "-la", "/data/local/tmp"]),
    ):
        try:
            diagnostics[label] = adb(*command, check=False)
            (evidence / f"{name}-{label}.txt").write_text(diagnostics[label])
        except Exception as exc:
            diagnostics[label] = f"diagnostic command failed: {exc}"
    raise RuntimeError(
        f"UIAutomator hierarchy dump failed for {remote}. "
        f"Attempts: {'; '.join(dump_messages)}. "
        f"Activity diagnostics: {diagnostics.get('activity', '')[-2500:]}. "
        f"Window diagnostics: {diagnostics.get('window', '')[-2500:]}. "
        f"Process: {diagnostics.get('process', '').strip()!r}"
    )


def wait_for_text(evidence: Path, name: str, target: str, timeout: int = 120) -> ET.Element:
    deadline = time.monotonic() + timeout
    last_root = None
    while time.monotonic() < deadline:
        last_root = snapshot(evidence, name)
        if any(target.casefold() in searchable(node).casefold() for node in last_root.iter()):
            return last_root
        time.sleep(2)
    # Preserve actionable failure evidence before the workflow exits. On software
    # emulation, React Native can take longer to become interactive; if it still
    # does not render, diagnostics distinguish slow startup from a blank screen or
    # native/JS runtime failure.
    labels = [searchable(node) for node in (last_root.iter() if last_root is not None else []) if searchable(node)]
    (evidence / f"{name}-visible-labels.txt").write_text("\n".join(labels) + "\n")
    for label, command in (
        ("activity", ["shell", "dumpsys", "activity", "activities"]),
        ("process", ["shell", "pidof", "com.communitychatdemo"]),
        ("logcat", ["logcat", "-d", "-v", "threadtime"]),
    ):
        try:
            output = adb(*command, check=False)
        except Exception as exc:
            output = f"diagnostic command failed: {exc}\n"
        (evidence / f"{name}-{label}.txt").write_text(output)
    raise AssertionError(
        f"UI text/content description not found: {target!r}; snapshot={name}; "
        f"visible labels={labels[:100]!r}; diagnostics saved under {evidence}"
    )


def searchable(node: ET.Element) -> str:
    return " ".join((node.attrib.get("text", ""), node.attrib.get("content-desc", ""))).strip()


def find_node(root: ET.Element, target: str) -> ET.Element:
    matches = [
        node for node in root.iter()
        if target.casefold() in searchable(node).casefold()
    ]
    if not matches:
        visible = [searchable(node) for node in root.iter() if searchable(node)]
        raise AssertionError(f"Could not find UI element {target!r}. Visible labels: {visible[:100]}")
    # Prefer the most specific matching node, usually the actual button/input.
    return min(matches, key=lambda node: len(searchable(node)))


def tap_node(root: ET.Element, target: str) -> None:
    node = find_node(root, target)
    bounds = node.attrib.get("bounds", "")
    numbers = [int(value) for value in __import__("re").findall(r"-?\d+", bounds)]
    if len(numbers) != 4:
        raise AssertionError(f"UI element {target!r} has invalid bounds: {bounds!r}")
    left, top, right, bottom = numbers
    adb("shell", "input", "tap", str((left + right) // 2), str((top + bottom) // 2))


def main() -> None:
    parser = argparse.ArgumentParser()
    parser.add_argument("--package", required=True)
    parser.add_argument("--evidence-dir", required=True)
    args = parser.parse_args()
    evidence = Path(args.evidence_dir)
    evidence.mkdir(parents=True, exist_ok=True)

    adb("shell", "am", "force-stop", args.package, check=False)
    adb("shell", "monkey", "-p", args.package, "-c", "android.intent.category.LAUNCHER", "1")
    root = wait_for_text(evidence, "01-communities", "Communities")
    assert any("Orbit Community" in searchable(node) for node in root.iter()), "Orbit Community card missing"
    print("PASS: launch and communities screen rendered")

    tap_node(root, "Orbit Community")
    root = wait_for_text(evidence, "02-chat", "Welcome in!")
    assert any("general" in searchable(node).casefold() for node in root.iter()), "General channel missing"
    print("PASS: open community and render chat")

    tap_node(root, "Write a message")
    adb("shell", "input", "text", "Emulator_test_message")
    # Re-dump after typing so the accessible Send message control is located
    # from the live hierarchy, rather than relying on fixed screen coordinates.
    root = snapshot(evidence, "03-message-draft")
    tap_node(root, "Send message")

    # Navigate away from the focused TextInput so React Native unmounts it and
    # Android closes the keyboard. Verify the send handler updated app state
    # before returning to Chat to check the rendered message text.
    tap_node(root, "Profile")
    root = wait_for_text(evidence, "04-profile-after-send", "Your Demo Profile")
    profile_labels = [searchable(node) for node in root.iter() if searchable(node)]
    assert "Messages sent" in profile_labels, "Profile message counter missing"
    assert "1" in profile_labels, "Profile did not record exactly one sent message"
    print("PASS: send handler persisted one message")

    tap_node(root, "Chat")
    root = wait_for_text(evidence, "05-chat-after-profile", "general")
    time.sleep(1)
    adb("shell", "input", "swipe", "540", "1600", "540", "1100", "350", check=False)
    root = wait_for_text(evidence, "06-message-sent", "Emulator_test_message")
    assert any("Emulator_test_message" in searchable(node) for node in root.iter()), "Sent message not visible"
    print("PASS: sent message rendered in chat")

    tap_node(root, "Profile")
    root = wait_for_text(evidence, "07-profile", "Your Demo Profile")
    assert any("Profile" in searchable(node) for node in root.iter()), "Profile screen missing"
    print("PASS: navigate to Profile screen")
    print("ANDROID_EMULATOR_UI_TEST=PASS")
    if SCREENSHOT_FAILURES:
        raise RuntimeError(
            "UI interactions passed but screenshot evidence is incomplete for: "
            + ", ".join(SCREENSHOT_FAILURES)
        )


if __name__ == "__main__":
    main()
