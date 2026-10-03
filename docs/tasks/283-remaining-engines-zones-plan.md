# Task #283 Plan: Dời các engine còn lại vào khung năm vùng

Todo: [`283-remaining-engines-zones-todo.md`](283-remaining-engines-zones-todo.md).
Cha: [`277-play-stage-zones-plan.md`](277-play-stage-zones-plan.md).
Spec: [`play-stage-zones.md`](../specs/01-platform/play-stage-zones.md) (approved 2026-10-03).

## 1. Hiện trạng đã đo (2026-10-03, đọc code, chưa đo trình duyệt)

- **6/37 engine đã dời**: GT-001 (S3), GT-028 (S4), GT-003 (S5), GT-034/035/036 (S7). Còn **31**: GT-000, GT-002 và 29 engine.
- **Lời dẫn bị vẽ đôi (lỗi đang chạy).** `apps/web/app/pages/play/[code].vue` gọi `drawPromptZone` cho mọi session có `getView().activePrompt`. Cả 31 engine chưa dời vẫn gọi `drawPromptText` vô điều kiện (ví dụ `GT-009/session.ts:343`). `RoundRunner` cấp `stageRect` cho **mọi** session, nên `!this.stageRect` không phân biệt được engine đã dời với chưa dời. Cần cờ tường minh — lát N0.
- **Layout chung chưa biết `stage`.** `layout/types.ts` `LayoutInput` không có `stage`, không có `cssPerLogic`. `layout/geometry.ts` dùng `CONTENT_TOP_PX` 32 lần và `getTouchFloor(` 15 lần. Toạ độ cứng thật nằm ở `geometry.ts`, không ở `session.ts`.
- **Engine cần nộp bài nhưng chưa có đường `commit`** (cùng họ lỗi H3 của GT-028):
  - GT-006 (`commit` → `check_sequence`).
  - GT-016: `tap` bất kỳ cũng nộp.
  - GT-018 chỉ khi `response_mode === "sequence"`.
  - GT-002 tự vẽ nút Xong.
  - GT-000 mang `intent` từ ba nút ở trang.
- **`drawProgressBadge` còn ở 3 engine**: GT-002, GT-026, GT-027 (vi phạm `BR-PSZ-06`).
- **Ratchet số cứng** `check:hardcoded-params` chỉ quét `templates/*/session.ts`; số đếm lại ~337 dòng so với baseline 398 (chưa chạy script để xác nhận).
- **Nợ safe-area** (`tests/layout-safe-area-debt.json`, chỉ được giảm): GT-003 66, GT-004 28 và 588, GT-005 736, GT-008 32, GT-014 8, GT-017 2.

## 2. Bảng kiểm kê 31 engine

Mọi engine đều gọi `drawPromptText`. Cột `needs*` là **kỳ vọng suy từ code**, phải đối chiếu `docs/specs/01-platform/engines/GT-0xx.md` trước khi khai.

| Code | Interaction | Điểm khác cần xử lý | needsTray / needsCommit | Lô |
|---|---|---|---|---|
| GT-000 | concept-intro | `commit` + `intent` từ 3 nút ở trang | không / không (xem B7) | B7 |
| GT-002 | tap-select-multi | nút Xong tự vẽ, `drawProgressBadge` | không / **true** | B2 |
| GT-004 | sort-groups | nợ 28 + 588 | **true** / không | B3 |
| GT-005 | pair-match | nợ 736 | không / không | B4 |
| GT-006 | sequence-order | `commit` chưa có đường | có thể / **true** | B4 |
| GT-007 | number-bond | dock | **true** / không | B3 |
| GT-008 | drag-to-slot | dock, nợ 32 | **true** / không | B3 |
| GT-009 | clue-deduction | — | không / không | B1 |
| GT-010 | substitution | dock | không / không | B1 |
| GT-011 | matrix-choice | dock | không / không | B1 |
| GT-012 | flash-recall | `activePrompt` ×2, phân trang | không / không | B1 |
| GT-013 | maze-route | gesture `draw` toàn canvas | không / không | B4 |
| GT-014 | balance-scale | nợ 8 | **true** / không | B5 |
| GT-015 | sudoku-mini | — | **true** / không | B3 |
| GT-016 | clock-hands | `tap` bất kỳ nộp | không / **true** | B5 |
| GT-017 | block-stack | nợ 2 | không / không | B5 |
| GT-018 | listen-respond | dock, phân trang | không / **true nếu sequence** | B2 |
| GT-019 | rotate-transform | tap-tap | **true** / không | B5 |
| GT-020 | memory-flip | 6 chỗ timer | không / không | B4 |
| GT-021 | mirror-complete | dock | **true** / không | B3 |
| GT-022 | hidden-object | free-scene | không / không | B1 |
| GT-023 | construct | — | **true** / không | B3 |
| GT-024 | trace-path | gesture `trace_point` toàn canvas | không / không | B4 |
| GT-025 | spot-difference | 17 dòng số cứng | không / không | B1 |
| GT-026 | go-nogo | `drawProgressBadge`; khoảng nghỉ phải trống | không / không | B2 |
| GT-027 | rule-switch | `drawProgressBadge`, dock | không / không | B2 |
| GT-029 | remove-from-set | dock | không / không | B1 |
| GT-030 | measure-with-unit | dock, 18 dòng số cứng | **true** / có thể | B6 |
| GT-031 | coin-compose | dock | **true** / có thể | B6 |
| GT-032 | pour-quantity | dock | không / không | B1 |
| GT-033 | weave-grid | dock | **true** / có thể | B6 |

