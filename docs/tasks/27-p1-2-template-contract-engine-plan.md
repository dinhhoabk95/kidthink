# Kế hoạch — Task #27: P1.2 — Contract template + 6 template chạy được

> Viết 2026-08-09. Bước sở hữu: **P1.2** của
> [`14-implementation-sequence-todo.md`](14-implementation-sequence-todo.md).
> Spec sở hữu: [`game-template-contract.md`](../specs/01-platform/game-template-contract.md) ·
> [`game-engine-runtime.md`](../specs/01-platform/game-engine-runtime.md).
>
> ```
> export PATH=/Users/macbook/.nvm/versions/node/v24.15.0/bin:$PATH
> ```

## Tóm tắt

Bước nặng nhất của P1 và là **đầu đường găng**: nhóm D (biên soạn seeder nội dung) chỉ cần
[`game-template-contract.md`](../specs/01-platform/game-template-contract.md) xong là chạy được
song song, và đó là chuỗi dài nhất của MVP. Mỗi ngày P1.2 trễ là một ngày biên soạn ≥120 level
chưa bắt đầu được.

Hai spec, hai tầng:

1. **Contract** — hình dạng `GameTemplate`, `content_contract` và `difficulty_contract` bằng Zod,
   sáu template `GT-001`…`GT-006`. Đây là thứ nhóm D cần, và cần **trước**.
2. **Runtime** — TypeScript thuần trên Canvas 2D, 960×540 logic, 60 fps trên tablet Android 2GB.
   17 `BR-ENG-*`, phần lớn là **cấm**.

Quyết định kiến trúc nền: **template không gắn skill** (`BR-GTC-01`). Một template phục vụ
hàng chục mục tiêu học tập qua `content_pack`. Gắn skill vào template là mất toàn bộ giá trị
của mô hình — và không phát hiện được bằng test, chỉ phát hiện bằng việc phải viết template
thứ 61.

## 0. Điều kiện tiên quyết

| Dep | Trạng thái | Ghi chú |
|---|---|---|
| `GLOSSARY` · `ID-CONVENTIONS` | P0.2 đã xong | mã `GT-*` bất biến |
| `GAME-TAXONOMY` | P0.7 | enum `game_type` |
| `SCHEMA-CONTENT-TAXONOMY` | P0.7 đã xong | bảng `game_templates` đã có cột (`D-BR`, contract-only) |
| `AI-CODEGEN-PIPELINE` | P0.0 đã xong | vùng cấm đã xác lập trước (`D-BS`) |
| `EVENT-CATALOG` | P0 registry | `events[]` của template là **tập con** của catalog |
| `DESIGN-SYSTEM-CONTRACT` · `ACCESSIBILITY` | **P1.1** | `designTokens.ts`, sàn chạm một nguồn |
| `PERFORMANCE-BUDGETS` phần FPS | **nợ từ P1.1** | `D-FB` — trả ở bước này |

`D-CG` đã chốt: P0 **không** seed sáu hàng `game_templates` rỗng. Bước này tạo chúng lần đầu,
cùng contract và runtime thật.

## 1. Đo được

### 1.1 Đã có

`packages/game-engine/src/index.ts` là `export {};`. Bảng `game_templates` có cột từ P0.7,
**không** có hàng. Sau P1.1: `designTokens.ts`, hằng số sàn chạm, `pnpm lint:tokens` mở rộng,
harness axe, ngân sách bundle.

### 1.2 Chưa có

Toàn bộ §7.4 của [`game-engine-runtime.md`](../specs/01-platform/game-engine-runtime.md):
`core.ts`, `interaction.ts`, `gameSession.ts`, `mechanics/`, `pipeline/`, `systems/`, `utils/`,
sáu thư mục `templates/GT-00*/`. Không có `content_contract` nào, không có Session class nào.

### 1.3 Hai câu hỏi mở **chặn P1**, cả hai chủ là người

| Câu | Ở đâu | Chặn gì |
|---|---|---|
| 60 game type của v1 port sang 6 template được bao nhiêu %? | template-contract §11 Q1 — "khảo sát **trước khi vào P1**" | Phạm vi P1.10–P1.11 (≥120 level) |
| Narration tiếng Việt: thu âm người thật hay TTS? | engine §11 Q3, chặn **P1** | Ngân sách bundle, `BR-ENG-10`, chi phí biên soạn |

