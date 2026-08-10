# Kế hoạch — Task #50: P2.8 — Duyệt, phát hành và nội dung SEO

> Viết 2026-08-10. Bước sở hữu: **P2.8** của
> [`14-implementation-sequence-todo.md`](14-implementation-sequence-todo.md).
> Spec sở hữu: [`content-review-queue.md`](../specs/06-admin/content-review-queue.md) ·
> [`publish-and-version.md`](../specs/06-admin/publish-and-version.md) ·
> [`seo-content-admin.md`](../specs/06-admin/seo-content-admin.md).
>
> ```
> export PATH=/Users/macbook/.nvm/versions/node/v24.15.0/bin:$PATH
> ```

## Tóm tắt

P2.6 cho Manager soạn được. Bước này quyết định **cái gì ra tới trẻ**, và nó là cổng người duy
nhất giữa studio và màn hình của một đứa trẻ.

Ba đặc điểm làm bước này khác các bước admin còn lại:

1. **Publish có hậu quả tức thì.** Không có môi trường staging cho nội dung — bấm publish là
   nội dung có hiệu lực cho phiên chơi mới ngay lập tức.
2. **Cổng người dễ bị vô hiệu hoá một cách hợp lý.** "Duyệt tất cả" tiết kiệm thời gian; "duyệt
   mà không mở preview" cũng vậy. Cả hai đều biến cổng thành hình thức, và cả hai đều là thứ
   người thật sẽ làm khi hàng đợi dài.
3. **Nội dung nền không đi qua đây.** `authored_in = 'repo_seed'` có cổng người riêng là PR
   review. Trộn hai đường là làm hỏng cả hai.

Bước này cũng trả nợ thẻ dashboard mà `D-IX` để `pending_source: P2.8`.

## 0. Điều kiện tiên quyết

| Dep | Trạng thái | Ghi chú |
|---|---|---|
| `CONTENT-LIFECYCLE` | P0.6 | máy trạng thái, checklist publish §7.3, `BR-CLC-09` |
| `CONTENT-VERSIONING` | P0.6 | `D-AE` mỗi version là một hàng riêng |
| `GAME-LEVEL-STUDIO` | P2.6 | nơi bản `in_review` đến từ |
| `LIVE-PREVIEW` | P2.6 | preview engine thật — điều kiện của `BR-CRQ-02` |
| `CONTENT-SEED-AUTHORING` | P1.10 | `authored_in`, `BR-CSA-11` lệch seeder |
| `SEO-AND-STRUCTURED-DATA` | P1.13 | schema `Course` · `Article` · `FAQPage` · `BreadcrumbList` |
| `ASSET-USAGE-TRACKING` | P2.7 | truy vấn ngược cho `BR-PUB-05` |
| Admin shell | P2.1 | thẻ "nội dung chờ duyệt" đang `pending_source` |

## 1. Đo được

### 1.1 Đã có

Máy trạng thái nội dung và checklist publish của P0.6; studio và preview của P2.6; `authored_in`
và ≥120 level `published` do seeder ghi; truy vấn ngược asset của P2.7; hạ tầng SEO công khai
của P1.13.

### 1.2 Chưa có

Hàng đợi duyệt; màn hình duyệt có checklist; thao tác publish/archive/rollback trong admin; màn
hình lịch sử version; toàn bộ bề mặt soạn trang SEO; và **ràng buộc DB** bảo đảm đúng một bản
`published` mỗi `code`.

### 1.3 Đã chốt, không mở lại

`BR-CLC-02` studio không publish trực tiếp · `D-AE` mỗi version một hàng · nội dung `repo_seed`
đi qua PR review, **không** qua hàng đợi này · `BR-CSA-11` sửa trong studio mà quên seeder là mất
bản sửa ở môi trường dựng mới · MVP một Manager nên cho tự duyệt bản mình tạo
([`content-lifecycle.md`](../specs/00-foundation/content-lifecycle.md) Q1 đã hoãn).

## 2. Quyết định

