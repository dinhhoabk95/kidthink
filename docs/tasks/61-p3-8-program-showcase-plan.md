# Kế hoạch — Task #61: P3.8 — Trưng bày chương trình ra public

> Viết 2026-08-11, đo tại commit `484ebaf` trên working tree đang triển khai P0.9.
> Bước sở hữu: **P3.8** của
> [`14-implementation-sequence-todo.md`](14-implementation-sequence-todo.md).
> Spec sở hữu: [`program-showcase.md`](../specs/02-public/program-showcase.md).
> Task trước: [`60-p3-7-advanced-report-plan.md`](60-p3-7-advanced-report-plan.md).
>
> ```sh
> export PATH=/Users/macbook/.nvm/versions/node/v24.15.0/bin:$PATH
> ```

## Tóm tắt

P3.8 là lát dọc cuối của MVP: lấy curriculum đã được P3.3 duyệt, chiếu thành API công khai an
toàn, render hai trang `/chuong-trinh`, đưa URL vào sitemap và sinh JSON-LD `Course` từ đúng dữ
liệu đang hiển thị.

Task này giao bốn kết quả:

1. Projection public dạng allow-list; không trường nội dung trả phí nào có thể lọt qua phép
   spread object hoặc quan hệ lồng nhau.
2. `GET /api/guest/curricula` và `GET /api/guest/curricula/{code}` đúng cache, đúng 410, chỉ đọc
   bản `published`.
3. Trang danh sách và chi tiết đọc được khi tắt JavaScript, có meta/canonical/sitemap/JSON-LD
   sinh từ dữ liệu và CTA không làm bẩn cache công khai.
4. Evidence cho `BR-PSH-*`, promote spec P3.8, rồi kiểm **toàn bộ** cổng ra P3; Task #61 không
   tự tick các bước P3.1–P3.7 thay cho evidence của chúng.

P3.8 không thêm nội dung curriculum, không publish/seed, không sửa hàng `published`, và không
thay hạ tầng SEO đã thuộc P1.13.

## 0. Điều kiện tiên quyết

| Phụ thuộc | Điều kiện vào |
|---|---|
| P1.13 · Task #39 | Hạ tầng meta, canonical, sitemap động, JSON-LD, cổng no-JS/cloaking và ngân sách public đã `implemented` |
| P2.8 · Task #50 | Transition publish/archive và invalidation hook dùng được; không có đường publish riêng cho P3.8 |
| P3.3 · Task #56 | Curriculum schema cuối, năm curriculum hoặc điểm cắt đã duyệt, và ít nhất một curriculum `published` |
| P3.4 · Task #57 | Route ghi danh và luật CTA theo trạng thái người xem đã tồn tại |
| `CONTENT-LIFECYCLE` | Bản `published` bất biến; `archived` không còn ở list/sitemap |
| `ACCESS-GATING` | Public chỉ thấy metadata; quyền chơi/ghi danh vẫn được kiểm ở server |

**Stop condition:** chưa đạt P3.3 hoặc hạ tầng P1.13 chưa tồn tại thì chỉ được làm T0–T1. Không
viết route/page giả dựa trên interface của plan chưa implement.

## 1. Đo được

### 1.1 P3.8 chưa có code

Tại commit đo, `apps/web` mới có auth và guest taxonomy. Chưa có page public, route curriculum,
Nuxt SEO module hay nguồn `sitemap-programs.xml`. Điều này phù hợp trạng thái đang triển khai
P0.9; T0 phải đo lại sau P1.13 và P3.3, không dùng đường dẫn hiện tại như contract tương lai.

### 1.2 Schema hiện tại chưa đủ, nhưng chủ sửa là P3.3

[`packages/db/src/schema/curriculum.ts`](../../packages/db/src/schema/curriculum.ts) hiện chưa có
`program_type`, band tuổi, `duration_weeks`, `sessions_per_week`, `week_no`, `session_no` hay
mục tiêu tuần. Task #56 đã nhận trách nhiệm đó qua `D-LS` và `D-LT`.

P3.8 **không** tạo migration thứ hai. Nếu output thật của P3.3 khác plan, T0 cập nhật projection
public theo contract đã merge; không kéo schema ngược vào Task #61.