Cả hai xử ở `D-FG` và `D-FI`. Không cái nào chặn `GT-001` chạy được.

## 2. Quyết định

**D-FG — khảo sát port v1 là Task 1, timebox, kết quả thành dữ liệu.** §11 Q1 nói "khảo sát
trước khi vào P1" nhưng không nói khảo sát chặn cái gì. Đo lại: nó chặn **cam kết ≥120 level**
(P1.10–P1.11), **không** chặn việc contract và engine chạy được. Xử: khảo sát 60 game type v1
→ bảng ánh xạ `game type v1 → GT-00x + phác thảo content_pack`, ghi thẳng vào todo của bước
này. Số phần trăm port được là **đầu vào bắt buộc** cho kế hoạch P1.10, không phải cho P1.2.

**D-FH — vertical slice theo template, không horizontal theo tầng.** Cấm "viết cả 6
`content_contract` → viết cả 6 Session class → viết cả 6 bộ level mẫu". Làm `GT-001` **hết
đường**: contract → Session → 3 level mẫu → E2E journey → đo bundle → đo fps. Chỉ khi `GT-001`
xanh mới sang `GT-003`. Lý do: sai lầm ở tầng `GameSession` phát hiện ở template đầu tiên tốn
một lần sửa; phát hiện sau khi viết cả sáu tốn sáu lần. Đây cũng là nguyên tắc 5 của
[`roadmap.md`](../specs/roadmap.md).

**Thứ tự sáu template:** `GT-001` (tap-select, đơn giản nhất, không drag) → `GT-003`
(drag-to-container, lần đầu chạm `BR-ENG-06` fallback tap) → `GT-005` (pair-match) → `GT-002`
(tap-select-multi) → `GT-004` (sort-groups, contract phức tạp nhất, có 2 `refine`) → `GT-006`
(sequence-order, band hẹp nhất 5–6).

**D-FI — engine nhận narration là **tham chiếu asset**, nguồn âm thanh là quyết định của
P1.10.** `BR-ENG-10` bắt mọi chỉ dẫn phải đọc thành tiếng hoặc trình diễn bằng hình. Engine chỉ
cần `prompt_audio_ref` và một đường trình diễn hình — nó **không** cần biết file đó do người
thu hay TTS sinh. Nêu lại câu hỏi cho chủ **ngay ở bước này** vì nó ảnh hưởng ngân sách bundle
và chi phí biên soạn 120 level, nhưng không chặn P1.2. Trong lúc chờ: dùng file placeholder,
và `BR-ENG-17` (≤80 KB/template) đo **không kể** asset audio — audio đi qua đường asset, không
qua bundle.

**D-FJ — `designTokens.ts` là bản sao có chủ đích, được cổng canh.** `BR-ENG-01` cấm engine
import Vue; `BR-DSC-02` cấm hex ngoài `designTokens.ts`. Nghĩa là engine **không** đọc được CSS
`@theme`. Bản sao là bắt buộc, và bản sao không có cổng là bản sao sẽ lệch — test đối chiếu giá
trị (P1.1 T1) và rule `dependency-cruiser` cấm `packages/game-engine` phụ thuộc `packages/ui`
là hai thứ giữ nó đúng.

**D-FK — Zod trong code là nguồn contract duy nhất; hàng DB giữ **bản xuất**.** `game_templates`
lưu metadata + JSON Schema đã xuất (cho studio sinh form ở P2.5). Cấm định nghĩa contract lần
hai trong DB. Xuất mất `refine` (`D-BK` đã chốt) — vì vậy server **luôn** parse lại bằng Zod
thật trước khi ghi (`BR-GTC-02`), và seeder dùng `z.infer` (`BR-GTC-07`).

**D-FL — trả nợ ngân sách FPS của P1.1 ở đây, không lùi tiếp.** `D-FB` ghi nợ `BR-PRF-03/04/05`
và ngưỡng FPS cho bước này. Chúng phải có cổng **trước khi** template thứ hai được viết —
không phải ở cuối bước, vì lúc đó tối ưu là refactor sáu Session class.

