# Kế hoạch — Task #255: Tách kỹ năng nhận biết cho C5 và gieo taxonomy ở Phase 1

> **Loại task:** mở rộng taxonomy (L) + chương trình nội dung (L).
> **Nối tiếp:** [`#254`](254-skill-opening-lesson-plan.md) — dùng lại `GT-000` · bước `echo` ·
> cổng `428 INTRO_REQUIRED` · `check:intro-coverage`.
> **Spec liên quan:** [`concept-topic-model.md`](../specs/05-content/concept-topic-model.md) ·
> [`skill-dataset-model.md`](../specs/05-content/skill-dataset-model.md) ·
> [`taxonomy-service.md`](../specs/01-platform/taxonomy-service.md) ·
> [`c5-language-thinking.md`](../taxonomy/c5-language-thinking.md).

## 1. Quyết định nền

Người đặt việc chốt ngày 2026-09-06: **kỹ năng và mạch kỹ năng nhận biết được gieo ra ở
Phase 1**, không đẩy xuống tầng chủ đề, không coi là vùng cấm.

Điều đó đảo ngược mục 5 của bản trước. Ranh giới ở [`AGENTS.md`](../../../.agents/AGENTS.md)
dòng 123 ("Cấm — NEVER sinh `skills` hoặc `strands`") là luật chống agent **tự ý** sinh
taxonomy khi không ai yêu cầu. Ở đây người sở hữu Lớp 1 đã yêu cầu, và bảng ở mục 4 là
thiết kế để duyệt, không phải sinh tự động. Kế hoạch này ghi rõ **giá phải trả** của mỗi
mã mới để việc duyệt có số mà cân.

`#254` chốt "bài học mở đầu là thêm game level, không phải thêm kỹ năng". Hai quyết định
**không** chọi nhau và ranh giới phải nói rõ, nếu không cãi nhau ở PR sau:

| | `#254` — level dạy `GT-000` | `#255` — kỹ năng nhận biết |
|---|---|---|
| Trả lời câu | "trẻ được **giới thiệu** khái niệm này chưa" | "trẻ **nhận ra** được sáu chữ này chưa" |
| Sinh ra | 1 hàng `game_levels`, `kind = 'teach'` | 1 hàng `skills` + ≥10 level chấm + 1 level dạy |
| Có `mastery_state` riêng | Không | Có |
| Có trên báo cáo phụ huynh | Không | Có |

Nghĩa là mỗi kỹ năng nhận biết ở mục 4 **vẫn** cần một level `GT-000` của riêng nó. Hai
cơ chế xếp chồng: dạy 6 chữ → chơi 10 màn nhận 6 chữ đó → mở kỹ năng dùng chữ.

## 2. Đo được (2026-09-06)

| Trục | Số đo | Nguồn |
|---|---:|---|
| Strand C5 · toàn hệ | 15 · **71** | `packages/shared/src/strands-catalog.ts` |
| Kỹ năng C5 · toàn hệ | 84 · **408** | `packages/content/src/skills/**` |
| Level C5 đã soạn | 885 | 28 template |
| Level dạy `GT-000` trong C5 | **1** | `GL-C5-STO-INTRO-0001` |
| Nợ độ phủ bài làm quen toàn hệ | 377 | `scripts/intro-coverage-baseline.json` |
| Trần kỹ năng chưa có level | **0** | `packages/content-build/src/thresholds/skill-coverage-ratchet.json` |
| Hạn ngạch level mỗi kỹ năng C2–C6 | **≥10 level · ≥2 khuôn · ≤5 level mỗi cặp** | `packages/content-build/src/thresholds/quota.json` |
| Kỹ năng C5 khai audio | **0 / 84** | không file nào chứa `audio` |

### 2.1 Corpus C5 hiện tại là hai cửa sổ trượt

84 dataset chỉ cho ra **31 bộ item phân biệt**, đều là cửa sổ trượt một bước trên hai mảng:

**Mảng A — vốn từ trang trí** (`spoon cup bed chair apple banana watermelon carrot corn dog
cat chicken`). **42 / 84** dataset nằm trọn trong mảng này: `WRT` 7/7 · `BOK` 5/5 · `VOC`
5/5 · `DES` `GRM` `QUE` `STO` 4 mỗi strand · `LIS` `PRA` `WRD` 3 mỗi strand.

`C5.VOC.01` "Từ vựng động vật" = `cup bed chair apple banana`. `C5.WRD.02` "Đọc tiếng quen
thuộc" = emoji rau củ, không một tiếng viết nào.

**Mảng B — 12 chữ cái đầu bảng**, trượt theo số thứ tự kỹ năng. 42 / 84 còn lại:

| Strand | Phải dạy | Có thật trong corpus |
|---|---|---|
| `C5.ALP` | 29 chữ cái + 11 chữ ghép | 12 chữ: `b c d đ e ê g h i k l â` |
| `C5.TON` | 6 dấu thanh | 14 chữ **trần**, **0 dấu thanh** |
| `C5.RHY` | ~53 vần | 12 chữ đơn, **0 vần** |
| `C5.PHO` | ~22 âm đầu | 11 chữ đơn, **0 âm đầu** |
| `C5.PRN` | khái niệm chữ viết | 13 chữ đơn |

`C5.ALP.03` tên là "Nhận nhóm nguyên âm: a ă â e ê i o ô ơ u ư y", dataset là `c d đ e ê`.
`C5.ALP.04` "Nhận đủ 29 chữ cái" có 5 chữ.

Đây là lý do kỹ thuật để tách: không chỗ nào trong mã nguồn **nói ra** 29 giá trị là gì,
nên không cổng nào bắt được dataset 5 chữ. Tách thành kỹ năng nhận biết theo nhóm thì
mỗi nhóm có kho giá trị nhỏ, đếm được, và hạn ngạch ≥10 level ép nội dung thật xuất hiện.

### 2.2 Tầng L4 không mang thông tin phân rã

**84 / 84** kỹ năng C5 có learning objective theo đúng một khuôn
`"Nhận biết và thực hành {tên kỹ năng} ở mức cơ bản"`. Không dùng LO làm chỗ neo được.

### 2.3 Bán kính thay đổi khi số kỹ năng đổi

Con số `408` và `71` được **viết cứng ở 11 chỗ**. Mọi chỗ phải đổi cùng một PR, nếu không
seeder chạy nhưng cổng đỏ, hoặc tệ hơn — cổng xanh mà seed thiếu.

| Chỗ | Nội dung |
|---|---|
| `packages/content-build/src/seed-master/taxonomy/index.ts` | `EXPECTED_SKILL_COUNTS` — `C5: 84` |
| `scripts/taxonomy/sync-taxonomy-docs.ts:105` | so sánh cứng `!== 408`, ném lỗi |
| `scripts/taxonomy/sync-taxonomy-docs.ts:107,253` | thông điệp `expected 408` · `408/408` |
| `scripts/check-intro-coverage.ts:54` | baseline mặc định `408` |
| `packages/taxonomy/tests/taxonomy.test.ts:35` | `expect(STRANDS).toHaveLength(71)` |
| `packages/content-build/tests/gates/level-allocation.test.ts:22,46,126` | `total_skills` `408` |
| `packages/content-build/src/thresholds/level-allocation.json` | `total_skills: 408` |
| `packages/content-build/src/thresholds/skill-age-progression.json` | `total_skills: 408` |
| `packages/content-build/src/thresholds/skill-template-affinity.json` | `total_skills: 408` |
| `packages/db/config/{level-allocation,skill-age-progression,skill-template-affinity}.json` | **bản sao** của ba file trên |
| `packages/content/src/skills/index.ts` | header registry "all 408 skills" |

Ba file ngưỡng tồn tại **hai bản** — `packages/content-build/src/thresholds/` và
`packages/db/config/`. Sửa một bên là dựng sẵn một cổng xanh giả. WP255.1 phải xử lý.

