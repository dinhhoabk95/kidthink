# Task #270 Plan: Gom cấu hình — chín nơi về bốn hạng, mười một cổng mồ côi về `check.sh`

> **Mục tiêu**: Cấu hình trong repo sống ở **chín nơi**. Sáu file trong `packages/db/config/`
> trùng byte với `packages/content-build/src/thresholds/`. Band tuổi có **tám** định nghĩa độc
> lập, sàn chạm có **bốn**, token thiết kế có **hai** và chúng đã lệch nhau.
>
> Cùng lúc, **mười một** script `check:*` không có call site nào, và khối `pre-push` của
> `lefthook.yml` nằm trọn trong comment.

Spec: [`config-ownership.md`](../specs/00-foundation/config-ownership.md) ·
[`design-system-contract.md`](../specs/08-quality/design-system-contract.md) `BR-DSC-24` tới
`BR-DSC-28` · [`runtime-gates.md`](../specs/08-quality/runtime-gates.md) mục 2b.

---

## 1. Bối cảnh

### 1.1 Bảy phép đo mở đầu (đo 2026-09-11)

| # | Phép đo | Hiện tại | Đích |
|---|---|---|---|
| M1 | File cấu hình trùng byte giữa hai package | 6 | 0 |
| M2 | Hằng số cùng tên cùng giá trị khai ở hai package | 2 | 0 |
| M3 | Khai báo band tuổi độc lập | 8 | 1 |
| M4 | Khai báo sàn chạm độc lập | 4 | 1 |
| M5 | Nguồn token thiết kế | 2, đã lệch | 1 |
| M6 | Script `check:*` không có call site | 11 | 0 |
| M7 | Khối cổng nằm trong comment ở `lefthook.yml` | 1 (`pre-push`, dòng 132–147) | 0 |

Lệnh tái lập M1 và M6:

```bash
md5 packages/db/config/*.json packages/content-build/src/thresholds/*.json \
  | awk '{print $NF}' | sort | uniq -d
node -e 'const p=require("./package.json");
const s=require("fs").readFileSync("scripts/check.sh","utf8")+require("fs").readFileSync("lefthook.yml","utf8");
for(const k of Object.keys(p.scripts)) if(k.startsWith("check:") && !s.includes(k)) console.log(k);'
```

### 1.2 Khoản nợ 1 — migration dừng giữa chừng

`packages/db/config/` có 9 entry. Ba đã là symlink trỏ về
`packages/content-build/src/thresholds/`: `level-allocation.json`, `skill-age-progression.json`,
`skill-template-affinity.json`. Sáu còn lại là **file thật, trùng byte** (md5 khớp):
`engine-competency-allocation.json` (40 KB), `engine-depth.json`, `go-live.json`,
`legacy-v1-coverage.json`, `preschool-age-bands.json`, `theme-caps.json`.

Có người đã bắt đầu đổi sang symlink và dừng. Trạng thái nửa vời tệ hơn cả hai đầu: người đọc
không biết file nào là nguồn.

### 1.3 Khoản nợ 2 — hai chỗ cùng tự nhận là nguồn duy nhất

Sàn chạm 96/76/64 khai ở bốn nơi:

| Nơi | Hình thức | Chú thích trong mã |
|---|---|---|
| `packages/ui/src/index.ts:13` | `TOUCH_FLOORS` | *"Single source of truth for touch floors across all 4 surfaces"* |
| `packages/game-engine/src/interaction.ts:7` | `MIN_TOUCH_PX` | *"Never re-declare these numbers elsewhere"* |
| `packages/game-engine/src/layout/constants.ts:22` | `getTouchFloor()` | — |
| `packages/ui/app.config.ts:24` | lớp `min-h-19` | 76 px viết dưới dạng Tailwind |

Hai chú thích cùng khẳng định mình là nguồn duy nhất, và cả hai sai. Mỗi bản là một cơ hội để một
bề mặt trẻ tụt dưới sàn `BR-A11-04` mà cổng không thấy.

