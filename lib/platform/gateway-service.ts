import type { PlatformModuleId } from "@yosseuf/platform";
import { loadPlatformConfig } from "@yosseuf/platform";

export type GatewayStatus = { gateway: PlatformModuleId; configured: boolean; reachable: boolean; status: "ready" | "unconfigured" | "degraded" };

export async function readGatewayStatus(gateway: "ai-core" | "digital-human"): Promise<GatewayStatus> {
  const config = loadPlatformConfig();
  const endpoint = gateway === "ai-core" ? config.aiGatewayUrl : config.digitalHumanGatewayUrl;
  if (!endpoint) return { gateway, configured: false, reachable: false, status: "unconfigured" };
  try {
    const url = new URL("/health", endpoint);
    if (url.protocol !== "https:") return { gateway, configured: true, reachable: false, status: "degraded" };
    const response = await fetch(url, { method: "GET", cache: "no-store", signal: AbortSignal.timeout(3000) });
    return { gateway, configured: true, reachable: response.ok, status: response.ok ? "ready" : "degraded" };
  } catch {
    return { gateway, configured: true, reachable: false, status: "degraded" };
  }
}
