# 162 — Đưa toàn bộ nội dung seed về đúng contract engine

## Bối cảnh đo được (2026-08-30)

Trang `/games` của end-user hiển thị đúng 9 trò chơi. Truy nguyên cho ba lỗ
độc lập, cả ba đều đã đo:

1. `apps/web/app/pages/games/index.vue` **không gọi API nào**. Mảng
   `allLevels` là hằng số: 6 phần tử `FEATURED_GUEST_LEVELS`
   (`packages/shared/src/public-seo.ts:470`) cộng 3 object viết thẳng trong
   file. API thật `GET /api/guest/levels` (→ `searchGameLevels`) có sẵn,
   chạy được, chưa ai gọi.
2. `pnpm db:seed` **chỉ seed master data**. Nội dung thật (level, activity,
   lesson) nằm ở lệnh khác `pnpm db:seed:content`, không được `db:seed` gọi.
3. `pnpm db:seed:content` **chạy là chết**. 175 trên 560 hạt giống trượt Cổng 1
   (`content_contract` / `difficulty_contract` của engine). Cả lô nằm trong
   một transaction nên hạt đầu tiên trượt là rollback toàn bộ.

Trạng thái DB trước khi sửa: 225 `game_levels` (190 published) — toàn bộ mang
tiền tố `GL-C1`, 36 tiêu đề khác nhau trên 190 dòng, 160/190 dùng một template
GT-001. `content_seed_batches` chỉ có 2 dòng, cả hai là `TEST-P31-*`. Tức là
lô seed nội dung **chưa từng chạy thành công lần nào**; dữ liệu đang có là rác
còn lại từ test.

Nguồn seed thực tế có: **236 level** (C1:66 · C2:40 · C3:33 · C4:36 · C5:25 ·
C6:36), **243 activity**, **81 lesson** = 560 hạt, 0 mã trùng, phủ đủ 27 template.

## Nguyên nhân gốc của 175 hạt trượt

Bộ seed được viết theo một thế hệ template **đặt tên theo chủ đề**
(GT-001 = đếm, GT-002 = phân loại vào giỏ, GT-003 = so sánh nhiều/ít,
GT-004 = quy luật, GT-005 = vị trí trên lưới, GT-006 = nhìn chớp).
`packages/game-engine` sau đó thay bằng thế hệ **đặt tên theo cơ chế**
(GT-001 = tap-select, GT-002 = tap-select-multi, GT-003 = drag-to-container,
GT-004 = sort-groups, GT-005 = pair-match, GT-006 = sequence-order).
Nội dung giữ nguyên khuôn cũ, contract đổi, không ai bắc cầu.

Contract engine là bên có thẩm quyền: nó là thứ `TemplateGameSession` parse
lúc render. Một `content_pack` không parse được thì level không chơi được —
đẩy nó vào DB là xuất bản một trò chơi hỏng.

## Quyết định — ánh xạ theo cơ chế, không theo số hiệu

Mỗi hạt giống được chuyển sang template mà **cơ chế chơi** của nó thuộc về,
rồi điền đủ trường contract. Bảng dưới là toàn bộ, đếm theo hạt:

| # | Khuôn cũ (template khai · khoá content_pack) | Cơ chế thật | Template đích | Ghi chú chuyển |
|---|---|---|---|---|
| 25 | GT-002 · `containers,drag_items` | chọn mọi vật hợp tiêu chí | **GT-002** | `target_criterion` ← nhãn/màu container; `items[].is_correct` ← so màu |
| 22 | GT-001 · `items,target_count` | đếm rồi lấy đúng N vật | **GT-003** | `container.target_count` ← `target_count`; `items` ← `items` |
| 21 | GT-003 · `left_group,right_group,target` | so sánh hai bên | **GT-014** | `left_pan`/`right_pan` ← hai nhóm, `goal` ← `pick_heavier`/`pick_lighter` |
| 19 | GT-004 · `sequence,options,correct_option` | chọn ô tiếp theo của dãy | **GT-011** | `matrix` ← dãy 1×N, ô cuối rỗng; `options[].is_correct` |
| 18 | GT-005 · `grid,target_id` | tìm vật trong khung cảnh | **GT-022** | `scene_objects` ← ô lưới; `is_target` ← `target_id` |
| 15 | GT-006 · `flash_items,options,correct_answer` | nhìn chớp đếm nhanh | **GT-012** | `options[].value`; `arrangement` mặc định `dice` |
| 6 | GT-003 · `source_items,target_container` | kéo đúng N vào giỏ | **GT-003** | đổi tên trường |
| 6 | GT-005 · `pairs,scaffolding` | ghép cặp | **GT-005** | đổi tên khoá trong `pairs[]` |
| 6 | GT-007 · đủ trường | tách gộp số | **GT-007** | chỉ thiếu `hint_after_ms`, `allow_retry` |
| 6 | GT-008 · đủ trường | kéo vào ô chứa | **GT-008** | chỉ thiếu `hint_after_ms`, `allow_retry` |
| 4 | GT-006 · `correct_order,items` | sắp thứ tự | **GT-006** | `sequence` ← `items` + `correct_order` |
| 4 | GT-001 · `missing_index,options,sequence,target` | tìm ô còn thiếu | **GT-011** | như nhóm 19 |
| 3 | GT-001 · `options,scaffolding,target_item` | chọn một | **GT-001** | đổi tên khoá trong `options[]`/`target_item` |
| 2 | GT-001 · `options,scaffolding,target` | chọn một | **GT-001** | `target` → `target_item` |
| 2 | GT-001 · `items,options,target_count` | đếm rồi chọn số | **GT-012** | `flash_items` ← `items`, không chớp thì `flash_ms` tối đa |
| 2 | GT-001 · `clock_display,options,target` | xem giờ | **GT-016** | `target_time` ← `target` |
| 2 | GT-001 · `options,scaffolding` | chọn một | **GT-001** | thêm `target_item` từ phương án đúng |
| 2 | GT-002 · `pairs,scaffolding` | tương ứng 1-1 | **GT-005** | như nhóm 6 |
| 2 | GT-004 · `bins,items,scaffolding` | phân nhóm | **GT-004** | `groups` ← `bins` |
| 2 | GT-006 · `next_item,pattern_type,sequence` | quy luật tiếp theo | **GT-011** | như nhóm 19 |
| 5 | GT-011/012/015/016/018 · lệch nhẹ | giữ nguyên | giữ nguyên | vá từng trường thiếu |

Hai luật áp cho mọi nhóm:

- `prompt` lấy từ `header.instruction`, cắt còn ≤ 80 ký tự (contract yêu cầu
  4..80). Không bịa câu mới.
- Mọi `asset` chuyển sang `{ kind: "emoji", ref: "EMJ-<slug>" }`. Glyph thô
  tra ngược qua `unicode` của `ALL_EMOJIS`. Glyph không có trong registry
  được liệt kê ra, không im lặng bỏ qua — `BR-CTR-08` và bậc thang ở
  `packages/db/tests/gates/emoji-ref-debt.test.ts`.
- `scaffolding` không có chỗ trong contract nào; nó là ghi chú sư phạm, được
  bỏ khỏi `content_pack` (đã chép sang bảng ghi chú của task này nếu cần).

## Cách sửa: codemod, không sửa tay

Nội dung nằm inline trong ~25 file TS. Theo AGENTS.md (>500 dòng thì viết
codemod), script nạp **giá trị runtime** của từng mảng đã export, biến đổi,
rồi phát lại nguyên file. Không regex trên nguồn. Bình luận trong file bị mất
— chấp nhận, đổi lại là 0 khả năng ghép sai cặp.

Nghiệm thu của bước này: `runEightGates` trên `ALL_SEED_CONTENT` trả về
**0 hạt trượt**, và `pnpm db:seed:content --dry-run` chạy hết 560 hạt.

## Phạm vi còn lại sau khi nội dung xanh

1. `pnpm db:seed` gọi luôn seed nội dung — một lệnh seed hết dự án.
2. `apps/web/app/pages/games/index.vue` bỏ mảng cứng, gọi
   `GET /api/guest/levels`; phân trang đổi từ offset `page` sang `next_cursor`
   cho khớp API; bỏ chữ "120+" viết cứng, đếm từ dữ liệu.
3. `searchGameLevels` chưa trả `competency` và `age_band` mà thẻ trò chơi cần
   — bổ sung vào `formatSearchItem`.
4. `apps/web/app/pages/play/*.vue` chưa có lời gọi dữ liệu nào; nối vào
   `GET /api/guest/levels/[code]/config`.
5. Dọn 225 dòng rác `game_levels` từ hai lô `TEST-P31-*`.

## Kết quả đo sau khi làm (2026-08-30)

| Đo | Trước | Sau |
|---|---|---|
| Hạt trượt Cổng 1 | 175/560 | **73** (đều nằm trong `quarantine.ts`) |
| Level gieo được | 0 (cả lô rollback) | **166**, phủ đủ C1–C6 |
| Engine có nội dung hợp lệ | 19/27 | **27/27** |
| `game_levels` published trong DB | 190 (toàn C1, rác test) | **166** (C1:52 C2:27 C3:24 C4:23 C5:13 C6:27) |
| Glyph thô trong `ref` | 57 level · 77 glyph | **0 · 0** |
| Tag `mechanic` trong DB | 6 | **26**, suy từ `ALL_TEMPLATES` |
| Kỹ năng trong DB | 142 | **238** (gieo cả kỹ năng trạng thái `chờ`) |
| Mã kỹ năng "ma" trong corpus | 20 (228 hạt trỏ vào) | **0** |
| Thẻ trò chơi trên `/games` | 9 (mảng cứng) | **60/trang, 166 tổng** (SSR, từ API) |

