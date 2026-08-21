---
spec: LEGACY-V1-TEMPLATE-BATCH
title: Lô khuôn kế thừa v1 — bảy cơ chế còn lại
area: platform
status: implemented
mvp: false
phase: P5
reviewed: 2026-08-22
owns:
  - Danh mục bảy khuôn trò chơi lô kế thừa v1
  - Thứ tự cấp mã GT cho lô kế thừa v1
  - Ánh xạ tên khuôn `tpl-*` của bảng migration sang mã `GT-*`
  - Danh sách cơ chế v1 không port và lý do
depends_on:
  - GAME-TEMPLATE-CONTRACT
  - TEMPLATE-AUTHORING-KIT
  - MONTESSORI-TEMPLATE-BATCH
  - GAME-LAYOUT-ENGINE
  - DETERMINISTIC-RANDOMNESS
  - ROUND-SEQUENCE-PLAY
---

# Lô khuôn kế thừa v1 — bảy cơ chế còn lại

## 1. Objective

v1 có **60 game type** cài bằng 60 Session class viết tay, và đo được **59 giá trị `mechanic`
khác nhau** — tức gần như không tái dùng gì. v2 thay chúng bằng khuôn: mười bảy khuôn hiện có
(`GT-001` tới `GT-017`) phục vụ **45** trong 60 dạng bài đó.

Còn lại **15 dạng bài v1 không khuôn nào chạy được**, gom về **tám cơ chế**. File này biến bảy
trong tám cơ chế đó thành một danh mục có mã, có lớp chi phí, có điều kiện nghiệm thu — và ghi
lại vì sao cơ chế thứ tám không được port.

Nó tồn tại vì ba lý do. Thứ nhất, mã `GT-*` bất biến
([`id-conventions.md`](../00-foundation/id-conventions.md) mục 7) — cấp bừa là hỏng vĩnh viễn,
và [`montessori-template-batch.md`](montessori-template-batch.md) đã lấy tới `GT-017`. Thứ hai,
bảng ở [`game-type-migration.md`](../../taxonomy/game-type-migration.md) gọi khuôn bằng tên
`tpl-*` chưa từng khớp với mã `GT-*` nào, nên không ai trả lời được "dạng bài v1 này chạy bằng
khuôn nào hôm nay". Thứ ba, một cơ chế bị bỏ mà không ghi lý do sẽ được người sau đề xuất lại.

**Port cơ chế, không port code.** Session class của v1 dài 8–31 KB mỗi file và tự cài lại chọn,
kéo, ghép, sắp. Thứ được mang sang là ý tưởng chơi; phần cài đặt viết mới trên bốn nguyên thuỷ
cơ chế dùng chung của [`template-authoring-kit.md`](template-authoring-kit.md).

File này **không** định nghĩa `content_contract` của từng khuôn — đó là code, thuộc mục 7.1 của
[`game-template-contract.md`](game-template-contract.md). Nó định nghĩa khuôn nào tồn tại, mã
nào, và khi nào lô được coi là xong.

## 2. Actors

| Actor | Quyền cần | Làm được gì ở đây |
|---|---|---|
| Dev engine | — | Cấp mã theo mục 7.1, viết file mô tả và Session class |
| Người soạn nội dung | `requireManagerAuth()` | Soạn ba level mẫu cho mỗi khuôn |
| Cổng nghiệm thu | — | Chặn khuôn chưa đủ điều kiện mục 7.4 |
| Người quyết | — | Duyệt cơ chế không port ở mục 7.3, duyệt loại asset mới |

## 3. Entry points

| Route / màn hình | Actor | Ghi chú |
|---|---|---|
| `pnpm exec tsx packages/game-engine/scripts/create-template.ts <mã khuôn> <tên> <mechanic>` | Dev engine | Bộ dựng khuôn, sinh thư mục template |
| `pnpm --filter @mindkid/game-engine gen:templates` | Dev engine | Sinh lại mọi điểm nối (`BR-TAK-01`) |
| [`game-level-studio.md`](../06-admin/game-level-studio.md) | Người soạn nội dung | Soạn level mẫu sau khi khuôn `active` |

## 4. Main flow

Trình tự cho **một** khuôn trong lô:

1. Đọc hàng của khuôn ở mục 7.1 — mã, `mechanic`, nguyên thuỷ, system, band tuổi.
2. Nhóm B: đăng ký layout mới vào registry của
   [`game-layout-engine.md`](game-layout-engine.md) trước, kèm hàm hình học và test.
3. Nhóm B: viết system mới kèm bộ test **độc lập với khuôn dùng nó** (`BR-LVB-12`).
4. Chạy bộ dựng khuôn, viết `template.ts` và `session.ts` trong đúng thư mục đó.
5. Đăng ký giá trị `mechanic` vào từ vựng trục `mechanic` của
   [`content-tagging.md`](content-tagging.md) mục 7.
6. Soạn **ba** game level mẫu chạy được (`BR-LVB-07`).
7. Chạy `pnpm --filter @mindkid/game-engine gen:templates`, kiểm không file viết tay nào ngoài thư mục khuôn đổi.
8. Cổng nghiệm thu mục 7.4 xanh thì khuôn vào `game_templates` với `status: published`.

## 5. Alternative flows

| Nhánh | Điều kiện | Hành vi |
|---|---|---|
| Cơ chế v1 không port được | Xung đột hợp đồng engine hoặc mô hình điểm | Ghi một hàng vào mục 7.3 kèm lý do. Cấm bỏ im lặng (`BR-LVB-10`) |
| Khuôn cần loại asset ngoài ba loại đã có | Ví dụ cần vector path | **Ask first** trước khi viết `template.ts` |
| Khuôn không có fallback tap được | Cử chỉ kéo liên tục | Khai `banned_age_bands` thay vì nới cử chỉ (`BR-LVB-06`) |
| Nguyên thuỷ hiện có không đủ | Cơ chế mới thật sự | Thêm nguyên thuỷ vào bộ dùng chung, không tự cài trong Session |
| Khuôn trùng `mechanic` với khuôn đã có | Chỉ khác độ khó | Từ chối cấp mã. Đổi `difficulty_params` (`BR-LVB-04`) |
| Ba level mẫu chưa soạn xong | Nội dung chậm hơn code | Khuôn giữ `status: draft`, chưa vào registry |

## 6. Business rules

