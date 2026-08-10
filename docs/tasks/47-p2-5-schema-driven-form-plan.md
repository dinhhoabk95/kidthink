# Kế hoạch — Task #47: P2.5 — Form sinh từ schema

> Viết 2026-08-10. Bước sở hữu: **P2.5** của
> [`14-implementation-sequence-todo.md`](14-implementation-sequence-todo.md).
> Spec sở hữu: [`schema-driven-form.md`](../specs/06-admin/schema-driven-form.md).
>
> ```
> export PATH=/Users/macbook/.nvm/versions/node/v24.15.0/bin:$PATH
> ```

## Tóm tắt

Một bước, một câu: **thêm field vào Zod schema là form tự có field đó**.

Bước này không giao màn hình nào cho người dùng cuối. Nó giao **cơ chế** mà P2.6 dựng studio
lên trên, và toàn bộ giá trị của nó nằm ở một phép so sánh: 6 template hôm nay, 30 template khi
thư viện lớn lên. Form viết tay là 30 chỗ để studio và engine nói hai điều khác nhau — và chỗ
lệch đầu tiên sẽ được phát hiện bởi một đứa trẻ đang chơi, không phải bởi test.

Vì không có màn hình cho người dùng cuối, phần lớn "tiêu chí nghiệm thu" ở đây là **cổng**.
Một cơ chế chống lệch mà không có cổng canh thì chính nó là chỗ lệch tiếp theo.

## 0. Điều kiện tiên quyết

| Dep | Trạng thái | Ghi chú |
|---|---|---|
| `GAME-TEMPLATE-CONTRACT` | P1.2 | `content_contract` · `difficulty_contract` của 6 template |
| `GAME-ENGINE-RUNTIME` | P1.2 | engine đọc cùng contract — đây là bên kia của phép so |
| `EMOJI-REGISTRY` | P0.9 | điều kiện duy nhất của bộ chọn emoji |
| `DESIGN-SYSTEM-CONTRACT` | P1.1 | token màu; `lint:tokens` đã có sẵn |
| Admin shell | P2.1 | form sống trong layout `manager` |
| `ACCESSIBILITY` | P1.1 | `font-size ≥ 16px` là ràng buộc iOS, không phải sở thích |

## 1. Đo được

### 1.1 Đã có

Sáu `content_contract` và `difficulty_contract` viết bằng Zod từ P1.2; engine đọc chính chúng;
token màu và `pnpm lint:tokens`; shell admin.

### 1.2 Chưa có

`zodIntrospect`; `configDictionary`; endpoint contract; bộ widget; và **bốn cổng** chống lệch:
form viết tay, field rơi vào text, field thiếu nhãn tiếng Việt, schema lồng quá sâu.

### 1.3 Đã chốt, không mở lại

`D-CC` bước này **không** phụ thuộc [`emoji-picker.md`](../specs/06-admin/emoji-picker.md) và
[`image-upload.md`](../specs/06-admin/image-upload.md); cơ chế suy widget là generic ·
`D-BK` `refine` quan hệ validate ở server, `uiHint` khai được cho `refine` đơn giản ·
`BR-EMJ-01` emoji chọn bằng picker, không gõ text · `BR-PKG-07`-style: quy ước rẻ hơn bảng
mapping, và đó là đánh đổi có ý thức (`BR-SDF-02`).

## 2. Quyết định

**D-JR — Server là **nơi duy nhất** suy `uiHint`; client render cái được giao.** §8 nói `ui_hints`
server tính sẵn "để hai bên không lệch". Nếu client cũng có một bản suy — kể cả bản sao chép
đúng từng dòng — thì hai bản sẽ lệch, và lệch ở chỗ khó thấy nhất: một field mới trên một
template mới. Xử: `zodIntrospect` sống ở tầng server; response chứa `ui_hints` đã tính; client
tra bảng widget theo hint chứ **không** đọc tên field. Cổng: xuất hiện chuỗi hậu tố quy ước
(`_emoji` · `_image` · `_color` · `_audio` · `_vi` · `_ms` · `_seconds`) trong mã `apps/admin`
→ **đỏ**.

**D-JS — Client validate bằng **chính Zod**, không round-trip qua JSON Schema.** `BR-SDF-05` đòi
client và server dùng cùng schema; §11 Q1 chỉ ra vấn đề: Zod → JSON Schema **mất `refine`**.
Nhưng cả hai đầu nằm trong cùng monorepo — không có lý do nào bắt client phải đi qua JSON
Schema để lấy lại thứ nó import được trực tiếp. Xử: `apps/admin` import Zod schema của template
từ chính package sở hữu contract; endpoint JSON Schema giữ nguyên cho `ui_hints`, `labels`,
`limits` và cho công cụ ngoài. `D-BK` giữ nguyên: `refine` quan hệ phức tạp là **server làm
trọng tài**, client chỉ báo sớm. Ca âm: một giá trị vi phạm ràng buộc → thông báo client **khớp
từng chữ** với thông báo server trả về.

