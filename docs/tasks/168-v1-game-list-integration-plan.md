# Kế hoạch chương trình — Task #168: Tích hợp toàn bộ 60 game type v1 vào v2

> **Loại task:** chương trình (XL) — **21 task con**, `#169`–`#189`, chia 4 đợt.
> **Spec:** [`168-v1-game-list-integration-spec.md`](168-v1-game-list-integration-spec.md).
> **Tiến độ:** [`168-v1-game-list-integration-todo.md`](168-v1-game-list-integration-todo.md).
> **Nối tiếp:** [`Task #89`](89-game-engine-scale-out-plan.md). Khuôn chương trình theo [`Task #157`](157-competency-allocation-program-plan.md).
> **Nguồn ánh xạ:** [`../taxonomy/game-type-migration.md`](../taxonomy/game-type-migration.md).

## 1. Mục tiêu và mức nghiệm thu

**60 game type v1, mỗi cái ≥10 game level trong v2 mang `legacy_v1_ref` → 600 level.**

Đây là quyết định của người đặt việc ngày 2026-08-31, thay cho phạm vi hẹp hơn mà nghiên cứu ban
đầu đề xuất. Nghiên cứu đo được rằng 51 trong 60 game type đã được phủ ở mức **cơ chế**; quyết định
chốt rằng phủ cơ chế chưa đủ, phải phủ cả ở mức **nội dung**.

| Khối | Game type | Level | Task |
|---|---:|---:|---|
| Nền — từ vựng, bộ sinh, chủ đề, xương truy vết | — | — | `#169`–`#174` |
| Backfill trên 18 khuôn đã có | 51 | 510 | `#175`–`#180` |
| 6 khuôn mới, nguyên thuỷ sẵn có | 6 | 60 | `#181`–`#186` |
| 3 khuôn mới, cần hệ thống mới | 3 | 30 | `#187`–`#189` |
| **Tổng** | **60** | **600** | **21 task** |

Corpus v2 đi từ 250 lên khoảng 850 level, 27 lên 36 engine.

## 2. Quyết định kiến trúc

| # | Quyết định | Vì sao |
|---|---|---|
| D1 | Port **cơ chế và ý tưởng dạng bài**, cấm — NEVER port file hay level | 1.105 level v1 dùng **một** chủ đề (`fruits`) và 6 skill tag. Nhập vào là kéo corpus v2 xuống |
| D2 | "Đã tích hợp" đo bằng trường dữ liệu `legacy_v1_ref`, cấm — NEVER đo bằng lời | v2 hôm nay không có đường truy vết nào. Tiền lệ: `montessori_ref` phải thành dữ liệu sau khi codemod xoá comment làm cổng tụt 24 → 14 |
| D3 | 600 level **sinh bằng bộ sinh**, cấm — NEVER soạn tay | Soạn tay 600 level là nhiều tháng và tái tạo đúng cái đơn điệu của v1 |
| D4 | Vì D3, lộ trình A (bộ sinh + chủ đề) **chặn cứng** mọi backfill | Không bộ sinh thì không có 10 level nào; 7 trong 8 engine thiếu bộ sinh nằm ngay trong danh sách 18 engine phải backfill |
| D5 | Xương truy vết đi trước backfill | Backfill trước rồi mới gắn nhãn là làm hai lần, và không biết lúc nào đủ |
| D6 | Một task viết mã engine = một engine. Task chỉ soạn nội dung được gom, nhưng mỗi engine là một work package | Giữ được luật "1 lát dọc" ở chỗ nó bảo vệ thật, không nở ra 34 task |
| D7 | Khuôn mới ra đời `status: draft`; chuyển `published` ở task đóng chương trình | `published` là quyết định nội dung, cần đủ 10 level thật trước |
| D8 | `stepwise_caps.school` phải hạ theo khi corpus rộng ra | `BR-CTR-09` — ngưỡng chỉ giảm. Để nguyên là cổng nới ra âm thầm |

## 3. Đồ thị phụ thuộc

