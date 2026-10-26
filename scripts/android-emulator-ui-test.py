#!/usr/bin/env python3
"""Android Emulator smoke test for Builder-produced APKs.

Uses Android's built-in UIAutomator hierarchy and adb input so the test does not
need app-specific instrumentation dependencies. Fails closed when expected UI
elements are missing.
"""
from __future__ import annotations

import argparse
import re
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


SCREENSHOT_FAILURES: set[str] = set()


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
            SCREENSHOT_FAILURES.discard(name)
            (evidence / f"{name}-screenshot-error.txt").unlink(missing_ok=True)
            return
        errors.append(
            f"attempt={attempt} exit={result.returncode} "
            f"stderr={result.stderr.decode(errors='replace').strip()!r} "
            f"stdout_bytes={len(result.stdout)}"
        )
        time.sleep(1)
    SCREENSHOT_FAILURES.add(name)
    (evidence / f"{name}-screenshot-error.txt").write_text("\n".join(errors) + "\n")


def snapshot(evidence: Path, name: str) -> ET.Element:
    evidence.mkdir(parents=True, exist_ok=True)
    remote = f"/data/local/tmp/{name}.xml"
    local = evidence / f"{name}.xml"
    dump_messages = []

    # Keep an early screenshot for failure diagnostics, then refresh it after
    # a valid hierarchy is pulled so the retained PNG reflects the same stable UI
    # state as the XML instead of a frame captured during a screen transition.
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
                root = ET.parse(local).getroot()
                # Refresh after the hierarchy is valid. If this capture fails,
                # capture_screenshot records the failure and the final gate fails closed.
                capture_screenshot(evidence, name)
                return root
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


def assert_profile_counter(root: ET.Element, label: str, expected_value: str) -> ET.Element:
    """Require the exact numeric TextView paired with a profile-stat label."""
    label_nodes = [
        node for node in root.iter()
        if node.attrib.get("class") == "android.widget.TextView"
        and node.attrib.get("text", "").strip() == label
    ]
    if len(label_nodes) != 1:
        raise AssertionError(
            f"Expected one exact Profile counter label {label!r}, found {len(label_nodes)}"
        )

    label_node = label_nodes[0]
    parent_by_node = {
        child: parent for parent in root.iter() for child in parent
    }
    row = parent_by_node.get(label_node)
    if row is None:
        raise AssertionError(f"Profile counter label {label!r} has no UI row parent")

    row_text_nodes = [
        node for node in row
        if node.attrib.get("class") == "android.widget.TextView"
    ]
    numeric_nodes = [
        node for node in row_text_nodes
        if re.fullmatch(r"\d+", node.attrib.get("text", "").strip())
    ]
    label_bounds = node_bounds(label_node)
    if label_bounds is None:
        raise AssertionError(
            f"Profile counter label {label!r} has invalid UI bounds: "
            f"{label_node.attrib.get('bounds', '')!r}"
        )
    aligned_values = []
    for node in numeric_nodes:
        value_bounds = node_bounds(node)
        if value_bounds is None:
            continue
        vertical_overlap = min(label_bounds[3], value_bounds[3]) - max(
            label_bounds[1], value_bounds[1]
        )
        shorter_node_height = min(
            label_bounds[3] - label_bounds[1],
            value_bounds[3] - value_bounds[1],
        )
        if vertical_overlap > 0 and vertical_overlap * 2 >= shorter_node_height:
            aligned_values.append(node)
    observed_values = [node.attrib.get("text", "").strip() for node in numeric_nodes]
    aligned_text = [node.attrib.get("text", "").strip() for node in aligned_values]
    if len(aligned_values) != 1 or aligned_text[0] != expected_value:
        raise AssertionError(
            f"Profile counter {label!r} expected exact value {expected_value!r} "
            f"in its vertically aligned sibling TextView; "
            f"aligned row values={aligned_text!r}, sibling numeric values={observed_values!r}"
        )
    return aligned_values[0]


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


def node_bounds(node: ET.Element) -> tuple[int, int, int, int] | None:
    numbers = [int(value) for value in __import__("re").findall(r"-?\d+", node.attrib.get("bounds", ""))]
    if len(numbers) != 4:
        return None
    left, top, right, bottom = numbers
    if right <= left or bottom <= top:
        return None
    return left, top, right, bottom


def vertical_scroll_view(root: ET.Element) -> ET.Element:
    candidates = [
        node for node in root.iter()
        if node.attrib.get("class") == "android.widget.ScrollView"
        and node.attrib.get("scrollable") == "true"
    ]
    if len(candidates) != 1:
        raise AssertionError(
            f"Expected one vertical chat ScrollView, found {len(candidates)}"
        )
    return candidates[0]


