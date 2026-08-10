# Kế hoạch — Task #52: P2.10 — Nhật ký: audit, lỗi và trạng thái hệ thống

> Viết 2026-08-10. Bước sở hữu: **P2.10** của
> [`14-implementation-sequence-todo.md`](14-implementation-sequence-todo.md).
> Spec sở hữu: [`audit-log-viewer.md`](../specs/06-admin/audit-log-viewer.md) ·
> [`error-log-viewer.md`](../specs/06-admin/error-log-viewer.md) ·
> [`system-activity.md`](../specs/06-admin/system-activity.md).
>
> ```
> export PATH=/Users/macbook/.nvm/versions/node/v24.15.0/bin:$PATH
> ```

## Tóm tắt

P0.11 đã **ghi** audit. Chín bước của P2 đã ghi thêm rất nhiều. Bước này là lần đầu có người
**đọc** được chúng.

Ba màn hình, ba câu hỏi khác nhau, và cả ba chỉ được hỏi khi đang có chuyện:

1. **"Ai đổi gì lúc nào"** — audit. Nhật ký không tra cứu được là nhật ký không tồn tại; đó là
   lý do bề mặt này ở MVP thay vì để "sau này viết query tay".
2. **"Cái gì đang hỏng và với bao nhiêu người"** — lỗi. Lỗi trên tablet của người dùng **không
   thấy được từ server**, nên phải gom hai nguồn.
3. **"Hệ thống có ổn không"** — trạng thái, không cần SSH.

Điểm chung quan trọng nhất: cả ba đều dễ hỏng theo cùng một kiểu — **trông như đang hoạt động
trong khi không có dữ liệu**. Một danh sách audit rỗng vì bộ lọc sai trông giống một hệ thống
không có ai đổi gì; một nhóm dịch vụ màu xanh vì không lấy được số liệu trông giống một hệ thống
khoẻ.

## 0. Điều kiện tiên quyết

| Dep | Trạng thái | Ghi chú |
|---|---|---|
| `AUDIT-LOG` | P0.11 | `audit_logs` INSERT-only, 28 hành động, `BR-AUD-09` |
| `ADMIN-AUTH` | P0.11b | `super_admin` — cả ba màn hình chỉ cho vai này |
| `HEALTH-CHECK` | P0.8b | `/api/guest/health` |
| `BACKUP-AND-RESTORE` | P0.8b | dump, verify, DR drill · `BR-BAK-06` |
| `JOB-QUEUE` | P1.5 | backlog, `failed`, lần chạy cuối mỗi job |
| `MONITORING-AND-ALERTING` | P1.16 | `alerts.yml`, runbook, redactor PII (`D-IS`) |
| Admin shell | P2.1 | layout `manager` |

## 1. Đo được

### 1.1 Đã có

`audit_logs` với before/after và `request_id` từ P0.11; log có cấu trúc và **redactor PII** của
P1.16 (`D-IS`); `alerts.yml` với link runbook; health check; job registry; `@sentry/nuxt` chạy
song song cho alerting kỹ sư (`D-CD`).

### 1.2 Chưa có

Ba màn hình; bảng `error_log` và endpoint nhận lỗi client; gom nhóm theo dấu vân tay; đếm số
người ảnh hưởng; `GET /api/managers/system/status`; và **ràng buộc quyền DB** bảo đảm audit
không sửa được.

### 1.3 Đã chốt, không mở lại

`D-CD` `error_log` là **UI tiện dụng cho Manager**, đọc từ cùng lỗi mà `pino` ghi — **không
thay** Sentry, Sentry vẫn chạy song song · `D-IS` redactor PII là bộ lọc lúc chạy, deny-list
bảy trường · `BR-AUD-09` chỉ `super_admin` đọc audit · `BR-BAK-06` backup chưa verify chặn
go-live.

## 2. Quyết định

