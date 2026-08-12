# Kế hoạch — Task #48: P2.6 — Studio soạn game level, preview và bộ chọn emoji

> Viết 2026-08-10. Bước sở hữu: **P2.6** của
> [`14-implementation-sequence-todo.md`](14-implementation-sequence-todo.md).
> Spec sở hữu: [`game-level-studio.md`](../specs/06-admin/game-level-studio.md) ·
> [`live-preview.md`](../specs/06-admin/live-preview.md) ·
> [`emoji-picker.md`](../specs/06-admin/emoji-picker.md) (kéo từ P2.7 theo `D-JV`).
>
> ```
> export PATH=/Users/macbook/.nvm/versions/node/v24.15.0/bin:$PATH
> ```

## Tóm tắt

Đây là bước giao **một trong hai tiêu chí cổng ra P2**: *Manager tạo được một game level mới
trong studio, 0 dòng code*. Nó cũng là điều kiện để nội dung lớn nhanh hơn tốc độ tuyển được
lập trình viên — quyết định D2 của [`SPEC.md`](../SPEC.md) §0.

Ba spec, ba loại rủi ro khác nhau:

1. **Studio** — rủi ro là **mất công việc**. Manager điền 40 field trong 20 phút; một lần lưu
   fail làm mất hết là một lần mất niềm tin không lấy lại được.
2. **Preview** — rủi ro là **xấp xỉ**. Preview không phải engine thật để lọt level không chơi
   được, và người phát hiện sẽ là một đứa trẻ 4 tuổi không hiểu vì sao không bấm được.
3. **Bộ chọn emoji** — rủi ro là **sai bài học**. Quả táo trông giống quả cà chua ở 20px thì
   level dạy sai, và không test nào bắt được.

## 0. Điều kiện tiên quyết

| Dep | Trạng thái | Ghi chú |
|---|---|---|
| `SCHEMA-DRIVEN-FORM` | P2.5 | form sinh từ schema; hint `emoji` đang chờ widget thật |
| `GAME-ENGINE-RUNTIME` | P1.2 | engine thật — điều kiện duy nhất của preview |
| `GAME-TEMPLATE-CONTRACT` | P1.2 | `content_contract` · `difficulty_contract` · `limits` |
| `CONTENT-LIFECYCLE` | P0.6 | `draft → in_review → published`, `BR-CLC-02` |
| `CONTENT-VERSIONING` | P0.6 | sửa bản `published` là tạo version mới |
| `EMOJI-REGISTRY` | P0.9 | 32 nhóm chủ đề, tên tiếng Việt, `age_suitability` |
| `GAME-LEVEL-MODEL` | P1.11 | bảng `game_levels`, ≥120 bản đã `published` |
| `CONTENT-TAGGING` | P1.10 | tag ba trục, skill, learning objective |
| Admin shell | P2.1 | layout `manager` |

## 1. Đo được

### 1.1 Đã có

Form sinh từ schema và bốn cổng chống lệch của P2.5; engine thật chạy được 6 template; ≥120
level `published` do seeder P1.10 ghi; vòng đời và versioning nội dung; registry emoji; shell
admin.

### 1.2 Chưa có

Bộ chọn emoji; khung preview; `POST`/`PATCH`/`submit` cho level; bố cục hai cột; tự lưu nháp;
nhân bản; và đường để một người **không phải dev** tạo ra một level.

### 1.3 Đã chốt, không mở lại

`D-AN` [`live-preview.md`](../specs/06-admin/live-preview.md) đứng độc lập, studio nhúng nó,
không có chiều ngược lại · `D-CC` field ảnh của studio lắp widget từ
[`image-upload.md`](../specs/06-admin/image-upload.md) — **slice cuối** của bước này, hoàn tất
khi P2.7 xong · `D-JV` bộ chọn emoji kéo lên bước này · `BR-CLC-02` publish không đi từ studio ·
`BR-EMJ-01` emoji chỉ đến từ registry.

## 2. Quyết định