| ID | Rule | Vì sao |
|---|---|---|
| `BR-LVB-01` (mã cấp tuần tự) | Mã lô kế thừa v1 là `GT-018` tới `GT-024`, cấp **tuần tự**, cấm bỏ trống số ở giữa | Mã bất biến theo mục 7 của [`id-conventions.md`](../00-foundation/id-conventions.md). Lỗ ở giữa dãy làm người sau tưởng có khuôn đã bị xoá và đi tìm nó |
| `BR-LVB-02` (mã cấp theo lớp chi phí) | `GT-018` và `GT-019` **không thêm file nào** dưới `systems/`; `GT-020` tới `GT-024` mỗi khuôn thêm **đúng một** system | Giữ nguyên quy ước của `BR-MTB-02` (mã cấp theo lớp chi phí). Đọc mã là biết ngay khuôn thuộc lớp chi phí nào, không phải mở code ra đếm |
| `BR-LVB-03` (port cơ chế, không port code) | Cấm — **NEVER chép Session class của v1 sang v2.** Session class viết mới trên bốn nguyên thuỷ dùng chung | `BR-TAK-05` (Session dựng trên nguyên thuỷ). Sáu mươi Session class của v1 tự cài lại chọn, kéo, ghép, sắp — chép sang là chép lại đúng thứ v2 tồn tại để bỏ |
| `BR-LVB-04` (một mechanic một khuôn) | Mỗi giá trị `mechanic` chỉ có **một** khuôn. Khác độ khó thì khác `difficulty_params`, không khác mã | `BR-GTC-03` (tách nội dung khỏi độ khó). Hai mã cho một cơ chế là hai chỗ phải sửa mỗi lần cơ chế đó đổi |
| `BR-LVB-05` (mechanic phải đăng ký) | Giá trị `mechanic` của khuôn mới phải vào từ vựng trục `mechanic` của [`content-tagging.md`](content-tagging.md) **trước khi** khuôn được seed | Trục `mechanic` suy ra từ `game_templates.mechanic` và là một trong ba trục mà [`thinking-coverage-matrix.md`](../08-quality/thinking-coverage-matrix.md) đo. Giá trị lạ lọt vào làm phép đo phủ sai mà không kêu |
| `BR-LVB-06` (band tuổi thay vì nới cử chỉ) | Khuôn có cử chỉ kéo mà `age_min` bằng 3 hoặc 4 **bắt buộc** khai `requires_tap_fallback` và có đường chạm-chạm thật. Khuôn không làm được fallback thì khai `banned_age_bands`, Cấm — **NEVER nới cử chỉ để phủ thêm band** | `BR-GTC-06` (fallback tap) và `BR-ENG-12` (cấm thao tác vận động tinh). Kéo liên tục ở tuổi 3–4 là thiết kế sai, không phải độ khó cao — hạ band là câu trả lời đúng |
| `BR-LVB-07` (ba level mẫu là điều kiện) | Khuôn chưa có **ít nhất ba** game level mẫu chạy được thì chưa nghiệm thu | `BR-TAK-09`. Một contract chưa từng có dữ liệu thật là contract chưa được kiểm; lỗi của nó lộ ra lúc trẻ mở màn chơi |
| `BR-LVB-08` (điểm nối do bộ sinh mã) | Cấm — **NEVER thêm mã khuôn mới vào một điểm nối bằng tay** | `BR-TAK-01`. Mười một điểm nối sửa tay thì lần thứ tám sẽ quên một chỗ, và chỗ quên đó là một màn hình trắng |
| `BR-LVB-09` (phát event vòng ngay từ đầu) | Mọi khuôn lô này **bắt buộc** phát `round_started` và `round_completed` theo `BR-RSP-02` ngay ở phiên bản đầu tiên | Mười bảy khuôn hiện có không phát, và hệ quả là `rounds_total = 0` nên không trẻ nào lên được hai sao — xem mục 1 của [`round-sequence-play.md`](../04-play/round-sequence-play.md). Khuôn mới kế thừa lỗ đó là nhân lỗ lên |
| `BR-LVB-10` (không bỏ im lặng) | Cơ chế v1 không port phải có một hàng ở mục 7.3 kèm lý do và điều kiện mở lại | Một cơ chế bị bỏ mà không ghi lý do sẽ được người sau đề xuất lại, và cuộc thảo luận cũ chạy lại từ đầu |
| `BR-LVB-11` (chỉ thêm, không sửa) | Khuôn lô này Cấm — **NEVER đổi `content_contract` của bất kỳ khuôn nào đã publish** | `BR-GTC-08` (breaking change). Mọi `game_level` đã seed giữ `content_pack` parse được bằng contract cũ; đổi contract mà không migrate là màn hình trắng phát hiện lúc chơi, không phải lúc deploy |
| `BR-LVB-12` (system mới có test riêng) | Mỗi system của nhóm B có bộ test **độc lập với khuôn dùng nó** | `BR-MTB-15`. Một system chỉ được thử gián tiếp qua một khuôn thì lỗi của nó bị đọc nhầm thành lỗi của khuôn |
| `BR-LVB-13` (xáo trộn có seed) | Mọi xáo trộn vị trí, thứ tự vật gây nhiễu, chọn biến thể phải đi qua [`deterministic-randomness.md`](deterministic-randomness.md) | Phiên chơi không tái lập được thì không điều tra được một báo cáo bất thường của một đứa trẻ cụ thể |
| `BR-LVB-14` (ngân sách bundle) | Mỗi khuôn ≤ **80 KB** gzipped, kể cả system riêng của nó | `BR-ENG-17` (ngân sách bundle mỗi template). Session class nạp động theo mã (`BR-TAK-08`) nên trần này là trần thật, không phải trần chung |
| `BR-LVB-15` (cổng hoàn tất lô) | Lô xong khi **mọi** dạng bài v1 hoặc có khuôn `published`, hoặc có một hàng ở mục 7.3 | Không có cổng thì "port xong chưa" là câu trả lời theo cảm giác. Đây là câu hỏi mà mục 7.4 biến thành một lệnh chạy được |

## 7. Data

**Đọc:** [`game-type-migration.md`](../../taxonomy/game-type-migration.md) ·
`packages/game-engine/src`.
**Ghi:** `game_templates` Lớp 1, qua seeder, sau khi khuôn nghiệm thu.

