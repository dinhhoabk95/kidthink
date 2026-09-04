---
spec: ENGINE-PLAY-LANGUAGE
title: Ngôn ngữ tương tác lượt chơi của engine — 6 cử chỉ, 3 nhịp, 5 trạng thái
area: platform
status: draft
mvp: true
phase: P1
reviewed: 2026-09-04
owns:
  - Ngôn ngữ chung cho hành vi chơi của trẻ mầm non trên 37 engine
  - Định nghĩa sáu cử chỉ (tap, drop, stroke, adjust, commit, revert)
  - Định nghĩa ba nhịp hệ thống (reveal, hint, timeout)
  - Quy tắc ánh xạ trạng thái tương tác sang năm trạng thái thị giác
depends_on:
  - GAME-ENGINE-RUNTIME
  - ENGINE-RENDER-CONTRACT
  - ACCESSIBILITY
---

# Ngôn ngữ tương tác lượt chơi của engine — 6 cử chỉ, 3 nhịp, 5 trạng thái

## 1. Objective

Hệ thống engine trước đây dùng 47 tên động từ duck-typing rời rạc cho 37 khuôn mẫu game,
khiến trang chơi bị phân mảnh và không có hợp đồng nhập thống nhất.
Spec này định nghĩa **ngôn ngữ chung** cho hành vi chơi của trẻ mầm non (3–6 tuổi),
quy tụ 47 động từ vào **6 cử chỉ của bé** và **3 nhịp của hệ thống**.
Nó chuẩn hoá ánh xạ trạng thái vật thể trực tiếp vào 5 trạng thái thị giác đã được định
nghĩa trong [`engine-render-contract.md`](engine-render-contract.md) §7.3, bảo đảm tính
nhất quán sư phạm và khả năng kiểm thử BDD tự động.

## 2. Actors

| Actor | Quyền cần | Làm được gì ở đây |
|---|---|---|
| Trẻ 3–6 tuổi | — | Thực hiện 6 cử chỉ tương tác cảm ứng tự nhiên trên màn hình |
| Game Engine | — | Tiếp nhận cử chỉ qua con trỏ, phân loại nhịp và gửi tới session |
| Dev / QA | — | Viết kịch bản BDD và cài đặt Session theo từ vựng chuẩn |

## 3. Entry points

| Route / thành phần | Actor | Ghi chú |
|---|---|---|
| `packages/game-engine/src/interaction.ts` | Game Engine | Nơi biên dịch sự kiện con trỏ sang cử chỉ |
| `packages/game-engine/src/templates/GT-*/session.ts` | Session | Nơi đón nhận cử chỉ và thực thi logic bài học |
| `apps/web/app/pages/play/[code].vue` | Trẻ / App Shell | Bề mặt trình diễn canvas đón nhận touch/pointer |

## 4. Main flow

1. **Bắt đầu lượt chơi**: Engine dựng vòng đời con trỏ và đưa tất cả vật thể vào trạng thái `nghỉ`.
2. **Bé phát cử chỉ**: Bé thực hiện một trong 6 cử chỉ (`tap`, `drop`, `stroke`, `adjust`, `commit`, `revert`).
3. **Phân tích cử chỉ**: `interaction.ts` xác định vị trí toạ độ logic, kiểm tra hit band và định tuyến cử chỉ.
4. **Cập nhật trạng thái**: Vật thể chuyển trạng thái tương tác (`nghỉ` → `chạm/kéo` → `chọn` → `đúng`/`sai`).
5. **Đồng bộ thị giác**: Renderer phản hồi trạng thái bằng ≥ 2 kênh thị giác (hình dáng, viền, chuyển động, không chỉ màu sắc).
6. **Nhịp hệ thống**: Nếu bé chưa thao tác, nhịp `hint` kích hoạt scaffolding; khi cần gợi mở, nhịp `reveal` kích hoạt.

## 5. Alternative flows

- **Bé chạm trượt ra ngoài vùng chạm**: Cử chỉ bị bỏ qua, không đổi trạng thái, không phát âm thanh lỗi.
- **Bé nhấc ngón giữa chừng khi đang kéo (`drop`)**: Vật thể trôi mượt về vị trí nguồn ban đầu trong 260ms (`snap`).
- **Bé chạm liên tục vào màn hình sau khi hoàn thành (`isWon = true`)**: Engine nuốt toàn bộ cử chỉ nhập, không sinh sự kiện mới.
- **Thiết bị giật lag / tuột khung hình**: Nhịp `timeout` giữ nguyên logic nhưng hiệu ứng hạt bị lược bỏ trước theo `BR-ERC-09`.

## 6. Business rules

