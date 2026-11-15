"use client";

import { useCallback, useEffect, useRef, useState, useSyncExternalStore } from "react";
import useSWR from "swr";
import { hazardResponseSchema } from "./validation";
import type { FeedSnapshot, HazardResponse } from "./types";

const KEY = "/api/hazards";
const FIVE_MINUTES = 300_000;
const subscribeHydration = () => () => {};
const clientSnapshot = () => true;
const serverSnapshot = () => false;

function active() {
  return typeof document !== "undefined" && !document.hidden && navigator.onLine;
}

export function useHazards(onResponse?: (response: HazardResponse) => void) {
  const hydrated = useSyncExternalStore(subscribeHydration, clientSnapshot, serverSnapshot);
  const previous = useRef(new Map<string, FeedSnapshot>());
  const pending = useRef<AbortController | null>(null);
  const retryTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const failures = useRef(0);
  const [lastManual, setLastManual] = useState(0);
  const [now, setNow] = useState(0);
  const [online, setOnline] = useState(true);
  const [visible, setVisible] = useState(true);

  const fetcher = useCallback(async () => {
    const controller = new AbortController();
    pending.current = controller;
    const timeout = setTimeout(() => controller.abort(), 15_000);
    try {
      const response = await fetch(KEY, { cache: "no-store", signal: controller.signal });
      if (response.status !== 200 && response.status !== 503) {
        throw new Error("The report service could not be reached.");
      }
      const text = await response.text();
      if (new TextEncoder().encode(text).length > 512 * 1024) {
        throw new Error("The report service returned an oversized response.");
      }
      const parsed = hazardResponseSchema.safeParse(JSON.parse(text));
      if (!parsed.success) throw new Error("The report service returned an unreadable response.");
      const incoming = parsed.data as HazardResponse;
      failures.current = incoming.availability === "unavailable" ? failures.current + 1 : 0;
      return {
        ...incoming,
        feeds: incoming.feeds.map((feed) => {
          if (feed.status !== "unavailable") {
            previous.current.set(feed.id, feed);
            return feed;
          }
          const retained = previous.current.get(feed.id);
          return retained
            ? {
                ...retained,
                status: "retained" as const,
                problem: feed.problem,
                retryAfter: feed.retryAfter,
              }
            : feed;
        }),
      };
    } catch {
      failures.current += 1;
      throw new Error(
        "Reports could not be refreshed. Previously loaded reports remain available.",
      );
    } finally {
      clearTimeout(timeout);
      if (pending.current === controller) pending.current = null;
    }
  }, []);

  const { data, error, isLoading, isValidating, mutate } = useSWR<HazardResponse, Error>(
    hydrated ? KEY : null,
    fetcher,
    {
      refreshInterval: () =>
        failures.current
          ? Math.min(FIVE_MINUTES, 30_000 * 2 ** Math.min(failures.current - 1, 4))
          : FIVE_MINUTES,
      onSuccess: (response) => onResponse?.(response),
      refreshWhenHidden: false,
      refreshWhenOffline: false,
      revalidateOnFocus: true,
      revalidateOnReconnect: true,
      focusThrottleInterval: 15_000,
      dedupingInterval: 15_000,
      isPaused: () => !active(),
      onErrorRetry: (_error, _key, _config, revalidate, options) => {
        if (retryTimer.current) clearTimeout(retryTimer.current);
        retryTimer.current = setTimeout(
          () => {
            if (active()) void revalidate(options);
          },
          Math.min(FIVE_MINUTES, 30_000 * 2 ** Math.min(options.retryCount - 1, 4)),
        );
      },
    },
  );

  useEffect(() => {
    const update = () => {
      setNow(Date.now());
      setOnline(navigator.onLine);
      setVisible(!document.hidden);
      if (!active()) pending.current?.abort();
    };
    const timer = setInterval(update, 1_000);
    window.addEventListener("online", update);
    window.addEventListener("offline", update);
    document.addEventListener("visibilitychange", update);
    update();
    return () => {
      clearInterval(timer);
      if (retryTimer.current) clearTimeout(retryTimer.current);
      pending.current?.abort();
      window.removeEventListener("online", update);
      window.removeEventListener("offline", update);
      document.removeEventListener("visibilitychange", update);
    };
  }, []);

  const retry = useCallback(() => {
    const time = Date.now();
    if (!active() || time - lastManual < 15_000 || pending.current) return;
    setLastManual(time);
    setNow(time);
    void mutate();
  }, [mutate, lastManual]);

  return {
    data,
    error,
    isLoading: !hydrated || isLoading,
    isRefreshing: hydrated && isValidating,
    now,
    online,
    visible,
    retry,
    retryIn: Math.max(0, Math.ceil((lastManual + 15_000 - now) / 1_000)),
  };
}