**D-JT — `BR-SDF-08` là **cổng build trên 6 contract thật**, không phải cảnh báo lúc chạy.**
Spec nói field rơi vào `<UInput>` text ngoài ý muốn là **lỗi đặt tên**. Một lỗi chỉ hiện ra khi
có người mở đúng form đó ở chế độ dev là lỗi sẽ được phát hiện sau khi đã seed nội dung. Xử:
cổng duyệt cả 6 contract; field nào rơi vào nhánh `text` mà tên không kết thúc `_vi` phải nằm
trong một allowlist **có ghi lý do**; ngoài allowlist → **đỏ**. Sửa bằng đổi tên field, **không**
bằng thêm mapping đặc biệt.

**D-JU — Nhãn tiếng Việt và độ sâu schema cũng là **cổng**.** `BR-SDF-06` bắt mọi field hiện ra
phải có nhãn tiếng Việt; §5 chỉ nói cảnh báo dev. Nhưng §9 đòi "render form của cả 6 template →
không field nào hiện tên kỹ thuật thô" — đó là một điều kiện kiểm được lúc build. Xử: cổng
khẳng định mọi field của 6 contract có mục trong `configDictionary`; thiếu → **đỏ**; cảnh báo
lúc chạy vẫn giữ cho template mới đang viết dở. Cùng cổng đó đóng §11 Q2: độ sâu lồng > **3
tầng** → **đỏ**, không phải "cảnh báo" — vượt 3 tầng thì form sinh không còn dùng được và câu
trả lời đúng là sửa schema.

**D-JV — Ba widget cần asset khai đủ hint ở bước này, nhưng **emoji picker kéo lên P2.6**.**
Hint `emoji` · `image` · `audio` phải tồn tại từ bước này vì chúng là một phần của bảng §7.1.
Widget thật thì không: [`image-upload.md`](../specs/06-admin/image-upload.md) cần
[`image-storage.md`](../specs/01-platform/image-storage.md) của **P2.7**. Nhưng
[`emoji-picker.md`](../specs/06-admin/emoji-picker.md) chỉ `depends_on: EMOJI-REGISTRY` — đã
xong từ **P0.9**. Và emoji là **vật liệu chính** của game: một studio không chọn được emoji thì
không soạn được level nào. Xử: dời [`emoji-picker.md`](../specs/06-admin/emoji-picker.md) từ
P2.7 sang **P2.6**, cập nhật [`roadmap.md`](../specs/roadmap.md) và
[`14-implementation-sequence-todo.md`](14-implementation-sequence-todo.md) — không cạnh
`depends_on` nào bị đảo. Hint `image` và `audio` render **placeholder có nhãn bước P2.7**;
`BR-SDF-04` giữ nguyên: **cấm** rơi về input text. Lý do ghi rõ ở đây thay vì P2.6: sơ đồ P2 của
roadmap vẽ `image-upload · emoji-picker ──→ game-level-studio` trong khi bảng thứ tự đặt chúng
**sau** studio; hai chỗ trong cùng một file nói ngược nhau, và bước này là chỗ đầu tiên chạm vào
mâu thuẫn đó.

## 3. Đồ thị

```
T1 zodIntrospect ở server: bảng §7.1 đủ 12 dòng (D-JR)
      ├──→ T2 configDictionary + bốn cổng chống lệch (D-JT, D-JU)
      └──→ T3 GET /api/managers/templates/{code}/contract
                └──→ T4 renderer: widget theo hint · nhóm §7.3 · 16px (D-JV)
                          └──→ T5 validate client bằng Zod chung (D-JS)
                                        ── Cổng dừng ──
                                              T6 evidence, promote, vá roadmap
```

## 4. Task

### Task 1 — `zodIntrospect`

**Tiêu chí nghiệm thu**
- [ ] Duyệt cây Zod, trả `uiHint` cho **mọi** leaf theo bảng §7.1 — đủ **12** dòng, đúng thứ tự ưu tiên (hậu tố tên trước, kiểu Zod sau).
- [ ] `BR-SDF-02`: suy từ **tên field theo quy ước**; không có bảng mapping `field → widget` nào trong mã.
- [ ] `D-JR` cổng: hậu tố quy ước không xuất hiện trong `apps/admin`; suy hint chỉ ở tầng server.
- [ ] Zod `number` có `min`/`max` → `slider`; không có `min`/`max` → không được rơi vào `slider`.
- [ ] `array` và `object` trả hint nhóm, kèm cây con để renderer đệ quy.
- [ ] Bộ test bảng: một fixture schema chứa **cả 12** ca, khẳng định từng hint.

