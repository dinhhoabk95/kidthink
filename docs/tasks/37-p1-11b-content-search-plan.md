# Kế hoạch — Task #37: P1.11b — Tìm kiếm nội dung

> Viết 2026-08-09. Bước sở hữu: **P1.11b** của
> [`14-implementation-sequence-todo.md`](14-implementation-sequence-todo.md).
> Spec sở hữu: [`content-search.md`](../specs/01-platform/content-search.md).
> Bước này tồn tại riêng vì `D-CA`: [`my-library.md`](../specs/03-account/my-library.md) (P1.12)
> khai `depends_on: CONTENT-SEARCH`.
>
> ```
> export PATH=/Users/macbook/.nvm/versions/node/v24.15.0/bin:$PATH
> ```

## Tóm tắt

**Một** mặt tìm kiếm dùng chung cho ba bề mặt: catalog công khai, thư viện của User, studio của
Manager. Cùng bộ lọc, khác nhau ở **phạm vi quyền** và **trạng thái nội dung thấy được**.

Quyết định thiết kế đáng chú ý nhất: nội dung bị chặn bậc **vẫn hiện** trong kết quả kèm cờ
`locked`, nhưng **không** kèm `content_pack`. Ẩn hẳn thì người dùng không biết mình đang bỏ lỡ
gì; trả kèm nội dung thì paywall là trang trí. Và xếp hạng **đẩy nội dung mở được lên trên** —
vì catalog toàn khoá trông như một paywall, không phải một thư viện.

Ràng buộc hạ tầng: Postgres full-text + `unaccent`. **Cấm** thêm search engine riêng — một dịch
vụ nữa để vận hành không đáng cho 120 level trên t3.small.

## 0. Điều kiện tiên quyết

| Dep | Trạng thái | Ghi chú |
|---|---|---|
| `CONTENT-TAGGING` | P1.10 | ba trục + theme là bộ lọc chính |
| `ACCESS-LADDER` | P0.5 | `allowedTiers()`, `BR-LAD-09` |
| `ACCESS-GATING` | P1.3 | quy tắc chặn; tìm kiếm **không** thay gating |
| Nội dung thật | **P1.11** | ≥120 level để đo xếp hạng và hiệu năng |
| `TELEMETRY-PIPELINE` | P1.5/P1.7 | `level_daily_stats` cho tiêu chí "lượt chơi cao" |

## 1. Đo được

### 1.1 Vì sao là bước riêng

`D-CA` đã ghi: [`my-library.md`](../specs/03-account/my-library.md) ở bước 12 khai
`depends_on: CONTENT-SEARCH`, trong khi bản roadmap trước xếp tìm kiếm ở bước 13 — **sau** nó.
Cạnh là thật (my-library là một trong ba bề mặt dùng chung mặt tìm kiếm), nên tách thành bước
11b thay vì sửa `depends_on`.

### 1.2 Đã có

Tag ba trục + theme (P1.10); ≥120 level `published` (P1.11); `level_daily_stats` (P1.5/P1.7);
`allowedTiers()` (P0.5).

### 1.3 Chưa có

Route tìm kiếm nào; index §7.3; `unaccent`; phân trang cursor.

## 2. Quyết định

**D-HM — `locked` là **hình dạng dữ liệu**, không phải cờ hiển thị.** `BR-SRC-01`: item `locked`
trả metadata nhưng **không** `content_pack`, **không** `difficulty_params`. Cách hỏng dễ nhất:
truy vấn lấy đủ rồi lọc ở tầng serialize — một chỗ quên là rò cả thư viện. Xử: truy vấn
**không** select cột nội dung cho hàng `locked`; ca âm quét response và ca âm ở tầng truy vấn.

**D-HN — thứ tự xếp hạng là **dữ liệu**, và quy tắc 2 có ca âm riêng.** Năm tiêu chí §7.2 theo
đúng thứ tự: khớp text (title > tag > description) → **mở được trước `locked`** → khớp band tuổi
của `active_child_id` → lượt chơi → mới hơn. Quy tắc 2 là thứ dễ bị đảo nhất khi ai đó muốn
"đẩy nội dung premium lên để bán" — ca âm: user `standard` tìm kiếm, level `standard` phải xuất
hiện **trước** level `premium` có cùng độ khớp.

