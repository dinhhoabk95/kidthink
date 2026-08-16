---
doc: ROADMAP
title: Thứ tự implement — đồ thị phụ thuộc
version: 2.0.0
created: 2026-08-04
---

# Thứ tự implement

Phase và điểm cắt: [`../SPEC.md`](../SPEC.md) §12. File này nói **thứ tự trong từng phase**,
suy ra từ `depends_on` của các spec.

## Nguyên tắc xếp thứ tự

1. **Contract trước implementation.** Mọi spec `00-foundation` phải `approved` trước khi
   viết dòng code đầu tiên. Chúng định nghĩa từ vựng mà mọi spec khác dùng.
2. **Schema trước API, API trước UI.** Đổi schema sau khi có UI là đổi ba tầng.
3. **Gating trước nội dung.** Seed 120 game level trước khi có gating nghĩa là 120 level
   được cho không trong khoảng thời gian đó.
4. **Audit trước hành động cần audit.** Thêm audit sau là đi vá từng call site.
5. **Vertical slice, không horizontal layer.** Một game type chạy end-to-end tốt hơn 60
   game type có schema mà không chơi được.

## P0 — Foundation

```
   testing-strategy · ai-codegen-pipeline · mvp-scope (bước 0)
                      │
   repo-bootstrap ──→ monorepo-package-architecture   (chạy TRƯỚC mọi spec khác, 0 phụ thuộc)

   id-conventions ──┐
   glossary ────────┼──→ data-model-overview ──→ schema-* ──→ migration đầu tiên ──→ backup-and-restore · health-check
   actors ──────────┤
   child-data-compliance ──→ (ràng buộc schema child_profiles)
                    │
   access-ladder ───┼──→ entitlement-model ──→ package-catalog
   content-lifecycle ──→ content-versioning
   error-codes · event-catalog · business-rules   (registry, tra ở MỌI bước)
   notification-service · rate-limiting ────────→ registration · email-verification · login-and-session · password-recovery
                                                 │
                                                 └──→ audit-log ──→ admin-auth
```

Thứ tự làm:

| # | Việc | Spec sở hữu |
|---|---|---|
| 0 | Cổng chất lượng, vùng cấm & cắt MVP | [`testing-strategy.md`](08-quality/testing-strategy.md) · [`ai-codegen-pipeline.md`](01-platform/ai-codegen-pipeline.md) · [`mvp-scope.md`](00-foundation/mvp-scope.md) |
| 1 | Dựng khung repo trong `kidthink/` + chốt dependency baseline + port có chọn lọc từ v1 | [`repo-bootstrap.md`](00-foundation/repo-bootstrap.md) · [`monorepo-package-architecture.md`](00-foundation/monorepo-package-architecture.md) |
| 2 | Chốt từ vựng và ID | [`glossary.md`](00-foundation/glossary.md) · [`id-conventions.md`](00-foundation/id-conventions.md) |
| 3 | Chốt tác nhân và guard | [`actors.md`](00-foundation/actors.md) · [`auth-tokens-sessions.md`](01-platform/auth-tokens-sessions.md) |
| 4 | Chốt ràng buộc pháp lý **trước** khi thiết kế bảng trẻ | [`child-data-compliance.md`](00-foundation/child-data-compliance.md) |
| 5 | Chốt ladder + entitlement + package | [`access-ladder.md`](00-foundation/access-ladder.md) → [`entitlement-model.md`](00-foundation/entitlement-model.md) → [`package-catalog.md`](00-foundation/package-catalog.md) |
| 6 | Chốt vòng đời + version nội dung | [`content-lifecycle.md`](00-foundation/content-lifecycle.md) → [`content-versioning.md`](00-foundation/content-versioning.md) |
| 7 | Thiết kế schema | [`data-model-overview.md`](01-platform/data-model-overview.md) → [`schema-identity-billing.md`](01-platform/schema-identity-billing.md) · [`schema-content-taxonomy.md`](01-platform/schema-content-taxonomy.md) · [`schema-play-telemetry.md`](01-platform/schema-play-telemetry.md) |
| 8 | Chạy migration đầu tiên, gate local xanh trên schema thật | [`repo-bootstrap.md`](00-foundation/repo-bootstrap.md) (cơ chế) + `schema-*` (cột) |
| 8b | Sao lưu và quan sát | [`backup-and-restore.md`](01-platform/backup-and-restore.md) · [`health-check.md`](01-platform/health-check.md) |
| 9 | Taxonomy service + seed Lớp 1, gồm ≥690 LO | [`taxonomy-service.md`](01-platform/taxonomy-service.md) · [`emoji-registry.md`](01-platform/emoji-registry.md) |
| 9b | Email và guard | [`notification-service.md`](01-platform/notification-service.md) · [`rate-limiting.md`](01-platform/rate-limiting.md) |
| 10 | Auth end-to-end **bằng email/mật khẩu** | [`registration.md`](03-account/registration.md) · [`email-verification.md`](03-account/email-verification.md) · [`login-and-session.md`](03-account/login-and-session.md) · [`password-recovery.md`](03-account/password-recovery.md) |
| 11 | Audit log (trước mọi hành động cần audit) | [`audit-log.md`](01-platform/audit-log.md) |
| 11b | Đăng nhập admin | [`admin-auth.md`](06-admin/admin-auth.md) |

