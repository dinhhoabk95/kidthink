# Checklist — Task #57: P3.4 — Chạy lộ trình chương trình

> Kế hoạch: [`57-p3-4-curriculum-player-plan.md`](57-p3-4-curriculum-player-plan.md).
> Chỉ bắt đầu khi P3.3 (`Task #56`) `implemented`.
> Tuyệt đối: không ghim nhầm tầng, không để tuần toàn khoá tự mở, không nội dung thương mại
> trên bề mặt trẻ, không kéo adaptive của P3.5 lên sớm.
>
> ```sh
> export PATH=/Users/macbook/.nvm/versions/node/v24.15.0/bin:$PATH
> ```

## Preflight

- [x] P3.3 tick xong; hai spec curriculum `implemented`.
- [x] Có ≥1 curriculum `published` đủ `week_no`, `session_no`, band tuổi, `duration_weeks`.
- [x] P1.3 [`access-gating.md`](../specs/04-play/access-gating.md) gọi được **theo lô**, không
      chỉ một item.
- [x] P1.6 và P1.7 định nghĩa được "hoàn thành một item".
- [x] P1.8 [`parent-gate.md`](../specs/04-play/parent-gate.md) và
      [`healthy-play-limits.md`](../specs/04-play/healthy-play-limits.md) chạy.
- [x] P1.9 sảnh trẻ đã có.
- [x] Đo lại [`curriculum.ts`](../../packages/db/src/schema/curriculum.ts) sau P3.3.
- [x] Human approve `D-MA` · `D-MB` · `D-MC` · `D-MD` · `D-ME` · `D-MF` · `D-MG`.
- [x] `D-MB` và `D-ME` duyệt **riêng** — đổi hành vi người dùng.
- [x] Nhánh riêng.

## Cảnh báo sớm cho Task #56 — chạy trước mọi việc khác

- [x] Chốt `D-MB` **trước** Task #56 T2 tạo ràng buộc `curriculum_enrollments`.
- [x] Tối đa 1 `active`: unique một phần trên `(child_id)` khi `status = 'active'`.
- [x] Task #56 T2 **đã** chạy với dạng khác: ghi lại ràng buộc hiện có và chi phí sửa.
- [x] Chốt `paused` có luồng hay bị bỏ, trước khi Task #56 T2 tạo enum trạng thái.

---

## Task 1 — Sửa contract trước code

- [x] Bảng ba tầng ghim của `D-MA` vào
      [`curriculum-player.md`](../specs/04-play/curriculum-player.md) §7.
- [x] Ghi rõ mọi truy vấn player đi qua enrollment, không qua `child_profiles`.
- [x] Alt flow "ghi danh 2 curriculum" sửa khớp `D-MB`.
- [x] Câu hỏi mở số 2 đóng theo `D-MB`.
- [x] Rule mới cho `D-MD` (mẫu số giãn) có mã `BR-CUR-*` kế tiếp và lý do.
- [x] Rule mới cho `D-ME` (tuần toàn khoá) có mã `BR-CUR-*` kế tiếp và lý do.
- [x] Định nghĩa "bước hiện tại" viết lại theo `(week_no, session_no, position)`.
- [x] Acceptance criteria dùng `p_learn` chuyển thành nợ của P3.5, ghi rõ, **không xoá**.
- [x] `paused` có đúng một luồng đặt và một luồng thoát, hoặc bị bỏ.
- [x] Không thêm spec mới.
- [x] Không thêm mã lỗi ngoài [`error-codes.md`](../specs/00-foundation/error-codes.md).
- [x] `pnpm lint:specs` 0 lỗi, 0 cảnh báo mới.

## Checkpoint A — Contract

- [x] T0 và T1 xanh; `D-MB` đã phản hồi về Task #56.
- [x] Không migration, route hay UI nào viết trước checkpoint này.

---

## Task 2 — Ràng buộc idempotency và enrollment

- [x] **Test âm trước:** hai hàng `curriculum_item_progress` cùng
      `(enrollment_id, curriculum_item_id)` là **ĐỎ**.
- [x] Unique `(enrollment_id, curriculum_item_id)`.
- [x] Ghi hoàn thành bằng upsert; lần thứ hai không đổi `completed_at` đầu tiên.
- [x] `child_id` ở bảng con bị bỏ, hoặc có ràng buộc buộc khớp `enrollment.child_id`.
- [x] Ràng buộc `D-MB` có mặt, đúng dạng.
- [x] Task #56 đã tạo dạng khác thì migration sửa, và **abort** khi đã có dữ liệu ghi danh.
- [x] Index `(enrollment_id, status)`.
- [x] Index `(curriculum_id, week_no, session_no, position)`.
- [x] `pnpm db:migrate` trên DB rỗng xanh.
- [x] Ca lỗi rollback cả transaction.

## Task 3 — Engine bước kế tiếp và tiến độ

- [x] Bước hiện tại đúng `D-MG`.
- [x] Ca tuần thiếu buổi; ca buổi thiếu item.
- [x] Mẫu số theo `BR-CUR-07`, tính tại thời điểm đọc, **không lưu**.
- [x] `BR-CUR-03`: item tuỳ chọn không chặn mở tuần.
- [x] `D-MD`: nâng bậc làm tiến độ tụt; enrollment `completed` quay lại `active`.
- [x] `D-MD`: hạ bậc làm tiến độ đạt 1.0 nhưng **không** tự đặt `completed`.
- [x] `BR-CUR-08`: giả lập 3 tuần không chơi, vẫn đúng bước, không thông báo trách móc.
- [x] `D-MC`: ghi hoàn thành hai lần không đổi tử số.
- [x] `D-MA`: publish version mới của **lesson** thì trẻ thấy nội dung mới.
- [x] `D-MA`: publish version mới của **curriculum** thì trẻ giữ cấu trúc đã ghim.
- [x] `pnpm test -- curriculum-next curriculum-progress` xanh.

