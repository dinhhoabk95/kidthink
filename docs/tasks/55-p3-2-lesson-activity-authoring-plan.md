# Kế hoạch — Task #55: P3.2 — Studio soạn lesson và activity

> Viết 2026-08-11, đo tại commit `484ebaf` trên working tree đang triển khai P0.9.
> Bước sở hữu: **P3.2** của
> [`14-implementation-sequence-todo.md`](14-implementation-sequence-todo.md).
> Spec sở hữu: [`lesson-authoring.md`](../specs/06-admin/lesson-authoring.md) ·
> [`activity-authoring.md`](../specs/06-admin/activity-authoring.md).
> Task trước: [`54-p3-1-lesson-activity-plan.md`](54-p3-1-lesson-activity-plan.md).
>
> ```sh
> export PATH=/Users/macbook/.nvm/versions/node/v24.15.0/bin:$PATH
> ```

## Tóm tắt

P3.1 giao **model, validator và 126 lesson nền qua seeder**. P3.2 giao **công cụ để người soạn
tiếp lesson thứ 127** — hai màn studio, đường ghi có kiểm, và một cổng duyệt nhận được loại nội
dung mới. Đây là ranh giới quyết định phạm vi: Task #55 không sinh nội dung, không tính bằng số
lesson.

Ba nhóm việc chi phối thứ tự:

1. **Sửa hợp đồng trước.** Bảy mâu thuẫn đo được ở mục 1 nằm giữa hai spec P3.2, hai spec model
   P3.1 và ba spec P0/P2. Viết route trước khi đóng chúng là chọn ngầm một cách hiểu rồi để nó
   thành sự thật.
2. **Cổng duyệt hiện không nhận được lesson và activity.**
   [`content-review-queue.md`](../specs/06-admin/content-review-queue.md) bắt người duyệt mở
   preview engine trước khi nút duyệt bật, và bắt hiện đủ một checklist viết cho game level.
   Lesson không có engine. Không sửa hai chỗ đó thì `draft → in_review → approved` của lesson là
   đường cụt, và cách thoát rẻ tiền nhất — bỏ cổng — là bỏ đúng thứ cổng đó tồn tại để chặn.
3. **Lắp activity vào lesson là thao tác nhiều hàng.** Bảng `lesson_activities` hiện có khoá
   chính `(lesson_id, position)` và không có `expected_version` trên route sắp xếp. Kéo thả là
   tính năng chính của màn soạn lesson, và nó đang không có đường ghi an toàn.

Task #55 chỉ được **lập hồ sơ trước**. Code không bắt đầu cho tới khi cổng ra P2 xanh và P3.1
`implemented`.

## 0. Điều kiện tiên quyết

### 0.1 Phụ thuộc và điều kiện vào

| Phụ thuộc | Bước | Điều kiện vào Task 2 trở đi |
|---|---|---|
| P3.1 | P3.1 | [`lesson-model.md`](../specs/05-content/lesson-model.md) và [`activity-model.md`](../specs/05-content/activity-model.md) `implemented`; enum 10 kind đã căn; validator dùng chung đã có |
| `CONTENT-LIFECYCLE` | P0.6 | Route transition chung chạy; `content_review_log` INSERT-only |
| `CONTENT-VERSIONING` | P0.6 | Copy-on-write và phân giải `entity_id` theo `D-AE` |
| `CONTENT-TAGGING` | P1.10 | Ghi tag ba trục dùng được cho lesson và activity |
| `CONTENT-SEARCH` | P1.11b | Cursor, trần chung và phạm vi theo actor đã chạy |
| `SCHEMA-DRIVEN-FORM` | P2.5 | `zodIntrospect` và `configDictionary` chạy được ngoài phạm vi template |
| `GAME-LEVEL-STUDIO` · `LIVE-PREVIEW` | P2.6 | Autosave, `expected_version`, preview engine đã ship |
| `CONTENT-REVIEW-QUEUE` · `PUBLISH-AND-VERSION` | P2.8 | Hàng đợi, checklist snapshot, review log đã chạy cho game level |
| `FEATURE-FLAG-SERVICE` | P2.9 | Cờ đọc được ở server để khoá `kind = worksheet` |
| `AUDIT-LOG` | P0.11 | Action content đã đăng ký |
| Nhóm Nội dung | — | Có reviewer sư phạm; P3.2 nghiệm thu bằng người soạn thật, không bằng fixture |

**Stop condition:** trước Task 2, nếu một phụ thuộc trên chưa `implemented` thì dừng Task #55.
Sửa ở task sở hữu phụ thuộc; không viết bản thứ hai trong P3.2.

### 0.2 Đo lại trước khi code

Mọi trích dẫn `file:line` ở mục 1 là hình dạng tại commit `484ebaf`. P3.1 sẽ đổi
[`content.ts`](../../packages/db/src/schema/content.ts) và
[`publish-checklist.ts`](../../packages/shared/src/publish-checklist.ts). Preflight phải đo lại
và ghi đè số đo, không đọc mục 1 như bằng chứng code hiện tại.

## 1. Đo được

### 1.1 Bảng "Bắt buộc" của khung lesson không đọc được

[`lesson-authoring.md`](../specs/06-admin/lesson-authoring.md) §7.1 có cột `Bắt buộc` mang giá
trị `Cấm` cho năm trường: `materials`, `warm_up`, `reflection`, `assessment`,
`extension`. Các trường còn lại có ô **rỗng**.

[`CONVENTIONS.md`](../specs/CONVENTIONS.md) §11.1 quy định ô bảng nhị phân chỉ nhận `Có` hoặc
`Không`, và dịch dấu phủ định emoji thành `"Không …"` hoặc `"Cấm …"` **tuỳ ngữ cảnh**. §11.6 của
cùng file cấm thay thế hàng loạt bằng `sed` đúng vì lý do này. Đối chiếu ba bảng `Bắt buộc` khác
trong corpus cho ra kết luận chắc chắn:

| Nguồn | Giá trị | Đọc được |
|---|---|---|
| [`child-data-compliance.md`](../specs/00-foundation/child-data-compliance.md) §7 | `Có` · `Không` | Có |
| [`legal-pages.md`](../specs/02-public/legal-pages.md) §7 | **rỗng** ở mọi hàng | Không |
| [`lesson-authoring.md`](../specs/06-admin/lesson-authoring.md) §7.1 | rỗng hoặc `Cấm` | Không |
| [`lesson-model.md`](../specs/05-content/lesson-model.md) §7.1 | rỗng · `Cấm` · `Cấm khuyến nghị` | Không |

Hai file bị hỏng theo cùng một kiểu: dấu khẳng định bị xoá thành ô rỗng, dấu phủ định bị đổi
thành chữ `Cấm`. Suy ra cách đọc đúng là **rỗng = bắt buộc**, **`Cấm` = không bắt buộc**.