## 3. Giá của một mã kỹ năng mới

Trước khi chốt số lượng, phải biết một mã đắt bao nhiêu. Đo từ cổng đang chạy:

| Khoản | Số |
|---|---|
| Hàng markdown + `SkillIdentity` TS | 2 chỗ, `check:taxonomy-docs` giữ khớp từng ô |
| File `packages/content/src/skills/c5/<strand>/C5.XXX.NN.ts` | identity + dataset + LO + levels |
| Level chấm tối thiểu (`BR-SKQ-02`) | **≥10**, C5 thuộc nhóm `default` |
| Khuôn phân biệt tối thiểu (`BR-SKQ-03`) | ≥2, và ≤5 level mỗi cặp (`BR-SKQ-04`) |
| Level dạy `GT-000` (`#254`) | 1, không tính vào hạn ngạch (`BR-CTM-11`) |
| Nếu chưa có level nào | +1 vào `max_skills_without_levels`, trần hiện **bằng 0** |
| Mã | **bất biến vĩnh viễn** — telemetry, `mastery_state`, `content_skill_map` neo vào |

Nghĩa là **1 mã mới = ≥11 level phải soạn**. Đây là con số quyết định độ mịn ở mục 4:
tách một mã cho mỗi chữ cái (29 mã) sẽ đòi ~320 level chỉ riêng bảng chữ cái.

## 4. Thiết kế đề xuất — 5 strand mới, 35 kỹ năng mới

Độ mịn chọn: **một kỹ năng cho mỗi nhóm dạy được trong một lần ngồi** (5–6 giá trị), không
phải một kỹ năng cho mỗi giá trị. Nhóm 5–6 chữ là cách sách Học vần chia thật, và giữ
báo cáo phụ huynh đọc được — 5 dòng cho bảng chữ cái, không phải 29 dòng.

Năm strand nhận biết đứng **trước** năm strand vận dụng đã có. Strand cũ giữ nguyên mã,
nguyên tên, chỉ được thêm cạnh prerequisite trỏ ngược về strand mới.

### 4.1 `C5.LET` — Nhận biết mặt chữ (Letter Recognition) · 5 kỹ năng · 29 giá trị

| Code | Skill | Tuổi | Khó | Prerequisite | Thinking | Bậc |
|---|---|---|---|---|---|---|
| C5.LET.01 | Nhận biết a · e · i · o · u · y | 4 | 1 | — | `observe` `match` | b |
| C5.LET.02 | Nhận biết ă · â · ê · ô · ơ · ư | 4 | 2 | C5.LET.01 | `observe` `compare` | b |
| C5.LET.03 | Nhận biết b · c · d · đ · g · h | 5 | 2 | C5.LET.01 | `observe` `match` | c |
| C5.LET.04 | Nhận biết k · l · m · n · p · q | 5 | 2 | C5.LET.03 | `observe` `match` | c |
| C5.LET.05 | Nhận biết r · s · t · v · x | 5 | 3 | C5.LET.04 | `observe` `recall` | c |

`LET.01` + `LET.02` = 12 nguyên âm. `LET.03` + `LET.04` + `LET.05` = 17 phụ âm đơn. Cộng
lại đúng 29. `C5.ALP.04` "Nhận đủ 29 chữ cái" giữ nguyên và trở thành bài **tổng hợp** đặt
sau cả năm.

### 4.2 `C5.DGR` — Nhận biết chữ ghép (Digraph Recognition) · 2 kỹ năng · 11 giá trị

| Code | Skill | Tuổi | Khó | Prerequisite | Thinking | Bậc |
|---|---|---|---|---|---|---|
| C5.DGR.01 | Chữ ghép hai: ch · gh · gi · kh · nh · ph · th · tr · qu | 6–7 | 3 | C5.LET.05 | `observe` `match` | a |
| C5.DGR.02 | Chữ ghép có ng: ng · ngh | 6–7 | 4 | C5.DGR.01 | `observe` `compare` | a |

