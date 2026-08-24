import {
  mkdirSync,
  mkdtempSync,
  readFileSync,
  rmSync,
  writeFileSync,
} from "node:fs";
import { tmpdir } from "node:os";
import { dirname, join } from "node:path";
import { afterEach, describe, expect, it } from "vitest";
import {
  findRuntimeBoundaryViolations,
  type RuntimeBoundaryRule,
  scanAdminSource,
} from "#src/lint-runtime-boundary";

/**
 * Ca âm dựng cây giả trong thư mục tạm chứ không phải trong `tests/fixtures/`:
 * fixture ở đây là một **repo root** với `apps/`, `infra/` — để trong repo thì
 * nó nằm trong tầm quét của chính các cổng khác. Mỗi ca bắt đầu từ một cây
 * **hợp lệ** rồi hỏng đúng một thứ, nên khi cổng đỏ ta biết chính xác vì sao.
 */
const roots: string[] = [];

/**
 * Mẫu vi phạm sống trong `tests/fixtures/` chứ không phải chuỗi trong file test
 * (BR-TYP-07): fixture là file `.vue` thật nên nó cũng chứng minh cổng đọc được
 * đúng cú pháp mà admin viết hằng ngày.
 */
function readFixture(name: string): string {
  return readFileSync(
    join(import.meta.dirname, "fixtures", "runtime-boundary", name),
    "utf8"
  );
}

function write(root: string, file: string, content: string): void {
  const target = join(root, file);
  mkdirSync(dirname(target), { recursive: true });
  writeFileSync(target, content, "utf8");
}

const VALID_ADMIN_CONFIG = `export default defineNuxtConfig({
  ssr: false,
  runtimeConfig: { public: { apiBaseUrl: process.env.NUXT_PUBLIC_API_BASE_URL } },
});
`;

const VALID_WEB_CONFIG = `const allowedOrigins = (process.env.NUXT_ALLOWED_ORIGINS || "").split(",");
export default defineNuxtConfig({
  security: {
    corsHandler: { origin: allowedOrigins, credentials: true },
  },
});
`;

const VALID_MIDDLEWARE = `function isManagerApiPath(path) { return path.startsWith("/api/managers/"); }
function isUserApiPath(path) { return !isManagerApiPath(path); }
export default defineEventHandler((event) => {
  event.context.user = undefined;
  event.context.manager = undefined;
});
`;

const VALID_NGINX = `server {
    server_name \${SITE_DOMAIN};
    location / {
        proxy_pass http://127.0.0.1:3000;
    }
}

server {
    server_name \${ADMIN_DOMAIN};
    root /opt/mindkid/current/apps/admin/.output/public;
    location / {
        try_files $uri $uri/ /index.html;
    }
}
`;

function makeRoot(): string {
  const root = mkdtempSync(join(tmpdir(), "mindkid-runtime-boundary-"));
  roots.push(root);

  write(root, "apps/admin/nuxt.config.ts", VALID_ADMIN_CONFIG);
  write(
    root,
    "apps/admin/package.json",
    JSON.stringify({ scripts: { build: "nuxt generate" } }, null, 2)
  );
  write(
    root,
    "apps/admin/app/pages/index.vue",
    "<template><div /></template>\n"
  );
  write(
    root,
    "apps/admin/app/middleware/auth.global.ts",
    "export default defineNuxtRouteMiddleware(() => {});\n"
  );
  write(root, "apps/web/nuxt.config.ts", VALID_WEB_CONFIG);
  write(root, "apps/web/server/middleware/auth.ts", VALID_MIDDLEWARE);
  write(
    root,
    "apps/web/server/api/managers/dashboard.get.ts",
    "export default 1;\n"
  );
  write(root, "infra/nginx/mindkid.conf.tmpl", VALID_NGINX);

  return root;
}

function rulesFor(root: string): RuntimeBoundaryRule[] {
  return findRuntimeBoundaryViolations(root).map((violation) => violation.rule);
}

afterEach(() => {
  for (const root of roots.splice(0)) {
    rmSync(root, { recursive: true, force: true });
  }
});

describe("lint:runtime-boundary — admin source", () => {
  // `href`, `window.open` và `src` là những dạng cổng cũ bỏ lọt: nó chỉ khớp
  // `$fetch("/api/`. Cả bốn đều trỏ về host tĩnh và trả 404.
  it("ca âm: mọi dạng URL API tương đối đều bị bắt", () => {
    const violations = scanAdminSource(
      "apps/admin/app/pages/example.vue",
      readFixture("relative-urls.vue")
    );

    expect(violations).toHaveLength(4);
    expect(
      violations.every((violation) => violation.rule === "BR-ARB-04")
    ).toBe(true);
  });

  it("ca dương: URL đi qua apiUrl hoặc API client thì không bị bắt", () => {
    const violations = scanAdminSource(
      "apps/admin/app/pages/example.vue",
      readFixture("absolute-urls.vue")
    );

    expect(violations).toEqual([]);
  });

  it("ca âm: admin không được tự dùng session hoặc server package", () => {
    const violations = scanAdminSource(
      "apps/admin/app/pages/example.vue",
      'const { loggedIn } = useUserSession();\nimport { db } from "@mindkid/db";'
    );

    expect(violations.map((violation) => violation.rule)).toEqual([
      "BR-ARB-04",
      "BR-ARB-01",
    ]);
  });
});

