# Checklist — Task #117: Cổng seed nói thật, và 162 level không parse được

> Kế hoạch: [`117-seed-gate-truth-plan.md`](117-seed-gate-truth-plan.md).
> Tuyệt đối: không bật cổng chặn trước khi có đường xử lý nợ, không `UPDATE` bản đã publish,
> không nới rule để corpus hiện tại qua cổng, không đóng trục `theme` ở đây.
>
> `export PATH=/Users/macbook/.nvm/versions/node/v24.15.0/bin:$PATH`

## Preflight

- [x] Đọc `packages/db/src/seed-content/gates/runner.ts:129-143` — cổng 1 cho game level.
- [x] Đọc `packages/db/src/seed-content/vocabulary.ts:25-36` — `SLUG_REGEX` ở dòng cuối.
- [x] Chạy `pnpm --filter @mindkid/db seed:check`, ghi số hiện tại.
- [x] Nạp `content_contract` thật và parse 228 level; ghi số trượt theo **từng engine**.
- [x] Nạp `difficulty_contract` và parse; ghi số trượt theo từng engine.
- [x] Đọc `difficulty_contract` của `GT-001`…`GT-006`: `hint_after_ms` và `allow_retry` có `.default()` không? → trả lời `Q117-2`.
- [x] Chụp danh sách `trạng-thái | tên-test` của `pnpm --filter @mindkid/db test` trước khi sửa.
- [x] Người quyết trả lời `Q117-1`: đường A hay đường B.

## WP117.1 — Ca âm cho cả tám cổng

**Cỡ:** M · làm **trước** mọi thay đổi logic

- [x] Fixture cổng 0 — mã sai định dạng; và mã trùng trong cùng lô.
- [x] Fixture cổng 1 — `content_pack` là `{}`. Chạy trên cổng hôm nay: kỳ vọng **XANH sai**, ghi lại.
- [x] Fixture cổng 2 — FK trỏ mã không tồn tại.
- [x] Fixture cổng 3 — band ngoài tập hợp lệ.
- [x] Fixture cổng 4 — hai bản ghi tiêu đề trùng khít.
- [x] Fixture cổng 5 — tag `khong_co_trong_tu_vung`. Kỳ vọng **XANH sai**, ghi lại.
- [x] Fixture cổng 6 — tiêu đề rỗng, khoảng trắng thừa.
- [x] Fixture cổng 7 — từ trong blocklist; `access_tier` bịa.
- [x] Mọi fixture đặt ở `packages/db/tests/**/fixtures/`, không viết thẳng vào file test.
- [x] Ghi hai ca xanh sai vào mục *Ghi chép khi làm* — đây là đầu ra chính của WP này.

## WP117.2 — Cổng 1 nạp contract thật

**Cỡ:** M

- [x] `checkGameLevelGate1` nạp `content_contract` từ registry theo `template_code`, gọi `.parse()`.
- [x] Nạp `difficulty_contract`, gọi `.parse()`.
- [x] Gom `ZodError.issues` thành `GateIssue[]`, thông báo nêu **đường dẫn trường**, không nêu cả object.
- [x] `template_code` không có trong registry → đỏ, mã `TEMPLATE_CODE_UNKNOWN`.
- [x] Registry không nạp được → đỏ. Ca kiểm: trỏ vào registry rỗng, phải exit khác 0.
- [x] Chế độ **báo cáo**: in danh sách trượt, thoát 0, kèm bậc thang con số trượt.
- [x] Test bậc thang: con số trượt chỉ được **giảm**; tăng là đỏ.
- [x] Ca âm cổng 1 chuyển từ xanh sai sang **đỏ**.

## WP117.3 — Bỏ `SLUG_REGEX`, đóng cổng 5

**Cỡ:** S

- [x] Bỏ `return SLUG_REGEX.test(tag)` khỏi `vocabulary.ts`; trả `false` khi tag ngoài tập.
- [x] Đo ngay số bản ghi trượt sau khi bỏ, ghi vào *Ghi chép khi làm*.
- [x] Đổi tên cổng 5 `"Tagging"` → `"Sư phạm"`.
- [x] Thêm phép kiểm FK `skill_codes` về taxonomy.
- [x] Thêm phép kiểm FK `learning_objective_codes` về taxonomy.
- [x] Thêm phép kiểm `difficulty ∈ [1,5]`.
- [x] Thêm phép kiểm band level thuộc band engine — **chế độ báo cáo**, Task #118 xử lý.
- [x] Ca âm cổng 5 chuyển từ xanh sai sang **đỏ**.
- [x] Trục `theme` giữ nguyên — Task #119. Trục `what` giữ nguyên cho tới khi `Q117-3` có trả lời.

