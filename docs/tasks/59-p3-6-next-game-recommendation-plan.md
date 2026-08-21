# Kế hoạch — Task #59: P3.6 — Gợi ý nội dung kế tiếp

> Viết 2026-08-11, đo tại commit `484ebaf` trên working tree đang triển khai P0.9.
> Bước sở hữu: **P3.6** của
> [`14-implementation-sequence-todo.md`](14-implementation-sequence-todo.md).
> Spec sở hữu: [`next-game-recommendation.md`](../specs/04-play/next-game-recommendation.md).
> Task trước: [`58-p3-5-adaptive-mastery-plan.md`](58-p3-5-adaptive-mastery-plan.md).
>
> ```sh
> export PATH=/Users/macbook/.nvm/versions/node/v24.15.0/bin:$PATH
> ```

## Tóm tắt

Gợi ý chạy bằng **luật**, không ML. Sáu bậc ưu tiên, mỗi bậc một truy vấn, mọi ứng viên qua
gating trước khi hiện.

Bốn sự thật chi phối kế hoạch:

1. **Thang ưu tiên và acceptance criteria không nói cùng một điều về bậc cuối.** §4 đặt `revision`
   ở bậc 4 và `popular` ở bậc 6; acceptance criteria lại nói trẻ đã chơi hết nội dung hợp tuổi
   thì primary phải là `revision`. Bậc cuối trong thang là `popular`, nhưng ca kiểm đòi
   `revision`.
2. **Ca "mọi ứng viên đều bị khoá bậc" tự mâu thuẫn.** Alt flow yêu cầu gợi ý một level mở được
   cộng một level khoá — nhưng tiền đề của ca đó là **không có** level mở được nào.
3. **`popular` là code duy nhất chạm dữ liệu tập thể, và acceptance criteria của `BR-REC-06` quét
   theo cách có thể bắt nhầm nó.** Ca kiểm nói "không truy vấn nào đọc lịch sử chơi của
   `child_profile` khác". Bảng tổng hợp `level_daily_stats` không có chiều trẻ, nên nó hợp lệ —
   nhưng chỉ khi ca kiểm được viết để phân biệt hai thứ đó.
4. **Nhiễu ngẫu nhiên đề xuất ở câu hỏi mở số 2 làm test không tái lập được** nếu không có hạt
   giống truyền vào. Đây là cùng một bài học mà `BR-ADP-02` đã trả giá với `new Date()`.

## 0. Điều kiện tiên quyết

| Phụ thuộc | Bước | Điều kiện vào Task 2 trở đi |
|---|---|---|
| P3.5 | P3.5 | `mastery_state` có dữ liệu thật; `masteryLabel` và ngưỡng ZPD đã chốt |
| P3.4 | P3.4 | Bước kế tiếp curriculum và cờ `week_blocked_by_tier` đã có |
| `ACCESS-GATING` | P1.3 | Kiểm quyền **theo lô** cho một danh sách ứng viên |
| `TAXONOMY-SERVICE` | P0.9 | DAG skill và `strength` để đi bậc 3 |
| `TELEMETRY-PIPELINE` | P1.5 | `level_daily_stats.plays_count` được nuôi thật |
| `EMOJI-REGISTRY` | P0.9 | `thumbnail_emoji` phân giải được |
| `PLAY-ENTRY-AND-PROFILE-SELECT` | P1.9 | `assertActiveChild()` và sảnh trẻ |
| `GAME-CATALOG-PUBLIC` | P1.13 | Allow-list `free` cho nhánh guest |

**Stop condition:** trước Task 2, phụ thuộc nào chưa `implemented` thì dừng Task #59.

## 1. Đo được

### 1.1 Bậc cuối của thang không khớp ca kiểm

| Nguồn | Bậc cuối |
|---|---|
| [`next-game-recommendation.md`](../specs/04-play/next-game-recommendation.md) §4 | Bậc 6 — `popular`: level phổ biến nhất hợp tuổi **chưa chơi** |
| Alt flow §5 "Hết nội dung phù hợp" | Gợi ý ôn lại, không để trống |
| Acceptance criteria "không bao giờ trả rỗng" | primary có `reason_code` là `revision` |