## 3. Đồ thị

```
T1 khảo sát port v1 (timebox, song song, không chặn T2)

T2 hình dạng GameTemplate + Zod contract + xuất JSON Schema + z.infer
      └──→ T3 core engine: RAF · canvas 960×540 · pool · destroy
                ├──→ T4 GT-001 hết đường (Session → 3 level mẫu → E2E → bundle → fps)
                │         └──→ T5 cổng FPS + BR-PRF-03/04/05 (nợ D-FB)
                │                   └──→ T6 GT-003 · GT-005 · GT-002 · GT-004 · GT-006
                └──→ T7 hệ thống ràng buộc bề mặt trẻ: phản hồi sai · ăn mừng · audio · a11y
                              ── Cổng dừng ──
  T8 seed 6 hàng game_templates · round-trip toàn bộ · evidence · promote
```

## 4. Task

### Task 1 — Khảo sát port 60 game type v1

**Tiêu chí nghiệm thu**
- [ ] Bảng ánh xạ đủ 60 game type v1: mỗi dòng ghi `GT-00x` phù hợp, hoặc lý do **không** port được.
- [ ] Tính ra **phần trăm port được** và số game type cần template thứ 7+ (đưa sang P4, §11 Q2).
- [ ] Với mỗi nhóm ánh xạ, phác thảo một `content_pack` mẫu chứng minh contract đủ chỗ chứa.
- [ ] Kết quả ghi vào todo của bước này — là **đầu vào bắt buộc** khi lập kế hoạch P1.10.
- [ ] Timebox: không quá một ngày công. Không đủ dữ liệu thì ghi "chưa đo được" kèm cái đã đo.

**Kiểm chứng**
- [ ] Bảng nằm trong repo, không nằm trong hội thoại.

**Phụ thuộc:** không — chạy song song T2 · **Cỡ:** S

### Task 2 — Hình dạng contract

**Tiêu chí nghiệm thu**
- [ ] `GameTemplate` §7.1 khai đúng: `code`, `mechanic`, `layouts`, hai contract Zod, `limits`, `age_min`/`age_max`, `banned_age_bands`, `requires_tap_fallback`, `asset_kinds`, `scoring`, `events`, `engine_session`, `status`, `version`.
- [ ] `BR-GTC-01`: không field `skill_id` hay `competency_id` ở bất kỳ đâu trong template; ca âm ở tầng type.
- [ ] `BR-GTC-03`: `content_pack` và `difficulty_params` tách; ca âm — `distractor_count`/`hint_after_ms` xuất hiện trong `content_contract` là **lỗi test**.
- [ ] `BR-GTC-07`: xuất JSON Schema chạy được, và `z.infer` cho ra kiểu TS dùng được ở seeder.
- [ ] `BR-GTC-05`: `age_min`/`age_max` và `banned_age_bands` ép được ở server — level ngoài band → 422.
- [ ] `BR-GTC-06`: mọi template có `mechanic` chứa `drag` bắt buộc `requires_tap_fallback: true`; ca âm — đặt `false` làm test đỏ.
- [ ] `events[]` là **tập con** của [`event-catalog.md`](../specs/00-foundation/event-catalog.md); event lạ → đỏ.
- [ ] Mã lỗi `TEMPLATE_NOT_SUPPORTED` (422) và `CONTENT_PACK_INVALID` (422 + `details.issues[]`) khớp registry.

**Kiểm chứng**
- [ ] `pnpm --filter @kidthink/game-engine test -- contract` xanh, assertion tham chiếu `BR-GTC-01` `BR-GTC-03` `BR-GTC-07`.

**Phụ thuộc:** không · **Cỡ:** M

### Task 3 — Core engine