**D-KG — "Đã mở preview" là **bằng chứng do server cấp**, không phải state của client.**
`BR-CRQ-02` nói nút duyệt chỉ bật sau khi mở preview. Cài bằng một biến trong component nghĩa là
quy tắc biến mất khi gọi API trực tiếp — và ở một hàng đợi dài, gọi API trực tiếp là thứ sẽ xảy
ra. Xử: endpoint preview cấp `preview_token` gắn `(entity_type, id, version, manager_id)`, sống
ngắn; `POST .../transition` với `to_status = approved` **bắt buộc** kèm token hợp lệ; thiếu hoặc
sai entity → **422**. Ca âm: gọi approve bằng curl không có token → **422**, trạng thái không
đổi.

**D-KH — Từ chối hàng loạt là **endpoint riêng**; duyệt hàng loạt **không tồn tại**.** §7.3 cho
phép từ chối cả lô của một người soạn — đúng, vì 30 bản sai cùng một lỗi là một quyết định, không
phải 30. Nhưng `BR-CRQ-01` cấm duyệt theo lô, và cách hỏng là một endpoint nhận mảng id với
`to_status` tuỳ ý. Xử: hai endpoint tách hẳn — `transition` nhận **một** id; `bulk-reject` nhận
mảng id **và chỉ** chuyển sang `rejected`, kèm một lý do dùng chung, ghi **một hàng
`content_review_log` cho mỗi bản**. Cổng: không route nào nhận mảng id mà `to_status` có thể là
`approved` hay `published` → **đỏ**.

**D-KI — "Đúng một bản `published` mỗi `code`" ép bằng **ràng buộc DB**, không chỉ bằng
transaction.** `BR-PUB-02` nói publish và archive trong một transaction. Transaction đúng vẫn để
lọt hai bản `published` nếu có một đường ghi thứ hai — seeder, migration, script sửa dữ liệu.
Xử: partial unique index trên `(code) WHERE status = 'published'`; publish + archive vẫn trong
một transaction; ca âm — cố ghi bản thứ hai thành `published` bằng SQL thô → **DB từ chối**. Đây
là loại ràng buộc duy nhất còn đúng khi có người sửa dữ liệu bằng tay lúc 2 giờ sáng.

**D-KJ — Nhãn lệch seeder tính từ **seed manifest**, và thiếu manifest thì nói to.**
`BR-CRQ-05` đòi nhãn nêu **đường dẫn seeder file** cần sửa. Đoán đường dẫn từ `code` là đoán, và
đoán sai làm người duyệt sửa nhầm file. Xử: seeder P1.10 ghi manifest ánh xạ `code → file`; nhãn
đọc manifest. Không tìm thấy trong manifest → nhãn hiện **"không xác định được file seeder —
kiểm tay trước khi publish"**, hiển thị nổi bật. Cấm bỏ nhãn khi thiếu dữ liệu: một cảnh báo
vắng mặt bị đọc là "không có vấn đề".

**D-KK — Bốn tầng ưu tiên khai đủ; tầng phụ thuộc curriculum khai `pending_source: P3`.**
`BR-CRQ-08` xếp nội dung chặn tuần curriculum lên đầu — nhưng curriculum là **P3**, chưa tồn tại
ở bước này. Bỏ tầng đó đi rồi thêm lại sau là đổi hành vi sắp xếp giữa chừng. Xử: khai đủ bốn
tầng theo §7.1, tầng 1 vô hiệu với ghi chú bước sở hữu, đúng mẫu `D-IX` của P2.1; ở MVP thứ tự
thực tế là tầng 2 → 3 → 4. Cổng: bật tầng 1 mà chưa có nguồn dữ liệu → **đỏ**.

**D-KL — Rich text lọc theo allow-list **ở server**, cả lúc ghi và lúc render.** `BR-SEO-02` cấm
HTML tự do vì nó là đường XSS. Lọc chỉ khi ghi để lọt dữ liệu cũ hoặc dữ liệu vào từ đường khác;
lọc chỉ khi render thì DB chứa payload chờ một chỗ quên lọc. Xử: cùng một allow-list
(heading · đoạn · danh sách · link · ảnh) áp ở **cả hai** thời điểm; thẻ ngoài danh sách → **422**
lúc ghi và bị loại lúc render. Kèm theo: form soạn **không có** ô nhập JSON-LD — structured data
sinh từ dữ liệu (`BR-SEO-06`), cổng quét khẳng định.

## 3. Đồ thị

