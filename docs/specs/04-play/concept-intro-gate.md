---
spec: CONCEPT-INTRO-GATE
title: Bắt buộc làm quen khái niệm trước khi vào màn chơi
area: play
status: approved
mvp: false
phase: P4
reviewed: 2026-09-02
owns:
  - Bước 8 của thứ tự kiểm quyền — điều kiện sư phạm
  - Hàng đợi bài làm quen của một trò chơi
  - Điều kiện miễn cổng
  - Cổng bậc thang độ phủ bài làm quen
depends_on:
  - ACCESS-GATING
  - CONCEPT-INTRO-MODEL
  - CONCEPT-INTRO-RUNNER
  - GAME-CONFIG-DELIVERY
  - PLAY-SESSION-LIFECYCLE
  - TAXONOMY-SERVICE
---

# Bắt buộc làm quen khái niệm trước khi vào màn chơi

## 1. Objective

Hôm nay có **hai đường** dẫn trẻ tới một màn chơi, và chỉ một đường có dạy:

| Đường | Có dạy trước không |
|---|---|
| Giáo án — [`curriculum-player.md`](curriculum-player.md) → [`lesson-session-runner.md`](lesson-session-runner.md) → bước `digital_game` | **Có**, ba pha, có người lớn |
| Danh mục — `/games` → `/play/{code}` | **Không**. Bảy bước của [`access-gating.md`](access-gating.md) hỏi về tiền, hạn mức và tuổi — không bước nào hỏi trẻ đã biết khái niệm chưa |

Đường thứ hai là đường phụ huynh dùng khi để trẻ chơi một mình. File này đóng nó lại: thêm
**bước 8** — điều kiện sư phạm — vào cuối thứ tự kiểm quyền.

**Một trò chơi có thể cần nhiều bài làm quen trước đó.** Một màn chơi ghép vần cần cả bài về
ký tự lẫn bài về từ; một màn chơi khối 3D cần bài về hình phẳng trước. Nên bước 8 không trả
về *một* bài — nó dựng một **hàng đợi** theo thứ tự prerequisite, và trẻ đi lần lượt.

Đơn vị của hàng đợi là **strand**, không phải skill (`A-206-01`, chốt 2026-09-02). Bao đóng
prerequisite vẫn tính ở mức **skill** — `skill_prerequisites` là nơi duy nhất có cạnh — rồi
**gom về strand** trước khi xếp hàng. Gom ở bước cuối giữ được độ chính xác của cạnh mà vẫn
cho hàng đợi ngắn.

Nguyên tắc chốt của cả file: cổng đòi trẻ **đã đi qua** bài làm quen, Cấm — **NEVER** đòi
trẻ **trả lời đúng**. Khoá một đứa trẻ ba tuổi khỏi trò chơi vì nó chạm sai là biến bài dạy
thành hình phạt.

## 2. Actors

| Actor | Trạng thái | Cổng làm gì |
|---|---|---|
| Khách chưa đăng nhập | `guest_device_id` | Áp cổng; trạng thái làm quen theo thiết bị |
| Trẻ qua hồ sơ đã chọn | `child_profile_id` | Áp cổng; trạng thái làm quen theo hồ sơ, bền |
| Trẻ trong một tiết giáo án | có `lesson_run_id` | **Miễn** — người lớn đang dạy |
| Manager preview | `is_preview = true` | **Miễn**, và không ghi gì |

## 3. Entry points

| Nơi | Vai trò |
|---|---|
| `assertContentAccess(event, content)` — `packages/shared/src/access-gating.ts` | Bước 8 sống ở đây, sau bảy bước đang có |
| `deliverGameConfig` — `apps/web/server/utils/game-config-runtime.ts` | Đường duy nhất cấp config màn chơi, đã gọi `assertContentAccess` |
| `GET /api/users/levels/{code}/readiness` | Route mới, để danh mục hiện nhãn "Học trước" mà không phải ăn một 428 |

## 4. Main flow

1. Bảy bước của [`access-gating.md`](access-gating.md) mục 4 chạy trước, **nguyên vẹn**.
2. Bước 8 bắt đầu: level đang xin có `kind = 'teach'` không? Có → **mở** (bài làm quen không
   tự chắn chính nó).
