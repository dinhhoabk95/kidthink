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

- [ ] Liệt kê đủ **60** game type của v1.
- [ ] Mỗi dòng: `GT-00x` phù hợp, hoặc lý do không port được.
- [ ] Tính **phần trăm port được**.
- [ ] Đếm game type cần template thứ 7+ → ghi sang P4 (§11 Q2).
- [ ] Mỗi nhóm ánh xạ có một `content_pack` phác thảo.
- [ ] Kết quả ghi **vào file này**, là đầu vào bắt buộc của kế hoạch P1.10.

### Task 2 — Hình dạng contract

- [ ] `GameTemplate` §7.1 đủ field, `code` dạng `GT-${string}` bất biến.
- [ ] `BR-GTC-01` không `skill_id`/`competency_id` — ca âm ở tầng type.
- [ ] `BR-GTC-03` không key độ khó (`distractor_count`, `hint_after_ms`) trong `content_contract`.
- [ ] `BR-GTC-07` xuất JSON Schema chạy được.
- [ ] `BR-GTC-07` `z.infer` cho ra kiểu TS seeder dùng được.
- [ ] `BR-GTC-05` `age_min`/`age_max`/`banned_age_bands` ép ở server → 422.
- [ ] `BR-GTC-06` mechanic drag -> `requires_tap_fallback: true`; ca âm đặt `false` → đỏ.
- [ ] `events[]` là tập con của event-catalog; event lạ → đỏ.
- [ ] `TEMPLATE_NOT_SUPPORTED` 422 · `CONTENT_PACK_INVALID` 422 + `details.issues[]`.

### Task 3 — Core engine

- [ ] `T3a` (M): public entry + RAF + canvas/resize; test loop/import boundary xanh trong PR riêng.
- [ ] `T3b` (M): config + session purity + no DB/network + asset fallback; negative tests xanh.
- [ ] `T3c` (M): pool + systems + pause/sendBeacon + destroy; allocation/leak tests xanh.
- [ ] Chỉ mở T3b sau T3a xanh, T3c sau T3b; không gộp ba package vào một PR.
- [ ] Thư mục đúng §7.4; `index.ts` là entry public duy nhất.
- [ ] `BR-ENG-01` không `vue`/`pinia`/`@vueuse`; ca âm thêm import → đỏ.
- [ ] `BR-ENG-14` RAF; ca âm `setInterval` làm loop → cổng chặn.
- [ ] Canvas logic 960×540, scale DPR, `object-fit: contain`.
- [ ] `setupEntities()` tính layout một lần; tính lại chỉ khi resize (test đếm).
- [ ] `BR-ENG-15` object pool; test đo **0 cấp phát** trong 60 frame.
- [ ] `BR-ENG-13` `checkWinCondition`/`validateAction` thuần — 100 lần gọi, không đổi trạng thái, không event.
- [ ] `BR-ENG-02` engine không ghi DB.
- [ ] `BR-ENG-03` không network call lúc chơi — ca âm ghi lại request → rỗng.
- [ ] `destroy()` gỡ mọi listener; 10 lần load/destroy không rò.
- [ ] `EngineConfig` §8 đúng; engine không biết HTTP/cookie/entitlement.
- [ ] Trang ẩn → `game_paused`, dừng RAF, flush `sendBeacon`.
- [ ] Asset fail → `asset_load_failed` + placeholder, chơi tiếp được.

### Task 4 — `GT-001` hết đường

- [ ] `content_contract` + `difficulty_contract`, item 2–6, band 3–6.
- [ ] Session class implement đủ interface `GameSession`.
- [ ] **Ba** game level mẫu.
- [ ] E2E journey xanh: mở → chỉ dẫn → chọn đúng → hoàn thành → `game_completed`.
- [ ] Bundle ≤ **80 KB** gzipped (`BR-ENG-17`).
- [ ] FPS đo trên Lenovo Tab M8 2 GB, median ba lần (`D-CH`).
- [ ] Side effect chỉ ở `onItemLocked`.

### Task 5 — Trả nợ ngân sách hiệu năng (`D-FB`)

- [ ] Cổng FPS 60 / P95 frame < 16 ms trên `GT-001`.
- [ ] `BR-PRF-04` cổng ghi request trong phiên → rỗng.
- [ ] `BR-PRF-05` cổng đo cấp phát mỗi frame.
- [ ] `BR-PRF-03` thứ tự suy giảm khai dạng dữ liệu: hạt → bóng mềm → hoạt hình nền → nhịp scaffolding.
- [ ] Ca âm: FPS < 45 mà sàn touch / âm thanh / ghost hand / cỡ chữ bị giảm → **đỏ**.
- [ ] Cổng chạy **trước** khi viết template thứ hai (`D-FL`).

### Task 6 — Năm template còn lại (một PR mỗi template)

