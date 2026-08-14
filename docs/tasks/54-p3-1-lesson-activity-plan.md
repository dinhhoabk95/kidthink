# Kế hoạch — Task #54: P3.1 — Mô hình activity, lesson và thư viện nền

> Viết 2026-08-11, đo tại commit `484ebaf` trên working tree đang triển khai P0.9.
> Bước sở hữu: **P3.1** của
> [`14-implementation-sequence-todo.md`](14-implementation-sequence-todo.md).
> Spec sở hữu: [`lesson-model.md`](../specs/05-content/lesson-model.md) ·
> [`activity-model.md`](../specs/05-content/activity-model.md).
>
> ```sh
> export PATH=/Users/macbook/.nvm/versions/node/v24.15.0/bin:$PATH
> ```

## Tóm tắt

P2 đã có đủ 11 cặp plan/todo, từ Task #43 tới Task #53. P2 chưa được implement, vì vậy Task
#54 chỉ được **lập hồ sơ trước**; code P3.1 không bắt đầu cho tới khi cổng ra P2 xanh.

P3.1 giao bốn kết quả:

1. Model và validator dùng chung cho 10 loại activity và lesson.
2. Migration sửa schema activity đang lệch contract, không đoán nghĩa dữ liệu legacy.
3. Đường seed có kiểu cho activity và lesson, dùng lại tám cổng của P1.10.
4. Thư viện nền đạt ngưỡng canonical được duyệt. Phương án đang chờ quyết định là giữ
   **≥60 lesson** có tái sử dụng trong curriculum hoặc nâng lên **≥126 lesson distinct**.

Con số 126 là **đề xuất thay đổi contract**, chưa phải nguồn thật: [`SPEC.md`](../SPEC.md) vẫn
giữ ≥60 và mục 15 yêu cầu người chốt. Cấu trúc curriculum chuẩn có 42 tuần × 3 buổi. Vì vậy
Checkpoint 0 phải chọn một trong hai nhánh và Task 1 phải sửa contract nếu nhận phương án 126
trước khi viết migration hoặc seeder. P3.2 vẫn sở hữu route và Studio; Task #54 không lấy phạm
vi đó.

## 0. Điều kiện tiên quyết

| Phụ thuộc | Điều kiện vào |
|---|---|
| P0–P2 | Cổng ra P2 trong Task #14 xanh; không dựa trên plan/todo chưa implement |
| `CONTENT-SEED-AUTHORING` | P1.10 có `seed:check`, `seed:content --dry-run`, `seed:report` và tám cổng |
| `CONTENT-LIFECYCLE` · `CONTENT-VERSIONING` | Hàng `published` bất biến; version mới giữ lineage |
| `CONTENT-TAGGING` | Skill, LO và ba trục tag có đường ghi dùng được |
| `PUBLISH-AND-VERSION` | P2.8 có checklist, review log và snapshot cảnh báo |
| `ADMIN-DASHBOARD` | Thẻ `lesson published` còn `pending_source: P3.1` theo `D-IX` |
| Nhóm Nội dung | Có người sở hữu và reviewer sư phạm theo `D-CN`; baseline 3 lesson/người review/ngày |

Preflight phải đo lại code sau P2. Những đường dẫn trong mục "Đo được" dưới đây là hình dạng ở
commit `484ebaf`, không phải lời hứa rằng P2 sẽ giữ nguyên từng file.

## 1. Đo được

### 1.1 Enum activity lệch contract

[`packages/db/src/schema/content.ts`](../../packages/db/src/schema/content.ts) đang khai:

```text
digital_game · worksheet · hands_on · story · discussion · movement · song · art · reflection · custom
```

Hai spec approved khai:

```text
digital_game · discussion · storytelling · movement · manipulative · worksheet · observation · mini_project · assessment · home_activity
```

Bốn giá trị trùng, sáu giá trị còn lại không có ánh xạ ngữ nghĩa an toàn. `song` không tự động
thành `storytelling`; `custom` càng không thể đoán. Migration phải fail nếu gặp hàng legacy.

