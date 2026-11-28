# Task #321 — Todo

## Đã xong (chưa commit)

- [x] Thu khung gỗ điện thoại dọc + `splitHeroStage` nhường chỗ (nợ tràn play 1190 → 446, `BR-LAY-13`)
- [x] Audio: câu nhiều đoạn bỏ qua đoạn lỗi (`BR-PNR-06`), 43 mp3 khung chuyện, 900 `audio_path` chết → giọng theo nhãn, cổng `apps/web/tests/gates/story-voice-coverage`
- [x] Nhãn đọc asset toàn emoji rơi về `item.label` (GT-001/002)
- [x] Emoji không còn bị bóp ngang trong ô (`drawTextInSlot` bỏ `maxWidth`, lưới emoji)
- [x] Font canvas: `"display"`/`"body"` sai → `CanvasFontFamily` (GT-018/024/031/036/037)
- [x] GT-009: 3 vòng khác nhau, đáp án ≤ 40% corpus
- [x] GT-014: vật trên đĩa theo số vật/đĩa, nằm trong lòng đĩa, hit-test khớp hình
- [x] GT-016: builder dùng chung luật generator
- [x] GT-019: lời đọc không chứa số độ (`BR-E019-06`), ô đích ≥ 140 logic khi ≤ 2 đích
- [x] GT-024: chấm không tràn bảng cát; hint kéo từ chấm vừa nối
- [x] GT-026: nút bắt đầu + pha thoát (spec dòng trạng thái ISI sửa cùng)
- [x] GT-028/029/030: bước nháp `QUIET_OK`; ô tổng GT-028 hiện số

## Việc sau khi commit

- [ ] Seed lại DB dev (`pnpm db:local:seed`) — `audio_path` và nội dung GT-009/016 đổi
- [ ] Render mp3 "Bắt đầu" (nút GT-026) và "Cái bóng của {tên}" (GT-019) — hiện chưa có trong kho
- [ ] `render/shared-slot-render.ts`: sàn thu cỡ chữ 10 px thấp hơn `minLegiblePx`
- [ ] Bỏ `commit start_trials` thừa ở phiên không phải GT-026 trong `tests/features/cham.test.ts`
- [ ] Ép kiểu `as` trong test mới (`gt-016.test.ts`, `emoji-run-fit.test.ts`, `gt-028-badge-color.test.ts`)
- [ ] Emoji trong đồng xu GT-004/007 (`render/craft-shapes.ts`)
- [ ] Gói không cần spec còn lại từ review: GT-000 chữ số trên sách (A-05), nhãn flashcard đè hình (A-06), ô GT-002 (A-07), number-rod GT-001 (A-09), GT-005 cặp lệch lượng (A-11), GT-009 nhãn, GT-011, GT-012, GT-022, GT-032, GT-036 prompt, GT-025 điểm khác cùng loại

## Cần PO chốt

- [ ] Gợi ý khi câu dẫn thật sự lỗi tiếng: giữ L2 hay hạ L1 / không đặt sàn
- [ ] GT-000 bước `present`/`echo`: bàn tay trỏ thẻ nhưng đi tiếp cần nút DOM (`BR-E000-14`)
- [ ] GT-027: luật chỉ bằng chữ; `BR-E027-05` cấm đọc luật mới
- [ ] GT-026 nội dung go/nogo sai, tỉ lệ go < 70% (§11 open question #1)
- [ ] GT-024 nhãn chấm khi hình khép kín
- [ ] Nợ sức chứa GT-034/035/037 (`BR-LAY-12`: bớt ô ở nội dung)
- [ ] Vị trí nút "bỏ qua" và `computeStageWithoutTray` (`BR-PSZ-03`)

## Lỗi có sẵn, không thuộc task

- `apps/web/tests/gates/engine-input-dispatch.test.ts`: 1 nhánh `typeof session` trong `[code].vue` (file không đổi trong task này)
- `packages/content-build`: `game`, `level-allocation`, `BR-LGK-10`, `skill-quota` đỏ cả ở HEAD; `roadmap-seeding` đỏ do migration chưa track `packages/db/src/migrations/20261126141536_far_corsair/`
