# Kế hoạch — Task #58: P3.5 — Mastery và adaptive

> Viết 2026-08-11, đo tại commit `484ebaf` trên working tree đang triển khai P0.9.
> Bước sở hữu: **P3.5** của
> [`14-implementation-sequence-todo.md`](14-implementation-sequence-todo.md).
> Spec sở hữu: [`adaptive-engine.md`](../specs/01-platform/adaptive-engine.md) ·
> [`progress-and-mastery.md`](../specs/04-play/progress-and-mastery.md).
> Task trước: [`57-p3-4-curriculum-player-plan.md`](57-p3-4-curriculum-player-plan.md).
>
> ```sh
> export PATH=/Users/macbook/.nvm/versions/node/v24.15.0/bin:$PATH
> ```

## Tóm tắt

P3.5 giao ba thứ: một package tính toán thuần, một đường ghi trạng thái thành thạo, và một bản
đồ tiến độ mà trẻ nhìn thấy được nhưng không đọc ra thành điểm số.

Bốn sự thật chi phối kế hoạch:

1. **Hai spec chỉ hai nơi ghi mastery khác nhau.**
   [`adaptive-engine.md`](../specs/01-platform/adaptive-engine.md) §3 nói tầng API ghi tại
   `POST /api/users/play-sessions/{uuid}/complete`.
   [`progress-and-mastery.md`](../specs/04-play/progress-and-mastery.md) §3 nói job
   `rollup:session` ghi. Hai đường ghi cùng một bảng là hai thứ tự, hai lần đếm, và hai kết quả
   khi chúng chạy chồng nhau.
2. **`mastery_state` trong DB không phải bảng mà spec mô tả.** Ba cột spec đòi thì thiếu, ba cột
   khác thì thừa và sẽ nằm im mang giá trị mặc định. Trong đó `params_version` thiếu làm
   `BR-ADP-10` không ép được — đúng cái rule bảo vệ mọi báo cáo lịch sử.
3. **Bản đồ trẻ không được đi xuống, nhưng nguồn của nó thì có.** `BR-PRG-03` cấm hiện tiến độ
   giảm; `p_learn` giảm là bình thường theo alt flow §5. Dựng bản đồ trực tiếp từ `p_learn` là
   vi phạm rule ngay lần đầu một trẻ quên bài.
4. **Huy hiệu chưa có chỗ ở.** `BR-PRG-04` bắt huy hiệu tồn tại vĩnh viễn, `GET .../progress`
   trả `badges`, và không bảng nào trong schema giữ chúng.

P3.5 cũng trả nợ ca kiểm `p_learn` mà Task #57 đã chuyển sang đây theo `D-MF`.

## 0. Điều kiện tiên quyết

| Phụ thuộc | Bước | Điều kiện vào Task 2 trở đi |
|---|---|---|
| P3.4 | P3.4 | Chỗ nối `selectVariant` tồn tại và có test chống nhảy bước |
| `PLAY-SESSION-LIFECYCLE` | P1.6 | Bốn điều kiện §7.3 và route `complete` đã chạy |
| `SCORING-AND-RESULT` | P1.7 | `correct_ratio` tính ở server từ event |
| `TAXONOMY-SERVICE` | P0.9 | Cây skill, DAG prerequisite và `strength` đã seed |
| `CONTENT-TAGGING` | P1.10 | `content_skill_map.weight` có dữ liệu thật |
| `TELEMETRY-PIPELINE` · `EVENT-CATALOG` | P1.5 · P0 | Event đủ để tính gợi ý và tỉ lệ dùng gợi ý |
| `BASIC-REPORT` | P1.12 | Bề mặt người lớn để gắn nhãn thành thạo |
| `JOB-QUEUE` | P1.5 | Nếu còn job rollup nào sau `D-MH` |

**Stop condition:** trước Task 2, phụ thuộc nào chưa `implemented` thì dừng Task #58. Đặc biệt:
không bắt đầu khi `content_skill_map.weight` còn rỗng — `BR-ADP-04` không kiểm chứng được bằng
dữ liệu toàn `1.0`.

## 1. Đo được

### 1.1 `packages/adaptive` chưa tồn tại

