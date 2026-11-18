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

test("Gradle security preflight ignores injection-looking TOML comments and accepts a local catalog import", () => {
  withProject((root) => {
    const catalogDirectory = path.join(root, "custom", "catalogs");
    fs.mkdirSync(catalogDirectory, { recursive: true });
    fs.writeFileSync(
      path.join(catalogDirectory, "custom.versions.toml"),
      [
        "# comment containing */ and \\u0061 is not a catalog value",
        "[versions]",
        'safe = "1.2.3"',
      ].join("\n"),
    );
    fs.writeFileSync(
      path.join(root, "settings.gradle"),
      [
        "// comment containing */ and \\u0061 is ignored",
        "dependencyResolutionManagement {",
        "  versionCatalogs {",
        '    create("libs") { from(files("custom/catalogs/custom.versions.toml")) }',
        "  }",
        "}",
      ].join("\n"),
    );

    assert.doesNotThrow(() => assertGradleProjectSafe(root));
    assert.deepStrictEqual(inspectGradleProject(root).findings, []);
  });
});

test("Gradle security preflight rejects unsafe inline version-catalog values in settings scripts", () => {
  withProject((root) => {
    fs.writeFileSync(
      path.join(root, "settings.gradle.kts"),
      [
        "dependencyResolutionManagement {",
        "  versionCatalogs {",
        '    create("libs") { version("bad", "1.0*/payload") }',
        "  }",
        "}",
      ].join("\n"),
    );
    assert.throws(() => assertGradleProjectSafe(root), /Gradle security preflight/);
  });
});

test("Gradle security preflight rejects remote and dynamically resolved version-catalog imports", () => {
  withProject((root) => {
    fs.writeFileSync(
      path.join(root, "settings.gradle"),
      [
        "dependencyResolutionManagement {",
        "  versionCatalogs {",
        '    create("libs") { from("com.example:catalog:1.+") }',
        "  }",
        "}",
      ].join("\n"),
    );
    assert.throws(() => assertGradleProjectSafe(root), /Gradle security preflight/);
  });
});

test("Gradle security preflight rejects local catalog paths that escape the extracted project", () => {
  withProject((root) => {
    fs.writeFileSync(
      path.join(root, "settings.gradle"),
      [
        "dependencyResolutionManagement {",
        "  versionCatalogs {",
        '    create("libs") { from(files("../outside.versions.toml")) }',
        "  }",
        "}",
      ].join("\n"),
    );
    assert.throws(() => assertGradleProjectSafe(root), /Gradle security preflight/);
  });
});

test("Gradle security preflight rejects code-injection sequences in nested TOML version catalogs", () => {
  withProject((root) => {
    const catalogDirectory = path.join(root, "gradle");
    fs.mkdirSync(catalogDirectory, { recursive: true });
    fs.writeFileSync(
      path.join(catalogDirectory, "libs.versions.toml"),
      [
        "[versions]",
        'malicious-version = "1.0*/payload"',
        'malicious-alias = "\\u0061"',
      ].join("\n"),
    );

    const result = inspectGradleProject(root);
    assert.equal(result.findings.length, 1);
    assert.equal(result.findings[0].path, path.join("gradle", "libs.versions.toml"));
    assert.match(result.findings[0].reason, /version-catalog code-injection/);
    assert.throws(() => assertGradleProjectSafe(root), /Gradle security preflight/);
  });
});

test("Gradle security preflight fails closed when the project root cannot be inspected", () => {
  const missingRoot = path.join(os.tmpdir(), `rz-gradle-preflight-missing-${process.pid}`);
  assert.throws(() => assertGradleProjectSafe(missingRoot));
});
