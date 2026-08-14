---
spec: SCHEMA-DRIVEN-FORM
title: Form sinh từ schema
area: admin
status: approved
mvp: true
phase: P2
reviewed: 2026-08-08
owns:
  - Cơ chế suy widget từ Zod
  - Quy ước đặt tên field
depends_on:
  - GAME-TEMPLATE-CONTRACT
---

# Form sinh từ schema

## 1. Objective

**Thêm field vào Zod schema là form tự có field đó.**

Viết form riêng cho từng template là 6 chỗ để lệch hôm nay và 30 chỗ khi thư viện template
lớn lên. Form sinh từ schema giữ studio và engine không bao giờ nói hai điều khác nhau.

**D-CC** (T15, 2026-08-09): bỏ `depends_on: EMOJI-PICKER, IMAGE-UPLOAD` — cạnh ngược (bước 5
trước bước 7 ở [`roadmap.md`](../roadmap.md)) và không thứ nào trong hai spec đó được nhắc ở
đâu trong thân file này; cơ chế suy widget ở đây là generic (Zod type → widget), không cần
biết trước hai widget cụ thể tồn tại. Widget emoji/ảnh được lắp khi
[`game-level-studio.md`](game-level-studio.md) build field thật cần chúng — theo đúng sơ đồ
P2 ở [`roadmap.md`](../roadmap.md) (`image-upload · emoji-picker ──→ game-level-studio`,
không phải `──→ schema-driven-form`).

## 2. Actors

| Actor | Vai trò |
|---|---|
| Dev | Khai báo Zod schema + `uiHint` qua quy ước đặt tên |
| Manager | Điền form, không biết schema tồn tại |

## 3. Entry points

`packages/admin/utils/zodIntrospect.ts` · `configDictionary.ts` (nhãn tiếng Việt) ·
`GET /api/managers/templates/{code}/contract`.

## 4. Main flow

1. Nạp `content_contract` và `difficulty_contract` của template.
2. Duyệt cây Zod, với mỗi field suy `uiHint` theo §7.1.
3. Tra `configDictionary` lấy nhãn tiếng Việt và mô tả.
4. Render widget tương ứng, nhóm theo §7.3.
5. Validate client bằng chính schema đó; server validate lại.

## 5. Alternative flows

| Nhánh | Hành vi |
|---|---|
| Field rơi vào `<UInput>` text ngoài ý muốn | **Lỗi đặt tên field** — sửa tên, không thêm mapping đặc biệt |
| Field không có nhãn trong dictionary | Hiện tên field thô + cảnh báo dev ở chế độ dev |
| Schema có `refine` quan hệ | Client kiểm được thì kiểm; không kiểm được thì để server báo |
| Field lồng sâu > 3 tầng | Cảnh báo — schema quá phức tạp cho form sinh |

## 6. Business rules

| ID | Rule | Vì sao |
|---|---|---|
| `BR-SDF-01` | Cấm — **NEVER viết form riêng cho một template** | N template × form viết tay = N chỗ để lệch |
| `BR-SDF-02` | `uiHint` suy từ **tên field theo quy ước**, không từ bảng mapping | Quy ước đặt tên rẻ hơn một bảng mapping phải bảo trì. Đánh đổi có ý thức |
| `BR-SDF-03` | Field màu chọn từ **token**, Cấm — **NEVER color wheel tự do** | Màu ngoài hệ thống phá design system và có thể không đạt contrast |
| `BR-SDF-04` | Field emoji dùng **picker**, không input text | `BR-EMJ-01` |
| `BR-SDF-05` | Validate client dùng **cùng schema** với server | Hai bộ luật là hai kết quả |
| `BR-SDF-06` | Nhãn tiếng Việt bắt buộc cho mọi field hiện ra | Manager nghĩ bằng tiếng Việt |
| `BR-SDF-07` | Input giữ `font-size ≥ 16px` | Dưới đó iOS tự zoom |
| `BR-SDF-08` | Field rơi vào text ngoài ý muốn là **lỗi**, không phải mặc định chấp nhận được | Phát hiện sớm lỗi quên đặt hậu tố quy ước khi bổ sung field mới vào Zod schema |

## 7. Data

### 7.1 Suy `uiHint`

