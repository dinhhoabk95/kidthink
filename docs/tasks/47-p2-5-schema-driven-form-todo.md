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

- [ ] **P1.2 đã đóng** — 6 `content_contract` Zod tồn tại, engine đọc chính chúng.
- [ ] **P2.1 đã đóng** — layout `manager`.
- [ ] `EMOJI-REGISTRY` của P0.9 dùng được (điều kiện của `D-JV`).
- [ ] Human approve kế hoạch và năm quyết định D-JR · D-JS · D-JT · D-JU · D-JV.
- [ ] **`D-JV` cần chủ xác nhận** vì nó vá [`roadmap.md`](../specs/roadmap.md): dời bộ chọn emoji từ bước 7 sang bước 6.
- [ ] Đối chiếu `BR-SDF-*` với [`business-rules.md`](../specs/00-foundation/business-rules.md).
- [ ] Tạo nhánh riêng.

---

### Task 1 — `zodIntrospect`

- [ ] Duyệt cây Zod, trả `uiHint` cho **mọi** leaf.
- [ ] Bảng §7.1 đủ **12** dòng, ưu tiên hậu tố tên trước, kiểu Zod sau.
- [ ] `BR-SDF-02`: suy từ tên field; **không** bảng mapping `field → widget` trong mã.
- [ ] `D-JR` cổng: hậu tố quy ước không xuất hiện trong `apps/admin`.
- [ ] `number` có `min`/`max` → `slider`; không có → **không** rơi vào `slider`.
- [ ] `array` và `object` trả hint nhóm kèm cây con.
- [ ] Fixture schema chứa **cả 12** ca; mỗi ca có assertion.

### Task 2 — Từ điển nhãn và bốn cổng

- [ ] `configDictionary.ts` khai `label` + `help` tiếng Việt cho mọi field của 6 contract.
- [ ] `D-JU` cổng nhãn: field thiếu mục từ điển → **đỏ**.
- [ ] Ca âm cổng nhãn: xoá một mục → cổng đỏ.
- [ ] `D-JT` cổng field-rơi-text: ngoài allowlist → **đỏ**.
- [ ] Ca âm: thêm field `basketEmoji` (sai quy ước) → cổng đỏ.
- [ ] Allowlist mỗi mục có **ghi lý do**.
- [ ] `D-JU` cổng độ sâu: lồng > **3 tầng** → **đỏ**.
- [ ] `BR-SDF-01` cổng: không component nào mang tên template cụ thể.
- [ ] Ca âm: thêm `Gt004Form.vue` → cổng đỏ.
- [ ] Bốn cổng chạy trong `pnpm check`.
- [ ] Chế độ dev vẫn cảnh báo lúc chạy cho template đang viết dở.

### Task 3 — Endpoint contract

- [ ] `GET /api/managers/templates/{code}/contract` cần `requireManagerAuth()`.
- [ ] Cả `super_admin` và `content_reviewer` đọc được.
- [ ] Trả `content_contract_json_schema` · `difficulty_contract_json_schema` · `ui_hints` · `labels` · `limits`.
- [ ] `D-JR`: `ui_hints` khớp từng field với `zodIntrospect`.
- [ ] `code` không tồn tại → **404**.
- [ ] Cache theo `code` + version contract; đổi contract là đổi khoá cache.

### Task 4 — Renderer

- [ ] Mỗi hint có đúng **một** widget; bảng hint → widget khai một chỗ.
- [ ] `BR-SDF-03` ca âm: field `_color` chỉ chọn từ **token**.
- [ ] Ca âm: không input hex tự do, không color wheel.
- [ ] `pnpm lint:tokens` phủ cả widget màu.
- [ ] `D-JV`: hint `emoji` render bộ chọn thật (spec kéo lên P2.6).
- [ ] `D-JV`: hint `image` và `audio` render **placeholder có nhãn "P2.7"**.
- [ ] `BR-SDF-04` ca âm: không đường nào nhập emoji bằng input text.
- [ ] Nhóm §7.3 đúng **thứ tự cố định**: Thông tin · Nội dung · Độ khó · Phân loại · Quyền.
- [ ] `BR-SDF-07` ca âm: không input nào dưới **16px**.
- [ ] Field chưa có nhãn → tên thô + cảnh báo dev, form **không vỡ**.
- [ ] `array` sắp xếp lại được; `object` gấp mở được.
- [ ] Lồng tối đa 3 tầng; tầng 2–3 render sub-drawer.
- [ ] Bàn phím đi hết form; nhãn gắn đúng input.

### Task 5 — Validate hai đầu

- [ ] `D-JS`: `apps/admin` import Zod trực tiếp từ package sở hữu contract.
- [ ] Ca âm: **không** dựng lại schema từ JSON Schema.
- [ ] `BR-SDF-05` ca âm: thông báo client **khớp từng chữ** với thông báo server.
- [ ] `D-BK`: `refine` quan hệ phức tạp báo lỗi ở **server**.
- [ ] Server validate lại **mọi** submit, kể cả khi client đã xanh.
- [ ] Thông báo lỗi tiếng Việt, gắn đúng field.
- [ ] Ca âm: tắt validate client → server vẫn chặn đúng.

## Cổng dừng

- [ ] **Ca chính**: thêm field mới vào `content_contract` → field xuất hiện với widget đúng, **không sửa dòng code UI nào**.
- [ ] Bốn cổng đều đỏ được khi cố tình vi phạm.
- [ ] Sáu template render đủ, không field nào hiện tên kỹ thuật thô.
- [ ] Không input nào dưới 16px; không color wheel; không input text cho emoji.
- [ ] Thông báo lỗi client và server khớp nhau.
- [ ] `pnpm check && pnpm test && pnpm lint:tokens && pnpm lint:specs && pnpm check:progress` xanh.

---

## Task 6 — Evidence, promote và vá roadmap

- [ ] Mỗi `BR-SDF-*` có test tham chiếu mã rule.
- [ ] [`schema-driven-form.md`](../specs/06-admin/schema-driven-form.md) → `implemented`.
- [ ] `D-JV`: chuyển [`emoji-picker.md`](../specs/06-admin/emoji-picker.md) sang bước **6** trong [`roadmap.md`](../specs/roadmap.md).
- [ ] `D-JV`: cập nhật cùng thay đổi trong [`14-implementation-sequence-todo.md`](14-implementation-sequence-todo.md).
- [ ] Ghi rõ lý do và khẳng định **không** cạnh `depends_on` nào bị đảo.
- [ ] Nợ sang **P2.6**: lắp bộ chọn emoji thật vào hint `emoji`.
- [ ] Nợ sang **P2.7**: lắp widget ảnh và audio, gỡ placeholder.
- [ ] Tick **P2.5** ở [`14-implementation-sequence-todo.md`](14-implementation-sequence-todo.md) khi `check:progress` tự xanh.

## Câu hỏi mở chuyển tiếp

- [ ] **Zod → JSON Schema mất `refine`** — đóng bằng `D-JS` + `D-BK`: client import Zod thật; `refine` quan hệ phức tạp để server làm trọng tài.
- [ ] **Field lồng sâu render thế nào** — đóng bằng `D-JU`: trần **3 tầng** là cổng; tầng 2–3 dùng sub-drawer.
- [ ] **Mâu thuẫn trong [`roadmap.md`](../specs/roadmap.md)** — sơ đồ P2 vẽ ảnh và emoji **trước** studio, bảng thứ tự đặt chúng **sau**. `D-JV` sửa một nửa (emoji). Nửa còn lại (ảnh) giữ ở P2.7 và studio dùng placeholder — xác nhận với chủ.