def target_visible_in_scroll_view(root: ET.Element, target: str) -> bool:
    try:
        node = find_node(root, target)
        viewport_node = vertical_scroll_view(root)
    except AssertionError:
        return False
    rect = node_bounds(node)
    viewport = node_bounds(viewport_node)
    if rect is None or viewport is None:
        return False
    left, top, right, bottom = rect
    view_left, view_top, view_right, view_bottom = viewport
    # Require the complete text node to be inside the scroll viewport with
    # a small margin. Mere intersection allowed a composer-overlapped message
    # to pass while the screenshot showed only a clipped portion of the text.
    margin = 16
    return (
        left >= view_left + margin
        and top >= view_top + margin
        and right <= view_right - margin
        and bottom <= view_bottom - margin
    )


def scroll_until_visible(
    evidence: Path, name: str, target: str, timeout: int = 45
) -> ET.Element:
    """Scroll the actual vertical chat viewport until the target is on-screen.

    A UIAutomator node can exist in the hierarchy while its bounds are clipped or
    outside the viewport. Treating that as visible produced false-positive tests
    and screenshots that did not show the sent message.
    """
    deadline = time.monotonic() + timeout
    last_root: ET.Element | None = None
    while time.monotonic() < deadline:
        last_root = snapshot(evidence, name)
        if target_visible_in_scroll_view(last_root, target):
            # Confirm the same text remains in the viewport after a settling delay;
            # this second snapshot overwrites the PNG/XML evidence with the stable state.
            time.sleep(0.75)
            confirmed = snapshot(evidence, name)
            if target_visible_in_scroll_view(confirmed, target):
                return confirmed
            last_root = confirmed

        viewport_node = vertical_scroll_view(last_root)
        viewport = node_bounds(viewport_node)
        if viewport is None:
            raise AssertionError(
                f"Vertical chat ScrollView has invalid bounds: {viewport_node.attrib.get('bounds')!r}"
            )
        left, top, right, bottom = viewport
        if bottom - top < 50:
            raise AssertionError(f"Vertical chat ScrollView is too small to scroll: {viewport!r}")
        x = (left + right) // 2
        try:
            target_rect = node_bounds(find_node(last_root, target))
        except AssertionError:
            target_rect = None

        if target_rect is None:
            # The target may be outside the hierarchy viewport or have invalid
            # off-screen bounds; use a full swipe to bring later messages upward.
            start_y, end_y = bottom - 20, top + 20
        else:
            target_center = (target_rect[1] + target_rect[3]) // 2
            viewport_center = (top + bottom) // 2
            delta = target_center - viewport_center
            max_distance = bottom - top - 40
            if delta > 0:
                # Finger moves up; message content moves up toward the viewport center.
                distance = min(delta, max_distance)
                start_y, end_y = bottom - 20, max(top + 20, bottom - 20 - distance)
            elif delta < 0:
                # Finger moves down; recover if the target has been scrolled too high.
                distance = min(-delta, max_distance)
                start_y, end_y = top + 20, min(bottom - 20, top + 20 + distance)
            else:
                start_y, end_y = bottom - 20, top + 20

        if start_y == end_y:
            raise AssertionError(f"Cannot scroll chat viewport to reveal {target!r}")
        adb(
            "shell", "input", "swipe",
            str(x), str(start_y), str(x), str(end_y), "350",
        )
        time.sleep(0.75)

    raise AssertionError(
        f"UI text {target!r} never became visible inside the chat ScrollView; "
        f"last snapshot={name}; see {evidence} for XML, screenshots and diagnostics"
    )


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
    counter_node = assert_profile_counter(root, "Messages sent", "1")
    print(
        "PASS: Profile counter row has exact value "
        f"{counter_node.attrib.get('text', '').strip()!r}"
    )
    print("PASS: send handler persisted one message")

    tap_node(root, "Chat")
    root = wait_for_text(evidence, "05-chat-after-profile", "general")
    # Scroll inside the chat message list, not the bottom navigation/composer.
    # A matching UIAutomator node outside the viewport is not visual acceptance.
    root = scroll_until_visible(evidence, "06-message-sent", "Emulator_test_message")
    assert any("Emulator_test_message" in searchable(node) for node in root.iter()), "Sent message not visible"
    print("PASS: sent message rendered in chat")

    tap_node(root, "Profile")
    root = wait_for_text(evidence, "07-profile", "Your Demo Profile")
    assert any("Profile" in searchable(node) for node in root.iter()), "Profile screen missing"
    print("PASS: navigate to Profile screen")
    if SCREENSHOT_FAILURES:
        raise RuntimeError(
            "UI interactions passed but screenshot evidence is incomplete for: "
            + ", ".join(sorted(SCREENSHOT_FAILURES))
        )
    print("ANDROID_EMULATOR_UI_TEST=PASS")


if __name__ == "__main__":
    main()
