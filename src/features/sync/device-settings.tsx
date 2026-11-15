"use client";
import { useTheme } from "next-themes";
import { Monitor, Moon, Sun } from "lucide-react";
import { useOffline } from "@/features/sync/offline-provider";
import { ConnectionStatus } from "@/components/shared/connection-status";

export function DeviceSettings() {
  const { setTheme } = useTheme();
  const { ready, pending } = useOffline();
  return (
    <div data-tour="device-settings" className="grid gap-5 lg:grid-cols-2">
      <section className="panel p-6">
        <h2 className="section-heading">Appearance</h2>
        <p className="mt-2 muted">Choose the most readable view for your environment.</p>
        <div className="mt-5 grid grid-cols-3 gap-3">
          {[
            { value: "light", label: "Light", icon: Sun },
            { value: "dark", label: "Dark", icon: Moon },
            { value: "system", label: "System", icon: Monitor },
          ].map(({ value, label, icon: Icon }) => (
            <button
              type="button"
              key={value}
              onClick={() => setTheme(value)}
              className="flex min-h-24 flex-col items-center justify-center gap-2 rounded-lg border bg-secondary/30 text-xs font-medium hover:border-primary focus:border-primary"
            >
              <Icon className="size-5" />
              {label}
            </button>
          ))}
        </div>
        <p className="mt-4 text-xs text-muted-foreground">
          Your theme preference is saved on this device.
        </p>
      </section>
      <section className="panel p-6">
        <h2 className="section-heading">This device</h2>
        <p className="mb-5 mt-2 muted">
          {ready
            ? `${pending} report${pending === 1 ? "" : "s"} awaiting server confirmation.`
            : "Reading local reports..."}
        </p>
        <ConnectionStatus detailed />
        <p className="mt-4 text-xs leading-6 text-muted-foreground">
          Demo reports stay in this browser&apos;s IndexedDB. Clearing site data removes them.
          Browser storage may be evicted; this phase does not guarantee emergency delivery.
        </p>
      </section>
    </div>
  );
}
