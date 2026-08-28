# Task #113 — Chiều sâu engine và độ đa dạng dữ liệu seed

> **Loại task:** bổ sung corpus (L) — 4 spec mới cộng 27 phiếu engine, không sửa spec đã approve.
> **Câu hỏi gốc (2026-08-29):** *"Hiện tại trò chơi cần tạo là 120 loại game khác nhau, nhưng
> thực tế thì tôi chỉ thấy có 9 trò chơi... Mỗi game engine phải có spec rõ ràng, có seeder dữ
> liệu đa dạng theo từng độ tuổi, theo loại bài học, loại chủ đề tư duy."*
> **Spec sở hữu liên quan:** [`game-template-contract.md`](../specs/01-platform/game-template-contract.md) ·
> [`content-seed-authoring.md`](../specs/01-platform/content-seed-authoring.md) ·
> [`thinking-coverage-matrix.md`](../specs/08-quality/thinking-coverage-matrix.md) ·
> [`template-authoring-kit.md`](../specs/01-platform/template-authoring-kit.md).

## 1. Trả lời ngắn

Con số 120 trong corpus **chưa bao giờ là 120 loại game**. Nó là sàn MVP của số `game_level`,
khai ở mục 1 của [`content-seed-authoring.md`](../specs/01-platform/content-seed-authoring.md):
*"MVP cần ≥690 learning objective, ≥120 game level, ≥60 lesson"*. Sàn đó **đã đạt** — corpus
seed hôm nay có 228 game level.

Cảm nhận "chỉ thấy 9 trò chơi" cũng đúng, và nó đo được. 27 engine đã tồn tại trong mã nguồn,
nhưng **21 engine dừng đúng ở 3 level** — con số tối thiểu mà bước 4 của mục 4 trong
[`game-template-contract.md`](../specs/01-platform/game-template-contract.md) yêu cầu để
*chứng minh contract dùng được*. Ba level mẫu là bằng chứng kỹ thuật, không phải nội dung sản
phẩm. Sáu engine MVP cộng `GT-007` và `GT-008` gánh 175 trên 228 level, tức **77%**. Người
dùng nhìn thấy đúng phần có nội dung thật.

Vậy vấn đề không nằm ở số engine, cũng không nằm ở sàn 120. Nó nằm ở chỗ **không spec nào sở
hữu chiều sâu nội dung của một engine**, nên 21 engine dừng ở mức mẫu mà mọi cổng vẫn xanh.

## 2. Bằng chứng đã đo (2026-08-29)

Đo bằng cách nạp thẳng registry engine và corpus seed, không suy đoán. Lệnh tái dựng ghi ở
mục 2.5.

### 2.1 Trục cơ chế — 27 engine, đủ spec lô, thiếu spec riêng

| Lô | Mã | Spec sở hữu danh mục | Trạng thái spec |
|---|---|---|---|
| MVP | `GT-001`…`GT-006` | [`game-template-contract.md`](../specs/01-platform/game-template-contract.md) mục 7.2 | `implemented` |
| Montessori | `GT-007`…`GT-017` | [`montessori-template-batch.md`](../specs/01-platform/montessori-template-batch.md) | `approved` |
| Kế thừa v1 | `GT-018`…`GT-024` | [`legacy-v1-template-batch.md`](../specs/01-platform/legacy-v1-template-batch.md) | `implemented` |
| Khoảng trống taxonomy | `GT-025`…`GT-027` | [`taxonomy-gap-batch.md`](../specs/01-platform/taxonomy-gap-batch.md) | `approved` |

Cả 27 engine có mã, có `content_contract`, có Session class, có test. Nhưng spec của một
engine hôm nay là **một hàng trong bảng của spec lô**. Muốn biết `GT-014` nhận nội dung hình
dạng gì, phải mở `packages/game-engine/src/templates/GT-014/template.ts` đọc Zod schema. Đó
là mã nguồn làm nhiệm vụ của spec.

### 2.2 Trục nội dung — 228 level, phân bố lệch nặng

| Nhóm engine | Số engine | Level | Tỉ lệ |
|---|---:|---:|---:|
| Sáu engine MVP (`GT-001`…`GT-006`) | 6 | 157 | 69% |
| `GT-007`, `GT-008` | 2 | 12 | 5% |
| Còn lại (`GT-009`…`GT-027`) | 19 | 59 | 26% |
| **Tổng** | **27** | **228** | **100%** |

Trong 19 engine cuối, **17 engine có đúng 3 level**, hai engine có 4.

### 2.3 Độ đa dạng bên trong một engine

Bảng dưới đọc là: engine này có bao nhiêu level, và chúng trải trên bao nhiêu giá trị khác
nhau ở mỗi trục. Cột `Band` tối đa 3 (3-4, 4-5, 5-6). Cột `Tư duy` tối đa 12. Cột `Năng lực`
tối đa 6.

