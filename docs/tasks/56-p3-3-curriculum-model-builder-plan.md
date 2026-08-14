# Kế hoạch — Task #56: P3.3 — Mô hình và builder curriculum

> Viết 2026-08-11, đo tại commit `484ebaf` trên working tree đang triển khai P0.9.
> Bước sở hữu: **P3.3** của
> [`14-implementation-sequence-todo.md`](14-implementation-sequence-todo.md).
> Spec sở hữu: [`curriculum-model.md`](../specs/05-content/curriculum-model.md) ·
> [`curriculum-builder.md`](../specs/06-admin/curriculum-builder.md).
> Task trước: [`55-p3-2-lesson-activity-authoring-plan.md`](55-p3-2-lesson-activity-authoring-plan.md).
>
> ```sh
> export PATH=/Users/macbook/.nvm/versions/node/v24.15.0/bin:$PATH
> ```

## Tóm tắt

Curriculum là **một thứ tự trên thư viện**, không phải tài sản gốc. P3.3 giao mô hình thứ tự
đó, sáu chỉ báo cân bằng, builder để dựng nó, và năm chương trình MVP.

Ba sự thật chi phối kế hoạch:

1. **Bảng `curriculum_items` không có cột `week_no` và `session_no`.** Tám trong mười rule của
   [`curriculum-model.md`](../specs/05-content/curriculum-model.md) và bốn trong sáu chỉ báo cân
   bằng đều tính theo tuần. Không có hai cột đó thì phần lớn P3.3 không ép được, và cổng publish
   `curricula` của [`content-lifecycle.md`](../specs/00-foundation/content-lifecycle.md) §7.3
   ("không tuần rỗng") cũng không chạy được.
2. **Cung nội dung và cầu curriculum chưa từng được đối chiếu.** `D-LA` của Task #54 đặt thư
   viện ở 126 lesson vì 42 tuần × 3 buổi. Cấu trúc tuần chuẩn ở
   [`curriculum-model.md`](../specs/05-content/curriculum-model.md) §7.1 lại nói chỉ **buổi 1**
   là lesson đầy đủ. Hai cách đọc lệch nhau khoảng 80 lesson — mỗi lesson là một lượt người
   review. Phải đối chiếu **trước khi** Task #54 chạy 18 batch, không phải sau.
3. **Hai nguồn sự thật cho "trẻ đang học chương trình nào".**
   `curriculum_enrollments.curriculum_id` trỏ `curricula.id` — một hàng version cụ thể.
   `child_profiles.current_curriculum_id` trỏ `curricula.entity_id` và theo bản `published` mới
   nhất theo `D-AE`. Hai quy tắc phân giải cho cùng một câu hỏi.

P3.3 cũng là nơi trả hai món nợ mà Task #54 và Task #55 đã hoãn: tầng ưu tiên curriculum của
`D-KK` trong hàng đợi duyệt, và loại xuất `curriculum_health` của `D-KP`.

## 0. Điều kiện tiên quyết

### 0.1 Phụ thuộc và điều kiện vào

| Phụ thuộc | Bước | Điều kiện vào Task 2 trở đi |
|---|---|---|
| P3.1 | P3.1 | Thư viện lesson và activity `published`, đủ số theo `D-LU` |
| P3.2 | P3.2 | Studio lesson/activity chạy; cơ chế bản xem thử và checklist theo họ thực thể đã có |
| `TAXONOMY-SERVICE` | P0.9 | Cây competency/strand/skill và `skill_prerequisites` đã seed |
| `CONTENT-LIFECYCLE` · `CONTENT-VERSIONING` | P0.6 | Route transition chung; `D-AE` phân giải `entity_id` |
| `CONTENT-SEARCH` | P1.11b | Bộ lọc thư viện dùng chung, đã nhận activity ở Task #55 |
| `CONTENT-REVIEW-QUEUE` | P2.8 + P3.2 | Họ thực thể và bản xem thử mở rộng được cho loại thứ ba |
| `DATA-EXPORT` | P2.9 | Sáu loại xuất và union type đóng của `D-KP` |
| `ADMIN-DASHBOARD` | P2.1 | Thẻ và ngưỡng cảnh báo của `D-IX` |
| `CHILD-PROFILE-CRUD` | P1.9 | `child_profiles.current_curriculum_id` đã có |
| Nhóm Nội dung | — | Người dựng chương trình có nền sư phạm; reviewer đọc được lộ trình, không chỉ từng item |

**Stop condition:** trước Task 2, phụ thuộc nào chưa `implemented` thì dừng Task #56.

### 0.2 Việc phải đẩy ngược vào Task #54 **trước** khi nó chạy batch

`D-LU` dưới đây đối chiếu số lesson cần với số lesson sẽ soạn. Nếu kết quả là 126 thừa thì phát
hiện muộn không hoàn tiền: mỗi lesson thừa đã tốn một lượt review sư phạm, và
[`content-seed-authoring.md`](../specs/01-platform/content-seed-authoring.md) nói rõ đường găng
bị chặn bởi năng lực đọc của người, không phải tốc độ soạn.