Ba câu, hai câu trả lời. Bậc 6 còn mang điều kiện "chưa chơi", nên với một trẻ đã chơi hết nội
dung hợp tuổi thì bậc 6 cũng rỗng — và thang hết bậc. Chỉ `revision` mới bảo đảm không rỗng, vì
nó là bậc duy nhất không đòi nội dung mới.

### 1.2 Ca "mọi ứng viên đều bị khoá" tự mâu thuẫn

Alt flow: "Mọi ứng viên đều bị khoá bậc → Gợi ý **1 level mở được** + 1 level khoá kèm mời nâng
cấp". Nếu mọi ứng viên đều khoá thì không có level mở được để gợi ý. `BR-REC-07` lại nói nội
dung khoá tối đa **1** trong danh sách.

Ghép ba câu: khi mọi thứ đều khoá, hệ thống phải trả một danh sách có tối đa một item khoá và ít
nhất một item mở — tức là một danh sách không tồn tại.

### 1.3 Bậc 2 không có cửa sổ thời gian

| Bậc | Điều kiện | Cửa sổ |
|---|---|---|
| 2 | `p_learn < 0.4` **chạm gần đây** | Không định nghĩa |
| 4 | `last_seen_at > 7 ngày` | 7 ngày |

"Gần đây" ở bậc 2 không có con số. Hai bậc dùng cùng một trường `last_seen_at` theo hai hướng
ngược nhau, nên khoảng trống ở giữa quyết định trẻ rơi vào bậc nào — và hiện không ai định nghĩa
khoảng đó.

### 1.4 Bậc 1 chưa xử lý ca curriculum bị khoá

Bậc 1 trả bước kế tiếp của curriculum. `D-ME` của Task #57 tạo ra trạng thái mới: một tuần mà
mọi item bắt buộc đều khoá bậc thì tuần không mở và player trả `week_blocked_by_tier`.
`BR-REC-01` bắt mọi ứng viên qua gating trước khi hiện.

Chưa spec nào nói bậc 1 làm gì trong ca đó: trả item khoá và vi phạm `BR-REC-01`, hay trả rỗng và
rơi xuống bậc 2. Cần chọn, vì đây là ca thường gặp nhất của người dùng bậc thấp.

### 1.5 `BR-REC-06` và `popular` cần một ranh giới đo được

`BR-REC-06` cấm gợi ý dựa trên "trẻ khác cũng chơi". §7.2 nói `popular` chỉ dùng **số lượt chơi
tổng**. Bảng thật ở [`play.ts`](../../packages/db/src/schema/play.ts) là `level_daily_stats` với
khoá chính `(game_level_id, date)` và cột `plays_count` — **không có chiều trẻ**. Đó là ranh
giới đúng.

Acceptance criteria hiện viết "không truy vấn nào đọc lịch sử chơi của `child_profile` khác".
Câu đó đúng tinh thần nhưng phải được cài thành một phép quét phân biệt được `play_sessions` nối
theo trẻ với một bảng tổng hợp không có cột trẻ, nếu không nó hoặc bắt nhầm hoặc không bắt gì.

### 1.6 Nhiễu ngẫu nhiên chưa có hạt giống

Câu hỏi mở số 2 đề xuất trộn `popular` với nhiễu ngẫu nhiên nhẹ để tránh vòng lặp tự củng cố.
Không có hạt giống truyền vào thì cùng một đầu vào cho hai kết quả, và mọi ca kiểm gợi ý thành
không tái lập được. `BR-ADP-02` đã cấm `new Date()` trong package thuần vì đúng lý do này.

### 1.7 Nhánh guest thiếu tuổi

`GET /api/guest/play/recommendations` trả từ allow-list `free` theo `explore` và `popular`.
`BR-REC-04` bắt mọi gợi ý hợp band tuổi của trẻ. Guest không có `child_profile`, nên không có
`birth_year` và không có band.