```
#169 A0 từ vựng mechanic ─────┐
                              │
#170 D  xương truy vết ───────┤   (đọc từ vựng mechanic; audit 250 level hiện có)
                              │
     ┌────────────────────────┴───────────┐
     │                                    │
#171 4 bộ sinh cần bộ giải          #173 mở trục chủ đề 19 bộ sinh
     GT-009 013 014 015                   5 → ≥8
#172 4 bộ sinh cần kiểm hình học          │
     GT-016 017 021 024                   │
     └────────────────────────┬───────────┘
                              │
                        #174 engine-depth bậc 1
                              │
                    ═══ CHỐT KIỂM 1 ═══
                              │
     ┌────────────┬───────────┼───────────┬────────────┬───────────┐
   #175         #176        #177        #178         #179        #180
   GT-003       GT-001      GT-008    GT-006+005   5 engine    8 engine
   80 lv        70 lv       60 lv       80 lv       130 lv      90 lv
     └────────────┴───────────┼───────────┴────────────┴───────────┘
                              │
                    ═══ CHỐT KIỂM 2 — 51/60, 510 level ═══
                              │
     ┌──────┬──────┬──────────┼──────────┬──────┬──────┐
   #181   #182   #183       #184       #185   #186
  GT-028 GT-029 GT-030     GT-031     GT-032 GT-033
     └──────┴──────┴──────────┴──────────┴──────┴──────┘
                              │
                    ═══ CHỐT KIỂM 3 — 57/60, 570 level ═══
                              │
                 #187 GT-034 → #188 GT-035 → #189 GT-036   (tuần tự)
                              │
                    ═══ CHỐT KIỂM 4 — 60/60, 600 level, publish ═══
```

`#171` `#172` `#173` chạy song song được. `#175`–`#180` chạy song song được. `#181`–`#186` chạy
song song được. `#187`–`#189` **cấm — NEVER song song**: mỗi cái một hệ thống mới và một câu hỏi mở.

## 4. Đợt 1 — nền (`#169`–`#174`)

| Task | Tên | Quy mô | Chặn bởi |
|---|---|---|---|
| `#169` | Từ vựng `mechanic` khớp registry và ép bằng kiểu | M | — |
| `#170` | Xương truy vết v1: registry 60, `legacy_v1_ref`, cổng phủ, audit 250 level | L | `#169` |
| `#171` | Bốn bộ sinh cần bộ giải: `GT-009` `GT-013` `GT-014` `GT-015` | L | `#169` |
| `#172` | Bốn bộ sinh cần kiểm hình học: `GT-016` `GT-017` `GT-021` `GT-024` | L | `#169` |
| `#173` | Mở trục chủ đề 19 bộ sinh hiện có, 5 → ≥8 | M | `#169` |
| `#174` | Bật `engine-depth` bậc 1 | M | `#171` `#172` `#173` |

### ═══ CHỐT KIỂM 1 ═══

- [ ] `ALL_LEVEL_GENERATORS` đủ 27 khoá; không bộ sinh nào khai dưới 8 chủ đề.
- [ ] `LEGACY_V1_GAME_TYPES` đủ 60 hàng, property test song ánh xanh.
- [ ] Cổng phủ v1 chạy được và in số thật — kể cả khi số đó là 0/60.
- [ ] Audit đã trả lời: trong 250 level hiện có, bao nhiêu gắn được `legacy_v1_ref`.
      **Số này quyết định kích thước sáu task đợt 2** — nên đợt 2 chỉ được viết plan sau chốt kiểm này.
- [ ] `check:engine-depth` xanh ở bậc 1 · `pnpm check` xanh.

## 5. Đợt 2 — backfill 51 game type, 510 level (`#175`–`#180`)

| Task | Engine | Game type v1 | Level |
|---|---|---|---:|
| `#175` | `GT-003` kéo vào đích | `D1-01` `D1-04` `D2-05` `D4-01` `D4-02` `D4-03` `D4-04` `D4-08` | 80 |
| `#176` | `GT-001` chọn một đáp án | `D1-03` `D1-11` `D5-01` `D5-02` `D2-06` `D4-05` `D4-07` | 70 |
| `#177` | `GT-008` kéo vào ô chứa | `D1-05` `D5-05` `D2-01` `D3-01` `D3-02` `D6-04` | 60 |
| `#178` | `GT-006` + `GT-005` | `D1-09` `D5-06` `D5-07` `D3-03` `D4-06` · `D1-02` `D1-08` `D6-03` | 80 |
| `#179` | `GT-012` `GT-018` `GT-023` `GT-019` `GT-022` | 13 game type | 130 |
| `#180` | `GT-014` `GT-013` `GT-016` `GT-021` `GT-024` `GT-015` `GT-009` `GT-020` | 9 game type | 90 |