```
T1 hàng đợi + bốn tầng ưu tiên + bộ lọc (D-KK)
      └──→ T2 màn duyệt: preview_token · checklist 6 nhóm · nhãn AI/seeder (D-KG, D-KJ)
                └──→ T3 duyệt một bản · từ chối · từ chối hàng loạt (D-KH)
                          └──→ T4 publish · archive · rollback + partial unique index (D-KI)
                                    └──→ T5 lịch sử version + lượt chơi + diff
  T6 trang SEO: soạn · 301 · rich text · structured data · snippet (D-KL)
  T7 trả nợ dashboard + alerts.yml
                              ── Cổng dừng ──
                                    T8 evidence, promote 3 spec, nợ
```

## 4. Task

### Task 1 — Hàng đợi duyệt

**Tiêu chí nghiệm thu**
- [ ] `GET /api/managers/content/review-queue` cần `requireManagerAuth()`; cả `content_reviewer` và `super_admin` vào được.
- [ ] Hàng đợi **chỉ** chứa `status = in_review`; trần **50**, phân trang cursor.
- [ ] Ca âm quan trọng: seed vừa ghi 30 game level `published` với `authored_in = repo_seed` → **không bản nào** xuất hiện trong hàng đợi.
- [ ] `D-KK` + `BR-CRQ-08`: bốn tầng ưu tiên §7.1 khai đủ; tầng 1 (tuần curriculum thiếu hoạt động) khai `pending_source: P3`.
- [ ] `D-KK` cổng: bật tầng 1 khi chưa có nguồn dữ liệu → **đỏ**.
- [ ] Ca dương ưu tiên ở MVP: bản thuộc skill **chưa có level published** xếp trên bản lẻ cũ hơn.
- [ ] Bộ lọc §7.3 đủ, gồm `created_by_manager_id` và `origin`.
- [ ] Bản bị sửa sau khi vào hàng đợi → quay về `draft`, **rời** hàng đợi.

**Kiểm chứng**
- [ ] `pnpm test -- review-queue` xanh, assertion tham chiếu `BR-CRQ-08`.

**Phụ thuộc:** P0.6 · P2.6 · **Cỡ:** M

### Task 2 — Màn hình duyệt

**Tiêu chí nghiệm thu**
- [ ] Ba vùng: preview engine thật · checklist §7.2 · metadata.
- [ ] `D-KG`: endpoint preview cấp `preview_token` gắn `(entity_type, id, version, manager_id)`, sống ngắn.
- [ ] `BR-CRQ-02` ca âm giao diện: chưa mở preview → nút duyệt **vô hiệu**; mở preview → nút bật.
- [ ] `D-KG` ca âm API: approve bằng curl **không** kèm token → **422**, trạng thái không đổi.
- [ ] `BR-CRQ-07` ca âm: mở màn duyệt **bất kỳ loại nội dung nào** → đủ **6 nhóm** checklist; không rút gọn theo loại.
- [ ] `BR-CRQ-04`: bản `origin = ai_assisted` có nhãn rõ ràng, và checklist thêm mục "đối chiếu mục tiêu học tập".
- [ ] `D-KJ` + `BR-CRQ-05` ca dương: version mới của hàng `authored_in = repo_seed` → nhãn cảnh báo lệch seeder **kèm đường dẫn file** lấy từ manifest.
- [ ] `D-KJ` ca âm: `code` không có trong manifest → nhãn hiện "không xác định được file seeder", **không** ẩn nhãn đi.
- [ ] Lý do từ chối lần trước hiện lại cho người soạn ở lần sửa sau.
- [ ] Người duyệt là người tạo → cho phép ở MVP, ghi rõ **cả hai vai** trong log.

**Kiểm chứng**
- [ ] `pnpm test -- review-screen` xanh · `pnpm test:e2e -- content-review` xanh.

**Phụ thuộc:** T1 · **Cỡ:** L

### Task 3 — Quyết định duyệt và từ chối

