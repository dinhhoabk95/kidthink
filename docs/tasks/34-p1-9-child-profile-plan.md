# Kế hoạch — Task #34: P1.9 — Hồ sơ trẻ, lưu trữ & chọn trẻ chơi

> Viết 2026-08-09. Bước sở hữu: **P1.9** của
> [`14-implementation-sequence-todo.md`](14-implementation-sequence-todo.md).
> Spec sở hữu: [`child-profile-crud.md`](../specs/03-account/child-profile-crud.md) ·
> [`child-profile-switching.md`](../specs/03-account/child-profile-switching.md) ·
> [`child-profile-archive.md`](../specs/03-account/child-profile-archive.md) ·
> [`play-entry-and-profile-select.md`](../specs/04-play/play-entry-and-profile-select.md).
>
> ```
> export PATH=/Users/macbook/.nvm/versions/node/v24.15.0/bin:$PATH
> ```

## Tóm tắt

Bốn spec, một chuỗi: **tạo** hồ sơ trẻ → **chọn** trẻ nào đang chơi → **lưu trữ/xoá** khi không
dùng nữa → **vào** khu vực chơi.

Hai ràng buộc chi phối cả bốn:

1. **Thu ít dữ liệu nhất có thể.** Form đúng **4 trường**, danh sách **đóng**. Không họ tên đầy
   đủ, không ngày sinh, không upload ảnh. Đây là ràng buộc pháp lý từ P0.4, không phải lựa chọn
   UX.
2. **Chọn sai trẻ không sửa ngược được.** Mastery đã cập nhật thì không tách ra được — nên đổi
   trẻ đi qua Parent Gate, và ownership kiểm ở **DB mỗi request**, không tin cookie.

Bước này cũng là chỗ bề mặt trẻ có **sảnh** đầu tiên: không chữ để đọc, không bộ lọc, không giá
tiền.

## 0. Điều kiện tiên quyết

| Dep | Trạng thái | Ghi chú |
|---|---|---|
| `CHILD-DATA-COMPLIANCE` | P0.4 | `BR-CDC-01/02/03/04/10/12`, cơ chế `consent_logs` |
| `ENTITLEMENT-MODEL` | P0.5 | quota `child_profiles` theo gói |
| `PARENT-GATE` | P1.8 | `gate_token` do server cấp (`D-GO`) |
| `ACCESS-GATING` | P1.3 | 428 khi chưa chọn trẻ |
| `ACTORS` | P0.3 đã xong | `BR-ACT-07` |
| `JOB-QUEUE` | P1.5 | `account:purge` cho xoá sau 30 ngày |

`D-BZ` đã gỡ cạnh ngược: **không** cần [`consent-management.md`](../specs/03-account/consent-management.md)
(P1.14) để **tạo** hồ sơ lần đầu — cơ chế gate + `consent_logs` thuộc P0.4.

## 1. Đo được

### 1.1 Đã có

Bảng `child_profiles` với ràng buộc từ P0.4/P0.7; `consent_logs`; Parent Gate và `gate_token`
(P1.8); gating trả 428 khi chưa chọn trẻ (P1.3); hạn mức mặc định theo gói (P1.8).

### 1.2 Chưa có

Form và route CRUD, cơ chế `active_child_id`, ba trạng thái hồ sơ, luồng xoá 30 ngày, và toàn
bộ sảnh trẻ `/play`.

### 1.3 Một mâu thuẫn trong spec, phải sửa ở bước này

[`play-entry-and-profile-select.md`](../specs/04-play/play-entry-and-profile-select.md) §5 và §9
viết lời mời đăng ký cho guest hiện **sau 3 lượt**, nhưng §11 Q1 đã đóng bằng `D-AY` với **5
lượt** (khớp [`access-ladder.md`](../specs/00-foundation/access-ladder.md) Q2). Hai số trong
cùng một file. Xử ở `D-GX`.

## 2. Quyết định