| Engine | Level | Band | Tư duy | Năng lực | Chủ đề | Tier | Độ khó |
|---|---:|---:|---:|---:|---:|---:|---:|
| `GT-001` | 37 | 3 | 8 | 6 | 9 | 4 | 4 |
| `GT-002` | 27 | 3 | 7 | 6 | 5 | 4 | 4 |
| `GT-003` | 27 | 3 | 6 | 6 | 8 | 4 | 4 |
| `GT-005` | 24 | 3 | 5 | 6 | 5 | 4 | 4 |
| `GT-004` | 21 | 3 | 4 | 6 | 5 | 3 | 3 |
| `GT-006` | 21 | 3 | 7 | 6 | 7 | 4 | 4 |
| `GT-007` | 6 | 3 | 2 | 1 | 1 | 3 | 3 |
| `GT-008` | 6 | 3 | 4 | 1 | 4 | 3 | 3 |
| `GT-012` | 4 | 3 | 2 | 2 | 3 | 3 | 3 |
| `GT-025` | 4 | 3 | 2 | 2 | 4 | 4 | 3 |
| 17 engine còn lại | 3 mỗi cái | 1–3 | 1–2 | 1 | 1–3 | 2–3 | 2–3 |

Đọc hàng cuối cho đúng: một engine có 3 level, cả ba cùng **một** competency, một hoặc hai
giá trị tư duy, và ở `GT-014` `GT-016` `GT-017` `GT-027` thì cả ba cùng **một** band tuổi. Trẻ
4 tuổi mở `GT-014` ra không có gì để chơi.

### 2.4 Bốn trục dữ liệu toàn corpus

| Trục | Phân bố |
|---|---|
| Band tuổi | `4-5`=83 · `3-4`=74 · `5-6`=71 — cân |
| Tier | `premium`=72 · `standard`=69 · `login`=64 · `free`=23 |
| Năng lực | C1=66 · C2=39 · C4=35 · C6=35 · C3=30 · C5=23 — tỉ lệ cao nhất trên thấp nhất 2,87 |
| Tư duy | `observe`=62 · `match`=42 · `count`=35 · `compare`=34 · `sequence`=28 · `infer`=26 · `sort`=17 · `recall`=17 · `inhibit`=13 · `predict`=4 · `plan`=3 · `shift`=3 |
| Chủ đề | `school`=84 (37%) · `farm`=42 · `home`=33 · 12 giá trị còn lại chia nhau 69 |
| Skill phủ | 45 trên 230 skill đã đặt tên trong [`index.md`](../taxonomy/index.md) — **19,6%** |

Hai chỗ hỏng thấy ngay. Thứ nhất, `predict` `plan` `shift` đều dưới sàn 5 mà
[`thinking-coverage-matrix.md`](../specs/08-quality/thinking-coverage-matrix.md) mục 7.3 đặt
cho phase P4 — đúng như spec đó đã ghi. Thứ hai, 37% catalog mang chủ đề `school`; một đứa
trẻ chơi liên tiếp mười màn sẽ thấy chín màn cùng bối cảnh lớp học.

### 2.5 Cách tái dựng số đo

```bash
# 27 engine kèm contract, band tuổi, limits
node --run-as tsx packages/game-engine/probe4.ts   # xem mục 6 bước 0
# 228 level kèm phân bố theo template, band, tư duy, chủ đề
pnpm --filter @mindkid/db seed:report
pnpm --filter @mindkid/db report:tags
```

Cảnh báo: `node` trên PATH là v20 và làm `tsx` dừng với mã 139. Dùng
`~/.nvm/versions/node/v24.15.0/bin` như ghi ở [`108-quality-gate-convergence-plan.md`](108-quality-gate-convergence-plan.md).

### 2.6 Vì sao mọi cổng vẫn xanh

Đây là phần đáng lo nhất, và nó không phải lỗi thi công.

| Cổng | Đo gì | Vì sao 3 level một engine vẫn qua |
|---|---|---|
| Tám cổng seed ([`content-seed-authoring.md`](../specs/01-platform/content-seed-authoring.md)) | Tính hợp lệ của **từng** hàng | Cổng theo hàng. Số hàng của một engine không phải đầu vào của nó |
| Ma trận phủ tư duy ([`thinking-coverage-matrix.md`](../specs/08-quality/thinking-coverage-matrix.md)) | `competency × band tuổi`, và trục `thinking` toàn catalog | Ô nào cũng đạt sàn 6 nhờ sáu engine MVP. Engine thứ 27 đóng góp 0 vào ô nào cũng không làm ô nào thủng |
| `BR-TCM-05` (mỗi ô ≥2 mechanic) | Số mechanic khác nhau **mỗi ô** | Sàn là 2. Sáu engine MVP đã vượt. Engine 7–27 dư ra |
| Test tuân thủ engine | Contract round-trip trên level đã seed | 3 level đủ để round-trip xanh |

Không cổng nào hỏng. Chúng đo đúng thứ chúng được giao đo. Thứ **không ai được giao đo** là
chiều sâu nội dung của một engine — và đó chính là thứ người dùng nhìn thấy.

### 2.7 Bốn mươi hai level đang gắn band tuổi ngoài band của engine

Phát hiện lúc đo, không phải thứ đi tìm. Đối chiếu `age_min`/`age_max` của từng level với
`age_min`/`age_max` của engine nó dùng: **42 trên 228 level (18%) nằm ngoài band của engine**.