3. Có nhánh miễn nào không (mục 5)? Có → **mở**.
4. Dựng **tập kỹ năng cần**: mọi `skill_code` của level trong `content_skill_map`, **cộng**
   bao đóng prerequisite bắc cầu của chúng theo `skill_prerequisites`.
5. **Gom về strand**: mỗi kỹ năng trong tập quy về `strand_code` của nó, khử trùng lặp.
6. Lọc còn những strand **có bài làm quen `published`** (`concept-intro-model.md` mục 7.5).
   Strand chưa có bài thì bỏ khỏi tập — Cấm — **NEVER** chặn trẻ vì thư viện còn thiếu.
7. Bỏ tiếp những strand trẻ **đã đi hết** bài làm quen (`BR-CIR-08`). Còn lại là
   **`intro_queue`**.
8. `intro_queue` rỗng → **mở**.
9. Không rỗng → sắp theo **thứ tự topo trên strand** (cạnh strand suy từ `skill_prerequisites`,
   strand nền đứng trước), cắt còn **2 bài đầu**, trả **428 `INTRO_REQUIRED`** kèm
   `details.intro_queue[]`, `details.intro_remaining` và `details.return_level_code`.
10. Client cho trẻ đi lần lượt hàng đợi. Xong bài cuối trong hàng → quay lại
    `return_level_code`.
11. Nếu `intro_remaining > 0`, lần vào sau bước 8 dựng lại hàng đợi với hai bài kế. Trẻ đi
    dần cho tới khi hàng rỗng.

## 5. Alternative flows

| Nhánh | Điều kiện | Hành vi |
|---|---|---|
| Level là bài làm quen | `kind = 'teach'` | Mở. Nếu không, không trò chơi nào vào được |
| Level chạy trong tiết giáo án | Request mang `lesson_run_id` hợp lệ đang mở | **Miễn.** Ghi hoàn thành cho mọi strand trong hàng đợi với `source = 'lesson_run'` — người lớn vừa dạy đúng thứ cổng này đi tìm |
| Manager preview | `is_preview = true` | Miễn, và Cấm — **NEVER** ghi hoàn thành — `BR-GAT-08` |
| Không strand nào trong tập có bài làm quen | Thư viện thiếu | Mở. Đếm vào sổ nợ của cổng bậc thang mục 7.4 |
| Level không gắn kỹ năng nào | Lỗi dữ liệu | Mở, và **log cảnh báo**. Cổng publish lẽ ra đã chặn — cùng lập trường `progress-and-mastery.md` mục 5 |
| Bao đóng prerequisite có chu trình | Lỗi dữ liệu taxonomy | Mở, log cảnh báo. Cấm — **NEVER** vòng lặp vô hạn khi sắp topo |
| Bài làm quen bị `archived` sau khi trẻ đã đi hết | Nội dung gỡ | Trạng thái đã hoàn thành **giữ nguyên**. Cấm — **NEVER** chặn lại trẻ vì người soạn gỡ bài |
| Bài làm quen publish bản mới | `content_version` tăng | Mặc định **không** bắt chạy lại. Chỉ khi bản mới khai `requires_reintro = true` — `A-206-04` |
| Trẻ đổi hồ sơ | Hồ sơ khác | Trạng thái làm quen theo **từng hồ sơ**. Anh đã học không mở khoá cho em |
| Khách đăng nhập rồi tạo hồ sơ trẻ | `guest_device_id` → `child_profile_id` | Trạng thái làm quen của thiết bị **chuyển sang** hồ sơ đầu tiên được tạo trong phiên đó |
| Mất mạng | Offline | Đã đi hết mà chưa đẩy lên được thì client giữ cờ cục bộ và cho vào; server đối chiếu khi có mạng lại — [`offline-play.md`](../01-platform/offline-play.md) |

## 6. Business rules

