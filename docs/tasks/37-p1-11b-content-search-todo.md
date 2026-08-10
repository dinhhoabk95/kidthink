# Checklist — Task #37: P1.11b — Tìm kiếm nội dung

> Kế hoạch: [`37-p1-11b-content-search-plan.md`](37-p1-11b-content-search-plan.md).
> Một mặt tìm kiếm, **ba bề mặt**. Khác nhau chỉ ở trạng thái thấy được và `allowedTiers()`.
> Bước riêng vì `D-CA`: my-library (P1.12) phụ thuộc nó.
>
> ```
> export PATH=/Users/macbook/.nvm/versions/node/v24.15.0/bin:$PATH
> ```

## Preflight

- [ ] **P1.11 đã đóng** — ≥120 level thật để đo.
- [ ] **P1.10 đã đóng** — tag ba trục.
- [ ] Human approve kế hoạch và sáu quyết định D-HM · D-HN · D-HO · D-HP · D-HQ · D-HR.
- [ ] Đối chiếu `BR-SRC-*` và `BR-LAD-09` với [`business-rules.md`](../specs/00-foundation/business-rules.md).
- [ ] Tạo nhánh riêng.

---

### Task 1 — Index và `unaccent`

- [ ] Migration bật `unaccent`.
- [ ] GIN trên `to_tsvector('simple', unaccent(title_vi || ' ' || description_vi))`.
- [ ] Index `game_levels(status, access_tier, age_min, age_max)`.
- [ ] Index `content_tag_map(tag_id, entity_type)`.
- [ ] Index `content_skill_map(skill_id, entity_type)`.
- [ ] Migration chạy được từ đầu trên DB rỗng.
- [ ] `BR-SRC-07` ca âm: `q = "dem qua tao"` → ra `"Đếm quả táo"`.
- [ ] `EXPLAIN` xác nhận dùng index, không seq scan.

### Task 2 — Lớp truy vấn dùng chung

- [ ] Một hàm `viewer` → điều kiện trạng thái + bậc.
- [ ] `BR-SRC-05` ca âm: guest tìm không thấy level `draft`.
- [ ] User thấy `published` theo `allowedTiers()`.
- [ ] Manager thấy mọi trạng thái, mọi bậc.
- [ ] Cùng bộ lọc áp cho `levels` · `lessons` · `curricula`.
- [ ] Ca âm: không truy vấn tìm kiếm nào viết ngoài lớp này.

### Task 3 — Bộ lọc, trần, phân trang

- [ ] Đủ 14 nhóm bộ lọc §7.1.
- [ ] `status` **chỉ** nhận ở route admin.
- [ ] `BR-SRC-03` Zod parse **mọi** param.
- [ ] Ca âm: `q` chứa `'` và `%` → 200, không lỗi SQL.
- [ ] Ca âm: guest gửi `status=draft` → kết quả không đổi.
- [ ] `BR-SRC-02` trần: level ≤60 · lesson ≤40 · admin ≤100.
- [ ] `limit=5000` → ép về trần, **không** lỗi.
- [ ] `BR-SRC-04` phân trang **cursor**, không offset.
- [ ] Không kết quả → rỗng + gợi ý nới bộ lọc nào.

### Task 4 — `locked` đúng tầng

- [ ] `BR-SRC-01` item ngoài quyền → `locked: true` + metadata.
- [ ] `D-HM` truy vấn **không select** `content_pack` cho hàng `locked`.
- [ ] Ca âm tầng truy vấn.
- [ ] Ca âm tầng response: không `content_pack`, không `difficulty_params`.
- [ ] Lọc theo bậc cao hơn quyền vẫn trả kết quả kèm `locked`.
- [ ] Mở một item vẫn đi qua `assertContentAccess` của P1.3.

### Task 5 — Xếp hạng

- [ ] Năm tiêu chí §7.2 khai dạng dữ liệu, đúng thứ tự.
- [ ] Khớp text: title > tag > description.
- [ ] **Ca âm quy tắc 2**: `standard` xếp trước `premium` cùng độ khớp.
- [ ] Khớp band tuổi `active_child_id` xếp trên.
- [ ] Lượt chơi đọc từ `level_daily_stats`, không từ `telemetry_events`.
- [ ] `newest` · `popular` · `difficulty` có test.

### Task 6 — Ba route và cache

- [ ] `GET /api/guest/levels`.
- [ ] `GET /api/users/levels`.
- [ ] `GET /api/managers/levels`.
- [ ] Khung tương ứng cho `lessons` · `curricula`.
- [ ] Response `{ items, next_cursor }`; 422 `VALIDATION_FAILED`.
- [ ] `BR-SRC-06` kết quả có nội dung trả phí → `no-store`.
- [ ] Ca âm chiều ngược: kết quả toàn `free` không bị `no-store` thừa.
- [ ] Ba route là lớp mỏng, không truy vấn riêng.

## Cổng dừng

- [ ] Tìm không dấu ra kết quả có dấu.
- [ ] `locked` không mang nội dung ở **cả** truy vấn và response.
- [ ] Nội dung mở được xếp trên `locked`.
- [ ] Guest không thấy `draft`.
- [ ] Trần `limit` ép ở server; phân trang cursor.
- [ ] `pnpm check && pnpm test && pnpm lint:specs && pnpm check:progress` xanh.

---

## Task 7 — Hiệu năng, evidence, promote

- [ ] P95 truy vấn tìm kiếm < **800 ms** trên ≥120 level thật.
- [ ] Truy vấn `skill → LO → asset` P95 < **100 ms**.
- [ ] Lưu `EXPLAIN ANALYZE` của ba truy vấn tiêu biểu làm mốc.
- [ ] Mỗi `BR-SRC-*` có test tham chiếu mã rule.
- [ ] [`content-search.md`](../specs/01-platform/content-search.md) → `implemented`.
- [ ] Ghi ngưỡng ~50.000 item vào báo cáo giám sát (`D-HR`).
- [ ] Tick **P1.11b** ở [`14-implementation-sequence-todo.md`](14-implementation-sequence-todo.md) khi `check:progress` tự xanh.

## Câu hỏi mở chuyển tiếp

- [ ] Postgres full-text đủ tới bao nhiêu nội dung — **sau MVP**, chủ Infra.
