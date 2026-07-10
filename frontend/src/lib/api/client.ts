import { env } from "../../config/env";
import type { ApiEnvelope, ResponseMeta } from "./types";
import { authToken } from "./authToken";

export class ApiClientError extends Error {
  constructor(
    public status: number,
    public code: string,
    message: string,
    public details?: unknown,
    public requestId?: string
  ) {
    super(message);
    this.name = "ApiClientError";
  }
}

export interface RequestOptions extends Omit<RequestInit, "body"> {
  /** Auto-stringified JSON body. */
  json?: unknown;
  /** Raw body (e.g. FormData) — sent as-is, no Content-Type forced. */
  body?: BodyInit;
  /** Abort after N ms (default: 15s). */
  timeoutMs?: number;
  /** Skip the silent-refresh-and-retry on 401 (used by auth calls). */
  skipRefresh?: boolean;
  /** Internal: set once we've already retried after a refresh. */
  _retried?: boolean;
}

export interface ApiResult<T> {
  data: T;
  meta?: ResponseMeta;
}

async function execute<T>(path: string, options: RequestOptions): Promise<ApiResult<T>> {
  const { json, body, timeoutMs = 15_000, headers, signal, skipRefresh, _retried, ...init } = options;
  const url = path.startsWith("http") ? path : `${env.apiUrl}${path}`;
  const controller = new AbortController();
  let timedOut = false;
  const timer = setTimeout(() => {
    timedOut = true;
    controller.abort();
  }, timeoutMs);

  // Mirror a caller-supplied signal onto our controller, and always detach the
  // listener afterwards so a reused/long-lived signal can't accumulate them.
  const onExternalAbort = () => controller.abort();
  if (signal) {
    if (signal.aborted) controller.abort();
    else signal.addEventListener("abort", onExternalAbort);
  }

  const token = authToken.get();

  try {
    const res = await fetch(url, {
      ...init,
      credentials: "include",
      headers: {
        Accept: "application/json",
        ...(json !== undefined ? { "Content-Type": "application/json" } : {}),
        ...(token ? { Authorization: `Bearer ${token}` } : {}),
        ...(headers ?? {}),
      },
      body: json !== undefined ? JSON.stringify(json) : body,
      signal: controller.signal,
    });

    // Parse defensively: a proxy/gateway can return a non-JSON error page (e.g.
    // an HTML 502), and a successful 204 carries no body at all — neither should
    // surface as a bogus "network error" or "malformed envelope".
    const text = await res.text();
    let payload: ApiEnvelope<T> | null = null;
    if (text) {
      try {
        payload = JSON.parse(text) as ApiEnvelope<T>;
      } catch {
        payload = null;
      }
    }

    if (!res.ok || (payload && payload.success === false)) {
      const errorPayload = payload as Extract<ApiEnvelope<T>, { success: false }> | null;
      const code = errorPayload?.error?.code ?? "HTTP_ERROR";

      // Access token expired → silently refresh once and retry the request.
      if (res.status === 401 && !skipRefresh && !_retried) {
        const fresh = await authToken.refresh();
        if (fresh) {
          return execute<T>(path, { ...options, _retried: true });
        }
      }

      throw new ApiClientError(
        res.status,
        code,
        errorPayload?.error?.message ?? res.statusText ?? "Request failed",
        errorPayload?.error?.details,
        errorPayload?.meta?.requestId
      );
    }

    // Successful but empty body (e.g. 204 No Content) → no envelope to unwrap.
    if (!payload) {
      if (!text) return { data: null as T };
      throw new ApiClientError(res.status, "INVALID_RESPONSE", "Malformed response from server");
    }

    if (payload.success !== true) {
      throw new ApiClientError(res.status, "INVALID_RESPONSE", "Malformed response envelope from server");
    }

    return { data: payload.data, meta: payload.meta };
  } catch (err) {
    if (err instanceof ApiClientError) throw err;
    if (err instanceof DOMException && err.name === "AbortError") {
      if (timedOut) throw new ApiClientError(0, "TIMEOUT", `Request to ${url} timed out`);
      throw new ApiClientError(0, "ABORTED", "Request was cancelled");
    }
    throw new ApiClientError(0, "NETWORK_ERROR", err instanceof Error ? err.message : "Network error");
  } finally {
    clearTimeout(timer);
    signal?.removeEventListener("abort", onExternalAbort);
  }
}

/**
 * Low-level fetch wrapper. Resolves with the unwrapped `data` payload from the
 * server envelope; rejects with `ApiClientError`. Includes credentials so the
 * refresh cookie flows, injects the access token, and transparently refreshes
 * once on a 401.
 */
export async function request<T>(path: string, options: RequestOptions = {}): Promise<T> {
  const result = await execute<T>(path, options);
  return result.data;
}

/** Like `request`, but keeps the response `meta` (pagination, etc). */
export function requestPage<T>(path: string, options: RequestOptions = {}): Promise<ApiResult<T>> {
  return execute<T>(path, options);
}

export const api = {
  get: <T>(path: string, opts?: RequestOptions) => request<T>(path, { ...opts, method: "GET" }),
  post: <T>(path: string, json?: unknown, opts?: RequestOptions) =>
    request<T>(path, { ...opts, method: "POST", json }),
  put: <T>(path: string, json?: unknown, opts?: RequestOptions) =>
    request<T>(path, { ...opts, method: "PUT", json }),
  patch: <T>(path: string, json?: unknown, opts?: RequestOptions) =>
    request<T>(path, { ...opts, method: "PATCH", json }),
  delete: <T>(path: string, opts?: RequestOptions) => request<T>(path, { ...opts, method: "DELETE" }),
  /** Multipart POST — pass a FormData; the browser sets the boundary header. */
  postForm: <T>(path: string, form: FormData, opts?: RequestOptions) =>
    request<T>(path, { ...opts, method: "POST", body: form }),
  patchForm: <T>(path: string, form: FormData, opts?: RequestOptions) =>
    request<T>(path, { ...opts, method: "PATCH", body: form }),
};