| Engine | Band engine | Level vi phạm | Band level |
|---|---|---:|---|
| `GT-006` sắp xếp thứ tự | 5–6 | 15 | 13 level ở `4-5`, 2 level ở `3-4` |
| `GT-002` chọn nhiều đáp án | 4–6 | 13 | tất cả ở `3-4` |
| `GT-004` phân loại vào nhóm | 4–6 | 4 | tất cả ở `3-4` |
| `GT-025` tìm điểm khác biệt | 4–6 | 2 | `3-4` |
| `GT-024` vẽ theo nét | 5–6 | 2 | `3-4` và `4-5` |
| `GT-011` · `GT-015` · `GT-018` · `GT-023` | 4–6 hoặc 5–6 | 4 | dưới band |

Đây là vi phạm `BR-GTC-05` (band tuổi của template được ép). Mục 9 của
[`game-template-contract.md`](../specs/01-platform/game-template-contract.md) có sẵn kịch bản
nghiệm thu cho nó: *manager tạo level `GT-006` với `age_min` = 3 thì hệ thống trả 422*. Kịch
bản đó nói về route studio. Đường seeder **không đi qua route đó**, và không cổng nào trong
tám cổng của [`content-seed-authoring.md`](../specs/01-platform/content-seed-authoring.md) đối
chiếu band level với band engine.

Hệ quả sư phạm cụ thể: `GT-002` bị cấm ở band `3-4` vì chọn nhiều đáp án đòi giữ nhiều điều
kiện trong trí nhớ làm việc; corpus đang có 13 màn `GT-002` gắn cho đúng lứa đó. `GT-006` bị
cấm ở cả `3-4` và `4-5` vì cần biểu diễn quan hệ thứ tự; corpus có 15 màn.

Đây là dạng cổng xanh giả thứ sáu: **rule có thật, có kịch bản nghiệm thu, nhưng chỉ được ép
trên một trong hai đường ghi**. Sửa rẻ — cổng chiều sâu ở
[`engine-content-depth.md`](../specs/05-content/engine-content-depth.md) đã đọc sẵn cả hai
nguồn, nên `BR-ECD-13` gắn phép đối chiếu vào đó.

### 2.8 Cổng 1 và cổng 5 của bộ seed đang xanh giả

Phát hiện khi đồng bộ corpus, và nó lớn hơn mọi thứ ở trên.

Mục 7.3 của [`content-seed-authoring.md`](../specs/01-platform/content-seed-authoring.md) khai
cổng 1 là *"`content_pack` parse được bằng `content_contract` thật (Zod, còn đủ `refine`)"* và
cổng 5 là *"khớp band tuổi · mechanic hợp band (`BR-GTC-05`)"*. Chạy bộ cổng thật rồi chạy lại
đúng phép kiểm mà spec mô tả:

| Phép kiểm | Bộ cổng báo | Phép kiểm thật |
|---|---|---|
| 552 hàng seed qua 8 cổng | **552 đạt, 0 trượt** | — |
| `content_pack` parse bằng `content_contract` | không kiểm | **162 / 228 trượt** |
| `difficulty_params` parse bằng `difficulty_contract` | không kiểm | **170 / 228 trượt** |
| Band level nằm trong band engine | không kiểm | **42 / 228 trượt** |

Nguyên nhân đọc được trong mã nguồn, không suy đoán:

- `checkGameLevelGate1` chỉ kiểm `typeof content_pack === "object"`. Nó không nạp
  `content_contract` của template.
- `checkGate5` mang tên `"Tagging"` chứ không phải `"Sư phạm"`; nó kiểm tag, không kiểm FK
  skill, khoảng `difficulty`, hay `BR-GTC-05`.
- `isValidTagForAxis` kết thúc bằng `return SLUG_REGEX.test(tag)` — nhánh dự phòng mà
  `BR-TCM-01` cấm vẫn còn nguyên.

Lý do trượt tập trung ở một chỗ: **sáu engine MVP trượt 100%** vì `content_pack` của chúng
thiếu trường `prompt` mà `promptFields()` khai bắt buộc, và hình dạng bên trong cũng khác
contract. Ba lý do hay gặp nhất: `prompt` thiếu (157 lượt), `items` thiếu (73), `target_item`
thiếu (34). Bên `difficulty_params`: `hint_after_ms` thiếu (169), `allow_retry` thiếu (169).

Hệ quả không nằm ở cổng mà nằm ở bề mặt chơi: `BR-GTC-02` (parse ở server trước khi ghi) làm
những level đó trả `CONTENT_PACK_INVALID` khi engine nạp. **157 trên 228 level thuộc sáu
engine mà trẻ gặp nhiều nhất đang ở trạng thái đó.** Đây là lời giải thích đầy đủ hơn cho câu
"chỉ thấy 9 trò chơi" ở mục 1: không chỉ 21 engine thiếu nội dung, mà phần nội dung dày nhất
lại là phần engine không nạp được.

### 2.9 Ba từ vựng tag chạy song song

Đo cùng ngày, ba nguồn khai từ vựng độc lập và chúng lệch nhau:

| Trục | Nguồn 1 — mục 7.1 và 7.2 của [`content-tagging.md`](../specs/01-platform/content-tagging.md) | Nguồn 2 — `seed-master/content-tags.ts` | Nguồn 3 — cổng `thinking-coverage.ts` | Corpus |
|---|---|---|---|---|
| `what` | 14: `number` `quantity` `geometry` … | 14: `cnt` `cmp` `ops` `shp` … | **28 — hợp cả hai** | 79 lượt theo nguồn 1, 160 lượt theo nguồn 2 |
| `thinking` | 12: `observe` `compare` `sort` … | 12: `visual` `auditory` `spatial` … | **12 — chỉ nguồn 1** | 284 / 284 lượt theo nguồn 1 |
| `theme` | 12: `animal` `fruit` `vegetable` … | 12: `farm` `jungle` `ocean` … | **22 — hợp cả hai** | 15 giá trị, 3 giá trị ngoài cả 22 |
| `mechanic` | 27, khớp registry | 6: `drag_drop` `tap_select` … | **27 — khớp registry** | suy từ template |

Nguồn 3 là cổng duy nhất thật sự chạy, và nó xử lý mâu thuẫn theo hai cách khác nhau:

- Trục `thinking`: chọn **một** bộ và bỏ bộ kia. Chú thích trong mã nguồn ghi lý do — 12 giá
  trị viết tắt từng được thêm vào rồi bị gỡ vì đó là *"đúng thứ AGENTS.md cấm: không nới rule
  chỉ để code hiện tại qua được cổng"*. Kết quả: corpus sạch tuyệt đối.
- Trục `what` và `theme`: **hợp cả hai bộ**, kèm chú thích `// DB seed-master abbreviations`.
  Kết quả: cổng xanh trên `what` trong khi corpus dùng lẫn hai bộ.

Chênh lệch giữa 0 và 160 không đến từ người soạn. Nó đến từ hai quyết định khác nhau ở cùng
một file cổng.

Trục `theme` còn thêm một tầng: **cổng đang đỏ**. Ba giá trị `art` (4 level), `household` (2),
`technology` (1) nằm ngoài cả 22, và `thinking-coverage.test.ts` fail với đúng 7 vi phạm
`BR-TCM-01`. Hỏng này có trước Task #113. Có cả lệch dạng số: nguồn 1 viết `vehicle`, nguồn 2
viết `vehicles`, nguồn 3 chứa cả hai.

Đây là câu hỏi 4 ở mục 7 của
[`89-game-engine-scale-out-plan.md`](89-game-engine-scale-out-plan.md), chưa đóng. Số đo mới
làm nó quyết được: mỗi trục đã tự chọn người thắng khác nhau, nên câu trả lời không phải "bộ
nào thắng" mà là "đóng từng trục về nguồn nó đang thật sự dùng".
[`content-theme-registry.md`](../specs/05-content/content-theme-registry.md) mục 7.1a làm việc
đó cho trục `theme`; trục `what` còn mở.

### 2.10 Không engine nào vẽ

Kiểm cuối cùng, và nó chặn mọi thứ khác. Đọc mã nguồn ngày 2026-08-29:

| Mảnh của đường vẽ | Trạng thái |
|---|---|
| `GameEngine.loop()` gọi `activeSession?.render?.(ctx, rs, now)` | Có |
| `start(canvas)` và `renderSystem.setupCanvas(canvas)` | Có |
| Trang chơi gọi đúng chữ ký: `engine.start(canvasRef.value)`, `engine.destroy()` | Có |
| Hình học layout — 21 `LayoutId`, `resolveLayout()` trả `Slot[]` kèm vùng chạm theo band | Có, 34,9 KB `geometry.ts` |
| Bộ vẽ nguyên thuỷ — `drawClayBody` `drawClayContainer` `drawScaffoldingHighlight` `drawParticles` | Có |
| **Session class cài đặt `render()`** | **0 trên 27** |

Ba lỗ hổng runtime ghi ở mục 2.3 của
[`89-game-engine-scale-out-plan.md`](89-game-engine-scale-out-plan.md) đã được sửa hai phần:
vòng lặp gọi hàm vẽ, và trang chơi gọi đúng chữ ký. Phần thứ ba vẫn còn, ở dạng khác: layout
đã cài đặt thật, nhưng **không engine nào dùng nó để vẽ**.

`render` khai `optional` trong `GameSession`, nên mỗi khung hình vòng lặp xoá canvas rồi gọi
một hàm không tồn tại. Không lỗi, không cảnh báo, không cổng nào bắt. Màn hình trống.

Cộng với mục 2.8: kể cả khi engine vẽ được, 162 trên 228 level không nạp được. Hai lỗ hổng đó
nhân nhau, và tích là 0.

### 2.11 `CUSTOM_GAME_TEMPLATE_CODES` có hai bản khác giá trị

| Nguồn | Giá trị | Ai dùng |
|---|---|---|
| `packages/shared/src/custom-game.ts` | 6 — `GT-001`…`GT-006` | đường validate của `POST /api/users/custom-games` |
| `packages/game-engine/src/generated/template-codes.ts` | **27** — `= ALL_TEMPLATE_CODES` | không ai; chỉ re-export ở barrel |
| `apps/web/app/pages/custom-games/create.vue` | 6, viết tay trong `switch` | giao diện |

