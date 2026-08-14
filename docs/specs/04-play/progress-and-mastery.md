---
spec: PROGRESS-AND-MASTERY
title: Ghi nhận tiến độ và thành thạo
area: play
status: approved
mvp: true
phase: P3
reviewed: 2026-08-08
owns:
  - Điều kiện ghi mastery
  - Bản đồ tiến độ hiển thị cho trẻ
depends_on:
  - ADAPTIVE-ENGINE
  - PLAY-SESSION-LIFECYCLE
  - SCORING-AND-RESULT
---

# Ghi nhận tiến độ và thành thạo

## 1. Objective

Biến kết quả phiên thành trạng thái thành thạo theo skill, và biến trạng thái đó thành thứ
**trẻ nhìn thấy được** (bản đồ, huy hiệu) mà không biến thành điểm số hay xếp hạng.

[`adaptive-engine.md`](../01-platform/adaptive-engine.md) sở hữu *công thức*. Spec này sở hữu *khi nào ghi* và *hiện ra sao*.

## 2. Actors

| Actor | Thấy gì |
|---|---|
| Trẻ | Bản đồ tiến độ bằng hình, huy hiệu. Cấm con số, không xếp hạng |
| Người lớn | Nhãn thành thạo theo skill — [`basic-report.md`](../03-account/basic-report.md) · [`advanced-report.md`](../03-account/advanced-report.md) |
| Adaptive | `mastery_state` thô |

## 3. Entry points

| Nơi | |
|---|---|
| Job `rollup:session` | Ghi mastery |
| `/play/map` | Bản đồ cho trẻ |
| `GET /api/users/children/{uuid}/progress` | Cho người lớn |

## 4. Main flow

1. Phiên `completed` → kiểm bốn điều kiện [`play-session-lifecycle.md`](play-session-lifecycle.md) §7.3.
2. Với mỗi skill trong `content_skill_map` của level: gọi `computeUpdate` kèm `weight`.
3. Tầng API ghi `mastery_state`, map từng field.
4. Cập nhật bản đồ tiến độ của trẻ.
5. Nếu vượt ngưỡng → mở huy hiệu, hiện ở lần vào sảnh kế tiếp.

## 5. Alternative flows

| Nhánh | Hành vi |
|---|---|
| Guest / preview | Cấm ghi gì |
| Phiên `abandoned` | Ghi với `correct_ratio` trên round đã xong; `attempts_total` tăng |
| Level không gắn skill | Cấm ghi mastery. Cổng publish lẽ ra đã chặn — log cảnh báo |
| Skill ngôn ngữ mở (C5) | Cần người lớn chấm; `assessed_by_user_id` |
| Mastery giảm | Bình thường — `p_learn` đi xuống được. Cấm hiện điều đó cho trẻ |

## 6. Business rules

| ID | Rule | Vì sao |
|---|---|---|
| `BR-PRG-01` | Ghi mastery **chỉ khi** đủ bốn điều kiện §[`play-session-lifecycle.md`](play-session-lifecycle.md) 7.3 | Hàng rào chống nhiễu dữ liệu học tập |
| `BR-PRG-02` | Trẻ Cấm — **NEVER thấy `p_learn`, phần trăm, hay xếp hạng** | Áp lực đo lường ở tuổi 3–6 phản tác dụng |
| `BR-PRG-03` | Bản đồ trẻ Cấm — **NEVER hiện tiến độ đi xuống** | Trẻ không cần biết mình "tệ đi" |
| `BR-PRG-04` | Huy hiệu Cấm — **NEVER hết hạn**, không mất đi | Phần thưởng lấy lại được là hình phạt |
| `BR-PRG-05` | Cấm — **NEVER so sánh giữa trẻ**, kể cả trong cùng tài khoản | Tránh áp lực ganh đua và bảo vệ tâm lý phát triển tự nhiên của từng trẻ mầm non |
| `BR-PRG-06` | Mastery ghi ở **server** từ event; không nhận từ client | Ngăn ngừa hành vi can thiệp kết quả từ client để giữ tính chính xác của dữ liệu học tập |
| `BR-PRG-07` | Cấm — **NEVER streak ép buộc** — không "chuỗi ngày", không mất chuỗi khi nghỉ | `BR-CDC-09` cấm cơ chế gây nghiện |
| `BR-PRG-08` | Nhãn thành thạo theo bảng [`adaptive-engine.md`](../01-platform/adaptive-engine.md) §7.4, không nhãn tự chế | Thống nhất thuật ngữ chuẩn hóa toàn hệ thống và tránh các từ mang tính chẩn đoán tiêu cực |

## 7. Data

### 7.1 Bản đồ tiến độ cho trẻ

Bản đồ 6 vùng theo competency. Mỗi vùng có các "chặng" tương ứng strand.

