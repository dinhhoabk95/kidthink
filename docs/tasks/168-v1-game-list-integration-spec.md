# Task #168 Spec — Nhập danh mục trò chơi v1 vào thư viện template v2

> **Outcome:** Trả lời bằng số câu "lấy 60 game type của v1 để đa dạng hoá thư viện template v2"
> có đúng là việc cần làm không, rồi chốt phạm vi thật: **9 khuôn cơ chế** v1 còn giữ giá trị,
> và **trục chiều sâu** (generator + chủ đề) phải đi trước, nếu không 9 khuôn mới chỉ nhân bản
> đúng cái bế tắc đang có.
>
> Spec sở hữu liên quan: [`game-template-contract.md`](../specs/01-platform/game-template-contract.md) ·
> [`template-authoring-kit.md`](../specs/01-platform/template-authoring-kit.md) ·
> [`level-generator-kit.md`](../specs/01-platform/level-generator-kit.md) ·
> [`engine-content-depth.md`](../specs/05-content/engine-content-depth.md) ·
> [`content-theme-registry.md`](../specs/05-content/content-theme-registry.md).
> Bảng ánh xạ nguồn: [`../taxonomy/game-type-migration.md`](../taxonomy/game-type-migration.md).

---

## 1. Objective

Định hướng của người đặt việc là **template làm trung tâm**: một khuôn trò chơi phục vụ nhiều
chủ đề, nhiều bài học, nhiều loại năng lực tư duy. Câu hỏi đặt ra là lấy danh sách trò chơi v1
ở `tinimath/packages/game-engine/` đổ vào v2 để đa dạng hoá.

Đo xong thì câu hỏi tách làm hai, và hai câu có hai câu trả lời khác nhau:

| Trục | Câu hỏi | Trả lời đo được |
|---|---|---|
| **Cơ chế** — số khuôn | v1 còn cơ chế nào v2 chưa có? | Còn, nhưng chỉ **9**, không phải 60. 23 trên 26 khuôn của bảng migration đã nằm trong v2 |
| **Chiều sâu** — nội dung mỗi khuôn | một khuôn v2 đang phục vụ được bao nhiêu chủ đề? | **5 trên 14**, và 8 trên 27 khuôn chưa có bộ sinh nào nên đứng nguyên ở sàn 3 level |

Trần đang chặn định hướng "template làm trung tâm" nằm ở trục thứ hai, không phải trục thứ nhất.
File này sở hữu phạm vi của cả hai và **thứ tự** giữa chúng.

> **Quyết định của người đặt việc (2026-08-31), thay phạm vi đề xuất ban đầu:**
> phải tích hợp **toàn bộ 60 game type v1** vào v2, mức nghiệm thu **10 game level mỗi game type**.
> Nghĩa là 60 × 10 = **600 level** mang truy vết nguồn v1. Phần "chỉ 9 khuôn" ở mục 2.4 vẫn đúng
> về **cơ chế**; quyết định này mở thêm trục **nội dung**: 51 game type còn lại phải có mặt trong
> v2 dưới dạng level trên khuôn đã ánh xạ, chứ cấm — NEVER bỏ rơi vì "khuôn đã có sẵn".

## 2. Bằng chứng đã đo (2026-08-31)

Mọi số dưới đây đo bằng chạy mã, không suy đoán. Lệnh tái dựng ghi ở mục 5.

### 2.1 Phía v1 — `tinimath/packages/game-engine`

| Số đo | Giá trị |
|---|---|
| Domain | 6 (`D1`–`D6`) |
| Game type đăng ký | 60 |
| Lớp `Session` riêng biệt | 50 |
| File dưới `src/` | 138 |
| Level sinh ra từ `packages/db/src/seed-levels` | **1.105** |

Corpus level v1 **cấm — NEVER được dùng làm nguồn nội dung**, vì ba số này:

