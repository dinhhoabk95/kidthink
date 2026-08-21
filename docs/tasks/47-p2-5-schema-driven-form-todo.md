# Checklist — Task #47: P2.5 — Form sinh từ schema

> Kế hoạch: [`47-p2-5-schema-driven-form-plan.md`](47-p2-5-schema-driven-form-plan.md).
> Ca nghiệm thu chính của cả bước: **thêm field vào Zod là form tự có field đó, không sửa dòng
> code UI nào**. Phần lớn việc còn lại là **cổng** — cơ chế chống lệch không có cổng canh thì
> chính nó là chỗ lệch tiếp theo.
>
> ```
> export PATH=/Users/macbook/.nvm/versions/node/v24.15.0/bin:$PATH
> ```

## Preflight

- [x] **P1.2 đã đóng** — 6 `content_contract` Zod tồn tại, engine đọc chính chúng.
- [x] **P2.1 đã đóng** — layout `manager`.
- [x] `EMOJI-REGISTRY` của P0.9 dùng được (điều kiện của `D-JV`).
- [x] Human approve kế hoạch và năm quyết định D-JR · D-JS · D-JT · D-JU · D-JV.
- [x] **`D-JV` cần chủ xác nhận** vì nó vá [`roadmap.md`](../specs/roadmap.md): dời bộ chọn emoji từ bước 7 sang bước 6.
- [x] Đối chiếu `BR-SDF-*` với [`business-rules.md`](../specs/00-foundation/business-rules.md).
- [x] Tạo nhánh riêng.

---

### Task 1 — `zodIntrospect`

- [x] Duyệt cây Zod, trả `uiHint` cho **mọi** leaf.
- [x] Bảng §7.1 đủ **12** dòng, ưu tiên hậu tố tên trước, kiểu Zod sau.
- [x] `BR-SDF-02`: suy từ tên field; **không** bảng mapping `field → widget` trong mã.
- [x] `D-JR` cổng: hậu tố quy ước không xuất hiện trong `apps/admin`.
- [x] `number` có `min`/`max` → `slider`; không có → **không** rơi vào `slider`.
- [x] `array` và `object` trả hint nhóm kèm cây con.
- [x] Fixture schema chứa **cả 12** ca; mỗi ca có assertion.

### Task 2 — Từ điển nhãn và bốn cổng

- [x] `configDictionary.ts` khai `label` + `help` tiếng Việt cho mọi field của 6 contract.
- [x] `D-JU` cổng nhãn: field thiếu mục từ điển → **đỏ**.
- [x] Ca âm cổng nhãn: xoá một mục → cổng đỏ.
- [x] `D-JT` cổng field-rơi-text: ngoài allowlist → **đỏ**.
- [x] Ca âm: thêm field `basketEmoji` (sai quy ước) → cổng đỏ.
- [x] Allowlist mỗi mục có **ghi lý do**.
- [x] `D-JU` cổng độ sâu: lồng > **3 tầng** → **đỏ**.
- [x] `BR-SDF-01` cổng: không component nào mang tên template cụ thể.
- [x] Ca âm: thêm `Gt004Form.vue` → cổng đỏ.
- [x] Bốn cổng chạy trong `pnpm check`.
- [x] Chế độ dev vẫn cảnh báo lúc chạy cho template đang viết dở.

### Task 3 — Endpoint contract

- [x] `GET /api/managers/templates/{code}/contract` cần `requireManagerAuth()`.
- [x] Cả `super_admin` và `content_reviewer` đọc được.
- [x] Trả `content_contract_json_schema` · `difficulty_contract_json_schema` · `ui_hints` · `labels` · `limits`.
- [x] `D-JR`: `ui_hints` khớp từng field với `zodIntrospect`.
- [x] `code` không tồn tại → **404**.
- [x] Cache theo `code` + version contract; đổi contract là đổi khoá cache.

### Task 4 — Renderer