### 1.2 Activity chưa đủ hình dạng để seed và review

Schema hiện chưa có `materials`, provenance của seeder và các cột review giống các bảng Lớp
2 khác. `estimated_minutes` chưa có CHECK 2–20. `lesson_activities.activity_id` là lineage
`entity_id` theo `D-AE`; tầng service phải luôn phân giải đúng một bản `published` mới nhất.

Chủ dự án đã chọn **không thêm cột tuổi lên activity**. Band tuổi được suy từ các skill cha của
LO mà activity gắn vào:

```text
effective_age_min = max(skill.age_min)
effective_age_max = min(skill.age_max)
```

Thiếu skill, LO không thuộc skill đã khai, hoặc khoảng giao rỗng đều là lỗi publish/seed.

### 1.3 Validator hiện mới kiểm checklist tối thiểu

[`packages/shared/src/publish-checklist.ts`](../../packages/shared/src/publish-checklist.ts)
chỉ kiểm lesson có activity, thời lượng 5–45 và `guide` không rỗng. Chưa có nhánh activity,
chưa ép `BR-ACM-*`, chưa kiểm năm phần guide, cung bậc lesson, an toàn, biến thể dễ/khó hoặc
assessment quan sát được.

### 1.4 Seeder chưa nhận activity

[`content-seed-authoring.md`](../specs/01-platform/content-seed-authoring.md) có đường dẫn
`lessons/*.ts`, nhưng `content_seed_batches.kind` chưa có `activity` và chưa có
`seed-content/activities/*.ts`. Lesson không seed được nếu activity tham chiếu chưa tồn tại.

### 1.5 Nợ P2 chuyển tiếp

P3.1 chỉ trả nợ thẻ `lesson published` của `D-IX`. Hai nợ còn lại cần dữ liệu curriculum — tầng
ưu tiên 1 của `D-KK` và export `curriculum_health` của `D-KP` — ở lại P3.3. Bật chúng trong
Task #54 sẽ biến "chưa có nguồn" thành số 0 giả.

## 2. Quyết định

**D-LA-P — Đề xuất để người duyệt: đổi P3 từ ≥60 thành ≥126 lesson `published`, và curriculum
không dùng lại cùng một lesson.** Nếu nhận đề xuất, sửa mọi nguồn sở hữu trước:
[`SPEC.md`](../SPEC.md),
[`mvp-scope.md`](../specs/00-foundation/mvp-scope.md),
[`content-seed-authoring.md`](../specs/01-platform/content-seed-authoring.md), hai spec
model/authoring lesson và hai spec curriculum có câu hỏi 42 tuần. `BR-CRM-09` vẫn giữ nguyên;
phương án này mạnh hơn rule "không lặp trong bốn tuần". Nếu giữ ≥60, `BR-CRM-09` tiếp tục là
contract tái sử dụng. Mốc cắt 40 lesson chỉ còn hợp lệ khi
chủ cắt hẳn curriculum 42 tuần và ship một curriculum 8 tuần; nó không được dùng để dựng bản
42 tuần thiếu nội dung.

**D-LB — Căn enum DB theo đúng 10 loại approved; không ánh xạ legacy.** Migration kiểm trước.
Nếu có một hàng mang `hands_on`, `story`, `song`, `art`, `reflection` hoặc `custom`, migration
thoát khác 0 và in code của hàng. Người sở hữu nội dung phải phân loại tay trong một migration
riêng có review. Database rỗng hoặc không có activity legacy thì thay type an toàn.

**D-LC — Band tuổi activity là dữ liệu suy ra, không lưu lặp.** Lấy giao band của 1–2 skill mà
activity gắn qua LO. Mọi LO phải thuộc một skill đã khai trên activity. Rule an toàn band 3–4
áp khi khoảng hiệu lực giao với `[3,4]`; không được nới bằng cách gắn thêm skill tuổi lớn.

