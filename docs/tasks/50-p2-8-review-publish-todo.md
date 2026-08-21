# Checklist — Task #50: P2.8 — Duyệt, phát hành và nội dung SEO

> Kế hoạch: [`50-p2-8-review-publish-plan.md`](50-p2-8-review-publish-plan.md).
> Đây là cổng người duy nhất giữa studio và màn hình của một đứa trẻ.
> Tuyệt đối: không duyệt theo lô (`D-KH`) · không duyệt mà chưa mở preview (`D-KG`) ·
> không hai bản cùng `published` (`D-KI`).
>
> ```
> export PATH=/Users/macbook/.nvm/versions/node/v24.15.0/bin:$PATH
> ```

## Preflight

- [x] **P2.6 và P2.7 đã đóng** — studio, preview, truy vấn ngược asset.
- [x] Seeder của P1.10 có **manifest** ánh xạ `code → file`; chưa có thì bổ sung trước T2.
- [x] Human approve kế hoạch và sáu quyết định D-KG · D-KH · D-KI · D-KJ · D-KK · D-KL.
- [x] Đối chiếu `BR-CRQ-*` `BR-PUB-*` `BR-SEO-*` với [`business-rules.md`](../specs/00-foundation/business-rules.md).
- [x] Tạo nhánh riêng.

---

### Task 1 — Hàng đợi duyệt

- [x] `GET .../review-queue` cho cả `content_reviewer` và `super_admin`.
- [x] Hàng đợi **chỉ** chứa `status = in_review`; trần **50**, cursor.
- [x] Ca âm: 30 level `repo_seed` vừa seed → **không bản nào** xuất hiện.
- [x] `D-KK`: bốn tầng ưu tiên §7.1 khai đủ.
- [x] `D-KK`: tầng 1 (tuần curriculum thiếu hoạt động) khai `pending_source: P3`.
- [x] `D-KK` cổng: bật tầng 1 khi chưa có nguồn → **đỏ**.
- [x] Ca dương: bản thuộc skill chưa có level published xếp **trên** bản lẻ cũ hơn.
- [x] Bộ lọc §7.3 đủ, gồm `created_by_manager_id` và `origin`.
- [x] Bản bị sửa sau khi vào hàng đợi → về `draft`, **rời** hàng đợi.

### Task 2 — Màn hình duyệt

- [x] `T2a` (M): preview-token binding + review projection/six-group contract, PR riêng.
- [x] `T2b` (M): review UI/labels/reason/dual-role + E2E, sau T2a.
- [x] Ba vùng: preview engine thật · checklist §7.2 · metadata.
- [x] `D-KG`: preview cấp `preview_token` gắn `(entity_type, id, version, manager_id)`.
- [x] `BR-CRQ-02` ca âm UI: chưa mở preview → nút duyệt **vô hiệu**.
- [x] `BR-CRQ-02` ca dương: mở preview → nút bật.
- [x] `D-KG` ca âm API: approve bằng curl không kèm token → **422**, trạng thái không đổi.
- [x] `BR-CRQ-07` ca âm: mọi loại nội dung → đủ **6 nhóm** checklist, không rút gọn.
- [x] `BR-CRQ-04`: bản `ai_assisted` có nhãn rõ + mục "đối chiếu mục tiêu học tập".
- [x] `D-KJ` ca dương: version mới của `repo_seed` → nhãn lệch seeder **kèm đường dẫn file** từ manifest.
- [x] `D-KJ` ca âm: `code` không có trong manifest → nhãn "không xác định được file seeder".
- [x] Ca âm: nhãn **không** bị ẩn khi thiếu dữ liệu.
- [x] Lý do từ chối lần trước hiện lại cho người soạn.
- [x] Người duyệt là người tạo → cho phép, ghi rõ **cả hai vai**.

### Task 3 — Quyết định duyệt và từ chối

