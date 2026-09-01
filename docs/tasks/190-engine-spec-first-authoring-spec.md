# Task #190 Spec — Spec-first cho engine mới: 9 phiếu `GT-028`…`GT-036` và luật đặt trước

> **Outcome:** Mọi game engine mới của chương trình [`#168`](168-v1-game-list-integration-plan.md)
> có phiếu spec trong `docs/specs/01-platform/engines/` **trước** khi dựng `template.ts`, và cổng
> `check:engine-specs` phân biệt được **spec đặt trước** với **spec mồ côi**.

---

## 1. Problem Statement

Chương trình `#168` chia 21 task con, trong đó `#181`–`#189` là **9 engine mới** `GT-028`…`GT-036`.
Cả 9 đã có plan và todo từ 2026-08-31. Không task nào có phiếu engine.

Mỗi plan tự khai *"Spec sở hữu: phiếu engine `docs/specs/01-platform/engines/GT-0NN.md` — viết mới
trong task này"*, tức phiếu bị hoãn tới lúc thi công. Đó đúng là cơ chế mà `BR-ESS-07` đã nêu tên:
*"spec viết sau luôn là spec không được viết"*.

**Đo được, 2026-08-31 — viết phiếu sớm làm cổng đỏ.** `BR-ESS-01` có hai khoản: mã thiếu phiếu thì
đỏ, **và** phiếu không có mã trong registry thì đỏ (mồ côi). Khoản thứ hai không phân biệt được hai
tình huống rất khác nhau:

| Tình huống | Ý nghĩa thật | Cổng cũ xử lý |
|---|---|---|
| Xoá engine mà quên xoá phiếu | Rác, phải dọn | Đỏ — đúng |
| Viết phiếu trước khi dựng khuôn | Spec-first, thứ hợp đồng muốn khuyến khích | Đỏ — **sai** |

Bằng chứng: `packages/game-engine/tests/gates/engine-specs.test.ts` khẳng định cứng
`totalTemplates === 27 && totalSpecs === 27 && violations.length === 0`. Thêm một phiếu `GT-028`
làm `pnpm test` đỏ ở ba assertion. Nói cách khác, hợp đồng đang **phạt** đúng hành vi nó đòi hỏi.

---

## 2. Scope & Boundaries

### In Scope

- **9 phiếu engine mới**, đủ 16 mục theo `ENGINE-SPEC-SHEET`:
  `GT-028` `tap-count` · `GT-029` `remove-from-set` · `GT-030` `measure-with-unit` ·
  `GT-031` `coin-compose` · `GT-032` `pour-quantity` · `GT-033` `weave-grid` ·
  `GT-034` `beat-sequence` · `GT-035` `command-sequence` · `GT-036` `free-create`.
- **`BR-ESS-15` (spec đặt trước)** thêm vào [`engine-spec-sheet.md`](../specs/01-platform/engine-spec-sheet.md),
  kèm nhánh mới ở mục 5 và bốn Gherkin scenario ở mục 9.
- **`packages/game-engine/config/engine-spec-planned.json`** — danh sách mã đặt trước, ánh xạ mã tới
  plan sở hữu.
- **Cổng `check:engine-specs`** phân biệt đặt trước với mồ côi, cộng ba ca âm mới.
- **`gen-engine-index.ts`** sinh bảng thứ hai cho engine đặt trước.
- **Sửa nợ phát lộ:** 21 phiếu `GT-007`…`GT-027` ghi sai `batch` trong frontmatter.

### Out of Scope — cấm — NEVER làm trong task này

- Dựng `template.ts`, `session.ts`, `fixtures.ts`, bộ sinh hay level cho 9 engine. Đó là việc của
  `#181`–`#189`.
- Sửa từ vựng `GameMechanic` — việc của [`#169`](169-mechanic-vocabulary-enforcement-plan.md).
- Thêm `LayoutId` mới (`measure-strip`, `weave-grid`) — việc của `#183` và `#186`.
- Nới bất kỳ khoản nào khác của `BR-ESS-01`…`-14`.

---

## 3. Quyết định