Hành vi hiện tại đúng `BR-CGB-07` (chỉ 6 template MVP dùng được). Nhưng hai hằng số **cùng
tên** mang hai giá trị ở hai package, và bản 27 nằm trong tệp sinh tự động nên nó tự lớn thêm
mỗi lần thêm engine. Một lần import nhầm package là mở cả 27 khuôn cho người dùng, không lỗi
biên dịch nào. Ghi ở mục 6.1 của
[`custom-game-builder.md`](../specs/07-addon/custom-game-builder.md).

### 2.12 Trục giáo án — 222 buổi cần, 81 tiết có

Chủ dự án nêu ngày 2026-08-29: *"core dự án là game template và giáo án bài giảng"*. Trục thứ
hai đó chưa được đo trong task này. Đo bây giờ:

| Chương trình | Band | Tuần | Buổi/tuần | Tổng buổi |
|---|:--:|---:|:--:|---:|
| `CUR-BE3` | 3–4 | 8 | 3 | 24 |
| `CUR-BE4` | 4–5 | 8 | 3 | 24 |
| `CUR-BE5` | 5–6 | 8 | 3 | 24 |
| `CUR-BE6` | 5–6 | 8 | 3 | 24 |
| `CUR-J42` | 3–6 | 42 | 3 | 126 |
| **Cầu** | | | | **222** |
| **Cung — lesson đã soạn** | | | | **81** |
| **Thiếu** | | | | **141** |

Chương trình 42 tuần một mình đòi 126 buổi, nhiều hơn toàn bộ corpus giáo án. Một phụ huynh
đăng ký `CUR-J42` hôm nay hết nội dung khoảng tuần thứ chín.

**Chuỗi liên kết thì đã nối liền** — và đây là tin tốt, khác hẳn số đo 2026-08-22:

| Số đo | 2026-08-22 | 2026-08-29 |
|---|---:|---:|
| Activity | 81 | **243** |
| Activity `kind: digital_game` | **0** | **162** |
| Bài học có ≥1 bước chơi số (`BR-LTV-01`) | 0 / 81 | **81 / 81** |
| Bài học có 2 bước chơi khác khuôn (`BR-LTV-02`) | — | **81 / 81** |
| Bài học có hoạt động ngoài màn hình (`BR-LSM-02`) | — | **81 / 81** |
| Liên kết activity tới `game_levels` | 0 | **162, 0 mã treo** |

### 2.13 Nhưng 151 trên 162 bước chơi trỏ sai kỹ năng

`BR-LTV-04` (bước chơi phục vụ bài học) đòi game level được trỏ tới có skill thuộc cùm kỹ năng
của bài học. Chỉ **11 trên 162** liên kết thoả. Ba ca đọc được:

| Bài học | Kỹ năng bài học | Trỏ tới | Kỹ năng của level |
|---|---|---|---|
| `LES-0003` | `C1.CNT.02` đếm | `GL-C1-SEQ-PAT-0014` | `C1.NREC.09` nhận diện số |
| `LES-0004` | `C2.POS.01` vị trí | `GL-C2-SHP-CARD-0001` | `C2.GEO.01` hình học |
| `LES-0004` | `C2.POS.01` vị trí | `GL-C2-POS-LOC-0004` | `C2.ORI.07` định hướng |

Activity tự nó gắn tag đúng: `ACT-0205` mang `skill_codes: ["C1.CNT.02"]`, khớp bài học. Lệch
nằm ở bước cuối — activity được nối vào game level nào **đang có sẵn**, không phải level phục
vụ đúng kỹ năng.

Giáo án nói tiết này dạy đếm rồi gửi trẻ vào màn nhận diện chữ số. Chuỗi xanh, mã không treo,
cổng không kêu, nội dung vẫn sai. Cùng họ với mục 2.8: rule có thật, không ai ép.

Hai số phụ: **25 trên 27** engine được giáo án dùng (`GT-007` và `GT-008` không bài học nào
dẫn tới), và **111 trên 228** level có đường vào từ giáo án.

### 2.14a Hai quyết định đổi mô hình cầu, 2026-08-29

Chủ dự án chốt hai điều sau khi đọc số đo ở mục 2.12 và 2.13:

**`D-SI` — giáo án là thư viện master, tuổi là đề xuất.** *"Sẽ tạo bài giảng master, bài giảng
sẽ chỉ là đề xuất. Còn phụ huynh khi mua gói có thể đăng ký flow các bài giảng này chứ không
tính theo tuổi cố định."*

Hệ quả số học, không phải nới ngưỡng:

| | Trước | Sau |
|---|---|---|
| Công thức cầu | Cộng mọi buổi, phân vùng theo band, cấm bù chéo | `max` số tiết trên mọi flow |
| Cầu | 222 buổi | **126 tiết** |
| Thiếu | 141 | **45** |
| Ghi danh khi tuổi ngoài khoảng | **422** (`D-ME`) | Cho ghi danh kèm cảnh báo |

Bỏ phân vùng band xoá 96 tiết khỏi món nợ, vì lesson dùng lại được giữa các flow. Quyết định
`D-ME` bị thay thế; mục 8 của [`curriculum-player.md`](../specs/04-play/curriculum-player.md)
bỏ điều kiện 422 theo tuổi.