- [x] `transition` nhận **một** id.
- [x] `to_status = approved` bắt buộc kèm `{ checklist }` và `preview_token`.
- [x] `BR-CRQ-03` ca âm: `reason` rỗng → **422**, trạng thái không đổi.
- [x] `BR-CRQ-01` ca âm UI: 20 bản trong hàng đợi → **không** nút "duyệt tất cả".
- [x] `D-KH`: `bulk-reject` nhận mảng id, **chỉ** chuyển `rejected`.
- [x] `D-KH` ca dương: 30 bản cùng người soạn → cả 30 `rejected`.
- [x] `D-KH`: **mỗi bản một hàng** `content_review_log`.
- [x] `D-KH` cổng: không route nào nhận mảng id với `to_status` là `approved`/`published`.
- [x] `BR-CRQ-06`: mọi quyết định ghi `content_review_log` **và** `audit_logs`.
- [x] `checklist_snapshot` lưu đủ 6 nhóm.

### Task 4 — Publish, archive, rollback

- [x] `T4a` (M): DB invariant + publish/archive/checklist transaction, SQL-thô test cùng PR.
- [x] `T4b` (M): rollback/in-use/active-session + diff/delete/audit integration, sau T4a.
- [x] `D-KI`: partial unique index `(code) WHERE status = 'published'` trong migration.
- [x] `D-KI` ca âm: ghi bản thứ hai thành `published` bằng **SQL thô** → DB từ chối.
- [x] `BR-PUB-02` ca dương: publish v2 → đúng **một** hàng `published` là v2; v1 `archived`.
- [x] `BR-PUB-01` ca âm: thiếu tag trục thinking → **422** `PUBLISH_CHECKLIST_FAILED`.
- [x] `missing` chứa `tag_axis_thinking`; checklist chạy ở **server**.
- [x] `BR-PUB-03` ca âm: `content_reviewer` rollback → **403**.
- [x] `BR-PUB-04` ca âm: rollback v3 → v2 → **không** sinh hàng v4.
- [x] `BR-PUB-05` ca âm: archive level trong curriculum published → **409** + danh sách.
- [x] `BR-PUB-06` ca âm: trẻ đang chơi v3, publish v4 → phiên **tiếp tục**, ghi `content_version = 3`.
- [x] `BR-PUB-07`: diff **field-by-field**, không dump JSON thô.
- [x] Xoá cứng chỉ khi **chưa từng** published **và** không telemetry.
- [x] `BR-PUB-08`: mọi thao tác ghi audit.

### Task 5 — Lịch sử version

- [x] `GET .../versions` trả đủ cột §7.1 kèm `content_review_log`.
- [x] Cột **lượt chơi** đọc từ rollup theo `D-IZ`, không quét bảng thô.
- [x] Rollback version nhiều lượt chơi → **modal xác nhận đỏ** nêu số phiên bị ảnh hưởng.
- [x] Nút rollback chỉ hiện với `super_admin`.
- [x] Cột "Thay đổi" hiện diff tóm tắt so version trước.

### Task 6 — Nội dung SEO

- [x] `T6a` (M): model/API/sanitizer/slug/embed/structured-data contract, PR riêng.
- [x] `T6b` (M): studio/three previews/review queue/archive warning + E2E, sau T6a.
- [x] Năm loại trang: `competency` · `skill` · `age_program` · `topic` · `static`.
- [x] Trường §7.1 đủ gồm `faq_items[]`; `access_tier` luôn **`free`**.
- [x] `BR-SEO-01` ca âm: đổi slug đã published → slug cũ trả **301**.
- [x] `D-KL` ca âm 1: lưu body chứa thẻ `script` → **422**.
- [x] `D-KL` ca âm 2: dữ liệu cũ có thẻ lạ → bị loại **lúc render**.
- [x] `BR-SEO-03` ca âm: level đổi tiêu đề → trang SEO hiện tiêu đề mới **không sửa gì**.
- [x] `BR-SEO-06` cổng: form soạn **không** có ô nhập JSON-LD thô.
- [x] Structured data sinh theo bảng §7.2.
- [x] `BR-SEO-05`: `title` > 60 hoặc `meta_description` > 160 → cảnh báo, vẫn lưu.
- [x] `BR-SEO-04` ca âm: trang chính sách → **không** request domain bên thứ ba.
- [x] `BR-SEO-08`: trang SEO không mang nội dung nhắm tới trẻ.
- [x] `BR-SEO-07`: trang SEO xuất hiện trong hàng đợi duyệt của T1.
- [x] Preview ba dạng: desktop · mobile · **snippet** cắt đúng ngưỡng.
- [x] Slug trùng → **409** `CODE_ALREADY_EXISTS`.
- [x] Nội dung nhúng bị archive → trang vẫn render, ẩn mục đó, cảnh báo trong admin.

