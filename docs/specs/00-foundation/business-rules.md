---
spec: BUSINESS-RULES
title: Registry business rule
area: foundation
status: implemented
mvp: true
phase: P0
reviewed: 2026-08-19
owns:
  - Bản đồ prefix BR → spec sở hữu
  - Danh sách rule không bao giờ được vi phạm
depends_on:
  - CONVENTIONS
---

# Registry business rule

## 1. Objective

Corpus có **~1350 business rule** trên 151 spec. Registry này **không** liệt kê lại từng rule —
nó ánh xạ **prefix → spec sở hữu**, để tra ngược từ một ID trong code hoặc test về nơi định
nghĩa.

Cộng thêm §7.3: **danh sách rule không bao giờ được vi phạm**, bất kể áp lực lịch trình.

4 rule `BR-REG2-01` đến `BR-REG2-04` **không còn cổng máy nào đo**. Cổng cũ
(`packages/gates`) đã bị gỡ vì trùng việc với Biome và `vue-tsc`; xem §11 câu 2.
Từ đây chúng được giữ bằng **lượt đọc của reviewer** theo mục 11.6 của
[`CONVENTIONS.md`](../CONVENTIONS.md) — nghĩa là chúng có thể trôi mà không ai
biết, và người review là hàng phòng thủ duy nhất.

## 2. Actors

Dev · reviewer · test.

## 3. Entry points

Mọi `BR-*` trong code, test, và PR. Tính duy nhất, tính bất biến, và BR không được
tham chiếu — cấm — NEVER còn lệnh nào đo tự động; reviewer tra tay theo §7.1.

## 4. Main flow

1. Gặp `BR-XXX-nn` trong code hoặc test.
2. Tra prefix ở §7.1 → mở spec sở hữu.
3. Đọc rule kèm **lý do** — cột "vì sao" là bắt buộc, theo mục 5 của
   [`CONVENTIONS.md`](../CONVENTIONS.md).

## 5. Alternative flows

| Nhánh | Hành vi |
|---|---|
| Prefix không có trong §7.1 | Spec mới chưa đăng ký — cập nhật file này |
| Hai spec cùng prefix | Vi phạm quy ước; một trong hai phải đổi |

## 6. Business rules

| ID | Rule | Vì sao |
|---|---|---|
| `BR-REG2-01` | Prefix BR **duy nhất toàn corpus** | Trùng prefix làm tra ngược sai spec |
| `BR-REG2-02` | ID rule **bất biến**. Không đổi, không tái dùng số của rule đã xoá. | Test và code tham chiếu bằng ID |
| `BR-REG2-03` | Mọi rule có cột **"vì sao"** | Rule không có lý do sẽ bị xoá sai bởi người sau |
| `BR-REG2-04` | Rule ở §7.3 **không bao giờ được nới**, kể cả tạm thời | Chúng bảo vệ trẻ em, tiền, và dữ liệu không sửa ngược được |

## 7. Data

### 7.1 Bản đồ prefix → spec

**Foundation**

| Prefix | Spec |
|---|---|
| `BR-GLOS` | [`glossary.md`](glossary.md) |
| `BR-ID` | [`id-conventions.md`](id-conventions.md) |
| `BR-ACT` | [`actors.md`](actors.md) |
| `BR-CDC` | [`child-data-compliance.md`](child-data-compliance.md) |
| `BR-LAD` | [`access-ladder.md`](access-ladder.md) |
| `BR-ENT` | [`entitlement-model.md`](entitlement-model.md) |
| `BR-PKG` | [`package-catalog.md`](package-catalog.md) |
| `BR-PAY` | [`payment-flow.md`](payment-flow.md) |
| `BR-CLC` | [`content-lifecycle.md`](content-lifecycle.md) |
| `BR-VER` | [`content-versioning.md`](content-versioning.md) |
| `BR-ERR` | [`error-codes.md`](error-codes.md) |
| `BR-EVT` | [`event-catalog.md`](event-catalog.md) |
| `BR-MVP` | [`mvp-scope.md`](mvp-scope.md) |
| `BR-REG2` | [`business-rules.md`](business-rules.md) (file này) |
| `BR-RBS` | [`repo-bootstrap.md`](repo-bootstrap.md) |
| `BR-MPA` | [`monorepo-package-architecture.md`](monorepo-package-architecture.md) |
| `BR-ARB` | [`app-runtime-boundary.md`](app-runtime-boundary.md) |

