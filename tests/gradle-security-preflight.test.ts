import { test } from "node:test";
import assert from "node:assert/strict";
import * as fs from "node:fs";
import * as os from "node:os";
import * as path from "node:path";
import {
  assertGradleProjectSafe,
  inspectGradleProject,
} from "../docker/android-builder/gradle-security-preflight.mjs";

function withProject(callback: (projectRoot: string) => void) {
  const projectRoot = fs.mkdtempSync(path.join(os.tmpdir(), "rz-gradle-preflight-"));
  try {
    callback(projectRoot);
  } finally {
    fs.rmSync(projectRoot, { recursive: true, force: true });
  }
}

test("Gradle security preflight accepts normal properties and commented examples", () => {
  withProject((root) => {
    fs.writeFileSync(
      path.join(root, "gradle.properties"),
      [
        "org.gradle.jvmargs=-Xmx2048m -Dfile.encoding=UTF-8",
        "# org.gradle.daemon.registry.base=/tmp/attacker/registry",
        "! systemProp.gradle.user.home=/tmp/attacker/gradle-home",
        "",
      ].join("\n"),
    );

    assert.doesNotThrow(() => assertGradleProjectSafe(root));
    assert.deepStrictEqual(inspectGradleProject(root).findings, []);
  });
});

test("Gradle security preflight rejects project-controlled daemon registry and Gradle user-home properties", () => {
  withProject((root) => {
    fs.writeFileSync(
      path.join(root, "gradle.properties"),
      [
        "org.gradle.daemon.registry.base=/tmp/attacker/registry",
        "systemProp.gradle.user.home=/tmp/attacker/gradle-home",
        "systemProp.org.gradle.daemon.registry.base=/tmp/attacker/registry",
      ].join("\n"),
    );

    assert.throws(
      () => assertGradleProjectSafe(root),
      (error: Error) => {
        assert.match(error.message, /Gradle security preflight/);
        assert.match(error.message, /gradle\.properties/);
        assert.doesNotMatch(error.message, /attacker/);
        return true;
      },
    );
  });
});

test("Gradle security preflight does not hide a property after a continued comment", () => {
  withProject((root) => {
    fs.writeFileSync(
      path.join(root, "gradle.properties"),
      ["# ignored comment\\", "org.gradle.daemon.registry.base=/tmp/attacker/registry"].join("\n"),
    );
    assert.throws(() => assertGradleProjectSafe(root), /Gradle security preflight/);
  });
});

test("Gradle security preflight decodes escaped keys and Java-properties continuations", () => {
  withProject((root) => {
    fs.writeFileSync(
      path.join(root, "gradle.properties"),
      [
        "org.gradle.daemon.registry.\\u0062ase=/tmp/attacker/registry",
        "systemProp.gradle.user.\\",
        "  home=/tmp/attacker/gradle-home",
      ].join("\n"),
    );

    const result = inspectGradleProject(root);
    assert.equal(result.findings.length, 2);
    assert.throws(() => assertGradleProjectSafe(root), /Gradle security preflight/);
  });
});

test("Gradle security preflight rejects a shipped daemon registry in the Gradle cache tree", () => {
  withProject((root) => {
    const registryDirectory = path.join(root, ".gradle", "daemon", "8.11.1");
    fs.mkdirSync(registryDirectory, { recursive: true });
    fs.writeFileSync(path.join(registryDirectory, "registry.bin"), "untrusted-registry");

    assert.throws(
      () => assertGradleProjectSafe(root),
      /\.gradle[\\/]daemon[\\/]8\.11\.1[\\/]registry\.bin/,
    );
  });
});

test("Gradle security preflight rejects registry symlinks", () => {
  withProject((root) => {
    const outside = path.join(os.tmpdir(), `rz-gradle-preflight-outside-${process.pid}`);
    fs.writeFileSync(outside, "untrusted");
    try {
      fs.symlinkSync(outside, path.join(root, "registry.bin"));
      const result = inspectGradleProject(root);
      assert.equal(result.findings.length, 1);
      assert.match(result.findings[0].reason, /symbolic link/);
      assert.throws(() => assertGradleProjectSafe(root), /Gradle security preflight/);
    } finally {
      fs.rmSync(outside, { force: true });
    }
  });
});

test("Gradle security preflight fails closed when the project root cannot be inspected", () => {
  const missingRoot = path.join(os.tmpdir(), `rz-gradle-preflight-missing-${process.pid}`);
  assert.throws(() => assertGradleProjectSafe(missingRoot));
});