| ID | Rule | Vì sao |
|---|---|---|
| `BR-CIG-01` (bước 8, không sớm hơn) | Điều kiện sư phạm chạy **sau** cả bảy bước đang có | Bước 5 trả 403 và bước 6 trả 402 là rào người lớn **tự gỡ được bằng tiền**. Đẩy rào sư phạm lên trước là nói sai thứ đang chặn họ — `BR-GAT-09` đã đóng lập trường này |
| `BR-CIG-02` (đi qua, không phải thắng) | Điều kiện là `BR-CIR-08` (đã đi hết dãy step), Cấm — **NEVER** là số câu `recall` đúng | Trẻ ba tuổi gặp khái niệm lần đầu sẽ sai. Lấy kết quả lần đầu làm cửa là khoá đúng đứa trẻ cần bài học nhất |
| `BR-CIG-03` (hàng đợi, không phải một bài) | Cổng đòi **mọi** strand mà level chạm tới — kể cả strand đến từ bao đóng prerequisite bắc cầu. Strand nào có bài làm quen published thì strand đó phải đi qua | Một màn chơi ghép vần đứng trên cả ký tự lẫn từ. Đòi mỗi kỹ năng chính là dạy nửa nền rồi thả trẻ vào phần còn lại |
| `BR-CIG-04` (thiếu bài thì mở) | Strand chưa có bài làm quen `published` → **bỏ khỏi hàng đợi**, không chặn | Cổng tồn tại để thêm bài dạy, không phải để gỡ trò chơi. Nợ độ phủ đo ở mục 7.4, không đo bằng cách chặn trẻ |
| `BR-CIG-05` (cổng chạy ở server) | Bước 8 chạy trong `assertContentAccess`, Cấm — **NEVER** chỉ ở client | `BR-GAT-01`. Ẩn nút chơi bằng CSS không phải là cổng |
| `BR-CIG-06` (bài làm quen không tự chắn) | Level `kind = 'teach'` **luôn** qua bước 8 | Nếu không thì không có đường nào vào bài làm quen, và toàn bộ thư viện đóng |
| `BR-CIG-07` (giáo án miễn cổng) | Level mở từ trong một `lesson_run` đang chạy được **miễn**, và ghi hoàn thành cho cả hàng đợi với `source = 'lesson_run'` | Tiết giáo án có đủ ba pha và có người lớn (`BR-LSM-01`). Bắt trẻ xem thêm hai bài làm quen ngay sau khi người lớn vừa dạy đúng khái niệm đó là lặp vô nghĩa |
| `BR-CIG-08` (trạng thái theo từng hồ sơ) | Trạng thái làm quen gắn `child_profile_id`, hoặc `guest_device_id` với khách | Hai đứa trẻ trong một nhà học khác nhau. Trạng thái theo tài khoản sẽ mở khoá cho đứa chưa học |
| `BR-CIG-09` (preview không ghi) | Manager preview miễn cổng và Cấm — **NEVER** ghi hoàn thành | `BR-GAT-08`. Manager chạy thử một bài chục lần khi soạn nó |
| `BR-CIG-10` (nguồn sự thật là `play_sessions`) | Trạng thái làm quen suy ra từ `play_sessions` (`completion_status = 'completed'`, `is_preview = false`) của level `kind = 'teach'`. Cấm — **NEVER** dựng bảng đếm song song đồng bộ tay | `play_sessions` đã có đủ ba thứ cần: chủ thể, trạng thái, và cờ preview. Bảng thứ hai là hai nguồn sự thật, và nó sẽ lệch |
| `BR-CIG-11` (mã lỗi nói đúng việc) | Chưa làm quen trả **428 `INTRO_REQUIRED`**, Cấm — **NEVER** 403 | 403 nghĩa là "bạn không có quyền", và người dùng sẽ đi mua gói. Đây là điều kiện tiên quyết người dùng **tự làm xong trong vài phút** — đúng ngữ nghĩa 428 mà `NO_ACTIVE_CHILD` và `CONSENT_REQUIRED` đang dùng |
| `BR-CIG-12` (bốn ô mới phải có test) | Ma trận mục 7.3 phải có test, cộng **ca âm** cho từng nhánh miễn | `BR-GAT-05` đã đóng lập trường: gating là ma trận, test vài ô sẽ để lọt ô còn lại |
| `BR-CIG-13` (bậc thang chỉ đi xuống) | Số strand có level nhưng thiếu bài làm quen chỉ được **giảm**. Level mới cho strand chưa có bài làm quen làm cổng **đỏ** | Không có bậc thang thì `BR-CIG-04` biến thành cửa thoát vĩnh viễn: mọi kỹ năng cứ thiếu bài là cổng cứ mở |
| `BR-CIG-14` (Cấm nới để qua cổng) | Cấm — **NEVER** thêm strand vào danh sách miễn trừ chỉ để một đợt nội dung kịp phát hành | `AGENTS.md`: không nới rule chỉ để code hiện tại qua được cổng |
| `BR-CIG-15` (thứ tự nền trước) | Hàng đợi sắp theo **thứ tự topo trên strand**: có cạnh `A → B` khi một kỹ năng của strand `A` là prerequisite của một kỹ năng của strand `B` | Dạy từ trước khi dạy ký tự là dạy ngược. `BR-LFM-06` đã đóng lập trường prerequisite là ràng buộc sư phạm không được nới. Cạnh chỉ có ở mức skill, nên thứ tự strand phải **suy ra** từ đó chứ không khai riêng |
| `BR-CIG-16` (tối đa 2 bài mỗi lần vào) | Một lần vào trả tối đa **2** bài trong `intro_queue`; phần còn lại đòi ở lần vào sau, kèm `intro_remaining` | Bao đóng prerequisite có thể dài. Chắn một đứa trẻ sau sáu phút bài dạy để tới màn chơi 90 giây là cách chắc chắn nhất làm nó bỏ. Trẻ đi dần vẫn phải qua hết, chỉ là không qua hết trong một hơi |
| `BR-CIG-17` (bao đóng, không phải một tầng) | Tập kỹ năng gồm cả prerequisite **bắc cầu**, không chỉ tầng liền kề. Gom về strand làm **sau** khi bao đóng xong, Cấm — **NEVER** gom trước | Chặn ở một tầng thì trẻ vào được màn chơi mà vẫn thiếu nền hai tầng dưới — đúng lỗ hổng file này đang vá. Gom trước khi lấy bao đóng sẽ mất cạnh giữa hai kỹ năng cùng strand và cắt cụt bao đóng |