| Trục | v1 đo được | Ý nghĩa |
|---|---|---|
| `item_themes` | **1 giá trị** — `fruits` trên cả 1.105 level | Không có đa dạng chủ đề để nhập |
| `skill_tags` | **6 giá trị** khác nhau | Không nối được vào 230 skill của v2 |
| `config_params` | **336 khoá** khác nhau, không schema | Không đối chiếu được với `content_contract` |

Thang độ khó v1 cũng chỉ là nhãn, không phải thang:

| Nhãn | n | `item_count` | `distractor_count` |
|---|---:|---|---|
| `easy` | 551 | 2..5 (tb 5,0) | 0..3 (tb 0,1) |
| `medium` | 434 | 3..12 (tb 5,1) | 0..2 (tb 0,0) |
| `hard` | 101 | 5..20 (tb 6,7) | 0..2 (tb 0,1) |
| `challenge` | 19 | 5..5 (tb 5,0) | 0..0 (tb 0,0) |

`easy` trung bình 5,0 vật, `medium` 5,1. Nhiễu gần bằng 0 ở cả bốn bậc. Nghĩa là 1.105 level v1
cũng cấm — NEVER dùng làm tham chiếu để hiệu chỉnh `difficulty_contract` của v2.

**Thứ duy nhất còn giá trị ở v1 là 50 lớp `Session`** — logic tương tác đã chạy thật với trẻ.

### 2.2 Phía v2 — `mindkid/packages/game-engine`

| Số đo | Giá trị |
|---|---|
| Template | 27 (`GT-001`..`GT-027`) |
| Lô | `mvp` 6 · `montessori` 11 · `legacy-v1` 7 · `taxonomy-gap` 3 |
| Bộ sinh level | **19 / 27** |
| Engine chưa có bộ sinh | `GT-009` `GT-013` `GT-014` `GT-015` `GT-016` `GT-017` `GT-021` `GT-024` |
| Chủ đề mỗi bộ sinh khai | **5** — `school` `farm` `home` `nature` `food`, giống hệt nhau ở cả 19 |
| Chủ đề trong `CONTENT_THEMES` | 14 |
| Chủ đề chưa bộ sinh nào chạm | **9** — `animal` `ocean` `vehicle` `art` `space` `family` `body` `weather` `festival` |
| Danh từ mỗi chủ đề trong `CONTENT_THEMES` | **10**, đều nhau ở cả 14 — vốn từ Cấm — NEVER là lý do 9 chủ đề bị bỏ trống |
| Game level trong seed | **250** |
| Bậc đang bật ở `packages/db/config/engine-depth.json` | `0` — sàn 3 level/engine |
| Sàn bậc 3 | 20 level/engine → **540** |

Tám engine không có bộ sinh trùng khớp với nhóm đứng ở sàn: `GT-009` 3 · `GT-013` 3 · `GT-014` 4 ·
`GT-015` 3 · `GT-016` 6 · `GT-017` 3 · `GT-021` 3 · `GT-024` 3. Không có bộ sinh thì chỉ còn đường
soạn tay, và soạn tay dừng ở đúng ba level mà `game-template-contract.md` mục 4 đòi để chứng minh
hợp đồng dùng được.

### 2.2b Không có đường truy vết nguồn v1 — "đã tích hợp" hôm nay không đo được

Grep `LEGACY_GAME_TYPE_MAP`, `legacy_id`, `D1-01`, `C1-01` trên `packages/shared/src`,
`packages/db/src/schema`, `packages/game-engine/src` → **0 kết quả**. `ContentSeedHeader`
(`packages/db/src/seed-content/types.ts`) có 18 trường, không trường nào ghi game type v1 mà một
level kế thừa.

Hệ quả: câu "đã tích hợp toàn bộ game cũ" hôm nay **cấm — NEVER kiểm chứng được**, và một cổng
khai là đo nó sẽ là cổng xanh giả ngay từ ngày đầu.