Ghi chú:
- Registry: [`business-rules.md`](00-foundation/business-rules.md), [`error-codes.md`](00-foundation/error-codes.md), [`event-catalog.md`](00-foundation/event-catalog.md) không thành bước riêng mà được tra cứu và tuân thủ ở **mọi** bước.
- Cổng ra P0: [`security-checklist.md`](08-quality/security-checklist.md) là checklist nghiệm thu cổng ra, không thành bước code riêng.

**Quyết định xử lý 5 cạnh `depends_on` đảo phase:**
- `D-BQ`: [`schema-identity-billing.md`](01-platform/schema-identity-billing.md) (P0) → [`payment-flow.md`](00-foundation/payment-flow.md) (P2) — Contract-only (chỉ dùng enum `status` §7, P0 tạo cột, P2 làm luồng thanh toán).
- `D-BR`: [`schema-content-taxonomy.md`](01-platform/schema-content-taxonomy.md) (P0) → [`game-template-contract.md`](01-platform/game-template-contract.md) (P1) — Contract-only (taxonomy schema P0 đứng trước template contract P1).
- `D-BS`: [`ai-codegen-pipeline.md`](01-platform/ai-codegen-pipeline.md) (P0) → [`game-template-contract.md`](01-platform/game-template-contract.md) (P1) — Contract-only (xác lập quy tắc vùng cấm P0 trước khi triển khai template contract).
- `D-BT`: [`backup-and-restore.md`](01-platform/backup-and-restore.md) (P0) → [`job-queue.md`](01-platform/job-queue.md) (P1) — Contract & script P0 (định nghĩa quy trình backup/restore), job-queue P1 thực thi job định kỳ.
- `D-BU` (T15, 2026-08-09; sửa 2026-08-13): [`notification-service.md`](01-platform/notification-service.md) (P0) → [`job-queue.md`](01-platform/job-queue.md) (P1) — cạnh thật, `BR-NOT-05` cần `jobId = notification_delivery_id` và conditional claim qua BullMQ. Không kéo spec đó nguyên khối lên P0 — dùng lại đúng khung tối thiểu mà `D-BT` đã bắt buộc phải có ở bước 8b (`apps/worker` job `backup:postgres`, `packages/queue` producer). Bước 9b build thêm job `email:send` trên khung đó; phần **đầy đủ** danh mục job, retry policy và alerting backlog vẫn ở P1.

Bước 1 **không phụ thuộc** bất kỳ spec nào khác — đó là lý do nó chạy trước cả [`glossary.md`](00-foundation/glossary.md).
Nó cũng là bước duy nhất mà bản roadmap gốc (trước 2026-08-05) bỏ trống spec sở hữu (từng
ghi "Dựng repo, migration, cổng tự động | —") — xem [`00-foundation/repo-bootstrap.md`](00-foundation/repo-bootstrap.md) §1.

