# Kế hoạch — Task #192: Go-live theo chuẩn sư phạm mầm non — giáo án và trò chơi đủ dày

> **Loại task:** chương trình (L) — **thay** [`#191`](191-full-corpus-seeder-plan.md) làm mốc go-live.
> `#191` (3.290 level) giữ nguyên làm **trần dài hạn**, cấm — NEVER dùng làm điều kiện phát hành.
> **Đích:** hệ thống trò chơi + bài giảng đủ dày để mở cho phụ huynh Việt, neo vào
> Chương trình Giáo dục Mầm non của Bộ GD&ĐT, chứ không neo vào một hạn ngạch tự đặt.
> **Cho phép:** seeder **viết cứng** từng level. Không bắt buộc công thức tổng quát.

## 1. Trả lời ngắn

Cổng `check:go-live` hiện chặn ở **đúng ba chỗ**, và cả ba đều nhỏ:

```
[CHẶN] BR-ECD-07: 3 engine chưa có level free/login — GT-018, GT-022, GT-027
[CHẶN] BR-LCD-01: thư viện giáo án 81/126 tiết — thiếu 45
[CHẶN] BR-LCD-10: 19 kỹ năng chưa đạt sàn 2 level
```

Đó là khoảng cách **tuần**, không phải năm. Nhưng qua ba mục đó chỉ cho ra một sản phẩm *hợp lệ*,
chưa chắc *dày*. Người đặt việc hỏi thứ khác: **đủ phong phú và đúng sư phạm mầm non thật**.

Nên kế hoạch này có hai nửa. Nửa đầu mở khoá ba chốt trên. Nửa sau nâng mốc từ *hợp lệ* lên
*dạy được cả năm học*, và mốc đó phải suy ra từ **cách trường mầm non thật sự dạy**, không suy ra
từ một con số tròn.

## 2. Đo được (2026-09-01)

| Trục | Hiện có | Ghi chú |
|---|---:|---|
| Game level | **239** | 111 trong số đó được giáo án trỏ tới |
| Giáo án (`LES-*`) | **81** | tuổi 3: 19 · tuổi 4: 26 · tuổi 5: 36 |
| Hoạt động (`ACT-*`) | **243** | 9 kiểu; 162 kiểu `digital_game` |
| Kỹ năng thư viện giáo án chạm | **33** / 230 | |
| Chủ đề dùng thật | **12** / 14 | `weather` và `festival` chưa dùng |
| Engine có bộ sinh | 19 / 27 | |

### 2.1 Mô hình nội dung đã đúng kiểu mầm non

Đây là phát hiện tích cực, phải nói trước khi nói cái thiếu. Một `ACT-*` không phải "một màn game" —
nó có `preparation`, `steps[]` với `instruction` và **`say_to_child`**, `materials`,
`estimated_minutes`, cộng `easier` / `harder`. Chín kiểu hoạt động đang chạy:

| Kiểu | Số |
|---|---:|
| `manipulative` (thao tác với vật thật) | 28 |
| `home_activity` (giao về nhà) | 12 |
| `movement` (vận động) | 9 |
| `discussion` · `observation` | 14 |
| `storytelling` · `mini_project` · `assessment` | 18 |
| `digital_game` (nối vào `game_level`) | 162 |

Một tiết trộn vật thật + vận động + trò chơi số **là** cách tổ chức hoạt động học ở mầm non. Cấu
trúc này không phải sửa; nó phải được **lấp đầy**.

### 2.2 Chỗ chưa neo vào chuẩn Việt Nam

Taxonomy C1–C6 dựng trên Kogumakai · Dienes · Singapore Early Math · Montessori. Grep toàn
`docs/` không ra một tham chiếu nào tới Chương trình GDMN, Bộ chuẩn phát triển trẻ 5 tuổi, hay bất
kỳ văn bản nào của Bộ GD&ĐT.

Nghĩa là hôm nay **không trả lời được** câu hỏi mà mọi hiệu trưởng và phần lớn phụ huynh sẽ hỏi:
*"cái này bám chương trình mầm non nào?"*. Đó là rào go-live thật, và nó không nằm trong cổng.

### 2.3 Chủ đề: thiếu hai chủ đề bắt buộc

`CONTENT_THEMES` có 14 giá trị. Đối chiếu với bộ chủ đề mà chương trình mầm non Việt Nam tổ chức
theo năm học:

| Chủ đề chương trình | Theme trong repo |
|---|---|
| Trường mầm non | `school` |
| Bản thân | `body` |
| Gia đình | `family` |
| **Nghề nghiệp** | **không có** |
| Thế giới động vật | `animal` · `ocean` |
| Thế giới thực vật · Tết và mùa xuân | `nature` · `festival` |
| Giao thông | `vehicle` |
| Hiện tượng tự nhiên | `weather` |
| **Quê hương – Đất nước – Bác Hồ** | **không có** |
| Trường tiểu học | `school` (một phần) |