[`adaptive-engine.md`](../specs/01-platform/adaptive-engine.md) §3 khai ba entry point:
`packages/adaptive/src/bkt.ts`, `zpd-selector.ts`, `level-params.ts`. Thư mục
`packages/adaptive/src/` tại `484ebaf` chỉ có một `index.ts` dài 11 byte. Đây là việc dựng mới,
không phải sửa.

### 1.2 `mastery_state` lệch spec ở sáu cột

Đối chiếu §7.1 với [`adaptive.ts`](../../packages/db/src/schema/adaptive.ts):

| Spec §7.1 | Cột thật | Tình trạng |
|---|---|---|
| `p_learn` | `p_learn numeric(5,4)` | Khớp |
| `ema_correct` | `ema_correct numeric(5,4)` | Khớp |
| `attempts_total` | `attempts_count` | Khác tên |
| `last_seen_at` | `last_practiced_at` | Khác tên |
| `attempts_recent` (10 lần gần nhất) | — | **Thiếu** |
| `hint_rate` | — | **Thiếu** |
| `params_version` | — | **Thiếu** |
| — | `p_guess` · `p_slip` · `p_transit` | **Thừa** |

Ba cột thừa là tham số của BKT đầy đủ. Công thức §7.2 là bản đơn giản hoá và chỉ dùng `α`, `β`.
Nếu giữ nguyên, ba cột đó vĩnh viễn mang giá trị mặc định — người đọc DB sẽ tưởng hệ thống có
BKT đầy đủ trong khi không có gì đọc chúng.

`params_version` thiếu là mất mát nặng nhất: `BR-ADP-10` và acceptance criteria "đổi tham số có
version" không thực thi được, nên đổi `α` một lần là mọi báo cáo lịch sử hết so được mà không
cảnh báo.

### 1.3 Hai công thức thiếu, hai cột không biết cập nhật thế nào

§7.2 chỉ định nghĩa luật cập nhật cho `p_learn` và `ema_correct`. `attempts_recent` và
`hint_rate` xuất hiện ở `MasteryState` nhưng không có công thức, không có nguồn, không có cửa
sổ. "10 lần gần nhất" cũng không lưu được bằng một số nguyên — nó cần cửa sổ trượt hoặc một truy
vấn trên telemetry.

### 1.4 Hai nơi ghi mastery

| Nguồn | Nơi ghi |
|---|---|
| [`adaptive-engine.md`](../specs/01-platform/adaptive-engine.md) §3 và §8 | Tầng API tại `POST /api/users/play-sessions/{uuid}/complete` |
| [`progress-and-mastery.md`](../specs/04-play/progress-and-mastery.md) §3 | Job `rollup:session` |

Bằng chứng nghiêng về đường đồng bộ: response của `complete` ở
[`play-session-lifecycle.md`](../specs/04-play/play-session-lifecycle.md) §8 đã có
`next_suggestion?`, và gợi ý đó cần trạng thái **sau** khi cập nhật. Job chạy sau thì gợi ý trả
về trong cùng response là gợi ý tính trên trạng thái cũ.

### 1.5 Bản đồ trẻ không được đi xuống, nguồn thì đi xuống được

`BR-PRG-03` cấm bản đồ hiện tiến độ giảm; acceptance criteria nêu rõ ca `p_learn` tụt từ 0.85
xuống 0.6 mà chặng không được mất sao. Alt flow §5 nói mastery giảm là bình thường.

Không cột nào giữ mốc cao nhất đã đạt. Dựng bản đồ bằng cách đọc `p_learn` hiện tại là vi phạm
`BR-PRG-03` ngay ca đầu tiên. `BR-PRG-04` (huy hiệu không mất) có cùng hình dạng vấn đề.

### 1.6 Huy hiệu không có bảng

§7.2 định nghĩa ba điều kiện trao huy hiệu; §8 trả `badges` trong response. Không bảng nào
trong [`adaptive.ts`](../../packages/db/src/schema/adaptive.ts),
[`play.ts`](../../packages/db/src/schema/play.ts) hay
[`child.ts`](../../packages/db/src/schema/child.ts) giữ huy hiệu đã trao. `BR-PRG-04` bắt chúng
tồn tại vĩnh viễn, nên chúng phải là hàng dữ liệu, không phải giá trị suy ra từ trạng thái hiện
tại — vì trạng thái hiện tại giảm được.