### 1.3 Nhóm trưng bày chưa khớp kiểu dữ liệu P3.3

[`program-showcase.md`](../specs/02-public/program-showcase.md) §4/§7.2 yêu cầu nhóm **theo
tuổi · theo năng lực · chuyên đề**. Task #56 dự kiến `program_type = age_based | journey`, còn
năm chương trình MVP là bốn chương trình theo tuổi + một hành trình 42 tuần. Không có nguồn cho
hai nhóm `competency` và `topic`, và `journey` không có nhóm hiển thị trong spec.

Đây là lệch contract, không phải chi tiết UI. Phải chốt ở T1; cấm sinh hai heading rỗng hoặc tự
gắn hành trình vào một nhóm không đúng nghĩa.

### 1.4 Biên public chưa có DTO đóng

Spec cấm `content_pack` nhưng chưa khai response shape. Nếu route trả hàng Drizzle kèm quan hệ,
`content_pack`, `guide`, `instruction`, internal `id` hoặc `entity_id` có thể lọt ra theo
đường lồng nhau dù route không chọn chúng trực tiếp.

Hai tuần đầu chỉ cần **tên hoạt động**. Từ tuần 3 chỉ cần chủ đề/tóm tắt cấu trúc. Không có lý do
public API trả payload dùng để chơi hay hướng dẫn dạy đầy đủ.

### 1.5 410 chưa có mã lỗi đăng ký

`BR-PSH-05` yêu cầu curriculum archived trả 410, nhưng
[`error-codes.md`](../specs/00-foundation/error-codes.md) chưa có mã 410 cho nội dung archived;
410 duy nhất hiện là `SESSION_EXPIRED`. Theo boundary dự án, route không được tự chế mã lỗi.

### 1.6 Cache công khai và CTA cá nhân hoá xung đột nếu trộn cùng payload

Guest API phải `public, max-age=600`, trong khi CTA có ba trạng thái: đăng ký · nâng cấp · ghi
danh. Nếu entitlement hoặc hồ sơ trẻ lọt vào response/cache public, dữ liệu một User có thể bị
phục vụ cho User khác. Cần tách projection công khai khỏi trạng thái CTA.

### 1.7 SEO đã có chủ ở P1.13

[`seo-and-structured-data.md`](../specs/02-public/seo-and-structured-data.md) đã sở hữu:

- `sitemap-programs.xml` động từ nội dung `published`;
- `Course` + `BreadcrumbList` cho trang curriculum;
- meta/canonical/OG, SSR/no-JS, 410 và gỡ sitemap.

P3.8 chỉ **cắm nguồn curriculum** vào các seam đó. Không thêm module SEO thứ hai, không viết
sitemap tay và không tạo JSON-LD bằng chuỗi JSON thủ công.

## 2. Quyết định đề xuất — phải chốt ở Checkpoint A

**D-NF — Projection public là allow-list có schema, không serialize row DB.** Khai
`ProgramCardPublic` và `ProgramDetailPublic` ở biên dùng chung. Mapper nhận model nội bộ và tạo
object mới field-by-field; cấm object spread. Test đi sâu toàn response và cấm ít nhất:
`content_pack`, `guide`, `instruction`, `materials`, `id`, `entity_id`, `ref_id`, dữ
liệu review/provenance và đường storage.

**D-NG — Chỉ render nhóm có nguồn thật; hành trình có nhóm riêng.** MVP map `age_based` →
`age`; `journey` → `journey`. Nhóm `competency` và `topic` chỉ xuất hiện khi enum và curriculum
tương ứng được contract + seed sở hữu bổ sung. Không heading rỗng, không card giả. Vì điều này
chỉnh cách hiểu §4/§7.2, phải sửa
[`program-showcase.md`](../specs/02-public/program-showcase.md) trước code và được người sở hữu duyệt.

**D-NH — Biên xem thử là đúng hai tuần, field đóng.** Tuần 1–2 trả `goal`, số buổi và danh
sách item chỉ gồm `entity_type`, `code`, `title`, `estimated_minutes`, `access_tier`. Tuần 3
trở đi chỉ trả `week_no`, `goal`, `session_count`, `item_count`; không tên item. Trạng thái
khoá theo người xem được suy ngoài public cache từ `access_tier`, không đóng băng vào DTO. Cùng
projection dùng cho HTML và JSON-LD để tránh cloaking.