**Tiêu chí nghiệm thu**
- [ ] `POST /api/managers/content/{type}/{id}/transition` nhận **một** id; `to_status = approved` bắt buộc kèm `{ checklist }` và `preview_token`.
- [ ] `BR-CRQ-03` ca âm: từ chối với `reason` rỗng → **422**, trạng thái không đổi; ngưỡng **10** ký tự.
- [ ] `BR-CRQ-01` ca âm giao diện: hàng đợi 20 bản → **không** nút "duyệt tất cả".
- [ ] `D-KH`: `bulk-reject` nhận mảng id, **chỉ** chuyển `rejected`, một lý do dùng chung.
- [ ] `D-KH` ca dương: 30 bản cùng `created_by_manager_id` → từ chối hàng loạt → cả 30 thành `rejected`, **mỗi bản một hàng** `content_review_log`.
- [ ] `D-KH` cổng: không route nào nhận mảng id mà `to_status` có thể là `approved` hoặc `published` → **đỏ**.
- [ ] `BR-CRQ-06`: mọi quyết định ghi `content_review_log` **và** `audit_logs`; `checklist_snapshot` lưu đủ 6 nhóm.

**Kiểm chứng**
- [ ] `pnpm test -- review-decision` xanh, assertion tham chiếu `BR-CRQ-01` `BR-CRQ-03` `BR-CRQ-06`.

**Phụ thuộc:** T2 · **Cỡ:** M

### Task 4 — Publish, archive, rollback

**Tiêu chí nghiệm thu**
- [ ] `D-KI`: partial unique index `(code) WHERE status = 'published'` có trong migration.
- [ ] `D-KI` ca âm: cố ghi bản thứ hai thành `published` bằng **SQL thô** → DB từ chối.
- [ ] `BR-PUB-02` ca dương: v1 published + v2 approved → publish v2 → đúng **một** hàng `published`, và đó là v2; v1 thành `archived`.
- [ ] `BR-PUB-01` ca âm: bản `approved` thiếu tag trục thinking → **422** `PUBLISH_CHECKLIST_FAILED`, `missing` chứa `tag_axis_thinking`; checklist chạy ở **server**.
- [ ] `BR-PUB-03` ca âm: `content_reviewer` gọi rollback → **403**.
- [ ] `BR-PUB-04` ca âm: có v1 v2 v3, đang chạy v3 → rollback về v2 → v2 `published`, v3 `archived`, **không** sinh hàng v4.
- [ ] `BR-PUB-05` ca âm: archive level nằm trong curriculum `published` → **409** `CONTENT_IN_USE` kèm danh sách; dùng lại truy vấn ngược của P2.7.
- [ ] `BR-PUB-06` ca âm: một trẻ đang chơi v3 → publish v4 → phiên đang chạy **tiếp tục**, kết quả ghi với `content_version = 3`.
- [ ] `BR-PUB-07`: màn hình publish hiện **diff field-by-field** so bản đang chạy — `content_pack` · `difficulty_params` · `skill_ids` · `access_tier` · `age`; **không** dump JSON thô.
- [ ] Xoá cứng chỉ khi **chưa từng** `published` **và** không có telemetry.
- [ ] `BR-PUB-08`: mọi thao tác ghi audit.

**Kiểm chứng**
- [ ] `pnpm test -- publish-version` xanh, assertion tham chiếu `BR-PUB-01`…`BR-PUB-07`.

**Phụ thuộc:** T3 · P2.7 · **Cỡ:** L

### Task 5 — Lịch sử version

**Tiêu chí nghiệm thu**
- [ ] `GET /api/managers/content/{type}/{code}/versions` trả đủ cột §7.1 kèm `content_review_log` mỗi bản.
- [ ] Cột **lượt chơi**: số phiên gắn với từng version; đọc từ rollup theo `D-IZ`, không quét bảng thô.
- [ ] §11 Q2 — rollback version đang chạy có nhiều lượt chơi → **modal xác nhận đỏ** nêu rõ số phiên bị ảnh hưởng.
- [ ] Nút rollback chỉ hiện với `super_admin`.
- [ ] Diff tóm tắt của mỗi version so version trước hiện ở cột "Thay đổi".

**Kiểm chứng**
- [ ] `pnpm test:e2e -- version-history` xanh.

**Phụ thuộc:** T4 · **Cỡ:** M

### Task 6 — Nội dung SEO

