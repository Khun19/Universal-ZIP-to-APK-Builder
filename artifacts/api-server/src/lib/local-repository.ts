import { randomUUID } from "node:crypto";
import { mkdir, readFile, writeFile } from "node:fs/promises";
import path from "node:path";
import type { BuildRecord, ProjectAnalysis, ProjectRecord } from "@workspace/shared";

type LocalProject = ProjectRecord & {
  uploadPath: string | null;
};

type LocalBuild = BuildRecord;

const root = path.resolve(
  process.env.BUILDER_STORAGE_DIR ?? ".local-builder",
);

const projectsDir = path.join(root, "projects");
const artifactsDir = path.join(root, "artifacts");

async function ensureDirs() {
  await mkdir(projectsDir, { recursive: true });
  await mkdir(artifactsDir, { recursive: true });
}

function projectDir(id: string) {
  return path.join(projectsDir, id);
}

function projectFile(id: string) {
  return path.join(projectDir(id), "project.json");
}

function analysisFile(id: string) {
  return path.join(projectDir(id), "analysis.json");
}

function buildDir(projectId: string, buildId: string) {
  return path.join(projectDir(projectId), "builds", buildId);
}

function buildFile(projectId: string, buildId: string) {
  return path.join(buildDir(projectId, buildId), "build.json");
}

function buildLogsFile(projectId: string, buildId: string) {
  return path.join(buildDir(projectId, buildId), "logs.json");
}

async function readJson<T>(file: string): Promise<T | null> {
  try {
    return JSON.parse(await readFile(file, "utf8")) as T;
  } catch {
    return null;
  }
}

async function writeJson(file: string, value: unknown) {
  await mkdir(path.dirname(file), { recursive: true });
  await writeFile(file, JSON.stringify(value, null, 2), "utf8");
}

export async function createProject(name: string): Promise<ProjectRecord> {
  await ensureDirs();

  const project: LocalProject = {
    id: randomUUID(),
    name,
    fileSize: 0,
    uploadStatus: "PENDING",
    analysisStatus: "PENDING",
    createdAt: new Date().toISOString(),
    uploadPath: null,
  };

  await writeJson(projectFile(project.id), project);
  return project;
}

export async function listProjects(): Promise<ProjectRecord[]> {
  await ensureDirs();

  const { readdir } = await import("node:fs/promises");
  const entries = await readdir(projectsDir, { withFileTypes: true });
  const projects: ProjectRecord[] = [];

  for (const entry of entries) {
    if (!entry.isDirectory()) continue;

    const project = await readJson<LocalProject>(
      projectFile(entry.name),
    );

    if (project) {
      projects.push(project);
    }
  }

  return projects.sort((a, b) =>
    b.createdAt.localeCompare(a.createdAt),
  );
}

export async function getProject(
  id: string,
): Promise<ProjectRecord | null> {
  const project = await readJson<LocalProject>(projectFile(id));
  return project;
}

export async function getProjectSourcePath(
  id: string,
): Promise<string | null> {
  const project = await readJson<LocalProject>(projectFile(id));
  return project?.uploadPath ?? null;
}

export async function saveUpload(
  id: string,
  fileSize: number,
  uploadPath: string,
): Promise<ProjectRecord> {
  const project = await readJson<LocalProject>(projectFile(id));

  if (!project) {
    throw new Error("Project not found");
  }

  project.fileSize = fileSize;
  project.uploadStatus = "UPLOADED";
  project.uploadPath = uploadPath;

  await writeJson(projectFile(id), project);
  return project;
}

export async function markAnalysisStatus(
  id: string,
  status: ProjectRecord["analysisStatus"],
): Promise<void> {
  const project = await readJson<LocalProject>(projectFile(id));

  if (!project) {
    throw new Error("Project not found");
  }

  project.analysisStatus = status;
  await writeJson(projectFile(id), project);
}

export async function saveAnalysis(
  projectId: string,
  result: ProjectAnalysis,
): Promise<void> {
  await writeJson(analysisFile(projectId), result);
}

export async function getAnalysis(
  projectId: string,
): Promise<(ProjectAnalysis & { projectId: string }) | null> {
  const result = await readJson<ProjectAnalysis>(
    analysisFile(projectId),
  );

  return result ? { projectId, ...result } : null;
}

export async function createBuild(
  projectId: string,
): Promise<BuildRecord> {
  const build: LocalBuild = {
    id: randomUUID(),
    projectId,
    status: "QUEUED",
    progress: 0,
    logs: ["Build queued for the local Termux executor."],
    error: null,
    artifactId: null,
    createdAt: new Date().toISOString(),
  };

  await writeJson(buildFile(projectId, build.id), build);
  await writeJson(buildLogsFile(projectId, build.id), build.logs);

  return build;
}

export async function getBuild(
  id: string,
): Promise<BuildRecord | null> {
  const { readdir } = await import("node:fs/promises");

  const projects = await readdir(projectsDir, {
    withFileTypes: true,
  }).catch(() => []);

  for (const project of projects) {
    if (!project.isDirectory()) continue;

    const build = await readJson<BuildRecord>(
      buildFile(project.name, id),
    );

    if (build) return build;
  }

  return null;
}

export async function updateBuild(
  id: string,
  fields: {
    status?: BuildRecord["status"];
    progress?: number;
    error?: string | null;
    artifactId?: string | null;
  },
): Promise<void> {
  const build = await getBuild(id);

  if (!build) {
    throw new Error("Build not found");
  }

  Object.assign(build, fields);

  await writeJson(
    buildFile(build.projectId, build.id),
    build,
  );
}

export async function appendBuildLog(
  id: string,
  line: string,
): Promise<void> {
  const build = await getBuild(id);

  if (!build) {
    throw new Error("Build not found");
  }

  build.logs = [...(build.logs ?? []), line];

  await writeJson(
    buildFile(build.projectId, build.id),
    build,
  );

  await writeJson(
    buildLogsFile(build.projectId, build.id),
    build.logs,
  );
}

export async function getBuildLogs(id: string): Promise<string[]> {
  const build = await getBuild(id);
  return build?.logs ?? [];
}

export async function createArtifact(input: {
  id: string;
  projectId: string;
  buildId: string;
  filename: string;
  path: string;
  size: number;
  sha256: string;
  applicationId: string | null;
}): Promise<void> {
  await writeJson(
    path.join(artifactsDir, `${input.id}.json`),
    input,
  );
}

export async function getArtifact(
  id: string,
): Promise<{ file_path: string; filename: string } | null> {
  const artifact = await readJson<{
    path: string;
    filename: string;
  }>(path.join(artifactsDir, `${id}.json`));

  return artifact
    ? {
        file_path: artifact.path,
        filename: artifact.filename,
      }
    : null;
}