Cách đọc đó lại làm lộ một mâu thuẫn **không phải** do lỗi định dạng: `BR-LSM-01` và mục 10
`Always` của [`lesson-model.md`](../specs/05-content/lesson-model.md) bắt lesson **luôn** có
cung bậc khởi động → hoạt động chính → đúc kết, trong khi §7.1 của chính file đó xếp khởi động
và đúc kết vào nhóm khuyến nghị, còn đánh giá vào nhóm không bắt buộc. `D-LD` của Task #54 đã
chọn ngầm phía "bắt buộc" cho cả 126 lesson nền. Nếu P3.2 chọn phía kia thì studio và seeder ép
hai bộ luật khác nhau lên cùng một bảng.

### 1.2 Trần thời lượng lesson: ba đại lượng, một cái tên

| Nguồn | Nói gì |
|---|---|
| `BR-LSA-02` | `estimated_minutes ∈ [5,45]`, thiếu là 422 |
| [`lesson-authoring.md`](../specs/06-admin/lesson-authoring.md) §5 | Tổng thời lượng vượt 45 phút — cảnh báo, **không chặn** |
| [`lesson-model.md`](../specs/05-content/lesson-model.md) §9 | Tổng thời lượng activity 60 phút — **422** |
| `BR-LSM-05` | Tổng 15–30 phút, trần cứng 45 |
| [`content.ts`](../../packages/db/src/schema/content.ts) `check_lessons_estimated_minutes` | CHECK cứng `>= 5 AND <= 45` ở DB |
| `D-LD` (Task #54) | 15–30 không warning · 5–14 và 31–45 warning · >45 error |

Ba đại lượng đang dùng chung tên "thời lượng": số khai báo trên lesson, tổng thời lượng activity
lắp vào, và trần sư phạm. Không tách ra thì không viết được cổng publish, và cũng không trả lời
được câu hỏi đơn giản nhất của người soạn: sửa số nào khi màn hình báo đỏ.

### 1.3 Activity không có hàng trong checklist publish

[`content-lifecycle.md`](../specs/00-foundation/content-lifecycle.md) §7.3 có hàng cho
`game_levels`, `lessons`, `curricula`, `worksheets`. **Không có hàng `activities`.**
`BR-CLC-11` bắt hàng sinh từ seed phải qua đúng checklist đó ở tầng service.

Hệ quả: `BR-ACM-01`…`BR-ACM-08` và `BR-ACA-01`…`BR-ACA-07` chỉ được ép ở route studio. Seeder
P3.1 đi đường khác. Hai đường, hai bộ luật, cùng một bảng — đúng cái mà `BR-CLC-11` được viết
để chặn.

### 1.4 Checklist đòi tuổi trên mọi thực thể, activity không có cột tuổi

Hàng "Mọi" của §7.3 đòi `age_min ≤ age_max ∈ [3,6]`. `D-LC` của Task #54 quyết định activity
**không** lưu tuổi mà suy từ giao band skill.
[`content.ts`](../../packages/db/src/schema/content.ts) xác nhận bảng `activities` không có cột
tuổi, trong khi bảng `lessons` có `target_age_min`/`target_age_max`.
[`activity-authoring.md`](../specs/06-admin/activity-authoring.md) §8 lại khai bộ lọc `age` cho
`GET /api/managers/activities`.

Ba nguồn, ba câu trả lời cho cùng một câu hỏi: activity có tuổi hay không.

### 1.5 Hàng đợi duyệt không nhận được lesson và activity

Ba chỗ chặn, đo trên
[`content-review-queue.md`](../specs/06-admin/content-review-queue.md):

- `BR-CRQ-02` — nút duyệt **chỉ bật sau khi mở preview**.
  [`live-preview.md`](../specs/06-admin/live-preview.md) khai `depends_on: GAME-ENGINE-RUNTIME`
  và entry point `/studio/levels/{code}/{version}`. Lesson và activity ngoài màn hình không có
  engine để chạy. Cổng này hiện không thoả được, và cách thoát rẻ nhất là miễn trừ nó — tức bỏ
  đúng thứ nó chặn: duyệt mà không xem.
- `BR-CRQ-07` — checklist §7.2 hiện **đầy đủ**, không rút gọn theo loại nội dung. Nhóm "Nội
  dung" (đáp án đúng và duy nhất, vật gây nhiễu hợp lý) và nhóm "Kỹ thuật" (preview chạy được,
  asset load đủ, sàn touch đạt) không có nghĩa với một activity `discussion`. Bắt reviewer tick
  ô vô nghĩa là huấn luyện chính họ tick cho xong.
- Bộ lọc §7.3 và response §8 đọc `origin`, `authored_in`, `created_by_manager_id`. Bảng
  `activities` tại `484ebaf` không có ba cột đó. Task #54 T2 thêm "provenance/review fields";
  nếu ba cột này không nằm trong đó thì P3.2 chặn ở migration.

### 1.6 Lắp và sắp xếp activity chưa có đường ghi an toàn

Đo trên [`content.ts`](../../packages/db/src/schema/content.ts) bảng `lesson_activities`:

| Sự thật | Hệ quả |
|---|---|
| Khoá chính `(lesson_id, position)` | Đổi chỗ hai activity trong một transaction đụng khoá ở bước trung gian trừ khi ghi theo thứ tự an toàn hoặc dùng ràng buộc DEFERRABLE |
| Không unique trên `(lesson_id, activity_id)` | Cùng một activity lắp hai lần vào một lesson — không spec nào nói đó là hợp lệ hay không |
| Không index trên `activity_id` | Truy vấn "lesson nào đang dùng activity này" quét bảng; đó chính là truy vấn mà `CONTENT_IN_USE` cần |
| Không khoá ngoại | Đúng theo `D-AE` vì `activity_id` là `entity_id` dòng dõi, nhưng nghĩa là không có gì chặn hàng mồ côi |

`PUT /api/managers/lessons/{code}/{version}/activities` ở
[`lesson-authoring.md`](../specs/06-admin/lesson-authoring.md) §8 nhận
`{ items: [...] }` — **không có `expected_version`**, trong khi
[`content-lifecycle.md`](../specs/00-foundation/content-lifecycle.md) §8 và
[`game-level-studio.md`](../specs/06-admin/game-level-studio.md) §8 đều có. Hai reviewer kéo
thả cùng lúc thì người sau ghi đè im lặng.

### 1.7 Route xoá activity không tồn tại trong contract

`BR-ACA-04` và acceptance criteria "When xoá / Then trả 409 kèm danh sách lesson" tham chiếu một
thao tác mà §8 không khai route. `CONTENT_IN_USE` đã có sẵn trong
[`error-codes.md`](../specs/00-foundation/error-codes.md) với `details.used_by[]` — dùng lại
được. Còn thiếu ba quyết định:

1. "Đang dùng" tính lesson `published`, hay cả `draft` và `in_review`.
2. Archive khác xoá thế nào, và archive có bị chặn bởi cùng điều kiện không.
3. Ca activity bị archive **sau** khi lesson đã published. Alt flow của
   [`lesson-authoring.md`](../specs/06-admin/lesson-authoring.md) §5 chỉ nói ca archive **trước**
   khi publish. Ca sau publish không spec nào nói, và nó là ca làm hỏng lesson đang chạy.

### 1.8 Tìm kiếm activity chưa có chủ

[`content-search.md`](../specs/01-platform/content-search.md) §1 tự khai là **một** mặt tìm
kiếm dùng chung cho ba bề mặt, gồm studio của Manager. §3 liệt kê entry point cho `levels`,
`lessons`, `curricula` — **không có** `activities`.
[`activity-authoring.md`](../specs/06-admin/activity-authoring.md) §8 khai một
`GET /api/managers/activities` riêng: bộ lọc riêng, trần 100, không cursor.

[`lesson-authoring.md`](../specs/06-admin/lesson-authoring.md) §7.2 lại đặt ô tìm activity ngay
trong màn soạn lesson. Đó đúng là bề mặt studio mà content-search khai sở hữu. Hai contract cho
cùng một ô tìm kiếm.

### 1.9 `kind = worksheet` trỏ tới thực thể của P4

[`activity-model.md`](../specs/05-content/activity-model.md) §7.2 và
[`activity-authoring.md`](../specs/06-admin/activity-authoring.md) §7.1 bắt `worksheet` trỏ
worksheet `published`. [`worksheet-model.md`](../specs/05-content/worksheet-model.md) nằm ở P4 theo
[`roadmap.md`](../specs/roadmap.md). Bảng `worksheets` tồn tại nhưng rỗng suốt P3.

Cho chọn kind đó trong studio là cho tạo activity không bao giờ publish được, và người phát
hiện sẽ là người soạn sau khi đã viết xong. `BR-ACM-05` cho phép in ấn **chỉ** khi
`kind = worksheet`, nên hệ quả thực tế ở P3 là không activity nào được yêu cầu in.

### 1.10 Form theo `kind` chưa có cơ chế

`BR-ACA-01` nói `kind` quyết định trường nào hiện ra, mười kind có nhu cầu rất khác nhau. Đó
đúng là bài toán [`schema-driven-form.md`](../specs/06-admin/schema-driven-form.md) giải, nhưng
spec đó khai `depends_on: GAME-TEMPLATE-CONTRACT` và entry point
`GET /api/managers/templates/{code}/contract` — cơ chế generic bị buộc vào một nguồn schema duy
nhất. `BR-SDF-01` cấm viết form riêng cho từng template. Viết mười form tay cho mười kind là
đúng thứ rule đó cấm, ở một bảng khác.

### 1.11 Hành vi studio dùng chung chưa áp cho lesson và activity

`BR-STU-03` (lưu fail giữ nguyên form), `BR-STU-05` (mọi thao tác ghi `audit_logs`),
`BR-STU-06` (`access_tier` bắt buộc chọn), `BR-STU-08` và `BR-STU-09` (mật độ UI, lỗi cạnh
field) cùng autosave 30 giây ở §7.3 đều thuộc
[`game-level-studio.md`](../specs/06-admin/game-level-studio.md), gắn với `game_levels`. Hai
spec authoring P3.2 không nhắc autosave và không nhắc `BR-STU-03`. Một Manager mất 20 phút soạn
lesson vì lỗi mạng là đúng cái giá mà `BR-STU-03` đã trả để học một lần.

### 1.12 Hai hình dạng cho cùng một lần gửi duyệt

[`game-level-studio.md`](../specs/06-admin/game-level-studio.md) §8 có
`POST /api/managers/levels/{code}/{version}/submit`.
[`content-lifecycle.md`](../specs/00-foundation/content-lifecycle.md) §8 có
`POST /api/managers/content/{entity_type}/{id}/transition`. Hai spec P3.2 không có cái nào. Chọn
mặc định là sao chép hình dạng của P2.6, và đó là cách corpus có ba đường chuyển trạng thái vào
cuối P3.

### 1.13 Nợ dashboard chuyển tiếp

Task #54 bật thẻ `lesson published` của `D-IX`. P3.2 **không** thêm thẻ mới và không bật nợ nào
khác: `D-KK` tầng ưu tiên curriculum và `D-KP` export `curriculum_health` vẫn
`pending_source: P3.3`. Mục 1 của thứ tự ưu tiên hàng đợi ở
[`content-review-queue.md`](../specs/06-admin/content-review-queue.md) §7.1 — "nội dung nằm
trong tuần curriculum chưa đủ hoạt động" — vẫn chưa có nguồn ở P3.2; giữ nguyên trạng thái chờ,
không thay bằng số 0.

## 2. Quyết định

**D-LF — Khung lesson chốt theo model, và bảng hỏng được sửa tay từng ô.** Thay `Cấm` bằng
`Không`, ô rỗng bằng `Có`, ở cả [`lesson-authoring.md`](../specs/06-admin/lesson-authoring.md)
§7.1, [`lesson-model.md`](../specs/05-content/lesson-model.md) §7.1 và §7.3, và
[`legal-pages.md`](../specs/02-public/legal-pages.md) §7. Cấm `sed` toàn corpus theo
[`CONVENTIONS.md`](../specs/CONVENTIONS.md) §11.6 — đọc lại từng câu sau mỗi lần thay.

Bắt buộc trước khi gửi duyệt: `title` · ≥1 learning objective · `target_age_min`/`max` ·
`estimated_minutes` · `guide` đủ năm phần · ≥1 activity · `warm_up` · `reflection` ·
`assessment` · `access_tier` · tag ba trục. Tuỳ chọn: `extension` (theo `BR-LSM-09`).
`materials` bắt buộc **khi** có activity lắp vào khai vật liệu, và phải bao được toàn bộ vật
liệu đó — cổng máy kiểm bao hàm, người kiểm cách diễn đạt. Mâu thuẫn ở §7.1 của
[`lesson-model.md`](../specs/05-content/lesson-model.md) đóng về phía `BR-LSM-01`: cung bậc là
bắt buộc, không phải khuyến nghị.

**D-LG — Tách ba đại lượng thời lượng, cổng chặn dùng số suy ra.**

| Tên | Nguồn | Cổng |
|---|---|---|
| `estimated_minutes` | Người soạn khai trên lesson | CHECK DB 5–45 giữ nguyên |
| `total_activity_minutes` | `Σ activity.estimated_minutes`, **không lưu** | >45 là error · 15–30 không warning · 5–14 và 31–45 là warning bắt buộc xác nhận |
| Trần sư phạm | `BR-LSM-05` | Không phải cột, không phải cổng máy — là lý do của hai dòng trên |

