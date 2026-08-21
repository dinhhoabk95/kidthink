# Kế hoạch — Task #29: P1.4 — Giao config game đã lọc quyền

> Viết 2026-08-09. Bước sở hữu: **P1.4** của
> [`14-implementation-sequence-todo.md`](14-implementation-sequence-todo.md).
> Spec sở hữu: [`game-config-delivery.md`](../specs/04-play/game-config-delivery.md).
>
> ```
> export PATH=/Users/macbook/.nvm/versions/node/v24.15.0/bin:$PATH
> ```

## Tóm tắt

Một request trả **đủ** thứ engine cần để chạy trọn phiên mà **không gọi mạng lại** —
`BR-ENG-03` cấm network call trong lúc chơi. Nghĩa là bước này là chỗ duy nhất dữ liệu đi từ
server sang engine, và mọi thứ thiếu ở đây sẽ hiện ra dưới dạng màn hình đứng trước mặt một
đứa trẻ.

Ba ràng buộc kéo nhau ngược chiều: **đủ** (`BR-CFG-01`), **nhỏ** ≤200 KB gz (`BR-CFG-08`), và
**đã qua gating** (`BR-CFG-03/04`). Bước này là chỗ ba thứ đó gặp nhau.

## 0. Điều kiện tiên quyết

| Dep | Trạng thái | Ghi chú |
|---|---|---|
| `ACCESS-GATING` | **P1.3** | `assertContentAccess()` là bước 2 của luồng |
| `GAME-TEMPLATE-CONTRACT` | P1.2 | parse lại `content_pack` bằng Zod thật |
| `CONTENT-VERSIONING` | P0.6 | `content_version` ghim vào payload |
| `EMOJI-REGISTRY` | P0.9 | phân giải `EmojiRef` → glyph |
| `PLAY-SESSION-LIFECYCLE` | P1.6 — **sau** | xem `D-FR` |

## 1. Đo được

### 1.1 Cạnh ngược trong P1

§8 của spec ghi: `200` **đồng thời tạo phiên chơi**, trỏ sang
[`play-session-lifecycle.md`](../specs/04-play/play-session-lifecycle.md) — vốn là **P1.6**,
sau bước này. Payload §7.1 có `session.uuid` và `session.started_at`, nên cạnh là thật, không
phải trang trí. Xử ở `D-FR`.

### 1.2 Đã có sau P1.2–P1.3

Sáu template + contract Zod; `assertContentAccess()`; level mẫu; `emoji_registry` từ P0.9;
cổng ngân sách payload từ P1.1.

### 1.3 Chưa có

Không route config nào. Không lớp phân giải asset. Không bảng `play_sessions` được ghi.

## 2. Quyết định

**D-FR — P1.4 tạo **hàng phiên tối thiểu**, P1.6 giao vòng đời đầy đủ.** Cùng khuôn `D-BU` đã
dùng ở P0 cho queue: không kéo cả spec P1.6 lên, nhưng cũng không giả vờ cạnh không tồn tại.
P1.4 ghi hàng `play_sessions` với đúng những cột payload cần: `uuid`, `child_id`, `level_code`,
`content_version`, `is_preview`, `started_at`. Heartbeat, timeout, abandon, resume, đóng phiên
— **P1.6**. Ca âm ở bước này: payload **không** có `session.uuid` là lỗi (`BR-CFG-02` cùng
tinh thần).

**D-FS — server parse lại `content_pack` bằng **Zod thật**, mỗi request, không cache kết quả
parse.** `BR-CFG-03`. Cám dỗ là cache để tiết kiệm CPU trên t3.small. Nhưng contract là thứ đổi
theo version, và `D-BK` đã chỉ ra JSON Schema mất `refine` — cache parse là mở đúng cái cửa
`BR-GTC-02` đóng. Nếu đo thấy chậm thật: cache **payload đã dựng xong** theo
`(level_code, content_version, difficulty_params)` — không cache "kết quả parse là hợp lệ".