**D-GT — thứ tự trong bước: CRUD → switching → archive → play entry.** Mỗi bước dùng thứ bước
trước tạo ra: không có hồ sơ thì không chọn được, không chọn được thì `/play` không có ngữ cảnh,
và lưu trữ phải biết trẻ nào đang là `active_child_id` để xoá cookie trước.

**D-GU — danh sách đóng 4 trường ép ở **ba tầng**.** `BR-CPC-01` + `BR-CDC-01` nói danh sách
đóng. Một tầng là không đủ: Zod chặn request, nhưng seed hoặc migration vẫn thêm cột được. Ba
tầng: (1) Zod `.strict()` → 400 `CHILD_FIELD_NOT_ALLOWED`; (2) bảng `child_profiles` **không có
cột** cho dữ liệu bị cấm; (3) cổng quét schema + form, thêm trường mới là **đỏ** cho tới khi có
người phê duyệt. Đây là loại ràng buộc mà "nhớ đừng thêm" không đủ.

**D-GV — `POST /children/{uuid}/activate` có **một chủ duy nhất**, và cổng canh việc đó.** `D-BY`
đã chốt: cơ chế thuộc [`child-profile-switching.md`](../specs/03-account/child-profile-switching.md);
[`play-entry-and-profile-select.md`](../specs/04-play/play-entry-and-profile-select.md) **gọi
lại**. Cả hai spec đều mô tả route trong §8 — dễ dẫn tới hai handler. Cổng: đúng **một** định
nghĩa handler cho route đó trong toàn repo.

**D-GW — sảnh trẻ ở P1 **không có** mục "Gợi ý".** §7.2 liệt kê "Gợi ý 3–5 level" lấy từ
[`next-game-recommendation.md`](../specs/04-play/next-game-recommendation.md) — **P3.6**. Cùng lý
do với `D-GK`: heuristic tạm sẽ bị đọc như tính năng thật. P1 giao "Tiếp tục" + 6 thẻ
competency; mục gợi ý xuất hiện ở P3.6. Ghi nợ có địa chỉ.

**D-GX — lời mời đăng ký cho guest ở **5 lượt**; sửa hai chỗ còn ghi 3 trong spec.** `D-AY` là
quyết định sau và khớp ladder; §5 và §9 của spec là dấu vết của bản trước. Sửa spec trong PR đầu
của bước này (một dòng mỗi chỗ), không sửa im lặng trong code rồi để spec sai. Ràng buộc giữ
nguyên: lời mời hiện **sau khi chơi xong**, trên bề mặt người lớn (`BR-PEN-05`).

**D-GY — purge hồ sơ trẻ chạy **trong** job `account:purge`, không thêm job thứ 11.** Registry
P1.5 khai đúng 10 job và "thêm job mới" là **Ask first**. Purge trẻ cùng tính chất (phá huỷ),
cùng lịch (03:00 ICT), cùng chính sách retry (1 lần, fail → alert ngay). Mở rộng phạm vi của job
đã có, ghi rõ trong mô tả registry.

## 3. Đồ thị

```
T1 CRUD: 4 trường · danh sách đóng ba tầng · quota · age_band suy · consent
      └──→ T2 switching: activate một chủ · cookie không phải nguồn quyền · Parent Gate
                ├──→ T3 archive/restore/delete: 3 trạng thái · 30 ngày · ẩn danh telemetry
                └──→ T4 play entry: sảnh trẻ · guest allow-list · landscape lock
                          └──→ T5 cổng bề mặt trẻ mở rộng: không giá, không bộ lọc chữ
                              ── Cổng dừng ──
  T6 evidence, promote 4 spec
```

## 4. Task

### Task 1 — Tạo và sửa hồ sơ trẻ

