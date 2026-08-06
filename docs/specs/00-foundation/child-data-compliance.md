---
spec: CHILD-DATA-COMPLIANCE
title: Tuân thủ dữ liệu trẻ em — Nghị định 13/2023 và Luật Trẻ em
area: foundation
status: draft
mvp: true
phase: P0
reviewed: 2026-08-04
owns:
  - Danh sách đóng trường dữ liệu được phép thu của trẻ
  - Quy tắc đồng ý và rút đồng ý
  - Quy tắc lưu trữ, xoá, ẩn danh hoá
depends_on:
  - GLOSSARY
  - ACTORS
---

# Tuân thủ dữ liệu trẻ em

## 1. Objective

Thị trường vận hành: **Việt Nam**. Ràng buộc pháp lý: **Nghị định 13/2023/NĐ-CP** về bảo vệ
dữ liệu cá nhân và **Luật Trẻ em 2016**.

Đây là **ràng buộc thiết kế, không phải checklist cuối**. Thu dữ liệu trẻ vượt nhu cầu là
thứ không rút lại được sau khi đã ghi — xoá bản ghi không xoá được bản backup, log, và bản
sao đã chảy sang bên thứ ba.

Spec này ép ràng buộc lên schema **trước** khi bảng được tạo.

> Không áp COPPA (Mỹ) hay GDPR-K (EU) ở MVP. Mở thị trường ngoài Việt Nam thì spec này phải
> được viết lại **trước**, không phải sau — xem §11.

## 2. Actors

| Actor | Vai trò ở đây |
|---|---|
| **User** (người lớn) | Chủ thể cho đồng ý. Là người duy nhất được thao tác dữ liệu trẻ |
| **Child Profile** | Chủ thể dữ liệu. Không có tài khoản, không tự thao tác |
| **Manager** | Xử lý dữ liệu trong phạm vi vận hành. `content_reviewer` ❌ không thấy dữ liệu trẻ |
| **Bên thứ ba** | LLM provider, S3, email. ❌ **Không bên nào nhận PII của trẻ** |

## 3. Entry points

| Nơi | Ràng buộc áp |
|---|---|
| `POST /api/users/children` | Danh sách đóng §7.1 · yêu cầu consent hợp lệ |
| Mọi endpoint đọc dữ liệu trẻ | Ownership ở DB query |
| `telemetry_events` | Chỉ `child_uuid` |
| Mọi prompt gửi LLM | Không tên, không `child_uuid`, không tuổi chính xác |
| Bề mặt trẻ (`/play/**`) | Không tracking bên thứ ba, không quảng cáo |
| Trang pháp lý | Không tracking bên thứ ba |

## 4. Main flow — đồng ý trước khi thu

1. User đăng ký, xác thực email.
2. User mở luồng tạo child profile lần đầu.
3. Hệ thống hiện **bản tóm tắt** những gì sẽ thu và vì sao, kèm link chính sách đầy đủ.
4. User tick đồng ý **tường minh** — ❌ không tick sẵn, ❌ không "tiếp tục nghĩa là đồng ý".
5. Hệ thống INSERT `consent_logs` `{user_id, consent_type:'child_data', policy_version, ip, ua, created_at}`.
6. Chỉ khi bước 5 thành công, form tạo child profile mới mở.

## 5. Alternative flows

| Nhánh | Hành vi |
|---|---|
| Chính sách đổi version | Lần đăng nhập kế tiếp yêu cầu đồng ý lại. Chưa đồng ý → chặn tạo trẻ mới, **không** chặn truy cập dữ liệu đã có |
| User rút đồng ý | INSERT hàng `consent_type='child_data_withdrawn'`. Hồ sơ trẻ chuyển `archived`, dừng thu dữ liệu mới, giữ dữ liệu cũ 30 ngày rồi xoá |
| User yêu cầu xoá tài khoản | §7.4 |
| User yêu cầu bản sao dữ liệu | Export JSON trong 30 ngày |