**D-FT — hai chế độ cache là **hai đường code có ca âm hai chiều**.** `BR-CFG-04` (`no-store`
cho bậc ≥ `login`) và `BR-CFG-05` (public 5 phút cho `free`) đứng cạnh nhau nên dễ đặt nhầm
nhánh. Ca âm bắt buộc **cả hai chiều**: config `premium` mang `public` → đỏ; config `free` mang
`no-store` → cũng đỏ (mất lợi ích của lối vào đông nhất).

**D-FU — §11 Q1 (đáp án lộ trong payload) **không** xử ở P1, và điều đó được ghi tường minh.**
Câu hỏi chặn P4, chủ là Backend. Sáu template MVP đều chấm ở client rồi gửi event; chấm ở server
là đổi kiến trúc engine. Ở P1 ghi rõ: `BR-CFG-06` hiện **không ràng buộc template nào**, vì
chưa template nào chấm ở server. Đây là lựa chọn có ý thức, không phải bỏ sót — người đọc spec
sau này cần thấy nó ở dạng văn bản, không phải suy ra từ việc không có test.

**D-FV — cổng payload ≤200 KB chạy **hai lần**: ở đây trên level mẫu, và lại ở P1.11 trên toàn
bộ ≥120 level.** Đo trên 18 level mẫu rồi kết luận là đo sai mẫu. Ghi nợ có địa chỉ, giống
`D-FB`.

## 3. Đồ thị

```
T1 phân giải asset ở server (emoji · image · audio) + đường lỗi
      └──→ T2 route config × 3 bề mặt, gọi assertContentAccess đúng chỗ
                ├──→ T3 parse lại content_pack + 500 CONTENT_PACK_INVALID + alert
                ├──→ T4 hàng play_sessions tối thiểu (D-FR)
                ├──→ T5 hai chế độ cache + ca âm hai chiều
                └──→ T6 cổng payload ≤200 KB + preload toàn bộ asset
                          ── Cổng dừng ──
  T7 nối engine thật: chơi hết một level từ config thật · evidence · promote
```

## 4. Task

### Task 1 — Phân giải asset ở server

**Tiêu chí nghiệm thu**
- [ ] `BR-CFG-07`: emoji → `{ ref, kind, glyph }` từ `emoji_registry`; image → `{ ref, kind, url, width, height }`; audio → `{ ref, kind, url, duration_ms }`.
- [ ] Client **không** dựng URL; ca âm — không chuỗi bucket/CDN nào xuất hiện trong `apps/web`.
- [ ] Asset không phân giải được → `{ ref, kind, error: "not_found" }`, **vẫn trả 200**.
- [ ] Ca âm: xoá một ảnh khỏi storage → config vẫn 200, engine hiện placeholder, trẻ chơi hết được level.

**Kiểm chứng**
- [ ] `pnpm test -- asset-resolve` xanh, assertion tham chiếu `BR-CFG-07`.

**Phụ thuộc:** P0.9 · **Cỡ:** M

### Task 2 — Ba route config

**Tiêu chí nghiệm thu**
- [ ] `GET /api/guest/levels/{code}/config` · `GET /api/users/levels/{code}/config` · `GET /api/managers/levels/{code}/config?version=`.
- [ ] Cả ba gọi `assertContentAccess()` — cổng của P1.3 (`D-FO`) canh việc này.
- [ ] Route Manager cho chọn `?version=`; User và Guest **luôn** lấy bản `published` mới nhất.
- [ ] Mã lỗi đủ: 403 `TIER_LOCKED` · 404 `NOT_FOUND` · 428 `NO_ACTIVE_CHILD` · 402 `DAILY_PLAY_CAP_REACHED` · 500 `CONTENT_PACK_INVALID`.
- [ ] Level `archived` giữa lúc mở: phiên đang có vẫn chạy; yêu cầu **mới** → 404.

