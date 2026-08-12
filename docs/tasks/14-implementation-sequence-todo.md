# Checklist — Task #14: Thứ tự implement 130 spec

> Kế hoạch: [`14-implementation-sequence-plan.md`](14-implementation-sequence-plan.md).
> Thứ tự gốc: [`roadmap.md`](../specs/roadmap.md). Cổng ra phase: [`SPEC.md`](../SPEC.md) §13.
>
> Bước roadmap sở hữu outcome; work package S/M mới là đơn vị implementation (quyết định D1).
> Mỗi bước chạy đủ chín việc ở kế hoạch mục 5. Increment plan #16–#69 giữ acceptance chi tiết;
> P5 contract-first qua Task #70, và contract gap mới đi qua Task #80–#82.
>
> ```
> export PATH=/Users/macbook/.nvm/versions/node/v24.15.0/bin:$PATH
> ```

## Bước 0 — điều kiện tiên quyết

- [x] `pnpm lint:specs 2>&1 | tail -2` — 0 lỗi, 0 cảnh báo
- [x] `grep -rl "^status: approved" --include="*.md" docs/specs | xargs grep -l "^spec: " | wc -l` — ra **130**
- [x] `pnpm check && pnpm test` xanh
- [x] Đọc kế hoạch mục 3 (vì sao không dùng `depends_on` làm nguồn thứ tự) và mục 5 (chín việc)

---

## Bước 1 — Vá roadmap trước khi viết dòng code đầu tiên

Chín spec chưa xuất hiện ở bất kỳ đâu trong [`roadmap.md`](../specs/roadmap.md). Chèn vào đúng
chỗ theo bảng ở kế hoạch mục 6:

- [x] Chèn trước bước 1: [`testing-strategy.md`](../specs/08-quality/testing-strategy.md) · [`ai-codegen-pipeline.md`](../specs/01-platform/ai-codegen-pipeline.md) · [`mvp-scope.md`](../specs/00-foundation/mvp-scope.md)
- [x] Chèn sau bước 8: [`backup-and-restore.md`](../specs/01-platform/backup-and-restore.md) · [`health-check.md`](../specs/01-platform/health-check.md)
- [x] Chèn trước bước 10: [`notification-service.md`](../specs/01-platform/notification-service.md) · [`rate-limiting.md`](../specs/01-platform/rate-limiting.md)
- [x] Chèn sau bước 11: [`admin-auth.md`](../specs/06-admin/admin-auth.md)
- [x] Ghi [`security-checklist.md`](../specs/08-quality/security-checklist.md) vào **cổng ra P0**, không thành bước riêng
- [x] Ghi rõ ba registry ([`business-rules.md`](../specs/00-foundation/business-rules.md) · [`error-codes.md`](../specs/00-foundation/error-codes.md) · [`event-catalog.md`](../specs/00-foundation/event-catalog.md)) được tra ở **mọi** bước, không có bước riêng

Năm cạnh `depends_on` đảo phase — quyết định từng cái, cấp mã `D-*` cho từng cái:

- [x] [`schema-identity-billing.md`](../specs/01-platform/schema-identity-billing.md) → [`payment-flow.md`](../specs/00-foundation/payment-flow.md): xác nhận contract-only (chỉ enum `status` §7, D-BQ), giữ nguyên
- [x] [`schema-content-taxonomy.md`](../specs/01-platform/schema-content-taxonomy.md) → [`game-template-contract.md`](../specs/01-platform/game-template-contract.md): contract-only (D-BR)
- [x] [`ai-codegen-pipeline.md`](../specs/01-platform/ai-codegen-pipeline.md) → [`game-template-contract.md`](../specs/01-platform/game-template-contract.md): contract-only (D-BS)
- [x] [`backup-and-restore.md`](../specs/01-platform/backup-and-restore.md) → [`job-queue.md`](../specs/01-platform/job-queue.md): contract P0 vs job P1 (D-BT)
- [x] [`notification-service.md`](../specs/01-platform/notification-service.md) → [`job-queue.md`](../specs/01-platform/job-queue.md): P0 dùng khung queue tối thiểu, catalog/retry/alerting đầy đủ ở P1 (D-BU)
- [x] Mã cuối của nhóm cạnh đảo phase: D-BU

