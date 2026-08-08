---
spec: PLAY-ENTRY-AND-PROFILE-SELECT
title: Vào khu vực chơi và chọn trẻ
area: play
status: draft
mvp: true
phase: P1
reviewed: 2026-08-04
owns:
  - Luồng vào khu vực chơi
  - Cơ chế chọn và đổi child profile
depends_on:
  - ACTORS
  - ACCESS-GATING
  - PARENT-GATE
---

# Vào khu vực chơi và chọn trẻ

## 1. Objective

Chuyển từ bề mặt người lớn sang bề mặt trẻ, và xác định **phiên này là của trẻ nào**.

Chọn sai trẻ làm hỏng dữ liệu học tập của cả hai — nên bước này phải rõ ràng với người lớn
và không đổi được bởi trẻ.

## 2. Actors

| Actor | Làm gì |
|---|---|
| Người lớn | Chọn trẻ, vào khu vực chơi |
| Trẻ | Chơi. Cấm đổi được trẻ |
| Guest | Vào thẳng khu vực chơi, không có hồ sơ |

## 3. Entry points

| Route | |
|---|---|
| `/play` | Sảnh — catalog game cho trẻ |
| `/play/{code}` | Một level |
| `/me/children` | Chọn trẻ rồi vào chơi |
| `POST /api/users/children/{uuid}/activate` | Đặt `active_child_id` |

## 4. Main flow

1. Người lớn ở `/me/children`, chọn một trẻ.
2. Server kiểm ownership, đặt cookie `active_child_id`.
3. Chuyển sang `/play` — giao diện đổi hoàn toàn sang bề mặt trẻ.
4. Trẻ duyệt catalog (ít chữ, hình lớn, không bộ lọc phức tạp).
5. Chọn game → gating → config → chơi.

## 5. Alternative flows

| Nhánh | Hành vi |
|---|---|
| Guest vào thẳng `/play` | Thấy allow-list 6 game free. Cấm lưu tiến độ. Sau 3 lượt hiện lời mời đăng ký **trên bề mặt người lớn**, không giữa lúc chơi |
| User chưa có trẻ nào | Chuyển về `/me/children/new` |
| User chưa chọn trẻ, vào thẳng `/play/{code}` bậc ≥ login | **428** → màn hình chọn trẻ |
| Cookie trẻ trỏ tới trẻ đã archive | Xoá cookie, yêu cầu chọn lại |
| Đổi trẻ | Qua **Parent Gate** |

## 6. Business rules

| ID | Rule | Vì sao |
|---|---|---|
| `BR-PEN-01` | Đổi trẻ **phải qua Parent Gate** | Trẻ đổi sang hồ sơ anh chị làm hỏng dữ liệu của cả hai |
| `BR-PEN-02` | Ownership `active_child_id` kiểm ở **DB mỗi request**, không tin cookie | `BR-ACT-07` |
| `BR-PEN-03` | Catalog cho trẻ **không có bộ lọc chữ** — duyệt bằng hình và chủ đề | Trẻ chưa đọc |
| `BR-PEN-04` | Bề mặt trẻ Cấm — **NEVER hiện dữ liệu thanh toán, gói, hay lời mời nâng cấp** | `BR-CDC-12` |
| `BR-PEN-05` | Lời mời đăng ký cho guest hiện **sau khi chơi xong**, không giữa lúc chơi | Ngắt trẻ để bán hàng là thiết kế tệ |
| `BR-PEN-06` | Nội dung bị khoá hiện trong catalog trẻ dưới dạng **ổ khoá trung tính**, không có giá tiền | Trẻ không phải người mua |
| `BR-PEN-07` | Chuyển sang `/play` đặt **landscape-locked** trên tablet | Tư thế chơi |

## 7. Data

### 7.1 Cookie `active_child_id`

Không HttpOnly (client cần đọc để render) · SameSite=Lax · 30 ngày · **không phải nguồn
quyền** — server luôn kiểm lại ownership.