**Kiểm chứng**
- [ ] `pnpm test -- config-routes` xanh; ma trận 20 ô của P1.3 chạy lại qua route này.

**Phụ thuộc:** T1 · P1.3 · **Cỡ:** M

### Task 3 — Parse lại và đường hỏng

**Tiêu chí nghiệm thu**
- [ ] `BR-CFG-03`: server parse `content_pack` bằng **Zod thật** của template, mỗi request (`D-FS`).
- [ ] Parse fail → **500** `CONTENT_PACK_INVALID` + **alert**; engine không nhận payload hỏng.
- [ ] Ca âm: sửa tay một `content_pack` trong DB thành sai schema → 500 + alert, không 200.
- [ ] Không cache "kết quả parse hợp lệ"; nếu cache payload thì key gồm `content_version`.

**Kiểm chứng**
- [ ] `pnpm test -- config-invalid` xanh, assertion tham chiếu `BR-CFG-03`.

**Phụ thuộc:** T2 · **Cỡ:** S

### Task 4 — Hàng phiên tối thiểu (`D-FR`)

**Tiêu chí nghiệm thu**
- [ ] 200 tạo đúng **một** hàng `play_sessions`: `uuid`, `child_id`, `level_code`, `content_version`, `is_preview`, `started_at`.
- [ ] `BR-CFG-02`: `content_version` có trong payload **và** ghim vào hàng phiên.
- [ ] `session.uuid` có trong payload; ca âm — payload thiếu `uuid` là lỗi.
- [ ] Preview của Manager tạo hàng với `is_preview = true` (`BR-GAT-08`).
- [ ] Ghi nợ tường minh: heartbeat, timeout, abandon, resume, đóng phiên → **P1.6**.

**Kiểm chứng**
- [ ] `pnpm test -- session-row` xanh; `pnpm --filter @mindkid/db test` xanh.

**Phụ thuộc:** T2 · **Cỡ:** S

### Task 5 — Hai chế độ cache

**Tiêu chí nghiệm thu**
- [ ] `BR-CFG-04`: bậc ≥ `login` → `Cache-Control: private, no-store`.
- [ ] `BR-CFG-05`: bậc `free` → `public, max-age` ≤ 300.
- [ ] Ca âm chiều 1: config `premium` mang `public` → test **đỏ**.
- [ ] Ca âm chiều 2: config `free` mang `no-store` → test **đỏ** (`D-FT`).
- [ ] Không proxy/CDN nào cache được response có `no-store` — kiểm bằng header, không bằng niềm tin.

**Kiểm chứng**
- [ ] `pnpm test -- config-cache` xanh, assertion tham chiếu `BR-CFG-04` `BR-CFG-05`.

**Phụ thuộc:** T2 · **Cỡ:** S

### Task 6 — Ngân sách payload và preload

**Tiêu chí nghiệm thu**
- [ ] `BR-CFG-08`: payload ≤ **200 KB** gzipped, đo trên **mọi** level đã seed.
- [ ] Cổng đo dùng lại cơ chế ngân sách của P1.1; vượt → **chặn merge**.
- [ ] Ca âm: dựng một level cố tình phình payload → cổng đỏ.
- [ ] Client preload **toàn bộ** asset trước khi `start()`; ca âm — bắt đầu chơi khi còn asset đang tải là lỗi.
- [ ] `BR-CFG-01`: ca âm end-to-end — ghi lại request từ `start` tới `complete`, chỉ được có request gửi event.
- [ ] Ghi nợ (`D-FV`): chạy lại cổng này trên ≥120 level ở **P1.11**.

**Kiểm chứng**
- [ ] `pnpm --filter @mindkid/gates test -- config` xanh; `pnpm test:e2e -- no-network-during-play` xanh.

**Phụ thuộc:** T3 · T4 · **Cỡ:** M

### Cổng dừng