**Kiểm chứng**
- [ ] `pnpm test -- zod-introspect` xanh, 12/12 dòng của §7.1 có assertion.

**Phụ thuộc:** P1.2 · **Cỡ:** M

### Task 2 — Từ điển nhãn và bốn cổng

**Tiêu chí nghiệm thu**
- [ ] `configDictionary.ts` khai `label` + `help` tiếng Việt cho mọi field của **6** contract.
- [ ] `D-JU` cổng nhãn: field của 6 contract thiếu mục trong từ điển → **đỏ**; ca âm — xoá một mục → cổng đỏ.
- [ ] `D-JT` cổng field-rơi-text: field vào nhánh `text` mà tên không kết thúc `_vi` phải có trong allowlist **kèm lý do**; ngoài allowlist → **đỏ**; ca âm — thêm field `basketEmoji` (sai quy ước) → cổng đỏ.
- [ ] `D-JU` cổng độ sâu: lồng > **3 tầng** → **đỏ** (đóng §11 Q2).
- [ ] `BR-SDF-01` cổng: quét thư mục component của studio — **không** component nào mang tên một template cụ thể (`GT-001`…`GT-006`); ca âm — thêm `Gt004Form.vue` → cổng đỏ.
- [ ] Bốn cổng chạy trong `pnpm check`.
- [ ] Chế độ dev vẫn cảnh báo lúc chạy cho template đang viết dở (§5).

**Kiểm chứng**
- [ ] `pnpm test -- form-gates` xanh với 4 ca dương + 4 ca âm.

**Phụ thuộc:** T1 · **Cỡ:** M

### Task 3 — Endpoint contract

**Tiêu chí nghiệm thu**
- [ ] `GET /api/managers/templates/{code}/contract` cần `requireManagerAuth()`; cả `super_admin` và `content_reviewer` đọc được.
- [ ] Trả `content_contract_json_schema` · `difficulty_contract_json_schema` · `ui_hints` · `labels` · `limits`.
- [ ] `D-JR`: `ui_hints` tính ở server, khớp từng field với kết quả `zodIntrospect`.
- [ ] Template `code` không tồn tại → **404**.
- [ ] Response cache được theo `code` + version của contract; đổi contract là đổi khoá cache.

**Kiểm chứng**
- [ ] `pnpm test -- template-contract-api` xanh cho cả 6 template.

**Phụ thuộc:** T1 · **Cỡ:** S

### Task 4 — Renderer

**Tiêu chí nghiệm thu**
- [ ] Mỗi hint có đúng **một** widget; bảng hint → widget khai một chỗ.
- [ ] `BR-SDF-03` ca âm: field `_color` chỉ chọn được từ **token**; không input hex tự do, không color wheel; `pnpm lint:tokens` phủ cả widget này.
- [ ] `D-JV`: hint `emoji` render bộ chọn thật (spec kéo lên P2.6 — xem T6); hint `image` và `audio` render **placeholder có nhãn "P2.7"**.
- [ ] `BR-SDF-04` ca âm: **không** đường nào để nhập emoji bằng input text.
- [ ] Nhóm field đúng §7.3 và **thứ tự cố định**: Thông tin · Nội dung · Độ khó · Phân loại · Quyền.
- [ ] `BR-SDF-07` ca âm: đo `font-size` mọi input → không cái nào dưới **16px**.
- [ ] Field không có nhãn (template mới, chưa vào từ điển) → hiện tên thô + cảnh báo dev, không vỡ form.
- [ ] `array` sắp xếp lại được; `object` gấp mở được; lồng tối đa 3 tầng, tầng 2–3 render dạng sub-drawer (§11 Q2).
- [ ] Bàn phím đi hết form; nhãn gắn với input đúng chuẩn — [`accessibility.md`](../specs/08-quality/accessibility.md).

**Kiểm chứng**
- [ ] `pnpm --filter @kidthink/admin test -- form-renderer` xanh · render cả 6 template không lỗi.

**Phụ thuộc:** T3 · **Cỡ:** L

### Task 5 — Validate hai đầu

**Tiêu chí nghiệm thu**
- [ ] `D-JS`: `apps/admin` import Zod schema của template trực tiếp từ package sở hữu contract; **không** dựng lại schema từ JSON Schema.
- [ ] `BR-SDF-05` ca âm: một giá trị vi phạm → thông báo client **khớp từng chữ** với thông báo server.
- [ ] `D-BK` giữ nguyên: `refine` quan hệ phức tạp báo lỗi ở **server**; client không giả vờ kiểm được.
- [ ] Server validate lại **mọi** submit, kể cả khi client đã xanh.
- [ ] Thông báo lỗi tiếng Việt, gắn đúng field, không phải một khối JSON.
- [ ] Ca âm: tắt JavaScript của validate client → submit vẫn bị server chặn đúng.

