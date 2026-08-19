import { runBuild } from "@workspace/build-engine";

/**
 * Container entry point contract. Queue integration is intentionally kept at
 * the edge: this process receives one isolated workspace and streams real
 * child-process output to stdout for the BullMQ adapter to persist.
 */
const workspace = process.env.BUILD_WORKSPACE;
if (!workspace) throw new Error("BUILD_WORKSPACE is required");
await runBuild({ workspace, analysis: JSON.parse(process.env.BUILD_ANALYSIS ?? "{}"), onLog: (line) => process.stdout.write(line) });