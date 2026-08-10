# Kế hoạch — Task #51: P2.9 — Cờ tính năng, xuất dữ liệu và quản lý thông báo

> Viết 2026-08-10. Bước sở hữu: **P2.9** của
> [`14-implementation-sequence-todo.md`](14-implementation-sequence-todo.md).
> Spec sở hữu: [`feature-flag-service.md`](../specs/01-platform/feature-flag-service.md) ·
> [`feature-flags.md`](../specs/06-admin/feature-flags.md) ·
> [`data-export.md`](../specs/06-admin/data-export.md) ·
> [`notification-admin.md`](../specs/06-admin/notification-admin.md).
>
> ```
> export PATH=/Users/macbook/.nvm/versions/node/v24.15.0/bin:$PATH
> ```

## Tóm tắt

Bốn spec, ba công cụ vận hành, và một điểm chung: **cả ba đều là công tắc mà người vận hành cầm
trong tay khi có sự cố**. Chúng ít được dùng, nhưng lúc cần thì cần gấp.

1. **Cờ tính năng** — tắt nhanh một tính năng hỏng mà không deploy. Giá trị của nó nằm ở chỗ
   thao tác mất **dưới 30 giây**. Và cạm bẫy của nó nằm ở chỗ nó trông giống phân quyền: cờ
   **không phải** entitlement, trộn hai thứ là tạo hai nguồn sự thật cho cùng một câu hỏi.
2. **Xuất dữ liệu** — bề mặt **rò rỉ dữ liệu lớn nhất** trong toàn hệ thống. Một file CSV rời
   khỏi hạ tầng là không thu hồi được.
3. **Quản lý thông báo** — trả lời "email đó đã gửi chưa", câu hỏi hỗ trợ phổ biến nhất của mọi
   hệ thống có email.

## 0. Điều kiện tiên quyết

| Dep | Trạng thái | Ghi chú |
|---|---|---|
| `AUDIT-LOG` | P0.11 | lý do bắt buộc ở cả ba công cụ |
| `ENTITLEMENT-MODEL` | P0.5 | ranh giới mà cờ **không** được lấn |
| `CHILD-DATA-COMPLIANCE` | P0.4 | `BR-CDC-14`; cổng quét sẵn có |
| `NOTIFICATION-SERVICE` | P0.9b | `notifications`, job `email:send` |
| `ADMIN-AUTH` | P0.11b | `super_admin` — cả bốn spec chỉ cho vai này |
| `CONTENT-LIFECYCLE` | P0.6 | template thông báo đi qua vòng đời này |
| Hàng đợi duyệt | P2.8 | nơi template thông báo đi qua, không dựng cái thứ hai |
| `MONITORING-AND-ALERTING` | P1.16 | alert P1 cho cờ quá hạn |

## 1. Đo được

### 1.1 Đã có

`audit_logs`; entitlement và hàm resolve quyền; AWS SES qua `@aws-sdk/client-ses` (`D-CE`);
job `email:send`; vòng đời nội dung và hàng đợi duyệt của P2.8; `alerts.yml` của P1.16; shell
admin.

### 1.2 Chưa có

Bảng `feature_flags` và `isEnabled`; màn `/flags`; sáu loại xuất; màn `/exports`; nhật ký gửi
thông báo; webhook SNS nhận bounce/delivery; bề mặt soạn template.

### 1.3 Đã chốt, không mở lại

`D-CE` email đi qua **AWS SES**, bounce/delivery qua **SNS webhook**, lưu `notification_logs` ·
`BR-NOT-02` không gửi thông báo tới trẻ · `BR-NOT-06` không có cơ chế đồng ý tiếp thị nên không
có gửi hàng loạt · `BR-CDC-14` không xuất PII của trẻ ở bất kỳ đâu.

## 2. Quyết định

**D-KM — `isEnabled` **không bao giờ ném** và **không bao giờ quyết định quyền**.** `BR-FLG-02`
đòi mặc định an toàn; `BR-FLG-01` và `BR-FLG-06` cấm cờ thay entitlement hay gate tuân thủ. Hai
nhóm này cùng một cách hỏng: một hàm trả `boolean` thì trông dùng được ở mọi chỗ cần `boolean`.
Xử: `isEnabled` bắt mọi lỗi và trả **giá trị mặc định khai trong code** khi DB hoặc cache mất —
ca âm tắt cả Valkey lẫn Postgres, hàm vẫn trả đúng mặc định; và **cổng quét** cấm chuỗi
`isEnabled` xuất hiện trong module gating quyền, module entitlement, và module tuân thủ dữ liệu
trẻ. Ca âm: thêm một lời gọi `isEnabled` vào đường quyết định quyền → cổng **đỏ**.

