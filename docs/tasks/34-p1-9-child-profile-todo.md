# Checklist — Task #34: P1.9 — Hồ sơ trẻ, lưu trữ & chọn trẻ chơi

> Kế hoạch: [`34-p1-9-child-profile-plan.md`](34-p1-9-child-profile-plan.md).
> Vùng **dữ liệu trẻ em** — human review diff, không auto-merge.
> Thứ tự: CRUD → switching → archive → play entry (`D-GT`).
>
> ```
> export PATH=/Users/macbook/.nvm/versions/node/v24.15.0/bin:$PATH
> ```

## Preflight

- [x] **P1.8 đã đóng** — Parent Gate + `gate_token` do server cấp.
- [x] **P0.4 đã đóng** — `consent_logs`, ràng buộc dữ liệu trẻ.
- [x] **12 avatar preset SVG** đã có (`D-AU`).
- [x] Human approve kế hoạch và sáu quyết định D-GT · D-GU · D-GV · D-GW · D-GX · D-GY.
- [x] Đối chiếu `BR-CPC-*` `BR-CPS-*` `BR-CPR-*` `BR-PEN-*` với [`business-rules.md`](../specs/00-foundation/business-rules.md).
- [x] Tạo nhánh riêng.

---

### Task 1 — Tạo và sửa hồ sơ trẻ

- [x] Form đúng **4 trường**: `display_name` · `birth_year` · `avatar_id` · `relationship`.
- [x] Tầng 1: Zod `.strict()` → 400 `CHILD_FIELD_NOT_ALLOWED`.
- [x] Tầng 2: bảng `child_profiles` **không có cột** cho dữ liệu bị cấm.
- [x] Tầng 3: cổng quét schema + form; thêm trường mới → đỏ.
- [x] `BR-CPC-02` nhãn "Tên gọi ở nhà của bé".
- [x] `BR-CPC-03` ca âm: form **không** có ô ngày và tháng.
- [x] `BR-CPC-04` ca âm: không `input[type=file]`; sai preset → 400 `AVATAR_NOT_IN_PRESET`.
- [x] `BR-CPC-05` chưa đồng ý → **428** `CONSENT_REQUIRED`; đồng ý → ghi `consent_logs`.
- [x] `BR-CPC-06` form có đoạn giải thích những gì **không** thu thập.
- [x] `BR-CPC-07` quota ở server; vượt → **402** + gói cần nâng.
- [x] `BR-CPC-08` `age_band` suy tự động; không ô nhập.
- [x] `BR-CPC-10` tuổi ngoài 3–6 → **422** kèm giải thích.
- [x] `BR-CPC-09` `PATCH` hồ sơ người khác → **404**.
- [x] Chưa xác thực email → **403**.
- [x] Sau khi tạo: `status = active`, cap mặc định theo gói, **không** ghi danh curriculum.

### Task 2 — Chọn và đổi trẻ

- [x] `POST /children/{uuid}/activate` — **một** handler duy nhất trong repo (`D-GV`).
- [x] `BR-CPS-01` đổi trẻ thiếu `gate_token` → **403** `PARENT_GATE_REQUIRED`.
- [x] `BR-CPS-02` ownership kiểm ở DB **mỗi request**.
- [x] Ca âm: cookie trỏ trẻ user khác → **404**.
- [x] `BR-CPS-03` cookie không HttpOnly · SameSite=Lax · 30 ngày · không phải nguồn quyền.
- [x] `BR-CPS-04` đổi trẻ giữa phiên → phiên cũ `abandoned`.
- [x] `BR-CPS-05` trẻ `archived` → 404 khi activate.
- [x] `BR-CPS-06` bề mặt trẻ hiện avatar + tên trẻ đang hoạt động.
- [x] `BR-CPS-07` lần đầu chọn tường minh kể cả khi chỉ có một trẻ.
- [x] `DELETE /api/users/children/active` xoá cookie.

### Task 3 — Lưu trữ, khôi phục, xoá

