import * as fs from "node:fs";
import * as path from "node:path";

export type AndroidTool = "aapt2" | "zipalign" | "apksigner";

export interface AndroidToolchain {
  sdkRoot?: string;
  buildToolsDir?: string;
  aapt2?: string;
  zipalign?: string;
  apksigner?: string;
}

function executable(filePath: string): boolean {
  try {
    return fs.statSync(filePath).isFile() && (process.platform === "win32" || (fs.statSync(filePath).mode & 0o111) !== 0);
  } catch {
    return false;
  }
}

function candidateBuildToolsRoots(): string[] {
  const sdk = process.env.ANDROID_SDK_ROOT || process.env.ANDROID_HOME;
  if (!sdk) return [];
  const root = path.join(sdk, "build-tools");
  if (!fs.existsSync(root)) return [];
  return fs.readdirSync(root, { withFileTypes: true })
    .filter(entry => entry.isDirectory())
    .map(entry => path.join(root, entry.name))
    .sort((a, b) => b.localeCompare(a, undefined, { numeric: true }));
}

export function resolveAndroidTool(tool: AndroidTool): string | undefined {
  const explicit = process.env[tool === "aapt2" ? "AAPT2_PATH" : tool === "zipalign" ? "ZIPALIGN_PATH" : "APKSIGNER_PATH"];
  if (explicit && executable(explicit)) return explicit;

  const fromPath = process.env.PATH?.split(path.delimiter)
    .map(dir => path.join(dir, tool))
    .find(executable);
  if (fromPath) return fromPath;

  for (const dir of candidateBuildToolsRoots()) {
    const candidate = path.join(dir, tool);
    if (executable(candidate)) return candidate;
  }

  return undefined;
}

export function resolveAndroidToolchain(): AndroidToolchain {
  const sdkRoot = process.env.ANDROID_SDK_ROOT || process.env.ANDROID_HOME;
  const aapt2 = resolveAndroidTool("aapt2");
  const zipalign = resolveAndroidTool("zipalign");
  const apksigner = resolveAndroidTool("apksigner");
  const roots = candidateBuildToolsRoots();

  return {
    sdkRoot,
    buildToolsDir: roots.find(dir => [aapt2, zipalign, apksigner].some(tool => tool?.startsWith(dir))) ?? roots[0],
    aapt2,
    zipalign,
    apksigner,
  };
}
