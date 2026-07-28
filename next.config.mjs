/** @type {import('next').NextConfig} */
const nextConfig = {
  transpilePackages: [
    "@yosseuf/shared-types",
    "@yosseuf/decision-engine",
    "@yosseuf/event-bus",
    "@yosseuf/core",
    "@yosseuf/services",
    "@yosseuf/intelligence",
    "@yosseuf/ui-tokens",
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