### 7.0 Năng lực engine đo được, 2026-08-21

Đo trên [`packages/game-engine/src`](../../../packages/game-engine/src).

| Thứ | Đã có | Còn thiếu cho lô này |
|---|---|---|
| Nguyên thuỷ cơ chế | 4 — `ordering` · `pairing` · `placement` · `selection` | Không cần thêm |
| Layout | **19** `LayoutId` trên **12** hàm hình học, **tất cả** đang được ít nhất một khuôn dùng | 2 layout mới cho nhóm B |
| System dùng chung | audio · feedback · render · scaffolding · sfx · speech · degradation · design token | — |
| System riêng của khuôn | `timerSystem` (GT-012) · `mazeSystem` (GT-013) · `balanceSystem` (GT-014) · `constraintSystem` (GT-015) · `rotationSystem` (GT-016) · `isometricSystem` (GT-017) | 5 system mới |
| Âm thanh | `AudioController` và `SpeechSynthesisAdapter` (`vi-VN`, chỉ phát, không xin quyền microphone) đã dựng sẵn ở `core.ts` | Không cần thêm |
| Khuôn đã có | 17, phủ 45/60 dạng bài v1 | 7 khuôn cho 13 dạng bài còn lại |

Hàng áp chót đáng chú ý: hạ tầng âm thanh đã trả tiền và đã gắn vào engine, nhưng **không khuôn
nào trong mười bảy khuôn hiện có dùng nó làm cơ chế chơi**. `GT-018` là khuôn đầu tiên tiêu nó,
nên nó nằm ở nhóm chi phí thấp nhất dù phục vụ ba dạng bài.

### 7.1 Danh mục bảy khuôn

**Nhóm A — không thêm system.**

| Mã | Tên | `mechanic` | Nguyên thuỷ | System dùng lại | Band | Fallback tap | Dạng bài v1 phủ |
|---|---|---|---|---|:--:|:--:|---|
| `GT-018` | Nghe rồi làm | `listen-respond` | `selection` · `ordering` | `AudioController` · `SpeechSynthesisAdapter` | 4–6 | Không cần | C3-04 · C3-08 · C5-01 |
| `GT-019` | Xoay và lật mảnh | `rotate-transform` | `placement` | `rotationSystem` | 4–6 | Có | C2-04 · C2-09 |

`GT-019` mở rộng `rotationSystem` đã có chứ không thêm file mới dưới `systems/` — đó là lý do
nó thuộc nhóm A. Xoay bằng **nút bấm góc 90 độ**, Cấm — **NEVER xoay bằng cử chỉ hai ngón**
(`BR-ENG-12`).

**Nhóm B — mỗi khuôn kéo theo một system engine mới.**

| Mã | Tên | `mechanic` | System mới | Layout mới | Nguyên thuỷ | Band | Fallback tap | Dạng bài v1 phủ |
|---|---|---|---|---|---|:--:|:--:|---|
| `GT-020` | Lật thẻ tìm cặp | `memory-flip` | `cardSystem` | — | `pairing` | 3–6 | Không cần | C6-03 |
| `GT-021` | Hoàn thiện đối xứng | `mirror-complete` | `mirrorSystem` | `mirror-axis-split` | `placement` | 4–6 | Có | C2-03 |
| `GT-022` | Tìm vật trong tranh | `hidden-object` | `sceneSystem` | `free-scene` | `selection` | 4–6 | Không cần | C4-01 · C4-03 |
| `GT-023` | Lắp ghép | `construct` | `assemblySystem` | — | `placement` | 4–6 | Có | C2-02 · C2-07 |
| `GT-024` | Vẽ theo nét chấm | `trace-path` | `traceSystem` | — | `ordering` | 5–6 | Không làm được | C2-08 |

`GT-020` dùng lại layout `card-flip-grid` và `timerSystem` đã có, nên system mới của nó chỉ là
trạng thái lật và luật ghép cặp. `GT-024` khai `banned_age_bands: ["3-4"]` vì vẽ theo nét là
kéo liên tục và không có đường chạm-chạm tương đương (`BR-LVB-06`).

### 7.2 Ánh xạ `tpl-*` sang mã `GT-*`