### Việc đã làm ngoài bảng ánh xạ

- **Từ vựng tag.** `content_tags` chỉ có 14 mã `what` + 12 mã `thinking` trong khi
  cổng 5 công nhận hàng trăm, nên `resolveAndEnsureTags` tự tạo mọi mã lạ với
  trục `what` — 315 tag `thinking` nằm nhầm trục và mọi level publish trượt
  `BR-TAG-02`. Nay `SEED_CONTENT_TAGS` suy từ `TAG_VOCABULARY`; 13 mã nằm ở cả
  hai trục được chốt bằng bảng `AXIS_TIEBREAK` theo cách corpus dùng thật, và
  `mechanic` thắng khi trùng (`matching` vừa là cơ chế vừa là tag tư duy).
- **Kỹ năng trạng thái `chờ`.** `seedTaxonomyMasterData` lọc `status === "seeded"`
  nên 88 kỹ năng có trong `docs/taxonomy/` mà không có dòng nào trong DB. Bỏ bộ
  lọc, giữ nguyên cột `status`.
- **Emoji.** 15 emoji corpus dùng nhưng registry thiếu (🍄 🧊 🛢️ 🚔 🥫 🚘 ⭕ ⛺ 🍾
  🐮 🐭 ⬆️ ⬇️ ⬅️ ➡️ 💎) đã bổ sung; 239 `ref` đổi từ glyph sang mã.
- **`GT-002` mất hết nội dung.** 27 level cũ của nó không level nào parse được;
  sau khi chuyển đi theo cơ chế thật, engine còn 0. Soạn 3 level mới
  (`c3/multi-select-levels.ts`) đúng cơ chế "chọn nhiều đáp án", band 4-5 và 5-6.
- **5 giáo án có hai bước chơi trùng khuôn** sau khi 3 template sai gộp về
  `GT-012`. Đổi bước thứ hai sang hoạt động khác cùng năng lực.
- **Mã workbook Montessori** (`WB01-D1`) từng chỉ nằm trong comment và bị codemod
  xoá; nay là dữ liệu ở `header.montessori_ref`.

### Bậc thang đã hạ

- `GATE_1_LADDER_BASELINES`: 175/162/170 → **73/73/71**.
- `emoji-ref-debt`: 57/77 → **0/0**. Chưa siết `EmojiRef` thành regex vì 27 file
  `templates/GT-0xx/fixtures.ts` còn dùng glyph thô — việc của một task riêng.

### Database test tách khỏi database dev

Bộ integration test ghi thẳng vào `mindkid` (database mà `pnpm dev` phục vụ):
sau một lượt `pnpm test`, `game_levels` có 1.506 dòng trong khi corpus chỉ 166.
Nay `defineWorkspaceTest` trỏ `DATABASE_URL`/`DATABASE_URL_APP` sang
`mindkid_test`, và `globalSetup` dựng database đó, chạy migration rồi TRUNCATE
trước mỗi lượt chạy. Không thêm biến môi trường mới — tên suy từ database hiện
tại cộng hậu tố `_test`, và có chốt chặn từ chối mọi tên không mang hậu tố đó.

Cách ly làm lộ một phép thử vốn xanh nhờ dữ liệu dùng chung:
`taxonomy-browser.test.ts` đo `C1.CNT.01` (kỹ năng fixture không đụng tới) thay
vì `C1.CNT.99` mà nó vừa dựng.

Dọn phần đã lỡ tích tụ: `pnpm db:reset-content -- --yes` rồi `pnpm db:seed`.

## Đợt hai (2026-08-31) — ba việc còn lại đã đóng

### 1. 73 level cách ly — soạn lại, không thêm engine

Bảng soạn lại nằm ở `seed-content/reauthored/authoring.ts` (73 mục) dựng trên
`reauthored/builders.ts`. Ánh xạ theo cơ chế mà engine **thật sự** có:

| Nhóm | Số | Engine đích | Vì sao |
|---|---|---|---|
| so sánh hai vật | 21 | `GT-001` | `GT-001` không render `target_item`, chỉ `prompt` + `options` |
| dãy có thứ tự | 21 | `GT-006`, `GT-008` | `GT-011` là ô vuông Latinh, dãy AB không thoả |
| vị trí trên lưới | 15 | `GT-022` | thêm toạ độ để đủ ≥ 3 vật trong cảnh |
| nhìn chớp rồi chọn tên | 12 | `GT-012`, `GT-004` | `GT-012` chỉ nhận phương án là số |