### 1.7 `child_session_summaries.skill_ids` không tồn tại

§7.3 của [`progress-and-mastery.md`](../specs/04-play/progress-and-mastery.md) lấy "skill đã
tiếp xúc" từ `child_session_summaries.skill_ids`. Bảng thật ở
[`child.ts`](../../packages/db/src/schema/child.ts) chỉ có `date`,
`total_play_time_seconds`, `levels_completed`. Trường được trích dẫn không có.

### 1.8 Hai bộ ngưỡng dễ bị trộn

| Bảng | Ngưỡng | Dùng để |
|---|---|---|
| §7.3 ZPD | 0.4 · 0.8 | Chọn biến thể và độ khó |
| §7.4 nhãn báo cáo | 3 lần · 0.35 · 0.6 · 0.8 | Hiển thị cho người lớn |

Hai bộ khác nhau và phục vụ hai việc khác nhau. Nhánh ZPD không có điều kiện "dưới 3 lần", nên
một trẻ chơi lần đầu vẫn bị xếp nhánh theo `p_learn` mặc định `0.1` và luôn rơi vào nhánh "lặp
lại hoặc dễ hơn".

Cụm "lên **một** bậc" ở nhánh `p_learn ≥ 0.8` cũng mơ hồ: bậc độ khó, hay bậc lộ trình.
`BR-ADP-05` và `BR-ADP-09` chỉ cho phép nghĩa thứ nhất, nhưng câu chữ không nói ra.

### 1.9 `selectNext` với `step = null` là ranh giới chưa cắt

Chữ ký `selectNext({ tree, mastery, step, now })` nhận `step: CurriculumStep | null`. Khi
`null` — trẻ chơi tự do ngoài curriculum — việc chọn nội dung tiếp theo chính là phạm vi của
[`next-game-recommendation.md`](../specs/04-play/next-game-recommendation.md), bước **P3.6**.
Không cắt ranh giới thì P3.5 và P3.6 sẽ có hai bộ luật chọn nội dung.

### 1.10 Biên kiểu số giữa DB và package thuần

`p_learn`, `ema_correct` và `adaptive_factor` là `numeric` trong Postgres. Driver trả chuỗi,
còn `computeUpdate` là hàm thuần nhận và trả `number`. Chỗ chuyển đổi phải tường minh và có
test, nếu không sai số và lỗi kiểu sẽ xuất hiện ở đúng con số mà `BR-ADP-03` bảo vệ.

`level_params` cũng lưu hai biểu diễn cạnh nhau — `param_overrides` dạng JSONB và
`adaptive_factor` dạng số — trong khi §8 chỉ khai một hàm trả `DifficultyParams`.

## 2. Quyết định

**D-MH — Một điểm ghi mastery duy nhất: trong transaction của `complete`.** Bỏ đường ghi qua job
`rollup:session` khỏi [`progress-and-mastery.md`](../specs/04-play/progress-and-mastery.md) §3.
Job chỉ còn tổng hợp thống kê ngày, không đụng `mastery_state`. Lý do đo được: response
`complete` đã hứa `next_suggestion`, và gợi ý phải tính trên trạng thái sau cập nhật. Ghi trong
cùng transaction với việc đóng phiên cũng làm bốn điều kiện §7.3 của
[`play-session-lifecycle.md`](../specs/04-play/play-session-lifecycle.md) kiểm một lần, một chỗ.
Chi phí là độ trễ thêm trên một route bề mặt trẻ — đo và đặt ngưỡng ở Task 4, không đoán.

**D-MI — Căn `mastery_state` theo spec, và ba cột BKT thừa phải được dùng hoặc bị bỏ.** Thêm
`params_version` `NOT NULL`. Đổi tên `attempts_count` thành `attempts_total` và
`last_practiced_at` thành `last_seen_at`, hoặc sửa spec theo tên cột — chọn một, không để hai từ
vựng. Với `p_guess`, `p_slip`, `p_transit`: người sở hữu chọn giữa (a) bỏ ba cột và giữ công
thức đơn giản hoá §7.2, hoặc (b) nâng công thức lên BKT đầy đủ và viết luật cập nhật cho cả ba.
**Không** giữ nguyên trạng cột chết. Đề xuất là (a) — `α`/`β` đã đủ cho MVP và ít tham số hơn
thì replay dễ hơn.

