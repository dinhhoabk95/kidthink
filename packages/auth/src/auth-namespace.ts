import type { AuthNamespace } from "./redis-session-store";

/**
 * Cấu hình theo namespace. Không còn cookie access/refresh: phiên là session
 * opaque trong Redis (`redis-session-store.ts`) cộng cookie remember-me, nên chỉ
 * còn CSRF cookie là thứ tầng HTTP phải biết tên.
 */
export interface AuthNamespaceConfig {
  readonly namespace: AuthNamespace;
  readonly csrfCookieName: "tm_u_csrf" | "tm_m_csrf";
}

const CONFIGS: Readonly<Record<AuthNamespace, AuthNamespaceConfig>> = {
  user: {
    namespace: "user",
    csrfCookieName: "tm_u_csrf",
  },
  manager: {
    namespace: "manager",
    csrfCookieName: "tm_m_csrf",
  },
};

export function getAuthNamespaceConfig(
  namespace: AuthNamespace
): AuthNamespaceConfig {
  return CONFIGS[namespace];
}
