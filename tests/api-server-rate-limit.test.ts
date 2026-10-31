import { test } from "node:test";
import assert from "node:assert/strict";
import type { Request, Response } from "express";
import { createRateLimit } from "../artifacts/api-server/src/middleware/rate-limit.ts";

function requestFor(ip: string): Request {
  return {
    ip,
    socket: { remoteAddress: ip },
  } as unknown as Request;
}

function responseRecorder() {
  const headers = new Map<string, string>();
  let statusCode = 200;
  let body: unknown;
  const response = {
    setHeader(name: string, value: string) {
      headers.set(name, value);
      return this;
    },
    status(code: number) {
      statusCode = code;
      return this;
    },
    json(value: unknown) {
      body = value;
      return this;
    },
  } as unknown as Response;
  return {
    response,
    headers,
    get statusCode() { return statusCode; },
    get body() { return body; },
  };
}

test("rate limits repeated requests from the same client IP", () => {
  const middleware = createRateLimit({ windowMs: 60_000, limit: 1 });
  const request = requestFor("203.0.113.10");
  let nextCalls = 0;

  const first = responseRecorder();
  middleware(request, first.response, () => { nextCalls += 1; });
  assert.equal(first.statusCode, 200);
  assert.equal(first.headers.get("RateLimit-Remaining"), "0");
  assert.equal(nextCalls, 1);

  const second = responseRecorder();
  middleware(request, second.response, () => { nextCalls += 1; });
  assert.equal(second.statusCode, 429);
  assert.equal((second.body as { error: string }).error, "Too many requests. Please retry later.");
  assert.ok(second.headers.has("Retry-After"));
  assert.equal(nextCalls, 1);
});

test("tracks clients independently", () => {
  const middleware = createRateLimit({ windowMs: 60_000, limit: 1 });
  const first = responseRecorder();
  const second = responseRecorder();
  let nextCalls = 0;

  middleware(requestFor("203.0.113.11"), first.response, () => { nextCalls += 1; });
  middleware(requestFor("203.0.113.12"), second.response, () => { nextCalls += 1; });

  assert.equal(first.statusCode, 200);
  assert.equal(second.statusCode, 200);
  assert.equal(nextCalls, 2);
});