## 6. Business rules

| ID | Rule | Vì sao |
|---|---|---|
| `BR-CDC-01` | `child_profiles` chỉ chứa trường ở **danh sách đóng** §7.1. Thêm trường = sửa spec này trước | Danh sách mở sẽ đầy dần bằng những field "để sau này dùng" |
| `BR-CDC-02` | ❌ **NEVER thu ngày sinh chính xác.** Chỉ `birth_year` hoặc `age_band` | Ngày sinh đầy đủ là định danh mạnh; tuổi theo năm đủ để chọn nội dung |
| `BR-CDC-03` | ❌ **NEVER thu họ tên đầy đủ.** Chỉ tên gọi / biệt danh | Tên đầy đủ + năm sinh + email phụ huynh là bộ định danh trẻ hoàn chỉnh |
| `BR-CDC-04` | Avatar chỉ chọn từ **bộ preset**. ❌ **NEVER upload ảnh chụp trẻ** | Ảnh khuôn mặt trẻ là dữ liệu sinh trắc. Không có ca dùng nào ở MVP biện minh được |
| `BR-CDC-05` | ❌ **NEVER PII trong `telemetry_events`** — chỉ `child_uuid` | Bảng telemetry lớn nhất, giữ lâu nhất, và là bảng dễ export nhầm nhất |
| `BR-CDC-06` | ❌ **NEVER gửi tên, `child_uuid`, hay tuổi chính xác của trẻ tới LLM provider** | Dữ liệu rời khỏi hạ tầng là rủi ro không định lượng được |
| `BR-CDC-07` | `consent_logs` **INSERT-only**. Rút đồng ý = thêm hàng | Sửa hàng cũ làm mất bằng chứng đã từng đồng ý |
| `BR-CDC-08` | ❌ **NEVER tracking script bên thứ ba** trên bề mặt trẻ và trang pháp lý | Trang giải thích quyền riêng tư mà tự nó theo dõi là mâu thuẫn không giải thích được |
| `BR-CDC-09` | ❌ **NEVER quảng cáo, nhắm mục tiêu, leaderboard công khai, hay cơ chế gây nghiện** | Luật Trẻ em cấm khai thác thương mại nhắm vào trẻ |
| `BR-CDC-10` | Xoá tài khoản → cascade xoá dữ liệu trẻ trong **30 ngày**; `telemetry_events` ẩn danh hoá | Xoá phải thực sự xảy ra, có thời hạn kiểm được |
| `BR-CDC-11` | ❌ **NEVER credential cho trẻ**, ❌ không endpoint đăng nhập trẻ | Tài khoản trẻ tạo ra nghĩa vụ xác thực tuổi không đáp ứng nổi |
| `BR-CDC-12` | Trẻ ❌ không rời được khu vực chơi mà không qua **Parent Gate** | Ngăn trẻ tự chạm vào thanh toán và cấu hình |
| `BR-CDC-13` | `content_reviewer` ❌ không truy cập được bất kỳ dữ liệu trẻ nào | Người soạn nội dung không có nhu cầu nghiệp vụ với dữ liệu trẻ |
| `BR-CDC-14` | Bề mặt admin ❌ không hiện telemetry / mastery / lịch sử chơi của **một trẻ cụ thể** | Vận hành không cần dữ liệu học tập của một đứa trẻ; phụ huynh cần |

## 7. Data

### 7.1 Danh sách đóng — `child_profiles`