- [ ] Một trẻ mở level thật → engine nhận config thật → chơi hết → **không** request nào ngoài gửi event.
- [ ] 20 ô gating chạy lại qua route config, đủ 20.
- [ ] Payload mọi level mẫu ≤200 KB gz.
- [ ] Cache đúng hai chiều; `no-store` không lọt lên proxy.
- [ ] `content_pack` hỏng → 500 + alert, không bao giờ tới engine.
- [ ] `pnpm check && pnpm test && pnpm test:e2e && pnpm --filter @mindkid/gates test && node packages/gates/scripts/check-progress.ts` xanh.

### Task 7 — Nối engine, evidence, promote

**Tiêu chí nghiệm thu**
- [ ] `apps/web/app/pages/play/[code].vue` mount engine với config **thật** (thay fixture của P1.2).
- [ ] E2E: mỗi `GT-001`…`GT-006` chơi được từ config thật, ít nhất một journey mỗi template.
- [ ] Mỗi `BR-CFG-*` có ít nhất một test tham chiếu mã rule.
- [ ] [`game-config-delivery.md`](../specs/04-play/game-config-delivery.md) sang `implemented`.
- [ ] §11 Q1 ghi rõ theo `D-FU`: P1 không chấm ở server, `BR-CFG-06` chưa ràng buộc template nào, câu hỏi giữ nguyên cho P4.
- [ ] Tick **P1.4** ở [`14-implementation-sequence-todo.md`](14-implementation-sequence-todo.md) khi `check:progress` tự xanh.

**Cỡ:** M

## 5. Rủi ro

| Rủi ro | Ảnh hưởng | Giảm thiểu |
|---|---|---|
| Payload thiếu một thứ engine cần | Network call giữa phiên → vi phạm `BR-ENG-03`, game đứng khi mất mạng | T6 — ca âm ghi lại request end-to-end |
| Cache nhầm nhánh | Config trả phí nằm trong CDN | `D-FT` — ca âm **hai chiều** |
| Cache kết quả parse cho nhanh | Level hỏng đi qua cổng `BR-GTC-02` | `D-FS` — cache payload, không cache tính hợp lệ |
| Đo 200 KB trên 18 level mẫu | Kết luận sai mẫu, vỡ ở P1.11 | `D-FV` — chạy lại cổng ở P1.11 |
| Tạo phiên ở đây rồi P1.6 tạo lần hai | Hai đường tạo phiên, dữ liệu lệch | `D-FR` — P1.4 sở hữu hàng tối thiểu, P1.6 **mở rộng** chứ không tạo lại |
| Client dựng URL asset | Đổi CDN phải sửa và deploy client | `BR-CFG-07` — ca âm quét chuỗi bucket trong `apps/web` |
| Asset thiếu chặn phiên | Một ảnh xoá nhầm làm cả level không chơi được | T1 — `error: not_found` + placeholder, vẫn 200 |

## 6. Giả định

1. **P1.3 đã đóng** — gating là đường duy nhất, cổng đếm handler đã chạy.
2. **P1.2 đã đóng** — contract Zod và sáu template chạy được.
3. **Adaptive hoãn sang P3** (`D-DH`) — P1 dùng `difficulty_params` gốc trong `game_levels`.
4. **Emoji registry đã seed ở P0.9** — phân giải glyph không phải việc của bước này.
5. **Ảnh chưa có ở P1** — đường `image` phải chạy được và có test, nhưng nội dung P1 dùng emoji; storage đầy đủ ở P2.7.
6. **Chưa có offline queue.** Buffer event và IndexedDB ở P1.6.

## 7. Ngoài phạm vi

- Vòng đời phiên đầy đủ, heartbeat, resume — P1.6.
- Nạp event và tính điểm — P1.6, P1.7.
- Adaptive params — P3.5.
- Chấm ở server chống gian lận — P4 (§11 Q1).
- Upload và quản lý ảnh — P2.7.
