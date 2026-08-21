# Kế hoạch — Task #43: P2.1 — Admin shell và bảng điều khiển vận hành

> Viết 2026-08-10. Bước sở hữu: **P2.1** của
> [`14-implementation-sequence-todo.md`](14-implementation-sequence-todo.md) — bước **đầu** của P2.
> Spec sở hữu: [`admin-dashboard.md`](../specs/06-admin/admin-dashboard.md).
>
> ```
> export PATH=/Users/macbook/.nvm/versions/node/v24.15.0/bin:$PATH
> ```

## Tóm tắt

P2 có 10 bước sau bước này và **chín trong số đó là một màn hình admin**. Bước này quyết định
chín màn hình đó sống trong cái khung nào. Làm sai thứ tự — dựng dashboard trước, để mỗi trang
tự mọc chrome — thì tới P2.10 sẽ có mười biến thể nav và không ai gỡ được nữa.

Hai việc, một bước:

1. **Shell.** Layout, điều hướng, menu theo role, breadcrumb, trạng thái rỗng, trạng thái lỗi.
   Đây là nợ mà [`42-p1-16-taxonomy-browser-monitoring-plan.md`](42-p1-16-taxonomy-browser-monitoring-plan.md)
   `D-IV` ghi sang: P1.16 cố tình dựng trang taxonomy với chrome tối thiểu để **không** phải gỡ
   một shell mọc dại. Bước này trả nợ đó.
2. **Dashboard.** Màn hình trả lời "hôm nay phải làm gì". Nhưng ở đầu P2, phần lớn nguồn dữ liệu
   của nó **chưa tồn tại**: đơn thanh toán là P2.3, nội dung chờ duyệt là P2.8, lesson và tuần
   curriculum là P3, chi phí LLM là P4. Đó là vấn đề trung tâm của bước này, không phải chi tiết.

## 0. Điều kiện tiên quyết

| Dep | Trạng thái | Ghi chú |
|---|---|---|
| `ADMIN-AUTH` | P0.11b | `requireManagerAuth()`, hai role `super_admin` · `content_reviewer`, TOTP |
| `TELEMETRY-PIPELINE` | P1.5 | bảng rollup — nguồn duy nhất hợp lệ của dashboard |
| `AUDIT-LOG` | P0.11 | shell không ghi audit, nhưng mọi trang admin sau này ghi |
| `MONITORING-AND-ALERTING` | P1.16 | `alerts.yml`, danh sách alert đang mở → thẻ §7.1 |
| Trang taxonomy | P1.16 | đang chạy dưới layout tối thiểu, chờ re-host |
| Trang legal consent | P1.14 revision | `/legal-consents` tối thiểu, chỉ `super_admin`, chờ nav/shell chuẩn |
| `DESIGN-SYSTEM-CONTRACT` | P1.1 | token và component — shell không phát minh token mới |

## 1. Đo được

### 1.1 Đã có

`apps/admin` với đăng nhập Manager và một layout tối thiểu; trang taxonomy và legal consent;
hai role phân biệt được ở server;
bảng rollup của P1.5; `GET /api/managers/system/metrics` và danh sách alert đang mở của P1.16;
token thiết kế của P1.1.

### 1.2 Chưa có

Layout thật với nav theo role; breadcrumb; trạng thái rỗng/lỗi dùng chung; registry thẻ KPI;
`GET /api/managers/dashboard`; và **nguồn dữ liệu** cho 8 trong 16 thẻ của §7.

### 1.3 Đã chốt, không mở lại

`D-IV` shell thuộc P2.1 chứ không phải P1.16 · `BR-TLM-01` dashboard đọc rollup ·
`BR-CDC-14` không hiện dữ liệu học tập của một trẻ cụ thể ở bề mặt vận hành ·
`D-IR` mẫu "khai đủ, đánh dấu chưa có nguồn, để cổng canh" — bước này dùng lại nguyên mẫu đó.

## 2. Quyết định

