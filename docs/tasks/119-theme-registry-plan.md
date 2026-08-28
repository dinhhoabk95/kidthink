# Task #119 — Registry chủ đề: một nguồn, mười bốn giá trị, một cổng biết đỏ

> **Loại task:** cổng + từ vựng (M) — tách từ WP113.5 của
> [`Task #113`](113-game-engine-depth-and-seed-diversity-plan.md).
> **Spec sở hữu:** [`content-theme-registry.md`](../specs/05-content/content-theme-registry.md)
> — đóng, `status: draft` → `implemented` ở cuối task.
> **Spec đọc kèm:** [`content-tagging.md`](../specs/01-platform/content-tagging.md) mục 7.2 ·
> [`level-generator-kit.md`](../specs/01-platform/level-generator-kit.md) mục 7.2.
> **Chặn bởi:** quyết định `Q119-1` (chốt 14 giá trị) và `Q119-2` (trần catalog).

## 1. Trả lời ngắn

Trục `theme` có **ba nguồn sự thật** trong mã, không nguồn nào thắng:

| Nguồn | Ở đâu | Số giá trị |
|---|---|---:|
| Cổng `thinking-coverage` | `packages/db/tests/gates/thinking-coverage.ts:141` `CANONICAL_THEME_TAGS` | **22** |
| Từ vựng seed | `packages/db/src/seed-master/content-tags.ts` `axis: "theme"` | **12** |
| Spec | mục 7.2 của [`content-tagging.md`](../specs/01-platform/content-tagging.md) | khác cả hai |

`packages/shared/src/constants/` **chưa tồn tại** — chỗ mà `BR-CTR-12` chỉ định làm nguồn duy
nhất còn là thư mục trống.

Hệ quả đo được: `farm` là giá trị dùng nhiều thứ hai toàn corpus (42 level) nhưng **không có**
trong từ vựng seed 12 giá trị; `household` và `technology` đang làm cổng `thinking-coverage`
**đỏ** với 7 vi phạm `BR-TCM-01`; `home` và `household` cùng tồn tại nên trần tập trung không
phát hiện được tập trung thật.

Task #119 gộp ba nguồn về một, chốt 14 giá trị theo mục 7.1a của spec, gắn lại **14 level**, và
dựng `check:theme-registry` có ca âm.

## 2. Bằng chứng đã đo (2026-08-29)

### 2.1 Ba nguồn, không giao nhau

`CANONICAL_THEME_TAGS` (22): `farm` `jungle` `ocean` `space` `school` `home` `park` `vehicles`
`food` `dino` `fairytale` `seasons` `animal` `fruit` `vegetable` `vehicle` `shape` `family`
`weather` `festival` `body` `nature`.

Từ vựng seed (12): `farm` `jungle` `ocean` `space` `school` `home` `park` `vehicles` `food`
`dino` `fairytale` `seasons`.

Danh sách 22 chứa cả `vehicle` lẫn `vehicles`, cả `home` lẫn — qua corpus — `household`. Đó là
dấu hiệu của hợp hai danh sách mâu thuẫn thay vì hoà giải chúng.

### 2.2 Bảy vi phạm đang làm cổng đỏ

`household` (2 level) và `technology` (1 level) không thuộc bất kỳ nguồn nào; `art` (4 level)
cũng không. Cổng `thinking-coverage.test.ts` fail **1 / 798** hôm nay vì đúng chỗ này.

### 2.3 Mười bốn level phải gắn lại

Theo mục 7.1b của spec: `park`→`nature` (6) · `fruit`→`food` (3) · `shape`→trục `what` (2) ·
`household`→`home` (2) · `technology`→`home` (1). Tổng **14**.

**Một trăm level** mang `farm` `home` `ocean` `space` `art` **không** gắn lại — chúng được nâng
thành giá trị hợp lệ ở 7.1a. Đó là chủ ý ghi trong spec: từ vựng phải mô tả được thứ người soạn
thật sự cần.

### 2.4 Lệnh tái dựng

