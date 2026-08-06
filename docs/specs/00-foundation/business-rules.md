---
spec: BUSINESS-RULES
title: Registry business rule
area: foundation
status: approved
mvp: true
phase: P0
reviewed: 2026-08-06
owns:
  - Bản đồ prefix BR → spec sở hữu
  - Danh sách rule không bao giờ được vi phạm
depends_on:
  - CONVENTIONS
---

# Registry business rule

## 1. Objective

Corpus có **~1000 business rule** trên 127 spec. Registry này ❌ **không** liệt kê lại từng
rule — nó ánh xạ **prefix → spec sở hữu**, để tra ngược từ một ID trong code hoặc test về
nơi định nghĩa.

Cộng thêm §7.3: **danh sách rule không bao giờ được vi phạm**, bất kể áp lực lịch trình.

## 2. Actors

Dev · reviewer · test.

## 3. Entry points

Mọi `BR-*` trong code, test, và PR. `pnpm gen:check` cảnh báo BR ❌ không được tham chiếu.

## 4. Main flow

1. Gặp `BR-XXX-nn` trong code hoặc test.
2. Tra prefix ở §7.1 → mở spec sở hữu.
3. Đọc rule kèm **lý do** — cột "vì sao" là bắt buộc (`CONVENTIONS` §5).

## 5. Alternative flows

| Nhánh | Hành vi |
|---|---|
| Prefix ❌ không có trong §7.1 | Spec mới chưa đăng ký — cập nhật file này |
| Hai spec cùng prefix | Vi phạm quy ước; một trong hai phải đổi |

## 6. Business rules

| ID | Rule | Vì sao |
|---|---|---|
| `BR-REG2-01` | Prefix BR **duy nhất toàn corpus** | Trùng prefix làm tra ngược sai spec |
| `BR-REG2-02` | ID rule **bất biến** — ❌ không đổi, ❌ không tái dùng số của rule đã xoá | Test và code tham chiếu bằng ID |
| `BR-REG2-03` | Mọi rule có cột **"vì sao"** | Rule ❌ không có lý do sẽ bị xoá sai bởi người sau |
| `BR-REG2-04` | Rule ở §7.3 ❌ **NEVER được nới**, kể cả tạm thời | Chúng bảo vệ trẻ em, tiền, và dữ liệu ❌ không sửa ngược được |

## 7. Data

### 7.1 Bản đồ prefix → spec

**Foundation**

| Prefix | Spec |
|---|---|
| `BR-GLOS` | `glossary` |
| `BR-ID` | `id-conventions` |
| `BR-ACT` | `actors` |
| `BR-CDC` | `child-data-compliance` |
| `BR-LAD` | `access-ladder` |
| `BR-ENT` | `entitlement-model` |
| `BR-PKG` | `package-catalog` |
| `BR-PAY` | `payment-flow` |
| `BR-CLC` | `content-lifecycle` |
| `BR-VER` | `content-versioning` |
| `BR-ERR` | `error-codes` |
| `BR-EVT` | `event-catalog` |
| `BR-MVP` | `mvp-scope` |
| `BR-REG2` | `business-rules` (file này) |
| `BR-RBS` | `repo-bootstrap` |
| `BR-MPA` | `monorepo-package-architecture` |

**Platform**

