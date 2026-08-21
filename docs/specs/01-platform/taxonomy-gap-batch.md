---
spec: TAXONOMY-GAP-BATCH
title: Lô khuôn khoảng trống taxonomy — ba cơ chế không dạng bài v1 nào có
area: platform
status: approved
mvp: false
phase: P5
reviewed: 2026-08-22

owns:
  - Danh mục ba khuôn trò chơi lô khoảng trống taxonomy
  - Thứ tự cấp mã GT cho lô khoảng trống taxonomy
  - Đường phán quyết khi trẻ không hành động
depends_on:
  - GAME-TEMPLATE-CONTRACT
  - TEMPLATE-AUTHORING-KIT
  - LEGACY-V1-TEMPLATE-BATCH
  - GAME-LAYOUT-ENGINE
  - CONTENT-TAGGING
  - THINKING-COVERAGE-MATRIX
---

# Lô khuôn khoảng trống taxonomy — ba cơ chế không dạng bài v1 nào có

## 1. Objective

Mục 7.2 của [`legacy-v1-template-batch.md`](legacy-v1-template-batch.md) để lại ba tên khuôn
chưa cấp mã: `tpl-spot-difference`, `tpl-go-nogo`, `tpl-rule-switch`. Chúng bị giữ ngoài lô
kế thừa vì **không dạng bài v1 nào dùng chúng** — nên đưa vào đó sẽ làm hỏng tiêu chí port
13 trên 15 dạng bài. Câu hỏi còn mở số 1 của file đó chốt: lô riêng, sau `GT-024`. File này
là lô riêng đó.

Chúng không phục vụ việc port. Chúng phục vụ ba lỗ đo được:

**Lỗ thứ nhất — hai giá trị trục tư duy không cách nào sinh ra.** Trục `thinking` ở mục 7.1
của [`content-tagging.md`](content-tagging.md) khai 12 giá trị, trong đó có `inhibit` và
`shift`. Không `mechanic` nào trong 24 khuôn hiện có sinh ra chúng: `inhibit` cần một khuôn
chấm việc **kìm** phản xạ, `shift` cần một khuôn **đổi luật giữa chừng**. Đo ngày 2026-08-22,
`shift` bằng 0 trên toàn catalog và sẽ đứng yên ở 0 dù soạn thêm bao nhiêu nội dung.

**Lỗ thứ hai — hai năng lực đói khuôn.** `docs/taxonomy/` ghi C4 là "khoảng trống lớn nhất
của sản phẩm" (3 trên 60 dạng bài v1) và C6 là năng lực dự báo thành tích học tập mạnh nhất ở
tuổi mầm non nhưng cũng chỉ có 3 dạng bài. Ba khuôn của lô này rơi đúng vào đó: tìm điểm khác
biệt cho C4, kìm phản xạ và đổi luật cho C6.

**Lỗ thứ ba — ba strand chưa khuôn nào chạm.** `C6.INH` (kìm chế), `C6.FLX` (linh hoạt nhận
thức) và `C4.VIS.01` (tìm điểm khác giữa hai tranh) có skill đã đặt tên nhưng không khuôn nào
chạy được bài cho chúng.

**Port cơ chế, không port code** — giữ nguyên nguyên tắc của lô trước. File này định nghĩa
khuôn nào tồn tại, mã nào, và khi nào lô được coi là xong. `content_contract` của từng khuôn
là code, thuộc mục 7.1 của [`game-template-contract.md`](game-template-contract.md).

## 2. Actors

| Actor | Quyền cần | Làm được gì ở đây |
|---|---|---|
| Dev engine | — | Cấp mã theo mục 7.1, viết file mô tả và Session class |
| Người soạn nội dung | `requireManagerAuth()` | Soạn ba level mẫu cho mỗi khuôn |
| Cổng nghiệm thu | — | Chặn khuôn chưa đủ điều kiện mục 7.5 |
| Người quyết | — | Duyệt việc mở rộng hợp đồng `GameSession` ở mục 7.3 |

## 3. Entry points