**Platform**

| Prefix | Spec | | Prefix | Spec |
|---|---|---|---|---|
| `BR-DM` | [`data-model-overview.md`](../01-platform/data-model-overview.md) | | `BR-SIB` | [`schema-identity-billing.md`](../01-platform/schema-identity-billing.md) |
| `BR-SCT` | [`schema-content-taxonomy.md`](../01-platform/schema-content-taxonomy.md) | | `BR-SPT` | [`schema-play-telemetry.md`](../01-platform/schema-play-telemetry.md) |
| `BR-TAX` | [`taxonomy-service.md`](../01-platform/taxonomy-service.md) | | `BR-GTC` | [`game-template-contract.md`](../01-platform/game-template-contract.md) |
| `BR-ENG` | [`game-engine-runtime.md`](../01-platform/game-engine-runtime.md) | | `BR-ADP` | [`adaptive-engine.md`](../01-platform/adaptive-engine.md) |
| `BR-TLM` | [`telemetry-pipeline.md`](../01-platform/telemetry-pipeline.md) | | `BR-AUD` | [`audit-log.md`](../01-platform/audit-log.md) |
| `BR-AUT` | [`auth-tokens-sessions.md`](../01-platform/auth-tokens-sessions.md) | | `BR-IMG` | [`image-storage.md`](../01-platform/image-storage.md) |
| `BR-EMJ` | [`emoji-registry.md`](../01-platform/emoji-registry.md) | | `BR-TAG` | [`content-tagging.md`](../01-platform/content-tagging.md) |
| `BR-SRC` | [`content-search.md`](../01-platform/content-search.md) | | `BR-JOB` | [`job-queue.md`](../01-platform/job-queue.md) |
| `BR-NOT` | [`notification-service.md`](../01-platform/notification-service.md) | | `BR-HLT` | [`health-check.md`](../01-platform/health-check.md) |
| `BR-BAK` | [`backup-and-restore.md`](../01-platform/backup-and-restore.md) | | `BR-MON` | [`monitoring-and-alerting.md`](../01-platform/monitoring-and-alerting.md) |
| `BR-OFF` | [`offline-play.md`](../01-platform/offline-play.md) | | `BR-PWA` | [`pwa-install.md`](../01-platform/pwa-install.md) |
| `BR-RTL` | [`rate-limiting.md`](../01-platform/rate-limiting.md) | | `BR-FLG` | [`feature-flag-service.md`](../01-platform/feature-flag-service.md) |
| `BR-CSA` | [`content-seed-authoring.md`](../01-platform/content-seed-authoring.md) | | `BR-AIG` | [`ai-codegen-pipeline.md`](../01-platform/ai-codegen-pipeline.md) |
| `BR-OAP` | [`oauth-provider-registry.md`](../01-platform/oauth-provider-registry.md) | | `BR-BPS` | [`browser-push.md`](../01-platform/browser-push.md) |
| `BR-APM` | [`automated-payment.md`](../01-platform/automated-payment.md) | | `BR-OCP` | [`offline-curriculum-pack.md`](../01-platform/offline-curriculum-pack.md) |
| `BR-AST` | [`audio-storage.md`](../01-platform/audio-storage.md) | | `BR-LAY` | [`game-layout-engine.md`](../01-platform/game-layout-engine.md) |
| `BR-RNG` | [`deterministic-randomness.md`](../01-platform/deterministic-randomness.md) | | `BR-TAK` | [`template-authoring-kit.md`](../01-platform/template-authoring-kit.md) |
| `BR-ENV` | [`env-contract.md`](../01-platform/env-contract.md) | | `BR-SRV` | [`server-provisioning.md`](../01-platform/server-provisioning.md) |
| `BR-SUP` | [`process-supervision.md`](../01-platform/process-supervision.md) | | `BR-DEP` | [`release-deploy.md`](../01-platform/release-deploy.md) |
| `BR-RBK` | [`release-rollback.md`](../01-platform/release-rollback.md) | | `BR-MTB` | [`montessori-template-batch.md`](../01-platform/montessori-template-batch.md) |
| `BR-LVB` | [`legacy-v1-template-batch.md`](../01-platform/legacy-v1-template-batch.md) | | `BR-TGB` | [`taxonomy-gap-batch.md`](../01-platform/taxonomy-gap-batch.md) |
| `BR-ESS` | [`engine-spec-sheet.md`](../01-platform/engine-spec-sheet.md) | | `BR-LGK` | [`level-generator-kit.md`](../01-platform/level-generator-kit.md) |
| `BR-ERC` | [`engine-render-contract.md`](../01-platform/engine-render-contract.md) | | `BR-E000`…`BR-E036` | [`engines/index.md`](../01-platform/engines/index.md) (27 spec engine trong registry, 9 spec đặt trước) |

