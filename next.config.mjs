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
};

export default nextConfig;
