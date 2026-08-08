---
spec: CONSENT-MANAGEMENT
title: Quản lý đồng ý
area: account
status: approved
mvp: true
phase: P1
reviewed: 2026-08-08
owns:
  - Luồng xem, cập nhật, rút đồng ý
  - Xử lý khi chính sách đổi version
depends_on:
  - CHILD-DATA-COMPLIANCE
  - LEGAL-PAGES
---

# Quản lý đồng ý

## 1. Objective

Đồng ý phải **xem lại được và rút lại được** — đó là yêu cầu của Nghị định 13/2023, không
phải tuỳ chọn thiết kế.

Và khi chính sách đổi, User phải được hỏi lại, không phải bị coi là đã đồng ý ngầm.

## 2. Actors

User (người lớn). Cấm Trẻ không cho đồng ý.

## 3. Entry points

`/me/settings/privacy` · `GET /api/users/consents` ·
`POST /api/users/consents` · `/consents/withdraw`.

## 4. Main flow

1. Mở trang quyền riêng tư.
2. Hiện: loại đồng ý · version đã đồng ý · thời điểm · trạng thái.
3. Có version mới → nút "Xem thay đổi và đồng ý".
4. Rút đồng ý → cảnh báo hậu quả → xác nhận → INSERT hàng `withdrawn`.

## 5. Alternative flows

| Nhánh | Hành vi |
|---|---|
| Chính sách có version mới | Banner ở `/me`; chặn **tạo hồ sơ trẻ mới**, không chặn truy cập dữ liệu đã có |
| Rút `child_data` | Hồ sơ trẻ → `archived`, dừng thu dữ liệu mới, giữ 30 ngày rồi xoá |
| Rút `privacy` | Tương đương yêu cầu xoá tài khoản — dẫn sang luồng đó |
| Đồng ý lại sau khi rút | Được, tạo hàng mới |

## 6. Business rules

| ID | Rule | Vì sao |
|---|---|---|
| `BR-CSM-01` | `consent_logs` **INSERT-only**. Rút = **thêm hàng** | `BR-CDC-07` — sửa hàng cũ làm mất bằng chứng đã từng đồng ý |
| `BR-CSM-02` | Đồng ý **tường minh**, không tick sẵn, không suy từ hành vi | Tuân thủ Nghị định 13/2023/NĐ-CP về sự đồng ý tự nguyện của chủ thể dữ liệu |
| `BR-CSM-03` | Chính sách đổi version → hỏi lại, Cấm — **NEVER coi là đồng ý ngầm** | Bảo vệ quyền lợi phụ huynh và đảm bảo tính minh bạch khi điều khoản thay đổi |
| `BR-CSM-04` | Version mới chặn **tạo hồ sơ mới**, không chặn truy cập dữ liệu đã có | Khoá dữ liệu của người dùng để ép đồng ý là ép buộc |
| `BR-CSM-05` | Trang hiện **thay đổi so với version trước**, không chỉ toàn văn | Không ai đọc lại 10 trang để tìm đoạn đổi |
| `BR-CSM-06` | Rút đồng ý nêu **hậu quả cụ thể** trước khi xác nhận | Đảm bảo người dùng hiểu rõ phạm vi ảnh hưởng trước khi thực hiện hành động không đảo ngược |
| `BR-CSM-07` | Mỗi hàng ghi `policy_version`, IP, user agent, thời điểm | Bằng chứng |
| `BR-CSM-08` | Rút `child_data` **không xoá ngay** — archive rồi xoá sau 30 ngày | Cho phép đổi ý |

## 7. Data

### 7.1 Loại đồng ý

| Loại | Bắt buộc để dùng | Rút được |
|---|:--:|:--:|
| `terms` | | rút = xoá tài khoản |
| `privacy` | | rút = xoá tài khoản |
| `child_data` | để tạo hồ sơ trẻ | |