## 7. Data

**Đọc:** `game_levels` · registry `ALL_TEMPLATES` (`kind`) · `content_skill_map` · `skills` · `strands` · `skill_prerequisites` ·
`play_sessions` · `lesson_runs`.
**Ghi:** không ghi gì ở đường đọc config. Hàng hoàn thành do
[`concept-intro-runner.md`](concept-intro-runner.md) ghi qua `play_sessions`.

### 7.1 Thứ tự tám bước — thay cho bảy bước của `access-gating.md` mục 4

```
1. Content tồn tại và status = published?      → không: 404
2. Content thuộc curriculum tier cao hơn?      → lấy max(tier)   [BR-LAD-05]
3. Caller là ai? (guest | user)                → dựng ngữ cảnh
4. Route cần trẻ và chưa chọn trẻ?             → 428  (TRƯỚC gating)
5. allowedTiers(caller) ⊇ tier hiệu lực?       → không: 403 + metadata gate
6. Quota còn? (phút chơi trong ngày)           → hết: 402
7. Content phù hợp tuổi của trẻ?               → không khớp: 200 + cờ age_mismatch
8. intro_queue rỗng?                           → không: 428 INTRO_REQUIRED   [BR-CIG-01]
```

Bảy bước đầu **không đổi một chữ**. `BR-GAT-02` nói thứ tự là cố định — bước 8 **nối vào
cuối**, không chèn vào giữa, và không bước nào đang có đổi vị trí hay đổi mã.

### 7.2 Dựng `intro_queue`

```
K  = { skill_code của level trong content_skill_map }
K+ = K ∪ bao đóng bắc cầu qua skill_prerequisites          [BR-CIG-17]
S  = { strand_code(k) : k ∈ K+ }, khử trùng lặp            [A-206-01]
E  = { (strand(a), strand(b)) : (a,b) ∈ skill_prerequisites, a,b ∈ K+ }
P  = { s ∈ S : s có bài làm quen published }               [BR-CIG-04]
Q  = { s ∈ P : trẻ chưa đi hết bài của s }                 [BR-CIG-02, BR-CIR-08]
intro_queue = topo_sort(Q, E)[0..2]                        [BR-CIG-15, BR-CIG-16]
intro_remaining = |Q| − |intro_queue|
```

