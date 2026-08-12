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

- [ ] P3.3 tick xong; hai spec curriculum `implemented`.
- [ ] Có ≥1 curriculum `published` đủ `week_no`, `session_no`, band tuổi, `duration_weeks`.
- [ ] P1.3 [`access-gating.md`](../specs/04-play/access-gating.md) gọi được **theo lô**, không
      chỉ một item.
- [ ] P1.6 và P1.7 định nghĩa được "hoàn thành một item".
- [ ] P1.8 [`parent-gate.md`](../specs/04-play/parent-gate.md) và
      [`healthy-play-limits.md`](../specs/04-play/healthy-play-limits.md) chạy.
- [ ] P1.9 sảnh trẻ đã có.
- [ ] Đo lại [`curriculum.ts`](../../packages/db/src/schema/curriculum.ts) sau P3.3.
- [ ] Human approve `D-MA` · `D-MB` · `D-MC` · `D-MD` · `D-ME` · `D-MF` · `D-MG`.
- [ ] `D-MB` và `D-ME` duyệt **riêng** — đổi hành vi người dùng.
- [ ] Nhánh riêng.

## Cảnh báo sớm cho Task #56 — chạy trước mọi việc khác

- [ ] Chốt `D-MB` **trước** Task #56 T2 tạo ràng buộc `curriculum_enrollments`.
- [ ] Tối đa 1 `active`: unique một phần trên `(child_id)` khi `status = 'active'`.
- [ ] Task #56 T2 **đã** chạy với dạng khác: ghi lại ràng buộc hiện có và chi phí sửa.
- [ ] Chốt `paused` có luồng hay bị bỏ, trước khi Task #56 T2 tạo enum trạng thái.

---

## Task 1 — Sửa contract trước code

- [ ] Bảng ba tầng ghim của `D-MA` vào
      [`curriculum-player.md`](../specs/04-play/curriculum-player.md) §7.
- [ ] Ghi rõ mọi truy vấn player đi qua enrollment, không qua `child_profiles`.
- [ ] Alt flow "ghi danh 2 curriculum" sửa khớp `D-MB`.
- [ ] Câu hỏi mở số 2 đóng theo `D-MB`.
- [ ] Rule mới cho `D-MD` (mẫu số giãn) có mã `BR-CUR-*` kế tiếp và lý do.
- [ ] Rule mới cho `D-ME` (tuần toàn khoá) có mã `BR-CUR-*` kế tiếp và lý do.
- [ ] Định nghĩa "bước hiện tại" viết lại theo `(week_no, session_no, position)`.
- [ ] Acceptance criteria dùng `p_learn` chuyển thành nợ của P3.5, ghi rõ, **không xoá**.
- [ ] `paused` có đúng một luồng đặt và một luồng thoát, hoặc bị bỏ.
- [ ] Không thêm spec mới.
- [ ] Không thêm mã lỗi ngoài [`error-codes.md`](../specs/00-foundation/error-codes.md).
- [ ] `pnpm lint:specs` 0 lỗi, 0 cảnh báo mới.

## Checkpoint A — Contract

- [ ] T0 và T1 xanh; `D-MB` đã phản hồi về Task #56.
- [ ] Không migration, route hay UI nào viết trước checkpoint này.

---

## Task 2 — Ràng buộc idempotency và enrollment

- [ ] **Test âm trước:** hai hàng `curriculum_item_progress` cùng
      `(enrollment_id, curriculum_item_id)` là **ĐỎ**.
- [ ] Unique `(enrollment_id, curriculum_item_id)`.
- [ ] Ghi hoàn thành bằng upsert; lần thứ hai không đổi `completed_at` đầu tiên.
- [ ] `child_id` ở bảng con bị bỏ, hoặc có ràng buộc buộc khớp `enrollment.child_id`.
- [ ] Ràng buộc `D-MB` có mặt, đúng dạng.
- [ ] Task #56 đã tạo dạng khác thì migration sửa, và **abort** khi đã có dữ liệu ghi danh.
- [ ] Index `(enrollment_id, status)`.
- [ ] Index `(curriculum_id, week_no, session_no, position)`.
- [ ] `pnpm db:migrate` trên DB rỗng xanh.
- [ ] Ca lỗi rollback cả transaction.

## Task 3 — Engine bước kế tiếp và tiến độ

- [ ] Bước hiện tại đúng `D-MG`.
- [ ] Ca tuần thiếu buổi; ca buổi thiếu item.
- [ ] Mẫu số theo `BR-CUR-07`, tính tại thời điểm đọc, **không lưu**.
- [ ] `BR-CUR-03`: item tuỳ chọn không chặn mở tuần.
- [ ] `D-MD`: nâng bậc làm tiến độ tụt; enrollment `completed` quay lại `active`.
- [ ] `D-MD`: hạ bậc làm tiến độ đạt 1.0 nhưng **không** tự đặt `completed`.
- [ ] `BR-CUR-08`: giả lập 3 tuần không chơi, vẫn đúng bước, không thông báo trách móc.
- [ ] `D-MC`: ghi hoàn thành hai lần không đổi tử số.
- [ ] `D-MA`: publish version mới của **lesson** thì trẻ thấy nội dung mới.
- [ ] `D-MA`: publish version mới của **curriculum** thì trẻ giữ cấu trúc đã ghim.
- [ ] `pnpm test -- curriculum-next curriculum-progress` xanh.

