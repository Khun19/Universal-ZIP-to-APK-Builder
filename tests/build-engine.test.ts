import assert from "node:assert/strict";
import test from "node:test";
import { commandFor } from "../lib/build-engine/src/index.ts";

test("Flutter build engine does not silently fall back to the generic web build", () => {
  const result = commandFor({
    workspace: "/tmp/flutter-fixture",
    analysis: {
      framework: "Flutter",
      version: null,
      buildTool: "Flutter CLI",
      language: "Dart",
      packageManager: "unknown",
      projectType: "Flutter application",
      confidence: 99,
      compatibilityScore: 96,
      warnings: [],
      blockers: [],
      recommendedStrategy: "Flutter CLI",
      evidence: ["pubspec.yaml", "lib/main.dart"],
    },
    onLog: () => undefined,
  });

  assert.equal(result.command, "sh");
  assert.match(result.args[1], /dart-sdk\/bin\/dart/);
  assert.match(result.args[1], /proot-distro/);
  assert.match(result.args[1], /flutter build apk --debug/);
  assert.doesNotMatch(result.args[1], /npm install --ignore-scripts/);
});