**Tiêu chí nghiệm thu**
- [ ] Form đúng **4 trường** §7.1: `display_name` (1–40), `birth_year`, `avatar_id` (preset), `relationship` (tuỳ chọn).
- [ ] `BR-CPC-01` + `D-GU`: ba tầng chặn; `POST` kèm `full_name`/`school` → **400** `CHILD_FIELD_NOT_ALLOWED`.
- [ ] `BR-CPC-02`: nhãn ghi rõ **"Tên gọi ở nhà của bé"**; không hỏi họ tên đầy đủ.
- [ ] `BR-CPC-03`: **chỉ năm sinh**; ca âm — không ô ngày và tháng trong form.
- [ ] `BR-CPC-04`: avatar chỉ từ **12 preset SVG** (`D-AU`); ca âm — không `input[type=file]` cho avatar; sai preset → 400 `AVATAR_NOT_IN_PRESET`.
- [ ] `BR-CPC-05`: chưa đồng ý `child_data` → **428** `CONSENT_REQUIRED`; ghi `consent_logs` khi đồng ý.
- [ ] `BR-CPC-06`: form hiện đoạn giải thích những gì **không** thu thập (§7.1).
- [ ] `BR-CPC-07`: quota kiểm ở **server**; vượt → **402** `CHILD_LIMIT_EXCEEDED` + gói cần nâng.
- [ ] `BR-CPC-08`: `age_band` **suy tự động**; không ô nhập.
- [ ] `BR-CPC-10`: tuổi ngoài 3–6 → **422** `CHILD_AGE_OUT_OF_RANGE` **kèm giải thích**, không im lặng cắt.
- [ ] `BR-CPC-09`: `PATCH` hồ sơ của người khác → **404**.
- [ ] Chưa xác thực email → **403** (`BR-REG-04`).
- [ ] Sau khi tạo: `status = active`, `daily_play_cap_minutes` mặc định theo gói, **không** tự ghi danh curriculum.

**Kiểm chứng**
- [ ] `pnpm test -- child-crud` xanh, assertion tham chiếu `BR-CPC-01` `BR-CPC-05` `BR-CPC-07`.

**Phụ thuộc:** P0.4 · P1.8 · **Cỡ:** M

### Task 2 — Chọn và đổi trẻ

**Tiêu chí nghiệm thu**
- [ ] `POST /api/users/children/{uuid}/activate` — **một** định nghĩa handler trong repo (`D-GV`).
- [ ] `BR-CPS-01` / `BR-PEN-01`: đang có trẻ khác mà không kèm `gate_token` → **403** `PARENT_GATE_REQUIRED`.
- [ ] `BR-CPS-02` / `BR-PEN-02`: ownership kiểm ở **DB mỗi request**; ca âm cookie trỏ trẻ của user khác → **404**.
- [ ] `BR-CPS-03`: cookie **không phải nguồn quyền** — không HttpOnly, SameSite=Lax, 30 ngày, chỉ là ngữ cảnh.
- [ ] `BR-CPS-04`: đổi trẻ giữa phiên → phiên cũ `abandoned` (dùng đường P1.6).
- [ ] `BR-CPS-05`: trẻ `archived` → **404** khi activate.
- [ ] `BR-CPS-06`: bề mặt trẻ hiện **avatar + tên** trẻ đang hoạt động.
- [ ] `BR-CPS-07`: lần đầu **phải chọn tường minh**, kể cả khi chỉ có một trẻ; sau đó nhớ 30 ngày.
- [ ] `DELETE /api/users/children/active` xoá cookie.

**Kiểm chứng**
- [ ] `pnpm test -- child-switching` xanh, assertion tham chiếu `BR-CPS-01` `BR-CPS-02` `BR-CPS-04`.

**Phụ thuộc:** T1 · **Cỡ:** M

### Task 3 — Lưu trữ, khôi phục, xoá

