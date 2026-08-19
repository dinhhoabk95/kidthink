---
spec: DETERMINISTIC-RANDOMNESS
title: Ngẫu nhiên tái dựng được trong phiên chơi
area: platform
status: implemented
mvp: true
phase: P1
reviewed: 2026-08-17
owns:
  - Nguồn ngẫu nhiên của một phiên chơi
  - Quy tắc tái dựng bố cục từ seed
depends_on:
  - GAME-TEMPLATE-CONTRACT
  - GAME-LAYOUT-ENGINE
  - GAME-CONFIG-DELIVERY
---

# Ngẫu nhiên tái dựng được trong phiên chơi

## 1. Objective

Cả sáu template MVP đều khai `shuffle_items`, `shuffle_sides` hoặc `shuffle_initial` trong
`difficulty_contract`. Không nơi nào đọc chúng, và engine không có nguồn ngẫu nhiên nào
ngoài vài lần gọi `Math.random()` rời rạc. Nghĩa là ba tham số độ khó đó hiện không có tác dụng.

Cách sửa không phải là rắc thêm `Math.random()`. Một phiên chơi cần **một** nguồn ngẫu
nhiên có seed, để cùng seed dựng lại đúng cùng bàn chơi. Không có tính chất đó thì báo cáo
"bé sai ở màn này" không tái dựng được, hai lần chạy test cho hai kết quả, và không phân
biệt được lỗi engine với lỗi nội dung.

Seed đi cùng phiên chơi, không sinh trong lúc chơi.

## 2. Actors

| Actor | Quyền cần | Làm được gì ở đây |
|---|---|---|
| Server | — | Sinh `layout_seed` khi mở phiên, trả về trong payload config |
| Engine | — | Dựng generator từ seed, chia luồng con, cấp cho Session class |
| Session class | — | **Chỉ tiêu thụ** luồng đã được cấp. Cấm tự tạo generator |
| Dev | — | Tái dựng bàn chơi từ `layout_seed` khi điều tra lỗi |

## 3. Entry points

| Route / màn hình | Actor | Ghi chú |
|---|---|---|
| `packages/game-engine/src/rng/` | Dev | Thuật toán, hàm chia luồng, hàm xáo |
| Payload của [`game-config-delivery.md`](../04-play/game-config-delivery.md) | Server | `layout_seed` là một field của payload đó |
| `play_sessions.layout_seed` | Server | Lưu để tái dựng sau |

## 4. Main flow

1. Server mở phiên chơi, sinh `layout_seed` là số nguyên không dấu 32 bit.
2. Server ghi `layout_seed` vào phiên và đưa vào payload config.
3. Engine nhận payload, dựng generator gốc từ `layout_seed`.
4. Engine chia luồng con theo tên: `items`, `sides`, `initial`, `feedback`, `theme`.
5. Session class nhận đúng những luồng nó cần qua `setupEntities()`.
6. Mỗi `shuffle_*` bật thì Session gọi hàm xáo trên đúng luồng mang tên tương ứng.
7. Khi cần điều tra, dev nạp lại `level_code` cộng `content_version` cộng `difficulty_params`
   cộng `layout_seed` và nhận đúng bàn chơi cũ.

## 5. Alternative flows

| Nhánh | Điều kiện | Hành vi |
|---|---|---|
| Payload thiếu `layout_seed` | Phiên cũ, hoặc lỗi server | Engine dùng seed cố định `0` và ghi cảnh báo. Không rơi về `Math.random()` |
| Chơi offline | Không gọi được server | Client sinh seed và lưu kèm phiên trong buffer, gửi lên khi flush theo [`offline-play.md`](offline-play.md) |
| Chơi lại cùng một level | Trẻ chơi lại lần hai | Seed **mới** — bàn chơi khác. Chơi lại y hệt làm mất giá trị luyện tập |
| Preview trong studio | Manager xem thử | Seed cố định do studio truyền, để hai lần xem thử giống nhau |

## 6. Business rules

