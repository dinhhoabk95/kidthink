# Kế hoạch — Task #191: Seeder toàn corpus level — hạn ngạch theo skill và đa dạng khuôn

> **Loại task:** chương trình (XL) — bao trùm [`#168`](168-v1-game-list-integration-plan.md) như tập con.
> **Đích:** mọi skill C1 có **≥20** level, mọi skill C2–C6 có **≥10** level, và mỗi skill trải
> **≥4 khuôn** (C1) hoặc **≥2 khuôn** (còn lại), mỗi khuôn nhận **2–5** level.
> **Spec sở hữu:** [`engine-content-depth.md`](../specs/05-content/engine-content-depth.md) ·
> [`content-tagging.md`](../specs/01-platform/content-tagging.md) ·
> [`level-generator-kit.md`](../specs/01-platform/level-generator-kit.md).
> **Chặn bởi:** đợt 0 của chính nó. **Chặn:** mọi việc nội dung còn lại.
>
> ⚠️ **Hạ cấp 2026-09-01:** kế hoạch này là **trần dài hạn**, cấm — NEVER dùng làm điều kiện
> phát hành. Mốc go-live nằm ở [`#192`](192-golive-preschool-pedagogy-plan.md) — neo vào Chương
> trình Giáo dục Mầm non, ~700 level thay vì 3.290. Mọi PR nội dung hướng tới go-live gắn `#192`.

## 1. Trả lời ngắn

Hạn ngạch quy ra **3.290 level**. Corpus hiện có **239**. Đó là hệ số **13,8×**.

Con số đó loại bỏ một hướng đi ngay từ đầu: biên soạn tay. Đo được: **toàn bộ** công biên soạn
từ trước tới nay cho ra 239 level. Phần còn thiếu là 3.051 — gấp gần 13 lần tất cả những gì đã
soạn. Kế hoạch này vì thế **không phải kế hoạch biên soạn** — nó là kế hoạch dựng
**bộ sinh có ràng buộc**, còn người viết tay chỉ chạm vào những chỗ máy chứng minh được là
không sinh nổi.

Và trước khi sinh được level đầu tiên, có **ba thứ chặn** ở mục 3 — không thứ nào trong đó là
viết nội dung.

## 2. Đo được (2026-09-01)

### 2.1 Cung và cầu

| Trục | Số | Lệnh tái dựng |
|---|---:|---|
| Skill đã đặt tên | 230 | đếm hàng `^\| C[1-6]\.[A-Z]+\.\d{2}` trong `docs/taxonomy/c*.md` |
| Strand | 41 | cùng nguồn, gom theo mã strand |
| Level seed hiện có | 239 | parse `code: "GL-` trên `packages/db/src/seed-content/**` |
| Skill có ≥1 level | 46 | cùng script |
| Skill trắng | **184** | 230 − 46 |
| Bộ sinh | 19/27 | `Object.keys(ALL_LEVEL_GENERATORS).length` |

### 2.2 Hạn ngạch quy ra level

| C | Skill | Hạn ngạch | Level | Strand |
|---|---:|---:|---:|---:|
| C1 | 99 | 20 | **1.980** | 10 |
| C2 | 44 | 10 | 440 | 8 |
| C3 | 30 | 10 | 300 | 8 |
| C4 | 16 | 10 | 160 | 4 |
| C5 | 21 | 10 | 210 | 5 |
| C6 | 20 | 10 | 200 | 6 |
| | **230** | | **3.290** | **41** |

Trung bình mỗi engine gánh **91 level** trên 36 engine — dưới trần `engine_max_ratio` 0,5 rất xa,
nên trần engine không phải chỗ vỡ. Chỗ vỡ nằm ở **đa dạng khuôn cho từng skill**.

### 2.3 Đa dạng: hiện trạng đã thủng

| Số khuôn một skill đang dùng | Số skill |
|---:|---:|
| 1 | **26** |
| 2 | 7 |
| 3 | 1 |
| 4 | 6 |
| 5–11 | 6 |

26/46 skill có level đang nằm trên **đúng một** khuôn. Luật mới đòi C1 ≥4 khuôn, C khác ≥2 —
nghĩa là ngay cả phần corpus đã có cũng phải soạn thêm, không chỉ phần trắng.

Cặp `(skill, khuôn)` tối thiểu phải dựng: `99×4 + 131×2` = **658 cặp**.

### 2.4 Băng tuổi còn chỗ

| Band | Engine dùng được (27) | Sau khi xong 9 khuôn `#181`–`#189` (36) |
|---|---:|---:|
| `3-4` | 21 | 21 |
| `4-5` | 26 | 28 |
| `5-6` | 27 | 36 |

