import { Router } from "express";
import { mkdir, readFile, writeFile } from "node:fs/promises";
import path from "node:path";
import multer from "multer";
import { analyzeProject } from "@workspace/analyzer";
import { buildQueue } from "@workspace/build-queue";
import { getAnalysis, getArtifact, getBuild, getBuildLogs, getProject, getProjectSourcePath, listProjects, markAnalysisStatus, saveAnalysis, saveUpload, createBuild as persistBuild } from "@workspace/db/repository";
import { safeExtract } from "@workspace/security";

const router = Router();
const upload = multer({ storage: multer.memoryStorage(), limits: { fileSize: Number(process.env.MAX_UPLOAD_BYTES ?? 250 * 1024 * 1024), files: 1 } });
const root = path.resolve(process.env.BUILDER_STORAGE_DIR ?? "/tmp/universal-zip-to-apk");
const id = (value: string | string[]) => String(value);

router.get("/projects", async (_req, res, next) => { try { res.json(await listProjects()); } catch (error) { next(error); } });
router.post("/projects", async (req, res, next) => {
  const name = typeof req.body?.name === "string" ? req.body.name.trim().slice(0, 120) : "";
  if (!name) return res.status(400).json({ error: "name is required" });
  try { return res.status(201).json(await persistProject(name)); } catch (error) { return next(error); }
});
router.get("/projects/:id", async (req, res, next) => { try { const item = await getProject(id(req.params.id)); return item ? res.json(item) : res.status(404).json({ error: "Project not found" }); } catch (error) { return next(error); } });
router.get("/projects/:id/analysis", async (req, res, next) => { try { const item = await getAnalysis(id(req.params.id)); return item ? res.json(item) : res.status(404).json({ error: "Analysis not found" }); } catch (error) { return next(error); } });

router.post("/projects/:id/upload", upload.single("file"), async (req, res, next) => {
  const projectId = id(req.params.id);
  try {
    const item = await getProject(projectId);
    if (!item) return res.status(404).json({ error: "Project not found" });
    const file = req.file;
    if (!file) return res.status(400).json({ error: "A ZIP file field named file is required" });
    if (!file.originalname.toLowerCase().endsWith(".zip")) return res.status(415).json({ error: "Only ZIP archives are accepted" });
    const projectRoot = path.join(root, projectId);
    await mkdir(projectRoot, { recursive: true });
    const target = path.join(projectRoot, "source.zip");
    await writeFile(target, file.buffer, { flag: "w" });
    res.json(await saveUpload(projectId, file.size, target));
  } catch (error) { return next(error); }
});

router.post("/projects/:id/analyze", async (req, res, next) => {
  const projectId = id(req.params.id);
  try {
    const item = await getProject(projectId);
    const archive = await getProjectSourcePath(projectId);
    if (!item || !archive) return res.status(404).json({ error: "Uploaded project not found" });
    const destination = path.join(root, projectId, "source");
    const files = await safeExtract(archive, destination);
    let packageJson: Record<string, unknown> | undefined;
    try { packageJson = JSON.parse(await readFile(path.join(destination, "package.json"), "utf8")); } catch {}
    const result = analyzeProject({ files, packageJson });
    await saveAnalysis(projectId, result);
    await markAnalysisStatus(projectId, "COMPLETE");
    res.json({ projectId, ...result });
  } catch (error) { await markAnalysisStatus(projectId, "FAILED").catch(() => undefined); return next(error); }
});

router.post("/projects/:id/build", async (req, res, next) => {
  const projectId = id(req.params.id);
  try {
    const item = await getProject(projectId);
    const analysis = await getAnalysis(projectId);
    const projectPath = path.join(root, projectId, "source");
    if (!item || !analysis) return res.status(404).json({ error: "Project analysis required" });
    if (analysis.blockers.length) return res.status(409).json({ error: "Project is not compatible", blockers: analysis.blockers });
    const job = await persistBuild(projectId);
    const queue = buildQueue();
    await queue.add(job.id, { projectId, buildId: job.id, projectPath, projectType: analysis.projectType, strategy: analysis.recommendedStrategy });
    await queue.close();
    res.status(202).json(job);
  } catch (error) { return next(error); }
});

router.get("/builds/:id", async (req, res, next) => { try { const job = await getBuild(id(req.params.id)); return job ? res.json(job) : res.status(404).json({ error: "Build not found" }); } catch (error) { return next(error); } });
router.get("/builds/:id/logs", async (req, res, next) => { try { return res.json({ logs: await getBuildLogs(id(req.params.id)) }); } catch (error) { return next(error); } });
router.get("/artifacts/:id/download", async (req, res, next) => {
  try {
    const artifact = await getArtifact(id(req.params.id));
    if (!artifact) return res.status(404).json({ error: "Artifact not found" });
    res.setHeader("Content-Type", "application/vnd.android.package-archive");
    res.setHeader("Content-Disposition", `attachment; filename="${artifact.filename.replace(/[^A-Za-z0-9._-]/g, "_")}"`);
    res.sendFile(path.resolve(artifact.file_path), { dotfiles: "deny" });
  } catch (error) { return next(error); }
});

async function persistProject(name: string) {
  const { createProject } = await import("@workspace/db/repository");
  return createProject(name);
}
export default router;