**Public**

| Prefix | Spec | | Prefix | Spec |
|---|---|---|---|---|
| `BR-LND` | [`landing-page.md`](../02-public/landing-page.md) | | `BR-GCP` | [`game-catalog-public.md`](../02-public/game-catalog-public.md) |
| `BR-GDP` | [`game-detail-public.md`](../02-public/game-detail-public.md) | | `BR-PSH` | [`program-showcase.md`](../02-public/program-showcase.md) |
| `BR-PRC` | [`pricing-page.md`](../02-public/pricing-page.md) | | `BR-SEO2` | [`seo-and-structured-data.md`](../02-public/seo-and-structured-data.md) |
| `BR-FAQ` | [`faq-and-help.md`](../02-public/faq-and-help.md) | | `BR-LGL` | [`legal-pages.md`](../02-public/legal-pages.md) |
| `BR-CKB` | [`cookie-and-consent-banner.md`](../02-public/cookie-and-consent-banner.md) | | | |

**Account**

| Prefix | Spec | | Prefix | Spec |
|---|---|---|---|---|
| `BR-REG` | [`registration.md`](../03-account/registration.md) | | `BR-LGN` | [`login-and-session.md`](../03-account/login-and-session.md) |
| `BR-EVF` | [`email-verification.md`](../03-account/email-verification.md) | | `BR-PWR` | [`password-recovery.md`](../03-account/password-recovery.md) |
| `BR-MFA` | [`mfa.md`](../03-account/mfa.md) | | `BR-ACS` | [`account-settings.md`](../03-account/account-settings.md) |
| `BR-ADL` | [`account-deletion.md`](../03-account/account-deletion.md) | | `BR-CSM` | [`consent-management.md`](../03-account/consent-management.md) |
| `BR-CPC` | [`child-profile-crud.md`](../03-account/child-profile-crud.md) | | `BR-CPS` | [`child-profile-switching.md`](../03-account/child-profile-switching.md) |
| `BR-CPR` | [`child-profile-archive.md`](../03-account/child-profile-archive.md) | | `BR-MDB` | [`member-dashboard.md`](../03-account/member-dashboard.md) |
| `BR-MLB` | [`my-library.md`](../03-account/my-library.md) | | `BR-BRP` | [`basic-report.md`](../03-account/basic-report.md) |
| `BR-ARP` | [`advanced-report.md`](../03-account/advanced-report.md) | | `BR-POC` | [`payment-order-create.md`](../03-account/payment-order-create.md) |
| `BR-PPU` | [`payment-proof-upload.md`](../03-account/payment-proof-upload.md) | | `BR-SBV` | [`subscription-view.md`](../03-account/subscription-view.md) |
| `BR-SCL` | [`social-login.md`](../03-account/social-login.md) | | `BR-SLK` | [`social-account-linking.md`](../03-account/social-account-linking.md) |
| `BR-NIB` | [`notification-inbox.md`](../03-account/notification-inbox.md) | | `BR-RBL` | [`recurring-billing.md`](../03-account/recurring-billing.md) |

**Play**