**Tiêu chí nghiệm thu**
- [ ] Ba trạng thái §7.1 đúng: `active` · `archived` (không chơi, không tính quota, dữ liệu nguyên) · `pending_deletion` (đếm ngược).
- [ ] `BR-CPR-01`: lưu trữ **giữ nguyên** dữ liệu; ca âm — 50 phiên chơi, số hàng không đổi.
- [ ] `BR-CPR-02`: lưu trữ **giải phóng quota**; khôi phục khi hết quota → **402**.
- [ ] `BR-CPR-08`: lưu trữ **không cần** Parent Gate; xoá **cần mật khẩu**.
- [ ] `BR-CPR-04`: xoá xác nhận bằng **gõ tên trẻ**; `confirm_name` sai → **422**; mật khẩu sai → 401.
- [ ] `BR-CPR-03`: xoá thật sau **30 ngày**; huỷ trong 30 ngày → khôi phục hoàn toàn về `archived`.
- [ ] `BR-CPR-05`: purge → `UPDATE telemetry_events SET child_uuid = NULL`, **không** xoá cứng; các bảng khác xoá theo §7.2.
- [ ] `BR-CPR-06`: ca âm quét route admin — **không** route nào `DELETE child_profiles`.
- [ ] `BR-CPR-07`: trẻ `archived` **vẫn xem được báo cáo**, chế độ chỉ đọc.
- [ ] Trẻ đang là `active_child_id` → **xoá cookie trước** khi lưu trữ.
- [ ] Purge chạy trong job `account:purge` (`D-GY`), idempotent, fail → alert ngay.

**Kiểm chứng**
- [ ] `pnpm test -- child-archive` xanh, assertion tham chiếu `BR-CPR-02` `BR-CPR-05` `BR-CPR-06`.

**Phụ thuộc:** T2 · P1.5 · **Cỡ:** M

### Task 4 — Vào khu vực chơi

**Tiêu chí nghiệm thu**
- [ ] `/play` sảnh trẻ §7.2: avatar trẻ · "Tiếp tục" · 6 thẻ competency. **Không** mục "Gợi ý" ở P1 (`D-GW`).
- [ ] `BR-PEN-03`: **không** input tìm kiếm, **không** dropdown bộ lọc, không danh sách dài phải cuộn nhiều.
- [ ] `BR-PEN-04`: ca âm quét `pages/play` — không giá, tên gói, hay nút nâng cấp (dùng lại cổng `D-GQ` của P1.8).
- [ ] `BR-PEN-06`: nội dung khoá hiện **ổ khoá trung tính**, không số tiền.
- [ ] `BR-PEN-05` + `D-GX`: guest — allow-list game `free`, lời mời đăng ký sau **5 lượt** (`D-AY`), hiện ở **màn hình tổng kết**, không giữa lúc chơi.
- [ ] `BR-PEN-07`: `/play` **landscape-locked** trên tablet.
- [ ] User chưa có trẻ → chuyển `/me/children/new`; chưa chọn trẻ mà vào `/play/{code}` bậc ≥ `login` → **428** → màn hình chọn trẻ.
- [ ] Cookie trỏ trẻ đã archive → xoá cookie, yêu cầu chọn lại.
- [ ] `GET /api/users/play/home` trả sảnh **đã lọc** theo quyền và tuổi.
- [ ] `D-DC`: sảnh ưu tiên nội dung mở được; tab "tất cả" hiện ổ khoá trung tính.

**Kiểm chứng**
- [ ] `pnpm test:e2e -- play-entry` xanh, assertion tham chiếu `BR-PEN-03` `BR-PEN-05` `BR-PEN-06`.

**Phụ thuộc:** T2 · **Cỡ:** M

### Task 5 — Sửa spec và mở rộng cổng bề mặt trẻ

**Tiêu chí nghiệm thu**
- [ ] Sửa §5 và §9 của [`play-entry-and-profile-select.md`](../specs/04-play/play-entry-and-profile-select.md): 3 lượt → **5 lượt**, ghi `D-GX` (`D-GX`).
- [ ] Thêm rule vào cổng `lint:kid-surface` của P1.8: không bộ lọc chữ trong catalog trẻ; không giá tiền; ổ khoá trung tính.
- [ ] Mỗi rule mới có ca âm.
- [ ] `pnpm --filter @mindkid/gates test` xanh sau khi sửa spec.

**Kiểm chứng**
- [ ] `pnpm --filter @mindkid/gates test` đỏ trên fixture có input tìm kiếm dưới `pages/play`.

**Phụ thuộc:** T4 · **Cỡ:** S

### Cổng dừng