Thêm một lệch nữa: mục 7.6 của `engine-render-contract.md` ghi band `4-5` là **72 px** trong khi
mã ghi **76 px**. Spec đã sửa để trỏ hằng thay vì chép số.

### 1.4 Khoản nợ 3 — hai nguồn token đã lệch

| | `packages/ui/assets/css/tailwind.css` | `packages/game-engine/src/systems/designTokens.ts` |
|---|---|---|
| `surface-400` | `#a8a29e` warm-stone | `#d4c5ab` warm-oatmeal |
| `surface-500` | `#78716c` | `#827660` |
| Phông sans | `Be Vietnam Pro` | `"Quicksand", "Be Vietnam Pro"` |
| Phông heading | `Baloo 2` | `"Fredoka", "Quicksand", "Baloo 2"` |

Mục 1 của [`02-color.md`](../design-system/02-color.md) khẳng định hai file "đồng bộ". Khẳng định
đó sai và không cổng nào đo.

Chỉ `Baloo 2` và `Be Vietnam Pro` được nạp (`packages/ui/nuxt.config.ts:22-25`), nên mọi
`ctx.font` của canvas rơi fallback qua `Quicksand` và `Fredoka` mà không có lỗi nào. Chữ vẫn hiện,
chỉ sai phông — dạng hỏng im lặng khó thấy nhất.

### 1.5 Khoản nợ 4 — mười một cổng không ai gọi

Danh sách đầy đủ ở mục 2b của [`runtime-gates.md`](../specs/08-quality/runtime-gates.md). Hệ quả
đo được của riêng `check:taxonomy-docs`: dòng tóm tắt đầu **5/6** file `docs/taxonomy/c*.md` sai —
c1 ghi 10 strand 99 skill trong khi thật là 12 và 110; c4 ghi 4 và 16 trong khi thật là 16 và 86.

Điểm mù thứ hai: script sync chỉ đối chiếu **hàng skill**, không đọc dòng tóm tắt. Nên kể cả khi
được gọi, nó vẫn bỏ sót chỗ này.

Điểm mù thứ ba: job `engine-gates` (`lefthook.yml:105-112`) có glob bốn thư mục; commit chỉ đổi
`scripts/` hoặc `apps/` bỏ qua trọn bộ cổng engine mà không in ra dòng nào.

---

## 2. Thiết kế

### 2.1 Bốn hạng

Theo mục 7.2 của `config-ownership.md`:

| Hạng | Nơi ở | Nhận thêm gì trong task này |
|---|---|---|
| A — vận hành | `packages/config/src/` | `backup.ts` và `repo-paths.ts` vào barrel |
| B — hợp đồng nghiệp vụ | `packages/shared/src/` | **band tuổi** và **sàn chạm** |
| C — nội dung và engine | `content-build/src/thresholds/` · `game-engine/config/` | thành nguồn duy nhất; `packages/db/config/` chỉ symlink |
| D — ratchet | `scripts/*-baseline.json` | không đổi |

### 2.2 Sáu file trùng byte

Hoàn tất việc đã bỏ dở: đổi trọn sáu file thành symlink, giống ba file đã đổi.

Câu hỏi mở 2 của spec: symlink không chạy trên Windows và repo chưa chốt có hỗ trợ Windows không.
Nếu quyết định không dùng symlink thì thay bằng sửa đường dẫn đọc — nhưng phải làm **trọn sáu**,
không để nửa vời lần thứ hai.

### 2.3 Một nguồn token

Câu hỏi mở 1 của spec chưa chốt chiều sinh. Hai lựa chọn:

| Chiều | Được | Mất |
|---|---|---|
| CSS là nguồn, sinh ra TS | Tailwind đọc tĩnh `@theme` như hiện tại | Thêm một bước build |
| TS là nguồn, sinh ra CSS | Một nguồn có kiểu | Tailwind mất khả năng đọc tĩnh `@theme` |