**D-NI — Cache chỉ dữ liệu công khai; CTA cá nhân hoá nằm ngoài cache.** Guest API và phần nội
dung SSR/ISR không đọc session. HTML công khai luôn có CTA nền dùng được khi không JS. Sau
hydrate, một seam user-only đổi CTA thành `Ghi danh cho bé` hoặc `Nâng cấp`; response user-only
`private, no-store` và không bao giờ được nhét vào cache key/public payload. Nếu P1.13 đã có
pattern khác đáp ứng cùng invariant, dùng pattern đó thay vì tạo seam thứ hai.

**D-NJ — Archived là một transition đồng bộ bốn đầu ra.** Transition archive làm detail trả
410 với mã đã đăng ký, loại curriculum khỏi list và sitemap, rồi invalidate cache list/detail.
Body 410 chỉ kèm tối đa ba curriculum `published` cùng band/nhóm; không trả dữ liệu curriculum
archived. Cổng hai chiều của `D-IA` được mở rộng từ game sang curriculum.

**D-NK — Nuxt dùng route có param mô tả và SEO adapter sẵn có.** Page là
`/chuong-trinh/index.vue` và `/chuong-trinh/[curriculumCode].vue`; API dùng
`[curriculumCode].get.ts` + `getRouterParam`. Nội dung chính server-rendered/ISR theo seam P1.13,
đọc được khi tắt JS. Schema `Course`, breadcrumb, canonical, sitemap và meta đi qua module đã
được P1.13 chọn; không thêm dependency nếu chưa được hỏi trước.

**D-NL — Một nguồn copy và một cổng ngôn ngữ.** Mô tả card, detail, meta và JSON-LD cùng đọc
từ dữ liệu curriculum đã duyệt. Cổng `BR-LND-06`/`BR-PSH-06` quét copy public để chặn lời hứa
kết quả; bot và người nhận cùng nội dung, không cloaking.

## 3. Contract chốt trước code

```text
GET /api/guest/curricula
    200 + Cache-Control: public, max-age=600
    → { groups: [{ code, label, programs: ProgramCardPublic[] }] }
    → chỉ curriculum published; nhóm rỗng không xuất hiện

GET /api/guest/curricula/{curriculumCode}
    200 + Cache-Control: public, max-age=600
    → ProgramDetailPublic, tuần 1–2 detail; tuần 3+ summary
    404 → code không tồn tại hoặc chưa từng public
    410 CONTENT_ARCHIVED → curriculum từng public nhưng đã archived + suggestions an toàn
```

```ts
type ShowcaseGroup = "age" | "journey" | "competency" | "topic";

interface ProgramCardPublic {
  code: string;
  title: string;
  description: string;
  group: ShowcaseGroup;
  target_age: { min: number; max: number };
  duration_weeks: number;
  sessions_per_week: number;
  access_tier: "free" | "login" | "standard" | "premium";
}

interface ProgramWeekPublic {
  week_no: number;
  goal: string;
  session_count: number;
  item_count: number;
  items?: Array<{
    entity_type: "lesson" | "game_level";
    code: string;
    title: string;
    estimated_minutes: number;
    access_tier: "free" | "login" | "standard" | "premium";
  }>;
}

interface ProgramDetailPublic extends ProgramCardPublic {
  competency_distribution: Array<{ code: string; label: string; share: number }>;
  weeks: ProgramWeekPublic[];
}
```

`items` bắt buộc có ở tuần 1–2 và bắt buộc **không có** từ tuần 3. `cta` không thuộc hai DTO
trên; CTA cá nhân hoá dùng seam `private, no-store` của D-NI.

## 4. Đồ thị phụ thuộc

