export type PlatformEnvironment = "development" | "preview" | "production" | "test";

export type PlatformConfig = {
  environment: PlatformEnvironment;
  supabaseUrl?: string;
  supabasePublishableKey?: string;
  aiGatewayUrl?: string;
  digitalHumanGatewayUrl?: string;
};

export function loadPlatformConfig(env: NodeJS.ProcessEnv = process.env): PlatformConfig {
  const environment = (env.VERCEL_ENV ?? env.NODE_ENV ?? "development") as PlatformEnvironment;
  return {
    environment,
    supabaseUrl: env.NEXT_PUBLIC_SUPABASE_URL,
    supabasePublishableKey: env.NEXT_PUBLIC_SUPABASE_ANON_KEY,
    aiGatewayUrl: env.YOSSEUF_AI_GATEWAY_URL,
    digitalHumanGatewayUrl: env.YOSSEUF_DIGITAL_HUMAN_GATEWAY_URL,
  };
}

export function assertPlatformRuntimeConfig(config: PlatformConfig) {
  if (!config.supabaseUrl || !config.supabasePublishableKey) {
    throw new Error("Platform database configuration is incomplete.");
  }
  return config as PlatformConfig & { supabaseUrl: string; supabasePublishableKey: string };
}
