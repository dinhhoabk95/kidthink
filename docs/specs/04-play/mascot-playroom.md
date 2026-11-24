---
spec: MASCOT-PLAYROOM
title: Phòng chơi Gấu Con — tương tác nhân vật và phụ kiện kỷ niệm tại sảnh trẻ
area: play
status: implemented
mvp: false
phase: P4
reviewed: 2026-11-15
owns:
  - Không gian tương tác Phòng chơi Gấu Con trên sảnh `/play`
  - Bảng ánh xạ huy hiệu sang phụ kiện kỷ niệm của Gấu Con (`MASCOT_GEAR_CATALOG`)
  - Lưu trữ phụ kiện Gấu Con đang đội của từng trẻ (`child_mascot_gear`)
  - API đọc và đổi phụ kiện Gấu Con (`GET` / `PUT /api/users/play/mascot-gear`)
depends_on:
  - PLAY-ENTRY-AND-PROFILE-SELECT
  - FEEDBACK-AND-CELEBRATION
  - PROGRESS-AND-MASTERY
  - CHILD-DATA-COMPLIANCE
---

# Phòng chơi Gấu Con — tương tác nhân vật và phụ kiện kỷ niệm tại sảnh trẻ

## 1. Objective

Trẻ mầm non gắn bó với ứng dụng học tập thông qua tình cảm dành cho nhân vật đồng hành (như Kodi trong *Khan Academy Kids* hay phòng đồ chơi *Pok Pok*), không phải qua bảng điều khiển chữ.

Spec này biến khu vực trung tâm của sảnh `/play` thành **Phòng chơi Gấu Con**: trẻ chạm trực tiếp vào Gấu Con để đập tay (high-five), nghe lời chào ấm áp, và đội các món phụ kiện kỷ niệm dễ thương (mũ thám hiểm, vương miện lá, khăn ngôi sao...) được mở tự động từ chính các huy hiệu `child_badges` trẻ đã nhận — hoàn toàn không có tiền tệ, không cửa hàng mua bán, và không đụng vào danh sách cột đóng của `child_profiles`.

## 2. Actors

| Actor | Quyền cần | Làm được gì ở đây |
|---|---|---|
| Trẻ | Hồ sơ trẻ đang hoạt động hoặc Guest | Chạm Gấu Con để tương tác vui, đổi phụ kiện kỷ niệm đã mở |
| Server | — | Xác thực phụ kiện trẻ chọn thực sự tương ứng với huy hiệu trẻ đã đạt |

## 3. Entry points

| Route / màn hình | Actor | Ghi chú |
|---|---|---|
| `/play` (`KidPlayroomStage`) | Trẻ / Guest | Khu vực nhân vật Gấu Con trung tâm sảnh chơi |
| `GET /api/users/play/mascot-gear` | Trẻ | Lấy danh sách phụ kiện đã mở và phụ kiện đang đội |
| `PUT /api/users/play/mascot-gear` | Trẻ | Đội hoặc tháo phụ kiện kỷ niệm cho Gấu Con |

## 4. Main flow

1. Khi mở `/play`, trang gọi `GET /api/users/play/mascot-gear` (nếu đã đăng nhập và có `active_child_id`).
2. Server tra `child_badges` của trẻ, ánh xạ sang danh sách phụ kiện đã mở theo hằng `MASCOT_GEAR_CATALOG`, kèm `equipped_gear_code` từ bảng `child_mascot_gear`.
3. Gấu Con hiện ở trung tâm phòng chơi cùng phụ kiện đang đội (nếu có).
4. Trẻ chạm vào Gấu Con → Gấu Con chuyển sang dáng `happy` / `cheer`, toả ngôi sao nhỏ tại điểm chạm, phát âm mộc cầm vui tai và đọc một câu chào/khích lệ xoay vòng.
5. Nếu trẻ đã mở ít nhất 1 phụ kiện, nút tủ phụ kiện bằng icon chiếc mũ (≥ 64px CSS) xuất hiện cạnh Gấu Con; trẻ chạm để chọn đội hoặc tháo phụ kiện, trang gửi `PUT /api/users/play/mascot-gear`.

## 5. Alternative flows

| Nhánh | Điều kiện | Hành vi |
|---|---|---|
| Trẻ chưa có huy hiệu nào | `unlocked_gears` rỗng | Vẫn luôn có sẵn 1 phụ kiện mặc định miễn phí (`flower_pin` — cài hoa nhỏ) để mọi trẻ mới đều trải nghiệm niềm vui thử đồ cho Gấu Con; không hiện ô khoá trống |
| Guest chưa đăng nhập | Không có phiên User | Cho phép chạm Gấu Con tương tác và thử phụ kiện mặc định lưu tạm trong state phiên, không gọi API lưu DB |
| Gửi mã phụ kiện chưa mở khoá | Client gửi `gear_code` không thuộc tập đã mở của trẻ | Server từ chối `422 VALIDATION_FAILED`, không cập nhật DB |

## 6. Business rules