| Trạng thái chặng | Hiển thị |
|---|---|
| Chưa chạm | Xám nhạt, không khoá đáng sợ |
| Đang học | Có màu, mascot đứng ở đó |
| Ổn định | Có màu đầy + một ngôi sao nhỏ |

Cấm phần trăm. Cấm thanh tiến độ có số. Cấm so sánh.

### 7.2 Huy hiệu

Trao khi: hoàn thành lần đầu một competency-strand · hoàn thành một tuần curriculum ·
chơi đủ 5 ngày khác nhau (**không** liên tiếp — `BR-PRG-07`).

Huy hiệu là **kỷ niệm**, không phải mục tiêu. Cấm có bảng huy hiệu để "săn".

### 7.3 Dữ liệu cho người lớn

| Trường | Nguồn |
|---|---|
| Nhãn thành thạo mỗi skill | `mastery_state.p_learn` → bảng [`adaptive-engine.md`](../01-platform/adaptive-engine.md) §7.4 |
| Skill đã tiếp xúc | `child_session_summaries.skill_ids` |
| Skill cần củng cố | `p_learn < 0.4` và `attempts_total ≥ 3` |
| Skill sẵn sàng học tiếp | `p_learn ≥ 0.8` và có skill kế trong DAG |

## 8. API contract

### `GET /api/users/children/{uuid}/progress`

| | |
|---|---|
| Auth | `requireUserAuth()` + ownership |
| 200 | `{ competencies: [{ code, label, skills: [{ code, name, mastery_label, attempts }] }], badges }` |
| 403 | `ENTITLEMENT_REQUIRED` — `view_basic_report` |

### `GET /api/users/play/map`

Bề mặt trẻ. Trả **chỉ** trạng thái hình ảnh §7.1 — không `p_learn`, không số.

## 9. Acceptance criteria

```gherkin
Scenario: BR-PRG-01 — chỉ ghi mastery khi đủ điều kiện
  Given một phiên preview của manager hoàn thành
  Then không hàng mastery_state nào đổi

Scenario: BR-PRG-02 — trẻ không thấy con số
  When gọi GET /api/users/play/map
  Then response không chứa p_learn, phần trăm, hay điểm

Scenario: BR-PRG-03 — bản đồ không hiện đi xuống
  Given p_learn của một skill giảm từ 0.85 xuống 0.6
  When trẻ mở bản đồ
  Then chặng đó không đổi từ có sao thành không sao

Scenario: BR-PRG-04 — huy hiệu không mất
  Given trẻ đã có một huy hiệu
  When trẻ nghỉ 60 ngày
  Then huy hiệu vẫn còn

Scenario: BR-PRG-07 — không có streak ép buộc
  When quét UI bề mặt trẻ và bề mặt người lớn
  Then không có chuỗi ngày liên tiếp nào bị mất khi nghỉ

Scenario: BR-PRG-05 — không so sánh giữa trẻ
  Given một tài khoản có 3 trẻ
  When mở báo cáo của một trẻ
  Then không có so sánh với hai trẻ còn lại

Scenario: BR-PRG-08 — nhãn đúng bảng chuẩn
  When render mọi nhãn thành thạo có thể có
  Then mọi nhãn thuộc bảng adaptive-engine §7.4

Scenario: BR-PRG-06 — mastery không nhận từ client
  Given client gửi p_learn trong payload complete
  Then giá trị bị bỏ qua
```

## 10. Boundaries

**Always**
- Kiểm bốn điều kiện trước khi ghi mastery.
- Dùng nhãn từ bảng chuẩn.
- Giữ huy hiệu vĩnh viễn.

**Ask first**
- Thêm loại huy hiệu.
- Đổi cách hiển thị bản đồ.

**Never**
- Hiện `p_learn`, phần trăm, hay xếp hạng cho trẻ.
- Hiện tiến độ đi xuống trên bề mặt trẻ.
- Huy hiệu hết hạn hoặc mất đi.
- Streak ép buộc.
- So sánh giữa trẻ.

## 11. Open questions

| # | Câu hỏi | Chặn phase | Đề xuất chốt | Chủ |
|---|---|---|---|---|
| 1 | Skill C5 cần người lớn chấm — luồng UI thế nào và ai nhắc? | P3 | hoãn — trỏ sang quyết định `D-BA` ở [`adaptive-engine.md`](../01-platform/adaptive-engine.md); MVP chưa hỗ trợ skill chấm tay C5 | Studio UI |
| 2 | Bản đồ 6 vùng có quá nhiều cho trẻ 3 tuổi không? Cân nhắc chỉ hiện vùng đang học | P3 | Chỉ hiển thị 1-2 vùng đang học và các chặng gần nhất trên giao diện mầm non; thu gọn 6 vùng vào trang báo cáo phụ huynh | Studio UI |