| Route / màn hình | Actor | Ghi chú |
|---|---|---|
| `pnpm exec tsx packages/game-engine/scripts/create-template.ts <mã khuôn> <tên> <mechanic>` | Dev engine | Bộ dựng khuôn, sinh thư mục template |
| `pnpm --filter @mindkid/game-engine gen:templates` | Dev engine | Sinh lại mọi điểm nối, xem `BR-TAK-01` ở mục 6 của [`template-authoring-kit.md`](template-authoring-kit.md) |
| [`game-level-studio.md`](../06-admin/game-level-studio.md) | Người soạn nội dung | Soạn level mẫu sau khi khuôn `active` |

## 4. Main flow

Trình tự cho **một** khuôn trong lô:

1. Đọc hàng của khuôn ở mục 7.1 — mã, `mechanic`, nguyên thuỷ, system, band tuổi.
2. Nhóm B: viết system mới kèm bộ test **độc lập với khuôn dùng nó** (`BR-TGB-08`).
3. `GT-026`: mở rộng hợp đồng `GameSession` theo mục 7.3 **trước**, kèm sửa mục 7.4 của
   [`game-template-contract.md`](game-template-contract.md) trong cùng PR.
4. Chạy bộ dựng khuôn, viết `template.ts` và `session.ts` trong đúng thư mục đó.
5. Đăng ký giá trị `mechanic` vào từ vựng trục `mechanic` ở mục 7.1 của
   [`content-tagging.md`](content-tagging.md).
6. Soạn **ba** game level mẫu chạy được (`BR-TGB-06`).
7. Chạy `pnpm --filter @mindkid/game-engine gen:templates`, kiểm không file viết tay nào ngoài thư mục khuôn đổi.
8. Cổng nghiệm thu mục 7.5 xanh thì khuôn vào `game_templates` với `status: published`.

## 5. Alternative flows

| Nhánh | Điều kiện | Hành vi |
|---|---|---|
| Người quyết không duyệt mở rộng hợp đồng | Rủi ro với 24 khuôn đang chạy | `GT-026` hoãn, `GT-025` và `GT-027` vẫn đi tiếp. Mã đã cấp giữ nguyên, cấm dùng lại cho khuôn khác (`BR-TGB-02`) |
| Nguyên thuỷ hiện có không đủ | Cơ chế mới thật sự | Thêm nguyên thuỷ vào bộ dùng chung, không tự cài trong Session (`BR-TAK-05`) |
| Khuôn trùng `mechanic` với khuôn đã có | Chỉ khác độ khó | Từ chối cấp mã. Đổi `difficulty_params` |
| Khuôn không có fallback tap được | Cử chỉ kéo liên tục | Khai `banned_age_bands` thay vì nới cử chỉ |
| Level mẫu của lô làm thủng một sàn ở mục 7.3 của [`thinking-coverage-matrix.md`](../08-quality/thinking-coverage-matrix.md) | Soạn lệch band | Cổng phủ đỏ. Sửa nội dung, cấm nới sàn |

## 6. Business rules