Route người dùng thì rõ: `assertActiveChild()` và 428 `NO_ACTIVE_CHILD`. Route guest thì không
có nguồn tuổi nào được khai.

### 1.8 `BR-REC-08` còn ghi sai phase

`BR-REC-08` viết "**P1** dùng luật, không ML". Spec đã chuyển sang P3 theo `D-AM`, và §1 giải
thích rõ chỗ lệch phase đã sửa ở frontmatter. Câu chữ trong rule chưa sửa theo.

### 1.9 Gợi ý nằm trên hai bề mặt nóng

Màn hình tổng kết phiên gọi một gợi ý chính; sảnh trẻ gọi 3–5. Thang sáu bậc, mỗi bậc một truy
vấn, cộng gating theo lô và phân giải emoji. Làm ngây thơ là sáu truy vấn tuần tự cộng một truy
vấn cho mỗi ứng viên.

## 2. Quyết định

**D-MQ — Thang ưu tiên là hàm tổng, và `revision` là bậc cuối.** Mỗi bậc là một hàm trả danh
sách ứng viên hoặc rỗng; hàm gọi lần lượt cho tới khi đủ số lượng. Sắp lại thứ tự cuối thang:
bậc 5 `explore` (cùng competency, chưa chơi, hợp tuổi) → bậc 6 `popular` (phổ biến, hợp tuổi,
chưa chơi) → **bậc 7 `revision`** (đã chơi rồi, ôn lại). `revision` không đòi nội dung mới nên
nó là bậc duy nhất bảo đảm không rỗng, và acceptance criteria "không bao giờ trả rỗng" khớp với
thang thay vì trái nó. Bậc 4 giữ nguyên nghĩa "ôn theo `last_seen_at`", khác bậc 7 là "ôn vì hết
nội dung"; hai bậc dùng chung `reason_code` là `revision` nhưng khác điều kiện.

**D-MR — Cửa sổ "gần đây" của bậc 2 là 7 ngày, cùng mốc với bậc 4.** Hai bậc chia đôi trục thời
gian tại cùng một điểm: bậc 2 áp cho skill chạm **trong** 7 ngày và `p_learn < 0.4`; bậc 4 áp cho
skill chạm **quá** 7 ngày. Không có khoảng trống và không có vùng chồng. Hằng số dùng chung với
`revision_mode` của [`adaptive-engine.md`](../specs/01-platform/adaptive-engine.md) §7.3, khai
một chỗ.

**D-MS — Gating chạy trước khi xếp bậc, và bậc 1 trả rỗng khi bước curriculum bị khoá.** Mỗi bậc
sinh ứng viên rồi lọc quyền **theo lô**, không lọc từng cái. Khi player trả
`week_blocked_by_tier` thì bậc 1 trả rỗng và thang rơi xuống bậc 2 — không trả item khoá làm
primary, vì `BR-REC-01` nói gợi ý thứ không chơi được trên bề mặt trẻ là quảng cáo trá hình. Lời
mời nâng cấp cho ca đó là việc của bề mặt người lớn theo `BR-CUR-06`, không phải của thẻ gợi ý.

**D-MT — Ca "mọi ứng viên đều khoá" nới `BR-REC-07` đúng một chỗ.** Khi thang chạy hết mà không
có ứng viên mở được nào, danh sách được phép gồm **đúng một** item khoá và không có item mở —
thay vì một item mở cộng một item khoá như alt flow đang viết. Sửa alt flow cho khớp. Đây là ca
duy nhất `BR-REC-07` bị nới, và nó vẫn giữ trần một item khoá. Bề mặt trẻ hiện ổ khoá trung tính;
giá và nút mua nằm sau cổng người lớn.

