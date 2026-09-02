import { getApiUrl } from "@/lib/config";
import { ApiError } from "@/types/api";

import { clearSession, getSession, setSession } from "./session";

type Json = Record<string, unknown> | unknown[] | null;

interface RequestOptions extends Omit<RequestInit, "body"> {
  body?: unknown;
  auth?: boolean;
  retry?: boolean;
}

function parseDetail(payload: unknown): { code: string; message: string } {
  if (payload && typeof payload === "object" && "detail" in payload) {
    const detail = (payload as { detail: unknown }).detail;
    if (typeof detail === "string") return { code: "error", message: detail };
    if (Array.isArray(detail) && detail[0] && typeof detail[0] === "object") {
      const first = detail[0] as { msg?: string };
      return { code: "validation_error", message: String(first.msg ?? "Validation error") };
    }
    if (detail && typeof detail === "object") {
      const rec = detail as { code?: string; message?: string };
      return {
        code: rec.code ?? "error",
        message: rec.message ?? "Request failed",
      };
    }
  }
  return { code: "error", message: "Request failed" };
}

async function refreshAccessToken(): Promise<boolean> {
  const { refreshToken } = getSession();
  if (!refreshToken) return false;
  const response = await fetch(getApiUrl("/auth/refresh"), {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ refresh_token: refreshToken }),
  });
  if (!response.ok) {
    clearSession();
    return false;
  }
  const data = (await response.json()) as {
    access_token: string;
    refresh_token: string;
    user?: { default_workspace_id?: string | null };
  };
  setSession({
    accessToken: data.access_token,
    refreshToken: data.refresh_token,
    workspaceId: data.user?.default_workspace_id ?? getSession().workspaceId,
  });
  return true;
}

let refreshInFlight: Promise<boolean> | null = null;

function refreshOnce() {
  if (!refreshInFlight) {
    refreshInFlight = refreshAccessToken().finally(() => {
      refreshInFlight = null;
    });
  }
  return refreshInFlight;
}

export async function apiRequest<T>(path: string, options: RequestOptions = {}): Promise<T> {
  const { body, auth = true, retry = true, headers, signal, ...rest } = options;
  const session = getSession();
  const requestHeaders = new Headers(headers);
  if (body !== undefined) requestHeaders.set("Content-Type", "application/json");
  if (auth && session.accessToken) {
    requestHeaders.set("Authorization", `Bearer ${session.accessToken}`);
  }
  if (auth && session.workspaceId) {
    requestHeaders.set("X-Workspace-Id", session.workspaceId);
  }

  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), 15_000);
  if (signal?.aborted) {
    clearTimeout(timer);
    controller.abort();
  } else {
    signal?.addEventListener("abort", () => controller.abort(), { once: true });
  }

  let response: Response;
  try {
    response = await fetch(getApiUrl(path), {
      ...rest,
      signal: controller.signal,
      headers: requestHeaders,
      body: body === undefined ? undefined : JSON.stringify(body),
      cache: "no-store",
    });
  } catch (error) {
    if (controller.signal.aborted) {
      throw new ApiError(0, "timeout", "The API did not respond. Check MONGODB_URI on Vercel and try again.");
    }
    throw error;
  } finally {
    clearTimeout(timer);
  }

  if (response.status === 401 && auth && retry) {
    const refreshed = await refreshOnce();
    if (refreshed) {
      return apiRequest<T>(path, { ...options, retry: false });
    }
  }

  if (!response.ok) {
    let payload: unknown = null;
    try {
      payload = await response.json();
    } catch {
      payload = null;
    }
    const parsed = parseDetail(payload);
    const serverDown = response.status >= 500 && (!payload || parsed.message === "Request failed");
    throw new ApiError(
      response.status,
      parsed.code,
      serverDown
        ? "The API could not start. Add MONGODB_URI (MongoDB Atlas) in Vercel Project Settings → Environment Variables."
        : parsed.message,
    );
  }

  if (response.status === 204) return undefined as T;
  return (await response.json()) as T;
}

export async function apiRequestMaybe<T>(path: string, options?: RequestOptions): Promise<T | null> {
  try {
    return await apiRequest<T>(path, options);
  } catch {
    return null;
  }
}

export type { Json };
