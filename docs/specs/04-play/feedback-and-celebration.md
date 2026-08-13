---
spec: FEEDBACK-AND-CELEBRATION
title: Phản hồi và ăn mừng
area: play
status: implemented
mvp: true
phase: P1
reviewed: 2026-08-08
owns:
  - Ngôn ngữ phản hồi đúng/sai
  - Quy tắc ăn mừng
depends_on:
  - GAME-ENGINE-RUNTIME
  - SCORING-AND-RESULT
---

# Phản hồi và ăn mừng

## 1. Objective

Trẻ 3–6 học từ phản hồi tức thì, không học từ trừng phạt. Nhưng **im lặng cũng là
defect** — không phản hồi thì trẻ không biết mình đã thao tác.

Khoảng ở giữa hẹp và cần spec: phản hồi rõ, tích cực, không trừng phạt, không lạm phát.

## 2. Actors

| Actor | Nhận gì |
|---|---|
| Trẻ | Toàn bộ phản hồi trực quan và âm thanh |
| Người lớn | Cấm thấy màn hình này |

## 3. Entry points

`packages/game-engine/src/systems/feedbackSystem.ts` · màn hình tổng kết cuối phiên.

## 4. Main flow

| Sự kiện | Phản hồi |
|---|---|
| Chạm/kéo bắt đầu | Item nhấc lên nhẹ, bóng đổ sâu hơn |
| Thả **đúng** | Pop nhỏ **tại điểm chạm** + âm ngắn dễ chịu + item khoá vào vị trí |
| Thả **sai** | Nhịp hổ phách trên target + âm nhẹ (ramp ≥20ms) + item **trôi về chỗ cũ** |
| Round hoàn thành | Chuyển cảnh mượt, không ăn mừng lớn |
| Level hoàn thành | **Ăn mừng lớn**: hạt, sao, mascot, lời khen tiếng Việt |

## 5. Alternative flows

| Nhánh | Hành vi |
|---|---|
| `prefers-reduced-motion` | Ăn mừng thành **một nhịp scale 400ms** — vẫn rõ là ăn mừng |
| Âm bị tắt | Phản hồi hình ảnh **tăng cường**, không mất kênh |
| Phiên `abandoned` | Cấm ăn mừng, không sao |
| Sai nhiều lần liên tiếp | Phản hồi **không đổi** — không tăng cường độ "sai" |

## 6. Business rules

| ID | Rule | Vì sao |
|---|---|---|
| `BR-FBK-01` | Cấm — **NEVER màu đỏ, buzzer, rung mạnh, hay trừ điểm** khi sai | Đỏ đọc thành trừng phạt ở tuổi 3–6 |
| `BR-FBK-02` | Cấm — **NEVER im lặng khi sai** — im lặng là defect | Trẻ không biết mình đã thao tác |
| `BR-FBK-03` | "Chưa đúng" dùng **hổ phách**, không `danger` | `danger` là token của bề mặt người lớn |
| `BR-FBK-04` | Ăn mừng lớn **chỉ** khi hoàn thành level | Ăn mừng mọi lúc làm ăn mừng mất nghĩa |
| `BR-FBK-05` | Pop khi đúng phát ra **tại điểm chạm**, không từ toạ độ hardcode | Phản hồi phải gắn với hành động của trẻ |
| `BR-FBK-06` | Cấm — **NEVER màu là kênh duy nhất** — kèm hình dạng, chuyển động, hoặc âm | Trẻ mù màu và màn hình kém |
| `BR-FBK-07` | Cường độ phản hồi sai **không tăng** theo số lần sai | Tăng dần đọc thành trách móc |
| `BR-FBK-08` | Lời khen Cấm — **NEVER so sánh trẻ với trẻ khác** | Tránh gây áp lực đố kị và duy trì động lực nội tại cho trẻ |
| `BR-FBK-09` | `reduced-motion` **giảm**, không bỏ ăn mừng | Bỏ ăn mừng là bỏ phần thưởng |
| `BR-FBK-10` | Âm: ramp vào ≥20ms, ra ≥40ms, master ceiling cưỡng chế | Onset tức thì làm trẻ giật mình |

## 7. Data

### 7.1 Bảng phản hồi

| Trạng thái | Màu token | Chuyển động | Âm |
|---|---|---|---|
| Nhấc | — | scale 1,05 · shadow sâu | tick nhẹ |
| Đúng | `success` | pop 260ms tại điểm chạm | note lên |
| Chưa đúng | `retry` (hổ phách) | nhịp 2 lần trên target · item trôi về | note trầm nhẹ |
| Hoàn thành level | `success` + `brand` | hạt + sao + mascot 1,2s | giai điệu ngắn |

