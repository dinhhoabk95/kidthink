# Checklist — Task #48: P2.6 — Studio soạn game level, preview và bộ chọn emoji

> Kế hoạch: [`48-p2-6-game-level-studio-plan.md`](48-p2-6-game-level-studio-plan.md).
> Bước này giao **một trong hai tiêu chí cổng ra P2**: Manager tạo được game level, 0 dòng code.
> Tuyệt đối: preview là engine thật (`D-JW`) · không mất công việc (`D-JY`).
>
> ```
> export PATH=/Users/macbook/.nvm/versions/node/v24.15.0/bin:$PATH
> ```

## Preflight

- [x] **P2.5 đã đóng** — form sinh từ schema và bốn cổng chạy được.
- [x] **P1.2 và P1.11 đã đóng** — engine thật, ≥120 level published.
- [x] `D-JV` đã áp: [`emoji-picker.md`](../specs/06-admin/emoji-picker.md) thuộc bước này trong [`roadmap.md`](../specs/roadmap.md).
- [x] Human approve kế hoạch và năm quyết định D-JW · D-JX · D-JY · D-JZ · D-KA.
- [x] Đối chiếu `BR-STU-*` `BR-LPV-*` `BR-EPK-*` với [`business-rules.md`](../specs/00-foundation/business-rules.md).
- [x] Tạo nhánh riêng.

---

### Task 1 — Bộ chọn emoji

- [x] `GET /api/managers/emoji` với `q` · `category` · `age_band` · `limit` ≤100.
- [x] Cache `private, max-age=3600`.
- [x] `BR-EPK-02` ca âm: gõ "táo" → có quả táo.
- [x] `BR-EPK-02` ca âm: gõ "tao" → **vẫn** có quả táo.
- [x] `BR-EPK-01` ca âm: ô ≥ **40×40px**, glyph ≥ **28px**.
- [x] `BR-EPK-03` ca âm: dán ký tự emoji → **không** lưu được vào field.
- [x] `BR-EPK-04`: 12 gần đây ở hàng đầu, localStorage, LRU, **không** đồng bộ server.
- [x] `BR-EPK-05`: duyệt theo **32 nhóm chủ đề học**, không Unicode block.
- [x] `BR-EPK-06` ca âm: mũi tên di chuyển · Enter chọn và đóng · Esc đóng.
- [x] `BR-EPK-08` ca âm: tab và nút dùng `UIcon` SVG, không emoji làm icon.
- [x] `BR-EPK-07`: font stack emoji ghim.
- [x] Emoji `deprecated` không xuất hiện; nội dung cũ vẫn render.
- [x] `age_suitability = blocked` bị lọc khỏi mọi nhóm.
- [x] Tìm không ra → nhóm gần nhất + nút "báo thiếu emoji".
- [x] Lắp vào hint `emoji` của P2.5; placeholder emoji bị **xoá**.

### Task 2 — Preview bằng engine thật

- [x] `T2a` (M): preview config/API + no-write boundary/token, contract tests trong PR riêng.
- [x] `T2b` (M): iframe bridge/debounce/controls/errors + E2E, sau T2a.
- [x] `D-JW`: iframe **cùng trang**, không popup.
- [x] `BR-LPV-01` cổng: import trùng entry point runtime trẻ.
- [x] Ca âm: engine mock hoặc ảnh tĩnh → **đỏ**.
- [x] `GET .../config` bỏ gating, cho `?version=`, `is_preview = true` ở **server**.
- [x] `D-JX` ca âm: chơi thử **hết** level → `mastery_state` không đổi.
- [x] `D-JX` ca âm: `level_daily_stats` không tăng.
- [x] Không tạo `play_session` trừ khi bấm chơi thử.
- [x] `BR-LPV-04` ca âm: đổi emoji → chờ **300ms** → preview đổi, **chưa** có request lưu.
- [x] `BR-LPV-02` ca âm: band 3–4 ở 100% → không phần tử chạm nào dưới **96px**.
- [x] `BR-LPV-02` ca âm: admin chế độ tối → preview **vẫn light-only**.
- [x] `BR-LPV-06`: đổi band → scaffolding đổi theo bảng band đó.
- [x] Điều khiển §7.1 đủ: band · reduced motion · âm thanh · chạy lại · Fit / **100%**.
- [x] `BR-LPV-03` ca âm: thiếu field bắt buộc → hiện **danh sách issue**, mỗi issue link tới field.
- [x] Ca âm: **không** khung trống im lặng.
- [x] Bốn loại lỗi §7.2 hiện đúng, engine throw có nút sao chép chi tiết.

### Task 3 — API level

- [x] `T3a` (M): create/patch + server validation/version conflict/audit, PR riêng.
- [x] `T3b` (M): immutable→new draft/template reset + forbidden-write gates, sau T3a.
- [x] `POST /api/managers/levels` → **201** level `draft`, mã sinh bởi **server**.
- [x] `PATCH .../{code}/{version}` nhận field + `expected_version`.
- [x] Ca âm ghi đè: B lưu với `expected_version` cũ → **409** `VERSION_CONFLICT`.
- [x] Sửa bản `published` → **409** `CONTENT_IMMUTABLE`.
- [x] Ca âm version: published v2 → bấm sửa → sinh v3 `draft`, v2 **vẫn** published.
- [x] `BR-STU-02` ca âm: thiếu đáp án đúng → **422** `CONTENT_PACK_INVALID` + `details.issues[]`.
- [x] Validate `content_pack` chạy ở **server**.
- [x] `D-JZ` cổng 1: không route studio ghi `game_templates`; ca âm fixture → **đỏ**.
- [x] `D-JZ` cổng 2: không route studio đặt `status = published`.
- [x] `BR-STU-07` ca âm: gọi publish từ `draft` → **409** `INVALID_STATUS_TRANSITION`.
- [x] `D-JZ` cổng 3: `access_tier` **không có** giá trị mặc định ở tầng schema.
- [x] `BR-STU-05`: mọi thao tác ghi `audit_logs`.
- [x] Đổi template khi đã có nội dung → cảnh báo + xác nhận, `content_pack` reset.