**D-MJ — Bản đồ trẻ đọc mốc cao nhất đã đạt, không đọc trạng thái hiện tại.** Thêm cột mốc
(`best_p_learn` hoặc bảng trạng thái chặng) chỉ tăng, không giảm. `BR-PRG-03` trở thành bất biến
kiểm được bằng property test thay vì một quy ước ở tầng UI. `p_learn` hiện tại vẫn giảm bình
thường và vẫn là thứ adaptive dùng; hai con số phục vụ hai mục đích.

**D-MK — Huy hiệu là bảng INSERT-only.** `child_badges (child_profile_id, badge_code, awarded_at,
source_ref)` với unique `(child_profile_id, badge_code)`. Không `UPDATE`, không `DELETE`, không
`expires_at` — `BR-PRG-04` được ép ở tầng thấp nhất chứ không phải bằng lời hứa của tầng service.
Mã huy hiệu là danh sách đóng đăng ký trước, giống mọi registry khác.

**D-ML — `attempts_recent` và `hint_rate` có công thức, hoặc bị bỏ khỏi `MasteryState`.** Đề
xuất: `hint_rate` cập nhật bằng cùng dạng EMA với `ema_correct`, nguồn là tỉ lệ round có dùng
gợi ý trong phiên. `attempts_recent` bỏ khỏi bảng và tính từ telemetry khi báo cáo cần — lưu một
cửa sổ trượt trong hàng trạng thái là chỗ dễ lệch nhất. Trường nào không có công thức được duyệt
thì không vào schema.

**D-MM — `selectNext` với `step = null` không thuộc P3.5.** P3.5 chỉ giải nhánh "có bước
curriculum": chọn biến thể và `difficulty_params` **trong** bước đó. Nhánh `null` trả `null` và
để [`next-game-recommendation.md`](../specs/04-play/next-game-recommendation.md) của P3.6 sở hữu.
Ghi ranh giới này vào mục "Ranh giới adaptive với curriculum" mà
[`adaptive-engine.md`](../specs/01-platform/adaptive-engine.md) đã khai là của mình.

**D-MN — Hai bộ ngưỡng có tên riêng, và "một bậc" là bậc độ khó.** Ngưỡng ZPD và ngưỡng nhãn báo
cáo là hai hằng số có tên khác nhau, không dùng chung số. Thêm nhánh "dưới 3 lần" vào §7.3 để
trẻ mới chơi không bị xếp nhánh bằng giá trị mặc định. Viết rõ "lên một bậc **độ khó** trong
cùng bước", để câu chữ khớp `BR-ADP-05` và `BR-ADP-09`.

**D-MO — "Skill đã tiếp xúc" đọc từ `content_skill_map` nối với phiên đã hoàn thành, không từ
một cột tổng hợp.** Bỏ trích dẫn `child_session_summaries.skill_ids` khỏi §7.3 vì cột đó không
tồn tại. Thêm cột tổng hợp chỉ khi đo được truy vấn nối là chậm; thêm trước là tạo bản sao thứ
hai của cùng một sự thật.

**D-MP — Replay có chủ sở hữu, có lịch, và có cổng trôi.** Đóng câu hỏi mở số 1 theo đề xuất
đang ghi: Backend sở hữu `replay-adaptive.ts` và chạy định kỳ tự động. Cổng phải có **ca âm**:
một bản ghi tham số cố ý lệch làm replay **đỏ**. Không có ca âm thì cổng chỉ là một job luôn
xanh. Đổi `α`, `β` hoặc ngưỡng ZPD bắt buộc tăng `params_version` và chạy replay đối chiếu trước
khi merge.

## 3. Contract chốt trước code

```ts
// packages/adaptive — thuần: không DB, không đồng hồ, không locale
computeUpdate(i: { prev: MasteryState | null; result: SessionResult; weight: number; now: Date }): MasteryUpdate;
selectNext(i: { tree: SkillTree; mastery: Map<number, MasteryState>; step: CurriculumStep | null; now: Date }): NextSuggestion | null; // D-MM
computeAdaptiveParams(i: { base: DifficultyParams; mastery: MasteryState; ageBand: AgeBand }): DifficultyParams;
masteryLabel(i: { p_learn: number; attempts_total: number }): MasteryLabel; // §7.4, một ánh xạ duy nhất
```