**D-HO — Zod parse **mọi** query param, kể cả route chỉ đọc.** `BR-SRC-03`. Param đi thẳng vào
`ilike`/`gte` là đường vào injection, và "route này chỉ đọc" là lý do khiến người ta bỏ qua.
`status` chỉ nhận ở route admin; ca âm — guest gửi `status=draft` **không** đổi kết quả.

**D-HP — `unaccent` là ràng buộc **index**, không phải xử lý ở tầng app.** `BR-SRC-07`: người
Việt gõ không dấu là mặc định. Chuẩn hoá ở app rồi so chuỗi sẽ không dùng được index và sẽ chậm
đúng lúc thư viện lớn lên. Dùng GIN trên `to_tsvector('simple', unaccent(...))` như §7.3.

**D-HQ — một lớp truy vấn, ba route mỏng.** Ba bề mặt khác nhau **chỉ** ở hai tham số: trạng
thái thấy được và `allowedTiers()`. Viết ba truy vấn là ba nơi để quên `BR-SRC-05` hoặc
`BR-SRC-06`. Một hàm nhận `viewer` và trả điều kiện; ba route chỉ dựng `viewer`.

**D-HR — không thêm search engine, và ghi rõ ngưỡng phải xem lại.** §11 Q1: Postgres full-text
chịu tốt tới ~50.000 item, chủ là Infra, "sau MVP". Ghi ngưỡng đó thành **cảnh báo trong báo
cáo** — khi số item vượt một phần ngưỡng, mở lại câu hỏi. Không chờ tới lúc chậm mới phát hiện.

## 3. Đồ thị

```
T1 index + unaccent + migration
      └──→ T2 lớp truy vấn dùng chung: viewer → điều kiện (D-HQ)
                ├──→ T3 bộ lọc §7.1 + Zod + trần limit + cursor
                ├──→ T4 locked ở tầng truy vấn (D-HM)
                └──→ T5 xếp hạng 5 tiêu chí + ca âm quy tắc 2
                          └──→ T6 ba route mỏng + cache đúng bậc
                              ── Cổng dừng ──
  T7 hiệu năng trên 120 level · evidence · promote
```

## 4. Task

### Task 1 — Index và `unaccent`

**Tiêu chí nghiệm thu**
- [ ] Migration bật `unaccent`; GIN trên `to_tsvector('simple', unaccent(title || ' ' || description))`.
- [ ] Index §7.3: `game_levels(status, access_tier, age_min, age_max)` · `content_tag_map(tag_id, entity_type)` · `content_skill_map(skill_id, entity_type)`.
- [ ] Migration chạy được **từ đầu** trên DB rỗng.
- [ ] `BR-SRC-07` ca âm: tìm `"dem qua tao"` ra level tên `"Đếm quả táo"` (`D-HP`).
- [ ] `EXPLAIN` cho thấy truy vấn **dùng** index, không seq scan trên `game_levels`.

**Kiểm chứng**
- [ ] `pnpm db:migrate` xanh; `pnpm test -- search-index` xanh.

**Phụ thuộc:** P1.11 · **Cỡ:** M

### Task 2 — Lớp truy vấn dùng chung

**Tiêu chí nghiệm thu**
- [ ] Một hàm nhận `viewer` (`guest` | `user` | `manager`) → điều kiện trạng thái + bậc (`D-HQ`).
- [ ] `BR-SRC-05`: guest chỉ thấy `published`; ca âm — tồn tại level `draft`, guest tìm **không** thấy.
- [ ] User thấy `published` theo `allowedTiers()`; Manager thấy **mọi** trạng thái và mọi bậc.
- [ ] Cùng bộ lọc áp cho `levels`, `lessons`, `curricula` (hai cái sau là khung, dữ liệu ở P3).
- [ ] Ca âm: **không** truy vấn tìm kiếm nào viết riêng ngoài lớp này.