## Cổng dừng A — trước dòng code đầu tiên

- [x] Lệnh phủ ở kế hoạch mục 9 in ra **rỗng** (roadmap phủ 130/130)
- [x] Năm cạnh đảo phase đều đã có quyết định kèm mã `D-*`
- [x] `pnpm lint:specs` 0 lỗi, 0 cảnh báo
- [x] Commit `docs(specs): T14 bước 1 — roadmap phủ đủ 130 spec`

---

## P0 — Foundation, 35 spec

Mỗi bước: chín việc ở kế hoạch mục 5; mỗi work package S/M một PR.

- [x] **P0.0** Cổng chất lượng và review vùng nhạy cảm — [`testing-strategy.md`](../specs/08-quality/testing-strategy.md) · [`ai-codegen-pipeline.md`](../specs/01-platform/ai-codegen-pipeline.md) · [`mvp-scope.md`](../specs/00-foundation/mvp-scope.md)
- [x] **P0.0b** Cổng chống tick khống `pnpm check:progress` — kế hoạch mục 10; ca âm trước: commit chỉ đổi `[ ]` thành `[x]` phải làm cổng đỏ
- [x] **P0.1** Khung repo + dependency baseline — [`repo-bootstrap.md`](../specs/00-foundation/repo-bootstrap.md) · [`monorepo-package-architecture.md`](../specs/00-foundation/monorepo-package-architecture.md)
- [x] **P0.2** Từ vựng và ID — [`glossary.md`](../specs/00-foundation/glossary.md) · [`id-conventions.md`](../specs/00-foundation/id-conventions.md)
- [x] **P0.3** Tác nhân và guard — [`actors.md`](../specs/00-foundation/actors.md) · [`auth-tokens-sessions.md`](../specs/01-platform/auth-tokens-sessions.md)
- [x] **P0.4** Ràng buộc pháp lý trước khi thiết kế bảng trẻ — [`child-data-compliance.md`](../specs/00-foundation/child-data-compliance.md)
- [x] **P0.5** Ladder + entitlement + package — [`access-ladder.md`](../specs/00-foundation/access-ladder.md) → [`entitlement-model.md`](../specs/00-foundation/entitlement-model.md) → [`package-catalog.md`](../specs/00-foundation/package-catalog.md)
- [x] **P0.6** Vòng đời + version nội dung — [`content-lifecycle.md`](../specs/00-foundation/content-lifecycle.md) → [`content-versioning.md`](../specs/00-foundation/content-versioning.md)
- [x] **P0.7** Thiết kế schema — [`data-model-overview.md`](../specs/01-platform/data-model-overview.md) → [`schema-identity-billing.md`](../specs/01-platform/schema-identity-billing.md) · [`schema-content-taxonomy.md`](../specs/01-platform/schema-content-taxonomy.md) · [`schema-play-telemetry.md`](../specs/01-platform/schema-play-telemetry.md)
- [x] **P0.8** Migration đầu tiên, gate local xanh trên schema thật
- [x] **P0.8b** Sao lưu và quan sát; dựng khung tối thiểu `packages/queue` + `apps/worker` cho job `backup:postgres` (`D-BT`, `D-BU`) — [`backup-and-restore.md`](../specs/01-platform/backup-and-restore.md) · [`health-check.md`](../specs/01-platform/health-check.md)
- [x] **P0.9** Taxonomy service + seed Lớp 1 — [`taxonomy-service.md`](../specs/01-platform/taxonomy-service.md) · [`emoji-registry.md`](../specs/01-platform/emoji-registry.md)
- [x] **P0.9b** Email và guard; thêm job `email:send` lên khung queue tối thiểu (`D-BU`) — [`notification-service.md`](../specs/01-platform/notification-service.md) · [`rate-limiting.md`](../specs/01-platform/rate-limiting.md)
- [x] **P0.10** Auth end-to-end bằng email/mật khẩu — [`registration.md`](../specs/03-account/registration.md) · [`email-verification.md`](../specs/03-account/email-verification.md) · [`login-and-session.md`](../specs/03-account/login-and-session.md) · [`password-recovery.md`](../specs/03-account/password-recovery.md)
- [ ] **P0.11** Audit log, trước mọi hành động cần audit — [`audit-log.md`](../specs/01-platform/audit-log.md)
- [ ] **P0.11b** Đăng nhập admin — [`admin-auth.md`](../specs/06-admin/admin-auth.md)