**D-LD — Validator trả `errors` và `warnings`; chỉ `errors` chặn, warning phải được người xác
nhận và lưu snapshot.** Activity 2–20 phút và lesson >45 phút là lỗi. Lesson 5–14 hoặc 31–45
phút là warning; 15–30 là vùng mục tiêu. Lesson thiếu activity ngoài màn hình là warning bắt
buộc xác nhận ở Studio, nhưng toàn bộ 126 lesson nền phải có ít nhất một activity ngoài màn
hình nên seed không dùng ngoại lệ này.

**D-LE — Nguồn an toàn là QCVN 3:2019/BKHCN + TCVN 6238-1 và Thông tư
45/2021/TT-BGDĐT.** Danh sách cấm ở
[`activity-model.md`](../specs/05-content/activity-model.md) §7.3 là baseline đóng cho cổng máy.
Nguồn chính thức: [QCVN an toàn đồ chơi](https://tcvn.gov.vn/do-choi-trung-thu-nhap-lau-tiem-an-nhieu-nguy-co-co-hai-den-suc-khoe-cua-tre-nho/21/09/2023/)
và [tài liệu Bộ GD&ĐT về trường mầm non an toàn](https://moet.gov.vn/content/vanban/Lists/VBDH/Attachments/3584/hoc-phan-6full16012024-3173524.pdf).
Cổng heuristic không thay review của chuyên gia sư phạm.

## 3. Interface nội bộ

P3.1 không thêm HTTP route. Nó thêm interface có kiểu để seeder P3.1 và Studio P3.2 dùng chung:

```ts
type ActivityKind =
  | "digital_game"
  | "discussion"
  | "storytelling"
  | "movement"
  | "manipulative"
  | "worksheet"
  | "observation"
  | "mini_project"
  | "assessment"
  | "home_activity";

interface ActivityInstruction {
  preparation: string;
  steps: Array<{ instruction: string; say_to_child: string }>;
  easier: string;
  harder: string;
}

interface LessonGuide {
  outcome: string;
  preparation: string[];
  opening: string;
  if_child_succeeds: string;
  if_child_needs_help: string;
}

interface ValidationResult {
  errors: Array<{ rule: string; path: string; message: string }>;
  warnings: Array<{ rule: string; path: string; message: string }>;
}
```

`ActivitySeed` dùng `ActivityInstruction`, 1–2 `skill_codes`, ≥1
`learning_objective_codes`, `materials`, `estimated_minutes`, `access_tier` và provenance.
`LessonSeed` dùng `LessonGuide`, danh sách activity theo thứ tự, LO liên quan, các phần cung bậc
và đánh giá. Seeder render hai cấu trúc thành `instruction`/`guide` để không đổi schema
text đã chốt.

## 4. Đồ thị phụ thuộc

```text
Checkpoint 0 chọn ≥60/reuse hoặc ≥126/distinct
  └──→ T1 căn contract và đóng ba câu hỏi P3
        └──→ T2 migration schema + enum
              └──→ T3 model/validator activity
                    └──→ T4 model/validator lesson + versioning activity
                          └──→ T5 mở rộng seeder + pilot 6 lesson
                                └──→ T6 batch theo nhánh đã duyệt
                                      └──→ T7 dashboard, evidence, promote
```

### Checkpoint 0 — Ngưỡng lesson và chính sách tái sử dụng

- [ ] Product/Content chọn đúng một nhánh: **A — giữ ≥60 và cho phép reuse theo BR-CRM-09**;
      hoặc **B — ≥126 distinct, không reuse lesson trong curriculum 42 tuần**.
- [ ] Quyết định có lý do, owner và ảnh hưởng lịch/chi phí review; không dùng lời ghi trong plan
      làm bằng chứng thay cho canonical contract.
- [ ] Nếu chọn B, cập nhật và duyệt mọi spec sở hữu trước code. Nếu chọn A, bỏ các acceptance
      126/distinct và dùng manifest 10 batch × 6 bên dưới.

## 5. Task

### Task 1 — Sửa contract trước code

**Tiêu chí nghiệm thu**

- [ ] Canonical specs phản ánh đúng nhánh được duyệt; không để ≥60 và ≥126 cùng là contract.
- [ ] Nhánh A giữ reuse theo `BR-CRM-09`; nhánh B đóng câu hỏi 42 tuần theo `D-LA-P`: không lặp
      lesson; cả hai nhánh đều cho phép tái sử dụng activity.
- [ ] `activity` được thêm vào batch kind và đường dẫn seeder; band tuổi suy từ taxonomy được ghi ở spec sở hữu.
- [ ] Câu hỏi nguồn an toàn đóng theo `D-LE`; link nguồn chính thức mở được.
- [ ] `pnpm lint:specs` 0 lỗi, 0 cảnh báo mới.

**Kiểm chứng:** tìm toàn corpus chỉ còn một ngưỡng canonical; mọi chỗ nhắc ngưỡng còn lại phải
được ghi rõ là proposal/lịch sử hoặc nhánh không được chọn.

**Phụ thuộc:** cổng ra P2 · Checkpoint 0 · human approve D-LB…D-LE · **Cỡ:** M

### Task 2 — Migration schema activity

**Tiêu chí nghiệm thu**

- [ ] Test âm trước: fixture có một hàng `kind = 'custom'` làm migration **đỏ** và nêu code hàng.
- [ ] Enum sau migration đúng chính xác 10 giá trị của `ActivityKind`; không còn sáu giá trị legacy.
- [ ] Activity có `materials`, provenance/review fields, CHECK 2–20 phút và index phân giải `entity_id`.
- [ ] Không thêm `target_age_min/max` vào activity; migration không ghi dữ liệu tuổi lặp.
- [ ] Migration từ database rỗng chạy hết; ca lỗi rollback cả transaction, không để type tạm hoặc bảng nửa đổi.

**Kiểm chứng:** `pnpm db:migrate` trên DB rỗng và suite migration activity xanh.

**Phụ thuộc:** T1 · **Cỡ:** M

### Checkpoint A — Contract và schema

- [ ] Nhánh ở Checkpoint 0 và D-LB…D-LE đã được người review; migration từ DB rỗng xanh.
- [ ] Ca enum legacy abort sạch, không còn bảng/type tạm.
- [ ] Full gate hiện tại xanh trước khi viết validator.

### Task 3 — Model và validator activity

**Tiêu chí nghiệm thu**

- [ ] `ActivityKind` là union đóng; fixture cho đủ 10 loại parse được, loại thứ 11 lỗi biên dịch/validation.
- [ ] Ép `BR-ACM-01` tới `BR-ACM-08`: đứng độc lập, 2–20 phút, câu nói với trẻ, vật liệu, không in ngoài worksheet, hai biến thể, an toàn, tối đa hai skill.
- [ ] `D-LC`: band tuổi lấy giao skill; thiếu skill, LO lệch skill hoặc giao rỗng đều là error.
- [ ] Ràng buộc riêng từng kind ở §7.2 có fixture dương và âm.
- [ ] Cổng an toàn in `file:line`, mã rule và vật liệu/cụm từ vi phạm.

**Kiểm chứng:** `pnpm test -- activity-model` xanh; mỗi `BR-ACM-*` xuất hiện trong tên test.

**Phụ thuộc:** T2 · taxonomy P0.9 · **Cỡ:** M

### Task 4 — Model lesson và versioning activity

**Tiêu chí nghiệm thu**

- [ ] `LessonGuide` bắt buộc đủ năm phần; assessment nêu hành vi quan sát được và không dùng cụm từ trừu tượng bị cấm.
- [ ] Lesson có cung bậc, LO liên quan, vật liệu gia đình và ít nhất một activity ngoài màn hình.
- [ ] `D-LD`: 15–30 phút không warning; 5–14/31–45 có warning; >45 là error.
- [ ] Publish activity version mới giữ `entity_id`; lesson phân giải đúng bản published mới nhất theo `D-AE`.
- [ ] Hàng activity/lesson đã published vẫn bất biến; copy-on-write không sửa quan hệ của version cũ.

**Kiểm chứng:** `pnpm test -- lesson-model activity-versioning` xanh; test tham chiếu toàn bộ
`BR-LSM-*`.

**Phụ thuộc:** T3 · lifecycle/versioning P0.6 · **Cỡ:** M

### Checkpoint B — Model dùng chung

- [ ] Validator activity + lesson phủ đủ `BR-ACM-*` và `BR-LSM-*`.
- [ ] Versioning activity giữ lineage và bất biến hàng `published`.
- [ ] Test model xanh trước khi mở rộng seeder.

### Task 5 — Mở rộng seeder và chạy pilot

**Tiêu chí nghiệm thu**

- [ ] `seed-content/activities/*.ts` chạy trước `lessons/*.ts` trong cùng transaction; batch kind nhận `activity`.
- [ ] Tám cổng P1.10 chạy trên cả activity và lesson; warning được lưu trong checklist snapshot.
- [ ] Pilot gồm **6 lesson distinct**, phủ ít nhất ba competency và ba band tuổi; mỗi lesson có activity ngoài màn hình.
- [ ] Pilot chỉ dry-run; sau review, sáu lesson được sửa và đưa vào Batch 01. Nhánh A dùng đúng
      sáu lesson này; nhánh B thêm lesson thứ bảy, không cộng pilot lần nữa thành 132.
- [ ] Đo số phút review, số lỗi cổng bắt và số lỗi người bắt; so baseline 3 lesson/người/ngày.
- [ ] Lệch năng lực >30% thì sửa lịch/batch size, không hạ checklist.

**Kiểm chứng:** `pnpm seed:check` · `pnpm seed:content --dry-run` · test idempotency và rollback
đều xanh.

**Phụ thuộc:** T4 · P1.10 · **Cỡ:** M

### Checkpoint C — Pilot nội dung

- [ ] Sáu lesson pilot qua đủ tám cổng và human review.
- [ ] Số đo review/lỗi đã được so với baseline; lệch >30% có quyết định lịch/batch mới.
- [ ] Idempotency và rollback xanh trước Batch 01.

### Task 6 — Biên soạn theo nhánh được duyệt

**Nhánh A — canonical giữ ≥60:** 10 work package × 6 lesson = 60. Sáu lesson pilot đã sửa là
Batch 01. Curriculum được reuse lesson theo `BR-CRM-09`; không được lặp trong cửa sổ mà rule
cấm. Mỗi batch dùng cùng acceptance chất lượng bên dưới nhưng thay “7” bằng “6”. Sau mỗi hai
batch (12 lesson), chạy coverage report, full gate và human review.

**Nhánh B — nâng lên ≥126 distinct:** 18 work package × 7 lesson như manifest dưới đây. Chỉ
được dùng manifest này sau khi contract B được duyệt.

Lặp cùng một work package 18 lần. Mỗi batch là một file seeder có kiểu và một PR review độc
lập; không gom 126 lesson vào một diff. Batch 01 chứa sáu lesson pilot đã sửa cùng lesson thứ
bảy, nên tổng cuối vẫn là 18 × 7 = **126**, không phải 132.

**Tiêu chí nghiệm thu cho mỗi batch**

- [ ] Đúng 7 lesson mới, code bất biến và không trùng/gần-trùng corpus đã merge.
- [ ] Mỗi lesson có activity ngoài màn hình, guide đủ năm phần và assessment quan sát được.
- [ ] Skill/LO tồn tại; band suy ra không rỗng; vật liệu qua cổng an toàn.
- [ ] Người reviewer sư phạm mở và đọc từng lesson; ghi người duyệt và checklist snapshot.
- [ ] `seed:check` và `seed:content --dry-run --batch=<batch>` xanh.

**Checkpoint sau mỗi 3 batch (21 lesson)**

- [ ] Đo lại tốc độ review; 21 lesson tương ứng khoảng 7 reviewer-day theo baseline.
- [ ] Báo cáo phủ competency/band tuổi không có vùng bỏ trống kéo dài sang checkpoint sau.
- [ ] Full gate xanh và human review diff trước khi đi tiếp.

**Cổng corpus cuối:** nhánh A có ít nhất 60 lesson published và reuse đúng `BR-CRM-09`; nhánh B
có đúng 126 lesson distinct. Activity được dùng ở nhiều lesson khi phù hợp.

**Kiểm chứng:** sau mỗi batch, `pnpm seed:check` và dry-run riêng batch xanh; checkpoint theo
nhánh có full gate + báo cáo phủ + human review; cổng cuối đếm đúng target đã duyệt.

**Phụ thuộc:** T5 · Checkpoint 0 · **Cỡ:** nhánh A có 10, nhánh B có 18 work package S/M,
bắt buộc tuần tự theo batch code

### Task 7 — Dashboard, evidence và promote

**Tiêu chí nghiệm thu**

- [ ] Bật nguồn thật cho thẻ `lesson published` của `D-IX`; số lấy từ hàng published, không hardcode.
- [ ] Giữ `D-KK` tier curriculum và `D-KP curriculum_health` ở `pending_source: P3.3`.
- [ ] Mỗi `BR-ACM-*` và `BR-LSM-*` có test tham chiếu; toàn bộ target lesson đã duyệt có
      provenance và review log.
- [ ] Hai spec model sang `implemented`; spec authoring P3.2 vẫn `approved`.
- [ ] Tick P3.1 trong Task #14 chỉ khi `pnpm check:progress` tự xanh.

**Kiểm chứng:** `pnpm check && pnpm test && pnpm lint:specs && pnpm check:progress` xanh.

**Phụ thuộc:** T6 · **Cỡ:** S

## 6. Rủi ro và giảm thiểu

| Rủi ro | Hậu quả | Giảm thiểu |
|---|---|---|
| Chạy manifest 126 khi chưa sửa contract | Hai định nghĩa MVP cùng tồn tại | Checkpoint 0 + T1 + tìm toàn corpus |
| Tự ánh xạ enum legacy | Nội dung đổi nghĩa âm thầm | D-LB — abort, người phân loại tay |
| Suy band bằng hợp thay vì giao | Activity lọt xuống tuổi nhỏ hơn | D-LC + test khoảng giao |
| Cổng heuristic được coi là reviewer | Nội dung nguy hiểm vẫn qua | D-LE + người đọc từng lesson |
| Dồn corpus vào một PR | Không thể review thật | Nhánh A 10×6 hoặc nhánh B 18×7, checkpoint định kỳ |
| Tick P3.1 khi P2 chưa xong | Dùng interface tưởng tượng | Preflight + `check:progress` |
| Bật nợ curriculum ở P3.1 | Dashboard/export trả số 0 giả | Chỉ bật thẻ lesson; giữ P3.3 pending |

## 7. Ngoài phạm vi

- Route và UI Studio cho lesson/activity — P3.2.
- Curriculum, builder, `curriculum_health` và ưu tiên review theo tuần — P3.3.
- Ảnh minh hoạ activity ngoài màn hình — P4.
- Worksheet model và seed worksheet — P4.
- Chạy `seed:content` ngoài local, merge PR hoặc publish tự động — cấm theo D7.

## 8. Giả định

1. Activity luôn được tái sử dụng; chính sách lặp lesson phụ thuộc nhánh được duyệt ở
   Checkpoint 0.
2. Nhóm Nội dung giữ baseline `D-CN`: 3 lesson/người review/ngày, đo lại sau pilot.
3. `instruction` và `guide` tiếp tục là text trong DB; cấu trúc typed chỉ là interface
   authoring/seed để validator dùng chung.
4. Task #54 không bắt đầu implementation khi bất kỳ cổng P0–P2 nào còn đỏ.