Reauth ([`auth-tokens-sessions.md`](01-platform/auth-tokens-sessions.md) §7.4) và cột `social_identities`
([`schema-identity-billing.md`](01-platform/schema-identity-billing.md) §7.3a) thuộc **P0** dù SNS chỉ chạy ở P1 — cả hai đụng schema và
migration, và thêm cột vào bảng danh tính sau khi có dữ liệu thật là việc khác hẳn.

**D-CG** (2026-08-09): P0 không seed sáu hàng `game_templates` rỗng chỉ để đạt số đếm.
Template chỉ tồn tại khi có `content_contract` và runtime thật ở P1. P0 vẫn seed đủ taxonomy,
gồm ≥690 LO; [`taxonomy-service.md`](01-platform/taxonomy-service.md) sở hữu dữ liệu này.

**Cổng ra P0:** `../SPEC.md` §13 + [`security-checklist.md`](08-quality/security-checklist.md).

**Thay auth architecture:** [`Task #85`](../tasks/85-nuxt-auth-utils-migration-plan.md) thay
Sidebase và toàn bộ first-party JWT/refresh bằng opaque cookie session trên Redis sau hardening package
của Task #83 và trước khi mở P1.15. Session tuyệt đối 1 giờ, remember tuỳ chọn tuyệt đối tối
đa 365 ngày; P0 chỉ trở lại `implemented` khi hai app có evidence expiry/restore/revoke,
Redis fail-closed và toàn bộ legacy runtime đã được gỡ.

## P1 — Play core

```
game-template-contract ──→ game-engine-runtime ──→ 6 template
                       └──→ content-seed-authoring ──→ ≥120 game level (seeder → PR review → seed published)
access-gating ──→ game-config-delivery ──→ play-session-lifecycle
                                       └──→ play-event-ingestion ──→ scoring-and-result
                                                                 └──→ basic-report
```

