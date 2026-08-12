# Kế hoạch — Task #64: P4.3 — Worksheet một trang, in đen trắng

> Viết 2026-08-11, đo tại commit `484ebaf`.
> Spec sở hữu: [`worksheet-model.md`](../specs/05-content/worksheet-model.md).
> Phụ thuộc: [`63-p4-2-pdf-export-plan.md`](63-p4-2-pdf-export-plan.md), P3.1–P3.2 và P2.8.

## Tóm tắt

Task #64 hoàn thiện worksheet như content có lifecycle: sáu loại đóng, editor Manager, preview
và render A4 một trang, publish gate theo đúng bản render, download có entitlement, và lesson
chứa worksheet phải có hoạt động thay thế không cần in. Không tạo renderer thứ hai; mọi PDF đi
qua contract Task #63.

## 0. Điều kiện vào

- Task #63 `implemented`, renderer đã qua benchmark và quan hệ `WORKSHEET-MODEL` →
  `PDF-EXPORT` đã được sửa canonical.
- P3 activity/lesson authoring có `kind = worksheet`, reference tới worksheet `published` và
  seam checklist thật.
- P2 content lifecycle/versioning/review/storage đều `implemented`.

**Stop condition:** khi PDF hoặc P3 activity chưa merge, chỉ làm preflight/contract; không tạo
preview giả hoặc ghi `pdf_path` thủ công để qua publish checklist.

## 1. Hiện trạng đo được

- `packages/db/src/schema/content.ts` đã có bảng `worksheets` tối thiểu: code/version/title,
  `pdf_path`, `preview_path`, access tier, status. Chưa có objective link, layout template hay
  `content_blocks` của spec.
- `packages/shared/src/publish-checklist.ts` mới chỉ kiểm `pdf_path` không rỗng. Một path cũ,
  file lỗi, PDF nhiều trang hoặc render từ version khác vẫn có thể qua.
- Content lifecycle đã nhận entity type `worksheet`; không cần tạo state machine mới.
- Activity model đã có `kind = worksheet`, nhưng toàn bộ implementation P3 vẫn là kế hoạch tại
  commit đo; T0 phải đọc code merge thật.

## 2. Quyết định contract

**D-P4I — Mở rộng bảng hiện có, không tạo worksheet v2 song song.** Objective dùng quan hệ
canonical theo pattern content/tagging đã merge; `layout_template` là enum sáu giá trị đóng;
`content_blocks` parse bằng Zod theo từng template. Mọi đổi schema được review trước migration.

**D-P4J — Render evidence gắn version/hash.** Publish gate yêu cầu job `done`, một trang A4,
grayscale check xanh và `source_content_version` + input hash khớp draft đang gửi duyệt. Path
không rỗng một mình không còn đủ.

**D-P4K — Kích thước in kiểm bằng đơn vị vật lý.** Renderer/layout test đo vùng viết/vẽ ≥20mm,
stroke ≥2pt, footer người lớn và vùng watermark; CSS pixel/screenshot mắt thường không phải evidence.

**D-P4L — Hoạt động thay thế là invariant lesson.** Khi lesson có activity worksheet, checklist
lesson yêu cầu ít nhất một activity không cần in được gắn tường minh làm alternative. Không tạo
logic thứ hai ở UI; server checklist là nguồn sự thật.

## 3. Đồ thị

```text
T0 đo output thật #63 + P3 activity/lesson
 └── T1 sửa schema/render/alternative contract ── Checkpoint A
      ├── T2 migration + Zod layout contract
      └── T3 renderer adapter + physical validators
           └── T4 studio editor/preview ── Checkpoint B
                ├── T5 review/publish + lesson alternative gate
                └── T6 user download signed URL
                     └── T7 artifact/a11y/security/E2E
                          └── T8 evidence + promote
```

## 4. Task triển khai

### T0 — Preflight

**Tiêu chí nghiệm thu**

- [ ] PDF, lifecycle, activity/lesson model+authoring đều `implemented`; ghi seam thật.
- [ ] Đối chiếu `BR-WSM-*`, `BR-ACM-05`, lifecycle/versioning và §7.3 không-nới.
- [ ] Ghi delta bảng worksheet/checklist hiện tại; không tạo bảng/renderer song song.

**Kiểm chứng:** `pnpm check:progress`; preflight link tới code merge thật.

**Phụ thuộc:** Task #63 + P3.2 · **Files:** task/spec nếu seam đổi · **Cỡ:** S.

### T1 — Khép contract schema và publish evidence

**Tiêu chí nghiệm thu**

- [ ] Owner chốt quan hệ objective, sáu layout + schema block và representation alternative.
- [ ] [`worksheet-model.md`](../specs/05-content/worksheet-model.md), activity/lesson owner và
  publish checklist cùng ghi version/hash/artifact gate.
- [ ] Mọi lỗi layout/render/publish/download dùng mã registry; không tự chế 422.

**Kiểm chứng:** `pnpm lint:specs`; tìm corpus không còn chiều dependency hoặc gate path-only.

**Phụ thuộc:** T0 + human schema review · **Files:** tối đa 4 spec/registry · **Cỡ:** M.

### Checkpoint A — Contract

- [ ] D-P4I…D-P4L được review; schema change được phép.
- [ ] Không migration/editor trước checkpoint.

