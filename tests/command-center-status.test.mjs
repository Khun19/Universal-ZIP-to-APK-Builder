import test from "node:test";
import assert from "node:assert/strict";
import { classifyRun, classifyChecks } from "../scripts/ci/command-center-status.mjs";

test("missing workflow run is NOT RUN", () => {
  assert.equal(classifyRun(null), "NOT RUN");
});

test("running workflow is BLOCKED, not PASS", () => {
  assert.equal(classifyRun({ status: "in_progress", conclusion: null }), "BLOCKED");
});

test("successful completed workflow is PASS", () => {
  assert.equal(classifyRun({ status: "completed", conclusion: "success" }), "PASS");
});

test("failed completed workflow is FAIL", () => {
  assert.equal(classifyRun({ status: "completed", conclusion: "failure" }), "FAIL");
});

test("cancelled workflow is BLOCKED rather than silently passed", () => {
  assert.equal(classifyRun({ status: "completed", conclusion: "cancelled" }), "BLOCKED");
});

test("no check runs is NOT RUN", () => {
  assert.equal(classifyChecks([]), "NOT RUN");
});

test("a pending check blocks the combined result", () => {
  assert.equal(classifyChecks([{ name: "CI", status: "in_progress", conclusion: null }]), "BLOCKED");
});

test("any latest failed check makes the combined result FAIL", () => {
  assert.equal(classifyChecks([
    { name: "Unit", status: "completed", conclusion: "success", started_at: "2026-01-01T00:00:00Z" },
    { name: "CodeQL", status: "completed", conclusion: "failure", started_at: "2026-01-01T00:01:00Z" }
  ]), "FAIL");
});

test("all latest completed successful checks produce PASS", () => {
  assert.equal(classifyChecks([
    { name: "Unit", status: "completed", conclusion: "success", started_at: "2026-01-01T00:00:00Z" },
    { name: "CodeQL", status: "completed", conclusion: "success", started_at: "2026-01-01T00:01:00Z" }
  ]), "PASS");
});

test("an older failure is ignored when a newer check with the same name passed", () => {
  assert.equal(classifyChecks([
    { name: "Unit", status: "completed", conclusion: "failure", started_at: "2026-01-01T00:00:00Z" },
    { name: "Unit", status: "completed", conclusion: "success", started_at: "2026-01-01T00:02:00Z" }
  ]), "PASS");
});