Dù chọn chiều nào, cổng `BR-DSC-24` phải đối chiếu **hai chiều** và đỏ khi lệch, kèm ca âm.

Sửa luôn `docs/design-system/02-color.md` mục 1 — câu khẳng định "đồng bộ" hiện là sai.

### 2.4 Mười một cổng mồ côi

Không nối mù. Câu hỏi mở 3 của spec: `check:skill-quota` phải dựng trọn 6.388 level nên có thể
không hợp vòng lặp cục bộ.

Phân loại theo thời gian chạy đo được:

| Nhóm | Nơi nối |
|---|---|
| Dưới 10 giây | `scripts/check.sh` phase 1, song song |
| 10–60 giây | `lefthook.yml` pre-commit, có glob và **có chú thích điểm mù** (`BR-CFO-10`) |
| Trên 60 giây | `pre-push` sau khi mở lại |

Cổng nào không còn giá trị thì **xoá script**, không để mồ côi tiếp (`BR-CFO-09`).

### 2.5 `pre-push` mở lại

Câu hỏi mở 4 của spec: bản cũ gọi `pnpm services` vốn cần Postgres và Valkey đang chạy, nên hỏng
trên máy chưa dựng dịch vụ.

Đề xuất: `pre-push` chạy `pnpm check` và bỏ `pnpm services`; kiểm dịch vụ chuyển thành một bước
tuỳ chọn có cờ. Cần chốt trước khi thi công.

### 2.6 Mở rộng `check:taxonomy-docs`

Ngoài việc nối vào `check.sh`, sửa `scripts/taxonomy/sync-taxonomy-docs.ts` để đối chiếu cả dòng
tóm tắt đầu file, không chỉ hàng skill. Không sửa thì cổng vẫn xanh trên 5 file sai.

---

## 3. Rủi ro

| Rủi ro | Dấu hiệu | Cách chặn |
|---|---|---|
| Chuyển hằng số mà để lại bản cũ | M2 không giảm dù đã thêm nguồn mới | Mỗi lần chuyển xoá bản cũ trong **cùng một** commit |
| Symlink vỡ trên máy khác | Cổng đỏ trên CI, xanh trên máy dev | Chốt câu hỏi mở 2 trước khi thi công; nếu không dùng symlink thì sửa đường dẫn đọc trọn sáu file |
| Nối 11 cổng làm `pnpm check` chậm gấp đôi | Người bỏ chạy `check` | Đo thời gian từng cổng trước khi phân nhóm; nhóm theo ngưỡng ở mục 2.4 |
| Sinh token một chiều rồi sửa tay đầu kia | Hai nguồn lệch lại sau vài tuần | Đầu được sinh phải có dòng "Cấm sửa tay" ở đầu file và cổng kiểm hai chiều |
| `pre-push` mở lại rồi bị comment lần hai | Vòng lặp lặp lại | `BR-CFO-11` cấm khối comment; cổng kiểm chính điều đó |
| Đọc cấu hình bằng regex bỏ sót | Cổng xanh giả | AST cho TypeScript, md5 cho JSON |

---

## 4. Phạm vi

**Trong phạm vi**: sáu file trùng byte; gộp band tuổi và sàn chạm; một nguồn token; barrel
`packages/config`; hằng `PROOF_SIGNED_URL_TTL_MINUTES` và `DEFAULT_EMBEDDING_DIMENSION`; nối
hoặc xoá 11 cổng mồ côi; mở lại `pre-push`; mở rộng `check:taxonomy-docs`; cổng
`check:config-ownership`.

**Ngoài phạm vi**: biến môi trường — `env-contract.md` sở hữu trọn và phần đó đang đúng. Gộp
`packages/db/config/` vào `content-build` ở mức thư mục — đổi đường dẫn mà seeder và 12 cổng đang
đọc, cần quyết định riêng. Ngưỡng ZPD trong `packages/adaptive/src/level-params.ts` — đặt tên cho
chúng thì được, nhưng nối vào `ladder` là câu hỏi mở 1 của `skill-thinking-structure.md`.
