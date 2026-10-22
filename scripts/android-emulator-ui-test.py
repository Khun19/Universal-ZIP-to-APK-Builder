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


def snapshot(evidence: Path, name: str) -> ET.Element:
    evidence.mkdir(parents=True, exist_ok=True)
    remote = f"/sdcard/{name}.xml"
    local = evidence / f"{name}.xml"
    dump_messages = []
    # UIAutomator can report a transient empty hierarchy while the first
    # activity frame is starting. Retry only the snapshot operation, and
    # verify the remote file exists before attempting to pull it.
    for attempt in range(1, 4):
        result = subprocess.run(
            ["adb", "shell", "uiautomator", "dump", "--compressed", remote],
            check=False,
            capture_output=True,
            text=True,
            timeout=45,
        )
        dump_messages.append(
            f"attempt={attempt} exit={result.returncode} "
            f"stdout={result.stdout.strip()!r} stderr={result.stderr.strip()!r}"
        )
        present = adb(
            "shell", "sh", "-c", f"test -s {remote} && echo PRESENT", check=False
        )
        if result.returncode == 0 and "PRESENT" in present:
            try:
                adb("pull", remote, str(local))
                break
            except RuntimeError as exc:
                dump_messages.append(str(exc))
        time.sleep(2)
    else:
        diagnostic = adb("shell", "ls", "-la", "/sdcard", check=False)
        raise RuntimeError(
            f"UIAutomator hierarchy dump failed for {remote}. "
            f"Attempts: {'; '.join(dump_messages)}. "
            f"/sdcard listing: {diagnostic[-4000:]}"
        )
    adb("shell", "screencap", "-p", f"/sdcard/{name}.png")
    adb("pull", f"/sdcard/{name}.png", str(evidence / f"{name}.png"))
    return ET.parse(local).getroot()


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
    root = wait_for_text(evidence, "04-message-sent", "Emulator_test_message")
    assert any("Emulator_test_message" in searchable(node) for node in root.iter()), "Sent message not visible"
    print("PASS: type and send a local chat message")

    tap_node(root, "Profile")
    root = wait_for_text(evidence, "05-profile", "Your Demo Profile")
    assert any("Profile" in searchable(node) for node in root.iter()), "Profile screen missing"
    print("PASS: navigate to Profile screen")
    print("ANDROID_EMULATOR_UI_TEST=PASS")


if __name__ == "__main__":
    main()