Việc này phải xong **trước Task 6 của Task #54**, tức trước batch nội dung đầu tiên. Nó không
chờ P3.2 và không chờ P3.3 bắt đầu.

## 1. Đo được

### 1.1 `curriculum_items` thiếu chiều tuần và buổi

[`curriculum.ts`](../../packages/db/src/schema/curriculum.ts) khai `curriculum_items` với
`curriculum_id` · `position` · `entity_type` · `entity_id` · `is_optional`. Contract §8 của
[`curriculum-builder.md`](../specs/06-admin/curriculum-builder.md) gửi
`week_no` · `session_no` · `position` · `entity_type` · `entity_id` · `is_required` ·
`estimated_minutes`.

Ba trường trong body không có cột, và một trường đảo cực. Hệ quả đo được:

| Rule hoặc chỉ báo | Cần gì | Chạy được không |
|---|---|---|
| `BR-CBD-02` tuần rỗng chặn publish | `week_no` | Không |
| `BR-CBD-04` ≥3 hoạt động mỗi tuần | `week_no` | Không |
| `BR-CRM-02` mỗi tuần 2–4 competency | `week_no` | Không |
| `BR-CRM-03` ôn lại trong tuần N+1…N+3 | `week_no` | Không |
| `BR-CRM-05` ≥1 hoạt động ngoài màn hình mỗi tuần | `week_no` | Không |
| `BR-CRM-09` không lặp item trong 4 tuần | `week_no` | Không |
| `BR-CRM-10` mỗi tuần một câu mục tiêu | Chỗ lưu câu đó | Không |
| Chỉ báo "thời lượng buổi > 45 phút" | `session_no` | Không |
| Hàng `curricula` của checklist publish §7.3 | `week_no` | Không |

Suy `week_no` từ `position` bằng phép chia cho `sessions_per_week` là cách rẻ và sai: nó giả
định mọi tuần đầy đủ buổi, trong khi tuần rỗng và tuần thiếu buổi chính là thứ `BR-CBD-02` và
`BR-CBD-04` được viết để bắt.

### 1.2 `curricula` thiếu bốn trường cấu hình mà chính main flow của nó đòi

Bước 1 của §4 [`curriculum-builder.md`](../specs/06-admin/curriculum-builder.md) tạo curriculum
với `program_type`, band tuổi, `duration_weeks`, `sessions_per_week`. Bảng `curricula` ở
[`curriculum.ts`](../../packages/db/src/schema/curriculum.ts) có `title`, `description`,
`access_tier`, vòng đời, provenance — **không có bốn trường trên**.

`BR-CRM-08` bắt "chương trình **theo tuổi** phủ cả 6 competency" — không có `program_type` thì
không biết curriculum nào phải chịu rule đó. Alt flow "đổi `duration_weeks` giảm" ở §5 thao tác
trên một trường không tồn tại. Mã `CUR-\d{3}` giới hạn 999 chương trình; đủ cho MVP, ghi lại để
không phát hiện muộn.

### 1.3 Cung nội dung lệch cầu curriculum khoảng 80 lesson