Kiểm giữa phase:

- [x] Sau P0.8: migration chạy được từ đầu trên database rỗng, không phải chỉ chạy tiếp được
- [ ] Sau P0.10: một người dùng thật đăng ký → nhận email → đăng nhập → đổi mật khẩu, không dùng seed tay
- [ ] Sau mỗi bước: `pnpm check && pnpm test && pnpm lint:specs` xanh

## Cổng ra P0

- [ ] Điều kiện ở [`SPEC.md`](../SPEC.md) §13
- [ ] [`security-checklist.md`](../specs/08-quality/security-checklist.md) chạy hết, không mục nào đỏ
- [ ] 35 spec P0 mang `status: implemented`
- [ ] Mọi `BR-*` mà P0 sở hữu có ít nhất một test tham chiếu mã rule
- [ ] Không spec P0 nào còn câu hỏi mở mang `Chặn phase: P0`

---

## P1 — Play core, 43 spec

Bắt đầu **nhóm D song song ngay từ đầu P1**: biên soạn seeder nội dung là đường găng dài nhất của
MVP, và nó chỉ cần bước P1.2 xong.

- [ ] **P1.1** Ràng buộc chất lượng & thiết kế UI — [`design-system-contract.md`](../specs/08-quality/design-system-contract.md) · [`accessibility.md`](../specs/08-quality/accessibility.md) · [`performance-budgets.md`](../specs/08-quality/performance-budgets.md)
- [ ] **P1.2** Contract template + 6 template chạy được — [`game-template-contract.md`](../specs/01-platform/game-template-contract.md) · [`game-engine-runtime.md`](../specs/01-platform/game-engine-runtime.md)
- [ ] **P1.2b** Đóng contract audio tiếng Việt, fallback và spec owner asset/authoring — [`Task #80`](80-audio-contract-closure-plan.md); chưa có contract thì không được coi placeholder P2.7 là coverage
- [ ] **P1.3** Gating trước nội dung — [`access-gating.md`](../specs/04-play/access-gating.md)
- [ ] **P1.4** Giao config game đã lọc quyền — [`game-config-delivery.md`](../specs/04-play/game-config-delivery.md)
- [ ] **P1.5** Hàng đợi công việc & telemetry — [`job-queue.md`](../specs/01-platform/job-queue.md) · [`telemetry-pipeline.md`](../specs/01-platform/telemetry-pipeline.md)
- [ ] **P1.6** Vòng đời phiên, nạp event idempotent, mất mạng — [`play-session-lifecycle.md`](../specs/04-play/play-session-lifecycle.md) · [`play-event-ingestion.md`](../specs/04-play/play-event-ingestion.md) · [`offline-play.md`](../specs/01-platform/offline-play.md)
- [ ] **P1.7** Tính điểm ở server — [`scoring-and-result.md`](../specs/04-play/scoring-and-result.md)
- [ ] **P1.8** Scaffolding, phản hồi, parent gate, hạn mức giờ — [`scaffolding-and-hints.md`](../specs/04-play/scaffolding-and-hints.md) · [`feedback-and-celebration.md`](../specs/04-play/feedback-and-celebration.md) · [`parent-gate.md`](../specs/04-play/parent-gate.md) · [`healthy-play-limits.md`](../specs/04-play/healthy-play-limits.md)
- [ ] **P1.9** Hồ sơ trẻ và chọn trẻ chơi — [`child-profile-crud.md`](../specs/03-account/child-profile-crud.md) · [`child-profile-switching.md`](../specs/03-account/child-profile-switching.md) · [`child-profile-archive.md`](../specs/03-account/child-profile-archive.md) · [`play-entry-and-profile-select.md`](../specs/04-play/play-entry-and-profile-select.md)
- [ ] **P1.10** Gắn tag nội dung & seeder nội dung nền — [`content-tagging.md`](../specs/01-platform/content-tagging.md) · [`content-seed-authoring.md`](../specs/01-platform/content-seed-authoring.md)
- [ ] **P1.11** ≥120 game level `published` — [`game-level-model.md`](../specs/05-content/game-level-model.md)
- [ ] **P1.11b** Tìm kiếm nội dung — [`content-search.md`](../specs/01-platform/content-search.md)
- [ ] **P1.11c** Đóng claim/KPI evidence sư phạm và protocol kiểm thử với trẻ — [`Task #81`](81-pedagogical-evidence-contract-plan.md)
- [ ] **P1.12** Báo cáo cơ bản, trang chính phụ huynh, thư viện — [`basic-report.md`](../specs/03-account/basic-report.md) · [`member-dashboard.md`](../specs/03-account/member-dashboard.md) · [`my-library.md`](../specs/03-account/my-library.md)
- [ ] **P1.13** Public site, SEO, trang pháp lý — [`landing-page.md`](../specs/02-public/landing-page.md) · [`game-catalog-public.md`](../specs/02-public/game-catalog-public.md) · [`game-detail-public.md`](../specs/02-public/game-detail-public.md) · [`seo-and-structured-data.md`](../specs/02-public/seo-and-structured-data.md) · [`legal-pages.md`](../specs/02-public/legal-pages.md) · [`faq-and-help.md`](../specs/02-public/faq-and-help.md) · [`cookie-and-consent-banner.md`](../specs/02-public/cookie-and-consent-banner.md)
- [ ] **P1.14** Cài đặt tài khoản, đồng ý pháp lý, xoá tài khoản — [`account-settings.md`](../specs/03-account/account-settings.md) · [`consent-management.md`](../specs/03-account/consent-management.md) · [`account-deletion.md`](../specs/03-account/account-deletion.md)
- [ ] **P1.15** Đăng nhập SNS, **thứ tự không đảo được** — [`oauth-provider-registry.md`](../specs/01-platform/oauth-provider-registry.md) → [`social-login.md`](../specs/03-account/social-login.md) → [`social-account-linking.md`](../specs/03-account/social-account-linking.md)
- [ ] **P1.16** Taxonomy admin & giám sát — [`taxonomy-browser.md`](../specs/06-admin/taxonomy-browser.md) · [`monitoring-and-alerting.md`](../specs/01-platform/monitoring-and-alerting.md)

