# Kế hoạch Task #288: Chuẩn hoá corpus spec (Spec Corpus Normalization)

Contract: [`docs/specs/CONVENTIONS.md`](../specs/CONVENTIONS.md) (mục 2 cấu trúc thư mục, mục 3 metadata, mục 3.1 khối "Chưa hoàn thành"),
[`docs/specs/00-foundation/business-rules.md`](../specs/00-foundation/business-rules.md) (`BR-REG2-01`, `BR-REG2-02`).

Task tài liệu — làm xong trong một đợt, ngày 2026-10-18. Không đổi hành vi sản phẩm; chỉ đổi
spec cho khớp code hoặc đánh dấu chỗ code chưa khớp, và mở task cho phần còn thiếu.

---

## 1. Bối cảnh & Mục tiêu

- Corpus `docs/specs/` còn chữ "v1/v2", "corpus v1", "dự án cũ", "port từ v1" — trong khi chỉ còn
  **một** dự án. Người đọc mới phải đoán "v1" là gì.
- Năm file nằm sai thư mục; sáu spec "lô" là kế hoạch một lần mang luật bền lẫn tiến độ đợt việc.
- Nhiều spec ghi `status: implemented` trong khi code chưa đủ; ngược lại có spec ghi `draft`
  trong khi code đã khớp. Không có cách ghi "spec đã chốt, code còn thiếu, việc nằm ở task nào".
- `index.md`, `business-rules.md`, `SPEC.md` đếm sai (spec, package, prefix, kỹ năng).

Mục tiêu: mỗi spec nói contract hiện hành, status phản ánh code thật, khoảng cách tới code có
số task, và các bảng đếm khớp số đo bằng script.

---

## 2. Quy ước mới (ghi vào CONVENTIONS.md)

| Quy ước | Chỗ |
|---|---|
| Khoá tuỳ chọn `open_tasks: ["#nnn"]`; có khoá thì `status` khác `implemented` | CONVENTIONS mục 3, TEMPLATE.md |
| Khối `> **Chưa hoàn thành** — …` ngay dưới tiêu đề, link tới plan của task | CONVENTIONS mục 3.1 |
| `status: published` chỉ cho phiếu engine | CONVENTIONS mục 3 |
| Không spec "lô"/kế hoạch một lần — kế hoạch nằm ở `docs/tasks/` | CONVENTIONS mục 2 |
| Mã BR ngưng ghi ở bảng mã ngưng, không tái dùng số | business-rules.md mục 7.2 |

---

## 3. Bốn đợt

### Đợt A — chuyển 5 file sang đúng thư mục (`git mv`, viết lại link tương đối)

| Từ | Sang |
|---|---|
| `01-platform/content-tagging.md` | `05-content/` |
| `01-platform/data-model-overview.md` | `00-foundation/` |
| `01-platform/offline-curriculum-pack.md` | `03-account/` |
| `04-play/lesson-session-runner.md` | `03-account/` |
| `08-quality/legacy-v1-coverage.md` | `08-quality/source-game-type-coverage.md` (id `SOURCE-GAME-TYPE-COVERAGE`) |

### Đợt B — chín nhóm sửa spec theo báo cáo audit G1…G9