Ba vòng cân lại vì dồn quá nhiều vào `GT-012` làm `GT-004`/`GT-006` tụt sàn
độ sâu engine, và 17 level lệch band tuổi của engine đích.

Kết quả: `QUARANTINED_LEVEL_CODES` **rỗng**, `GATE_1_LADDER_BASELINES` cả ba
trần về **0** — một level mới không parse được contract làm cổng đỏ ngay.

### 2. `curriculum_items` — thứ tự seed sai, không phải thiếu dữ liệu

`seedCurriculaMasterData` chạy ở bước 9, **trước** khi nội dung vào ở bước 10,
nên danh sách lesson/level mà nó tra cứu luôn rỗng và nó dựng 5 chương trình +
74 tuần với 0 mục. Đảo hai bước trong `seed.ts`, thêm cờ `requireContent` để
seed dừng ngay thay vì gieo lặng lẽ 0 dòng.

Cổng mới `tests/gates/curriculum-items-supply.test.ts` giữ thứ tự này: mọi
chương trình phải có tiết học, và mọi tiết học phải trỏ vào nội dung có thật.

### 3. `EmojiRef` — đã siết thành regex

`EMOJI_REF_PATTERN = /^EMJ-[a-z0-9]+(?:-[a-z0-9]+)*$/` ở
`packages/game-engine/src/contracts/shared-fields.ts`. Trước đó là
`z.string().min(1)`, nhận cả glyph thô `"🍎"` — và `getByCode` chỉ tra theo mã
nên glyph resolve ra `not_found` lúc render: trẻ thấy ô trống, không cổng nào
bắt được.

Dọn trước khi siết: 239 `ref` trong corpus, 243 trong fixture của 27 engine,
50 trong test (gồm 15 ref trên 3 file test của `apps/web`). Thêm 23 emoji còn
thiếu vào registry. `fix-emoji-refs.ts` được bổ sung `SKIP_DIRS` vì quét
`packages/shared` đụng `ELOOP` trên symlink `node_modules` lồng nhau.

Bậc thang `emoji-ref-debt` về 0 nên **đã xoá** cả file cổng lẫn fixture ca âm
của nó — chính nó nói làm vậy khi nợ về 0.

### 4. `globalSetup` dọn 17 lần trên cùng một database test

Phát sinh khi chạy `pnpm test` toàn repo sau ba việc trên: 7 phép thử đỏ trên
5 file, trong khi từng file chạy riêng đều xanh.

`globalSetup` khai trong `defineWorkspaceTest` nên gắn vào **mọi** project
vitest — 17 project, 17 lần `TRUNCATE` cùng một `mindkid_test`. Lần dọn thứ
hai trở đi rơi vào giữa transaction của project đang chạy:

```
PostgresError: deadlock detected
  Process A waits for AccessShareLock on relation activities;
  Process B waits for AccessExclusiveLock on relation content_review_log.
```

Bốn phép thử còn lại đỏ vì hàng của chúng bị xoá giữa chừng
(`Key (user_id)=(3) is not present in table "users"`).

`claimDatabasePreparation()` cho đúng project đầu tiên giành quyền dọn, các
project sau bỏ qua — một lần dọn cho cả lượt chạy, đếm được từ dòng log
`[test-db] đã dọn mindkid_test`. Ca âm ở `global-setup.test.ts`.

### Số đo sau đợt hai

| Đo | Sau đợt một | Sau đợt hai |
|---|---|---|
| Hạt trượt Cổng 1 | 73 | **0** |
| Level cách ly | 73 | **0** |
| `game_levels` published | 166 | **239** (C1:66 C2:40 C3:36 C4:36 C5:25 C6:36) |
| `curriculum_items` | 0 | **222** |
| Kỹ năng trong DB | 238 | **256** |
| Thẻ trên `/games` | 166 | **239** |
| `EmojiRef` | `z.string().min(1)` | regex `EMJ-<slug>` |
| Lần `TRUNCATE` mỗi `pnpm test` | 17 | **1** |

## Việc còn lại

1. **205 dòng rác `game_templates` trong database dev** — tên `Template test`
   / `Template Rollup`, tạo trước 2026-08-30 13:51 khi test còn dùng chung
   database với dev. Không dòng nào có level, phiên chơi, hay bản tóm tắt trỏ
   vào. `db:reset-content` cố ý không đụng bảng master nên chúng còn lại; cần
   một lần xoá có chủ đích. Ảnh hưởng: báo cáo seed đếm 232 template thay vì
   27 engine thật. Không rò ra trang người dùng — catalog join từ
   `game_levels` nên template mồ côi không xuất hiện.
