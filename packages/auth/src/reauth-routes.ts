export interface SensitiveRouteDefinition {
  readonly method: "GET" | "POST" | "PUT" | "PATCH" | "DELETE";
  readonly path: string;
  readonly phase: "P1.14" | "P1.15" | "P2";
  readonly description: string;
}

/**
 * D-IJ: Canonical data declaration of sensitive routes requiring reauthentication within 5 minutes.
 * Gate enforces bidirectional consistency:
 * 1. Every route in this list (for active phase) MUST invoke requireReauth.
 * 2. Every route that invokes requireReauth MUST be declared in this list.
 */
export const SENSITIVE_REAUTH_ROUTES: readonly SensitiveRouteDefinition[] = [
  {
    method: "POST",
    path: "/api/users/password",
    phase: "P1.14",
    description: "Đổi mật khẩu người dùng (BR-ACS-01)",
  },
  {
    method: "PUT",
    path: "/api/users/password",
    phase: "P1.14",
    description:
      "Đặt mật khẩu lần đầu cho tài khoản chỉ có SNS (BR-ACS-01, BR-ACS-09)",
  },
  {
    method: "POST",
    path: "/api/users/email",
    phase: "P1.14",
    description: "Yêu cầu đổi địa chỉ email (BR-ACS-03)",
  },
  {
    method: "POST",
    path: "/api/users/account/delete",
    phase: "P1.14",
    description: "Yêu cầu xoá tài khoản và dữ liệu (BR-ADL-03)",
  },
  {
    method: "POST",
    path: "/api/users/social-identities",
    phase: "P1.15",
    description: "Liên kết tài khoản mạng xã hội (BR-SLK-01)",
  },
  {
    method: "DELETE",
    path: "/api/users/social-identities/:provider",
    phase: "P1.15",
    description: "Huỷ liên kết tài khoản mạng xã hội (BR-SLK-01)",
  },
] as const;

function matchRoutePath(pattern: string, actual: string): boolean {
  if (pattern === actual) {
    return true;
  }
  // Handle pattern with :param like /api/users/social-identities/:provider
  if (pattern.includes("/:")) {
    const patternParts = pattern.split("/");
    const actualParts = actual.split("/");
    if (patternParts.length !== actualParts.length) {
      return false;
    }
    return patternParts.every(
      (part, idx) => part.startsWith(":") || part === actualParts[idx]
    );
  }
  return false;
}

export function isSensitiveReauthRoute(
  method: string,
  path: string,
  includeFuturePhases = false
): boolean {
  const normMethod = method.toUpperCase();
  return SENSITIVE_REAUTH_ROUTES.some((route) => {
    if (
      !includeFuturePhases &&
      route.phase !== "P1.14" &&
      route.phase !== "P1.15"
    ) {
      return false;
    }
    return route.method === normMethod && matchRoutePath(route.path, path);
  });
}