| Nhóm | Phạm vi | Việc chính |
|---|---|---|
| B1 | `00-foundation/` (trừ registry) | Bỏ chữ v1/v2; hạ 5 spec về `approved` + `open_tasks`; ngưng `BR-RBS-01`, `BR-RBS-04` |
| B2 | `01-platform/` phần a | ai-codegen-pipeline về `draft` (#307); 7 spec hạ `approved`; 6 spec nâng `implemented` |
| B3 | `01-platform/` phần b (21 file) | Route SES đổi tên theo code; 3 nâng, 3 hạ (#289, #303, #304) |
| B4 | `01-platform/engines/` (38 phiếu) | Lô `legacy-v1` → `activity-catalog`; khối "Chưa hoàn thành" cho #301, #302 |
| B5 | `02-public/` + `03-account/` | 21 spec hạ `approved`; ngưng `BR-PRC-07` (thay bằng recurring-billing, #292) |
| B6 | `04-play/` | `BR-CIR-21` (tập nói) đổi số thành `BR-CIR-23`; 5 hạ, 1 nâng, play-narration `approved` |
| B7 | `05-content/` | 4 nâng, 5 hạ, 4 `draft` → `approved`; content-theme-registry 16 chủ đề |
| B8 | `06-admin/` (31 spec) | 16 spec hạ `approved` (#297–#300) |
| B9 | `07-addon/` + `08-quality/` | 10 hạ, 2 nâng; đánh số mới `BR-LVC-06` |

### Đợt C — gộp luật của 6 spec lô rồi xoá

Sáu file `01-platform/{legacy-v1-template-batch,taxonomy-gap-batch,montessori-template-batch}.md`,
`05-content/{template-coverage-level-batch,montessori-game-level-batch,montessori-lesson-batch}.md`
bị `git rm`. Luật bền chuyển vào `engine-spec-sheet`, `game-template-contract`,
`thinking-coverage-matrix`, `source-game-type-coverage`, `montessori-corpus-mapping`,
`engine-content-depth`, phiếu `GT-026`/`GT-027`. Không mã nào đổi số. Ngưng: `BR-LVB-03`,
`BR-LVB-14`, `BR-TGB-01`, `BR-TCL-01`, `BR-TCL-03`, `BR-TCL-05`, `BR-TCL-06`.

### Đợt D — tệp gốc, registry, bảng đếm

- `git rm docs/specs/AUDIT-v1.md`, gỡ mọi link tới nó.
- Viết lại `SPEC.md`, `index.md`, `CONVENTIONS.md`, `TEMPLATE.md`, `READING-GUIDE.md`,
  `roadmap.md`, `business-rules.md`: bỏ chữ v1/v2, số đếm đo bằng script (194 spec, 145 MVP,
  87 còn mở; 3 app + 20 package; 240 prefix, 2107 rule), cột "Task mở" trong `index.md`.
- Sửa mã BR trích sai trong comment/tên test: `BR-CIR-21` → `BR-CIR-23` (GT-000),
  `BR-LVB-01` → `BR-LGK-08` (`corpus-truth.test.ts`), `BR-LVB-08` → `BR-LVB-06` và
  `BR-LVB-15` → `BR-LVB-07` (`legacy-v1-template-batch.test.ts`).

---

## 4. Task được tạo

| # | slug | Phạm vi |
|---|---|---|
| [#289](289-transactional-email-dispatch-plan.md) | transactional-email-dispatch | Enqueue `email:send`, payload `url`, không lưu raw token; route SES |
| [#290](290-account-ui-missing-pages-plan.md) | account-ui-missing-pages | Trang xác thực, quên/đặt lại mật khẩu, hồ sơ trẻ, đơn hàng; stub tài khoản |
| [#291](291-public-account-small-gaps-plan.md) | public-account-small-gaps | basic-report, SEO noindex/hreflang, FAQ, subscription-view |
| [#292](292-recurring-billing-plan.md) | recurring-billing | Gia hạn tự động; bỏ `BR-PRC-07` khỏi code |
| [#293](293-healthy-play-limits-enforcement-plan.md) | healthy-play-limits-enforcement | Quota 402, rollup, `paused_ms` |
| [#294](294-play-surface-gaps-plan.md) | play-surface-gaps | Huy hiệu, sảnh, rate limit ingest, explorer, parent gate |
| [#295](295-concept-intro-segments-plan.md) | concept-intro-segments | Phân đoạn GT-000, ma trận cổng, `max(6)` |
| [#296](296-play-narration-debt-plan.md) | play-narration-debt | Câu dẫn có tiếng, tên đọc của vật |
| [#297](297-admin-payment-queue-plan.md) | admin-payment-queue | Trang `/payments` của admin |
| [#298](298-admin-content-review-fixes-plan.md) | admin-content-review-fixes | Bulk-reject, review page, live preview |
| [#299](299-admin-ops-truthfulness-plan.md) | admin-ops-truthfulness | System status, data export, notification template, legal force |
| [#300](300-admin-small-gaps-plan.md) | admin-small-gaps | Emoji paste, asset usage, huỷ gói, audit link |
| [#301](301-engine-hint-ladder-plan.md) | engine-hint-ladder | Gợi ý N5 L1/L2/L3 theo engine |
| [#302](302-engine-input-gaps-plan.md) | engine-input-gaps | GT-001/013/029/032/033/035/036/037 |
| [#303](303-offline-play-buffer-plan.md) | offline-play-buffer | `OfflineEventBuffer` IndexedDB; dọn gói khi logout |
| [#304](304-platform-ops-gaps-plan.md) | platform-ops-gaps | Health check, deploy, supervision, cổng backup go-live |
| [#305](305-platform-api-gaps-plan.md) | platform-api-gaps | Sessions Manager, audit action, tags, checkout, layout, `updated_at` |
| [#306](306-audio-storage-plan.md) | audio-storage | Route + bảng audio |
| [#307](307-ai-codegen-pipeline-plan.md) | ai-codegen-pipeline | Pipeline `gen:*` |
| [#308](308-foundation-gaps-plan.md) | foundation-gaps | Guest 6 level, `$fetch` trần, trigger lifecycle, `content_version` |
| [#309](309-content-model-gaps-plan.md) | content-model-gaps | Test giả game-level-model, cổng allocation, flow route |
| [#310](310-quality-gates-gaps-plan.md) | quality-gates-gaps | Thinking coverage, go-live, Playwright/axe/k6, type-safety |
| [#311](311-addon-provider-gaps-plan.md) | addon-provider-gaps | Provider AI, embed, PDF font |
| [#312](312-legacy-ref-identifier-rename-plan.md) | legacy-ref-identifier-rename | Đổi định danh code còn chữ v1 (codemod + migration) |

Cùng #288 là 25 task. Mỗi spec còn thiếu trỏ đúng số ở trên qua `open_tasks`.

---

## 5. Cần người quyết (không tự chốt trong đợt này)

1. `repo-bootstrap.md` §11 Q12 (`D-CL`) ghi `main` cấm push thẳng, bắt buộc PR — `CLAUDE.md` ghi
   commit thẳng vào `main`. Một trong hai phải đổi.
2. `BR-CCE-02` (explorer loại trò chơi ngoài `age_band`) với `BR-CLF-07` / `access-gating.md`
   (tuổi chỉ để xếp, không chặn).
3. `BR-RBS-02` giữ (test `foundation-contracts.test.ts` còn trích đúng nghĩa) hay ngưng như đề xuất ban đầu.
4. `BR-GLR-04` khai phạm vi go-live "27 engine" trong khi registry có 38 khuôn.
5. Webhook SES trả 401 `WEBHOOK_SIGNATURE_INVALID` theo code; muốn 400 thì thành gap của #289.
6. `child-lesson-flow`, `sticker-album` ở `approved` mà không có `open_tasks`; `round-set-corpus-depth`
   ở `draft` không có task — nâng `implemented` hay mở task.
7. `business-rules.md` §11 Q2: giữ `implemented` khi 4 rule `BR-REG2-*` không còn cổng nào đo.

---

## 6. Nghiệm thu

- `rtk proxy rg -n -i '\bv[12]\b|tinimath|corpus v1|legacy v1' docs/specs docs/SPEC.md` chỉ còn định danh code.
- Script kiểm link tương đối toàn `docs/specs` + `docs/SPEC.md`: không link gãy do đợt này.
- Cổng engine, error-codes, intro-coverage, value-inventory, config-ownership, `quality-rules` +
  `foundation-contracts`, `@mindkid/errors`, game-engine `tests/gates` + GT-000, `pnpm lint`:
  không đỏ mới so với trước đợt.
