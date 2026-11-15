---
spec: MONTESSORI-TOYBOX
title: Hộp đồ chơi tự do Montessori — góc khám phá mở không chấm đúng sai
area: play
status: implemented
mvp: false
phase: P4
reviewed: 2026-11-15
owns:
  - Không gian Hộp đồ chơi tự do Montessori tại `/play/toybox` và `/play/toybox/[tool]`
  - Quy tắc cô lập phiên khám phá tự do khỏi `mastery_state` và điểm số
depends_on:
  - PLAY-ENTRY-AND-PROFILE-SELECT
  - PLAY-STAGE-ZONES
  - ENGINE-RENDER-CONTRACT
  - PROGRESS-AND-MASTERY
  - PARENT-GATE
---

# Hộp đồ chơi tự do Montessori — góc khám phá mở không chấm đúng sai

## 1. Objective

Giải phóng quyết định từng hoãn ở câu hỏi mở Q2 của [`play-stage-zones.md`](../01-platform/play-stage-zones.md): bên cạnh các màn chơi có mục tiêu cụ thể, trẻ mầm non học sâu nhất khi được **tự tay thử–sai với các giáo cụ phản hồi vật lý tức thì** (như hộp đồ chơi gỗ *Pok Pok Playroom* và các thanh khối số *DragonBox Numbers*) mà không có áp lực phải làm theo đề bài.

Spec này định nghĩa **Hộp đồ chơi tự do Montessori (`/play/toybox`)** gồm 3 bàn giáo cụ tương tác mở: **Cân gỗ bập bênh**, **Thanh hạt số & Khung 10**, và **Bàn gương khối hình**. Mọi thao tác đều sinh hệ quả thị giác – âm thanh trung thực theo quy luật toán học/vật lý, không có trạng thái sai (`retry`), và tuyệt đối không ghi vào `mastery_state`.

## 2. Actors

| Actor | Quyền cần | Làm được gì ở đây |
|---|---|---|
| Trẻ | Hồ sơ trẻ đang hoạt động hoặc Guest | Mở bất kỳ bàn đồ chơi nào trong 3 giáo cụ để thao tác tự do |
| Người lớn | Cổng phụ huynh | Thoát khỏi bề mặt trẻ về khu vực quản lý |

## 3. Entry points

| Route / màn hình | Actor | Ghi chú |
|---|---|---|
| `/play/toybox` | Trẻ / Guest | Kệ gỗ chọn 1 trong 3 bàn đồ chơi tự do, chỉ dùng minh hoạ lớn + giọng đọc |
| `/play/toybox/{tool}` | Trẻ / Guest | Bàn đồ chơi tương tác mở (`balance-scale`, `number-rods`, `mirror-blocks`) |
| Nút Hộp đồ chơi ở `/play` | Trẻ / Guest | Biểu tượng khối gỗ dẫn từ Phòng chơi Gấu Con sang `/play/toybox` |

## 4. Main flow

1. Từ Phòng chơi `/play`, trẻ chạm biểu tượng **Hộp đồ chơi gỗ** → vào kệ `/play/toybox`.
2. Kệ hiển thị 3 bàn giáo cụ lớn (≥ 96px CSS) kèm giọng giới thiệu ngắn khi chạm:
   - `balance-scale`: **Cân Gỗ Bạn Thú** — đặt vật nặng/nhẹ lên hai đĩa cân xem đòn cân nghiêng vật lý và nghe tiếng gỗ trầm/bổng; khi hai bên bằng nhau, ngôi sao giữa đòn cân toả sáng vui mắt.
   - `number-rods`: **Khung 10 & Hạt Số Kỳ Diệu** — thả hạt gỗ vào khung 2×5 hoặc ghép các thanh hạt màu Montessori để nghe Gấu Con đếm luỹ tiến theo nốt nhạc ngũ cung.
   - `mirror-blocks`: **Gương Thần Vạn Hoa** — đặt khối hình gỗ màu lên bàn để nửa bên kia phản chiếu đối xứng tức thì, tạo hình bông hoa/bướm/ngôi nhà tuỳ thích.
3. Khi chơi chán một bàn, trẻ chạm nút ngôi nhà/kệ đồ chơi (nội bộ `/play/toybox`) để cất đồ chơi kèm lời khen nhẹ nhàng của Gấu Con và chọn món khác hoặc về `/play`.

## 5. Alternative flows

| Nhánh | Điều kiện | Hành vi |
|---|---|---|
| Bàn đồ chơi đầy vật | Trẻ đặt kín mọi ô trên bàn | Nút chổi quét nhẹ (`🧹`, đạt sàn chạm ≥ 64px CSS) cho phép dọn bàn êm ái về trạng thái ban đầu kèm âm thanh vui, không tính lỗi |
| Mã `tool` không tồn tại trên URL | Điều hướng tới `/play/toybox/unknown` | Tự chuyển êm về kệ `/play/toybox`, không hiện trang lỗi kỹ thuật cho trẻ |
| Thoát khỏi bề mặt trẻ | Chạm nút khoá phụ huynh | Yêu cầu nhấn giữ + giải phép tính Parent Gate như mọi màn hình `/play/**` |