**D-JW — Preview chạy trong **iframe cùng trang**, nạp đúng entry point của runtime trẻ.**
`BR-LPV-02` bắt preview kế thừa **toàn bộ** ràng buộc bề mặt trẻ: sàn touch 64–96px, không
`dark:`, không đỏ — trong khi `apps/admin` có chế độ tối và mật độ UI dày hơn (`BR-STU-08`).
Nhúng engine như một component thường nghĩa là hai hệ CSS sống chung, và "không dark mode trong
preview" trở thành thứ phải nhớ ở mỗi lần sửa style. Xử: iframe cùng tài liệu (`BR-LPV-07` —
vẫn cùng trang, không popup), nạp cùng barrel với runtime trẻ, truyền config qua `postMessage`.
Đánh đổi nhận có ý thức: mất truyền prop trực tiếp, đổi lại `BR-LPV-02` được bảo đảm bằng **cơ
chế** thay vì bằng kỷ luật. Cổng: quét import của khung preview — phải trùng entry point của
runtime trẻ; xuất hiện engine mock hay ảnh tĩnh → **đỏ**.

**D-JX — `is_preview` là quyết định của **server**, không phải cờ client.** `BR-LPV-05` cấm
preview ghi mastery và đếm KPI. Nếu cờ đi từ client thì bất kỳ ai gọi API cũng có thể chơi thật
mà không tính, hoặc chơi preview mà lại tính. Xử: route preview là route **riêng** dưới
`/api/managers/...`; nó không tạo `play_session` trừ khi Manager bấm chơi thử, và khi tạo thì
gắn `is_preview = true` ở server. Ca âm: Manager chơi thử **hết** một level → không hàng
`mastery_state` nào đổi, `level_daily_stats` không tăng.

**D-JY — "Không mất công việc" là **bản sao cục bộ**, không phải chỉ giữ state trong bộ nhớ.**
`BR-STU-03` nói lưu fail phải giữ nguyên form. Nhưng ca hỏng thật hơn là tab bị đóng, trình
duyệt crash, hay máy sleep — state trong bộ nhớ không sống qua những cái đó. Xử: state form lưu
cục bộ theo khoá `code + version`, ghi lại mỗi lần đổi field; tự lưu server mỗi **30 giây** khi
có thay đổi và khi rời field; lưu fail **không** điều hướng, **không** xoá state, hiện nút thử
lại. Ca âm gồm: điền 30 field → ngắt mạng → lưu fail → **reload trình duyệt** → dữ liệu còn
nguyên. Bản cục bộ xoá khi lưu server thành công, để không có hai nguồn sự thật lâu dài.

**D-JZ — Ba quy tắc "không được tồn tại" của studio vào **cùng cổng quét** đã có từ P2.2.**
`BR-STU-01` cấm ghi `game_templates`; `BR-STU-07` cấm publish trực tiếp; `BR-STU-06` cấm
`access_tier` có giá trị mặc định. Ba thứ này không kiểm được bằng test tính năng. Xử: mở rộng
`scripts/check-child-data-compliance-gates.ts` lần thứ ba — không route studio nào ghi
`game_templates`; không route studio nào đặt `status = published`; và ở tầng schema,
`access_tier` **không có** giá trị mặc định, thiếu là `undefined` chứ không phải một tier nào
đó. Ca âm cho từng quy tắc.

**D-KA — Nhân bản có ở MVP; soạn hàng loạt kiểu bảng thì không.** §11 Q1 hỏi có cần chế độ nhập
bảng cho 120 level — câu trả lời nằm ở chỗ khác: **120 level đi đường seeder** của
[`content-seed-authoring.md`](../specs/01-platform/content-seed-authoring.md) (P1.10), studio
là nơi **sửa và tạo từng bản**. Xử: đóng Q1 là *không*, và làm §11 Q2 (**nhân bản**) thành
đường chính thức để soạn theo lô trong studio — bản nhân kế thừa toàn bộ `content_pack`, sinh
mã mới, ở `draft`, và **không** kế thừa trạng thái duyệt. Lý do gộp hai câu: một chế độ nhập
bảng là một bề mặt soạn thảo thứ hai với tập validate riêng, tức là chỗ thứ hai để lệch với
`content_contract`.

## 3. Đồ thị

