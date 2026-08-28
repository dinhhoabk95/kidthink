# Checklist — Task #120: Phiếu engine thành spec đầy đủ

> Kế hoạch: [`120-engine-spec-contract-plan.md`](120-engine-spec-contract-plan.md).
> Chặn toàn bộ 27 task engine `#130`–`#156`. Khuôn phải chốt trước khi `#130` viết spec.
> Tuyệt đối: không viết nội dung cho 27 spec ở đây, không dựng cổng ở `packages/gates`, không
> lật `status` của spec engine nào, không sửa tay `index.md`.
>
> `export PATH=/Users/macbook/.nvm/versions/node/v24.15.0/bin:$PATH`

## Preflight

- [x] Đếm 27 file ở `docs/specs/01-platform/engines/`; ghi độ dài từng file.
- [x] Khẳng định 0 / 27 có `BR-*` riêng, 0 / 27 có Gherkin, 0 / 27 có `owns`.
- [x] Đọc [`CONVENTIONS.md`](../specs/CONVENTIONS.md) mục 3 và mục 4 — khuôn spec chuẩn.
- [x] Đọc mục 4 của [`116-engine-vertical-slices-plan.md`](116-engine-vertical-slices-plan.md) — khuôn spec engine.
- [x] `Q120-2` — chốt `phase` cho spec engine (P1 cho MVP, P4 cho 3 lô còn lại).
- [x] `Q120-1` — cổng so nguồn dòng và kiểm tra giá trị limits trích.
- [x] `Q120-3` — 27 spec engine giữ độc lập dưới `engines/`.
- [x] Chụp danh sách `trạng-thái | tên-test` trước khi sửa.

## WP120.1 — Chốt khuôn trong `engine-spec-sheet.md`

**Cỡ:** M

- [x] Mục 7 đổi sang "hình dạng spec engine", 16 mục.
- [x] `BR-ESS-11` — spec đủ khuôn `CONVENTIONS.md`, có `owns` và `depends_on`.
- [x] `BR-ESS-12` — mục 6 có ≥1 `BR-E<nnn>-*`, cấm trùng rule spec lô.
- [x] `BR-ESS-13` — mỗi `BR-E<nnn>-*` có ≥1 scenario Gherkin.
- [x] `BR-ESS-14` — `owns` cấm chồng với spec lô hoặc `game-template-contract`.
- [x] Giữ nguyên `BR-ESS-01` … `-10`, chỉ đổi đối tượng từ phiếu sang spec.
- [x] Đánh số `BR-E001-*` … `BR-E027-*`, mã bất biến.
- [x] Đăng ký tiền tố `BR-E<nnn>-` vào [`business-rules.md`](../specs/00-foundation/business-rules.md).
- [x] Ghi bảng ánh xạ 11 mục phiếu → 16 mục spec vào `engine-spec-sheet.md`.

## WP120.2 — Khuôn mẫu và bộ sinh khung

**Cỡ:** S

- [x] `docs/specs/01-platform/engines/TEMPLATE.md` — khuôn rỗng 16 mục.
- [x] `scripts/create-template.ts` sinh khung spec theo khuôn (`BR-ESS-07`).
- [x] Khung điền sẵn mục 15 (trường trích) và mục 16 (sáu số đo).
- [x] Mọi mục còn lại để trống kèm dòng nhắc.
- [x] Ca kiểm: tạo engine thử, khung sinh ra đúng 16 mục; dọn sau khi ghi bằng chứng.

## WP120.3 — `check:engine-specs`

**Cỡ:** M

- [x] Ca âm: xoá một spec engine.
- [x] Ca âm: đổi một giá trị `limits` ở mục 15 cho khác registry.
- [x] Ca âm: spec thiếu `owns`.
- [x] Ca âm: mục 6 rỗng.
- [x] Ca âm: một `BR-E<nnn>-*` không có scenario.
- [x] Ca âm: ô ma trận ghi chữ "đa dạng".
- [x] Ca âm: `owns` khai lại thứ `game-template-contract` đã sở hữu.
- [x] Ca âm: trỏ vào thư mục rỗng.
- [x] Fixture và ca kiểm ở `packages/game-engine/tests/gates/engine-specs.test.ts`.
- [x] Cổng `check:engine-specs` trong `package.json`.
- [x] Mười hai phép kiểm của bảng WP120.3 trong plan.
- [x] `packages/game-engine/config/engine-spec-ready.json` — bậc thang, khởi đầu **rỗng**.
- [x] Nguồn không đọc được → đỏ. Ca kiểm: trỏ vào thư mục rỗng.
- [x] Gốc repo từ `repoPath()`, không `process.cwd()`.
- [x] Cổng ở `packages/game-engine/tests/gates/`, **không** ở `packages/gates`.
- [x] Nối vào `pnpm test`.
- [x] Tám ca âm chuyển sang đỏ vì đúng lý do.

## WP120.4 — Đóng spec

**Cỡ:** S

- [x] `engine-spec-sheet.md` đổi `status: draft` → `implemented`, ghi ngày 2026-08-29.
- [x] 27 spec engine giữ `draft` — lật ở task của mình.

## Nghiệm thu

- [x] `engine-spec-sheet.md` mô tả khuôn 16 mục, có `BR-ESS-11` … `-14`.
- [x] `engines/TEMPLATE.md` tồn tại, 16 mục.
- [x] `create-template.ts` sinh khung spec, điền sẵn mục 15 và 16.
- [x] `check:engine-specs` chạy, bậc thang khởi đầu rỗng.
- [x] Tám ca âm đều đỏ vì đúng lý do.
- [x] Tiền tố `BR-E<nnn>-` đã đăng ký ở `business-rules.md`.
- [x] Bảng ánh xạ 11 → 16 mục có trong `engine-spec-sheet.md`.
- [x] `engine-spec-sheet.md` `implemented`; 27 spec engine vẫn `draft`.
- [x] `pnpm lint` · `pnpm typecheck` · `pnpm test` xanh.
- [ ] Mở PR cho người review diff, không tự merge.
