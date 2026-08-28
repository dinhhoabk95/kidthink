---
spec: CONTENT-THEME-REGISTRY
title: Registry chủ đề nội dung — trục thứ tư, đóng và có trần
area: content
status: draft
mvp: false
phase: P4
reviewed: 2026-08-29
owns:
  - Từ vựng đóng trục theme và việc cưỡng chế nó
  - Trần tập trung chủ đề trên catalog và trên một engine
  - Cổng ép từ vựng theme và đường gắn lại tag cho nội dung cũ
depends_on:
  - CONTENT-TAGGING
  - EMOJI-REGISTRY
  - CONTENT-LIFECYCLE
  - ENGINE-CONTENT-DEPTH
---

# Registry chủ đề nội dung — trục thứ tư, đóng và có trần

## 1. Objective

[`content-tagging.md`](../01-platform/content-tagging.md) mục 7.2 **đã có** một từ vựng trục
`theme` — mười hai giá trị, khai là "trục thứ tư, tuỳ chọn". Vấn đề không phải là thiếu từ
vựng. Vấn đề là từ vựng đó **không ai sở hữu và không cổng nào ép**: `BR-TAG-02` (mỗi nội
dung published có ≥1 tag mỗi trục) cố ý chỉ ép ba trục sư phạm, nên `theme` trôi tự do.

Đo ngày 2026-08-29 trên 228 game level:

| Số đo | Giá trị |
|---|---|
| Level mang `theme_tag` thuộc từ vựng | 128 |
| Level mang giá trị **ngoài** từ vựng | **100** — 44% |
| Giá trị ngoài từ vựng | `farm` 42 · `home` 33 · `ocean` 8 · `park` 6 · `space` 4 · `art` 4 · `household` 2 · `technology` 1 |
| Giá trị trong từ vựng chưa dùng lần nào | `vegetable` · `family` · `weather` · `festival` · `body` |
| Chủ đề tập trung nhất | `school` 84 level — **37%** |

Giá trị dùng nhiều thứ hai toàn corpus, `farm` với 42 level, nằm **ngoài** từ vựng. Đó không
phải vài trường hợp lọt lưới; đó là từ vựng và thực tế biên soạn đã tách đôi.

Đối chiếu: trục `thinking` đo cùng ngày có **0 lượt ngoài từ vựng** — nó đã được đóng thật
kèm ca âm. Trục `what` thì **160 trên 239 lượt** nằm ngoài. Ba trục, ba mức độ cưỡng chế
khác nhau, và mức độ đó dự đoán chính xác độ trôi.

File này nhận quyền sở hữu trục `theme`: chốt lại từ vựng, đặt trần tập trung, và nêu đường
gắn lại tag cho nội dung đã published mà không phá `BR-CLC-01` (bản published bất biến).
Nó cấm — NEVER đụng ba trục sư phạm; ba trục đó thuộc
[`content-tagging.md`](../01-platform/content-tagging.md).

## 2. Actors

| Actor | Quyền cần | Làm được gì ở đây |
|---|---|---|
| Người soạn nội dung | `content_reviewer` | Chọn `theme_tag` từ từ vựng. Cấm — NEVER tự chế giá trị mới |
| Cổng chủ đề | — | Ép từ vựng, đo trần tập trung, chặn khi thủng |
| Bộ sinh level | — | Nhận `theme` làm tham số sinh, lấy vốn từ theo chủ đề |
| Người quyết | — | Thêm giá trị mới vào từ vựng. Thêm chủ đề là quyết định sản phẩm |

## 3. Entry points

| Route / màn hình | Actor | Ghi chú |
|---|---|---|
| `packages/shared/src/constants/content-themes.ts` | Dev | Từ vựng Lớp 1, nguồn sự thật |
| `pnpm --filter @mindkid/db check:theme-registry` | Cổng chủ đề | Chạy trong cổng tự động trước khi merge |
| `docs/specs/01-platform/engines/GT-<nnn>.md` mục 6 | Người soạn | Ma trận seed nêu chủ đề mục tiêu của engine đó |
| [`game-catalog-public.md`](../02-public/game-catalog-public.md) | Khách | Chủ đề là một bộ lọc người dùng thấy. Đó là lý do nó phải đóng |