Bao đóng lấy ở mức **skill** rồi mới gom về **strand** (`BR-CIG-17`): gom trước sẽ nuốt mất
cạnh giữa hai kỹ năng cùng một strand và cắt cụt bao đóng. Cạnh `E` bỏ vòng tự thân
(`strand(a) = strand(b)`). `topo_sort` gặp chu trình thì bỏ cạnh gây chu trình, log cảnh báo,
và chạy tiếp — mục 5.

### 7.3 Ô phải có test

| Trạng thái trẻ \ Hàng đợi | Rỗng vì không strand nào có bài | Rỗng vì đã đi hết | 1 bài | 3 bài (cắt còn 2) | Trong `lesson_run` |
|---|:--:|:--:|:--:|:--:|:--:|
| Khách (`guest_device_id`) | 200 | 200 | **428** | **428** + `intro_remaining = 1` | 200 |
| Trẻ đã chọn hồ sơ | 200 | 200 | **428** | **428** + `intro_remaining = 1` | 200 |

Cộng bốn ca âm bắt buộc: preview **không** bị chặn và **không** ghi hoàn thành · level
`kind = 'teach'` **không** bị chính nó chặn · phiên `abandoned` **không** mở cổng ·
prerequisite bắc cầu hai tầng **có** vào hàng đợi.

### 7.4 Cổng bậc thang độ phủ

Cùng hình dạng với `scripts/typecheck/typecheck-gate.ts` — repo này đã đóng khoản nợ 3.142
lỗi kiểu bằng đúng cơ chế đó.

| Thứ | Giá trị |
|---|---|
| Đo gì | Số strand **có ít nhất một level `kind = 'assess'` published** nhưng **không có** bài làm quen published |
| Baseline khởi điểm | **41** — số strand đang có nội dung game. 30 strand còn lại của taxonomy chưa có level nào nên chưa vào sổ nợ |
| Tăng | **Đỏ.** Muốn tăng phải có cờ tường minh kèm lý do trong PR |
| Giảm | Xanh, kèm nhắc cập nhật baseline |
| Ca âm bắt buộc | Thêm một level cho strand chưa có bài làm quen → cổng phải đỏ |

### 7.5 Truy vấn trạng thái làm quen

```sql
-- Những strand trong tập S mà trẻ ĐÃ đi hết bài làm quen (BR-CIG-10)
SELECT DISTINCT gl.content_pack -> 'concept' ->> 'strand_code' AS strand_code
FROM play_sessions ps
JOIN game_levels gl ON gl.id = ps.game_level_id
WHERE ps.template_code = ANY($4) -- teachTemplateCodes từ registry ALL_TEMPLATES
  AND ps.completion_status = 'completed'
  AND ps.is_preview = false
  AND (ps.child_profile_id = $1 OR ps.guest_device_id = $2)
  AND gl.content_pack -> 'concept' ->> 'strand_code' = ANY($3);
```

Một truy vấn cho cả tập, Cấm — **NEVER** một truy vấn mỗi strand: bao đóng prerequisite có
thể chạm nhiều strand, và mỗi round-trip trước màn chơi là một lần trả giá.

Cần index trên `(child_profile_id, template_id, completion_status)` và expression index trên
`gl.content_pack -> 'concept' ->> 'strand_code'`. Nếu vượt ngân sách `BR-PRF-*`, khoản
denormalise mở lại ở mục 11 câu 2 — Cấm — **NEVER** thêm bảng đếm trước khi có số đo.

## 8. API contract

### `GET /api/users/levels/{code}/readiness`

| | |
|---|---|
| Auth | `requireUserAuth()` cộng một hồ sơ trẻ đang chọn |
| 200 | `{ intro_required: boolean, intro_queue: IntroQueueItem[], intro_remaining: number, required_strand_codes: string[] }` |
| 404 | Level không tồn tại hoặc không `published` |
| 428 | `NO_ACTIVE_CHILD` |

`IntroQueueItem` = `{ level_code, strand_code, concept_label, estimated_seconds }`.

Route này tồn tại để danh mục hiện nhãn "Học trước — 2 bài" **mà không phải ăn một 428**. Nó
Cấm — **NEVER** là nơi cưỡng chế; cưỡng chế ở bước 8 của `assertContentAccess` (`BR-CIG-05`).

### `GET /api/guest/levels/{code}/readiness`

Như trên, khách dùng `guest_device_id`, không cần hồ sơ trẻ.

### Đổi ở route cấp config đang có

