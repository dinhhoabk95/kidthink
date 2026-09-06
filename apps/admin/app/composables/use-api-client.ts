import { normalizeApiError } from "@mindkid/errors/client";
import {
  $fetch,
  navigateTo,
  useAsyncData,
  useRuntimeConfig,
  useState,
} from "#imports";

interface ApiRequestOptions {
  method?: string;
  headers?: HeadersInit;
  body?: unknown;
  query?: Record<string, unknown>;
  [key: string]: unknown;
}

interface ManagerSessionResponse {
  manager: Record<string, unknown>;
  csrf_token: string;
}

const TRAILING_SLASH = /\/$/;
const LEADING_SLASH = /^\//;
const SAFE_METHODS = new Set(["GET", "HEAD", "OPTIONS"]);

/**
 * BR-ARB-04: admin chạy trên `admin.{domain}` — một host tĩnh không có `/api`.
 * Mọi URL API, kể cả `href`, `src` và `window.open`, phải đi qua đây; URL tương
 * đối sẽ trỏ ngược về chính host tĩnh và trả 404.
 */
export function apiUrl(path: string): string {
  const config = useRuntimeConfig();
  const baseUrl = String(config.public.apiBaseUrl || "").replace(
    TRAILING_SLASH,
    ""
  );
  if (!baseUrl) {
    throw new Error("NUXT_PUBLIC_API_BASE_URL is not configured");
  }
  return `${baseUrl}/${path.replace(LEADING_SLASH, "")}`;
}

let loadingSession: Promise<void> | undefined;

export function useApiClient() {
  const csrfToken = useState<string | undefined>("admin-csrf-token");

  function loadSession(): Promise<void> {
    if (loadingSession) {
      return loadingSession;
    }

    const sessionPromise = $fetch<ManagerSessionResponse>(
      apiUrl("/api/managers/auth/session"),
      { credentials: "include" }
    )
      .then((response: ManagerSessionResponse) => {
        csrfToken.value = response.csrf_token;
      })
      .catch(() => {
        csrfToken.value = undefined;
      })
      .finally(() => {
        loadingSession = undefined;
      });

    loadingSession = sessionPromise;
    return sessionPromise;
  }

  async function request<T>(
    path: string,
    options: ApiRequestOptions = {}
  ): Promise<T> {
    const method = String(options.method || "GET").toUpperCase();
    const isSafeMethod = SAFE_METHODS.has(method);
    if (!(csrfToken.value || isSafeMethod)) {
      await loadSession();
    }

    const headers = new Headers(options.headers);
    if (csrfToken.value && !isSafeMethod) {
      headers.set("x-csrf-token", csrfToken.value);
    }

    return $fetch<T>(apiUrl(path), {
      ...options,
      credentials: "include",
      headers,
      async onResponseError(context) {
        const rawError =
          context.error ??
          (context.response
            ? {
                status: context.response.status,
                statusCode: context.response.status,
                data: context.response._data,
                message: context.response.statusText,
              }
            : undefined);

        const apiError = normalizeApiError(rawError);

        if (
          apiError.code === "UNAUTHENTICATED" ||
          apiError.code === "SESSION_REVOKED"
        ) {
          csrfToken.value = undefined;
          await navigateTo("/login");
        }

        throw apiError;
      },
    } as never);
  }

  return {
    request,
    loadSession,
    get: <T>(path: string, options?: ApiRequestOptions) =>
      request<T>(path, { ...options, method: "GET" }),
    post: <T>(path: string, options?: ApiRequestOptions) =>
      request<T>(path, { ...options, method: "POST" }),
    put: <T>(path: string, options?: ApiRequestOptions) =>
      request<T>(path, { ...options, method: "PUT" }),
    patch: <T>(path: string, options?: ApiRequestOptions) =>
      request<T>(path, { ...options, method: "PATCH" }),
    delete: <T>(path: string, options?: ApiRequestOptions) =>
      request<T>(path, { ...options, method: "DELETE" }),
  };
}

export function apiFetch<T>(path: string, options?: ApiRequestOptions) {
  return useApiClient().request<T>(path, options);
}

export function useApiFetch<T>(
  path: string,
  options: ApiRequestOptions & { lazy?: boolean; key?: string } = {}
) {
  const { lazy, key, ...requestOptions } = options;
  const api = useApiClient();
  return useAsyncData<T>(
    key || `admin-api:${path}`,
    () => api.request<T>(path, requestOptions),
    { lazy }
  );
}
