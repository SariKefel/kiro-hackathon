"use client";
import { ThemeProvider } from "next-themes";
import { OfflineProvider } from "@/features/sync/offline-provider";

export function Providers({ children }: { children: React.ReactNode }) {
  return (
    <ThemeProvider attribute="class" defaultTheme="light" enableSystem disableTransitionOnChange>
      <OfflineProvider>{children}</OfflineProvider>
    </ThemeProvider>
  );
}