Lệch giữa hai số đầu quá 5 phút là warning: một trong hai đang sai. Sửa alt flow của
[`lesson-authoring.md`](../specs/06-admin/lesson-authoring.md) §5 từ "cảnh báo, không chặn"
thành cảnh báo ở 31–45 và chặn ở trên 45, để nó khớp acceptance criteria của
[`lesson-model.md`](../specs/05-content/lesson-model.md) §9.

**D-LH — Thêm hàng `activities` vào checklist publish, và định nghĩa lại điều kiện tuổi của
hàng "Mọi".** Hàng mới ở
[`content-lifecycle.md`](../specs/00-foundation/content-lifecycle.md) §7.3: `kind` hợp lệ ·
2–20 phút · `instruction` đủ bốn phần · ≥1 câu nói với trẻ · 1–2 skill · vật liệu bắt buộc
với kind ngoài màn hình · qua cổng an toàn theo band suy ra · ràng buộc riêng theo kind ·
`digital_game` trỏ level `published`. Hàng "Mọi" đổi từ `age_min ≤ age_max ∈ [3,6]` thành "band
tuổi hiệu lực không rỗng và nằm trong `[3,6]`", lấy từ cột với `game_levels`/`lessons` và từ
giao band skill với `activities` theo `D-LC`. Bộ lọc `age` của
`GET /api/managers/activities` giữ lại nhưng ghi rõ là lọc trên band suy ra, thực thi bằng join
taxonomy. Đây là sửa spec P0 từ một task P3 — cần người sở hữu phê duyệt, và phải đo lại rằng
validator P3.1 dùng đúng hàng này chứ không có bản thứ hai.

**D-LI — `BR-CRQ-02` áp cho lesson và activity dưới dạng bản xem thử cho người dạy.** Không
miễn trừ cổng. Bản xem thử render đúng thứ người dạy sẽ đọc: guide năm phần, danh sách activity
theo thứ tự, vật liệu gộp, thời lượng cộng dồn, phần đánh giá, và nhãn hoạt động nào ngoài màn
hình. Nút duyệt chỉ bật sau khi mở tab đó. Activity `kind = digital_game` nhúng preview engine
của level được trỏ, dùng lại [`live-preview.md`](../specs/06-admin/live-preview.md) — không viết
cơ chế preview thứ hai.

**D-LJ — Checklist duyệt tách theo họ thực thể; trong một họ vẫn hiện đầy đủ.** Sửa `BR-CRQ-07`
từ "không rút gọn theo loại nội dung" thành "hiện đầy đủ bộ mục của họ thực thể, không rút gọn
theo từng bản". Thêm bộ mục cho họ lesson/activity: sư phạm · ngôn ngữ cho trẻ chưa biết đọc ·
an toàn vật liệu · khả thi tại nhà · đánh giá quan sát được · vòng đời tham chiếu. Nới một rule
chặn thì phải đo trước rule đó đang chặn cái gì: nó chặn việc **rút gọn tuỳ tiện theo từng bản**,
và bản sửa vẫn chặn đúng điều đó. Cần người sở hữu phê duyệt.

**D-LK — Sắp xếp activity là một thao tác nguyên tử có `expected_version`.**
`PUT /api/managers/lessons/{code}/{version}/activities` nhận
`{ items, expected_version }`, trả 409 `VERSION_CONFLICT` khi lệch. Ghi lại **toàn bộ** danh
sách trong một transaction; không `UPDATE` từng hàng. Thêm unique `(lesson_id, activity_id)` —
cùng một activity hai lần trong một lesson là lỗi biên tập. Thêm index trên
`lesson_activities.activity_id` cho truy vấn `CONTENT_IN_USE`.

**D-LL — Không xoá cứng activity; `archived` là đường duy nhất và nó bị chặn khi còn lesson
sống tham chiếu.** Không thêm route `DELETE`. Chuyển sang `archived` đi qua route transition
chung. Chặn khi còn lesson ở `draft`, `in_review`, `approved` hoặc `published` tham chiếu → 409
`CONTENT_IN_USE` với `details.used_by[]` gồm code và status từng lesson. Ca "activity bị archive
sau khi lesson đã published" ở mục 1.7 biến mất theo định nghĩa: muốn archive thì publish version
mới của lesson bỏ activity đó trước. Sửa acceptance criteria của
[`activity-authoring.md`](../specs/06-admin/activity-authoring.md) từ "When xoá" thành "When
archive".

**D-LM — Activity vào [`content-search.md`](../specs/01-platform/content-search.md) như thực
thể thứ tư.** Cùng cursor, cùng trần chung, cùng quy tắc phạm vi theo actor. Bộ lọc riêng của
activity (`kind`, `duration_max`) thêm vào bảng bộ lọc của content-search. Trần 100 riêng ở
[`activity-authoring.md`](../specs/06-admin/activity-authoring.md) §8 bị thay bằng trần chung;
spec authoring chỉ còn viện dẫn.

**D-LN — `kind = worksheet` khoá bằng cờ, không xoá khỏi enum.** Enum mười kind là contract của
[`activity-model.md`](../specs/05-content/activity-model.md) và P4 sẽ mở lại. Khoá bằng cờ của
[`feature-flag-service.md`](../specs/01-platform/feature-flag-service.md), mặc định tắt ở P3.
Studio ẩn kind đó; cổng publish trả 422 nêu rõ lý do là worksheet chưa có ở MVP, không phải
`ref_id` sai.

**D-LO — Form theo `kind` sinh từ Zod, dùng lại cơ chế của
[`schema-driven-form.md`](../specs/06-admin/schema-driven-form.md).** Mười kind là một
discriminated union Zod, mỗi nhánh khai field đặc thù theo
[`activity-model.md`](../specs/05-content/activity-model.md) §7.2. `zodIntrospect` suy widget từ
quy ước tên field như cũ; thêm nguồn schema thứ hai, không đổi cơ chế và không thêm bảng
mapping. [`activity-authoring.md`](../specs/06-admin/activity-authoring.md) khai
`depends_on: SCHEMA-DRIVEN-FORM`; chiều ngược lại không tồn tại nên không tạo chu trình. Không
viết mười form tay.

**D-LP — Hành vi studio dùng chung được viện dẫn, không nhân bản, và không sinh spec thứ 131.**
`BR-STU-03` · `BR-STU-05` · `BR-STU-06` · `BR-STU-07` · `BR-STU-08` · `BR-STU-09` và autosave 30
giây áp cho `/studio/lessons` và `/studio/activities`. Hai spec authoring viện dẫn mã rule và
thêm acceptance criteria riêng cho autosave và cho ca lưu fail. Phạm vi `BR-STU-01` mở rộng:
studio lesson/activity cấm ghi `game_templates`, `skills`, `learning_objectives`.