| Prefix | Spec | | Prefix | Spec |
|---|---|---|---|---|
| `BR-DM` | `data-model-overview` | | `BR-SIB` | `schema-identity-billing` |
| `BR-SCT` | `schema-content-taxonomy` | | `BR-SPT` | `schema-play-telemetry` |
| `BR-TAX` | `taxonomy-service` | | `BR-GTC` | `game-template-contract` |
| `BR-ENG` | `game-engine-runtime` | | `BR-ADP` | `adaptive-engine` |
| `BR-TLM` | `telemetry-pipeline` | | `BR-AUD` | `audit-log` |
| `BR-AUT` | `auth-tokens-sessions` | | `BR-IMG` | `image-storage` |
| `BR-EMJ` | `emoji-registry` | | `BR-TAG` | `content-tagging` |
| `BR-SRC` | `content-search` | | `BR-JOB` | `job-queue` |
| `BR-NOT` | `notification-service` | | `BR-HLT` | `health-check` |
| `BR-BAK` | `backup-and-restore` | | `BR-MON` | `monitoring-and-alerting` |
| `BR-OFF` | `offline-play` | | `BR-PWA` | `pwa-install` |
| `BR-RTL` | `rate-limiting` | | `BR-FLG` | `feature-flag-service` |
| `BR-CSA` | `content-seed-authoring` | | `BR-AIG` | `ai-codegen-pipeline` |
| `BR-OAP` | `oauth-provider-registry` | | | |

**Public**

| Prefix | Spec | | Prefix | Spec |
|---|---|---|---|---|
| `BR-LND` | `landing-page` | | `BR-GCP` | `game-catalog-public` |
| `BR-GDP` | `game-detail-public` | | `BR-PSH` | `program-showcase` |
| `BR-PRC` | `pricing-page` | | `BR-SEO2` | `seo-and-structured-data` |
| `BR-FAQ` | `faq-and-help` | | `BR-LGL` | `legal-pages` |
| `BR-CKB` | `cookie-and-consent-banner` | | | |

**Account**

| Prefix | Spec | | Prefix | Spec |
|---|---|---|---|---|
| `BR-REG` | `registration` | | `BR-LGN` | `login-and-session` |
| `BR-EVF` | `email-verification` | | `BR-PWR` | `password-recovery` |
| `BR-MFA` | `mfa` | | `BR-ACS` | `account-settings` |
| `BR-ADL` | `account-deletion` | | `BR-CSM` | `consent-management` |
| `BR-CPC` | `child-profile-crud` | | `BR-CPS` | `child-profile-switching` |
| `BR-CPR` | `child-profile-archive` | | `BR-MDB` | `member-dashboard` |
| `BR-MLB` | `my-library` | | `BR-BRP` | `basic-report` |
| `BR-ARP` | `advanced-report` | | `BR-POC` | `payment-order-create` |
| `BR-PPU` | `payment-proof-upload` | | `BR-SBV` | `subscription-view` |
| `BR-SCL` | `social-login` | | `BR-SLK` | `social-account-linking` |

**Play**

| Prefix | Spec | | Prefix | Spec |
|---|---|---|---|---|
| `BR-PEN` | `play-entry-and-profile-select` | | `BR-GAT` | `access-gating` |
| `BR-CFG` | `game-config-delivery` | | `BR-PSL` | `play-session-lifecycle` |
| `BR-ING` | `play-event-ingestion` | | `BR-SCO` | `scoring-and-result` |
| `BR-SCF` | `scaffolding-and-hints` | | `BR-FBK` | `feedback-and-celebration` |
| `BR-PGT` | `parent-gate` | | `BR-HPL` | `healthy-play-limits` |
| `BR-CUR` | `curriculum-player` | | `BR-PRG` | `progress-and-mastery` |
| `BR-REC` | `next-game-recommendation` | | | |

**Content**

| Prefix | Spec | | Prefix | Spec |
|---|---|---|---|---|
| `BR-GLM` | `game-level-model` | | `BR-LSM` | `lesson-model` |
| `BR-ACM` | `activity-model` | | `BR-CRM` | `curriculum-model` |
| `BR-WSM` | `worksheet-model` | | | |

**Admin**