Có tiền lệ đúng ngay trong file đó: trường `montessori_ref?: string` được thêm vào header vì
`tests/gates/montessori-corpus.ts` từng đếm bằng cách quét comment trong file, rồi một codemod xoá
comment và cổng tụt 24 → 14 trong khi nội dung không mất gì. Ghi chú trong mã nói thẳng: *"con số
có cổng canh thì phải là dữ liệu"*. Trường `legacy_v1_ref` đi theo đúng khuôn đó.

### 2.3 Từ vựng `mechanic` đã trôi khỏi registry

`packages/shared/src/taxonomy-types.ts:95` khai `GameMechanic` với **29** giá trị. Registry engine
đang chạy **27** mechanic. Lệch cả hai chiều:

| Chiều | Giá trị | Số |
|---|---|---:|
| Trong union, không template nào dùng | `drag-to-order` · `tap-count` · `balance` · `sequence-arrange` · `free-create` | 5 |
| Đang chạy, không có trong union | `spot-difference` · `go-nogo` · `rule-switch` | 3 |

Ngoài chính file khai và một dòng re-export ở `packages/taxonomy/src/types.ts:27`, **không nơi nào
dùng kiểu này**. Từ vựng tồn tại nhưng không ép được gì — cùng họ với năm dạng cổng xanh giả đã ghi
ở [`89-game-engine-scale-out-plan.md`](89-game-engine-scale-out-plan.md) mục 2.4.

### 2.4 Delta thật giữa hai bên

[`../taxonomy/game-type-migration.md`](../taxonomy/game-type-migration.md) đã gộp 60 game type v1
thành **26** khuôn. Đối chiếu với registry v2:

| Trạng thái | Khuôn | Số |
|---|---|---:|
| Khớp thẳng sang `GT` | `drag-to-container` `drag-to-slot` `tap-select` `pair-match` `construct` `flash-recall` `listen-respond` `rotate-transform` `balance` `hidden-object` `maze-route` `memory-flip` `trace-path` `mirror-complete` `clock-set` `spot-difference` `matrix-fill` `go-nogo` `rule-switch` | 19 |
| Gộp được, đã gộp | `grid-fill`→`GT-015` · `logic-grid`→`GT-009` · `sequence-arrange`→`GT-006` · `drag-to-order`→`GT-006` | 4 |
| **Chưa có khuôn nào** | `free-create` · `tap-count` · `coin-count` | 3 |

Ngoài bảng đó, sáu game type v1 bị bảng gộp làm **mất hành động của trẻ**, không chỉ mất tên:

| v1 | Bảng gộp về | Cái bị mất |
|---|---|---|
| `D1-12` `RemoveItemSession` | `tpl-drag-to-container` | Bớt vật khỏi tập — phép trừ trực quan |
| `D3-06` `BeatMakerSession` | `tpl-free-create` | Tạo nhịp, phát lại chuỗi âm |
| `D3-07` `WeavingPatternSession` | `tpl-drag-to-slot` | Quy luật hai chiều trên lưới |
| `D5-04` `UnitMeasureSession` | `tpl-drag-to-order` | Đặt lặp một đơn vị rồi đếm |
| `D5-09` `LiquidPouringSession` | `tpl-tap-select` | Lượng liên tục, rót |
| `D6-05` `CodePathLogicSession` | `tpl-maze-route` | Xếp hàng lệnh rồi chạy — có `loop` |

Kiểm chứng phía v2: grep bảy từ khoá `commandQueue` `freeCreate` `accumulator` `pour` `coin` `beat`
`weav` trên `packages/game-engine/src` và `packages/shared/src` trả về **0 kết quả**.

→ **9 khuôn ứng viên**, không phải 60.

## 3. Assumptions và ranh giới

Ghi ra để bác được, cấm — NEVER hỏi lại bằng multiple-choice.