**D-LQ — Một đường chuyển trạng thái.** P3.2 dùng
`POST /api/managers/content/{entity_type}/{id}/transition` với
`entity_type ∈ {lesson, activity}`. Không thêm `/submit` cho lesson hay activity.
`/api/managers/levels/{code}/{version}/submit` của P2.6 giữ nguyên như đã ship; hợp nhất hai
hình dạng là việc riêng, không kẹp vào Task #55.

**D-LR — P3.2 không sinh nội dung.** Nghiệm thu là **một lesson và ba activity** soạn tay hết
vòng trong studio — trong đó một activity `digital_game`, hai activity ngoài màn hình khác kind —
đi từ `draft` tới `published` qua đúng cổng duyệt. Số lượng nội dung nền là của Task #54.

## 3. Contract chốt trước code

### 3.1 Route

```text
POST   /api/managers/activities                              body { kind }  → 201 { code: ACT-####, version: 1 }
PATCH  /api/managers/activities/{code}/{version}             body: field + expected_version
GET    /api/managers/activities                              → content-search (D-LM)
POST   /api/managers/lessons                                 → 201 { code: LES-####, version: 1 }
PATCH  /api/managers/lessons/{code}/{version}                body: field + expected_version
PUT    /api/managers/lessons/{code}/{version}/activities     body { items, expected_version }
GET    /api/managers/lessons/{code}/{version}/teaching-view  → bản xem thử cho người dạy (D-LI)
POST   /api/managers/content/{entity_type}/{id}/transition   → đường duy nhất đổi trạng thái (D-LQ)
```

Mã lỗi dùng lại nguyên bộ đã đăng ký ở
[`error-codes.md`](../specs/00-foundation/error-codes.md): `VERSION_CONFLICT` ·
`CONTENT_IN_USE` · `PUBLISH_CHECKLIST_FAILED` · `INVALID_STATUS_TRANSITION` ·
`INSUFFICIENT_ROLE`. Task #55 **không** tự phát mã mới; nếu cần mã mới thì đăng ký trước ở T1.

### 3.2 Kiểu dùng chung

```ts
interface LessonComposition {
  items: Array<{ activity_code: string; position: number; is_required: boolean }>;
  expected_version: number;
}

interface TeachingView {
  guide: LessonGuide;                    // năm phần, P3.1 sở hữu kiểu
  activities: Array<{
    code: string;
    kind: ActivityKind;
    title: string;
    estimated_minutes: number;
    is_required: boolean;
    is_offscreen: boolean;
  }>;
  materials_union: string[];
  total_activity_minutes: number;        // D-LG, suy ra, không lưu
  declared_minutes: number;
  assessment: string;
}

type ActivityKindSchemas = Record<ActivityKind, ZodObject<Record<string, ZodTypeAny>>>;
```

`LessonGuide`, `ActivityKind`, `ActivityInstruction` và `ValidationResult` là của Task #54 —
import, không khai lại.

## 4. Đồ thị phụ thuộc

```text
T0 preflight đo lại sau P3.1
 └──→ T1 sửa contract D-LF…D-LR + human approve
       ├──→ T2 migration lesson_activities + provenance còn thiếu
       │     └──→ T5 route lesson + lắp activity nguyên tử
       ├──→ T3 checklist publish dùng chung (hàng activities + tuổi suy ra)
       │     └──→ T4 route activity + schema theo kind
       │           └──→ T5
       │                 └──→ T6 teaching view
       │                       └──→ T7 hàng đợi duyệt nhận lesson/activity
       ├──→ T8 archive + CONTENT_IN_USE          (cần T2 index, T4 route)
       └──→ T9 tìm kiếm activity qua content-search

T4 · T5 · T6 · T9 ──→ T10 hai màn studio + a11y
T7 · T8 · T10 ──────→ T11 E2E, evidence, promote
```

## 5. Task

### Task 0 — Preflight, đo lại sau P3.1

**Tiêu chí nghiệm thu**

- [ ] Cổng ra P2 xanh; P3.1 `implemented`; hai spec model `implemented`.
- [ ] Đo lại [`content.ts`](../../packages/db/src/schema/content.ts) và
      [`publish-checklist.ts`](../../packages/shared/src/publish-checklist.ts); ghi đè mọi số
      đo ở mục 1 bằng hình dạng thật sau P3.1.
- [ ] Xác nhận ba cột `origin`, `authored_in`, `created_by_manager_id` đã có trên `activities`;
      thiếu cột nào thì sửa ở Task #54, không vá trong P3.2.
- [ ] Nhánh riêng, không trộn working tree đang chạy.

**Kiểm chứng:** `pnpm check:progress` xanh tới P3.1; báo cáo preflight ghi shape schema/checklist
thật sau P3.1 và không còn dependency giả.

**Phụ thuộc:** cổng ra P2 · P3.1 · **Cỡ:** S

### Task 1 — Sửa contract trước code

**Tiêu chí nghiệm thu**

- [ ] Người sở hữu phê duyệt `D-LF`…`D-LR`; ba quyết định đụng spec P0/P2 (`D-LH`, `D-LI`,
      `D-LJ`) được duyệt riêng, có ghi rule đang chặn gì trước và sau khi sửa.
- [ ] Bảng `Bắt buộc` ở bốn file được sửa **tay từng ô**; không `sed`; diff đọc lại từng dòng.
- [ ] Mâu thuẫn cung bậc ở [`lesson-model.md`](../specs/05-content/lesson-model.md) §7.1 đóng về
      phía `BR-LSM-01`.
- [ ] Ba đại lượng thời lượng có tên riêng ở spec sở hữu; alt flow §5 của
      [`lesson-authoring.md`](../specs/06-admin/lesson-authoring.md) khớp acceptance criteria §9
      của [`lesson-model.md`](../specs/05-content/lesson-model.md).
- [ ] `activities` có hàng trong §7.3 của
      [`content-lifecycle.md`](../specs/00-foundation/content-lifecycle.md); điều kiện tuổi hàng
      "Mọi" viết lại theo `D-LH`.
- [ ] `BR-CRQ-02` và `BR-CRQ-07` sửa theo `D-LI` và `D-LJ`; checklist họ lesson/activity vào §7.2.
- [ ] `PUT .../activities` có `expected_version`; acceptance criteria "xoá" đổi thành "archive".
- [ ] `activities` vào entry point và bộ lọc của
      [`content-search.md`](../specs/01-platform/content-search.md); trần 100 riêng bị bỏ.