| ID | Rule | Vì sao |
|---|---|---|
| `BR-TGB-01` (lô riêng) | Ba khuôn này là **một lô riêng**, không ghép ngược vào lô kế thừa v1 | Cổng hoàn tất của lô kia đo tiêu chí port 13 trên 15 dạng bài v1. Ba khuôn không port dạng bài nào sẽ làm con số đó nói dối |
| `BR-TGB-02` (mã bất biến) | Mã cấp theo mục 7.1, **bất biến** kể cả khi khuôn bị hoãn hay `deprecated` | Mục 7 của [`id-conventions.md`](../00-foundation/id-conventions.md) — `game_levels` đã seed trỏ vào mã đó |
| `BR-TGB-03` (`inhibit` và `shift` có nguồn) | Sau lô này, mỗi giá trị `inhibit` và `shift` của trục `thinking` phải có **ít nhất một** `mechanic` sinh ra được | Đây là toàn bộ lý do lô tồn tại. Một trục khai 12 giá trị mà hai giá trị không cách nào đạt được là một trục nói dối |
| `BR-TGB-04` (không-hành-động là một phán quyết) | `GT-026` phán quyết được việc trẻ **không** chạm. Đường đó nằm trong hợp đồng `GameSession` dùng chung, không nằm riêng trong Session của khuôn | Cài riêng trong một Session thì khuôn thứ hai cần nó sẽ cài lại lần nữa, đúng thứ `BR-TAK-05` cấm |
| `BR-TGB-05` (không-hành-động vẫn có phản hồi) | Hết thời gian mà trẻ không chạm thì vẫn phát phản hồi, không im lặng | `BR-ENG-07` — sai đáp án luôn có phản hồi. Không hành động cũng là một đáp án |
| `BR-TGB-06` (ba level mẫu) | Mỗi khuôn có **≥3** game level mẫu trước khi được sinh vào registry | Giữ nguyên `BR-TAK-09`. Contract chưa từng có dữ liệu thật là contract chưa được kiểm |
| `BR-TGB-07` (đổi luật phải báo) | `GT-027` **bắt buộc** báo cho trẻ biết luật vừa đổi, bằng âm thanh và bằng hình | Đổi luật im lặng đo phản xạ đoán mò, không đo linh hoạt nhận thức. Ở tuổi mầm non nó chỉ tạo cảm giác bị lừa |
| `BR-TGB-08` (system có test riêng) | System mới của nhóm B kèm bộ test **không phụ thuộc** khuôn dùng nó | Giữ nguyên `BR-LVB-12`. System chỉ được kiểm qua khuôn là system không kiểm được khi khuôn thứ hai dùng nó |
| `BR-TGB-09` (`mechanic` đăng ký trước khi seed) | Ba giá trị `mechanic` mới có trong từ vựng trục `mechanic` **trước** khi khuôn được seed | Trục `mechanic` là một chiều của ma trận ở mục 7.2 của [`thinking-coverage-matrix.md`](../08-quality/thinking-coverage-matrix.md). Mechanic không đăng ký làm ô đa dạng cơ chế đếm sai mà không ai thấy |
| `BR-TGB-10` (band 3–4 không kìm chế) | `GT-026` và `GT-027` khai `banned_age_bands: ["3-4"]` | Kìm phản xạ và đổi luật là chức năng điều hành phát triển sau 4 tuổi. Ép trẻ 3 tuổi làm là thiết kế sai, không phải độ khó cao |

## 7. Data

**Đọc:** thư mục `packages/game-engine/src/templates/`.
**Ghi:** `packages/game-engine/src/generated/` · hàng seed `game_templates`.

### 7.1 Danh mục ba khuôn

**Nhóm A — không thêm system.**

| Mã | Tên | `mechanic` | Nguyên thuỷ | Layout | Band | Fallback tap | Strand phục vụ |
|---|---|---|---|---|:--:|:--:|---|
| `GT-025` | Tìm điểm khác biệt | `spot-difference` | `selection` | `split-columns` | 4–6 | Không cần | `C4.VIS.01` |

`GT-025` là hai bảng cạnh nhau, trẻ chạm vào ô khác nhau. Không system mới, không layout mới
— `split-columns` đã có trong registry của [`game-layout-engine.md`](game-layout-engine.md).

**Nhóm B — mỗi khuôn kéo theo một system engine mới.**

| Mã | Tên | `mechanic` | System mới | Nguyên thuỷ | Band | Fallback tap | Strand phục vụ |
|---|---|---|---|---|:--:|:--:|---|
| `GT-026` | Chỉ chạm khi đúng dấu | `go-nogo` | `inhibitionSystem` | `selection` | 4–6 | Không cần | `C6.INH` |
| `GT-027` | Đổi luật giữa chừng | `rule-switch` | `ruleSystem` | `selection` | 5–6 | Không cần | `C6.FLX` |

`GT-026` dùng lại `FlashTimer` của `timer-system.ts` cho cửa sổ thời gian; phần mới của nó
chỉ là luật chấm cho một không-hành-động. `GT-027` giữ một luật đang hiệu lực và đổi nó sau
`n` lượt; phần mới là trạng thái luật và đường báo đổi luật.

### 7.2 Vì sao ba, không phải ít hơn