**`D-SJ` — soạn thêm level, không nối lại.** Đường thay thế là nối 151 bước chơi sai vào level
đã có; nó chỉ làm được ở 15 kỹ năng đang có ≥2 level. Hai mươi lăm kỹ năng còn lại không có
level đúng để nối vào, và nối bừa chính là nguyên nhân của 151 liên kết sai hiện nay.

Cầu level đo được: thư viện giáo án dùng **40 kỹ năng**; **23 kỹ năng có 0 level**, 2 kỹ năng
có 1, 15 kỹ năng đủ. Mỗi bài học có hai bước chơi khác khuôn nên mỗi kỹ năng cần ≥2 level:
**48 level phải soạn thêm**. Mười ca đầu toàn kỹ năng nền — `C1.CNT.01` `C1.CNT.02`
`C2.POS.01` `C3.PAT.01` `C4.LEN.01`.

### 2.14 Phạm vi go-live: chủ dự án bác phương án rút

Bản trước của [`go-live-readiness.md`](../specs/08-quality/go-live-readiness.md) có quy tắc cho
phép bớt engine khỏi phạm vi khi chưa đạt. Chủ dự án bác ngày 2026-08-29: *"phải hoàn thiện
sản phẩm đầy đủ để go live chứ không giảm bớt gì"*.

`BR-GLR-04` viết lại: phạm vi là **27 engine và 222 buổi**, đường duy nhất khi chưa đạt là
**lùi ngày**. Nhánh go-live một phần xoá khỏi mục 5 của spec đó. Quyết định `D-SH`.

## 3. Ba lỗ hổng spec

| # | Lỗ hổng | Hệ quả đo được |
|---|---|---|
| 1 | Không spec nào sở hữu **sàn nội dung của một engine** | 21 engine dừng ở 3 level, cổng xanh |
| 2 | Không spec nào sở hữu **phiếu spec của một engine** | Spec của `GT-014` là một hàng bảng cộng một file Zod. Người soạn nội dung phải đọc mã nguồn |
| 3 | Không spec nào sở hữu **chi phí soạn level thứ 4 tới thứ 40** của một engine | [`template-authoring-kit.md`](../specs/01-platform/template-authoring-kit.md) hạ chi phí thêm **engine** xuống một file. Chi phí thêm **level** vẫn là viết tay từng `content_pack` |

Lỗ hổng 3 giải thích lỗ hổng 1. Không ai dừng ở 3 level vì lười; họ dừng vì level thứ 4 tốn
đúng bằng level thứ nhất.

Hai lỗ hổng nữa, phát hiện lúc đo, và cả hai **không phải thiếu spec** mà là spec không được
thi công:

4. `BR-GTC-05` (band tuổi của template được ép) chỉ ép trên đường studio — mục 2.7.
5. Cổng 1 và cổng 5 của bộ seed khai đúng phép kiểm nhưng không chạy phép kiểm đó — mục 2.8.
   162 level không nạp được và cổng vẫn in "552 đạt".
6. Không engine nào cài `render()` — mục 2.10. Đây là lỗ hổng đắt nhất, và nó **là** lỗ hổng
   spec: `render` khai `optional`, và không spec nào từng nói một engine phải vẽ gì.
   [`engine-render-contract.md`](../specs/01-platform/engine-render-contract.md) lấp chỗ đó.
7. Không spec nào sở hữu phép trừ giữa số buổi chương trình đòi và số giáo án đã soạn — mục
   2.12. [`lesson-corpus-depth.md`](../specs/05-content/lesson-corpus-depth.md) lấp chỗ đó.

## 4. Assumptions — ghi ra để bác được

Theo cách làm đã chốt ở [`86-goal-alignment-audit.md`](86-goal-alignment-audit.md): viết giả
định thành văn bản, không chốt phạm vi bằng câu hỏi nhiều lựa chọn.

1. **"120 loại game" đọc là mục tiêu số engine, không phải số level.** Sàn 120 level đã đạt
   và không đổi. Con số engine mục tiêu là quyết định sản phẩm — task này không tự đặt, nó
   chỉ làm cho con số đó có đường đi và có giá.
2. **Cấm — NEVER đụng contract của 27 engine đã có.** Đổi `content_contract` của engine đã
   publish là breaking change theo `BR-GTC-08` (đổi contract của template đã publish). Mọi
   thứ dưới đây cộng thêm.
3. **Cấm — NEVER cấp mã `GT` mới trong task này.** Chiều sâu trước, chiều rộng sau. Thêm
   engine thứ 28 khi 27 engine còn ở mức 3 level chỉ làm bảng ở mục 2.2 lệch thêm.
4. **Phiếu engine là spec rút gọn, không phải spec 11 mục.** Tiền lệ đã có: mục 4 của
   [`CONVENTIONS.md`](../specs/CONVENTIONS.md) cho `07-addon/**` dùng dạng rút gọn.
5. **Nguồn đo là corpus seed trong repo**, cùng nguồn mà
   [`thinking-coverage-matrix.md`](../specs/08-quality/thinking-coverage-matrix.md) mục 7.0
   đã chọn, và vì đúng lý do đó: cơ sở dữ liệu dev chứa 1854 hàng rác do test sinh.