`GET /api/users/levels/{code}/config` và `GET /api/guest/levels/{code}/config` thêm **một**
nhánh lỗi:

| Mã | Status | `details` |
|---|---|---|
| `INTRO_REQUIRED` | **428** | `{ intro_queue: IntroQueueItem[], intro_remaining, return_level_code }` |

Body giữ đúng ba trường `{ code, message, details? }` của
[`error-codes.md`](../00-foundation/error-codes.md) §7.1. Câu người dùng đọc viết cho **người
lớn**, không cho trẻ: *"Bé cần làm quen với {khái niệm} trước. Mất khoảng {n} phút."*

## 9. Acceptance criteria

```gherkin
Scenario: BR-CIG-01 — thiếu gói thì báo thiếu gói, không báo thiếu bài làm quen
  Given một trẻ chưa mua gói và chưa làm quen strand của một level premium
  When client xin config của level đó
  Then trả 403 TIER_LOCKED
  And không trả INTRO_REQUIRED

Scenario: BR-CIG-02 — sai hết recall vẫn vào được trò chơi
  Given trẻ đã đi hết bài làm quen nhưng trả lời sai mọi step recall
  When client xin config của trò chơi cùng strand
  Then trả 200

Scenario: BR-CIG-03 — level chạm hai strand đòi cả hai bài làm quen
  Given một level gắn C5.PHO.02 và C5.VOC.01, hai kỹ năng thuộc hai strand khác nhau
  And cả hai strand đều có bài làm quen published
  And trẻ mới đi hết bài của strand C5.PHO
  When client xin config
  Then trả 428 INTRO_REQUIRED
  And intro_queue chứa bài của strand C5.VOC

Scenario: BR-CIG-03 — hai kỹ năng cùng một strand chỉ đòi một bài
  Given một level gắn C1.NREC.01 và C1.NREC.03, cùng strand C1.NREC
  And strand đó có bài làm quen published, trẻ chưa đi
  When client xin config
  Then intro_queue có đúng 1 phần tử

Scenario: BR-CIG-17 — prerequisite bắc cầu vào hàng đợi
  Given level gắn kỹ năng X, X có prerequisite Y, Y có prerequisite Z
  And ba kỹ năng đó thuộc ba strand khác nhau, cả ba đều có bài làm quen published
  And trẻ chưa đi bài nào
  When client xin config
  Then intro_queue cộng intro_remaining phủ cả ba strand

Scenario: BR-CIG-17 — gom về strand làm sau khi lấy bao đóng
  Given X và prerequisite Y của nó cùng thuộc strand S
  And Y có prerequisite Z thuộc strand T
  When cổng dựng hàng đợi
  Then T nằm trong tập, không bị mất vì X và Y cùng strand

Scenario: BR-CIG-15 — nền đứng trước
  Given một kỹ năng của strand Z là prerequisite của một kỹ năng của strand Y
  When cổng dựng hàng đợi
  Then bài của Z đứng trước bài của Y

Scenario: BR-CIG-16 — tối đa hai bài một lần vào
  Given hàng đợi có 5 strand còn thiếu
  When client xin config
  Then intro_queue có đúng 2 phần tử
  And intro_remaining bằng 3

Scenario: BR-CIG-04 — strand chưa có bài làm quen thì không chặn
  Given mọi strand trong tập đều chưa có bài làm quen published
  When client xin config
  Then trả 200

Scenario: BR-CIG-06 — bài làm quen không tự chặn chính nó
  Given trẻ chưa làm quen strand nào
  When client xin config của một level kind = teach
  Then trả 200

Scenario: BR-CIG-07 — trong tiết giáo án thì miễn cổng
  Given một lesson_run đang mở chứa bước game level
  And trẻ chưa đi bài làm quen nào của level đó
  When client xin config kèm lesson_run_id
  Then trả 200
  And ghi hoàn thành cho cả hàng đợi với source = lesson_run

Scenario: BR-CIG-08 — hồ sơ em không dùng được trạng thái của anh
  Given hồ sơ A đã làm quen strand C1.NREC, hồ sơ B thì chưa
  When hồ sơ B xin config của level thuộc strand đó
  Then trả 428 INTRO_REQUIRED

Scenario: BR-CIG-09 — preview miễn cổng và không ghi
  Given manager mở preview một level, chưa ai làm quen strand đó
  When manager chạy hết bài
  Then trả 200
  And không hàng hoàn thành nào được ghi

Scenario: BR-CIG-10 — phiên bỏ dở không mở cổng
  Given trẻ thoát bài làm quen giữa chừng, phiên là abandoned
  When client xin config của trò chơi cùng strand
  Then trả 428 INTRO_REQUIRED

Scenario: BR-CIG-11 — mã lỗi và payload quay lại
  When cổng chặn vì chưa làm quen
  Then status là 428
  And code là INTRO_REQUIRED
  And details mang intro_queue, intro_remaining và return_level_code

Scenario: Bao đóng có chu trình thì không treo
  Given taxonomy có chu trình prerequisite giữa hai kỹ năng khác strand
  When cổng dựng hàng đợi
  Then request trả về trong ngân sách bình thường
  And ghi log cảnh báo

Scenario: BR-CIG-13 — thêm level cho strand chưa có bài làm quen thì cổng đỏ
  Given baseline hiện tại là N strand thiếu bài làm quen
  When thêm một level assess cho một strand chưa có bài làm quen nào
  Then cổng bậc thang đỏ

Scenario: Bảy bước cũ không đổi trạng thái
  When chạy lại 20 ô của ma trận access-gating mục 7.1
  Then mọi ô trả đúng mã như trước khi có bước 8
```