1. **Toàn bộ 60 game type v1 phải có mặt trong v2, mỗi cái ≥10 level.** Đây là quyết định của
   người đặt việc, không phải đề xuất của tác giả. Tác giả đã nêu rằng 51 trong 60 đã được phủ
   ở mức **cơ chế**; người đặt việc chốt rằng phủ cơ chế chưa đủ, phải phủ cả ở mức **nội dung**.
   Phạm vi thi công theo đó: 600 level mang `legacy_v1_ref`.
2. **Cấm — NEVER đụng `content_contract` của 27 khuôn đã `published`.** Đổi là breaking change theo
   `BR-GTC-08`. Mọi thứ ở đây cộng thêm.
3. **Cấm — NEVER nhập 1.105 level v1 vào seed v2.** Mục 2.1 cho thấy chúng một chủ đề, sáu skill,
   336 khoá không schema. Nhập vào là kéo corpus v2 tụt xuống mức đó.
4. **Cái được port từ v1 là logic tương tác trong 50 lớp `Session`**, viết lại theo nguyên thuỷ cơ chế
   của v2 (`selection` `ordering` `pairing` `placement`), cấm — NEVER copy nguyên lớp v1 vào v2.
5. **Trục chiều sâu đi trước trục cơ chế.** Thêm 9 khuôn khi 8 khuôn hiện có chưa có bộ sinh là nhân
   bài toán cũ lên 17.
6. **Mọi khuôn mới phải có bộ sinh trong cùng lát cắt.** Đây là điều kiện nghiệm thu, không phải lời khuyên.
7. **Một lát dọc là một engine.** Cấm — NEVER gộp ngang nhiều engine vào một task khi task đó
   **viết mã engine**. Task chỉ **soạn nội dung** được gom nhiều engine, nhưng mỗi engine là một
   work package riêng trong todo.
8. **"Tích hợp" đo bằng `legacy_v1_ref`, cấm — NEVER đo bằng lời.** Một game type v1 được coi là
   đã tích hợp khi có ≥10 level `published` trong v2 mang `legacy_v1_ref` của nó và qua được
   `content_contract` của khuôn.
9. **600 level sinh bằng bộ sinh, cấm — NEVER soạn tay.** Soạn tay 600 level là việc nhiều tháng
   và sẽ tái tạo đúng cái đơn điệu của v1. Đó là lý do lộ trình A chặn cứng lộ trình C.

## 4. Phạm vi

### 4.1 Trong phạm vi

**Lộ trình A — chiều sâu (chặn cứng lộ trình B và C):**

- A0 — Đồng bộ `GameMechanic` với registry và ép nó bằng kiểu, kèm ca âm.
- A1 — Tám bộ sinh còn thiếu: `GT-009` `GT-013` `GT-014` `GT-015` `GT-016` `GT-017` `GT-021` `GT-024`.
- A2 — Mở trục `theme` của 19 bộ sinh hiện có từ 5 lên tối thiểu 8 chủ đề.
- A3 — Bật `engine-depth` từ bậc 0 lên bậc 1.

**Lộ trình D — xương truy vết (chặn cứng lộ trình C):**

- D1 — Registry 60 game type v1 trong `packages/shared`, sinh từ
  [`../taxonomy/game-type-migration.md`](../taxonomy/game-type-migration.md), có property test song ánh.
- D2 — Trường `legacy_v1_ref?: string` trong `ContentSeedHeader`, theo đúng khuôn `montessori_ref`.
- D3 — Cổng phủ v1 với bậc thang riêng: đo *"bao nhiêu trên 60 game type có ≥N level"*, `N` cấu hình được.
- D4 — Audit 250 level hiện có: cái nào thực sự kế thừa một game type v1 thì gắn `legacy_v1_ref`.
  Cấm — NEVER gắn cho đủ số; không khớp thì để trống và tính là chưa phủ.

**Lộ trình C — backfill 51 game type trên khuôn đã có, 510 level:**

