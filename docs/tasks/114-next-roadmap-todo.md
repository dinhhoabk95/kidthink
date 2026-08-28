# Checklist — Task #114: Roadmap tiếp theo, đóng 49 spec chưa `implemented`

> Kế hoạch: [`114-next-roadmap-plan.md`](114-next-roadmap-plan.md).
> Tuyệt đối: không lật `status` spec nào, không sửa file dưới `docs/specs/` ngoài
> [`roadmap.md`](../specs/roadmap.md), không chạm mã sản phẩm.
>
> Đặt lại đường dẫn Node trước mọi lệnh đo:
> `export PATH=/Users/macbook/.nvm/versions/node/v24.15.0/bin:$PATH`.

## Preflight

- [x] Đếm `status` trên toàn bộ `docs/specs/**/*.md`: 149 `implemented`, 14 `approved`, 35 `draft`.
- [x] Đối chiếu 49 file chưa đóng với `docs/tasks/`: 0 file mồ côi, 3 plan quá tải.
- [x] Đo mã engine: 27 thư mục template, **0** cài `render()`, 21 layout id, 20 system.
- [x] Đo `CUSTOM_GAME_TEMPLATE_CODES`: hai bản — 6 mã ở `@mindkid/shared`, 27 ở `@mindkid/game-engine`.
- [x] Đọc `core.ts:184` — vòng lặp đã gọi `render?.()`, thân hàm là thứ duy nhất thiếu.
- [x] Chốt số task tiếp theo: 115 tới 129, không đụng 01–113 đã dùng.
- [x] Người duyệt tái dựng số đo mục 2.1 của plan trên máy mình trước khi approve thứ tự.

## WP114.1 — Hồ sơ mười lăm task

**Cỡ:** M · **Ranh giới PR:** chỉ `docs/tasks/`

- [x] [`115-render-contract-core`](115-render-contract-core-plan.md) — plan và todo.
- [x] [`116-render-contract-rollout`](116-engine-vertical-slices-plan.md) — plan và todo.
- [x] [`117-seed-gate-truth`](117-seed-gate-truth-plan.md) — plan và todo.
- [x] [`118-band-violation-cleanup`](118-band-violation-cleanup-plan.md) — plan và todo.
- [x] [`119-theme-registry`](119-theme-registry-plan.md) — plan và todo.
- [x] [`120-engine-spec-sheets`](120-engine-spec-contract-plan.md) — plan và todo.
- [x] [`121-level-generator-kit`](121-level-generator-kit-plan.md) — plan và todo.
- [x] [`122-engine-content-depth`](122-engine-content-depth-plan.md) — plan và todo.
- [x] [`123-lesson-flow-model`](123-lesson-flow-model-plan.md) — plan và todo.
- [x] [`124-lesson-corpus-depth`](124-lesson-corpus-depth-plan.md) — plan và todo.
- [x] [`125-go-live-readiness`](125-go-live-readiness-plan.md) — plan và todo.
- [x] [`126-montessori-closure`](126-montessori-closure-plan.md) — plan và todo.
- [x] [`127-template-diversity-ratification`](127-template-diversity-ratification-plan.md) — plan và todo.
- [x] [`128-infra-go-live`](128-infra-go-live-plan.md) — plan và todo.
- [x] [`129-mfa-and-runtime-boundary-closure`](129-mfa-and-runtime-boundary-closure-plan.md) — plan và todo.

## WP114.1b — Hai mươi bảy lát dọc engine

**Cỡ:** M · **Ranh giới PR:** chỉ `docs/tasks/`

- [x] `#130` … `#156` — 27 cặp plan/todo, ánh xạ một-một `GT-001`…`GT-027`.
- [x] Mỗi plan mang số đo riêng: level hiện có, thiếu tới bậc 1, layout, band cấm, `limits`, trường `content_pack`, `difficulty_params`, system.
- [x] Mỗi plan có đủ sáu WP của khuôn mục 6 [`Task #116`](116-engine-vertical-slices-plan.md).
- [x] Mỗi todo có bảy điều kiện "xong" ở phần Nghiệm thu.
- [x] Tổng cột "thiếu tới ≥6" bằng **55** — khớp bậc 1 của `engine-content-depth.md`.
- [x] Thu hẹp #115, #117, #118, #120, #122: phần việc per-engine chuyển sang task engine.

## WP114.2 — Nối vào roadmap

**Cỡ:** S · **Ranh giới PR:** chỉ `docs/specs/roadmap.md`

- [x] Ghi mục mới *"Thứ tự task cho spec chưa triển khai, chốt 2026-08-29"* sau mục chốt 2026-08-18.
- [x] Đánh dấu mục chốt 2026-08-18 là đã thay thế, giữ nguyên nội dung cũ để tra lịch sử.
- [x] Bảng 15 task ngang cộng hàng gộp `#130`–`#156`, cột: task · spec đóng · loại · chặn bởi. Khớp bảng mục 4 của plan.
- [x] Ghi ba quyết định chặn `Q114-1`, `Q114-2`, `Q114-3` vào mục đó.
- [x] Cập nhật mục *"Coverage plan, task và mức sẵn sàng"*: hàng P4 trỏ thêm Task #115–#125 và 27 lát dọc engine #130–#156.

## WP114.3 — Đóng vòng với Task #113

**Cỡ:** S · **Ranh giới PR:** chỉ `docs/tasks/113-*`

- [x] Ghi vào đầu [`113-...-todo.md`](113-game-engine-depth-and-seed-diversity-todo.md) một dòng
      trỏ sang bảng mục 4 của Task #114, nói rõ 64 việc mở đã chuyển chủ.
- [x] Với mỗi WP mở của #113 (`113.0`, `113.0b`, `113.0c`, `113.0d`, `113.1`, `113.2`, `113.2a`,
      `113.3`, `113.4`, `113.4a`, `113.5`, `113.6`, `113.7`), ghi task mới nào tiếp nhận.
- [x] Không tick ô nào của #113 — việc chưa làm, chỉ đổi chủ sở hữu.

## Nghiệm thu

- [x] `ls docs/tasks/1{1[5-9],2[0-9]}-*-plan.md` trả đúng 15 file (glob `12*` bắt nhầm `12-corpus-debt-sweep`).
- [x] `ls docs/tasks/1[3-5][0-9]-engine-*-plan.md` trả đúng 27 file.
- [x] Mỗi plan mới có cặp `-todo.md` cùng số.
- [x] Cả 49 file chưa đóng có task sở hữu ở bảng mục 4; ngoại lệ duy nhất là `engine-render-contract` (hai task: #115 và #116).
- [x] Mọi liên kết tương đối trong 85 file mới resolve được.
- [x] Diff **của Task #114** dưới `docs/specs/` chỉ chạm `roadmap.md`. Cây làm việc đang có
      thay đổi dở của người khác (38 file spec ngày 2026-08-29), nên so theo commit của task
      này, không so `git status` toàn cây.
- [x] Không file spec nào đổi `status` trong commit của task này.
- [x] Mở PR cho người review diff, không tự merge.