Bảng ở [`game-type-migration.md`](../../taxonomy/game-type-migration.md) gọi khuôn bằng tên
`tpl-*`. Đây là ánh xạ sang mã thật. Cột cuối cho biết mã đã tồn tại hay do lô này cấp.

| Tên trong bảng migration | Mã | Nguồn |
|---|---|---|
| `tpl-tap-select` · `tpl-tap-count` | `GT-001` · `GT-002` | Đã có |
| `tpl-drag-to-container` · `tpl-coin-count` | `GT-003` | Đã có |
| `tpl-pair-match` | `GT-005` | Đã có |
| `tpl-drag-to-order` · `tpl-sequence-arrange` | `GT-006` | Đã có |
| `tpl-drag-to-slot` | `GT-008` | Đã có |
| `tpl-logic-grid` | `GT-009` | Đã có |
| `tpl-matrix-fill` | `GT-011` | Đã có |
| `tpl-flash-recall` | `GT-012` | Đã có |
| `tpl-maze-route` | `GT-013` | Đã có |
| `tpl-balance` | `GT-014` | Đã có |
| `tpl-grid-fill` | `GT-015` | Đã có |
| `tpl-clock-set` | `GT-016` | Đã có |
| `tpl-construct` phần xếp khối | `GT-017` | Đã có |
| `tpl-listen-respond` | `GT-018` | Lô này |
| `tpl-rotate-transform` | `GT-019` | Lô này |
| `tpl-memory-flip` | `GT-020` | Lô này |
| `tpl-mirror-complete` | `GT-021` | Lô này |
| `tpl-hidden-object` | `GT-022` | Lô này |
| `tpl-construct` phần lắp ghép | `GT-023` | Lô này |
| `tpl-trace-path` | `GT-024` | Lô này |
| `tpl-free-create` | không cấp | Mục 7.3 |
| `tpl-spot-difference` · `tpl-go-nogo` · `tpl-rule-switch` | chưa cấp | Ngoài lô, xem câu hỏi còn mở số 1 |

Ba tên ở hàng cuối nằm trong cột "Template cần xây mới" của bảng migration nhưng **không có
dạng bài v1 nào** dùng chúng. Chúng phục vụ khoảng trống taxonomy, không phục vụ việc port,
nên không thuộc lô này.

### 7.3 Cơ chế v1 không port

| Cơ chế v1 | Dạng bài | Vì sao không port | Điều kiện mở lại |
|---|---|---|---|
| `free-create` | C3-05 Tự tạo quy luật · C3-06 Tạo nhịp | Khuôn không có đáp án đúng. `checkWinCondition()` là hợp đồng của mọi Session (`BR-GTC-09`), và điểm dựng trên `rounds_correct` ở mục 7.2 của [`scoring-and-result.md`](../04-play/scoring-and-result.md). Một khuôn không có đáp án đúng làm `normalized_score` vô nghĩa và đẩy `correct_ratio` bịa vào adaptive | Có quyết định sản phẩm về "hoàn thành khác với đúng", kèm một đường điểm riêng cho khuôn không chấm được. Là quyết định sản phẩm, không phải quyết định kỹ thuật |

Một hàng, không phải không có hàng nào: hai dạng bài này **có thật** trong v1 và việc bỏ chúng
là một lựa chọn, không phải một sơ suất.

### 7.4 Cổng hoàn tất lô

Cổng chạy được, không phải checklist đọc bằng mắt.

- [ ] Mọi mã từ `GT-001` tới `GT-024` tồn tại dưới `packages/game-engine/src/templates`
- [ ] Không hai khuôn nào trùng giá trị `mechanic`
- [ ] Mọi `mechanic` của lô có trong từ vựng trục `mechanic`
- [ ] Mỗi khuôn có ≥ 3 game level mẫu chạy được
- [ ] Mỗi system của nhóm B có bộ test không phụ thuộc khuôn
- [ ] Mọi khuôn của lô phát `round_started` và `round_completed`
- [ ] Mỗi khuôn ≤ 80 KB gzipped
- [ ] Mọi dạng bài v1 hoặc trỏ được tới một mã `GT-*`, hoặc có hàng ở mục 7.3
- [ ] `pnpm --filter @mindkid/game-engine gen:templates` không đổi file viết tay nào ngoài thư mục khuôn

