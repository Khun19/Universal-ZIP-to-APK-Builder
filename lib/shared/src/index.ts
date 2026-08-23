export type JobStatus = "QUEUED" | "ANALYZING" | "PREPARING" | "BUILDING" | "VALIDATING" | "SUCCESS" | "FAILED";
export type Framework = "Native Android" | "React" | "React + Vite" | "Plain Web" | "Capacitor" | "Unsupported";
export interface ProjectAnalysis {
  framework: Framework; version: string | null; buildTool: string; language: string;
  packageManager: string; projectType: string; confidence: number; compatibilityScore: number;
  warnings: string[]; blockers: string[]; recommendedStrategy: string; evidence: string[];
}
export interface ProjectRecord { id: string; name: string; fileSize: number; uploadStatus: "PENDING" | "UPLOADED" | "REJECTED"; analysisStatus: "PENDING" | "COMPLETE" | "FAILED"; createdAt: string; }
export interface BuildRecord { id: string; projectId: string; status: JobStatus; progress: number; logs: string[]; error: string | null; artifactId: string | null; createdAt: string; }
export { DEFAULT_BUILD_TIMEOUT_MS, parseBuildTimeoutMs } from "./build-config";