**D-MU — `popular` chỉ đọc bảng tổng hợp không có chiều trẻ, và ca kiểm quét theo cột chứ không
theo tên bảng.** Nguồn duy nhất là `level_daily_stats.plays_count`. Ca kiểm của `BR-REC-06` được
viết lại thành: không truy vấn nào của recommendation nối `play_sessions` hay `telemetry_events`
theo `child_profile_id` khác trẻ đang chơi. Quét theo tên bảng thì hoặc bắt nhầm bảng tổng hợp,
hoặc bỏ sót một nối viết cách khác.

**D-MV — Nhiễu ngẫu nhiên nhận hạt giống làm tham số.** Hàm xếp hạng thuần, nhận `seed` từ tầng
gọi. Production dùng hạt giống theo trẻ và theo ngày, nên cùng một trẻ thấy thứ tự ổn định trong
ngày và đổi qua ngày hôm sau. Test truyền hạt giống cố định. Không `Math.random()` trong hàm xếp
hạng, cùng luật với `BR-ADP-02`.

**D-MW — Guest lấy tuổi từ tham số truy vấn có kiểm, hoặc nhánh tuổi bị tắt.** Hai phương án cho
người sở hữu: (a) route guest nhận `?age_band=` đã validate và lọc theo đó, mặc định là dải rộng
nhất khi thiếu; (b) route guest bỏ điều kiện tuổi và chỉ trả allow-list `free` xếp theo
`popular`. Đề xuất là (a) — trang catalog công khai đã có bộ lọc tuổi, nên nguồn đã tồn tại và
không cần dữ liệu cá nhân nào. Ghi rõ `BR-REC-04` áp cho route người dùng; route guest tuân theo
phương án đã chốt, không im lặng bỏ rule.

**D-MX — Sửa câu chữ `BR-REC-08` theo phase thật.** Rule nói "dùng luật, không ML" — bỏ tiền tố
`P1`. Đổi ML sang luật vẫn là mục "Ask first" ở mục 10, không đổi.

## 3. Contract chốt trước code

```ts
type ReasonCode =
  | "curriculum_next" | "skill_reinforce" | "skill_progression"
  | "revision" | "explore" | "popular";

interface RecommendationTier {
  reason_code: ReasonCode;
  candidates(ctx: RecoContext): Promise<LevelRef[]>;   // rỗng là hợp lệ
}

interface RecoContext {
  childId: number;
  ageBand: AgeBand;
  allowedTiers: AccessTier[];
  recentLevelIds: number[];     // BR-REC-03, ba level gần nhất
  curriculumStep: NextStep | null;
  now: Date;
  seed: number;                 // D-MV
}
```

```text
GET /api/users/play/recommendations?limit=5   → §7.1 · 428 NO_ACTIVE_CHILD
GET /api/guest/play/recommendations           → allow-list free, theo D-MW
```

## 4. Đồ thị phụ thuộc

```text
T1 sửa contract D-MQ…D-MX + human approve
 └──→ T2 khung thang bậc + gating theo lô
       ├──→ T3 sáu bậc sinh ứng viên
       │     └──→ T4 xếp hạng có hạt giống + ca hết nội dung
       │           ├──→ T5 route người dùng
       │           └──→ T6 route guest
       │                 └──→ T7 bề mặt trẻ và lý do cho người lớn
       └──→ T8 evidence và promote
```

## 5. Task

### Task 1 — Sửa contract trước code

**Tiêu chí nghiệm thu**

- [ ] Người sở hữu phê duyệt `D-MQ`…`D-MX`; `D-MT` và `D-MW` duyệt riêng vì đổi hành vi người dùng.
- [ ] Thang §4 viết lại theo `D-MQ`, có bậc 7 `revision`; alt flow "hết nội dung" khớp thang.
- [ ] Cửa sổ 7 ngày của bậc 2 ghi rõ, dùng chung hằng số với `revision_mode`.
- [ ] Alt flow "mọi ứng viên đều khoá" sửa theo `D-MT`; `BR-REC-07` ghi rõ ca nới duy nhất.
- [ ] Ca kiểm `BR-REC-06` viết lại theo `D-MU`.
- [ ] `seed` vào contract hàm xếp hạng; câu hỏi mở số 2 đóng theo `D-MV`.
- [ ] Câu hỏi mở số 1 đóng theo đề xuất giữ cửa sổ ba level, kèm điều kiện mở lại đo được.
- [ ] Nguồn tuổi cho guest chốt theo `D-MW`.
- [ ] `BR-REC-08` bỏ tiền tố `P1`.
- [ ] Không thêm spec mới; không thêm `reason_code` ngoài sáu code đã khai.

