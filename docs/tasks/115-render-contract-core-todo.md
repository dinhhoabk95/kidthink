# Checklist — Task #115: Hạ tầng vẽ và cổng `check:render`

> Kế hoạch: [`115-render-contract-core-plan.md`](115-render-contract-core-plan.md).
> Tuyệt đối: **không cài `render()` cho engine nào** — việc đó thuộc 27 task engine `#130`–`#156`;
> không ép `render` bắt buộc bằng kiểu; không dựng cổng ở `packages/gates`; không đóng spec.
>
> Đặt lại đường dẫn Node trước mọi lệnh:
> `export PATH=/Users/macbook/.nvm/versions/node/v24.15.0/bin:$PATH`.

## Preflight

- [x] Đo lại `grep -rn "render(" packages/game-engine/src/templates --include="*.ts" | wc -l` — kỳ vọng `0`.
- [x] Đọc `packages/game-engine/src/core.ts:181-186` và xác nhận `render?.()` vẫn ở đó.
- [x] Đọc 5 nguyên thuỷ của `RenderSystem` và bảng token ở `designTokens.ts`.
- [x] Đọc `resolveLayout()` và hình dạng `Slot` — vùng chạm theo band nằm ở trường nào.
- [x] Chụp danh sách `trạng-thái | tên-test` của `pnpm --filter @mindkid/game-engine test` **trước** khi sửa.
- [x] Đo lại hai định nghĩa `CUSTOM_GAME_TEMPLATE_CODES` và mọi nơi import chúng.
- [x] Người quyết trả lời `Q115-1`: `shared` lấy 27 mã bằng sinh mã hay bằng cổng đối chiếu.

## WP115.0 — Dọn `CUSTOM_GAME_TEMPLATE_CODES`

**Cỡ:** S

- [x] Test RED trước: test đếm định nghĩa mang tên đó trong monorepo phải **đỏ** với con số 2.
- [x] `packages/shared/src/custom-game.ts` nhận 27 mã theo đường đã chốt ở `Q115-1`.
- [x] Xoá định nghĩa khỏi `packages/game-engine/src/generated/template-codes.ts`.
- [x] Xoá khỏi `packages/game-engine/scripts/gen-templates-lib.ts`.
- [x] Xoá khỏi barrel `packages/game-engine/src/index.ts`. Giữ `ALL_TEMPLATE_CODES`.
- [x] `create.vue` của admin import từ `@mindkid/shared`, bỏ `switch` viết tay.
- [x] Khẳng định `@mindkid/shared` **không** import `@mindkid/game-engine`; `pnpm lint:deps` xanh.
- [x] Test đếm chuyển GREEN với con số 1.

## WP115.1 — `render` bắt buộc với engine `active`

**Cỡ:** S

- [x] `render` giữ `optional` ở lớp cơ sở `GameSession` — phiên headless và test dùng.
- [x] Ràng buộc "engine `active` phải cài" do **cổng** thi hành, không do kiểu.
- [x] Ghi lý do vào PR: ép bằng kiểu làm 27 engine không compile cùng lúc.

## WP115.2 — Cổng `check:render`

**Cỡ:** M

- [x] Ca âm: fixture `session.ts` thiếu `render`.
- [x] Ca âm: fixture `session.ts` gọi `ctx.fillRect`.
- [x] Ca âm: fixture `session.ts` có hằng số toạ độ vẽ.
- [x] Ca âm: trỏ cổng vào thư mục rỗng → đỏ.
- [x] Fixture ở `packages/game-engine/tests/gates/fixtures/`, không viết thẳng vào file test.
- [x] `Q115-2` — chốt định nghĩa hẹp của "hằng số toạ độ" trước khi thi công.
- [x] `scripts/check-render.ts`: kiểm `BR-ERC-01`, `BR-ERC-05`, `BR-ERC-03`.
- [x] Đầu ra đúng dạng mục 7.5: `27 engine active, N cài render, M thiếu`.
- [x] Nguồn không đọc được thì **đỏ**.
- [x] Gốc repo từ `repoPath()`, không `process.cwd()`.
- [x] Cổng ở `packages/game-engine/tests/gates/`, **không** ở `packages/gates`.
- [x] `packages/game-engine/config/render-implemented.json` — bậc thang, khởi đầu **rỗng**.
- [x] Ca âm bậc thang: thêm mã của engine chưa cài `render` vào danh sách → đỏ.
- [x] Script `check:render` trong `package.json`, nối vào `pnpm test`.
- [x] Bốn ca âm chuyển sang đỏ vì đúng lý do.

## WP115.3 — Khuôn `render()` thành tài liệu

**Cỡ:** S · chỉ `docs/specs`

- [x] Ghi khuôn bốn lớp vào mục 7 của [`engine-render-contract.md`](../specs/01-platform/engine-render-contract.md).
- [x] Ghi bảng **bảy phép kiểm bắt buộc** mà mỗi task engine phải qua.
- [x] 27 task engine trỏ về mục này thay vì chép lại.
- [x] Khẳng định `BR-ERC-11` cấm so pixel được nêu rõ trong khuôn.

## Nghiệm thu

- [x] `check:render` in `27 engine active, 0 cài render, 27 thiếu` và **thoát 0**.
- [x] Thêm mã vào `render-implemented.json` cho engine chưa cài `render` → cổng **đỏ**.
- [x] Bốn ca âm đều đỏ vì đúng lý do.
- [x] `grep -rn "CUSTOM_GAME_TEMPLATE_CODES" packages apps` trả đúng **một** định nghĩa.
- [x] Khuôn `render()` và bảng bảy phép kiểm có trong `engine-render-contract.md`.
- [x] `pnpm --filter @mindkid/game-engine test` xanh; danh sách test trùng khít trừ test mới.
- [x] `pnpm lint` xanh — dùng `pnpm lint`, không dùng `ultracite check`.
- [x] `pnpm lint:deps` · `pnpm typecheck` xanh.
- [x] `engine-render-contract.md` vẫn `draft` — đóng sau task `#156`.
- [x] Không engine nào được cài `render()` ở task này.
- [ ] Mở PR cho người review diff, không tự merge.