```text
POST /api/users/play-sessions/{uuid}/complete   → ghi mastery trong cùng transaction (D-MH)
GET  /api/users/children/{uuid}/progress        → nhãn cho người lớn, cần view_basic_report
GET  /api/users/play/map                        → chỉ trạng thái hình ảnh, đọc mốc cao nhất (D-MJ)
```

## 4. Đồ thị phụ thuộc

```text
T1 sửa contract D-MH…D-MP + human approve
 └──→ T2 migration mastery, mốc cao nhất, huy hiệu
       └──→ T3 packages/adaptive thuần + property test
             ├──→ T4 đường ghi trong transaction complete
             │     ├──→ T5 chọn biến thể trong bước (nối vào D-MF)
             │     └──→ T6 bản đồ trẻ + huy hiệu
             └──→ T7 nhãn cho người lớn
                   └──→ T8 replay và cổng trôi tham số
                         └──→ T9 evidence và promote
```

## 5. Task

### Task 1 — Sửa contract trước code

**Tiêu chí nghiệm thu**

- [ ] Người sở hữu phê duyệt `D-MH`…`D-MP`; `D-MI` phương án (a) hay (b) chốt rõ.
- [ ] Đường ghi qua job bị bỏ khỏi
      [`progress-and-mastery.md`](../specs/04-play/progress-and-mastery.md) §3; chỉ còn một nơi ghi.
- [ ] `MasteryState` ở §7.1 khớp đúng cột sẽ có; không trường nào không có công thức.
- [ ] Mốc cao nhất và bảng huy hiệu vào spec sở hữu schema.
- [ ] §7.3 thêm nhánh "dưới 3 lần"; hai bộ ngưỡng có tên riêng; "một bậc độ khó" viết rõ.
- [ ] Ranh giới `step = null` ghi vào phần "Ranh giới adaptive với curriculum".
- [ ] Trích dẫn `child_session_summaries.skill_ids` bị bỏ.
- [ ] Câu hỏi mở số 1 đóng theo `D-MP`; câu hỏi số 2 của
      [`progress-and-mastery.md`](../specs/04-play/progress-and-mastery.md) đóng theo đề xuất
      1–2 vùng cho trẻ, 6 vùng cho báo cáo người lớn.
- [ ] Không thêm spec mới; không thêm mã lỗi ngoài registry.

**Kiểm chứng:** `pnpm --filter @mindkid/gates test` 0 lỗi, 0 cảnh báo mới.

**Phụ thuộc:** P3.4 · human decision · **Cỡ:** M

### Checkpoint A — Contract

- [ ] T1 xanh; human đã đọc diff.
- [ ] `content_skill_map.weight` có dữ liệu thật khác `1.0`; nếu không thì dừng.
- [ ] Không migration hay code adaptive nào viết trước checkpoint này.

### Task 2 — Migration mastery, mốc cao nhất và huy hiệu

**Tiêu chí nghiệm thu**

- [ ] **Test âm trước:** ghi `mastery_state` thiếu `params_version` là **đỏ**; `UPDATE` hay
      `DELETE` trên bảng huy hiệu là **đỏ**.
- [ ] `params_version` `NOT NULL`; tên cột và tên spec khớp nhau sau `D-MI`.
- [ ] Ba cột BKT thừa bị bỏ, hoặc có luật cập nhật — theo phương án đã chốt.
- [ ] Cột hoặc bảng mốc cao nhất chỉ tăng; ràng buộc ép điều đó ở tầng DB.
- [ ] `child_badges` với unique `(child_profile_id, badge_code)`, INSERT-only, không `expires_at`.
- [ ] Mã huy hiệu là danh sách đóng đã đăng ký.
- [ ] Migration từ DB rỗng xanh; ca lỗi rollback cả transaction.

**Kiểm chứng:** `pnpm db:migrate` trên DB rỗng · `pnpm test -- mastery-migration` xanh.

**Phụ thuộc:** Checkpoint A · **Cỡ:** M

### Task 3 — `packages/adaptive` thuần

**Tiêu chí nghiệm thu**

