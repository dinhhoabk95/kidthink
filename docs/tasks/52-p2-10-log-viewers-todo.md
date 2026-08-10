# Checklist — Task #52: P2.10 — Nhật ký: audit, lỗi và trạng thái hệ thống

> Kế hoạch: [`52-p2-10-log-viewers-plan.md`](52-p2-10-log-viewers-plan.md).
> P0.11 đã **ghi** audit; đây là lần đầu có người **đọc** được.
> Tuyệt đối: audit không sửa được (`D-KR`) · "không biết" **không bao giờ** hiện xanh (`D-KT`).
>
> ```
> export PATH=/Users/macbook/.nvm/versions/node/v24.15.0/bin:$PATH
> ```

## Preflight

- [ ] **P0.11 và P1.16 đã đóng** — audit ghi đủ, redactor PII `D-IS` chạy được.
- [ ] **P2.1…P2.9 đã đóng** — có dữ liệu thật để ba màn hình có ý nghĩa.
- [ ] Human approve kế hoạch và năm quyết định D-KR · D-KS · D-KT · D-KU · D-KV.
- [ ] Đối chiếu `BR-ALV-*` `BR-ELV-*` `BR-SYS-*` với [`business-rules.md`](../specs/00-foundation/business-rules.md).
- [ ] Tạo nhánh riêng.

---

### Task 1 — Màn hình audit

- [ ] `D-KR`: migration thu hồi `UPDATE` và `DELETE` trên `audit_logs` khỏi role ứng dụng.
- [ ] `D-KR` ca âm: `UPDATE audit_logs …` bằng kết nối ứng dụng → **bị từ chối**.
- [ ] `BR-ALV-01` cổng lớp hai: không route nào `PATCH` hay `DELETE` `audit_logs`.
- [ ] `GET .../audit-logs` cần `super_admin`; `content_reviewer` → **403**.
- [ ] Bộ lọc §7.1 đủ, gồm `action` multi-select từ **28** hành động.
- [ ] `q` tìm trong `reason`, dùng lại mẫu thoát ký tự đại diện của `D-JC`.
- [ ] Ca âm: `q = "%"` không quét toàn bảng.
- [ ] `BR-ALV-03` ca âm: `limit = 5000` → **≤200** hàng.
- [ ] Khoảng thời gian > **90 ngày** → **422**.
- [ ] `BR-ALV-04` ca âm: chi tiết hiện **danh sách field đã đổi**, **không** JSON thô.
- [ ] `before`/`after` lớn → diff rút gọn + nút xem đầy đủ.
- [ ] Cột §7.2 đủ: thời gian **ICT** · actor · action **nhãn tiếng Việt** · entity · tóm tắt · IP.
- [ ] Chi tiết §7.3 có `reason` · IP · user agent · `request_id`.
- [ ] `BR-ALV-06` ca dương: export CSV (trần **10.000**) → audit có hàng `data_exported`.
- [ ] Không có kết quả → nói rõ **bộ lọc nào đang áp**.
- [ ] `BR-ALV-07` ca âm: response không chứa PII trẻ · mật khẩu · token.

### Task 2 — Thu lỗi client

- [ ] Bảng `error_log` đủ cột §7.1; `user_id` nullable; **không** có `child_uuid`.
- [ ] `POST /api/guest/client-errors` nhận `{ code, message, fingerprint, context }`.
- [ ] `D-KS`: tỉ lệ sampling khai **một chỗ** trong config, gửi xuống client.
- [ ] Tỉ lệ đúng §7.3: asset **10%** · engine **100%** · mạng **5%** · chưa phân loại **50%**.
- [ ] `D-KS` ca âm: 1000 lỗi tải asset → khoảng **100** hàng ghi.
- [ ] `BR-ELV-05` ca âm: 100 báo cáo/phút/IP → phần vượt **429**; trần **10/phút/IP**.
- [ ] `BR-ELV-03` ca âm: lỗi kèm `display_name` của trẻ → `error_log` **không** chứa field đó.
- [ ] Dùng **chính** redactor `D-IS`; **không** viết bản thứ hai.
- [ ] `context` strip theo allow-list: route · phiên bản app · loại thiết bị.
- [ ] Lỗi server ghi cùng bảng với `source = 'server'`, cùng scheme `fingerprint`.
- [ ] `D-KU`: mọi hàng mang `request_id` khớp log có cấu trúc.

### Task 3 — Màn hình lỗi

- [ ] `GET .../error-logs` trả **nhóm**, không hàng lẻ; trần **100**; `super_admin` duy nhất.
- [ ] `BR-ELV-01` ca âm: 500 lỗi cùng `fingerprint` → **một** nhóm, số lần 500.
- [ ] `fingerprint` = code + route + stack rút gọn; hàm sinh có test khoá giá trị.
- [ ] `BR-ELV-02` ca âm: lỗi từ 3 user → hiện **3 người ảnh hưởng**, tách bạch số lần.
- [ ] Nhóm §7.2 đủ: lần đầu · lần cuối · số lần · số người · trạng thái · ghi chú.
- [ ] `BR-ELV-07` ca âm: đánh dấu `resolved` → nhóm rời bộ lọc mặc định.
- [ ] `BR-ELV-07` ca âm ngược: lỗi mới cùng `fingerprint` → nhóm **mở lại**.
- [ ] Lỗi từ client lỗi thời gắn nhãn phiên bản, **không** phát alert.
- [ ] `D-KU`: từ nhóm lỗi mở được hàng audit cùng `request_id`.