## 8. API contract

Không sở hữu route. Khuôn vào `game_templates` qua seeder Lớp 1, cấm tạo hoặc sửa từ UI
(`BR-GTC-04`). Cổng nghiệm thu chạy trong `pnpm check`, thoát khác 0 kèm mã khuôn vi phạm.

## 9. Acceptance criteria

```gherkin
Scenario: BR-LVB-01 — mã cấp tuần tự, không bỏ trống
  When đọc thư mục packages/game-engine/src/templates
  Then mọi mã từ GT-001 tới mã cao nhất đã ship đều tồn tại
  And không mã nào bị bỏ trống ở giữa

Scenario: BR-LVB-02 — mã khớp lớp chi phí
  When đọc bảy khuôn lô kế thừa v1
  Then GT-018 và GT-019 không thêm file nào dưới systems
  And GT-020 tới GT-024 mỗi khuôn thêm đúng một system

Scenario: BR-LVB-03 — không chép Session class của v1
  When đọc session.ts của mọi khuôn lô này
  Then không file nào tự cài lại chọn, kéo, ghép hay sắp
  And mỗi file dựng trên ít nhất một nguyên thuỷ cơ chế dùng chung

Scenario: BR-LVB-04 — một mechanic một khuôn
  When đọc trường mechanic của mọi khuôn
  Then không hai khuôn nào cùng một giá trị mechanic

Scenario: BR-LVB-05 — mechanic chưa đăng ký bị chặn
  Given khuôn GT-018 khai mechanic listen-respond
  And từ vựng trục mechanic chưa có giá trị đó
  When chạy cổng phủ
  Then cổng thoát với mã khác 0
  And nêu tên mechanic và mã khuôn

Scenario: BR-LVB-06 — khuôn không fallback được thì cấm band thấp
  When đọc khuôn GT-024
  Then banned_age_bands chứa 3-4
  And requires_tap_fallback là false

Scenario: BR-LVB-06 — khuôn kéo ở band thấp có đường chạm-chạm
  When đọc mọi khuôn lô này có age_min bằng 3 hoặc 4 và mechanic dùng cử chỉ kéo
  Then requires_tap_fallback là true
  And Session class có đường xử lý chạm-chạm

Scenario: BR-LVB-07 — khuôn thiếu level mẫu thì chưa nghiệm thu
  Given khuôn GT-020 có hai game level mẫu
  When chạy cổng nghiệm thu khuôn
  Then cổng thoát với mã khác 0
  And nêu số level mẫu còn thiếu

Scenario: BR-LVB-08 — không điểm nối nào sửa tay
  Given cây làm việc sạch sau khi thêm khuôn GT-018
  When chạy pnpm --filter @mindkid/game-engine gen:templates
  Then không file viết tay nào ngoài thư mục GT-018 bị thay đổi

Scenario: BR-LVB-09 — khuôn lô này phát event vòng
  Given một phiên chơi GT-021 hoàn thành
  When đọc chuỗi telemetry của phiên
  Then chuỗi chứa ít nhất một round_started
  And chuỗi chứa ít nhất một round_completed

Scenario: BR-LVB-11 — khuôn mới không đụng contract cũ
  Given cây làm việc trước khi thêm lô
  When lô kế thừa v1 đã ship đủ bảy khuôn
  Then không content_contract nào của GT-001 tới GT-017 bị đổi

Scenario: BR-LVB-12 — system mới có test độc lập
  When đọc bộ test của cardSystem
  Then bộ test chạy được mà không nạp khuôn GT-020

Scenario: BR-LVB-13 — phiên chơi tái lập được
  Given một phiên chơi GT-022 với một seed cố định
  When chạy lại phiên với cùng seed
  Then vị trí mọi vật trong tranh giống hệt lần trước

Scenario: BR-LVB-14 — khuôn vượt ngân sách bundle bị chặn
  Given khuôn GT-023 cùng assemblySystem nặng 92 KB gzipped
  When chạy cổng ngân sách bundle
  Then cổng thoát với mã khác 0

Scenario: BR-LVB-15 — cổng hoàn tất lô bắt dạng bài mồ côi
  Given một dạng bài v1 không trỏ tới mã GT nào
  And nó cũng không có hàng ở mục 7.3
  When chạy cổng hoàn tất lô
  Then cổng thoát với mã khác 0
  And nêu tên dạng bài đó
```