```text
T0 đo lại output thật của P1.13 + P3.3 + P3.4
 └──→ T1 sửa contract D-NF…D-NL + đăng ký mã 410 + human approve
       └── Checkpoint A
           └──→ T2 projection/serializer public đóng
                 ├──→ T3 API danh sách
                 └──→ T4 API chi tiết + 410 + invalidation
                       └── Checkpoint B
                           ├──→ T5 sitemap/meta/JSON-LD
                           ├──→ T6 trang danh sách
                           └──→ T7 trang chi tiết + CTA
                                 └── Checkpoint C
                                     └──→ T8 no-JS/a11y/perf/security
                                           └──→ T9 evidence + promote + cổng ra P3
```

## 5. Task

### Task 0 — Preflight và đo lại seam đã merge

**Mô tả:** Xác nhận dependency thật và thay mọi đường dẫn “likely” bên dưới bằng seam đã có sau
P1.13/P3.3; không triển khai dựa trên plan tương lai.

**Tiêu chí nghiệm thu**

- [ ] P1.13, P2.8, P3.3 và P3.4 đều `implemented`; ít nhất một curriculum `published` đọc được.
- [ ] Ghi lại interface SEO/cache/transition/enrollment thật và shape schema curriculum cuối.
- [ ] Đối chiếu đủ `BR-PSH-*`, `BR-SEO2-*` liên quan và business-rules §7.3.

**Kiểm chứng:** `pnpm check:progress` xanh tới P3.4; báo cáo preflight không còn dependency giả.

**Phụ thuộc:** P3.3 · P3.4 · P1.13 · P2.8

**Files likely touched:** chỉ cập nhật task/spec nếu đường dẫn dự kiến đã đổi.

**Estimated scope:** S (1–2 files).

### Task 1 — Khép contract public trước code

**Mô tả:** Ghi D-NF…D-NL vào spec sở hữu, giải quyết lệch nhóm, đăng ký lỗi 410 và đóng câu hỏi
hai tuần xem thử trước khi tạo route.

**Tiêu chí nghiệm thu**

- [ ] [`program-showcase.md`](../specs/02-public/program-showcase.md) khai DTO, field cấm, nhóm
      không rỗng, biên tuần 1–2 và cache/CTA tách biệt.
- [ ] `CONTENT_ARCHIVED` (hoặc tên người sở hữu duyệt) được đăng ký 410; list/detail/sitemap/transition cùng viện dẫn một mã.
- [ ] Mọi thay đổi schema/enum nếu có được đẩy về spec P3.3 và duyệt riêng; Task #61 không tự tạo migration.

**Kiểm chứng:** `pnpm lint:specs` 0 lỗi, 0 cảnh báo mới; tìm toàn corpus không còn hai cách hiểu
khác nhau về nhóm hoặc preview tuần.

**Phụ thuộc:** T0 · human decision D-NG/D-NI

**Files likely touched:** [`program-showcase.md`](../specs/02-public/program-showcase.md),
[`error-codes.md`](../specs/00-foundation/error-codes.md), tối đa hai spec P3.3 nếu enum đổi.

**Estimated scope:** M (3–5 files).

### Checkpoint A — Contract

- [ ] D-NF…D-NL được người sở hữu review; D-NG và D-NI có quyết định tường minh.
- [ ] Mã lỗi 410 đã đăng ký; không route nào dùng code chưa có trong registry.
- [ ] Không migration, API hoặc page nào được viết trước checkpoint này.

### Task 2 — Projection và serializer public đóng

**Mô tả:** Tạo schema/mapper thuần cho card/detail để mọi consumer public dùng cùng một biên
allow-list và cùng quy tắc hai tuần.

**Tiêu chí nghiệm thu**

- [ ] Mapper field-by-field trả đúng `ProgramCardPublic`/`ProgramDetailPublic`; không object spread hoặc row DB trong type public.
- [ ] Tuần 1–2 có item metadata; tuần 3+ không có `items`; chỉ curriculum `published` vào projection.
- [ ] Property/deep-key test chứng minh toàn response không chứa bất kỳ field cấm D-NF ở mọi độ sâu.

**Kiểm chứng:** `pnpm test -- program-showcase-projection` xanh, gồm fixture cố tình nhét
`content_pack` ở quan hệ lồng nhau.

**Phụ thuộc:** Checkpoint A

**Files likely touched:** `packages/shared/src/program-showcase.ts`, test tương ứng, một server mapper.

**Estimated scope:** M (3 files).