| Field | Kiểu | Ràng buộc | Bắt buộc |
|---|---|---|---|
| `uuid` | uuid | Định danh đối ngoại duy nhất | ✅ |
| `user_id` | FK `users` | Chủ sở hữu | ✅ |
| `display_name` | varchar(40) | Tên gọi / biệt danh. ❌ không họ tên đầy đủ | ✅ |
| `birth_year` | smallint | `[năm hiện tại − 7, năm hiện tại − 2]` | ✅ |
| `age_band` | enum | `3-4` \| `4-5` \| `5-6` — suy ra, không nhập | tự sinh |
| `avatar_id` | varchar(24) | FK logic tới bộ preset. ❌ không path upload | ✅ |
| `relationship` | enum | `child` \| `student` \| `other` | ❌ tuỳ chọn |
| `current_curriculum_id` | FK | Chương trình đang theo | ❌ |
| `daily_play_cap_minutes` | smallint | Hạn mức giờ chơi | ✅ mặc định |
| `status` | enum | `active` \| `archived` \| `pending_deletion` | ✅ |
| `created_at` `updated_at` | timestamptz | | ✅ |

**❌ Cấm tuyệt đối, ở mọi bảng:** họ tên đầy đủ · ngày sinh đầy đủ · ảnh chụp · địa chỉ ·
trường học · lớp · số điện thoại · email của trẻ · dữ liệu sinh trắc (khuôn mặt, giọng nói,
vân tay) · định vị · danh bạ · nội dung tự do do trẻ nhập.

### 7.2 `consent_logs` — INSERT-only

| Field | Ghi chú |
|---|---|
| `user_id` | Người lớn cho đồng ý |
| `consent_type` | `terms` \| `privacy` \| `child_data` \| `child_data_withdrawn` |
| `policy_version` | Bản chính sách tại thời điểm đồng ý |
| `ip_address` `user_agent` `created_at` | Bằng chứng |

❌ Không `UPDATE`, ❌ không `DELETE`. Ép bằng quyền DB, không chỉ bằng quy ước.

### 7.3 `telemetry_events`

Được phép: `child_uuid` · `game_level_code` · `content_version` · `event_name` · `seq` ·
`occurred_at` · `payload` (số và enum).

❌ Không: `display_name` · `birth_year` · `user_id` · `email` · IP · toạ độ chạm thô ·
bất kỳ chuỗi tự do nào.

### 7.4 Vòng đời xoá

```
User yêu cầu xoá
  → users.status = 'deleted', child_profiles.status = 'pending_deletion'
  → đăng nhập bị chặn ngay
  → 30 ngày: hủy được (khôi phục toàn bộ)
  → sau 30 ngày, job hard-delete:
        DELETE child_profiles, mastery_state, play_sessions, child_session_summaries
        UPDATE telemetry_events SET child_uuid = NULL   (ẩn danh, giữ để phân tích tổng hợp)
        GIỮ audit_logs, consent_logs   (nghĩa vụ pháp lý — không chứa PII của trẻ)
```

## 8. API contract

| Route | Ràng buộc bổ sung |
|---|---|
| `POST /api/users/children` | 428 `CONSENT_REQUIRED` nếu chưa có `consent_logs` hợp lệ với `policy_version` hiện hành |
| `GET /api/users/data-export` | Trả JSON toàn bộ dữ liệu trẻ của caller. Rate limit 1 lần / 24h |
| `POST /api/users/account/delete` | Đặt `pending_deletion`, trả `{ purge_at }` |
| `POST /api/users/account/delete/cancel` | Chỉ trong 30 ngày |
| `POST /api/users/consent/withdraw` | INSERT hàng mới, không sửa hàng cũ |

| Mã lỗi | HTTP |
|---|---|
| `CONSENT_REQUIRED` | 428 |
| `CONSENT_VERSION_STALE` | 409 |
| `CHILD_FIELD_NOT_ALLOWED` | 400 |
| `EXPORT_RATE_LIMITED` | 429 |

## 9. Acceptance criteria

