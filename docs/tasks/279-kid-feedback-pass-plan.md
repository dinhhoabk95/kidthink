# Task #279 Plan: Phản hồi bằng hình cho trẻ — mascot, pop tại điểm chạm, màn tổng kết có tiếng

Todo: [`279-kid-feedback-pass-todo.md`](279-kid-feedback-pass-todo.md).
Spec: [`feedback-and-celebration.md`](../specs/04-play/feedback-and-celebration.md) `BR-FBK-11`, `BR-FBK-12`, §7.4 ·
[`play-stage-zones.md`](../specs/01-platform/play-stage-zones.md) `BR-PSZ-10`.

## 1. Vì sao

Khảo sát 2026-10-02 (tham chiếu KidsUP Pro, mô hình VAK) cho thấy:

- Phản hồi đúng/sai gần như chỉ có tiếng (`use-play-gesture.ts` `handleVerdict`).
- `FeedbackSystem` là code chết.
- Mascot là emoji 🐻 tĩnh, trong khi đã có sẵn bốn SVG Gấu Con không ai dùng.
- Màn tổng kết nặng chữ, im lặng.
- Nút của trẻ còn chữ: "Xong", "Trước", "Tiếp tục", "Bé nói theo".

Hệ quả: khi tắt tiếng, trẻ gần như không biết mình đúng hay sai.

## 2. Cách làm

- **Lớp phủ chung** `systems/feedback-overlay.ts`: hàm thuần `frame(now, basePose, reducedMotion)` trả vòng pop/nhịp hổ phách tại điểm chạm và dáng mascot. Shell gọi nó cho mọi engine, nên **không sửa template nào**.
- **Mascot** `render/mascot.ts`: hợp đồng sáu dáng, sprite đặt ngoài (`MascotSprites`), có bản vẽ thay thế bằng primitive khi chưa có asset. Vùng lời dẫn và component DOM `KidMascot` dùng chung `drawMascot`.
- **Shell**:
  - `use-play-gesture` phát `onFeedback(kind, point)`; điểm là chỗ chạm, hoặc chỗ thả với `drop`.
  - `[code].vue` vẽ pulse ở lớp trên cùng và truyền dáng vào `drawPromptZone`.
  - Dáng nền: `listen` khi lời dẫn đang khoá input, `hint` khi trợ giúp ≥ L1.
- **Màn tổng kết**: Gấu Con dáng `celebrate`. Phát sự kiện `announce` với một lời khen của §7.2, trang đọc lời đó qua `speakPrompt`. Hai nút chỉ có icon.
- **Nút canvas Xong**: vẽ dấu ✓ bằng nét. Nhãn "Xong" chỉ còn ở lớp DOM trợ năng.

## 3. Ngoài phạm vi

- Sprite cho dáng `listen`/`hint` riêng: hiện dùng lại tư thế chờ/suy nghĩ của bốn SVG Gấu Con.
- Gỡ token `coral`: token này đang dùng làm **màu nội dung** (hạt rekenrek, thanh số Montessori), không phải phản hồi sai, nên đổi sẽ đổi biểu diễn học liệu. Cần review riêng.
- Dời 29 template vào khung năm vùng: task con theo #277 phần đóng task.