## Checkpoint B — Enrollment state và progress engine

- [x] Migration idempotency + engine next/progress cùng xanh.
- [x] Version ghim, mẫu số quyền và ca nghỉ dài có evidence.

## Task 4 — Ghi danh và rút

- [x] `POST .../enrollments` phân giải `curriculum_code` sang version `published` hiện tại và ghim.
- [x] 409 `ALREADY_ENROLLED` khi đã có enrollment `active`, kèm code đang học.
- [x] 422 khi tuổi trẻ ngoài `[target_age_min, target_age_max]`.
- [x] 422 khi trẻ không mở được item bắt buộc nào (`D-ME`), nêu lý do bậc.
- [x] Rút đặt `withdrawn` và **giữ** tiến độ.
- [x] Ghi danh lại tạo enrollment mới; không xoá bản cũ.
- [x] Mọi chuyển trạng thái enrollment ghi `audit_logs`.
- [x] `pnpm test -- enrollment` xanh.

## Task 5 — Gating theo lô và tuần khoá

- [x] Quyền cho toàn bộ item của một tuần kiểm **một lần theo lô**.
- [x] Test đếm truy vấn chứng minh không phải một truy vấn mỗi item.
- [x] `BR-CUR-05`: item khoá lẻ không chặn tiến độ.
- [x] `D-ME`: tuần mà mọi item bắt buộc đều khoá **không** tự mở tuần sau.
- [x] Trả `week_blocked_by_tier: true` trong ca đó.
- [x] Mở tuần kế tiếp cần hoàn thành ít nhất một item trong tuần hiện tại.
- [x] Item khoá vẫn hiện kèm ổ khoá trung tính.
- [x] `GET /curriculum/next` cho curriculum 42 tuần chạy dưới ngưỡng đã đặt.
- [x] `pnpm test -- curriculum-gating` xanh.

## Checkpoint C — Ghi danh và gating

- [x] Enrollment lifecycle + batch gating + tuần khoá cùng xanh.
- [x] Ownership/entitlement server-side; human review diff route.

## Task 6 — Chỗ nối adaptive

- [x] `selectVariant` tồn tại, mặc định trả chính item.
- [x] P3.4 **không** import [`adaptive-engine.md`](../specs/01-platform/adaptive-engine.md).
- [x] P3.4 **không** đọc mastery state.
- [x] **Test âm:** implementation giả cố nhảy bước làm test **ĐỎ** (`BR-CUR-02`).
- [x] Nợ ca kiểm `p_learn` ghi ở P3.5, có liên kết hai chiều giữa hai task.
- [x] `pnpm test -- curriculum-adaptive-seam` xanh.

## Task 7 — Sảnh trẻ và bề mặt người lớn

- [x] Thẻ "Tiếp tục" thêm vào sảnh trẻ đã có; không sảnh thứ hai.
- [x] `BR-CUR-01`: quét bề mặt trẻ, không control chọn tuần hay nhảy bước.
- [x] `BR-CUR-06`: bề mặt trẻ chỉ có ổ khoá trung tính, không giá, không nút mua.
- [x] Lời mời nâng cấp nằm sau cổng người lớn.
- [x] Màn hình hoàn thành hiện đúng lúc theo `D-MD`, kèm gợi ý curriculum tiếp.
- [x] Người lớn xem được tiến độ và tuần hiện tại.
- [x] Thông báo "có thêm nội dung mở khoá" chỉ ở bề mặt người lớn.
- [x] Không thông báo nào trách móc trẻ vì nghỉ lâu.
- [x] Bề mặt trẻ đạt [`accessibility.md`](../specs/08-quality/accessibility.md); không giả định
      trẻ biết đọc.
- [x] Player không nói ngược hạn mức giờ của
      [`healthy-play-limits.md`](../specs/04-play/healthy-play-limits.md).
- [x] `pnpm test:e2e -- curriculum-player` xanh.

## Checkpoint D — Player end-to-end

- [x] Seam adaptive không đổi bước; child/adult surfaces đúng ranh giới.
- [x] Journey 8 tuần, keyboard và no-reading-assumption xanh.

## Task 8 — Evidence và promote P3.4

- [x] Mỗi `BR-CUR-*` có ít nhất một test tham chiếu bằng mã rule trong tên test.
- [x] Một trẻ thật đi hết một curriculum 8 tuần từ ghi danh tới màn hình hoàn thành.
- [x] [`curriculum-player.md`](../specs/04-play/curriculum-player.md) → `implemented`.
- [x] Nợ ca kiểm adaptive ghi ở P3.5; không tick nhầm ở P3.4.
- [x] Tick **P3.4** trong Task #14 chỉ khi `pnpm check:progress` tự xanh.

## Cổng dừng cuối

- [x] `pnpm check` xanh.
- [x] `pnpm test` xanh.
- [x] `pnpm test:e2e` xanh.
- [x] `pnpm lint:specs` xanh.
- [x] `pnpm check:progress` xanh.
- [x] Human review diff migration, engine tiến độ và bề mặt trẻ.
- [x] Không phạm vi P3.5 lọt vào: không mastery, không `p_learn`, không chọn biến thể thật.
- [x] Không lịch, không hạn thời gian, không nhắc theo ngày.
- [x] Không auto-merge, không migration ngoài local.
