import type { Metadata, Viewport } from "next";
import { Providers } from "@/components/shared/providers";
import "./globals.css";

export const metadata: Metadata = {
  title: { default: "RescueSync | Every person accounted for", template: "%s | RescueSync" },
  description:
    "Offline-first personnel accountability for disaster response. Phase 1 demonstration.",
  applicationName: "RescueSync",
  appleWebApp: { capable: true, statusBarStyle: "default", title: "RescueSync" },
};
export const viewport: Viewport = { width: "device-width", initialScale: 1, themeColor: "#142537" };
export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body>
        <a
          href="#main"
          className="sr-only fixed left-4 top-3 z-50 rounded bg-card p-3 focus:not-sr-only"
        >
          Skip to content
        </a>
        <Providers>{children}</Providers>
      </body>
    </html>
  );
}
