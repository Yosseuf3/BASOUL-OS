import type { PlatformModuleId } from "./registry";

export type PlatformApiMeta = {
  apiVersion: "2026-08-05";
  module: PlatformModuleId;
  organizationId?: string;
  requestId?: string;
  partial: boolean;
};

export type PlatformApiSuccess<T> = { ok: true; data: T; meta: PlatformApiMeta };
export type PlatformApiFailure = {
  ok: false;
  error: { code: string; message: string; retryable: boolean };
  meta: PlatformApiMeta;
};
export type PlatformApiEnvelope<T> = PlatformApiSuccess<T> | PlatformApiFailure;

export function apiMeta(module: PlatformModuleId, input: Partial<Omit<PlatformApiMeta, "apiVersion" | "module">> = {}): PlatformApiMeta {
  return { apiVersion: "2026-08-05", module, partial: false, ...input };
}