## Cổng ra P1

- [ ] Điều kiện ở [`SPEC.md`](../SPEC.md) §13
- [ ] Một trẻ chơi hết một game level thật, điểm về server, phụ huynh thấy trong báo cáo
- [ ] Audio tiếng Việt có fallback đo trên thiết bị chuẩn; không dùng Web Speech/TTS như một giả định không test
- [ ] Ca “trẻ thật” tuân theo contract evidence/an toàn của Task #81; chưa có protocol thì không dùng để claim hiệu quả sư phạm
- [ ] 43 spec P1 `implemented`; không câu hỏi mở nào còn `Chặn phase: P1`

---

## P2 — Commerce + Admin, 31 spec

- [ ] **P2.1** Admin shell — [`admin-dashboard.md`](../specs/06-admin/admin-dashboard.md)
- [ ] **P2.2** Tra cứu vận hành — [`user-management.md`](../specs/06-admin/user-management.md) · [`user-detail.md`](../specs/06-admin/user-detail.md) · [`child-profile-admin.md`](../specs/06-admin/child-profile-admin.md)
- [ ] **P2.3** Luồng tiền hai đầu — [`payment-flow.md`](../specs/00-foundation/payment-flow.md) · [`pricing-page.md`](../specs/02-public/pricing-page.md) · [`payment-order-create.md`](../specs/03-account/payment-order-create.md) → [`payment-proof-upload.md`](../specs/03-account/payment-proof-upload.md) → [`payment-queue.md`](../specs/06-admin/payment-queue.md) → [`payment-approval.md`](../specs/06-admin/payment-approval.md)
- [ ] **P2.4** Cấp quyền tay + xem catalog — [`entitlement-grant.md`](../specs/06-admin/entitlement-grant.md) · [`package-catalog-admin.md`](../specs/06-admin/package-catalog-admin.md) · [`subscription-view.md`](../specs/03-account/subscription-view.md)
- [ ] **P2.5** Studio: form sinh từ schema — [`schema-driven-form.md`](../specs/06-admin/schema-driven-form.md)
- [ ] **P2.6** Studio: soạn game level + bộ chọn emoji — [`game-level-studio.md`](../specs/06-admin/game-level-studio.md) · [`live-preview.md`](../specs/06-admin/live-preview.md) · [`emoji-picker.md`](../specs/06-admin/emoji-picker.md)
- [ ] **P2.7** Asset & storage ảnh — [`image-storage.md`](../specs/01-platform/image-storage.md) · [`image-upload.md`](../specs/06-admin/image-upload.md) · [`asset-usage-tracking.md`](../specs/06-admin/asset-usage-tracking.md)
- [ ] **P2.8** Duyệt và phát hành — [`content-review-queue.md`](../specs/06-admin/content-review-queue.md) · [`publish-and-version.md`](../specs/06-admin/publish-and-version.md) · [`seo-content-admin.md`](../specs/06-admin/seo-content-admin.md)
- [ ] **P2.9** Cờ & quản trị dữ liệu — [`feature-flag-service.md`](../specs/01-platform/feature-flag-service.md) · [`feature-flags.md`](../specs/06-admin/feature-flags.md) · [`data-export.md`](../specs/06-admin/data-export.md) · [`notification-admin.md`](../specs/06-admin/notification-admin.md)
- [ ] **P2.10** Nhật ký — [`audit-log-viewer.md`](../specs/06-admin/audit-log-viewer.md) · [`error-log-viewer.md`](../specs/06-admin/error-log-viewer.md) · [`system-activity.md`](../specs/06-admin/system-activity.md)
- [ ] **P2.11** MFA tuỳ chọn cho User — [`mfa.md`](../specs/03-account/mfa.md)