- [x] Ba trạng thái: `active` · `archived` · `pending_deletion`.
- [x] `BR-CPR-01` ca âm: 50 phiên chơi, lưu trữ xong số hàng không đổi.
- [x] `BR-CPR-02` lưu trữ giải phóng quota → tạo được trẻ mới.
- [x] Khôi phục khi hết quota → **402**.
- [x] `BR-CPR-08` lưu trữ **không** cần Parent Gate.
- [x] `BR-CPR-08` xoá **cần mật khẩu**; sai → 401.
- [x] `BR-CPR-04` `confirm_name` sai → **422**.
- [x] `BR-CPR-03` xoá thật sau **30 ngày**; huỷ trong hạn → về `archived`, dữ liệu nguyên.
- [x] `BR-CPR-05` purge → `telemetry_events.child_uuid = NULL`, không xoá cứng.
- [x] Purge xoá đúng phạm vi §7.2 (mastery · level_params · play_sessions · summaries · daily_stats · enrollments · item_progress).
- [x] `BR-CPR-06` ca âm: không route admin nào `DELETE child_profiles`.
- [x] `BR-CPR-07` trẻ `archived` vẫn xem được báo cáo (chỉ đọc).
- [x] Trẻ đang active → xoá cookie trước khi lưu trữ.
- [x] Purge chạy trong job `account:purge` (`D-GY`), idempotent, fail → alert ngay.

### Task 4 — Vào khu vực chơi

- [x] Sảnh `/play`: avatar trẻ · "Tiếp tục" · 6 thẻ competency.
- [x] **Không** mục "Gợi ý" ở P1 (`D-GW`).
- [x] `BR-PEN-03` không input tìm kiếm, không dropdown bộ lọc.
- [x] `BR-PEN-04` ca âm: không giá / gói / nút nâng cấp dưới `pages/play`.
- [x] `BR-PEN-06` nội dung khoá → ổ khoá trung tính, không số tiền.
- [x] `BR-PEN-05` guest: allow-list game `free`.
- [x] Lời mời đăng ký sau **5 lượt** (`D-AY`, `D-GX`), hiện ở màn hình tổng kết.
- [x] Ca âm: không lời mời nào hiện **giữa** lượt chơi.
- [x] `BR-PEN-07` `/play` landscape-locked trên tablet.
- [x] Chưa có trẻ → chuyển `/me/children/new`.
- [x] Chưa chọn trẻ + bậc ≥ `login` → **428** → màn hình chọn trẻ.
- [x] Cookie trỏ trẻ archived → xoá cookie, chọn lại.
- [x] `GET /api/users/play/home` trả sảnh đã lọc quyền và tuổi.

### Task 5 — Sửa spec và mở rộng cổng

- [x] Sửa §5 của play-entry: 3 lượt → **5 lượt**, ghi `D-GX`.
- [x] Sửa §9 của play-entry: scenario "lượt thứ 3" → **lượt thứ 5**.
- [x] Thêm rule `lint:kid-surface`: không bộ lọc chữ trong catalog trẻ.
- [x] Thêm rule: không giá tiền trên bề mặt trẻ.
- [x] Mỗi rule mới có ca âm.
- [x] `pnpm --filter @mindkid/gates test` xanh sau khi sửa spec.

## Cổng dừng

- [x] Thêm trường thứ 5 vào hồ sơ trẻ → cổng đỏ ở **cả ba tầng**.
- [x] Sửa cookie không mở được dữ liệu trẻ khác.
- [x] Đổi trẻ thiếu gate → 403; đổi giữa phiên → phiên cũ `abandoned`.
- [x] Lưu trữ giữ dữ liệu + giải phóng quota; xoá có 30 ngày hoàn tác.
- [x] Telemetry sau purge còn hàng với `child_uuid` NULL.
- [x] `/play` không chữ để đọc, không bộ lọc, không giá tiền.
- [x] `pnpm check && pnpm test && pnpm test:e2e && pnpm --filter @mindkid/gates test && node packages/gates/scripts/check-progress.ts` xanh.
- [x] Human review diff — dữ liệu trẻ em.

---

## Task 6 — Evidence và promote

- [x] Mỗi `BR-CPC-*` có test tham chiếu mã rule.
- [x] Mỗi `BR-CPS-*` có test tham chiếu mã rule.
- [x] Mỗi `BR-CPR-*` có test tham chiếu mã rule.
- [x] Mỗi `BR-PEN-*` có test tham chiếu mã rule.
- [x] [`child-profile-crud.md`](../specs/03-account/child-profile-crud.md) → `implemented`.
- [x] [`child-profile-switching.md`](../specs/03-account/child-profile-switching.md) → `implemented`.
- [x] [`child-profile-archive.md`](../specs/03-account/child-profile-archive.md) → `implemented`.
- [x] [`play-entry-and-profile-select.md`](../specs/04-play/play-entry-and-profile-select.md) → `implemented`.
- [x] Nợ mục "Gợi ý" sảnh trẻ → **P3.6**.
- [x] Tick **P1.9** ở [`14-implementation-sequence-todo.md`](14-implementation-sequence-todo.md) khi `check:progress` tự xanh.

## Câu hỏi mở chuyển tiếp

- [ ] PIN riêng cho từng trẻ — **P4**, chủ là người quyết.