```bash
cd mindkid
export PATH=/Users/macbook/.nvm/versions/node/v24.15.0/bin:$PATH
sed -n '141,164p' packages/db/tests/gates/thinking-coverage.ts
grep -A1 'axis: "theme"' packages/db/src/seed-master/content-tags.ts | grep "code:"
ls packages/shared/src/constants/ 2>/dev/null || echo "thư mục chưa tồn tại"
pnpm --filter @mindkid/db report:tags
```

## 3. Work package

### WP119.1 — Chốt từ vựng

**Cỡ:** S · **cổng người, không có PR mã**

1. Trình bảng 7.1a (14 giá trị) và bảng 7.1b (giá trị bị loại) cho người quyết.
2. Chốt `Q119-1`: nhận 14 giá trị, hoặc bác bằng danh sách thay thế. Cấm nhận một phần rồi
   sửa dần — nửa từ vựng đóng là từ vựng không đóng.
3. Chốt `Q119-2`: trần catalog 25 % hay 20 % (`BR-CTR-04`). `school` đang ở 37 %.
4. Chốt trần trong một engine (`BR-CTR-05`).

### WP119.2 — Một nguồn sự thật

**Cỡ:** M · **File:** 4 · **Ranh giới PR:** `packages/shared`, `packages/db`

1. Tạo `packages/shared/src/constants/content-themes.ts`: 14 mục, mỗi mục có `code`, `label`,
   `age_floor`, mô tả bối cảnh — hình dạng ở mục 7.2 của spec.
2. `packages/db/src/seed-master/content-tags.ts` trục `theme` **import** từ đó, bỏ danh sách riêng.
3. `CANONICAL_THEME_TAGS` ở `tests/gates/thinking-coverage.ts` **import** từ đó, bỏ `Set` viết tay.
4. Mục 7.2 của [`content-tagging.md`](../specs/01-platform/content-tagging.md) trỏ về file mới,
   không chép lại danh sách. Sửa spec **trong cùng PR**.
5. Test: đếm số nơi định nghĩa danh sách chủ đề trong monorepo — kỳ vọng **1**.

**Cấm — NEVER** để `packages/shared` kéo thêm dependency runtime vì file này. Nó là hằng số
thuần; barrel `shared` đã có nợ rò xuống client, đừng thêm.

### WP119.3 — `check:theme-registry`

**Cỡ:** M · **File:** 2 cộng fixture · **Ranh giới PR:** `packages/db`

Cổng đọc corpus seed, kiểm bốn thứ:

| Phép kiểm | Rule |
|---|---|
| Mọi `theme_tag` thuộc 14 giá trị | `BR-CTR-01` |
| Mọi `game_level` có `theme_tag`, không rỗng | `BR-CTR-03` |
| Không chủ đề nào vượt trần catalog | `BR-CTR-04` |
| Không chủ đề nào vượt trần trong một engine | `BR-CTR-05` |
| Chủ đề dùng ở band dưới `age_floor` → đỏ | `BR-CTR-09` |

**Ca âm bắt buộc** (`BR-CTR-02`), fixture ở `packages/db/tests/**/fixtures/`:
- chủ đề bịa `banh_trung_thu_2026` → đỏ;
- `theme_tag` rỗng → đỏ;
- một chủ đề vượt trần → đỏ;
- `space` (`age_floor: 5`) gắn cho level band `3-4` → đỏ.

Nguồn không đọc được → **đỏ**. Gốc repo từ `repoPath()`, không `process.cwd()`.

Trần catalog bật ở chế độ **bậc thang**: `school` đang 37 %, không thể xanh ngay. Ngưỡng hiện
tại ghi kèm ngày trong `packages/db/config/theme-caps.json`; chỉ được **giảm**. Nội dung mới ở
[`Task #122`](122-engine-content-depth-plan.md) hạ tỉ lệ `school` xuống bằng cách thêm level
chủ đề khác, không bằng cách xoá level `school`.

### WP119.4 — Gắn lại mười bốn level

**Cỡ:** S · **Ranh giới PR:** một PR