**Kiểm chứng:** `pnpm --filter @mindkid/gates test` 0 lỗi, 0 cảnh báo mới.

**Phụ thuộc:** P3.5 · human decision · **Cỡ:** M

### Checkpoint A — Contract

- [ ] T1 xanh; human đã đọc diff.
- [ ] `level_daily_stats.plays_count` có dữ liệu thật; toàn 0 thì bậc `popular` không kiểm được.
- [ ] Không route hay UI nào viết trước checkpoint này.

### Task 2 — Khung thang bậc và gating theo lô

**Tiêu chí nghiệm thu**

- [ ] Mỗi bậc là một `RecommendationTier` độc lập, test được riêng, trả rỗng hợp lệ.
- [ ] Gating chạy **theo lô** trên danh sách ứng viên của từng bậc; test đếm truy vấn.
- [ ] `BR-REC-03`: ba level gần nhất bị loại ở mọi bậc, không chỉ bậc cuối.
- [ ] `BR-REC-04`: lọc band tuổi áp ở mọi bậc của route người dùng.
- [ ] Thang dừng ngay khi đủ `limit`; không chạy bậc thừa.
- [ ] Hàm thang là thuần với đầu vào `RecoContext`; không `new Date()`, không `Math.random()`.

**Kiểm chứng:** `pnpm test -- recommendation-tiers` xanh.

**Phụ thuộc:** Checkpoint A · **Cỡ:** M

### Task 3 — Sáu bậc sinh ứng viên

**Tiêu chí nghiệm thu**

- [ ] Bậc 1 lấy bước kế tiếp từ player; trả **rỗng** khi `week_blocked_by_tier` (`D-MS`).
- [ ] `BR-REC-02`: có curriculum thì primary luôn là bậc 1, kể cả khi mọi `p_learn ≥ 0.9`.
- [ ] Bậc 2 dùng cửa sổ 7 ngày và `p_learn < 0.4`; bậc 4 dùng quá 7 ngày; không chồng, không hở.
- [ ] Bậc 3 đi DAG prerequisite đúng một bước, có trần độ sâu.
- [ ] Bậc 5 `explore` và bậc 6 `popular` lọc "chưa chơi"; bậc 7 `revision` không lọc điều đó.
- [ ] Dưới 3 lần chơi thì nhảy thẳng tới bậc 5, đúng alt flow.
- [ ] Mỗi bậc gắn đúng `reason_code`; không code nào ngoài bảng §7.2.

**Kiểm chứng:** `pnpm test -- recommendation-ladder` xanh; mỗi bậc có ca dương và ca rỗng.

**Phụ thuộc:** T2 · P3.4 · P3.5 · **Cỡ:** 2 work package M — bậc 1–3 và bậc 4–6; mỗi
package ≤5 files

### Checkpoint B — Thang ứng viên

- [ ] Tier framework, six sources và batch gating cùng xanh.
- [ ] Mỗi bậc có ca dương/rỗng; curriculum vẫn ưu tiên và không N+1.
- [ ] Full gate hiện tại xanh trước xếp hạng/route.

### Task 4 — Xếp hạng có hạt giống và ca hết nội dung

**Tiêu chí nghiệm thu**

- [ ] Hàm xếp hạng nhận `seed`; cùng `seed` cho cùng thứ tự, khác `seed` cho thứ tự khác.
- [ ] Production dùng hạt giống theo trẻ và theo ngày; thứ tự ổn định trong ngày.
- [ ] `popular` chỉ đọc `level_daily_stats`; test quét chứng minh không nối theo trẻ khác (`D-MU`).
- [ ] **Ca hết nội dung:** trẻ đã chơi hết nội dung hợp tuổi vẫn nhận primary `revision`, không rỗng.
- [ ] **Ca mọi thứ đều khoá:** trả đúng một item khoá, không item mở (`D-MT`); không quá một item khoá.
- [ ] `BR-REC-07`: ở mọi ca khác, tối đa một item khoá trong danh sách.