Ba loại. Cấm **Không có** đồng ý tiếp thị ở MVP — vì không có email tiếp thị (`BR-NOT-06`).

### 7.2 Màn hình

| Cột | Nội dung |
|---|---|
| Loại | Nhãn tiếng Việt |
| Version đã đồng ý | + link toàn văn version đó |
| Thời điểm | |
| Trạng thái | Đang hiệu lực · Có bản mới · Đã rút |
| Hành động | Xem thay đổi · Đồng ý bản mới · Rút |

### 7.3 Hậu quả khi rút `child_data`

> Khi bạn rút đồng ý:
> - N hồ sơ bé sẽ được lưu trữ, các bé không chơi tiếp được
> - Tiến độ học được giữ 30 ngày rồi xoá vĩnh viễn
> - Bạn có thể đồng ý lại bất cứ lúc nào trong 30 ngày để khôi phục

## 8. API contract

### `GET /api/users/consents`

200 → danh sách §7.2 + version hiện hành của mỗi loại.

### `POST /api/users/consents`

Body `{ consent_type, policy_version }`. 201. 409 `CONSENT_VERSION_STALE` nếu version không
phải bản hiện hành.

### `POST /api/users/consents/withdraw`

Body `{ consent_type, confirm: true }`. 200.

## 9. Acceptance criteria

```gherkin
Scenario: BR-CSM-01 — rút tạo hàng mới
  Given user đã có 1 hàng consent child_data
  When rút đồng ý
  Then consent_logs có 2 hàng
  And hàng đầu không đổi

Scenario: BR-CSM-03 — version mới phải hỏi lại
  Given chính sách quyền riêng tư lên version mới
  When user đăng nhập
  Then hiện banner yêu cầu xem và đồng ý

Scenario: BR-CSM-04 — version mới không khoá dữ liệu cũ
  Given user chưa đồng ý version mới
  When mở báo cáo của trẻ đã có
  Then vẫn xem được
  When tạo hồ sơ trẻ mới
  Then trả 428 CONSENT_REQUIRED

Scenario: BR-CSM-05 — hiện phần thay đổi
  When mở "Xem thay đổi"
  Then hiện diff so với version đã đồng ý
  And không chỉ có toàn văn

Scenario: BR-CSM-06 — nêu hậu quả trước khi rút
  When bấm rút đồng ý child_data
  Then hiện đúng số hồ sơ bé bị ảnh hưởng và thời hạn 30 ngày

Scenario: BR-CSM-08 — rút không xoá ngay
  When rút đồng ý child_data
  Then hồ sơ trẻ chuyển archived
  And dữ liệu vẫn còn
  When đồng ý lại trong 30 ngày
  Then hồ sơ khôi phục

Scenario: BR-CSM-02 — không tick sẵn
  When mở màn hình đồng ý bản mới
  Then checkbox chưa tick
```

## 10. Boundaries

**Always**
- INSERT-only, rút = thêm hàng.
- Hỏi lại khi version đổi.
- Hiện diff và hậu quả cụ thể.

**Ask first**
- Thêm loại đồng ý.
- Đổi thời hạn 30 ngày sau khi rút.

**Never**
- Sửa hàng `consent_logs`.
- Tick sẵn hoặc suy đồng ý từ hành vi.
- Khoá dữ liệu đã có để ép đồng ý bản mới.
- Xoá ngay khi rút.

## 11. Open questions

| # | Câu hỏi | Chặn gì | Chặn phase | Chủ |
|---|---|---|---|---|
| 1 | Diff chính sách sinh tự động hay soạn tay tóm tắt thay đổi? | Trải nghiệm đồng ý | P1 | Chốt: Soạn tay tóm tắt thay đổi (`summary_vi`) cho phụ huynh; diff toàn văn ở chế độ xem chi tiết |
| 2 | Version chính sách đổi bao lâu một lần và ai quyết định? | Quy trình vận hành | P1 | Chuyên gia pháp lý / Ban điều hành |