Cấm `danger` **không phải** token của canvas.

### 7.2 Lời khen tiếng Việt

Xoay vòng, không lặp liên tiếp: "Giỏi quá!" · "Đúng rồi!" · "Bé làm được rồi!" ·
"Tuyệt vời!" · "Bé thật chăm chỉ!"

Khi chưa đúng: "Thử lại nhé!" · "Gần đúng rồi!" · "Bé thử chỗ khác xem?"

Cấm — **NEVER**: "Sai rồi", "Không đúng", "Bé chưa giỏi", bất kỳ so sánh nào.

### 7.3 Ngân sách ăn mừng

| | Bình thường | reduced-motion |
|---|---|---|
| Thời lượng | 1,2 s | 400 ms |
| Hạt | ≤ 40, object pool | 0 |
| Âm | giai điệu ngắn | giữ nguyên |

## 8. API contract

Không có route. Màn hình tổng kết nhận từ
`POST /play-sessions/{uuid}/complete` — xem [`scoring-and-result.md`](scoring-and-result.md) §8.

## 9. Acceptance criteria

```gherkin
Scenario: BR-FBK-01 — sai không có đỏ và không trừ điểm
  Given trẻ thả sai vị trí
  Then không pixel nào trên canvas dùng token danger
  And điểm không giảm

Scenario: BR-FBK-02 — sai luôn có phản hồi
  Given trẻ thả sai vị trí
  Then có nhịp hổ phách trên target
  And có âm phản hồi
  And item trở về vị trí ban đầu

Scenario: BR-FBK-07 — cường độ không tăng theo số lần sai
  Given trẻ sai 5 lần liên tiếp
  Then phản hồi lần thứ 5 giống hệt lần thứ nhất

Scenario: BR-FBK-04 — ăn mừng lớn chỉ khi xong level
  Given trẻ đặt đúng một item
  Then chỉ có pop nhỏ tại điểm chạm
  And không có hạt hay mascot

Scenario: BR-FBK-05 — pop tại điểm chạm
  Given trẻ đặt đúng ở toạ độ (x, y)
  Then hiệu ứng pop phát ra từ (x, y)
  And không từ tâm màn hình

Scenario: BR-FBK-09 — reduced-motion vẫn ăn mừng
  Given prefers-reduced-motion bật
  When trẻ hoàn thành level
  Then vẫn có ăn mừng dạng một nhịp scale 400ms
  And vẫn có âm

Scenario: BR-FBK-06 — màu không phải kênh duy nhất
  Given giả lập màn hình đơn sắc
  Then vẫn phân biệt được đúng và chưa đúng qua chuyển động

Scenario: BR-FBK-08 — lời khen không so sánh
  When liệt kê mọi chuỗi khen
  Then không chuỗi nào chứa so sánh với trẻ khác

Scenario: BR-FBK-10 — âm không có onset tức thì
  When phân tích mọi file SFX
  Then thời gian ramp vào ít nhất 20ms
```

## 10. Boundaries

**Always**
- Phản hồi mọi thao tác, kể cả sai.
- Pop tại điểm chạm.
- Giữ cường độ phản hồi sai không đổi.
- Xoay vòng lời khen.

**Ask first**
- Thêm loại phản hồi mới.
- Đổi ngân sách ăn mừng.
- Đổi bộ lời khen.

**Never**
- Đỏ, buzzer, rung mạnh, trừ điểm khi sai.
- Im lặng khi sai.
- Ăn mừng lớn ngoài lúc hoàn thành level.
- Màu là kênh duy nhất.
- So sánh trẻ với trẻ khác.
- Bỏ ăn mừng khi reduced-motion.

## 11. Open questions

| # | Câu hỏi | Chặn gì | Chặn phase | Chủ |
|---|---|---|---|---|
| ~~1~~ | ~~Lời khen thu âm người thật hay TTS?~~ **Đóng 2026-08-09 (T13, `D-AV`)**: P1 dùng audio clip tĩnh + Web Speech API (TTS), hoãn thu studio sang P2 | Âm thanh phản hồi | Đã đóng | D-AV |
| ~~2~~ | ~~Mascot có nhất quán qua mọi theme không, hay đổi theo theme?~~ **Đóng 2026-08-09 (T13, `D-DB`)**: Mascot Thỏ Tini giữ vai trò chính ở mọi theme, background đổi theo theme | Mascot thiết kế | Đã đóng | D-DB |