```
T1 bộ chọn emoji (D-JV — kéo từ P2.7)
      └──→ T4 studio: bố cục hai cột, form nhúng, lỗi cạnh field
T2 preview iframe + engine thật + điều khiển band tuổi (D-JW, D-JX)
      └──→ T4
T3 API level: create · patch có expected_version · validate server (D-JZ)
      └──→ T4 ──→ T5 tự lưu nháp + không mất công việc (D-JY)
                        └──→ T6 gửi duyệt + checklist §7.2
                                  └──→ T7 nhân bản (D-KA)
                              ── Cổng dừng: 0 dòng code ──
                                    T8 evidence, promote 3 spec, nợ slice ảnh sang P2.7
```

## 4. Task

### Task 1 — Bộ chọn emoji

**Tiêu chí nghiệm thu**
- [ ] `GET /api/managers/emoji` với `q` · `category` · `age_band` · `limit` ≤100; cache `private, max-age=3600`.
- [ ] `BR-EPK-02` ca âm hai vế: gõ "táo" → có quả táo; gõ "tao" → **vẫn** có quả táo.
- [ ] `BR-EPK-01` ca âm: mỗi ô ≥ **40×40px**, glyph render ≥ **28px**.
- [ ] `BR-EPK-03` ca âm: dán ký tự emoji vào ô tìm kiếm → **không** lưu được giá trị đó vào field.
- [ ] `BR-EPK-04`: 12 emoji gần đây ở hàng đầu, lưu localStorage theo Manager, LRU, **không** đồng bộ server.
- [ ] `BR-EPK-05`: duyệt theo **32 nhóm chủ đề học**, không theo Unicode block.
- [ ] `BR-EPK-06` ca âm: mũi tên di chuyển ô chọn, Enter chọn và đóng, Esc đóng.
- [ ] `BR-EPK-08` ca âm: quét component picker — tab và nút dùng `UIcon` SVG; **không** emoji làm icon điều hướng.
- [ ] `BR-EPK-07`: font stack emoji ghim theo `BR-EMJ-06`.
- [ ] Emoji `deprecated` **không** xuất hiện trong picker; nội dung cũ vẫn render.
- [ ] `age_suitability = blocked` bị lọc khỏi mọi nhóm.
- [ ] Tìm không ra → hiện nhóm gần nhất + nút "báo thiếu emoji".
- [ ] Lắp vào hint `emoji` của P2.5; placeholder emoji bị **xoá**.

**Kiểm chứng**
- [ ] `pnpm test -- emoji-picker` xanh, assertion tham chiếu `BR-EPK-01`…`BR-EPK-08`.

**Phụ thuộc:** P0.9 · P2.5 · **Cỡ:** M

### Task 2 — Preview bằng engine thật

**Tiêu chí nghiệm thu**
- [ ] `D-JW`: preview chạy trong iframe **cùng trang** (`BR-LPV-07` — không popup), nạp cùng barrel với runtime trẻ.
- [ ] `BR-LPV-01` cổng: quét import của khung preview → trùng entry point runtime trẻ; engine mock hoặc ảnh tĩnh → **đỏ**.
- [ ] `GET /api/managers/levels/{code}/{version}/config` bỏ qua gating, cho `?version=`, đặt `is_preview = true` ở **server**.
- [ ] `D-JX` + `BR-LPV-05` ca âm: Manager chơi thử **hết** một level → không hàng `mastery_state` nào đổi, `level_daily_stats` không tăng.
- [ ] Không tạo `play_session` trừ khi Manager bấm chơi thử.
- [ ] `BR-LPV-04` ca âm: đổi một emoji trong form → chờ **300ms** → preview hiện emoji mới, và **chưa có** request lưu nào.
- [ ] `BR-LPV-02` ca âm 1: band 3–4 ở tỉ lệ 100% → không phần tử chạm nào dưới **96px**.
- [ ] `BR-LPV-02` ca âm 2: admin đang chế độ tối → khung preview **vẫn light-only**.
- [ ] `BR-LPV-06`: đổi band tuổi → ngưỡng scaffolding đổi theo bảng của band đó.
- [ ] Điều khiển §7.1 đủ: band tuổi · reduced motion · âm thanh · chạy lại · Fit / **100% (960×540 thật)**.
- [ ] `BR-LPV-03` ca âm: `content_pack` thiếu field bắt buộc → khung preview hiện **danh sách issue**, mỗi issue link tới field; **không** khung trống im lặng.
- [ ] Bốn loại lỗi §7.2 hiện đúng: sai schema · asset không resolve · vượt `limits` · engine throw (kèm nút sao chép chi tiết).