| Prefix | Spec | | Prefix | Spec |
|---|---|---|---|---|
| `BR-ADA` | `admin-auth` | | `BR-DSH` | `admin-dashboard` |
| `BR-USM` | `user-management` | | `BR-USD` | `user-detail` |
| `BR-CPA` | `child-profile-admin` | | `BR-EGR` | `entitlement-grant` |
| `BR-PQU` | `payment-queue` | | `BR-PAP` | `payment-approval` |
| `BR-PCA` | `package-catalog-admin` | | `BR-TXB` | `taxonomy-browser` |
| `BR-STU` | `game-level-studio` | | `BR-SDF` | `schema-driven-form` |
| `BR-LPV` | `live-preview` | | `BR-CRQ` | `content-review-queue` |
| `BR-PUB` | `publish-and-version` | | `BR-LSA` | `lesson-authoring` |
| `BR-ACA` | `activity-authoring` | | `BR-CBD` | `curriculum-builder` |
| `BR-IUP` | `image-upload` | | `BR-EPK` | `emoji-picker` |
| `BR-AUT2` | `asset-usage-tracking` | | `BR-SEO` | `seo-content-admin` |
| `BR-NTA` | `notification-admin` | | `BR-ALV` | `audit-log-viewer` |
| `BR-ELV` | `error-log-viewer` | | `BR-SYS` | `system-activity` |
| `BR-FFA` | `feature-flags` | | `BR-EXP` | `data-export` |

**Add-on**

| Prefix | Spec | | Prefix | Spec |
|---|---|---|---|---|
| `BR-LPC` | `lesson-plan-creator` | | `BR-CGB` | `custom-game-builder` |
| `BR-PCU` | `personal-curriculum` | | `BR-AIA` | `ai-assistant` |
| `BR-ACL` | `ai-credit-ledger` | | `BR-PDF` | `pdf-export` |
| `BR-SEM` | `semantic-search` | | | |

**Quality**

| Prefix | Spec | | Prefix | Spec |
|---|---|---|---|---|
| `BR-TST` | `testing-strategy` | | `BR-SEC` | `security-checklist` |
| `BR-A11` | `accessibility` | | `BR-PRF` | `performance-budgets` |
| `BR-DSC` | `design-system-contract` | | | |

### 7.2 Thống kê

| | Số |
|---|---:|
| Spec module | 130 |
| Prefix BR | 126 |
| Business rule | ~1015 |

⚠️ Con số "spec module" trước 2026-08-05 ghi **123**, trong khi
[`../index.md`](../index.md) đếm **124**. Lệch có từ trước, ❌ chưa truy nguyên. Đã đặt lại
theo `index.md` (124 + 3 spec SNS/OAuth = 127) — nếu ai tìm ra nguồn lệch thì sửa cả hai chỗ.

### 7.3 Rule ❌ **NEVER** được nới

Nếu chỉ đọc một mục trong toàn corpus, đọc mục này.

**Trẻ em**

| Rule | Nội dung |
|---|---|
| `BR-CDC-01` | `child_profiles` chỉ có trường trong danh sách đóng |
| `BR-CDC-02` `BR-CDC-03` | ❌ Không ngày sinh đầy đủ, ❌ không họ tên đầy đủ |
| `BR-CDC-04` | ❌ Không ảnh chụp trẻ ở bất kỳ đâu |
| `BR-CDC-05` | ❌ Không PII trong telemetry |
| `BR-CDC-06` | ❌ Không dữ liệu trẻ tới LLM |
| `BR-CDC-11` | ❌ Không credential cho trẻ |
| `BR-CDC-09` | ❌ Không quảng cáo, leaderboard công khai, hay cơ chế gây nghiện |

**Tiền**

| Rule | Nội dung |
|---|---|
| `BR-PAY-02` `BR-PAP-01` | ❌ Không duyệt thanh toán hai lần |
| `BR-PAY-03` `BR-PAP-02` | Duyệt và cấp quyền trong **một transaction** |
| `BR-PAY-05` | Upload chứng từ ❌ không kích hoạt gói |
| `BR-PKG-03` `BR-POC-01` | ❌ Không nhận giá từ client |
| `BR-PAY-08` | ❌ Không xoá lịch sử giao dịch |

**Quyền truy cập**

