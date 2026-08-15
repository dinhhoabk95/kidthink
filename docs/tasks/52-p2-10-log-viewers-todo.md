# Checklist — Task #52: P2.10 — Nhật ký: audit, lỗi và trạng thái hệ thống

> Kế hoạch: [`52-p2-10-log-viewers-plan.md`](52-p2-10-log-viewers-plan.md).
> P0.11 đã **ghi** audit; đây là lần đầu có người **đọc** được.
> Tuyệt đối: audit không sửa được (`D-KR`) · "không biết" **không bao giờ** hiện xanh (`D-KT`).
>
> ```
> export PATH=/Users/macbook/.nvm/versions/node/v24.15.0/bin:$PATH
> ```

## Preflight

- [x] **P0.11 và P1.16 đã đóng** — audit ghi đủ, redactor PII `D-IS` chạy được.
- [x] **P2.1…P2.9 đã đóng** — có dữ liệu thật để ba màn hình có ý nghĩa.
- [x] Human approve kế hoạch và năm quyết định D-KR · D-KS · D-KT · D-KU · D-KV.
- [x] Đối chiếu `BR-ALV-*` `BR-ELV-*` `BR-SYS-*` với [`business-rules.md`](../specs/00-foundation/business-rules.md).
- [x] Tạo nhánh riêng.

---

### Task 1 — Màn hình audit

- [x] `D-KR`: migration thu hồi `UPDATE` và `DELETE` trên `audit_logs` khỏi role ứng dụng.
- [x] `D-KR` ca âm: `UPDATE audit_logs …` bằng kết nối ứng dụng → **bị từ chối**.
- [x] `BR-ALV-01` cổng lớp hai: không route nào `PATCH` hay `DELETE` `audit_logs`.
- [x] `GET .../audit-logs` cần `super_admin`; `content_reviewer` → **403**.
- [x] Bộ lọc §7.1 đủ, gồm `action` multi-select từ **28** hành động.
- [x] `q` tìm trong `reason`, dùng lại mẫu thoát ký tự đại diện của `D-JC`.
- [x] Ca âm: `q = "%"` không quét toàn bảng.
- [x] `BR-ALV-03` ca âm: `limit = 5000` → **≤200** hàng.
- [x] Khoảng thời gian > **90 ngày** → **422**.
- [x] `BR-ALV-04` ca âm: chi tiết hiện **danh sách field đã đổi**, **không** JSON thô.
- [x] `before`/`after` lớn → diff rút gọn + nút xem đầy đủ.
- [x] Cột §7.2 đủ: thời gian **ICT** · actor · action **nhãn tiếng Việt** · entity · tóm tắt · IP.
- [x] Chi tiết §7.3 có `reason` · IP · user agent · `request_id`.
- [x] `BR-ALV-06` ca dương: export CSV (trần **10.000**) → audit có hàng `data_exported`.
- [x] Không có kết quả → nói rõ **bộ lọc nào đang áp**.
- [x] `BR-ALV-07` ca âm: response không chứa PII trẻ · mật khẩu · token.

### Task 2 — Thu lỗi client

- [x] Bảng `error_log` đủ cột §7.1; `user_id` nullable; **không** có `child_uuid`.
- [x] `POST /api/guest/client-errors` nhận `{ code, message, fingerprint, context }`.
- [x] `D-KS`: tỉ lệ sampling khai **một chỗ** trong config, gửi xuống client.
- [x] Tỉ lệ đúng §7.3: asset **10%** · engine **100%** · mạng **5%** · chưa phân loại **50%**.
- [x] `D-KS` ca âm: 1000 lỗi tải asset → khoảng **100** hàng ghi.
- [x] `BR-ELV-05` ca âm: 100 báo cáo/phút/IP → phần vượt **429**; trần **10/phút/IP**.
- [x] `BR-ELV-03` ca âm: lỗi kèm `display_name` của trẻ → `error_log` **không** chứa field đó.
- [x] Dùng **chính** redactor `D-IS`; **không** viết bản thứ hai.
- [x] `context` strip theo allow-list: route · phiên bản app · loại thiết bị.
- [x] Lỗi server ghi cùng bảng với `source = 'server'`, cùng scheme `fingerprint`.
- [x] `D-KU`: mọi hàng mang `request_id` khớp log có cấu trúc.

### Task 3 — Màn hình lỗi

- [x] `GET .../error-logs` trả **nhóm**, không hàng lẻ; trần **100**; `super_admin` duy nhất.
- [x] `BR-ELV-01` ca âm: 500 lỗi cùng `fingerprint` → **một** nhóm, số lần 500.
- [x] `fingerprint` = code + route + stack rút gọn; hàm sinh có test khoá giá trị.
- [x] `BR-ELV-02` ca âm: lỗi từ 3 user → hiện **3 người ảnh hưởng**, tách bạch số lần.
- [x] Nhóm §7.2 đủ: lần đầu · lần cuối · số lần · số người · trạng thái · ghi chú.
- [x] `BR-ELV-07` ca âm: đánh dấu `resolved` → nhóm rời bộ lọc mặc định.
- [x] `BR-ELV-07` ca âm ngược: lỗi mới cùng `fingerprint` → nhóm **mở lại**.
- [x] Lỗi từ client lỗi thời gắn nhãn phiên bản, **không** phát alert.
- [x] `D-KU`: từ nhóm lỗi mở được hàng audit cùng `request_id`.