**Kiểm chứng**
- [ ] `pnpm test -- live-preview` xanh · `pnpm test:e2e -- studio-preview` xanh.

**Ranh giới work package:** `T2a` (M) preview config/API + `is_preview`, no mastery/stats và
preview-token boundary; `T2b` (M) iframe engine bridge, debounce, controls, error surfaces và
E2E. T2a → T2b; mỗi package dùng entry runtime thật và có negative test riêng.

**Phụ thuộc:** P1.2 · **Cỡ:** 2 work package M

### Task 3 — API level

**Tiêu chí nghiệm thu**
- [ ] `POST /api/managers/levels` nhận `{ template_code }` → **201** level `draft` rỗng, mã sinh bởi **server**.
- [ ] `PATCH /api/managers/levels/{code}/{version}` nhận field cần đổi + `expected_version`.
- [ ] Ca âm ghi đè: A lưu, rồi B lưu với `expected_version` cũ → B nhận **409** `VERSION_CONFLICT`.
- [ ] Sửa bản `published` → **409** `CONTENT_IMMUTABLE`, và luồng đúng là tạo **version mới** ở `draft`; ca âm — level published v2 → bấm sửa → sinh v3 `draft`, v2 **vẫn** published.
- [ ] `BR-STU-02` ca âm: `content_pack` thiếu đáp án đúng → **422** `CONTENT_PACK_INVALID` với `details.issues[]` nêu rõ vấn đề; validate chạy ở **server**.
- [ ] `D-JZ` cổng 1 — `BR-STU-01`: không route studio nào ghi `game_templates`; ca âm fixture → **đỏ**.
- [ ] `D-JZ` cổng 2 — `BR-STU-07`: không route studio nào đặt `status = published`; gọi publish từ `draft` → **409** `INVALID_STATUS_TRANSITION`.
- [ ] `D-JZ` cổng 3 — `BR-STU-06`: `access_tier` **không có** giá trị mặc định ở tầng schema.
- [ ] `BR-STU-05`: mọi thao tác ghi `audit_logs`.
- [ ] Đổi template khi đã có nội dung → cảnh báo mất dữ liệu, yêu cầu xác nhận, `content_pack` reset.

**Kiểm chứng**
- [ ] `pnpm test -- level-api` xanh, assertion tham chiếu `BR-STU-01` `BR-STU-02` `BR-STU-06` `BR-STU-07`.

**Ranh giới work package:** `T3a` (M) create/patch, server validation, optimistic version và
audit; `T3b` (M) immutable published → new draft, template reset và three forbidden-write
gates. T3a → T3b; contract/error tests không chờ UI.

**Phụ thuộc:** P0.6 · P1.11 · P2.2 · **Cỡ:** 2 work package M

### Task 4 — Bố cục studio

**Tiêu chí nghiệm thu**
- [ ] Bố cục §7.1: trái **40%** form, phải **60%** preview khung 16:9, trên là mã level + trạng thái + nút, dưới là bộ đếm lỗi.
- [ ] Form nhúng renderer của P2.5, nhóm đúng thứ tự cố định.
- [ ] Bước 1 là **chọn template**; sau khi có nội dung thì đổi template phải xác nhận.
- [ ] Chọn skill mục tiêu → hệ thống **gợi ý** tag ba trục và band tuổi (gợi ý, không tự điền im lặng).
- [ ] `BR-STU-09` ca âm: gửi duyệt với 3 field lỗi → mỗi lỗi hiện **ngay dưới field tương ứng**, không dồn lên đầu form.
- [ ] `BR-STU-08`: field 16px, control 40px — mật độ dày hơn bề mặt trẻ, đúng chủ ý.
- [ ] `BR-STU-10`: chrome của studio là SVG; emoji chỉ xuất hiện trong nội dung và trong picker.
- [ ] Danh sách `/studio/levels` có lọc theo template · trạng thái · skill; trần 100.

**Kiểm chứng**
- [ ] `pnpm --filter @kidthink/admin test -- studio-layout` xanh.

**Phụ thuộc:** T1 · T2 · T3 · **Cỡ:** M