- [ ] `depends_on: SCHEMA-DRIVEN-FORM` thêm vào
      [`activity-authoring.md`](../specs/06-admin/activity-authoring.md); kiểm không sinh chu
      trình.
- [ ] Cờ khoá `worksheet` đăng ký ở [`feature-flags.md`](../specs/06-admin/feature-flags.md).
- [ ] Câu hỏi mở còn lại của bốn spec P3 được đóng hoặc ghi rõ hoãn kèm điều kiện mở lại đo được.
- [ ] Không thêm spec thứ 131; không thêm mã lỗi ngoài registry.

**Kiểm chứng:** `pnpm lint:specs` 0 lỗi, 0 cảnh báo mới.

**Phụ thuộc:** T0 · human decision · **Cỡ:** 3 work package M — model/authoring,
lifecycle/review, registry/search; mỗi package ≤5 files

### Task 1b — Cổng máy cho ô bảng nhị phân

**Mô tả:** Lỗi ở mục 1.1 sống được vì không cổng nào hỏi nội dung ô. Chỉ có năm bảng `Bắt buộc`
trong corpus, nên kiểm tra hẹp là rẻ và ít báo nhầm.

**Tiêu chí nghiệm thu**

- [ ] Kiểm tra mới trong [`lint-specs-lib.ts`](../../scripts/lint-specs-lib.ts): ô của cột tên
      đúng `Bắt buộc` chỉ nhận `Có`, `Không`, hoặc lượng từ dạng `≥n`; rỗng và `Cấm` là lỗi.
- [ ] **Ca âm viết trước:** fixture có một ô `Cấm` và một ô rỗng làm cổng **đỏ**, in
      `file:line`. Không có ca âm thì không nhận cổng — theo bài học `ultracite`.
- [ ] Chạy trên corpus thật: đúng bốn file ở mục 1.1 đỏ trước T1, xanh hết sau T1.
- [ ] Không nới ca kiểm hiện có để đổi lấy cổng mới xanh.

**Kiểm chứng:** `pnpm test -- lint-specs` · `pnpm lint:specs` xanh sau T1.

**Phụ thuộc:** T1 · **Cỡ:** S

### Checkpoint A — Contract

- [ ] T0, T1, T1b xanh; human đã đọc diff contract.
- [ ] Không migration, route hay UI nào được viết trước checkpoint này.
- [ ] Mọi phụ thuộc ở §0.1 `implemented`; nếu chưa thì dừng.

### Task 2 — Migration `lesson_activities`

**Tiêu chí nghiệm thu**

- [ ] **Test âm trước:** fixture lắp cùng một `activity_id` hai lần vào một lesson làm migration
      hoặc constraint **đỏ**.
- [ ] Unique `(lesson_id, activity_id)`; index trên `activity_id`.
- [ ] Đổi chỗ hai activity trong một transaction chạy được: ràng buộc DEFERRABLE hoặc ghi lại
      toàn bộ danh sách; test chứng minh không đụng khoá ở bước trung gian.
- [ ] Không thêm khoá ngoại lên `activity_id` — `D-AE` giữ nguyên là `entity_id` dòng dõi.
- [ ] Migration từ DB rỗng xanh; ca lỗi rollback cả transaction.

**Kiểm chứng:** `pnpm db:migrate` trên DB rỗng · `pnpm test -- lesson-activities-migration` xanh.

**Bề mặt dự kiến:** [`content.ts`](../../packages/db/src/schema/content.ts) · migration ·
test migration.

**Phụ thuộc:** Checkpoint A · **Cỡ:** M

### Task 3 — Checklist publish dùng chung

**Tiêu chí nghiệm thu**

- [ ] Hàng `activities` của `D-LH` thực thi trong
      [`publish-checklist.ts`](../../packages/shared/src/publish-checklist.ts), **cùng một hàm**
      mà seeder P3.1 gọi; test chứng minh không có bản thứ hai.
- [ ] Điều kiện tuổi phân nhánh đúng: cột với lesson và game level, giao band skill với activity.
- [ ] Band giao rỗng, LO không thuộc skill đã khai, thiếu skill đều là error kèm mã rule.
- [ ] 422 trả `details.missing[]`, không publish một phần.
- [ ] Mỗi mục checklist mới có ca dương và ca âm.

**Kiểm chứng:** `pnpm test -- publish-checklist` xanh; mỗi `BR-ACM-*` và `BR-LSM-*` xuất hiện
trong tên test.

**Phụ thuộc:** T1 · P3.1 validator · **Cỡ:** M

### Checkpoint B — Schema và checklist

- [ ] Migration quan hệ + publish checklist cùng xanh trên DB rỗng.
- [ ] Seeder P3.1 và Studio gọi cùng validator, không có bản luật thứ hai.
- [ ] Full gate hiện tại xanh trước khi mở route authoring.

### Task 4 — Route activity và schema theo `kind`

**Tiêu chí nghiệm thu**

- [ ] `POST /api/managers/activities` nhận `{ kind }`, trả mã `ACT-####` sinh ở server, hàng
      `draft` rỗng; `PATCH` cần `expected_version`, 409 `VERSION_CONFLICT`.
- [ ] Discriminated union Zod đủ mười kind; `zodIntrospect` suy widget từ quy ước tên field,
      không thêm bảng mapping (`BR-SDF-02`).
- [ ] Cùng schema chạy ở client và server (`BR-SDF-05`); nhãn tiếng Việt đủ cho mọi field hiện
      ra (`BR-SDF-06`).
- [ ] Đổi `kind` sau khi điền: cảnh báo mất field không tương thích, yêu cầu xác nhận; dữ liệu
      không tương thích không âm thầm còn lại trong hàng.
- [ ] `kind = digital_game` trỏ level không `published` → 422 (`BR-ACA-02`).
- [ ] `kind = worksheet` bị cờ khoá → 422 nêu rõ lý do MVP (`D-LN`); bật cờ trong test thì lại
      trả 422 vì bảng `worksheets` rỗng, không phải lỗi khác.
- [ ] Mọi thao tác ghi `audit_logs` (`BR-STU-05`).

**Kiểm chứng:** `pnpm test -- activity-authoring` xanh, phủ đủ mười kind và
`BR-ACA-01`…`BR-ACA-03`, `BR-ACA-06`, `BR-ACA-07`.

**Bề mặt dự kiến:** activity routes · activity kind schemas · `zodIntrospect` ·
`configDictionary` · integration test.

**Phụ thuộc:** T3 · P2.5 · **Cỡ:** 2 work package M — schema/service activity, route + test;
mỗi package ≤5 files

### Task 5 — Route lesson và lắp activity nguyên tử

**Tiêu chí nghiệm thu**

- [ ] `POST /api/managers/lessons` trả mã `LES-####` sinh ở server; `PATCH` cần
      `expected_version`.
