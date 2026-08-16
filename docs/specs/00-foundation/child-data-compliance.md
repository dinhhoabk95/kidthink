---
spec: CHILD-DATA-COMPLIANCE
title: Tuân thủ dữ liệu trẻ em — Luật 91/2025, Nghị định 13/2023 và Luật Trẻ em
area: foundation
status: approved
mvp: true
phase: P0
reviewed: 2026-08-14

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

Thị trường vận hành: **Việt Nam**. Ràng buộc pháp lý: **Luật Bảo vệ dữ liệu cá nhân
91/2025/QH15** (hiệu lực 2026-01-01), **Nghị định 13/2023/NĐ-CP** và **Luật Trẻ em 2016**.
Luật 91 là căn cứ hiện hành; Nghị định 13 chỉ được áp dụng ở phần còn hiệu lực và không trái
luật. Trước go-live, người rà soát pháp lý phải xác nhận nghĩa vụ cụ thể và văn bản hướng dẫn
đang hiệu lực — đây là contract sản phẩm, không phải ý kiến pháp lý.

Căn cứ nghiên cứu chính: [Luật 91/2025/QH15](https://vanban.chinhphu.vn/?docid=214590&pageid=27160) ·
[Nghị định 13/2023/NĐ-CP](https://vanban.chinhphu.vn/default.aspx?docid=207759&pageid=27160) ·
[hướng dẫn của Chính phủ về dữ liệu cá nhân trẻ em](https://xaydungchinhsach.chinhphu.vn/quy-dinh-bao-ve-du-lieu-ca-nhan-cua-tre-em-nguoi-bi-mat-hoac-han-che-nang-luc-hanh-vi-dan-su-119250725165056743.htm).

Đây là **ràng buộc thiết kế, không phải checklist cuối**. Thu dữ liệu trẻ vượt nhu cầu là
thứ không rút lại được sau khi đã ghi — xoá bản ghi không xoá được bản backup, log, và bản
sao đã chảy sang bên thứ ba.

Spec này ép ràng buộc lên schema **trước** khi bảng được tạo.

> Không áp COPPA (Mỹ) hay GDPR-K (EU) ở MVP. Mở thị trường ngoài Việt Nam thì spec này phải
> được viết lại **trước**, không phải sau — xem mục 11.

## 2. Actors

| Actor | Vai trò ở đây |
|---|---|
| **User** (người lớn) | Chủ thể cho đồng ý. Là người duy nhất được thao tác dữ liệu trẻ |
| **Child Profile** | Chủ thể dữ liệu. Không có tài khoản, không tự thao tác |
| **Manager** | Xử lý dữ liệu trong phạm vi vận hành. `content_reviewer` không thấy dữ liệu trẻ |
| **Bên thứ ba** | LLM provider, S3, email. **Không bên nào nhận PII của trẻ** |

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
4. User tick đồng ý **tường minh** — không tick sẵn, không "tiếp tục nghĩa là đồng ý".
5. Hệ thống INSERT `consent_logs` `{user_id, consent_type:'child_data', action:'accepted',
   ip_address, user_agent, created_at}` sau khi xác nhận mốc yêu cầu vẫn chưa đổi.
6. Chỉ khi bước 5 thành công, form tạo child profile mới mở.

## 5. Alternative flows

| Nhánh | Hành vi |
|---|---|
| Nội dung child-data đổi và `super_admin` force | Cập nhật marker `child_data`. Chưa đồng ý sau marker → chặn tạo hồ sơ, bắt đầu phiên chơi mới và ghi telemetry/progress mới; cho phiên đang chạy hoàn tất, vẫn cho đọc, sửa đúng dữ liệu cũ, archive, export và xoá |
| User rút đồng ý | INSERT hàng `{consent_type:'child_data', action:'withdrawn'}`. Hồ sơ trẻ chuyển `archived`, dừng thu dữ liệu mới, giữ dữ liệu cũ 30 ngày rồi xoá |
| User yêu cầu xoá tài khoản | §7.4 |
| User yêu cầu bản sao dữ liệu | Export JSON trong 30 ngày |

## 6. Business rules

| ID | Rule | Vì sao |
|---|---|---|
| `BR-CDC-01` | `child_profiles` chỉ chứa trường ở **danh sách đóng** §7.1. Thêm trường = sửa spec này trước | Danh sách mở sẽ đầy dần bằng những field "để sau này dùng" |
| `BR-CDC-02` | **NEVER thu ngày sinh chính xác.** Chỉ `birth_year` hoặc `age_band` | Ngày sinh đầy đủ là định danh mạnh; tuổi theo năm đủ để chọn nội dung |
| `BR-CDC-03` | **NEVER thu họ tên đầy đủ.** Chỉ tên gọi / biệt danh | Tên đầy đủ + năm sinh + email người giám hộ là bộ định danh trẻ hoàn chỉnh |
| `BR-CDC-04` | Avatar chỉ chọn từ **bộ preset**. **NEVER upload ảnh chụp trẻ** | Ảnh khuôn mặt trẻ là dữ liệu sinh trắc. Không có ca dùng nào ở MVP biện minh được |
| `BR-CDC-05` | **NEVER PII trong `telemetry_events`** — chỉ `child_uuid` | Bảng telemetry lớn nhất, giữ lâu nhất, và là bảng dễ export nhầm nhất |
| `BR-CDC-06` | **NEVER gửi tên, `child_uuid`, hay tuổi chính xác của trẻ tới LLM provider** | Dữ liệu rời khỏi hạ tầng là rủi ro không định lượng được |
| `BR-CDC-07` | `consent_logs` **INSERT-only**. Đồng ý và rút đồng ý là các hàng `action` mới; cấm sửa hàng cũ | Sửa hàng cũ làm mất bằng chứng đã từng đồng ý |
| `BR-CDC-08` | **NEVER tracking script bên thứ ba** trên bề mặt trẻ và trang pháp lý | Trang giải thích quyền riêng tư mà tự nó theo dõi là mâu thuẫn không giải thích được |
| `BR-CDC-09` | **NEVER quảng cáo, nhắm mục tiêu, leaderboard công khai, hay cơ chế gây nghiện** | Luật Trẻ em cấm khai thác thương mại nhắm vào trẻ |
| `BR-CDC-10` | Xoá tài khoản → cascade xoá dữ liệu trẻ trong **30 ngày**; `telemetry_events` ẩn danh hoá | Xoá phải thực sự xảy ra, có thời hạn kiểm được |
| `BR-CDC-11` | **NEVER credential cho trẻ**, không endpoint đăng nhập trẻ | Tài khoản trẻ tạo ra nghĩa vụ xác thực tuổi không đáp ứng nổi |
| `BR-CDC-12` | Trẻ không rời được khu vực chơi mà không qua **Parent Gate** | Ngăn trẻ tự chạm vào thanh toán và cấu hình |
| `BR-CDC-13` | `content_reviewer` không truy cập được bất kỳ dữ liệu trẻ nào | Người soạn nội dung không có nhu cầu nghiệp vụ với dữ liệu trẻ |
| `BR-CDC-14` | Bề mặt admin không hiện telemetry / mastery / lịch sử chơi của **một trẻ cụ thể** | Vận hành không cần dữ liệu học tập của một đứa trẻ; người giám hộ cần |

## 7. Data

### 7.1 Danh sách đóng — `child_profiles`

| Field | Kiểu | Ràng buộc | Bắt buộc |
|---|---|---|---|
| `uuid` | uuid | Định danh đối ngoại duy nhất | Có |
| `user_id` | FK `users` | Chủ sở hữu | Có |
| `display_name` | varchar(40) | Tên gọi / biệt danh. Không họ tên đầy đủ | Có |
| `birth_year` | smallint | `[năm hiện tại − 7, năm hiện tại − 2]` | Có |
| — | — | `age_band` **không phải cột** — suy từ `birth_year` lúc đọc (D-AA) | — |
| `avatar_id` | varchar(24) | FK logic tới bộ preset. Không path upload | Có |
| `relationship` | enum | `child` \| `student` \| `other` | Không |
| `current_curriculum_id` | bigint | Chương trình đang theo — FK `curricula.entity_id` (**neo dòng dõi**, bất biến qua version), dùng cho hiển thị và ghi danh lần sau theo quyết định `D-LV` (2026-08-11). Mọi truy vấn tiến độ học tập thực tế đọc qua `curriculum_enrollments` (ghim version cụ thể `curricula.id`). Luôn theo bản `published` mới nhất qua `WHERE entity_id = ? AND status='published'`, cùng cơ chế với quy tắc `BR-DM-13` của [`data-model-overview.md`](../01-platform/data-model-overview.md) và quy tắc `BR-SCT-06` của [`schema-content-taxonomy.md`](../01-platform/schema-content-taxonomy.md) (quyết định D-AE, sửa lại 2026-08-07) | Không |
| `daily_play_cap_minutes` | smallint | Hạn mức giờ chơi | Có, mặc định |
| `status` | enum | `active` \| `archived` \| `pending_deletion` | Có |
| `created_at` `updated_at` | timestamptz | | Có |

**Cấm tuyệt đối, ở mọi bảng:** họ tên đầy đủ · ngày sinh đầy đủ · ảnh chụp · địa chỉ ·
trường học · lớp · số điện thoại · email của trẻ · dữ liệu sinh trắc (khuôn mặt, giọng nói,
vân tay) · định vị · danh bạ · nội dung tự do do trẻ nhập.

### 7.2 `consent_logs` — INSERT-only

| Field | Ghi chú |
|---|---|
| `user_id` | Người lớn cho đồng ý |
| `consent_type` | `terms` \| `privacy` \| `child_data` |
| `action` | `accepted` \| `withdrawn` |
| `ip_address` `user_agent` `created_at` | Bằng chứng |

Không `policy_version`; hệ thống chỉ có một bản tài liệu hiện hành trong code. Consent hợp lệ
khi action mới nhất là `accepted` và thời điểm nhận không trước
`consent_requirements.reconsent_required_at` của loại tương ứng. Không `UPDATE`, không
`DELETE` log sau cutover; ép bằng quyền DB, không chỉ bằng quy ước. Schema canonical ở
[`schema-identity-billing.md`](../01-platform/schema-identity-billing.md) mục 7.4.

### 7.3 `telemetry_events`

Được phép: `child_uuid` · `game_level_id` · `content_version` · `event_name` · `seq` ·
`occurred_at_ms` (int, tương đối `started_at`) · `ingested_at` · `payload` (số và enum).

Không: `display_name` · `birth_year` · `user_id` · `email` · IP · toạ độ chạm thô ·
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
| `POST /api/users/children` | 428 `CONSENT_REQUIRED` nếu action mới nhất không phải `accepted` sau marker `child_data` hiện hành |
| `GET /api/users/data-export` | Trả JSON toàn bộ dữ liệu trẻ của caller. Rate limit 1 lần / 24h |
| `POST /api/users/account/delete` | Đặt `pending_deletion`, trả `{ purge_at }` |
| `POST /api/users/account/delete/cancel` | Chỉ trong 30 ngày |
| `POST /api/users/consents/withdraw` | INSERT action `withdrawn`, không sửa hàng cũ |

| Mã lỗi | HTTP |
|---|---|
| `CONSENT_REQUIRED` | 428 |
| `CONSENT_REQUIREMENT_CHANGED` | 409 |
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

Scenario: force child-data dừng thu mới nhưng không khoá quyền của user
  Given super_admin đã force child_data sau lần user đồng ý gần nhất
  When user bắt đầu phiên chơi mới hoặc tạo hồ sơ trẻ
  Then trả 428 CONSENT_REQUIRED
  But user vẫn đọc, sửa đúng, archive, export và yêu cầu xoá dữ liệu cũ được

Scenario: phiên đang chạy được hoàn tất khi marker đổi
  Given một phiên chơi đã bắt đầu trước lúc super_admin force child_data
  When phiên gửi kết quả kết thúc hợp lệ
  Then hệ thống nhận kết quả của phiên đó
  And lần bắt đầu phiên kế tiếp trả 428 CONSENT_REQUIRED

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
| 1 | Ngân sách và người rà soát pháp lý cho ToS / Privacy / Chính sách trẻ em theo Luật 91/2025/QH15, Nghị định 13/2023 và văn bản hướng dẫn hiện hành | Go-live | Hoãn, chặn go-live | người quyết |
| 2 | Hồ sơ đánh giá tác động xử lý dữ liệu và thủ tục với cơ quan chuyên trách phải làm theo căn cứ, biểu mẫu và thời hạn nào đang hiệu lực tại ngày go-live? | Go-live | Hoãn, chặn go-live | người quyết |
| 3 | Retention của `telemetry_events` đã ẩn danh — giữ vĩnh viễn hay cắt sau N năm? | Chi phí lưu trữ | Hoãn, chặn phase P5 | hoãn |
| ~~4~~ | ~~Nếu mở thị trường ngoài VN thì COPPA hay GDPR-K trước?~~ **Đóng 2026-08-11 (`D-NM`, triển khai D11)**: roadmap hiện hành chỉ vận hành tại Việt Nam, không chọn jurisdiction giả. Mở thị trường là chương trình scope mới và phải viết lại spec này trước khi lập task. | — | Đã đóng | D-NM |