### Task 3 — API danh sách curriculum public

**Mô tả:** Dùng projection T2 cho `GET /api/guest/curricula`; không đọc session và không viết
query public thứ hai ngoài service dùng chung.

**Tiêu chí nghiệm thu**

- [ ] Route chỉ trả curriculum `published`, nhóm theo D-NG, thứ tự ổn định và bỏ nhóm rỗng.
- [ ] Response có `Cache-Control: public, max-age=600`; không `Vary: Cookie`, entitlement hay child data.
- [ ] Draft/in_review/archived không xuất hiện; danh sách rỗng trả 200 với `groups: []`.

**Kiểm chứng:** `pnpm test -- program-showcase-list-api` xanh, gồm test cache và bốn trạng thái
lifecycle.

**Phụ thuộc:** T2

**Files likely touched:** route `curricula/index.get.ts`, service query dùng chung, integration test.

**Estimated scope:** S (2–3 files).

### Task 4 — API chi tiết, 410 và invalidation

**Mô tả:** Hoàn thiện detail route và nối archive/publish vào cache invalidation; không để một
bản 200 cũ sống sau transition.

**Tiêu chí nghiệm thu**

- [ ] Detail dùng `[curriculumCode].get.ts`, validate param và trả đúng biên preview D-NH; unknown/draft là 404.
- [ ] Archived trả 410 + mã registry + tối đa ba suggestion `published`, không field của bản archived ngoài code công khai.
- [ ] Publish/archive invalidate list, detail và nguồn sitemap; race test không phục vụ stale `content_pack` hoặc bản archived.

**Kiểm chứng:** `pnpm test -- program-showcase-detail-api program-showcase-cache` xanh; cổng
sitemap↔410 chạy hai chiều.

**Phụ thuộc:** T2 · P2.8 transition

**Files likely touched:** detail route, cache key/invalidation adapter, transition hook, integration test.

**Estimated scope:** M (4 files).

### Checkpoint B — Biên API công khai

- [ ] T2–T4 xanh; deep-key leak test và lifecycle matrix đều xanh.
- [ ] Public cache hoàn toàn độc lập cookie/session/child; ca 410 không còn trong list/sitemap.
- [ ] Người review diff projection và query trước khi dựng UI.

### Task 5 — Nguồn sitemap, meta và JSON-LD `Course`

**Mô tả:** Cắm curriculum vào hạ tầng SEO P1.13, dùng module/composable đã có và cùng projection
với HTML.

**Tiêu chí nghiệm thu**

- [ ] `sitemap-programs.xml` lấy mọi curriculum `published`, không archived; mọi URL trong sitemap trả 200.
- [ ] Detail sinh `Course` + `BreadcrumbList`, canonical/meta/OG/`vi-VN` từ dữ liệu đang hiển thị; schema không chứa field bị ẩn.
- [ ] JSON-LD và HTML khớp title, description, age band, duration; fixture lệch làm test đỏ.

**Kiểm chứng:** `pnpm test -- program-showcase-seo` xanh; schema debug/validator local không lỗi;
link checker xanh.

**Phụ thuộc:** T3 · T4 · P1.13

**Files likely touched:** sitemap source adapter, SEO composable/mapper, SEO test, route-rule config nếu seam P1.13 yêu cầu.

**Estimated scope:** M (3–4 files).

### Task 6 — Trang danh sách `/chuong-trinh`

**Mô tả:** Render nhóm/card từ API công khai, dùng pattern public P1.13 và giữ nội dung chính
đọc được không JavaScript.

**Tiêu chí nghiệm thu**

- [ ] Card hiện title, band tuổi, số tuần/buổi, phân bố năng lực, tier và link typed tới detail; không heading rỗng.
- [ ] HTML SSR/ISR có toàn bộ card khi JS tắt; loading/error/empty state bằng tiếng Việt, không hứa kết quả.
- [ ] Bàn phím và screen reader đi qua heading/card/link đúng thứ tự; thông tin không truyền chỉ bằng màu.

**Kiểm chứng:** `pnpm test:e2e -- program-showcase-list` xanh, gồm JS-off và keyboard.

**Phụ thuộc:** T3 · T5