**D-KR — `audit_logs` bất biến ép ở **quyền DB**, không chỉ ở tầng ứng dụng.** `BR-ALV-01` nói
bảng là INSERT-only. Một quy tắc chỉ sống trong code là quy tắc bị phá bởi migration tiếp theo,
hoặc bởi một script sửa dữ liệu chạy tay. Và audit là thứ mà việc sửa được **âm thầm phá huỷ
toàn bộ giá trị** — một nhật ký sửa được không phải là bằng chứng. Xử: role ứng dụng chỉ có
`INSERT` và `SELECT` trên `audit_logs`; `UPDATE` và `DELETE` bị thu hồi ở tầng DB; cổng quét
route là **lớp hai**, không phải lớp duy nhất. Ca âm: chạy `UPDATE audit_logs …` bằng chính
kết nối của ứng dụng → **bị từ chối**.

**D-KS — Lỗi client: **sampling ở client, rate limit và strip ở server**.** `BR-ELV-04` nói một
lỗi vòng lặp sẽ tự DDoS endpoint nhận. Nếu sampling làm ở server thì lưu lượng vẫn tới — chỉ là
không ghi. Xử: tỉ lệ §7.3 khai **một chỗ** trong config, gửi xuống client; client tự bỏ bớt
trước khi gửi; server vẫn có rate limit **10/phút/IP** làm lớp hai và **strip** mọi field ngoài
allow-list bằng **chính redactor `D-IS`** của P1.16 — không viết bản thứ hai. Ca âm: 1000 lỗi
tải asset từ một client → khoảng **100** hàng ghi; và gửi 100 báo cáo trong một phút từ một IP →
phần vượt **429**.

**D-KT — Trạng thái hệ thống là **ba trạng thái ở tầng kiểu**, không phải boolean.** `BR-SYS-01`
cấm hiện xanh khi không lấy được số liệu — "không biết ≠ ổn". Với một `boolean`, "không lấy
được" chỉ có hai chỗ để rơi vào, và nó sẽ rơi vào `false` rồi được render thành màu xanh hoặc
đỏ tuỳ chỗ. Xử: kiểu `"ok" | "unknown" | "bad"` cho **mọi** mục của bốn nhóm §7; thiếu số liệu
→ `unknown` và render là "không xác định", **không bao giờ** xanh. Cổng: mục trạng thái khai
kiểu `boolean` → **đỏ**.

**D-KU — `request_id` là khoá nối ba màn hình.** §7.3 của audit viewer đã nêu `request_id` để
nối với `error_log`. Nói rõ thành quyết định vì nó quyết định hình dạng của cả ba: mọi hàng
audit, mọi hàng `error_log`, và mọi dòng log có cấu trúc mang **cùng một** `request_id`; từ một
hàng audit mở được lỗi cùng request và ngược lại. Đây là thứ biến ba màn hình rời rạc thành một
đường điều tra — và nó gần như miễn phí nếu làm ngay, rất đắt nếu làm sau.

**D-KV — Không thao tác vận hành từ `/system` ở MVP.** §11 Q1 hỏi có cho retry job hay chạy
backup từ màn hình này không. Tiện — và cùng loại tiện với "nút duyệt trên màn hình danh sách"
mà `BR-PQU-01` đã cấm, và "mutation trên dashboard" mà `BR-DSH-01` đã cấm. Xử: `/system` **chỉ
đọc**; mục bất thường có link runbook và link sang công cụ vận hành riêng. Đóng Q1 là **không**.
Cổng: quét lời gọi từ trang — không `POST` `PATCH` `PUT` `DELETE`.

## 3. Đồ thị

```
T1 /audit: bộ lọc · diff · trần · export có audit (D-KR, D-KU)
T2 error_log + POST /api/guest/client-errors: sampling · strip · rate limit (D-KS)
      └──→ T3 /errors: gom nhóm fingerprint · người ảnh hưởng · ack/resolve
T4 /system: bốn nhóm · ba trạng thái · runbook (D-KT, D-KV)
T5 nối chéo: "xem lịch sử" từ mọi entity + link từ thẻ cờ (trả nợ P2.9)
                              ── Cổng dừng ──
                                    T6 evidence, promote 3 spec, nợ
```

## 4. Task

### Task 1 — Màn hình audit

