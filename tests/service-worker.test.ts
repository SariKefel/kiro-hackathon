import { describe, expect, test } from "bun:test";
import { readFileSync } from "node:fs";
import { runInNewContext } from "node:vm";

const source = readFileSync(new URL("../public/sw.js", import.meta.url), "utf8");

function harness(options: { noStore?: boolean; cacheWriteFails?: boolean } = {}) {
  const handlers = new Map<string, (event: unknown) => void>();
  const entries = new Map<string, Response>();
  let networkCalls = 0;
  let offline = false;
  const cache = {
    addAll: async () => {},
    put: async (request: Request, response: Response) => {
      if (options.cacheWriteFails) throw new Error("Quota exceeded");
      entries.set(request.url, response);
    },
  };
  runInNewContext(source, {
    self: {
      location: { origin: "http://localhost:3000" },
      clients: { claim: async () => {} },
      addEventListener: (name: string, handler: (event: unknown) => void) =>
        handlers.set(name, handler),
    },
    caches: {
      match: async (request: Request | string) =>
        entries.get(typeof request === "string" ? request : request.url)?.clone(),
      open: async () => cache,
      keys: async () => [],
      delete: async () => true,
    },
    fetch: async () => {
      networkCalls++;
      if (offline) throw new Error("Offline");
      const response = new Response("current client bundle", {
        headers: options.noStore ? { "Cache-Control": "no-store" } : {},
      });
      Object.defineProperty(response, "type", { value: "basic" });
      return response;
    },
    Response,
    URL,
  });
  return {
    entries,
    get networkCalls() {
      return networkCalls;
    },
    goOffline() {
      offline = true;
    },
    request(path: string, mode?: string) {
      const request = new Request(`http://localhost:3000${path}`);
      if (mode) Object.defineProperty(request, "mode", { value: mode });
      let response: Promise<Response> | undefined;
      handlers.get("fetch")!({
        request,
        respondWith: (result: Promise<Response>) => {
          response = result;
        },
      });
      return response;
    },
  };
}

describe("service worker asset freshness", () => {
  test("new server markup receives current client code even when a mutable chunk is cached", async () => {
    const worker = harness();
    worker.entries.set(
      "http://localhost:3000/_next/static/chunks/app/page.js",
      new Response("old client without tour attributes"),
    );
    const response = await worker.request("/_next/static/chunks/app/page.js");
    expect(await response?.text()).toBe("current client bundle");
    expect(worker.networkCalls).toBe(1);
    expect(
      await worker.entries.get("http://localhost:3000/_next/static/chunks/app/page.js")?.text(),
    ).toBe("current client bundle");
  });
  test("keeps cached static assets available when offline", async () => {
    const worker = harness();
    worker.entries.set(
      "http://localhost:3000/_next/static/chunks/app/page.js",
      new Response("cached client bundle"),
    );
    worker.goOffline();
    expect(await (await worker.request("/_next/static/chunks/app/page.js"))?.text()).toBe(
      "cached client bundle",
    );
  });
  test("does not retain no-store development responses", async () => {
    const worker = harness({ noStore: true });
    expect(await (await worker.request("/_next/static/chunks/app/page.js"))?.text()).toBe(
      "current client bundle",
    );
    expect(worker.entries.size).toBe(0);
  });
  test("a full cache cannot replace a fresh response with a stale bundle", async () => {
    const worker = harness({ cacheWriteFails: true });
    worker.entries.set(
      "http://localhost:3000/_next/static/chunks/app/page.js",
      new Response("stale bundle"),
    );
    expect(await (await worker.request("/_next/static/chunks/app/page.js"))?.text()).toBe(
      "current client bundle",
    );
  });
  test("offline navigation uses the generic shell without caching incident HTML", async () => {
    const worker = harness();
    worker.entries.set("/offline.html", new Response("generic offline shell"));
    worker.goOffline();
    expect(await (await worker.request("/incidents", "navigate"))?.text()).toBe(
      "generic offline shell",
    );
    expect(worker.entries.size).toBe(1);
  });
  test("does not cache incident HTML, RSC responses, or API data", () => {
    const worker = harness();
    expect(worker.request("/incidents?_rsc=example")).toBeUndefined();
    expect(worker.request("/api/sync")).toBeUndefined();
  });
});
