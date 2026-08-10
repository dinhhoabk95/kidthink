# Checklist — Task #51: P2.9 — Cờ tính năng, xuất dữ liệu và quản lý thông báo

> Kế hoạch: [`51-p2-9-flags-data-admin-plan.md`](51-p2-9-flags-data-admin-plan.md).
> Ba công cụ vận hành cầm trong tay khi có sự cố — ít dùng, nhưng lúc cần thì cần gấp.
> Tuyệt đối: cờ **không** thay entitlement (`D-KM`) · xuất dữ liệu **không** chứa PII trẻ.
>
> ```
> export PATH=/Users/macbook/.nvm/versions/node/v24.15.0/bin:$PATH
> ```

## Preflight

- [ ] **P2.8 đã đóng** — hàng đợi duyệt dùng lại được cho template thông báo.
- [ ] SES đã có production access; SNS topic bounce/complaint đã cấu hình (`D-CE`).
- [ ] Human approve kế hoạch và năm quyết định D-KM · D-KN · D-KO · D-KP · D-KQ.
- [ ] Đối chiếu `BR-FLG-*` `BR-FFA-*` `BR-EXP-*` `BR-NTA-*` với [`business-rules.md`](../specs/00-foundation/business-rules.md).
- [ ] Tạo nhánh riêng.

---

### Task 1 — Dịch vụ cờ

- [ ] Bảng `feature_flags` đủ cột §7; `expires_at` **không null**.
- [ ] Năm cờ MVP khai đúng mặc định: `ai_content_pipeline` off · `payment_soft_unlock` on · `weekly_progress_email` off · `studio_publish` on · `guest_play` on.
- [ ] `FlagKey` là union sinh từ khai báo; key lạ **không compile**.
- [ ] `isEnabled` đọc qua cache TTL **30 giây**.
- [ ] `D-KM` ca âm: tắt **cả** Valkey lẫn Postgres → trả `false`, **không ném**.
- [ ] Cờ không có trong DB → trả mặc định code + log cảnh báo.
- [ ] `D-KM` cổng: `isEnabled` không xuất hiện trong module gating quyền.
- [ ] `D-KM` cổng: `isEnabled` không xuất hiện trong module entitlement.
- [ ] `D-KM` cổng: `isEnabled` không xuất hiện trong module tuân thủ dữ liệu trẻ.
- [ ] `D-KM` ca âm: thêm lời gọi vào đường quyết định quyền → cổng **đỏ**.
- [ ] `BR-FLG-06` ca âm: không cờ nào gate consent · danh sách đóng field trẻ · ràng buộc telemetry.
- [ ] `BR-FLG-05` cổng: không cờ nào đọc trong đường tính điểm hoặc độ khó của phiên đang chạy.
- [ ] `D-KO` ca âm sticky: cùng `user_id` gọi 100 lần → kết quả **không đổi**.
- [ ] Hàm hash có test khoá giá trị.

### Task 2 — Màn hình cờ

- [ ] `GET .../feature-flags` trả danh sách **hợp nhất code + DB**.
- [ ] `content_reviewer` → **403**.
- [ ] Cột §7 đủ, gồm **mặc định an toàn** và **ngày hết hạn**.
- [ ] `BR-FFA-01` ca âm: `reason` rỗng → **422**, cờ **không đổi**.
- [ ] `BR-FFA-01` ca dương: audit có `feature_flag_changed` kèm **before, after, reason**.
- [ ] `D-KN` ca âm: hàng DB không có khai báo code → hiện **mồ côi**, gợi ý xoá, **không** tự xoá.
- [ ] Cờ trong code chưa có hàng DB → hiện với `default_value`.
- [ ] `BR-FFA-02`: cờ quá hạn hiện **đỏ** + số ngày quá hạn.
- [ ] Cờ quá hạn **30 ngày** → alert **P1**; thêm quy tắc vào `alerts.yml`.
- [ ] Ca dương tốc độ: tắt cờ → **≤30 giây** ứng dụng phản ánh.

### Task 3 — Xuất dữ liệu

- [ ] Sáu loại §7.1 và **chỉ** sáu.
- [ ] `D-KP` ca âm: `kind` ngoài danh sách → **404**, **không** mở kết nối DB.
- [ ] Mỗi loại có truy vấn riêng; **không** truy vấn tổng quát.
- [ ] Không `switch` nào có nhánh `default` chạy SQL.
- [ ] `curriculum_health` khai `pending_source: P3`; trả trạng thái chờ nguồn, **không** file rỗng.
- [ ] `BR-EXP-02` ca âm: mọi loại → không file nào chứa `display_name` · `birth_year` · `child_uuid`.
- [ ] `D-KP` cổng: không đường xuất nào chạm `child_profiles` · `mastery_state` · `telemetry_events`.
- [ ] `BR-EXP-08` ca âm: `subscriptions` → email **rút gọn**.
- [ ] `BR-EXP-08` ca âm: `revenue` → email **đầy đủ**.
- [ ] `BR-EXP-05` ca âm: khoảng cho 500.000 hàng → **422** + gợi ý thu hẹp.
- [ ] `BR-EXP-07` ca âm: lần xuất thứ **6** trong ngày → **429**.
- [ ] `BR-EXP-04` ca âm: mở URL sau **20 phút** → từ chối.
- [ ] `BR-EXP-03`: audit `data_exported` kèm `kind` · khoảng · `row_count` · `reason`.
- [ ] Thiếu `reason` → **422**.
- [ ] `BR-EXP-06`: `content_reviewer` → **403**.
- [ ] CSV UTF-8 **có BOM**; ngày theo ICT; số tiền **không** định dạng.
- [ ] Xuất lớn chạy job nền, thông báo khi xong.