**Tiêu chí nghiệm thu**
- [ ] `D-KR`: migration thu hồi `UPDATE` và `DELETE` trên `audit_logs` khỏi role ứng dụng.
- [ ] `D-KR` ca âm: chạy `UPDATE audit_logs …` bằng chính kết nối ứng dụng → **bị từ chối**.
- [ ] `BR-ALV-01` cổng lớp hai: không route nào `PATCH` hay `DELETE` `audit_logs`.
- [ ] `GET /api/managers/audit-logs` cần `super_admin`; `content_reviewer` → **403** (`BR-ALV-02`).
- [ ] Bộ lọc §7.1 đủ, gồm `action` multi-select từ **28** hành động và `q` tìm trong `reason`.
- [ ] `q` dùng lại mẫu thoát ký tự đại diện của `D-JC` (P2.2) — `%` không quét toàn bảng.
- [ ] `BR-ALV-03` ca âm: `limit = 5000` → trả **không quá 200** hàng.
- [ ] Khoảng thời gian > **90 ngày** → **422**.
- [ ] `BR-ALV-04` ca âm: mở chi tiết một hàng có before/after → hiện **danh sách field đã đổi**, **không** chuỗi JSON thô; `before`/`after` lớn → diff rút gọn + nút xem đầy đủ.
- [ ] Cột §7.2 đủ: thời gian **ICT** · actor · action **nhãn tiếng Việt** · entity · tóm tắt · IP.
- [ ] Chi tiết §7.3 có `reason`, IP, user agent, và `request_id`.
- [ ] `BR-ALV-06` ca dương: export CSV (trần **10.000** hàng) → `audit_logs` có hàng `data_exported`.
- [ ] Không có kết quả → nói rõ **bộ lọc nào đang áp**, không hiện danh sách rỗng im lặng.
- [ ] `BR-ALV-07` ca âm: response không chứa PII của trẻ, mật khẩu, hay token.

**Kiểm chứng**
- [ ] `pnpm test -- audit-log-viewer` xanh, assertion tham chiếu `BR-ALV-01`…`BR-ALV-06`.

**Phụ thuộc:** P0.11 · P2.1 · **Cỡ:** M

### Task 2 — Thu lỗi client

**Tiêu chí nghiệm thu**
- [ ] Bảng `error_log` đủ cột §7.1; `user_id` nullable và **không** có `child_uuid`.
- [ ] `POST /api/guest/client-errors` nhận `{ code, message, fingerprint, context }`.
- [ ] `D-KS`: tỉ lệ sampling §7.3 khai **một chỗ** trong config, gửi xuống client — lỗi tải asset **10%** · lỗi engine **100%** · lỗi mạng **5%** · chưa phân loại **50%**.
- [ ] `D-KS` ca âm: 1000 lỗi tải asset từ một client → khoảng **100** hàng ghi.
- [ ] `BR-ELV-05` ca âm: 100 báo cáo trong 1 phút từ một IP → phần vượt **429**; trần **10/phút/IP**.
- [ ] `D-KS` + `BR-ELV-03` ca âm: client gửi lỗi kèm `display_name` của trẻ → hàng `error_log` **không** chứa field đó; dùng **chính** redactor `D-IS`, không viết bản thứ hai.
- [ ] `context` strip theo **allow-list**: route, phiên bản app, loại thiết bị; field ngoài danh sách bị loại.
- [ ] Lỗi server ghi cùng bảng với `source = 'server'`, cùng `fingerprint` scheme.
- [ ] `D-KU`: mọi hàng mang `request_id` khớp với log có cấu trúc.

**Kiểm chứng**
- [ ] `pnpm test -- client-error-ingest` xanh, assertion tham chiếu `BR-ELV-03` `BR-ELV-04` `BR-ELV-05`.

**Phụ thuộc:** P1.16 · **Cỡ:** M

### Task 3 — Màn hình lỗi