- [ ] `PUT .../activities` ghi lại toàn bộ danh sách trong một transaction; `expected_version`
      lệch → 409 `VERSION_CONFLICT`.
- [ ] **Race test:** hai request sắp xếp đồng thời → đúng một thành công, thứ tự cuối là của
      người thắng, không có trạng thái lai.
- [ ] Lắp cùng một activity hai lần → 422; kéo activity thứ ba lên vị trí một cập nhật đúng
      `position` và không đổi tổng thời lượng.
- [ ] Lesson tham chiếu activity `draft` → publish trả 422 nêu tên activity (`BR-LSA-03`).
- [ ] Phân giải activity theo bản `published` mới nhất qua `entity_id` (`D-AE`); publish version
      mới của activity làm mọi lesson dùng nó thấy bản mới (`BR-LSA-05`).
- [ ] Sửa lesson đã `published` tạo version mới ở `draft`; hàng cũ không bị `UPDATE`.

**Kiểm chứng:** `pnpm test -- lesson-authoring lesson-composition` xanh, gồm race test.

**Bề mặt dự kiến:** lesson routes · composition service · resolver `entity_id` ·
integration test.

**Phụ thuộc:** T2 · T4 · **Cỡ:** 2 work package M — composition service, route/concurrency
test; mỗi package ≤5 files

### Task 6 — Bản xem thử cho người dạy

**Tiêu chí nghiệm thu**

- [ ] `GET .../teaching-view` trả đúng `TeachingView` §3.2; `total_activity_minutes` tính từ
      activity đang lắp, không đọc cột.
- [ ] Vật liệu gộp từ lesson và mọi activity, khử trùng lặp; hoạt động ngoài màn hình có nhãn.
- [ ] Activity `digital_game` nhúng preview engine của level được trỏ, dùng lại
      [`live-preview.md`](../specs/06-admin/live-preview.md); không có cơ chế preview thứ hai.
- [ ] Không dựng được thì hiện **rõ lý do**, không để trống im lặng (`BR-STU-04` tinh thần).
- [ ] Bản xem thử là read-only; không route nào của nó ghi dữ liệu.

**Kiểm chứng:** `pnpm test -- teaching-view` xanh.

**Phụ thuộc:** T5 · P2.6 · **Cỡ:** M

### Checkpoint C — API authoring và preview

- [ ] Activity/lesson routes, race test composition và teaching-view cùng xanh.
- [ ] Mọi đường ghi audit đúng; không hàng `published` bị sửa tại chỗ.
- [ ] Human review diff service/route trước khi nối review queue.

### Task 7 — Hàng đợi duyệt nhận lesson và activity

**Tiêu chí nghiệm thu**

- [ ] `entity_type` của hàng đợi nhận `lesson` và `activity`; response trả đủ `origin`,
      `authored_in`, `created_by_manager_id`.
- [ ] Nút duyệt chỉ bật sau khi mở bản xem thử (`D-LI`); test âm chứng minh duyệt trước khi mở
      là **đỏ**.
- [ ] Checklist họ lesson/activity hiện **đủ** bộ mục của họ đó; không mục game level nào lọt
      vào; kết quả lưu `checklist_snapshot`.
- [ ] Từ chối bắt buộc lý do ≥10 ký tự; mọi quyết định ghi `content_review_log` và `audit_logs`.
- [ ] Warning đã xác nhận theo `D-LD` nằm trong snapshot, không bị nuốt.
- [ ] Duyệt theo lô vẫn cấm (`BR-CRQ-01`); từ chối theo lô vẫn được.
- [ ] Ưu tiên mục 1 của §7.1 vẫn `pending_source: P3.3`, không thay bằng 0.

**Kiểm chứng:** `pnpm test -- review-queue-lesson-activity` xanh.

**Phụ thuộc:** T6 · P2.8 · **Cỡ:** M

### Task 8 — Archive activity và `CONTENT_IN_USE`

**Tiêu chí nghiệm thu**

- [ ] Không có route `DELETE`; archive đi qua route transition chung.
- [ ] Archive khi còn lesson `draft`/`in_review`/`approved`/`published` tham chiếu → 409
      `CONTENT_IN_USE` với `details.used_by[]` gồm code và status từng lesson.
- [ ] Truy vấn `used_by` dùng index của T2; test đo không quét toàn bảng.
- [ ] Archive lesson không bị chặn bởi activity; chiều phụ thuộc chỉ một hướng.
- [ ] Test chứng minh không tồn tại được trạng thái "lesson `published` trỏ activity
      `archived`".

**Kiểm chứng:** `pnpm test -- activity-archive` xanh.

**Phụ thuộc:** T2 · T4 · **Cỡ:** M

### Task 9 — Tìm kiếm activity qua mặt tìm kiếm dùng chung

**Tiêu chí nghiệm thu**

- [ ] `GET /api/managers/activities` chạy trên cùng đường của
      [`content-search.md`](../specs/01-platform/content-search.md): cursor, trần chung, phạm vi
      trạng thái theo actor.
- [ ] Bộ lọc `kind`, `skill`, `duration_max`, `status` chạy; `age` lọc trên band suy ra qua join
      taxonomy, không đọc cột.
- [ ] `limit` vượt trần bị ép về trần, không lỗi; truy vấn text tham số hoá, không nối chuỗi.
- [ ] Không có đường truy vấn activity thứ hai trong repo; test quét chứng minh.

**Kiểm chứng:** `pnpm test -- content-search-activities` xanh.

**Phụ thuộc:** T1 · T4 · P1.11b · **Cỡ:** M

### Checkpoint D — Đường ghi hoàn chỉnh

- [ ] T2…T9 xanh. Race test sắp xếp và test archive đều đúng một người thắng.
- [ ] `pnpm check && pnpm test` xanh; human đọc diff migration và diff route.
- [ ] Không chạy migration ngoài local.

### Task 10 — Hai màn studio

**Tiêu chí nghiệm thu**

- [ ] `/studio/activities`, `/studio/activities/new`, `/studio/lessons`, `/studio/lessons/new`,
      `/studio/lessons/{code}/{version}` chạy; nav admin thêm mục, không tạo shell thứ hai.
- [ ] Bố cục lesson theo §7.2: khung form trái, danh sách activity kéo thả phải kèm tổng thời
      lượng chạy, ô tìm activity dưới.
- [ ] Autosave 30 giây và khi rời field; lưu fail **giữ nguyên toàn bộ form** (`BR-STU-03`);
      test mô phỏng mất mạng.
- [ ] Lỗi validate hiện cạnh field (`BR-STU-09`); mật độ theo `BR-STU-08`; `access_tier` bắt
      buộc chọn (`BR-STU-06`).