**Kiểm chứng**
- [ ] `pnpm test -- search-scope` xanh, assertion tham chiếu `BR-SRC-05`.

**Phụ thuộc:** T1 · **Cỡ:** M

### Task 3 — Bộ lọc, trần, phân trang

**Tiêu chí nghiệm thu**
- [ ] Đủ bộ lọc §7.1: `q` · `age_min`/`age_max` · `competency` · `strand`/`skill` · `learning_objective` · `difficulty` · `duration_max` · `what`/`thinking`/`mechanic` · `theme` · `access_tier` · `template` · `status` (**chỉ** admin) · `curriculum` · `sort`.
- [ ] `BR-SRC-03` + `D-HO`: Zod parse **mọi** param; ca âm `q` chứa `'` và `%` → **200**, không lỗi SQL, không nối chuỗi.
- [ ] Ca âm: guest gửi `status=draft` → kết quả **không đổi**.
- [ ] `BR-SRC-02`: trần `limit` ép ở server — level ≤60, lesson ≤40, admin ≤100; `limit=5000` → ép về trần, **không** lỗi.
- [ ] `BR-SRC-04`: phân trang **cursor**, không offset; ca âm trang sâu không quét toàn bảng.
- [ ] Không kết quả → trả rỗng + gợi ý nới bộ lọc nào.

**Kiểm chứng**
- [ ] `pnpm test -- search-filters` xanh, assertion tham chiếu `BR-SRC-02` `BR-SRC-03` `BR-SRC-04`.

**Phụ thuộc:** T2 · **Cỡ:** M

### Task 4 — `locked` đúng tầng

**Tiêu chí nghiệm thu**
- [ ] `BR-SRC-01`: item ngoài `allowedTiers()` → `locked: true`, có metadata (`code`, `title`, `thumbnail_emoji`, `competency`, tuổi, `difficulty`, `access_tier`).
- [ ] `D-HM`: truy vấn **không select** `content_pack`/`difficulty_params` cho hàng `locked` — ca âm ở tầng truy vấn, không chỉ ở response.
- [ ] Ca âm response: item `locked` không chứa hai trường đó.
- [ ] Lọc theo bậc cao hơn quyền vẫn trả kết quả kèm `locked` (để bán được).
- [ ] Tìm kiếm **không** thay `assertContentAccess`; mở một item vẫn đi qua gating của P1.3.

**Kiểm chứng**
- [ ] `pnpm test -- search-locked` xanh, assertion tham chiếu `BR-SRC-01`.

**Phụ thuộc:** T2 · **Cỡ:** S

### Task 5 — Xếp hạng

**Tiêu chí nghiệm thu**
- [ ] Năm tiêu chí §7.2 khai dạng dữ liệu, đúng thứ tự (`D-HN`).
- [ ] Khớp text: title > tag > description.
- [ ] **Ca âm quy tắc 2**: user `standard`, hai level cùng độ khớp — `standard` xếp **trước** `premium`.
- [ ] Khớp band tuổi của `active_child_id` xếp trên (khi có ngữ cảnh trẻ).
- [ ] Lượt chơi lấy từ `level_daily_stats`, không đếm trực tiếp `telemetry_events` (`BR-TLM-01`).
- [ ] `sort` khác `relevance` (`newest`, `popular`, `difficulty`) hoạt động và có test.

**Kiểm chứng**
- [ ] `pnpm test -- search-ranking` xanh.

**Phụ thuộc:** T3 · T4 · **Cỡ:** M

### Task 6 — Ba route và cache

**Tiêu chí nghiệm thu**
- [ ] `GET /api/guest/levels` · `GET /api/users/levels` · `GET /api/managers/levels`; cùng khung cho `lessons`/`curricula`.
- [ ] Response đúng §8: `{ items: [...], next_cursor }`; 422 `VALIDATION_FAILED`.
- [ ] `BR-SRC-06`: kết quả **có** nội dung trả phí → `no-store`; ca âm hai chiều như `D-FT` của P1.4.
- [ ] Route admin nhận `status`; hai route kia **không**.
- [ ] Ba route là lớp mỏng trên T2 — không truy vấn riêng.

