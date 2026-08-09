import type { AuthNamespace } from "./refresh";

export interface AuthNamespaceConfig {
  readonly namespace: AuthNamespace;
  readonly audience: "kidthink:user" | "kidthink:manager";
  readonly issuer: "kidthink:web" | "kidthink:admin";
  readonly accessCookieName: "kidthink-user-access" | "kidthink-manager-access";
  readonly refreshCookieName: "tm_u_rt" | "tm_m_rt";
  readonly csrfCookieName: "tm_u_csrf" | "tm_m_csrf";
  readonly refreshPath:
    | "/api/users/auth/refresh"
    | "/api/managers/auth/refresh";
  readonly refreshTtlSeconds: number;
}

const CONFIGS: Readonly<Record<AuthNamespace, AuthNamespaceConfig>> = {
  user: {
    namespace: "user",
    audience: "kidthink:user",
    issuer: "kidthink:web",
    accessCookieName: "kidthink-user-access",
    refreshCookieName: "tm_u_rt",
    csrfCookieName: "tm_u_csrf",
    refreshPath: "/api/users/auth/refresh",
    refreshTtlSeconds: 7 * 24 * 60 * 60,
  },
  manager: {
    namespace: "manager",
    audience: "kidthink:manager",
    issuer: "kidthink:admin",
    accessCookieName: "kidthink-manager-access",
    refreshCookieName: "tm_m_rt",
    csrfCookieName: "tm_m_csrf",
    refreshPath: "/api/managers/auth/refresh",
    refreshTtlSeconds: 24 * 60 * 60,
  },
};

export function getAuthNamespaceConfig(
  namespace: AuthNamespace
): AuthNamespaceConfig {
  return CONFIGS[namespace];
}
