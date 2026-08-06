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

`CONVENTIONS.md` §5–§7 ép mỗi spec mang `classification` (`Running` / `Partial running` /
`Planned` …), `verified: <ngày đọc code>`, và một section **Current state** đối chiếu từng
file source.

Với một repo đang chạy, đó là thiết kế đúng — nó chặn spec nói dối về trạng thái.
Với **greenfield v2**, nó vô nghĩa: mọi module đều `Planned`, mọi Current state đều rỗng.

Đo cụ thể trên `admin/dashboard-and-users/SPEC.md` (162 dòng):

| Phần | Dòng | Còn dùng được ở v2 |
|---|---:|---|
| Objective · API surface · Data ownership · Contract · Boundaries | ~70 | ✅ |
| **Current state** (bảng 9 file + 2 đoạn phân tích bug) | **31** | ❌ nói về code sẽ bị bỏ |
| **Known gaps** (5 hàng, đều là bug v1) | **7** | ❌ |
| Acceptance criteria có 2 tiêu chí "Hiện **fail**" trỏ bug v1 | ~4 | ❌ |

**~42/162 dòng = 26% là nội dung chết.** Tỉ lệ tương tự ở 15 module `Partial running` khác.

### 1.2 Gộp nhiều outcome vào một spec

`CONVENTIONS.md` §3 nói *"mỗi outcome có đúng một spec sở hữu"* — nhưng chính corpus vi
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
| `mvp-scope.md` | **VIẾT LẠI** | `00-foundation/mvp-scope.md` — phase gate P0–P3, điểm cắt. Bỏ hết đoạn 134 lỗi typecheck |
| `actors.md` | **TÁCH 3** | `actors.md` · `auth-tokens-sessions.md` (platform) · `child-data-compliance.md` |
| `monetization.md` | **TÁCH 4** | `package-catalog.md` · `entitlement-model.md` · `access-ladder.md` · `payment-flow.md`. Bỏ toàn bộ lịch sử `teacher_pro`/`ai_credit`/`TIERS` |

### Admin — 6 spec v1 → 21 spec v2

| v1 | Verdict | Sang v2 thành |
|---|---|---|
| `dashboard-and-users` | **TÁCH 4** | `admin-dashboard` · `user-management` · `user-detail` · `child-profile-admin` |
| `content-authoring-studio` | **TÁCH 6** | `game-level-studio` · `schema-driven-form` · `live-preview` · `content-review-queue` · `publish-and-version` · `lesson-authoring` |
| `asset-pipeline` | **TÁCH 3** | `image-upload` · `emoji-picker` · `asset-usage-tracking` |
| `payment-review` | **TÁCH 2** | `payment-queue` · `payment-approval` |
| `package-catalog-admin` | **GIỮ** | `package-catalog-admin` (read-only ở v2 — package là Lớp 1) |
| `activity-and-audit` | **TÁCH 3** | `audit-log-viewer` · `error-log-viewer` · `system-activity` |
| — | **MỚI** | `admin-auth` · `entitlement-grant` · `taxonomy-browser` · `curriculum-builder` · `activity-authoring` · `seo-content-admin` · `notification-admin` · `feature-flags` · `data-export` |

### Public — 3 → 8

| v1 | Verdict | Sang v2 thành |
|---|---|---|
| `landing-and-seo` | **TÁCH 2** | `landing-page` · `seo-and-structured-data` |
| `program-showcase` | **TÁCH 3** | `program-showcase` · `game-catalog-public` · `game-detail-public` |
| `legal-and-compliance` | **TÁCH 2** | `legal-pages` · `cookie-and-consent-banner` |
| — | **MỚI** | `pricing-page` · `faq-and-help` |

### Play — 4 → 13

| v1 | Verdict | Sang v2 thành |
|---|---|---|
| `game-catalog-and-gating` | **TÁCH 2** | `access-gating` · `game-config-delivery` |
| `gameplay-session` | **TÁCH 5** | `play-session-lifecycle` · `play-event-ingestion` · `scoring-and-result` · `scaffolding-and-hints` · `feedback-and-celebration` |
| `adaptive-and-curriculum` | **TÁCH 3** | `adaptive-selector` · `curriculum-player` · `progress-and-mastery` |
| `healthy-play` | **GIỮ** | `healthy-play-limits` |
| — | **MỚI** | `play-entry-and-profile-select` · `parent-gate` · `next-game-recommendation` |

### Account — 6 → 17

| v1 | Verdict | Sang v2 thành |
|---|---|---|
| `identity-and-security` | **TÁCH 7** | `registration` · `login-and-session` · `email-verification` · `password-recovery` · `mfa` · `account-settings` · `account-deletion` |
| `child-profiles` | **TÁCH 3** | `child-profile-crud` · `child-profile-switching` · `child-profile-archive` |
| `parent-reports` | **TÁCH 2** | `basic-report` · `advanced-report` |
| `payments-and-entitlements` | **TÁCH 3** | `payment-order-create` · `payment-proof-upload` · `subscription-view` |
| `teacher-workspace` | **BỎ → 07-addon** | Tách thành `lesson-plan-creator` · `personal-curriculum` · `custom-game-builder` · `pdf-export` |
| `ai-assistant` | **BỎ → 07-addon** | `ai-assistant` · `ai-credit-ledger` |
| — | **MỚI** | `member-dashboard` · `my-library` · `consent-management` |

### Platform — 7 → 16

| v1 | Verdict | Sang v2 thành |
|---|---|---|
| `data-model` | **TÁCH 4** | `data-model-overview` · `schema-identity-billing` · `schema-content-taxonomy` · `schema-play-telemetry` |
| `taxonomy-service` | **GIỮ** | `taxonomy-service` |
| `game-id-migration` | **BỎ** | Greenfield không có id cũ để migrate. `LEGACY_GAME_TYPE_MAP` chỉ còn dùng khi port 60 game type v1 → ghi trong `game-template-contract` |
| `telemetry-and-health` | **TÁCH 4** | `telemetry-pipeline` · `health-and-ops` · `backup-and-restore` · `monitoring-and-alerting` |
| `template-and-tagging` | **TÁCH 2** | `game-template-contract` · `search-and-tagging` |
| `ui-migration` | **BỎ** | Là sổ nợ giữa design system và code v1. Greenfield không mang nợ sang |
| `notifications-and-offline` | **TÁCH 3** | `notification-service` · `job-queue` · `pwa-and-offline` |
| — | **MỚI** | `game-engine-runtime` · `adaptive-engine` · `audit-log` · `auth-tokens-sessions` · `storage-and-images` · `emoji-registry` · **`content-seed-authoring`** |

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
