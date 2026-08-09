# Checklist — Task #17: P0.4 — Tuân thủ dữ liệu trẻ

> Kế hoạch: [`17-p0-4-child-data-compliance-plan.md`](17-p0-4-child-data-compliance-plan.md).
> Spec sở hữu: [`child-data-compliance.md`](../specs/00-foundation/child-data-compliance.md).
> Đây là **vùng nhạy cảm "dữ liệu trẻ"** theo [`ai-codegen-pipeline.md`](../specs/01-platform/ai-codegen-pipeline.md):
> test âm trước, gate đầy đủ, human review diff trước merge. Không auto-merge, không chạy
> migration ngoài local.
>
> ```
> export PATH=/Users/macbook/.nvm/versions/node/v24.15.0/bin:$PATH
> ```

## Preflight

- [x] Human đọc và approve kế hoạch, gồm bốn quyết định D-DN · D-DO · D-DP · D-DQ.
- [x] Đọc **toàn bộ** [`child-data-compliance.md`](../specs/00-foundation/child-data-compliance.md), mục 11 đọc trước.
- [x] Đối chiếu `BR-CDC-01`…`BR-CDC-14` với [`business-rules.md`](../specs/00-foundation/business-rules.md) — không bỏ rule, không tự chế rule.
- [x] Xác nhận khối A không có task nào cần `ACTORS` đã `implemented`.
- [x] Tạo nhánh riêng; không làm việc trực tiếp trên `main`.
- [x] Không đụng `.env`, secret thật hoặc production.

---

## Khối A — chạy ngay, song song với phần còn lại của P0.3

### Task 1 — Ca âm cho cổng danh sách đóng

- [x] Danh sách đóng khai một nguồn duy nhất trong code.
- [x] Test so khớp tập hợp tên cột hai chiều: thiếu là lỗi, thừa là lỗi.
- [x] Thông báo lỗi nêu đúng tên cột thừa và cột thiếu.
- [x] Ca âm `BR-SPT-02`: cột `%_url` / `%_path` / `photo%` trên bảng dữ liệu trẻ làm test đỏ.
- [x] `pnpm --filter @kidthink/db test -- child` **ĐỎ** đúng lý do trên.

### Task 2 — `child_profiles` đúng 12 cột hợp đồng

- [x] Thêm `uuid` UNIQUE.
- [x] Thêm `avatar_id` varchar(24) NOT NULL.
- [x] Thêm `relationship` enum `child|student|other` nullable.
- [x] Thêm `current_curriculum_id` bigint nullable, neo `entity_id` (D-AE).
- [x] Thêm `daily_play_cap_minutes` smallint NOT NULL có default.
- [x] Thêm `status` enum `active|archived|pending_deletion`.
- [x] Bỏ `gender` `avatar_url` `avatar_emoji` `theme_preference` `is_active` `archived_at`.
- [x] `display_name` về `varchar(40)`.
- [x] Index đơn trên `birth_year`.
- [x] `pnpm db:generate` → migration `0012_*`; đọc SQL sinh ra trước khi chạy.
- [x] `pnpm db:migrate` chạy từ `0000` trên database **rỗng**, không lỗi.
- [x] Không sửa file migration `0000`–`0011` (D-DP).
- [x] Test Task 1 chuyển **XANH**.

### Task 3 — `telemetry_events` có `child_uuid`

- [x] Thêm `child_uuid` nullable · `game_level_id` · `content_version` · `template_id` · `occurred_at_ms` · `ingested_at`.
- [x] Cổng allow-list cột theo §7.3; cột lạ làm test đỏ.
- [x] Ca âm: không FK nào trỏ vào `telemetry_events` (D-Z).
- [x] Ca âm `BR-SPT-04`: `SET child_uuid = NULL` chạy được, số hàng không giảm.
- [x] `pnpm --filter @kidthink/db test -- play` xanh, có assertion tham chiếu `BR-CDC-05`.

### Task 4 — Kiểm kê và ghi nợ vào spec

- [x] Bảng nợ `play_sessions` · `child_session_summaries` · ba bảng rollup vào [`schema-play-telemetry.md`](../specs/01-platform/schema-play-telemetry.md) §11, mỗi dòng có bước sở hữu.
- [x] Ghi D-DN · D-DO · D-DP · D-DQ vào sổ quyết định [`data-model-overview.md`](../specs/01-platform/data-model-overview.md).
- [x] Không đổi cột nào thuộc bảng nợ trong PR này.
- [x] `pnpm lint:specs` 0 lỗi, 0 cảnh báo.

### Task 5 — Contract danh sách đóng ở tầng ứng dụng

- [x] Zod `strict` cho input child profile, đặt trong `packages/shared`.
- [x] Không tạo package mới (`BR-MPA`).
- [x] Field ngoài danh sách đóng → `CHILD_FIELD_NOT_ALLOWED` (400) theo [`error-codes.md`](../specs/00-foundation/error-codes.md).
- [x] Ca âm: body có `full_name` + `school` bị từ chối; thông báo lỗi **không** vọng lại giá trị đã gửi.
- [x] Cổng DB và cổng Zod đọc **cùng một** nguồn tên cột.
- [x] `pnpm --filter @kidthink/shared test` xanh, assertion tham chiếu `BR-CDC-01`.

### Task 6 — `avatar_id` chỉ nhận preset

