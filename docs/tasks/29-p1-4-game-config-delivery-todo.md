# Checklist — Task #29: P1.4 — Giao config game đã lọc quyền

> Kế hoạch: [`29-p1-4-game-config-delivery-plan.md`](29-p1-4-game-config-delivery-plan.md).
> Ràng buộc kéo ngược nhau: **đủ** · **≤200 KB gz** · **đã qua gating**.
> Cạnh ngược trong P1: tạo phiên thuộc P1.6 — xử bằng `D-FR` (hàng tối thiểu ở đây).
>
> ```
> export PATH=/Users/macbook/.nvm/versions/node/v24.15.0/bin:$PATH
> ```

## Preflight

- [ ] **P1.3 đã đóng** — `assertContentAccess()` là đường duy nhất, cổng đếm handler chạy.
- [ ] **P1.2 đã đóng** — contract Zod + sáu template.
- [ ] **P0.9 đã đóng** — `emoji_registry` có dữ liệu để phân giải glyph.
- [ ] Human approve kế hoạch và năm quyết định D-FR · D-FS · D-FT · D-FU · D-FV.
- [ ] Đối chiếu `BR-CFG-*` với [`business-rules.md`](../specs/00-foundation/business-rules.md).
- [ ] Tạo nhánh riêng.

---

### Task 1 — Phân giải asset ở server

- [ ] emoji → `{ ref, kind, glyph }` từ `emoji_registry`.
- [ ] image → `{ ref, kind, url, width, height }`.
- [ ] audio → `{ ref, kind, url, duration_ms }`.
- [ ] `BR-CFG-07` ca âm: không chuỗi bucket/CDN nào trong `apps/web`.
- [ ] Asset thiếu → `{ ref, kind, error: "not_found" }`, response vẫn **200**.
- [ ] Ca âm: xoá ảnh khỏi storage → 200 + placeholder, trẻ chơi hết level.

### Task 2 — Ba route config

- [ ] `GET /api/guest/levels/{code}/config`.
- [ ] `GET /api/users/levels/{code}/config`.
- [ ] `GET /api/managers/levels/{code}/config?version=`.
- [ ] Cả ba gọi `assertContentAccess()`; cổng P1.3 canh.
- [ ] Guest/User luôn lấy bản `published` mới nhất; chỉ Manager chọn version.
- [ ] 403 `TIER_LOCKED` · 404 `NOT_FOUND` · 428 `NO_ACTIVE_CHILD` · 402 `DAILY_PLAY_CAP_REACHED` · 500 `CONTENT_PACK_INVALID`.
- [ ] Level `archived` giữa lúc mở: phiên đang có chạy tiếp, yêu cầu mới → 404.
- [ ] Chạy lại **20 ô** ma trận gating qua route này.

### Task 3 — Parse lại và đường hỏng

- [ ] `BR-CFG-03` parse `content_pack` bằng **Zod thật**, mỗi request.
- [ ] Parse fail → **500** `CONTENT_PACK_INVALID` + alert.
- [ ] Ca âm: sửa tay `content_pack` trong DB thành sai schema → 500 + alert.
- [ ] Không cache "kết quả parse hợp lệ"; cache payload thì key gồm `content_version`.

### Task 4 — Hàng phiên tối thiểu (`D-FR`)

- [ ] 200 tạo đúng **một** hàng `play_sessions`.
- [ ] Cột: `uuid` · `child_id` · `level_code` · `content_version` · `is_preview` · `started_at`.
- [ ] `BR-CFG-02` `content_version` có trong payload **và** trong hàng phiên.
- [ ] Ca âm: payload thiếu `session.uuid` → lỗi.
- [ ] Preview Manager → `is_preview = true`.
- [ ] Ghi nợ: heartbeat · timeout · abandon · resume · đóng phiên → **P1.6**.

### Task 5 — Hai chế độ cache

- [ ] `BR-CFG-04` bậc ≥ `login` → `private, no-store`.
- [ ] `BR-CFG-05` bậc `free` → `public, max-age` ≤ 300.
- [ ] Ca âm chiều 1: config `premium` mang `public` → đỏ.
- [ ] Ca âm chiều 2: config `free` mang `no-store` → đỏ.
- [ ] Kiểm header thật, không suy đoán hành vi proxy.

### Task 6 — Ngân sách payload và preload

- [ ] `BR-CFG-08` payload ≤ **200 KB** gzipped trên **mọi** level đã seed.
- [ ] Vượt ngân sách → **chặn merge** (cơ chế của P1.1).
- [ ] Ca âm: level phình payload → cổng đỏ.
- [ ] Client preload **toàn bộ** asset trước `start()`.
- [ ] Ca âm: bắt đầu chơi khi asset chưa tải xong → lỗi.
- [ ] `BR-CFG-01` ca âm E2E: từ `start` tới `complete` chỉ có request gửi event.
- [ ] Ghi nợ `D-FV`: chạy lại cổng này trên ≥120 level ở **P1.11**.

## Cổng dừng

- [ ] Trẻ mở level thật → engine nhận config thật → chơi hết, không request ngoài event.
- [ ] 20/20 ô gating chạy lại qua route config.
- [ ] Mọi level mẫu ≤200 KB gz.
- [ ] Cache đúng cả hai chiều.
- [ ] `content_pack` hỏng → 500 + alert, không tới engine.
- [ ] `pnpm check && pnpm test && pnpm test:e2e && pnpm lint:specs && pnpm check:progress` xanh.

---

## Task 7 — Nối engine, evidence, promote

- [ ] `apps/web/app/pages/play/[code].vue` mount engine bằng config **thật**, bỏ fixture P1.2.
- [ ] E2E: mỗi `GT-001`…`GT-006` chơi được từ config thật.
- [ ] Mỗi `BR-CFG-*` có test tham chiếu mã rule.
- [ ] [`game-config-delivery.md`](../specs/04-play/game-config-delivery.md) → `implemented`.
- [ ] Tick **P1.4** ở [`14-implementation-sequence-todo.md`](14-implementation-sequence-todo.md) khi `check:progress` tự xanh.

## Câu hỏi mở chuyển tiếp

- [ ] Q1 đáp án lộ trong payload — **P4**, chủ Backend. Ghi rõ: P1 không chấm ở server, `BR-CFG-06` chưa ràng buộc template nào (`D-FU`).