**Kiểm chứng:** `pnpm test -- recommendation-ranking` xanh, gồm hai ca biên trên.

**Phụ thuộc:** T3 · **Cỡ:** M

### Task 5 — Route người dùng

**Tiêu chí nghiệm thu**

- [ ] `requireUserAuth()` + `assertActiveChild()`; thiếu trẻ đang chọn → 428 `NO_ACTIVE_CHILD`.
- [ ] `limit` có trần; vượt trần bị ép, không lỗi.
- [ ] Response đúng §7.1: `primary` cộng tối đa 4 `alternatives`, mỗi item có `reason_code` và
      `reason` không rỗng (`BR-REC-05`).
- [ ] `thumbnail_emoji` phân giải qua registry; emoji thiếu không làm hỏng cả response.
- [ ] Response **không** chứa `p_learn` hay bất kỳ con số mastery nào.
- [ ] Thời gian phản hồi trên bề mặt trẻ dưới ngưỡng đã đặt, đo với catalog đầy đủ.

**Kiểm chứng:** `pnpm test -- recommendation-api` xanh, gồm test thời gian phản hồi.

**Phụ thuộc:** T4 · **Cỡ:** M

### Checkpoint C — Xếp hạng và route người dùng

- [ ] Ranking deterministic, ca hết nội dung/mọi thứ khoá và user route cùng xanh.
- [ ] Response không mastery thô; latency/query budget xanh.
- [ ] Human review thuật toán và biên API trước guest/UI.

### Task 6 — Route guest

**Tiêu chí nghiệm thu**

- [ ] Chỉ trả nội dung trong allow-list `free`; test âm với một level `standard`.
- [ ] Nguồn tuổi đúng `D-MW`; tham số sai hoặc thiếu xử lý theo phương án đã chốt, không 500.
- [ ] Không đọc và không ghi mastery cho guest (`BR-ADP-06`).
- [ ] Chỉ dùng `explore` và `popular`; không `reason_code` nào cần dữ liệu cá nhân.
- [ ] Không đặt cookie định danh mới ngoài thứ đã có ở P0.

**Kiểm chứng:** `pnpm test -- recommendation-guest` xanh.

**Phụ thuộc:** T4 · **Cỡ:** S

### Task 7 — Bề mặt trẻ và lý do cho người lớn

**Tiêu chí nghiệm thu**

- [ ] Màn hình tổng kết phiên hiện đúng một gợi ý chính; sảnh trẻ hiện 3–5.
- [ ] Item khoá hiện ổ khoá trung tính; không giá, không nút mua trên bề mặt trẻ (`BR-CUR-06`).
- [ ] Lời mời nâng cấp nằm sau cổng người lớn.
- [ ] Người lớn thấy `reason` trong báo cáo; nội dung lý do không mang nghĩa chẩn đoán.
- [ ] Không so sánh với trẻ khác ở bất kỳ bề mặt nào (`BR-REC-06`, `BR-PRG-05`).
- [ ] Bề mặt trẻ không giả định trẻ biết đọc; đạt
      [`accessibility.md`](../specs/08-quality/accessibility.md).

**Kiểm chứng:** `pnpm test:e2e -- recommendations` xanh.

**Phụ thuộc:** T5 · P1.9 · **Cỡ:** M

### Checkpoint D — Hai bề mặt recommendation

- [ ] Guest allow-list và user recommendations giữ đúng nguồn dữ liệu riêng.
- [ ] Child/adult UI giữ ranh giới thương mại, ngôn ngữ và accessibility.
- [ ] Full gate + human review UI xanh trước promote.

### Task 8 — Evidence và promote P3.6

