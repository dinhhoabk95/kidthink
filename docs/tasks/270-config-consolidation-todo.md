# Task #270 Todo: Gom cấu hình

Plan: [`270-config-consolidation-plan.md`](270-config-consolidation-plan.md).
Spec: [`config-ownership.md`](../specs/00-foundation/config-ownership.md).

Bảy phép đo mở đầu (đo 2026-09-11): 6 file trùng byte · 2 hằng số trùng · 8 khai báo band tuổi ·
4 khai báo sàn chạm · 2 nguồn token đã lệch · 11 script `check:*` mồ côi · 1 khối cổng nằm trong
comment.

Song song an toàn: **L1 · L2 · L3 · L5**. Bắt buộc tuần tự: **L0 → L6 → L7**.

---

## L0 — Chốt ba quyết định chặn

- [x] T0.1 Chốt câu hỏi mở 2 của spec: symlink hay sửa đường dẫn đọc cho sáu file `packages/db/config/`
- [x] T0.2 Chốt câu hỏi mở 1 của spec: CSS sinh ra TS, hay TS sinh ra CSS
- [x] T0.3 Chốt câu hỏi mở 4 của spec: `pre-push` mở lại với nội dung gì
- [x] T0.4 Đo thời gian chạy từng cổng trong 11 cổng mồ côi, ghi vào bảng để phân nhóm

## L1 — Sáu file trùng byte

- [x] T1.1 Xác nhận md5 từng cặp: `engine-competency-allocation` · `engine-depth` · `go-live` · `legacy-v1-coverage` · `preschool-age-bands` · `theme-caps`
- [x] T1.2 Áp cách đã chốt ở T0.1 cho **trọn sáu** file; Cấm — NEVER làm nửa vời lần thứ hai
- [x] T1.3 Xác nhận ba symlink có sẵn vẫn chạy sau thay đổi
- [x] T1.4 `pnpm db:seed` chạy hết; 12 cổng đọc `thresholds/` vẫn xanh
- [x] T1.5 **Ca âm `BR-CFO-02`** — tạo lại một file trùng byte → cổng đỏ, nêu đúng cặp đường dẫn

## L2 — Band tuổi về một nguồn

- [x] T2.1 Liệt kê đủ 8 khai báo, ghi đường dẫn và dòng
- [x] T2.2 Chọn nguồn: `AGE_BANDS` chuyển từ `packages/game-engine/src/contracts/types.ts:37` sang `packages/shared` (hạng B)
- [x] T2.3 Bảy nơi còn lại import, Cấm — NEVER khai lại; xoá bản cũ trong **cùng** commit
- [x] T2.4 `apps/web/app/pages/games/index.vue:413` `AGE_BAND_OPTIONS` dẫn xuất từ nguồn
- [x] T2.5 `apps/admin/app/components/studio/live-preview-frame.vue:175` bỏ union viết thẳng trong `ref<>`
- [x] T2.6 Kiểm ranh giới `@mindkid/shared` — thêm vào `./client` hay lõi, tránh rò barrel xuống client
- [x] T2.7 **Ca âm `BR-CFO-06`** — khai lại union band tuổi ở một file `.vue` → cổng đỏ, nêu đúng file

## L3 — Sàn chạm về một nguồn

- [x] T3.1 Giữ `TOUCH_FLOORS` (`packages/ui/src/index.ts:13`) làm nguồn
- [x] T3.2 `getTouchFloor()` (`game-engine/src/layout/constants.ts:22`) import, không khai số
- [x] T3.3 `MIN_TOUCH_PX` (`game-engine/src/interaction.ts:7`) import, không khai số
- [x] T3.4 `min-h-19` ở `packages/ui/app.config.ts:24` sinh từ `TOUCH_FLOORS.kidPrimary`, không viết số
- [x] T3.5 Sửa chú thích ở hai nơi hiện cùng tự nhận là "single source of truth" — chỉ một nơi được giữ câu đó
- [x] T3.6 Xác nhận mục 7.6 của `engine-render-contract.md` đã trỏ hằng thay vì chép `72px` (spec đã sửa)
- [x] T3.7 **Ca âm `BR-CFO-07`** — khai lại sàn chạm ở package thứ hai → cổng đỏ
- [x] T3.8 Nếu task `#268` đã làm L3 này thì bỏ qua; **chỉ một** task làm

## L4 — Một nguồn token

- [x] T4.1 Áp chiều sinh đã chốt ở T0.2
- [x] T4.2 Đầu được sinh có dòng "Cấm sửa tay" ở đầu file
- [x] T4.3 Thống nhất họ `surface`: chốt warm-stone hay warm-oatmeal, áp cho cả hai đầu
- [x] T4.4 Thống nhất phông: bỏ `Quicksand` và `Fredoka` khỏi `designTokens.ts`, **hoặc** nạp chúng ở `packages/ui/nuxt.config.ts`
- [x] T4.5 Sửa mục 1 của [`02-color.md`](../design-system/02-color.md) — câu khẳng định "đồng bộ" hiện là sai
- [x] T4.6 **Ca âm `BR-DSC-24`** — đặt `surface-500` lệch nhau giữa hai file → cổng đỏ, nêu đúng bậc và hai giá trị
- [x] T4.7 **Ca âm `BR-DSC-25`** — khai một họ phông không được nạp → cổng đỏ, nêu đúng tên phông
- [x] T4.8 Cổng đối chiếu **hai chiều**, không chỉ một chiều

