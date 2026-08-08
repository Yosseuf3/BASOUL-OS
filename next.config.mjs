/** @type {import('next').NextConfig} */
const nextConfig = {
  transpilePackages: [
    "@yosseuf/shared-types",
    "@basoul/shared-types",
    "@yosseuf/decision-engine",
    "@basoul/decision-engine",
    "@yosseuf/event-bus",
    "@basoul/event-bus",
    "@yosseuf/core",
    "@basoul/core",
    "@yosseuf/services",
    "@basoul/services",
    "@yosseuf/intelligence",
    "@basoul/intelligence",
    "@yosseuf/ui-tokens",
    "@basoul/ui-tokens",
    "@yosseuf/platform",
    "@basoul/platform",
  ],
  async headers() {
    return [{
      source: "/(.*)",
      headers: [
        { key: "X-Content-Type-Options", value: "nosniff" },
        { key: "X-Frame-Options", value: "DENY" },
        { key: "Referrer-Policy", value: "strict-origin-when-cross-origin" },
        { key: "Permissions-Policy", value: "camera=(), microphone=(), geolocation=()" },
        { key: "Cross-Origin-Opener-Policy", value: "same-origin" },
      ],
    }];
  },
};

export default nextConfig;
