---
spec: CHILD-PROFILE-SWITCHING
title: Chọn và đổi hồ sơ trẻ
area: account
status: approved
mvp: true
phase: P1
reviewed: 2026-08-08
owns:
  - Cơ chế đặt và đổi active_child_id
depends_on:
  - CHILD-PROFILE-CRUD
  - PARENT-GATE
  - ACTORS
---

# Chọn và đổi hồ sơ trẻ

## 1. Objective

Xác định **phiên chơi này thuộc về trẻ nào**.

Chọn sai làm hỏng dữ liệu học của cả hai trẻ, và không sửa ngược được — mastery đã cập nhật
thì không tách ra được. Vì vậy đổi trẻ đi qua Parent Gate.

## 2. Actors

| Actor | Làm gì |
|---|---|
| Người lớn | Chọn và đổi |
| Trẻ | Cấm đổi được |

## 3. Entry points

`/me` thẻ trẻ · `/me/children` · `POST /api/users/children/{uuid}/activate` ·
`DELETE /api/users/children/active`.

**D-BY** (T15, 2026-08-09): spec này là **chủ duy nhất** của
`POST /api/users/children/{uuid}/activate` và cơ chế đặt `active_child_id`.
[`play-entry-and-profile-select.md`](../04-play/play-entry-and-profile-select.md) gọi lại
endpoint này khi cần chọn trẻ trước lúc vào khu vực chơi — không định nghĩa lại.

## 4. Main flow

1. Người lớn bấm "Cho bé chơi" trên thẻ một trẻ.
2. Server kiểm ownership → đặt cookie `active_child_id`.
3. Chuyển sang `/play`.

## 5. Alternative flows

| Nhánh | Hành vi |
|---|---|
| Đã có trẻ đang hoạt động, chọn trẻ khác | **Parent Gate** trước |
| Trẻ `archived` | Cấm chọn được |
| Cookie trỏ trẻ không tồn tại hoặc không thuộc User | Xoá cookie, yêu cầu chọn lại |
| Đang trong phiên chơi | Phiên hiện tại → `abandoned`, phiên mới cho trẻ mới |
| Chỉ có một trẻ | Vẫn phải chọn tường minh lần đầu; sau đó nhớ 30 ngày |

## 6. Business rules

| ID | Rule | Vì sao |
|---|---|---|
| `BR-CPS-01` | Đổi trẻ **phải qua Parent Gate** | Trẻ đổi sang hồ sơ anh chị làm hỏng dữ liệu cả hai |
| `BR-CPS-02` | Ownership kiểm ở **DB mỗi request**, không tin cookie | `BR-ACT-07` |
| `BR-CPS-03` | Cookie **không phải nguồn quyền** — chỉ là ngữ cảnh | Đảm bảo an toàn dữ liệu, tránh việc client thay đổi cookie để truy cập hồ sơ khác |
| `BR-CPS-04` | Đổi trẻ giữa phiên → phiên cũ `abandoned` | Dữ liệu phiên phải thuộc đúng một trẻ |
| `BR-CPS-05` | Trẻ `archived` không chọn được | Đảm bảo dữ liệu của hồ sơ đã dọn dẹp không bị ghi đè hay xáo trộn |
| `BR-CPS-06` | Bề mặt trẻ hiện **avatar + tên** của trẻ đang hoạt động | Xác nhận trực quan đang chơi với hồ sơ nào |
| `BR-CPS-07` | Lần đầu **phải chọn tường minh**, kể cả khi chỉ có một trẻ | Tạo thói quen đúng |

## 7. Data

Cookie `active_child_id`: không HttpOnly · SameSite=Lax · 30 ngày · giá trị là `uuid`.

Server luôn kiểm: `SELECT … FROM child_profiles WHERE uuid = ? AND user_id = ? AND status = 'active'`.

## 8. API contract

### `POST /api/users/children/{uuid}/activate`

| | |
|---|---|
| Auth | `requireUserAuth()` + ownership |
| Body | `{ gate_token? }` — bắt buộc khi đang có `active_child_id` khác |
| 200 | Đặt cookie, trả `{ child }` |
| 403 | `PARENT_GATE_REQUIRED` |
| 404 | Không tồn tại, không thuộc caller, hoặc đã archived |

### `DELETE /api/users/children/active`

Xoá cookie, thoát ngữ cảnh trẻ.

## 9. Acceptance criteria

```gherkin
Scenario: BR-CPS-01 — đổi trẻ cần Parent Gate
  Given đang hoạt động với trẻ A
  When activate trẻ B không kèm gate_token
  Then trả 403 PARENT_GATE_REQUIRED

Scenario: BR-CPS-02 — cookie giả không mở dữ liệu
  Given user A đăng nhập
  When sửa cookie thành uuid trẻ của user B
  And gọi bất kỳ API cần trẻ
  Then trả 404

Scenario: BR-CPS-04 — đổi trẻ đóng phiên cũ
  Given trẻ A đang trong một phiên
  When đổi sang trẻ B
  Then phiên của A chuyển abandoned

Scenario: BR-CPS-05 — trẻ archived không chọn được
  Given trẻ có status archived
  When activate
  Then trả 404

Scenario: BR-CPS-06 — hiện trẻ đang chơi
  When mở /play
  Then avatar và tên trẻ đang hoạt động hiển thị

Scenario: BR-CPS-07 — chọn tường minh lần đầu
  Given user có đúng một trẻ và chưa từng chọn
  When mở /play
  Then chuyển về màn hình chọn trẻ
```

## 10. Boundaries

**Always**
- Kiểm ownership ở DB mỗi request.
- Parent Gate khi đổi trẻ.
- Hiện trẻ đang hoạt động trên bề mặt trẻ.

**Ask first**
- Đổi TTL cookie.
- Bỏ Parent Gate cho một luồng nào đó.

**Never**
- Tin cookie làm nguồn quyền.
- Cho trẻ đổi hồ sơ.
- Giữ phiên cũ khi đổi trẻ.

## 11. Open questions

| # | Câu hỏi | Chặn gì | Chặn phase | Chủ |
|---|---|---|---|---|
| 1 | Có nên có PIN riêng cho từng trẻ (trẻ lớn tự chọn) không? | Bảo mật hồ sơ | P4 | người quyết |