**D-KN — Danh sách cờ suy từ **code**; DB chỉ giữ trạng thái.** `BR-FFA-04` nói code là nguồn sự
thật. Hệ quả cần nói rõ: hàng DB không có khai báo tương ứng là **cờ mồ côi**, và nó phải hiện
ra chứ không bị lọc đi âm thầm — một cờ mồ côi thường là dấu vết của một nhánh code đã xoá mà
quên dọn. Xử: `FlagKey` là union type sinh từ khai báo (key lạ **không compile**); màn hình hợp
nhất code + DB; cờ mồ côi hiện nhãn riêng kèm gợi ý xoá, **không** tự xoá; cờ có trong code mà
chưa có hàng DB hiện với `default_value`.

**D-KO — Cờ `percentage` **sticky** theo `user_id`.** §11 Q1 hỏi có cần sticky không — không
sticky nghĩa là cùng một người thấy tính năng nhấp nháy giữa các request, và đó là lỗi khó báo
cáo nhất trong mọi loại lỗi. Xử: `hash(user_id) % 100 < percentage`, hàm hash ổn định và có test
khoá giá trị; đổi phần trăm thì tập người thay đổi **theo hướng cộng dồn**, không xáo lại từ
đầu. Đóng Q1 là **có**.

**D-KP — Sáu loại xuất là **union type đóng**, và route không khớp thì **404 trước khi chạm
DB**.** `BR-EXP-01` cấm xuất tuỳ ý theo SQL. Cách hỏng thật không phải ai đó thêm endpoint SQL —
là một tham số `kind` được ghép vào tên bảng hoặc một `switch` có nhánh `default` chạy truy vấn
chung. Xử: `kind` validate bằng union type ở **biên**; không khớp → **404** ngay, chưa mở kết
nối DB; mỗi loại có truy vấn riêng viết sẵn, không có truy vấn tổng quát. Kèm theo: mở rộng cổng
quét của P2.2 — không đường xuất nào chạm `child_profiles`, `mastery_state`, hay
`telemetry_events` ở mức cá nhân. Loại `curriculum_health` khai `pending_source: P3` theo mẫu
`D-IX` vì curriculum chưa tồn tại.

**D-KQ — Template thông báo dùng **lại** hàng đợi duyệt của P2.8.** `BR-NTA-03` bắt template đi
qua duyệt vì email sai gửi đi không thu hồi được. Dựng một quy trình duyệt riêng cho template
là dựng cổng người thứ hai với checklist thứ hai — và cái thứ hai sẽ nhẹ hơn cái thứ nhất. Xử:
template là một loại nội dung của [`content-lifecycle.md`](../specs/00-foundation/content-lifecycle.md),
xuất hiện trong chính hàng đợi `/studio/review`, dùng chung `content_review_log`. Vế còn lại:
trạng thái gửi đến từ **SNS webhook của SES** theo `D-CE`, ghi `notification_logs`; webhook phải
xác thực chữ ký SNS trước khi tin, và phải idempotent theo `provider_message_id`.

## 3. Đồ thị

```
T1 feature_flags + isEnabled + cache 30s + mặc định an toàn (D-KM, D-KN, D-KO)
      └──→ T2 /flags: lý do bắt buộc · hạn · cờ mồ côi · alert quá hạn
T3 sáu loại xuất + trần + rate limit + signed URL + audit (D-KP)
T4 nhật ký thông báo + gửi lại + webhook SNS (D-KQ)
      └──→ T5 soạn template qua hàng đợi duyệt P2.8 (D-KQ)
                              ── Cổng dừng ──
                                    T6 evidence, promote 4 spec, nợ
```

## 4. Task

### Task 1 — Dịch vụ cờ