**Tiêu chí nghiệm thu**
- [ ] `GET /api/managers/error-logs` trả **nhóm**, không trả hàng lẻ; trần **100**; `super_admin` duy nhất.
- [ ] `BR-ELV-01` ca âm: 500 lỗi cùng `fingerprint` → **một** nhóm với số lần 500.
- [ ] `fingerprint` = code + route + stack rút gọn; hàm sinh có test khoá giá trị.
- [ ] `BR-ELV-02` ca âm: nhóm lỗi từ 3 user khác nhau → hiện **3 người ảnh hưởng**, tách bạch với số lần.
- [ ] Nhóm §7.2 đủ: lần đầu · lần cuối · số lần · số người · trạng thái · ghi chú.
- [ ] `BR-ELV-07` ca âm hai vế: đánh dấu `resolved` → nhóm rời bộ lọc mặc định; lỗi mới cùng `fingerprint` → nhóm **mở lại**.
- [ ] Lỗi từ client lỗi thời gắn **nhãn phiên bản**, không phát alert.
- [ ] `D-KU`: từ một nhóm lỗi mở được hàng audit cùng `request_id`.

**Kiểm chứng**
- [ ] `pnpm test -- error-log-viewer` xanh · `pnpm test:e2e -- admin-errors` xanh.

**Phụ thuộc:** T2 · **Cỡ:** M

### Task 4 — Trạng thái hệ thống

**Tiêu chí nghiệm thu**
- [ ] `GET /api/managers/system/status` trả bốn nhóm §7 kèm `as_of`; `Cache-Control: no-store`; `content_reviewer` → **403**.
- [ ] `D-KT`: mọi mục dùng kiểu `"ok" | "unknown" | "bad"`; cổng — mục khai kiểu `boolean` → **đỏ**.
- [ ] `BR-SYS-01` ca âm: không lấy được số liệu queue → nhóm job hiện **"không xác định"**, **không** hiện trạng thái ổn.
- [ ] Nhóm **Dịch vụ**: PostgreSQL · Valkey · Queue — trạng thái + độ trễ.
- [ ] Nhóm **Job**: backlog `waiting` · `failed` 24h · job cũ nhất · lần chạy cuối **mỗi** job định kỳ.
- [ ] Nhóm **Backup**: dump gần nhất · verify gần nhất · DR drill gần nhất.
- [ ] `BR-SYS-06` ca âm: chưa có lần verify thành công nào → nhóm backup **cảnh báo mức cao**, và mục go-live tương ứng đỏ (`BR-BAK-06`).
- [ ] Nhóm **Lỗi**: 5xx 24h · lỗi client 24h · alert đang mở — đọc từ nguồn của P1.16, không đếm lại.
- [ ] `BR-SYS-03`: mỗi mục bất thường có **link runbook**, lấy từ `alerts.yml`.
- [ ] `BR-SYS-04` ca âm: response **không** chứa chuỗi kết nối, secret, hay biến môi trường.
- [ ] `D-KV` + `BR-SYS-02` cổng: quét lời gọi từ trang → **không** `POST` `PATCH` `PUT` `DELETE`; màn hình chỉ đọc.

**Kiểm chứng**
- [ ] `pnpm test -- system-activity` xanh, assertion tham chiếu `BR-SYS-01` `BR-SYS-04` `BR-SYS-06`.

**Phụ thuộc:** P0.8b · P1.5 · P1.16 · **Cỡ:** M

### Task 5 — Nối chéo và trả nợ

**Tiêu chí nghiệm thu**
- [ ] `BR-ALV-05`: mọi entity có audit (user, đơn, level, cờ, template, ảnh) có link **"xem lịch sử"** mở `/audit` đã lọc sẵn theo entity đó.
- [ ] Trả nợ P2.9: thẻ cờ trên `/flags` có link sang lịch sử đổi cờ trong `/audit`.
- [ ] `D-KU` ca dương: từ một hàng audit mở được lỗi cùng `request_id`, và ngược lại.
- [ ] Thẻ "cảnh báo hệ thống đang mở" trên dashboard P2.1 trỏ đúng `/system`.
- [ ] Không màn hình nào trong ba màn hình này hiện danh sách rỗng mà không nói lý do.

**Kiểm chứng**
- [ ] `pnpm test:e2e -- admin-cross-links` xanh.

**Phụ thuộc:** T1 · T3 · T4 · **Cỡ:** S