**Tiêu chí nghiệm thu**

- [ ] Mỗi `BR-REC-*` có ít nhất một test tham chiếu bằng mã rule trong tên test.
- [ ] Bảy bậc đều có ca dương và ca rỗng; hai ca biên của T4 xanh.
- [ ] [`next-game-recommendation.md`](../specs/04-play/next-game-recommendation.md) sang
      `implemented`.
- [ ] Tick **P3.6** trong Task #14 chỉ khi `node packages/gates/scripts/check-progress.ts` tự xanh.

**Kiểm chứng:**
`pnpm check && pnpm test && pnpm test:e2e && pnpm --filter @mindkid/gates test && node packages/gates/scripts/check-progress.ts` xanh.

**Phụ thuộc:** T6 · T7 · **Cỡ:** S

## 6. Rủi ro

| Rủi ro | Hậu quả | Giảm thiểu |
|---|---|---|
| Thang hết bậc | Trả rỗng, trẻ đứng trước màn hình trống | `D-MQ` — bậc 7 `revision` không đòi nội dung mới |
| Ca mọi thứ đều khoá không cài được | Hoặc trả rỗng, hoặc vi phạm `BR-REC-07` | `D-MT` — nới đúng một chỗ, giữ trần một item khoá |
| Bậc 1 trả item khoá | Quảng cáo trá hình trên bề mặt trẻ | `D-MS` — bậc 1 rỗng khi tuần bị khoá |
| Nhiễu không hạt giống | Ca kiểm gợi ý không tái lập được | `D-MV` — `seed` là tham số |
| `popular` tạo vòng lặp tự củng cố | Cùng vài level luôn nổi lên | Nhiễu có hạt giống + trần đóng góp của bậc `popular` |
| Ca kiểm `BR-REC-06` quét theo tên bảng | Bắt nhầm bảng tổng hợp hoặc bỏ sót nối theo trẻ | `D-MU` — quét theo cột nối, không theo tên |
| Guest không có tuổi | Gợi ý sai band hoặc 500 | `D-MW` — nguồn tuổi chốt trước code |
| Sáu truy vấn tuần tự trên bề mặt nóng | Sảnh trẻ và màn tổng kết giật | Dừng sớm khi đủ `limit` + gating theo lô + đo thời gian |
| Hai bậc ôn lại chồng nhau | Trẻ luôn nhận `revision` | `D-MR` — cắt trục thời gian tại một điểm |

## 7. Ngoài phạm vi

- ML, embedding, học xếp hạng — cấm theo `BR-REC-08`, và là mục "Ask first".
- Gợi ý dựa trên hành vi cá nhân của trẻ khác — cấm vĩnh viễn theo `BR-REC-06`.
- Gợi ý lesson và curriculum ngoài bậc 1 — MVP chỉ gợi ý game level.
- Báo cáo phân tích lý do gợi ý theo thời gian — P3.7.
- Mở rộng cửa sổ loại trừ quá ba level — P4, theo câu hỏi mở số 1.
- Tìm kiếm nội dung do người lớn chủ động — thuộc mặt tìm kiếm chung.
- Auto-merge, migration ngoài local.

## 8. Giả định và điều kiện dừng

1. `level_daily_stats.plays_count` được telemetry nuôi thật; toàn 0 thì bậc `popular` không kiểm
   chứng được và Task #59 dừng ở Checkpoint A.
2. Player của P3.4 trả được cờ `week_blocked_by_tier`; thiếu thì sửa ở Task #57, không suy lại
   trong recommendation.
3. [`access-gating.md`](../specs/04-play/access-gating.md) kiểm được theo lô; nếu chỉ có API một
   item thì mở rộng ở spec sở hữu nó.
4. `D-MT` và `D-MW` là **đề xuất** cho tới khi người sở hữu duyệt.
5. Ngưỡng thời gian phản hồi cho bề mặt trẻ do người sở hữu đặt trước Task 5.
6. Task #59 không bắt đầu implementation khi P3.4 hoặc P3.5 còn đỏ.
