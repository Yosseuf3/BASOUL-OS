import { Linking } from "react-native";
import type { SupabaseClient } from "@supabase/supabase-js";

export const MOBILE_AUTH_CALLBACK = "yosseufos://auth/callback";

type AuthUrlResult =
  | { handled: false }
  | { handled: true; error?: string };

function readUrlValue(url: string, key: string): string | null {
  const escapedKey = key.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
  const match = url.match(new RegExp(`[?#&]${escapedKey}=([^&#]*)`));
  return match ? decodeURIComponent(match[1].replace(/\+/g, " ")) : null;
}

/**
 * Completes a Supabase email-link login after the operating system opens
 * yosseufos://auth/callback in the mobile app.
 */
export async function completeMobileAuthUrl(
  client: SupabaseClient,
  url: string,
): Promise<AuthUrlResult> {
  if (!url.startsWith(MOBILE_AUTH_CALLBACK)) return { handled: false };

  const authError = readUrlValue(url, "error_description") ?? readUrlValue(url, "error");
  if (authError) return { handled: true, error: authError };

  const code = readUrlValue(url, "code");
  if (code) {
    const { error } = await client.auth.exchangeCodeForSession(code);
    return { handled: true, error: error?.message };
  }

  const accessToken = readUrlValue(url, "access_token");
  const refreshToken = readUrlValue(url, "refresh_token");
  if (accessToken && refreshToken) {
    const { error } = await client.auth.setSession({
      access_token: accessToken,
      refresh_token: refreshToken,
    });
    return { handled: true, error: error?.message };
  }

  return {
    handled: true,
    error: "رابط تسجيل الدخول غير مكتمل أو انتهت صلاحيته. اطلب رابطًا جديدًا.",
  };
}

export async function getInitialAuthUrl(): Promise<string | null> {
  return Linking.getInitialURL();
}
