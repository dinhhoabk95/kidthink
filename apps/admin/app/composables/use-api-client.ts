import { normalizeApiError } from "@mindkid/errors/client";
import {
  $fetch,
  navigateTo,
  useAsyncData,
  useRuntimeConfig,
  useState,
} from "#imports";

type ApiRequestBody =
  | string
  | number
  | boolean
  | null
  | undefined
  | FormData
  | URLSearchParams
  | Blob
  | ArrayBuffer
  | Record<string, string | number | boolean | null | undefined | object>
  | (string | number | boolean | null | undefined | object)[];

type ApiOptionValue =
  | string
  | number
  | boolean
  | null
  | undefined
  | object
  | ApiRequestBody;

interface ApiRequestOptions {
  method?: string;
  headers?: HeadersInit;
  body?: ApiRequestBody;
  query?: Record<string, string | number | boolean | null | undefined>;
  [key: string]: ApiOptionValue;
}

interface ManagerSessionResponse {
  manager: Record<
    string,
    string | number | boolean | null | undefined | object
  >;
  csrf_token: string;
}

const TRAILING_SLASH = /\/$/;
const LEADING_SLASH = /^\//;
const SAFE_METHODS = new Set(["GET", "HEAD", "OPTIONS"]);

function normalizeErrorPayload(
  payload: object | string | number | boolean | null | undefined
) {
  if (
    typeof payload === "object" &&
    payload !== null &&
    !("code" in payload) &&
    "status" in payload
  ) {
    const statusVal = Reflect.get(payload, "status");
    if (typeof statusVal === "string") {
      const challengeVal = Reflect.get(payload, "challenge");
      const mfaEnabledVal = Reflect.get(payload, "mfa_enabled");
      return {
        code: statusVal,
        message: "Vui lòng hoàn tất xác thực hai yếu tố.",
        details: {
          challenge: typeof challengeVal === "string" ? challengeVal : "",
          mfa_enabled: Boolean(mfaEnabledVal),
        },
      };
    }
  }
  return payload;
}

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
    const normalizedPath = `/${path.replace(LEADING_SLASH, "")}`;
    const isGuestRoute = normalizedPath.startsWith("/api/guest/");
    if (!(csrfToken.value || isSafeMethod || isGuestRoute)) {
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
      async onResponseError(context: {
        error?: object | string | number | boolean | null;
        response?: {
          status: number;
          statusText?: string;
          _data?: object | string | number | boolean | null;
        };
      }) {
        const responseData = context.response
          ? normalizeErrorPayload(context.response._data)
          : undefined;
        const rawError = context.response
          ? {
              status: context.response.status,
              statusCode: context.response.status,
              data: responseData,
              message: context.response.statusText,
            }
          : context.error;

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
