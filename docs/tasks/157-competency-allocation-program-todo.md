# Checklist — Task #157: Ma trận 6 lĩnh vực tư duy × band tuổi mầm non

> Kế hoạch: [`157-competency-allocation-program-plan.md`](157-competency-allocation-program-plan.md).
> Task này **chốt số và bản đồ**. Không viết mã cổng, không soạn level.
> Chặn [`Task #158`](158-engine-competency-allocation-todo.md) ·
> [`Task #159`](159-preschool-age-bands-todo.md) ·
> [`Task #160`](160-skill-age-progression-todo.md) ·
> [`Task #161`](161-cell-aware-level-generator-todo.md).
>
> Tuyệt đối: Cấm — NEVER cộng dồn 137 + 55 + 48. Cấm — NEVER hạ K để engine hết đỏ. Cấm — NEVER
> soạn level trong task này. Cấm — NEVER dùng trục tuổi để chặn ghi danh.
>
> `export PATH=/Users/macbook/.nvm/versions/node/v24.15.0/bin:$PATH`

## Preflight — đo lại bằng chứng của plan

- [x] `ALL_SEED_LEVELS` đếm được — kỳ vọng **228**.
- [x] Engine chạm đúng 1 lĩnh vực — kỳ vọng **19 / 27**.
- [x] Engine có band hợp lệ trống — kỳ vọng **4** (`GT-014` `GT-016` `GT-017` `GT-027`).
- [x] Tổng ô (engine × band hợp lệ) — kỳ vọng **74**.
- [x] Ô thiếu ở K = 3 — kỳ vọng **137**.
- [x] Lesson `published` — kỳ vọng **81**; cầu `CUR-J42` — kỳ vọng **126**.
- [x] Số lệch nào khác kỳ vọng thì **dừng lại và tìm nguyên nhân trước**, cấm — NEVER ghi đè con số.
- [x] Chụp danh sách `trạng-thái | tên-test` trước khi sửa.

## WP157.1 — Đo ngân sách hợp nhất

**Cỡ:** S · chỉ `packages/db/scripts/`

- [x] Script in bảng `engine | band | lĩnh vực đã có | lĩnh vực còn thiếu`.
- [x] Script đọc `banned_age_bands` từ registry, cấm — NEVER hằng số ba band.
- [x] Nguồn không đọc được thì script dừng mã ≠ 0, cấm — NEVER in bảng rỗng.
- [x] Giao tập 48 level của [`#124`](124-lesson-corpus-depth-todo.md) với tập ô trống: ................
- [x] Giao tập 55 level của [`#122`](122-engine-content-depth-todo.md) với tập ô trống: ................
- [x] **Một** con số ngân sách hợp nhất: ................
- [x] Trả lời `Q157-2`.

## WP157.2 — Bản đồ tương hợp 27 dòng

**Cỡ:** M · chỉ `packages/db/config/engine-competency-allocation.json` · **sư phạm duyệt**

- [x] Đọc mục 1 và mục 2 của cả 27 phiếu ở `docs/specs/01-platform/engines/` **trước** khi viết.
- [x] Mỗi engine khai **≥3** lĩnh vực phục vụ được.
- [x] Mỗi engine khai danh sách lĩnh vực **cấm** phục vụ.
- [x] Mỗi dòng có một câu lý do **neo vào `mechanic`**, cấm — NEVER lý do chung chung.
- [x] Đối chiếu ngược: mỗi lĩnh vực `C1`…`C6` được ≥3 engine phục vụ. Lĩnh vực chỉ một engine
      phục vụ là một điểm gãy — ghi lại, không tự sửa.
- [x] Engine không gánh nổi 3 lĩnh vực: liệt kê vào `Q157-3`, chuyển sang WP157.3.
- [x] Người sư phạm ký duyệt, ghi ngày vào tệp cấu hình.

## WP157.3 — Trần ngoại lệ

**Cỡ:** S · **người quyết**

- [x] Trần là **một con số**: ................ (đề xuất ≤8 trên 74 ô).
- [x] Khuôn ngoại lệ có đủ `engine` · `band` · `reason` · `decided_by` · `date`.
- [x] Ghi rõ trần là bậc thang **một chiều**, cùng cơ chế `BR-ECD-08`.
- [x] Trả lời `Q157-1`.

## WP157.4 — Sửa 27 plan + 27 todo

**Cỡ:** M · chỉ `docs/tasks/130-*` … `docs/tasks/156-*` — 54 tệp

Với **từng** tệp `-plan.md` (27 tệp):

- [x] Mục 2 — thêm hai dòng đo `competency_span` và `cell_fill` vào bảng bằng chứng.
- [x] `WP1nn.5` — đổi tiêu đề sang "Nội dung tới sàn bậc 1 và đủ ô ma trận".
- [x] `WP1nn.5` — thêm bảng ô mục tiêu lấy từ bản đồ WP157.2.
- [x] `WP1nn.5` — ghi số level phải soạn của **riêng** engine đó.
- [x] Mục 4 — thêm **điều kiện thứ 8**; bảy điều cũ giữ nguyên từng chữ.
- [x] Mục 5 Never — thêm *gắn level vào lĩnh vực ngoài bản đồ của engine*.
- [x] Mục 5 Ask first — thêm *khai ngoại lệ ô*.

Với **từng** tệp `-todo.md` (27 tệp):

- [x] Preflight — thêm dòng đo `competency_span` và `cell_fill`.
- [x] Mục `WP1nn.5` — thêm checkbox cho từng ô còn trống của engine đó.
- [x] Khối "Tuyệt đối" đầu tệp — thêm *cấm gắn lĩnh vực ngoài bản đồ*.

Sau khi ghi hết 54 tệp:

- [x] Đếm lại số dòng từng tệp — hook tự định dạng từng cắt mất thân tệp.
- [x] Đọc 5 dòng cuối của mỗi tệp, xác nhận không cụt.
- [x] Tự quét link tương đối bằng script — cổng link chết **không** phủ `docs/tasks/`.
- [x] Không ký hiệu bị cấm trong văn xuôi; dùng `Cấm — NEVER` (C14 của `lint:specs`).
- [x] Mọi tên tệp `.md` trong backtick là link (C15).

## WP157.5 — Rebase #122 và #124

**Cỡ:** S · chỉ `docs/tasks/122-*` và `docs/tasks/124-*`

- [x] [`#122`](122-engine-content-depth-todo.md) mục 2.3 — ngân sách đổi sang con số hợp nhất.
- [x] [`#122`](122-engine-content-depth-todo.md) — ghi rõ 137 **thay thế** 55, cấm — NEVER cộng.
- [x] [`#124`](124-lesson-corpus-depth-todo.md) — thêm WP rà 81 tiết theo contract band.
- [x] [`#124`](124-lesson-corpus-depth-todo.md) — ràng buộc 48 level mới rơi vào ô còn trống.
- [x] [`engine-content-depth.md`](../specs/05-content/engine-content-depth.md) — thêm **link**
      sang spec mới. Cấm — NEVER chép contract.
- [x] [`index.md`](../specs/index.md) và [`roadmap.md`](../specs/roadmap.md) — đăng ký ba spec mới.

## Đóng task

- [x] Sáu điều kiện nghiệm thu ở mục 5 của plan đều đúng.
- [x] `pnpm lint` xanh.
- [x] Danh sách `trạng-thái | tên-test` trùng khít trước/sau.
- [x] Ba câu hỏi mở `Q157-1` `Q157-2` `Q157-3` đã có câu trả lời ghi trong plan.