| Engine | Game type v1 phủ | Level |
|---|---|---:|
| `GT-003` | `D1-01` `D1-04` `D2-05` `D4-01` `D4-02` `D4-03` `D4-04` `D4-08` | 80 |
| `GT-001` | `D1-03` `D1-11` `D5-01` `D5-02` `D2-06` `D4-05` `D4-07` | 70 |
| `GT-008` | `D1-05` `D5-05` `D2-01` `D3-01` `D3-02` `D6-04` | 60 |
| `GT-006` | `D1-09` `D5-06` `D5-07` `D3-03` `D4-06` | 50 |
| `GT-005` | `D1-02` `D1-08` `D6-03` | 30 |
| `GT-012` | `D1-06` `D1-07` `D1-13` | 30 |
| `GT-018` | `D3-04` `D3-08` `D6-09` | 30 |
| `GT-023` | `D2-02` `D2-07` `D6-10` | 30 |
| `GT-019` | `D2-04` `D2-10` | 20 |
| `GT-022` | `D2-08` `D6-06` | 20 |
| `GT-014` | `D5-03` `D6-08` | 20 |
| `GT-013` | `D6-01` | 10 |
| `GT-016` | `D5-08` | 10 |
| `GT-021` | `D2-03` | 10 |
| `GT-024` | `D2-09` | 10 |
| `GT-015` | `D6-02` | 10 |
| `GT-009` | `D6-07` | 10 |
| `GT-020` | `D6-11` | 10 |
| **Tổng** | **51 game type trên 18 engine** | **510** |

**Lộ trình B — 9 khuôn mới, mỗi khuôn gánh đúng 1 game type v1, 90 level:**

| Mã | Tên | `mechanic` | Game type v1 | Nguồn v1 | Level |
|---|---|---|---|---|---:|
| `GT-028` | Chạm đếm tích luỹ | `tap-count` | `D1-10` | `TapNumberSenseSession` · `accumulatorDisplay` | 10 |
| `GT-029` | Bớt khỏi nhóm | `remove-from-set` | `D1-12` | `RemoveItemSession` | 10 |
| `GT-030` | Đo bằng đơn vị lặp | `measure-with-unit` | `D5-04` | `UnitMeasureSession` | 10 |
| `GT-031` | Gộp tiền xu | `coin-compose` | `D5-10` | `MoneySession` | 10 |
| `GT-032` | So lượng chất lỏng | `pour-quantity` | `D5-09` | `LiquidPouringSession` | 10 |
| `GT-033` | Dệt hoa văn lưới | `weave-grid` | `D3-07` | `WeavingPatternSession` | 10 |
| `GT-034` | Gõ theo nhịp | `beat-sequence` | `D3-06` | `BeatMakerSession` · `audioPatternPlayer` | 10 |
| `GT-035` | Xếp hàng lệnh | `command-sequence` | `D6-05` | `CodePathLogicSession` · `stackSystem` | 10 |
| `GT-036` | Tự tạo quy luật | `free-create` | `D3-05` | `FreeCreateSession` · `freeCreateSystem` | 10 |

51 + 9 = **60 game type**. 510 + 90 = **600 level**.

### 4.2 Trần phải tôn trọng khi đổ 600 level

`packages/db/config/theme-caps.json` đang canh, và `BR-CTR-09` nói ngưỡng **chỉ giảm**:

| Trần | Giá trị | Ràng buộc lên 600 level |
|---|---|---|
| `catalog_max_ratio` | 0,25 | Trên tổng ~850 level, không chủ đề nào quá 212 |
| `engine_max_ratio` | 0,50 | `GT-003` có 80 level legacy thì không chủ đề nào quá 40 |
| `min_themes_count` | 8 | Mỗi engine phải chạm ≥8 chủ đề — đây là lý do A2 chặn cứng lộ trình C |
| `min_levels_per_theme` | 5 | — |
| `stepwise_caps.school` | 0,37 | 600 level mới sẽ kéo tỉ lệ `school` xuống; **phải hạ ngưỡng theo**, cấm — NEVER để nguyên |