**Tiêu chí nghiệm thu**
- [ ] Năm loại trang §4.1: `competency` · `skill` · `age_program` · `topic` · `static`.
- [ ] Trường §7.1 đủ, gồm `faq_items[]`; `access_tier` luôn **`free`**.
- [ ] `BR-SEO-01` ca âm: đổi slug của trang đã published → truy cập slug cũ trả **301** tới slug mới.
- [ ] `D-KL` + `BR-SEO-02` ca âm hai vế: lưu body chứa thẻ `script` → **422** lúc ghi; và nếu dữ liệu cũ có thẻ lạ → bị loại lúc render.
- [ ] `BR-SEO-03` ca âm: trang nhúng một game level → level đổi tiêu đề và publish version mới → trang SEO hiện tiêu đề mới **mà không sửa gì**.
- [ ] `D-KL` + `BR-SEO-06` cổng: quét form soạn → **không** ô nhập JSON-LD thô; structured data sinh theo bảng §7.2.
- [ ] `BR-SEO-05`: `title` > 60 hoặc `meta_description` > 160 → **cảnh báo**, vẫn lưu được.
- [ ] `BR-SEO-04` ca âm: render trang chính sách → **không** request tới domain bên thứ ba.
- [ ] `BR-SEO-08`: cổng — trang SEO không mang nội dung nhắm tới trẻ; ràng buộc `access_tier = free` và review checklist phủ điều này.
- [ ] `BR-SEO-07`: trang SEO đi qua **cùng** vòng đời duyệt — xuất hiện trong hàng đợi của T1.
- [ ] Preview ba dạng §7.3: desktop · mobile · **snippet kết quả tìm kiếm** cắt đúng ngưỡng hiển thị.
- [ ] Slug trùng → **409** `CODE_ALREADY_EXISTS`.
- [ ] Nội dung nhúng bị archive → trang vẫn render, ẩn mục đó, **cảnh báo trong admin**.

**Kiểm chứng**
- [ ] `pnpm test -- seo-content-admin` xanh, assertion tham chiếu `BR-SEO-01` `BR-SEO-02` `BR-SEO-03` `BR-SEO-06`.

**Phụ thuộc:** T3 · P1.13 · **Cỡ:** L

### Task 7 — Trả nợ dashboard và alert

**Tiêu chí nghiệm thu**
- [ ] Thẻ **nội dung chờ duyệt** trên dashboard P2.1 gỡ `pending_source`, có nguồn thật.
- [ ] Ngưỡng cảnh báo **> 50** đúng theo registry `D-IX`; §5 của spec cũng nói vậy.
- [ ] Quy tắc alert "nội dung `in_review` tồn đọng" trong `alerts.yml` gỡ `pending_source: P2.8` mà P1.16 đã đặt.
- [ ] Ba thẻ phản hồi biên soạn của §7.3 dashboard vẫn đứng trên ba thẻ đếm.

**Kiểm chứng**
- [ ] `pnpm test -- dashboard-cards` xanh, in ra "2 thẻ pending_source" (giảm từ 3).

**Phụ thuộc:** T4 · **Cỡ:** S

### Cổng dừng

- [ ] Một level đi hết: soạn trong studio → gửi duyệt → xuất hiện trong hàng đợi → mở preview → tick 6 nhóm → duyệt → publish → **trẻ chơi được**.
- [ ] Gọi approve bằng curl không có `preview_token` → **422**.
- [ ] Không có đường nào duyệt theo lô; từ chối theo lô ghi đủ log từng bản.
- [ ] SQL thô không tạo được hai bản `published` cùng `code`.
- [ ] Trẻ đang chơi v3 không bị ngắt khi publish v4.
- [ ] Rollback không sinh version mới; `content_reviewer` bị 403.
- [ ] Nội dung `repo_seed` không xuất hiện trong hàng đợi.
- [ ] Đổi slug SEO tạo 301; thẻ `script` bị chặn ở cả ghi lẫn render.
- [ ] `pnpm check && pnpm test && pnpm test:e2e && pnpm lint:specs && pnpm check:progress` xanh.

### Task 8 — Evidence, promote và nợ chuyển tiếp

