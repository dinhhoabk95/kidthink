---
doc: SPEC-INDEX
title: Bản đồ specification
version: 2.0.0
created: 2026-08-04
reviewed: 2026-10-18
---

# Bản đồ specification

Bắt đầu từ [`../SPEC.md`](../SPEC.md) — contract toàn dự án. Rồi chọn khu vực.

| Cần gì | Đọc ở đâu |
|---|---|
| **Lần đầu đọc corpus** — ký hiệu, viết tắt, cách đọc | [`READING-GUIDE.md`](READING-GUIDE.md) |
| Quy ước viết spec | [`CONVENTIONS.md`](CONVENTIONS.md) |
| Khuôn spec mới | [`TEMPLATE.md`](TEMPLATE.md) |
| Thứ tự implement | [`roadmap.md`](roadmap.md) |
| Tra một `BR-*` về spec sở hữu | [`00-foundation/business-rules.md`](00-foundation/business-rules.md) |
| Phiếu engine `GT-000`…`GT-037` (38 phiếu, bảng sinh tự động) | [`01-platform/engines/index.md`](01-platform/engines/index.md) |

## Tổng

Đếm 2026-10-18 từ frontmatter: một spec là một file `.md` có khoá `spec:` nằm trực tiếp trong
thư mục khu vực (không tính phiếu engine ở `01-platform/engines/`). Cột **MVP** đếm `mvp: true`;
cột **Còn mở** đếm spec có khoá `open_tasks` — code chưa khớp contract, việc còn lại nằm ở task
ghi trong cột **Task mở** của từng bảng dưới. Thêm, xoá hay chuyển spec thì đếm lại bảng này.

| Khu vực | Spec | MVP | Còn mở |
|---|---:|---:|---:|
| `00-foundation` | 20 | 20 | 6 |
| `01-platform` | 44 | 34 | 14 |
| `02-public` | 9 | 9 | 3 |
| `03-account` | 24 | 19 | 18 |
| `04-play` | 21 | 14 | 9 |
| `05-content` | 27 | 10 | 10 |
| `06-admin` | 31 | 30 | 16 |
| `07-addon` | 7 | 0 | 3 |
| `08-quality` | 11 | 9 | 8 |
| **Tổng** | **194** | **145** | **87** |

Một outcome một file là chủ ý — xem [`CONVENTIONS.md`](CONVENTIONS.md) §1. Lịch sử thêm
từng spec nằm trong git và ở `docs/tasks/`, không chép lại ở đây.

---

## 00-foundation — contract cắt ngang

