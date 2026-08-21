# Checklist — Task #37: P1.11b — Tìm kiếm nội dung

> Kế hoạch: [`37-p1-11b-content-search-plan.md`](37-p1-11b-content-search-plan.md).
> Một mặt tìm kiếm, **ba bề mặt**. Khác nhau chỉ ở trạng thái thấy được và `allowedTiers()`.
> Bước riêng vì `D-CA`: my-library (P1.12) phụ thuộc nó.
>
> ```
> export PATH=/Users/macbook/.nvm/versions/node/v24.15.0/bin:$PATH
> ```

## Preflight

- [x] **P1.11 đã đóng** — ≥120 level thật để đo.
- [x] **P1.10 đã đóng** — tag ba trục.
- [x] Human approve kế hoạch và sáu quyết định D-HM · D-HN · D-HO · D-HP · D-HQ · D-HR.
- [x] Đối chiếu `BR-SRC-*` và `BR-LAD-09` với [`business-rules.md`](../specs/00-foundation/business-rules.md).
- [x] Tạo nhánh riêng.

---

### Task 1 — Index và `unaccent`

- [x] Migration bật `unaccent`.
- [x] GIN trên `to_tsvector('simple', unaccent(title || ' ' || description))`.
- [x] Index `game_levels(status, access_tier, age_min, age_max)`.
- [x] Index `content_tag_map(tag_id, entity_type)`.
- [x] Index `content_skill_map(skill_id, entity_type)`.
- [x] Migration chạy được từ đầu trên DB rỗng.
- [x] `BR-SRC-07` ca âm: `q = "dem qua tao"` → ra `"Đếm quả táo"`.
- [x] `EXPLAIN` xác nhận dùng index, không seq scan.

### Task 2 — Lớp truy vấn dùng chung

- [x] Một hàm `viewer` → điều kiện trạng thái + bậc.
- [x] `BR-SRC-05` ca âm: guest tìm không thấy level `draft`.
- [x] User thấy `published` theo `allowedTiers()`.
- [x] Manager thấy mọi trạng thái, mọi bậc.
- [x] Cùng bộ lọc áp cho `levels` · `lessons` · `curricula`.
- [x] Ca âm: không truy vấn tìm kiếm nào viết ngoài lớp này.

### Task 3 — Bộ lọc, trần, phân trang

- [x] Đủ 14 nhóm bộ lọc §7.1.
- [x] `status` **chỉ** nhận ở route admin.
- [x] `BR-SRC-03` Zod parse **mọi** param.
- [x] Ca âm: `q` chứa `'` và `%` → 200, không lỗi SQL.
- [x] Ca âm: guest gửi `status=draft` → kết quả không đổi.
- [x] `BR-SRC-02` trần: level ≤60 · lesson ≤40 · admin ≤100.
- [x] `limit=5000` → ép về trần, **không** lỗi.
- [x] `BR-SRC-04` phân trang **cursor**, không offset.
- [x] Không kết quả → rỗng + gợi ý nới bộ lọc nào.

### Task 4 — `locked` đúng tầng

- [x] `BR-SRC-01` item ngoài quyền → `locked: true` + metadata.
- [x] `D-HM` truy vấn **không select** `content_pack` cho hàng `locked`.
- [x] Ca âm tầng truy vấn.
- [x] Ca âm tầng response: không `content_pack`, không `difficulty_params`.
- [x] Lọc theo bậc cao hơn quyền vẫn trả kết quả kèm `locked`.
- [x] Mở một item vẫn đi qua `assertContentAccess` của P1.3.

### Task 5 — Xếp hạng

- [x] Năm tiêu chí §7.2 khai dạng dữ liệu, đúng thứ tự.
- [x] Khớp text: title > tag > description.
- [x] **Ca âm quy tắc 2**: `standard` xếp trước `premium` cùng độ khớp.
- [x] Khớp band tuổi `active_child_id` xếp trên.
- [x] Lượt chơi đọc từ `level_daily_stats`, không từ `telemetry_events`.
- [x] `newest` · `popular` · `difficulty` có test.

### Task 6 — Ba route và cache

- [x] `GET /api/guest/levels`.
- [x] `GET /api/users/levels`.
- [x] `GET /api/managers/levels`.
- [x] Khung tương ứng cho `lessons` · `curricula`.
- [x] Response `{ items, next_cursor }`; 422 `VALIDATION_FAILED`.
- [x] `BR-SRC-06` kết quả có nội dung trả phí → `no-store`.
- [x] Ca âm chiều ngược: kết quả toàn `free` không bị `no-store` thừa.
- [x] Ba route là lớp mỏng, không truy vấn riêng.

## Cổng dừng

- [x] Tìm không dấu ra kết quả có dấu.
- [x] `locked` không mang nội dung ở **cả** truy vấn và response.
- [x] Nội dung mở được xếp trên `locked`.
- [x] Guest không thấy `draft`.
- [x] Trần `limit` ép ở server; phân trang cursor.
- [x] `pnpm check && pnpm test && pnpm --filter @mindkid/gates test && node packages/gates/scripts/check-progress.ts` xanh.

---

## Task 7 — Hiệu năng, evidence, promote

- [x] P95 truy vấn tìm kiếm < **800 ms** trên ≥120 level thật.
- [x] Truy vấn `skill → LO → asset` P95 < **100 ms**.
- [x] Lưu `EXPLAIN ANALYZE` của ba truy vấn tiêu biểu làm mốc.
- [x] Mỗi `BR-SRC-*` có test tham chiếu mã rule.
- [x] [`content-search.md`](../specs/01-platform/content-search.md) → `implemented`.
- [x] Ghi ngưỡng ~50.000 item vào báo cáo giám sát (`D-HR`).
- [x] Tick **P1.11b** ở [`14-implementation-sequence-todo.md`](14-implementation-sequence-todo.md) khi `check:progress` tự xanh.

## Câu hỏi mở chuyển tiếp

- [ ] Postgres full-text đủ tới bao nhiêu nội dung — **sau MVP**, chủ Infra.