## 10. Boundaries

**Always**
- Luôn chạy bước 8 **sau** bảy bước đang có, trong cùng `assertContentAccess`.
- Luôn sắp hàng đợi theo thứ tự prerequisite, nền trước.
- Luôn trả `intro_remaining` để người lớn biết còn bao nhiêu bài nữa.
- Luôn lấy bao đóng ở mức skill rồi mới gom về strand.
- Luôn hỏi trạng thái làm quen bằng **một** truy vấn cho cả tập strand.
- Luôn chụp danh sách `trạng-thái | tên-test` của 20 ô cũ trước và sau khi thêm bước 8, và đòi **trùng khít**.

**Ask first**
- Đổi trần 2 bài mỗi lần vào của `BR-CIG-16`, hoặc đòi hết hàng đợi trong một lần.
- Miễn cổng cho một strand cụ thể (`BR-CIG-14` cấm làm việc này để kịp phát hành).
- Đổi `BR-CIG-02` sang đòi trả lời đúng ở `recall`.
- Denormalise trạng thái làm quen thành bảng riêng (cần số đo hiệu năng trước).
- Cho phép người lớn bấm bỏ qua hàng đợi qua [`parent-gate.md`](parent-gate.md).

**Never**
- Cấm — **NEVER** chèn bước 8 vào giữa bảy bước đang có, hay đổi mã lỗi của chúng.
- Cấm — **NEVER** trả 403 cho việc chưa làm quen.
- Cấm — **NEVER** chặn trẻ vì thư viện thiếu bài làm quen.
- Cấm — **NEVER** cưỡng chế chỉ ở client.
- Cấm — **NEVER** một truy vấn cho mỗi strand trong tập.
- Cấm — **NEVER** gom về strand trước khi lấy bao đóng prerequisite.

## 11. Open questions

| # | Câu hỏi | Chặn gì | Chặn phase | Chủ |
|---|---|---|---|---|
| 1 | Người lớn có được bỏ qua hàng đợi qua Parent Gate không? | Thiết kế UI danh mục | P4 | người quyết |
| 2 | Truy vấn mục 7.5 cộng bao đóng prerequisite có vượt ngân sách `BR-PRF-*` không? | Quyết định denormalise | P4 | Backend |
| 3 | Bài làm quen có tính vào hạn mức phút chơi trong ngày không? | [`healthy-play-limits.md`](healthy-play-limits.md) | P4 | người quyết |
| 4 | Bao đóng prerequisite sâu bao nhiêu tầng là hợp lý trước khi cắt? | Độ dài hàng đợi thực tế | P4 | hoãn — mở lại khi đo được phân bố độ dài hàng đợi trên 41 strand |
| 5 | Khách chuyển thành hồ sơ trẻ thì chuyển trạng thái cho hồ sơ nào khi tạo nhiều hồ sơ cùng lúc? | Luồng đăng ký | P4 | Backend |
