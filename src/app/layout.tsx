import type { Metadata, Viewport } from "next";
import { Red_Hat_Display, Red_Hat_Mono, Red_Hat_Text } from "next/font/google";
import { Providers } from "@/components/shared/providers";
import "./globals.css";

// Self-hosted at build time, so the faces are same-origin static assets that work offline.
const display = Red_Hat_Display({
  subsets: ["latin"],
  weight: ["600"],
  variable: "--font-rh-display",
});
const text = Red_Hat_Text({
  subsets: ["latin"],
  weight: ["400", "500", "600"],
  variable: "--font-rh-text",
});
const mono = Red_Hat_Mono({
  subsets: ["latin"],
  weight: ["400", "500"],
  variable: "--font-rh-mono",
});

export const metadata: Metadata = {
  title: { default: "RescueSync | Every person accounted for", template: "%s | RescueSync" },
  description:
    "Offline-first personnel accountability for disaster response. Phase 1 demonstration.",
  applicationName: "RescueSync",
  appleWebApp: { capable: true, statusBarStyle: "default", title: "RescueSync" },
};
export const viewport: Viewport = { width: "device-width", initialScale: 1, themeColor: "#1c1a17" };
export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return (
    <html
      lang="en"
      suppressHydrationWarning
      className={`${display.variable} ${text.variable} ${mono.variable}`}
    >
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