| Nguồn | Nói gì | Số lesson suy ra |
|---|---|---|
| `D-LA` (Task #54) | 42 tuần × 3 buổi, mỗi buổi một lesson riêng | 126 |
| [`curriculum-model.md`](../specs/05-content/curriculum-model.md) §7.1 | Buổi 1 lesson đầy đủ · buổi 2 là 2–3 game level · buổi 3 ôn cũ và hoạt động ngoài màn hình | ~1 lesson mỗi tuần |
| [`curriculum-model.md`](../specs/05-content/curriculum-model.md) §7.3 | 4 chương trình 8 tuần + 42 tuần phát hành 12 tuần đầu | 4×8 + 12 = **44** |

Đọc theo §7.1 và §7.3, MVP cần khoảng 44 lesson riêng biệt, không phải 126. Đọc theo `D-LA`,
mỗi buổi là một lesson và cần 126. Hai cách đọc chênh nhau khoảng 80 lesson.

Ba cách đóng, cần người sở hữu chọn:

1. **Giữ 126** vì buổi 2 và buổi 3 cũng là lesson, chỉ khác thành phần. Khi đó §7.1 phải viết
   lại: cả ba buổi đều là lesson, khác nhau ở tỉ lệ game level và hoạt động ngoài màn hình.
2. **Hạ về đúng cầu** theo §7.1 và §7.3, và ghi lại `D-LA` là quyết định đã đo sai cung.
3. **Giữ 126 nhưng đổi mốc phát hành** — phát hành đủ 42 tuần thay vì 12 tuần đầu. Khi đó
   42 tuần × 1 lesson là 42, vẫn không tới 126 trừ khi theo cách đọc 1.

Hai câu hỏi mở số 2 ở [`curriculum-model.md`](../specs/05-content/curriculum-model.md) và
[`curriculum-builder.md`](../specs/06-admin/curriculum-builder.md) vẫn đề xuất "chấp nhận dùng
lại mỗi lesson 2 lần" — **trái với `D-LA`**, vốn cấm lặp lesson. Task #54 T1 nhận việc sửa hai
câu hỏi đó; Task #56 preflight phải xác minh nó đã sửa, không giả định.

### 1.4 Hai nguồn sự thật cho chương trình của một trẻ

| Nguồn | Trỏ gì | Ngữ nghĩa |
|---|---|---|
| `curriculum_enrollments.curriculum_id` | `curricula.id` | Ghim đúng một hàng version |
| `child_profiles.current_curriculum_id` | `curricula.entity_id` | Theo bản `published` mới nhất, `D-AE` |

Alt flow "trẻ đang học version cũ — không ảnh hưởng" của
[`curriculum-builder.md`](../specs/06-admin/curriculum-builder.md) §5 và `BR-CUR-04` mô tả hành
vi ghim. [`child-data-compliance.md`](../specs/00-foundation/child-data-compliance.md) §7 mô tả
hành vi theo bản mới nhất, dẫn `BR-DM-13` và `BR-SCT-06`. Cả hai đều là contract approved. Trẻ
sẽ nhận câu trả lời khác nhau tuỳ đường code nào đọc.

`curriculum_enrollments` cũng không có unique trên `(child_id, curriculum_id)`, không khoá ngoại
lên `child_profiles`, và `status` là `varchar(20)` thay vì enum.

### 1.5 Sắp xếp item lặp lại đúng cái bẫy của Task #55

`curriculum_items` có unique `(curriculum_id, position)` và
`PUT /api/managers/curricula/{code}/{version}/items` thay toàn bộ danh sách. Không có
`expected_version` trong body, giống hệt
`PUT /api/managers/lessons/{code}/{version}/activities` trước `D-LK`. Không index trên
`entity_id`, trong khi truy vấn "curriculum nào đang dùng lesson này" là truy vấn mà cổng archive
của `D-LL` cần khi mở rộng sang curriculum.

`curriculum_item_progress.status` cũng là `varchar(20)`, `child_id` lặp lại mà không có khoá
ngoại.

### 1.6 `BR-CRM-03` không thoả được ở ba tuần cuối

`BR-CRM-03` bắt skill mới xuất hiện ở tuần N phải được ôn lại trong tuần N+1 tới N+3. Với
chương trình 8 tuần, skill mới ở tuần 6, 7 hoặc 8 không có đủ tuần phía sau. Rule không có
ngoại lệ, nên một chương trình 8 tuần giới thiệu skill mới ở tuần 8 vừa hợp lệ theo mắt người,
vừa đỏ theo cổng máy.

Rule cũng chưa phân biệt hai phép đo: `BR-CRM-03` đo trên **skill**, `BR-CRM-09` đo trên
**item**. Ôn lại một skill bằng một item khác là hợp lệ và là chuyện bình thường; công cụ phải
không nhầm hai phép đo đó thành một.

### 1.7 Thời lượng buổi bị đề nghị lưu, trái với `D-LG`

Body `PUT .../items` mang `estimated_minutes` cho từng item. `D-LG` của Task #55 đã quyết định
thời lượng lesson là số suy ra từ activity đang lắp, không lưu lặp. Lưu lại một bản sao ở
curriculum item tạo bản sao thứ ba của cùng một con số, và nó sẽ lệch ngay lần đầu ai đó sửa
lesson.

### 1.8 Cổng duyệt và cân bằng chạy ở hai thời điểm khác nhau

`GET .../balance` trả sáu chỉ báo và phải chạy trên bản `draft` — đó là giá trị chính của
builder. Cổng publish `curricula` ở §7.3 của
[`content-lifecycle.md`](../specs/00-foundation/content-lifecycle.md) chỉ có hai mục: item trỏ
nội dung `published`, và không tuần rỗng. Bốn rule sư phạm còn lại (`BR-CRM-02`, `BR-CRM-04`,
`BR-CRM-07`, `BR-CRM-08`) hiện **không** nằm ở cổng publish, chỉ nằm ở chỉ báo cảnh báo.

Một chỉ báo cảnh báo không chặn được gì. Nếu `BR-CRM-07` (không competency nào quá 40%) là
`Never` ở mục 10 của spec sở hữu, nó phải là error ở cổng publish, không phải thanh màu vàng.

### 1.9 Hai món nợ đến hạn ở P3.3

| Nợ | Ai hoãn | Đến hạn |
|---|---|---|
| `D-KK` — tầng ưu tiên 1 của hàng đợi duyệt: nội dung nằm trong tuần curriculum chưa đủ hoạt động | Task #50 · giữ pending ở Task #54 và #55 | P3.3 |
| `D-KP` — loại xuất `curriculum_health` | Task #51 · giữ pending ở Task #54 và #55 | P3.3 |

Cả hai cần dữ liệu tuần, nên chúng phụ thuộc trực tiếp vào `D-LS`.

## 2. Quyết định

**D-LS — `week_no` và `session_no` là cột thật, không suy từ `position`.** Thêm hai cột
`smallint` `NOT NULL` vào `curriculum_items`, unique
`(curriculum_id, week_no, session_no, position)`, index trên `(curriculum_id, week_no)` và trên
`entity_id`. `position` giữ nguyên nghĩa thứ tự **trong một buổi**. Tuần rỗng biểu diễn bằng
việc không có hàng nào mang `week_no` đó — cổng publish đối chiếu với `duration_weeks`, không
đoán từ khoảng trống.

**D-LT — `curricula` nhận bốn cột cấu hình, và mục tiêu tuần có bảng riêng.** Thêm
`program_type` (enum đóng, MVP: `age_based` và `journey`), `target_age_min`, `target_age_max`,
`duration_weeks`, `sessions_per_week`. Mục tiêu mỗi tuần của `BR-CRM-10` lưu ở bảng
`curriculum_weeks (curriculum_id, week_no, goal)` — không nhét JSONB vào `curricula`, vì đó
là dữ liệu người đọc và cần cổng chất lượng như mọi text tiếng Việt khác. `BR-CRM-08` chỉ áp cho
`program_type = age_based`.

**D-LU — Đối chiếu cung nội dung với cầu curriculum trước khi Task #54 chạy batch.** Task #56
T1 tính cầu thật từ §7.1 và §7.3, so với 126 của `D-LA`, và đưa ba phương án ở mục 1.3 cho người
sở hữu chọn. Kết quả ghi vào cùng những nguồn mà `D-LA` đã sửa. **Điều kiện dừng:** nếu Task #54
đã bắt đầu Task 6 mà `D-LU` chưa chốt thì dừng batch, không soạn tiếp — 80 lesson thừa là 80
lượt review không lấy lại được. Hai câu hỏi mở số 2 ở hai spec curriculum phải đóng theo `D-LA`,
không theo đề xuất "dùng lại 2 lần" đang ghi trong bảng.

**D-LV — Enrollment ghim version; hồ sơ trẻ chỉ trỏ dòng dõi để hiển thị.**
`curriculum_enrollments.curriculum_id` giữ nguyên nghĩa ghim một hàng version — trẻ đang học
không bị đổi lộ trình giữa chừng (`BR-CUR-04`). `child_profiles.current_curriculum_id` là con
trỏ dòng dõi dùng cho hiển thị và cho việc ghi danh lần sau, **không** phải nguồn quyết định
item nào đến tiếp theo. Mọi truy vấn tiến độ đọc qua enrollment. Thêm unique
`(child_id, curriculum_id)` khi `status = 'active'`, khoá ngoại lên `child_profiles`, và đổi
`status` sang enum. Ghi rõ quy tắc này ở spec sở hữu schema, không để nó chỉ sống trong code.

**D-LW — Một cực duy nhất cho tính bắt buộc.** Chọn `is_required` ở cả contract và cột, mặc định
`true`; bỏ `is_optional`. Hai cực ngược nhau giữa body và cột là cách nhanh nhất để một lần
migration làm mọi item tuỳ chọn thành bắt buộc mà không ai thấy.

**D-LX — Thời lượng buổi là số suy ra, nối tiếp `D-LG`.** Bỏ `estimated_minutes` khỏi body
`PUT .../items`. Thời lượng buổi tính từ item trong buổi đó tại thời điểm đọc: lesson lấy
`total_activity_minutes`, game level lấy thời lượng khai trên level. Chỉ báo "buổi > 45 phút"
đọc số suy ra.

**D-LY — Cấm giới thiệu skill mới trong ba tuần cuối của một chương trình.** Đó là cách đóng
`BR-CRM-03` không cần ngoại lệ: nếu không có tuần để ôn lại thì không giới thiệu. Ba tuần cuối
dành cho ôn và củng cố, khớp với `BR-CRM-04` (cho phép chững). Ghi thành rule mới ở spec sở hữu
chứ không xử lý bằng cách bỏ qua cửa sổ cuối trong code. Phép đo tách rõ: `BR-CRM-03` đo trên
skill, `BR-CRM-09` đo trên item, hai truy vấn khác nhau, hai thông báo khác nhau.

**D-LZ — Rule sư phạm có hai hạng: chặn và cảnh báo, và hạng được chọn theo mục 10 của spec sở
hữu.** Mục `Never` thành error ở cổng publish: `BR-CRM-01` prerequisite ngược · `BR-CRM-07` quá
40% một competency · `BR-CRM-09` lặp item trong 4 tuần · `BR-CRM-06` tuần đầu khó hơn trung
bình · `BR-CBD-02` tuần rỗng · `BR-CBD-03` item chưa published · `BR-CBD-04` dưới 3 hoạt động.
Còn lại là warning bắt buộc xác nhận, lưu vào `checklist_snapshot` theo cùng cơ chế `D-LD`:
`BR-CRM-02` số competency mỗi tuần · `BR-CRM-04` độ dốc · `BR-CRM-05` hoạt động ngoài màn hình ·
`BR-CRM-08` phủ 6 competency với chương trình theo tuổi. Sáu chỉ báo của `GET .../balance` là
**cùng một hàm** với cổng publish, chỉ khác chế độ trình bày — không viết hai bộ luật.

## 3. Contract chốt trước code

### 3.1 Route

```text
POST   /api/managers/curricula                                 body { program_type, target_age_min, target_age_max, duration_weeks, sessions_per_week }
PATCH  /api/managers/curricula/{code}/{version}                body: field + expected_version
PUT    /api/managers/curricula/{code}/{version}/items          body { items, expected_version }   (D-LS, D-LW, D-LX)
PUT    /api/managers/curricula/{code}/{version}/weeks          body { weeks: [{ week_no, goal }], expected_version }
GET    /api/managers/curricula/{code}/{version}/balance        → sáu chỉ báo, cùng hàm với cổng publish
POST   /api/managers/curricula/{code}/{version}/duplicate      → mã mới, copy item và week
POST   /api/managers/content/{entity_type}/{id}/transition     → đường duy nhất đổi trạng thái (D-LQ)
```

### 3.2 Kiểu dùng chung

```ts
type ProgramType = "age_based" | "journey";

interface CurriculumItemInput {
  week_no: number;
  session_no: number;
  position: number;
  entity_type: "lesson" | "game_level";
  entity_id: number;          // neo dòng dõi, D-AE
  is_required: boolean;       // D-LW
}

interface BalanceReport {
  competency_distribution: Array<{ competency_code: string; share: number }>;
  missing_competencies: string[];
  difficulty_slope: Array<{ week_no: number; avg_difficulty: number }>;
  session_minutes: Array<{ week_no: number; session_no: number; minutes: number }>;
  repeated_items: Array<{ entity_id: number; week_nos: number[] }>;
  prerequisite_violations: Array<{ skill_code: string; needs: string; at_week: number }>;
  errors: ValidationResult["errors"];      // D-LZ, chặn publish
  warnings: ValidationResult["warnings"];  // D-LZ, cần xác nhận
}
```

## 4. Đồ thị phụ thuộc

```text
T0 preflight + đẩy D-LU ngược vào Task #54
 └──→ T1 sửa contract D-LS…D-LZ + human approve
       ├──→ T2 migration tuần/buổi + curriculum_weeks + enrollment
       │     ├──→ T3 engine cân bằng và cổng publish dùng chung
       │     │     ├──→ T4 route curriculum + items nguyên tử
       │     │     │     └──→ T5 builder UI lưới tuần × buổi
       │     │     └──→ T6 hàng đợi duyệt nhận curriculum
       │     └──→ T7 nợ D-KK và D-KP
       └──→ T8 năm chương trình MVP
             └──→ T9 evidence và promote
```

## 5. Task

### Task 0 — Preflight và cảnh báo sớm cho Task #54

**Tiêu chí nghiệm thu**

- [ ] P3.1 và P3.2 `implemented`; bốn spec của chúng đã promote.
- [ ] Xác minh Task #54 T1 đã sửa hai câu hỏi mở số 2 về 42 tuần theo `D-LA`; còn đề xuất "dùng
      lại 2 lần" thì sửa trước, không giả định.
- [ ] Tính cầu lesson thật từ §7.1 và §7.3, gửi người sở hữu cùng ba phương án ở mục 1.3.
- [ ] **Nếu Task #54 chưa chạy Task 6:** chốt `D-LU` trước khi batch đầu tiên chạy.
- [ ] **Nếu Task #54 đã chạy Task 6:** dừng batch cho tới khi `D-LU` chốt; ghi số lesson đã soạn
      để tính phần thừa.
- [ ] Đo lại [`curriculum.ts`](../../packages/db/src/schema/curriculum.ts) sau P3.1 và P3.2.

**Kiểm chứng:** `pnpm check:progress` xanh tới P3.2; báo cáo cung/cầu và shape schema thật được
lưu trước khi T1 bắt đầu.

**Phụ thuộc:** P3.2 · **Cỡ:** S

### Task 1 — Sửa contract trước code

**Tiêu chí nghiệm thu**

- [ ] Người sở hữu phê duyệt `D-LS`…`D-LZ`; `D-LU` và `D-LV` duyệt riêng vì đụng nguồn ngoài P3.3.
- [ ] `week_no`, `session_no` và bảng tuần vào spec sở hữu schema; bốn cột cấu hình của
      `curricula` được ghi rõ kiểu và ràng buộc.
- [ ] `D-LU` chốt; ba nguồn ở mục 1.3 nói cùng một con số; hai câu hỏi mở số 2 đóng theo `D-LA`.
- [ ] `D-LV` ghi vào [`child-data-compliance.md`](../specs/00-foundation/child-data-compliance.md)
      §7 và spec schema: enrollment ghim version, con trỏ hồ sơ chỉ để hiển thị.
- [ ] `is_optional` bị bỏ khỏi contract và cột; `estimated_minutes` bị bỏ khỏi body items.
- [ ] Rule mới "không giới thiệu skill mới trong ba tuần cuối" vào
      [`curriculum-model.md`](../specs/05-content/curriculum-model.md) §6, có mã `BR-CRM-*` kế tiếp.
- [ ] Hàng `curricula` của §7.3
      [`content-lifecycle.md`](../specs/00-foundation/content-lifecycle.md) mở rộng theo `D-LZ`.
- [ ] `expected_version` thêm vào `PUT .../items` và `PUT .../weeks`.
- [ ] Không thêm spec mới; không thêm mã lỗi ngoài
      [`error-codes.md`](../specs/00-foundation/error-codes.md).

**Kiểm chứng:** `pnpm lint:specs` 0 lỗi, 0 cảnh báo mới.

**Phụ thuộc:** T0 · human decision · **Cỡ:** 3 work package M — model/schema, builder,
enrollment/lifecycle; mỗi package ≤5 files

### Checkpoint A — Contract

- [ ] T0 và T1 xanh; human đã đọc diff.
- [ ] `D-LU` đã chốt và đã phản hồi về Task #54.
- [ ] Không migration, route hay UI nào viết trước checkpoint này.

### Task 2 — Migration tuần, buổi, tuần-mục-tiêu và enrollment

**Tiêu chí nghiệm thu**

- [ ] **Test âm trước:** hàng `curriculum_items` thiếu `week_no` làm migration **đỏ**; hàng
      `curriculum_enrollments` trùng `(child_id, curriculum_id)` khi `active` cũng **đỏ**.
- [ ] `week_no`, `session_no` `NOT NULL`; unique `(curriculum_id, week_no, session_no, position)`.
- [ ] Index `(curriculum_id, week_no)` và index `entity_id`.
- [ ] Bốn cột cấu hình trên `curricula`; `program_type` là enum đóng.
- [ ] Bảng `curriculum_weeks` với unique `(curriculum_id, week_no)`.
- [ ] `is_optional` đổi thành `is_required`; migration không đảo nghĩa dữ liệu sẵn có — DB rỗng
      thì đổi thẳng, có dữ liệu thì abort và in số hàng.
- [ ] `curriculum_enrollments`: khoá ngoại `child_profiles`, `status` thành enum, unique một
      enrollment `active` cho mỗi cặp.
- [ ] `curriculum_item_progress.status` thành enum.
- [ ] Migration từ DB rỗng xanh; ca lỗi rollback cả transaction.

**Kiểm chứng:** `pnpm db:migrate` trên DB rỗng · `pnpm test -- curriculum-migration` xanh.

**Phụ thuộc:** Checkpoint A · **Cỡ:** 2 work package M — curriculum/week/item và
enrollment/progress; mỗi package ≤5 files

### Task 3 — Engine cân bằng và cổng publish dùng chung

**Tiêu chí nghiệm thu**

- [ ] Sáu chỉ báo và cổng publish gọi **cùng một hàm**; test quét chứng minh không có bản thứ hai.
- [ ] Hạng error và warning đúng `D-LZ`; error chặn publish, warning cần xác nhận và vào
      `checklist_snapshot`.
- [ ] `BR-CRM-01` và `BR-CBD-06` đọc `skill_prerequisites` thật của P0.9, không bảng cứng.
- [ ] `BR-CRM-03` đo trên skill; `BR-CRM-09` đo trên item; hai truy vấn riêng, hai thông báo riêng.
- [ ] Rule ba tuần cuối của `D-LY` có ca dương và ca âm.
- [ ] `BR-CRM-08` chỉ áp cho `program_type = age_based`.
- [ ] Thời lượng buổi tính từ item tại thời điểm đọc (`D-LX`), không đọc cột.
- [ ] Chương trình 8 tuần hợp lệ chạy hết engine dưới ngưỡng thời gian đã đặt cho builder.

**Kiểm chứng:** `pnpm test -- curriculum-balance publish-checklist-curricula` xanh; mỗi
`BR-CRM-*` và `BR-CBD-*` xuất hiện trong tên test.

**Phụ thuộc:** T2 · P0.9 taxonomy · **Cỡ:** 2 work package M — balance engine/rule tests và
publish adapter; mỗi package ≤5 files

### Checkpoint B — Schema và engine sư phạm

- [ ] Migration curriculum/enrollment và balance engine cùng xanh.
- [ ] Cổng publish và builder dùng cùng một bộ rule; error/warning không drift.
- [ ] Full gate hiện tại xanh trước khi mở route ghi.

### Task 4 — Route curriculum và ghi item nguyên tử

**Tiêu chí nghiệm thu**

- [ ] `POST /api/managers/curricula` nhận cấu hình `D-LT`, trả mã `CUR-###` sinh ở server.
- [ ] `PUT .../items` và `PUT .../weeks` thay **toàn bộ** danh sách trong một transaction, cần
      `expected_version`, lệch trả 409 `VERSION_CONFLICT`.
- [ ] **Race test:** hai request ghi item đồng thời → đúng một thành công, không trạng thái lai.
- [ ] `week_no` vượt `duration_weeks` → 422; giảm `duration_weeks` cảnh báo item sẽ mất và cần
      xác nhận rõ ràng.
- [ ] `duplicate` tạo mã mới, copy đủ item và week, bản gốc không đổi (`BR-CBD-08` giữ nguyên).
- [ ] Xoá curriculum không đụng lesson hay game level (`BR-CBD-01`); test chứng minh.
- [ ] Item trỏ `entity_id` dòng dõi, phân giải bản `published` mới nhất theo `D-AE`.
- [ ] Mọi thao tác ghi `audit_logs`.

**Kiểm chứng:** `pnpm test -- curriculum-builder-api` xanh, gồm race test.

**Phụ thuộc:** T3 · **Cỡ:** 2 work package M — create/update/duplicate và items/weeks/race
tests; mỗi package ≤5 files

### Task 5 — Builder UI lưới tuần × buổi

**Tiêu chí nghiệm thu**

- [ ] `/studio/curricula` và `/studio/curricula/{code}/{version}` chạy; bố cục theo §7.3.
- [ ] Lưới tuần × buổi; kéo thả từ thư viện bên phải; thư viện dùng mặt tìm kiếm chung, không
      viết bộ lọc thứ hai.
- [ ] Sáu chỉ báo cân bằng hiện thường trực trên thanh trên, cập nhật khi lưới đổi (`BR-CBD-05`).
- [ ] Cảnh báo còn lại liệt kê ở dưới; error và warning phân biệt được bằng nhiều hơn màu sắc.
- [ ] Kéo thả đi được **bằng bàn phím**; thứ tự đọc screen reader khớp lưới theo
      [`accessibility.md`](../specs/08-quality/accessibility.md).
- [ ] Autosave và giữ form khi lưu fail theo `BR-STU-03`; mật độ theo `BR-STU-08`.
- [ ] Không hiển thị ngày tháng gắn với tuần (`BR-CBD-07`); "Tuần 3" là thứ tự.
- [ ] Câu mục tiêu mỗi tuần sửa ngay trên lưới, không phải màn hình riêng.

**Kiểm chứng:** `pnpm test:e2e -- studio-curricula` xanh, gồm ca bàn phím.

**Phụ thuộc:** T4 · **Cỡ:** 2 work package M — grid/editor và indicators/a11y; mỗi package
≤5 files

### Checkpoint C — Đường dựng curriculum

- [ ] Route nguyên tử/race test và builder keyboard journey cùng xanh.
- [ ] Không business rule thứ hai nằm riêng trong UI.
- [ ] Human review diff route + UI trước khi nối review queue.

### Task 6 — Hàng đợi duyệt nhận curriculum

**Tiêu chí nghiệm thu**

- [ ] `entity_type` nhận `curriculum`; dùng lại cơ chế họ thực thể và bản xem thử của Task #55,
      không phát minh cơ chế thứ ba.
- [ ] Bản xem thử curriculum là **lộ trình**: tuần, buổi, item, mục tiêu tuần, chỉ báo cân bằng.
- [ ] Nút duyệt chỉ bật sau khi mở lộ trình; test âm chứng minh duyệt trước là **đỏ**.
- [ ] Checklist họ curriculum hiện đủ bộ mục của họ đó; warning đã xác nhận vào snapshot.
- [ ] Từ chối bắt buộc lý do; mọi quyết định ghi `content_review_log` và `audit_logs`.

**Kiểm chứng:** `pnpm test -- review-queue-curriculum` xanh.

**Phụ thuộc:** T3 · P3.2 · **Cỡ:** M

### Task 7 — Trả nợ `D-KK` và `D-KP`

**Tiêu chí nghiệm thu**

- [ ] Tầng ưu tiên 1 của hàng đợi bật nguồn thật: nội dung nằm trong tuần curriculum chưa đủ
      hoạt động, tính từ `week_no`.
- [ ] Loại xuất `curriculum_health` bật, nằm trong union type đóng của `D-KP`; `kind` sai vẫn
      404 và không mở kết nối.
- [ ] Xuất có truy vấn riêng, trần và rate limit như năm loại còn lại; không truy vấn tổng quát.
- [ ] Thẻ dashboard liên quan lấy số từ hàng thật; không thẻ nào còn `pending_source: P3.3`.
- [ ] Ca âm: không có curriculum nào thì xuất trả tập rỗng, không phải số 0 giả.

**Kiểm chứng:** `pnpm test -- review-queue-priority data-export-curriculum-health` xanh.

**Phụ thuộc:** T2 · P2.8 · P2.9 · **Cỡ:** M

### Checkpoint D — Review và vận hành

- [ ] Review queue, audit, dashboard và export dùng nguồn curriculum thật.
- [ ] Không `pending_source: P3.3` bị thay bằng số giả.
- [ ] Full gate + human review phần vận hành xanh trước seed chương trình.

### Task 8 — Năm chương trình MVP

**Tiêu chí nghiệm thu**

- [ ] Bốn chương trình theo tuổi, mỗi cái 8 tuần, `program_type = age_based`, phủ đủ 6
      competency.
- [ ] Hành trình 42 tuần dựng đủ khung, phát hành theo mốc đã chốt ở `D-LU`.
- [ ] Mỗi chương trình đi qua engine cân bằng với **0 error**; mọi warning có người xác nhận và
      lý do trong snapshot.
- [ ] Mỗi tuần có câu mục tiêu do người viết, không sinh máy.
- [ ] Reviewer sư phạm đọc **cả lộ trình**, không chỉ từng item; ghi người duyệt.
- [ ] Điểm cắt theo [`mvp-scope.md`](../specs/00-foundation/mvp-scope.md) §5 được ghi rõ: thiếu
      nguồn lực thì giữ **một** chương trình theo tuổi, không hạ checklist.

**Kiểm chứng:** `pnpm seed:check` và dry-run riêng từng chương trình xanh; báo cáo cân bằng lưu
làm evidence.

**Phụ thuộc:** T5 · T3 · thư viện lesson của P3.1 · **Cỡ:** 5 work package cỡ M

### Checkpoint E — Corpus curriculum

- [ ] Từng curriculum qua balance report, dry-run và reviewer sư phạm.
- [ ] Số chương trình khớp contract/điểm cắt canonical đã merge.
- [ ] Không seed ngoài local; mọi warning có snapshot và người xác nhận.

### Task 9 — Evidence và promote P3.3

**Tiêu chí nghiệm thu**

- [ ] Mỗi `BR-CRM-*` và `BR-CBD-*` có ít nhất một test tham chiếu bằng mã rule trong tên test.
- [ ] [`curriculum-model.md`](../specs/05-content/curriculum-model.md) và
      [`curriculum-builder.md`](../specs/06-admin/curriculum-builder.md) sang `implemented`.
- [ ] Spec bị P3.3 sửa giữ nguyên trạng thái cũ, có ghi task nguồn của lần sửa.
- [ ] `D-KK` và `D-KP` không còn `pending_source`.
- [ ] Tick **P3.3** trong Task #14 chỉ khi `pnpm check:progress` tự xanh.

**Kiểm chứng:**
`pnpm check && pnpm test && pnpm test:e2e && pnpm lint:specs && pnpm check:progress` xanh.

**Phụ thuộc:** T6 · T7 · T8 · **Cỡ:** S

## 6. Rủi ro

| Rủi ro | Hậu quả | Giảm thiểu |
|---|---|---|
| Suy `week_no` từ `position` | Tuần rỗng và tuần thiếu buổi trở nên vô hình, đúng thứ cổng cần bắt | `D-LS` — cột thật, đối chiếu `duration_weeks` |
| Phát hiện lệch cung nội dung sau khi soạn xong | Tới 80 lượt review sư phạm không lấy lại được | `D-LU` + cảnh báo sớm ở T0, chặn Task 6 của Task #54 |
| Hai nguồn sự thật về curriculum của trẻ | Trẻ nhận lộ trình khác nhau tuỳ đường code | `D-LV` — enrollment là nguồn, con trỏ hồ sơ chỉ hiển thị |
| Rule sư phạm chỉ là thanh cảnh báo | `Never` của spec không chặn được gì | `D-LZ` — mục `Never` thành error ở cổng publish |
| Hai bộ luật cho cân bằng và publish | Builder xanh, publish đỏ, hoặc ngược lại | `D-LZ` — cùng một hàm, khác chế độ trình bày |
| `is_optional` và `is_required` cùng tồn tại | Một lần migration đảo nghĩa toàn bộ item | `D-LW` — một cực, migration abort khi có dữ liệu |
| `BR-CRM-03` đỏ ở ba tuần cuối | Chương trình hợp lệ vẫn không publish được | `D-LY` — cấm skill mới ở ba tuần cuối |
| Lưu thời lượng ở curriculum item | Bản sao thứ ba của cùng một con số, lệch ngay lần sửa đầu | `D-LX` — suy ra, nối tiếp `D-LG` |
| Ghi item không nguyên tử | Hai người dựng cùng lúc, thứ tự lai | `expected_version` + thay toàn bộ + race test |
| Phát minh cơ chế duyệt thứ ba | Ba đường duyệt, ba checklist | T6 dùng lại cơ chế của Task #55 |
| Bật `D-KK`/`D-KP` khi chưa có tuần | Dashboard và export trả số 0 giả | T7 phụ thuộc T2, có ca âm tập rỗng |

## 7. Ngoài phạm vi

- Trẻ chơi curriculum, mở khoá buổi kế tiếp, xử lý bỏ dở — P3.4.
- Mastery, adaptive, điều chỉnh lộ trình theo năng lực — P3.5.
- Gợi ý game kế tiếp — P3.6.
- Báo cáo nâng cao theo curriculum cho phụ huynh — P3.7.
- Trưng bày chương trình ra trang công khai — P3.8.
- Các tầng `Level` và `Module` của §7.1 — MVP chỉ dùng Week → Session → item.
- Curriculum cá nhân do User tự dựng — P4.
- Auto-merge, chạy migration ngoài local, publish tự động.

## 8. Giả định và điều kiện dừng

1. Thư viện lesson và activity của P3.1 đã `published` và đủ số theo kết quả `D-LU`.
2. Cơ chế họ thực thể, bản xem thử và checklist của Task #55 mở rộng được cho loại thứ ba mà
   không phải viết lại.
3. `skill_prerequisites` của P0.9 đủ để kiểm `BR-CRM-01`; thiếu cạnh nào thì sửa ở taxonomy,
   không nhét bảng cứng vào builder.
4. `D-LU` và `D-LV` là **đề xuất** cho tới khi người sở hữu duyệt. Chưa duyệt thì dừng T2 trở đi;
   T0 vẫn phải chạy vì nó là cảnh báo sớm cho Task #54.
5. Điểm cắt "giữ một chương trình theo tuổi" là quyết định phạm vi của chủ dự án, không phải
   cách hạ checklist khi trễ.
6. Task #56 không bắt đầu implementation khi P3.1 hoặc P3.2 còn đỏ.
