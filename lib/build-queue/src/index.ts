import { Queue } from "bullmq";
import type { JobStatus } from "@workspace/shared";

export interface BuildJobPayload {
  projectId: string;
  buildId: string;
  projectPath: string;
  projectType: string;
  strategy: string;
}

export const BUILD_QUEUE_NAME = "android-builds";
export function redisConnection() {
  const url = process.env.REDIS_URL;
  if (!url) throw new Error("REDIS_URL is required for build queue operations");
  return { url, maxRetriesPerRequest: null as null };
}
export function buildQueue() {
  return new Queue<BuildJobPayload>(BUILD_QUEUE_NAME, { connection: redisConnection(), defaultJobOptions: { attempts: 1, removeOnComplete: 100, removeOnFail: 100 } });
}
export const JOB_STATUS: JobStatus[] = ["QUEUED", "ANALYZING", "PREPARING", "BUILDING", "VALIDATING", "SUCCESS", "FAILED"];