describe("lint:runtime-boundary — repo shape", () => {
  it("cây hợp lệ không có vi phạm nào", () => {
    expect(findRuntimeBoundaryViolations(makeRoot())).toEqual([]);
  });

  it("ca âm BR-ARB-01: admin có thư mục server", () => {
    const root = makeRoot();
    write(
      root,
      "apps/admin/server/api/managers/ping.get.ts",
      "export default 1;\n"
    );

    expect(rulesFor(root)).toContain("BR-ARB-01");
  });

  it("ca âm BR-ARB-02: một route có hai app sở hữu", () => {
    const root = makeRoot();
    write(
      root,
      "apps/admin/server/api/managers/dashboard.get.ts",
      "export default 1;\n"
    );

    const violations = findRuntimeBoundaryViolations(root);
    const duplicate = violations.find(
      (violation) => violation.rule === "BR-ARB-02"
    );

    expect(duplicate?.message).toContain("/api/managers/dashboard");
    expect(duplicate?.message).toContain("apps/web/server/api");
    expect(duplicate?.message).toContain("apps/admin/server/api");
  });

  it("ca âm BR-ARB-03: admin không tắt SSR", () => {
    const root = makeRoot();
    write(
      root,
      "apps/admin/nuxt.config.ts",
      "export default defineNuxtConfig({});\n"
    );

    expect(rulesFor(root)).toContain("BR-ARB-03");
  });

  it("ca âm BR-ARB-03: build admin không sinh file tĩnh", () => {
    const root = makeRoot();
    write(
      root,
      "apps/admin/package.json",
      JSON.stringify({ scripts: { build: "nuxt build" } }, null, 2)
    );

    expect(rulesFor(root)).toContain("BR-ARB-03");
  });

  it("ca âm BR-ARB-03: proxy vẫn trỏ admin vào một tiến trình Node", () => {
    const root = makeRoot();
    write(
      root,
      "infra/nginx/mindkid.conf.tmpl",
      VALID_NGINX.replace(
        "try_files $uri $uri/ /index.html;",
        "proxy_pass http://127.0.0.1:3002;"
      )
    );

    expect(rulesFor(root)).toContain("BR-ARB-03");
  });

  it("ca âm BR-ARB-05: CORS dùng wildcard cùng credentials", () => {
    const root = makeRoot();
    write(
      root,
      "apps/web/nuxt.config.ts",
      VALID_WEB_CONFIG.replace("origin: allowedOrigins", 'origin: ["*"]')
    );

    expect(rulesFor(root)).toContain("BR-ARB-05");
  });

  it("ca âm BR-ARB-05: CORS không có allowlist tường minh", () => {
    const root = makeRoot();
    write(
      root,
      "apps/web/nuxt.config.ts",
      "export default defineNuxtConfig({ security: { corsHandler: false } });\n"
    );

    expect(rulesFor(root)).toContain("BR-ARB-05");
  });

  it("ca âm BR-ARB-06: middleware không chọn namespace theo path", () => {
    const root = makeRoot();
    write(
      root,
      "apps/web/server/middleware/auth.ts",
      "export default defineEventHandler(() => undefined);\n"
    );

    expect(rulesFor(root)).toContain("BR-ARB-06");
  });

  it("ca âm BR-ARB-07: block admin không phục vụ file tĩnh", () => {
    const root = makeRoot();
    write(
      root,
      "infra/nginx/mindkid.conf.tmpl",
      VALID_NGINX.replace(
        "    root /opt/mindkid/current/apps/admin/.output/public;\n",
        ""
      )
    );

    expect(rulesFor(root)).toContain("BR-ARB-07");
  });

  it("ca âm BR-ADA-01: admin thiếu middleware/auth.global.ts bảo vệ trang", () => {
    const root = makeRoot();
    rmSync(join(root, "apps/admin/app/middleware/auth.global.ts"), {
      force: true,
    });

    expect(rulesFor(root)).toContain("BR-ADA-01");
  });

  it("ca âm BR-ADA-01: trang admin không phải login.vue tự tắt auth", () => {
    const root = makeRoot();
    write(
      root,
      "apps/admin/app/pages/dashboard.vue",
      "<script setup>definePageMeta({ auth: false })</script><template><div /></template>\n"
    );

    expect(rulesFor(root)).toContain("BR-ADA-01");
  });

  it("repo thật giữ admin static và API owner ở web", () => {
    expect(findRuntimeBoundaryViolations()).toEqual([]);
  });
});