**Tiêu chí nghiệm thu**
- [ ] Bảng `feature_flags` đủ cột §7; `expires_at` **không null** (`BR-FLG-03`).
- [ ] Năm cờ MVP §7.1 khai trong code đúng mặc định: `ai_content_pipeline` off · `payment_soft_unlock` on · `weekly_progress_email` off · `studio_publish` on · `guest_play` on.
- [ ] `FlagKey` là union sinh từ khai báo; key lạ **không compile**.
- [ ] `isEnabled` đọc qua cache TTL **30 giây**.
- [ ] `D-KM` + `BR-FLG-02` ca âm: tắt **cả** Valkey lẫn Postgres → `isEnabled("ai_content_pipeline")` trả `false`, không ném.
- [ ] Cờ không tồn tại trong DB → trả mặc định khai trong code + log cảnh báo.
- [ ] `D-KM` cổng: chuỗi `isEnabled` **không** xuất hiện trong module gating quyền, entitlement, và tuân thủ dữ liệu trẻ; ca âm — thêm một lời gọi vào đường quyết định quyền → **đỏ**.
- [ ] `BR-FLG-06` ca âm: liệt kê mọi cờ → **không** cờ nào gate consent, danh sách đóng field trẻ, hay ràng buộc telemetry.
- [ ] `BR-FLG-05` cổng: không cờ nào được đọc trong đường tính điểm hoặc tính độ khó của phiên đang chạy.
- [ ] `D-KO` ca âm sticky: cùng một `user_id` gọi 100 lần → kết quả **không đổi**; hàm hash có test khoá giá trị.

**Kiểm chứng**
- [ ] `pnpm test -- feature-flag-service` xanh, assertion tham chiếu `BR-FLG-01` `BR-FLG-02` `BR-FLG-05` `BR-FLG-06`.

**Phụ thuộc:** P0.5 · P0.11 · **Cỡ:** M

### Task 2 — Màn hình cờ

**Tiêu chí nghiệm thu**
- [ ] `GET /api/managers/feature-flags` trả danh sách **hợp nhất code + DB**; `content_reviewer` → **403** (`BR-FFA-03`, `BR-FLG-07`).
- [ ] Cột §7 đủ: key · mô tả từ khai báo · trạng thái · **mặc định an toàn** · phạm vi · hết hạn · đổi lần cuối (ai, khi nào, lý do).
- [ ] `BR-FFA-01` ca âm: `PATCH` với `reason` rỗng → **422**, cờ **không đổi**; ngưỡng **10** ký tự.
- [ ] `BR-FFA-01` ca dương: đổi cờ → `audit_logs` có `feature_flag_changed` kèm **before, after, reason**.
- [ ] `D-KN` ca âm: hàng DB không có khai báo trong code → hiện dạng **mồ côi**, gợi ý xoá, **không** tự xoá.
- [ ] Cờ trong code chưa có hàng DB → hiện với `default_value`.
- [ ] `BR-FFA-02`: cờ quá hạn hiện **đỏ** kèm số ngày quá hạn.
- [ ] Cờ quá hạn **30 ngày** phát alert **P1** — thêm quy tắc vào `alerts.yml` của P1.16.
- [ ] Ca dương tốc độ: tắt một cờ → trong **30 giây** ứng dụng phản ánh trạng thái mới.

**Kiểm chứng**
- [ ] `pnpm test -- feature-flags-admin` xanh · `pnpm test:e2e -- admin-flags` xanh.

**Phụ thuộc:** T1 · **Cỡ:** M

### Task 3 — Xuất dữ liệu

**Tiêu chí nghiệm thu**
- [ ] Sáu loại §7.1 và **chỉ** sáu: `revenue` · `subscriptions` · `content_kpi` · `skill_coverage` · `curriculum_health` · `audit`.
- [ ] `D-KP` ca âm: `kind` ngoài danh sách → **404**, và **không** mở kết nối DB.
- [ ] `D-KP`: mỗi loại có truy vấn riêng; **không** có truy vấn tổng quát hay `switch` có nhánh `default` chạy SQL.
- [ ] `D-KP`: `curriculum_health` khai `pending_source: P3`; gọi tới nó trả trạng thái chờ nguồn, **không** trả file rỗng.
- [ ] `BR-EXP-02` ca âm: xuất **mọi** loại → không file nào chứa `display_name`, `birth_year`, hay `child_uuid` của trẻ.
- [ ] `D-KP` cổng: mở rộng cổng quét — không đường xuất nào chạm `child_profiles`, `mastery_state`, `telemetry_events` ở mức cá nhân.
- [ ] `BR-EXP-08` ca âm hai vế: xuất `subscriptions` → email **rút gọn**; xuất `revenue` → email **đầy đủ**.
- [ ] `BR-EXP-05` ca âm: yêu cầu khoảng cho 500.000 hàng → **422** kèm gợi ý thu hẹp; trần **100.000**.
- [ ] `BR-EXP-07` ca âm: xuất lần thứ **6** trong một ngày → **429**.
- [ ] `BR-EXP-04` ca âm: mở URL sau **20 phút** → bị từ chối; TTL **15 phút**.
- [ ] `BR-EXP-03`: `audit_logs` `data_exported` kèm `kind`, khoảng, `row_count`, `reason`; thiếu `reason` → **422**.
- [ ] `BR-EXP-06`: `content_reviewer` → **403**.
- [ ] §7.2: CSV UTF-8 **có BOM**, ngày theo ICT, số tiền **không** định dạng.
- [ ] Xuất lớn chạy job nền và thông báo khi xong.

