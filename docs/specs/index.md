---
doc: SPEC-INDEX
title: Bản đồ specification v2
version: 2.0.0
created: 2026-08-04
---

# Bản đồ specification v2

Bắt đầu từ [`../SPEC.md`](../SPEC.md) — contract toàn dự án. Rồi chọn khu vực.

| Cần gì | Đọc ở đâu |
|---|---|
| **Lần đầu đọc corpus** — ký hiệu, viết tắt, cách đọc | [`READING-GUIDE.md`](READING-GUIDE.md) |
| Quy ước viết spec | [`CONVENTIONS.md`](CONVENTIONS.md) |
| Khuôn spec mới | [`TEMPLATE.md`](TEMPLATE.md) |
| Thứ tự implement | [`roadmap.md`](roadmap.md) |
| Vì sao không dùng lại corpus v1 | [`AUDIT-v1.md`](AUDIT-v1.md) |
| Tra một `BR-*` về spec sở hữu | [`00-foundation/business-rules.md`](00-foundation/business-rules.md) |

## Tổng

| Khu vực | Spec | MVP |
|---|---:|---:|
| `00-foundation` | 16 | 16 |
| `01-platform` | 27 | 26 |
| `02-public` | 9 | 9 |
| `03-account` | 20 | 19 |
| `04-play` | 13 | 13 |
| `05-content` | 5 | 4 |
| `06-admin` | 28 | 28 |
| `07-addon` | 7 | 0 |
| `08-quality` | 5 | 5 |
| **Tổng** | **130** | **120** |

v1 có **31** spec cho cùng phạm vi. Xé nhỏ là chủ ý — xem [`AUDIT-v1.md`](AUDIT-v1.md) §1.2.
2 spec cộng thêm 2026-08-05 ([`repo-bootstrap.md`](00-foundation/repo-bootstrap.md), [`monorepo-package-architecture.md`](00-foundation/monorepo-package-architecture.md)) lấp lỗ hổng
"Dựng repo, migration, cổng tự động" không có spec sở hữu ở [`roadmap.md`](roadmap.md) §P0 — xem `../../SPEC.md` §0 D9–D10.

---

## 00-foundation — contract cắt ngang

| Spec | Phase | Nội dung |
|---|:--:|---|
| **[repo-bootstrap](00-foundation/repo-bootstrap.md)** | P0 | **Chạy đầu tiên** — dựng repo, dependency baseline, port có chọn lọc từ v1 |
| **[monorepo-package-architecture](00-foundation/monorepo-package-architecture.md)** | P0 | Quy tắc package/driver, khi nào adopt thư viện thay vì tự xây |
| [glossary](00-foundation/glossary.md) | P0 | Từ vựng chuẩn, từ bị cấm |
| [id-conventions](00-foundation/id-conventions.md) | P0 | Định dạng mã, mã bất biến |
| [actors](00-foundation/actors.md) | P0 | Guest · User · Child · Manager, hai guard |
| [child-data-compliance](00-foundation/child-data-compliance.md) | P0 | **Nghị định 13/2023**, danh sách đóng field trẻ |
| [access-ladder](00-foundation/access-ladder.md) | P0 | 4 bậc bao hàm, mặc-định-đóng |
| [entitlement-model](00-foundation/entitlement-model.md) | P0 | 16 entitlement key, quota |
| [package-catalog](00-foundation/package-catalog.md) | P0 | 2 SKU MVP + 4 add-on Cấm chưa bán |
| [payment-flow](00-foundation/payment-flow.md) | P2 | Máy trạng thái VietQR duyệt tay |
| [content-lifecycle](00-foundation/content-lifecycle.md) | P0 | 6 trạng thái, cổng duyệt |
| [content-versioning](00-foundation/content-versioning.md) | P0 | Version, ghim lịch sử, rollback |
| [error-codes](00-foundation/error-codes.md) | P0 | Registry mã lỗi |
| [event-catalog](00-foundation/event-catalog.md) | P0 | Catalog event + schema payload |
| [business-rules](00-foundation/business-rules.md) | P0 | Registry BR + **rule không bao giờ nới** |
| [mvp-scope](00-foundation/mvp-scope.md) | P0 | Phase gate, điểm cắt, ngoài phạm vi |

## 01-platform — năng lực nội bộ