Band `3-4` **không** được lợi gì từ 9 khuôn mới — cả 9 đều cấm band `3-4`. Mà 62/230 skill bắt đầu
ở tuổi 3. Đây là ràng buộc thật, phải vào ma trận phân bổ chứ không phát hiện lúc sinh.

## 3. Ba thứ chặn — không thứ nào là viết nội dung

### 3.1 Từ vựng `thinking` của taxonomy lệch union

`docs/taxonomy/c*.md` dùng **19** giá trị `thinking`, trong đó có `construct` (3 skill).
`ThinkingProcess` ở `packages/shared/src/taxonomy-types.ts` khai **18**, không có `construct`.

Ma trận affinity sẽ suy ra từ giao của `thinking`, nên một giá trị không tồn tại trong union làm
3 skill đó **không ánh xạ được sang khuôn nào** — và cách hỏng sẽ là im lặng, đúng họ lỗi
đã ghi trong `gate-silent-pass-patterns`.

### 3.2 Ma trận `skill × khuôn` chưa tồn tại

`BR-GTC-01` cấm template gắn skill, và đúng như vậy. Nhưng hệ quả là **không nơi nào** trả lời
được câu *"skill này soạn được trên những khuôn nào"*. Không có câu trả lời đó thì:

- không phân bổ được 3.290 level,
- không kiểm được luật 2–5 level mỗi khuôn,
- và người soạn tiếp tục chọn khuôn theo thói quen — đúng cơ chế sinh ra 26 skill một khuôn.

Đây là **hòn đá móng** của cả chương trình.

### 3.3 Mười bảy bộ sinh còn thiếu

Tám engine trong registry không có bộ sinh: `GT-009` `GT-013` `GT-014` `GT-015` `GT-016`
`GT-017` `GT-021` `GT-024`. Chín engine của `#181`–`#189` chưa dựng. Trước khi có 36/36 bộ sinh,
mọi hạn ngạch chạm tới các khuôn đó đều phải viết tay.

Cộng thêm: 19 bộ sinh đang có **đều khai đúng 5 chủ đề** (`school` `farm` `home` `nature` `food`)
trên 14 chủ đề của `CONTENT_THEMES`. Trần `catalog_max_ratio` 0,25 với corpus 3.290 nghĩa là
không chủ đề nào được vượt 822 level — với 5 chủ đề thì trung bình đã là 658, sát trần.
Trục chủ đề phải mở **trước** khi đổ, không phải sau.

## 4. Quyết định — giả định ghi thành văn, không hỏi lại

| # | Quyết định | Vì sao |
|---|---|---|
| D1 | Hạn ngạch áp cho **cả 230 skill**, gồm 112 skill trạng thái `chờ` | Người đặt việc nói "mỗi skill". Seeder taxonomy đã gieo mọi skill vào DB bất kể `status` — lọc theo `status` sẽ là luật thứ hai không ai yêu cầu |
| D2 | "Game" đếm được = một `game_level` **qua `content_contract`** và publish được | Bài học `#170`: cấm đếm hàng có nhãn. Cổng chỉ đếm level parse sạch |
| D3 | Đa dạng đo bằng cặp `(skill, khuôn)`: C1 ≥4 khuôn, C khác ≥2; mỗi khuôn **2–5** level | Trần 5 là **trần cứng**, vượt là vi phạm chứ không phải cảnh báo. Không có trần thì 20 level dồn hết vào một khuôn vẫn qua |
| D4 | Sinh bằng bộ sinh; viết tay chỉ cho cặp mà máy **chứng minh được** là không sinh nổi | 3.290 level viết tay là nhiều năm. Nhưng "không sinh nổi" phải là kết luận có bằng chứng, không phải lời khai |
| D5 | Ma trận affinity là **dữ liệu có cổng**, suy ra từ `(giao thinking) ∧ (giao band tuổi)` | Ma trận viết tay tự do sẽ drift. Suy ra được thì cổng đối chiếu được, và thêm skill mới thì ma trận tự mở rộng |
| D6 | `construct` quyết ngay ở đợt 0: hoặc vào union, hoặc 3 skill đổi sang `create` | Hoãn thì 3 skill rơi im lặng khỏi mọi phân bổ |
| D7 | Caps tính lại theo tỉ lệ; `stepwise_caps.school` **chỉ giảm** | `BR-CTR-09`. Corpus rộng ra thì tỉ lệ `school` phải hạ theo, cấm nới |
| D8 | Không đợi LO người viết | `generateDefaultLOs()` đang sinh LO tự động; hạn ngạch không phụ thuộc vào đó. Ghi thành nợ riêng, không chặn |
| D9 | Một **strand** = một lát dọc, đóng khi cổng xanh trên chính strand đó | 41 lát. Lát theo strand giữ được mạch sư phạm (prerequisite nằm trong strand), lát theo engine thì không |
| D10 | `#168` (600 level `legacy_v1_ref`) là **tập con** của `#191`, không chạy song song | Cùng đổ vào một corpus, cùng chịu một bộ caps. Chạy song song thì hai chương trình tranh trần chủ đề của nhau |