Mỗi task cùng một hình dạng nghiệm thu, một work package cho một game type v1:

1. Đọc dạng bài gốc trong `tinimath/packages/game-engine/src/handlers/<domain>/<Session>.ts` —
   lấy **ý tưởng**, cấm — NEVER copy mã.
2. Sinh 10 level bằng `gen:levels`, trải ≥3 chủ đề và mọi band hợp lệ của khuôn.
3. Gắn `legacy_v1_ref` đúng mã v1.
4. Mọi level qua `content_contract`; cổng phủ v1 tăng đúng số game type đã làm.
5. `check:theme-registry` xanh — `engine_max_ratio` 0,5 nghĩa là 80 level `GT-003` không được để
   chủ đề nào quá 40.

### ═══ CHỐT KIỂM 2 ═══

- [ ] Cổng phủ v1: **51/60** ở mức ≥10 level.
- [ ] ≥510 level mang `legacy_v1_ref`, tất cả qua Cổng 1.
- [ ] `check:theme-registry` xanh, `stepwise_caps.school` đã hạ theo tỉ lệ mới.
- [ ] `check:engine-depth` vẫn xanh.

## 6. Đợt 3 — sáu khuôn mới trên nguyên thuỷ sẵn có (`#181`–`#186`)

| Task | Mã | `mechanic` | Game type v1 | Rủi ro riêng |
|---|---|---|---|---|
| `#181` | `GT-028` | `tap-count` | `D1-10` | Thấp |
| `#182` | `GT-029` | `remove-from-set` | `D1-12` | Thấp |
| `#183` | `GT-030` | `measure-with-unit` | `D5-04` | Cần `LayoutId` thước ngang |
| `#184` | `GT-031` | `coin-compose` | `D5-10` | Mệnh giá là nội dung, cấm hardcode |
| `#185` | `GT-032` | `pour-quantity` | `D5-09` | Câu hỏi mở 3 |
| `#186` | `GT-033` | `weave-grid` | `D3-07` | Cần `LayoutId` lưới dệt |

Mỗi task là một lát dọc đủ tám phần: `template.ts` · `session.ts` · `fixtures.ts` ·
`generators/gt0nn.ts` · test phiên engine ≥12 ca · phiếu engine 10 mục · `gen:templates` không sinh
diff · **10 level mang `legacy_v1_ref`**.

### ═══ CHỐT KIỂM 3 ═══

- [ ] 33 template · 33 phiếu · 33 bộ sinh · `check:engine-specs` xanh.
- [ ] Cổng phủ v1: **57/60**, ≥570 level.
- [ ] Câu hỏi mở 1 và 2 đã trả lời. Chưa trả lời thì **dừng ở đây**.

## 7. Đợt 4 — ba khuôn cần hệ thống mới (`#187`–`#189`)

| Task | Mã | `mechanic` | Game type v1 | Hệ thống mới | Chặn bởi |
|---|---|---|---|---|---|
| `#187` | `GT-034` | `beat-sequence` | `D3-06` | `beat-system` | Câu hỏi mở 2 |
| `#188` | `GT-035` | `command-sequence` | `D6-05` | `command-queue-system` | `#187` |
| `#189` | `GT-036` | `free-create` | `D3-05` | chấm quy luật do trẻ đặt | Câu hỏi mở 1 · `#188` |

### ═══ CHỐT KIỂM 4 — đóng chương trình ═══

- [ ] Cổng phủ v1: **60/60**, ≥600 level.
- [ ] 36 template · 36 phiếu · 36 bộ sinh.
- [ ] `pnpm check` xanh · 0 tham chiếu `tinimath/` trong mã v2.
- [ ] PR riêng: 9 khuôn `draft` → `published`, và bật `engine-depth` lên bậc người quyết chốt.

## 8. Rủi ro