**Kiểm chứng**
- [ ] `pnpm test -- form-validation` xanh, assertion tham chiếu `BR-SDF-05`.

**Phụ thuộc:** T4 · **Cỡ:** M

### Cổng dừng

- [ ] Thêm một field mới vào `content_contract` của một template → field xuất hiện với widget đúng, **không sửa dòng code UI nào**. Đây là ca nghiệm thu chính của cả bước.
- [ ] Bốn cổng đều đỏ được khi cố tình vi phạm.
- [ ] Sáu template render đủ, không field nào hiện tên kỹ thuật thô.
- [ ] Không input nào dưới 16px; không color wheel; không input text cho emoji.
- [ ] Thông báo lỗi client và server khớp nhau.
- [ ] `pnpm check && pnpm test && pnpm lint:tokens && pnpm lint:specs && pnpm check:progress` xanh.

### Task 6 — Evidence, promote và vá roadmap

**Tiêu chí nghiệm thu**
- [ ] Mỗi `BR-SDF-*` có ít nhất một test tham chiếu mã rule.
- [ ] [`schema-driven-form.md`](../specs/06-admin/schema-driven-form.md) sang `implemented`.
- [ ] `D-JV` vá roadmap: chuyển [`emoji-picker.md`](../specs/06-admin/emoji-picker.md) từ bước 7 sang bước **6** trong [`roadmap.md`](../specs/roadmap.md) và trong [`14-implementation-sequence-todo.md`](14-implementation-sequence-todo.md); ghi rõ lý do và khẳng định không cạnh `depends_on` nào bị đảo.
- [ ] §11 Q1 — đóng bằng `D-JS` + `D-BK`: client import Zod thật nên không mất `refine`; `refine` quan hệ phức tạp vẫn để server làm trọng tài.
- [ ] §11 Q2 — đóng bằng `D-JU`: trần **3 tầng** là cổng, tầng 2–3 render sub-drawer.
- [ ] Nợ ghi sang **P2.6**: lắp bộ chọn emoji thật vào hint `emoji` · **P2.7**: lắp widget ảnh và audio, gỡ placeholder.
- [ ] Tick **P2.5** ở [`14-implementation-sequence-todo.md`](14-implementation-sequence-todo.md) khi `check:progress` tự xanh.

**Cỡ:** S

## 5. Rủi ro

| Rủi ro | Ảnh hưởng | Giảm thiểu |
|---|---|---|
| Client tự suy hint song song với server | Hai bản lệch ở template mới, khó thấy nhất | `D-JR` — cổng cấm hậu tố trong `apps/admin` |
| JSON Schema mất `refine` | Client xanh, server đỏ, Manager không hiểu vì sao | `D-JS` — import Zod thật |
| Field rơi vào text được chấp nhận âm thầm | Nội dung seed xong mới phát hiện sai widget | `D-JT` — cổng build trên 6 contract |
| Nhãn tiếng Việt chỉ cảnh báo | Manager thấy tên kỹ thuật thô ở production | `D-JU` — cổng, không cảnh báo |
| Một form viết tay "cho nhanh" | Chỗ lệch đầu tiên giữa studio và engine | `BR-SDF-01` — cổng quét tên component |
| Studio không chọn được emoji | Không soạn được level nào — vật liệu chính thiếu | `D-JV` — kéo bộ chọn emoji lên P2.6 |
| Placeholder ảnh bị thay bằng input text | Vi phạm `BR-SDF-04` một cách âm thầm | `D-JV` — cấm rơi về text, có ca âm |
| Schema lồng sâu | Form sinh không dùng được, và không ai biết trần ở đâu | `D-JU` — trần 3 tầng là cổng |

## 6. Giả định

1. **P1.2 đã đóng** — 6 contract Zod tồn tại và engine đọc chính chúng.
2. **P2.1 đã đóng** — form sống trong layout `manager`.
3. **`EMOJI-REGISTRY` đã có từ P0.9** — điều kiện duy nhất để kéo bộ chọn emoji lên P2.6.
4. **Chưa có lưu trữ ảnh** — widget ảnh và audio là placeholder tới P2.7.
5. **Chỉ 6 template ở MVP** — nhưng cổng phải đúng với template thứ 30, đó là lý do bước này tồn tại.

## 7. Ngoài phạm vi

- Màn hình soạn game level — P2.6.
- Xem trước bằng engine thật — P2.6.
- Bộ chọn emoji (spec riêng, kéo lên P2.6 theo `D-JV`).
- Tải và cắt ảnh — P2.7.
- Thêm `uiHint` mới hoặc đổi quy ước đặt tên — hỏi trước, không làm ở bước này.
- Form cho lesson và activity — P3.
