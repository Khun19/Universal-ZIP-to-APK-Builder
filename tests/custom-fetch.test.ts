import { test } from "node:test";
import assert from "node:assert/strict";
import { customFetch, setBaseUrl } from "../lib/api-client-react/src/custom-fetch.ts";

test("normalizes repeated trailing slashes in the configured base URL", async () => {
  const originalFetch = globalThis.fetch;
  let requestedUrl = "";

  globalThis.fetch = (async (input: RequestInfo | URL) => {
    requestedUrl = String(input);
    return new Response("{}", {
      status: 200,
      headers: { "content-type": "application/json" },
    });
  }) as typeof fetch;

  try {
    setBaseUrl("https://api.example.test////");
    await customFetch("/health", { responseType: "json" });
    assert.equal(requestedUrl, "https://api.example.test/health");
  } finally {
    setBaseUrl(null);
    globalThis.fetch = originalFetch;
  }
});