### Task 5 — Tự lưu nháp và không mất công việc

**Tiêu chí nghiệm thu**
- [ ] Tự lưu mỗi **30 giây** khi có thay đổi, và khi rời field (§7.3).
- [ ] Nháp **không cần** hợp lệ đầy đủ; validate đầy đủ chỉ chạy lúc gửi duyệt.
- [ ] `D-JY` + `BR-STU-03` ca âm chuỗi: điền 30 field → ngắt mạng → lưu fail → form **còn nguyên** → **reload trình duyệt** → dữ liệu **vẫn còn**.
- [ ] Lưu fail **không** điều hướng, **không** xoá state, hiện nút thử lại.
- [ ] Bản cục bộ xoá sau khi lưu server thành công — không để hai nguồn sự thật.
- [ ] Bản cục bộ khoá theo `code + version`; mở bản khác không thấy dữ liệu bản trước.

**Kiểm chứng**
- [ ] `pnpm test:e2e -- studio-autosave` xanh, gồm ca reload trình duyệt.

**Phụ thuộc:** T4 · **Cỡ:** M

### Task 6 — Gửi duyệt

**Tiêu chí nghiệm thu**
- [ ] `POST /api/managers/levels/{code}/{version}/submit` chuyển `draft → in_review`.
- [ ] Thiếu bất kỳ mục nào của §7.2 → **422** `PUBLISH_CHECKLIST_FAILED`, `missing` liệt kê đủ.
- [ ] Checklist §7.2 kiểm đủ 11 điều kiện, gồm: đúng **1** skill có `weight = 1.0` · ≥1 learning objective · tag đủ **ba** trục · `access_tier` đã chọn.
- [ ] `BR-STU-06` ca âm: gửi duyệt chưa chọn `access_tier` → **422**, `missing` chứa `access_tier`.
- [ ] Sau khi `in_review`, studio chuyển bản đó sang chế độ chỉ đọc; sửa tiếp là rút khỏi hàng duyệt (bề mặt của P2.8).
- [ ] Ghi `audit_logs` và thông báo tới hàng duyệt.

**Kiểm chứng**
- [ ] `pnpm test -- level-submit` xanh.

**Phụ thuộc:** T5 · **Cỡ:** S

### Task 7 — Nhân bản

**Tiêu chí nghiệm thu**
- [ ] `D-KA`: nút "Nhân bản" tạo bản `draft` mới, kế thừa **toàn bộ** `content_pack`, `difficulty_params`, tag.
- [ ] Mã level mới sinh bởi server; **không** kế thừa trạng thái duyệt, không kế thừa lịch sử audit.
- [ ] Bản nhân từ level `published` cũng ra `draft`, không đụng bản gốc.
- [ ] Ghi `audit_logs` kèm mã bản gốc — truy được nguồn.

**Kiểm chứng**
- [ ] `pnpm test -- level-duplicate` xanh.

**Phụ thuộc:** T6 · **Cỡ:** S

### Cổng dừng — 0 dòng code

- [ ] **Ca nghiệm thu chính**: Manager đăng nhập → chọn template → chọn emoji → đặt đáp án → preview chạy được → gửi duyệt → publish (bề mặt P2.8) → level xuất hiện trong catalog → trẻ chơi được. **Không deploy nào xảy ra.**
- [ ] Preview import đúng entry point runtime trẻ; không mock, không ảnh tĩnh.
- [ ] Chơi thử hết level → không mastery, không KPI.
- [ ] Ngắt mạng + reload trình duyệt → không mất field nào.
- [ ] Hai Manager không ghi đè nhau (**409** `VERSION_CONFLICT`).
- [ ] Không route studio nào ghi `game_templates` hay đặt `published`.
- [ ] `access_tier` không có mặc định.
- [ ] `pnpm check && pnpm test && pnpm test:e2e && pnpm lint:tokens && pnpm lint:specs && pnpm check:progress` xanh.

### Task 8 — Evidence, promote và nợ chuyển tiếp