## 4. Main flow

1. Cổng đọc từ vựng Lớp 1 và corpus seed.
2. Với mỗi level `published`, cổng lấy `theme_tag`.
3. Giá trị không thuộc từ vựng thì cổng **dừng ngay**, nêu tên giá trị và file. Cấm — NEVER
   nhánh slug dự phòng.
4. Cổng tính tỉ lệ mỗi chủ đề trên toàn catalog và trên từng engine.
5. Cổng so với trần ở mục 7.3.
6. Thủng trần thì in tên chủ đề, tỉ lệ hiện tại, và số level cần thêm ở chủ đề khác để hạ tỉ lệ.
7. Có chủ đề thủng trần thì mã thoát khác 0.

## 5. Alternative flows

| Nhánh | Điều kiện | Hành vi |
|---|---|---|
| Giá trị ngoài từ vựng | Người soạn tự chế | Dừng. Không có nhánh chấp nhận. Cùng lập trường với `BR-TCM-01` (từ vựng đóng thật) |
| `theme_tag` để trống | Người soạn quên | Cổng đỏ. Chủ đề bắt buộc trên game level; không có giá trị mặc định |
| Nội dung đã published mang giá trị cũ | Corpus trước khi đóng từ vựng | Gắn lại tag là **version mới**, không phải `UPDATE` — `BR-CLC-01`. Đường đi ở mục 7.4 |
| Trần thủng do archive | Gỡ nội dung ở chủ đề khác | Cảnh báo, không chặn. Cùng lý do với `BR-TCM-08` |
| Chủ đề mới cần cho một lô nội dung | Ví dụ lô Tết | Thêm vào từ vựng qua PR, cần người quyết. Không có đường tắt |

## 6. Business rules

| ID | Rule | Vì sao |
|---|---|---|
| `BR-CTR-01` (từ vựng đóng thật) | `theme_tag` phải thuộc từ vựng ở mục 7.1. Giá trị ngoài làm cổng đỏ, cấm — NEVER nhánh slug dự phòng | Không cưỡng chế là lý do 100 trên 228 level đang mang giá trị ngoài từ vựng của mục 7.2 trong [`content-tagging.md`](../01-platform/content-tagging.md), và giá trị dùng nhiều thứ hai toàn corpus (`farm`, 42 level) nằm ngoài danh sách |
| `BR-CTR-02` (cổng có ca âm) | Cổng phải có test ca âm: một chủ đề bịa đặt phải làm cổng đỏ | Cổng không có ca âm là cổng không biết mình hỏng |
| `BR-CTR-03` (bắt buộc trên game level) | Mọi `game_level` có `theme_tag`, không rỗng, không mặc định | Chủ đề là bộ lọc người dùng thấy. Ô trống nghĩa là màn chơi đó không tìm thấy được |
| `BR-CTR-04` (trần catalog) | Không chủ đề nào vượt trần tỉ lệ ở mục 7.3 trên toàn catalog | `school` đang ở 37%. Trẻ chơi mười màn thấy chín màn cùng bối cảnh |
| `BR-CTR-05` (trần trong một engine) | Không chủ đề nào vượt trần tỉ lệ **trong một engine** | Trần toàn catalog đạt được mà một engine vẫn có thể toàn chủ đề `school`; trẻ chơi theo engine, không chơi theo catalog |
| `BR-CTR-06` (chủ đề không phải nội dung học) | Giá trị mô tả **nội dung học** cấm — NEVER nằm ở trục `theme` | `shape` đang là `theme_tag` của 2 level. Nó thuộc trục `what`. Trộn hai trục làm cả hai phép đo sai |
| `BR-CTR-07` (không hai tên cho một thứ) | Từ vựng cấm chứa hai giá trị chỉ cùng một bối cảnh | `home` và `household` đang cùng tồn tại. Hai tên chia đôi số đếm và làm trần không phát hiện được tập trung thật |
| `BR-CTR-08` (chủ đề có vốn từ) | Mỗi giá trị trong từ vựng có mục vốn từ tương ứng ở [`level-generator-kit.md`](../01-platform/level-generator-kit.md) mục 7.2 | Một chủ đề không có danh từ và emoji đi kèm là một chủ đề không soạn nội dung được |
| `BR-CTR-09` (sàn tuổi của chủ đề) | Mỗi chủ đề khai `age_floor`; nội dung dùng chủ đề đó ở band thấp hơn bị chặn | `technology` không phải bối cảnh của trẻ 3 tuổi. Đây là ràng buộc sư phạm, không phải độ khó |
| `BR-CTR-10` (gắn lại tag là version mới) | Đổi `theme_tag` của nội dung đã published là **version mới**, cấm — NEVER `UPDATE` tại chỗ | `BR-CLC-01` và `BR-CSA-01` (seed chỉ INSERT) không có ngoại lệ cho việc dọn tag |
| `BR-CTR-12` (một nguồn sự thật) | Từ vựng `theme` sống ở **một** chỗ: `packages/shared/src/constants/content-themes.ts`. Mục 7.2 của [`content-tagging.md`](../01-platform/content-tagging.md), `seed-master/content-tags.ts`, và `CANONICAL_THEME_TAGS` của cổng phải trỏ về đó, cấm — NEVER giữ danh sách riêng | Bốn nguồn ở mục 7.1, hai nguồn đầu giao nhau đúng hai giá trị, nguồn thứ ba hoà giải bằng cách hợp cả hai thành 22 giá trị. Hợp hai danh sách mâu thuẫn không phải là đóng từ vựng; nó là hợp thức hoá cả hai |
| `BR-CTR-11` (thêm chủ đề cần người quyết) | Thêm giá trị mới vào từ vựng đi qua PR và cần người quyết | Từ vựng mở dần bằng PR của người soạn là từ vựng sẽ trôi lại như hôm nay |