| Prefix | Spec | | Prefix | Spec |
|---|---|---|---|---|
| `BR-PEN` | [`play-entry-and-profile-select.md`](../04-play/play-entry-and-profile-select.md) | | `BR-GAT` | [`access-gating.md`](../04-play/access-gating.md) |
| `BR-CFG` | [`game-config-delivery.md`](../04-play/game-config-delivery.md) | | `BR-PSL` | [`play-session-lifecycle.md`](../04-play/play-session-lifecycle.md) |
| `BR-ING` | [`play-event-ingestion.md`](../04-play/play-event-ingestion.md) | | `BR-SCO` | [`scoring-and-result.md`](../04-play/scoring-and-result.md) |
| `BR-SCF` | [`scaffolding-and-hints.md`](../04-play/scaffolding-and-hints.md) | | `BR-FBK` | [`feedback-and-celebration.md`](../04-play/feedback-and-celebration.md) |
| `BR-PGT` | [`parent-gate.md`](../04-play/parent-gate.md) | | `BR-HPL` | [`healthy-play-limits.md`](../04-play/healthy-play-limits.md) |
| `BR-CUR` | [`curriculum-player.md`](../04-play/curriculum-player.md) | | `BR-PRG` | [`progress-and-mastery.md`](../04-play/progress-and-mastery.md) |
| `BR-REC` | [`next-game-recommendation.md`](../04-play/next-game-recommendation.md) | | `BR-LSR` | [`lesson-session-runner.md`](../04-play/lesson-session-runner.md) |
| `BR-RSP` | [`round-sequence-play.md`](../04-play/round-sequence-play.md) | | `BR-CIR` | [`concept-intro-runner.md`](../04-play/concept-intro-runner.md) |
| `BR-CIG` | [`concept-intro-gate.md`](../04-play/concept-intro-gate.md) | | | |

**Content**

| Prefix | Spec | | Prefix | Spec |
|---|---|---|---|---|
| `BR-GLM` | [`game-level-model.md`](../05-content/game-level-model.md) | | `BR-LSM` | [`lesson-model.md`](../05-content/lesson-model.md) |
| `BR-ACM` | [`activity-model.md`](../05-content/activity-model.md) | | `BR-CRM` | [`curriculum-model.md`](../05-content/curriculum-model.md) |
| `BR-WSM` | [`worksheet-model.md`](../05-content/worksheet-model.md) | | `BR-LEX` | [`lesson-exemplar-set.md`](../05-content/lesson-exemplar-set.md) |
| `BR-MCM` | [`montessori-corpus-mapping.md`](../05-content/montessori-corpus-mapping.md) | | `BR-MGL` | [`montessori-game-level-batch.md`](../05-content/montessori-game-level-batch.md) |
| `BR-MLS` | [`montessori-lesson-batch.md`](../05-content/montessori-lesson-batch.md) | | `BR-RSM` | [`round-set-model.md`](../05-content/round-set-model.md) |
| `BR-TCL` | [`template-coverage-level-batch.md`](../05-content/template-coverage-level-batch.md) | | `BR-LTV` | [`lesson-template-variety.md`](../05-content/lesson-template-variety.md) |
| `BR-ECD` | [`engine-content-depth.md`](../05-content/engine-content-depth.md) | | `BR-CTR` | [`content-theme-registry.md`](../05-content/content-theme-registry.md) |
| `BR-LCD` | [`lesson-corpus-depth.md`](../05-content/lesson-corpus-depth.md) | | `BR-LFM` | [`lesson-flow-model.md`](../05-content/lesson-flow-model.md) |
| `BR-RSD` | [`round-set-corpus-depth.md`](../05-content/round-set-corpus-depth.md) | | `BR-CIM` | [`concept-intro-model.md`](../05-content/concept-intro-model.md) |
| `BR-SDS` | [`skill-dataset-model.md`](../05-content/skill-dataset-model.md) | | `BR-SKQ` | [`engine-content-depth.md`](../05-content/engine-content-depth.md) mục 6.1 |
| `BR-STA` | [`skill-dataset-model.md`](../05-content/skill-dataset-model.md) §7.5 | | `BR-ALC` | [`skill-dataset-model.md`](../05-content/skill-dataset-model.md) §7.4 |

**Admin**