| Gộp thử | Vì sao không gộp được |
|---|---|
| `go-nogo` vào `tap-select` | `tap-select` chấm **lượt chạm**. `go-nogo` chấm cả lượt **không** chạm, và lượt không chạm không sinh `GameAction` nào |
| `rule-switch` vào `tap-select` | `tap-select` có một luật đúng cố định suốt lượt chơi. Đổi luật giữa chừng làm `checkWinCondition()` phụ thuộc lịch sử, khác hẳn hình dạng hiện tại |
| `rule-switch` vào `go-nogo` | Hai thứ khác nhau: một cái đo **kìm** một phản xạ, một cái đo **bỏ** một luật cũ để theo luật mới. Trẻ giỏi cái này thường kém cái kia — gộp lại thì điểm không nói gì |
| `spot-difference` vào `tap-select-multi` | Gần nhất trong ba, nhưng `tap-select-multi` chọn trong **một** tập theo tiêu chí. `spot-difference` so **hai** tập và chấm cặp lệch, nên `content_pack` là hai bảng chứ không phải một danh sách |

### 7.3 Đường phán quyết khi trẻ không hành động

Đây là câu hỏi còn mở số 2 của [`legacy-v1-template-batch.md`](legacy-v1-template-batch.md).
`go-nogo` là cơ chế duy nhất trong toàn bộ khảo sát chạm vào hợp đồng `GameSession`.

Hôm nay `ActionResult` chỉ sinh từ `validateAction(action)`. Phần đã có sẵn: `update(deltaMs)`
được gọi mỗi frame tại `packages/game-engine/src/core.ts`, nên đồng hồ đã chạy. Phần thiếu là
một đường phát `ActionResult` khi cửa sổ thời gian đóng mà không có `GameAction` nào.

Ba đường có thể đi:

| Đường | Hình dạng | Đánh giá |
|---|---|---|
| Session tự phát trong `update()` | `update(deltaMs)` trả `ActionResult \| null` | Đổi chữ ký một hàm đã có, mọi Session hiện tại trả `null`. Ít lan nhất |
| Thêm `checkTimeout()` vào hợp đồng | Hàm mới, mọi Session phải cài | 27 Session phải cài một hàm mà 26 cái không dùng |
| Engine sinh `GameAction` giả kiểu `timeout` | Không đổi hợp đồng | `validateAction()` nhận một action trẻ không làm. Telemetry sẽ ghi một hành động không có thật |

Khuyến nghị là đường thứ nhất. Nó là quyết định của người quyết, ghi ở mục 11 câu 1.

### 7.4 Thứ tự cấp mã

| Mã | Cấp cho | Điều kiện trước |
|---|---|---|
| `GT-025` | `spot-difference` | Không có. Đi được ngay |
| `GT-026` | `go-nogo` | Mục 7.3 được duyệt |
| `GT-027` | `rule-switch` | `ruleSystem` có test riêng |

Mã cấp liền sau `GT-024` của lô kế thừa v1, không bỏ số. `GT-026` hoãn thì mã vẫn giữ chỗ.

### 7.5 Cổng hoàn tất lô

- [ ] Ba mã `GT-025`, `GT-026`, `GT-027` có trong registry sinh ra.
- [ ] Ba giá trị `mechanic` có trong từ vựng trục `mechanic` (`BR-TGB-09`).
- [ ] Mỗi khuôn có ≥3 game level mẫu parse được bằng `content_contract` của nó (`BR-TGB-06`).
- [ ] `pnpm --filter @mindkid/game-engine test` xanh, không file viết tay nào ngoài ba thư mục khuôn đổi.
- [ ] `inhibitionSystem` và `ruleSystem` có bộ test riêng (`BR-TGB-08`).
- [ ] `pnpm --filter @mindkid/db test` báo `inhibit` và `shift` khác 0 (`BR-TGB-03`).
- [ ] Một ca âm khẳng định `GT-026` phát phản hồi khi trẻ không chạm (`BR-TGB-05`).

## 8. API contract

Không sở hữu route. Hai route liên quan thuộc mục 8 của
[`game-template-contract.md`](game-template-contract.md) và giữ nguyên hình dạng — chúng chỉ
nhận thêm ba mã trong registry sinh ra.

## 9. Acceptance criteria

