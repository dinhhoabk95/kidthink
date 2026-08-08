---
doc: AUDIT
title: Đánh giá corpus spec v1 — giữ gì, tách gì, bỏ gì
version: 1.0.0
created: 2026-08-04
audited: tinimath/docs/specs/ (26 module + 3 foundation, v1.0.0, verified 2026-08-03)
---

# Đánh giá corpus spec v1

> Trả lời câu hỏi: **corpus v1 có dùng lại được cho v2 không?**
> Kết luận ngắn: **cấu trúc dùng được, nội dung thì không.**

## 1. Ba vấn đề hệ thống của v1

### 1.1 Spec v1 là tài liệu khảo cổ code, không phải contract

[`CONVENTIONS.md`](CONVENTIONS.md) §5–§7 ép mỗi spec mang `classification` (`Running` / `Partial running` /
`Planned` …), `verified: <ngày đọc code>`, và một section **Current state** đối chiếu từng
file source.

Với một repo đang chạy, đó là thiết kế đúng — nó chặn spec nói dối về trạng thái.
Với **greenfield v2**, nó vô nghĩa: mọi module đều `Planned`, mọi Current state đều rỗng.

Đo cụ thể trên `admin/dashboard-and-users/SPEC.md` (162 dòng):

| Phần | Dòng | Còn dùng được ở v2 |
|---|---:|---|
| Objective · API surface · Data ownership · Contract · Boundaries | ~70 | |
| **Current state** (bảng 9 file + 2 đoạn phân tích bug) | **31** | Cấm nói về code sẽ bị bỏ |
| **Known gaps** (5 hàng, đều là bug v1) | **7** | Cấm |
| Acceptance criteria có 2 tiêu chí "Hiện **fail**" trỏ bug v1 | ~4 | Cấm |

**~42/162 dòng = 26% là nội dung chết.** Tỉ lệ tương tự ở 15 module `Partial running` khác.

### 1.2 Gộp nhiều outcome vào một spec

[`CONVENTIONS.md`](CONVENTIONS.md) §3 nói *"mỗi outcome có đúng một spec sở hữu"* — nhưng chính corpus vi
phạm nó ở 11/26 module. Tên file có chữ `and` là dấu hiệu đọc được bằng mắt:

| Spec v1 | Thực chất chứa | Số outcome |
|---|---|---:|
| `admin/dashboard-and-users` | Dashboard KPI · danh sách User · chi tiết User · xem trẻ của User | 4 |
| `account/identity-and-security` | Đăng ký · đăng nhập · xác thực email · quên/đặt lại mật khẩu · MFA · phiên · xoá tài khoản | 7 |
| `account/payments-and-entitlements` | Tạo đơn · upload chứng từ · xem gói · lịch sử thanh toán | 4 |
| `play/adaptive-and-curriculum` | ZPD selector · mastery · curriculum player · tiến độ | 4 |
| `play/game-catalog-and-gating` | Catalog + lọc · kiểm quyền 4 bậc | 2 |
| `platform/telemetry-and-health` | Telemetry pipeline · health check · backup · monitoring | 4 |
| `platform/template-and-tagging` | Game template contract · taxonomy 3 trục tag | 2 |
| `platform/notifications-and-offline` | Job nền · push · PWA offline | 3 |
| `public/landing-and-seo` | Landing page · meta/sitemap/structured data | 2 |
| `admin/content-authoring-studio` | Form sinh từ Zod · preview engine · duyệt · publish | 4 |
| `platform/data-model` | **58 bảng / 15 module trong một file** | 15 |

Hệ quả thực tế: không trả lời được **"tính năng này xong chưa"**. `identity-and-security`
gắn nhãn `Running` trong khi MFA và xoá tài khoản chưa chắc chạy — nhãn của outcome mạnh
nhất che outcome yếu nhất.

### 1.3 Thiếu hẳn 8 loại spec

Không có file nào sở hữu những thứ sau, nên chúng bị copy rải rác và drift:

| Thiếu | Hậu quả ở v1 |
|---|---|
| **Vòng đời nội dung** (draft → published) | Chỉ có `status` rải trong data-model, không ai sở hữu quy tắc chuyển trạng thái |
| **Versioning nội dung** | §25 PRD không có nơi thực thi; `game_version` xuất hiện trong telemetry mà không có contract |
| **Tuân thủ dữ liệu trẻ em** | Nằm rải ở `rules/03-security.md` + `legal-and-compliance` — không có danh sách đóng trường được phép thu |
| **Registry error code** | HTTP code liệt kê ở `rules/06`, không map sang mã lỗi nghiệp vụ |
| **Catalog event** | Event name nằm trong `rules/07-game-engine.md`, không có schema |
| **Registry business rule (BR-xxx)** | Rule nằm trong prose của 26 file, không đánh số, không tra chéo được |
| **Glossary** | "domain" trong PRD = "strand" trong code — không nơi nào chốt |
| **Quy ước ID** | `skills.code` format ép ở `rules/08-seeder.md`, các ID khác không có |

---

## 2. Verdict từng module v1

`GIỮ` = port gần nguyên · `TÁCH n` = xé thành n spec · `VIẾT LẠI` = giữ ý, viết mới ·
`BỎ` = không mang sang v2.

### Foundation

| v1 | Verdict | Sang v2 thành |
|---|---|---|
| [`mvp-scope.md`](00-foundation/mvp-scope.md) | **VIẾT LẠI** | `00-foundation/mvp-scope.md` — phase gate P0–P3, điểm cắt. Bỏ hết đoạn 134 lỗi typecheck |
| [[`actors.md`](00-foundation/actors.md)](00-foundation/actors.md) | **TÁCH 3** | [[`actors.md`](00-foundation/actors.md)](00-foundation/actors.md) · [`auth-tokens-sessions.md`](01-platform/auth-tokens-sessions.md) (platform) · [`child-data-compliance.md`](00-foundation/child-data-compliance.md) |
| `monetization.md` | **TÁCH 4** | [`package-catalog.md`](00-foundation/package-catalog.md) · [`entitlement-model.md`](00-foundation/entitlement-model.md) · [`access-ladder.md`](00-foundation/access-ladder.md) · [`payment-flow.md`](00-foundation/payment-flow.md). Bỏ toàn bộ lịch sử `teacher_pro`/`ai_credit`/`TIERS` |

### Admin — 6 spec v1 → 21 spec v2

| v1 | Verdict | Sang v2 thành |
|---|---|---|
| `dashboard-and-users` | **TÁCH 4** | [`admin-dashboard.md`](06-admin/admin-dashboard.md) · [`user-management.md`](06-admin/user-management.md) · [`user-detail.md`](06-admin/user-detail.md) · [`child-profile-admin.md`](06-admin/child-profile-admin.md) |
| `content-authoring-studio` | **TÁCH 6** | [`game-level-studio.md`](06-admin/game-level-studio.md) · [`schema-driven-form.md`](06-admin/schema-driven-form.md) · [`live-preview.md`](06-admin/live-preview.md) · [`content-review-queue.md`](06-admin/content-review-queue.md) · [`publish-and-version.md`](06-admin/publish-and-version.md) · [`lesson-authoring.md`](06-admin/lesson-authoring.md) |
| `asset-pipeline` | **TÁCH 3** | [`image-upload.md`](06-admin/image-upload.md) · [`emoji-picker.md`](06-admin/emoji-picker.md) · [`asset-usage-tracking.md`](06-admin/asset-usage-tracking.md) |
| `payment-review` | **TÁCH 2** | [`payment-queue.md`](06-admin/payment-queue.md) · [`payment-approval.md`](06-admin/payment-approval.md) |
| [`package-catalog-admin.md`](06-admin/package-catalog-admin.md) | **GIỮ** | [`package-catalog-admin.md`](06-admin/package-catalog-admin.md) (read-only ở v2 — package là Lớp 1) |
| `activity-and-audit` | **TÁCH 3** | [`audit-log-viewer.md`](06-admin/audit-log-viewer.md) · [`error-log-viewer.md`](06-admin/error-log-viewer.md) · [`system-activity.md`](06-admin/system-activity.md) |
| — | **MỚI** | [`admin-auth.md`](06-admin/admin-auth.md) · [`entitlement-grant.md`](06-admin/entitlement-grant.md) · [`taxonomy-browser.md`](06-admin/taxonomy-browser.md) · [`curriculum-builder.md`](06-admin/curriculum-builder.md) · [`activity-authoring.md`](06-admin/activity-authoring.md) · [`seo-content-admin.md`](06-admin/seo-content-admin.md) · [`notification-admin.md`](06-admin/notification-admin.md) · [`feature-flags.md`](06-admin/feature-flags.md) · [`data-export.md`](06-admin/data-export.md) |