**Files likely touched:** page index, tối đa hai component card/group, E2E test.

**Estimated scope:** M (4 files).

### Task 7 — Trang chi tiết, preview và CTA tách cache

**Mô tả:** Render structure đầy đủ + hai tuần preview; thêm CTA theo D-NI mà không trộn dữ liệu
User vào public cache.

**Tiêu chí nghiệm thu**

- [ ] Tuần 1–2 hiện tên item; tuần 3+ chỉ goal/count/tóm tắt; DOM và payload không chứa nội dung bị cấm.
- [ ] CTA nền hoạt động không JS; sau hydrate chỉ seam `private, no-store` đổi đúng guest/upgrade/enroll, và enrollment vẫn kiểm ở server.
- [ ] Archived render status 410 + suggestion; URL canonical, breadcrumb và nội dung chính vẫn đúng khi JS tắt.

**Kiểm chứng:** `pnpm test:e2e -- program-showcase-detail` xanh, gồm guest, thiếu quyền, đủ quyền,
JS-off và archived.

**Phụ thuộc:** T4 · T5 · P3.4 enrollment

**Files likely touched:** detail page, week-preview component, CTA component/seam, E2E test.

**Estimated scope:** M (4 files).

### Checkpoint C — Bề mặt public hoàn chỉnh

- [ ] T5–T7 xanh; list/detail đọc được khi tắt JS và không cloaking.
- [ ] JSON-LD `Course` khớp HTML; CTA không xuất hiện trong public cache payload.
- [ ] Human review copy tiếng Việt, hai tuần preview, state khoá trung tính và 410.

### Task 8 — Cổng cắt ngang: security, a11y và performance

**Mô tả:** Mở rộng các cổng P1.13 cho hai trang chương trình và chứng minh các invariant không
chỉ đúng ở happy path.

**Tiêu chí nghiệm thu**

- [ ] Matrix lifecycle × viewer × JS phủ 404/410/200, CTA, no-cloaking và không field cấm; mỗi `BR-PSH-*` có tên test.
- [ ] No-JS, keyboard, contrast/alt text, no-third-party-script và link checker chạy trên cả list/detail.
- [ ] LCP <2,5 s trên 4G và ngân sách page P1.1 xanh; query count không tăng theo số tuần/item.

**Kiểm chứng:** `pnpm test -- program-showcase && pnpm test:e2e -- program-showcase` xanh; báo
cáo performance và query count được lưu làm evidence.

**Phụ thuộc:** Checkpoint C

**Files likely touched:** tối đa bốn test/fixture/evidence file; dùng lại cổng P1.13.

**Estimated scope:** M (3–4 files).

### Task 9 — Evidence, promote P3.8 và kiểm cổng ra P3

**Mô tả:** Promote đúng một spec sở hữu, tick P3.8 bằng `check:progress`, rồi audit phase gate
trên evidence của cả tám increment.

**Tiêu chí nghiệm thu**

- [ ] `PROGRAM-SHOWCASE` sang `implemented`; mỗi `BR-PSH-*` có test tham chiếu và P3.8 tự xanh trong `check:progress`.
- [ ] Cổng ra P3 ở [`SPEC.md`](../SPEC.md) §13 và Task #14 được kiểm từng dòng bằng dữ liệu/test
      thật; không suy từ checkbox plan.
- [ ] Chỉ tick cổng P3 khi 120 spec `mvp: true` đều `implemented` và một trẻ đi hết curriculum thật; thiếu evidence nào thì giữ ô đó mở.

**Kiểm chứng:** `pnpm check && pnpm test && pnpm test:e2e && pnpm lint:specs && pnpm check:progress`
và `pnpm --filter @kidthink/web build` xanh.

**Phụ thuộc:** T8 · P3.1–P3.7 đã `implemented`

**Files likely touched:** [`program-showcase.md`](../specs/02-public/program-showcase.md),
Task #14 todo, evidence/check-progress test.

**Estimated scope:** S (2–3 files).

## 6. Cổng ra P3 — audit bắt buộc, không phải phạm vi implementation mới

- [ ] Ngưỡng lesson/curriculum ở [`SPEC.md`](../SPEC.md) §13 **tại thời điểm chạy** đạt bằng hàng `published`,
      hoặc có quyết định điểm cắt canonical đã merge; không đọc con số từ plan cũ.
