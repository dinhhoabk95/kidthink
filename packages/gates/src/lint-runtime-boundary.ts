import { existsSync, readdirSync, readFileSync } from "node:fs";
import { join, relative } from "node:path";
import { REPO_ROOT } from "@mindkid/config/paths";
import { walkSource } from "./lint-lib/source-scan.ts";

export type RuntimeBoundaryRule =
  | "BR-ARB-01"
  | "BR-ARB-02"
  | "BR-ARB-03"
  | "BR-ARB-04"
  | "BR-ARB-05"
  | "BR-ARB-06"
  | "BR-ARB-07"
  | "BR-ADA-01";

export interface RuntimeBoundaryViolation {
  file: string;
  line: number;
  rule: RuntimeBoundaryRule;
  message: string;
}

/** Mọi literal `/api/...`, không chỉ đối số đầu của `$fetch`. */
const API_LITERAL = /(["'`])\/api\//g;

/**
 * Chỉ những lời gọi này dựng URL tuyệt đối từ `runtimeConfig.public.apiBaseUrl`
 * (`apiUrl` và các method của `useApiClient`). Mọi chỗ khác — `$fetch`, `href`,
 * `src`, `window.open` — cầm literal tương đối và sẽ trỏ về chính host tĩnh.
 */
const ALLOWED_API_CALLERS = new Set([
  "apiUrl",
  "apiFetch",
  "useApiFetch",
  "request",
  "get",
  "post",
  "put",
  "patch",
  "delete",
]);

const USER_SESSION_IMPORT = /\buseUserSession\b/g;
const SERVER_AUTH_IMPORT =
  /from\s+["'](?:@mindkid\/(?:auth|db)|nuxt-auth-utils)["']/g;
const STATIC_SSR = /\bssr\s*:\s*false\b/;
const STATIC_BUILD = /nuxt\s+generate/;
const CORS_CREDENTIALS = /credentials\s*:\s*true/;
const CORS_ORIGIN_BLOCK = /origin\s*:\s*(\[[^\]]*\]|[^,\n]+)/;
const CORS_WILDCARD = /["'`]\*["'`]/;
const ROUTE_METHOD_SUFFIX = /\.(get|post|put|patch|delete|head|options)$/;
const ROUTE_EXTENSION = /\.(ts|js|mts|mjs)$/;
const WINDOWS_SEPARATOR = /\\/g;
const NGINX_SERVER_BLOCK = /^server\s*\{/m;
const NGINX_ADMIN_SERVER_NAME = /server_name\s+\$\{ADMIN_DOMAIN\}/;
const NGINX_PROXY_PASS = /proxy_pass/;
const NGINX_ROOT = /\broot\s/;
const NGINX_TRY_FILES = /try_files/;

function lineNumberAt(content: string, index: number): number {
  return content.slice(0, index).split("\n").length;
}

function toPosix(path: string): string {
  return path.split(WINDOWS_SEPARATOR).join("/");
}

const WHITESPACE = /\s/;
const IDENTIFIER_CHAR = /[\w$]/;

function skipBackWhile(
  content: string,
  start: number,
  pattern: RegExp
): number {
  let index = start;
  while (index >= 0 && pattern.test(content[index] as string)) {
    index -= 1;
  }
  return index;
}

/** Bỏ qua danh sách generic `<...>` lồng nhau, đi ngược từ dấu `>` đóng. */
function skipBackGeneric(content: string, start: number): number {
  let depth = 0;
  let index = start;
  while (index >= 0) {
    const char = content[index];
    if (char === ">") {
      depth += 1;
    } else if (char === "<") {
      depth -= 1;
      if (depth === 0) {
        return index - 1;
      }
    }
    index -= 1;
  }
  return start;
}

/**
 * Định danh của lời gọi bọc ngay trước literal. Đi ngược bằng tay chứ không
 * bằng regex vì generic lồng nhau — `apiFetch<{ items: Array<X> }>(` — không
 * biểu diễn được bằng biểu thức chính quy.
 */
function callerBefore(content: string, index: number): string | undefined {
  let cursor = skipBackWhile(content, index - 1, WHITESPACE);
  if (content[cursor] !== "(") {
    return undefined;
  }

  cursor = skipBackWhile(content, cursor - 1, WHITESPACE);
  if (content[cursor] === ">") {
    cursor = skipBackWhile(
      content,
      skipBackGeneric(content, cursor),
      WHITESPACE
    );
  }

  const end = cursor + 1;
  cursor = skipBackWhile(content, cursor, IDENTIFIER_CHAR);
  return content.slice(cursor + 1, end) || undefined;
}

export function scanAdminSource(
  file: string,
  content: string
): RuntimeBoundaryViolation[] {
  const violations: RuntimeBoundaryViolation[] = [];

  for (const match of content.matchAll(API_LITERAL)) {
    const caller = callerBefore(content, match.index);
    if (caller && ALLOWED_API_CALLERS.has(caller)) {
      continue;
    }
    violations.push({
      file,
      line: lineNumberAt(content, match.index),
      rule: "BR-ARB-04",
      message:
        "admin must build API URLs with apiUrl() or the API client, never a relative /api path",
    });
  }

  for (const match of content.matchAll(USER_SESSION_IMPORT)) {
    violations.push({
      file,
      line: lineNumberAt(content, match.index),
      rule: "BR-ARB-04",
      message: "admin must not use a server-owned Nuxt session composable",
    });
  }

  for (const match of content.matchAll(SERVER_AUTH_IMPORT)) {
    violations.push({
      file,
      line: lineNumberAt(content, match.index),
      rule: "BR-ARB-01",
      message:
        "admin must not import server auth, database, or Nuxt auth runtime",
    });
  }

  return violations;
}

/** `apps/web/server/api/managers/x.get.ts` → `/api/managers/x` */
function routePathOf(apiRoot: string, file: string): string {
  const relativeFile = toPosix(relative(apiRoot, file))
    .replace(ROUTE_EXTENSION, "")
    .replace(ROUTE_METHOD_SUFFIX, "");
  return `/api/${relativeFile}`;
}

interface RouteOwner {
  readonly app: string;
  readonly file: string;
}

function collectRouteOwners(root: string): Map<string, RouteOwner[]> {
  const owners = new Map<string, RouteOwner[]>();
  const appsDir = join(root, "apps");
  if (!existsSync(appsDir)) {
    return owners;
  }

  for (const dirent of readdirSync(appsDir, { withFileTypes: true })) {
    if (!dirent.isDirectory()) {
      continue;
    }
    const apiRoot = join(appsDir, dirent.name, "server", "api");
    if (!existsSync(apiRoot)) {
      continue;
    }
    for (const file of walkSource(apiRoot)) {
      const route = routePathOf(apiRoot, file);
      const found = owners.get(route) ?? [];
      owners.set(route, [
        ...found,
        { app: dirent.name, file: toPosix(relative(root, file)) },
      ]);
    }
  }

  return owners;
}

function checkAdminIsStatic(root: string): RuntimeBoundaryViolation[] {
  const violations: RuntimeBoundaryViolation[] = [];
  const adminRoot = join(root, "apps/admin");

  if (existsSync(join(adminRoot, "server"))) {
    violations.push({
      file: "apps/admin/server",
      line: 1,
      rule: "BR-ARB-01",
      message: "admin must not contain a Nitro server directory",
    });
  }

  const configPath = join(adminRoot, "nuxt.config.ts");
  const config = existsSync(configPath) ? readFileSync(configPath, "utf8") : "";
  if (!STATIC_SSR.test(config)) {
    violations.push({
      file: "apps/admin/nuxt.config.ts",
      line: 1,
      rule: "BR-ARB-03",
      message: "admin must disable SSR for static hosting",
    });
  }

  const packagePath = join(adminRoot, "package.json");
  const manifest = existsSync(packagePath)
    ? readFileSync(packagePath, "utf8")
    : "";
  if (!STATIC_BUILD.test(manifest)) {
    violations.push({
      file: "apps/admin/package.json",
      line: 1,
      rule: "BR-ARB-03",
      message: "admin production build must generate static assets",
    });
  }

  return violations;
}

function checkWebCors(root: string): RuntimeBoundaryViolation[] {
  const file = "apps/web/nuxt.config.ts";
  const configPath = join(root, file);
  const config = existsSync(configPath) ? readFileSync(configPath, "utf8") : "";
  const origin = CORS_ORIGIN_BLOCK.exec(config)?.[1] ?? "";

  // BR-ARB-05 có hai nửa: allowlist tường minh, và cấm `*` khi có credentials.
  // Kiểm sự có mặt của biến allowlist thôi thì `origin: ["*"]` vẫn lọt.
  if (
    !(config.includes("NUXT_ALLOWED_ORIGINS") && CORS_CREDENTIALS.test(config))
  ) {
    return [
      {
        file,
        line: 1,
        rule: "BR-ARB-05",
        message: "web API CORS must use an explicit credentials allowlist",
      },
    ];
  }

  if (CORS_WILDCARD.test(origin)) {
    return [
      {
        file,
        line: lineNumberAt(config, CORS_ORIGIN_BLOCK.exec(config)?.index ?? 0),
        rule: "BR-ARB-05",
        message:
          "web API CORS must not combine a wildcard origin with credentials",
      },
    ];
  }

  return [];
}

function checkAuthNamespace(root: string): RuntimeBoundaryViolation[] {
  const file = "apps/web/server/middleware/auth.ts";
  const middlewarePath = join(root, file);
  const middleware = existsSync(middlewarePath)
    ? readFileSync(middlewarePath, "utf8")
    : "";

  const selectsNamespace =
    middleware.includes("isManagerApiPath") &&
    middleware.includes("isUserApiPath");
  const setsBothContexts =
    middleware.includes("event.context.manager") &&
    middleware.includes("event.context.user");

  if (selectsNamespace && setsBothContexts) {
    return [];
  }

  return [
    {
      file,
      line: 1,
      rule: "BR-ARB-06",
      message: "web auth middleware must select one auth namespace by API path",
    },
  ];
}

function checkProxyServesAdminStatically(
  root: string
): RuntimeBoundaryViolation[] {
  const file = "infra/nginx/mindkid.conf.tmpl";
  const templatePath = join(root, file);
  if (!existsSync(templatePath)) {
    return [
      {
        file,
        line: 1,
        rule: "BR-ARB-07",
        message: "proxy template is missing; admin hosting cannot be verified",
      },
    ];
  }

  const template = readFileSync(templatePath, "utf8");
  const blocks = template.split(NGINX_SERVER_BLOCK).slice(1);
  const adminBlock = blocks.find((block) =>
    NGINX_ADMIN_SERVER_NAME.test(block)
  );

  if (!adminBlock) {
    return [
      {
        file,
        line: 1,
        rule: "BR-ARB-07",
        message: "proxy template has no server block for the admin domain",
      },
    ];
  }

  const line = lineNumberAt(template, template.indexOf(adminBlock));
  if (NGINX_PROXY_PASS.test(adminBlock)) {
    return [
      {
        file,
        line,
        rule: "BR-ARB-03",
        message: "admin domain must not proxy to a Node process",
      },
    ];
  }
  if (!(NGINX_ROOT.test(adminBlock) && NGINX_TRY_FILES.test(adminBlock))) {
    return [
      {
        file,
        line,
        rule: "BR-ARB-07",
        message:
          "admin domain must be served from disk with root and try_files",
      },
    ];
  }

  return [];
}

/**
 * Cùng một path ở hai method (`x.get.ts` + `x.post.ts`) là bình thường; cùng
 * một path ở **hai app** mới là drift mà BR-ARB-02 cấm.
 */
function checkSingleRouteOwner(root: string): RuntimeBoundaryViolation[] {
  const violations: RuntimeBoundaryViolation[] = [];

  for (const [route, owners] of collectRouteOwners(root)) {
    const apps = new Set(owners.map((owner) => owner.app));
    if (apps.size < 2) {
      continue;
    }
    const files = owners.map((owner) => owner.file);
    violations.push({
      file: files[0] as string,
      line: 1,
      rule: "BR-ARB-02",
      message: `route ${route} has more than one owner: ${files.join(", ")}`,
    });
  }

  return violations;
}

function checkPageBypassesAuth(file: string, isLoginPage: boolean): boolean {
  if (isLoginPage || !existsSync(file)) {
    return false;
  }
  const content = readFileSync(file, "utf8");
  return (
    content.includes("auth: false") || content.includes("middleware: false")
  );
}

function checkAdminAuthGuard(root: string): RuntimeBoundaryViolation[] {
  const violations: RuntimeBoundaryViolation[] = [];
  const adminApp = join(root, "apps/admin/app");
  if (!existsSync(adminApp)) {
    return violations;
  }

  const globalMiddlewarePath = join(adminApp, "middleware/auth.global.ts");
  const hasGlobalMiddleware = existsSync(globalMiddlewarePath);

  const pagesDir = join(adminApp, "pages");
  if (existsSync(pagesDir)) {
    for (const file of walkSource(pagesDir)) {
      const posixPath = toPosix(relative(root, file));
      const isLoginPage = posixPath.endsWith("pages/login.vue");

      if (!(hasGlobalMiddleware || isLoginPage)) {
        violations.push({
          file: posixPath,
          line: 1,
          rule: "BR-ADA-01",
          message:
            "admin page is unguarded because global auth middleware is missing",
        });
      }

      if (checkPageBypassesAuth(file, isLoginPage)) {
        violations.push({
          file: posixPath,
          line: 1,
          rule: "BR-ADA-01",
          message: "admin page must not bypass auth middleware",
        });
      }
    }
  }

  if (!hasGlobalMiddleware) {
    violations.push({
      file: "apps/admin/app/middleware/auth.global.ts",
      line: 1,
      rule: "BR-ADA-01",
      message:
        "admin must define a global auth route middleware (auth.global.ts)",
    });
  }

  return violations;
}

/**
 * `root` là tham số để ca âm dựng được cây giả — nếu chỉ đọc `REPO_ROOT`, mọi
 * nhánh dưới đây chỉ từng chạy trên repo hợp lệ và không có gì chứng minh chúng
 * bắn được (BR-TYP-07).
 */
export function findRuntimeBoundaryViolations(
  root: string = REPO_ROOT
): RuntimeBoundaryViolation[] {
  const violations = [
    ...checkAdminIsStatic(root),
    ...checkWebCors(root),
    ...checkAuthNamespace(root),
    ...checkProxyServesAdminStatically(root),
    ...checkSingleRouteOwner(root),
    ...checkAdminAuthGuard(root),
  ];

  const appRoot = join(root, "apps/admin/app");
  for (const file of walkSource(appRoot)) {
    violations.push(
      ...scanAdminSource(
        toPosix(relative(root, file)),
        readFileSync(file, "utf8")
      )
    );
  }

  return violations;
}