### Public — 3 → 8

| v1 | Verdict | Sang v2 thành |
|---|---|---|
| `landing-and-seo` | **TÁCH 2** | [`landing-page.md`](02-public/landing-page.md) · [`seo-and-structured-data.md`](02-public/seo-and-structured-data.md) |
| [`program-showcase.md`](02-public/program-showcase.md) | **TÁCH 3** | [`program-showcase.md`](02-public/program-showcase.md) · [`game-catalog-public.md`](02-public/game-catalog-public.md) · [`game-detail-public.md`](02-public/game-detail-public.md) |
| `legal-and-compliance` | **TÁCH 2** | [`legal-pages.md`](02-public/legal-pages.md) · [`cookie-and-consent-banner.md`](02-public/cookie-and-consent-banner.md) |
| — | **MỚI** | [`pricing-page.md`](02-public/pricing-page.md) · [`faq-and-help.md`](02-public/faq-and-help.md) |

### Play — 4 → 13

| v1 | Verdict | Sang v2 thành |
|---|---|---|
| `game-catalog-and-gating` | **TÁCH 2** | [`access-gating.md`](04-play/access-gating.md) · [`game-config-delivery.md`](04-play/game-config-delivery.md) |
| `gameplay-session` | **TÁCH 5** | [`play-session-lifecycle.md`](04-play/play-session-lifecycle.md) · [`play-event-ingestion.md`](04-play/play-event-ingestion.md) · [`scoring-and-result.md`](04-play/scoring-and-result.md) · [`scaffolding-and-hints.md`](04-play/scaffolding-and-hints.md) · [`feedback-and-celebration.md`](04-play/feedback-and-celebration.md) |
| `adaptive-and-curriculum` | **TÁCH 3** | `adaptive-selector` · [`curriculum-player.md`](04-play/curriculum-player.md) · [`progress-and-mastery.md`](04-play/progress-and-mastery.md) |
| `healthy-play` | **GIỮ** | [`healthy-play-limits.md`](04-play/healthy-play-limits.md) |
| — | **MỚI** | [`play-entry-and-profile-select.md`](04-play/play-entry-and-profile-select.md) · [`parent-gate.md`](04-play/parent-gate.md) · [`next-game-recommendation.md`](04-play/next-game-recommendation.md) |

### Account — 6 → 17

| v1 | Verdict | Sang v2 thành |
|---|---|---|
| `identity-and-security` | **TÁCH 7** | [`registration.md`](03-account/registration.md) · [`login-and-session.md`](03-account/login-and-session.md) · [`email-verification.md`](03-account/email-verification.md) · [`password-recovery.md`](03-account/password-recovery.md) · [`mfa.md`](03-account/mfa.md) · [`account-settings.md`](03-account/account-settings.md) · [`account-deletion.md`](03-account/account-deletion.md) |
| `child-profiles` | **TÁCH 3** | [`child-profile-crud.md`](03-account/child-profile-crud.md) · [`child-profile-switching.md`](03-account/child-profile-switching.md) · [`child-profile-archive.md`](03-account/child-profile-archive.md) |
| `parent-reports` | **TÁCH 2** | [`basic-report.md`](03-account/basic-report.md) · [`advanced-report.md`](03-account/advanced-report.md) |
| `payments-and-entitlements` | **TÁCH 3** | [`payment-order-create.md`](03-account/payment-order-create.md) · [`payment-proof-upload.md`](03-account/payment-proof-upload.md) · [`subscription-view.md`](03-account/subscription-view.md) |
| `teacher-workspace` | **BỎ → 07-addon** | Tách thành [`lesson-plan-creator.md`](07-addon/lesson-plan-creator.md) · [`personal-curriculum.md`](07-addon/personal-curriculum.md) · [`custom-game-builder.md`](07-addon/custom-game-builder.md) · [`pdf-export.md`](07-addon/pdf-export.md) |
| [`ai-assistant.md`](07-addon/ai-assistant.md) | **BỎ → 07-addon** | [`ai-assistant.md`](07-addon/ai-assistant.md) · [`ai-credit-ledger.md`](07-addon/ai-credit-ledger.md) |
| — | **MỚI** | [`member-dashboard.md`](03-account/member-dashboard.md) · [`my-library.md`](03-account/my-library.md) · [`consent-management.md`](03-account/consent-management.md) |

