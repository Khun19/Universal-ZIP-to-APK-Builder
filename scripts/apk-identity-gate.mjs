#!/usr/bin/env node
import { createHash } from "node:crypto";
import { readFile, stat, writeFile } from "node:fs/promises";

export function sha256(buffer) {
  return createHash("sha256").update(buffer).digest("hex");
}

export function evaluateCandidate({ candidateSha256, provenance, expectedCommit, expectedRunId, registry, targetBehavior, behaviorChanged }) {
  const blockers = [];
  if (!provenance || typeof provenance !== "object") blockers.push("PROVENANCE_MISSING");
  if (!candidateSha256 || !/^[a-f0-9]{64}$/i.test(candidateSha256)) blockers.push("APK_SHA256_INVALID");
  if (!provenance?.source_commit || provenance.source_commit !== expectedCommit) blockers.push("SOURCE_COMMIT_MISMATCH");
  if (!provenance?.run_id || String(provenance.run_id) !== String(expectedRunId)) blockers.push("WORKFLOW_RUN_MISMATCH");
  if (!targetBehavior || !targetBehavior.trim()) blockers.push("TARGET_BEHAVIOR_MISSING");
  if (behaviorChanged !== true) blockers.push("NO_VERIFIED_BEHAVIOR_CHANGE");
  const prior = (registry?.tested_apks ?? []).find((entry) => entry.sha256?.toLowerCase() === candidateSha256?.toLowerCase());
  if (prior) blockers.push("ALREADY_DEVICE_TESTED_IDENTICAL_APK");
  return { eligible: blockers.length === 0, blockers, priorDeviceRecord: prior ?? null };
}

export async function validateArtifact({ apkPath, provenancePath, expectedCommit, expectedRunId, registryPath }) {
  const apk = await readFile(apkPath);
  const apkStat = await stat(apkPath);
  const provenance = JSON.parse(await readFile(provenancePath, "utf8"));
  const actualSha = sha256(apk);
  const errors = [];
  if (!apkStat.size) errors.push("APK_EMPTY");
  if (provenance.source_commit !== expectedCommit) errors.push("SOURCE_COMMIT_MISMATCH");
  if (String(provenance.run_id) !== String(expectedRunId)) errors.push("WORKFLOW_RUN_MISMATCH");
  if (provenance.artifact?.sha256 !== actualSha) errors.push("APK_SHA256_MISMATCH");
  if (Number(provenance.artifact?.size_bytes) !== apkStat.size) errors.push("APK_SIZE_MISMATCH");
  if (typeof provenance.application_id !== "string" || !/^[A-Za-z][A-Za-z0-9_]*(\\.[A-Za-z][A-Za-z0-9_]*)+$/.test(provenance.application_id)) errors.push("APPLICATION_ID_MISSING_OR_INVALID");
  const registry = JSON.parse(await readFile(registryPath, "utf8"));
  const prior = (registry.tested_apks ?? []).find((entry) => entry.sha256?.toLowerCase() === actualSha.toLowerCase());
  const result = {
    valid: errors.length === 0,
    errors,
    apk: { path: apkPath, size_bytes: apkStat.size, sha256: actualSha },
    source_commit: provenance.source_commit,
    run_id: String(provenance.run_id),
    previously_device_tested: Boolean(prior),
    prior_device_record: prior ?? null,
    device_test_eligible: errors.length === 0 && !prior,
    note: prior ? "Same APK SHA-256 already has a device-test record; do not request a reinstall/retest as a new candidate." : "A new device-test request still requires a specific verified behavior change."
  };
  return result;
}

function arg(name) {
  const index = process.argv.indexOf(name);
  return index >= 0 ? process.argv[index + 1] : undefined;
}

if (process.argv[1] && new URL(import.meta.url).pathname === process.argv[1]) {
  try {
    const result = await validateArtifact({
      apkPath: arg("--apk"),
      provenancePath: arg("--provenance"),
      expectedCommit: arg("--expected-commit"),
      expectedRunId: arg("--expected-run-id"),
      registryPath: arg("--registry") ?? "docs/tested-apk-registry.json"
    });
    const output = arg("--output");
    if (output) await writeFile(output, JSON.stringify(result, null, 2) + "\n");
    console.log(JSON.stringify(result, null, 2));
    if (!result.valid) process.exitCode = 1;
  } catch (error) {
    console.error("APK_IDENTITY_GATE_FAILED:", error.message);
    process.exitCode = 1;
  }
}
