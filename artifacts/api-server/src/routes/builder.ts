import { Router } from "express";
import { randomUUID } from "node:crypto";
import { mkdir, readFile, stat, writeFile } from "node:fs/promises";
import { execFile } from "node:child_process";
import { promisify } from "node:util";
import path from "node:path";
import multer from "multer";
import { analyzeProject } from "@workspace/analyzer";
import { safeExtract, validateApk } from "@workspace/security";
import type { BuildRecord, ProjectAnalysis, ProjectRecord } from "@workspace/shared";

const router = Router();
const upload = multer({ storage: multer.memoryStorage(), limits: { fileSize: 250 * 1024 * 1024, files: 1 } });
const exec = promisify(execFile);
const root = path.resolve(process.env.BUILDER_STORAGE_DIR ?? "/tmp/universal-zip-to-apk");
const projects = new Map<string, ProjectRecord>();
const analyses = new Map<string, ProjectAnalysis>();
const builds = new Map<string, BuildRecord>();
const projectFiles = new Map<string, string>();
const artifacts = new Map<string, { path: string; sha256: string; size: number; applicationId: string | null }>();
const now = () => new Date().toISOString();
const project = (id: string) => projects.get(id);
async function runQueuedBuild(job: BuildRecord, analysis: ProjectAnalysis): Promise<void> {
  const source = path.join(root, job.projectId, "source");
  const output = path.join(root, job.id, "output");
  job.status = "PREPARING"; job.progress = 10; job.logs.push("Preparing isolated Android builder workspace.");
  try {
    await mkdir(output, { recursive: true });
    if (process.env.BUILD_EXECUTOR !== "docker") throw new Error("Android worker is not configured. Set BUILD_EXECUTOR=docker and start the android-builder image.");
    job.status = "BUILDING"; job.progress = 25; job.logs.push(`Selected strategy: ${analysis.recommendedStrategy}`);
    const args = ["run", "--rm", "--network=none", "--cpus=2", "--memory=4g", "--pids-limit=512", "--read-only", "--tmpfs", "/tmp:rw,noexec,nosuid,size=2g", "-v", `${source}:/workspace:rw`, "-v", `${output}:/output:rw`, process.env.ANDROID_BUILDER_IMAGE ?? "universal-zip-to-apk/android-builder:latest"];
    const child = exec("docker", args, { timeout: Number(process.env.BUILD_TIMEOUT_MS ?? 900000), maxBuffer: 8 * 1024 * 1024 });
    const result = await child;
    job.logs.push(result.stdout, result.stderr);
    job.status = "VALIDATING"; job.progress = 85; job.logs.push("Build process exited successfully; validating APK structure.");
    const candidates = [path.join(output, "app-debug.apk"), path.join(source, "app", "build", "outputs", "apk", "debug", "app-debug.apk")];
    let apk: string | undefined;
    for (const candidate of candidates) { try { await stat(candidate); apk = candidate; break; } catch {} }
    if (!apk) throw new Error("Builder completed without producing a debug APK");
    const checked = await validateApk(apk);
    const artifactId = randomUUID(); artifacts.set(artifactId, { path: apk, ...checked }); job.artifactId = artifactId; job.status = "SUCCESS"; job.progress = 100; job.logs.push(`Validated APK ${checked.size} bytes, SHA-256 ${checked.sha256}.`);
  } catch (error) { job.status = "FAILED"; job.progress = 100; job.error = error instanceof Error ? error.message : "Build failed"; job.logs.push(`Build failed: ${job.error}`); }
}

router.get("/projects", (_req, res) => res.json([...projects.values()].sort((a, b) => b.createdAt.localeCompare(a.createdAt))));
router.post("/projects", (req, res) => {
  const name = typeof req.body?.name === "string" ? req.body.name.trim().slice(0, 120) : "";
  if (!name) return res.status(400).json({ error: "name is required" });
  const item: ProjectRecord = { id: randomUUID(), name, fileSize: 0, uploadStatus: "PENDING", analysisStatus: "PENDING", createdAt: now() };
  projects.set(item.id, item); return res.status(201).json(item);
});
router.get("/projects/:id", (req, res) => { const item = project(req.params.id); return item ? res.json(item) : res.status(404).json({ error: "Project not found" }); });
router.get("/projects/:id/analysis", (req, res) => { const item = analyses.get(req.params.id); return item ? res.json({ projectId: req.params.id, ...item }) : res.status(404).json({ error: "Analysis not found" }); });
router.post("/projects/:id/upload", upload.single("file"), async (req, res) => {
  const projectId = String(req.params.id);
  const item = project(projectId); if (!item) return res.status(404).json({ error: "Project not found" });
  const file = req.file; if (!file) return res.status(400).json({ error: "A ZIP file field named file is required" });
  if (!file.originalname.toLowerCase().endsWith(".zip")) return res.status(415).json({ error: "Only ZIP archives are accepted" });
  try { await mkdir(path.join(root, item.id), { recursive: true }); const target = path.join(root, item.id, "source.zip"); await writeFile(target, file.buffer, { flag: "wx" }); item.fileSize = file.size; item.uploadStatus = "UPLOADED"; projectFiles.set(item.id, target); return res.json(item); }
  catch (error) { item.uploadStatus = "REJECTED"; return res.status(400).json({ error: error instanceof Error ? error.message : "Upload rejected" }); }
});
router.post("/projects/:id/analyze", async (req, res) => {
  const item = project(req.params.id); const archive = projectFiles.get(req.params.id);
  if (!item || !archive) return res.status(404).json({ error: "Uploaded project not found" });
  try { const destination = path.join(root, item.id, "source"); const files = await safeExtract(archive, destination); let packageJson: Record<string, unknown> | undefined; try { packageJson = JSON.parse(await readFile(path.join(destination, "package.json"), "utf8")); } catch {}
    const result = analyzeProject({ files, packageJson }); analyses.set(item.id, result); item.analysisStatus = "COMPLETE"; return res.json({ projectId: item.id, ...result });
  } catch (error) { item.analysisStatus = "FAILED"; return res.status(422).json({ error: error instanceof Error ? error.message : "Analysis failed" }); }
});
router.post("/projects/:id/build", (req, res) => {
  const item = project(req.params.id); const analysis = analyses.get(req.params.id);
  if (!item || !analysis) return res.status(404).json({ error: "Project analysis required" });
  if (analysis.blockers.length) return res.status(409).json({ error: "Project is not compatible", blockers: analysis.blockers });
  const job: BuildRecord = { id: randomUUID(), projectId: item.id, status: "QUEUED", progress: 0, logs: ["Build queued for an isolated Android worker."], error: null, artifactId: null, createdAt: now() };
  builds.set(job.id, job); void runQueuedBuild(job, analysis); return res.status(202).json(job);
});
router.get("/builds/:id", (req, res) => { const job = builds.get(req.params.id); return job ? res.json(job) : res.status(404).json({ error: "Build not found" }); });
router.get("/builds/:id/logs", (req, res) => { const job = builds.get(req.params.id); return job ? res.json({ logs: job.logs }) : res.status(404).json({ error: "Build not found" }); });
router.get("/artifacts/:id/download", async (req, res) => { const artifact = artifacts.get(req.params.id); if (!artifact) return res.status(404).json({ error: "Artifact not found" }); res.setHeader("Content-Type", "application/vnd.android.package-archive"); res.setHeader("Content-Disposition", `attachment; filename="${req.params.id}.apk"`); return res.sendFile(artifact.path); });
export default router;