### Task 7 — Trả nợ dashboard và alert

- [x] Thẻ **nội dung chờ duyệt** gỡ `pending_source`, có nguồn thật.
- [x] Ngưỡng cảnh báo **> 50** đúng registry `D-IX`.
- [x] Quy tắc alert "nội dung `in_review` tồn đọng" gỡ `pending_source: P2.8`.
- [x] Ba thẻ phản hồi biên soạn vẫn đứng trên ba thẻ đếm.
- [x] `pnpm test -- dashboard-cards` in ra "2 thẻ pending_source".

## Cổng dừng

- [x] Một level đi hết: soạn → gửi duyệt → hàng đợi → mở preview → tick 6 nhóm → duyệt → publish → **trẻ chơi được**.
- [x] Approve bằng curl không có `preview_token` → **422**.
- [x] Không đường nào duyệt theo lô; từ chối theo lô ghi đủ log từng bản.
- [x] SQL thô không tạo được hai bản `published` cùng `code`.
- [x] Trẻ đang chơi v3 không bị ngắt khi publish v4.
- [x] Rollback không sinh version mới; `content_reviewer` bị **403**.
- [x] Nội dung `repo_seed` không xuất hiện trong hàng đợi.
- [x] Đổi slug SEO tạo 301; thẻ `script` bị chặn ở cả ghi lẫn render.
- [x] `pnpm check && pnpm test && pnpm test:e2e && pnpm --filter @mindkid/gates test && node packages/gates/scripts/check-progress.ts` xanh.

---

## Task 8 — Evidence, promote và nợ chuyển tiếp

- [x] Mỗi `BR-CRQ-*` có test tham chiếu mã rule.
- [x] Mỗi `BR-PUB-*` có test tham chiếu mã rule.
- [x] Mỗi `BR-SEO-*` có test tham chiếu mã rule.
- [x] [`content-review-queue.md`](../specs/06-admin/content-review-queue.md) → `implemented`.
- [x] [`publish-and-version.md`](../specs/06-admin/publish-and-version.md) → `implemented`.
- [x] [`seo-content-admin.md`](../specs/06-admin/seo-content-admin.md) → `implemented`.
- [x] Tick **P2.8** ở [`14-implementation-sequence-todo.md`](14-implementation-sequence-todo.md) khi `check:progress` tự xanh.

## Câu hỏi mở chuyển tiếp

- [x] **Một người duyệt được bao nhiêu bản/ngày** — ràng buộc thật của đường găng. Ghi ước tính **30–50 bản/ngày/người**, nêu cho chủ; nó quyết định P3 chạy được bao nhanh.
- [x] **Chặn tự duyệt khi có ≥2 manager** — giữ hoãn, chủ là [`content-lifecycle.md`](../specs/00-foundation/content-lifecycle.md) Q1.
- [x] **Duyệt hai vòng cho `ai_assisted`** — giữ hoãn: một vòng có nhãn, chủ là [`content-seed-authoring.md`](../specs/01-platform/content-seed-authoring.md) Q5.
- [x] **Publish hẹn giờ** — hoãn P4.
- [x] **Cảnh báo mạnh khi rollback version nhiều lượt chơi** — **có**, làm ở T5.
- [x] **Bao nhiêu trang SEO ở MVP** — **7 trang** (6 competency + trang chủ); 41 trang strand hoãn P4.
- [x] **Dùng AI soạn mô tả SEO thành seeder** — **có**, qua seeder và PR review.
