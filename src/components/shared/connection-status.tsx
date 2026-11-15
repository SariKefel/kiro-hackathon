"use client";
import { CloudOff, RefreshCw, Wifi, WifiOff } from "lucide-react";
import { useOffline } from "@/features/sync/offline-provider";

export function ConnectionStatus({ detailed = false }: { detailed?: boolean }) {
  const { online, ready, pending, syncing, sync, storageError, shellError } = useOffline();
  const Icon = online === false ? WifiOff : Wifi;
  return (
    <div className="space-y-2 text-xs">
      <div className="flex flex-wrap items-center gap-2.5" role="status">
        <span className="inline-flex items-center gap-1.5">
          <Icon className="size-3.5" />
          {online === null ? "Checking connection" : online ? "Device online" : "Offline"}
        </span>
        {detailed && (
          <>
            <span className="text-border">|</span>
            <span className="inline-flex items-center gap-1.5">
              <CloudOff className="size-3.5" />
              {ready ? `${pending} pending` : "Reading local reports"}
            </span>
            <button
              type="button"
              disabled={!online || syncing || !ready || Boolean(storageError)}
              onClick={() => void sync(true)}
              className="inline-flex min-h-8 items-center gap-1 font-medium text-primary disabled:opacity-50 dark:text-teal-300"
            >
              <RefreshCw className={`size-3.5 ${syncing ? "animate-spin" : ""}`} />
              {syncing ? "Synchronizing" : "Retry sync"}
            </button>
          </>
        )}
      </div>
      {detailed && storageError && (
        <p role="alert" className="text-red-700 dark:text-red-300">
          {storageError}
        </p>
      )}
      {detailed && shellError && (
        <p role="alert" className="text-amber-800 dark:text-amber-300">
          {shellError}
        </p>
      )}
    </div>
  );
}