- [ ] Mỗi template là một work package M có contract, Session, ≥3 fixture, E2E, bundle và FPS.
- [ ] Thứ tự bắt buộc: `GT-003` → `GT-005` → `GT-002` → `GT-004` → `GT-006`; package trước
      xanh mới mở package sau.
- [ ] `GT-003` drag-to-container — hit band khoan dung + fallback tap-tap band 3–4.
- [ ] `GT-005` pair-match — 2–6 cặp, fallback tap.
- [ ] `GT-002` tap-select-multi — band 4–6, chặn band 3–4 ở server.
- [ ] `GT-004` sort-groups — đủ hai `refine`; JSON Schema mất refine, server vẫn parse Zod thật.
- [ ] `GT-006` sequence-order — band 5–6, chấm cả chuỗi (`D-BA`).
- [ ] Mỗi template: ≥3 level mẫu · 1 E2E journey · ≤80 KB · fps đạt ngưỡng.
- [ ] `BR-GTC-05` level ngoài band → 422 nêu rõ ràng buộc band.
- [ ] `BR-ENG-12` không pinch / xoay cử chỉ / hai ngón / drag tính giờ.

### Task 7 — Ràng buộc bề mặt trẻ trong runtime

- [ ] `BR-ENG-07` sai → nhịp hổ phách + âm nhẹ.
- [ ] Ca âm `BR-ENG-07`: **im lặng** khi sai → đỏ.
- [ ] Ca âm `BR-ENG-07`: đỏ trên canvas → đỏ.
- [ ] Ca âm `BR-ENG-07`: trừ điểm khi sai → đỏ.
- [ ] `BR-ENG-08` ăn mừng lớn chỉ khi hoàn thành level; item đúng pop nhỏ tại điểm chạm.
- [ ] `BR-ENG-09` một phần tử động tại một thời điểm (test đếm).
- [ ] `BR-ENG-10` chỉ dẫn có audio hoặc trình diễn hình.
- [ ] `BR-ENG-11` không đếm ngược · không điểm lúc chơi · nút thoát không tap trúng được (long-press 800ms).
- [ ] `BR-ENG-05` sàn touch qua **một hàm**, đọc hằng số P1.1; ca âm sàn tự viết → cổng bắt.
- [ ] `BR-ENG-16` audio ceiling trong code, ramp vào ≥20ms ra ≥40ms.
- [ ] `reduced-motion`: ăn mừng còn nhịp scale 400ms; độ khó/nhịp/điểm không đổi.
- [ ] Bộ test bề mặt trẻ §7.2 của P1.1 chạy thật trên 6 template và xanh.

## Cổng dừng

- [ ] Sáu template có E2E journey xanh, mỗi cái ≤80 KB gz.
- [ ] `BR-GTC-10` round-trip **toàn bộ** level mẫu — 100% parse được.
- [ ] Không Vue/Pinia/VueUse trong engine.
- [ ] Không network lúc chơi; không cấp phát mỗi frame.
- [ ] Cổng FPS và suy giảm đã **đỏ** ít nhất một lần trên fixture.
- [ ] `pnpm check && pnpm test && pnpm test:e2e && pnpm lint:specs && pnpm check:progress` xanh.
- [ ] Human review diff — core business.

---

## Task 8 — Seed, evidence, promote

- [ ] Seed đúng **sáu** hàng `game_templates`, idempotent.
- [ ] `BR-GTC-04` ca âm: `super_admin` gọi `POST /api/managers/templates` → không tồn tại hoặc 405.
- [ ] `GET /api/guest/templates` trả metadata, **không** trả contract.
- [ ] `GET /api/managers/templates/{code}/contract` trả JSON Schema + `limits` + `ui_hints`.
- [ ] Mỗi `BR-GTC-*` có test tham chiếu mã rule.
- [ ] Mỗi `BR-ENG-*` có test tham chiếu mã rule.
- [ ] Schema Zod `TemplateContractSchema` -> type TypeScript `TemplateContract`.
- [ ] [`game-template-contract.md`](../specs/01-platform/game-template-contract.md) → `implemented`.
- [ ] [`game-engine-runtime.md`](../specs/01-platform/game-engine-runtime.md) → `implemented`.
- [ ] Tick **P1.2** ở [`14-implementation-sequence-todo.md`](14-implementation-sequence-todo.md) khi `check:progress` tự xanh.
- [ ] **Báo nhóm D**: contract đóng băng, biên soạn seeder bắt đầu ngay.

## Câu hỏi mở chuyển tiếp

- [ ] Narration tiếng Việt — thu người thật hay TTS? engine §11 Q3, **chặn P1**, chủ là người quyết (`D-FI`).
- [ ] Kết quả khảo sát T1 → đầu vào bắt buộc của kế hoạch P1.10.
- [ ] Template 7–10 và WebGL → P4.
