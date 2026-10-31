import { appendFile } from "node:fs/promises";

const MARKER = "<!-- rz-builder-command-center-auto -->";
const ISSUE_NUMBER = 24;
const TRACKED_PRS = [105, 107, 109, 103, 106, 95, 82, 110, 111];
const FRAMEWORK_WORKFLOWS = [
  ["M4 Vite PWA APK", "Ubuntu M4 Vite PWA APK Build Test"],
  ["M5 Flutter APK", "M5 Flutter Build Test"],
  ["M6 React Native direct APK", "Ubuntu M6 Build Test"],
  ["Nested Expo APK + Emulator", "Nested Expo Emulator Readiness Pilot"],
  ["Community Chat Demo Emulator", "Android Emulator Device Test"],
  ["M6 Exact APK Emulator", "M6 Exact APK Emulator Acceptance"]
];

export function classifyRun(run) {
  if (!run) return "NOT RUN";
  if (run.status !== "completed") return "BLOCKED";
  if (run.conclusion === "success") return "PASS";
  if (["failure", "timed_out"].includes(run.conclusion)) return "FAIL";
  return "BLOCKED";
}

export function classifyChecks(checkRuns = []) {
  if (!checkRuns.length) return "NOT RUN";
  const latestByName = new Map();
  for (const check of checkRuns) {
    const key = check.name || check.id;
    const previous = latestByName.get(key);
    const currentTime = Date.parse(check.started_at || check.completed_at || "1970-01-01T00:00:00Z");
    const previousTime = previous
      ? Date.parse(previous.started_at || previous.completed_at || "1970-01-01T00:00:00Z")
      : -1;
    if (!previous || currentTime >= previousTime) latestByName.set(key, check);
  }
  const latest = [...latestByName.values()];
  if (latest.some(check => ["failure", "timed_out"].includes(check.conclusion))) return "FAIL";
  if (latest.some(check => check.status !== "completed" || check.conclusion !== "success")) return "BLOCKED";
  return "PASS";
}

function latestByCreatedAt(items = []) {
  return [...items].sort((a, b) => Date.parse(b.created_at || "") - Date.parse(a.created_at || ""))[0] || null;
}

function escapeCell(value) {
  return String(value ?? "").replaceAll("|", "\\|").replaceAll("\n", " ");
}

async function github(path, token, method = "GET", body) {
  const response = await fetch(`https://api.github.com${path}`, {
    method,
    headers: {
      Accept: "application/vnd.github+json",
      Authorization: `Bearer ${token}`,
      "X-GitHub-Api-Version": "2022-11-28",
      "User-Agent": "rz-builder-command-center"
    },
    ...(body ? { body: JSON.stringify(body) } : {})
  });
  const raw = await response.text();
  if (!response.ok) throw new Error(`GitHub API ${method} ${path}: ${response.status} ${raw.slice(0, 500)}`);
  return raw ? JSON.parse(raw) : null;
}

async function fetchOpenAlerts(path, token) {
  try {
    const data = await github(path, token);
    if (!Array.isArray(data)) return { status: "BLOCKED", count: null, reason: "API returned an unexpected response" };
    return { status: data.length ? "FAIL" : "PASS", count: data.length, reason: data.length ? "Open alerts remain" : "No open alerts returned" };
  } catch (error) {
    return { status: "BLOCKED", count: null, reason: error.message.slice(0, 180) };
  }
}

async function readRegistry(repoPath, token) {
  try {
    const file = await github(`/repos/${repoPath}/contents/docs/tested-apk-registry.json?ref=main`, token);
    const decoded = Buffer.from(file.content, "base64").toString("utf8");
    const parsed = JSON.parse(decoded);
    return Array.isArray(parsed.tested_apks) ? parsed.tested_apks : [];
  } catch {
    return null;
  }
}

async function getArtifacts(repoPath, runId, token) {
  if (!runId) return [];
  try {
    const response = await github(`/repos/${repoPath}/actions/runs/${runId}/artifacts?per_page=100`, token);
    return response.artifacts || [];
  } catch {
    return [];
  }
}

async function inspectPullRequest(repoPath, pr, mainSha, token) {
  const [checkData, runData, baseRef] = await Promise.all([
    github(`/repos/${repoPath}/commits/${pr.head.sha}/check-runs?per_page=100`, token),
    github(`/repos/${repoPath}/actions/runs?head_sha=${pr.head.sha}&per_page=100`, token),
    github(`/repos/${repoPath}/git/ref/heads/${encodeURIComponent(pr.base.ref)}`, token).catch(() => null)
  ]);
  const runs = runData.workflow_runs || [];
  const workflowRows = [];
  for (const [label, workflowName] of FRAMEWORK_WORKFLOWS) {
    const run = latestByCreatedAt(runs.filter(item => item.name === workflowName));
    const status = classifyRun(run);
    const artifacts = run && status === "PASS" ? await getArtifacts(repoPath, run.id, token) : [];
    const artifactStatus = !run ? "NOT RUN" : status !== "PASS" ? status : artifacts.length ? "PASS" : "BLOCKED";
    workflowRows.push({ label, status, artifactStatus, run });
  }
  const staleMainBase = pr.base.ref === "main" && pr.base.sha !== mainSha;
  const currentBaseRefSha = baseRef?.object?.sha || null;
  return {
    number: pr.number,
    title: pr.title,
    url: pr.html_url,
    headSha: pr.head.sha,
    baseRef: pr.base.ref,
    baseSha: pr.base.sha,
    currentBaseRefSha,
    staleMainBase,
    ciStatus: classifyChecks(checkData.check_runs || []),
    workflowRows
  };
}