| Prefix | Spec | | Prefix | Spec |
|---|---|---|---|---|
| `BR-ADA` | [`admin-auth.md`](../06-admin/admin-auth.md) | | `BR-DSH` | [`admin-dashboard.md`](../06-admin/admin-dashboard.md) |
| `BR-MME` | [`manager-mfa-enrollment.md`](../06-admin/manager-mfa-enrollment.md) | | | |
| `BR-USM` | [`user-management.md`](../06-admin/user-management.md) | | `BR-USD` | [`user-detail.md`](../06-admin/user-detail.md) |
| `BR-CPA` | [`child-profile-admin.md`](../06-admin/child-profile-admin.md) | | `BR-EGR` | [`entitlement-grant.md`](../06-admin/entitlement-grant.md) |
| `BR-PQU` | [`payment-queue.md`](../06-admin/payment-queue.md) | | `BR-PAP` | [`payment-approval.md`](../06-admin/payment-approval.md) |
| `BR-PCA` | [`package-catalog-admin.md`](../06-admin/package-catalog-admin.md) | | `BR-TXB` | [`taxonomy-browser.md`](../06-admin/taxonomy-browser.md) |
| `BR-STU` | [`game-level-studio.md`](../06-admin/game-level-studio.md) | | `BR-SDF` | [`schema-driven-form.md`](../06-admin/schema-driven-form.md) |
| `BR-LPV` | [`live-preview.md`](../06-admin/live-preview.md) | | `BR-CRQ` | [`content-review-queue.md`](../06-admin/content-review-queue.md) |
| `BR-PUB` | [`publish-and-version.md`](../06-admin/publish-and-version.md) | | `BR-LSA` | [`lesson-authoring.md`](../06-admin/lesson-authoring.md) |
| `BR-ACA` | [`activity-authoring.md`](../06-admin/activity-authoring.md) | | `BR-CBD` | [`curriculum-builder.md`](../06-admin/curriculum-builder.md) |
| `BR-IUP` | [`image-upload.md`](../06-admin/image-upload.md) | | `BR-EPK` | [`emoji-picker.md`](../06-admin/emoji-picker.md) |
| `BR-AUT2` | [`asset-usage-tracking.md`](../06-admin/asset-usage-tracking.md) | | `BR-SEO` | [`seo-content-admin.md`](../06-admin/seo-content-admin.md) |
| `BR-NTA` | [`notification-admin.md`](../06-admin/notification-admin.md) | | `BR-ALV` | [`audit-log-viewer.md`](../06-admin/audit-log-viewer.md) |
| `BR-ELV` | [`error-log-viewer.md`](../06-admin/error-log-viewer.md) | | `BR-SYS` | [`system-activity.md`](../06-admin/system-activity.md) |
| `BR-FFA` | [`feature-flags.md`](../06-admin/feature-flags.md) | | `BR-EXP` | [`data-export.md`](../06-admin/data-export.md) |
| `BR-LCA` | [`legal-consent-admin.md`](../06-admin/legal-consent-admin.md) | | `BR-ASC` | [`admin-subscription-cancel.md`](../06-admin/admin-subscription-cancel.md) |

**Add-on**

| Prefix | Spec | | Prefix | Spec |
|---|---|---|---|---|
| `BR-LPC` | [`lesson-plan-creator.md`](../07-addon/lesson-plan-creator.md) | | `BR-CGB` | [`custom-game-builder.md`](../07-addon/custom-game-builder.md) |
| `BR-PCU` | [`personal-curriculum.md`](../07-addon/personal-curriculum.md) | | `BR-AIA` | [`ai-assistant.md`](../07-addon/ai-assistant.md) |
| `BR-ACL` | [`ai-credit-ledger.md`](../07-addon/ai-credit-ledger.md) | | `BR-PDF` | [`pdf-export.md`](../07-addon/pdf-export.md) |
| `BR-SEM` | [`semantic-search.md`](../07-addon/semantic-search.md) | | | |

**Quality**

| Prefix | Spec | | Prefix | Spec |
|---|---|---|---|---|
| `BR-TST` | [`testing-strategy.md`](../08-quality/testing-strategy.md) | | `BR-SEC` | [`security-checklist.md`](../08-quality/security-checklist.md) |
| `BR-A11` | [`accessibility.md`](../08-quality/accessibility.md) | | `BR-PRF` | [`performance-budgets.md`](../08-quality/performance-budgets.md) |
| `BR-DSC` | [`design-system-contract.md`](../08-quality/design-system-contract.md) | | `BR-PED` | [`pedagogical-evidence.md`](../08-quality/pedagogical-evidence.md) |
| `BR-TCM` | [`thinking-coverage-matrix.md`](../08-quality/thinking-coverage-matrix.md) | | `BR-TYP` | [`type-safety.md`](../08-quality/type-safety.md) |
| `BR-GLR` | [`go-live-readiness.md`](../08-quality/go-live-readiness.md) | | `BR-LVC` | [`legacy-v1-coverage.md`](../08-quality/legacy-v1-coverage.md) |

### 7.2 Thống kê

| | Số |
|---|---:|
| Spec module | 162 |
| Prefix BR | 162 |
| Business rule | ~1473 |

