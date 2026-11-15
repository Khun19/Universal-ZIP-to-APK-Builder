import { lstatSync, readdirSync, readFileSync } from "node:fs";
import { join, relative, resolve } from "node:path";

const FORBIDDEN_PROPERTIES = new Set([
  "org.gradle.daemon.registry.base",
  "systemprop.org.gradle.daemon.registry.base",
  "systemprop.gradle.user.home",
]);
const SKIP_DIRECTORIES = new Set([".git", "node_modules", "build", "dist", "out"]);
const MAX_ENTRIES = 100_000;
const MAX_DEPTH = 64;
const MAX_PROPERTIES_BYTES = 1024 * 1024;

function trailingBackslashes(value) {
  let count = 0;
  for (let index = value.length - 1; index >= 0 && value[index] === "\\"; index -= 1) count += 1;
  return count;
}

function logicalPropertyLines(contents) {
  const physicalLines = contents.split(/\r?\n/);
  const logicalLines = [];
  let current = "";
  let continuing = false;

  for (const physicalLine of physicalLines) {
    const line = continuing ? physicalLine.replace(/^[ \t\f]+/, "") : physicalLine;
    if (trailingBackslashes(line) % 2 === 1) {
      current += line.slice(0, -1);
      continuing = true;
      continue;
    }
    current += line;
    logicalLines.push(current);
    current = "";
    continuing = false;
  }

  if (current || continuing) logicalLines.push(current);
  return logicalLines;
}

function extractPropertyKey(line) {
  let escaped = false;
  for (let index = 0; index < line.length; index += 1) {
    const character = line[index];
    if (escaped) {
      escaped = false;
      continue;
    }
    if (character === "\\") {
      escaped = true;
      continue;
    }
    if (character === "=" || character === ":" || /\s/.test(character)) return line.slice(0, index);
  }
  return line;
}

function decodeJavaPropertyEscapes(value) {
  let decoded = "";
  for (let index = 0; index < value.length; index += 1) {
    const character = value[index];
    if (character !== "\\") {
      decoded += character;
      continue;
    }
    const next = value[index + 1];
    if (next === undefined) {
      decoded += "\\";
      continue;
    }
    if (next === "u") {
      const hex = value.slice(index + 2, index + 6);
      if (/^[0-9a-f]{4}$/i.test(hex)) {
        decoded += String.fromCharCode(Number.parseInt(hex, 16));
        index += 5;
        continue;
      }
    }
    decoded += next;
    index += 1;
  }
  return decoded;
}

function inspectPropertiesFile(filePath, projectRoot) {
  const fileStat = lstatSync(filePath);
  if (fileStat.size > MAX_PROPERTIES_BYTES) {
    throw new Error(`Gradle security preflight could not safely inspect ${relative(projectRoot, filePath)}: properties file exceeds the ${MAX_PROPERTIES_BYTES}-byte safety limit.`);
  }

  const contents = readFileSync(filePath, "utf8");
  const findings = [];
  for (const logicalLine of logicalPropertyLines(contents)) {
    const uncommented = logicalLine.replace(/^\uFEFF/, "").trimStart();
    if (!uncommented || uncommented.startsWith("#") || uncommented.startsWith("!")) continue;

    const decodedLine = decodeJavaPropertyEscapes(uncommented).toLowerCase();
    const propertyKey = decodeJavaPropertyEscapes(extractPropertyKey(uncommented)).trim().toLowerCase();
    const suspicious = FORBIDDEN_PROPERTIES.has(propertyKey) ||
      decodedLine.includes("org.gradle.daemon.registry.base") ||
      decodedLine.includes("systemprop.gradle.user.home");

    if (suspicious) {
      findings.push({
        path: relative(projectRoot, filePath),
        reason: "contains a project-controlled Gradle daemon registry or Gradle user-home setting",
      });
    }
  }
  return findings;
}

/**
 * Inspect an extracted, untrusted project before invoking Gradle or Flutter's
 * Android build. This does not upgrade or alter the pinned M6 toolchain.
 */
export function inspectGradleProject(projectRoot) {
  const root = resolve(projectRoot);
  const rootStat = lstatSync(root);
  if (rootStat.isSymbolicLink() || !rootStat.isDirectory()) {
    throw new Error("Gradle security preflight requires a real project directory.");
  }

  const findings = [];
  const pending = [{ directory: root, depth: 0 }];
  let visitedEntries = 0;

  while (pending.length > 0) {
    const current = pending.pop();
    if (!current) continue;
    if (current.depth > MAX_DEPTH) {
      throw new Error(`Gradle security preflight exceeded the maximum directory depth (${MAX_DEPTH}).`);
    }

    const entries = readdirSync(current.directory, { withFileTypes: true });
    for (const entry of entries) {
      visitedEntries += 1;
      if (visitedEntries > MAX_ENTRIES) {
        throw new Error(`Gradle security preflight exceeded the maximum entry count (${MAX_ENTRIES}).`);
      }

      const target = join(current.directory, entry.name);
      const name = entry.name.toLowerCase();

      if (entry.isSymbolicLink()) {
        if (name === "registry.bin" || name === "gradle.properties") {
          findings.push({
            path: relative(root, target),
            reason: "is a symbolic link and cannot be trusted as a Gradle security input",
          });
        }
        continue;
      }

      if (entry.isDirectory()) {
        if (!SKIP_DIRECTORIES.has(name)) pending.push({ directory: target, depth: current.depth + 1 });
        continue;
      }

      if (!entry.isFile()) continue;
      if (name === "registry.bin") {
        findings.push({
          path: relative(root, target),
          reason: "contains a project-shipped Gradle daemon registry",
        });
      } else if (name === "gradle.properties") {
        findings.push(...inspectPropertiesFile(target, root));
      }
    }
  }

  return { projectRoot: root, findings };
}

export function assertGradleProjectSafe(projectRoot) {
  const { findings } = inspectGradleProject(projectRoot);
  if (findings.length === 0) return;

  const summary = findings.map((finding) => `${finding.path}: ${finding.reason}`).join("; ");
  throw new Error(
    `[Gradle security preflight] Build blocked before Gradle execution: ${summary}. Remove project-controlled daemon registry settings and registry.bin files from the uploaded project.`,
  );
}