## 3. Thứ tự và phụ thuộc

```
N0 (hotfix cờ vẽ lời dẫn) → N → B1 → B2 → B3 → B4
                                    \→ B5 → B6;  B7 độc lập sau B2
```

- **N0** · S · vá lỗi vẽ đôi lời dẫn bằng cờ trên session (`rendersOwnPrompt` hoặc đảo nghĩa thành `usesPromptZone`); engine đã dời khai cờ; trang chỉ vẽ `drawPromptZone` khi cờ đặt. Ca âm: engine chưa dời khai cờ sai → test đỏ.
- **N** · M · nền: `LayoutInput.stage` + `cssPerLogic`; thay 15 chỗ `getTouchFloor` bằng `getTouchFloorLogicPx` (`BR-PSZ-04` ở px CSS thật); nâng `GT-003/tray-layout.ts` lên `layout/tray-layout.ts`; gom `stage-engines-s7.test.ts` thành test tham số theo mã; gate `zone-primitives-only`. Layout cũ khi không có `stage` phải giữ nguyên kết quả (`BR-LAY-10`).
- **B1** · M · chạm chọn một: GT-009, 010, 011, 012, 022, 025, 029, 032.
- **B2** · M · nộp bài/tiến độ/ức chế: GT-002, 018, 026, 027. GT-002 cần #275 đã đóng.
- **B3** · L · kéo thả có khay: GT-004, 007, 008, 015, 021, 023. Rủi ro lớn: nợ safe-area của GT-004/008 chỉ được giảm.
- **B4** · M · ghép/lật/dãy/đường: GT-005, 006, 013, 020, 024.
- **B5** · M · thao tác trực tiếp: GT-014, 016, 017, 019. GT-016 đổi hành vi → sửa spec trước.
- **B6** · M · xây/đo/đong: GT-030, 031, 033.
- **B7** · M · GT-000: câu hỏi mở cho người quyết (intro trong khung hay ngoài khung).

## 4. Chiến lược test mỗi lô

1. RED trước, ghi số ca đỏ vào todo (S7: 172/177).
2. Ca âm bằng fixture dưới `tests/layout/fixtures/` (mẫu `gt-035-legacy-coords.ts`).
3. Replay `ALL_SEED_LEVELS` theo `template_code` của lô: `findHitPairViolations` (`BR-LAY-05`), `findDrawsOutsideStage` (`BR-PSZ-01`); hai vòng liên tiếp.
4. Viewport 390×844 (canvas CSS 330×697), 844×390, 1024×768; chạy cả band thấp nhất vì sàn chạm cao nhất.
5. Cổng đi kèm: `check:hardcoded-params` (không đẩy số sang file không bị quét), `check:engine-specs`, `check:engine-turn`, `check:logic-space`, `layout.test.ts`, `all-templates-interactive-harness.test.ts`.
6. Engine đổi hành vi (GT-016, GT-018, GT-000): sửa phiếu `engines/GT-0xx.md` và `engine-turn-script.md` trước, cùng PR.

## 5. Việc chung

- **Sàn chạm px CSS thật (`BR-PSZ-04`)** — làm ở N; cảnh báo sàn lớn hơn làm ít slot vừa trang hơn, đo trước.
- **Entity a11y cho nút hành động** (GT-028, 034, 035, 036 chưa có) — làm ở shell, `aria-label` theo `commitIcon`, Enter gửi `commit`.
- **Gợi ý khi bước kế là nút hành động** — `getHintTarget()` có nhánh `{ kind: "action" }`, shell cho nút nháy; hiện GT-035/036 trả `null` nên gợi ý rơi mất.

## 6. Chưa xác nhận

- Số đếm 337 vs 398 của `check:hardcoded-params`.
- Cột `needs*` chưa đối chiếu phiếu engine.
- Chưa mở phiếu GT-000.
- Chưa thấy cổng hint-target đặt tên riêng ngoài `check:hint-target`.