## 5. Đồ thị phụ thuộc

```
[A] từ vựng thinking đóng          ─┐
[B] ma trận skill × khuôn          ─┼─> [C] bảng phân bổ 3.290 level
[E] trục chủ đề 5 → ≥8             ─┘        │
                                             ├─> [G] cổng đếm theo skill + đa dạng
[D1] 8 bộ sinh cho engine registry  ─────────┤
[D2] 9 engine mới (#181–#189)       ─────────┤
[F] caps tính lại cho corpus 3.290  ─────────┘
                                             │
                      ┌──────────────────────┴──────────────────────┐
                   [W2] C1 lõi   [W3] C1 còn lại   [W4] C2+C3   [W5] C4+C5+C6
```

`A` `B` `E` `F` `G` là **đợt 0** — không lát nào chạy trước khi chúng xong.
`D1` chặn các strand chạm 8 engine kia. `D2` chặn các strand chạm 9 engine mới.

## 6. Lát dọc

### Đợt 0 — nền (chặn tất cả)

| Task | Việc | Sản phẩm |
|---|---|---|
| `#192` | Đóng từ vựng `thinking` giữa taxonomy và union | 3 skill hết mồ côi, cổng đối chiếu + ca âm |
| `#193` | **Ma trận `skill × khuôn`** | `packages/db/config/skill-template-affinity.json` sinh từ `(thinking, band)`, cổng chứng minh mọi skill C1 có ≥4 khuôn hợp lệ |
| `#194` | Mở trục chủ đề của 19 bộ sinh: 5 → ≥8 | `axes.theme` hết viết cứng; cổng đòi ≥8 |
| `#195` | Tính lại `theme-caps.json` cho corpus 3.290 | Tỉ lệ mới, `school` chỉ giảm, ghi `history` |
| `#196` | **Cổng hạn ngạch + đa dạng** | `check:skill-quota` — đếm level/skill, khuôn/skill, level/khuôn; 4 ca âm |

> **Chốt kiểm 0:** `#196` chạy trên corpus 239 hiện tại và **đỏ đúng chỗ**: 184 skill thiếu,
> 26 skill một khuôn. Cổng xanh ở bước này là cổng hỏng.

### Đợt 1 — bộ sinh (chặn phần lớn lát)

| Task | Việc |
|---|---|
| `#197` | 8 bộ sinh còn thiếu: `GT-009` `GT-013` `GT-014` `GT-015` `GT-016` `GT-017` `GT-021` `GT-024` |
| `#198` | Bảng phân bổ 3.290 level → `packages/db/config/level-allocation.json`, sinh từ `#193` |

> **Chốt kiểm 1:** 27/27 bộ sinh; mọi cặp `(band, theme)` của mọi bộ sinh qua `content_contract`;
> bảng phân bổ thoả toàn bộ luật D3 **trên giấy** trước khi sinh một level nào.

### Đợt 2 — C1 lõi · 4 strand · 47 skill · **940 level**

`#199` `C1.NREC` (12→240) · `#200` `C1.CNT` (11→220) · `#201` `C1.OTO` (7→140) ·
`#202` `C1.CMP` (15→300)

### Đợt 3 — C1 còn lại · 6 strand · 52 skill · **1.040 level**

`#203` `C1.NCOMP` (12→240) · `#204` `C1.MEAS` (15→300) · `#205` `C1.PAT` (10→200) ·
`#206` `C1.ADD` (6→120) · `#207` `C1.SUB` (5→100) · `#208` `C1.PROB` (6→120)

> **Chốt kiểm 2:** C1 đủ 1.980 level, 99/99 skill đạt ≥20 và ≥4 khuôn. Caps chưa vỡ.

### Đợt 4 — C2 + C3 · 16 strand · 74 skill · **740 level**

`#209`–`#216` C2 tám strand · `#217`–`#224` C3 tám strand.