> **`CHƯA ĐO`** — danh sách 10 chủ đề trên chưa tra từ văn bản gốc, `#193` chốt. Ghi ở đây để
> `#193` có cái đối chiếu, cấm — NEVER dùng làm nguồn.

Mười hai theme phủ được tám chủ đề. **Hai chủ đề bắt buộc không có theme nào**, và hai theme đã có
(`weather`, `festival`) thì chưa level nào dùng — trong đó `festival` là chủ đề Tết, chủ đề nặng
nhất trong năm học Việt.

## 3. Mốc go-live suy từ cách dạy thật, không từ số tròn

> ⚠️ **Sửa 2026-09-01 theo [`#201`](201-hasty-decision-audit-plan.md).** Bản đầu của mục này dựng
> phép tính `3 độ tuổi × (10 chủ đề × 4 tiết + 2 ôn)` cho khớp con số 126 rồi tuyên bố đã tìm ra
> nguồn của nó. Đó là **hợp lý hoá ngược**, và nó sai.

Nguồn thật của 126 nằm ở [`lesson-corpus-depth.md`](../specs/05-content/lesson-corpus-depth.md):

```
Chương trình 42 tuần CUR-J42 là flow dài nhất: 42 × 3 = 126 tiết.
```

Và §7.3 của chính file đó **bác** mô hình phân vùng `42/42/42` theo band: tuổi là **nhãn đề xuất**
(`BR-LFM-03`), thư viện giáo án **dùng chung** giữa các band (`BR-LFM-01`), trẻ cấm — NEVER bị khoá
vào flow đúng tuổi (`BR-LFM-02`, quyết định `D-SI`). Bản trước của spec từng có bảng `42/42/42` ra
222 buổi, và bảng đó đã bị gỡ.

Nên: sàn 126 giữ nguyên, nhưng **cấm — NEVER phân bổ theo `42/42/42`**. 45 tiết còn thiếu lấp vào
chỗ flow cần, không lấp theo hạn ngạch tuổi.

### 3.1 Tầng chơi lại là **round set**, không phải thêm level

Bản đầu suy "mỗi tiết cần 2 biến thể level để chơi lại không lặp" và ra đích ~700 level. Sai tầng.

Repo đã có nhà cho việc đó: [`round-set-model.md`](../specs/05-content/round-set-model.md). Một
`game_level` mang một **round set** — dãy vòng, trần **6 · 8 · 10** theo band `3-4` · `4-5` · `5-6`
(`BR-RSM-03`, trần nâng ngày 2026-08-31 theo `D-167A`). `BR-RSM-01` bắt mọi vòng dùng cùng
`template_code` để trẻ không phải học lại cách chơi giữa bài.

**Đo 2026-09-01: 0/239 level có vòng nào.** Bảng `game_level_rounds` có, spec có, trần vừa nâng
tháng trước, corpus rỗng hoàn toàn.

Nên đích go-live tách làm hai câu hỏi, trả lời theo thứ tự:

1. **Lấp tầng vòng** cho level đã có — sửa seed, không soạn mới.
2. **Rồi mới** hỏi còn thiếu bao nhiêu level.

### 3.2 Đích số lượng

| Đại lượng | Suy từ | Đích | Hiện có |
|---|---|---:|---:|
| Giáo án | flow dài nhất `CUR-J42` = 42 × 3 | **126** | 81 |
| Hoạt động | mỗi tiết ≥3 phần *(cấu trúc — `CHƯA ĐO`, `#193`)* | **≥378** | 243 |
| Hoạt động `digital_game` | mỗi tiết ≥1 | **≥126** | 162 ✔ |
| Level có round set | `BR-RSM-03` | **100%** | **0%** |
| Level mỗi kỹ năng thư viện dùng | `CHƯA ĐO` — `#202` | *(chờ `#202`)* | sàn hiện tại 2 |
| Chiều sâu engine | `engine-depth` bậc 1 | **≥6/engine** | bậc 0 |
| Chủ đề có mặt trong corpus | 10 chủ đề chương trình *(`CHƯA ĐO` — `#193`)* | **≥10** | 8 |

**Tổng level go-live: `CHƯA ĐO`.** Con số ~700 của bản đầu đã gỡ — nó dựng trên giả định "2 biến
thể mỗi tiết" mà tầng vòng làm cho thừa. [`#202`](201-hasty-decision-audit-plan.md) đo và trả lại
con số kèm phép tính.

## 4. Quyết định

