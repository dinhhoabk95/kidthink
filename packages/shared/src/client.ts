// @mindkid/shared/client — tập con AN TOÀN CHO TRÌNH DUYỆT của barrel `.`.
//
// Trong 52 module của barrel `.` có 11 module chạm node: builtin
// (fs/path/zlib/buffer/crypto) hoặc package chỉ chạy phía máy chủ (@mindkid/config,
// @mindkid/cache, @mindkid/auth, @mindkid/moderation). Vite KHÔNG tree-shake ở dev,
// nên một trang Vue import `@mindkid/shared` là kéo nguyên cụm đó xuống trình duyệt:
// app chết lúc khởi tạo ("does not provide an export named 'readFileSync'"), và bản
// build từng nhét cả native addon argon2 vào chunk client.
//
// Cấm — NEVER thêm re-export của module chạm node: builtin hoặc package máy chủ.
// Module bị loại: access-gating, alerts-config, custom-game, email-job, logger, payment-state-machine, publish-checklist, rate-limit-middleware, round-set-validation, vietqr, web-scale-contract.
export * from "./access-cta.js";
export * from "./access-ladder.js";
export * from "./activity-model.js";
export * from "./activity-schemas.js";
export * from "./admin-child-projection.js";
export * from "./ai.js";
export * from "./ai-credit.js";
export * from "./asset-resolver.js";
export * from "./audit.js";
export * from "./child-data.js";
export * from "./competency-catalog.js";
export * from "./config-dictionary.js";
export * from "./curriculum-model.js";
export * from "./curriculum-player.js";
export * from "./dashboard-cards.js";
export * from "./date-ict.js";
export * from "./entitlement-catalog.js";
export * from "./exports.js";
export * from "./feature-flags.js";
export * from "./glossary.js";
export * from "./healthy-play-limits.js";
export * from "./ids.js";
export * from "./legal-summary.js";
export * from "./lesson-model.js";
export * from "./lesson-plan.js";
export * from "./lifecycle.js";
export * from "./notifications.js";
export * from "./offline-activities.js";
export * from "./pedagogical-evidence.js";
export * from "./personal-curriculum.js";
export * from "./program-showcase.js";
export * from "./public-seo.js";
export * from "./pwa-offline-pack-contract.js";
export * from "./rate-limit-routes.js";
export * from "./rate-limiting.js";
export * from "./redactor.js";
export * from "./redirect.js";
export * from "./round-event-gate.js";
export * from "./scoring.js";
export * from "./strands-catalog.js";
export * from "./taxonomy-types.js";
export * from "./versioning.js";
export * from "./versioning-report.js";
export * from "./worksheet-model.js";
export * from "./zod-introspect.js";