6. **Spec mới để `status: draft`.** Người quyết định approve, không phải tác giả.
7. **Sàn mới bật theo bậc thang, không bật một lần.** Bật sàn 12 level mỗi engine ngay hôm
   nay làm đỏ 21 trên 27 engine và cổng đỏ thường trực là cổng bị tắt.

## 5. Tám spec mới cộng 27 phiếu engine

| Spec | Khu vực | Phase | MVP | Sở hữu cái gì mà chưa ai sở hữu |
|---|---|:--:|:--:|---|
| [`engine-render-contract.md`](../specs/01-platform/engine-render-contract.md) | platform | P4 | Không | Hợp đồng vẽ của một engine. `render` khai `optional` và 0 trên 27 engine cài nó |
| [`go-live-readiness.md`](../specs/08-quality/go-live-readiness.md) | quality | P4 | Không | Câu "trẻ mở được chưa". [`mvp-scope.md`](../specs/00-foundation/mvp-scope.md) sở hữu phạm vi, [`release-deploy.md`](../specs/01-platform/release-deploy.md) sở hữu cách deploy, không ai sở hữu câu ở giữa |
| [`lesson-flow-model.md`](../specs/05-content/lesson-flow-model.md) | content | P4 | Không | Thư viện giáo án master và flow ghi danh. Tuổi chuyển từ khoá sang đề xuất (`D-SI`) |
| [`lesson-corpus-depth.md`](../specs/05-content/lesson-corpus-depth.md) | content | P4 | Không | Cầu 222 buổi so với cung 81 lesson. [`curriculum-model.md`](../specs/05-content/curriculum-model.md) sở hữu ràng buộc sư phạm, [`lesson-model.md`](../specs/05-content/lesson-model.md) sở hữu ràng buộc một tiết, không ai sở hữu phép trừ |
| [`engine-spec-sheet.md`](../specs/01-platform/engine-spec-sheet.md) | platform | P4 | Không | Hình dạng phiếu spec của **một** engine, và luật mọi mã `GT` đã đăng ký phải có phiếu |
| [`engine-content-depth.md`](../specs/05-content/engine-content-depth.md) | content | P4 | Không | Sàn số level **mỗi engine** và ma trận đa dạng bên trong một engine |
| [`level-generator-kit.md`](../specs/01-platform/level-generator-kit.md) | platform | P4 | Không | Chi phí soạn level thứ 4 tới thứ 40 của một engine |
| [`content-theme-registry.md`](../specs/05-content/content-theme-registry.md) | content | P4 | Không | Trục `theme` có ba nguồn khai độc lập, giao nhau hai giá trị, không nguồn nào có chủ |

Cộng thêm 27 phiếu ở `docs/specs/01-platform/engines/GT-001.md` … `GT-027.md`, mỗi phiếu
mười một mục, trong đó mục 11 là hợp đồng vẽ riêng của engine đó.

Vì sao tách bốn file chứ không gộp: theo luật một outcome một file ở mục 1 của
[`CONVENTIONS.md`](../specs/CONVENTIONS.md), câu hỏi *"xong chưa"* cho bốn thứ này có bốn câu
trả lời độc lập. Phiếu engine xong không làm sàn nội dung xong. Sàn xong không làm bộ sinh
level xong.

## 6. Thứ tự

| Bước | Việc | Chặn gì | Song song được |
|---|---|---|---|
| 0 | Tái dựng số đo ở mục 2, xác nhận lại trên máy người duyệt | Mọi thứ. Số sai thì sàn sai | Không |
| 0a | Approve [`engine-render-contract.md`](../specs/01-platform/engine-render-contract.md) và cài `render()` cho engine trong phạm vi go-live | **Mọi thứ khác.** Không vẽ thì mọi sàn nội dung đo trên thứ không ai nhìn thấy | Không |
| 0b | Sửa cổng 1 và cổng 5 của bộ seed, rồi xử lý 162 level không parse được | Cùng mức chặn với 0a. Hai cái nhân nhau, tích là 0 | Có, song song 0a |
| 0c | Soạn **48 level** cho kỹ năng thiếu, rồi nối lại 151 bước chơi vào level đúng kỹ năng (`D-SJ`) | Mục 15 và 16 của bảng go-live | Có, song song 0a và 0b |
| 0d | Soạn **45 giáo án** còn thiếu để thư viện đủ 126 tiết | Mục 14 của bảng go-live | Có, song song mọi bước trên |
| 1 | Approve [`engine-spec-sheet.md`](../specs/01-platform/engine-spec-sheet.md) và viết đủ 27 phiếu | Người soạn nội dung không đọc được engine thì không soạn được cho nó | Không |
| 2 | Approve [`content-theme-registry.md`](../specs/05-content/content-theme-registry.md) | Trục `theme` còn mở thì ma trận đa dạng ở bước 3 đo trên từ vựng trôi | Có, song song bước 1 |
| 3 | Approve [`engine-content-depth.md`](../specs/05-content/engine-content-depth.md), bật sàn bậc 1 | Không có sàn thì không ai soạn level thứ 4 | Không, sau bước 1 và 2 |
| 4 | Approve và thi công [`level-generator-kit.md`](../specs/01-platform/level-generator-kit.md) | Sàn bậc 2 trở lên không đạt được bằng tay | Không, sau bước 3 |
| 5 | Soạn nội dung tới sàn bậc 2, engine ưu tiên theo mục 7 của [`engine-content-depth.md`](../specs/05-content/engine-content-depth.md) | Go-live thật | Không |

