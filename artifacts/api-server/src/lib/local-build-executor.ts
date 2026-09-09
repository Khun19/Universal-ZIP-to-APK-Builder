import { createHash } from "node:crypto";
import { readFile, stat } from "node:fs/promises";
import path from "node:path";

import { analyzeProjectFiles } from "@workspace/build-engine";
import { determineBuildStrategy } from "@workspace/build-engine";
import { executeBuildJob } from "@workspace/build-engine";

import {
  appendBuildLog,
  createArtifact,
  getProject,
  getProjectSourcePath,
  updateBuild,
} from "./local-repository";

async function walkFiles(root: string, current = root): Promise<string[]> {
  const { readdir } = await import("node:fs/promises");
  const entries = await readdir(current, { withFileTypes: true });
  const result: string[] = [];

  for (const entry of entries) {
    const fullPath = path.join(current, entry.name);

    if (entry.isDirectory()) {
      result.push(...await walkFiles(root, fullPath));
    } else if (entry.isFile()) {
      result.push(path.relative(root, fullPath).replace(/\\/g, "/"));
    }
  }

  return result;
}

async function sha256File(filePath: string): Promise<string> {
  const buffer = await readFile(filePath);
  return createHash("sha256").update(buffer).digest("hex");
}

export async function executeLocalBuild(
  buildId: string,
  projectId: string,
): Promise<void> {
  try {
    const project = await getProject(projectId);
    const archivePath = await getProjectSourcePath(projectId);
    const projectPath = archivePath
      ? path.join(path.dirname(archivePath), "source")
      : null;

    if (!project || !projectPath) {
      throw new Error("Uploaded project source was not found.");
    }

    await updateBuild(buildId, {
      status: "ANALYZING",
      progress: 10,
      error: null,
    });
    await appendBuildLog(buildId, "Analyzing extracted project files...");

    const filePaths = await walkFiles(projectPath);
    const analysis = analyzeProjectFiles(filePaths);

    await appendBuildLog(
      buildId,
      `Detected project type: ${analysis.projectType} (${analysis.confidence}% confidence).`,
    );

    if (analysis.warnings.length) {
      for (const warning of analysis.warnings) {
        await appendBuildLog(buildId, `Warning: ${warning}`);
      }
    }

    if (analysis.projectType === "Unknown") {
      throw new Error("Unable to determine project type.");
    }

    const strategy = determineBuildStrategy(analysis);

    await updateBuild(buildId, {
      status: "PREPARING",
      progress: 20,
    });

    await appendBuildLog(
      buildId,
      `Selected build strategy: ${strategy.strategyName}`,
    );

    await updateBuild(buildId, {
      status: "BUILDING",
      progress: 30,
    });

    const result = await executeBuildJob(
      projectPath,
      strategy,
      project.name,
    );

    for (const log of result.logs) {
      await appendBuildLog(buildId, log);
    }

    if (!result.success || !result.outputPath) {
      throw new Error(result.error || "Local APK build failed.");
    }

    await updateBuild(buildId, {
      status: "VALIDATING",
      progress: 90,
    });

    await appendBuildLog(
      buildId,
      `APK produced: ${result.outputPath}`,
    );

    const apkStat = await stat(result.outputPath);
    const sha256 = await sha256File(result.outputPath);
    const artifactId = cryptoRandomId();

    await createArtifact({
      id: artifactId,
      projectId,
      buildId,
      filename: path.basename(result.outputPath),
      path: result.outputPath,
      size: apkStat.size,
      sha256,
      applicationId: null,
    });

    await updateBuild(buildId, {
      status: "SUCCESS",
      progress: 100,
      artifactId,
      error: null,
    });

    await appendBuildLog(
      buildId,
      `Build SUCCESS — ${apkStat.size} bytes — SHA-256 ${sha256}`,
    );
  } catch (error) {
    const message =
      error instanceof Error ? error.message : String(error);

    await appendBuildLog(buildId, `Build FAILED: ${message}`);

    await updateBuild(buildId, {
      status: "FAILED",
      progress: 100,
      error: message,
    });
  }
}

function cryptoRandomId(): string {
  return `${Date.now()}-${Math.random().toString(36).slice(2, 12)}`;
}