## Cổng ra P2

- [ ] Điều kiện ở [`SPEC.md`](../SPEC.md) §13
- [ ] Một đơn hàng thật đi hết: tạo → nộp chứng từ → duyệt → entitlement cấp → quyền mở
- [ ] Manager tạo được một game level mới trong studio, 0 dòng code (quyết định D2 của [`SPEC.md`](../SPEC.md) §0)
- [ ] Không còn lời hứa audio picker/upload trỏ vào P2.7 ảnh; đường audio chỉ được tick theo implementation task sinh sau Task #80
- [ ] Giá `standard`/`premium` đã chốt — trước đó dùng hằng số tên `PENDING_*`, không phải số bịa

---

## P3 — Curriculum, 12 spec (hết MVP)

- [ ] **P3.1** Mô hình lesson + activity — [`lesson-model.md`](../specs/05-content/lesson-model.md) · [`activity-model.md`](../specs/05-content/activity-model.md)
- [ ] **P3.2** Soạn lesson và activity — [`lesson-authoring.md`](../specs/06-admin/lesson-authoring.md) · [`activity-authoring.md`](../specs/06-admin/activity-authoring.md)
- [ ] **P3.3** Mô hình + builder curriculum — [`curriculum-model.md`](../specs/05-content/curriculum-model.md) · [`curriculum-builder.md`](../specs/06-admin/curriculum-builder.md)
- [ ] **P3.4** Player curriculum — [`curriculum-player.md`](../specs/04-play/curriculum-player.md)
- [ ] **P3.5** Mastery + adaptive — [`adaptive-engine.md`](../specs/01-platform/adaptive-engine.md) · [`progress-and-mastery.md`](../specs/04-play/progress-and-mastery.md)
- [ ] **P3.6** Gợi ý game kế tiếp — [`next-game-recommendation.md`](../specs/04-play/next-game-recommendation.md)
- [ ] **P3.7** Báo cáo nâng cao — [`advanced-report.md`](../specs/03-account/advanced-report.md)
- [ ] **P3.8** Trưng bày chương trình ra public — [`program-showcase.md`](../specs/02-public/program-showcase.md)
- [ ] **P3.9** Tích hợp curriculum vào account, bố cục nhiều trẻ và phạm vi thư viện — [`Task #82`](82-p3-account-curriculum-integration-plan.md)