| # | Quyết định | Vì sao |
|---|---|---|
| D1 | Nới khoản mồ côi bằng **danh sách khai tường minh**, cấm — NEVER bằng cách bỏ khoản đó | Bỏ khoản mồ côi thì xoá engine mà quên phiếu sẽ lọt. Danh sách giữ nguyên sức chặn, chỉ mở đúng một lối có tên |
| D2 | Mỗi hàng đặt trước phải trỏ tới một **plan có thật**, cổng kiểm sự tồn tại của file | Không có ràng buộc này, danh sách thành sọt rác — đúng lỗi mà `RESERVED_MECHANICS` của `#169` cũng phải chống |
| D3 | Mã có khuôn trong registry mà còn trong danh sách đặt trước là **vi phạm** | Danh sách phải tự rỗng đi theo chương trình. Không có luật này thì nó chỉ phình ra |
| D4 | Cả 9 phiếu vào `engine-spec-ready.json` ngay, không hoãn | Bậc thang chỉ có nghĩa khi đi lên. Viết phiếu đủ 16 mục rồi mà để ngoài bậc thang là tự bỏ cổng |
| D5 | Mục 15 của phiếu đặt trước ghi **giá trị đặt trước** kèm plan làm nguồn | Nó là cam kết với cổng: khuôn dựng lệch thì `BR-ESS-02` đỏ ngay ở PR đó, chứ không phải ghi chú tham khảo |
| D6 | `batch` của 9 phiếu là `legacy-v1` | Chín engine đều port từ game type v1, cùng họ `GT-018`…`GT-024`. Thêm giá trị thứ năm vào từ vựng lô là đổi hợp đồng mà không ai yêu cầu |
| D7 | Phiếu cấm — NEVER nhắc mã năng lực của v1 | `BR-ESS-04` cấm gắn kỹ năng vào engine. Mã năng lực ở lại trong plan; phiếu chỉ mang `legacy_v1_ref` |

---

## 4. Nợ phát lộ khi regenerate index

`gen:engine-index` sinh cột `Lô` từ frontmatter của phiếu. Chạy lại thì **cả 27 phiếu đều ra `mvp`**,
trong khi `index.md` đã commit ghi đúng bốn lô. Nghĩa là frontmatter của 21 phiếu `GT-007`…`GT-027`
bị ghi đè thành `mvp` ở đâu đó, và `index.md` chưa từng được sinh lại kể từ lúc đó — cùng họ với vết
sed hàng loạt đã ghi trong trí nhớ dự án.

Xử lý: khôi phục `batch` thật vào frontmatter (`montessori` cho `GT-007`…`GT-017`, `legacy-v1` cho
`GT-018`…`GT-024`, `taxonomy-gap` cho `GT-025`…`GT-027`), rồi sinh lại. Sau khi khôi phục, 27 hàng
registry của `index.md` **khớp từng byte** với bản HEAD — đó là bằng chứng khôi phục đúng, không phải
đoán.

---

## 5. Acceptance Criteria

| # | Điều kiện | Kiểm bằng | Trạng thái |
|---|---|---|:--:|
| 1 | 9 phiếu tồn tại, đủ 16 mục, không phiếu nào chứa `z.object`, mã kỹ năng, hay ô ma trận ghi chữ | `check:engine-specs` | Đạt |
| 2 | Cổng xanh: 27 mã registry, 36 phiếu, 9 đặt trước, 0 mồ côi | `check:engine-specs` | Đạt |
| 3 | Cả 36 phiếu nằm trong bậc thang `engine-spec-ready.json` | cổng in `36 spec sẵn sàng` | Đạt |
| 4 | **Ca âm 9:** bỏ danh sách đặt trước thì 9 phiếu thành mồ côi | `engine-specs.test.ts` | Đạt |
| 5 | **Ca âm 10:** mã đã có khuôn mà còn đặt trước làm cổng đỏ | `engine-specs.test.ts` | Đạt |
| 6 | **Ca âm 11:** hàng đặt trước trỏ plan không có thật làm cổng đỏ | `engine-specs.test.ts` | Đạt |
| 7 | `index.md` sinh lại: 27 hàng registry khớp byte với HEAD, cộng bảng 9 hàng đặt trước | diff | Đạt |
| 8 | `pnpm lint` xanh trên 1.441 file | — | Đạt |
| 9 | `pnpm typecheck` xanh trên 10 project | — | Đạt |
| 10 | Bộ test `@mindkid/game-engine` xanh — 50 file, 738 ca | `pnpm --filter @mindkid/game-engine test` | Đạt |

---

## 6. Việc còn lại cho `#181`–`#189`

Mỗi task engine giờ **bắt đầu từ phiếu đã có**, không viết phiếu nữa. Bảy phần còn lại của lát dọc
giữ nguyên, cộng đúng một bước mới:

> Gỡ mã khỏi `packages/game-engine/config/engine-spec-planned.json` trong **cùng PR** dựng
> `template.ts`. Quên bước này thì cổng đỏ theo `BR-ESS-15`.

Khi cả 9 khuôn xong, danh sách đặt trước rỗng, và cổng trở lại đúng hình dạng cũ với 36 mã và 36
phiếu.