**D-IW — Shell là **một** layout, và P2.1 re-host trang taxonomy cùng legal consent vào nó.** Chín bước sau đều
thêm trang vào `apps/admin`. Nếu shell không xong trước, mỗi bước tự dựng nav của mình và tới
P2.10 việc gỡ là mười lần sửa. Xử: `apps/admin/layouts/manager.vue` sở hữu nav, breadcrumb,
menu theo role, trạng thái rỗng và trạng thái lỗi; trang taxonomy của P1.16 và legal consent
của P1.14 chuyển sang layout này trong **cùng** PR. Cổng: mọi trang dưới `apps/admin/pages/`
dùng layout `manager`; trang
định nghĩa nav riêng → **đỏ**.

**D-IX — Danh sách thẻ và ngưỡng là **dữ liệu**, và thẻ chưa có nguồn khai `pending_source`.**
Spec `owns` đúng hai thứ: danh sách KPI và ngưỡng cảnh báo. Hai thứ đó nằm rải trong template
là hai thứ không ai đọc lại được. Xử: `packages/config/src/dashboard-cards.ts` khai mỗi thẻ với
`id` · `group` · `source` · `threshold` · `href` · `roles`. Thẻ chưa có nguồn khai
`pending_source: "P2.3"` (đơn thanh toán, doanh thu) · `"P2.8"` (nội dung chờ duyệt) ·
`"P3.1"` (lesson published) · `"P3.3"` (tuần curriculum chưa đủ hoạt động) · `"P4"` (chi phí
LLM). Thẻ `pending_source` hiện **"chưa có nguồn — bước Px.y"**, không hiện `0`. Cổng: thẻ có
`pending_source` mà API trả số → **đỏ**; thẻ không có `href` → **đỏ** (`BR-DSH-02`).

**D-IY — Lọc theo role ở **server**, không ẩn ở UI.** `BR-DSH-06` nói `content_reviewer` không
thấy số liệu tiền và User. Ẩn bằng `v-if` là dữ liệu vẫn nằm trong response và vẫn đọc được ở
tab Network. Xử: handler dựng payload theo role; với `content_reviewer` response **không chứa
khoá** `growth`, `system`, và không chứa thẻ tiền trong nhóm việc cần làm. Ca âm: gọi API bằng token
`content_reviewer`, so khớp khoá cấp cao nhất — chỉ `as_of` và `content`.

**D-IZ — Rollup là nguồn **duy nhất**; không có rollup thì `pending_source`, không có đường
vòng.** `BR-DSH-03` cấm quét `telemetry_events`. Cám dỗ thật nằm ở chỗ khác: một thẻ chưa có
rollup, và một truy vấn `COUNT(*)` trên bảng thô "tạm thời" chạy đúng ở dữ liệu MVP. Nó sẽ
không tạm thời. Xử: thẻ nào chưa có rollup thì khai `pending_source` kèm bước sẽ dựng rollup đó.
Cổng: quét mã nguồn phục vụ dashboard — xuất hiện `telemetry_events`, `play_events`, hay
`play_sessions` → **đỏ**.

**D-JA — Read-only bằng **cổng quét**, không bằng kỷ luật; và MVP không có biểu đồ.**
`BR-DSH-01` cấm mutation từ dashboard. Một quy tắc mà cách kiểm là "nhớ đừng làm" là quy tắc sẽ
bị vi phạm ở lần thêm nút thứ ba. Xử: test quét mọi lời gọi phát ra từ cây component dashboard;
xuất hiện `POST` `PATCH` `PUT` `DELETE` → **đỏ**. §11 Q2 chốt theo đề xuất của spec: MVP dùng
**chỉ số + mũi tên so kỳ trước**, biểu đồ xu hướng hoãn sang P4 — biểu đồ kéo theo thư viện,
kéo theo ngân sách hiệu năng, và không đổi được quyết định nào của người vận hành hôm nay.

## 3. Đồ thị