| # | Việc | Spec sở hữu |
|---|---|---|
| 1 | Ràng buộc chất lượng & thiết kế UI | [`design-system-contract.md`](08-quality/design-system-contract.md) · [`accessibility.md`](08-quality/accessibility.md) · [`performance-budgets.md`](08-quality/performance-budgets.md) |
| 2 | Contract template + 6 template chạy được | [`game-template-contract.md`](01-platform/game-template-contract.md) · [`game-engine-runtime.md`](01-platform/game-engine-runtime.md) |
| 2b | Đóng contract audio tiếng Việt, fallback trên thiết bị chuẩn và owner của đường asset/authoring trước khi sản xuất nội dung hàng loạt | Runtime thuộc [`game-engine-runtime.md`](01-platform/game-engine-runtime.md) và [`game-config-delivery.md`](04-play/game-config-delivery.md); storage/authoring có spec owner [`audio-storage.md`](01-platform/audio-storage.md) — [`Task #80`](../tasks/80-audio-contract-closure-plan.md) đã đóng contract; implementation runtime tại [`Task #87`](../tasks/87-p1-audio-runtime-delivery-plan.md) |
| 3 | **Gating trước nội dung** | [`access-gating.md`](04-play/access-gating.md) |
| 4 | Giao config game đã lọc quyền | [`game-config-delivery.md`](04-play/game-config-delivery.md) |
| 5 | Hạ tầng hàng đợi công việc & đường ống telemetry | [`job-queue.md`](01-platform/job-queue.md) · [`telemetry-pipeline.md`](01-platform/telemetry-pipeline.md) |
| 6 | Vòng đời phiên, nạp event idempotent & xử lý mất mạng | [`play-session-lifecycle.md`](04-play/play-session-lifecycle.md) · [`play-event-ingestion.md`](04-play/play-event-ingestion.md) · [`offline-play.md`](01-platform/offline-play.md) |
| 7 | Tính điểm ở server | [`scoring-and-result.md`](04-play/scoring-and-result.md) |
| 8 | Scaffolding, phản hồi, parent gate, hạn mức giờ | [`scaffolding-and-hints.md`](04-play/scaffolding-and-hints.md) · [`feedback-and-celebration.md`](04-play/feedback-and-celebration.md) · [`parent-gate.md`](04-play/parent-gate.md) · [`healthy-play-limits.md`](04-play/healthy-play-limits.md) |
| 9 | Quản lý hồ sơ trẻ, lưu trữ & chọn trẻ chơi | [`child-profile-crud.md`](03-account/child-profile-crud.md) · [`child-profile-switching.md`](03-account/child-profile-switching.md) · [`child-profile-archive.md`](03-account/child-profile-archive.md) · [`play-entry-and-profile-select.md`](04-play/play-entry-and-profile-select.md) |
| 10 | Gắn tag nội dung & **Seeder nội dung nền** | [`content-tagging.md`](01-platform/content-tagging.md) · [`content-seed-authoring.md`](01-platform/content-seed-authoring.md) |
| 11 | ≥120 game level `published` | [`game-level-model.md`](05-content/game-level-model.md) |
| 11b | Tìm kiếm nội dung — chung cho catalog công khai, thư viện, studio | [`content-search.md`](01-platform/content-search.md) |
| 11c | Đóng claim, KPI và protocol evidence sư phạm/kiểm thử với trẻ trước cổng ra P1 | Chưa có spec owner; [`Task #81`](../tasks/81-pedagogical-evidence-contract-plan.md) tạo contract trước khi các ca “trẻ thật” được dùng làm bằng chứng sản phẩm |
| 12 | Báo cáo cơ bản, trang chính của User & thư viện cá nhân | [`basic-report.md`](03-account/basic-report.md) · [`member-dashboard.md`](03-account/member-dashboard.md) · [`my-library.md`](03-account/my-library.md) |
| 13 | Public site, SEO & Trang pháp lý | [`landing-page.md`](02-public/landing-page.md) · [`game-catalog-public.md`](02-public/game-catalog-public.md) · [`game-detail-public.md`](02-public/game-detail-public.md) · [`seo-and-structured-data.md`](02-public/seo-and-structured-data.md) · [`legal-pages.md`](02-public/legal-pages.md) · [`faq-and-help.md`](02-public/faq-and-help.md) · [`cookie-and-consent-banner.md`](02-public/cookie-and-consent-banner.md) |
| 14 | Cài đặt tài khoản, legal document singleton, force đồng ý lại & xoá tài khoản | [`account-settings.md`](03-account/account-settings.md) · [`consent-management.md`](03-account/consent-management.md) · [`legal-consent-admin.md`](06-admin/legal-consent-admin.md) · [`account-deletion.md`](03-account/account-deletion.md) |
| 15 | **Đăng nhập SNS** — Google trước, Facebook sau | [`oauth-provider-registry.md`](01-platform/oauth-provider-registry.md) → [`social-login.md`](03-account/social-login.md) → [`social-account-linking.md`](03-account/social-account-linking.md) |
| 16 | Trình duyệt taxonomy admin & Giám sát hệ thống | [`taxonomy-browser.md`](06-admin/taxonomy-browser.md) · [`monitoring-and-alerting.md`](01-platform/monitoring-and-alerting.md) |

Thứ tự ở #15 **không đảo được**: [`social-account-linking.md`](03-account/social-account-linking.md) là lối thoát duy nhất cho nhánh
409 `SOCIAL_EMAIL_CONFLICT` của [`social-login.md`](03-account/social-login.md) (`BR-SCL-04`). Ship [`social-login.md`](03-account/social-login.md) mà chưa có
màn hình liên kết là đẩy mọi người dùng trùng email vào ngõ cụt.

