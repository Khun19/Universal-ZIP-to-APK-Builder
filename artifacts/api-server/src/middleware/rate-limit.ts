import type { RequestHandler } from "express";

export interface RateLimitOptions {
  windowMs: number;
  limit: number;
}

interface ClientWindow {
  count: number;
  resetAt: number;
}

const MAX_CLIENT_BUCKETS = 10_000;

export function createRateLimit(options: RateLimitOptions): RequestHandler {
  const { windowMs, limit } = options;
  if (!Number.isSafeInteger(windowMs) || windowMs <= 0) {
    throw new Error("Rate-limit windowMs must be a positive safe integer");
  }
  if (!Number.isSafeInteger(limit) || limit <= 0) {
    throw new Error("Rate-limit limit must be a positive safe integer");
  }

  const clients = new Map<string, ClientWindow>();

  return (req, res, next) => {
    const now = Date.now();
    const clientKey = req.ip || req.socket.remoteAddress || "unknown";
    let window = clients.get(clientKey);

    if (!window || window.resetAt <= now) {
      window = { count: 0, resetAt: now + windowMs };
      clients.set(clientKey, window);
    }

    if (window.count >= limit) {
      const retryAfterSeconds = Math.max(1, Math.ceil((window.resetAt - now) / 1000));
      res.setHeader("Retry-After", String(retryAfterSeconds));
      res.setHeader("RateLimit-Limit", String(limit));
      res.setHeader("RateLimit-Remaining", "0");
      res.setHeader("RateLimit-Reset", String(Math.ceil(window.resetAt / 1000)));
      res.status(429).json({ error: "Too many requests. Please retry later." });
      return;
    }

    window.count += 1;
    res.setHeader("RateLimit-Limit", String(limit));
    res.setHeader("RateLimit-Remaining", String(Math.max(0, limit - window.count)));
    res.setHeader("RateLimit-Reset", String(Math.ceil(window.resetAt / 1000)));

    if (clients.size > MAX_CLIENT_BUCKETS) {
      for (const [key, value] of clients) {
        if (value.resetAt <= now) clients.delete(key);
      }
      if (clients.size > MAX_CLIENT_BUCKETS) {
        const oldestKey = clients.keys().next().value;
        if (oldestKey !== undefined) clients.delete(oldestKey);
      }
    }

    next();
  };
}