**Tiêu chí nghiệm thu**
- [ ] Mỗi `BR-CRQ-*` `BR-PUB-*` `BR-SEO-*` có ít nhất một test tham chiếu mã rule.
- [ ] Ba spec sang `implemented`.
- [ ] §11 Q1 của [`content-review-queue.md`](../specs/06-admin/content-review-queue.md) — **một người duyệt được bao nhiêu bản/ngày**. Đây là **ràng buộc thật của đường găng**, cùng họ với câu năng lực review ở [`content-seed-authoring.md`](../specs/01-platform/content-seed-authoring.md). Ghi ước tính 30–50 bản/ngày/người và nêu cho chủ; nó quyết định P3 chạy được bao nhanh.
- [ ] §11 Q2 (chặn tự duyệt khi có ≥2 manager) — trỏ về [`content-lifecycle.md`](../specs/00-foundation/content-lifecycle.md) Q1, giữ hoãn; MVP một người nên cho phép.
- [ ] §11 Q3 (duyệt hai vòng cho `ai_assisted`) — trỏ về [`content-seed-authoring.md`](../specs/01-platform/content-seed-authoring.md) Q5, giữ hoãn: một vòng có nhãn.
- [ ] §11 Q1 của [`publish-and-version.md`](../specs/06-admin/publish-and-version.md) (publish hẹn giờ) — đóng: hoãn **P4**.
- [ ] §11 Q2 (cảnh báo mạnh khi rollback version nhiều lượt chơi) — đóng: **có**, đã làm ở T5.
- [ ] §11 Q1 của [`seo-content-admin.md`](../specs/06-admin/seo-content-admin.md) (bao nhiêu trang SEO ở MVP) — đóng: **7 trang** (6 competency + trang chủ); 41 trang strand hoãn **P4**.
- [ ] §11 Q2 (dùng AI soạn mô tả SEO thành seeder) — đóng: **có**, qua quy trình seeder và PR review.
- [ ] Tick **P2.8** ở [`14-implementation-sequence-todo.md`](14-implementation-sequence-todo.md) khi `check:progress` tự xanh.

**Cỡ:** S

## 5. Rủi ro

| Rủi ro | Ảnh hưởng | Giảm thiểu |
|---|---|---|
| Duyệt mà không mở preview | Cổng người thành hình thức; level không chơi được ra tới trẻ | `D-KG` — bằng chứng do server cấp |
| Một endpoint nhận mảng id với `to_status` tuỳ ý | Duyệt theo lô lọt qua cửa sau | `D-KH` — hai endpoint tách hẳn, cổng quét |
| Hai bản cùng `published` | Hai bản cùng được phục vụ, không ai biết bản nào | `D-KI` — partial unique index |
| Sửa trong studio, quên sửa seeder | Môi trường dựng mới mất bản sửa (`BR-CSA-11`) | `D-KJ` — nhãn từ manifest, thiếu thì nói to |
| Nhãn cảnh báo vắng mặt khi thiếu dữ liệu | Vắng mặt bị đọc là "không có vấn đề" | `D-KJ` — luôn hiện, kể cả khi không xác định được |
| Tầng ưu tiên curriculum bật sớm | Sắp xếp theo dữ liệu chưa tồn tại | `D-KK` — `pending_source: P3` + cổng |
| HTML tự do trên trang SEO | XSS, và phá design system | `D-KL` — allow-list ở cả ghi lẫn render |
| JSON-LD gõ tay | Structured data lệch nội dung thật, phạt SEO | `BR-SEO-06` — cổng quét form |
| Publish ngắt phiên trẻ đang chơi | Trẻ mất tiến độ giữa chừng | `BR-PUB-06` — ca âm phiên đang chạy |
| Năng lực duyệt của người là trần thật | P3 chạy chậm hơn kế hoạch mà không ai gọi tên | §11 Q1 — nêu con số cho chủ |

## 6. Giả định

1. **P2.6 và P2.7 đã đóng** — studio, preview, và truy vấn ngược asset dùng được.
2. **Một Manager** — tự duyệt bản mình tạo được phép, ghi rõ hai vai.
3. **Chưa có curriculum** — tầng ưu tiên 1 khai `pending_source: P3`.
4. **Chưa có lesson và activity** — hàng đợi ở MVP chỉ có game level và trang SEO.
5. **Seeder có manifest** — nếu P1.10 chưa ghi manifest thì T2 phải bổ sung nó trước, không đoán đường dẫn.

## 7. Ngoài phạm vi

- Soạn nội dung — P2.6.
- Cờ tính năng và xuất dữ liệu — P2.9.
- Màn hình nhật ký — P2.10.
- Publish hẹn giờ — P4.
- 41 trang SEO theo strand — P4.
- Duyệt lesson, activity, curriculum — P3, dùng lại chính hàng đợi này.
- Quy trình 4-eyes khi có ≥2 Manager — hoãn, chủ là vòng đời nội dung.