| Rủi ro | Mức | Giảm thiểu |
|---|---|---|
| Cổng phủ v1 xanh giả — đếm nhãn thay vì đếm nội dung dùng được | Cao | Cổng đếm level đã qua `content_contract`, không đếm hàng có `legacy_v1_ref`. Ca âm: level hỏng contract mà có nhãn thì không được tính |
| `legacy_v1_ref` gắn bừa cho đủ số ở `#170` | Cao | Audit ghi lý do từng cặp; không khớp thì để trống. Reviewer đối chiếu mẫu ngẫu nhiên |
| 600 level sinh ra na ná nhau | Cao | Test đòi hai chủ đề khác nhau cùng seed cho nội dung khác nhau; `engine_max_ratio` 0,5 ép trải chủ đề |
| Trần chủ đề vỡ giữa chừng đợt 2 | Trung bình | Mỗi task đợt 2 chạy `check:theme-registry` trước khi đóng, không để dồn tới cuối |
| `GT-036` không chấm được | Cao | Chặn ở chốt kiểm 3 |
| Bậc `engine-depth` hay `theme-caps` bị nới để cổng xanh | Trung bình | `BR-CTR-09` đã cấm nới; reviewer đối chiếu diff file cấu hình ở mọi PR |
| 21 task trôi mất mạch | Trung bình | Todo chương trình ở [`168-…-todo.md`](168-v1-game-list-integration-todo.md) là bảng theo dõi duy nhất |

## 9. Câu hỏi mở — đã quyết 2026-08-31

Người đặt việc uỷ quyền quyết theo mục tiêu. Bốn câu đóng bằng số đo, không hoãn sang chốt kiểm.

| # | Câu hỏi | Quyết | Căn cứ đo được |
|---|---|---|---|
| 1 | `GT-036` chấm thế nào khi không có đáp án đúng | **Chấm theo quy luật trẻ tự đặt**, thang 100 chuẩn: phát hiện được quy luật lặp ≥ `min_repetitions` = 60 · mỗi lần lặp thêm +10 tới 80 · số phần tử khác nhau dùng tới 100 | v1 `FreeCreateSystem(minRep, strictness)` đã chấm đúng cách này. Bài toán không phải "không có đáp án đúng" mà là "mọi quy luật tự nhất quán đều đúng" — chấm được, và vừa `STANDARD_SCORING` |
| 2 | `GT-034` dựng bộ phát mẫu nhịp hay hoãn | **Dựng**, rủi ro thấp | `systems/sfx-engine.ts` đã có `NoteRecipe { delaySec, freq, durationSec, rampOutSec }` và đường tổng hợp oscillator ép sẵn `BR-ENG-16`. Một chuỗi nhịp **là** một `NoteRecipe[]`. `BeatSystem` chỉ dựng mảng đó từ nội dung — không hạ tầng âm thanh mới, không tệp mạng, không micro |
| 3 | `GT-032` lượng liên tục hay lượng tử hoá | **Lượng tử hoá thành mức**, cấm — NEVER mở kiểu liên tục | v1 `d509Schema` bản thân đã rời rạc: `fill_levels: number[]` · `cups[]` · `question_type` enum. Giá trị sư phạm nằm ở `conservation_trap` (cùng lượng, cốc khác hình) — bẫy Piaget, và nó rời rạc |
| 4 | Bậc `engine-depth` cuối chương trình | **Bậc 2** (12 level/engine), cấm — NEVER nhảy bậc 3 | Engine mỏng nhất sau chương trình: khuôn mới = 10 legacy + 3 fixture = 13; engine cũ gánh 1 game type = 10 + 6 = 16. Bậc 2 đạt được ở mọi engine; bậc 3 (20) thì 9 khuôn mới thủng |

Không còn câu hỏi nào chặn. `#185` `#187` `#189` mở được ngay khi task chặn nó đóng.

## 10. Giả định định cỡ đợt 2

Audit của [`#170`](170-legacy-v1-traceability-spine-plan.md) chưa chạy, nên sáu task đợt 2 **viết ở
cỡ đầy đủ 510 level**. Tín dụng audit chỉ **giảm** số phải sinh, cấm — NEVER tăng.

Căn cứ: 250 level hiện có, **49** mang `montessori_ref` nên là nội dung gốc Montessori chứ không kế
thừa v1; 201 còn lại là ứng viên. Ứng viên **cấm — NEVER mặc định là khớp** — quy tắc gắn nhãn ở
`#170` đòi khớp **dạng bài**, không phải khớp khuôn. Vì vậy plan lấy tín dụng audit bằng **0** và
mỗi todo đợt 2 có một bước trừ lại theo báo cáo audit trước khi sinh.