### Đợt 5 — C4 + C5 + C6 · 15 strand · 57 skill · **570 level**

`#225`–`#228` C4 · `#229`–`#233` C5 · `#234`–`#239` C6.

> C5 (`VOC` `QUE` `STO` `DES` `LIS`) và C4 `SEN` phụ thuộc `GT-018` listen-respond và tài sản
> âm. Đây là đợt duy nhất chạm `asset_kinds: audio`, nên tách ra cuối cùng.

### Đợt 6 — hợp lưu với `#168`

9 engine mới (`#181`–`#189`) và 600 level `legacy_v1_ref` **đổ vào cùng corpus**. Level của
`#168` tính vào hạn ngạch skill của `#191`, không cộng thêm ngoài.

> **Chốt kiểm 3:** 3.290 level, 230/230 skill đạt hạn ngạch, 658+ cặp `(skill, khuôn)`,
> `check:legacy-v1` 60/60, `engine-depth` bậc 2, mọi caps xanh.

## 7. Điều kiện nghiệm thu chương trình

| # | Điều kiện | Kiểm bằng |
|---|---|---|
| 1 | Mọi skill C1 có ≥20 level đã qua `content_contract` | `check:skill-quota` |
| 2 | Mọi skill C2–C6 có ≥10 level đã qua `content_contract` | `check:skill-quota` |
| 3 | Mọi skill C1 trải ≥4 khuôn; C khác ≥2 khuôn | `check:skill-quota` |
| 4 | **Không** cặp `(skill, khuôn)` nào vượt 5 level | `check:skill-quota` |
| 5 | ≥658 cặp `(skill, khuôn)` riêng biệt | `check:skill-quota` |
| 6 | Mọi bộ sinh khai ≥8 chủ đề; ≥8 chủ đề có mặt trong corpus | `check:theme-registry` |
| 7 | `catalog_max_ratio` `engine_max_ratio` `stepwise_caps` không vỡ | `check:theme-registry` |
| 8 | Mọi level band hợp lệ, không vi phạm `banned_age_bands` | cổng seed |
| 9 | `engine-depth` đạt bậc 2 trên cả 36 engine | `check:engine-depth` |
| 10 | Cổng hạn ngạch có ≥4 ca âm | `pnpm test` |
| 11 | `pnpm check` xanh | — |

## 8. Rủi ro

| Rủi ro | Mức | Giảm thiểu |
|---|---|---|
| **Skill chỉ có một khuôn tự nhiên.** Chưa đo được — `#193` là phép đo đó. Nhưng nhìn theo nghĩa bài thì `C1.MEAS.13` đồng hồ hầu như chỉ hợp `GT-016`, `C1.MEAS.14` tiền xu chỉ hợp `GT-031`, `C1.MEAS.09` đo bằng thước chỉ hợp `GT-030`. Nếu đúng, luật ≥4 khuôn **không thoả được** cho những skill này | **Cao** | `#193` phải liệt kê chúng ra thành danh sách có tên và số, kèm hai lối: hạ luật xuống ≥2 cho đúng danh sách đó, hoặc dựng thêm khuôn. Cấm — NEVER nhét bừa vào khuôn không hợp để cho đủ số |
| Band `3-4` nghèo engine: 62 skill bắt đầu tuổi 3, 9 khuôn mới không giúp gì | Cao | `#193` đo riêng số khuôn hợp lệ cho band `3-4` từng skill; thiếu thì báo trước khi phân bổ |
| Level sinh hàng loạt giống nhau — 3.290 level mà chỉ vài khuôn nội dung | Cao | Trần 5 level mỗi cặp `(skill, khuôn)` chính là thuốc. Cộng cổng chủ đề ≥8 và `difficulty` trải theo `Khó` của skill |
| Cổng đếm được mà không đo được chất lượng — lặp lại lỗi "552/552 đạt trong khi 162/228 không parse" | Cao | D2: chỉ đếm level qua `content_contract`. Cổng chạy trên dữ liệu đã parse, cấm đếm trên nguồn |
| Caps vỡ giữa đợt vì corpus phình theo lát | Trung bình | `#195` tính caps cho **đích 3.290** ngay từ đầu, không tính theo corpus hiện tại |
| LO tự sinh làm 3.290 level trỏ vào mục tiêu học tập máy đặt tên | Trung bình | D8 — ghi thành nợ riêng, không chặn chương trình. Nêu trong PR chốt kiểm 2 |
| 41 lát dọc thành 41 PR lê thê | Trung bình | Gom theo đợt; chốt kiểm chỉ ở ranh giới đợt, không ở từng lát |
