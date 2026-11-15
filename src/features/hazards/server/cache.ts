import "server-only";
import { unstable_cache } from "next/cache";
import type { FeedId, FeedSnapshot } from "../types";

// Failures must throw through this boundary so they cannot replace successful data.
export function cachedSnapshot(id: FeedId, retrieve: () => Promise<FeedSnapshot>) {
  return unstable_cache(retrieve, ["rescuesync-public-hazards-v1", id], { revalidate: 300 })();
}