| Rule | Nội dung |
|---|---|
| `BR-LAD-02` | Content thiếu `access_tier` coi là **premium** |
| `BR-LAD-03` `BR-GAT-01` | Kiểm ở server, ❌ không ở client |
| `BR-LAD-04` `BR-GAT-03` | Response bị chặn ❌ không mang `content_pack` |
| `BR-ACT-01` | Hai guard tách biệt, ❌ không guard chung có cờ |
| `BR-ACT-03` | Record của người khác → **404** |

**Danh tính**

| Rule | Nội dung |
|---|---|
| `BR-SCL-04` | ❌ **NEVER tự liên kết SNS vào tài khoản sẵn có vì trùng email.** Đây là đường chiếm tài khoản trực tiếp |
| `BR-OAP-08` | Email do provider trả về ❌ không được coi là đã xác minh khi họ ❌ không khẳng định |
| `BR-OAP-01` `BR-OAP-02` | Chỉ authorization code + PKCE; client secret ❌ không rời server |
| `BR-OAP-04` | `redirect_uri` từ cấu hình, ❌ không từ input người dùng |
| `BR-AUT-17` `BR-MFA-09` | SNS là yếu tố **thứ nhất**. ❌ NEVER thay MFA |
| `BR-AUT-13` `BR-SLK-01` | Thao tác nhạy cảm cần reauth ≤5 phút. Phiên hợp lệ một mình ❌ không đủ |
| `BR-SLK-04` | ❌ **NEVER gỡ phương thức đăng nhập cuối cùng** |
| `BR-AUT-15` | Manager ❌ **NEVER đăng nhập bằng SNS** |
| `BR-ERR-08` | Thông báo lỗi ❌ không tiết lộ tài khoản đăng nhập bằng cách nào |

**Nội dung**

| Rule | Nội dung |
|---|---|
| `BR-CLC-01` `BR-VER-02` `BR-CSA-01` | Nội dung `published` bất biến; đúng một bản published mỗi mã. Seed **chỉ INSERT** |
| `BR-CLC-04` `BR-CSA-07` | ❌ **NEVER** để một tiến trình máy phát hành nội dung. AI soạn file, **người** merge |
| `BR-CLC-02` | ❌ Không đường tắt `draft → published` |
| `BR-CLC-11` `BR-CSA-04` | Hàng seed ở `published` vẫn qua **đủ** checklist publish ở tầng service |
| `BR-VER-03` | Phiên chơi ghim `content_version` |
| `BR-GTC-02` | `content_pack` parse được ở server trước khi ghi |

**Bề mặt trẻ**

| Rule | Nội dung |
|---|---|
| `BR-ENG-07` `BR-FBK-01` `BR-FBK-02` | Sai có phản hồi, ❌ không trừng phạt — và im lặng cũng là defect |
| `BR-ENG-05` `BR-A11-04` | Sàn chạm theo band tuổi |
| `BR-ENG-11` | ❌ Không đếm ngược, ❌ không điểm lúc chơi, ❌ không nút thoát tap trúng được |
| `BR-PGT-01` | Nút thoát ❌ không tap trúng được |
| `BR-DSC-06` `BR-DSC-07` | ❌ Không `dark:`, ❌ không đỏ trên bề mặt trẻ |
| `BR-HPL-02` `BR-LAD-08` | ❌ Không cắt phiên đang chạy |

**Vận hành**

| Rule | Nội dung |
|---|---|
| `BR-AUD-01` `BR-AUD-02` | Audit INSERT-only, ghi trong cùng transaction |
| `BR-BAK-01` `BR-BAK-06` | Verify restore hàng tuần; ❌ không go-live khi chưa verify lần nào |
| `BR-HLT-01` | Health check ❌ không trả 200 cứng |
| `BR-MON-01` `BR-MON-03` | Alert tới người; ❌ không tắt alert để giảm ồn |

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
| 1 | Có tự sinh registry này từ corpus không, thay vì duy trì tay? `gen:spec-index` làm được | `ai-codegen-pipeline` | 🟡 tooling | hoãn — lint-specs.ts (T3) là bước đầu |