- [x] Mỗi hint có đúng **một** widget; bảng hint → widget khai một chỗ.
- [x] `BR-SDF-03` ca âm: field `_color` chỉ chọn từ **token**.
- [x] Ca âm: không input hex tự do, không color wheel.
- [x] `pnpm --filter @mindkid/gates test` phủ cả widget màu.
- [x] `D-JV`: hint `emoji` render bộ chọn thật (spec kéo lên P2.6).
- [x] `D-JV`: hint `image` render placeholder **"P2.7"**; hint `audio` render placeholder **"chờ contract Task #80"**.
- [x] `BR-SDF-04` ca âm: không đường nào nhập emoji bằng input text.
- [x] Nhóm §7.3 đúng **thứ tự cố định**: Thông tin · Nội dung · Độ khó · Phân loại · Quyền.
- [x] `BR-SDF-07` ca âm: không input nào dưới **16px**.
- [x] Field chưa có nhãn → tên thô + cảnh báo dev, form **không vỡ**.
- [x] `array` sắp xếp lại được; `object` gấp mở được.
- [x] Lồng tối đa 3 tầng; tầng 2–3 render sub-drawer.
- [x] Bàn phím đi hết form; nhãn gắn đúng input.

### Task 5 — Validate hai đầu

- [x] `D-JS`: `apps/admin` import Zod trực tiếp từ package sở hữu contract.
- [x] Ca âm: **không** dựng lại schema từ JSON Schema.
- [x] `BR-SDF-05` ca âm: thông báo client **khớp từng chữ** với thông báo server.
- [x] `D-BK`: `refine` quan hệ phức tạp báo lỗi ở **server**.
- [x] Server validate lại **mọi** submit, kể cả khi client đã xanh.
- [x] Thông báo lỗi tiếng Việt, gắn đúng field.
- [x] Ca âm: tắt validate client → server vẫn chặn đúng.

## Cổng dừng

- [x] **Ca chính**: thêm field mới vào `content_contract` → field xuất hiện với widget đúng, **không sửa dòng code UI nào**.
- [x] Bốn cổng đều đỏ được khi cố tình vi phạm.
- [x] Sáu template render đủ, không field nào hiện tên kỹ thuật thô.
- [x] Không input nào dưới 16px; không color wheel; không input text cho emoji.
- [x] Thông báo lỗi client và server khớp nhau.
- [x] `pnpm check && pnpm test && pnpm --filter @mindkid/gates test && pnpm --filter @mindkid/gates test && node packages/gates/scripts/check-progress.ts` xanh.

---

## Task 6 — Evidence, promote và vá roadmap

- [x] Mỗi `BR-SDF-*` có test tham chiếu mã rule.
- [x] [`schema-driven-form.md`](../specs/06-admin/schema-driven-form.md) → `implemented`.
- [x] `D-JV`: chuyển [`emoji-picker.md`](../specs/06-admin/emoji-picker.md) sang bước **6** trong [`roadmap.md`](../specs/roadmap.md).
- [x] `D-JV`: cập nhật cùng thay đổi trong [`14-implementation-sequence-todo.md`](14-implementation-sequence-todo.md).
- [x] Ghi rõ lý do và khẳng định **không** cạnh `depends_on` nào bị đảo.
- [x] Nợ sang **P2.6**: lắp bộ chọn emoji thật vào hint `emoji`.
- [x] Nợ sang **P2.7**: lắp widget ảnh, gỡ placeholder ảnh.
- [x] Nợ sang [`Task #80`](80-audio-contract-closure-plan.md): tạo spec owner và implementation task trước khi gỡ placeholder audio.
- [x] Tick **P2.5** ở [`14-implementation-sequence-todo.md`](14-implementation-sequence-todo.md) khi `check:progress` tự xanh.

## Câu hỏi mở chuyển tiếp

- [x] **Zod → JSON Schema mất `refine`** — đóng bằng `D-JS` + `D-BK`: client import Zod thật; `refine` quan hệ phức tạp để server làm trọng tài.
- [x] **Field lồng sâu render thế nào** — đóng bằng `D-JU`: trần **3 tầng** là cổng; tầng 2–3 dùng sub-drawer.
- [x] **Mâu thuẫn trong [`roadmap.md`](../specs/roadmap.md)** — sơ đồ P2 vẽ ảnh và emoji **trước** studio, bảng thứ tự đặt chúng **sau**. `D-JV` sửa một nửa (emoji). Nửa còn lại (ảnh) giữ ở P2.7 và studio dùng placeholder — xác nhận với chủ.
