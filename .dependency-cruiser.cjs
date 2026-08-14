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
        "≥2 app — luôn qua driver @kidthink/{cache,queue,auth}. Import rải rác " +
        "làm đổi thư viện nền thành việc sửa N chỗ.",
      severity: "error",
      from: { path: "^apps/" },
      to: {
        path: "node_modules/(ioredis|iovalkey|bullmq|jose|otpauth|unstorage|nodemailer|mjml|rate-limiter-flexible)(/|$)",
      },
    },
    {
      name: "no-obsolete-auth-provider",
      comment:
        "P0.3 chốt Sidebase Local; nuxt-auth-utils và AuthJS/next-auth không còn thuộc stack.",
      severity: "error",
      from: {},
      to: {
        path: "node_modules/(nuxt-auth-utils|next-auth)(/|$)",
      },
    },
    {
      name: "no-circular",
      comment: "Chu trình phụ thuộc làm thứ tự khởi tạo không đoán được.",
      severity: "error",
      from: {},
      to: { circular: true },
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
