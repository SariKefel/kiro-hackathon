import type { MetadataRoute } from "next";

export default function manifest(): MetadataRoute.Manifest {
  return {
    name: "RescueSync",
    short_name: "RescueSync",
    description: "Offline-first disaster response and personnel accountability. Phase 1 demo.",
    start_url: "/responder",
    scope: "/",
    display: "standalone",
    // Hex mirrors of --color-paper and --color-chrome; the manifest cannot read CSS tokens.
    background_color: "#f5f2eb",
    theme_color: "#1c1a17",
    icons: [
      { src: "/icon-192.png", sizes: "192x192", type: "image/png", purpose: "any" },
      { src: "/icon-512.png", sizes: "512x512", type: "image/png", purpose: "any" },
      { src: "/icon-maskable.png", sizes: "512x512", type: "image/png", purpose: "maskable" },
    ],
  };
}