- [ ] Tạo activity ngay trong luồng soạn lesson rồi quay lại đúng vị trí, không mất nháp lesson.
- [ ] Kéo thả đi được **bằng bàn phím**; thứ tự đọc của screen reader khớp thứ tự hiển thị theo
      [`accessibility.md`](../specs/08-quality/accessibility.md).
- [ ] Cảnh báo thiếu hoạt động ngoài màn hình yêu cầu xác nhận rõ ràng, không tự tick.
- [ ] Không thành phần zone Kid nào lọt vào studio theo
      [`design-system-contract.md`](../specs/08-quality/design-system-contract.md).

**Kiểm chứng:** `pnpm test:e2e -- studio-lessons studio-activities` xanh, gồm ca bàn phím.

**Bề mặt dự kiến:** hai trang studio · component kéo thả · form sinh từ schema · API client ·
E2E và accessibility test.

**Phụ thuộc:** T4 · T5 · T6 · T9 · **Cỡ:** 2 work package M — activity studio và lesson
studio; mỗi package ≤5 files

### Task 11 — Evidence và promote P3.2

**Tiêu chí nghiệm thu**

- [ ] Mỗi `BR-LSA-*` và `BR-ACA-*` có ít nhất một test tham chiếu bằng mã rule trong tên test.
- [ ] `D-LR`: một lesson và ba activity soạn tay đi hết `draft → in_review → approved →
      published` trong studio, có review log và checklist snapshot thật.
- [ ] [`lesson-authoring.md`](../specs/06-admin/lesson-authoring.md) và
      [`activity-authoring.md`](../specs/06-admin/activity-authoring.md) sang `implemented`.
- [ ] Bốn spec bị P3.2 sửa — [`content-lifecycle.md`](../specs/00-foundation/content-lifecycle.md),
      [`content-review-queue.md`](../specs/06-admin/content-review-queue.md),
      [`content-search.md`](../specs/01-platform/content-search.md),
      [`schema-driven-form.md`](../specs/06-admin/schema-driven-form.md) — giữ nguyên trạng thái
      cũ, có ghi task nguồn của lần sửa.
- [ ] `D-KK` và `D-KP` vẫn `pending_source: P3.3`; không thẻ dashboard nào bị bật sớm.
- [ ] Tick **P3.2** trong Task #14 chỉ khi `pnpm check:progress` tự xanh.

**Kiểm chứng:**
`pnpm check && pnpm test && pnpm test:e2e && pnpm lint:specs && pnpm check:progress` xanh.

**Phụ thuộc:** T7 · T8 · T10 · **Cỡ:** S

## 6. Rủi ro

| Rủi ro | Hậu quả | Giảm thiểu |
|---|---|---|
| Đọc bảng `Bắt buộc` hỏng theo cách thuận tay | Studio và seeder ép hai bộ luật lên cùng bảng | `D-LF` + đối chiếu bốn bảng + cổng T1b có ca âm |
| Miễn `BR-CRQ-02` cho lesson vì không có engine | Duyệt mù thành mặc định của loại nội dung mới | `D-LI` — bản xem thử là điều kiện bật nút, không phải tuỳ chọn |
| Rút gọn checklist cho hợp lesson | Bỏ sót có hệ thống, đúng thứ `BR-CRQ-07` chặn | `D-LJ` — tách theo họ, trong họ vẫn đủ; đo rule trước khi nới |
| `PUT .../activities` không có `expected_version` | Hai reviewer kéo thả, người sau ghi đè im lặng | `D-LK` + race test |
| Viết mười form tay cho mười kind | Mười chỗ để lệch, đúng thứ `BR-SDF-01` cấm | `D-LO` — discriminated union + `zodIntrospect` |
| Thêm route `DELETE` activity | Lesson published trỏ hàng đã mất | `D-LL` — chỉ archive, chặn bằng `CONTENT_IN_USE` |
| Mở `kind = worksheet` ở P3 | Activity soạn xong không bao giờ publish được | `D-LN` — cờ tắt mặc định, 422 nêu rõ lý do |
| Đường tìm kiếm activity thứ hai | Hai bộ lọc lệch nhau giữa studio và catalog | `D-LM` + test quét đường truy vấn |
| Sửa spec P0/P2 từ task P3 mà không ai duyệt | Contract drift ngược phase | T1 tách ba quyết định đó ra duyệt riêng |
| Đếm P3.2 bằng số lesson soạn được | Task nuốt phạm vi nội dung của P3.1 | `D-LR` — nghiệm thu bằng một lesson và ba activity |
| Bắt đầu code khi P3.1 chưa xong | Dùng model và validator tưởng tượng | Stop condition §0.1 + T0 đo lại |
| Ghi file docs bị hook cắt thân | Plan hoặc todo mất nội dung, gate đỏ | Sau mỗi lần ghi: `wc -l` rồi `pnpm lint:specs` |

## 7. Ngoài phạm vi

- Biên soạn nội dung — 126 lesson nền là Task #54.
- Curriculum, builder, `curriculum_health`, ưu tiên hàng đợi theo tuần — P3.3.
- Hình minh hoạ cho activity ngoài màn hình — P4, theo câu hỏi mở của
  [`activity-authoring.md`](../specs/06-admin/activity-authoring.md).
- Worksheet model, render PDF, mở `kind = worksheet` — P4.
- Bản hướng dẫn riêng cho giáo viên — P4, theo câu hỏi mở của
  [`lesson-model.md`](../specs/05-content/lesson-model.md).
- Hợp nhất `/submit` của P2.6 vào route transition chung.
- Viết lại [`schema-driven-form.md`](../specs/06-admin/schema-driven-form.md) hay
  [`live-preview.md`](../specs/06-admin/live-preview.md) — chỉ mở rộng nguồn đầu vào.
- Auto-merge, chạy migration ngoài local, publish tự động.

## 8. Giả định và điều kiện dừng

1. P3.1 giao đúng `ActivityKind`, `ActivityInstruction`, `LessonGuide`, `ValidationResult` và
   validator dùng chung; P3.2 import, không khai lại.
2. Ba cột provenance mà hàng đợi duyệt cần đã được Task #54 thêm vào bảng `activities`. Nếu
   chưa, sửa ở Task #54 rồi quay lại, không vá trong P3.2.
3. `instruction` và `guide` vẫn là text trong DB; cấu trúc có kiểu chỉ dùng ở tầng
   authoring và validator.
4. Ba quyết định đụng spec P0/P2 (`D-LH`, `D-LI`, `D-LJ`) là **đề xuất** cho tới khi người sở
   hữu duyệt. Chưa duyệt thì dừng T3 và T7; T2, T4 và T9 vẫn chạy được.
5. Không phụ thuộc nào ở §0.1 được coi là có sẵn chỉ vì spec của nó `approved`.
6. Task #55 không bắt đầu implementation khi bất kỳ cổng P0–P2 nào còn đỏ.
