export type { BuildStrategy } from "./strategy";
export { determineBuildStrategy } from "./strategy";

export type { AnalysisResult } from "./analyzer";
export { analyzeProjectFiles, validateZipEntry } from "./analyzer";

export type { BuildJobResult } from "./worker";
export {
  executeBuildJob,
  ensureAapt2Override,
  ensureReferencedDebugKeystore,
  isGradleWrapperBootstrapFailure,
  isGradleJavaCompatibilityFailure,
} from "./worker";

export { injectAndroidWrapper } from "./template";
export { buildWebProject, findWebProjectRoot } from "./web-builder";
export { syncCapacitorAndroid } from "./capacitor-builder";