- [ ] Ba module `bkt.ts`, `zpd-selector.ts`, `level-params.ts` cùng `masteryLabel`.
- [ ] `BR-ADP-01`: quét import — không `drizzle-orm`, không `packages/db`.
- [ ] `BR-ADP-02`: quét source — không `new Date()`, không `Date.now()`.
- [ ] `BR-ADP-03`: property test `fast-check` 1000 chuỗi ngẫu nhiên, `p_learn` luôn trong `[0,1]`.
- [ ] `BR-ADP-04`: `weight` 0.3 làm `p_learn` tăng ít hơn rõ rệt so với `weight` 1.0.
- [ ] Bốn nhánh ZPD cộng nhánh "dưới 3 lần" đều có ca kiểm.
- [ ] `revision_mode` bật khi `last_seen_at` quá 7 ngày, dùng `now` truyền vào, không đồng hồ hệ thống.
- [ ] Ánh xạ nhãn §7.4 là **một** hàm; không nhãn nào chứa từ mang nghĩa chẩn đoán.
- [ ] Chuyển đổi `numeric` sang `number` tường minh, có test biên.

**Kiểm chứng:** `pnpm test -- adaptive-engine` xanh; mỗi `BR-ADP-*` xuất hiện trong tên test.

**Phụ thuộc:** T2 · **Cỡ:** 3 work package M — BKT, ZPD, params/labels; mỗi package ≤5 files

### Checkpoint B — State và package thuần

- [ ] Migration mastery/badge và package adaptive property tests cùng xanh.
- [ ] Quét import/clock chứng minh package không DB, không đồng hồ hệ thống.
- [ ] Full gate hiện tại xanh trước khi nối transaction complete.

### Task 4 — Đường ghi trong transaction `complete`

**Tiêu chí nghiệm thu**

- [ ] Ghi `mastery_state` nằm trong cùng transaction đóng phiên (`D-MH`); không job nào ghi bảng đó.
- [ ] Bốn điều kiện §7.3 của
      [`play-session-lifecycle.md`](../specs/04-play/play-session-lifecycle.md) kiểm một lần, một chỗ.
- [ ] `BR-ADP-06` và `BR-PRG-01`: phiên guest và phiên preview không đổi hàng nào.
- [ ] `BR-ADP-07` và `BR-PRG-06`: client gửi `p_learn` thì giá trị bị bỏ qua, server tính lại.
- [ ] Phiên `abandoned` cập nhật theo round đã xong, `attempts_total` tăng.
- [ ] Level không gắn skill: không ghi, ghi log cảnh báo, không lỗi cho người dùng.
- [ ] Gọi `complete` hai lần: lần hai trả 409, không cập nhật mastery lần hai.
- [ ] Tầng API map **từng field** khi ghi; không `set(u)` nguyên khối.
- [ ] Độ trễ thêm của route được đo và nằm dưới ngưỡng đã đặt cho bề mặt trẻ.

**Kiểm chứng:** `pnpm test -- mastery-write` xanh, gồm test đo độ trễ.

**Phụ thuộc:** T3 · P1.6 · **Cỡ:** 2 work package M — transaction writer và
idempotency/performance tests; mỗi package ≤5 files

### Task 5 — Chọn biến thể trong bước

**Tiêu chí nghiệm thu**

- [ ] `selectVariant` của `D-MF` được thay bằng bản thật; chữ ký không đổi.
- [ ] **Trả nợ Task #57:** ca kiểm `BR-ADP-05` với mọi `p_learn ≥ 0.9` ở tuần 3 vẫn trả item
      trong tuần 3, không trỏ tuần 4.
- [ ] `BR-ADP-09`: adaptive chỉ đổi biến thể và `difficulty_params`, không đổi
      `(week_no, session_no, position)`.
- [ ] `D-MM`: `step = null` trả `null`; không nhánh nào của P3.5 chọn nội dung ngoài curriculum.
- [ ] `computeAdaptiveParams` ghi `level_params`; hai biểu diễn `param_overrides` và
      `adaptive_factor` được hợp nhất hoặc mỗi cái có chủ rõ ràng.
- [ ] `next_suggestion` trong response `complete` tính trên trạng thái **sau** cập nhật.

**Kiểm chứng:** `pnpm test -- zpd-selector curriculum-adaptive` xanh.

**Phụ thuộc:** T4 · P3.4 · **Cỡ:** M

### Checkpoint C — Đường ghi và seam curriculum