```
T1 shell: layout · nav theo role · breadcrumb · rỗng/lỗi (D-IW)
      ├──→ T2 re-host trang taxonomy P1.16 + legal consent P1.14 vào shell (D-IW, trả nợ)
      └──→ T3 registry dashboard-cards + pending_source (D-IX)
                └──→ T4 GET /api/managers/dashboard: rollup · as_of · lọc role (D-IY, D-IZ)
                          └──→ T5 UI bốn nhóm thẻ · link hành động · read-only (D-JA)
                                        ── Cổng dừng ──
                                              T6 evidence, promote, nợ sang bước sau
```

## 4. Task

### Task 1 — Admin shell

**Tiêu chí nghiệm thu**
- [ ] `apps/admin/layouts/manager.vue`: nav dọc, header có danh tính Manager và nút đăng xuất, vùng nội dung, breadcrumb.
- [ ] Menu dựng từ **một** khai báo có `roles`; `content_reviewer` không thấy mục tiền, User, hệ thống.
- [ ] Trạng thái dùng chung: đang tải · rỗng · lỗi · 403. Bốn thứ này là component, không phải mỗi trang tự viết.
- [ ] `D-IW` cổng: mọi trang dưới `apps/admin/pages/` dùng layout `manager`; trang tự định nghĩa nav → **đỏ**.
- [ ] Token và component lấy từ [`design-system-contract.md`](../specs/08-quality/design-system-contract.md); shell **không** thêm token mới.
- [ ] Bàn phím đi hết nav được; focus nhìn thấy được — [`accessibility.md`](../specs/08-quality/accessibility.md).
- [ ] Hết phiên → về màn đăng nhập kèm `redirect_to`, không rơi vào trang trắng.

**Kiểm chứng**
- [ ] `pnpm --filter @mindkid/admin test -- manager-layout` xanh.

**Phụ thuộc:** P0.11b · P1.1 · **Cỡ:** M

### Task 2 — Re-host trang P1 (trả nợ P1.14 và P1.16)

**Tiêu chí nghiệm thu**
- [ ] Cây taxonomy và chi tiết skill chạy dưới layout `manager`, vào được từ nav.
- [ ] `/legal-consents` chạy dưới layout `manager`; nav chỉ hiện cho `super_admin`, nhưng server
      guard vẫn là nguồn quyền.
- [ ] Chrome tối thiểu mà `D-IV` dựng tạm bị **xoá**, không để lại hai đường vào cùng một trang.
- [ ] Chrome tối thiểu của trang force cũng bị xoá; hành vi recent reauth/audit không đổi.
- [ ] Mọi ca âm của P1.16 còn xanh: không route ghi dưới `/api/managers/taxonomy`; `as_of` còn cạnh số; ngưỡng "đủ" vẫn là **3**.
- [ ] Nút "soạn level cho skill này" vẫn không dẫn tới 404 — vẫn trỏ seeder cho tới khi P2.6 đổi.

**Kiểm chứng**
- [ ] `pnpm test -- taxonomy-browser` xanh **không sửa assertion** — chỉ đổi vỏ, không đổi hành vi.

**Phụ thuộc:** T1 · **Cỡ:** S

### Task 3 — Registry thẻ KPI và ngưỡng

**Tiêu chí nghiệm thu**
- [ ] `packages/config/src/dashboard-cards.ts` khai đủ 16 thẻ của §7, mỗi thẻ có `id` · `group` · `source` · `threshold` · `href` · `roles`.
- [ ] Ba thẻ §7.1 đúng ngưỡng: đơn chờ duyệt **> 20 hoặc cũ nhất > 24h** · nội dung chờ duyệt **> 50** · alert đang mở **≥ 1**.
- [ ] `D-IX`: năm nhóm `pending_source` khai đúng bước sở hữu — P2.3 · P2.8 · P3.1 · P3.3 · P4.
- [ ] `BR-DSH-02` cổng: thẻ thiếu `href` → **đỏ**.
- [ ] `D-IX` ca âm: đặt `pending_source` cho một thẻ rồi để API trả số → **đỏ**.
- [ ] Ba thẻ phản hồi biên soạn (§7.3: skill chưa có level · level tỉ lệ bỏ > 40% · tuần curriculum thiếu) đứng **trên** ba thẻ đếm — spec nói rõ chúng quan trọng hơn.
- [ ] Đổi ngưỡng là đổi **một** file; grep số ngưỡng ngoài registry → **đỏ**.