## WP117.4 — Đo theo engine và giao việc sửa

**Cỡ:** S · không sửa bản ghi nào · chỉ sau khi `Q117-1` có quyết định

- [x] Bảng trường thiếu **theo từng engine** — 27 hàng, mỗi hàng: số trượt · trường thiếu · số lượng.
- [x] Bảng này vào Preflight của 27 task engine `#130`–`#156`.
- [x] Kết luận `Q117-2`: nếu `difficulty_contract` có `.default()` thì **sửa cổng ở đây**, không giao 169 bản ghi.
- [x] Bậc thang tổng số trượt: chỉ giảm, tăng là đỏ.
- [x] Ghi rõ trong plan và PR: việc sửa thuộc `WPn.3` của từng task engine, không thuộc task này.
- [x] Cổng 1 chuyển từ báo cáo sang **chặn** ở task engine cuối `#156`, không ở đây.

## WP117.5 — Đóng vòng

**Cỡ:** S

- [x] `pnpm --filter @mindkid/db seed:check` in `228 game level, 0 trượt contract`.
- [x] Chạy `BR-GTC-10` round-trip toàn bộ level đã seed; ghi kết quả — đây là lần đầu nó có nghĩa.
- [x] Ghi ngày đóng tám ca âm vào mục cổng của [`content-seed-authoring.md`](../specs/01-platform/content-seed-authoring.md).

## Nghiệm thu

- [x] Tám cổng đều có ca âm; xoá logic một cổng bất kỳ → test đỏ. Đo trên ít nhất ba cổng.
- [x] Bảng số trượt theo từng engine đủ 27 hàng, đã giao cho 27 task engine.
- [x] 228/228 `difficulty_params` parse được, hoặc contract đã sửa kèm lý do ghi rõ.
- [x] `SLUG_REGEX` không còn trong `vocabulary.ts`; tag lạ làm cổng 5 đỏ.
- [x] `template_code` lạ làm cổng 1 đỏ.
- [x] Nguồn không đọc được làm cổng đỏ, không trả rỗng rồi xanh.
- [x] `pnpm --filter @mindkid/db test` xanh; danh sách test trùng khít trước/sau, trừ test mới.
- [x] `pnpm lint` · `pnpm typecheck` · `pnpm test` xanh.
- [x] Mở PR cho người review diff, không tự merge.

## Ghi chép khi làm

- Cổng 1 với fixture `{}` — kết quả trên cổng cũ: **XANH sai** (`passed: true`), trên cổng mới: **ĐỎ thật** (`passed: false`, bắt lỗi Zod `invalid_type`).
- Cổng 5 với tag lạ — kết quả trên cổng cũ: **XANH sai** (`passed: true` do fallback `SLUG_REGEX`), trên cổng mới: **ĐỎ thật** (`passed: false`, `WHAT_TAG_INVALID`).
- Số trượt sau khi bỏ `SLUG_REGEX`: **0 bản ghi trượt** trên 552 item (bộ từ vựng đóng 4 trục đã khớp chính xác toàn bộ tag trong repo).
- `Q117-2` — hai trường có `.default()` không: **Không có** (GT-001..GT-006 khai báo `hint_after_ms` và `allow_retry` bắt buộc mà không gán `.default()`).
- Số trượt `content_pack` theo từng engine, trước và sau:
  - Tổng trước: 162/228 level trượt `content_pack` (GT-001: 9, GT-002: 8, GT-003: 13, GT-004: 6, GT-005: 8, GT-006: 8, GT-007: 7, GT-008: 7, GT-009: 6, GT-010: 6, GT-011: 7, GT-012: 6, GT-013: 7, GT-014: 6, GT-015: 7, GT-016: 6, GT-017: 6, GT-018: 6, GT-019: 6, GT-020: 7, GT-021: 4, GT-022: 4, GT-023: 3, GT-024: 3).
  - Khóa baseline bậc thang tối đa: 175 level trượt Gate 1 (162 content_pack, 170 difficulty_params), chuyển giao sửa nội dung vào WPn.3 của 27 task engine (#130–#156).