### Cổng dừng

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

### Task 6 — Evidence, promote và nợ chuyển tiếp

**Tiêu chí nghiệm thu**
- [ ] Mỗi `BR-ALV-*` `BR-ELV-*` `BR-SYS-*` có ít nhất một test tham chiếu mã rule.
- [ ] Ba spec sang `implemented`.
- [ ] §11 Q1 của [`audit-log-viewer.md`](../specs/06-admin/audit-log-viewer.md) (full-text index cho `reason`) — đóng: MVP dùng `ilike` **có thoát ký tự đại diện** cộng trần 90 ngày; full-text hoãn **P4**. Ghi ngưỡng đo lại: khi `audit_logs` vượt ~5 triệu hàng.
- [ ] §11 Q1 của [`error-log-viewer.md`](../specs/06-admin/error-log-viewer.md) đã đóng từ `D-CD` — xác nhận `error_log` là UI cho Manager, Sentry vẫn chạy song song cho alerting kỹ sư. Không mở lại.
- [ ] §11 Q1 của [`system-activity.md`](../specs/06-admin/system-activity.md) (thao tác vận hành từ màn hình) — đóng theo `D-KV`: **không** ở MVP.
- [ ] Nợ ghi sang **P4**: full-text index cho `reason`.
- [ ] Tick **P2.10** ở [`14-implementation-sequence-todo.md`](14-implementation-sequence-todo.md) khi `check:progress` tự xanh.

**Cỡ:** S

## 5. Rủi ro

| Rủi ro | Ảnh hưởng | Giảm thiểu |
|---|---|---|
| `audit_logs` sửa được | Nhật ký sửa được không phải bằng chứng — mất toàn bộ giá trị | `D-KR` — thu hồi quyền ở DB |
| Sampling làm ở server | Lỗi vòng lặp vẫn DDoS endpoint, chỉ là không ghi | `D-KS` — sampling ở client, rate limit lớp hai |
| Viết redactor thứ hai cho `error_log` | Hai bộ luật PII, bộ thứ hai sót | `D-KS` — dùng lại `D-IS` |
| "Không lấy được số liệu" render thành xanh | Người vận hành tin hệ thống khoẻ trong lúc nó không | `D-KT` — ba trạng thái ở tầng kiểu |
| Danh sách rỗng vì bộ lọc sai | Đọc thành "không có gì xảy ra" | T1 · T5 — luôn nói bộ lọc đang áp |
| Không có `request_id` xuyên suốt | Ba màn hình rời rạc, điều tra phải đoán | `D-KU` — gần như miễn phí nếu làm ngay |
| Nút retry job trên `/system` | Bề mặt rủi ro trên màn hình lướt nhanh | `D-KV` — chỉ đọc, cổng quét |
| Truy vấn audit không trần | Instance t3.small chết giữa lúc điều tra sự cố | `BR-ALV-03` — trần 200 + 90 ngày |
| `error_log` bị hiểu là thay Sentry | Mất kênh alerting cho kỹ sư | `D-CD` — hai thứ chạy song song |

## 6. Giả định

1. **P0.11 và P1.16 đã đóng** — audit ghi đủ, redactor PII chạy được.
2. **P2.1…P2.9 đã đóng** — có dữ liệu thật để ba màn hình này có ý nghĩa.
3. **Một `super_admin`** — không cần phân quyền chi tiết hơn cho ba màn hình.
4. **Sentry vẫn chạy** — `error_log` không thay nó.
5. **`audit_logs` chưa lớn** — `ilike` đủ ở MVP; ngưỡng đo lại ghi rõ ở T6.

## 7. Ngoài phạm vi

- Thao tác vận hành (retry job, chạy backup) từ admin — **không** ở MVP, `D-KV`.
- Full-text index cho `reason` — P4.
- Thay Sentry bằng `error_log` — **không bao giờ**; hai thứ khác mục đích.
- Alerting — thuộc P1.16; màn hình này là nơi **xác nhận sau khi nhận alert**.
- MFA cho User — P2.11.
- Dashboard BI và biểu đồ xu hướng — P4.