## 7. Data

**Đọc:** `packages/shared/src/constants/content-themes.ts` · corpus seed.
**Ghi:** không ghi database. Đầu ra là báo cáo và mã thoát.

### 7.1 Bốn nguồn đang chạy song song

Trục `theme` không có một từ vựng bị bỏ quên. Nó có **bốn** nguồn, và chúng lệch nhau:

| # | Nguồn | Giá trị | Có cổng ép |
|---|---|---|---|
| 1 | Mục 7.2 của [`content-tagging.md`](../01-platform/content-tagging.md) | 12: `animal` `fruit` `vegetable` `vehicle` `shape` `family` `school` `weather` `festival` `body` `food` `nature` | Không |
| 2 | `packages/db/src/seed-master/content-tags.ts`, Lớp 1 trong database | 12: `farm` `jungle` `ocean` `space` `school` `home` `park` `vehicles` `food` `dino` `fairytale` `seasons` | Không |
| 3 | `CANONICAL_THEME_TAGS` ở `packages/db/tests/gates/thinking-coverage.ts` | **22** — hợp của nguồn 1 và 2 | **Có** — `BR-TCM-01` |
| 4 | Corpus seed thật, 228 level | 15: `school` 84 · `farm` 42 · `home` 33 · `animal` 14 · `nature` 11 · `ocean` 8 · `food` 7 · `vehicle` 7 · `park` 6 · `space` 4 · `art` 4 · `fruit` 3 · `shape` 2 · `household` 2 · `technology` 1 | — |

Giao của nguồn 1 và nguồn 2 là **hai** giá trị: `school` và `food`. Nguồn 3 là cổng duy nhất
thật sự chạy, và nó giải quyết mâu thuẫn bằng cách **hợp cả hai** — 22 giá trị. Nguồn 4 dùng
ba giá trị chưa nguồn nào có: `art` (4 level), `household` (2), `technology` (1).

**Cổng đó đang đỏ.** `packages/db/tests/gates/thinking-coverage.test.ts` fail với 7 vi phạm
`BR-TCM-01`, đúng ba giá trị vừa nêu. Đây là hỏng đã có trước Task #113, và mục 7.1b dưới đây
là đường sửa nó.