### Task 4 — Nhật ký thông báo

- [ ] `GET .../notifications` với `recipient` · `code` · `status` · `from` · `to`; trần **100**.
- [ ] `content_reviewer` → **403**.
- [ ] Nhật ký §7.1 đủ cột gồm `provider_message_id` và lỗi.
- [ ] `D-KQ`: webhook SNS nhận delivery/bounce/complaint.
- [ ] Webhook **xác thực chữ ký SNS** trước khi tin.
- [ ] Webhook **idempotent** theo `provider_message_id`; nhận trùng → một hàng.
- [ ] Địa chỉ `bouncing` → cảnh báo, **không** cho gửi lại loại định kỳ.
- [ ] `BR-NTA-01` ca âm: gửi lại → hàng **thứ hai**, hàng đầu **không đổi**.
- [ ] `BR-NTA-04` ca âm: email đặt lại mật khẩu → token **bị che**.
- [ ] `BR-NTA-02` cổng: không route nào gửi tới nhiều người nhận cùng lúc.
- [ ] Người nhận đã xoá tài khoản → gửi lại **409**.
- [ ] Gửi lại **chỉ** cho loại giao dịch.

### Task 5 — Soạn template thông báo

- [ ] Template có `code` · `subject_vi` · `body_vi` · biến khả dụng · `content_version` · `status`.
- [ ] `BR-NTA-03` ca âm: sửa template → trạng thái **`draft`**.
- [ ] Ca âm: email mới **vẫn dùng bản `published`** cho tới khi bản mới publish.
- [ ] `D-KQ`: template xuất hiện trong hàng đợi `/studio/review` của P2.8.
- [ ] **Không** dựng quy trình duyệt thứ hai.
- [ ] `BR-NTA-07` ca âm: thiếu biến bắt buộc → **422** nêu rõ biến nào.
- [ ] Rich text dùng **cùng** allow-list và bộ lọc hai thời điểm của `D-KL`.
- [ ] `BR-NTA-06` cổng: không template nào có người nhận là trẻ.
- [ ] Preview §7.3: dữ liệu mẫu, desktop và mobile.
- [ ] Template lỗi cú pháp → chặn lưu, hiện lỗi.

## Cổng dừng

- [ ] Tắt một cờ → **≤30 giây** ứng dụng đổi hành vi.
- [ ] Tắt cả Valkey lẫn Postgres → `isEnabled` trả mặc định an toàn, không ném.
- [ ] Không lời gọi `isEnabled` nào trên đường quyết định quyền hay tuân thủ.
- [ ] Xuất đủ năm loại có nguồn; không file nào chứa PII trẻ.
- [ ] `kind` lạ → 404 trước khi chạm DB; lần thứ 6 trong ngày → 429.
- [ ] Webhook SNS ghi đúng trạng thái; nhận trùng không sinh hàng trùng.
- [ ] Sửa template → bản mới `draft`, email vẫn dùng bản published cũ.
- [ ] `content_reviewer` bị **403** ở cả bốn bề mặt.
- [ ] `pnpm check && pnpm test && pnpm test:e2e && pnpm lint:specs && pnpm check:progress` xanh.

---

## Task 6 — Evidence, promote và nợ chuyển tiếp

- [ ] Mỗi `BR-FLG-*` có test tham chiếu mã rule.
- [ ] Mỗi `BR-FFA-*` có test tham chiếu mã rule.
- [ ] Mỗi `BR-EXP-*` có test tham chiếu mã rule.
- [ ] Mỗi `BR-NTA-*` có test tham chiếu mã rule.
- [ ] [`feature-flag-service.md`](../specs/01-platform/feature-flag-service.md) → `implemented`.
- [ ] [`feature-flags.md`](../specs/06-admin/feature-flags.md) → `implemented`.
- [ ] [`data-export.md`](../specs/06-admin/data-export.md) → `implemented`.
- [ ] [`notification-admin.md`](../specs/06-admin/notification-admin.md) → `implemented`.
- [ ] Nợ sang **P2.10**: link từ thẻ cờ sang màn hình audit.
- [ ] Nợ sang **P3**: bật loại xuất `curriculum_health`.
- [ ] Tick **P2.9** ở [`14-implementation-sequence-todo.md`](14-implementation-sequence-todo.md) khi `check:progress` tự xanh.

## Câu hỏi mở chuyển tiếp

- [ ] **Cờ `percentage` sticky** — đóng theo `D-KO`: **có**, hash `user_id`.
- [ ] **Lịch sử đổi cờ trên màn hình** — thẻ cờ hiện lần đổi gần nhất; lịch sử đầy đủ ở [`audit-log-viewer.md`](../specs/06-admin/audit-log-viewer.md) (P2.10).
- [ ] **Xuất định kỳ gửi email** — **không** ở MVP: thêm bề mặt rò rỉ mà không có nhu cầu chặn; hoãn P4.
- [ ] **Provider bounce/delivery** — đã đóng từ `D-CE`: SES + SNS webhook. Không mở lại.