### Task 4 — Trạng thái hệ thống

- [x] `GET .../system/status` trả bốn nhóm §7 kèm `as_of`; `Cache-Control: no-store`.
- [x] `content_reviewer` → **403**.
- [x] `D-KT`: mọi mục dùng kiểu `"ok" | "unknown" | "bad"`.
- [x] `D-KT` cổng: mục khai kiểu `boolean` → **đỏ**.
- [x] `BR-SYS-01` ca âm: mất số liệu queue → nhóm job **"không xác định"**, **không** hiện ổn.
- [x] Nhóm Dịch vụ: PostgreSQL · Valkey · Queue — trạng thái + độ trễ.
- [x] Nhóm Job: backlog `waiting` · `failed` 24h · job cũ nhất · lần chạy cuối **mỗi** job định kỳ.
- [x] Nhóm Backup: dump gần nhất · verify gần nhất · DR drill gần nhất.
- [x] `BR-SYS-06` ca âm: chưa verify lần nào → cảnh báo **mức cao**, mục go-live đỏ.
- [x] Nhóm Lỗi: 5xx 24h · lỗi client 24h · alert đang mở — đọc từ nguồn P1.16, không đếm lại.
- [x] `BR-SYS-03`: mỗi mục bất thường có **link runbook** lấy từ `alerts.yml`.
- [x] `BR-SYS-04` ca âm: response **không** chứa chuỗi kết nối · secret · biến môi trường.
- [x] `D-KV` cổng: không `POST` `PATCH` `PUT` `DELETE` phát từ trang.

### Task 5 — Nối chéo và trả nợ

- [x] `BR-ALV-05`: mọi entity có audit có link **"xem lịch sử"** mở `/audit` đã lọc sẵn.
- [x] Entity phủ đủ: user · đơn · level · cờ · template · ảnh.
- [x] Trả nợ P2.9: thẻ cờ có link sang lịch sử đổi cờ trong `/audit`.
- [x] `D-KU` ca dương: từ hàng audit mở được lỗi cùng `request_id`, và ngược lại.
- [x] Thẻ "cảnh báo hệ thống đang mở" trên dashboard trỏ đúng `/system`.
- [x] Không màn hình nào hiện danh sách rỗng mà không nói lý do.

## Cổng dừng

- [x] `UPDATE audit_logs` bằng kết nối ứng dụng bị DB từ chối.
- [x] Truy vấn audit 200 ngày → 422; `limit=5000` → ≤200 hàng.
- [x] Chi tiết audit hiện diff, không JSON thô.
- [x] Export audit ghi chính nó vào audit.
- [x] 1000 lỗi tải asset → khoảng 100 hàng; 100 báo cáo/phút/IP → 429.
- [x] PII từ client bị strip bằng chính redactor của P1.16.
- [x] 500 lỗi cùng vân tay → một nhóm; đếm đúng số người ảnh hưởng.
- [x] Mất số liệu queue → `/system` hiện "không xác định", **không** xanh.
- [x] Không thao tác nào phát ra từ `/system`.
- [x] `content_reviewer` bị **403** ở cả ba màn hình.
- [x] `pnpm check && pnpm test && pnpm test:e2e && pnpm lint:specs && pnpm check:progress` xanh.

---

## Task 6 — Evidence, promote và nợ chuyển tiếp

- [x] Mỗi `BR-ALV-*` có test tham chiếu mã rule.
- [x] Mỗi `BR-ELV-*` có test tham chiếu mã rule.
- [x] Mỗi `BR-SYS-*` có test tham chiếu mã rule.
- [x] [`audit-log-viewer.md`](../specs/06-admin/audit-log-viewer.md) → `implemented`.
- [x] [`error-log-viewer.md`](../specs/06-admin/error-log-viewer.md) → `implemented`.
- [x] [`system-activity.md`](../specs/06-admin/system-activity.md) → `implemented`.
- [x] Nợ sang **P4**: full-text index cho `reason`, đo lại khi `audit_logs` vượt ~5 triệu hàng.
- [x] Tick **P2.10** ở [`14-implementation-sequence-todo.md`](14-implementation-sequence-todo.md) khi `check:progress` tự xanh.

## Câu hỏi mở chuyển tiếp

- [x] **Full-text index cho `reason`** — MVP dùng `ilike` có thoát ký tự đại diện + trần 90 ngày; hoãn P4.
- [x] **Sentry hay tự xây** — đã đóng từ `D-CD`: `error_log` là UI cho Manager, Sentry chạy song song cho alerting kỹ sư. Không mở lại.
- [x] **Thao tác vận hành từ `/system`** — đóng theo `D-KV`: **không** ở MVP; chỉ đọc và link sang công cụ riêng.