| Spec | Phase | Nội dung |
|---|:--:|---|
| [data-model-overview](01-platform/data-model-overview.md) | P0 | Bản đồ 11 module schema |
| [schema-identity-billing](01-platform/schema-identity-billing.md) | P0 | Cột identity · billing · ops |
| [schema-content-taxonomy](01-platform/schema-content-taxonomy.md) | P0 | Cột taxonomy · game · content · curriculum |
| [schema-play-telemetry](01-platform/schema-play-telemetry.md) | P0 | Cột child · play · adaptive |
| [taxonomy-service](01-platform/taxonomy-service.md) | P0 | Cây 5 tầng, DAG, 230 skill |
| [auth-tokens-sessions](01-platform/auth-tokens-sessions.md) | P0 | JWT, cookie, refresh xoay, **reauth 5 phút** |
| [audit-log](01-platform/audit-log.md) | P0 | 28 hành động bắt buộc audit |
| [emoji-registry](01-platform/emoji-registry.md) | P0 | Kho emoji cố định, 32 nhóm |
| [rate-limiting](01-platform/rate-limiting.md) | P0 | Hai trục IP + account |
| [health-check](01-platform/health-check.md) | P0 | Cấm 200 cứng |
| [backup-and-restore](01-platform/backup-and-restore.md) | P0 | Verify hàng tuần, chặn go-live |
| **[ai-codegen-pipeline](01-platform/ai-codegen-pipeline.md)** | P0 | **Sinh code từ spec**, vùng cấm |
| **[content-seed-authoring](01-platform/content-seed-authoring.md)** | P1 | **Seeder nội dung nền**, 8 cổng tự động, PR review là cổng người |
| [oauth-provider-registry](01-platform/oauth-provider-registry.md) | P1 | Google + Facebook, PKCE, danh sách đóng |
| [game-template-contract](01-platform/game-template-contract.md) | P1 | 6 template, `content_contract` |
| [game-engine-runtime](01-platform/game-engine-runtime.md) | P1 | Canvas 60fps, bất biến bề mặt trẻ |
| [telemetry-pipeline](01-platform/telemetry-pipeline.md) | P1 | Rollup, KPI nội dung |
| [content-tagging](01-platform/content-tagging.md) | P1 | Ba trục what/thinking/mechanic |
| [content-search](01-platform/content-search.md) | P1 | Bộ lọc, lọc theo quyền |
| [job-queue](01-platform/job-queue.md) | P1 | 10 job, alert khi worker chết |
| [monitoring-and-alerting](01-platform/monitoring-and-alerting.md) | P1 | Alert **tới người** |
| [offline-play](01-platform/offline-play.md) | P1 | Buffer IndexedDB, không ngắt phiên |
| [image-storage](01-platform/image-storage.md) | P2 | Cấm thư viện ảnh |
| [notification-service](01-platform/notification-service.md) | P0 | 11 loại, một kênh email |
| [feature-flag-service](01-platform/feature-flag-service.md) | P2 | Cờ có hạn, mặc định an toàn |
| [adaptive-engine](01-platform/adaptive-engine.md) | P3 | BKT, ZPD, nhãn báo cáo |
| [pwa-install](01-platform/pwa-install.md) | P5 | Ngoài MVP |

## 02-public — khách chưa đăng nhập

| Spec | Phase | Nội dung |
|---|:--:|---|
| [landing-page](02-public/landing-page.md) | P1 | 9 khối, CTA chơi thử ở màn hình đầu |
| [game-catalog-public](02-public/game-catalog-public.md) | P1 | Hiện metadata game khoá |
| [game-detail-public](02-public/game-detail-public.md) | P1 | 120 trang đích SEO |
| [seo-and-structured-data](02-public/seo-and-structured-data.md) | P1 | Sitemap động, JSON-LD |
| [legal-pages](02-public/legal-pages.md) | P1 | 8 trang, version hoá |
| [cookie-and-consent-banner](02-public/cookie-and-consent-banner.md) | P1 | 6 cookie, không bên thứ ba |
| [faq-and-help](02-public/faq-and-help.md) | P1 | 5 nhóm, trả lời thẳng câu khó |
| [pricing-page](02-public/pricing-page.md) | P2 | Cấm khan hiếm giả |
| [program-showcase](02-public/program-showcase.md) | P3 | Hiện cấu trúc, giấu nội dung |

## 03-account — User đã đăng nhập

