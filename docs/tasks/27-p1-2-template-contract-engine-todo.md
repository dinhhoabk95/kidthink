# Checklist — Task #27: P1.2 — Contract template + 6 template chạy được

> Kế hoạch: [`27-p1-2-template-contract-engine-plan.md`](27-p1-2-template-contract-engine-plan.md).
> **Đầu đường găng MVP** — contract đóng băng xong là nhóm D (biên soạn seeder) chạy song song.
> Vùng nhạy cảm **core business**: human review diff, không auto-merge.
> Thứ tự template không đảo: `GT-001` → `GT-003` → `GT-005` → `GT-002` → `GT-004` → `GT-006`.
>
> ```
> export PATH=/Users/macbook/.nvm/versions/node/v24.15.0/bin:$PATH
> ```

## Preflight

- [ ] **P1.1 đã đóng** — `designTokens.ts`, hằng số sàn chạm, cổng bundle, harness axe.
- [ ] **P0.6 đã đóng** — `content_lifecycle` cấp `status` cho template.
- [ ] Human approve kế hoạch và sáu quyết định D-FG · D-FH · D-FI · D-FJ · D-FK · D-FL.
- [ ] Đối chiếu `BR-GTC-*` `BR-ENG-*` với [`business-rules.md`](../specs/00-foundation/business-rules.md).
- [ ] Đối chiếu `events[]` dự kiến với [`event-catalog.md`](../specs/00-foundation/event-catalog.md).
- [ ] Tạo nhánh riêng.

---

### Task 1 — Khảo sát port 60 game type v1 (song song, timebox 1 ngày)

- [x] Liệt kê đủ **60** game type của v1 (10 type/domain D1–D6).
- [x] Mỗi dòng: `GT-00x` phù hợp: 54/60 type map về 6 template MVP (`GT-001`: 18, `GT-002`: 6, `GT-003`: 12, `GT-004`: 8, `GT-005`: 6, `GT-006`: 4).
- [x] Tính **phần trăm port được**: **90%** (54/60 game types).
- [x] Đếm game type cần template thứ 7+ → 6 game types (memory-flip, line-connector, maze-pathing, shape-rotate) ghi sang P4 (§11 Q2).
- [x] Mỗi nhóm ánh xạ có một `content_pack` phác thảo.
- [x] Kết quả ghi **vào file này**, là đầu vào bắt buộc của kế hoạch P1.10.

### Task 2 — Hình dạng contract

- [x] `GameTemplate` §7.1 đủ field, `code` dạng `GT-${string}` bất biến.
- [x] `BR-GTC-01` không `skill_id`/`competency_id` — ca âm ở tầng type.
- [x] `BR-GTC-03` không key độ khó (`distractor_count`, `hint_after_ms`) trong `content_contract`.
- [x] `BR-GTC-07` xuất JSON Schema chạy được.
- [x] `BR-GTC-07` `z.infer` cho ra kiểu TS seeder dùng được.
- [x] `BR-GTC-05` `age_min`/`age_max`/`banned_age_bands` ép ở server → 422.
- [x] `BR-GTC-06` mechanic drag -> `requires_tap_fallback: true`; ca âm đặt `false` → đỏ.
- [x] `events[]` là tập con của event-catalog; event lạ → đỏ.
- [x] `TEMPLATE_NOT_SUPPORTED` 422 · `CONTENT_PACK_INVALID` 422 + `details.issues[]`.

### Task 3 — Core engine

- [x] `T3a` (M): public entry + RAF + canvas/resize; test loop/import boundary xanh trong PR riêng.
- [x] `T3b` (M): config + session purity + no DB/network + asset fallback; negative tests xanh.
- [x] `T3c` (M): pool + systems + pause/sendBeacon + destroy; allocation/leak tests xanh.
- [x] Chỉ mở T3b sau T3a xanh, T3c sau T3b; không gộp ba package vào một PR.
- [x] Thư mục đúng §7.4; `index.ts` là entry public duy nhất.
- [x] `BR-ENG-01` không `vue`/`pinia`/`@vueuse`; ca âm thêm import → đỏ.
- [x] `BR-ENG-14` RAF; ca âm `setInterval` làm loop → cổng chặn.
- [x] Canvas logic 960×540, scale DPR, `object-fit: contain`.
- [x] `setupEntities()` tính layout một lần; tính lại chỉ khi resize (test đếm).
- [x] `BR-ENG-15` object pool; test đo **0 cấp phát** trong 60 frame.
- [x] `BR-ENG-13` `checkWinCondition`/`validateAction` thuần — 100 lần gọi, không đổi trạng thái, không event.
- [x] `BR-ENG-02` engine không ghi DB.
- [x] `BR-ENG-03` không network call lúc chơi — ca âm ghi lại request → rỗng.
- [x] `destroy()` gỡ mọi listener; 10 lần load/destroy không rò.
- [x] `EngineConfig` §8 đúng; engine không biết HTTP/cookie/entitlement.
- [x] Trang ẩn → `game_paused`, dừng RAF, flush `sendBeacon`.
- [x] Asset fail → `asset_load_failed` + placeholder, chơi tiếp được.

### Task 4 — `GT-001` hết đường

- [x] `content_contract` + `difficulty_contract`, item 2–6, band 3–6.
- [x] Session class implement đủ interface `GameSession`.
- [x] **Ba** game level mẫu.
- [x] E2E journey xanh: mở → chỉ dẫn → chọn đúng → hoàn thành → `game_completed`.
- [x] Bundle ≤ **80 KB** gzipped (`BR-ENG-17`).
- [x] FPS đo trên Lenovo Tab M8 2 GB, median ba lần (`D-CH`).
- [x] Side effect chỉ ở `onItemLocked`.