**Tiêu chí nghiệm thu**
- [ ] Cấu trúc thư mục đúng §7.4; `index.ts` là entry public **duy nhất** (`BR-MPA-*` + dependency-cruiser).
- [ ] `BR-ENG-01`: không import `vue`, `pinia`, `@vueuse` — cổng quét, ca âm thêm import làm đỏ.
- [ ] `BR-ENG-14`: vòng lặp bằng RAF; ca âm — `setInterval`/`setTimeout` làm game loop bị cổng chặn.
- [ ] Canvas logic **cố định 960×540**, scale theo DPR, `object-fit: contain`; Session class chỉ dùng toạ độ logic.
- [ ] `setupEntities()` tính layout **một lần**, tính lại chỉ khi resize; test đếm số lần gọi.
- [ ] `BR-ENG-15`: object pool cho sprite/particle; test đo **0 cấp phát** trong 60 frame.
- [ ] `BR-ENG-13`: `checkWinCondition()` và `validateAction()` thuần — gọi 100 lần không đổi trạng thái, không phát event.
- [ ] `BR-ENG-02` `BR-ENG-03`: engine không ghi DB, không gọi mạng lúc chơi; ca âm ghi lại request từ start tới complete → rỗng.
- [ ] `destroy()` gỡ **mọi** listener và system; test khẳng định không rò listener sau 10 lần load/destroy.
- [ ] `EngineConfig` §8 đúng hình dạng; engine không biết HTTP, cookie, hay entitlement.
- [ ] `pause(reason)` xử lý trang ẩn: `game_paused`, dừng RAF, flush qua `sendBeacon`.
- [ ] Asset load fail → `asset_load_failed` + placeholder trung tính, **chơi tiếp được**.

**Kiểm chứng**
- [ ] `pnpm --filter @kidthink/game-engine test -- core` xanh, assertion tham chiếu `BR-ENG-01` `BR-ENG-13` `BR-ENG-14` `BR-ENG-15`.

**Phụ thuộc:** T2 · **Cỡ:** L — **tách nhỏ khi thực thi** (core loop / interaction / systems)

### Task 4 — `GT-001` hết đường

**Tiêu chí nghiệm thu**
- [ ] `content_contract` + `difficulty_contract` của `GT-001`, giới hạn item 2–6, band 3–6.
- [ ] Session class implement đủ `GameSession` §7.4 của template-contract.
- [ ] **Ba game level mẫu** chứng minh contract dùng được (yêu cầu §4 bước 4 của spec).
- [ ] E2E journey xanh: mở → chỉ dẫn → chọn đúng → hoàn thành → `game_completed`.
- [ ] `BR-ENG-17`: bundle template ≤ **80 KB** gzipped, đo bằng cổng của P1.1.
- [ ] Đo fps trên thiết bị chuẩn `D-CH`, median ba lần chạy.
- [ ] Side effect đi qua `onItemLocked`, **không** ở `validateAction`/`checkWinCondition`.

**Kiểm chứng**
- [ ] `pnpm test:e2e -- GT-001` xanh; `pnpm perf:budget` xanh.

**Phụ thuộc:** T3 · **Cỡ:** M

### Task 5 — Trả nợ ngân sách hiệu năng (`D-FB`)

**Tiêu chí nghiệm thu**
- [ ] Ngưỡng FPS 60 / P95 frame < 16 ms thành cổng, đo trên `GT-001`.
- [ ] `BR-PRF-04` = `BR-ENG-03`: cổng ghi lại request mạng trong phiên → rỗng.
- [ ] `BR-PRF-05` = `BR-ENG-15`: cổng đo cấp phát mỗi frame.
- [ ] `BR-PRF-03` thứ tự suy giảm §7.3 khai dạng **dữ liệu**: hạt → bóng mềm → hoạt hình nền → nhịp scaffolding.
- [ ] Ca âm: suy giảm **không** được chạm sàn touch, kênh âm thanh, ghost hand, cỡ chữ — test khẳng định các thứ này giữ nguyên khi FPS < 45.
- [ ] Cổng chạy **trước** khi viết template thứ hai (`D-FL`).

**Kiểm chứng**
- [ ] `pnpm test -- degradation` xanh, assertion tham chiếu `BR-PRF-03`.

**Phụ thuộc:** T4 · **Cỡ:** M

### Task 6 — Năm template còn lại