| ID | Rule | Vì sao |
|---|---|---|
| `BR-RNG-01` | Mọi lần rút ngẫu nhiên ảnh hưởng tới thứ trẻ nhìn thấy phải đến từ generator của phiên | Một lần `Math.random()` lọt lưới là đủ phá tính tái dựng của cả phiên |
| `BR-RNG-02` | `Math.random()` bị **cấm** trong `packages/game-engine`, ép bằng lint | Quy tắc không có cổng thì trôi. Đây là loại vi phạm không thấy được khi đọc diff từng file |
| `BR-RNG-03` | Thuật toán generator được **đặt tên và cố định**, cài đặt trong repo, không lấy từ thư viện ngoài | Đổi thuật toán làm mọi seed đã lưu trỏ tới bàn chơi khác. Thư viện ngoài đổi bản vá cũng gây đúng chuyện đó |
| `BR-RNG-04` | Luồng con chia **theo tên**, không theo thứ tự gọi | Thêm một lần xáo ở chỗ khác sẽ dịch cả dãy nếu chia theo thứ tự, và mọi seed cũ dựng ra bàn khác |
| `BR-RNG-05` | Hàm xáo là Fisher–Yates, trả **mảng mới**, không sửa mảng đầu vào | Sửa tại chỗ trên `content_pack` làm hỏng dữ liệu dùng lại giữa các vòng |
| `BR-RNG-06` | `layout_seed` lưu trên phiên chơi và **bất biến** trong suốt phiên | Seed đổi giữa chừng thì nửa phiên không tái dựng được |
| `BR-RNG-07` | Mỗi lần vào chơi sinh seed **mới**, trừ preview của studio | Bàn chơi lặp lại biến luyện tập thành học thuộc vị trí |
| `BR-RNG-08` | Seed **không** phải bí mật, và **không** dùng để bảo mật thứ gì | Nó nằm trong payload client đọc được. Dùng nó chặn gian lận là hiểu sai công dụng |
| `BR-RNG-09` | Xáo trộn **không đổi ngữ nghĩa nội dung** — đáp án đúng vẫn đúng sau khi xáo | Xáo theo chỉ số mà quên cập nhật `correct_group_id` là lỗi kinh điển của bước này |
| `BR-RNG-10` | Khi `shuffle_*` tắt, thứ tự hiển thị **đúng bằng** thứ tự trong `content_pack` | Người soạn cần một chế độ nhìn thấy đúng thứ tự mình viết, để kiểm bài |

## 7. Data

**Đọc:** `difficulty_params.shuffle_items` · `shuffle_sides` · `shuffle_initial` · `play_sessions.layout_seed`.
**Ghi:** `play_sessions.layout_seed` — do server ghi một lần lúc mở phiên.

### 7.1 Hình dạng

```ts
/** Generator có seed. Cài đặt trong repo, không lấy từ thư viện ngoài. */
interface Rng {
  /** Số thực trong nửa khoảng [0, 1). */
  next(): number;
  /** Số nguyên trong [0, maxExclusive). */
  nextInt(maxExclusive: number): number;
}

/** Luồng con tách theo tên — thêm luồng mới không dịch luồng đã có. */
type RngStreamName = "items" | "sides" | "initial" | "feedback" | "theme";

function createRng(seed: number): Rng;
function deriveStream(seed: number, name: RngStreamName): Rng;
function shuffle<T>(input: readonly T[], rng: Rng): T[];   // trả mảng mới
```

### 7.2 Ba cờ xáo và luồng tương ứng

| Cờ trong `difficulty_params` | Template dùng | Luồng | Xáo cái gì |
|---|---|---|---|
| `shuffle_items` | GT-001 · GT-002 · GT-003 · GT-004 | `items` | Thứ tự item trong vùng nguồn |
| `shuffle_sides` | GT-005 | `sides` | Cột trái và cột phải của cặp ghép |
| `shuffle_initial` | GT-006 | `initial` | Thứ tự ban đầu của dãy cần sắp |

### 7.3 Ràng buộc `layout_seed`

| Field | Kiểu | Ràng buộc |
|---|---|---|
| `layout_seed` | integer | `CHECK (layout_seed >= 0 AND layout_seed <= 4294967295)` |

Đặt trên bảng phiên chơi của [`schema-play-telemetry.md`](schema-play-telemetry.md). Không đặt trên `game_levels` —
seed thuộc lần chơi, không thuộc nội dung.