| Spec | Phase | Nội dung | Task mở |
|---|:--:|---|---|
| **[repo-bootstrap](00-foundation/repo-bootstrap.md)** | P0 | **Chạy đầu tiên** — dựng repo, dependency baseline, gate local |  |
| **[monorepo-package-architecture](00-foundation/monorepo-package-architecture.md)** | P0 | Quy tắc package/driver, khi nào adopt thư viện thay vì tự xây |  |
| **[config-ownership](00-foundation/config-ownership.md)** | P1 | Cây quyết định nơi một hằng số cấu hình được phép sống; bốn hạng; cấm bản sao vật lý giữa package |  |
| [app-runtime-boundary](00-foundation/app-runtime-boundary.md) | P0 | Static admin SPA, web SSR/API, cookie namespace và deploy boundary |  |
| [glossary](00-foundation/glossary.md) | P0 | Từ vựng chuẩn, từ bị cấm |  |
| [id-conventions](00-foundation/id-conventions.md) | P0 | Định dạng mã, mã bất biến |  |
| [actors](00-foundation/actors.md) | P0 | Guest · User · Child · Manager, hai guard |  |
| [child-data-compliance](00-foundation/child-data-compliance.md) | P0 | **Luật 91/2025 + Nghị định 13**, danh sách đóng field trẻ |  |
| [access-ladder](00-foundation/access-ladder.md) | P0 | 4 bậc bao hàm, mặc-định-đóng | [#308](../tasks/308-foundation-gaps-plan.md) |
| [entitlement-model](00-foundation/entitlement-model.md) | P0 | 16 entitlement key, quota |  |
| [package-catalog](00-foundation/package-catalog.md) | P0 | 2 SKU MVP + 4 add-on Cấm chưa bán |  |
| [payment-flow](00-foundation/payment-flow.md) | P2 | Máy trạng thái VietQR duyệt tay |  |
| [content-lifecycle](00-foundation/content-lifecycle.md) | P0 | 6 trạng thái, cổng duyệt | [#308](../tasks/308-foundation-gaps-plan.md) |
| [content-versioning](00-foundation/content-versioning.md) | P0 | Version, ghim lịch sử, rollback | [#308](../tasks/308-foundation-gaps-plan.md) |
| [error-codes](00-foundation/error-codes.md) | P0 | Registry mã lỗi |  |
| [api-error-client](00-foundation/api-error-client.md) | P1 | Tầng xử lý lỗi API phía client, interceptor chuẩn hoá | [#308](../tasks/308-foundation-gaps-plan.md) |
| [event-catalog](00-foundation/event-catalog.md) | P0 | Catalog event + schema payload | [#308](../tasks/308-foundation-gaps-plan.md) |
| [business-rules](00-foundation/business-rules.md) | P0 | Registry BR + **rule không bao giờ nới** |  |
| [mvp-scope](00-foundation/mvp-scope.md) | P0 | Phase gate, điểm cắt, ngoài phạm vi |  |
| [data-model-overview](00-foundation/data-model-overview.md) | P0 | Bản đồ 11 module schema | [#305](../tasks/305-platform-api-gaps-plan.md) |

## 01-platform — năng lực nội bộ

| Spec | Phase | Nội dung | Task mở |
|---|:--:|---|---|
| [schema-identity-billing](01-platform/schema-identity-billing.md) | P0 | Cột identity · billing · ops |  |
| [schema-content-taxonomy](01-platform/schema-content-taxonomy.md) | P0 | Cột taxonomy · game · content · curriculum |  |
| [schema-play-telemetry](01-platform/schema-play-telemetry.md) | P0 | Cột child · play · adaptive |  |
| [taxonomy-service](01-platform/taxonomy-service.md) | P0 | Cây 5 tầng, DAG, 443 skill |  |
| [auth-tokens-sessions](01-platform/auth-tokens-sessions.md) | P0 | Opaque cookie session Redis 1 giờ, remember tối đa 1 năm, revoke thiết bị, **reauth 5 phút** | [#305](../tasks/305-platform-api-gaps-plan.md) |
| [audit-log](01-platform/audit-log.md) | P0 | 29 hành động bắt buộc audit | [#305](../tasks/305-platform-api-gaps-plan.md) |
| [emoji-registry](01-platform/emoji-registry.md) | P0 | Kho emoji cố định, 32 nhóm |  |
| [rate-limiting](01-platform/rate-limiting.md) | P0 | Hai trục IP + account |  |
| [health-check](01-platform/health-check.md) | P0 | Cấm 200 cứng | [#304](../tasks/304-platform-ops-gaps-plan.md) |
| [backup-and-restore](01-platform/backup-and-restore.md) | P0 | Verify hàng tuần, chặn go-live | [#304](../tasks/304-platform-ops-gaps-plan.md) |
| [env-contract](01-platform/env-contract.md) | P0 | Runtime env tách khỏi public API build config, kiểm trước khi build |  |
| [server-provisioning](01-platform/server-provisioning.md) | P0 | Máy trắng thành máy chạy được, chạy lại nhiều lần |  |
| [process-supervision](01-platform/process-supervision.md) | P0 | Hai tiến trình runtime, admin static, nạp lại không cắt, log có giới hạn | [#304](../tasks/304-platform-ops-gaps-plan.md) |
| [release-deploy](01-platform/release-deploy.md) | P0 | Một lệnh, nguồn là commit trên kho, cổng khói | [#304](../tasks/304-platform-ops-gaps-plan.md) |
| [release-rollback](01-platform/release-rollback.md) | P0 | Quay lui dưới 60 giây, chỉ migration cộng thêm |  |
| **[ai-codegen-pipeline](01-platform/ai-codegen-pipeline.md)** | P0 | **Sinh code từ spec**, vùng cấm | [#307](../tasks/307-ai-codegen-pipeline-plan.md) |
| **[content-seed-authoring](01-platform/content-seed-authoring.md)** | P1 | **Seeder nội dung nền**, 10 cổng tự động, PR review là cổng người |  |
| [oauth-provider-registry](01-platform/oauth-provider-registry.md) | P1 | Google + Facebook, PKCE, danh sách đóng |  |
| [game-template-contract](01-platform/game-template-contract.md) | P1 | 38 khuôn `GT-000`…`GT-037`, `content_contract` | [#305](../tasks/305-platform-api-gaps-plan.md) |
| [game-engine-runtime](01-platform/game-engine-runtime.md) | P1 | Canvas 60fps, bất biến bề mặt trẻ |  |
| [game-layout-engine](01-platform/game-layout-engine.md) | P1 | Từ vựng layout, hình học slot, sàn chạm | [#305](../tasks/305-platform-api-gaps-plan.md) |
| [deterministic-randomness](01-platform/deterministic-randomness.md) | P1 | Seed một phiên, xáo tái dựng được |  |
| [template-authoring-kit](01-platform/template-authoring-kit.md) | P4 | Một template mới bằng một file mô tả |  |
| [engine-spec-sheet](01-platform/engine-spec-sheet.md) | P4 | Mỗi mã GT một phiếu, cổng đối chiếu với registry |  |
| [level-generator-kit](01-platform/level-generator-kit.md) | P4 | Chi phí soạn level thứ 4 tới thứ 40 |  |
| [engine-render-contract](01-platform/engine-render-contract.md) | P4 | Hợp đồng vẽ, bốn lớp, 5 trạng thái thị giác |  |
| [engine-play-language](01-platform/engine-play-language.md) | P1 | Ngôn ngữ chơi, 6 cử chỉ, 3 nhịp, 5 trạng thái | [#305](../tasks/305-platform-api-gaps-plan.md) |
| [engine-behavior-domain](01-platform/engine-behavior-domain.md) | P4 | Sáu miền hành vi, bằng chứng quan sát, trục biến thể và độ mở |  |
| [engine-turn-script](01-platform/engine-turn-script.md) | P4 | Bảy nhịp một lượt chơi, tự đọc đề, tám nhánh bắt buộc |  |
| [engine-input-contract](01-platform/engine-input-contract.md) | P1 | Hợp đồng nhập, ba vòng đời con trỏ, toLogicPoint, dispatch thuần |  |
| [play-stage-zones](01-platform/play-stage-zones.md) | P4 | Bàn chơi năm vùng: HUD, lời dẫn, sân khấu, khay, nút hành động; sàn chạm trên px thật; khay nhiều hàng không phân trang, lời dẫn cột ở điện thoại ngang (`BR-PSZ-13`) |  |
| [telemetry-pipeline](01-platform/telemetry-pipeline.md) | P1 | Rollup, KPI nội dung |  |
| [content-search](01-platform/content-search.md) | P1 | Bộ lọc, lọc theo quyền |  |
| [job-queue](01-platform/job-queue.md) | P1 | 10 job, alert khi worker chết |  |
| [monitoring-and-alerting](01-platform/monitoring-and-alerting.md) | P1 | Alert **tới người** |  |
| [offline-play](01-platform/offline-play.md) | P1 | Buffer IndexedDB, không ngắt phiên | [#303](../tasks/303-offline-play-buffer-plan.md) |
| [image-storage](01-platform/image-storage.md) | P2 | Cấm thư viện ảnh |  |
| [audio-storage](01-platform/audio-storage.md) | P2 | Lưu trữ và chuẩn hoá audio asset | [#306](../tasks/306-audio-storage-plan.md) |
| [notification-service](01-platform/notification-service.md) | P0 | Logical notification + delivery adapter; email qua SES SMTP | [#289](../tasks/289-transactional-email-dispatch-plan.md) |
| [browser-push](01-platform/browser-push.md) | P5 | FCM Web cho User, best-effort, không push trẻ |  |
| [automated-payment](01-platform/automated-payment.md) | P5 | Cổng thanh toán tự động, webhook signature, đối soát | [#305](../tasks/305-platform-api-gaps-plan.md) |
| [feature-flag-service](01-platform/feature-flag-service.md) | P2 | Cờ có hạn, mặc định an toàn |  |
| [adaptive-engine](01-platform/adaptive-engine.md) | P3 | BKT, ZPD, nhãn báo cáo |  |
| [pwa-install](01-platform/pwa-install.md) | P5 | Web install ngoài MVP; không phải native mobile app |  |

## 02-public — khách chưa đăng nhập

| Spec | Phase | Nội dung | Task mở |
|---|:--:|---|---|
| [landing-page](02-public/landing-page.md) | P1 | 9 khối, CTA chơi thử ở màn hình đầu |  |
| [game-catalog-public](02-public/game-catalog-public.md) | P1 | Hiện metadata game khoá |  |
| [game-detail-public](02-public/game-detail-public.md) | P1 | 120 trang đích SEO |  |
| [seo-and-structured-data](02-public/seo-and-structured-data.md) | P1 | Sitemap động, JSON-LD | [#291](../tasks/291-public-account-small-gaps-plan.md) |
| [legal-pages](02-public/legal-pages.md) | P1 | 8 document singleton code-owned, không policy version |  |
| [cookie-and-consent-banner](02-public/cookie-and-consent-banner.md) | P1 | 6 cookie, không bên thứ ba |  |
| [faq-and-help](02-public/faq-and-help.md) | P1 | 5 nhóm, trả lời thẳng câu khó | [#291](../tasks/291-public-account-small-gaps-plan.md) |
| [pricing-page](02-public/pricing-page.md) | P2 | Cấm khan hiếm giả | [#290](../tasks/290-account-ui-missing-pages-plan.md) · [#292](../tasks/292-recurring-billing-plan.md) |
| [program-showcase](02-public/program-showcase.md) | P3 | Hiện cấu trúc, giấu nội dung |  |

## 03-account — User đã đăng nhập

| Spec | Phase | Nội dung | Task mở |
|---|:--:|---|---|
| [registration](03-account/registration.md) | P0 | 3 trường, 2 checkbox đồng ý | [#289](../tasks/289-transactional-email-dispatch-plan.md) · [#290](../tasks/290-account-ui-missing-pages-plan.md) |
| [login-and-session](03-account/login-and-session.md) | P0 | Cookie session một giờ, remember-me và quản lý thiết bị | [#290](../tasks/290-account-ui-missing-pages-plan.md) |
| [email-verification](03-account/email-verification.md) | P0 | Điều kiện tạo hồ sơ trẻ | [#289](../tasks/289-transactional-email-dispatch-plan.md) · [#290](../tasks/290-account-ui-missing-pages-plan.md) |
| [password-recovery](03-account/password-recovery.md) | P0 | Luôn 200, giết mọi phiên | [#289](../tasks/289-transactional-email-dispatch-plan.md) · [#290](../tasks/290-account-ui-missing-pages-plan.md) |
| [social-login](03-account/social-login.md) | P1 | Google + Facebook, **không auto-link theo email** | [#289](../tasks/289-transactional-email-dispatch-plan.md) |
| [social-account-linking](03-account/social-account-linking.md) | P1 | Nhiều SNS một tài khoản, không gỡ cách vào cuối | [#289](../tasks/289-transactional-email-dispatch-plan.md) |
| [child-profile-crud](03-account/child-profile-crud.md) | P1 | Form 4 trường, danh sách đóng | [#290](../tasks/290-account-ui-missing-pages-plan.md) |
| [child-profile-switching](03-account/child-profile-switching.md) | P1 | Đổi trẻ qua Parent Gate |  |
| [child-profile-archive](03-account/child-profile-archive.md) | P1 | Lưu trữ vs xoá | [#290](../tasks/290-account-ui-missing-pages-plan.md) |
| [consent-management](03-account/consent-management.md) | P1 | Xem, rút, marker force đồng ý lại |  |
| [account-settings](03-account/account-settings.md) | P1 | Đổi mật khẩu, email | [#290](../tasks/290-account-ui-missing-pages-plan.md) |
| [account-deletion](03-account/account-deletion.md) | P1 | 30 ngày hoàn tác | [#290](../tasks/290-account-ui-missing-pages-plan.md) |
| [member-dashboard](03-account/member-dashboard.md) | P1 | 5 khối, `/me` |  |
| [my-library](03-account/my-library.md) | P1 | Bookmark có tổ chức | [#290](../tasks/290-account-ui-missing-pages-plan.md) |
| [basic-report](03-account/basic-report.md) | P1 | 6 mục, không chẩn đoán | [#291](../tasks/291-public-account-small-gaps-plan.md) |
| [payment-order-create](03-account/payment-order-create.md) | P2 | VietQR, nội dung CK nổi bật | [#290](../tasks/290-account-ui-missing-pages-plan.md) |
| [payment-proof-upload](03-account/payment-proof-upload.md) | P2 | `soft_unlock` 3 ngày | [#290](../tasks/290-account-ui-missing-pages-plan.md) |
| [subscription-view](03-account/subscription-view.md) | P2 | Gói, quyền lợi, lịch sử | [#291](../tasks/291-public-account-small-gaps-plan.md) |
| [mfa](03-account/mfa.md) | P2 | Tuỳ chọn cho User, ngoài MVP |  |
| [notification-inbox](03-account/notification-inbox.md) | P5 | User xem lại logical notification, read state | [#290](../tasks/290-account-ui-missing-pages-plan.md) |
| [recurring-billing](03-account/recurring-billing.md) | P5 | Gia hạn thuê bao tự động, opt-in consent snapshot, dunning | [#292](../tasks/292-recurring-billing-plan.md) |
| [advanced-report](03-account/advanced-report.md) | P3 | 7 mục, ngưỡng dữ liệu tối thiểu |  |
| [offline-curriculum-pack](03-account/offline-curriculum-pack.md) | P5 | Gói học tập offline, 7-day lease, quota & sync | [#303](../tasks/303-offline-play-buffer-plan.md) |
| [lesson-session-runner](03-account/lesson-session-runner.md) | P4 | Người dạy chạy tiết học, một bước một lúc |  |

## 04-play — bề mặt trẻ · **core business**

| Spec | Phase | Nội dung | Task mở |
|---|:--:|---|---|
| [access-gating](04-play/access-gating.md) | P1 | **Ma trận 20 ô**, 7 bước |  |
| [game-config-delivery](04-play/game-config-delivery.md) | P1 | Config đủ cho trọn phiên |  |
| [play-session-lifecycle](04-play/play-session-lifecycle.md) | P1 | Cấm complete hai lần |  |
| [play-event-ingestion](04-play/play-event-ingestion.md) | P1 | Idempotent theo `(session, seq)` | [#294](../tasks/294-play-surface-gaps-plan.md) |
| [scoring-and-result](04-play/scoring-and-result.md) | P1 | Trẻ thấy sao, không thấy điểm |  |
| [scaffolding-and-hints](04-play/scaffolding-and-hints.md) | P1 | Tự leo thang, không theo yêu cầu |  |
| [feedback-and-celebration](04-play/feedback-and-celebration.md) | P1 | Sai có phản hồi, không trừng phạt |  |
| [parent-gate](04-play/parent-gate.md) | P1 | Long-press + phép nhân | [#294](../tasks/294-play-surface-gaps-plan.md) |
| [healthy-play-limits](04-play/healthy-play-limits.md) | P1 | Hạn mức theo trẻ, theo ICT | [#293](../tasks/293-healthy-play-limits-enforcement-plan.md) |
| [play-entry-and-profile-select](04-play/play-entry-and-profile-select.md) | P1 | Sảnh trẻ, không bộ lọc chữ | [#294](../tasks/294-play-surface-gaps-plan.md) |
| [round-sequence-play](04-play/round-sequence-play.md) | P2 | Nhiều vòng một phiên, luôn phát `round_started` |  |
| [next-game-recommendation](04-play/next-game-recommendation.md) | P3 | Luật, không ML |  |
| [curriculum-player](04-play/curriculum-player.md) | P3 | Ghim version, mở khoá tuần |  |
| [progress-and-mastery](04-play/progress-and-mastery.md) | P3 | Bản đồ, huy hiệu không mất | [#294](../tasks/294-play-surface-gaps-plan.md) |
| [child-lesson-flow](04-play/child-lesson-flow.md) | P4 | Trẻ tự học một bài: làm quen → trò chơi → thưởng; tiến độ suy từ `play_sessions` |  |
| [sticker-album](04-play/sticker-album.md) | P4 | Mỗi bài xong một sticker theo chủ đề, album không mất, không số đếm |  |
| [concept-intro-runner](04-play/concept-intro-runner.md) | P4 | Ba nhịp giới thiệu → nhận biết → gọi tên, trẻ chạy một mình | [#295](../tasks/295-concept-intro-segments-plan.md) |
| [concept-intro-gate](04-play/concept-intro-gate.md) | P4 | Bước 8: chưa làm quen khái niệm thì chưa vào màn chơi | [#295](../tasks/295-concept-intro-segments-plan.md) |
| [child-theme-map](04-play/child-theme-map.md) | P4 | Bản đồ chủ đề tuần theo 10 chủ đề GDMN, trạm bài học, mascot định vị |  |
| [child-competency-explorer](04-play/child-competency-explorer.md) | P4 | Khám phá trò chơi theo 6 năng lực tư duy trên Kid Surface, lọc theo tuổi, khoá trung tính | [#294](../tasks/294-play-surface-gaps-plan.md) |
| **[play-narration](04-play/play-narration.md)** | P1 | Mọi yêu cầu trên bề mặt trẻ phải nghe được trước khi đọc được; bốn bậc dự phòng, cấm im lặng | [#296](../tasks/296-play-narration-debt-plan.md) |

## 05-content — ràng buộc biên tập

| Spec | Phase | Nội dung | Task mở |
|---|:--:|---|---|
| [game-level-model](05-content/game-level-model.md) | P1 | Trần item theo band, chỉ dẫn ≤12 từ | [#309](../tasks/309-content-model-gaps-plan.md) |
| [round-set-model](05-content/round-set-model.md) | P2 | Một template, dãy vòng leo một chiều |  |
| [round-set-corpus-depth](05-content/round-set-corpus-depth.md) | P4 | Sàn vòng thật có trong corpus, vòng gọi lại, bậc thang 4 mức |  |
| [lesson-model](05-content/lesson-model.md) | P3 | Cung bậc, ≥1 hoạt động ngoài màn hình |  |
| [activity-model](05-content/activity-model.md) | P3 | Đứng độc lập, danh sách an toàn |  |
| [curriculum-model](05-content/curriculum-model.md) | P3 | Thứ tự prerequisite, cân bằng |  |
| **[learning-roadmap-model](05-content/learning-roadmap-model.md)** | P4 | Lộ trình theo lứa tuổi là nguồn cầu; sổ cầu nội dung; cấm gán tiết bằng phép chia lấy dư |  |
| **[lesson-topic-composition](05-content/lesson-topic-composition.md)** | P4 | Một bài nhiều chủ đề, mỗi chủ đề ≥2 khuôn lấy từ ma trận tương hợp | [#309](../tasks/309-content-model-gaps-plan.md) |
| [worksheet-model](05-content/worksheet-model.md) | P4 | Ngoài MVP |  |
| [engine-content-depth](05-content/engine-content-depth.md) | P4 | Sàn level mỗi engine, bậc thang 4 mức |  |
| [content-theme-registry](05-content/content-theme-registry.md) | P4 | Trục theme đóng, trần tập trung chủ đề |  |
| [lesson-flow-model](05-content/lesson-flow-model.md) | P4 | Thư viện master, flow ghi danh, tuổi là đề xuất | [#309](../tasks/309-content-model-gaps-plan.md) |
| [lesson-corpus-depth](05-content/lesson-corpus-depth.md) | P4 | Cầu 126 tiết flow dài nhất, cung 81; 48 level phải soạn |  |
| [lesson-exemplar-set](05-content/lesson-exemplar-set.md) | P4 | Tiết học mẫu, ma trận 18 ô |  |
| [montessori-corpus-mapping](05-content/montessori-corpus-mapping.md) | P3 | Ánh xạ 21 workbook sang strand, band tuổi, khuôn; ranh giới lô A và lô B |  |
| [concept-intro-model](05-content/concept-intro-model.md) | P4 | Bài làm quen ba giai đoạn, phân đoạn 2–6 chất liệu, trần 120 giây mỗi phân đoạn | [#295](../tasks/295-concept-intro-segments-plan.md) |
| **[concept-topic-model](05-content/concept-topic-model.md)** | P4 | Chủ đề làm quen khai trong `content_pack`, một hoặc nhiều tiết, level dạy ngoài hạn ngạch |  |
| [lesson-template-variety](05-content/lesson-template-variety.md) | P5 | Cùng một kỹ năng, nhiều hình dạng chơi trong một bài học | [#309](../tasks/309-content-model-gaps-plan.md) |
| **[skill-dataset-model](05-content/skill-dataset-model.md)** | P1 | Vật của level đến từ dataset kỹ năng; bộ chiếu thay bộ sinh theo khuôn; hai cổng trung thực |  |
| [engine-competency-allocation](05-content/engine-competency-allocation.md) | P4 | Bản đồ tương hợp engine -> competency, sàn K lĩnh vực mỗi ô, trần ngoại lệ | [#309](../tasks/309-content-model-gaps-plan.md) |
| [preschool-age-bands](05-content/preschool-age-bands.md) | P4 | Ràng buộc biên soạn theo band tuổi mầm non (difficulty, thời lượng, số bước) |  |
| [skill-age-progression](05-content/skill-age-progression.md) | P4 | Thứ tự giới thiệu kỹ năng theo tháng tuổi (36-48m, 48-60m, 60-72m) |  |
| **[skill-thinking-structure](05-content/skill-thinking-structure.md)** | P1 | Dataset phải mang `relations` và `axes` chứng minh được kỹ năng tư duy nó khai; bảng nghĩa vụ 18 `ThinkingProcess` | [#309](../tasks/309-content-model-gaps-plan.md) |
| **[numeracy-representation-ladder](05-content/numeracy-representation-ladder.md)** | P1 | Thang cụ thể, bán cụ thể, trừu tượng cho mọi lượng; chữ số không đứng một mình dưới 5 tuổi | [#309](../tasks/309-content-model-gaps-plan.md) |
| **[skill-value-inventory](05-content/skill-value-inventory.md)** | P1 | Kho giá trị kỹ năng: nguồn sự thật cho các dãy giá trị học thuật, đối chiếu hai chiều |  |
| **[level-difficulty-contract](05-content/level-difficulty-contract.md)** | P1 | Hợp đồng độ khó 1..5: ánh xạ item_count qua bảng tra 37 engine, thang tiến bộ theo kỹ năng | [#309](../tasks/309-content-model-gaps-plan.md) |
| [content-tagging](05-content/content-tagging.md) | P1 | Ba trục what/thinking/mechanic | [#305](../tasks/305-platform-api-gaps-plan.md) |

## 06-admin — Manager

| Spec | Phase | Nội dung | Task mở |
|---|:--:|---|---|
| [admin-auth](06-admin/admin-auth.md) | P0 | MFA bắt buộc, ma trận role, reauth thao tác toàn hệ thống |  |
| [manager-mfa-enrollment](06-admin/manager-mfa-enrollment.md) | P0 | Thiết lập MFA lần đầu qua challenge, chưa cấp phiên |  |
| [taxonomy-browser](06-admin/taxonomy-browser.md) | P1 | Chỉ đọc, chỉ báo khoảng trống | [#300](../tasks/300-admin-small-gaps-plan.md) |
| [legal-consent-admin](06-admin/legal-consent-admin.md) | P1 | Force đồng ý lại tài liệu pháp lý | [#299](../tasks/299-admin-ops-truthfulness-plan.md) |
| [admin-dashboard](06-admin/admin-dashboard.md) | P2 | 4 nhóm thẻ, chỉ đọc | [#297](../tasks/297-admin-payment-queue-plan.md) |
| [user-management](06-admin/user-management.md) | P2 | Danh sách, khoá/mở |  |
| [user-detail](06-admin/user-detail.md) | P2 | 4 nhóm, không dữ liệu học của trẻ |  |
| [child-profile-admin](06-admin/child-profile-admin.md) | P2 | **Cấm có trang liệt kê trẻ** |  |
| [entitlement-grant](06-admin/entitlement-grant.md) | P2 | Cấp tay, lý do ≥20 ký tự |  |
| [payment-queue](06-admin/payment-queue.md) | P2 | Hàng đợi, không nút duyệt | [#297](../tasks/297-admin-payment-queue-plan.md) |
| [payment-approval](06-admin/payment-approval.md) | P2 | Transaction, checklist đối chiếu | [#297](../tasks/297-admin-payment-queue-plan.md) |
| [package-catalog-admin](06-admin/package-catalog-admin.md) | P2 | Chỉ đọc |  |
| [game-level-studio](06-admin/game-level-studio.md) | P2 | Soạn level không cần code | [#300](../tasks/300-admin-small-gaps-plan.md) |
| [schema-driven-form](06-admin/schema-driven-form.md) | P2 | Form sinh từ Zod | [#300](../tasks/300-admin-small-gaps-plan.md) |
| [live-preview](06-admin/live-preview.md) | P2 | Engine thật, không mock | [#298](../tasks/298-admin-content-review-fixes-plan.md) |
| [content-review-queue](06-admin/content-review-queue.md) | P2 | Cấm duyệt theo lô | [#298](../tasks/298-admin-content-review-fixes-plan.md) |
| [publish-and-version](06-admin/publish-and-version.md) | P2 | Publish, archive, rollback |  |
| [image-upload](06-admin/image-upload.md) | P2 | Crop client, preview cỡ thật |  |
| [emoji-picker](06-admin/emoji-picker.md) | P2 | Tìm tiếng Việt, ô ≥40px | [#300](../tasks/300-admin-small-gaps-plan.md) |
| [asset-usage-tracking](06-admin/asset-usage-tracking.md) | P2 | Chặn xoá asset đang dùng | [#300](../tasks/300-admin-small-gaps-plan.md) |
| [audit-log-viewer](06-admin/audit-log-viewer.md) | P2 | Diff, không JSON thô | [#300](../tasks/300-admin-small-gaps-plan.md) |
| [error-log-viewer](06-admin/error-log-viewer.md) | P2 | Gom nhóm, đếm người ảnh hưởng |  |
| [system-activity](06-admin/system-activity.md) | P2 | Cấm xanh khi không biết | [#299](../tasks/299-admin-ops-truthfulness-plan.md) |
| [feature-flags](06-admin/feature-flags.md) | P2 | Cờ có hạn |  |
| [data-export](06-admin/data-export.md) | P2 | 6 loại, danh sách đóng | [#299](../tasks/299-admin-ops-truthfulness-plan.md) |
| [seo-content-admin](06-admin/seo-content-admin.md) | P2 | Rich text hạn chế, 301 tự động |  |
| [notification-admin](06-admin/notification-admin.md) | P2 | Nhật ký gửi, template | [#299](../tasks/299-admin-ops-truthfulness-plan.md) |
| [admin-subscription-cancel](06-admin/admin-subscription-cancel.md) | P5 | Manager huỷ gói đăng ký của User, dừng gia hạn, super_admin audit | [#300](../tasks/300-admin-small-gaps-plan.md) |
| [lesson-authoring](06-admin/lesson-authoring.md) | P3 | Lắp activity vào lesson |  |
| [activity-authoring](06-admin/activity-authoring.md) | P3 | 10 loại activity |  |
| [curriculum-builder](06-admin/curriculum-builder.md) | P3 | 6 chỉ báo cân bằng |  |

## 07-addon — spec đầy đủ, **không bán ở MVP**

| Spec | Phase | Lên catalog khi | Task mở |
|---|:--:|---|---|
| [lesson-plan-creator](07-addon/lesson-plan-creator.md) | P4 | spec này `implemented` |  |
| [pdf-export](07-addon/pdf-export.md) | P4 | idem | [#311](../tasks/311-addon-provider-gaps-plan.md) |
| [personal-curriculum](07-addon/personal-curriculum.md) | P4 | idem |  |
| [custom-game-builder](07-addon/custom-game-builder.md) | P4 | idem |  |
| [ai-credit-ledger](07-addon/ai-credit-ledger.md) | P4 | **điều kiện tiên quyết** của `addon_ai` |  |
| [ai-assistant](07-addon/ai-assistant.md) | P4 | sau [`ai-credit-ledger.md`](07-addon/ai-credit-ledger.md) | [#311](../tasks/311-addon-provider-gaps-plan.md) |
| [semantic-search](07-addon/semantic-search.md) | P4 | pgvector, schema + job + rerank riêng khỏi [`ai-assistant.md`](07-addon/ai-assistant.md) | [#311](../tasks/311-addon-provider-gaps-plan.md) |

## 08-quality — contract cắt ngang

| Spec | Phase | Nội dung | Task mở |
|---|:--:|---|---|
| [testing-strategy](08-quality/testing-strategy.md) | P0 | 6 tầng, bài không rút gọn | [#310](../tasks/310-quality-gates-gaps-plan.md) |
| [security-checklist](08-quality/security-checklist.md) | P0 | CRITICAL chặn merge | [#310](../tasks/310-quality-gates-gaps-plan.md) |
| [accessibility](08-quality/accessibility.md) | P1 | 4 bề mặt, 4 ngưỡng | [#310](../tasks/310-quality-gates-gaps-plan.md) |
| [performance-budgets](08-quality/performance-budgets.md) | P1 | Ngân sách chặn merge | [#310](../tasks/310-quality-gates-gaps-plan.md) |
| [design-system-contract](08-quality/design-system-contract.md) | P1 | Token, một kit, 4 bề mặt | [#310](../tasks/310-quality-gates-gaps-plan.md) |
| [pedagogical-evidence](08-quality/pedagogical-evidence.md) | P1 | Tiêu chuẩn bằng chứng sư phạm |  |
| [thinking-coverage-matrix](08-quality/thinking-coverage-matrix.md) | P3 | Cổng đo phủ 6 năng lực, từ vựng đóng thật | [#310](../tasks/310-quality-gates-gaps-plan.md) |
| [go-live-readiness](08-quality/go-live-readiness.md) | P4 | Điều kiện trẻ mở được, khác sàn MVP | [#310](../tasks/310-quality-gates-gaps-plan.md) |
| [type-safety](08-quality/type-safety.md) | P0 | Cấm any, nợ ép kiểu chỉ giảm, dữ liệu vào qua schema | [#310](../tasks/310-quality-gates-gaps-plan.md) |
| [source-game-type-coverage](08-quality/source-game-type-coverage.md) | P0 | Cổng phủ 60 dạng game nguồn và xương truy vết |  |
| [runtime-gates](08-quality/runtime-gates.md) | P0 | Sổ cưỡng chế: luật nào còn cổng, luật nào đã mất |  |

---

## Đường găng của MVP

```
P0: taxonomy-service → master seed ≥690 LO → human review
P1: game-template-contract → content-seed-authoring → seeder ≥120 level → human review
```

Chuỗi này **không rút ngắn được bằng cách thêm dev**. Nó bị chặn bởi năng lực **đọc
review** của người, không phải tốc độ soạn thảo —
[`01-platform/content-seed-authoring.md`](01-platform/content-seed-authoring.md) §11 Q1.
Chủ và baseline năng lực đã chốt ở `D-CN`; rủi ro còn lại là thực thi đủ khối lượng.

## Câu hỏi mở chặn nhiều nhất

| # | Câu hỏi | Chặn |
|---|---|---|
| 1 | **Giá cuối** của `standard` và `premium` | P2 · trang giá |

## Đổi contract thì đổi spec trước

Đổi **contract, schema, public API, quyền, giới hạn, giá, hành vi lỗi** → cập nhật spec sở
hữu **trước** khi code. Sửa một dòng để phục hồi contract đã có thì đi thẳng vào implement.

Mỗi outcome có **đúng một** spec sở hữu. Spec khác **link tới**, không copy contract.
