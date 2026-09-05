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
        path: "node_modules/(ioredis|iovalkey|bullmq|jose|otpauth|unstorage|nodemailer|mjml|rate-limiter-flexible)(/|$)",
      },
    },
    {
      // Danh sách này lấy nguyên văn từ auth-tokens-sessions.md §1 (quyết định
      // D-CO, sửa lần cuối 2026-08-13). Bản trước cấm `nuxt-auth-utils` —
      // ngược hẳn spec: nó LÀ module web khai trong nuxt.config.ts, chỉ seal
      // locator. Rule cấm thứ repo bắt buộc dùng là rule không bao giờ đúng.
      name: "no-obsolete-auth-provider",
      comment:
        "auth-tokens-sessions.md §1: session là opaque locator + Redis. NEVER " +
        "thêm framework auth thứ hai — Supabase Auth, Better-Auth, Sidebase " +
        "AuthJS, next-auth. Hai nguồn sự thật về phiên là hai cách hết hạn.",
      severity: "error",
      from: {},
      to: {
        path: "node_modules/(@supabase/auth-helpers[^/]*|better-auth|@sidebase/nuxt-auth|@auth/core|next-auth)(/|$)",
      },
    },
    {
      // §1 cấm helper OAuth/password/WebAuthn *của* nuxt-auth-utils, không cấm
      // chính module. Argon2id + openid-client + OTPAuth là đường đã chốt.
      name: "no-nuxt-auth-utils-credential-helpers",
      comment:
        "auth-tokens-sessions.md §1: Cấm helper OAuth/password/WebAuthn tích " +
        "hợp của nuxt-auth-utils. Password dùng Argon2id, OAuth dùng " +
        "openid-client, TOTP dùng OTPAuth.",
      severity: "error",
      from: {},
      to: {
        path: "node_modules/nuxt-auth-utils/dist/runtime/server/lib/(oauth|webauthn)(/|$)",
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
          "^(#imports$|#server/|#app/|#build/|~|vue$|vue-router$|nitropack$)",
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