Chặn bởi người, hỏi **trước** P3.1: ai biên soạn lesson (nền sư phạm mầm non), và chốt một trong
hai contract: giữ ≥60 lesson có tái sử dụng, hoặc nhận đề xuất ≥126 lesson distinct của Task #54.

## Cổng ra P3 — hết MVP

- [ ] Điều kiện ở [`SPEC.md`](../SPEC.md) §13
- [ ] 120 spec `mvp: true` đều `implemented`
- [ ] Một trẻ đi hết một curriculum thật từ đầu tới cuối
- [ ] Dashboard hiện đúng curriculum của trẻ đang active; không trộn tiến độ/thư viện giữa hai hồ sơ trẻ

---

## P4 — Add-on, 8 spec (ngoài MVP)

Chỉ bắt đầu khi P0–P3 `implemented`. Mỗi add-on **lên catalog cùng lúc với tính năng của nó**.

- [ ] [`ai-credit-ledger.md`](../specs/07-addon/ai-credit-ledger.md) → [`ai-assistant.md`](../specs/07-addon/ai-assistant.md) — chặn bởi: provider và model AI, tỉ lệ trừ credit, DPA pháp lý
- [ ] [`worksheet-model.md`](../specs/05-content/worksheet-model.md) · [`lesson-plan-creator.md`](../specs/07-addon/lesson-plan-creator.md) → [`pdf-export.md`](../specs/07-addon/pdf-export.md) — chặn bởi: Puppeteer ~300MB RAM có chạy nổi trên t3.small không
- [ ] [`custom-game-builder.md`](../specs/07-addon/custom-game-builder.md) · [`personal-curriculum.md`](../specs/07-addon/personal-curriculum.md) — chặn bởi: quota
- [ ] [`semantic-search.md`](../specs/07-addon/semantic-search.md) — **chặn migration**: `N` của cột `vector` phụ thuộc embedding model, đổi `N` là đổi migration
- [ ] Chín câu hỏi giá/quota ở [`CORPUS-CLOSURE.md`](CORPUS-CLOSURE.md) đã chốt trước khi lên catalog

## P5 — Web scale, 1 spec hiện có

- [ ] **P5.0** Đóng scope và spec owner cho đúng sản phẩm web — Task #70
- [ ] **P5.1** Cổng thanh toán tự động/đối soát/refund theo contract đã duyệt — Task #71
- [ ] **P5.2** [`pwa-install.md`](../specs/01-platform/pwa-install.md) + offline curriculum pack có spec owner — Task #72
- [ ] **P5.3** Cổng evidence Web scale — Task #78

Task #73–#77 đã loại khỏi backlog; không tái dùng ID. Classroom, native mobile, licensing,
localization và mở thị trường chỉ quay lại sau quyết định scope + spec mới + task số mới.

---

## Cổng dừng cuối

- [ ] `grep -rh "^status: " --include="*.md" docs/specs | sort | uniq -c` — 130 `implemented`
- [ ] `pnpm check && pnpm test && pnpm lint:specs && pnpm check:services` xanh
- [ ] Không spec nào còn câu hỏi mở mang `Chặn phase` là một phase đã qua