## 10. Boundaries

**Always**
- Cấp mã tuần tự theo lớp chi phí.
- Viết Session class mới trên nguyên thuỷ dùng chung.
- Đăng ký `mechanic` trước khi seed khuôn.
- Phát `round_started` và `round_completed` ngay ở phiên bản đầu.
- Ghi lý do cho mọi cơ chế v1 không port.

**Ask first**
- Cấp mã ngoài dãy `GT-018` tới `GT-024`.
- Thêm loại asset ngoài `emoji`, `image`, `audio`.
- Thêm một nguyên thuỷ cơ chế mới.
- Port `free-create` ở mục 7.3.
- Gộp hai `mechanic` của lô vào một khuôn.

**Never**
- Chép Session class của v1 sang v2.
- Đổi `content_contract` của khuôn đã publish.
- Thêm mã khuôn vào điểm nối bằng tay.
- Nới cử chỉ để phủ thêm band tuổi.
- Bỏ một cơ chế v1 mà không ghi hàng ở mục 7.3.

## 11. Open questions

| # | Câu hỏi | Chặn gì | Chặn phase | Chủ | Quyết định / Trạng thái |
|---|---|---|---|---|---|
| 1 | `tpl-spot-difference`, `tpl-go-nogo`, `tpl-rule-switch` phục vụ khoảng trống taxonomy chứ không phục vụ việc port. Chúng thành một lô riêng, hay ghép vào lô này? | Dãy mã sau `GT-024` | P5 | người quyết | **Chốt:** Giữ ngoài lô Task #101; đưa vào lô riêng [`taxonomy-gap-batch.md`](taxonomy-gap-batch.md) (sau `GT-024`) để cổng hoàn tất §7.4 trả lời đúng tiêu chí port 13/15 dạng bài v1 |
| 2 | `tpl-go-nogo` cần đường phán quyết khi trẻ **không** hành động. `ActionResult` hôm nay chỉ sinh từ `validateAction(action)`, nên đây là cơ chế duy nhất trong toàn bộ khảo sát chạm vào hợp đồng `GameSession` | Có phải đổi hợp đồng engine không | P5 | người quyết | Đóng bởi mục 7.3 của [`taxonomy-gap-batch.md`](taxonomy-gap-batch.md). `update(deltaMs)` đã được gọi mỗi frame tại [`packages/game-engine/src/core.ts`](../../../packages/game-engine/src/core.ts) nên phần đếm giờ có sẵn; phần thiếu chỉ là đường phát phản hồi cho một không-hành-động |
| 3 | `GT-022` cần toạ độ tự do trong một khung cảnh, khác mọi layout hiện có vốn đều là lưới hoặc dãy. `free-scene` là một `LayoutId` thật hay là một chế độ nằm ngoài layout engine? | Hình dạng `sceneSystem` | P5 | Infra | **Chốt:** `free-scene` là `LayoutId` thật trong registry để tuân thủ `BR-LAY-07` và Zod contract. Hàm layout tính toán slot phân tán tự do đảm bảo sàn chạm và không chồng lấn |
| 4 | Lô này chỉ nói khuôn. Ai soạn nội dung cho 13 dạng bài được phủ, và theo lô nào? | Kế hoạch nội dung sau khi khuôn xong | P5 | Nội dung | Chờ. Lô Montessori có [`montessori-game-level-batch.md`](../05-content/montessori-game-level-batch.md) làm tiền lệ cho một lô nội dung tương ứng |
| 5 | Trần 80 KB gzipped mỗi khuôn ở `BR-LVB-14` chưa được đo với khuôn nào kèm system riêng nặng như `assemblySystem`. Trần này có thực tế không? | Ngưỡng nghiệm thu `GT-023` | P5 nghiệm thu | Infra | **Chốt:** Đạt. Cả 7 khuôn kèm system (kể cả `assemblySystem`) đều ≤ 10 KB unminified (~3 KB gzipped), nằm an toàn dưới trần 80 KB. |
