import { Worker } from "bullmq";
import { mkdir, readdir, stat } from "node:fs/promises";
import { spawn } from "node:child_process";
import path from "node:path";
import { buildQueue, BUILD_QUEUE_NAME, redisConnection, type BuildJobPayload } from "@workspace/build-queue";
import { appendBuildLog, createArtifact, getBuild, updateBuild } from "@workspace/db/repository";
import { validateApk } from "@workspace/security";

const image = process.env.ANDROID_BUILDER_IMAGE ?? "universal-zip-to-apk/android-builder:latest";
const timeoutMs = Number(process.env.BUILD_TIMEOUT_MS ?? 900000);
const outputRoot = path.resolve(process.env.BUILDER_STORAGE_DIR ?? "/tmp/universal-zip-to-apk");

function runDocker(payload: BuildJobPayload, outputPath: string): Promise<void> {
  const mode = payload.projectType === "Web application" ? "web" : "native";
  const network = process.env.BUILD_NETWORK ?? (mode === "web" ? "bridge" : "none");
  const args = ["run", "--rm", "--network", network, "--cpus", "2", "--memory", "4g", "--pids-limit", "512", "--tmpfs", "/tmp:rw,noexec,nosuid,size=2g", "--user", "10001:10001", "-e", `BUILD_MODE=${mode}`, "-v", `${payload.projectPath}:/workspace:rw`, "-v", `${outputPath}:/output:rw`, image];
  return new Promise((resolve, reject) => {
    const child = spawn("docker", args, { stdio: ["ignore", "pipe", "pipe"], env: { ...process.env, DOCKER_BUILDKIT: "1" } });
    const timer = setTimeout(() => { child.kill("SIGKILL"); reject(new Error(`Docker build exceeded ${timeoutMs}ms`)); }, timeoutMs);
    const write = (chunk: Buffer) => { const text = chunk.toString(); void appendBuildLog(payload.buildId, text); process.stdout.write(text); };
    child.stdout.on("data", write);
    child.stderr.on("data", write);
    child.on("error", (error) => { clearTimeout(timer); reject(error); });
    child.on("exit", (code) => { clearTimeout(timer); code === 0 ? resolve() : reject(new Error(`Android builder exited with code ${code}`)); });
  });
}

async function findApks(directory: string): Promise<string[]> {
  const entries = await readdir(directory, { withFileTypes: true });
  const result: string[] = [];
  for (const entry of entries) {
    const full = path.join(directory, entry.name);
    if (entry.isDirectory()) result.push(...await findApks(full));
    else if (entry.name.endsWith(".apk")) result.push(full);
  }
  return result;
}

const worker = new Worker<BuildJobPayload>(BUILD_QUEUE_NAME, async (job) => {
  const payload = job.data;
  const existing = await getBuild(payload.buildId);
  if (!existing) throw new Error("Build record does not exist");
  await updateBuild(payload.buildId, { status: "PREPARING", progress: 10 });
  await appendBuildLog(payload.buildId, "Worker accepted job and prepared isolated Docker execution.");
  const outputPath = path.join(outputRoot, payload.buildId, "output");
  await mkdir(outputPath, { recursive: true });
  try {
    await updateBuild(payload.buildId, { status: "BUILDING", progress: 25 });
    await appendBuildLog(payload.buildId, `Executing ${payload.strategy}`);
    await runDocker(payload, outputPath);
    await updateBuild(payload.buildId, { status: "VALIDATING", progress: 85 });
    await appendBuildLog(payload.buildId, "Docker exited successfully; locating and validating APK output.");
    const apks = await findApks(outputPath);
    if (!apks.length) throw new Error("Android builder completed without producing an APK");
    const apk = apks.sort((a, b) => a.length - b.length)[0];
    const checked = await validateApk(apk);
    const artifactId = crypto.randomUUID();
    await createArtifact({ id: artifactId, projectId: payload.projectId, buildId: payload.buildId, filename: path.basename(apk), path: apk, ...checked });
    await updateBuild(payload.buildId, { status: "SUCCESS", progress: 100, artifactId });
    await appendBuildLog(payload.buildId, `Validated ${path.basename(apk)} (${checked.size} bytes), SHA-256 ${checked.sha256}.`);
  } catch (error) {
    const message = error instanceof Error ? error.message : "Build failed";
    await updateBuild(payload.buildId, { status: "FAILED", progress: 100, error: message });
    await appendBuildLog(payload.buildId, `Build failed: ${message}`);
    throw error;
  }
}, { connection: redisConnection(), concurrency: Number(process.env.BUILD_CONCURRENCY ?? 1) });

worker.on("ready", () => console.info(`Build worker listening on ${BUILD_QUEUE_NAME}`));
worker.on("failed", (job, error) => console.error(`Build ${job?.id ?? "unknown"} failed`, error));
process.on("SIGTERM", async () => { await worker.close(); const queue = buildQueue(); await queue.close(); process.exit(0); });