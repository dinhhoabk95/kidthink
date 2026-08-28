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

export function listApiRoutes(): ApiRoute[] {
  return listFiles(API_ROOT)
    .map(toRoute)
    .filter((route): route is ApiRoute => route !== null);
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