- [x] Validator từ chối giá trị chứa `/`, `\`, `http`, `data:`.
- [x] Test khẳng định không bảng dữ liệu trẻ nào còn cột `avatar_url`.
- [x] Ghi rõ danh mục preset do P0.9 ([`emoji-registry.md`](../specs/01-platform/emoji-registry.md)) cấp; không tự chế danh mục.
- [x] `pnpm --filter @kidthink/shared test` xanh, assertion tham chiếu `BR-CDC-04`.

### Task 7 — Khoảng `birth_year` theo năm hiện tại

- [x] Hàm tính khoảng nhận "năm hiện tại" làm tham số, không đọc đồng hồ bên trong.
- [x] `CHECK` ở DB siết lại, không còn nhận năm tương lai.
- [x] Ghi trong spec: `CHECK` là ràng buộc **sàn**, khoảng chính xác ép ở tầng ứng dụng.
- [x] Ca âm: năm sinh tương lai bị từ chối; trẻ 10 tuổi bị từ chối.
- [x] `pnpm --filter @kidthink/shared test` và `pnpm --filter @kidthink/db test -- child` xanh.

## Cổng dừng A

- [x] `child_profiles` đúng 12 cột hợp đồng, test hai chiều xanh.
- [x] `telemetry_events` có `child_uuid` nullable, ca âm ẩn danh hoá xanh.
- [x] `pnpm check && pnpm test && pnpm lint:specs && pnpm check:progress` xanh.
- [x] Human review diff vùng nhạy cảm dữ liệu trẻ; không auto-merge.
- [x] Xác nhận P0.3 đã đóng **trước** khi mở khối B.

---

## Khối B — chỉ mở sau khi P0.3 đóng

### Task 8 — Cổng đồng ý trước khi thu

- [x] Thiếu đồng ý → `CONSENT_REQUIRED` (428).
- [x] `policy_version` cũ → `CONSENT_VERSION_STALE` (409).
- [x] Ca âm `BR-CDC-07`: rút đồng ý thêm hàng, hàng cũ không đổi.
- [x] Chính sách đổi version chặn tạo trẻ mới, **không** chặn đọc dữ liệu đã có.
- [x] `pnpm --filter @kidthink/db test -- identity` xanh, assertion tham chiếu `BR-CDC-07`.

### Task 9 — `content_reviewer` không chạm dữ liệu trẻ

- [x] Contract test: `content_reviewer` gọi đường đọc dữ liệu trẻ → 403.
- [x] Cổng quét: bề mặt admin không có đường đọc telemetry/mastery/lịch sử chơi của một trẻ cụ thể (`BR-CDC-14`).
- [x] Dùng guard của P0.3, không tự chế guard mới.
- [x] `pnpm --filter @kidthink/auth test -- actor-boundaries` xanh, assertion tham chiếu `BR-CDC-13`.

### Task 10 — Xoá và ẩn danh hoá theo §7.4

- [x] Yêu cầu xoá đặt `users.status='deleted'`, `child_profiles.status='pending_deletion'`, `purge_at` = D+30.
- [x] Huỷ trong 30 ngày khôi phục đủ.
- [x] Sau 30 ngày xoá `child_profiles` `mastery_state` `play_sessions` `child_session_summaries`.
- [x] `telemetry_events.child_uuid` về NULL, số hàng không giảm.
- [x] `audit_logs` và `consent_logs` còn nguyên.
- [x] Ca âm: purge chạy ở D+29 không xoá gì.
- [x] Lập lịch job **không** làm ở đây — thuộc P0.8b.
- [x] `pnpm --filter @kidthink/db test -- purge` xanh, assertion tham chiếu `BR-CDC-10` và `BR-SPT-04`.

### Task 11 — Ba cổng tĩnh

- [x] Cổng tracking: không script/domain bên thứ ba ở `/play/**` và trang pháp lý (`BR-CDC-08`).
- [x] Cổng credential trẻ: không cột `password%`/`token%` trên bảng dữ liệu trẻ, không route đăng nhập trẻ (`BR-CDC-11`).
- [x] Cổng payload provider ngoài: `child_uuid`/`display_name`/`birth_year` là lỗi kiểu **và** lỗi runtime (`BR-CDC-06`).
- [x] Mỗi cổng có ca âm riêng làm nó ĐỎ.
- [x] `pnpm check` gọi cổng mới; ca âm chạy trong `pnpm test`.

## Cổng dừng B

- [x] Không thu được dữ liệu trẻ khi chưa có đồng ý hợp lệ.
- [x] `content_reviewer` không đọc được gì thuộc trẻ.
- [x] Xoá và ẩn danh hoá đều có ca âm.
- [x] Human thứ hai review theo [`security-checklist.md`](../specs/08-quality/security-checklist.md).

---

## Task 12 — Evidence và promote status

- [x] Mỗi `BR-CDC-01`…`BR-CDC-14` có test tham chiếu mã rule và assertion đúng hành vi.
- [x] Rule chưa phủ được ở P0.4 ghi bước sở hữu, **không** tick.
- [x] [`child-data-compliance.md`](../specs/00-foundation/child-data-compliance.md) sang `implemented` chỉ khi đủ evidence.
- [x] [`schema-play-telemetry.md`](../specs/01-platform/schema-play-telemetry.md) giữ `implemented` và mang bảng nợ Task 4.
- [x] Tick **P0.4** ở [`14-implementation-sequence-todo.md`](14-implementation-sequence-todo.md) chỉ khi `check:progress` tự xanh.
- [x] `pnpm check && pnpm test && pnpm lint:specs && pnpm check:progress` xanh.

## Cổng dừng cuối

- [x] P0.4 xong mà không kéo implementation P0.8b/P0.9/P1 lên sớm.
- [x] Không route HTTP mới ngoài phạm vi trong diff.
- [x] Không secret trong source, test snapshot hoặc log.
- [x] Working tree không mất thay đổi ngoài phạm vi.
- [x] Human review hoàn tất; sẵn sàng lập plan P0.5.