### 7.2 Sảnh trẻ

| Phần | Nội dung |
|---|---|
| Avatar trẻ | Xác nhận đang chơi với hồ sơ nào |
| "Tiếp tục" | Level đang dở hoặc bước curriculum kế tiếp |
| Theo chủ đề | 6 thẻ competency, mỗi thẻ một biểu tượng |
| Gợi ý | 3–5 level từ [`next-game-recommendation.md`](next-game-recommendation.md) |
| Nút thoát | Góc, long-press 800ms → Parent Gate |

Cấm thanh tìm kiếm. Cấm bộ lọc. Cấm danh sách dài phải cuộn nhiều.

## 8. API contract

### `POST /api/users/children/{uuid}/activate`

| | |
|---|---|
| Auth | `requireUserAuth()` + ownership |
| Body | `{ gate_token? }` — bắt buộc khi đã có `active_child_id` khác |
| 200 | Đặt cookie, trả `{ child: { uuid, display_name, avatar_id, age_band } }` |
| 403 | `PARENT_GATE_REQUIRED` |
| 404 | Trẻ không tồn tại hoặc không thuộc caller |

### `GET /api/users/play/home`

200 → sảnh §7.2, đã lọc theo quyền và tuổi.

## 9. Acceptance criteria

```gherkin
Scenario: BR-PEN-01 — đổi trẻ cần Parent Gate
  Given đang chơi với trẻ A
  When gọi activate cho trẻ B không kèm gate_token
  Then trả 403 PARENT_GATE_REQUIRED

Scenario: BR-PEN-02 — cookie giả không mở dữ liệu trẻ khác
  Given user A đăng nhập
  When sửa cookie active_child_id thành trẻ của user B
  And gọi GET /api/users/play/home
  Then trả 404

Scenario: BR-PEN-04 — bề mặt trẻ không có nội dung thương mại
  When quét mọi component dưới pages/play
  Then không component nào hiện giá, tên gói, hay nút nâng cấp

Scenario: BR-PEN-06 — nội dung khoá hiện trung tính
  Given trẻ của user không gói duyệt catalog
  When thấy một level premium
  Then hiện biểu tượng ổ khoá
  And không hiện số tiền

Scenario: BR-PEN-05 — không ngắt trẻ để mời đăng ký
  Given guest đang chơi lượt thứ 3
  When lượt chơi đang diễn ra
  Then không lời mời nào hiện ra
  When lượt chơi kết thúc
  Then lời mời hiện ở màn hình tổng kết

Scenario: BR-PEN-03 — catalog trẻ không có bộ lọc chữ
  When render sảnh trẻ
  Then không có input tìm kiếm
  And không có dropdown bộ lọc

Scenario: trẻ đã archive thì yêu cầu chọn lại
  Given cookie trỏ tới trẻ đã archive
  When mở /play
  Then chuyển về màn hình chọn trẻ
```

## 10. Boundaries

**Always**
- Kiểm ownership trẻ ở DB mỗi request.
- Parent Gate khi đổi trẻ.
- Landscape-lock trên tablet ở `/play`.

**Ask first**
- Thêm mục vào sảnh trẻ.
- Đổi ngưỡng lượt chơi hiện lời mời đăng ký.

**Never**
- Tin cookie `active_child_id` làm nguồn quyền.
- Dữ liệu thương mại trên bề mặt trẻ.
- Ngắt phiên chơi để mời đăng ký.
- Bộ lọc chữ trong catalog trẻ.

## 11. Open questions

| # | Câu hỏi | Chặn gì |
|---|---|---|
| 1 | Guest chơi bao nhiêu lượt thì mời đăng ký? | [`access-ladder.md`](../00-foundation/access-ladder.md) Q2 |
| 2 | Sảnh trẻ có cần chế độ "chỉ hiện nội dung mở được" cho gói thấp không? Ổ khoá nhiều quá gây nản | UX P1 |