## 8. API contract

Không sở hữu route. `layout_seed` là một field trong payload của
[`game-config-delivery.md`](../04-play/game-config-delivery.md), và một cột trên bảng phiên chơi của
[`schema-play-telemetry.md`](schema-play-telemetry.md).

## 9. Acceptance criteria

```gherkin
Scenario: BR-RNG-01 — cùng seed cho cùng bàn chơi
  Given level GL-C1-CNT-MATCH-0007 version 1 với shuffle_items bật
  When dựng phiên hai lần với cùng layout_seed
  Then thứ tự item hiển thị giống nhau hoàn toàn

Scenario: BR-RNG-02 — engine không gọi Math.random
  When quét toàn bộ packages/game-engine/src
  Then không file nào chứa lời gọi Math.random
  And lint báo lỗi nếu thêm một lời gọi như vậy

Scenario: BR-RNG-04 — thêm luồng mới không dịch luồng cũ
  Given seed cố định và luồng items đã sinh 10 số
  When thêm một luồng mới tên theme và sinh lại luồng items
  Then 10 số của luồng items không đổi

Scenario: BR-RNG-05 — xáo không sửa mảng đầu vào
  Given một mảng item đọc từ content_pack
  When gọi shuffle trên mảng đó
  Then mảng gốc giữ nguyên thứ tự
  And kết quả là một mảng khác tham chiếu

Scenario: BR-RNG-07 — chơi lại nhận seed khác
  Given trẻ hoàn thành một level rồi bấm chơi lại
  When server mở phiên thứ hai
  Then layout_seed của hai phiên khác nhau

Scenario: BR-RNG-09 — xáo không đổi đáp án đúng
  Given level GT-004 có bốn item với correct_group_id đã biết
  When bật shuffle_items và dựng phiên 100 lần với 100 seed khác nhau
  Then mọi lần, mỗi item vẫn trỏ tới đúng group ban đầu

Scenario: BR-RNG-10 — tắt xáo thì giữ nguyên thứ tự tác giả
  Given level có shuffle_items tắt
  When dựng phiên
  Then thứ tự hiển thị bằng đúng thứ tự trong content_pack

Scenario: BR-RNG-06 — thiếu seed không rơi về ngẫu nhiên hệ thống
  Given payload config không có layout_seed
  When engine dựng phiên
  Then engine dùng seed 0
  And ghi một cảnh báo
  And không gọi Math.random
```

## 10. Boundaries

**Always**
- Lấy mọi số ngẫu nhiên từ generator của phiên.
- Chia luồng theo tên.
- Trả mảng mới khi xáo.
- Lưu `layout_seed` cùng phiên chơi.

**Ask first**
- Đổi thuật toán generator.
- Thêm một tên luồng mới.
- Cho một bề mặt nào đó tái dùng seed cũ.

**Never**
- Gọi `Math.random()` trong engine.
- Sinh seed trong lúc chơi.
- Xáo mà không cập nhật quan hệ đáp án.
- Dùng seed như một cơ chế bảo mật.

## 11. Open questions

| # | Câu hỏi | Chặn gì | Chặn phase | Chủ |
|---|---|---|---|---|
| ~~1~~ | ~~Chọn thuật toán nào cho `createRng`? Cần loại 32 bit, không phụ thuộc, chất lượng đủ cho xáo hiển thị chứ không cho mã hoá~~ **Đóng 2026-08-19 (`D-RA`)**: Chọn thuật toán Mulberry32 32-bit với hàm băm FNV-1a chia luồng theo tên. Thuần TS, không phụ thuộc, tái lập 100% | Cài đặt P1 | Đã đóng | D-RA |
| 2 | Chơi offline sinh seed ở client rồi gửi lên — có cần chống trùng seed giữa nhiều thiết bị của cùng một trẻ không? | Ghi phiên offline | P2 | hoãn — đo sau khi có số phiên offline thật |
| 3 | Adaptive chọn bước tiếp theo có nên dùng chung nguồn seed này để tái dựng đường đi của trẻ không? Hiện [`adaptive-engine.md`](adaptive-engine.md) không nói về ngẫu nhiên | Tái dựng đường đi, không chặn bàn chơi | chờ P2 | hoãn |
