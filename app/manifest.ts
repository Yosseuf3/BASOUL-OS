import type { MetadataRoute } from "next";

export default function manifest(): MetadataRoute.Manifest {
  return {
    name: "BASOUL OS",
    short_name: "BASOUL",
    description: "Unified organization-aware platform for BASOUL business modules.",
    start_url: "/",
    display: "standalone",
    background_color: "#080b0d",
    theme_color: "#2563EB",
    orientation: "portrait-primary",
    lang: "ar",
    dir: "rtl",
    icons: [
      { src: "/icons/basoul-192.png", sizes: "192x192", type: "image/png", purpose: "any" },
      { src: "/icons/basoul-512.png", sizes: "512x512", type: "image/png", purpose: "maskable" },
    ],
  };
}
