"use strict";
/**
 * Cưỡng chế ranh giới package của monorepo-package-architecture.md.
 * Spec §10 yêu cầu chạy check này trong CI mỗi PR.
 *
 * Mỗi rule dưới đây trỏ về đúng một BR — ❌ NEVER thêm rule không có BR sở hữu,
 * và ❌ NEVER nới rule để code hiện tại qua được.
 */
module.exports = {
  forbidden: [
    {
      name: "no-packages-to-apps",
      comment:
        "BR-MPA-06: packages/* NEVER phụ thuộc ngược vào apps/* — tạo chu trình, " +
        "packages hết tái dùng độc lập.",
      severity: "error",
      from: { path: "^packages/" },
      to: { path: "^apps/" },
    },
    {
      name: "no-app-to-app",
      comment:
        "BR-MPA-07: hai apps/* NEVER phụ thuộc thẳng vào nhau — chia sẻ luôn qua " +
        "packages/*. apps/admin gọi thẳng apps/web là dấu hiệu thiếu một package.",
      severity: "error",
      from: { path: "^apps/([^/]+)/" },
      to: { path: "^apps/([^/]+)/", pathNot: "^apps/$1/" },
    },
    {
      name: "no-app-direct-base-lib",
      comment:
        "BR-MPA-01: apps/* NEVER import thư viện nền cho capability dùng chung " +
        "≥2 app — luôn qua driver @mindkid/{cache,queue,auth}. Import rải rác " +
        "làm đổi thư viện nền thành việc sửa N chỗ.",
      severity: "error",
      from: { path: "^apps/" },
      to: {
        path: "node_modules/(ioredis|iovalkey|bullmq|jose|better-auth|@better-auth/[^/]+|unstorage|nodemailer|mjml|rate-limiter-flexible)(/|$)",
      },
    },
    {
      name: "no-bypass-db-driver",
      comment:
        "BR-MPA-01: apps/* và các packages/* ngoài @mindkid/db NEVER import trực tiếp " +
        "postgres, node:sqlite, drizzle-orm/postgres-js, drizzle-orm/d1, hoặc " +
        "drizzle-orm/pg-proxy — mọi kết nối DB bắt buộc đi qua Driver Manager của @mindkid/db.",
      severity: "error",
      from: {
        path: "^(apps|packages)/",
        pathNot:
          "^(packages/db/|packages/(auth|queue)/tests/|apps/worker/src/(backup/restore|consumers/backup-verify))",
      },
      to: {
        path: "(^(node:)?sqlite$|(^|/)node_modules/(postgres|drizzle-orm/(postgres-js|d1|pg-proxy))(/|\\.m?js$|$))",
      },
    },
    {
      name: "no-router-direct-db-or-repo",
      comment:
        "DAL Global Lock: Router (apps/web/server/api/**) NEVER imports Repository, " +
        "DatabaseManager, @mindkid/db, hoặc drizzle-orm trực tiếp — 100% route phải đi qua Service layer.",
      severity: "error",
      from: { path: "^apps/web/server/api/" },
      to: {
        path: "(^apps/web/server/utils/repositories\\.ts$|^#server/utils/repositories|^packages/db/|^@mindkid/db(/|$)|(^|/)node_modules/drizzle-orm(/|$))",
      },
    },
    {
      name: "no-service-raw-drizzle",
      comment:
        "DAL Global Lock: Web Services (apps/web/server/services/**) NEVER import drizzle-orm trực tiếp — " +
        "mọi truy vấn đi qua Repositories trong @mindkid/db.",
      severity: "error",
      from: { path: "^apps/web/server/services/" },
      to: { path: "(^|/)node_modules/drizzle-orm(/|$)" },
    },
    {
      name: "no-web-util-raw-drizzle",
      comment:
        "DAL Global Lock: Web Utils (apps/web/server/utils/**, trừ better-auth.ts adapter) NEVER import drizzle-orm trực tiếp.",
      severity: "error",
      from: {
        path: "^apps/web/server/utils/",
        pathNot: "^apps/web/server/utils/better-auth\\.ts$",
      },
      to: { path: "(^|/)node_modules/drizzle-orm(/|$)" },
    },
    {
      name: "no-worker-raw-drizzle",
      comment:
        "DAL Global Lock: Worker runtime (apps/worker/src/**, trừ allowlist backup PG restore/verify) NEVER import drizzle-orm trực tiếp.",
      severity: "error",
      from: {
        path: "^apps/worker/src/",
        pathNot:
          "(\\.test\\.ts$|^apps/worker/src/(backup/(restore|verify-gate)|consumers/backup-verify)\\.ts$)",
      },
      to: { path: "(^|/)node_modules/drizzle-orm(/|$)" },
    },
    {
      name: "no-runtime-pkg-raw-drizzle",
      comment:
        "DAL Global Lock: Runtime domain packages (play, export, notification, audit) NEVER import drizzle-orm trực tiếp.",
      severity: "error",
      from: { path: "^packages/(play|export|notification|audit)/src/" },
      to: { path: "(^|/)node_modules/drizzle-orm(/|$)" },
    },
    {
      name: "no-obsolete-auth-provider",
      comment:
        "auth-tokens-sessions.md §1 (Task #319): hệ thống chuẩn hoá trên Better Auth " +
        "bọc trong @mindkid/auth. Cấm thêm framework auth song song (nuxt-auth-utils, " +
        "Supabase Auth, Sidebase AuthJS, next-auth, openid-client, otpauth).",
      severity: "error",
      from: {},
      to: {
        path: "node_modules/(@supabase/auth-helpers[^/]*|nuxt-auth-utils|openid-client|otpauth|@sidebase/nuxt-auth|@auth/core|next-auth)(/|$)",
      },
    },
    {
      name: "no-admin-server-auth",
      comment:
        "BR-ARB-04: apps/admin là static SPA, chỉ được import subpath browser-safe " +
        "@mindkid/auth/client — cấm kéo server/Redis/Argon2 của packages/auth.",
      severity: "error",
      from: { path: "^apps/admin/" },
      to: {
        path: "^packages/auth/src/(index|server|user-better-auth|manager-better-auth|redis-|password|parent-gate)",
      },
    },
    {
      name: "no-consumer-in-queue-package",
      comment:
        "BR-JOB-04 (job-queue.md §2): packages/queue là producer — NEVER chứa " +
        "consumer. Consumer cần DB và storage, nên một cạnh tới hai driver đó " +
        "là dấu hiệu vai trò đã trộn. Consumer sống ở apps/worker/src/consumers/.",
      severity: "error",
      from: { path: "^packages/queue/" },
      to: {
        path: "(^packages/(db|storage|audit|play|export)/|^@mindkid/(db|storage|audit|play|export))",
      },
    },
    {
      name: "no-content-package-forbidden-imports",
      comment:
        "BR-MPA-05: packages/content chỉ chứa nội dung học thuần. Cấm nhập db, " +
        "content-build, drizzle-orm, postgres, và mọi module node:*.",
      severity: "error",
      from: { path: "^packages/content/" },
      to: {
        path: "(^packages/(db|content-build)/|^@mindkid/(db|content-build)|^node_modules/(drizzle-orm|postgres)(/|$)|node:)",
      },
    },
    {
      name: "no-game-engine-to-shared-barrel",
      comment:
        "packages/game-engine chạy trong trình duyệt (canvas) và mọi trang chơi " +
        "import nó. Vite không tree-shake ở dev, nên import barrel @mindkid/shared " +
        "hoặc /client là kéo hơn 40 module xuống client chỉ để lấy vài hàm. " +
        "Dùng subpath hẹp khai trong exports map của packages/shared.",
      severity: "error",
      from: { path: "^packages/game-engine/" },
      to: {
        path: "(^packages/shared/src/(index|client)\\.ts$|^@mindkid/shared(/client)?$)",
      },
    },
    {
      name: "no-db-package-forbidden-imports",
      comment:
        "BR-MPA-05: packages/db chỉ là tầng kết nối PostgreSQL. Cấm nhập content, " +
        "content-build, audit, play, export.",
      severity: "error",
      from: { path: "^packages/db/" },
      to: {
        path: "(^packages/(content|content-build|audit|play|export)/|^@mindkid/(content|content-build|audit|play|export))",
      },
    },
    {
      name: "no-domain-services-forbidden-imports",
      comment:
        "BR-MPA-05: Domain packages (audit, play, export) cấm nhập content-build " +
        "và cấm phụ thuộc lẫn nhau (trừ export -> audit).",
      severity: "error",
      from: { path: "^packages/(audit|play|export)/" },
      to: { path: "(^packages/content-build/|^@mindkid/content-build)" },
    },
    {
      name: "no-content-build-to-apps",
      comment: "BR-MPA-06: packages/content-build NEVER phụ thuộc vào apps/*.",
      severity: "error",
      from: { path: "^packages/content-build/" },
      to: { path: "(^apps/|^@mindkid/(web|admin|worker))" },
    },
    {
      name: "no-http-in-worker",
      comment:
        "BR-JOB-04 (job-queue.md §2, §10 Never): apps/worker là consumer — NEVER " +
        "expose HTTP. Trộn hai vai biến worker thành một app web không ai bảo trì.",
      severity: "error",
      from: { path: "^apps/worker/" },
      to: {
        path: "node_modules/(h3|nitropack|express|fastify|koa)(/|$)",
      },
    },
    {
      name: "no-circular",
      comment: "Chu trình phụ thuộc làm thứ tự khởi tạo không đoán được.",
      severity: "error",
      from: {},
      to: { circular: true },
    },
    {
      name: "no-unresolvable",
      comment:
        "BR-MPA-08: Cấm import không giải quyết được (unresolvable dependency) — " +
        "bao gồm cả subpath exports chưa được khai báo.",
      severity: "error",
      from: { pathNot: "^scripts/" },
      to: {
        couldNotResolve: true,
        pathNot:
          "^(#imports$|#server/|#app/|#build/|~|vue$|vue-router$|nitropack$|cloudflare:workers$)",
      },
    },
  ],
  options: {
    // doNotFollow ≠ exclude. `exclude` XOÁ cạnh khỏi graph nên rule không bao giờ
    // thấy được import vào node_modules — no-app-direct-base-lib sẽ xanh giả.
    // `doNotFollow` giữ cạnh, chỉ không đi sâu vào trong.
    doNotFollow: { path: "node_modules" },
    exclude: { path: "(^|/)(dist|coverage|\\.nuxt|\\.output)(/|$)" },
    // ❌ Không khai tsConfig: packages/config/tsconfig.base.json là file BASE để
    // extend (không có `include`) — trỏ vào đó làm TS báo TS18003.
    tsPreCompilationDeps: true,
    enhancedResolveOptions: {
      exportsFields: ["exports"],
      conditionNames: ["import", "require", "node", "default", "types"],
      extensions: [".ts", ".vue", ".js", ".mjs", ".json"],
    },
  },
};
