# Task #288 Todo: Chuẩn hoá corpus spec (Spec Corpus Normalization)

Plan: [`288-spec-corpus-normalization-plan.md`](288-spec-corpus-normalization-plan.md).
Spec: [`CONVENTIONS.md`](../specs/CONVENTIONS.md) mục 2, 3, 3.1; [`business-rules.md`](../specs/00-foundation/business-rules.md) `BR-REG2-01`, `BR-REG2-02`.

---

## A — Chuyển thư mục
- [x] `git mv` 5 file (content-tagging, data-model-overview, offline-curriculum-pack, lesson-session-runner, legacy-v1-coverage → source-game-type-coverage)
- [x] Viết lại link tương đối, sửa `area:` trong frontmatter

## B — Chín nhóm sửa spec
- [x] B1 `00-foundation/`
- [x] B2 `01-platform/` phần a
- [x] B3 `01-platform/` phần b
- [x] B4 phiếu engine
- [x] B5 `02-public/` + `03-account/`
- [x] B6 `04-play/`
- [x] B7 `05-content/`
- [x] B8 `06-admin/`
- [x] B9 `07-addon/` + `08-quality/`

## C — Gộp 6 spec lô
- [x] Chuyển luật bền vào spec đích, giữ mọi mã
- [x] `git rm` 6 file lô, sửa code comment/đường dẫn spec trong cổng montessori
- [x] `engines/index.md` sinh lại

## D — Tệp gốc và registry
- [x] `git rm docs/specs/AUDIT-v1.md`, gỡ link
- [x] `SPEC.md`: bỏ chữ v1/v2, D8/D9 viết lại, cột "Sau MVP", số spec/package, khuôn 11 section, quy tắc ID theo `id-conventions.md`
- [x] `index.md`: bảng "Tổng" đếm bằng script, bảng khu vực theo thư mục thật, cột "Task mở"
- [x] `CONVENTIONS.md` + `TEMPLATE.md`: `open_tasks`, khối "Chưa hoàn thành", `published`, luật không spec lô, gỡ nhắc cổng đã gỡ
- [x] `business-rules.md`: prefix theo chủ mới, prefix chia nhiều spec, bảng mã ngưng/mã mới, thống kê
- [x] `READING-GUIDE.md`, `roadmap.md`: số liệu và link
- [x] Sửa mã BR trích sai trong comment/tên test (GT-000, corpus-truth, legacy-v1-template-batch)
- [x] Tạo 24 phiếu task #289–#312

## Cần người quyết
- [x] `D-CL` (PR bắt buộc) với `CLAUDE.md` (commit thẳng `main`) — `CLAUDE.md` thắng
- [x] `BR-CCE-02` với `BR-CLF-07` — xếp hạng, không lọc (Task #294)
- [ ] `BR-RBS-02` giữ hay ngưng
- [ ] `BR-GLR-04` "27 engine" với 38 khuôn
- [ ] Mã lỗi webhook SES 401 hay 400
- [ ] Status của `child-lesson-flow`, `sticker-album`, `round-set-corpus-depth`
- [ ] `business-rules.md` §11 Q2 — status khi `BR-REG2-*` không có cổng

## Nghiệm thu
- [x] Grep v1/v2 chỉ còn định danh code
- [x] Kiểm link tương đối toàn corpus
- [x] Chạy lại cổng, so với số đỏ trước đợt