### T2 — Migration và Zod contract sáu loại

**Tiêu chí nghiệm thu**

- [ ] Mở rộng `worksheets`/relation objective theo contract, giữ identity/version/lifecycle hiện có.
- [ ] Mỗi layout có discriminated schema; loại thứ bảy, block chữ cho trẻ hoặc kích thước sai đỏ trước.
- [ ] DB rỗng/upgrade/rollback xanh, không sửa tay file migration `@generated`.

**Kiểm chứng:** `pnpm db:migrate`; `pnpm test -- worksheet-schema worksheet-contract`.

**Phụ thuộc:** Checkpoint A · **Files:** schema, migration/meta, shared contract/test · **Cỡ:** M từng lát.

### T3 — Renderer adapter và validator vật lý

**Tiêu chí nghiệm thu**

- [ ] Dùng port Task #63, input hash/version và template đã parse; không render trong request.
- [ ] Artifact inspector xác nhận A4 đúng một trang, grayscale phân biệt được, vùng ≥20mm/stroke ≥2pt.
- [ ] Footer người lớn có; watermark chỉ footer và không giao vùng làm bài.

**Kiểm chứng:** `pnpm test -- worksheet-render-contract` + artifact PDF local được inspect.

**Phụ thuộc:** T2 + Task #63 · **Files:** worksheet adapter/layout/inspector tests · **Cỡ:** M.

### T4 — Studio editor và preview

**Tiêu chí nghiệm thu**

- [ ] `/studio/worksheets` CRUD draft/version qua lifecycle chuẩn; UI chọn đúng sáu loại/objective.
- [ ] Preview hiển thị bản render thật, trạng thái queued/failed/stale; lỗi cạnh field bằng tiếng Việt.
- [ ] Manager không thể publish bằng cách sửa path; autosave/version conflict không mất block.

**Kiểm chứng:** `pnpm test:e2e -- worksheet-studio` gồm keyboard và stale render.

**Phụ thuộc:** T2–T3 + admin shell/P2.8 · **Files:** page + 2 component + routes/E2E chia lát · **Cỡ:** M.

### Checkpoint B — Draft tới artifact

- [ ] Sáu loại edit → enqueue → preview đúng version; artifact gate vật lý xanh.
- [ ] Human review schema, renderer và UI trước nối publish.

### T5 — Review/publish và lesson alternative

**Tiêu chí nghiệm thu**

- [ ] Send review/publish chặn artifact fail/stale/multi-page và mọi `BR-WSM-01…08` có thể kiểm máy.
- [ ] Lesson có worksheet nhưng không alternative trả `PUBLISH_CHECKLIST_FAILED`; có alternative thì qua.
- [ ] Published row bất biến; sửa tạo version mới và render mới, không tái dùng artifact cũ.

**Kiểm chứng:** `pnpm test -- worksheet-publish lesson-worksheet-alternative` với test âm trước.

**Phụ thuộc:** T3–T4 + lifecycle P2 · **Files:** checklist/service/hooks/tests · **Cỡ:** M.

### T6 — Download có entitlement

**Tiêu chí nghiệm thu**

- [ ] GET `/api/users/worksheets/{code}/pdf` Zod/auth/entitlement/access-tier ở server.
- [ ] Chỉ artifact của version `published` hiện tại, object private, signed URL ≤60 phút; locked không lộ path.
- [ ] Unknown/draft/other tier/expired link có matrix 404/403 đúng registry và cache `private, no-store`.

**Kiểm chứng:** `pnpm test -- worksheet-download-api`.

**Phụ thuộc:** T5 + Task #63 storage · **Files:** route/service/integration test · **Cỡ:** M.

### T7 — Cổng artifact, a11y và security

**Tiêu chí nghiệm thu**

- [ ] Fixture của cả sáu loại qua black/white, page/measurement/font/footer/watermark checks.
- [ ] Studio/download tablet+a11y xanh; IDOR, path leak, stale artifact và render-fail test âm xanh.
- [ ] Full gate xanh và benchmark PDF không thoái lui khỏi Task #63 budget.

**Kiểm chứng:** `pnpm check`, `pnpm test`, E2E/artifact/load suite.

**Phụ thuộc:** T5–T6 · **Files:** fixtures/tests/evidence · **Cỡ:** M.

### T8 — Evidence và promote

**Tiêu chí nghiệm thu**

- [ ] Mỗi `BR-WSM-01…08` có evidence/test mang mã rule; câu Puppeteer đóng bằng quyết định #63.
- [ ] `WORKSHEET-MODEL` chuyển `implemented`; Task #14 tick đúng spec bằng progress check.
- [ ] Human review artifact thật; không agent publish content hoặc chạy seed ngoài local.

**Kiểm chứng:** full gate + `pnpm check:progress`.

**Phụ thuộc:** T7 · **Files:** spec status, Task #14/evidence · **Cỡ:** S.

## 5. Rủi ro, song song, ngoài phạm vi

- T2/T3 có thể chia contract/schema và renderer sau Checkpoint A; T5/T6 chỉ sau artifact thật.
- Rủi ro: path-only xanh giả, đo CSS thay đơn vị in, artifact cũ đi theo version mới.
- Ngoài phạm vi: nhiều trang, loại worksheet thứ bảy, OCR/chấm bài, ảnh trẻ, watermark vùng làm bài.