| # | Quyết định | Vì sao |
|---|---|---|
| D1 | Neo vào **Chương trình GDMN của Bộ GD&ĐT**, và với band `5-6` neo thêm vào **Bộ chuẩn phát triển trẻ em 5 tuổi** | Đây là thứ trường và phụ huynh Việt hỏi. Kogumakai/Montessori là nguồn phương pháp, không phải chuẩn quốc gia — giữ cả hai, nhưng chuẩn quốc gia là trục đối chiếu |
| D2 | Số hiệu văn bản và số chỉ số **phải tra từ nguồn gốc** ở `#193`, cấm — NEVER chép từ trí nhớ mô hình | Ghi sai số thông tư trong tài liệu hướng tới phụ huynh là lỗi không sửa được bằng hotfix |
| D3 | Nói rõ **phạm vi không phủ**: thể chất, tình cảm – kỹ năng xã hội, thẩm mỹ | App phục vụ chủ yếu lĩnh vực **nhận thức** cộng một phần **ngôn ngữ**. Nhận vơ năm lĩnh vực là quảng cáo sai |
| D4 | Seeder **viết cứng** từng level là hợp lệ và được ưu tiên cho 460 level go-live | Người đặt việc cho phép. Bộ sinh vẫn dựng tiếp cho `#191`, nhưng cấm — NEVER để go-live chờ bộ sinh |
| D5 | Sàn level mỗi kỹ năng: **`CHƯA ĐO`**, chờ `#202`. Số 4 của bản đầu đã gỡ | 2 là sàn "có tồn tại". 4 là sàn "chơi lại trong tuần không gặp lại màn cũ" — đó mới là *phong phú* đo được |
| D6 | Thêm hai theme: `job` (Nghề nghiệp) và `homeland` (Quê hương – Đất nước – Bác Hồ) | Hai chủ đề bắt buộc của chương trình đang không có chỗ chứa |
| D7 | Mỗi tiết ≥3 hoạt động, ≥2 kiểu. Cấu trúc **ba pha** là **`CHƯA ĐO`** — `#193` tra nguồn trước khi `#198` cưỡng chế | Một tiết toàn trò chơi số không phải một tiết mầm non |
| D8 | `#191` hạ xuống làm trần dài hạn, không phải điều kiện phát hành | Hai kế hoạch cùng đòi corpus sẽ tranh trần chủ đề của nhau |

## 5. Đồ thị phụ thuộc

```
[#193] tra chuẩn GDMN + Bộ chuẩn 5 tuổi   ─┐
[#194] hai theme mới job/homeland          ─┼─> [#196] bản đồ 126 tiết của flow CUR-J42
[#195] mở khoá 3 chốt cổng go-live         ─┤        │   (cấm phân vùng theo band)
[#202] đo tầng vòng, suy đích thật         ─┘        │
                                                     ├─> [#197] 45 tiết còn thiếu
                                                     ├─> [#198] hoạt động lên ≥378, cấu trúc theo #193
                                                     ├─> [#199a] lấp round set cho 100% level
                                                     ├─> [#199b] thêm level theo con số của #202
                                                     └─> [#200] band 5-6 đối chiếu Bộ chuẩn
```

## 6. Đợt

### Đợt 0 — neo chuẩn · `#193` `#194`

`#193` **Tra và ghi chuẩn.** Đọc văn bản gốc của Bộ GD&ĐT. Sản phẩm:
`docs/taxonomy/moet-alignment.md` — bảng đối chiếu C1–C6 ↔ lĩnh vực phát triển, và với band `5-6`
là bảng đối chiếu tới từng chỉ số của Bộ chuẩn 5 tuổi. Mọi số hiệu văn bản kèm nguồn.
Kèm mục **"Phạm vi không phủ"** theo D3.

`#194` **Hai theme mới.** `job` và `homeland` vào `CONTENT_THEMES`, mỗi theme đủ 10 danh từ + emoji
như 14 theme hiện có. Cổng chủ đề đòi ≥10 theme có mặt trong corpus.

### Đợt 1 — mở khoá cổng · `#195`

- 3 engine thêm level cửa vào `free`/`login`: `GT-018` `GT-022` `GT-027`
- 19 kỹ năng nâng lên sàn level
- **Chốt kiểm 1:** `check:go-live` chỉ còn chặn ở `BR-LCD-01` (81/126 tiết)

### Đợt 2 — bản đồ năm học · `#196`

Bảng `docs/taxonomy/lesson-map.md`: 126 ô = 3 độ tuổi × 42 tiết, mỗi ô ghi **chủ đề · kỹ năng
trọng tâm · ba pha hoạt động**. 81 tiết hiện có gắn vào ô của chúng; 45 ô trống lộ ra thành danh
sách có tên. Đây là bản đồ, chưa viết nội dung.

### Đợt 3 — 45 tiết còn thiếu · `#197`