| ID | Rule | Vì sao |
|---|---|---|
| `BR-MPR-01` | Trạng thái phụ kiện Gấu Con lưu ở bảng phụ `child_mascot_gear`, **cấm thêm cột vào `child_profiles`** | Bảo vệ tuyệt đối danh sách trường đóng của hồ sơ trẻ theo `BR-CDC-01` (§7.3) |
| `BR-MPR-02` | Phụ kiện kỷ niệm chỉ mở tự động từ huy hiệu `child_badges` (cộng 1 món khởi đầu chung); **cấm bán bằng tiền, xu, điểm hay streak** | Tuân thủ `BR-CDC-09`, `BR-STK-03`, `BR-PEN-04` — không thương mại hoá hoặc tạo cơ chế săn thưởng gây nghiện trên bề mặt trẻ |
| `BR-MPR-03` | Khay phụ kiện **chỉ hiển thị những phụ kiện trẻ đã mở**, cấm hiện bóng đen hay ổ khoá "còn thiếu" | Giống `BR-STK-03` và `progress-and-mastery.md` §7.2: kỷ niệm để vui, không phải bảng mục tiêu gây hụt hẫng |
| `BR-MPR-04` | Chạm vào Gấu Con tại sảnh luôn phản hồi trong ≤ 100ms bằng cả hình ảnh (nảy đàn hồi + đổi dáng) và âm thanh | `BR-FBK-02`, `BR-FBK-06` — phản hồi đa giác quan tức thì cho trẻ mầm non |
| `BR-MPR-05` | `PUT /api/users/play/mascot-gear` kiểm tra quyền sở hữu `active_child_id` và kiểm tra `gear_code` thuộc tập đã mở của chính trẻ đó ở server | Chống giả mạo payload từ client (`BR-SEC-05`, `BR-SEC-06`) |
| `BR-MPR-06` | Mọi điều khiển trong Phòng chơi Gấu Con đạt sàn chạm ≥ 64px CSS, không dùng chữ làm affordance duy nhất | `13-ui-ux.md` §1 & §6 — phù hợp vận động tinh của trẻ 3–6 tuổi |

## 7. Data

**Đọc:** `child_profiles`, `child_badges`, `MASCOT_GEAR_CATALOG` (`packages/shared/src/constants/mascot-gear.ts`).
**Ghi:** `child_mascot_gear`.

### 7.1 `child_mascot_gear`

| Field | Kiểu | Ràng buộc |
|---|---|---|
| `child_profile_id` | bigint | PK, FK `child_profiles(id)` `ON DELETE CASCADE` |
| `equipped_gear_code` | varchar(40) nullable | `null` khi tháo phụ kiện; phải thuộc `MASCOT_GEAR_CATALOG` |
| `created_at` | timestamptz | mặc định `now()` |
| `updated_at` | timestamptz | mặc định `now()` |

## 8. API contract

### `GET /api/users/play/mascot-gear`

| | |
|---|---|
| Auth | Phiên User + trẻ đang hoạt động thuộc caller |
| 200 | `{ equipped_gear_code: string \| null, unlocked_gears: Array<{ code: string, label_vi: string, icon_emoji: string }> }` |
| 428 | `NO_ACTIVE_CHILD` — chưa chọn hồ sơ trẻ hợp lệ |

### `PUT /api/users/play/mascot-gear`

| | |
|---|---|
| Auth | Phiên User + CSRF `x-csrf-token` + trẻ đang hoạt động thuộc caller |
| Body | `{ equipped_gear_code: string \| null }` |
| 200 | `{ equipped_gear_code: string \| null }` |
| 422 | `VALIDATION_FAILED` — mã phụ kiện không tồn tại hoặc trẻ chưa mở khoá |
| 428 | `NO_ACTIVE_CHILD` — chưa chọn hồ sơ trẻ hợp lệ |

## 9. Acceptance criteria

```gherkin
Scenario: BR-MPR-01 — không sửa đổi schema bảng child_profiles
  When đọc định nghĩa bảng child_profiles trong packages/db/src/schema/child.ts
  Then danh sách cột của child_profiles giữ nguyên trong danh sách đóng

Scenario: BR-MPR-03 — chỉ trả phụ kiện đã mở, không trả phụ kiện bị khoá
  Given trẻ mới tạo chưa có hàng child_badges nào
  When gọi GET /api/users/play/mascot-gear
  Then unlocked_gears chỉ chứa phụ kiện khởi đầu flower_pin
  And không phần tử nào có trường is_locked

Scenario: BR-MPR-05 — từ chối trang bị phụ kiện trẻ chưa mở (ca âm)
  Given trẻ chưa có huy hiệu mở khoá star_crown
  When gọi PUT /api/users/play/mascot-gear với equipped_gear_code = "star_crown"
  Then trả 422 VALIDATION_FAILED
```

## 10. Boundaries

**Always**
- Giữ phụ kiện Gấu Con tách biệt trong `child_mascot_gear` với `ON DELETE CASCADE` theo trẻ.
- Bảo đảm phụ kiện đã mở không bao giờ bị thu hồi (`BR-PRG-04`).

**Ask first**
- Thêm quá 12 phụ kiện vào `MASCOT_GEAR_CATALOG`.
- Đưa phụ kiện Gấu Con vào bên trong khung lời dẫn hẹp của Canvas màn chơi.

**Never**
- Bán phụ kiện bằng tiền thật hoặc tiền ảo.
- Hiện ô khoá hoặc đếm số phụ kiện còn thiếu trên bề mặt trẻ.

## 11. Open questions

Không có.