### Task 4 — Bố cục studio

- [x] Bố cục §7.1: trái **40%** form · phải **60%** preview 16:9 · trên mã + trạng thái + nút · dưới bộ đếm lỗi.
- [x] Form nhúng renderer P2.5, nhóm đúng thứ tự cố định.
- [x] Bước 1 là chọn template; đổi sau khi có nội dung phải xác nhận.
- [x] Chọn skill → **gợi ý** tag ba trục và band tuổi, không tự điền im lặng.
- [x] `BR-STU-09` ca âm: 3 field lỗi → mỗi lỗi hiện **ngay dưới field**, không dồn lên đầu.
- [x] `BR-STU-08`: field 16px, control 40px.
- [x] `BR-STU-10`: chrome studio là SVG; emoji chỉ trong nội dung và picker.
- [x] `/studio/levels` lọc theo template · trạng thái · skill; trần 100.

### Task 5 — Tự lưu nháp và không mất công việc

- [x] Tự lưu mỗi **30 giây** khi có thay đổi, và khi rời field.
- [x] Nháp **không cần** hợp lệ đầy đủ.
- [x] `D-JY` ca âm bước 1: điền 30 field → ngắt mạng → lưu fail.
- [x] `D-JY` ca âm bước 2: form **còn nguyên**, có nút thử lại.
- [x] `D-JY` ca âm bước 3: **reload trình duyệt** → dữ liệu **vẫn còn**.
- [x] Lưu fail **không** điều hướng, **không** xoá state.
- [x] Bản cục bộ xoá sau khi lưu server thành công.
- [x] Bản cục bộ khoá theo `code + version`.

### Task 6 — Gửi duyệt

- [x] `POST .../submit` chuyển `draft → in_review`.
- [x] Thiếu mục §7.2 → **422** `PUBLISH_CHECKLIST_FAILED`, `missing` liệt kê đủ.
- [x] Checklist kiểm đúng **1** skill có `weight = 1.0`.
- [x] Checklist kiểm ≥1 learning objective.
- [x] Checklist kiểm tag đủ **ba** trục.
- [x] `BR-STU-06` ca âm: chưa chọn `access_tier` → **422**, `missing` chứa `access_tier`.
- [x] Sau `in_review`, bản chuyển chế độ chỉ đọc trong studio.
- [x] Ghi `audit_logs` và thông báo tới hàng duyệt.

### Task 7 — Nhân bản

- [x] Nút "Nhân bản" tạo bản `draft` mới kế thừa `content_pack` · `difficulty_params` · tag.
- [x] Mã level mới sinh bởi server.
- [x] **Không** kế thừa trạng thái duyệt, không kế thừa lịch sử audit.
- [x] Nhân từ bản `published` cũng ra `draft`, không đụng bản gốc.
- [x] Ghi `audit_logs` kèm mã bản gốc.

## Cổng dừng — 0 dòng code

- [x] **Ca chính**: chọn template → chọn emoji → đặt đáp án → preview chạy → gửi duyệt → publish → level trong catalog → trẻ chơi được, **không deploy nào**.
- [x] Preview import đúng entry point runtime trẻ.
- [x] Chơi thử hết level → không mastery, không KPI.
- [x] Ngắt mạng + reload trình duyệt → không mất field nào.
- [x] Hai Manager không ghi đè nhau (**409**).
- [x] Không route studio nào ghi `game_templates` hay đặt `published`.
- [x] `access_tier` không có mặc định.
- [x] `pnpm check && pnpm test && pnpm test:e2e && pnpm --filter @mindkid/gates test && pnpm --filter @mindkid/gates test && node packages/gates/scripts/check-progress.ts` xanh.

---

## Task 8 — Evidence, promote và nợ chuyển tiếp

- [x] Mỗi `BR-STU-*` có test tham chiếu mã rule.
- [x] Mỗi `BR-LPV-*` có test tham chiếu mã rule.
- [x] Mỗi `BR-EPK-*` có test tham chiếu mã rule.
- [x] [`game-level-studio.md`](../specs/06-admin/game-level-studio.md) → `implemented`.
- [x] [`live-preview.md`](../specs/06-admin/live-preview.md) → `implemented`.
- [x] [`emoji-picker.md`](../specs/06-admin/emoji-picker.md) → `implemented`.
- [x] `D-CC`: ghi nợ **slice cuối** — lắp widget ảnh vào field ảnh của studio, hoàn tất trong **P2.7**; cổng ra P2.6 **không** đòi slice này.
- [x] Trả nợ P1.16: nút "soạn level cho skill này" đổi từ seeder sang **studio**, `skill_code` điền sẵn.
- [x] Ca âm: nút đó không dẫn tới 404.
- [x] Tick **P2.6** ở [`14-implementation-sequence-todo.md`](14-implementation-sequence-todo.md) khi `check:progress` tự xanh.

## Câu hỏi mở chuyển tiếp

- [x] **Soạn hàng loạt kiểu bảng** — đóng theo `D-KA`: không; 120 level đi đường seeder, studio sửa và tạo từng bản.
- [x] **Nhân bản** — đóng: **có**, làm ở T7.
- [x] **Preview trên thiết bị thật qua QR** — hoãn P4. Nêu cho chủ: khung desktop không thay được cảm giác chạm.
- [x] **Chọn nhiều emoji cùng lúc cho field array** — không ở MVP; mở picker nhiều lần.