### 4.3 Ngoài phạm vi

- Nhập level, asset, hay `config_params` của v1 vào seed v2. 600 level **sinh mới** bằng bộ sinh
  của v2, chỉ mượn *ý tưởng dạng bài* của v1 qua `legacy_v1_ref`.
- Sửa 27 `content_contract` đã `published`.
- Đổi mô hình tiết học. Trục giáo án thuộc [`lesson-corpus-depth.md`](../specs/05-content/lesson-corpus-depth.md).
- Bật `engine-depth` lên bậc 2 hoặc 3 — 600 level nhiều khả năng đủ, nhưng bật là quyết định của người quyết, làm ở task đóng chương trình.

## 5. Commands

Đặt lại đường dẫn Node trước mọi lệnh — `node` trên PATH là v20 và v24.14.1 hỏng:

```bash
export PATH=/Users/macbook/.nvm/versions/node/v24.15.0/bin:$PATH
```

| Việc | Lệnh |
|---|---|
| Dựng khuôn mới | `pnpm --filter @mindkid/game-engine new:template GT-028 'Chạm đếm tích luỹ' tap-count` |
| Sinh lại điểm nối | `pnpm --filter @mindkid/game-engine gen:templates` |
| Sinh lại danh mục phiếu engine | `pnpm --filter @mindkid/game-engine gen:engine-index` |
| Đối chiếu phiếu engine với registry | `pnpm --filter @mindkid/game-engine check:engine-specs` |
| Đối chiếu render | `pnpm --filter @mindkid/game-engine check:render` |
| Test engine | `pnpm --filter @mindkid/game-engine test` |
| Sinh level cho một engine | `pnpm --filter @mindkid/db gen:levels --engine=GT-028 --theme=ocean --band=4-5 --count=6 --seed=168` |
| Cổng chiều sâu | `pnpm --filter @mindkid/db check:engine-depth` |
| Cổng chủ đề | `pnpm --filter @mindkid/db check:theme-registry` |
| Cổng seed | `pnpm --filter @mindkid/db seed:check` |
| Báo cáo seed | `pnpm --filter @mindkid/db seed:report` |
| Cổng kiểu | `pnpm typecheck:gate` |
| Lint | `pnpm lint` — cấm — NEVER dùng `ultracite check`, nó thoát 0 dù có lỗi |
| Cổng đầy đủ | `pnpm check` |

Tái dựng số đo v1 (chạy trong `tinimath/packages/db`):

```bash
npx --no-install tsx -e 'import("./src/seed-levels/registry.js").then(m=>{let n=0;for(const g of Object.values(m.GAME_TYPE_REGISTRY))n+=g().length;console.log(Object.keys(m.GAME_TYPE_REGISTRY).length,n)})'
```

## 6. Cấu trúc file

Một khuôn mới chạm đúng bảy chỗ; sáu chỗ đầu viết tay, chỗ thứ bảy do sinh mã:

```
packages/game-engine/src/templates/GT-0nn/template.ts    → contract zod + defineTemplate
packages/game-engine/src/templates/GT-0nn/session.ts     → logic tương tác, dựng trên mechanics/
packages/game-engine/src/templates/GT-0nn/fixtures.ts    → 3 level mẫu, chứng minh contract dùng được
packages/game-engine/src/generators/gt0nn.ts             → bộ sinh, khai axes {age_band, what, theme}
packages/game-engine/tests/gt-0nn-<mechanic>.test.ts     → test phiên engine
docs/specs/01-platform/engines/GT-0nn.md                 → phiếu engine 10 mục
packages/game-engine/src/generated/**                    → sinh mã. Cấm — NEVER sửa tay
```

Hệ thống mới, chỉ khi nguyên thuỷ sẵn có không đủ:

```
packages/game-engine/src/systems/<tên>-system.ts
packages/game-engine/tests/<tên>-system.test.ts
```

## 7. Code style

Khuôn theo đúng hình dạng `GT-001`: schema zod khai trước, `defineTemplate` ở `export default`,
tài sản tham chiếu bằng mã `EMJ-<slug>` chứ cấm — NEVER glyph thô.

```ts
export const GT028ContentSchema = z.object({
  ...promptFields(),
  step: z.number().int().min(2).max(5),
  items: z.array(z.object({
    item_id: z.string(),
    asset: assetSchema(),
    order_index: z.number().int().min(0),
  })).min(4).max(20),
});

export default defineTemplate({
  code: "GT-028",
  name: "Chạm đếm tích luỹ",
  mechanic: "tap-count",
  layouts: ["grid", "flex-wrap"],
  content_contract: GT028ContentSchema,
  difficulty_contract: GT028DifficultySchema,
  limits: { item_count: [4, 20], distractor_count: [0, 4], target_count: [1, 20] },
  age_min: 4,
  age_max: 6,
  banned_age_bands: ["3-4"],
  requires_tap_fallback: false,
  asset_kinds: ["emoji", "audio"],
  scoring: STANDARD_SCORING,
  events: ["game_started", "item_tapped", "count_submitted", "game_completed"],
  engine_session: "GT028Session",
  status: "draft",
  version: 1,
});
```

Bộ sinh khai trục trước, sinh sau, và cấm — NEVER đọc `is_correct` để dựng gợi ý:

```ts
export const GT028Generator: LevelGenerator = {
  engine: "GT-028",
  axes: {
    age_band: ["4-5", "5-6"],
    what: ["count", "number-sense"],
    theme: ["school", "farm", "home", "nature", "food", "ocean", "animal", "vehicle"],
  },
  generate({ rng, age_band, vocabulary }) { /* … */ },
};
```

## 8. Testing strategy

| Mức | Ở đâu | Ràng buộc |
|---|---|---|
| Contract | `tests/contract.test.ts` · `tests/template-compliance.test.ts` | Mọi khuôn chạy cùng bộ kiểm, dev cấm — NEVER viết lại |
| Phiên engine | `tests/gt-0nn-<mechanic>.test.ts` | ≥12 ca cho khuôn mới; có ca trẻ hành động **trước** phản hồi hệ thống |
| Hệ thống | `tests/<tên>-system.test.ts` | Dựng được độc lập, không cần `GameEngine` |
| Bộ sinh | `tests/generators.test.ts` | Mỗi trục khai phải sinh ra được ít nhất một level qua `content_contract` |
| Bố cục | `tests/layout-safe-area.test.ts` | Vùng an toàn, cấm — NEVER thêm dòng nợ mới vào `layout-safe-area-debt.json` |
| Cổng chiều sâu | `pnpm --filter @mindkid/db check:engine-depth` | Chạy trên corpus seed, thoát khác 0 khi thủng |

**Mọi cổng mới phải có ca âm.** Cổng không có ca chứng minh nó đỏ được là cổng xanh giả — năm dạng
đã ghi lại, và `ultracite check` là ví dụ sống.

## 9. Success criteria