## 6. Business rules

| ID | Rule | Vì sao |
|---|---|---|
| `BR-TBX-01` | Mọi thao tác trong `/play/toybox/**` **không có trạng thái sai (`wrong`/`retry`)**; chỉ có phản hồi hệ quả vật lý/toán học trung thực | Bản chất của giáo cụ khám phá mở Montessori là tự kiểm chứng qua hệ quả trực quan, không phải làm theo đáp án cố định |
| `BR-TBX-02` | Phiên khám phá tại Toybox **cấm ghi hoặc cập nhật `mastery_state`, `child_badges` hay `child_stickers`** | Bảo vệ tính trung thực của thuật toán BKT/ZPD (`BR-PRG-01`) và giữ nguyên luật Sticker chỉ trao cho `play_sessions` hoàn thành màn chơi chuẩn (`BR-STK-01`) |
| `BR-TBX-03` | Giao diện Toybox tuân thủ trọn vẹn Kid Surface: Light-only, không `dark:`, không `danger`, sàn chạm ≥ 64px–96px CSS, không yêu cầu đọc chữ | Nhất quán chuẩn a11y mầm non của `13-ui-ux.md` và `BR-ENG-05` |
| `BR-TBX-04` | Thoát ra ngoài khu vực `/play/**` vẫn bắt buộc đi qua `KidParentLockButton` + `ParentGateModal` | `BR-PSZ-11`, `BR-PGT-01` — trẻ không thể vô tình thoát ra trang người lớn từ Toybox |
| `BR-TBX-05` | Bàn `balance-scale` ẩn mọi con số khối lượng trừu tượng trên vật thể; trẻ cảm nhận nặng/nhẹ qua kích cỡ vật, góc nghiêng đòn cân và cao độ âm thanh | Tránh biến trò khám phá vật lý của trẻ 3–5 tuổi thành bài toán cộng trừ số viết sẵn |
| `BR-TBX-06` | Bàn `number-rods` hiển thị song song lượng cụ thể (hạt rời/đốt màu) và đọc thành tiếng số lượng bằng tiếng Việt mỗi khi tổng thay đổi | Tuân thủ thang biểu diễn lượng cụ thể → trừu tượng của `numeracy-representation-ladder.md` |
| `BR-TBX-07` | Tôn trọng `prefers-reduced-motion`: tắt dao động lò xo nhiều nhịp, đưa đòn cân/hạt về vị trí đích trong một nhịp êm mà vẫn giữ nguyên hệ quả | `BR-A11-10`, `BR-FBK-09` |

## 7. Data

**Đọc:** Danh mục hằng tĩnh 3 bàn giáo cụ (`TOYBOX_TOOLS` trong `packages/shared`).
**Ghi:** Không ghi DB. Toàn bộ mô phỏng vật lý và lượng chạy thuần client-side offline-ready (`BR-PRF-04`).

## 8. API contract

Không sở hữu route server riêng — vận hành 100% tức thì phía client không cần chờ mạng.

## 9. Acceptance criteria

```gherkin
Scenario: BR-TBX-01 & BR-TBX-02 — thao tác Toybox không sinh trạng thái sai và không đụng mastery_state
  Given trẻ mở /play/toybox/balance-scale và đặt vật lên đĩa cân
  Then không phần tử nào mang trạng thái wrong hoặc màu danger
  And không có request nào cập nhật mastery_state

Scenario: BR-TBX-03 & BR-TBX-04 — tuân thủ Kid Surface và khoá phụ huynh
  When render /play/toybox và /play/toybox/number-rods
  Then không có class dark: và không có liên kết công khai ngoài /play/**
  And có KidParentLockButton bảo vệ lối thoát

Scenario: BR-TBX-05 — cân gỗ ẩn chữ số cân nặng
  When render bàn /play/toybox/balance-scale
  Then các vật đặt lên cân không hiển thị nhãn số kg hay đơn vị số trừu tượng
```

## 10. Boundaries

**Always**
- Vận hành mượt 60fps không gọi mạng trong lúc trẻ tương tác.
- Giữ phản hồi âm thanh mộc cầm theo quy luật lượng/trọng lượng.

**Ask first**
- Kết nối Toybox với hạn mức mở khoá theo gói thuê bao (hiện mở chung để tăng giá trị trải nghiệm cho mọi trẻ tại `/play`).
- Thêm bàn đồ chơi thứ tư trở lên.

**Never**
- Ghi điểm số hoặc cập nhật `mastery_state` từ Toybox.
- Hiển thị thông báo "Sai rồi" trong chế độ khám phá tự do.

## 11. Open questions

Không có.