| Điều kiện tên field | `uiHint` | Widget |
|---|---|---|
| kết thúc `_emoji` hoặc bằng `emoji` | `emoji` | Emoji picker |
| kết thúc `_image` hoặc `_path` | `image` | Image field có crop |
| kết thúc `_color` | `color` | Swatch từ token |
| kết thúc `_audio` | `audio` | Audio picker/upload |
| kết thúc `_ms` hoặc `_seconds` | `duration` | Slider + số |
| Zod `string` có `.max()` > 200 hoặc không giới hạn | `textarea` | Textarea |
| Zod `enum` | `select` | Select |
| Zod `boolean` | `toggle` | Toggle |
| Zod `number` có `min`/`max` | `slider` | Slider |
| Zod `array` | `array` | Danh sách sắp xếp được |
| Zod `object` | `object` | Nhóm gấp mở được |
| còn lại | `text` | `<UInput>` — **rơi vào đây ngoài ý muốn = lỗi đặt tên** |

### 7.2 `configDictionary`

```ts
{ "prompt": { label: "Câu hỏi cho bé", help: "Ngắn, dưới 12 từ, đọc thành tiếng được" },
  "distractor_count": { label: "Số vật gây nhiễu", help: "0 là dễ nhất" } }
```

### 7.3 Nhóm field

`Thông tin` (title, instruction) · `Nội dung` (`content_pack`) · `Độ khó`
(`difficulty_params`) · `Phân loại` (skill, LO, tag) · `Quyền` (`access_tier`).

Thứ tự cố định — Manager soạn nhiều bản mỗi ngày, thứ tự đổi làm chậm.

## 8. API contract

### `GET /api/managers/templates/{code}/contract`

200 → `{ content_contract_json_schema, difficulty_contract_json_schema, ui_hints, labels, limits }`.

`ui_hints` server tính sẵn — client không tự suy, để hai bên không lệch.

## 9. Acceptance criteria

```gherkin
Scenario: BR-SDF-01 — không có form viết tay
  When quét thư mục component của studio
  Then không component nào tên theo một template cụ thể

Scenario: thêm field vào schema là form tự có
  Given thêm một field mới vào content_contract của GT-004
  When mở studio với template đó
  Then field mới xuất hiện với widget đúng
  And không sửa dòng code UI nào

Scenario: BR-SDF-02 — suy uiHint theo tên
  Given một field tên "basket_emoji"
  Then widget là emoji picker

Scenario: BR-SDF-03 — không có color wheel
  When mở bất kỳ field màu nào
  Then chỉ chọn được từ danh sách token
  And không có input hex tự do

Scenario: BR-SDF-05 — client và server cùng schema
  Given một giá trị vi phạm ràng buộc
  When client validate
  Then thông báo khớp với thông báo server trả về

Scenario: BR-SDF-06 — mọi field có nhãn tiếng Việt
  When render form của cả 6 template
  Then không field nào hiện tên kỹ thuật thô

Scenario: BR-SDF-07 — input đủ lớn
  When đo font-size của mọi input
  Then không input nào dưới 16px

Scenario: BR-SDF-08 — field rơi vào text bị phát hiện
  Given một field tên không theo quy ước
  When chạy kiểm tra schema ở cổng tự động
  Then cảnh báo được phát ra
```

## 10. Boundaries

**Always**
- Suy widget từ tên field theo quy ước.
- Nhãn tiếng Việt cho mọi field.
- Dùng cùng schema ở client và server.

**Ask first**
- Thêm `uiHint` mới.
- Đổi quy ước đặt tên.
- Đổi thứ tự nhóm field.

**Never**
- Form viết tay cho một template.
- Color wheel tự do.
- Input text cho emoji.
- Bảng mapping field→widget thay cho quy ước.

## 11. Open questions

| # | Câu hỏi | Chặn phase | Đề xuất chốt | Chủ |
|---|---|---|---|---|
| 1 | Zod → JSON Schema mất `refine` — client kiểm quan hệ bằng cách nào? | P2 | Chốt `D-BK`: Dùng custom serializer để khai `uiHint` cho `refine` đơn giản ở client, các `refine` quan hệ phức tạp validate tại server; trỏ sang [`game-template-contract.md`](../01-platform/game-template-contract.md) Q4 | người quyết |
| 2 | Field lồng sâu (array of object of array) render thế nào cho dễ dùng? | P2 | Giới hạn độ sâu tối đa 3 tầng và render dạng modal / sub-drawer theo quy định UI | người quyết |
| 3 | §7.1 từng suy `textarea` từ hậu tố `_vi` — hậu tố bị bỏ (D11, hệ thống chỉ còn một ngôn ngữ hiển thị). Ngưỡng `.max() > 200` tạm thay có đúng ranh giới input/textarea thật của mọi field content không? | P2 | Đối chiếu ngưỡng với `varchar` vs `text` thật trong `packages/db/src/schema/*.ts` trước khi implement widget | người quyết |