- [ ] Tạo hồ sơ chỉ hỏi 4 trường; thêm trường thứ 5 làm cổng đỏ ở cả ba tầng.
- [ ] Sửa cookie `active_child_id` không mở được dữ liệu trẻ khác.
- [ ] Đổi trẻ không có `gate_token` → 403; đổi giữa phiên → phiên cũ `abandoned`.
- [ ] Lưu trữ giữ nguyên dữ liệu và giải phóng quota; xoá có 30 ngày hoàn tác; telemetry còn hàng với `child_uuid` NULL.
- [ ] `/play` không có chữ để đọc, không bộ lọc, không giá tiền.
- [ ] `pnpm check && pnpm test && pnpm test:e2e && pnpm --filter @mindkid/gates test && node packages/gates/scripts/check-progress.ts` xanh.
- [ ] Human review — vùng **dữ liệu trẻ em**, không auto-merge.

### Task 6 — Evidence và promote

**Tiêu chí nghiệm thu**
- [ ] Mỗi `BR-CPC-*` `BR-CPS-*` `BR-CPR-*` `BR-PEN-*` có ít nhất một test tham chiếu mã rule.
- [ ] Bốn spec sang `implemented`.
- [ ] Nợ mục "Gợi ý" ở sảnh trẻ ghi sang **P3.6** (`D-GW`).
- [ ] §11 Q1 của switching (PIN riêng cho từng trẻ) giữ nguyên cho **P4**.
- [ ] Tick **P1.9** ở [`14-implementation-sequence-todo.md`](14-implementation-sequence-todo.md) khi `check:progress` tự xanh.

**Cỡ:** S

## 5. Rủi ro

| Rủi ro | Ảnh hưởng | Giảm thiểu |
|---|---|---|
| Thêm một trường "tiện" vào form trẻ | Vi phạm danh sách đóng — ràng buộc pháp lý, không phải UX | `D-GU` — ba tầng, cổng đỏ |
| Tin cookie `active_child_id` | Đọc và ghi dữ liệu trẻ của người khác | `BR-CPS-02` — DB mỗi request, ca âm |
| Trẻ tự đổi hồ sơ | Hỏng dữ liệu học của cả hai trẻ, không tách ra được | `BR-CPS-01` — Parent Gate |
| Hai handler cho `activate` | Hai luật, một chỗ quên Parent Gate | `D-GV` — cổng đếm định nghĩa |
| Xoá cứng telemetry | Mất dữ liệu phân tích, và vẫn không đúng nghĩa vụ | `BR-CPR-05` — ẩn danh |
| Lưu trữ không giải phóng quota | Lưu trữ vô nghĩa với người tới hạn | `BR-CPR-02` — ca âm tạo trẻ mới sau khi lưu trữ |
| Sảnh trẻ có heuristic gợi ý tạm | Bị đọc như tính năng, khó gỡ ở P3.6 | `D-GW` — ẩn mục |
| Số lượt guest lệch giữa spec và code | Hai nguồn sự thật | `D-GX` — sửa spec trong PR đầu |

## 6. Giả định

1. **P1.8 đã đóng** — Parent Gate và `gate_token` server-issued.
2. **P0.4 đã đóng** — `consent_logs` và ràng buộc dữ liệu trẻ.
3. **12 avatar preset SVG** đã có từ UI Designer (`D-AU`).
4. **Trẻ sang 7 tuổi**: để phụ huynh quyết định, **không** tự động archive (`D-CX`).
5. **Curriculum chưa tồn tại** — tạo hồ sơ không ghi danh gì.
6. **Báo cáo ở P1.12** — trẻ `archived` xem báo cáo là ràng buộc, màn hình thật ở bước sau.

## 7. Ngoài phạm vi

- Báo cáo và trang chính phụ huynh — P1.12.
- Cài đặt tài khoản, đồng ý pháp lý tự phục vụ, xoá tài khoản — P1.14.
- Gợi ý game kế tiếp trong sảnh trẻ — P3.6.
- PIN riêng cho từng trẻ — P4.
- Quản trị hồ sơ trẻ phía admin — P2.2.