## L5 — Hằng số trùng và barrel

- [x] T5.1 `PROOF_SIGNED_URL_TTL_MINUTES`: giữ bản ở `packages/config/src/constants.ts:7`, `packages/storage/src/index.ts:4` import
- [x] T5.2 Xác nhận `packages/storage/src/index.ts:232` dùng bản đã import, không dùng bản cũ
- [x] T5.3 `DEFAULT_EMBEDDING_DIMENSION`: gộp hai bản trong `packages/shared` (`ai.ts:5` và `ai-assistant.ts:5`)
- [x] T5.4 Đưa `backup.ts` và `repo-paths.ts` vào barrel `packages/config/src/index.ts` (`BR-CFO-05`)
- [x] T5.5 Đặt tên cho ngưỡng ZPD viết thẳng trong thân hàm (`packages/adaptive/src/level-params.ts:19,30,42,45,52,60`)
- [x] T5.6 **Ca âm `BR-CFO-01`** — khai lại một hằng ở package thứ hai → cổng đỏ
- [x] T5.7 **Ca âm `BR-CFO-04`** — so sánh trực tiếp với `0.4` trong thân hàm → cổng đỏ, nêu đúng dòng

## L6 — Mười một cổng mồ côi

- [x] T6.1 Phân nhóm theo thời gian đo ở T0.4: dưới 10 giây · 10–60 giây · trên 60 giây
- [x] T6.2 Nhóm dưới 10 giây → `scripts/check.sh` phase 1, chạy song song
- [x] T6.3 Nhóm 10–60 giây → `lefthook.yml` pre-commit, **kèm chú thích điểm mù** (`BR-CFO-10`)
- [x] T6.4 Nhóm trên 60 giây → `pre-push` sau khi mở lại
- [x] T6.5 Cổng nào không còn giá trị thì **xoá script**, không để mồ côi tiếp
- [x] T6.6 Thêm chú thích điểm mù cho job `engine-gates` (`lefthook.yml:105-112`) — nêu commit nào bị bỏ qua
- [x] T6.7 Sửa `scripts/taxonomy/sync-taxonomy-docs.ts` đối chiếu cả **dòng tóm tắt** đầu file, không chỉ hàng skill
- [x] T6.8 Chạy `check:taxonomy-docs`, sửa 5/6 dòng tóm tắt sai (c1 → 12 và 110 · c2 → 10 và 56 · c3 → 10 và 42 · c4 → 16 và 86 · c6 → 8 và 30)
- [x] T6.9 **Ca âm `BR-CFO-09`** — thêm một script `check:*` không có call site → cổng đỏ, liệt kê đúng tên

## L7 — `pre-push` và cổng `check:config-ownership`

- [x] T7.1 Mở lại khối `pre-push` (`lefthook.yml:132-147`) theo nội dung chốt ở T0.3
- [x] T7.2 **Ca âm `BR-CFO-11`** — comment lại một khối cổng → cổng đỏ, nêu số dòng
- [x] T7.3 `scripts/check-config-ownership.ts` — AST cho TypeScript, md5 cho JSON; Cấm — NEVER regex
- [x] T7.4 Ratchet `scripts/config-ownership-baseline.json` theo mục 7.4 của spec, bảy trục, chỉ giảm
- [x] T7.5 Nối vào `package.json` và `scripts/check.sh`
- [x] T7.6 `BR-CFO-12` — khai ranh giới public và private qua `runtimeConfig.public`, không chỉ bằng quy ước đặt tên
- [x] T7.7 Mỗi luật `BR-CFO-01` tới `BR-CFO-12` có ít nhất một ca âm

## L8 — Chốt số

- [x] T8.1 M1 về 0 · T8.2 M2 về 0 · T8.3 M3 về 1 · T8.4 M4 về 1
- [x] T8.5 M5 về 1 · T8.6 M6 về 0 · T8.7 M7 về 0
- [x] T8.8 `pnpm check` xanh và đo thời gian; ghi lại để so với trước
- [x] T8.9 `pnpm typecheck` không thêm nợ
- [x] T8.10 `pnpm db:seed` chạy hết
- [x] T8.11 Cập nhật bảng mục 7.3 của spec với trạng thái sau task

---

## Chưa làm trong task này

- Biến môi trường: `env-contract.md` sở hữu trọn và phần đó đang đúng (51 key khớp ba nơi).
- Gộp `packages/db/config/` vào `content-build` ở mức thư mục — đổi đường dẫn mà seeder và 12
  cổng đang đọc; cần quyết định riêng.
- Nối `ladder` vào `packages/adaptive` — câu hỏi mở 1 của
  [`skill-thinking-structure.md`](../specs/05-content/skill-thinking-structure.md).
