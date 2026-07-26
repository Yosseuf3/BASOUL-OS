import type { MetadataRoute } from "next";

export default function manifest(): MetadataRoute.Manifest {
  return {
    name: "YOSSEUF OS",
    short_name: "YOSSEUF OS",
    description: "Executive operating system for architectural workspaces.",
    start_url: "/",
    display: "standalone",
    background_color: "#080b0d",
    theme_color: "#d7ad43",
    orientation: "portrait-primary",
    lang: "ar",
    dir: "rtl",
    icons: [
      { src: "/icons/yosseuf-os-192.svg", sizes: "192x192", type: "image/svg+xml", purpose: "any" },
      { src: "/icons/yosseuf-os-512.svg", sizes: "512x512", type: "image/svg+xml", purpose: "any maskable" },
    ],
  };
}