**Cảnh báo:** con số "spec module" trước 2026-08-05 ghi **123**, trong khi
[`../index.md`](../index.md) đếm **124**. Lệch có từ trước, chưa truy nguyên. Đã đặt lại theo
[`index.md`](../index.md) (124 + 3 spec SNS/OAuth = 127) — nếu ai tìm ra nguồn lệch thì sửa cả
hai chỗ.

### 7.3 Rule không bao giờ được nới lỏng

Nếu chỉ đọc một mục trong toàn corpus, đọc mục này.

**Trẻ em**

| Rule | Nội dung |
|---|---|
| `BR-CDC-01` | `child_profiles` chỉ có trường trong danh sách đóng |
| `BR-CDC-02` `BR-CDC-03` | Không ngày sinh đầy đủ, không họ tên đầy đủ |
| `BR-CDC-04` | Không ảnh chụp trẻ ở bất kỳ đâu |
| `BR-CDC-05` | Không PII trong telemetry |
| `BR-CDC-06` | Không dữ liệu trẻ tới LLM |
| `BR-CDC-11` | Không credential cho trẻ |
| `BR-CDC-09` | Không quảng cáo, leaderboard công khai, hay cơ chế gây nghiện |

**Tiền**

| Rule | Nội dung |
|---|---|
| `BR-PAY-02` `BR-PAP-01` | Không duyệt thanh toán hai lần |
| `BR-PAY-03` `BR-PAP-02` | Duyệt và cấp quyền trong **một transaction** |
| `BR-PAY-05` | Upload chứng từ không tự kích hoạt gói |
| `BR-PKG-03` `BR-POC-01` | Không nhận giá từ client |
| `BR-PAY-08` | Không xoá lịch sử giao dịch |

**Quyền truy cập**

| Rule | Nội dung |
|---|---|
| `BR-LAD-02` | Content thiếu `access_tier` coi là **premium** |
| `BR-LAD-03` `BR-GAT-01` | Kiểm ở server, không kiểm ở client |
| `BR-LAD-04` `BR-GAT-03` | Response bị chặn không mang `content_pack` |
| `BR-ACT-01` | Hai guard tách biệt, không dùng guard chung kèm cờ |
| `BR-ACT-03` | Record của người khác → **404** |

**Danh tính**

| Rule | Nội dung |
|---|---|
| `BR-SCL-04` | **Cấm tự liên kết SNS vào tài khoản sẵn có vì trùng email.** Đây là đường chiếm tài khoản trực tiếp |
| `BR-OAP-08` | Email do provider trả về không được coi là đã xác minh khi họ không khẳng định |
| `BR-OAP-01` `BR-OAP-02` | Chỉ authorization code + PKCE; client secret không rời server |
| `BR-OAP-04` | `redirect_uri` từ cấu hình, không lấy từ input người dùng |
| `BR-AUT-17` `BR-MFA-09` | SNS là yếu tố **thứ nhất**. Không thay được cho MFA. |
| `BR-AUT-13` `BR-SLK-01` | Thao tác nhạy cảm cần reauth ≤5 phút. Phiên hợp lệ một mình không đủ. |
| `BR-SLK-04` | **Cấm gỡ phương thức đăng nhập cuối cùng** |
| `BR-AUT-15` | **Manager cấm đăng nhập bằng SNS** |
| `BR-AUT-25` `BR-AUT-31` `BR-AUT-38` | User/Manager auth chỉ dùng opaque Redis credential; cấm first-party JWT/`jose` và cấm fallback khi Redis lỗi |
| `BR-AUT-27` `BR-AUT-28` | Session tuyệt đối 1 giờ; remember tuyệt đối tối đa 365 ngày, không sliding |
| `BR-AUT-29` | Remember reuse thu hồi toàn bộ session/credential của account |
| `BR-AUT-34` | Manager chỉ nhận remember credential sau khi MFA thành công |
| `BR-ERR-08` | Thông báo lỗi không tiết lộ tài khoản đăng nhập bằng cách nào |

**Đồng ý pháp lý**

| Rule | Nội dung |
|---|---|
| `BR-LGL-02` `BR-LGL-09` | Tài liệu pháp lý là singleton code-owned; không policy version, lịch sử sản phẩm hay editor admin |
| `BR-CSM-01` `BR-CDC-07` | Consent log INSERT-only; đồng ý/rút là action mới, không sửa lịch sử |
| `BR-CSM-04` | Force không được chặn legal document, export, withdrawal, reauth, logout hay account deletion |
| `BR-CSM-09` | Acceptance phải đối chiếu marker User đã xem trong cùng transaction |
| `BR-LCA-03` | Force marker và audit phải commit trong cùng transaction |
| `BR-LCA-06` `BR-LCA-08` | Không auto-force từ deploy và không clear, giảm hay rollback marker |

