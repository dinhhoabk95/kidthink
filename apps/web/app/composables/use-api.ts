import { type ApiError, normalizeApiError } from "@mindkid/errors/client";
import { navigateTo, useRoute, useUserSession } from "#imports";
import { useCsrfHeaders } from "~/composables/use-csrf-fetch";

async function handleUnauthenticatedRedirect() {
  try {
    const { clear } = useUserSession();
    await clear();
  } catch {
    // Bỏ qua nếu session hook chưa sẵn sàng
  }

  let redirect = "";
  try {
    const route = useRoute();
    if (
      route?.fullPath &&
      route.fullPath !== "/login" &&
      !route.fullPath.startsWith("/login?")
    ) {
      redirect = `?redirect_to=${encodeURIComponent(route.fullPath)}`;
    }
  } catch {
    // Không có ngữ cảnh route
  }

  await navigateTo(`/login${redirect}`);
}

/**
 * Client API fetcher chuẩn hoá của `apps/web` — Task #254 (WP254.3).
 *
 * - `onRequest`: Gắn `x-csrf-token` qua `useCsrfHeaders()`.
 * - `onResponseError`: Chuẩn hoá sang `ApiError`, điều hướng theo mã lỗi
 *   cắt ngang (401/403/428), và LUÔN throw lại — ❌ NEVER nuốt lỗi ở interceptor.
 */
export function useApi() {
  return $fetch.create({
    onRequest({ options }) {
      try {
        const { headers } = useCsrfHeaders();
        const csrfHeaders = headers();
        options.headers = {
          ...options.headers,
          ...csrfHeaders,
        };
      } catch {
        // Bỏ qua nếu cookie CSRF chưa khởi tạo (request pre-auth hoặc guest)
      }
    },

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

      const apiError: ApiError = normalizeApiError(rawError);

      switch (apiError.code) {
        case "UNAUTHENTICATED":
        case "SESSION_REVOKED": {
          await handleUnauthenticatedRedirect();
          break;
        }

        case "CONSENT_REQUIRED": {
          await navigateTo("/consent-required");
          break;
        }

        case "NO_ACTIVE_CHILD": {
          await navigateTo("/me/children");
          break;
        }

        case "INTRO_REQUIRED": {
          // Không điều hướng toàn cục ở interceptor — call site (play/[code].vue)
          // tự xử lý hiển thị giao diện làm quen khái niệm và điều hướng tới bài intro tương ứng
          break;
        }

        case "RATE_LIMITED": {
          break;
        }

        default: {
          if (apiError.statusCode >= 500) {
            console.error("[api client telemetry 5xx]", {
              code: apiError.code,
              status: apiError.statusCode,
              url: context.request,
            });
          }
          break;
        }
      }

      // Luôn throw lại ApiError đã chuẩn hoá — ❌ NEVER nuốt lỗi ở interceptor
      throw apiError;
    },
  });
}