Viết cứng 45 giáo án theo ô trống của `#196`. Ưu tiên ô thuộc hai chủ đề mới và chủ đề `festival`
(Tết) — đang trống hoàn toàn.
**Chốt kiểm 2:** `check:go-live` trục giáo án PASS.

### Đợt 4 — chiều sâu hoạt động · `#198`

Mọi tiết đạt ≥3 hoạt động đủ ba pha, ≥2 kiểu, ≥1 `digital_game`. 243 → ≥378.

### Đợt 5a — lấp round set · `#199a`

- Mọi level published có round set hợp lệ, số vòng trong trần band (`BR-RSM-03`)
- Trần thời lượng `BR-RSM-12` và trần payload `BR-RSM-10` không vỡ
- Đây là **sửa seed**, không soạn level mới

### Đợt 5b — chiều sâu level · `#199b`

- Mỗi kỹ năng thư viện dùng: số level theo kết quả `#202`
- Mỗi engine: ≥6 level (`engine-depth` bậc 1)
- ≥10 chủ đề có mặt, caps không vỡ
- Số level thêm: theo phép tính của `#202`, **seeder viết cứng**

### Đợt 6 — đối chiếu Bộ chuẩn 5 tuổi · `#200`

Band `5-6` đối chiếu tới từng chỉ số theo bảng của `#193`. Chỉ số nào app phủ được thì có ≥1 tiết
và ≥2 level; chỉ số nào không phủ được thì ghi vào mục "không phủ", cấm — NEVER bỏ trống im lặng.

> **CHỐT KIỂM GO-LIVE:** `check:go-live` xanh toàn phần · 126 tiết · ≥378 hoạt động ·
> 100% level có round set · số level đạt đích của `#202` · ≥10 chủ đề · `engine-depth` bậc 1 ·
> `moet-alignment.md` đã review sư phạm.

## 7. Điều kiện nghiệm thu

| # | Điều kiện | Kiểm bằng |
|---|---|---|
| 1 | `check:go-live` xanh, 0 mục chặn | `pnpm --filter @mindkid/db check:go-live` |
| 2 | 126 tiết published lắp đủ `CUR-J42`, ≥10 chủ đề — cấm phân vùng theo band | `check:lesson-supply` |
| 3 | Mọi tiết ≥3 hoạt động, ≥2 kiểu, ≥1 `digital_game`; cấu trúc pha theo `#193` | cổng mới ở `#198` |
| 4 | Mọi kỹ năng thư viện dùng đạt sàn level của `#202` | `check:go-live` sau khi nâng ngưỡng |
| 5 | 100% level có round set hợp lệ; mọi engine ≥6 level — `engine-depth` bậc 1 | `check:engine-depth` |
| 6 | ≥10 chủ đề có mặt; caps không vỡ | `check:theme-registry` |
| 7 | `moet-alignment.md` có bảng đối chiếu + mục phạm vi không phủ | review người |
| 8 | Band `5-6` đối chiếu tới từng chỉ số Bộ chuẩn 5 tuổi | `#200` |
| 9 | Mỗi cổng mới có ≥2 ca âm | `pnpm test` |
| 10 | `pnpm check` xanh | — |

## 8. Rủi ro

| Rủi ro | Mức | Giảm thiểu |
|---|---|---|
| **Ghi sai số hiệu văn bản hoặc số chỉ số của Bộ chuẩn** | **Cao** | D2 — tra nguồn gốc, cấm chép từ trí nhớ. Tài liệu hướng tới phụ huynh, sai là mất uy tín |
| Nhận vơ phủ cả năm lĩnh vực phát triển | Cao | D3 — mục "phạm vi không phủ" là **bắt buộc**, không phải tuỳ chọn |
| 460 level viết cứng ra corpus nhàm — cùng vài chủ đề, cùng vài khuôn | Cao | Trần chủ đề của `theme-caps.json` vẫn áp; cộng sàn ≥4 level/kỹ năng trải ≥2 khuôn |
| 45 tiết viết vội cho qua cổng đếm | Cao | Cổng `#198` đo **ba pha và ≥2 kiểu hoạt động**, không chỉ đếm số hoạt động |
| Chủ đề `festival` (Tết) và hai chủ đề mới không có emoji/danh từ đủ | Trung bình | `#194` đòi đủ 10 danh từ mỗi theme như 14 theme hiện có |
| Hai kế hoạch `#191` và `#192` tranh nhau corpus | Trung bình | D8 — `#191` là trần dài hạn, mọi PR nội dung tới go-live gắn `#192` |
| Sàn 2 → 4 level/kỹ năng làm cổng đỏ hàng loạt ngay khi đổi | Trung bình | Nâng ngưỡng ở **cuối** đợt 5, sau khi level đã đủ; đổi sớm thì cổng đỏ suốt chương trình |