**Tiêu chí nghiệm thu**
- [ ] Mỗi `BR-STU-*` `BR-LPV-*` `BR-EPK-*` có ít nhất một test tham chiếu mã rule.
- [ ] Ba spec sang `implemented` — trừ phần được `D-CC` cho phép hoãn (xem mục kế).
- [ ] `D-CC`: **slice cuối** của bước này là lắp widget ảnh vào field ảnh của studio; nó hoàn tất **trong P2.7** khi [`image-upload.md`](../specs/06-admin/image-upload.md) xong. Ghi rõ trong todo của P2.7, và cổng ra P2.6 **không** đòi slice này.
- [ ] Trả nợ P1.16: nút "soạn level cho skill này" trên trang taxonomy đổi từ đường seeder sang **studio**, với `skill_code` điền sẵn; ca âm — nút không dẫn tới 404.
- [ ] §11 Q1 của [`game-level-studio.md`](../specs/06-admin/game-level-studio.md) (soạn hàng loạt) — đóng theo `D-KA`: không; 120 level đi đường seeder.
- [ ] §11 Q2 (nhân bản) — đóng: **có**, đã làm ở T7.
- [ ] §11 Q1 của [`live-preview.md`](../specs/06-admin/live-preview.md) (preview trên thiết bị thật qua QR) — đóng: hoãn P4; MVP dùng tỉ lệ 100% (960×540). Nêu cho chủ vì khung desktop không thay được cảm giác chạm.
- [ ] §11 Q1 của [`emoji-picker.md`](../specs/06-admin/emoji-picker.md) (chọn nhiều emoji cùng lúc) — đóng: không ở MVP.
- [ ] Tick **P2.6** ở [`14-implementation-sequence-todo.md`](14-implementation-sequence-todo.md) khi `check:progress` tự xanh.

**Cỡ:** S

## 5. Rủi ro

| Rủi ro | Ảnh hưởng | Giảm thiểu |
|---|---|---|
| Preview không phải engine thật | Level không chơi được lọt tới trẻ | `D-JW` — cổng quét entry point |
| CSS admin rò vào preview | `BR-LPV-02` vi phạm âm thầm, dark mode lọt vào bề mặt trẻ | `D-JW` — iframe, ca âm chế độ tối |
| Cờ `is_preview` đi từ client | Chơi thật không tính, hoặc preview lại tính | `D-JX` — server quyết |
| Mất công việc khi tab đóng | Manager mất 20 phút và mất niềm tin | `D-JY` — bản cục bộ, ca âm reload |
| Hai nguồn sự thật form | Bản cục bộ cũ ghi đè bản server mới | `D-JY` — xoá bản cục bộ sau khi lưu thành công |
| Publish trực tiếp từ studio | Bỏ qua cổng duyệt của `BR-CLC-02` | `D-JZ` — cổng quét route |
| `access_tier` có mặc định | Nội dung trả phí bị cho không, hoặc ngược lại | `D-JZ` — không mặc định ở tầng schema |
| Chế độ nhập bảng | Bề mặt soạn thảo thứ hai, tập validate thứ hai | `D-KA` — không làm; nhân bản thay thế |
| Emoji ô nhỏ | Sai emoji = sai bài học, và không test nào bắt được | `BR-EPK-01` — ca âm đo kích thước |
| Preview trống im lặng | Manager không biết vì sao, đoán mò | `BR-LPV-03` — luôn nói lý do |

## 6. Giả định

1. **P2.5 đã đóng** — form sinh từ schema và bốn cổng chạy được.
2. **P1.2 và P1.11 đã đóng** — engine thật và ≥120 level published tồn tại để tham chiếu.
3. **P2.7 chưa xong** — field ảnh giữ placeholder; slice cuối hoàn tất trong P2.7 theo `D-CC`.
4. **Một Manager soạn tại một thời điểm** — `expected_version` đủ, chưa cần khoá phân tán.
5. **120 level nền do seeder ghi** — studio là nơi sửa và tạo từng bản, không phải nơi nạp lô.

## 7. Ngoài phạm vi

- Duyệt và phát hành nội dung — P2.8.
- Tải và cắt ảnh — P2.7 (và slice cuối của bước này theo `D-CC`).
- Theo dõi asset đang dùng ở đâu — P2.7.
- Soạn lesson, activity, curriculum — P3.
- Chế độ nhập bảng hàng loạt — không làm, theo `D-KA`.
- Preview trên thiết bị thật qua QR — P4.
