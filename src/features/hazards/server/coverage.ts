import type { HazardResponse } from "../types";

// Stable identity ordering is a reproducible size limit, never an urgency ranking.
export function boundCoverage(response: HazardResponse): HazardResponse {
  const encoder = new TextEncoder();
  const candidates = response.feeds.map((feed) =>
    [...feed.events].sort((a, b) => (a.id < b.id ? -1 : a.id > b.id ? 1 : 0)),
  );
  response.feeds.forEach((feed) => {
    feed.events = [];
  });
  let bytes = encoder.encode(JSON.stringify(response)).byteLength;
  let displayed = 0;
  const maximum = Math.max(0, ...candidates.map((events) => events.length));
  for (let index = 0; index < maximum; index++) {
    for (let feedIndex = 0; feedIndex < candidates.length; feedIndex++) {
      const event = candidates[feedIndex][index];
      if (!event) continue;
      const feed = response.feeds[feedIndex];
      const eventBytes =
        encoder.encode(JSON.stringify(event)).byteLength + (feed.events.length ? 1 : 0);
      // Reserve space for diagnostics whose numeric widths can change below.
      if (displayed >= 1000 || bytes + eventBytes > 512 * 1024 - 2048) {
        feed.diagnostics.limited = true;
        feed.diagnostics.omittedEvents++;
        continue;
      }
      feed.events.push(event);
      displayed++;
      bytes += eventBytes;
    }
  }
  response.feeds.forEach((feed) => {
    feed.diagnostics.displayedCount = feed.events.length;
  });
  if (
    response.availability === "available" &&
    response.feeds.some(
      (feed) =>
        feed.diagnostics.limited ||
        feed.diagnostics.invalidRecords > 0 ||
        feed.diagnostics.omittedEvents > 0,
    )
  )
    response.availability = "partial";
  return response;
}