Tách `ng`/`ngh` riêng vì luật chính tả của cặp này (`ngh` đi với `i e ê`) là thứ trẻ vấp,
không phải vì `ngh` dài ba chữ.

### 4.3 `C5.TMK` — Nhận biết dấu thanh (Tone Mark Recognition) · 3 kỹ năng · 6 giá trị

| Code | Skill | Tuổi | Khó | Prerequisite | Thinking | Bậc |
|---|---|---|---|---|---|---|
| C5.TMK.01 | Dấu ngang và dấu huyền | 5 | 2 | C5.LET.01 | `observe` `compare` | c |
| C5.TMK.02 | Dấu sắc và dấu nặng | 5 | 3 | C5.TMK.01 | `observe` `compare` | c |
| C5.TMK.03 | Dấu hỏi và dấu ngã | 6–7 | 4 | C5.TMK.02 | `observe` `compare` | a |

`C5.TON` là nghe ra thanh **bằng tai**; `C5.TMK` là nhận ra dấu **bằng mắt**. Hôm nay
`C5.TON.05` "Nhận dấu thanh trên chữ" gánh cả trục nhìn trong một strand nghe, và dataset
của cả strand có **0 dấu thanh**.

### 4.4 `C5.RIM` — Nhận biết vần (Rime Recognition) · 6 kỹ năng · 53 giá trị

| Code | Skill | Tuổi | Khó | Prerequisite | Thinking | Bậc |
|---|---|---|---|---|---|---|
| C5.RIM.01 | Vần một âm: 12 nguyên âm | 5 | 2 | C5.LET.02 | `observe` `match` | c |
| C5.RIM.02 | Vần đóng bằng n: an ăn ân en ên in on ôn ơn un ưn | 6–7 | 3 | C5.RIM.01 | `observe` `compare` | a |
| C5.RIM.03 | Vần đóng bằng m · ng: am ăm âm ang ăng âng ong ông ung ưng | 6–7 | 3 | C5.RIM.02 | `observe` `compare` | a |
| C5.RIM.04 | Vần đóng bằng c · t · p: ac ăc âc at ăt ât ap ăp âp | 6–7 | 4 | C5.RIM.03 | `observe` `sort` | a |
| C5.RIM.05 | Vần có âm đệm: oa oe uy uê uơ | 6–7 | 4 | C5.RIM.01 | `observe` `compare` | a |
| C5.RIM.06 | Vần nguyên âm đôi: ia iê ua uô ưa ươ | 6–7 | 5 | C5.RIM.04 | `observe` `deduce` | a |

### 4.5 `C5.ONS` — Nhận biết âm đầu (Onset Recognition) · 4 kỹ năng · 22 giá trị

| Code | Skill | Tuổi | Khó | Prerequisite | Thinking | Bậc |
|---|---|---|---|---|---|---|
| C5.ONS.01 | Tách tiếng ra âm đầu và vần | 5 | 3 | C5.PHO.02 | `listen` `deduce` | c |
| C5.ONS.02 | Âm đầu nhóm 1: b · c/k/q · d/gi · đ · g/gh · h | 5 | 3 | C5.ONS.01 | `listen` `match` | c |
| C5.ONS.03 | Âm đầu nhóm 2: l · m · n · ng/ngh · nh · p | 6–7 | 4 | C5.ONS.02 | `listen` `match` | a |
| C5.ONS.04 | Âm đầu nhóm 3: ph · r · s · t · th · tr · v · x · ch · kh | 6–7 | 4 | C5.ONS.03 | `listen` `compare` | a |

Một âm đầu có nhiều dạng chữ (`c` `k` `q` cùng một âm). `ONS` dạy **bằng tai**, dạng chữ
thuộc `LET` và `DGR`. Cấm — NEVER trộn hai trục vào một kỹ năng.

### 4.6 `C5.VOC` +15 kỹ năng — mở rộng strand đã có