| ID | Rule | Vì sao |
|---|---|---|
| `BR-EPL-01` | Mọi tương tác của bé thuộc đúng một trong 6 cử chỉ: `tap`, `drop`, `stroke`, `adjust`, `commit`, `revert`. Cấm tự đặt thêm động từ riêng lẻ cho từng engine | Tránh phân mảnh 47 động từ duck-typing gây vỡ hợp đồng kiểm thử |
| `BR-EPL-02` | Mọi nhịp chủ động từ hệ thống thuộc đúng một trong 3 nhịp: `reveal`, `hint`, `timeout` | Đồng bộ cơ chế scaffolding và gợi ý tự động theo đồng hồ |
| `BR-EPL-03` | Trạng thái tương tác ánh xạ 1:1 sang 5 trạng thái thị giác của `engine-render-contract.md` §7.3 (`nghỉ`, `đang chạm/kéo`, `đã chọn`, `đúng`, `sai`). Cấm — NEVER dựng bộ trạng thái thứ hai | Tránh xung đột giữa pipeline tương tác và pipeline vẽ |
| `BR-EPL-04` | Khi phiên hoặc vòng đã đạt điều kiện thắng (`checkWinCondition() = true`), mọi cử chỉ nhập tiếp theo bị nuốt hoàn toàn | Chặn gửi đúp sự kiện `game_completed` và bảo toàn telemetry sạch |
| `BR-EPL-05` | Phản hồi sai là nhịp hổ phách + item trôi về chỗ cũ. Cấm buzzer, cấm màu đỏ trừng phạt, cấm trừ điểm | Trẻ mầm non 3-6 tuổi dễ nản lòng và hoảng sợ trước cảnh báo tiêu cực |
| `BR-EPL-06` | Cử chỉ kéo (`drop`) luôn có cơ chế fallback chạm-chạm (`tap-tap`) cho band tuổi 3–4 | Kỹ năng vận động tinh của trẻ 3-4 tuổi chưa đủ thuần thục để kéo chính xác |

## 7. Data

Mô hình dữ liệu kiểu TypeScript chuẩn hoá trong `packages/game-engine/src/interaction.ts`:

```ts
export type PlayVerb = "tap" | "drop" | "stroke" | "adjust" | "commit" | "revert";

export type SystemBeat = "reveal" | "hint" | "timeout";

export type EntityPlayState = "idle" | "active" | "selected" | "correct" | "incorrect";
```

## 8. API contract

Không có endpoint HTTP. Giao thức tương tác diễn ra in-memory trong RAF loop giữa Canvas, InteractionManager và Session class.

## 9. Acceptance criteria

```gherkin
Scenario: BR-EPL-01 — cử chỉ hợp lệ được nhận dạng đúng họ
  Given một session thuộc khuôn tap
  When bé chạm vào ô slot hợp lệ
  Then engine ghi nhận cử chỉ "tap"
  And trạng thái vật thể chuyển sang "selected" hoặc "correct"

Scenario: BR-EPL-03 — trạng thái vật thể đồng bộ với năm trạng thái thị giác
  Given một vật thể đang ở trạng thái "idle"
  When bé bắt đầu kéo vật thể
  Then trạng thái vật thể chuyển sang "active" (đang chạm hoặc đang kéo)
  And renderer vẽ thay đổi kích thước hoặc đổ bóng theo đúng BR-ERC-06

Scenario: BR-EPL-04 — nuốt toàn bộ thao tác sau khi vòng đã thắng
  Given một phiên chơi đã hoàn tất win condition
  When bé tiếp tục tap liên tục vào các slot trên màn hình
  Then không có action mới nào được commit
  And không có telemetry event thừa nào được phát ra
```

## 10. Boundaries

**Always**
- Quy tụ mọi hành vi của trẻ vào 6 cử chỉ chuẩn.
- Tôn trọng sàn touch floor theo band tuổi của `BR-ERC-04`.
- Luôn cung cấp fallback chạm-chạm (`tap-tap`) cho cơ chế kéo thả.

**Ask first**
- Bổ sung một cử chỉ cảm ứng mới ngoài 6 cử chỉ cốt lõi.
- Thay đổi thời gian trôi về (`settle`) của cử chỉ kéo thả dở dang.

**Never**
- Tự định nghĩa động từ riêng biệt ngoài 6 cử chỉ (`onItemLocked`, `onSnapPart`...).
- Dựng bộ trạng thái thứ hai lệch khỏi 5 trạng thái thị giác của `engine-render-contract.md`.
- Phát âm thanh buzzer hoặc đổi toàn bộ màn hình sang màu đỏ khi bé thao tác sai.

## 11. Open questions

Không có. Đã thống nhất 6 cử chỉ và 3 nhịp từ Task #166.