function renderReport({ checkedAt, mainSha, mainCi, prs, codeScanning, dependabot, registry }) {
  const lines = [
    MARKER,
    "## RZ Builder — Automated Command Center",
    "",
    `Checked at: ${checkedAt} (UTC)`,
    `Current `main` SHA: \`${mainSha}\``,
    `Main CI checks: **${mainCi}**`,
    "",
    "### Open priority PRs",
    "",
    "| PR | Exact head | Base | CI | Base alignment |",
    "|---|---|---|---|---|"
  ];
  for (const pr of prs) {
    const baseAlignment = pr.staleMainBase
      ? "BLOCKED — main moved; refresh branch"
      : pr.baseRef === "main"
        ? "CURRENT"
        : `Stacked: ${pr.baseRef} (${pr.currentBaseRefSha ? pr.currentBaseRefSha.slice(0, 7) : "ref unavailable"})`;
    lines.push(`| [#${pr.number}](${pr.url}) ${escapeCell(pr.title)} | \`${pr.headSha.slice(0, 10)}\` | ${escapeCell(pr.baseRef)} | **${pr.ciStatus}** | ${escapeCell(baseAlignment)} |`);
  }
  lines.push("", "### Framework workflow evidence", "", "| PR | Workflow | CI | Artifact metadata | Run |", "|---|---|---|---|---|");
  for (const pr of prs) {
    for (const row of pr.workflowRows) {
      const runLink = row.run ? `[run ${row.run.id}](${row.run.html_url})` : "—";
      lines.push(`| #${pr.number} | ${row.label} | **${row.status}** | ${row.artifactStatus} | ${runLink} |`);
    }
  }
  lines.push(
    "",
    "### Security inventory",
    "",
    `- Code scanning alerts: **${codeScanning.status}` + (codeScanning.count === null ? "" : ` (${codeScanning.count} open)`) + `** — ${escapeCell(codeScanning.reason)}`,
    `- Dependabot alerts: **${dependabot.status}` + (dependabot.count === null ? "" : ` (${dependabot.count} open)`) + `** — ${escapeCell(dependabot.reason)}`,
    "",
    "### Physical-device registry",
    "",
    registry === null
      ? "- Tested-APK registry: **BLOCKED** — could not read the main-branch registry."
      : `- Main-branch registry entries: ${registry.length}. This count is historical registry coverage only; it does not prove that a current PR artifact has the same APK SHA-256.`,
    "- Physical-device acceptance for a new candidate remains **NOT RUN** unless its exact APK SHA-256, source commit, and workflow run match a registry/device record.",
    "",
    "### Gate interpretation",
    "",
    "- **PASS** — the relevant exact-head workflow/check completed successfully.",
    "- **FAIL** — a required check completed with a failure conclusion or open security alerts were returned.",
    "- **BLOCKED** — a required check is pending, the base is stale, evidence is missing, or the alert API is inaccessible.",
    "- **NOT RUN** — no matching workflow/check has run.",
    "- Workflow success and artifact metadata do not by themselves prove APK provenance, Emulator acceptance, or physical-device acceptance. Exact APK SHA-256 and provenance remain separate evidence gates.",
    "",
    "This comment is generated from GitHub API data. It does not merge PRs, modify branches, or change release gates."
  );
  return lines.join("\n");
}

async function main() {
  const token = process.env.GITHUB_TOKEN;
  const repoPath = process.env.GITHUB_REPOSITORY;
  if (!token || !repoPath) throw new Error("GITHUB_TOKEN and GITHUB_REPOSITORY are required.");
  const [repo, mainCommit, openPrs] = await Promise.all([
    github(`/repos/${repoPath}`, token),
    github(`/repos/${repoPath}/commits/main`, token),
    github(`/repos/${repoPath}/pulls?state=open&per_page=100`, token)
  ]);
  const mainSha = mainCommit.sha;
  const [mainChecks, codeScanning, dependabot, registry] = await Promise.all([
    github(`/repos/${repoPath}/commits/${mainSha}/check-runs?per_page=100`, token),
    fetchOpenAlerts(`/repos/${repoPath}/code-scanning/alerts?state=open&per_page=100`, token),
    fetchOpenAlerts(`/repos/${repoPath}/dependabot/alerts?state=open&per_page=100`, token),
    readRegistry(repoPath, token)
  ]);
  const selected = openPrs.filter(pr => TRACKED_PRS.includes(pr.number));
  const prs = await Promise.all(selected.map(pr => inspectPullRequest(repoPath, pr, mainSha, token)));
  const checkedAt = new Date().toISOString();
  const report = renderReport({
    checkedAt,
    mainSha,
    mainCi: classifyChecks(mainChecks.check_runs || []),
    prs,
    codeScanning,
    dependabot,
    registry
  });
  const summaryPath = process.env.GITHUB_STEP_SUMMARY;
  if (summaryPath) await appendFile(summaryPath, report.replaceAll(MARKER, "") + "\n");
  const isPullRequest = process.env.GITHUB_EVENT_NAME === "pull_request";
  const isDefaultBranch = process.env.GITHUB_REF === `refs/heads/${repo.default_branch}`;
  if (!isPullRequest && isDefaultBranch) {
    const comments = await github(`/repos/${repoPath}/issues/${ISSUE_NUMBER}/comments?per_page=100`, token);
    const existing = comments.find(comment => comment.body?.includes(MARKER));
    if (existing) {
      await github(`/repos/${repoPath}/issues/comments/${existing.id}`, token, "PATCH", { body: report });
    } else {
      await github(`/repos/${repoPath}/issues/${ISSUE_NUMBER}/comments`, token, "POST", { body: report });
    }
  }
  console.log(report);
}

if (process.argv[1] && import.meta.url === new URL(`file://${process.argv[1]}`).href) {
  main().catch(error => {
    console.error(error);
    process.exitCode = 1;
  });
}