| # | Điều kiện | Đo bằng |
|---|---|---|
| 1 | `GameMechanic` khớp đúng registry, 0 giá trị mồ côi hai chiều | `pnpm --filter @mindkid/game-engine test`, ≥2 ca âm |
| 2 | `mechanic` của mọi template được ép bằng kiểu, cấm chuỗi tự do | `pnpm typecheck:gate` |
| 3 | Registry 60 game type v1 là song ánh với bảng migration, có property test | `pnpm --filter @mindkid/shared test` |
| 4 | `legacy_v1_ref` chỉ nhận mã thuộc 60 giá trị đó | cổng seed, ≥1 ca âm |
| 5 | Bộ sinh phủ **27/27** engine trước lộ trình C, **36/36** khi đóng | `ALL_LEVEL_GENERATORS` |
| 6 | Mỗi bộ sinh khai ≥8 chủ đề; ≥12/14 chủ đề có ít nhất một bộ sinh dùng | `tests/generators.test.ts` |
| 7 | **60/60 game type v1 có ≥10 level `published` mang `legacy_v1_ref`** | cổng phủ v1, `seed:report` |
| 8 | **≥600 level mang `legacy_v1_ref`**, mọi level qua `content_contract` | `seed:check` Cổng 1 |
| 9 | `theme-caps.json` vẫn xanh sau khi đổ 600 level; `stepwise_caps.school` đã hạ theo | `check:theme-registry` |
| 10 | 36 template, 36 phiếu engine, 36 bộ sinh, mồ côi 0 | `check:engine-specs` + `gen:engine-index` |
| 11 | `check:engine-depth` xanh; bậc cuối cùng do người quyết chốt | `check:engine-depth` |
| 12 | `pnpm check` xanh | — |
| 13 | 0 tham chiếu tới `tinimath/` trong mã v2 | grep |

## 10. Boundaries

**Always**

- Chạy `gen:templates` sau mọi thay đổi khuôn và commit đầu ra sinh mã trong cùng PR.
- Viết ca âm cho mọi cổng mới trước khi tin cổng đó.
- Tham chiếu emoji bằng `EMJ-<slug>`.
- Một PR một engine.

**Ask first**

- Bật `engine-depth` lên bậc 2 hoặc 3 — quyết định ngân sách biên soạn.
- Thêm giá trị vào từ vựng trục `theme` hoặc `thinking`.
- Thêm `LayoutId` mới — mỗi mã mới cần một hàm hình học riêng trong `geometry.ts`.
- Thêm hệ thống mới dưới `systems/` khi nguyên thuỷ sẵn có gần đủ.

**Never**

- Cấm — NEVER copy file từ `tinimath/` sang `mindkid/`.
- Cấm — NEVER nhập level hay `config_params` của v1 vào seed v2.
- Cấm — NEVER sửa `content_contract` của khuôn đã `published`.
- Cấm — NEVER sửa tay bất kỳ file nào dưới `src/generated/`.
- Cấm — NEVER nới sàn `engine-depth` để cổng xanh.
- Cấm — NEVER dùng `ultracite check` làm cổng.
- Cấm — NEVER đặt `status: published` cho khuôn mới trong PR dựng khuôn.

## 11. Open questions

| # | Câu hỏi | Chặn gì | Chủ |
|---|---|---|---|
| 1 | `free-create` (`GT-036`) không có đáp án đúng. `ScoringSchema` đang giả định `pass_threshold` trên thang 100 — chấm thế nào cho một sản phẩm sáng tạo? | `GT-036` | người quyết |
| 2 | `beat-sequence` (`GT-034`) cần phát chuỗi âm có nhịp. v2 mới có `audio-controller` và `speech-synthesis-adapter`, chưa có bộ phát mẫu nhịp. Dựng mới hay hoãn? | `GT-034` | Dev + người quyết |
| 3 | `pour-quantity` (`GT-032`) là đại lượng liên tục, mọi khuôn hiện có đều rời rạc. Lượng tử hoá thành mức, hay mở kiểu mới? | `GT-032` | Dev |
| 4 | Bật `engine-depth` bậc 1 cần thêm ~+90 level. Sinh bằng bộ sinh hay soạn tay? Bộ sinh rẻ nhưng đơn điệu | A3 | người quyết |
| 5 | ~~9 chủ đề chưa dùng có đủ vốn từ không?~~ **Đã đo 2026-08-31: cả 14 chủ đề đều có đúng 10 danh từ.** Không có rào vốn từ; rào là 19 bộ sinh tự giới hạn `axes.theme` ở 5 giá trị | — | đã đóng |