**Kiểm chứng**
- [ ] `pnpm test -- data-export` xanh, assertion tham chiếu `BR-EXP-01`…`BR-EXP-08`.

**Phụ thuộc:** P0.4 · P0.11 · **Cỡ:** L

### Task 4 — Nhật ký thông báo

**Tiêu chí nghiệm thu**
- [ ] `GET /api/managers/notifications` với `recipient` · `code` · `status` · `from` · `to`; trần **100**; `content_reviewer` → **403**.
- [ ] Nhật ký §7.1 đủ cột gồm `provider_message_id` và lỗi.
- [ ] `D-KQ`: webhook SNS của SES nhận sự kiện delivery/bounce/complaint, **xác thực chữ ký SNS** trước khi tin.
- [ ] Webhook **idempotent** theo `provider_message_id`; nhận cùng sự kiện hai lần → một hàng.
- [ ] Địa chỉ `bouncing` → hiện cảnh báo, **không** cho gửi lại loại định kỳ.
- [ ] `BR-NTA-01` ca âm: gửi lại → có hàng `notifications` **thứ hai**, hàng đầu **không đổi**.
- [ ] `BR-NTA-04` ca âm: xem email đặt lại mật khẩu → token **bị che**.
- [ ] `BR-NTA-02` cổng: quét route admin → **không** route nào gửi thông báo tới nhiều người nhận cùng lúc.
- [ ] Người nhận đã xoá tài khoản → gửi lại trả **409**.
- [ ] Gửi lại **chỉ** cho loại giao dịch.

**Kiểm chứng**
- [ ] `pnpm test -- notification-log` xanh, assertion tham chiếu `BR-NTA-01` `BR-NTA-02` `BR-NTA-04`.

**Phụ thuộc:** P0.9b · **Cỡ:** M

### Task 5 — Soạn template thông báo

**Tiêu chí nghiệm thu**
- [ ] Template có `code` · `subject_vi` · `body_vi` (rich text hạn chế) · biến khả dụng · `content_version` · `status`.
- [ ] `D-KQ` + `BR-NTA-03` ca âm: sửa template → trạng thái **`draft`**; email mới **vẫn dùng bản `published`** cho tới khi bản mới được publish.
- [ ] `D-KQ`: template xuất hiện trong hàng đợi duyệt `/studio/review` của P2.8; **không** dựng quy trình duyệt thứ hai.
- [ ] `BR-NTA-07` ca âm: lưu template thiếu biến bắt buộc → **422** nêu rõ biến nào thiếu.
- [ ] Rich text dùng **cùng** allow-list và cùng bộ lọc hai thời điểm của `D-KL` (P2.8).
- [ ] `BR-NTA-06` cổng: không template nào có người nhận là trẻ.
- [ ] Preview §7.3: render với dữ liệu mẫu, xem desktop và mobile.
- [ ] Template lỗi cú pháp → chặn lưu, hiện lỗi.

**Kiểm chứng**
- [ ] `pnpm test -- notification-templates` xanh.

**Phụ thuộc:** T4 · P2.8 · **Cỡ:** M

### Cổng dừng

- [ ] Tắt một cờ trên `/flags` → dưới 30 giây ứng dụng đổi hành vi.
- [ ] Tắt cả Valkey lẫn Postgres → `isEnabled` vẫn trả mặc định an toàn, không ném.
- [ ] Không lời gọi `isEnabled` nào nằm trên đường quyết định quyền hay tuân thủ.
- [ ] Xuất đủ năm loại có nguồn; không file nào chứa PII của trẻ.
- [ ] `kind` lạ → 404 trước khi chạm DB; lần xuất thứ 6 trong ngày → 429.
- [ ] Webhook SNS ghi đúng trạng thái gửi; nhận trùng không sinh hàng trùng.
- [ ] Sửa template → bản mới ở `draft`, email vẫn dùng bản published cũ.
- [ ] `content_reviewer` bị **403** ở cả bốn bề mặt.
- [ ] `pnpm check && pnpm test && pnpm test:e2e && pnpm lint:specs && pnpm check:progress` xanh.