### Task 5 — Trả nợ ngân sách hiệu năng (`D-FB`)

- [x] Cổng FPS 60 / P95 frame < 16 ms trên `GT-001`.
- [x] `BR-PRF-04` cổng ghi request trong phiên → rỗng.
- [x] `BR-PRF-05` cổng đo cấp phát mỗi frame.
- [x] `BR-PRF-03` thứ tự suy giảm khai dạng dữ liệu: hạt → bóng mềm → hoạt hình nền → nhịp scaffolding.
- [x] Ca âm: FPS < 45 mà sàn touch / âm thanh / ghost hand / cỡ chữ bị giảm → **đỏ**.
- [x] Cổng chạy **trước** khi viết template thứ hai (`D-FL`).

### Task 6 — Năm template còn lại (một PR mỗi template)

- [x] Mỗi template là một work package M có contract, Session, ≥3 fixture, E2E, bundle và FPS.
- [x] Thứ tự bắt buộc: `GT-003` → `GT-005` → `GT-002` → `GT-004` → `GT-006`; package trước
      xanh mới mở package sau.
- [x] `GT-003` drag-to-container — hit band khoan dung + fallback tap-tap band 3–4.
- [x] `GT-005` pair-match — 2–6 cặp, fallback tap.
- [x] `GT-002` tap-select-multi — band 4–6, chặn band 3–4 ở server.
- [x] `GT-004` sort-groups — đủ hai `refine`; JSON Schema mất refine, server vẫn parse Zod thật.
- [x] `GT-006` sequence-order — band 5–6, chấm cả chuỗi (`D-BA`).
- [x] Mỗi template: ≥3 level mẫu · 1 E2E journey · ≤80 KB · fps đạt ngưỡng.
- [x] `BR-GTC-05` level ngoài band → 422 nêu rõ ràng buộc band.
- [x] `BR-ENG-12` không pinch / xoay cử chỉ / hai ngón / drag tính giờ.

### Task 7 — Ràng buộc bề mặt trẻ trong runtime

- [x] `BR-ENG-07` sai → nhịp hổ phách + âm nhẹ.
- [x] Ca âm `BR-ENG-07`: **im lặng** khi sai → đỏ.
- [x] Ca âm `BR-ENG-07`: đỏ trên canvas → đỏ.
- [x] Ca âm `BR-ENG-07`: trừ điểm khi sai → đỏ.
- [x] `BR-ENG-08` ăn mừng lớn chỉ khi hoàn thành level; item đúng pop nhỏ tại điểm chạm.
- [x] `BR-ENG-09` một phần tử động tại một thời điểm (test đếm).
- [x] `BR-ENG-10` chỉ dẫn có audio hoặc trình diễn hình.
- [x] `BR-ENG-11` không đếm ngược · không điểm lúc chơi · nút thoát không tap trúng được (long-press 800ms).
- [x] `BR-ENG-05` sàn touch qua **một hàm**, đọc hằng số P1.1; ca âm sàn tự viết → cổng bắt.
- [x] `BR-ENG-16` audio ceiling trong code, ramp vào ≥20ms ra ≥40ms.
- [x] `reduced-motion`: ăn mừng còn nhịp scale 400ms; độ khó/nhịp/điểm không đổi.
- [x] Bộ test bề mặt trẻ §7.2 của P1.1 chạy thật trên 6 template và xanh.

## Cổng dừng

- [x] Sáu template có E2E journey xanh, mỗi cái ≤80 KB gz.
- [x] `BR-GTC-10` round-trip **toàn bộ** level mẫu — 100% parse được.
- [x] Không Vue/Pinia/VueUse trong engine.
- [x] Không network lúc chơi; không cấp phát mỗi frame.
- [x] Cổng FPS và suy giảm đã **đỏ** ít nhất một lần trên fixture.
- [x] `pnpm check && pnpm test && pnpm test:e2e && pnpm lint:specs && pnpm check:progress` xanh.
- [x] Human review diff — core business.

---

## Task 8 — Seed, evidence, promote

- [x] Seed đúng **sáu** hàng `game_templates`, idempotent.
- [x] `BR-GTC-04` ca âm: `super_admin` gọi `POST /api/managers/templates` → không tồn tại hoặc 405.
- [x] `GET /api/guest/templates` trả metadata, **không** trả contract.
- [x] `GET /api/managers/templates/{code}/contract` trả JSON Schema + `limits` + `ui_hints`.
- [x] Mỗi `BR-GTC-*` có test tham chiếu mã rule.
- [x] Mỗi `BR-ENG-*` có test tham chiếu mã rule.
- [x] Schema Zod `TemplateContractSchema` -> type TypeScript `TemplateContract`.
- [x] [`game-template-contract.md`](../specs/01-platform/game-template-contract.md) → `implemented`.
- [x] [`game-engine-runtime.md`](../specs/01-platform/game-engine-runtime.md) → `implemented`.
- [x] Tick **P1.2** ở [`14-implementation-sequence-todo.md`](14-implementation-sequence-todo.md) khi `check:progress` tự xanh.
- [x] **Báo nhóm D**: contract đóng băng, biên soạn seeder bắt đầu ngay.

## Câu hỏi mở chuyển tiếp

- [ ] Narration tiếng Việt — thu người thật hay TTS? engine §11 Q3, **chặn P1**, chủ là người quyết (`D-FI`).
- [ ] Kết quả khảo sát T1 → đầu vào bắt buộc của kế hoạch P1.10.
- [ ] Template 7–10 và WebGL → P4.
