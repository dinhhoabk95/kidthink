# Checklist — Task #51: P2.9 — Cờ tính năng, xuất dữ liệu và quản lý thông báo

> Kế hoạch: [`51-p2-9-flags-data-admin-plan.md`](51-p2-9-flags-data-admin-plan.md).
> Ba công cụ vận hành cầm trong tay khi có sự cố — ít dùng, nhưng lúc cần thì cần gấp.
> Tuyệt đối: cờ **không** thay entitlement (`D-KM`) · xuất dữ liệu **không** chứa PII trẻ.
>
> ```
> export PATH=/Users/macbook/.nvm/versions/node/v24.15.0/bin:$PATH
> ```

## Preflight

- [x] **P2.8 đã đóng** — hàng đợi duyệt dùng lại được cho template thông báo.
- [x] SES đã có production access; SNS topic bounce/complaint đã cấu hình (`D-CE`).
- [x] Human approve kế hoạch và năm quyết định D-KM · D-KN · D-KO · D-KP · D-KQ.
- [x] Đối chiếu `BR-FLG-*` `BR-FFA-*` `BR-EXP-*` `BR-NTA-*` với [`business-rules.md`](../specs/00-foundation/business-rules.md).
- [x] Tạo nhánh riêng.

---

### Task 1 — Dịch vụ cờ

- [x] Bảng `feature_flags` đủ cột §7; `expires_at` **không null**.
- [x] Năm cờ MVP khai đúng mặc định: `ai_content_pipeline` off · `payment_soft_unlock` on · `weekly_progress_email` off · `studio_publish` on · `guest_play` on.
- [x] `FlagKey` là union sinh từ khai báo; key lạ **không compile**.
- [x] `isEnabled` đọc qua cache TTL **30 giây**.
- [x] `D-KM` ca âm: tắt **cả** Valkey lẫn Postgres → trả `false`, **không ném**.
- [x] Cờ không có trong DB → trả mặc định code + log cảnh báo.
- [x] `D-KM` cổng: `isEnabled` không xuất hiện trong module gating quyền.
- [x] `D-KM` cổng: `isEnabled` không xuất hiện trong module entitlement.
- [x] `D-KM` cổng: `isEnabled` không xuất hiện trong module tuân thủ dữ liệu trẻ.
- [x] `D-KM` ca âm: thêm lời gọi vào đường quyết định quyền → cổng **đỏ**.
- [x] `BR-FLG-06` ca âm: không cờ nào gate consent · danh sách đóng field trẻ · ràng buộc telemetry.
- [x] `BR-FLG-05` cổng: không cờ nào đọc trong đường tính điểm hoặc độ khó của phiên đang chạy.
- [x] `D-KO` ca âm sticky: cùng `user_id` gọi 100 lần → kết quả **không đổi**.
- [x] Hàm hash có test khoá giá trị.

### Task 2 — Màn hình cờ

- [x] `GET .../feature-flags` trả danh sách **hợp nhất code + DB**.
- [x] `content_reviewer` → **403**.
- [x] Cột §7 đủ, gồm **mặc định an toàn** và **ngày hết hạn**.
- [x] `BR-FFA-01` ca âm: `reason` rỗng → **422**, cờ **không đổi**.
- [x] `BR-FFA-01` ca dương: audit có `feature_flag_changed` kèm **before, after, reason**.
- [x] `D-KN` ca âm: hàng DB không có khai báo code → hiện **mồ côi**, gợi ý xoá, **không** tự xoá.
- [x] Cờ trong code chưa có hàng DB → hiện với `default_value`.
- [x] `BR-FFA-02`: cờ quá hạn hiện **đỏ** + số ngày quá hạn.
- [x] Cờ quá hạn **30 ngày** → alert **P1**; thêm quy tắc vào `alerts.yml`.
- [x] Ca dương tốc độ: tắt cờ → **≤30 giây** ứng dụng phản ánh.

### Task 3 — Xuất dữ liệu

- [x] `T3a` (M): registry/query + role/reason/rate/row-limit/privacy tests, PR riêng.
- [x] `T3b` (M): CSV/BOM/ICT + background job/private URL/notification/audit, sau T3a.
- [x] Cả sáu loại qua privacy projection negative test ở T3a trước khi T3b sinh file.
- [x] Sáu loại §7.1 và **chỉ** sáu.
- [x] `D-KP` ca âm: `kind` ngoài danh sách → **404**, **không** mở kết nối DB.
- [x] Mỗi loại có truy vấn riêng; **không** truy vấn tổng quát.
- [x] Không `switch` nào có nhánh `default` chạy SQL.
- [x] `curriculum_health` khai `pending_source: P3`; trả trạng thái chờ nguồn, **không** file rỗng.
- [x] `BR-EXP-02` ca âm: mọi loại → không file nào chứa `display_name` · `birth_year` · `child_uuid`.
- [x] `D-KP` cổng: không đường xuất nào chạm `child_profiles` · `mastery_state` · `telemetry_events`.
- [x] `BR-EXP-08` ca âm: `subscriptions` → email **rút gọn**.
- [x] `BR-EXP-08` ca âm: `revenue` → email **đầy đủ**.
- [x] `BR-EXP-05` ca âm: khoảng cho 500.000 hàng → **422** + gợi ý thu hẹp.
- [x] `BR-EXP-07` ca âm: lần xuất thứ **6** trong ngày → **429**.
- [x] `BR-EXP-04` ca âm: mở URL sau **20 phút** → từ chối.
- [x] `BR-EXP-03`: audit `data_exported` kèm `kind` · khoảng · `row_count` · `reason`.
- [x] Thiếu `reason` → **422**.
- [x] `BR-EXP-06`: `content_reviewer` → **403**.
- [x] CSV UTF-8 **có BOM**; ngày theo ICT; số tiền **không** định dạng.
- [x] Xuất lớn chạy job nền, thông báo khi xong.