### Platform — 7 → 16

| v1 | Verdict | Sang v2 thành |
|---|---|---|
| `data-model` | **TÁCH 4** | [`data-model-overview.md`](01-platform/data-model-overview.md) · [`schema-identity-billing.md`](01-platform/schema-identity-billing.md) · [`schema-content-taxonomy.md`](01-platform/schema-content-taxonomy.md) · [`schema-play-telemetry.md`](01-platform/schema-play-telemetry.md) |
| [`taxonomy-service.md`](01-platform/taxonomy-service.md) | **GIỮ** | [`taxonomy-service.md`](01-platform/taxonomy-service.md) |
| `game-id-migration` | **BỎ** | Greenfield không có id cũ để migrate. `LEGACY_GAME_TYPE_MAP` chỉ còn dùng khi port 60 game type v1 → ghi trong [`game-template-contract.md`](01-platform/game-template-contract.md) |
| `telemetry-and-health` | **TÁCH 4** | [`telemetry-pipeline.md`](01-platform/telemetry-pipeline.md) · `health-and-ops` · [`backup-and-restore.md`](01-platform/backup-and-restore.md) · [`monitoring-and-alerting.md`](01-platform/monitoring-and-alerting.md) |
| `template-and-tagging` | **TÁCH 2** | [`game-template-contract.md`](01-platform/game-template-contract.md) · `search-and-tagging` |
| `ui-migration` | **BỎ** | Là sổ nợ giữa design system và code v1. Greenfield không mang nợ sang |
| `notifications-and-offline` | **TÁCH 3** | [`notification-service.md`](01-platform/notification-service.md) · [`job-queue.md`](01-platform/job-queue.md) · `pwa-and-offline` |
| — | **MỚI** | [`game-engine-runtime.md`](01-platform/game-engine-runtime.md) · [`adaptive-engine.md`](01-platform/adaptive-engine.md) · [`audit-log.md`](01-platform/audit-log.md) · [`auth-tokens-sessions.md`](01-platform/auth-tokens-sessions.md) · `storage-and-images` · [`emoji-registry.md`](01-platform/emoji-registry.md) · **[`content-seed-authoring.md`](01-platform/content-seed-authoring.md)** |

---

## 3. Tổng kết số

| | v1 | v2 |
|---|---:|---:|
| Foundation | 3 | **14** |
| Platform | 7 | **16** |
| Public | 3 | **8** |
| Account | 6 | **17** |
| Play | 4 | **13** |
| Admin | 6 | **21** |
| Content model | 0 | **6** |
| Add-on (spec-only) | 2 | **6** |
| Quality | 0 | **5** |
| **Tổng** | **31** | **106** |

Không có file nào của v1 được copy nguyên. Cái được mang sang là **quyết định đã chốt** —
access ladder 4 bậc bao hàm, hai guard tách biệt, `content_pack` tách `difficulty_params`,
taxonomy là bộ xương, audit INSERT-only, emoji không làm affordance — và **lý do** đằng sau
chúng. Đó mới là phần đắt của v1.

## 4. Thay đổi CONVENTIONS cho v2

| v1 | v2 | Vì sao |
|---|---|---|
| Section 5 **Current state** (bằng chứng code) | → **Dependencies** (spec nào phải xong trước) | Greenfield không có code để đối chiếu |
| `classification: Running \| Partial running \| …` | → `status: draft \| approved \| implemented` | Đo độ chín của **spec**, không của code chưa tồn tại |
| `verified: <ngày đọc code>` | → `reviewed: <ngày duyệt spec>` | |
| `owners: <path code>` | → `owns: <entity/route/quyết định spec sở hữu>` | Path code chưa tồn tại |
| — | + Section **Business rules** đánh số `BR-xxx` | Tra chéo được từ test và code |
| — | + Section **Error codes** | Không có nơi sở hữu ở v1 |
| — | + Acceptance viết bằng **Gherkin** | Map thẳng sang test |
| Tên file có `and` được chấp nhận | **Cấm** — một outcome một file | Đây là nguồn của vấn đề §1.2 |
