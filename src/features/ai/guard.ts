// Cost and abuse controls for the paid AI endpoint. State is in memory, so on a serverless host
// each instance enforces its own limits. Together with the result cache this bounds spend.

export function createRateLimiter(options: {
  limit: number;
  windowMs: number;
  now?: () => number;
}) {
  const now = options.now ?? Date.now;
  const windows = new Map<string, { start: number; count: number }>();
  return {
    take(key: string) {
      const time = now();
      const current = windows.get(key);
      if (!current || time - current.start >= options.windowMs) {
        windows.set(key, { start: time, count: 1 });
        // Drop expired entries so the map cannot grow without bound.
        if (windows.size > 1000)
          for (const [k, v] of windows) if (time - v.start >= options.windowMs) windows.delete(k);
        return { ok: true as const };
      }
      if (current.count >= options.limit)
        return {
          ok: false as const,
          retryAfterSeconds: Math.max(
            1,
            Math.ceil((current.start + options.windowMs - time) / 1000),
          ),
        };
      current.count += 1;
      return { ok: true as const };
    },
  };
}

// Reuses a recent result for identical input and shares one request among concurrent callers.
export function createResultCache<T>(options: { ttlMs: number; now?: () => number }) {
  const now = options.now ?? Date.now;
  const stored = new Map<string, { value: T; expires: number }>();
  const inFlight = new Map<string, Promise<T>>();
  return {
    async run(key: string, produce: () => Promise<T>): Promise<{ value: T; cached: boolean }> {
      const hit = stored.get(key);
      if (hit && hit.expires > now()) return { value: hit.value, cached: true };
      let pending = inFlight.get(key);
      const shared = Boolean(pending);
      if (!pending) {
        pending = produce().finally(() => inFlight.delete(key));
        inFlight.set(key, pending);
      }
      const value = await pending;
      // Failures are not cached, so a retry can succeed.
      if (!shared) stored.set(key, { value, expires: now() + options.ttlMs });
      return { value, cached: shared };
    },
  };
}