Có cả lệch dạng số: nguồn 1 viết `vehicle`, nguồn 2 viết `vehicles`, nguồn 3 chứa **cả hai**,
corpus dùng `vehicle`.

Đây là cùng một hỏng đã ghi ở mục 2.4 của
[`89-game-engine-scale-out-plan.md`](../../tasks/89-game-engine-scale-out-plan.md) cho trục
`what` và `thinking`, chưa ai đóng. Số đo 2026-08-29 cho thấy nó phân nhánh khác nhau ở từng trục:

| Trục | Corpus theo nguồn nào | Lượt ngoài từ vựng của spec |
|---|---|---:|
| `thinking` | **spec thắng** — corpus dùng đúng 12 giá trị của spec, Lớp 1 không giá trị nào được dùng | 0 / 284 |
| `what` | **hoà** — corpus dùng 9 giá trị của spec và 11 giá trị của Lớp 1 | 160 / 239 |
| `theme` | **Lớp 1 thắng** — 6 trong 8 giá trị "ngoài spec" là giá trị của Lớp 1 | 100 / 228 level |

### 7.1a Từ vựng chốt — mười bốn giá trị

Hoà giải ba nguồn: giữ giá trị đang dùng thật, gộp giá trị trùng nghĩa, bỏ giá trị không phải
bối cảnh và giá trị chưa nguồn nào dùng.

| Giá trị | Bối cảnh | `age_floor` | Level | Nguồn 1 | Nguồn 2 | Nguồn 3 |
|---|---|:--:|---:|:--:|:--:|:--:|
| `school` | Lớp học, đồ dùng học tập | 3 | 84 | Có | Có | Có |
| `farm` | Nông trại, vật nuôi, cây trồng | 3 | 42 | Không | Có | Có |
| `home` | Nhà cửa, đồ dùng trong nhà | 3 | 33 | Không | Có | Có |
| `animal` | Động vật hoang dã. Gộp `jungle`, `dino` | 3 | 14 | Có | Không | Có |
| `nature` | Cây cỏ, mùa, công viên. Gộp `park`, `seasons` | 3 | 11 | Có | Không | Có |
| `ocean` | Biển, sinh vật biển | 4 | 8 | Không | Có | Có |
| `food` | Thức ăn, bữa ăn. Gộp `fruit`, `vegetable` | 3 | 7 | Có | Có | Có |
| `vehicle` | Phương tiện giao thông. Dạng số ít thắng | 3 | 7 | Có | `vehicles` | cả hai |
| `art` | Vẽ, nhạc, thủ công | 4 | 4 | Không | Không | **Không — cổng đang đỏ** |
| `space` | Vũ trụ, hành tinh | 5 | 4 | Không | Có | Có |
| `family` | Gia đình, người thân | 3 | 0 | Có | Không | Có |
| `body` | Cơ thể, giác quan | 3 | 0 | Có | Không | Có |
| `weather` | Thời tiết | 3 | 0 | Có | Không | Có |
| `festival` | Lễ Tết, Trung thu | 4 | 0 | Có | Không | Có |

Bốn giá trị cuối chưa có level nào. Chúng ở lại vì `BR-CTR-04` (trần catalog) buộc `school`
phải nhường chỗ, và vì lễ Tết là bối cảnh gần trẻ Việt Nam nhất mà corpus đang không có.

### 7.1b Giá trị bị loại và đường gắn lại