`C5.VOC.06`..`C5.VOC.20`, mỗi kỹ năng một bộ từ 8–12 từ, bám 10 chủ đề năm học GDMN ở
[`moet-alignment.md`](../taxonomy/moet-alignment.md) §4: đồ dùng học tập · đồ dùng nhà bếp
· quần áo · bộ phận cơ thể · thời tiết · cây cối · côn trùng · động vật biển · nhạc cụ ·
thể thao · lễ hội Việt Nam · màu sắc · hình dạng bằng lời · cảm xúc · vị trí bằng lời.
Danh sách này chép từ bảng khoảng trống có sẵn trong `c5-language-thinking.md`.

### 4.7 Tổng và cạnh prerequisite phải nối thêm

| | Trước | Sau |
|---|---:|---:|
| Strand C5 | 15 | **20** |
| Kỹ năng C5 | 84 | **119** |
| Strand toàn hệ | 71 | **76** |
| Kỹ năng toàn hệ | 408 | **443** |

Đây là phần **ép thứ tự học**, không phải trang trí. Không có nó thì kỹ năng nhận biết
tồn tại song song chứ không đứng trước:

| Kỹ năng đã có | Thêm prerequisite |
|---|---|
| `C5.ALP.01`..`C5.ALP.06` | `C5.LET.*` tương ứng nhóm chữ |
| `C5.ALP.07` `C5.ALP.08` | `C5.DGR.01` `C5.DGR.02` |
| `C5.TON.05` (nhận dấu trên chữ) | `C5.TMK.03` |
| `C5.RHY.04`..`C5.RHY.07` | `C5.RIM.*` tương ứng |
| `C5.PHO.04`..`C5.PHO.07` | `C5.ONS.02`..`C5.ONS.04` |
| `C5.WRD.01`..`C5.WRD.06` | `C5.LET.05` · `C5.TMK.03` · `C5.RIM.*` |

`assertDag` phải xanh sau khi nối. Chuỗi `PHO.02 → ONS.01 → ONS.02 → PHO.04` không có chu
trình; kiểm lại toàn đồ thị là điều kiện nghiệm thu của WP255.3.

### 4.8 Ba lựa chọn về mã strand

Mã strand bất biến như mã kỹ năng, nên chốt trước khi gõ. Ba phương án:

| | Kiểu | Ví dụ |
|---|---|---|
| **P1 — đề xuất** | 3 chữ, gốc tiếng Anh, đồng bộ 71 strand đang có | `LET` `DGR` `TMK` `RIM` `ONS` |
| P2 | gốc tiếng Việt, đọc thẳng ra khái niệm | `CHU` `GHEP` `THANH` `VAN` `AMDAU` |
| P3 | không thêm strand, nối đuôi strand cũ | `C5.ALP.09`..`.13` · `C5.TON.07`..`.09` |

P3 rẻ nhất về mã nhưng làm file taxonomy đọc ngược: kỹ năng nhập môn nằm **sau** kỹ năng
tổng hợp, vì luật cấm chèn giữa. P1 giữ đúng quy ước hiện có.

## 5. Chi phí nội dung và cách nó chạm cổng

| Khoản | Số |
|---|---:|
| Kỹ năng mới | 35 |
| Level chấm tối thiểu (35 × 10) | **350** |
| Level dạy `GT-000` (35 × 1) | **35** |
| Giá trị phải soạn thật | 29 chữ + 11 chữ ghép + 6 dấu + 53 vần + 22 âm đầu + ~150 từ vựng |
| Mục audio cho `TMK` `RIM` `ONS` `VOC` | ~230 |

**Trần `max_skills_without_levels` đang bằng 0.** Gieo 35 mã trước khi có level là đẩy nó
lên 35. Luật `BR-SKQ-06` cho phép tăng kèm lý do trong PR, nhưng đây là hành vi cần nhìn
thấy, không nên trôi: Phase 1 nâng lên đúng 35, và **mỗi lát cắt sau phải hạ nó xuống**,
kết thúc ở 0. Số đó là thước tiến độ của cả task.