**Kiểm chứng**
- [ ] `pnpm test -- dashboard-cards` xanh, in ra "16/16 thẻ có href; 5 thẻ pending_source".

**Phụ thuộc:** T1 · **Cỡ:** S

### Task 4 — `GET /api/managers/dashboard`

**Tiêu chí nghiệm thu**
- [ ] `requireManagerAuth()`; không có phiên → **401**.
- [ ] `D-IY` ca âm: token `content_reviewer` → response chỉ có khoá `as_of` và `content`; **không** có `growth`, `system`, và không có thẻ tiền trong nhóm việc cần làm.
- [ ] `D-IZ` + `BR-DSH-03` cổng: mã nguồn phục vụ endpoint này không chứa `telemetry_events` · `play_events` · `play_sessions`.
- [ ] `BR-DSH-04`: `as_of` là thời điểm rollup, không phải `now()`; ca âm — rollup chạy 02:00, gọi lúc 09:00 → trả **02:00**.
- [ ] `BR-DSH-05` ca âm: response không chứa tên trẻ, `child_uuid`, mastery, hay lịch sử chơi của cá nhân nào.
- [ ] Thẻ `pending_source` trả `{ status: "pending_source", owner_step: "P2.3" }`, **không** trả `0`.
- [ ] Thẻ alert đang mở lấy từ nguồn của P1.16, không đếm lại từ log.
- [ ] Hiệu năng §9: dữ liệu quy mô MVP, gọi 50 lần → **P95 < 500 ms**.

**Kiểm chứng**
- [ ] `pnpm test -- dashboard-api` xanh, assertion tham chiếu `BR-DSH-03` `BR-DSH-04` `BR-DSH-05` `BR-DSH-06`.

**Phụ thuộc:** T3 · P1.5 · P1.16 · **Cỡ:** M

### Task 5 — Màn hình dashboard

**Tiêu chí nghiệm thu**
- [ ] Bốn nhóm §7 đúng thứ tự: việc cần làm trên cùng · tăng trưởng · nội dung · hệ thống.
- [ ] `BR-DSH-02`: mỗi thẻ nhóm "việc cần làm" có link tới trang xử lý; link tới bước chưa làm hiện disabled kèm nhãn bước, **không** 404.
- [ ] `BR-DSH-01` + `D-JA` cổng: quét lời gọi API phát từ cây component dashboard — không `POST` `PATCH` `PUT` `DELETE`.
- [ ] Thẻ vượt ngưỡng đổi màu cảnh báo; màu **không** phải kênh thông tin duy nhất (kèm nhãn chữ) — [`accessibility.md`](../specs/08-quality/accessibility.md).
- [ ] Chưa có dữ liệu → hiện "chưa có dữ liệu"; **cấm** hiện `0` (§5).
- [ ] `as_of` hiện ở đầu trang, một chỗ, không lặp mỗi thẻ.
- [ ] `D-JA`: mỗi thẻ tăng trưởng có mũi tên so kỳ trước; **không** biểu đồ.
- [ ] Manager đăng nhập → landing là dashboard (§4.1).

**Kiểm chứng**
- [ ] `pnpm --filter @mindkid/admin test -- dashboard-view` xanh · `pnpm test:e2e -- admin-dashboard` xanh.

**Phụ thuộc:** T4 · **Cỡ:** M

### Cổng dừng

- [ ] Manager đăng nhập → dashboard → bấm một thẻ → tới đúng trang xử lý.
- [ ] `content_reviewer` đăng nhập: response API **không chứa** khoá tiền; nav không có mục tiền.
- [ ] Không truy vấn nào của dashboard chạm bảng thô.
- [ ] Không lời gọi mutation nào phát ra từ dashboard.
- [ ] Trang taxonomy P1.16 và legal consent P1.14 chạy trong shell; test hành vi cũ xanh không sửa assertion.
- [ ] `pnpm check && pnpm test && pnpm test:e2e && pnpm --filter @mindkid/gates test && node packages/gates/scripts/check-progress.ts` xanh.