**Tiêu chí nghiệm thu** (lặp cho từng template, theo thứ tự `D-FH`)
- [ ] `GT-003` drag-to-container: hit band khoan dung + **fallback tap-tap** band 3–4 (`BR-ENG-06`).
- [ ] `GT-005` pair-match: 2–6 cặp, fallback tap.
- [ ] `GT-002` tap-select-multi: band **4–6**, chặn band 3–4 ở server.
- [ ] `GT-004` sort-groups: contract đủ hai `refine` (`everyItemTargetsAnExistingGroup`, `everyGroupHasAtLeastOneItem`); JSON Schema xuất ra **mất** refine — server vẫn parse Zod thật.
- [ ] `GT-006` sequence-order: band **5–6**, chấm cả chuỗi (`D-BA`).
- [ ] Mỗi template: ≥3 level mẫu, một E2E journey, bundle ≤80 KB, fps đạt ngưỡng.
- [ ] `BR-GTC-05`: level ngoài band của template → 422 kèm lý do nêu ràng buộc band.
- [ ] `BR-ENG-12`: không template nào dùng pinch, xoay cử chỉ, hai ngón, hay drag tính giờ.

**Kiểm chứng**
- [ ] `pnpm test:e2e` — mỗi `GT-001`…`GT-006` có ít nhất một journey xanh.

**Phụ thuộc:** T5 · **Cỡ:** L — **một PR mỗi template**

### Task 7 — Ràng buộc bề mặt trẻ trong runtime

**Tiêu chí nghiệm thu**
- [ ] `BR-ENG-07`: sai **phải** có phản hồi — nhịp hổ phách + âm nhẹ; **im lặng là defect**, đỏ là defect, trừ điểm là defect. Ba ca âm riêng.
- [ ] `BR-ENG-08`: ăn mừng lớn **chỉ** khi hoàn thành level; item đúng chỉ pop nhỏ **tại điểm chạm**.
- [ ] `BR-ENG-09`: một phần tử động thu hút chú ý tại một thời điểm; test đếm.
- [ ] `BR-ENG-10`: chỉ dẫn không bao giờ chỉ bằng chữ — audio hoặc trình diễn hình (`D-FI`).
- [ ] `BR-ENG-11`: không đồng hồ đếm ngược, không điểm hiện lúc chơi, nút thoát **không tap trúng được** (long-press 800ms → Parent Gate, màn hình thật ở P1.8).
- [ ] `BR-ENG-05`: sàn touch qua **một hàm duy nhất**, đọc hằng số của P1.1 (`D-FF`); ca âm — sàn tự viết trong Session class bị cổng bắt.
- [ ] `BR-ENG-16`: audio ceiling cưỡng chế trong code, ramp vào ≥20ms ra ≥40ms.
- [ ] `prefers-reduced-motion`: ăn mừng còn một nhịp scale 400ms; độ khó, nhịp, cách tính điểm **không đổi**.
- [ ] Bộ test bề mặt trẻ §7.2 của P1.1 (T5) chạy **thật** trên 6 template và xanh.

**Kiểm chứng**
- [ ] `pnpm test -- kid-surface` xanh trên cả 6 template; `pnpm test:a11y` 0 violation.

**Phụ thuộc:** T3 · **Cỡ:** M

### Cổng dừng

- [ ] Sáu template có E2E journey xanh, mỗi cái ≤80 KB gz.
- [ ] `BR-GTC-10`: round-trip `content_pack` × `content_contract` chạy trên **toàn bộ** level mẫu — 100% parse được.
- [ ] Không import Vue/Pinia/VueUse trong engine; không network lúc chơi; không cấp phát mỗi frame.
- [ ] Cổng FPS và thứ tự suy giảm đã đỏ được ít nhất một lần trên fixture.
- [ ] `pnpm check && pnpm test && pnpm test:e2e && pnpm lint:specs && pnpm check:progress` xanh.
- [ ] Human review — engine là **core business**, không auto-merge.

### Task 8 — Seed, evidence, promote