```gherkin
Scenario: BR-CDC-01 — field ngoài danh sách đóng bị từ chối
  Given user đã đăng nhập và đã cho đồng ý
  When POST /api/users/children với body chứa "full_name" và "school"
  Then hệ thống trả 400 CHILD_FIELD_NOT_ALLOWED
  And không tạo record nào

Scenario: BR-CDC-04 — không upload được ảnh làm avatar trẻ
  Given user đã đăng nhập
  When user cố đặt avatar_id bằng một path upload
  Then hệ thống trả 400
  And chỉ chấp nhận id nằm trong bộ preset

Scenario: BR-CDC-05 — telemetry không chứa PII
  Given một trẻ đã chơi xong một game level
  When đọc mọi hàng telemetry_events của phiên đó
  Then không hàng nào chứa display_name, birth_year, user_id, hay email

Scenario: BR-CDC-06 — prompt LLM không chứa dữ liệu trẻ
  Given tính năng tóm tắt báo cáo được gọi
  When kiểm payload gửi tới LLM provider
  Then payload không chứa child_uuid, display_name, hay birth_year
  And chỉ chứa số liệu tổng hợp và tên skill

Scenario: BR-CDC-07 — rút đồng ý không sửa hàng cũ
  Given user đã có 1 hàng consent_logs child_data
  When user rút đồng ý
  Then consent_logs có 2 hàng
  And hàng đầu tiên không đổi

Scenario: BR-CDC-10 — xoá thực sự xảy ra sau 30 ngày
  Given user yêu cầu xoá tài khoản vào ngày D
  When job purge chạy vào ngày D+31
  Then child_profiles, mastery_state, play_sessions của user đó bị xoá
  And telemetry_events của trẻ đó có child_uuid IS NULL
  And consent_logs và audit_logs còn nguyên

Scenario: BR-CDC-13 — content_reviewer không thấy dữ liệu trẻ
  Given manager có role content_reviewer
  When manager gọi bất kỳ route nào trả dữ liệu child profile
  Then hệ thống trả 403

Scenario: BR-CDC-08 — không có tracking bên thứ ba trên bề mặt trẻ
  Given trang /play/** và trang chính sách được render
  When kiểm mọi request mạng phát ra
  Then không request nào tới domain bên thứ ba ngoài CDN asset của chính hệ thống
```

## 10. Boundaries

**Always**
- Ghi `consent_logs` trước khi thu bất kỳ dữ liệu trẻ nào.
- Ép danh sách đóng ở Zod **và** ở schema DB.
- Ẩn danh telemetry khi xoá, không xoá cứng cả bảng.
- Parent Gate trên mọi lối rời khu vực chơi.

**Ask first**
- Thêm bất kỳ field nào vào `child_profiles`.
- Đổi thời hạn 30 ngày.
- Gửi bất kỳ dữ liệu nào liên quan tới trẻ ra ngoài hạ tầng.
- Mở thị trường ngoài Việt Nam.

**Never**
- Họ tên đầy đủ · ngày sinh đầy đủ · ảnh chụp trẻ · trường học · địa chỉ.
- PII trong telemetry hoặc trong prompt LLM.
- Tracking bên thứ ba trên bề mặt trẻ hoặc trang pháp lý.
- Quảng cáo, nhắm mục tiêu, leaderboard công khai, cơ chế gây nghiện.
- Credential cho trẻ.
- `UPDATE`/`DELETE` trên `consent_logs`.

## 11. Open questions

| # | Câu hỏi | Chặn gì | Chặn phase | Chủ |
|---|---|---|---|---|
| 1 | Ngân sách và người rà soát pháp lý cho ToS / Privacy / Chính sách trẻ em theo ND 13/2023 | Go-live | 🟡 go-live | cần chủ + hạn |
| 2 | Có cần đăng ký hồ sơ đánh giá tác động xử lý dữ liệu (DPIA) với Bộ Công an không? ND13 Điều 24 yêu cầu với dữ liệu nhạy cảm | Go-live | 🟡 go-live | cần chủ + hạn |
| 3 | Retention của `telemetry_events` đã ẩn danh — giữ vĩnh viễn hay cắt sau N năm? | Chi phí lưu trữ | 🟡 P5 | hoãn |
| 4 | Nếu mở thị trường ngoài VN thì COPPA hay GDPR-K trước? Hai chuẩn ràng buộc khác nhau | Roadmap P5 | 🟡 P5 | hoãn |