| Spec | Phase | Nội dung |
|---|:--:|---|
| [registration](03-account/registration.md) | P0 | 3 trường, 2 checkbox đồng ý |
| [login-and-session](03-account/login-and-session.md) | P0 | Refresh xoay, quản lý thiết bị |
| [email-verification](03-account/email-verification.md) | P0 | Điều kiện tạo hồ sơ trẻ |
| [password-recovery](03-account/password-recovery.md) | P0 | Luôn 200, giết mọi phiên |
| [social-login](03-account/social-login.md) | P1 | Google + Facebook, **không auto-link theo email** |
| [social-account-linking](03-account/social-account-linking.md) | P1 | Nhiều SNS một tài khoản, không gỡ cách vào cuối |
| [child-profile-crud](03-account/child-profile-crud.md) | P1 | Form 4 trường, danh sách đóng |
| [child-profile-switching](03-account/child-profile-switching.md) | P1 | Đổi trẻ qua Parent Gate |
| [child-profile-archive](03-account/child-profile-archive.md) | P1 | Lưu trữ vs xoá |
| [consent-management](03-account/consent-management.md) | P1 | Xem, rút, đổi version |
| [account-settings](03-account/account-settings.md) | P1 | Đổi mật khẩu, email |
| [account-deletion](03-account/account-deletion.md) | P1 | 30 ngày hoàn tác |
| [member-dashboard](03-account/member-dashboard.md) | P1 | 5 khối, `/me` |
| [my-library](03-account/my-library.md) | P1 | Bookmark có tổ chức |
| [basic-report](03-account/basic-report.md) | P1 | 6 mục, không chẩn đoán |
| [payment-order-create](03-account/payment-order-create.md) | P2 | VietQR, nội dung CK nổi bật |
| [payment-proof-upload](03-account/payment-proof-upload.md) | P2 | `soft_unlock` 3 ngày |
| [subscription-view](03-account/subscription-view.md) | P2 | Gói, quyền lợi, lịch sử |
| [mfa](03-account/mfa.md) | P2 | Tuỳ chọn cho User, ngoài MVP |
| [advanced-report](03-account/advanced-report.md) | P3 | 7 mục, ngưỡng dữ liệu tối thiểu |

## 04-play — bề mặt trẻ · **core business**

| Spec | Phase | Nội dung |
|---|:--:|---|
| [access-gating](04-play/access-gating.md) | P1 | **Ma trận 20 ô**, 7 bước |
| [game-config-delivery](04-play/game-config-delivery.md) | P1 | Config đủ cho trọn phiên |
| [play-session-lifecycle](04-play/play-session-lifecycle.md) | P1 | Cấm complete hai lần |
| [play-event-ingestion](04-play/play-event-ingestion.md) | P1 | Idempotent theo `(session, seq)` |
| [scoring-and-result](04-play/scoring-and-result.md) | P1 | Trẻ thấy sao, không thấy điểm |
| [scaffolding-and-hints](04-play/scaffolding-and-hints.md) | P1 | Tự leo thang, không theo yêu cầu |
| [feedback-and-celebration](04-play/feedback-and-celebration.md) | P1 | Sai có phản hồi, không trừng phạt |
| [parent-gate](04-play/parent-gate.md) | P1 | Long-press + phép nhân |
| [healthy-play-limits](04-play/healthy-play-limits.md) | P1 | Hạn mức theo trẻ, theo ICT |
| [play-entry-and-profile-select](04-play/play-entry-and-profile-select.md) | P1 | Sảnh trẻ, không bộ lọc chữ |
| [next-game-recommendation](04-play/next-game-recommendation.md) | P1 | Luật, không ML |
| [curriculum-player](04-play/curriculum-player.md) | P3 | Ghim version, mở khoá tuần |
| [progress-and-mastery](04-play/progress-and-mastery.md) | P3 | Bản đồ, huy hiệu không mất |

## 05-content — ràng buộc biên tập

| Spec | Phase | Nội dung |
|---|:--:|---|
| [game-level-model](05-content/game-level-model.md) | P1 | Trần item theo band, chỉ dẫn ≤12 từ |
| [lesson-model](05-content/lesson-model.md) | P3 | Cung bậc, ≥1 hoạt động ngoài màn hình |
| [activity-model](05-content/activity-model.md) | P3 | Đứng độc lập, danh sách an toàn |
| [curriculum-model](05-content/curriculum-model.md) | P3 | Thứ tự prerequisite, cân bằng |
| [worksheet-model](05-content/worksheet-model.md) | P4 | Ngoài MVP |

## 06-admin — Manager