1. `park`→`nature` (6) · `fruit`→`food` (3) · `household`→`home` (2) · `technology`→`home` (1).
2. `shape` (2) chuyển sang trục `what`, giá trị `geometry` — **không** phải đổi tên chủ đề, mà
   là bỏ `theme_tag` sai và thêm tag trục `what`.
3. Mọi thay đổi là **version mới** (`BR-CTR-10`). Cấm `UPDATE` tại chỗ.
4. Nhận `art` vào từ vựng — 4 level đang mang nó trở thành hợp lệ, không phải gắn lại.
5. Sau bước này `thinking-coverage.test.ts` phải xanh: 7 vi phạm `BR-TCM-01` về 0.

### WP119.5 — Vốn từ cho mỗi chủ đề

**Cỡ:** S · **Ranh giới PR:** `packages/db`

`BR-CTR-08` buộc mỗi giá trị có mục vốn từ ở mục 7.2 của
[`level-generator-kit.md`](../specs/01-platform/level-generator-kit.md): danh từ và emoji trong
`emoji_registry`.

Bốn chủ đề chưa có level nào — `family` `body` `weather` `festival` — vẫn phải có vốn từ, nếu
không [`Task #121`](121-level-generator-kit-plan.md) không sinh được nội dung cho chúng.

Cổng: mỗi chủ đề trong từ vựng có ≥ N danh từ kèm emoji resolve được. N chốt cùng `Q119-1`.

## 4. Điều kiện nghiệm thu

1. `grep -rn "theme"` tìm được **đúng một** định nghĩa danh sách chủ đề trong monorepo.
2. `check:theme-registry` xanh trên corpus sau WP119.4, và **đỏ** với chủ đề bịa đặt.
3. Bốn ca âm đều đỏ vì đúng lý do.
4. `thinking-coverage.test.ts` xanh — hôm nay 1 fail / 798.
5. 14 level đã gắn lại bằng version mới; không câu `UPDATE` nào chạm bản published.
6. Mỗi chủ đề trong 14 giá trị có vốn từ; emoji resolve được.
7. `theme-caps.json` ghi ngưỡng hiện tại kèm ngày; test khẳng định ngưỡng chỉ giảm.
8. `pnpm --filter @mindkid/db test` xanh; danh sách test trùng khít trừ test mới.
9. `content-theme-registry.md` mang `status: implemented`; mục 7.2 của `content-tagging.md` trỏ
   về file hằng số, không chép danh sách.

## 5. Ranh giới

**Always**
- Một nguồn sự thật, ba chỗ còn lại import.
- Version mới cho mọi lần gắn lại tag.
- Ca âm trước khi bật phép kiểm.

**Ask first**
- Thêm giá trị ngoài 14 (`BR-CTR-11`).
- Đổi ngưỡng trần sau khi đã chốt.

**Never**
- Giữ danh sách chủ đề thứ hai ở bất kỳ đâu.
- Nhánh slug dự phòng cho trục `theme` (`BR-CTR-01`) — cùng lỗi mà `SLUG_REGEX` đã gây ở Task #117.
- `UPDATE` tag của bản đã publish.
- Xoá level `school` để hạ tỉ lệ. Trần hạ bằng cách thêm nội dung khác.
- Đóng trục `what` ở task này — nó chờ `Q117-3`.

## 6. Câu hỏi mở

| # | Câu hỏi | Chặn gì | Chủ |
|---|---|---|---|
| `Q119-1` | Nhận 14 giá trị của mục 7.1a, hay bác bằng danh sách khác? Kèm N — số danh từ tối thiểu mỗi chủ đề | Toàn bộ task, và Task #121 #122 | Nội dung + Product |
| `Q119-2` | Trần catalog 25 % hay 20 %; trần trong một engine bao nhiêu | WP119.3, ngân sách nội dung Task #122 | Product |
| `Q119-3` | `shape` chuyển sang trục `what` giá trị `geometry` — giá trị đó đã có trong từ vựng `what` chưa? Nếu chưa, nó chờ `Q117-3` | 2 level | Nội dung |