`check:intro-coverage` **không** tăng ở Phase 1 (kỹ năng chưa có level chấm thì không bị
đếm). Nó chỉ tăng nếu một PR thêm level chấm mà không thêm level dạy. Luật của task này:
**mỗi lát cắt vào một PR mang đủ cả ba** — dataset thật, ≥10 level chấm, 1 level dạy.

## 6. Quyết định cần chốt

| Mã | Câu hỏi | Đề xuất |
|---|---|---|
| **D-TA** | Gieo kỹ năng nhận biết ở Phase 1 | **Đã chốt** 2026-09-06 — người đặt việc |
| **D-TB** | Độ mịn: nhóm 5–6 giá trị hay từng giá trị | Nhóm. Từng giá trị = ~310 mã × ≥11 level = vượt cả mốc corpus `#191` |
| **D-TC** | Mã strand P1 / P2 / P3 | P1 (`LET` `DGR` `TMK` `RIM` `ONS`) |
| **D-TD** | `C5.VOC` +15 ngay Phase 1 hay sau lát cắt `LET` | Gieo mã ở Phase 1 cùng 20 mã kia; soạn nội dung sau `LET` |
| **D-TE** | Audio: thu người thật hay TTS | Chưa chốt. ~230 mục nhận biết — đây là con số ra giá |
| **D-TF** | Đổi tên `C5.ALP.08` "Chữ ghép ba: ngh · gh · gi · qu" | Có. Trong bốn chữ đó chỉ `ngh` có ba chữ cái; tên hiện tại dạy sai. Mã giữ nguyên |

`D-TE` chặn cứng lát cắt `TMK` `RIM` `ONS`. `LET` và `DGR` nhìn bằng mắt nên chạy được
trước khi `D-TE` chốt.

## 7. Việc

| WP | Nội dung | Đầu ra |
|---|---|---|
| WP255.1 | Gỡ số cứng `408` / `71` khỏi 11 chỗ ở mục 2.3; gộp ba file ngưỡng trùng bản | cổng suy số từ `SKILL_IDENTITIES`, không viết cứng |
| WP255.2 | Spec đi trước: `taxonomy-service.md` nhận 5 strand mới; spec mới `SKILL-VALUE-INVENTORY` cho kho giá trị | 1 spec mới, 2 spec sửa, `index.md` + `business-rules.md` |
| WP255.3 | **Phase 1 — gieo taxonomy**: 5 strand, 35 kỹ năng, cạnh prerequisite mục 4.7, trần ratchet 0 → 35 | `strands-catalog.ts` · `c5-language-thinking.md` · 35 file `SkillIdentity` · migration seed |
| WP255.4 | Kho giá trị + cổng `check:value-inventory` (dataset ⊆ kho **và** kho ⊆ hợp các dataset) có ca âm | `packages/content/src/inventories/c5-*.ts` + script + baseline |
| WP255.5 | Lát cắt dọc 1 — `C5.LET`: 5 kỹ năng, 29 chữ thật, 50 level chấm, 5 level dạy, chơi thật | ratchet 35 → 30 |
| WP255.6 | Lát cắt dọc 2 — `C5.DGR`: 2 kỹ năng, 11 chữ ghép | ratchet 30 → 28 |
| WP255.7 | Chốt `D-TE`, dựng đường audio cho bước `echo` của `GT-000` | hợp đồng audio + 1 kỹ năng mẫu có tiếng |
| WP255.8 | Lát cắt dọc 3–5 — `C5.TMK` · `C5.RIM` · `C5.ONS`: 13 kỹ năng | ratchet 28 → 15 |
| WP255.9 | Lát cắt dọc 6 — `C5.VOC.06`..`.20`: 15 bộ từ thật | ratchet 15 → 0 |
| WP255.10 | Sửa 42 dataset C5 cũ đang lấy trọn từ vốn từ trang trí; sửa `GL-C5-STO-INTRO-0001` | `BR-CTM-10` xanh trên toàn C5 |

## 8. Điều kiện nghiệm thu

### Phase 1 (WP255.1–255.3)

