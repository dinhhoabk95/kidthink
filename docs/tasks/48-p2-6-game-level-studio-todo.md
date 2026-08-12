# Checklist — Task #48: P2.6 — Studio soạn game level, preview và bộ chọn emoji

> Kế hoạch: [`48-p2-6-game-level-studio-plan.md`](48-p2-6-game-level-studio-plan.md).
> Bước này giao **một trong hai tiêu chí cổng ra P2**: Manager tạo được game level, 0 dòng code.
> Tuyệt đối: preview là engine thật (`D-JW`) · không mất công việc (`D-JY`).
>
> ```
> export PATH=/Users/macbook/.nvm/versions/node/v24.15.0/bin:$PATH
> ```

## Preflight

- [ ] **P2.5 đã đóng** — form sinh từ schema và bốn cổng chạy được.
- [ ] **P1.2 và P1.11 đã đóng** — engine thật, ≥120 level published.
- [ ] `D-JV` đã áp: [`emoji-picker.md`](../specs/06-admin/emoji-picker.md) thuộc bước này trong [`roadmap.md`](../specs/roadmap.md).
- [ ] Human approve kế hoạch và năm quyết định D-JW · D-JX · D-JY · D-JZ · D-KA.
- [ ] Đối chiếu `BR-STU-*` `BR-LPV-*` `BR-EPK-*` với [`business-rules.md`](../specs/00-foundation/business-rules.md).
- [ ] Tạo nhánh riêng.

---

### Task 1 — Bộ chọn emoji

- [ ] `GET /api/managers/emoji` với `q` · `category` · `age_band` · `limit` ≤100.
- [ ] Cache `private, max-age=3600`.
- [ ] `BR-EPK-02` ca âm: gõ "táo" → có quả táo.
- [ ] `BR-EPK-02` ca âm: gõ "tao" → **vẫn** có quả táo.
- [ ] `BR-EPK-01` ca âm: ô ≥ **40×40px**, glyph ≥ **28px**.
- [ ] `BR-EPK-03` ca âm: dán ký tự emoji → **không** lưu được vào field.
- [ ] `BR-EPK-04`: 12 gần đây ở hàng đầu, localStorage, LRU, **không** đồng bộ server.
- [ ] `BR-EPK-05`: duyệt theo **32 nhóm chủ đề học**, không Unicode block.
- [ ] `BR-EPK-06` ca âm: mũi tên di chuyển · Enter chọn và đóng · Esc đóng.
- [ ] `BR-EPK-08` ca âm: tab và nút dùng `UIcon` SVG, không emoji làm icon.
- [ ] `BR-EPK-07`: font stack emoji ghim.
- [ ] Emoji `deprecated` không xuất hiện; nội dung cũ vẫn render.
- [ ] `age_suitability = blocked` bị lọc khỏi mọi nhóm.
- [ ] Tìm không ra → nhóm gần nhất + nút "báo thiếu emoji".
- [ ] Lắp vào hint `emoji` của P2.5; placeholder emoji bị **xoá**.

### Task 2 — Preview bằng engine thật

- [ ] `T2a` (M): preview config/API + no-write boundary/token, contract tests trong PR riêng.
- [ ] `T2b` (M): iframe bridge/debounce/controls/errors + E2E, sau T2a.
- [ ] `D-JW`: iframe **cùng trang**, không popup.
- [ ] `BR-LPV-01` cổng: import trùng entry point runtime trẻ.
- [ ] Ca âm: engine mock hoặc ảnh tĩnh → **đỏ**.
- [ ] `GET .../config` bỏ gating, cho `?version=`, `is_preview = true` ở **server**.
- [ ] `D-JX` ca âm: chơi thử **hết** level → `mastery_state` không đổi.
- [ ] `D-JX` ca âm: `level_daily_stats` không tăng.
- [ ] Không tạo `play_session` trừ khi bấm chơi thử.
- [ ] `BR-LPV-04` ca âm: đổi emoji → chờ **300ms** → preview đổi, **chưa** có request lưu.
- [ ] `BR-LPV-02` ca âm: band 3–4 ở 100% → không phần tử chạm nào dưới **96px**.
- [ ] `BR-LPV-02` ca âm: admin chế độ tối → preview **vẫn light-only**.
- [ ] `BR-LPV-06`: đổi band → scaffolding đổi theo bảng band đó.
- [ ] Điều khiển §7.1 đủ: band · reduced motion · âm thanh · chạy lại · Fit / **100%**.
- [ ] `BR-LPV-03` ca âm: thiếu field bắt buộc → hiện **danh sách issue**, mỗi issue link tới field.
- [ ] Ca âm: **không** khung trống im lặng.
- [ ] Bốn loại lỗi §7.2 hiện đúng, engine throw có nút sao chép chi tiết.