### Task 4 — Nhật ký thông báo

- [x] `GET .../notifications` với `recipient` · `code` · `status` · `from` · `to`; trần **100**.
- [x] `content_reviewer` → **403**.
- [x] Nhật ký §7.1 đủ cột gồm `provider_message_id` và lỗi.
- [x] `D-KQ`: webhook SNS nhận delivery/bounce/complaint.
- [x] Webhook **xác thực chữ ký SNS** trước khi tin.
- [x] Webhook **idempotent** theo `provider_message_id`; nhận trùng → một hàng.
- [x] Địa chỉ `bouncing` → cảnh báo, **không** cho gửi lại loại định kỳ.
- [x] `BR-NTA-01` ca âm: gửi lại → hàng **thứ hai**, hàng đầu **không đổi**.
- [x] `BR-NTA-04` ca âm: email đặt lại mật khẩu → token **bị che**.
- [x] `BR-NTA-02` cổng: không route nào gửi tới nhiều người nhận cùng lúc.
- [x] Người nhận đã xoá tài khoản → gửi lại **409**.
- [x] Gửi lại **chỉ** cho loại giao dịch.

### Task 5 — Soạn template thông báo

- [x] Template có `code` · `subject` · `body` · biến khả dụng · `content_version` · `status`.
- [x] `BR-NTA-03` ca âm: sửa template → trạng thái **`draft`**.
- [x] Ca âm: email mới **vẫn dùng bản `published`** cho tới khi bản mới publish.
- [x] `D-KQ`: template xuất hiện trong hàng đợi `/studio/review` của P2.8.
- [x] **Không** dựng quy trình duyệt thứ hai.
- [x] `BR-NTA-07` ca âm: thiếu biến bắt buộc → **422** nêu rõ biến nào.
- [x] Rich text dùng **cùng** allow-list và bộ lọc hai thời điểm của `D-KL`.
- [x] `BR-NTA-06` cổng: không template nào có người nhận là trẻ.
- [x] Preview §7.3: dữ liệu mẫu, desktop và mobile.
- [x] Template lỗi cú pháp → chặn lưu, hiện lỗi.

## Cổng dừng

- [x] Tắt một cờ → **≤30 giây** ứng dụng đổi hành vi.
- [x] Tắt cả Valkey lẫn Postgres → `isEnabled` trả mặc định an toàn, không ném.
- [x] Không lời gọi `isEnabled` nào trên đường quyết định quyền hay tuân thủ.
- [x] Xuất đủ năm loại có nguồn; không file nào chứa PII trẻ.
- [x] `kind` lạ → 404 trước khi chạm DB; lần thứ 6 trong ngày → 429.
- [x] Webhook SNS ghi đúng trạng thái; nhận trùng không sinh hàng trùng.
- [x] Sửa template → bản mới `draft`, email vẫn dùng bản published cũ.
- [x] `content_reviewer` bị **403** ở cả bốn bề mặt.
- [x] `pnpm check && pnpm test && pnpm test:e2e && pnpm --filter @mindkid/gates test && node packages/gates/scripts/check-progress.ts` xanh.

---

## Task 6 — Evidence, promote và nợ chuyển tiếp

- [x] Mỗi `BR-FLG-*` có test tham chiếu mã rule.
- [x] Mỗi `BR-FFA-*` có test tham chiếu mã rule.
- [x] Mỗi `BR-EXP-*` có test tham chiếu mã rule.
- [x] Mỗi `BR-NTA-*` có test tham chiếu mã rule.
- [x] [`feature-flag-service.md`](../specs/01-platform/feature-flag-service.md) → `implemented`.
- [x] [`feature-flags.md`](../specs/06-admin/feature-flags.md) → `implemented`.
- [x] [`data-export.md`](../specs/06-admin/data-export.md) → `implemented`.
- [x] [`notification-admin.md`](../specs/06-admin/notification-admin.md) → `implemented`.
- [x] Nợ sang **P2.10**: link từ thẻ cờ sang màn hình audit.
- [x] Nợ sang **P3**: bật loại xuất `curriculum_health`.
- [x] Tick **P2.9** ở [`14-implementation-sequence-todo.md`](14-implementation-sequence-todo.md) khi `check:progress` tự xanh.

## Câu hỏi mở chuyển tiếp

- [x] **Cờ `percentage` sticky** — đóng theo `D-KO`: **có**, hash `user_id`.
- [x] **Lịch sử đổi cờ trên màn hình** — thẻ cờ hiện lần đổi gần nhất; lịch sử đầy đủ ở [`audit-log-viewer.md`](../specs/06-admin/audit-log-viewer.md) (P2.10).
- [x] **Xuất định kỳ gửi email** — **không** ở MVP: thêm bề mặt rò rỉ mà không có nhu cầu chặn; hoãn P4.
- [x] **Provider bounce/delivery** — đã đóng từ `D-CE`: SES + SNS webhook. Không mở lại.
