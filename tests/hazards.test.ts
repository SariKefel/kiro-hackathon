import { describe, expect, test } from "bun:test";
import { createHazardQuery, responseStatus } from "@/features/hazards/server/query";

const NOW = Date.parse("2026-11-15T00:00:00Z");
const emptyFeed = { type: "FeatureCollection", features: [] };

describe("public hazard query", () => {
  test("a commander receives a genuine earthquake's measurements and distinct source times", async () => {
    const query = createHazardQuery({
      now: () => NOW,
      transport: async (url) =>
        Response.json(
          String(url).includes("usgs.gov")
            ? {
                type: "FeatureCollection",
                features: [
                  {
                    type: "Feature",
                    id: "us-example",
                    geometry: { type: "Point", coordinates: [102.5, 3.1, 12.4] },
                    properties: {
                      type: "earthquake",
                      mag: 5.2,
                      magType: "mww",
                      place: "Malaysia test location",
                      time: NOW - 3600000,
                      updated: NOW - 1000,
                      url: "https://earthquake.usgs.gov/earthquakes/eventpage/us-example",
                      status: "reviewed",
                    },
                  },
                ],
              }
            : emptyFeed,
        ),
    });
    const result = await query();
    expect(responseStatus(result)).toBe(200);
    expect(result.feeds[0].events[0]).toMatchObject({
      id: "usgs:us-example",
      providerEventId: "us-example",
      coordinates: [102.5, 3.1],
      locationRole: "epicenter",
      measurements: [
        { label: "Magnitude (mww)", value: 5.2, unit: null },
        { label: "Depth", value: 12.4, unit: "km" },
      ],
      times: {
        occurred: { utc: "2026-11-14T23:00:00.000Z" },
        modified: { utc: "2026-11-14T23:59:59.000Z" },
        observed: null,
      },
      retrievedAt: "2026-11-15T00:00:00.000Z",
    });
  });
  test("an unavailable complementary feed does not erase a successful empty earthquake snapshot", async () => {
    const query = createHazardQuery({
      now: () => NOW,
      transport: async (url) => {
        if (!url.includes("usgs.gov")) throw new Error("private transport details");
        return Response.json(emptyFeed);
      },
    });
    const result = await query();
    expect(responseStatus(result)).toBe(200);
    expect(result.availability).toBe("partial");
    expect(
      result.feeds.map(({ id, status, events }) => ({ id, status, count: events.length })),
    ).toEqual([
      { id: "usgs-earthquakes", status: "ok", count: 0 },
      { id: "gdacs-floods", status: "unavailable", count: 0 },
      { id: "gdacs-cyclones", status: "unavailable", count: 0 },
    ]);
    expect(JSON.stringify(result)).not.toContain("private transport details");
  });
  test("nine GDACS flood representations expose three source events with honest geographic and temporal meaning", async () => {
    const floods = await Bun.file(
      new URL("./fixtures/hazards/gdacs-floods.json", import.meta.url),
    ).json();
    const query = createHazardQuery({
      now: () => NOW,
      transport: async (url) => Response.json(url.endsWith("eventtype=FL") ? floods : emptyFeed),
    });
    const result = await query();
    const feed = result.feeds.find((feed) => feed.id === "gdacs-floods")!;
    expect(feed.status).toBe("ok");
    expect(feed.events).toHaveLength(3);
    expect(feed.events.find((event) => event.providerEventId === "1104271")).toMatchObject({
      id: "gdacs:FL:1104271",
      episodeId: "6",
      locationRole: "representative",
      representation: "Point_Centroid",
      impact: { overall: "Green", episode: "Green" },
      measurements: [],
      times: {
        occurred: null,
        observed: null,
        periodStart: { raw: "2026-11-06T01:00:00", utc: null, timezone: "unspecified" },
        modified: { raw: "2026-11-14T11:06:12", utc: null, timezone: "unspecified" },
      },
    });
  });
  test("103 cyclone representations remain two events and episode revisions preserve source identity", async () => {
    const cyclones = await Bun.file(
      new URL("./fixtures/hazards/gdacs-cyclones.json", import.meta.url),
    ).json();
    let data = cyclones;
    let clock = NOW;
    const query = createHazardQuery({
      now: () => clock,
      transport: async (url) => Response.json(url.endsWith("eventtype=TC") ? data : emptyFeed),
    });
    const result = await query();
    const events = result.feeds[2].events;
    expect(events).toHaveLength(2);
    expect(events.find((event) => event.providerEventId === "1001348")).toMatchObject({
      locationRole: "representative",
      times: { observed: null },
      measurements: [{ value: 92.592, unit: "km/h" }],
    });
    data = structuredClone(cyclones);
    data.features.forEach((feature: { properties: { episodeid: number } }) => {
      feature.properties.episodeid += 1;
    });
    clock += 301000;
    const revised = await query();
    expect(revised.feeds[2].events.map((event) => event.id)).toEqual(
      events.map((event) => event.id),
    );
    expect(revised.feeds[2].events[0].episodeId).not.toBe(events[0].episodeId);
  });
  test("retrieval timestamps survive cache hits and a failed refresh retains events until a successful empty replacement", async () => {
    let clock = NOW;
    let phase: "success" | "failed" | "empty" = "success";
    const query = createHazardQuery({
      now: () => clock,
      transport: async (url) => {
        if (!url.includes("usgs.gov") || phase === "empty") return Response.json(emptyFeed);
        if (phase === "failed") return new Response("private error", { status: 502 });
        return Response.json({
          type: "FeatureCollection",
          features: [
            {
              type: "Feature",
              id: "us-retained",
              geometry: { type: "Point", coordinates: [100, 3, 9] },
              properties: {
                type: "earthquake",
                mag: 5,
                time: NOW - 1000,
                updated: NOW,
                url: "https://earthquake.usgs.gov/earthquakes/eventpage/us-retained",
              },
            },
          ],
        });
      },
    });
    const first = await query();
    clock += 60000;
    expect((await query()).feeds[0].retrievedAt).toBe(first.feeds[0].retrievedAt);
    clock = NOW + 301000;
    phase = "failed";
    const failed = await query();
    expect(failed.feeds[0]).toMatchObject({
      status: "retained",
      retrievedAt: "2026-11-15T00:00:00.000Z",
    });
    expect(failed.feeds[0].events.map((event) => event.id)).toEqual(["usgs:us-retained"]);
    clock += 31000;
    phase = "empty";
    expect((await query()).feeds[0]).toMatchObject({
      status: "ok",
      events: [],
      retrievedAt: "2026-11-15T00:05:32.000Z",
    });
  });
  test("an oversized streamed feed is unavailable without consuming unrelated usable coverage", async () => {
    const oversized = new ReadableStream<Uint8Array>({
      start(controller) {
        controller.enqueue(
          new TextEncoder().encode('{"type":"FeatureCollection","features":[],"padding":"'),
        );
        controller.enqueue(new Uint8Array(2 * 1024 * 1024).fill(32));
        controller.enqueue(new TextEncoder().encode('"}'));
        controller.close();
      },
    });
    const query = createHazardQuery({
      now: () => NOW,
      transport: async (url) =>
        url.includes("usgs.gov") ? new Response(oversized) : Response.json(emptyFeed),
    });
    const result = await query();
    expect(result.feeds[0]).toMatchObject({ status: "unavailable", retrievedAt: null, events: [] });
    expect(result.availability).toBe("partial");
    expect(responseStatus(result)).toBe(200);
  });
  test("a feed that never completes times out without blocking successful feeds", async () => {
    const query = createHazardQuery({
      now: () => NOW,
      transport: async (url, init) => {
        if (!url.includes("usgs.gov")) return Response.json(emptyFeed);
        if (!init?.signal) throw new Error("No deadline signal");
        return await new Promise<Response>((_resolve, reject) =>
          init.signal!.addEventListener("abort", () => reject(new Error("aborted")), {
            once: true,
          }),
        );
      },
    });
    const result = await query();
    expect(result.feeds[0]).toMatchObject({
      status: "unavailable",
      problem: "Source retrieval timed out",
    });
    expect(result.feeds[1].status).toBe("ok");
  }, 10000);
  test("provider Retry-After prevents premature retries and permits recovery afterwards", async () => {
    let clock = NOW;
    let throttled = true;
    const query = createHazardQuery({
      now: () => clock,
      transport: async (url) => {
        if (url.includes("usgs.gov") && throttled)
          return new Response(null, { status: 429, headers: { "Retry-After": "120" } });
        return Response.json(emptyFeed);
      },
    });
    const first = await query();
    expect(first.feeds[0]).toMatchObject({
      status: "unavailable",
      retryAfter: "2026-11-15T00:02:00.000Z",
    });
    throttled = false;
    clock += 31000;
    expect((await query()).feeds[0].status).toBe("unavailable");
    clock = NOW + 121000;
    expect((await query()).feeds[0]).toMatchObject({ status: "ok", retryAfter: null });
  });
  test("bounded global coverage discloses deterministic omissions and stays below the public response limits", async () => {
    const features = Array.from({ length: 1800 }, (_, index) => ({
      type: "Feature",
      id: `event-${String(index).padStart(4, "0")}`,
      geometry: { type: "Point", coordinates: [100, 3, 10] },
      properties: {
        type: "earthquake",
        mag: 5,
        time: NOW - 1000,
        place: "A reported location",
        url: `https://earthquake.usgs.gov/earthquakes/eventpage/event-${index}`,
      },
    }));
    const query = createHazardQuery({
      now: () => NOW,
      transport: async (url) =>
        Response.json(
          url.includes("usgs.gov") ? { type: "FeatureCollection", features } : emptyFeed,
        ),
    });
    const result = await query();
    expect(new TextEncoder().encode(JSON.stringify(result)).byteLength).toBeLessThanOrEqual(
      512 * 1024,
    );
    expect(result.feeds[0].events.length).toBeLessThanOrEqual(1000);
    expect(result.feeds[0].diagnostics).toMatchObject({
      limited: true,
      availableCount: 1800,
      displayedCount: result.feeds[0].events.length,
      omittedEvents: 1800 - result.feeds[0].events.length,
    });
    expect(result.feeds[0].events[0].id).toBe("usgs:event-0000");
  });
  test("malformed source dates never become invented observation or record times", async () => {
    const floods = await Bun.file(
      new URL("./fixtures/hazards/gdacs-floods.json", import.meta.url),
    ).json();
    const centroid = structuredClone(floods.features[0]);
    centroid.properties.datemodified = "2026-02-30T01:00:00Z";
    centroid.properties.url.report = "javascript:alert(1)";
    const query = createHazardQuery({
      now: () => NOW,
      transport: async (url) =>
        Response.json(
          url.endsWith("eventtype=FL")
            ? { type: "FeatureCollection", features: [centroid] }
            : emptyFeed,
        ),
    });
    const result = await query();
    expect(result.feeds[1].events[0]).toMatchObject({
      reportUrl: null,
      times: { observed: null, modified: null },
    });
  });
  test("duplicate earthquake representations cannot inflate displayed event counts", async () => {
    const feature = {
      type: "Feature",
      id: "us-duplicate",
      geometry: { type: "Point", coordinates: [100, 3, 10] },
      properties: {
        type: "earthquake",
        mag: 5,
        time: NOW - 1000,
        url: "https://earthquake.usgs.gov/earthquakes/eventpage/us-duplicate",
      },
    };
    const query = createHazardQuery({
      now: () => NOW,
      transport: async (url) =>
        Response.json(
          url.includes("usgs.gov")
            ? { type: "FeatureCollection", features: [feature, structuredClone(feature)] }
            : emptyFeed,
        ),
    });
    const result = await query();
    expect(result.feeds[0].events.map((event) => event.id)).toEqual(["usgs:us-duplicate"]);
    expect(result.feeds[0].diagnostics.availableCount).toBe(1);
  });
  test("malformed envelopes are unavailable and never cached as successful empty coverage", async () => {
    let clock = NOW;
    let malformed = true;
    const query = createHazardQuery({
      now: () => clock,
      transport: async () =>
        Response.json(
          malformed ? { type: "FeatureCollection", features: "not an array" } : emptyFeed,
        ),
    });
    const failed = await query();
    expect(responseStatus(failed)).toBe(503);
    expect(failed.availability).toBe("unavailable");
    expect(failed.feeds.every((feed) => feed.retrievedAt === null)).toBe(true);
    malformed = false;
    clock += 31000;
    const recovered = await query();
    expect(responseStatus(recovered)).toBe(200);
    expect(
      recovered.feeds.every(
        (feed) =>
          feed.status === "ok" &&
          feed.events.length === 0 &&
          feed.retrievedAt === "2026-11-15T00:00:31.000Z",
      ),
    ).toBe(true);
  });

  test("conflicting, missing, misleading and invalid GDACS centroids are diagnosed without inventing locations", async () => {
    const floods = await Bun.file(
      new URL("./fixtures/hazards/gdacs-floods.json", import.meta.url),
    ).json();
    const original = floods.features[0];
    const feature = (id: number, geometry: unknown, representation = "Point_Centroid") => ({
      ...structuredClone(original),
      geometry,
      properties: { ...original.properties, eventid: id, Class: representation },
    });
    const features = [
      original,
      structuredClone(original),
      feature(991, { type: "Point", coordinates: [1, 1] }),
      feature(991, { type: "Point", coordinates: [2, 1] }),
      feature(992, { type: "Polygon", coordinates: [] }),
      feature(993, { type: "Point", coordinates: [1, 1] }, "Point_Polygon_Point_0"),
      feature(994, { type: "Point", coordinates: [181, 0] }),
    ];
    const query = createHazardQuery({
      now: () => NOW,
      transport: async (url) =>
        Response.json(
          url.endsWith("eventtype=FL") ? { type: "FeatureCollection", features } : emptyFeed,
        ),
    });
    const result = await query();
    expect(result.feeds[1].events.map((event) => event.id)).toEqual(["gdacs:FL:1104271"]);
    expect(result.feeds[1].diagnostics).toMatchObject({
      conflictingLocations: 1,
      missingLocations: 3,
      omittedEvents: 4,
      invalidRecords: 1,
      availableCount: 1,
      displayedCount: 1,
    });
    expect(result.availability).toBe("partial");
  });

  test("earthquake occurrence windows and source measurements survive record modification and invalid candidates", async () => {
    const make = (
      id: string,
      properties: Record<string, unknown> = {},
      coordinates = [100, 3, 12],
    ) => ({
      type: "Feature",
      id,
      geometry: { type: "Point", coordinates },
      properties: { type: "earthquake", mag: 5, time: NOW - 1000, updated: NOW, ...properties },
    });
    const features = [
      make("old-revised", { time: NOW - 8 * 86400000 }),
      make("small", { mag: 4.4 }),
      make("blast", { type: "quarry blast" }),
      make("missing-magnitude", { mag: null }),
      make("invalid-point", {}, [190, 3, 2]),
      make("valid", { url: "https://earthquake.usgs.gov.evil.example/report", magType: "mb" }),
    ];
    const query = createHazardQuery({
      now: () => NOW,
      transport: async (url) =>
        Response.json(
          url.includes("usgs.gov") ? { type: "FeatureCollection", features } : emptyFeed,
        ),
    });
    const result = await query();
    expect(result.feeds[0].events.map((event) => event.id)).toEqual(["usgs:valid"]);
    expect(result.feeds[0].events[0]).toMatchObject({
      reportUrl: null,
      measurements: [
        { label: "Magnitude (mb)", value: 5, unit: null },
        { label: "Depth", value: 12, unit: "km" },
      ],
    });
    expect(result.feeds[0].diagnostics.invalidRecords).toBe(3);
  });
  test("unrepresentable earthquake modification times stay unavailable without discarding a valid occurrence", async () => {
    const query = createHazardQuery({
      now: () => NOW,
      transport: async (url) =>
        Response.json(
          url.includes("usgs.gov")
            ? {
                type: "FeatureCollection",
                features: [
                  {
                    type: "Feature",
                    id: "us-clock",
                    geometry: { type: "Point", coordinates: [100, 3, 5] },
                    properties: {
                      type: "earthquake",
                      mag: 5,
                      time: NOW - 1000,
                      updated: 8640000000000000,
                    },
                  },
                ],
              }
            : emptyFeed,
        ),
    });
    const result = await query();
    expect(result.feeds[0].events[0]).toMatchObject({
      id: "usgs:us-clock",
      times: { modified: null, occurred: { utc: "2026-11-14T23:59:59.000Z" } },
    });
  });
});
