# Checklist — Task #161: Bộ sinh level theo ô ma trận

> Kế hoạch: [`161-cell-aware-level-generator-plan.md`](161-cell-aware-level-generator-plan.md).
> Chỉ bắt đầu khi [`Task #158`](158-engine-competency-allocation-todo.md) và
> [`Task #121`](121-level-generator-kit-todo.md) đã merge.
>
> Tuyệt đối: Cấm — NEVER để máy gắn tag ba trục (`BR-LGK-08`). Cấm — NEVER để máy viết câu lệnh
> tiếng Việt (`BR-LGK-10`). Cấm — NEVER sửa `BR-LGK-*` đang có. Cấm — NEVER ghi tệp trước khi
> parse contract. Cấm — NEVER viết lại phép đo ô trống.
>
> `export PATH=/Users/macbook/.nvm/versions/node/v24.15.0/bin:$PATH`

## Preflight

- [x] `check:engine-allocation` của [`#158`](158-engine-competency-allocation-todo.md) chạy được.
- [x] Xác định **tên hàm** đo ô trống mà cổng xuất ra: ................
- [x] Số ô trống hiện tại: ................ (kỳ vọng **137** lượt lấp).
- [x] Đọc `BR-LGK-01` … `BR-LGK-10` ở
      [`level-generator-kit.md`](../specs/01-platform/level-generator-kit.md).
- [x] Xác nhận `GT-013` và `GT-015` vẫn ngoài lô sinh máy (`Q121-2`).
- [x] Chụp danh sách `trạng-thái | tên-test` trước khi sửa.

## WP161.1 — `gen:levels --report`

**Cỡ:** S · chỉ `packages/db/src/seed-content/cli/`

- [x] Gọi **đúng hàm** mà cổng [`#158`](158-engine-competency-allocation-todo.md) gọi.
- [x] Cấm — NEVER sao chép phép đếm sang tệp CLI.
- [x] In theo engine; mỗi dòng có `band` · lĩnh vực đã có · lĩnh vực bản đồ cho phép mà còn thiếu.
- [x] Đánh dấu ô của `GT-013` và `GT-015` là soạn tay (`Q161-2`).
- [x] So sánh: `--report` và `check:engine-allocation` in **cùng** danh sách ô, cùng thứ tự.

## WP161.2 — `gen:levels --cell`

**Cỡ:** M · chỉ `packages/db/src/seed-content/cli/`

- [x] Cú pháp `--cell <engine>/<band>/<lĩnh vực>`, ví dụ `GT-014/4-5/C3`.
- [x] Từ chối lĩnh vực ngoài `allows` của engine (`BR-ECA-03`).
- [x] Từ chối band nằm trong `banned_age_bands`.
- [x] Từ chối ô đã đạt K.
- [x] Khung sinh theo `limits` của engine.
- [x] Khung tôn trọng trần band của [`#159`](159-preschool-age-bands-todo.md).
- [x] **Parse `content_contract` trước khi ghi tệp**; parse trượt thì không ghi gì.
- [x] Sáu trường để **trống**: `title` · `instruction` · `skill_codes` · `what_tags` ·
      `thinking_tags` · `theme_tag`.
- [x] Cấm — NEVER điền giá trị giữ chỗ trông như thật vào sáu trường đó.
- [x] Cùng seed → cùng đầu ra (`BR-LGK-02`).
- [x] Trả lời `Q161-1`: ghi thẳng vào `c{1..6}/` hay ra thư mục nháp.

## WP161.3 — Thêm mục vào spec bộ sinh

**Cỡ:** S · chỉ `docs/specs/01-platform/level-generator-kit.md`

- [x] Thêm mục mô tả chiều sinh theo ô, link tới spec ma trận.
- [x] Rule mới đánh số tiếp `BR-LGK-*`; cấm — NEVER sửa rule đang có.
- [x] Rule mới nói đủ ba điều: từ chối ô ngoài bản đồ · từ chối ô đã đủ · chừa trống sáu trường.
- [x] Mỗi rule mới có ≥1 scenario Gherkin.

## WP161.4 — Test

**Cỡ:** S · chỉ `packages/db/tests/`

- [x] Sinh 5 khung cho 5 ô khác nhau — cả 5 parse `content_contract` sạch.
- [x] Cùng seed → cùng đầu ra, chạy **100** lần.
- [x] `--cell GT-026/4-5/C2` → **từ chối** (bản đồ cấm C2 cho `GT-026`).
- [x] `--cell GT-002/3-4/C1` → **từ chối** (`GT-002` cấm band `3-4`).
- [x] `--cell` vào ô đã đạt K → **từ chối**.
- [x] Test khẳng định sáu trường của người **trống**, không giá trị giữ chỗ.
- [x] Test so `--report` với `check:engine-allocation` — cùng danh sách ô.

## Đóng task

- [x] Bảy điều kiện nghiệm thu ở mục 4 của plan đều đúng.
- [x] `BR-LGK-08` và `BR-LGK-10` không bị sửa một chữ — so diff.
- [x] `pnpm lint` · `pnpm typecheck` · `pnpm test` xanh.
- [x] Danh sách `trạng-thái | tên-test` trùng khít trước/sau, trừ test mới.