**D-CA** (T15, 2026-08-09): [`my-library.md`](03-account/my-library.md) (bước 12) khai
`depends_on: CONTENT-SEARCH`, nhưng bản trước xếp [`content-search.md`](01-platform/content-search.md)
ở bước 13 — **sau** my-library. Cạnh là thật: Objective của spec đó tự khai là mặt tìm kiếm
dùng chung cho "catalog công khai, thư viện của User, và studio của Manager" — my-library
chính là một trong ba bề mặt đó, không phải phụ thuộc thừa. Sửa bằng tách nó thành bước riêng
11b, chạy trước bước 12, thay vì sửa `depends_on`.


## P2 — Commerce + Admin

```
package-catalog ──→ payment-order-create ──→ payment-proof-upload ──→ payment-queue ──→ payment-approval ──→ entitlement grant
schema-driven-form ──→ game-level-studio ──→ live-preview ──→ publish-and-version
image-upload · emoji-picker ──→ game-level-studio
```

| # | Việc | Spec sở hữu |
|---|---|---|
| 1 | Admin shell | [`admin-dashboard.md`](06-admin/admin-dashboard.md) |
| 2 | Tra cứu vận hành | [`user-management.md`](06-admin/user-management.md) · [`user-detail.md`](06-admin/user-detail.md) · [`child-profile-admin.md`](06-admin/child-profile-admin.md) |
| 3 | Luồng tiền, hai đầu | [`payment-flow.md`](00-foundation/payment-flow.md) · [`pricing-page.md`](02-public/pricing-page.md) · [`payment-order-create.md`](03-account/payment-order-create.md) → [`payment-proof-upload.md`](03-account/payment-proof-upload.md) → [`payment-queue.md`](06-admin/payment-queue.md) → [`payment-approval.md`](06-admin/payment-approval.md) |
| 4 | Cấp quyền tay + xem catalog | [`entitlement-grant.md`](06-admin/entitlement-grant.md) · [`package-catalog-admin.md`](06-admin/package-catalog-admin.md) · [`subscription-view.md`](03-account/subscription-view.md) |
| 5 | Studio: form sinh từ schema | [`schema-driven-form.md`](06-admin/schema-driven-form.md) |
| 6 | Studio: soạn game level + bộ chọn emoji là vật liệu chính | [`game-level-studio.md`](06-admin/game-level-studio.md) · [`live-preview.md`](06-admin/live-preview.md) · [`emoji-picker.md`](06-admin/emoji-picker.md) |
| 7 | Asset & Storage ảnh và audio | [`image-storage.md`](01-platform/image-storage.md) · [`image-upload.md`](06-admin/image-upload.md) · [`asset-usage-tracking.md`](06-admin/asset-usage-tracking.md) · [`audio-storage.md`](01-platform/audio-storage.md) |
| 8 | Duyệt và phát hành | [`content-review-queue.md`](06-admin/content-review-queue.md) · [`publish-and-version.md`](06-admin/publish-and-version.md) · [`seo-content-admin.md`](06-admin/seo-content-admin.md) |
| 9 | Cờ & Quản trị dữ liệu | [`feature-flag-service.md`](01-platform/feature-flag-service.md) · [`feature-flags.md`](06-admin/feature-flags.md) · [`data-export.md`](06-admin/data-export.md) · [`notification-admin.md`](06-admin/notification-admin.md) |
| 10 | Nhật ký | [`audit-log-viewer.md`](06-admin/audit-log-viewer.md) · [`error-log-viewer.md`](06-admin/error-log-viewer.md) · [`system-activity.md`](06-admin/system-activity.md) |
| 11 | MFA tuỳ chọn cho User | [`mfa.md`](03-account/mfa.md) |

## P3 — Curriculum