**Tiêu chí nghiệm thu**
- [ ] Seed đúng **sáu** hàng `game_templates` qua `packages/db/src/seed-master/game-templates.ts`; idempotent.
- [ ] `BR-GTC-04`: không route nào cho tạo/sửa template — `POST /api/managers/templates` **không tồn tại** hoặc 405; ca âm bằng curl với `super_admin`.
- [ ] `GET /api/guest/templates` trả metadata, **không** trả contract.
- [ ] `GET /api/managers/templates/{code}/contract` trả JSON Schema đã xuất + `limits` + `ui_hints`.
- [ ] Mỗi `BR-GTC-*` và `BR-ENG-*` có ít nhất một test tham chiếu mã rule.
- [ ] Hai spec sang `implemented`; [`performance-budgets.md`](../specs/08-quality/performance-budgets.md) **vẫn** `approved` (còn phần P1.16).
- [ ] Nêu lại §11 Q3 narration cho chủ (`D-FI`), và ghi kết quả T1 vào đầu vào của P1.10.
- [ ] Tick **P1.2** ở [`14-implementation-sequence-todo.md`](14-implementation-sequence-todo.md) khi `check:progress` tự xanh.
- [ ] **Báo cho nhóm D**: contract đã đóng băng → biên soạn seeder bắt đầu được ngay ([`roadmap.md`](../specs/roadmap.md) nhóm D).

**Cỡ:** M

## 5. Rủi ro

| Rủi ro | Ảnh hưởng | Giảm thiểu |
|---|---|---|
| Viết cả sáu template song song theo tầng | Một sai lầm ở `GameSession` phải sửa sáu lần | `D-FH` — `GT-001` hết đường trước |
| Contract đổi sau khi nhóm D đã soạn level | `BR-GTC-08` breaking change, mọi level phải validate lại | Đóng băng contract ở T2, đổi sau là version mới có kế hoạch migration |
| Skill lẻn vào template | Mất toàn bộ tính tái dùng, phát hiện muộn | `BR-GTC-01` ca âm ở tầng type |
| Ngân sách fps để tới cuối bước | Tối ưu thành refactor sáu Session class | `D-FL` — cổng trước template thứ hai |
| `designTokens.ts` lệch `@theme` | Cùng màu hai giá trị trên hai tầng | `D-FJ` — test đối chiếu + rule dependency-cruiser |
| Narration chưa chốt nguồn | 120 level phải thu lại, hoặc bundle phình | `D-FI` — engine nhận ref; nêu câu hỏi cho chủ **ở bước này** |
| Khảo sát port v1 không làm | P1.10 cam kết ≥120 level trên giả định chưa đo | T1 timebox một ngày, kết quả nằm trong repo |
| `refine` mất khi xuất JSON Schema | Studio cho qua dữ liệu server sẽ chặn | `D-FK` + `D-BK` — server luôn parse Zod thật |
| `validateAction` có side effect | Gọi cả lúc hover → trạng thái sai không tái hiện được | `BR-GTC-09` `BR-ENG-13` — test gọi 100 lần |

## 6. Giả định

1. **P1.1 đã đóng** — token, sàn chạm một nguồn, cổng bundle, harness axe đã có.
2. **P0.6 và P0.7 đã đóng** — `content_lifecycle` cho `status`, bảng `game_templates` có cột.
3. **Sáu template MVP không đổi.** Template 7–10 là P4 (§11 Q2).
4. **Canvas 2D đủ cho MVP.** WebGL là câu hỏi P4 (§11 Q2 của engine).
5. **Chưa có gating, chưa có config delivery.** Engine nhận config đã qua gating — P1.3/P1.4 nối dây thật; ở bước này config đến từ fixture.
6. **Chưa có scaffolding đầy đủ.** Bảng leo thang §7.3 chỉ khai chỗ; luật đầy đủ ở P1.8.
7. **Level mẫu của bước này là level *mẫu*** — không tính vào ≥120 level `published` của P1.11.

## 7. Ngoài phạm vi

- Gating quyền và giao config thật — P1.3, P1.4.
- Nạp event và tính điểm ở server — P1.5, P1.6, P1.7.
- Scaffolding đầy đủ, parent gate màn hình thật, hạn mức giờ — P1.8.
- Seeder ≥120 level — P1.10, P1.11.
- Studio sinh form từ JSON Schema — P2.5.
- Template thứ 7+, WebGL — P4.