### Task 6 — Evidence, promote và nợ chuyển tiếp

**Tiêu chí nghiệm thu**
- [ ] Mỗi `BR-DSH-*` có ít nhất một test tham chiếu mã rule.
- [ ] [`admin-dashboard.md`](../specs/06-admin/admin-dashboard.md) sang `implemented`.
- [ ] §11 Q1 (doanh thu tháng tính theo đơn `approved` hay theo ngày hiệu lực entitlement) — áp **đề xuất chốt của spec**: theo ngày đơn được `approved`, khớp `BR-PAY-03`; nêu cho chủ xác nhận. Thẻ vẫn `pending_source: P2.3` nên câu này **không chặn** bước này.
- [ ] §11 Q2 (biểu đồ xu hướng ở MVP) — đóng theo `D-JA`: chỉ số + mũi tên, biểu đồ sang P4.
- [ ] Nợ ghi sang **P2.3**: bật nguồn hai thẻ tiền · **P2.8**: bật thẻ nội dung chờ duyệt · **P2.6**: đổi nút soạn của trang taxonomy sang studio · **P3.1/P3.3**: bật thẻ lesson và tuần curriculum.
- [ ] Tick **P2.1** ở [`14-implementation-sequence-todo.md`](14-implementation-sequence-todo.md) khi `check:progress` tự xanh.

**Cỡ:** S

## 5. Rủi ro

| Rủi ro | Ảnh hưởng | Giảm thiểu |
|---|---|---|
| Mỗi trang admin tự dựng nav | Tới P2.10 có mười biến thể, gỡ là mười lần sửa | `D-IW` — cổng layout bắt buộc |
| Thẻ chưa có nguồn hiện `0` | Người vận hành tin "không có đơn nào chờ" trong lúc chưa có bảng đơn | `D-IX` — `pending_source`, cấm `0` |
| Truy vấn bảng thô "tạm thời" cho thẻ thiếu rollup | Chạy đúng ở MVP, chết ở quy mô thật; và tạm thời thì vĩnh viễn | `D-IZ` — cổng quét tên bảng |
| Ẩn dữ liệu tiền bằng `v-if` | `content_reviewer` vẫn đọc được ở tab Network | `D-IY` — lọc ở server, ca âm so khoá |
| Thêm nút hành động lên dashboard | Bấm nhầm ở chỗ dễ bấm nhầm nhất | `D-JA` — cổng quét mutation |
| Ngưỡng rải trong template | Đổi ngưỡng thành đi tìm | `D-IX` — registry một file |
| Dashboard chậm vì gom 16 thẻ | Trang đầu tiên sau đăng nhập là trang chậm nhất | §9 — P95 < 500 ms có test |

## 6. Giả định

1. **P1 đã đóng** — rollup của P1.5 và alert của P1.16 chạy được.
2. **Chưa có thanh toán, chưa có hàng duyệt nội dung** — 5 thẻ khai `pending_source`.
3. **Hai role, không hơn** — `super_admin` và `content_reviewer` theo P0.11b; không thêm role ở bước này.
4. **Chưa cần biểu đồ** — quyết định `D-JA`, mở lại được ở P4 nếu người vận hành đòi.
5. **Rollup chạy hằng ngày** — `as_of` lệch tới 24 giờ là hành vi đúng, không phải lỗi.

## 7. Ngoài phạm vi

- Quản lý User và mọi mutation trên tài khoản — P2.2.
- Hàng đợi thanh toán và duyệt đơn — P2.3.
- Hàng duyệt nội dung — P2.8.
- Màn hình nhật ký audit, lỗi, hoạt động hệ thống — P2.10.
- Biểu đồ xu hướng và BI — P4 trở đi, theo `D-JA`.
- Thêm role Manager mới — không thuộc P2; chủ là [`actors.md`](../specs/00-foundation/actors.md).