| # | Việc | Spec sở hữu |
|---|---|---|
| 1 | Mô hình lesson + activity | [`lesson-model.md`](05-content/lesson-model.md) · [`activity-model.md`](05-content/activity-model.md) |
| 2 | Soạn lesson và activity | [`lesson-authoring.md`](06-admin/lesson-authoring.md) · [`activity-authoring.md`](06-admin/activity-authoring.md) |
| 3 | Mô hình + builder curriculum | [`curriculum-model.md`](05-content/curriculum-model.md) · [`curriculum-builder.md`](06-admin/curriculum-builder.md) |
| 4 | Player curriculum | [`curriculum-player.md`](04-play/curriculum-player.md) |
| 5 | Mastery + adaptive | [`adaptive-engine.md`](01-platform/adaptive-engine.md) · [`progress-and-mastery.md`](04-play/progress-and-mastery.md) |
| 6 | Gợi ý game kế tiếp | [`next-game-recommendation.md`](04-play/next-game-recommendation.md) |
| 7 | Báo cáo nâng cao | [`advanced-report.md`](03-account/advanced-report.md) |
| 8 | Trưng bày chương trình ra public | [`program-showcase.md`](02-public/program-showcase.md) |
| 9 | Tích hợp curriculum vào account: bật khối chương trình đang học, chốt bố cục nhiều trẻ và phạm vi thư viện theo trẻ | [`member-dashboard.md`](03-account/member-dashboard.md) · [`my-library.md`](03-account/my-library.md) · [`curriculum-player.md`](04-play/curriculum-player.md) — [`Task #82`](../tasks/82-p3-account-curriculum-integration-plan.md) |

## P4 — Add-on (ngoài MVP)

Chỉ bắt đầu khi P0–P3 đã `implemented`. Mỗi add-on **lên catalog cùng lúc với tính năng của nó**, không trước.

[`worksheet-model.md`](05-content/worksheet-model.md) · [`lesson-plan-creator.md`](07-addon/lesson-plan-creator.md) → [`pdf-export.md`](07-addon/pdf-export.md) · [`personal-curriculum.md`](07-addon/personal-curriculum.md) · [`custom-game-builder.md`](07-addon/custom-game-builder.md) · [`ai-credit-ledger.md`](07-addon/ai-credit-ledger.md) → [`ai-assistant.md`](07-addon/ai-assistant.md) · [`semantic-search.md`](07-addon/semantic-search.md)

## P5 — Web scale (ngoài MVP)

P5 chỉ mở sau khi P0–P4 `implemented`. Đây là scale cho **cùng sản phẩm web tại Việt Nam**,
không phải nơi giữ chỗ cho mô hình sản phẩm khác.

| # | Việc | Spec sở hữu | Hồ sơ task |
|---|---|---|---|
| 0 | Đóng contract Web scale và tạo spec owner còn thiếu | [`pwa-install.md`](01-platform/pwa-install.md) đã có; automated payment và offline curriculum pack đã có spec riêng | Task #70 |
| 1 | Cổng thanh toán tự động, đối soát và huỷ gói theo outcome đã duyệt | [`automated-payment.md`](01-platform/automated-payment.md) · [`recurring-billing.md`](03-account/recurring-billing.md) · [`admin-subscription-cancel.md`](06-admin/admin-subscription-cancel.md) | Task #71 |
| 2 | PWA install và offline curriculum pack | [`pwa-install.md`](01-platform/pwa-install.md) · [`offline-play.md`](01-platform/offline-play.md) · [`offline-curriculum-pack.md`](01-platform/offline-curriculum-pack.md) | Task #72 |
| 3 | User xem lại notification và nhận browser push best-effort | [`notification-inbox.md`](03-account/notification-inbox.md) → [`browser-push.md`](01-platform/browser-push.md); FCM không chặn email | Task #84 |
| 4 | Cổng ra Web scale dựa trên evidence | Spec/task manifest được duyệt ở Task #70, bổ sung evidence notification nếu Task #84 vào release | Task #78 |

Task #73–#77 đã loại khỏi backlog hiện hành: classroom, native mobile app, licensing,
localization và mở thị trường không có spec/task placeholder. ID task không tái sử dụng. Nếu
sau này Product mở một outcome, bắt đầu bằng quyết định scope + spec mới + task số mới.

## Coverage plan, task và mức sẵn sàng

“Có file plan” chỉ chứng minh **coverage cấu trúc**. Một phase chỉ sẵn sàng implement khi spec
owner đã tồn tại, câu hỏi chặn phase đã có quyết định người, mọi dependency đứng trước, và work
package đã được tách xuống cỡ S/M. Audit ngày 2026-08-12 cho kết quả:

| Phase | Coverage hồ sơ hiện hành | Mức sẵn sàng sau audit |
|---|---|---|
| P0 | Task #1, #2, #3, #7, #14, các increment #16–#25, hardening Task #83 và auth adapter Task #85 | Contract package core và auth adapter đã đổi; P0 chỉ trở lại xanh sau evidence Task #83, Task #85 và gate Task #14 |
| P1 | Task #26–#42; contract closure ở [`Task #80`](../tasks/80-audio-contract-closure-plan.md) (implementation [`Task #87`](../tasks/87-p1-audio-runtime-delivery-plan.md)) và [`Task #81`](../tasks/81-pedagogical-evidence-contract-plan.md) | Contract audio và evidence sư phạm đã đóng; implementation audio runtime được giao tại Task #87 |
| P2 | Task #43–#53 | Đủ cho 11 bước; audio storage P2 đã có spec [`audio-storage.md`](01-platform/audio-storage.md) tách biệt khỏi pipeline ảnh của Task #49 |
| P3 | Task #54–#61 và lát account bổ sung [`Task #82`](../tasks/82-p3-account-curriculum-integration-plan.md) | Coverage cũ thiếu ba debt account từ P1.12; còn chặn người ở quyết định ≥60 hay ≥126 lesson và bố cục nhiều trẻ |
| P4 | Task #62–#69 | Đủ 8 outcome add-on hiện hành; giá, quota, provider và schema vector vẫn là contract gate, không được thay bằng số placeholder |
| P5 | Task #70–#72, #78 và #84 | Đủ ở mức contract-first cho Web scale; FCM/inbox đứng sau package core Task #83 và không chặn email |

Task #14 là master dependency graph và phase gate; các task increment là lát dọc có acceptance
criteria. Hai lớp bổ sung nhau, không phải hai implementation plan cạnh tranh. Task #1–#13 và
[`plan.md`](../tasks/plan.md)/[`todo.md`](../tasks/todo.md) là hồ sơ đã hoàn tất, không phải
backlog đang hoạt động.

Audit task sizing ban đầu tìm thấy **19** work package tự gắn cỡ `L`/`XL` trong 10 plan active.
[`Task #79`](../tasks/79-roadmap-scope-audit-plan.md) đã tách cả 19 thành work package S/M có
dependency, gate và ranh giới PR; query `**Cỡ:** L|XL` hiện trả rỗng. Plan mới không được thêm
lại nhãn L/XL không có lát con; mỗi package tiếp tục giữ khoảng 1–5 file và test RED riêng.

## Việc chạy song song được

| Nhóm | Không phụ thuộc nhau |
|---|---|
| A | [`game-engine-runtime.md`](01-platform/game-engine-runtime.md) (6 template) |
| B | [`access-gating.md`](04-play/access-gating.md) + [`entitlement-model.md`](00-foundation/entitlement-model.md) |
| C | Public site + SEO |
| E | [`oauth-provider-registry.md`](01-platform/oauth-provider-registry.md) (chỉ cần schema P0 xong) |
| D | Biên soạn seeder nội dung qua [`content-seed-authoring.md`](01-platform/content-seed-authoring.md) (chỉ cần [`game-template-contract.md`](01-platform/game-template-contract.md) xong) |

Nhóm D là đường găng dài nhất của MVP — **bắt đầu sớm nhất có thể**. Xem
[`01-platform/content-seed-authoring.md`](01-platform/content-seed-authoring.md).

## Đường găng

```
game-template-contract → content-seed-authoring → seeder ≥120 level → PR review
```

Đây là chuỗi dài nhất của P1 và **không rút ngắn được bằng cách thêm dev**. Nó bị chặn bởi
năng lực **đọc review** của người, không phải tốc độ soạn thảo. ≥690 LO đã được review và seed
ở P0 theo [`taxonomy-service.md`](01-platform/taxonomy-service.md); xem
[`content-seed-authoring.md`](01-platform/content-seed-authoring.md) §6 cho lô game level.