1. `pnpm db:seed` gieo **443 kỹ năng · 76 strand**, không lỗi.
2. `pnpm check:taxonomy-docs` in `443/443 skills byte-identical` — không còn số cứng `408`.
3. `packages/taxonomy/tests/taxonomy.test.ts` suy số strand từ catalog, không viết `71`.
4. `assertDag` xanh sau khi nối cạnh prerequisite mục 4.7.
5. `skill-coverage-ratchet.json` ghi đúng `35` kèm lý do trỏ về task này. Cấm — NEVER để
   giá trị đó trôi lên vì một PR khác.
6. Trang `/taxonomy` của admin hiện 20 strand cho C5.
7. Ba file ngưỡng chỉ còn **một** bản; bản `packages/db/config/` đọc lại từ `content-build`
   hoặc ngược lại, không phải hai bản chép tay.

### Mỗi lát cắt (WP255.5 trở đi)

8. Ratchet giảm đúng số kỹ năng của lát cắt. Không giảm là level chưa đủ 10 — dừng lại.
9. `check:intro-coverage` **không tăng**. Tăng là PR thiếu level dạy.
10. Ca âm kho giá trị: thêm `id: "cup"` vào dataset `C5.LET.03` → `pnpm check` đỏ.
11. Ca âm phủ kho: xoá một chữ khỏi `C5.LET.05` → cổng nêu đúng chữ thiếu.
12. Sau WP255.5: `grep` thư mục `c5/let/` ra **29 glyph phân biệt**.
13. Sau WP255.8: `C5.TMK` có **6 dấu thanh thật**; hôm nay toàn C5 có 0.
14. Chạy thật ở local: hồ sơ trẻ mới vào game `C5.ALP.01` → `428 INTRO_REQUIRED` vì chưa
    qua `C5.LET.01`; học xong bài dạy `LET.01`, chơi đạt, mở được `ALP.01`; đóng trình
    duyệt mở lại vẫn vào thẳng; `/games` hiện huy hiệu.
15. `pnpm typecheck` nợ = 0, `pnpm lint` xanh, danh sách file test đỏ không dài thêm.

## 9. Rủi ro

| Rủi ro | Dấu hiệu sớm | Cách chặn |
|---|---|---|
| Gieo 35 mã rồi dừng | Ratchet đứng ở 35 qua nhiều PR | Ratchet là thước tiến độ ở mục 5; review hàng tuần đọc đúng số đó |
| Level sinh máy để đạt hạn ngạch 10 | Dataset mới vẫn là cửa sổ trượt, chỉ trượt trên kho mới | Cổng WP255.4 đối chiếu **hai chiều**. Một chiều là tái lập đúng lỗ hổng hiện tại |
| Số cứng `408` sót một chỗ | Seeder chạy nhưng một cổng ném `Counts mismatch` | WP255.1 đi **trước** WP255.3, và có ca âm: đổi một mã rồi chạy cả `pnpm check` |
| Hai bản file ngưỡng lệch nhau | Cổng xanh ở `content-build`, đỏ ở `db` — hoặc ngược lại | Gộp một bản ở WP255.1, không hoãn |
| Mã strand chốt sai rồi phải đổi | — | `D-TC` chốt **trước** WP255.3. Mã strand bất biến như mã kỹ năng |
| Bài nhận biết thành cửa ải | Trẻ 4 tuổi phải qua 5 kỹ năng trước game chữ cái đầu tiên | Cạnh prerequisite mục 4.7 nối **theo nhóm**: `C5.ALP.01` chỉ đòi `C5.LET.01`, không đòi cả năm |
| Ước lượng audio trượt | ~230 mục chưa gồm câu dẫn, lời khen, gợi ý | `D-TE` ra giá theo hai rổ tách rời: **giá trị** và **câu thoại** |
| Sửa hàng loạt bằng `sed` | Diff chạm nhiều strand cùng lúc | Mỗi lát cắt một PR, một strand — vết đã ghi ở đợt thay thế hàng loạt trước |