**Kiểm chứng**
- [ ] `pnpm test -- search-routes` xanh, assertion tham chiếu `BR-SRC-06`.

**Phụ thuộc:** T5 · **Cỡ:** S

### Cổng dừng

- [ ] Tìm không dấu ra kết quả có dấu.
- [ ] `locked` không mang nội dung — kiểm ở **cả** truy vấn và response.
- [ ] Nội dung mở được xếp trên `locked`.
- [ ] Guest không thấy `draft`; `status` không có tác dụng ngoài route admin.
- [ ] Trần `limit` ép ở server; phân trang cursor.
- [ ] `pnpm check && pnpm test && pnpm lint:specs && pnpm check:progress` xanh.

### Task 7 — Hiệu năng, evidence, promote

**Tiêu chí nghiệm thu**
- [ ] Đo trên **≥120 level thật**: P95 truy vấn tìm kiếm < 800 ms (`BR-PRF` §7.2), truy vấn `skill → LO → asset` < 100 ms.
- [ ] `EXPLAIN ANALYZE` cho ba truy vấn tiêu biểu, lưu kết quả làm mốc.
- [ ] Mỗi `BR-SRC-*` có ít nhất một test tham chiếu mã rule.
- [ ] [`content-search.md`](../specs/01-platform/content-search.md) sang `implemented`.
- [ ] `D-HR`: ghi ngưỡng ~50.000 item vào báo cáo giám sát, mở lại §11 Q1 khi vượt một phần ngưỡng.
- [ ] Tick **P1.11b** ở [`14-implementation-sequence-todo.md`](14-implementation-sequence-todo.md) khi `check:progress` tự xanh.

**Cỡ:** M

## 5. Rủi ro

| Rủi ro | Ảnh hưởng | Giảm thiểu |
|---|---|---|
| Lọc `locked` ở tầng serialize | Một chỗ quên là rò cả thư viện trả phí | `D-HM` — không select ở truy vấn, ca âm hai tầng |
| Đảo quy tắc xếp hạng để "đẩy hàng" | Catalog trông như paywall | `D-HN` — ca âm riêng cho quy tắc 2 |
| Param không parse ở route đọc | Đường vào injection | `D-HO` — Zod mọi param, ca âm ký tự đặc biệt |
| Chuẩn hoá dấu ở tầng app | Không dùng được index, chậm khi thư viện lớn | `D-HP` — `unaccent` trong index |
| Ba truy vấn cho ba bề mặt | Ba nơi để quên luật bậc hoặc trạng thái | `D-HQ` — một lớp, ba route mỏng |
| Offset sâu ở bảng lớn | Quét toàn bảng, hạ instance | `BR-SRC-04` — cursor |
| Thêm search engine "cho nhanh" | Một dịch vụ nữa trên t3.small 2 GB | `D-HR` — Postgres + ngưỡng cảnh báo |
| Cache kết quả có nội dung trả phí | Rò qua CDN | `BR-SRC-06` — ca âm hai chiều |

## 6. Giả định

1. **P1.11 đã đóng** — ≥120 level thật để đo xếp hạng và hiệu năng.
2. **P1.10 đã đóng** — tag ba trục là bộ lọc chính.
3. **`lessons` và `curricula` chưa có dữ liệu** — khung bộ lọc dựng sẵn, dữ liệu ở P3.
4. **Tìm kiếm ngữ nghĩa là add-on AI** (`D-CQ`) — không nằm ở đây.
5. **Studio chưa tồn tại** — route admin có test, UI ở P2.
6. **`popular` đọc từ rollup**, không đọc event thô.

## 7. Ngoài phạm vi

- Trang catalog công khai và SEO — P1.13.
- Thư viện cá nhân của User — P1.12.
- Studio tìm kiếm nội dung — P2.6.
- Tìm kiếm ngữ nghĩa bằng embedding — P4.
- Nâng cấp search engine — sau MVP (§11 Q1).