## Checkpoint B — Enrollment state và progress engine

- [ ] Migration idempotency + engine next/progress cùng xanh.
- [ ] Version ghim, mẫu số quyền và ca nghỉ dài có evidence.

## Task 4 — Ghi danh và rút

- [ ] `POST .../enrollments` phân giải `curriculum_code` sang version `published` hiện tại và ghim.
- [ ] 409 `ALREADY_ENROLLED` khi đã có enrollment `active`, kèm code đang học.
- [ ] 422 khi tuổi trẻ ngoài `[target_age_min, target_age_max]`.
- [ ] 422 khi trẻ không mở được item bắt buộc nào (`D-ME`), nêu lý do bậc.
- [ ] Rút đặt `withdrawn` và **giữ** tiến độ.
- [ ] Ghi danh lại tạo enrollment mới; không xoá bản cũ.
- [ ] Mọi chuyển trạng thái enrollment ghi `audit_logs`.
- [ ] `pnpm test -- enrollment` xanh.

## Task 5 — Gating theo lô và tuần khoá

- [ ] Quyền cho toàn bộ item của một tuần kiểm **một lần theo lô**.
- [ ] Test đếm truy vấn chứng minh không phải một truy vấn mỗi item.
- [ ] `BR-CUR-05`: item khoá lẻ không chặn tiến độ.
- [ ] `D-ME`: tuần mà mọi item bắt buộc đều khoá **không** tự mở tuần sau.
- [ ] Trả `week_blocked_by_tier: true` trong ca đó.
- [ ] Mở tuần kế tiếp cần hoàn thành ít nhất một item trong tuần hiện tại.
- [ ] Item khoá vẫn hiện kèm ổ khoá trung tính.
- [ ] `GET /curriculum/next` cho curriculum 42 tuần chạy dưới ngưỡng đã đặt.
- [ ] `pnpm test -- curriculum-gating` xanh.

## Checkpoint C — Ghi danh và gating

- [ ] Enrollment lifecycle + batch gating + tuần khoá cùng xanh.
- [ ] Ownership/entitlement server-side; human review diff route.

## Task 6 — Chỗ nối adaptive

- [ ] `selectVariant` tồn tại, mặc định trả chính item.
- [ ] P3.4 **không** import [`adaptive-engine.md`](../specs/01-platform/adaptive-engine.md).
- [ ] P3.4 **không** đọc mastery state.
- [ ] **Test âm:** implementation giả cố nhảy bước làm test **ĐỎ** (`BR-CUR-02`).
- [ ] Nợ ca kiểm `p_learn` ghi ở P3.5, có liên kết hai chiều giữa hai task.
- [ ] `pnpm test -- curriculum-adaptive-seam` xanh.

## Task 7 — Sảnh trẻ và bề mặt người lớn

- [ ] Thẻ "Tiếp tục" thêm vào sảnh trẻ đã có; không sảnh thứ hai.
- [ ] `BR-CUR-01`: quét bề mặt trẻ, không control chọn tuần hay nhảy bước.
- [ ] `BR-CUR-06`: bề mặt trẻ chỉ có ổ khoá trung tính, không giá, không nút mua.
- [ ] Lời mời nâng cấp nằm sau cổng người lớn.
- [ ] Màn hình hoàn thành hiện đúng lúc theo `D-MD`, kèm gợi ý curriculum tiếp.
- [ ] Người lớn xem được tiến độ và tuần hiện tại.
- [ ] Thông báo "có thêm nội dung mở khoá" chỉ ở bề mặt người lớn.
- [ ] Không thông báo nào trách móc trẻ vì nghỉ lâu.
- [ ] Bề mặt trẻ đạt [`accessibility.md`](../specs/08-quality/accessibility.md); không giả định
      trẻ biết đọc.
- [ ] Player không nói ngược hạn mức giờ của
      [`healthy-play-limits.md`](../specs/04-play/healthy-play-limits.md).
- [ ] `pnpm test:e2e -- curriculum-player` xanh.

## Checkpoint D — Player end-to-end

- [ ] Seam adaptive không đổi bước; child/adult surfaces đúng ranh giới.
- [ ] Journey 8 tuần, keyboard và no-reading-assumption xanh.

## Task 8 — Evidence và promote P3.4

- [ ] Mỗi `BR-CUR-*` có ít nhất một test tham chiếu bằng mã rule trong tên test.
- [ ] Một trẻ thật đi hết một curriculum 8 tuần từ ghi danh tới màn hình hoàn thành.
- [ ] [`curriculum-player.md`](../specs/04-play/curriculum-player.md) → `implemented`.
- [ ] Nợ ca kiểm adaptive ghi ở P3.5; không tick nhầm ở P3.4.
- [ ] Tick **P3.4** trong Task #14 chỉ khi `pnpm check:progress` tự xanh.

## Cổng dừng cuối

- [ ] `pnpm check` xanh.
- [ ] `pnpm test` xanh.
- [ ] `pnpm test:e2e` xanh.
- [ ] `pnpm lint:specs` xanh.
- [ ] `pnpm check:progress` xanh.
- [ ] Human review diff migration, engine tiến độ và bề mặt trẻ.
- [ ] Không phạm vi P3.5 lọt vào: không mastery, không `p_learn`, không chọn biến thể thật.
- [ ] Không lịch, không hạn thời gian, không nhắc theo ngày.
- [ ] Không auto-merge, không migration ngoài local.