### Task 4 — Trạng thái hệ thống

- [ ] `GET .../system/status` trả bốn nhóm §7 kèm `as_of`; `Cache-Control: no-store`.
- [ ] `content_reviewer` → **403**.
- [ ] `D-KT`: mọi mục dùng kiểu `"ok" | "unknown" | "bad"`.
- [ ] `D-KT` cổng: mục khai kiểu `boolean` → **đỏ**.
- [ ] `BR-SYS-01` ca âm: mất số liệu queue → nhóm job **"không xác định"**, **không** hiện ổn.
- [ ] Nhóm Dịch vụ: PostgreSQL · Valkey · Queue — trạng thái + độ trễ.
- [ ] Nhóm Job: backlog `waiting` · `failed` 24h · job cũ nhất · lần chạy cuối **mỗi** job định kỳ.
- [ ] Nhóm Backup: dump gần nhất · verify gần nhất · DR drill gần nhất.
- [ ] `BR-SYS-06` ca âm: chưa verify lần nào → cảnh báo **mức cao**, mục go-live đỏ.
- [ ] Nhóm Lỗi: 5xx 24h · lỗi client 24h · alert đang mở — đọc từ nguồn P1.16, không đếm lại.
- [ ] `BR-SYS-03`: mỗi mục bất thường có **link runbook** lấy từ `alerts.yml`.
- [ ] `BR-SYS-04` ca âm: response **không** chứa chuỗi kết nối · secret · biến môi trường.
- [ ] `D-KV` cổng: không `POST` `PATCH` `PUT` `DELETE` phát từ trang.

### Task 5 — Nối chéo và trả nợ

- [ ] `BR-ALV-05`: mọi entity có audit có link **"xem lịch sử"** mở `/audit` đã lọc sẵn.
- [ ] Entity phủ đủ: user · đơn · level · cờ · template · ảnh.
- [ ] Trả nợ P2.9: thẻ cờ có link sang lịch sử đổi cờ trong `/audit`.
- [ ] `D-KU` ca dương: từ hàng audit mở được lỗi cùng `request_id`, và ngược lại.
- [ ] Thẻ "cảnh báo hệ thống đang mở" trên dashboard trỏ đúng `/system`.
- [ ] Không màn hình nào hiện danh sách rỗng mà không nói lý do.

## Cổng dừng

- [ ] `UPDATE audit_logs` bằng kết nối ứng dụng bị DB từ chối.
- [ ] Truy vấn audit 200 ngày → 422; `limit=5000` → ≤200 hàng.
- [ ] Chi tiết audit hiện diff, không JSON thô.
- [ ] Export audit ghi chính nó vào audit.
- [ ] 1000 lỗi tải asset → khoảng 100 hàng; 100 báo cáo/phút/IP → 429.
- [ ] PII từ client bị strip bằng chính redactor của P1.16.
- [ ] 500 lỗi cùng vân tay → một nhóm; đếm đúng số người ảnh hưởng.
- [ ] Mất số liệu queue → `/system` hiện "không xác định", **không** xanh.
- [ ] Không thao tác nào phát ra từ `/system`.
- [ ] `content_reviewer` bị **403** ở cả ba màn hình.
- [ ] `pnpm check && pnpm test && pnpm test:e2e && pnpm lint:specs && pnpm check:progress` xanh.

---

## Task 6 — Evidence, promote và nợ chuyển tiếp

- [ ] Mỗi `BR-ALV-*` có test tham chiếu mã rule.
- [ ] Mỗi `BR-ELV-*` có test tham chiếu mã rule.
- [ ] Mỗi `BR-SYS-*` có test tham chiếu mã rule.
- [ ] [`audit-log-viewer.md`](../specs/06-admin/audit-log-viewer.md) → `implemented`.
- [ ] [`error-log-viewer.md`](../specs/06-admin/error-log-viewer.md) → `implemented`.
- [ ] [`system-activity.md`](../specs/06-admin/system-activity.md) → `implemented`.
- [ ] Nợ sang **P4**: full-text index cho `reason`, đo lại khi `audit_logs` vượt ~5 triệu hàng.
- [ ] Tick **P2.10** ở [`14-implementation-sequence-todo.md`](14-implementation-sequence-todo.md) khi `check:progress` tự xanh.

## Câu hỏi mở chuyển tiếp

- [ ] **Full-text index cho `reason`** — MVP dùng `ilike` có thoát ký tự đại diện + trần 90 ngày; hoãn P4.
- [ ] **Sentry hay tự xây** — đã đóng từ `D-CD`: `error_log` là UI cho Manager, Sentry chạy song song cho alerting kỹ sư. Không mở lại.
- [ ] **Thao tác vận hành từ `/system`** — đóng theo `D-KV`: **không** ở MVP; chỉ đọc và link sang công cụ riêng.