**Nội dung**

| Rule | Nội dung |
|---|---|
| `BR-CLC-01` `BR-VER-02` `BR-CSA-01` | Nội dung `published` bất biến; đúng một bản published mỗi mã. Seed **chỉ INSERT** |
| `BR-CLC-04` `BR-CSA-07` | **Cấm** để một tiến trình máy phát hành nội dung. AI soạn file, **người** merge |
| `BR-CLC-02` | Không có đường tắt `draft → published` |
| `BR-CLC-11` `BR-CSA-04` | Hàng seed ở `published` vẫn qua **đủ** checklist publish ở tầng service |
| `BR-VER-03` | Phiên chơi ghim `content_version` |
| `BR-GTC-02` | `content_pack` parse được ở server trước khi ghi |

**Bề mặt trẻ**

| Rule | Nội dung |
|---|---|
| `BR-ENG-07` `BR-FBK-01` `BR-FBK-02` | Sai có phản hồi, không trừng phạt — và im lặng cũng là defect |
| `BR-ENG-05` `BR-A11-04` | Sàn chạm theo band tuổi |
| `BR-ENG-11` | Không đếm ngược, không hiện điểm lúc chơi, không đặt nút thoát ở chỗ dễ tap trúng |
| `BR-PGT-01` | Nút thoát không đặt ở chỗ dễ tap trúng |
| `BR-DSC-06` `BR-DSC-07` | Không dùng `dark:`, không dùng màu đỏ trên bề mặt trẻ |
| `BR-HPL-02` `BR-LAD-08` | Không cắt phiên đang chạy |

**Vận hành**

| Rule | Nội dung |
|---|---|
| `BR-AUD-01` `BR-AUD-02` | Audit INSERT-only, ghi trong cùng transaction |
| `BR-BAK-01` `BR-BAK-06` | Verify restore hàng tuần; không go-live khi chưa verify lần nào |
| `BR-HLT-01` | Health check không trả 200 cứng |
| `BR-MON-01` `BR-MON-03` | Alert tới người; không tắt alert để giảm ồn |

## 8. API contract

Không có.

## 9. Acceptance criteria

```gherkin
Scenario: BR-REG2-01 — prefix duy nhất
  When quét frontmatter và nội dung mọi spec
  Then không prefix BR nào xuất hiện ở hai spec khác nhau

Scenario: BR-REG2-03 — mọi rule có lý do
  When quét mọi bảng business rule trong corpus
  Then mỗi hàng có cột thứ ba không rỗng

Scenario: mọi BR trong code tra được về spec
  When quét mọi tham chiếu BR trong source và test
  Then mỗi prefix có mặt trong §7.1

Scenario: BR-REG2-02 — ID không tái dùng
  Given một rule bị xoá khỏi spec
  When thêm rule mới vào spec đó
  Then số mới lớn hơn mọi số đã dùng
```

## 10. Boundaries

**Always**
- Cập nhật §7.1 khi thêm spec mới.
- Giữ cột "vì sao" cho mọi rule.

**Ask first**
- Đổi hoặc xoá một rule đã có test tham chiếu.
- Thêm prefix mới.

**Never**
- Nới bất kỳ rule nào ở §7.3.
- Tái dùng ID của rule đã xoá.
- Hai spec dùng chung prefix.

## 11. Open questions

| # | Câu hỏi | Chặn gì | Chặn phase | Chủ |
|---|---|---|---|---|
| 1 | Có tự sinh registry này từ corpus không, thay vì duy trì tay? `gen:spec-index` làm được | [`ai-codegen-pipeline.md`](../01-platform/ai-codegen-pipeline.md) | Hoãn, chặn phase P1 tooling | hoãn — bước dựng cổng corpus ở Task #2 đã bị gỡ cùng `packages/gates` |
| 2 | `status: implemented` của spec này còn đúng không, khi 4 rule `BR-REG2-*` không còn cổng nào đo? | Ý nghĩa của chính từ `implemented` trong corpus | Chưa chặn phase nào | mở — người dùng quyết xoá cổng 2026-08-29, chưa quyết hạ status |