### Task 3 — API level

- [ ] `T3a` (M): create/patch + server validation/version conflict/audit, PR riêng.
- [ ] `T3b` (M): immutable→new draft/template reset + forbidden-write gates, sau T3a.
- [ ] `POST /api/managers/levels` → **201** level `draft`, mã sinh bởi **server**.
- [ ] `PATCH .../{code}/{version}` nhận field + `expected_version`.
- [ ] Ca âm ghi đè: B lưu với `expected_version` cũ → **409** `VERSION_CONFLICT`.
- [ ] Sửa bản `published` → **409** `CONTENT_IMMUTABLE`.
- [ ] Ca âm version: published v2 → bấm sửa → sinh v3 `draft`, v2 **vẫn** published.
- [ ] `BR-STU-02` ca âm: thiếu đáp án đúng → **422** `CONTENT_PACK_INVALID` + `details.issues[]`.
- [ ] Validate `content_pack` chạy ở **server**.
- [ ] `D-JZ` cổng 1: không route studio ghi `game_templates`; ca âm fixture → **đỏ**.
- [ ] `D-JZ` cổng 2: không route studio đặt `status = published`.
- [ ] `BR-STU-07` ca âm: gọi publish từ `draft` → **409** `INVALID_STATUS_TRANSITION`.
- [ ] `D-JZ` cổng 3: `access_tier` **không có** giá trị mặc định ở tầng schema.
- [ ] `BR-STU-05`: mọi thao tác ghi `audit_logs`.
- [ ] Đổi template khi đã có nội dung → cảnh báo + xác nhận, `content_pack` reset.

### Task 4 — Bố cục studio

- [ ] Bố cục §7.1: trái **40%** form · phải **60%** preview 16:9 · trên mã + trạng thái + nút · dưới bộ đếm lỗi.
- [ ] Form nhúng renderer P2.5, nhóm đúng thứ tự cố định.
- [ ] Bước 1 là chọn template; đổi sau khi có nội dung phải xác nhận.
- [ ] Chọn skill → **gợi ý** tag ba trục và band tuổi, không tự điền im lặng.
- [ ] `BR-STU-09` ca âm: 3 field lỗi → mỗi lỗi hiện **ngay dưới field**, không dồn lên đầu.
- [ ] `BR-STU-08`: field 16px, control 40px.
- [ ] `BR-STU-10`: chrome studio là SVG; emoji chỉ trong nội dung và picker.
- [ ] `/studio/levels` lọc theo template · trạng thái · skill; trần 100.

### Task 5 — Tự lưu nháp và không mất công việc

- [ ] Tự lưu mỗi **30 giây** khi có thay đổi, và khi rời field.
- [ ] Nháp **không cần** hợp lệ đầy đủ.
- [ ] `D-JY` ca âm bước 1: điền 30 field → ngắt mạng → lưu fail.
- [ ] `D-JY` ca âm bước 2: form **còn nguyên**, có nút thử lại.
- [ ] `D-JY` ca âm bước 3: **reload trình duyệt** → dữ liệu **vẫn còn**.
- [ ] Lưu fail **không** điều hướng, **không** xoá state.
- [ ] Bản cục bộ xoá sau khi lưu server thành công.
- [ ] Bản cục bộ khoá theo `code + version`.