- [ ] Curriculum player chạy từ tuần 1 tới tuần cuối; một trẻ thật hoàn thành một curriculum.
- [ ] `mastery_state` cập nhật theo `skill_id`; `p_learn ∈ [0,1]`; guest/preview không ghi.
- [ ] ZPD chỉ đổi biến thể trong bước, không nhảy curriculum.
- [ ] Báo cáo nâng cao có competency/domain/skill và nhãn không kết luận quá mức.
- [ ] Một trẻ có ≥4 tuần nội dung liên tục không lặp theo rule canonical.
- [ ] 120 spec `mvp: true` đều `implemented`; toàn bộ gate dự án xanh.

Task #61 chỉ thu evidence và tick sau khi các owner trước đã hoàn tất. Nó không “sửa cho xanh”
bằng cách hạ ngưỡng, đổi status hoặc nới test của P3.1–P3.7.

## 7. Rủi ro và giảm thiểu

| Rủi ro | Hậu quả | Giảm thiểu |
|---|---|---|
| Nhóm spec không có dữ liệu | Heading rỗng hoặc phân loại sai nghĩa | D-NG + contract-first + chỉ nhóm có nguồn thật |
| Serialize row DB | Rò `content_pack`/hướng dẫn/nội bộ | D-NF + mapper field-by-field + deep-key test |
| Tuần 3+ vẫn trả item title | Lộ nhiều hơn mẫu hai tuần | D-NH + property test theo mọi `week_no` |
| CTA nằm trong public cache | Dữ liệu User A phục vụ User B | D-NI + seam `private, no-store` |
| Archive còn cache/sitemap | Bot hoặc phụ huynh thấy chương trình đã bỏ | D-NJ + invalidation + cổng hai chiều |
| JSON-LD viết riêng HTML | Cloaking hoặc schema nói khác trang | D-NK/D-NL + cùng projection + parity test |
| Tạo hạ tầng SEO thứ hai | Hai sitemap/canonical drift | T5 chỉ cắm seam P1.13 |
| Tick phase bằng checklist | MVP được tuyên bố xong khi flow thật chưa chạy | T9 audit từng dòng bằng evidence authoritative |

## 8. Open questions cần người duyệt ở Checkpoint A

1. Chấp nhận D-NG (chỉ nhóm có dữ liệu + nhóm hành trình riêng), hay mở rộng `program_type` và
   corpus P3.3 để thật sự có nhóm theo năng lực/chuyên đề?
2. CTA không JS có cần cá nhân hoá đúng trạng thái User không? D-NI đề xuất CTA nền công khai,
   chỉ cá nhân hoá sau hydrate để bảo vệ cache.
3. Tên mã 410 dùng `CONTENT_ARCHIVED` hay một mã generic khác? Dù chọn tên nào, phải đăng ký
   trước và dùng chung cho game/curriculum nếu nghĩa giống nhau.

## 9. Ngoài phạm vi

- Soạn, seed, review hoặc publish curriculum/lesson — P3.1/P3.3.
- Thay đổi curriculum builder/player/adaptive/report — P3.3–P3.7.
- Trang chương trình cá nhân/add-on — P4.
- Analytics bên thứ ba, A/B testing, recommendation ML.
- Thêm dependency, đổi design token hoặc schema mà chưa hỏi trước.
- Auto-merge, chạy seed/migration ngoài local, sửa hàng `published`.

## 10. Giả định và điều kiện dừng

1. Task #39 để lại seam SEO/cache/no-JS dùng lại được; nếu không, sửa ở owner P1.13 trước thay vì
   dựng bản riêng trong P3.8.
2. Task #56 chốt schema curriculum và có ít nhất một bản `published`; Task #61 không sở hữu
   migration curriculum.
3. D-NF…D-NL là đề xuất trong plan cho tới khi Checkpoint A được người review.
4. Không có mã lỗi 410 được duyệt thì dừng T4; không tự trả một string chưa đăng ký.
5. Không chứng minh được cổng ra P3 thì chỉ hoàn thành P3.8, không đánh dấu phase/MVP xong.