### Task 6 — Evidence, promote và nợ chuyển tiếp

**Tiêu chí nghiệm thu**
- [ ] Mỗi `BR-FLG-*` `BR-FFA-*` `BR-EXP-*` `BR-NTA-*` có ít nhất một test tham chiếu mã rule.
- [ ] Bốn spec sang `implemented`.
- [ ] §11 Q1 của [`feature-flag-service.md`](../specs/01-platform/feature-flag-service.md) (cờ `percentage` sticky) — đóng theo `D-KO`: **có**, hash `user_id`.
- [ ] §11 Q1 của [`feature-flags.md`](../specs/06-admin/feature-flags.md) (lịch sử đổi cờ trên màn hình) — đóng: thẻ cờ hiện lần đổi gần nhất; lịch sử đầy đủ tra ở [`audit-log-viewer.md`](../specs/06-admin/audit-log-viewer.md) — **P2.10**.
- [ ] §11 Q1 của [`data-export.md`](../specs/06-admin/data-export.md) (xuất định kỳ gửi email) — đóng: **không** ở MVP; thêm bề mặt rò rỉ mà không có nhu cầu chặn; hoãn P4.
- [ ] §11 Q1 của [`notification-admin.md`](../specs/06-admin/notification-admin.md) đã đóng từ `D-CE` — xác nhận SES + SNS webhook đã chạy, không mở lại.
- [ ] Nợ ghi sang **P2.10**: link từ thẻ cờ sang màn hình audit · **P3**: bật loại xuất `curriculum_health`.
- [ ] Tick **P2.9** ở [`14-implementation-sequence-todo.md`](14-implementation-sequence-todo.md) khi `check:progress` tự xanh.

**Cỡ:** S

## 5. Rủi ro

| Rủi ro | Ảnh hưởng | Giảm thiểu |
|---|---|---|
| Cờ dùng thay entitlement | Hai nguồn sự thật cho "được dùng không" | `D-KM` — cổng quét module gating |
| Cờ gate ràng buộc tuân thủ | Có công tắc tắt bảo vệ dữ liệu trẻ | `BR-FLG-06` — ca âm liệt kê mọi cờ |
| `isEnabled` ném khi cache mất | Sự cố cache thành sự cố tính năng | `D-KM` — ca âm tắt cả hai |
| Cờ `percentage` nhấp nháy | Lỗi khó báo cáo nhất; người dùng không tin sản phẩm | `D-KO` — sticky theo hash |
| Cờ mồ côi bị lọc âm thầm | Nhánh code chết không ai dọn | `D-KN` — hiện nhãn mồ côi |
| Một truy vấn xuất tổng quát | Cửa sau vào mọi bảng | `D-KP` — union type + truy vấn riêng từng loại |
| Export chứa PII trẻ | Rò rỉ không thu hồi được | `BR-EXP-02` + cổng quét |
| Link export công khai | File sống lâu hơn nhu cầu | `BR-EXP-04` — signed 15 phút |
| Quy trình duyệt thứ hai cho template | Cái thứ hai nhẹ hơn cái thứ nhất | `D-KQ` — dùng lại hàng đợi P2.8 |
| Webhook SNS không xác thực chữ ký | Ai cũng ghi được trạng thái gửi | T4 — xác thực trước khi tin |

## 6. Giả định

1. **P2.8 đã đóng** — hàng đợi duyệt dùng lại được cho template.
2. **SES đã có production access** và SNS topic đã cấu hình (`D-CE` nêu là việc phải xin sớm).
3. **Chưa có curriculum** — loại xuất `curriculum_health` khai `pending_source: P3`.
4. **Một `super_admin`** — rate limit 5 lần/ngày tính theo Manager, ở MVP là một người.
5. **Năm cờ, không hơn** — thêm cờ là `Ask first`, và mỗi cờ mới phải có hạn.

## 7. Ngoài phạm vi

- Màn hình nhật ký audit, lỗi, hoạt động hệ thống — P2.10.
- Xuất định kỳ tự động gửi email — P4.
- Gửi thông báo hàng loạt / tiếp thị — **không bao giờ** khi chưa có cơ chế đồng ý.
- Cờ điều khiển độ khó trên bề mặt trẻ — **không bao giờ**.
- Xuất dữ liệu học tập cá nhân của trẻ — **không bao giờ**.
- Loại xuất `curriculum_health` có dữ liệu thật — P3.