### Task 6 — Gửi duyệt

- [ ] `POST .../submit` chuyển `draft → in_review`.
- [ ] Thiếu mục §7.2 → **422** `PUBLISH_CHECKLIST_FAILED`, `missing` liệt kê đủ.
- [ ] Checklist kiểm đúng **1** skill có `weight = 1.0`.
- [ ] Checklist kiểm ≥1 learning objective.
- [ ] Checklist kiểm tag đủ **ba** trục.
- [ ] `BR-STU-06` ca âm: chưa chọn `access_tier` → **422**, `missing` chứa `access_tier`.
- [ ] Sau `in_review`, bản chuyển chế độ chỉ đọc trong studio.
- [ ] Ghi `audit_logs` và thông báo tới hàng duyệt.

### Task 7 — Nhân bản

- [ ] Nút "Nhân bản" tạo bản `draft` mới kế thừa `content_pack` · `difficulty_params` · tag.
- [ ] Mã level mới sinh bởi server.
- [ ] **Không** kế thừa trạng thái duyệt, không kế thừa lịch sử audit.
- [ ] Nhân từ bản `published` cũng ra `draft`, không đụng bản gốc.
- [ ] Ghi `audit_logs` kèm mã bản gốc.

## Cổng dừng — 0 dòng code

- [ ] **Ca chính**: chọn template → chọn emoji → đặt đáp án → preview chạy → gửi duyệt → publish → level trong catalog → trẻ chơi được, **không deploy nào**.
- [ ] Preview import đúng entry point runtime trẻ.
- [ ] Chơi thử hết level → không mastery, không KPI.
- [ ] Ngắt mạng + reload trình duyệt → không mất field nào.
- [ ] Hai Manager không ghi đè nhau (**409**).
- [ ] Không route studio nào ghi `game_templates` hay đặt `published`.
- [ ] `access_tier` không có mặc định.
- [ ] `pnpm check && pnpm test && pnpm test:e2e && pnpm lint:tokens && pnpm lint:specs && pnpm check:progress` xanh.

---

## Task 8 — Evidence, promote và nợ chuyển tiếp

- [ ] Mỗi `BR-STU-*` có test tham chiếu mã rule.
- [ ] Mỗi `BR-LPV-*` có test tham chiếu mã rule.
- [ ] Mỗi `BR-EPK-*` có test tham chiếu mã rule.
- [ ] [`game-level-studio.md`](../specs/06-admin/game-level-studio.md) → `implemented`.
- [ ] [`live-preview.md`](../specs/06-admin/live-preview.md) → `implemented`.
- [ ] [`emoji-picker.md`](../specs/06-admin/emoji-picker.md) → `implemented`.
- [ ] `D-CC`: ghi nợ **slice cuối** — lắp widget ảnh vào field ảnh của studio, hoàn tất trong **P2.7**; cổng ra P2.6 **không** đòi slice này.
- [ ] Trả nợ P1.16: nút "soạn level cho skill này" đổi từ seeder sang **studio**, `skill_code` điền sẵn.
- [ ] Ca âm: nút đó không dẫn tới 404.
- [ ] Tick **P2.6** ở [`14-implementation-sequence-todo.md`](14-implementation-sequence-todo.md) khi `check:progress` tự xanh.

## Câu hỏi mở chuyển tiếp

- [ ] **Soạn hàng loạt kiểu bảng** — đóng theo `D-KA`: không; 120 level đi đường seeder, studio sửa và tạo từng bản.
- [ ] **Nhân bản** — đóng: **có**, làm ở T7.
- [ ] **Preview trên thiết bị thật qua QR** — hoãn P4. Nêu cho chủ: khung desktop không thay được cảm giác chạm.
- [ ] **Chọn nhiều emoji cùng lúc cho field array** — không ở MVP; mở picker nhiều lần.