```gherkin
Scenario: BR-TGB-03 — inhibit và shift có nguồn sinh ra
  Given ba khuôn của lô đã published và mỗi khuôn có ba level mẫu
  When chạy cổng đo phủ trục tư duy
  Then giá trị "inhibit" khác 0
  And giá trị "shift" khác 0

Scenario: BR-TGB-04 — không hành động vẫn ra phán quyết
  Given một lượt GT-026 có dấu cấm chạm và cửa sổ thời gian 2 giây
  When trẻ không chạm gì cho tới khi cửa sổ đóng
  Then phiên chơi ghi nhận một lượt đúng
  And đường phán quyết đó nằm trong hợp đồng GameSession dùng chung

Scenario: BR-TGB-05 — không hành động vẫn có phản hồi
  Given một lượt GT-026 có dấu phải chạm
  When trẻ không chạm gì cho tới khi cửa sổ đóng
  Then trẻ nhận một phản hồi thấy được
  And phản hồi đó không phải im lặng

Scenario: BR-TGB-07 — đổi luật phải báo
  Given một lượt GT-027 đang chạy luật "chọn theo màu"
  When luật đổi sang "chọn theo hình"
  Then trẻ nhận một báo hiệu bằng âm thanh và một báo hiệu bằng hình
  And lượt tiếp theo chỉ bắt đầu sau khi báo hiệu kết thúc

Scenario: BR-TGB-10 — band 3-4 không mở hai khuôn điều hành
  Given trẻ trong band tuổi 3-4
  When hỏi danh sách khuôn mở được
  Then GT-026 không có trong danh sách
  And GT-027 không có trong danh sách

Scenario: BR-TGB-01 — lô riêng, không ghép vào lô kế thừa
  When đọc cổng hoàn tất của lô kế thừa v1
  Then tiêu chí port dạng bài v1 không tính ba khuôn của lô này

Scenario: BR-TGB-08 — system mới có test riêng
  Given inhibitionSystem và ruleSystem đã viết xong
  When chạy bộ test của hai system đó mà không dựng khuôn nào
  Then cả hai bộ test chạy được và xanh

Scenario: BR-TGB-09 — mechanic chưa đăng ký thì không seed được
  Given khuôn GT-025 khai mechanic "spot-difference"
  And giá trị đó chưa có trong từ vựng trục mechanic
  When chạy cổng seed
  Then cổng đỏ và nêu giá trị mechanic chưa đăng ký
```

## 10. Boundaries

**Always**

- Giữ mọi thay đổi của một khuôn mới trong thư mục của khuôn đó.
- Đăng ký `mechanic` trước khi seed.
- Báo cho trẻ biết luật vừa đổi.
- Phát phản hồi cho một không-hành-động.

**Ask first**

- Mở rộng hợp đồng `GameSession` theo mục 7.3.
- Thêm một nguyên thuỷ cơ chế mới.
- Mở `GT-026` hoặc `GT-027` cho band 3–4.

**Never**

- Ghép ba khuôn này vào lô kế thừa v1.
- Dùng lại mã của một khuôn bị hoãn cho khuôn khác.
- Đổi luật giữa chừng mà không báo.
- Đưa khuôn vào registry khi chưa có level mẫu.
- Nới sàn của ma trận phủ để level mẫu của lô đi qua.

## 11. Open questions

| # | Câu hỏi | Chặn gì | Chặn phase | Chủ | Quyết định / Trạng thái |
|---|---|---|---|---|---|
| 1 | Ba đường ở mục 7.3 chọn đường nào? Khuyến nghị là để `update(deltaMs)` trả `ActionResult \| null` | `GT-026`, và hợp đồng `GameSession` | P5 | người quyết | Mở |
| 2 | `GT-027` đổi luật sau bao nhiêu lượt, và có báo trước hay không? Tools of the Mind dùng báo trước ở tuổi mầm non, các thang đo linh hoạt nhận thức thì không | `content_contract` của `GT-027` | P5 | Nội dung | Mở |
| 3 | `spot-difference` cần loại asset là hai ảnh gần giống nhau. Ba loại asset hiện có (`emoji`, `image`, `audio`) đủ chưa, hay cần một cặp ảnh có ràng buộc lệch nhau đúng `n` chỗ? | `content_contract` của `GT-025` | P5 | Infra | Mở |
| 4 | Lô này chỉ nói khuôn. Ai soạn nội dung cho ba strand được mở ra, và theo lô nào? | Kế hoạch nội dung sau khi khuôn xong | P5 | Nội dung | hoãn — chốt cùng lô nội dung tương ứng |