Bước 0 không phải thủ tục. Số ở mục 2 đo ngày 2026-08-29 trên corpus seed hiện tại; mỗi PR
nội dung làm nó đổi.

## 7. Cái này không thay thế cái gì

Để tránh chồng `owns`:

| Spec đã có | Vẫn sở hữu | Spec mới cấm đụng vào |
|---|---|---|
| [`thinking-coverage-matrix.md`](../specs/08-quality/thinking-coverage-matrix.md) | Ma trận `competency × band tuổi`, sàn trục `thinking` toàn catalog, luật cân bằng competency | Không định nghĩa lại sàn theo competency. Sàn mới đi theo trục **engine** |
| [`content-seed-authoring.md`](../specs/01-platform/content-seed-authoring.md) | Tám cổng theo hàng, đường ghi published, idempotency, provenance | Không thêm cổng theo hàng. Cổng mới là cổng theo **tập hợp** |
| [`game-template-contract.md`](../specs/01-platform/game-template-contract.md) | Hình dạng `GameTemplate`, `content_contract`, `BR-GTC-*` | Phiếu engine **trích** contract, cấm — NEVER chép lại giá trị |
| [`template-authoring-kit.md`](../specs/01-platform/template-authoring-kit.md) | Chi phí thêm một engine | Bộ sinh level chỉ lo `content_pack`, không đụng registry engine |
| [`content-tagging.md`](../specs/01-platform/content-tagging.md) | Từ vựng trục `what`, `thinking`, `mechanic` | Registry chủ đề chỉ đóng trục `theme` — trục thứ tư, chưa ai đóng |

## 8. Câu hỏi còn mở

| # | Câu hỏi | Chặn gì | Chặn phase | Chủ |
|---|---|---|---|---|
| ~~1~~ | ~~Con số engine mục tiêu là bao nhiêu?~~ **Đóng 2026-08-29 (T113, `D-SH`)**: 27 engine hiện có là phạm vi go-live, đầy đủ, không rút. Chủ dự án bác phương án giảm phạm vi. Thêm engine thứ 28 chỉ xét sau khi 27 engine đạt | — | Đã đóng | D-SH |
| 9 | 45 giáo án và 48 level còn thiếu: ai soạn và trong bao lâu? Trùng câu hỏi 2 ở mục 11 của [`lesson-corpus-depth.md`](../specs/05-content/lesson-corpus-depth.md) | Trục giáo án của go-live | P4 | người quyết |
| 2 | Sàn bậc 2 nên là 12 hay 20 level mỗi engine? 12 cho 324 level toàn corpus, 20 cho 540. Cần biết ngân sách biên soạn trước khi chốt | Bước 3 và bước 5 ở mục 6 | P4 | Nội dung |
| 3 | Bộ sinh level sinh `content_pack` bằng tổ hợp có seed hay bằng mô hình ngôn ngữ? Tổ hợp thì tất định và rẻ nhưng lặp; mô hình thì đa dạng nhưng phải qua cổng 4 và cổng 7 của [`content-seed-authoring.md`](../specs/01-platform/content-seed-authoring.md) | Bước 4 ở mục 6 | P4 | Backend |
| 4 | Trần tập trung chủ đề đặt ở mức nào? `school` đang ở 37%. Trần 20% buộc soạn lại hoặc gắn lại tag cho khoảng 40 level đã published, mà bản published thì bất biến theo `BR-CLC-01` | Bước 2 ở mục 6 | P4 | Nội dung |
| 6 | 162 level không parse được `content_pack` — sửa nội dung cho vừa contract, hay đổi contract cho vừa nội dung? Đổi contract là breaking change `BR-GTC-08` và đụng cả 27 engine; sửa nội dung là 162 version mới. Cấm — NEVER chọn đường thứ ba là nới cổng 1 | Bật `BR-CSA-16`, và mọi thứ ở bước 5 mục 6 | P4 | người quyết |
| 7 | Trục `what` đóng về bộ nào? Cổng đang ép trên hợp 28 giá trị, tức hợp thức hoá cả hai. Trùng câu hỏi 3 ở mục 11 của [`content-tagging.md`](../specs/01-platform/content-tagging.md) | `BR-ECD-04` không đo được | P4 | người quyết |
| 8 | Cổng `thinking-coverage` đang đỏ 7 vi phạm ở trục `theme` (`art`, `household`, `technology`). Nhận `art` vào từ vựng rồi gắn lại 3 level, hay gắn lại cả 7? Mục 7.1b của [`content-theme-registry.md`](../specs/05-content/content-theme-registry.md) khuyến nghị đường thứ nhất | `pnpm --filter @mindkid/db test` xanh | P4 | Nội dung |
| 5 | 21 engine đang ở 3 level: nâng lên sàn, hay đánh dấu `deprecated` một phần trong số đó? Giữ một engine không nội dung tốn chi phí bảo trì mà không mang lại màn chơi nào | Bước 5 ở mục 6 | P5 | người quyết |
