"use client";
import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useRef,
  useState,
  useSyncExternalStore,
} from "react";
import { retireDevelopmentWorker } from "./service-worker";
import { liveQuery } from "dexie";
import { offlineDb, type QueuedOperation } from "@/lib/offline/database";
import { retryPending, synchronizeQueue } from "@/features/check-ins/queue";

function subscribeOnline(listener: () => void) {
  window.addEventListener("online", listener);
  window.addEventListener("offline", listener);
  return () => {
    window.removeEventListener("online", listener);
    window.removeEventListener("offline", listener);
  };
}
interface OfflineState {
  online: boolean | null;
  operations: QueuedOperation[];
  ready: boolean;
  pending: number;
  syncing: boolean;
  storageError: string | null;
  sync: (manual?: boolean) => Promise<void>;
  shellError: string | null;
}
const OfflineContext = createContext<OfflineState | null>(null);

export function OfflineProvider({ children }: { children: React.ReactNode }) {
  const online = useSyncExternalStore(
    subscribeOnline,
    () => navigator.onLine,
    () => null,
  );
  const [operations, setOperations] = useState<QueuedOperation[]>([]);
  const [ready, setReady] = useState(false);
  const [storageError, setStorageError] = useState<string | null>(null);
  const [shellError, setShellError] = useState<string | null>(null);
  const [syncing, setSyncing] = useState(false);
  const running = useRef(false);
  const sync = useCallback(async (manual = false) => {
    if (running.current || !navigator.onLine) return;
    running.current = true;
    setSyncing(true);
    try {
      if (manual) await retryPending();
      await synchronizeQueue();
    } catch {
      setStorageError(
        "Device storage is unavailable. Enable browser storage and reload before checking in.",
      );
    } finally {
      running.current = false;
      setSyncing(false);
    }
  }, []);
  useEffect(() => {
    const subscription = liveQuery(() =>
      offlineDb.outbox.orderBy("clientRecordedAt").reverse().toArray(),
    ).subscribe({
      next: (items) => {
        setOperations(items);
        setReady(true);
      },
      error: () => {
        setReady(true);
        setStorageError(
          "Device storage is unavailable. Enable browser storage and reload before checking in.",
        );
      },
    });
    if (process.env.NODE_ENV === "production" && "serviceWorker" in navigator) {
      navigator.serviceWorker
        .register("/sw.js", { updateViaCache: "none" })
        .catch(() =>
          setShellError(
            "Offline page preparation failed. Keep this page open to check in offline.",
          ),
        );
    }
    if (process.env.NODE_ENV === "development" && "serviceWorker" in navigator) {
      void retireDevelopmentWorker()
        .then((wasControlled) => {
          // Unregistering does not release the current document's controller.
          // Reload once so its client modules come directly from the dev server.
          if (wasControlled) window.location.reload();
        })
        .catch(() =>
          setShellError(
            "Could not reset the development offline cache. Close other RescueSync tabs and reload.",
          ),
        );
    }
    return () => subscription.unsubscribe();
  }, []);
  useEffect(() => {
    if (!online) return;
    const start = window.setTimeout(() => void sync(), 0);
    const interval = window.setInterval(() => void sync(), 15_000);
    const onFocus = () => void sync();
    window.addEventListener("focus", onFocus);
    return () => {
      clearTimeout(start);
      clearInterval(interval);
      window.removeEventListener("focus", onFocus);
    };
  }, [online, sync]);
  return (
    <OfflineContext.Provider
      value={{
        online,
        operations,
        ready,
        pending: operations.filter((op) => op.status !== "confirmed").length,
        syncing,
        storageError,
        sync,
        shellError,
      }}
    >
      {children}
    </OfflineContext.Provider>
  );
}
export function useOffline() {
  const context = useContext(OfflineContext);
  if (!context) throw new Error("useOffline requires OfflineProvider");
  return context;
}
