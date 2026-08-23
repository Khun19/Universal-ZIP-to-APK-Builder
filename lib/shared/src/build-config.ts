export const DEFAULT_BUILD_TIMEOUT_MS = 900000;

export function parseBuildTimeoutMs(raw: string | undefined): number {
  if (raw === undefined || raw.trim() === "") {
    return DEFAULT_BUILD_TIMEOUT_MS;
  }

  const value = Number(raw);

  if (!Number.isFinite(value) || value <= 0) {
    throw new Error("BUILD_TIMEOUT_MS must be a positive number");
  }

  return value;
}
