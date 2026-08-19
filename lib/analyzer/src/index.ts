import type { Framework, ProjectAnalysis } from "@workspace/shared";

export interface ProjectSnapshot { files: string[]; packageJson?: Record<string, unknown>; }
type Detector = (snapshot: ProjectSnapshot) => Partial<ProjectAnalysis> | null;
const has = (files: string[], name: string) => files.some((file) => file === name || file.endsWith(`/${name}`));
const ext = (files: string[], suffix: string) => files.some((file) => file.endsWith(suffix));

const detectors: Detector[] = [
  (s) => {
    const native = has(s.files, "settings.gradle") || has(s.files, "settings.gradle.kts") || has(s.files, "gradlew") || s.files.some((f) => f.endsWith("AndroidManifest.xml"));
    if (!native) return null;
    const kotlin = ext(s.files, ".kt") || s.files.some((f) => f.includes("kotlin"));
    const compose = s.files.some((f) => f.endsWith(".kt")) && s.files.some((f) => f.includes("compose"));
    return { framework: "Native Android", buildTool: "Gradle", language: kotlin ? "Kotlin" : "Java", projectType: compose ? "Jetpack Compose" : "Android application", confidence: 98, compatibilityScore: 96, recommendedStrategy: "Native Gradle build using the project's Gradle wrapper", evidence: ["Gradle settings/build files", "Android manifest", ...(kotlin ? ["Kotlin sources"] : [])] };
  },
  (s) => {
    if (!has(s.files, "capacitor.config.ts") && !has(s.files, "capacitor.config.json") && !has(s.files, "capacitor.config.js")) return null;
    const android = has(s.files, "android");
    return { framework: "Capacitor", buildTool: "Gradle", language: ext(s.files, ".ts") ? "TypeScript" : "JavaScript", projectType: "Existing Capacitor project", confidence: 97, compatibilityScore: android ? 94 : 82, recommendedStrategy: android ? "Capacitor sync then Gradle build" : "Add Android platform, sync, then Gradle build", evidence: ["Capacitor configuration", ...(android ? ["Existing Android platform"] : [])] };
  },
  (s) => {
    const pkg = s.packageJson ?? {};
    const deps = { ...(pkg.dependencies as Record<string, unknown> ?? {}), ...(pkg.devDependencies as Record<string, unknown> ?? {}) };
    if (!deps.react) return null;
    const vite = has(s.files, "vite.config.ts") || has(s.files, "vite.config.js") || Object.keys(deps).includes("vite");
    return { framework: vite ? "React + Vite" : "React", buildTool: vite ? "Vite" : "npm scripts", language: ext(s.files, ".tsx") || ext(s.files, ".ts") ? "TypeScript" : "JavaScript", projectType: "Web application", confidence: vite ? 96 : 91, compatibilityScore: 88, recommendedStrategy: "Install dependencies, create Capacitor shell, sync, then build Android with Gradle", evidence: ["package.json", "react dependency", ...(vite ? ["Vite configuration"] : [])] };
  },
  (s) => has(s.files, "index.html") ? { framework: "Plain Web", buildTool: "None", language: ext(s.files, ".ts") ? "TypeScript" : "JavaScript", projectType: "Static web application", confidence: 87, compatibilityScore: 78, recommendedStrategy: "Create Capacitor shell around the web root, then build Android with Gradle", evidence: ["index.html"] } : null,
];

export function analyzeProject(snapshot: ProjectSnapshot): ProjectAnalysis {
  const result = detectors.map((detector) => detector(snapshot)).find(Boolean) ?? {};
  const framework = (result.framework ?? "Unsupported") as Framework;
  const blockers = framework === "Unsupported" ? ["No supported Android, React, Vite, Capacitor, or plain web structure was detected."] : [];
  const warnings = framework === "Plain Web" ? ["No framework build metadata was found; verify the web root is index.html."] : [];
  return { framework, version: null, buildTool: result.buildTool ?? "Unknown", language: result.language ?? "Unknown", packageManager: snapshot.files.some((f) => f.endsWith("pnpm-lock.yaml")) ? "pnpm" : snapshot.files.some((f) => f.endsWith("yarn.lock")) ? "yarn" : "npm", projectType: result.projectType ?? "Unknown", confidence: result.confidence ?? 12, compatibilityScore: result.compatibilityScore ?? 0, warnings, blockers, recommendedStrategy: result.recommendedStrategy ?? "No build strategy available", evidence: result.evidence ?? [] };
}