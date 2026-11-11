import type { Response } from "express";

export function sendLegacyBuildDisabled(res: Pick<Response, "status" | "json">) {
  return res.status(410).json({
    error: "Legacy API build queue is disabled",
    message: "Use the canonical GitHub Actions build workflow. Termux is optional for recovery and diagnostics only."
  });
}
