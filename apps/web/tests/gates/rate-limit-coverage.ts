import { readdirSync, statSync } from "node:fs";
import { join, relative } from "node:path";
import { REPO_ROOT } from "@mindkid/config/paths";
import {
  RATE_LIMIT_CONFIGS,
  type RateLimitRouteResolution,
  resolveRateLimitRouteClass,
} from "@mindkid/shared";

const API_ROOT = join(REPO_ROOT, "apps/web/server/api");
const ROUTE_FILE = /\.(get|post|put|patch|delete)\.ts$/;
const DYNAMIC_SEGMENT = /^\[(\.\.\.)?(.+)\]$/;

export interface ApiRoute {
  readonly file: string;
  readonly path: string;
  readonly method: string;
}

function listFiles(dir: string): string[] {
  return readdirSync(dir).flatMap((entry) => {
    const full = join(dir, entry);
    return statSync(full).isDirectory() ? listFiles(full) : [full];
  });
}

/** `users/orders/[uuid]/proof.post.ts` → `POST /api/users/orders/x/proof`. */
function toRoute(file: string): ApiRoute | null {
  const rel = relative(API_ROOT, file);
  const match = ROUTE_FILE.exec(rel);
  if (!match) {
    return null;
  }
  const segments = rel.replace(ROUTE_FILE, "").split("/");
  const parts = segments
    .filter((segment, index) => !(segment === "index" && index > 0))
    .map((segment) => segment.replace(DYNAMIC_SEGMENT, "x"));
  return {
    file: rel,
    path: `/api/${parts.join("/")}`,
    method: (match[1] ?? "get").toUpperCase(),
  };
}

const BETTER_AUTH_USER_ENDPOINTS: ReadonlyArray<{
  readonly method: string;
  readonly subpath: string;
}> = [
  { method: "POST", subpath: "sign-in/email" },
  { method: "POST", subpath: "sign-up/email" },
  { method: "POST", subpath: "request-password-reset" },
  { method: "POST", subpath: "reset-password" },
  { method: "GET", subpath: "verify-email" },
  { method: "POST", subpath: "send-verification-email" },
  { method: "POST", subpath: "sign-in/social" },
  { method: "POST", subpath: "link-social" },
  { method: "GET", subpath: "callback/google" },
  { method: "POST", subpath: "two-factor/enable" },
  { method: "POST", subpath: "two-factor/verify-totp" },
  { method: "POST", subpath: "passkey/delete-passkey" },
  { method: "GET", subpath: "get-session" },
  { method: "GET", subpath: "list-sessions" },
  { method: "POST", subpath: "sign-out" },
];

const BETTER_AUTH_MANAGER_ENDPOINTS: ReadonlyArray<{
  readonly method: string;
  readonly subpath: string;
}> = [
  { method: "POST", subpath: "sign-in/email" },
  { method: "POST", subpath: "two-factor/verify-totp" },
  { method: "POST", subpath: "passkey/delete-passkey" },
  { method: "GET", subpath: "get-session" },
  { method: "POST", subpath: "sign-out" },
];

export function listApiRoutes(): ApiRoute[] {
  const allFiles = listFiles(API_ROOT);
  const discovered = allFiles
    .map(toRoute)
    .filter((route): route is ApiRoute => route !== null);

  for (const file of allFiles) {
    const rel = relative(API_ROOT, file);
    if (rel === "auth/users/[...all].ts") {
      for (const ep of BETTER_AUTH_USER_ENDPOINTS) {
        discovered.push({
          file: rel,
          path: `/api/auth/users/${ep.subpath}`,
          method: ep.method,
        });
      }
    } else if (rel === "auth/managers/[...all].ts") {
      for (const ep of BETTER_AUTH_MANAGER_ENDPOINTS) {
        discovered.push({
          file: rel,
          path: `/api/auth/managers/${ep.subpath}`,
          method: ep.method,
        });
      }
    }
  }

  return discovered;
}

export interface RouteClassCoverage {
  readonly resolutions: ReadonlyMap<string, RateLimitRouteResolution>;
  readonly coveredClasses: ReadonlySet<string>;
  readonly deadClasses: readonly string[];
}

/**
 * `BR-RTL-10` — mọi route giải ra một lớp hoặc một lý do miễn đã liệt kê, và mọi
 * lớp trong registry có ít nhất một route thật. Một lớp không route nào chạm là
 * hạn mức trên giấy: `export:data` từng khai 5 lượt/24h mà thực tế không giới hạn.
 */
export function computeRouteClassCoverage(
  routes: readonly ApiRoute[]
): RouteClassCoverage {
  const resolutions = new Map<string, RateLimitRouteResolution>();
  const coveredClasses = new Set<string>();

  for (const route of routes) {
    const resolution = resolveRateLimitRouteClass(route.path, route.method);
    resolutions.set(`${route.method} ${route.path}`, resolution);
    if (resolution.mode !== "exempt") {
      coveredClasses.add(resolution.className);
    }
  }

  const deadClasses = Object.keys(RATE_LIMIT_CONFIGS)
    .filter((className) => !coveredClasses.has(className))
    .sort();

  return { resolutions, coveredClasses, deadClasses };
}