| Bị loại | Nguồn | Vì sao | Level | Gắn lại thành |
|---|---|---|---:|---|
| `park` | Lớp 1, corpus | Tập con của `nature` ở lứa mầm non | 6 | `nature` |
| `fruit` | spec, corpus | Tập con của `food` — `BR-CTR-07` | 3 | `food` |
| `shape` | spec, corpus | Nội dung học, không phải bối cảnh — `BR-CTR-06` | 2 | trục `what`, giá trị `geometry` |
| `technology` | corpus | Không phải bối cảnh của trẻ 3–6 | 1 | `home` |
| `household` | corpus | Trùng `home` — cổng đang đỏ vì giá trị này | 2 | `home` |
| `vegetable` | spec | Tập con của `food` | 0 | — |
| `jungle` · `dino` | Lớp 1 | Tập con của `animal` | 0 | — |
| `fairytale` · `seasons` | Lớp 1 | `seasons` gộp vào `nature`; `fairytale` là thể loại, không phải bối cảnh | 0 | — |
| `vehicles` | Lớp 1 | Trùng `vehicle`, khác dạng số | 0 | `vehicle` |

Nhận `art` vào từ vựng và gắn lại 3 level mang `household` và `technology` làm **cổng
`thinking-coverage` xanh trở lại** — đó là 7 vi phạm `BR-TCM-01` đang fail hôm nay.

**Mười bốn level** phải gắn lại tag. Một trăm level mang `farm`, `home`, `ocean`, `space`,
`art` **không** phải gắn lại — chúng được nâng thành giá trị hợp lệ ở mục 7.1a. Đó là chủ ý:
từ vựng phải mô tả được thứ người soạn thật sự cần, nếu không nó bị đi vòng lần nữa.

### 7.2 Hình dạng một mục từ vựng

| Field | Kiểu | Ràng buộc |
|---|---|---|
| `code` | `string` | `^[a-z][a-z_]{2,15}$`, bất biến sau khi merge |
| `label_vi` | `string` | Chuỗi hiển thị, tiếng Việt |
| `age_floor` | `3 \| 4 \| 5 \| 6` | `BR-CTR-09` |
| `icon_emoji_ref` | `EmojiRef` | Phải resolve trong `emoji_registry` |

### 7.3 Trần tập trung

| Phạm vi | Trần | Chặn từ phase | Hiện trạng 2026-08-29 |
|---|:--:|:--:|---|
| Toàn catalog | ≤25% mỗi chủ đề | P4 | `school` 37% — thủng |
| Toàn catalog | ≥8 chủ đề có ≥5 level | P4 | 7 chủ đề đạt — thủng |
| Trong một engine | ≤50% mỗi chủ đề | P5 | chưa đo được, 21 engine mới có 3 level |

Trần trong một engine để P5 vì ở 3 level thì một chủ đề luôn chiếm ≥33%; ép trần trước khi
[`engine-content-depth.md`](engine-content-depth.md) bậc 1 đạt là ép một phép chia vô nghĩa.

### 7.4 Đường gắn lại tag cho nội dung cũ

Nội dung đã published bất biến. Mười bốn level ở mục 7.1b phải đổi `theme_tag`. Đường đi:

1. Soạn version mới của 14 level ở mục 7.1b với `theme_tag` thuộc từ vựng.
2. Seed version mới; bản cũ chuyển `archived` theo `BR-CSA-01` (seed chỉ INSERT).
3. Cổng chủ đề bỏ qua bản `archived`, nên số đo sạch ngay sau lô đó.

## 8. API contract

### `GET /api/guest/themes`

| | |
|---|---|
| Auth | không |
| 200 | `{ themes: [{ code, label_vi, icon_emoji_ref, level_count }] }` |

Trang danh mục ở [`game-catalog-public.md`](../02-public/game-catalog-public.md) dùng để dựng
bộ lọc chủ đề. Chỉ trả chủ đề có `level_count` lớn hơn 0 — một bộ lọc không ra kết quả nào là
một bộ lọc hỏng.

| Mã lỗi | HTTP |
|---|---|
| `THEME_NOT_SUPPORTED` | 422 — lọc theo chủ đề ngoài từ vựng |

## 9. Acceptance criteria