- [ ] Transaction writer idempotent, guest/preview negative tests và latency gate xanh.
- [ ] Adaptive thay biến thể nhưng không thể đổi bước curriculum.
- [ ] Human review diff transaction + selector trước UI/report consumers.

### Task 6 — Bản đồ trẻ và huy hiệu

**Tiêu chí nghiệm thu**

- [ ] `/play/map` đọc mốc cao nhất (`D-MJ`); property test: chuỗi `p_learn` giảm không làm chặng
      nào xuống hạng.
- [ ] `BR-PRG-02`: response của map không chứa `p_learn`, phần trăm hay điểm; test quét response.
- [ ] Ba trạng thái chặng đúng §7.1; không khoá đáng sợ ở chặng chưa chạm.
- [ ] Huy hiệu trao đúng ba điều kiện §7.2; "5 ngày khác nhau" **không** yêu cầu liên tiếp.
- [ ] `BR-PRG-04`: nghỉ 60 ngày, huy hiệu còn nguyên.
- [ ] `BR-PRG-07`: quét cả hai bề mặt, không chuỗi ngày nào mất khi nghỉ.
- [ ] `BR-PRG-05`: tài khoản 3 trẻ, không bề mặt nào so sánh giữa chúng.
- [ ] Bề mặt trẻ hiện 1–2 vùng đang học theo câu hỏi số 2 đã đóng; 6 vùng chỉ ở báo cáo người lớn.
- [ ] Không giả định trẻ biết đọc; đạt yêu cầu
      [`accessibility.md`](../specs/08-quality/accessibility.md).

**Kiểm chứng:** `pnpm test:e2e -- play-map` xanh.

**Phụ thuộc:** T4 · **Cỡ:** 2 work package M — progress map và badges; mỗi package ≤5 files

### Task 7 — Nhãn thành thạo cho người lớn

**Tiêu chí nghiệm thu**

- [ ] `GET /api/users/children/{uuid}/progress` cần `requireUserAuth()` + ownership, 403
      `ENTITLEMENT_REQUIRED` khi thiếu `view_basic_report`.
- [ ] `BR-PRG-08`: mọi nhãn thuộc bảng §7.4; render toàn bộ nhãn có thể có và đối chiếu.
- [ ] "Skill đã tiếp xúc" lấy theo `D-MO`, không đọc cột không tồn tại.
- [ ] "Skill cần củng cố" và "sẵn sàng học tiếp" dùng đúng ngưỡng và đúng DAG prerequisite.
- [ ] Trẻ dưới 3 lần chơi hiện `Chưa có đủ dữ liệu`, không hiện nhãn suy đoán.
- [ ] Không nhãn nào mang nghĩa chẩn đoán; danh sách từ cấm được kiểm bằng test.

**Kiểm chứng:** `pnpm test -- child-progress-report` xanh.

**Phụ thuộc:** T4 · P1.12 · **Cỡ:** M

### Checkpoint D — Hai bề mặt tiến độ

- [ ] Child map/badges và adult labels cùng dùng một mastery source nhưng đúng DTO riêng.
- [ ] Không số/so sánh/streak trên bề mặt trẻ; ownership/entitlement ở bề mặt người lớn.
- [ ] E2E + accessibility + language gate xanh.

### Task 8 — Replay và cổng trôi tham số

**Tiêu chí nghiệm thu**

- [ ] `replay-adaptive.ts` chạy được trên dữ liệu thật hoặc dữ liệu mẫu đã ghim.
- [ ] **Ca âm:** một bộ tham số cố ý lệch làm replay **đỏ** và in mức lệch.
- [ ] Đổi `α`, `β` hoặc ngưỡng ZPD mà không tăng `params_version` làm cổng **đỏ**.
- [ ] Báo cáo cảnh báo khi trộn dữ liệu hai `params_version` (`BR-ADP-10`).
- [ ] Chủ sở hữu và lịch chạy ghi rõ trong spec.

**Kiểm chứng:** `pnpm test -- adaptive-replay` xanh; chạy thử replay một lần và lưu kết quả.

**Phụ thuộc:** T3 · T4 · **Cỡ:** M

### Checkpoint E — Độ ổn định thuật toán

