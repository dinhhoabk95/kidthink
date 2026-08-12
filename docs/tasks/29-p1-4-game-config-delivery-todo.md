# Checklist — Task #29: P1.4 — Giao config game đã lọc quyền

> Kế hoạch: [`29-p1-4-game-config-delivery-plan.md`](29-p1-4-game-config-delivery-plan.md).
> Ràng buộc kéo ngược nhau: **đủ** · **≤200 KB gz** · **đã qua gating**.
> Cạnh ngược trong P1: tạo phiên thuộc P1.6 — xử bằng `D-FR` (hàng tối thiểu ở đây).
>
> ```
> export PATH=/Users/macbook/.nvm/versions/node/v24.15.0/bin:$PATH
> ```

## Preflight

- [x] **P1.3 đã đóng** — `assertContentAccess()` là đường duy nhất, cổng đếm handler chạy.
- [x] **P1.2 đã đóng** — contract Zod + sáu template.
- [x] **P0.9 đã đóng** — `emoji_registry` có dữ liệu để phân giải glyph.
- [x] Human approve kế hoạch và năm quyết định D-FR · D-FS · D-FT · D-FU · D-FV.
- [x] Đối chiếu `BR-CFG-*` với [`business-rules.md`](../specs/00-foundation/business-rules.md).
- [x] Tạo nhánh riêng.

---

### Task 1 — Phân giải asset ở server

- [x] emoji → `{ ref, kind, glyph }` từ `emoji_registry`.
- [x] image → `{ ref, kind, url, width, height }`.
- [x] audio → `{ ref, kind, url, duration_ms }`.
- [x] `BR-CFG-07` ca âm: không chuỗi bucket/CDN nào trong `apps/web`.
- [x] Asset thiếu → `{ ref, kind, error: "not_found" }`, response vẫn **200**.
- [x] Ca âm: xoá ảnh khỏi storage → 200 + placeholder, trẻ chơi hết level.

### Task 2 — Ba route config

- [x] `GET /api/guest/levels/{code}/config`.
- [x] `GET /api/users/levels/{code}/config`.
- [x] `GET /api/managers/levels/{code}/config?version=`.
- [x] Cả ba gọi `assertContentAccess()`; cổng P1.3 canh.
- [x] Guest/User luôn lấy bản `published` mới nhất; chỉ Manager chọn version.
- [x] 403 `TIER_LOCKED` · 404 `NOT_FOUND` · 428 `NO_ACTIVE_CHILD` · 402 `DAILY_PLAY_CAP_REACHED` · 500 `CONTENT_PACK_INVALID`.
- [x] Level `archived` giữa lúc mở: phiên đang có chạy tiếp, yêu cầu mới → 404.
- [x] Chạy lại **20 ô** ma trận gating qua route này.

### Task 3 — Parse lại và đường hỏng

- [x] `BR-CFG-03` parse `content_pack` bằng **Zod thật**, mỗi request.
- [x] Parse fail → **500** `CONTENT_PACK_INVALID` + alert.
- [x] Ca âm: sửa tay `content_pack` trong DB thành sai schema → 500 + alert.
- [x] Không cache "kết quả parse hợp lệ"; cache payload thì key gồm `content_version`.

### Task 4 — Hàng phiên tối thiểu (`D-FR`)

- [x] 200 tạo đúng **một** hàng `play_sessions`.
- [x] Cột: `uuid` · `child_id` · `level_code` · `content_version` · `is_preview` · `started_at`.
- [x] `BR-CFG-02` `content_version` có trong payload **và** trong hàng phiên.
- [x] Ca âm: payload thiếu `session.uuid` → lỗi.
- [x] Preview Manager → `is_preview = true`.
- [x] Ghi nợ: heartbeat · timeout · abandon · resume · đóng phiên → **P1.6**.

### Task 5 — Hai chế độ cache

- [x] `BR-CFG-04` bậc ≥ `login` → `private, no-store`.
- [x] `BR-CFG-05` bậc `free` → `public, max-age` ≤ 300.
- [x] Ca âm chiều 1: config `premium` mang `public` → đỏ.
- [x] Ca âm chiều 2: config `free` mang `no-store` → đỏ.
- [x] Kiểm header thật, không suy đoán hành vi proxy.

### Task 6 — Ngân sách payload và preload

- [x] `BR-CFG-08` payload ≤ **200 KB** gzipped trên **mọi** level đã seed.
- [x] Vượt ngân sách → **chặn merge** (cơ chế của P1.1).
- [x] Ca âm: level phình payload → cổng đỏ.
- [x] Client preload **toàn bộ** asset trước `start()`.
- [x] Ca âm: bắt đầu chơi khi asset chưa tải xong → lỗi.
- [x] `BR-CFG-01` ca âm E2E: từ `start` tới `complete` chỉ có request gửi event.
- [x] Ghi nợ `D-FV`: chạy lại cổng này trên ≥120 level ở **P1.11**.

## Cổng dừng

- [x] Trẻ mở level thật → engine nhận config thật → chơi hết, không request ngoài event.
- [x] 20/20 ô gating chạy lại qua route config.
- [x] Mọi level mẫu ≤200 KB gz.
- [x] Cache đúng cả hai chiều.
- [x] `content_pack` hỏng → 500 + alert, không tới engine.
- [x] `pnpm check && pnpm test && pnpm test:e2e && pnpm lint:specs && pnpm check:progress` xanh.

---

## Task 7 — Nối engine, evidence, promote

- [x] `apps/web/app/pages/play/[code].vue` mount engine bằng config **thật**, bỏ fixture P1.2.
- [x] E2E: mỗi `GT-001`…`GT-006` chơi được từ config thật.
- [x] Mỗi `BR-CFG-*` có test tham chiếu mã rule.
- [x] [`game-config-delivery.md`](../specs/04-play/game-config-delivery.md) → `implemented`.
- [x] Tick **P1.4** ở [`14-implementation-sequence-todo.md`](14-implementation-sequence-todo.md) khi `check:progress` tự xanh.

## Câu hỏi mở chuyển tiếp

- [x] Q1 đáp án lộ trong payload — **P4**, chủ Backend. Ghi rõ: P1 không chấm ở server, `BR-CFG-06` chưa ràng buộc template nào (`D-FU`).
