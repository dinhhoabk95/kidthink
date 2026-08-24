import { getCookie, type H3Event, type SessionConfig, useSession } from "h3";

export const USER_SESSION_COOKIE = "mindkid-user-session";
export const MANAGER_SESSION_COOKIE = "mindkid-manager-session";
export const SESSION_MAX_AGE_SECONDS = 60 * 60;

function getSessionPassword(): string {
  const password = process.env.NUXT_SESSION_PASSWORD;
  if (!password || new TextEncoder().encode(password).byteLength < 32) {
    throw new Error(
      "NUXT_SESSION_PASSWORD is not configured with at least 32 bytes"
    );
  }
  return password;
}

/**
 * Cấu hình cookie phiên User. `nuxt-auth-utils` đọc cùng giá trị này qua
 * `runtimeConfig.session` (`nuxt.config.ts` import hằng số ở trên), nên tên
 * cookie chỉ được khai một lần.
 */
export function getUserSessionConfig(): SessionConfig {
  return {
    name: USER_SESSION_COOKIE,
    password: getSessionPassword(),
    maxAge: SESSION_MAX_AGE_SECONDS,
    cookie: {
      httpOnly: true,
      path: "/",
      sameSite: "lax",
      secure: process.env.NODE_ENV === "production",
    },
  };
}

/**
 * BR-ARB-04: admin SPA ở `admin.{domain}` gọi API trên `{domain}`. Hai host
 * cùng registrable domain nên request là **same-site** dù khác origin —
 * `SameSite=Strict` vẫn được gửi trên XHR và trên điều hướng top-level
 * (`window.open` xem PDF/export). Giữ `strict` như cấu hình admin trước đây;
 * hạ xuống `lax` sẽ nới CSRF surface mà topology này không cần.
 */
export function getManagerSessionConfig(): SessionConfig {
  return {
    name: MANAGER_SESSION_COOKIE,
    password: getSessionPassword(),
    maxAge: SESSION_MAX_AGE_SECONDS,
    cookie: {
      httpOnly: true,
      path: "/",
      sameSite: "strict",
      secure: process.env.NODE_ENV === "production",
    },
  };
}

export function getManagerSessionToken(event: H3Event): string | undefined {
  return getCookie(event, MANAGER_SESSION_COOKIE);
}

export function getManagerSession(event: H3Event) {
  return useSession(event, getManagerSessionConfig());
}