- [ ] Replay có ca âm, owner, lịch chạy và `params_version` gate.
- [ ] Kết quả replay đã lưu; thay tham số không version làm gate đỏ.
- [ ] Full gate + human review evidence xanh trước promote.

### Task 9 — Evidence và promote P3.5

**Tiêu chí nghiệm thu**

- [ ] Mỗi `BR-ADP-*` và `BR-PRG-*` có ít nhất một test tham chiếu bằng mã rule trong tên test.
- [ ] Nợ ca kiểm của Task #57 đã trả và được tick ở đúng chỗ.
- [ ] [`adaptive-engine.md`](../specs/01-platform/adaptive-engine.md) và
      [`progress-and-mastery.md`](../specs/04-play/progress-and-mastery.md) sang `implemented`.
- [ ] Tick **P3.5** trong Task #14 chỉ khi `node packages/gates/scripts/check-progress.ts` tự xanh.

**Kiểm chứng:**
`pnpm check && pnpm test && pnpm test:e2e && pnpm --filter @mindkid/gates test && node packages/gates/scripts/check-progress.ts` xanh.

**Phụ thuộc:** T5 · T6 · T7 · T8 · **Cỡ:** S

## 6. Rủi ro

| Rủi ro | Hậu quả | Giảm thiểu |
|---|---|---|
| Hai nơi ghi mastery | Đếm hai lần, gợi ý tính trên trạng thái cũ | `D-MH` — một transaction, bỏ đường job |
| Thiếu `params_version` | Đổi tham số một lần là mọi báo cáo lịch sử hết so được | `D-MI` + `D-MP` cổng có ca âm |
| Ba cột BKT chết | Người đọc DB tưởng có mô hình đầy đủ | `D-MI` — dùng hoặc bỏ, không giữ nguyên trạng |
| Bản đồ dựng từ `p_learn` hiện tại | Trẻ thấy mình "tệ đi", vi phạm `BR-PRG-03` | `D-MJ` — mốc chỉ tăng, property test |
| Huy hiệu là giá trị suy ra | Huy hiệu biến mất khi `p_learn` giảm | `D-MK` — bảng INSERT-only |
| Trường không có công thức vào schema | Cột luôn mặc định, báo cáo đọc số vô nghĩa | `D-ML` — không công thức thì không vào schema |
| Hai bộ luật chọn nội dung | P3.5 và P3.6 gợi ý khác nhau cho cùng một trẻ | `D-MM` — `step = null` thuộc P3.6 |
| Ghi đồng bộ làm chậm route trẻ | Sảnh và kết thúc phiên giật | Đo độ trễ ở T4, có ngưỡng, không đoán |
| Trộn hai bộ ngưỡng | Nhãn báo cáo đổi khi tinh chỉnh ZPD | `D-MN` — hằng số có tên riêng |
| Tinh chỉnh tham số bằng cảm giác | Thuật toán trôi không ai biết | `D-MP` — replay bắt buộc, có ca âm |

## 7. Ngoài phạm vi

- Gợi ý nội dung ngoài curriculum — P3.6.
- Báo cáo nâng cao và biểu đồ theo thời gian — P3.7.
- Skill C5 chấm tay và `assessed_by` — P4, theo `D-BA`.
- BKT đầy đủ với `p_guess`/`p_slip`/`p_transit` nếu `D-MI` chọn phương án (a) — P4.
- Bảng huy hiệu để "săn", xếp hạng, so sánh giữa trẻ — cấm vĩnh viễn.
- Streak, chuỗi ngày, nhắc ép quay lại — cấm theo `BR-PRG-07`.
- Auto-merge, migration ngoài local.

## 8. Giả định và điều kiện dừng

1. `content_skill_map.weight` có dữ liệu thật khác `1.0`; nếu toàn `1.0` thì `BR-ADP-04` không
   kiểm chứng được và Task #58 dừng ở Checkpoint A.
2. Event đủ để tính tỉ lệ dùng gợi ý; thiếu thì `hint_rate` bị bỏ theo `D-ML`, không bịa nguồn.
3. `D-MH`, `D-MI` và `D-MJ` là **đề xuất** cho tới khi người sở hữu duyệt.
4. Ngưỡng độ trễ cho route `complete` do người sở hữu đặt trước Task 4, không đặt sau khi đo.
5. Task #58 không bắt đầu implementation khi P3.4 còn đỏ.