```gherkin
Scenario: BR-CTR-01 — chủ đề ngoài từ vựng làm cổng đỏ
  Given một level mang theme_tag là "dinosaur"
  And "dinosaur" không thuộc từ vựng
  When chạy check:theme-registry
  Then cổng thoát với mã khác 0
  And thông báo nêu tên giá trị và file chứa nó

Scenario: BR-CTR-02 — cổng có ca âm
  Given bộ test của cổng chủ đề
  When đọc danh sách test
  Then có một test gắn chủ đề bịa đặt và khẳng định cổng đỏ

Scenario: BR-CTR-03 — theme_tag rỗng bị chặn
  Given một level không có theme_tag
  When chạy check:theme-registry
  Then cổng thoát với mã khác 0
  And không có giá trị mặc định nào được gán

Scenario: BR-CTR-04 — chủ đề vượt trần catalog làm cổng đỏ
  Given 84 trên 228 level mang theme_tag là school
  When chạy check:theme-registry ở phase P4
  Then cổng thoát với mã khác 0
  And báo cáo in "school 37% vượt trần 25%"
  And báo cáo nêu số level cần thêm ở chủ đề khác

Scenario: BR-CTR-09 — chủ đề dưới sàn tuổi bị chặn
  Given chủ đề space khai age_floor là 5
  And một level band 3-4 mang theme_tag là space
  When chạy check:theme-registry
  Then cổng thoát với mã khác 0

Scenario: BR-CTR-10 — đổi theme_tag của bản published là version mới
  Given một level đã published mang theme_tag là household
  When lô dọn tag chạy
  Then một hàng mới được INSERT với content_version tăng
  And hàng cũ chuyển archived
  And không hàng nào bị UPDATE

Scenario: BR-CTR-06 — giá trị nội dung học không nằm ở trục theme
  When đọc từ vựng theme
  Then không giá trị nào trùng với một giá trị của trục what

Scenario: GET /api/guest/themes chỉ trả chủ đề có nội dung
  Given chủ đề technology có 0 level published
  When khách gọi GET /api/guest/themes
  Then technology không có trong danh sách
```

## 10. Boundaries

**Always**
- Ép từ vựng bằng cổng có ca âm.
- Đo trần trên corpus seed, cùng nguồn với [`engine-content-depth.md`](engine-content-depth.md).
- Gắn lại tag bằng version mới.
- Cho mỗi chủ đề một mục vốn từ trước khi dùng nó.

**Ask first**
- Thêm một giá trị mới vào từ vựng.
- Nới trần tập trung.
- Đổi `age_floor` của một chủ đề đang có nội dung.

**Never**
- Nhánh slug dự phòng cho `theme_tag`.
- Giá trị mặc định khi `theme_tag` rỗng.
- Hai giá trị cho cùng một bối cảnh.
- Đưa nội dung học vào trục `theme`.
- `UPDATE` `theme_tag` của bản đã published.

## 11. Open questions

| # | Câu hỏi | Chặn gì | Chặn phase | Chủ |
|---|---|---|---|---|
| 1 | Trần catalog đặt 25% hay 20%? 25% cho `school` phải hạ từ 84 xuống ≤71 level hoặc corpus phải lên 336 level; 20% thì lên 420 | Bật `BR-CTR-04` | P4 | người quyết |
| 2 | Bốn giá trị chưa có level nào (`family`, `body`, `weather`, `festival`) giữ lại hay bỏ? Giữ thì `BR-CTR-08` (chủ đề có vốn từ) đòi vốn từ cho chủ đề chưa dùng; bỏ thì trần `school` khó hạ hơn | Phạm vi từ vựng | P4 | Nội dung |
| 3 | `age_floor` của `ocean` là 4 hay 3? Trẻ 3 tuổi biết con cá; câu hỏi là bối cảnh biển có thêm gánh nặng nhận thức nào không | `BR-CTR-09` áp cho `ocean` | P4 | Nội dung |
| 4 | Chủ đề có nên là trục thứ tư trong [`content-tagging.md`](../01-platform/content-tagging.md) hay giữ tách ra? Trùng câu hỏi 4 ở mục 7 của [`89-game-engine-scale-out-plan.md`](../../tasks/89-game-engine-scale-out-plan.md), nơi đã nêu lựa chọn tách trục thứ tư cho tag mô tả | Vị trí của `BR-CTR-01` trong corpus | P4 | người quyết |