| Spec | Phase | Nội dung |
|---|:--:|---|
| [admin-auth](06-admin/admin-auth.md) | P0 | MFA bắt buộc, ma trận role |
| [taxonomy-browser](06-admin/taxonomy-browser.md) | P1 | Chỉ đọc, chỉ báo khoảng trống |
| [admin-dashboard](06-admin/admin-dashboard.md) | P2 | 4 nhóm thẻ, chỉ đọc |
| [user-management](06-admin/user-management.md) | P2 | Danh sách, khoá/mở |
| [user-detail](06-admin/user-detail.md) | P2 | 4 nhóm, không dữ liệu học của trẻ |
| [child-profile-admin](06-admin/child-profile-admin.md) | P2 | **Cấm có trang liệt kê trẻ** |
| [entitlement-grant](06-admin/entitlement-grant.md) | P2 | Cấp tay, lý do ≥20 ký tự |
| [payment-queue](06-admin/payment-queue.md) | P2 | Hàng đợi, không nút duyệt |
| [payment-approval](06-admin/payment-approval.md) | P2 | Transaction, checklist đối chiếu |
| [package-catalog-admin](06-admin/package-catalog-admin.md) | P2 | Chỉ đọc |
| [game-level-studio](06-admin/game-level-studio.md) | P2 | Soạn level không cần code |
| [schema-driven-form](06-admin/schema-driven-form.md) | P2 | Form sinh từ Zod |
| [live-preview](06-admin/live-preview.md) | P2 | Engine thật, không mock |
| [content-review-queue](06-admin/content-review-queue.md) | P2 | Cấm duyệt theo lô |
| [publish-and-version](06-admin/publish-and-version.md) | P2 | Publish, archive, rollback |
| [image-upload](06-admin/image-upload.md) | P2 | Crop client, preview cỡ thật |
| [emoji-picker](06-admin/emoji-picker.md) | P2 | Tìm tiếng Việt, ô ≥40px |
| [asset-usage-tracking](06-admin/asset-usage-tracking.md) | P2 | Chặn xoá asset đang dùng |
| [audit-log-viewer](06-admin/audit-log-viewer.md) | P2 | Diff, không JSON thô |
| [error-log-viewer](06-admin/error-log-viewer.md) | P2 | Gom nhóm, đếm người ảnh hưởng |
| [system-activity](06-admin/system-activity.md) | P2 | Cấm xanh khi không biết |
| [feature-flags](06-admin/feature-flags.md) | P2 | Cờ có hạn |
| [data-export](06-admin/data-export.md) | P2 | 6 loại, danh sách đóng |
| [seo-content-admin](06-admin/seo-content-admin.md) | P2 | Rich text hạn chế, 301 tự động |
| [notification-admin](06-admin/notification-admin.md) | P2 | Nhật ký gửi, template |
| [lesson-authoring](06-admin/lesson-authoring.md) | P3 | Lắp activity vào lesson |
| [activity-authoring](06-admin/activity-authoring.md) | P3 | 10 loại activity |
| [curriculum-builder](06-admin/curriculum-builder.md) | P3 | 6 chỉ báo cân bằng |

## 07-addon — spec đầy đủ, **không bán ở MVP**

| Spec | Phase | Lên catalog khi |
|---|:--:|---|
| [lesson-plan-creator](07-addon/lesson-plan-creator.md) | P4 | spec này `implemented` |
| [pdf-export](07-addon/pdf-export.md) | P4 | idem |
| [personal-curriculum](07-addon/personal-curriculum.md) | P4 | idem |
| [custom-game-builder](07-addon/custom-game-builder.md) | P4 | idem |
| [ai-credit-ledger](07-addon/ai-credit-ledger.md) | P4 | **điều kiện tiên quyết** của `addon_ai` |
| [ai-assistant](07-addon/ai-assistant.md) | P4 | sau [`ai-credit-ledger.md`](07-addon/ai-credit-ledger.md) |
| [semantic-search](07-addon/semantic-search.md) | P4 | pgvector, schema + job + rerank riêng khỏi [`ai-assistant.md`](07-addon/ai-assistant.md) |

## 08-quality — contract cắt ngang

| Spec | Phase | Nội dung |
|---|:--:|---|
| [testing-strategy](08-quality/testing-strategy.md) | P0 | 6 tầng, bài không rút gọn |
| [security-checklist](08-quality/security-checklist.md) | P0 | CRITICAL chặn merge |
| [accessibility](08-quality/accessibility.md) | P1 | 4 bề mặt, 4 ngưỡng |
| [performance-budgets](08-quality/performance-budgets.md) | P1 | Ngân sách chặn merge |
| [design-system-contract](08-quality/design-system-contract.md) | P1 | Token, một kit, 4 bề mặt |

---

## Đường găng của MVP

```
game-template-contract → content-seed-authoring → seeder ≥120 level + ≥690 LO → PR review
```

Chuỗi này **không rút ngắn được bằng cách thêm dev**. Nó bị chặn bởi năng lực **đọc
review** của người, không phải tốc độ soạn thảo —
[`01-platform/content-seed-authoring.md`](01-platform/content-seed-authoring.md) §11 Q1.

## Ba câu hỏi mở chặn nhiều nhất

| # | Câu hỏi | Chặn |
|---|---|---|
| 1 | **Ai biên soạn ≥690 LO, ≥120 game level, ≥60 lesson?** | P0 · P1 · P3 |
| 2 | **Giá cuối** của `standard` và `premium` | P2 · trang giá |
| 3 | **Thiết bị chuẩn** đo 60 fps | Cổng ra P1 |

## Đổi contract thì đổi spec trước

Đổi **contract, schema, public API, quyền, giới hạn, giá, hành vi lỗi** → cập nhật spec sở
hữu **trước** khi code. Sửa một dòng để phục hồi contract đã có thì đi thẳng vào implement.

Mỗi outcome có **đúng một** spec sở hữu. Spec khác **link tới**, không copy contract.
