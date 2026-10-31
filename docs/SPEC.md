---
spec: ROOT
title: MindKid — Project Specification
version: 2.0.0-draft
status: draft — chờ duyệt
created: 2026-08-04
reviewed: 2026-10-18
---

# MindKid — Project Specification

> Contract toàn dự án. Spec module chi tiết nằm ở [`specs/`](specs/index.md); file này chốt
> quyết định định hình, kiến trúc nội dung, quyền, dữ liệu trẻ, stack và phase gate.
>
> Nguồn: PRD phân tích 2026-08-04 + hiệu chỉnh của product owner.

## Quy trình

```
SPECIFY ──→ PLAN ──→ TASKS ──→ IMPLEMENT
```

Đổi **contract, schema, public API, quyền, giới hạn, giá, hành vi lỗi** → bắt đầu
ở Specify. Sửa một dòng phục hồi contract đã có → đi thẳng Implement.
Quy tắc thô: nếu có người sẽ ngạc nhiên vì kết quả, việc đó cần spec trước.

---

## 0. Mười hai quyết định định hình sản phẩm

Mỗi dòng là một quyết định đã chốt, kèm lý do.

| #       | Quyết định                                                                                                                                                                                                                                                                                                       | Lý do                                                                                                                                                                                                                                                                      |
| ------- | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | -------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| **D1**  | **Toàn bộ dữ liệu chuẩn và nội dung học tập là code-owned**: định nghĩa trong hằng số TS (`packages/*`), nạp cứng idempotent vào DB qua seeder, admin read-only                                                                                                                                                  | Quản lý toàn bộ taxonomy, gói, game level, curriculum và skill dataset trong repo giúp kiểm soát chất lượng qua cổng tự động + PR review, tái lập môi trường 100%, loại bỏ độ phức tạp của Studio CRUD và cổng duyệt runtime                                                |
| **D2**  | **Template + Instance** thay cho 60 Session class rời                                                                                                                                                                                                                                                            | Một template phục vụ hàng chục mục tiêu học tập. Đổi `content_pack` → game khác hẳn về sư phạm, 0 dòng code                                                                                                                                                                |
| **D3**  | **Catalog MVP đúng 2 SKU**: `standard`, `premium`. Premium bao hàm quyền _học_ của Creator. Quyền _tạo_ nằm ở add-on, **spec đủ nhưng chưa bán**                                                                                                                                                                 | Bán gói không mở được tính năng nào là vấn đề đạo đức thương mại. Add-on lên catalog cùng lúc với tính năng của nó                                                                                                                                                         |
| **D4**  | **Không có thư viện ảnh hay kho asset động.** Emoji (`packages/emoji`) là kho cố định duy nhất cho vật liệu hiển thị                                                                                                                                                                                             | Loại bỏ hoàn toàn bảng lưu trữ ảnh/audio động (`content_images`, `content_audio`, `content_asset_refs`) và pipeline upload phức tạp; emoji tải tức thì, chi phí bằng 0, đồng nhất trên mọi môi trường                                                                      |
| **D5**  | **Mỗi mã nội dung là duy nhất (1 dòng trên mỗi `code`), không đa version.** `game_levels`, `curricula`, `skill_datasets` có `code UNIQUE` và dùng `id` trực tiếp                                                                                                                                                 | Nội dung được quản lý phiên bản ngay trong Git qua seeder; bỏ cơ chế đa version (`entity_id`, `content_version`, trạng thái duyệt Studio) trong DB giúp truy vấn, FK và telemetry đơn giản, minh bạch                                                                      |
| **D6**  | **Tuân thủ Luật Bảo vệ dữ liệu cá nhân 91/2025/QH15, Nghị định 13/2023 và Luật Trẻ em (VN)** là ràng buộc thiết kế, không phải checklist cuối                                                                                                                                                                    | Thu dữ liệu trẻ vượt nhu cầu là thứ không rút lại được sau khi đã ghi; Luật 91/2025/QH15 đã có hiệu lực từ 01/01/2026 và là căn cứ hiện hành không được bỏ sót                                                                                                             |
| **D7**  | **AI soạn trong repo, người merge.** AI agent IDE hỗ trợ viết seeder nội dung và code; cổng người là **PR review**, và merge chính là phát hành. Cấm có LLM nào chạy trong hệ thống để sinh nội dung                                                                                                             | Ranh giới cũ ("NEVER để AI sinh nội dung cốt lõi") đặt sai chỗ. Cái cần cấm không phải việc **soạn thảo**, mà việc **phát hành không có người kiểm**. Đặt cổng ở PR thì cổng đó có diff, có `git blame`, và revert được bằng một lệnh                                      |
| **D8**  | **Tên dự án là MindKid.** Package scope `@mindkid/*`, domain và mọi chuỗi hiển thị người dùng dùng tên này | Product owner chốt thương hiệu trước dòng code đầu tiên, để không phải đổi tên giữa chừng khi đã có package, domain trỏ DNS và nội dung đã phát hành |
| **D9**  | **Một repo `mindkid/`, viết theo spec từ dòng code đầu tiên.** Tài sản nhập vào repo (taxonomy, kho emoji, lõi game engine) đi qua cổng chọn lọc của [`docs/specs/00-foundation/repo-bootstrap.md`](specs/00-foundation/repo-bootstrap.md) | Spec gộp nhiều outcome thì không trả lời được câu "tính năng này xong chưa" (mục 14.1). Code viết sau spec một-outcome-một-file thì mỗi file có đúng một contract để đối chiếu |
| **D10** | **Ưu tiên adopt thư viện Nuxt ecosystem đã kiểm chứng** (auth, sitemap/SEO, cache, queue) thay vì tự xây từ đầu. Khi cần dùng chung nhiều app, bọc lại thành **package driver nội bộ** — xem [`docs/specs/00-foundation/monorepo-package-architecture.md`](specs/00-foundation/monorepo-package-architecture.md) | Tự xây auth/queue/sitemap không tạo khác biệt cạnh tranh, chỉ tốn thời gian dev và mang rủi ro bảo mật tự phát hiện. Thư viện phổ biến có test, security patch, cộng đồng review. Driver nội bộ giữ interface ổn định cho nhiều app và không khoá cứng vào một thư viện    |
| **D11** | **Phạm vi hiện hành là web-only và vận hành tại Việt Nam.** PWA vẫn là web delivery; native mobile app, classroom/B2B, licensing/white-label, marketplace và mở thị trường ngoài Việt Nam không có spec triển khai, task hay placeholder schema trong roadmap hiện hành.                                         | Lập kế hoạch cho một mô hình sản phẩm chưa được chọn tạo contract giả và kéo theo actor, pháp lý, thanh toán, store review hoặc multi-tenancy không cần thiết. Nếu sau này mở rộng, người quyết phải mở một chương trình scope mới và viết spec sở hữu trước khi lập task. |
| **D12** | **Tài liệu pháp lý là singleton code-owned, không quản lý policy version.** Sửa nội dung bằng PR; sau deploy, `super_admin` chủ động force re-consent bằng một mốc thời gian cho từng loại `terms` · `privacy` · `child_data`.                                                                                   | Hệ thống chỉ cần biết User đã đồng ý trước hay sau lần force gần nhất. Lịch sử Git + audit của thao tác force giữ dấu vận hành; dựng kho version và diff policy tạo thêm schema, route và UI nhưng không tăng giá trị sản phẩm tương xứng.                                 |

### D7 chi tiết — hai luồng, cùng một cổng

```
người + AI agent IDE ──soạn──► file trong repo ──cổng tự động──► PR review ──merge──► phát hành
                                                                ▲
                                              CỔNG NGƯỜI ở đây, không ở runtime
```

| Luồng            | Soạn gì                                                                                                   | Cổng                                                                           | Spec                                               |
| ---------------- | --------------------------------------------------------------------------------------------------------- | ------------------------------------------------------------------------------ | -------------------------------------------------- |
| **Nội dung nền** | Seeder cho game level · learning objective · curriculum · skill dataset, chia theo **năng lực C1–C6** | 10 cổng tự động → PR review → `pnpm --filter @mindkid/content-build seed:content` nạp trực tiếp vào DB | `docs/specs/01-platform/content-seed-authoring.md` |
| **Code**         | Zod · Drizzle · route skeleton · test từ Gherkin · Session class                                          | PR có người review; sáu vùng nhạy cảm cần review tăng cường (cổng so spec ↔ code đã gỡ 2026-08-29) | `docs/specs/01-platform/ai-codegen-pipeline.md`    |

**Ngoại lệ Task #14, chốt ngày 2026-08-09:** trong phạm vi triển khai
[`14-implementation-sequence-plan.md`](tasks/14-implementation-sequence-plan.md), AI được phép
sinh code trong sáu vùng nhạy cảm: auth · thanh toán · gating · dữ liệu trẻ · code điều phối
migration · xử lý nội dung. Mỗi increment ở các vùng này phải đi từ spec tới
test âm, qua `pnpm check` + `pnpm test`, rồi được người review diff trước merge.

Ngoại lệ chỉ mở quyền **soạn code trong repo**. Nó không cho phép auto-merge, chạy migration
ngoài local, hoặc phát hành nội dung không qua review.
Mọi invariant ở mục 7.3 của
[`business-rules.md`](specs/00-foundation/business-rules.md) giữ nguyên. Ranh giới review tăng
cường vẫn đặt theo _hậu quả khi sai_, không theo _độ khó khi viết_.

Toàn bộ nội dung (`game_levels`, `curricula`, `skill_datasets`) được gán cứng qua seeder dữ liệu;
không còn UI Authoring Studio hay cơ chế đa version trong DB.

Đây là câu trả lời một phần cho §15 Q3 — nó giảm chi phí **soạn**, không giảm chi phí
**đọc review**.

**Ngoài phạm vi hiện hành:** multi-tenancy, `tenant_id`, school admin, class roster,
classroom, marketplace, leaderboard công khai, mạng xã hội, nhiều cấp admin, native mobile app,
licensing và white-label. Không giữ task hay placeholder để “làm sau”; mở lại mục nào phải đổi
canonical scope và viết spec trước.

---

## 1. Objective

### 1.1 Vision

Nền tảng **khai phá tư duy qua trò chơi** cho trẻ 3–6 tuổi, web-first, tablet-first.

Không dạy phép tính trước tuổi. Phát triển sáu năng lực tư duy nền tảng qua trò chơi
tương tác, chương trình biên soạn sẵn, và báo cáo tiến bộ cho người lớn.

Tham khảo Kogumakai (xương sống tư duy toán), Montessori, Dienes, Singapore Early Math,
Froebel, Tools of the Mind, Visible Thinking. Không sao chép nguyên bản chương trình nào.

**Không phải** website AI sinh bài học. **Mà là** thư viện được người biên soạn và kiểm
duyệt. Lợi thế cạnh tranh nằm ở dữ liệu đã cấu trúc và khả năng tái tổ hợp nó thành nhiều
lộ trình mà không phải làm lại nội dung.

### 1.2 Giá trị cốt lõi theo tác nhân

| Tác nhân         | Nhận được gì                                                                                                                                                                               |
| ---------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ |
| **Trẻ**          | Game hợp tuổi, ít chữ, thao tác lớn, phản hồi tích cực, không áp lực điểm số                                                                                                               |
| **User**         | Biết trẻ chơi gì, tiến bộ ra sao; chọn được chương trình; quản lý giờ chơi và nhiều hồ sơ trẻ; dùng kho trò chơi và lộ trình đã kiểm duyệt. _(Công cụ tạo nội dung là add-on, ngoài MVP)_ |
| **Doanh nghiệp** | Thư viện nội dung sở hữu riêng, tái dùng cho nhiều chương trình và bán được theo gói trên web                                                                                              |

`User` là **một** tác nhân, dùng ở nhà hay trên lớp đều vậy — không có persona, không có
role. Cách gọi theo ngữ cảnh: [`specs/00-foundation/glossary.md`](specs/00-foundation/glossary.md) §7.4.1.

### 1.3 Tác nhân hệ thống

Bốn tác nhân. **Không có persona enum, không có cột `role` trên `users`** — năng lực suy
ra từ entitlement đã mua.

| Tác nhân          | Bảng             | Guard                  | Đặc điểm                                                                                                                                                                                           |
| ----------------- | ---------------- | ---------------------- | -------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| **Guest**         | không có record  | không                  | Chưa đăng nhập. Chơi allow-list game `free`, **không lưu tiến độ**                                                                                                                                 |
| **User**          | `users`          | `requireUserAuth()`    | Một loại duy nhất, không phân biệt dùng ở nhà hay trên lớp. Năng lực = `entitlements[]`. Vào bằng mật khẩu **hoặc** SNS (Google/Facebook) — nhiều SNS trên một tài khoản, `password_hash` nullable |
| **Child profile** | `child_profiles` | không (thuộc User)     | 1–5 mỗi User, tuổi 3–6, **không có tài khoản riêng, không có credential**                                                                                                                          |
| **Manager**       | `managers`       | `requireManagerAuth()` | `role`: `super_admin` \| `content_reviewer`. Vận hành, duyệt thanh toán, tra cứu taxonomy/catalog, kiểm toán hệ thống                                                                                                 |

Manager **không tự đăng ký** — không endpoint public nào tạo manager, và Manager
**không bao giờ đăng nhập bằng SNS** (`BR-AUT-15`).

MFA: **bắt buộc** cho Manager, **tuỳ chọn** cho User (P2, ngoài MVP). SNS là yếu tố **thứ
nhất** — nó không thay MFA (`BR-MFA-09`).

### 1.4 Bốn bề mặt

| Bề mặt      | URL                | Đối tượng            | Nội dung                                                             |
| ----------- | ------------------ | -------------------- | -------------------------------------------------------------------- |
| **Public**  | `{domain}`         | Khách chưa đăng nhập | LP, chương trình theo C1–C6, catalog game, pricing, SEO, pháp lý     |
| **Play**    | `{domain}/play/**` | Trẻ 3–6              | Canvas game engine. **Core business.** Light-only, không `dark:`     |
| **Account** | `{domain}/me/**`   | User đã đăng nhập    | Dashboard, quản lý trẻ, báo cáo, thư viện, thanh toán                |
| **Admin**   | `admin.{domain}`   | Manager              | Dashboard, users, duyệt thanh toán, catalog, taxonomy, audit         |

### 1.5 Access ladder — bốn bậc bao hàm

```
premium  ⊃  standard  ⊃  login  ⊃  free
```

`content.access_tier ∈ {free, login, standard, premium}`. **Kiểm ở server, không ở client.**

| Bậc        | Điều kiện vào                                         | Lưu tiến độ | Giới hạn lượt         |
| ---------- | ----------------------------------------------------- | :---------: | --------------------- |
| `free`     | Không cần gì                                          |     Cấm     | Không giới hạn        |
| `login`    | Đăng nhập + `active_child_id` hợp lệ (kiểm ownership) |             | Theo healthy-play cap |
| `standard` | `hasEntitlement(uid, 'play_standard_games')`          |             | Theo healthy-play cap |
| `premium`  | `hasEntitlement(uid, 'play_premium_games')`           |             | Theo healthy-play cap |

**Allow-list guest** — 6 game level `free`, một cho mỗi competency C1–C6, difficulty 1–2.
Không giới hạn lượt.

_Vì sao không giới hạn lượt cho guest:_ quota theo cookie thiết bị dễ vượt (xoá cookie là
reset) nên nó chỉ làm phiền người thật mà không chặn được ai. Allow-list hẹp mới là thứ
tạo lý do đăng ký.

**Mặc định phải là đóng.** Content thiếu `access_tier` **không** được coi là `free` —
quên gán tier là cho không nội dung.

### 1.6 SKU và add-on

**Catalog MVP đúng hai gói.**

| Gói            | `code`     | Đối tượng         | Giá                 | Thời hạn             |
| -------------- | ---------- | ----------------- | ------------------- | -------------------- |
| **Tiêu chuẩn** | `standard` | User phổ thông    | _chờ chốt_ — §15 Q1 | 365 ngày             |
| **Premium**    | `premium`  | User theo dõi sâu | _chờ chốt_ — §15 Q1 | 365 ngày / vĩnh viễn |

Premium **bao hàm toàn bộ quyền học của Creator** — xem mọi nội dung, báo cáo nâng cao,
curriculum đặc biệt. Đây là hiệu chỉnh so với PRD: không tách gói Creator riêng.

**Add-on — spec đầy đủ, KHÔNG lên catalog MVP.**

| Add-on             | `code`              | Mở gì                                            | Bán lại khi                                 |
| ------------------ | ------------------- | ------------------------------------------------ | ------------------------------------------- |
| Curriculum cá nhân | `addon_curriculum`  | Tạo và lưu curriculum riêng                      | Curriculum Builder cá nhân chạy             |
| Game cá nhân       | `addon_custom_game` | Custom Game Builder từ template                  | Builder + validation chạy                   |
| AI hỗ trợ          | `addon_ai`          | Tóm tắt báo cáo, gợi ý nội dung                  | Ledger credit tồn tại + UI chạy             |

Add-on là **trục độc lập**: không mở tier game, và không gói nào tự động kèm add-on.
_Lý do:_ chi phí AI là biến phí theo lượt dùng; gộp vào thuê bao cố định làm mất kiểm soát
KPI chi phí. Công cụ tạo nội dung có chi phí hỗ trợ và kiểm duyệt riêng.

**Thanh toán MVP: VietQR chuyển khoản + Manager duyệt tay.** Không cổng tự động.

### 1.7 KPI

| Nhóm        | KPI                                   | Mục tiêu                       |
| ----------- | ------------------------------------- | ------------------------------ |
| Acquisition | Visitor → đăng ký                     | ≥ 8%                           |
|             | Guest chơi game free → tạo tài khoản  | ≥ 15%                          |
| Activation  | Tạo Child Profile trong 24h đầu       | ≥ 70%                          |
|             | Hoàn thành 3 game trong tuần đầu      | ≥ 50%                          |
| Engagement  | D1 / D7 retention                     | ≥ 50% / ≥ 30%                  |
|             | Ngày active mỗi tuần / trẻ            | ≥ 3                            |
| Revenue     | Free → paid                           | ≥ 5%                           |
|             | Thời gian xử lý payment request       | P90 < 12 giờ                   |
| Kỹ thuật    | Uptime SLO                            | 99,7%                          |
|             | API P95                               | < 800 ms                       |
|             | Game engine                           | 60 fps trên tablet Android 2GB |
| Nội dung    | Skill có ≥ 1 game level               | 100% skill `seeded`            |
| Sư phạm     | Task Comprehension (lượt đầu)         | ≥ 85% phân tầng nhóm tuổi      |
|             | Independent Transition (sau trợ giúp) | ≥ 75% phân tầng competency     |
|             | Strategy Exploration (sau retry)      | ≥ 70%                          |
|             | Playtest an toàn & zero PII           | 100% phiên có consent & assent |

### 1.8 Quy mô nội dung MVP

| Lớp                   |                                                                 MVP |     Sau MVP |
| --------------------- | ------------------------------------------------------------------: | ----------: |
| Competency            |                                                                   6 |           6 |
| Strand                |                                                                  41 |          41 |
| Skill                 |                                                             **230** |     350–500 |
| Learning Objective    |                                            **≥ 690** (≥3 mỗi skill) | 1.500–2.500 |
| Game Template         |                                                               **6** |       25–30 |
| Game Level (instance) |                                      **≥ 120** (≥20 mỗi competency) |      3.000+ |
| Curriculum            | **5** (4 theo tuổi + 1 chương trình 42 tuần, phát hành 12 tuần đầu) |        8–10 |

Đủ để một trẻ quay lại trong **4–8 tuần** — tiêu chí MVP thành công. Cột "Sau MVP" là mốc
quy mô sản phẩm mục tiêu sau khi MVP đạt, không phải cam kết phase.

Hiện trạng đo 2026-10-18 (đã vượt sàn MVP ở ba lớp): **76** strand, **443** skill, **38** khuôn
`GT-000`…`GT-037` (danh sách: [`specs/01-platform/engines/index.md`](specs/01-platform/engines/index.md)).

---

## 2. Kiến trúc nội dung

### 2.1 Dữ liệu code-owned nạp cứng từ seeder — quyết định D1

|                   | **Danh mục nền (Master)**                                                                                                                               | **Nội dung học tập (Content)**                                                                |
| ----------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------- | --------------------------------------------------------------------------------------------- |
| Nguồn sự thật     | Hằng số TS trong `packages/*`, seed idempotent vào DB                                                                                                   | Hằng số TS trong `packages/content/`, nạp cứng idempotent vào DB qua `@mindkid/content-build` |
| Admin làm được gì | **Chỉ đọc.** Không tạo, không sửa, không xoá                                                                                                            | **Chỉ đọc.** Không còn Authoring Studio hay cổng duyệt runtime                                |
| Đổi bằng cách nào | Sửa hằng số → PR → migration/seed → deploy                                                                                                              | Sửa seeder trong repo → 10 cổng tự động → PR review → seed → deploy                          |
| Cơ chế định danh  | `code` UNIQUE, `id` bigserial                                                                                                                           | `code` UNIQUE (1 dòng duy nhất mỗi mã), dùng `id` trực tiếp (không đa version trong DB)      |
| Bảng              | `competencies` `strands` `skills` `learning_objectives` `skill_prerequisites` `packages` `package_entitlements` `entitlement_keys` `content_tags` | `skill_datasets` `game_levels` `game_level_rounds` `curricula` `curriculum_items`             |

**Mã bất biến sau khi phát hành:** `skills.code` · `learning_objectives.code` ·
`packages.code` · `entitlement_keys.key` · `game_levels.code` · `curricula.code`.

Đặt rồi không đổi, không chèn giữa, không tái dùng số của bản đã xoá.
Format mã skill bị ép: `^C[1-6]\.[A-Z]{2,5}\.\d{2}$` — ví dụ `C1.CNT.03`.

### 2.2 Skill taxonomy — 5 tầng

```
L1  COMPETENCY          6      C1..C6
     └ L2  STRAND       41     C1.CNT Counting, C2.ORI Orientation, …
         └ L3  SKILL    230    C1.CNT.03 "đếm trong phạm vi 5"
             └ L4  LEARNING OBJECTIVE  ≥690   một hành vi quan sát được
                 └ L5  ASSET   game_level
```

| ID     | Competency                               | Strand |   Skill |
| ------ | ---------------------------------------- | -----: | ------: |
| **C1** | Tư duy toán học — Mathematical Thinking  |     10 |      99 |
| **C2** | Tư duy không gian — Spatial Thinking     |      8 |      44 |
| **C3** | Tư duy logic — Logical Thinking          |      8 |      30 |
| **C4** | Tư duy quan sát — Observation Thinking   |      4 |      16 |
| **C5** | Tư duy ngôn ngữ — Language Thinking      |      5 |      21 |
| **C6** | Chức năng điều hành — Executive Function |      6 |      20 |
|        | **Tổng**                                 | **41** | **230** |

C4/C5/C6 mỏng là **kết quả đúng**, không phải lỗi — nó đo chính xác khoảng trống nội dung
roadmap phải lấp.

Bất biến: `skill_prerequisites` là **DAG**. Một chu trình làm ZPD selector lặp vô hạn, và
nó sẽ lặp trong lúc một đứa trẻ đang chờ.

### 2.3 Ba trục metadata

Mỗi asset gắn thẻ trên ba trục **độc lập**:

| Trục         | Câu hỏi               | Từ vựng                                                                             |
| ------------ | --------------------- | ----------------------------------------------------------------------------------- |
| **what**     | Học _cái gì_?         | number, geometry, pattern, colour, category, time, money, rule                      |
| **thinking** | Rèn _cách nghĩ_ nào?  | observe, compare, sort, match, sequence, infer, predict, plan, recall, inhibit      |
| **mechanic** | Chơi _bằng cách nào_? | tap-select, drag-to-container, pair-match, sort-groups, sequence-order, memory-flip |

Hệ quả: một template phục vụ hàng chục mục tiêu học tập.

```
GT-003 drag-to-container
  ├ what=colour    thinking=observe  → C4  phân loại theo màu
  ├ what=number    thinking=compare  → C1  phân loại theo số lượng
  ├ what=rule      thinking=infer    → C3  phân loại theo quy luật
  └ what=category  thinking=sort     → C5  phân loại theo chức năng
```

Bốn game level, bốn competency, **không dòng code engine nào mới**.

`content_skill_map.weight ∈ [0,1]` điều tiết ảnh hưởng: `1.0` = mục tiêu chính,
`0.3` = có chạm tới. Không có nó, một game đếm sẽ vô tình "dạy" mọi skill nó chạm tới.

### 2.4 Template và Instance — quyết định D2

**Game Template** (Lớp 1) = mechanic + layout + content contract. **Không gắn skill.**

```ts
interface GameTemplate {
  code: string; // "GT-003"
  name: string;
  mechanic: MechanicId; // "drag-to-container"
  layouts: LayoutId[];
  content_contract: ZodSchema; // shape của content_pack template chấp nhận
  difficulty_contract: ZodSchema;
  scoring_schema: ScoringSchema;
  event_schema: EventName[];
  age_min: number;
  age_max: number;
  engine_session: string; // tên Session class thực thi
  status: ContentStatus;
  version: number;
}
```

**Game Level** (Lớp 2) = template + content_pack + theme + difficulty_params.

```ts
{
  code: "GL-C1-CNT-MATCH-0001",
  template_code: "GT-003",
  content_pack:      { /* NỘI DUNG — emoji, item, đáp án đúng */ },
  difficulty_params: { /* ĐỘ KHÓ — count, distractor, hints, time */ },
  theme_id: "farm",
  access_tier: "free" | "login" | "standard" | "premium",
  skill_ids: [...], learning_objective_ids: [...],
}
```

Cấm — **NEVER đặt trường nội dung vào `difficulty_params` hay ngược lại.** Tách đôi tồn tại để
đổi nội dung không cần code, và đổi độ khó không cần biên tập.

`content_pack` **phải parse được** bằng `content_contract` của template — kiểm ở
**server** trước khi ghi, không chỉ ở client. Một `content_pack` sai schema làm crash
engine trong lúc trẻ đang chơi.

**Sáu template MVP:**

| Code   | Tên                | Mechanic          |
| ------ | ------------------ | ----------------- |
| GT-001 | Chọn một đáp án    | tap-select        |
| GT-002 | Chọn nhiều đáp án  | tap-select-multi  |
| GT-003 | Kéo vào đích       | drag-to-container |
| GT-004 | Phân loại vào nhóm | sort-groups       |
| GT-005 | Ghép cặp           | pair-match        |
| GT-006 | Sắp xếp thứ tự     | sequence-order    |

**60 dạng game nguồn là backlog nội dung, không phải backlog code.** Mỗi dạng map thành
`content_pack` của một template có sẵn; dạng nào không map được thì đăng ký thành một template
`content_contract` hẹp. Cả hai đường dùng chung registry. Sáu template trên là sàn MVP; registry
hiện có 38 khuôn. Độ phủ 60 dạng được đo ở
[`source-game-type-coverage.md`](specs/08-quality/source-game-type-coverage.md).

### 2.5 Đơn vị nội dung học tập

**Game Level** là đơn vị học tập và tương tác cốt lõi trên nền tảng (`kind = 'teach'` cho màn làm quen khái niệm, `kind = 'assess'` cho màn chơi thực hành). Mọi bước tương tác trong lộ trình học tập đều quy về `game_levels`.

### 2.6 Curriculum = playlist

Curriculum **không phải tài sản gốc**. Là một **thứ tự** trên thư viện `game_levels`.

```
Curriculum → Week → Session → Game Level
```

Không curriculum nào bắt buộc có đủ mọi tầng; DB hỗ trợ đủ.

`program_type ∈ {age_based, competency_based, skill_based, school_readiness, logic_focus,
spatial_focus, custom}`.

Cùng một thư viện `game_levels` sinh ra lộ trình 36–42 tuần, Fast Track, Logic Track, School
Readiness — **không biên soạn lại nội dung**.

**Adaptive ≠ Curriculum.** Adaptive điều chỉnh _trong_ phạm vi bước hiện tại (chọn biến
thể, đổi `difficulty_params`). Cấm — **NEVER cho adaptive nhảy bước curriculum** — nó không có
thông tin để phủ quyết thứ tự sư phạm do người biên soạn quyết định.

### 2.7 Quản lý nội dung qua seeder — quyết định D5

Toàn bộ nội dung (`game_levels`, `curricula`, `skill_datasets`) được gán cứng qua seeder dữ liệu trong repo:
- Đã bỏ cơ chế đa version (`packages/db/src/schema/versioning.ts`), bỏ máy trạng thái 6 bước của Studio (`draft/in_review/approved/published/archived/rejected`) và bảng `content_review_log`, `content_seed_batches`.
- Mỗi `code` trong `game_levels`, `curricula`, `skill_datasets` là `UNIQUE` (1 dòng duy nhất), dùng `id` trực tiếp (không có các cột `entity_id`, `content_version`, `status`, `origin`, `authored_in`, `seed_batch_id`, `created_by_manager_id`, `reviewed_by_manager_id`, `published_at`, `archived_at`).
- Các bảng phiên chơi và thống kê (`play_sessions`, `telemetry_events`, `child_session_summaries`, `level_daily_stats`) trỏ trực tiếp tới `game_levels.id` / `curricula.id`, không có cột `content_version`.
- **Xoá nội dung đang được dùng** (`telemetry_events` trỏ tới, hoặc nằm trong `curriculum_items`) bị chặn bởi khoá ngoại / toàn vẹn dữ liệu để không làm mồ côi dữ liệu học tập của trẻ.

### 2.8 Asset — kho emoji cố định — quyết định D4

| Thuộc tính | **Emoji** |
| ---------- | --------- |
| Lớp        | Code-owned, cố định |
| Nguồn      | `packages/emoji` — 32 nhóm phân theo chủ đề học |
| Sở hữu     | Hệ thống |
| Tái dùng   | Vô hạn |

Đã loại bỏ hoàn toàn các bảng lưu trữ ảnh/audio động (`content_images`, `content_audio`, `content_asset_refs`) và luồng upload ảnh từ Studio. Emoji là vật liệu hiển thị chính vì trẻ 3–6 chưa đọc chữ và emoji là glyph nhanh nhất để giải mã; chi phí bằng 0, tải tức thì, dễ xây theme.

**Ranh giới cứng: emoji chỉ làm nội dung, không bao giờ làm affordance.** Nav, button, HUD
control, trạng thái đều dùng SVG (`i-lucide-*`). Emoji render khác nhau theo OS, không
recolour được, không mang được focus ring. Avatar trẻ chỉ chọn từ bộ preset của hệ thống — **NEVER ảnh chụp trẻ em** (§4).

---

## 3. Entitlement và quota

**Không hard-code quyền theo tên gói.**

```ts
// WRONG
if (pkg === "premium") { … }
// CORRECT
if (await hasEntitlement(userId, "play_premium_games")) { … }
```

_Lý do:_ đổi package không phải sửa code game.

### 3.1 Entitlement key

| Key                                     |      MVP      | Gói cấp                   |
| --------------------------------------- | :-----------: | ------------------------- |
| `play_free_games`                       |               | mọi tác nhân, kể cả guest |
| `play_login_games`                      |               | mọi User đã đăng nhập     |
| `play_standard_games`                   |               | standard, premium         |
| `play_premium_games`                    |               | premium                   |
| `manage_children`                       |               | mọi User đã đăng nhập     |
| `view_basic_report`                     |               | mọi User đã đăng nhập     |
| `view_advanced_report`                  |               | standard, premium         |
| `access_premium_curriculum`             |               | premium                   |
| `create_custom_curriculum`              | Cấm spec-only | `addon_curriculum`        |
| `create_custom_game`                    | Cấm spec-only | `addon_custom_game`       |
| `use_ai_analysis`                       | Cấm spec-only | `addon_ai`                |
| `export_pdf`                            | Cấm spec-only | `addon_curriculum`        |

`entitlement_keys` là Lớp 1. Một key tồn tại mà không gate được gì là một key sẽ bị dùng sai
— key add-on được khai báo nhưng **không gói MVP nào cấp**.

### 3.2 Quota

| Quota                      |            Free/Login | standard |      premium |
| -------------------------- | --------------------: | -------: | -----------: |
| Số child profile           |                     1 |        3 |            5 |
| Phút chơi mỗi ngày mỗi trẻ | theo healthy-play cap |        ↑ |            ↑ |
| Game custom lưu            |                     — |        — | — _(add-on)_ |
| Lượt AI                    |                     — |        — | — _(add-on)_ |
| Dung lượng upload          |                     — |        — | — _(add-on)_ |

### 3.3 Nguyên tắc

- **Nhiều gói cùng lúc là bình thường.** Năng lực = **hợp** của mọi entitlement `active`.
  Không gói nào ghi đè gói khác. Một người dùng sản phẩm ở nhà và trên lớp là ca dùng
  chính, không phải ca lạ.
- **Hết hạn không xoá dữ liệu.** `expired` chặn nội dung trả phí; `child_profiles`,
  `mastery_state` giữ nguyên. Mua lại là mở lại, không phải bắt đầu lại.
- **`PACKAGE_CATALOG` là nguồn sự thật duy nhất cho giá và thời hạn.** Không hardcode giá
  ở page, API, email, hay spec. Giá đổi, và một giá copy sang 5 chỗ sẽ đổi được 4.
- **Khi chặn**: strip `content_pack` và `difficulty_params`, trả `{ access_tier,
required_entitlement }`. Gửi nội dung rồi ẩn bằng UI **không phải** paywall.

### 3.4 Luồng thanh toán VietQR

```
User chọn gói
   ↓  POST /api/users/orders
payment_orders.status = 'pending'         hiện VietQR + hướng dẫn
   ↓  POST /api/users/orders/:id/proof    (mã giao dịch + ảnh chứng từ)
status = 'submitted'                      grant entitlement 'soft_unlock' SOFT_UNLOCK_DAYS=3
   ↓  Manager mở hàng đợi
   ├─ approve → status='approved' · entitlement.status='active' · expires_at = now + duration
   └─ reject  → status='rejected' · entitlement từ order đó hết NGAY trong cùng transaction
```

`payment_orders.status ∈ {draft, pending, submitted, under_review, approved, rejected,
cancelled, expired}`.
`entitlements.status ∈ {pending, soft_unlock, active, grace_period, expired, cancelled}`.

| Ràng buộc                                                 | Lý do                                           |
| --------------------------------------------------------- | ----------------------------------------------- |
| Chỉ `submitted` \| `under_review` mới approve được        |                                                 |
| **Không approve hai lần** — idempotent theo `order_id`    | Duyệt trùng tạo hai subscription                |
| Approve chạy **trong một transaction**                    | Cấp quyền fail thì không được đánh dấu approved |
| Mọi approve/reject ghi `audit_logs` + admin note bắt buộc | Luồng doanh thu phải trả lời được ai duyệt gì   |
| **Không xoá lịch sử giao dịch**                           |                                                 |
| Reject thu hồi quyền **ngay**, không chờ cron             | Soft unlock là tin tưởng có thời hạn            |

Soft unlock tồn tại vì duyệt tay có độ trễ người — người đã trả tiền không nên chờ.

---

## 4. Tuân thủ dữ liệu trẻ em — Luật 91/2025/QH15 + Nghị định 13/2023 + Luật Trẻ em — quyết định D6

Thị trường vận hành: **Việt Nam**. Không áp COPPA/GDPR-K trong roadmap hiện hành. Nếu sau này
mở thị trường ngoài Việt Nam, đó là một chương trình mở rộng mới: đổi scope và viết lại spec
này trước khi lập task, không giữ sẵn nhánh triển khai trong P5.

### 4.1 Thu tối thiểu — danh sách đóng

Child profile được phép chứa **đúng** những trường sau:

| Trường                                             | Ràng buộc                                                               |
| -------------------------------------------------- | ----------------------------------------------------------------------- |
| `display_name`                                     | Tên gọi / biệt danh. Cấm — **NEVER họ tên đầy đủ**                      |
| `birth_year` **hoặc** `age_band`                   | Cấm — **NEVER ngày sinh chính xác**                                     |
| `avatar_id`                                        | Chọn từ **bộ preset của hệ thống**. Cấm — **NEVER upload ảnh chụp trẻ** |
| `relationship`                                     | `child` \| `student` \| `other` — tuỳ chọn                              |
| `current_curriculum_id` · `daily_play_cap_minutes` | Cấu hình học                                                            |
| `child_uuid`                                       | Định danh giả cho telemetry                                             |

Cấm — **NEVER thu**: địa chỉ, trường học, lớp, ảnh thật, số điện thoại, dữ liệu sinh trắc,
định vị, danh bạ, giọng nói, video.

### 4.2 Đồng ý

- Đồng ý của **người lớn** được ghi trước khi tạo child profile đầu tiên:
  `consent_logs` INSERT-only — `{user_id, consent_type, action, ip, ua, created_at}`.
- `consent_type ∈ {terms, privacy, child_data}`; `action ∈ {accepted, withdrawn}`.
- Rút đồng ý = **thêm hàng** `action='withdrawn'`, Cấm — **NEVER sửa hàng cũ**.
- Mỗi loại có đúng một hàng singleton trong `consent_requirements`. Admin force cập nhật
  `reconsent_required_at`; đồng ý hợp lệ khi lần `accepted` gần nhất xảy ra không trước mốc đó
  và không bị một lần `withdrawn` mới hơn phủ định.
- Cấm — **NEVER `policy_version`, URL version cũ, hay lịch sử version chính sách**. Nội dung
  pháp lý sửa trực tiếp trong code qua PR; cập nhật code tự nó không force User.

### 4.3 Ranh giới kỹ thuật

- Cấm — **NEVER PII trong `telemetry_events`** — chỉ `child_uuid`.
- Cấm — **NEVER gửi tên, `child_uuid`, hay tuổi chính xác của trẻ tới LLM provider.**
- Cấm — **NEVER tracking script bên thứ ba** trên bề mặt trẻ hoặc trang pháp lý.
- Cấm — **NEVER quảng cáo**, không nhắm mục tiêu, không leaderboard công khai, không cơ chế
  gây nghiện (streak ép buộc, loot box, đếm ngược tạo áp lực).
- Cấm — **NEVER credential cho trẻ.** Không đăng nhập trẻ, không email trẻ.
- **Parent Gate** để rời Child Game Zone: long-press 800ms → cổng người lớn (phép tính
  hoặc PIN). Không nút thoát mà một cú tap trúng được.
- Không hiển thị dữ liệu thanh toán hay quản lý trong Child Game Zone.

### 4.4 Quyền của chủ thể dữ liệu

| Quyền               | Thực thi                                                                                                                         |
| ------------------- | -------------------------------------------------------------------------------------------------------------------------------- |
| Truy cập / sao chép | Export JSON dữ liệu trẻ theo yêu cầu của User                                                                                    |
| Xoá                 | Xoá tài khoản → cascade xoá `child_profiles`, `mastery_state`, `play_sessions`; `telemetry_events` ẩn danh hoá (bỏ `child_uuid`) |
| Đính chính          | Sửa được `display_name`, `birth_year`, `avatar_id` bất cứ lúc nào                                                                |
| Hạn chế xử lý       | Lưu trữ (archive) hồ sơ trẻ — giữ dữ liệu, dừng thu mới                                                                          |

Retention: yêu cầu xoá được thực thi trong **30 ngày**. `audit_logs` và `consent_logs`
giữ lại (nghĩa vụ pháp lý), không chứa PII của trẻ.

---

## 5. Data model

### 5.1 Entity chính

| Nhóm                   | Entity                                                                                                          |
| ---------------------- | --------------------------------------------------------------------------------------------------------------- |
| **Identity**           | `users` `managers` `active_sessions` `mfa_settings` `verification_tokens` `consent_logs` `consent_requirements` |
| **Child**              | `child_profiles` `child_session_summaries`                                                                      |
| **Billing**            | `packages` `package_entitlements` `entitlement_keys` `entitlements` `payment_orders`                            |
| **Taxonomy**           | `competencies` `strands` `skills` `skill_prerequisites` `learning_objectives` `skill_datasets`                  |
| **Tagging**            | `content_tags` `content_tag_map` `content_skill_map` `user_tags`                                                |
| **Game**               | `ALL_TEMPLATES` (code registry) · `game_levels` `game_level_rounds`                                             |
| **Curriculum**         | `curricula` `curriculum_items` `curriculum_enrollments` `curriculum_item_progress`                              |
| **Play**               | `play_sessions` `telemetry_events`                                                                              |
| **Adaptive**           | `mastery_state` `level_params`                                                                                  |
| **Ops**                | `audit_logs` `backup_log` `notifications` `notification_deliveries` `error_logs` `feature_flags`                |
| **Add-on (spec-only)** | `custom_games` `ai_usage_log`                                                                                   |

### 5.2 Play session

```
play_session_id · user_id? · child_profile_id? · guest_device_id?
game_level_code · template_code
curriculum_id? · skill_ids[]
started_at · completed_at · duration_ms
attempt_count · correct_count · incorrect_count · hint_count · retry_count
completion_status ∈ {in_progress, completed, abandoned}
raw_score · normalized_score · difficulty · device · access_tier_at_start
```

**Không chỉ lưu điểm cuối.** Lưu event để phân tích được về sau.

### 5.3 Play event

```
game_started · instructionewed · question_shown · answer_selected
answer_correct · answer_incorrect · hint_requested · round_retried · round_skipped
game_paused · game_resumed · game_completed · game_abandoned
```

| Ràng buộc                                                                        | Lý do                                                               |
| -------------------------------------------------------------------------------- | ------------------------------------------------------------------- |
| **Điểm chính thức tính ở server**                                                | Cấm — NEVER tin điểm từ client                                      |
| Event gửi trùng xử lý **idempotent** theo `(session_id, seq)`                    | Mạng yếu gửi lại là chuyện thường                                   |
| Một session **không complete được hai lần**                                      |                                                                     |
| Session đang mở **không bị ngắt** nếu gói vừa hết hạn                            | Cắt ngang giữa lúc trẻ chơi là thiệt hại lớn hơn doanh thu một lượt |
| Flush qua `navigator.sendBeacon` khi kết thúc / trang ẩn                         |                                                                     |
| Guest: session ẩn danh, `child_profile_id = NULL`, **không** ghi `mastery_state` | Dữ liệu học của trẻ không được nhiễu bởi lượt test                  |

### 5.4 Audit log — INSERT-only

```
actor_id · actor_type ∈ {user, manager, system} · action
entity_type · entity_id · before_data · after_data
ip_address · user_agent · created_at
```

Bắt buộc audit: đăng nhập manager · đổi user · đổi package · duyệt/từ chối thanh toán ·
cấp entitlement · export dữ liệu · đổi chính sách · đổi cấu hình game · đổi feature flag.

### 5.5 Nguyên tắc schema

1. **Taxonomy là bộ xương.** `mastery_state` khoá theo `skill_id` **FK**, không phải chuỗi
   `concept` tự do — sai chính tả bị chặn ở FK.
2. **`content_pack` tách khỏi `difficulty_params`.** §2.4.
3. **`content_skill_map.weight`** cho một asset phục vụ nhiều skill ở mức khác nhau.
4. **FK polymorphic không ép được ở Postgres** (`content_tag_map`, `content_skill_map`,
   `curriculum_items`, bảng auth phụ). Toàn vẹn do tầng service giữ + **bắt buộc** integration
   test bắt orphan.
5. **`audit_logs` · `consent_logs` · `telemetry_events` là INSERT-only**
   (`play_sessions` cũng vậy, chỉ sau khi `status = completed` — xem `BR-SPT-07`).
   (**D-BV**, T15, 2026-08-09: SPEC.md gọi bảng này `play_events` từ bản 2.0.0, nhưng
   [`schema-play-telemetry.md`](specs/01-platform/schema-play-telemetry.md) — spec sở hữu
   schema, review sau — và code thật đều dùng `telemetry_events`. Sửa SPEC.md cho khớp,
   không đổi schema.)
6. `strands.parent_strand_id` cho **đúng một** tầng lồng. Sâu hơn bị cấm.

---

## 6. Tech stack

| Lớp                  | Chọn                                                                                                                                                                                                                                                                                                                                                                                                                                                                                        | Ghi chú                                                                                                                                                                                                                                                                                                                                                                                                                          |
| -------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | -------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Runtime              | Node 24 LTS                                                                                                                                                                                                                                                                                                                                                                                                                                                                                 | hỗ trợ tới 04/2028, đường dài nhất trong các LTS còn sống                                                                                                                                                                                                                                                                                                                                                                        |
| Package manager      | **pnpm 11**, workspace monorepo + **catalog**                                                                                                                                                                                                                                                                                                                                                                                                                                               | catalog pin version dùng chung nhiều package — xem [`repo-bootstrap.md`](specs/00-foundation/repo-bootstrap.md)                                                                                                                                                                                                                                                                                                                  |
| Web framework        | **Nuxt 4** (`^4.5`, Vue 3, Nitro)                                                                                                                                                                                                                                                                                                                                                                                                                                                           | public + play + account + API. Nuxt 3 EOL 31/07/2026, Nuxt 5 chưa ra                                                                                                                                                                                                                                                                                                                                                             |
| Admin                | **Nuxt 4 SPA**                                                                                                                                                                                                                                                                                                                                                                                                                                                                              | subdomain riêng                                                                                                                                                                                                                                                                                                                                                                                                                  |
| DB                   | **PostgreSQL 17**                                                                                                                                                                                                                                                                                                                                                                                                                                                                           |                                                                                                                                                                                                                                                                                                                                                                                                                                  |
| ORM                  | **Drizzle** (`^0.45`) qua driver **`postgres.js`**                                                                                                                                                                                                                                                                                                                                                                                                                                          | Không đứng sau pooler transaction-mode nên bỏ qua caveat prepared statement của `postgres.js`. Cấm raw SQL, trừ `sql\`\``cho tăng nguyên tử và`coalesce`                                                                                                                                                                                                                                                                         |
| Cache / rate limit   | **Valkey 9**; cache qua **unstorage** (driver `redis`), rate limit qua **`rate-limiter-flexible` `^11.2`** trên singleton `ioredis`                                                                                                                                                                                                                                                                                                                                                         | `unstorage` không sở hữu counter/rate-limit; hai trục và fail-open/closed vẫn do [`rate-limiting.md`](specs/01-platform/rate-limiting.md) sở hữu                                                                                                                                                                                                                                                                                 |
| Queue                | **BullMQ** (`^6.0`) nối trực tiếp qua Nitro plugin, KHÔNG qua wrapper Nuxt                                                                                                                                                                                                                                                                                                                                                                                                                  | Cấm `nuxt-simple-bullmq` — solo-maintainer, README tự nhận "chỉ test với Node 21", tác giả khuyên dùng lựa chọn khác cho production                                                                                                                                                                                                                                                                                              |
| Auth                 | **Opaque cookie session + Redis authority** do `apps/web` sở hữu: session tuyệt đối 1 giờ; `remember_me` tuỳ chọn, rotate-on-use và tuyệt đối tối đa 365 ngày. `nuxt-auth-utils` `^0.5.30` chỉ cung cấp sealed locator, `/api/_auth/session` và projection cho web; admin SPA gọi API bằng `credentials: "include"`. Identity/role/reauth/credential nằm trong Redis fail-closed. MindKid không phát hoặc nhận first-party JWT; gỡ dependency trực tiếp `jose`. OAuth P1 dùng `openid-client` `^6.8`; TOTP dùng `otpauth` `^9.5` | Redis auth keyspace dùng client riêng, AOF + `noeviction`, transaction/Lua cho rotate/revoke. MFA challenge cũng là opaque one-time Redis credential. Token OIDC từ provider chỉ là input protocol tạm thời do `openid-client` xác minh, không lưu/forward. Pin module tối thiểu `0.5.30`; cấm fallback file/memory/DB/JWT, Supabase Auth, Better-Auth, Sidebase/AuthJS/`next-auth` và helper OAuth/password/WebAuthn của module |
| Email                | **Nodemailer `^9.0` → AWS SES SMTP**; template **MJML `^5.4`**                                                                                                                                                                                                                                                                                                                                                                                                                              | SMTP TLS + pool; credential SMTP theo region, tách khỏi AWS credential; SES→SNS cho delivery/bounce/complaint                                                                                                                                                                                                                                                                                                                    |
| HTTP hardening       | **`nuxt-security` `^2.6`** khai trực tiếp ở `apps/web`; header cho admin static do Nginx (hoặc Caddy sau quyết định riêng) đặt                                                                                                                                                                                                                                                                                                                                                              | Dùng CSP/header/CORS/request-size ở web; static host không có Nitro server để chạy module                                                                                                                                                                                                                                                                                                                                         |
| Browser notification | **FCM Web** (`firebase` client + `firebase-admin` server), **P5 / Task #84**                                                                                                                                                                                                                                                                                                                                                                                                                | Chỉ là kênh best-effort; notification inbox là nguồn xem lại. Không cài package hay service worker trong Task #83                                                                                                                                                                                                                                                                                                                |
| SEO                  | **`@nuxtjs/seo`** (sitemap · robots · og-image renderer Takumi · schema.org)                                                                                                                                                                                                                                                                                                                                                                                                                | thay hand-build sitemap/JSON-LD                                                                                                                                                                                                                                                                                                                                                                                                  |
| UI kit               | **Nuxt UI v4** + Tailwind v4                                                                                                                                                                                                                                                                                                                                                                                                                                                                | Cấm tái sinh shadcn-vue                                                                                                                                                                                                                                                                                                                                                                                                          |
| Icon                 | `i-lucide-*` qua `<UIcon>`                                                                                                                                                                                                                                                                                                                                                                                                                                                                  | một library duy nhất                                                                                                                                                                                                                                                                                                                                                                                                             |
| Game engine          | **Canvas 2D thuần TS**, 60 fps                                                                                                                                                                                                                                                                                                                                                                                                                                                              | Cấm Vue/Pinia/VueUse trong engine                                                                                                                                                                                                                                                                                                                                                                                                |
| Validation           | **Zod** trên mọi biên + **`@t3-oss/env-nuxt` `^0.13`** cho biến môi trường Nuxt (đồng bộ với `ENV_REGISTRY` trong `@mindkid/config`)                                                                                                                                                                                             |                                                                                                                                                                                                                                                                                                                                                                                                                                  |
| Lint/format          | **Biome 2** (`^2.5.7`, CLI chạy thật) — `ultracite` `~6.5.1` chỉ làm **preset**                                                                                                                                                                                                                                                                                                                                                                                                             | `ultracite ≥7` đã bỏ Biome sang oxlint; CLI `ultracite check` nuốt lỗi lint (exit 0 sai) — xem [`repo-bootstrap.md`](specs/00-foundation/repo-bootstrap.md) §7.1                                                                                                                                                                                                                                                                 |
| Test                 | **Vitest 4** · **Playwright** · `fast-check` · k6 · `@axe-core/playwright`                                                                                                                                                                                                                                                                                                                                                                                                                  |                                                                                                                                                                                                                                                                                                                                                                                                                                  |
| Storage              | S3                                                                                                                                                                                                                                                                                                                                                                                                                                                                                          |                                                                                                                                                                                                                                                                                                                                                                                                                                  |
| Deploy               | Docker (PG 17 + **Valkey 9**) · PM2 · Nginx · EC2                                                                                                                                                                                                                                                                                                                                                                                                                                           |                                                                                                                                                                                                                                                                                                                                                                                                                                  |

Boring tech để ổn định — nhưng "boring" nghĩa là **thư viện được cộng đồng kiểm chứng**, không
phải "tự viết cho quen". Baseline package core được rà lại ngày 2026-08-13; version patch mới
hơn tại thời điểm bootstrap thì lấy version đó, không hạ xuống bảng này
(xem [`docs/specs/00-foundation/repo-bootstrap.md`](specs/00-foundation/repo-bootstrap.md) §7.1).

---

## 7. Commands

```bash
# Setup
nvm use 24 && pnpm install
docker compose up -d                          # PG 17 + Valkey 9

# Dev
pnpm dev                                      # web        :3000
pnpm dev:admin                                # admin SPA dev server (production là static)
pnpm dev:worker                               # worker     :3099

# Quality gate — phải xanh trước khi merge
pnpm check                                    # lint + lint:deps + typecheck + test + test:deploy
pnpm lint                                     # biome check .
pnpm lint:fix                                 # biome check --write .
pnpm lint:deps                                # dependency-cruiser — chặn import xuyên ranh giới package/app
pnpm typecheck                                # tsc + vue-tsc, 10 project, bậc thang nợ
pnpm typecheck:update                         # chốt baseline mới khi nợ giảm

# Test
pnpm test                                     # vitest run
pnpm test:watch
pnpm test:coverage                            # vitest run --coverage
pnpm test:deploy                              # script hạ tầng
pnpm services                           # verify PG + Valkey kết nối được từ Node (repo-bootstrap.md §4 bước 5)

# Database
pnpm db:generate                              # sinh migration Drizzle
pnpm db:migrate
pnpm db:seed                                  # seed đầy đủ (Lớp 1 + lô Lớp 2)
pnpm db:seed:master                           # CHỈ Lớp 1 P0 — taxonomy, emoji, package, entitlement
pnpm db:seed:content --competency=C1          # Lớp 2, tăng dần
pnpm db:studio

# Build & deploy
pnpm build
bash infra/scripts/deploy.sh                  # check → build → rsync → pm2 reload → smoke
```

`pnpm check` **không** chạy test — chạy `pnpm test` riêng.

---

## 8. Project structure

```
mindkid/
├── apps/                              3 workspace app
│   ├── web/          Nuxt 4 — public + play + account + API        :3000
│   ├── admin/        Nuxt 4 SPA tĩnh — quản trị & vận hành         (admin.{domain})
│   └── worker/       Nitro — BullMQ consumer (email, export, job)  :3099
├── packages/                          20 package
│   ├── config/       Biome preset, TSConfig base, hằng số dùng chung
│   ├── shared/       Zod schema, type, constant — KHÔNG logic
│   ├── db/           Drizzle schema, migration, seed
│   │   └── src/seed-master/    Lớp 1 — taxonomy, template, emoji, package
│   │   └── src/seed-content/   Lớp 2 — game level, curriculum
│   ├── auth/         opaque session/remember/challenge, Redis adapter, guard, CSRF
│   ├── cache/        unstorage driver redis (Valkey 9) + cache util + rate limit
│   ├── storage/      S3 operation, ảnh WebP pipeline
│   ├── queue/        BullMQ job definition + producer (consumer ở apps/worker)
│   ├── taxonomy/     Cây 5 tầng, DAG validation, traversal — pure TS
│   ├── emoji/        32 nhóm emoji data + tìm tiếng Việt
│   ├── game-engine/  Canvas 2D thuần TS, template + Session
│   ├── adaptive/     BKT mastery + ZPD selector — pure TS, KHÔNG ghi DB
│   ├── errors/       AppError + lớp exception domain (H3Error hạng nhất), registry mã lỗi
│   ├── content/      Kho nội dung học (skill, builder, game level, curriculum) — KHÔNG ghi DB
│   ├── content-build/ Nạp nội dung vào DB, cổng chất lượng corpus
│   ├── play/         Phiên chơi, sự kiện chơi, BKT mastery, huy hiệu
│   ├── audit/        Ghi audit log, quét dữ liệu nhạy cảm
│   ├── notification/ Dispatch logical notification, SMTP/SES, FCM Web, MJML
│   ├── moderation/   Blocklist nội dung cho bề mặt trẻ
│   ├── export/       Kết xuất PDF worksheet
│   └── ui/           Nuxt Layer — Nuxt UI v4 preset + brand component
├── docs/                     spec + task, cùng git repo code (D-U, xem [`repo-bootstrap.md`](specs/00-foundation/repo-bootstrap.md)
│                             §11 Q10 — lịch sử 3 lượt quyết định, lượt cuối giữ tại đây)
│   ├── SPEC.md               file này (root `SPEC.md` symlink về đây)
│   ├── specs/                spec từng module — đọc TRƯỚC khi implement
│   ├── taxonomy/             registry C1–C6 + 443 skill
│   ├── montessori/           tài liệu tham khảo nguồn
│   └── tasks/                plan.md · todo.md
├── infra/                    deploy script, nginx, monitoring
└── .agents/                  AGENTS.md + rules/ + agents/ + commands/
```

**3 app + 20 package** (đếm `apps/*` và `packages/*` ngày 2026-10-18). Không có package
`socket`, `ai-vision`, `ai-voice`, `ai-planner`, `admin` layer, `valkey` (gộp vào `cache`) —
chỉ thêm **khi** tính năng của chúng vào scope, không trước.

### 8.1 Ranh giới kiến trúc

| Scope                   | Được                                                                           | Cấm Cấm                                                                                   |
| ----------------------- | ------------------------------------------------------------------------------ | ----------------------------------------------------------------------------------------- |
| `packages/shared/`      | Zod, type, constant                                                            | Business logic                                                                            |
| `packages/taxonomy/`    | Pure TS traversal, DAG check                                                   | Ghi DB                                                                                    |
| `packages/game-engine/` | Canvas 2D thuần TS                                                             | Vue, Pinia, VueUse, reactivity, ghi DB, network call lúc chơi                             |
| `packages/adaptive/`    | Pure TS algorithm                                                              | Ghi DB · `new Date()` (truyền `now`)                                                      |
| `packages/db/`          | Drizzle schema, migration, connection                                          | Raw SQL, business logic, nội dung học                                                     |
| `packages/content/`     | Kho nội dung học (skills, builders, game levels, curricula)                    | Ghi DB, Drizzle, node:* modules                                                           |
| `packages/content-build/`| Nạp nội dung vào DB, gate chất lượng                                          | apps/*                                                                                    |
| `packages/audit/`       | Ghi nhật ký kiểm toán, quét dữ liệu nhạy cảm                                   | Ghi content, UI logic                                                                     |
| `packages/play/`        | Phiên chơi, sự kiện chơi, BKT mastery, huy hiệu                                 | Ghi content, direct HTTP                                                                  |
| `packages/export/`      | Kết xuất PDF worksheet                                                         | Thao tác DB ngoài context kết xuất                                                        |
| `packages/auth/`        | Opaque session/remember/challenge Redis adapter fail-closed, guard, hash, CSRF | Supabase / Better-Auth · JWT/JWS credential · `jose` · fallback auth sang cache fail-open |
| `packages/queue/`       | Job definition, producer                                                       | Consumer                                                                                  |
| `apps/web/server/api/`  | Drizzle + Zod                                                                  | Frontend logic                                                                            |
| `apps/web/app/`         | `useFetch()` / `$fetch`                                                        | Import `packages/db`                                                                      |
| `apps/admin/`           | SPA, gọi manager API qua `useApiClient`                                        | Import `packages/db`, tenant/school logic                                                 |
| `apps/worker/`          | BullMQ consumer                                                                | HTTP endpoint                                                                             |

### 8.2 API namespace

| Prefix               | Guard                                                                                                                                |
| -------------------- | ------------------------------------------------------------------------------------------------------------------------------------ |
| `/api/guest/**`      | Không session — nội dung công khai + pre-auth (login, register, remember restore, forgot, MFA challenge)                             |
| `/api/users/**`      | `requireUserAuth()`                                                                                                                  |
| `/api/managers/**`   | `requireManagerAuth()`                                                                                                               |
| `/api/_auth/session` | Route framework nội bộ của `nuxt-auth-utils`: GET trả safe session projection; DELETE bị chặn 405, không thay route logout canonical |

Hai guard **tách biệt, không lồng nhau**. Một guard chung với cờ `isAdmin` là con đường
ngắn nhất tới leo thang đặc quyền. `requireUserAuth` chỉ chấp nhận cookie session User;
`requireManagerAuth` chỉ chấp nhận cookie session Manager. Cả hai từ chối Bearer credential.

Path danh từ số nhiều: `/api/users/levels`, `/api/users/children`.
Cấm response wrapper `{data, error}` — trả JSON trần + HTTP code.

`/api/_auth/session` là ngoại lệ framework duy nhất cho quy tắc namespace và danh từ số nhiều.
Không route nghiệp vụ mới nào được đặt dưới `/api/_auth/**`.

HTTP code dùng: 200 · 201 · 400 · 401 · 402 (hết credit add-on) · 403 · 404 · 409 (xung
đột / duyệt trùng) · 410 (snapshot hết hạn) · 422 · **428** (chưa chọn trẻ) · 500 ·
**503** (Redis/DB/dependency bắt buộc không tới được).

Record của người khác → **404**, không phải 403. 403 xác nhận record tồn tại.

---

## 9. Code style

Biome 2 qua `ultracite`: semicolons luôn có, double quotes, indent 2 space, lineWidth 80.

| Ngữ cảnh          | Quy ước                           | Ví dụ                   |
| ----------------- | --------------------------------- | ----------------------- |
| DB table / column | `snake_case`                      | `learning_objective_id` |
| API path          | danh từ số nhiều                  | `/api/users/levels`     |
| Vue component     | `PascalCase.vue`                  | `GameCard.vue`          |
| TS file           | `kebab-case.ts`                   | `skill-graph.ts`        |
| Constant          | `UPPER_SNAKE_CASE`                | `PACKAGE_CATALOG`       |
| Package           | `@mindkid/xxx`                    | `@mindkid/db`           |
| Function / local  | `camelCase`                       | `resolveSkillPath()`    |
| Boolean           | prefix `is`/`has`/`should`/`can`  | `isPublished`           |
| Type / interface  | `PascalCase`                      | `LearningObjective`     |
| Payload field     | `snake_case`, **không transform** | `level.published_at`    |

**Immutability** — luôn tạo object mới:

```ts
// WRONG
level.status = "published";
// CORRECT
const published = { ...level, status: "published" as const };
```

**Ví dụ chuẩn — một API route:**

```ts
import { requireUserAuth } from "@mindkid/auth";
import { game_levels } from "@mindkid/db";
import { GameLevelQuerySchema } from "@mindkid/shared";
import { and, eq, inArray } from "drizzle-orm";
import { useDb } from "~~/server/utils/db";
import { resolveAccessibleTiers } from "~~/server/utils/entitlements";

export default defineEventHandler(async (event) => {
  const user = requireUserAuth(event);
  const query = GameLevelQuerySchema.parse(getQuery(event));
  const tiers = await resolveAccessibleTiers(user.user_id);
  const db = useDb();

  const rows = await db
    .select()
    .from(game_levels)
    .where(
      and(
        inArray(game_levels.access_tier, tiers),
        query.skill_ids
          ? inArray(game_levels.skill_id, query.skill_ids)
          : undefined,
      ),
    )
    .limit(query.limit)
    .offset(query.offset);

  return { items: rows, total: rows.length };
});
```

**Mass-assignment guard** — Cấm — NEVER đổ object Zod-parsed thẳng vào `.set()`:

```ts
// WRONG — user inject được cột đặc quyền
await db.update(game_levels).set(parsed).where(eq(game_levels.id, id));
// CORRECT — map từng field
await db
  .update(game_levels)
  .set({ title: parsed.title, content_pack: parsed.content_pack })
  .where(eq(game_levels.id, id));
```

Cột đặc quyền: `managers.role` · `users.is_active` · `users.session_version` ·
`entitlements.status` · `payment_orders.status`.

**Vue SFC — thứ tự bắt buộc:** `<template>` → `<script setup>` → `<style scoped>`.

**Kích thước:** file 200–400 LOC thường, **800 tối đa**. Function < 50 LOC. Nesting ≤ 4 tầng.

**Comment:** mặc định **không viết**. Chỉ viết khi _lý do_ không hiển nhiên (ràng buộc ẩn,
invariant tinh tế, workaround). Cấm — NEVER comment điều code đã nói rõ. Cấm — NEVER tham chiếu
số task/PR/issue. Cấm — NEVER trỏ tới path tài liệu — path đổi, comment thành link chết.

**Ngôn ngữ:** tiếng Việt cho chuỗi hiển thị người dùng và prose tài liệu; tiếng Anh cho
code, slug, enum, path, contract kỹ thuật.

### 9.1 UI/UX — bốn bề mặt, bốn tiêu chuẩn

| Bề mặt                                                | Touch floor                        | Dark mode          |
| ----------------------------------------------------- | ---------------------------------- | ------------------ |
| **Kid** (`pages/play/`, gameboard, `components/kid/`) | **64px**, hành động chính **76px** | Cấm **light only** |
| **Account** (`pages/me/**`)                           | 44px                               |                    |
| **Public**                                            | 44px                               |                    |
| **Admin** (studio 40px)                               | 44px                               |                    |

Sàn tuyệt đối mọi nơi 24×24px (WCAG 2.2 AA 2.5.8). Hit area tính bằng `min-h-*`/`min-w-*`,
không dựa vào padding một mình.

- Cấm — **NEVER hex literal trong `.vue`** — token từ `packages/ui`.
- Cấm — **NEVER `danger`/đỏ trên bề mặt trẻ** — đỏ đọc thành trừng phạt ở tuổi 3–6. "Chưa
  đúng" dùng `retry` hổ phách.
- Cấm — **NEVER màu là kênh duy nhất** để thể hiện đúng/sai.
- Tablet-first: **`active:`** mang phản hồi nhấn, không phải `hover:`.
- Chỉ animate `transform` và `opacity`. `prefers-reduced-motion` **giảm, không bao giờ
  bỏ** — và không đổi độ khó, nhịp, hay cách tính điểm.
- Chữ không bao giờ mang chỉ dẫn một mình — mọi chỉ dẫn cho trẻ được đọc thành tiếng;
  không có audio thì chuyển sang trình diễn (ghost hand).
- Body ≥ 16px. Tiếng Việt: `leading` ≥ 1.4, Cấm — NEVER `uppercase` (mất dấu về thị giác).

### 9.2 Game engine — bất biến

- **Token only.** Mọi màu và font từ `systems/designTokens.ts`. Cấm hex literal, Cấm `ctx.font` inline.
- **Sàn touch theo band tuổi** qua một hàm duy nhất — band 3–4: 96px; band 5–6: 76px; sàn
  tuyệt đối 64px. Cấm — NEVER sàn tự viết kiểu `Math.max(20, …)`.
- **Drag phải khoan dung** — hit band nới rộng, hoàn thành được không cần chính xác từng
  pixel, và **mọi game drag có fallback tap-tap cho band 3–4**.
- **Trả lời sai phải có phản hồi, và không bao giờ trừng phạt** — nhưng **im lặng cũng là
  defect**. Retry = nhịp hổ phách + âm nhẹ (ramp ≥ 20ms) + item trôi về chỗ cũ.
- **Ăn mừng lớn chỉ khi hoàn thành level.** Mỗi item đúng chỉ pop nhỏ **tại điểm chạm**.
- **Một phần tử động thu hút chú ý tại một thời điểm** — target đang được scaffolding.
- **Scaffolding leo thang theo đồng hồ hoặc số miss liên tiếp, NEVER theo yêu cầu** —
  trẻ 3 tuổi sẽ không xin. L1 highlight → L2 ghost hand → L3 ghost hand 0.5× lặp.
- Cấm đồng hồ đếm ngược. Không điểm hiện trong lúc chơi. Không nút thoát tap trúng được.
- Cấm pinch, không xoay bằng cử chỉ, không thao tác hai ngón, không drag tính giờ.
- Cấm `setInterval`/`setTimeout` làm game loop — chỉ `requestAnimationFrame`.
- Cấm Cấp phát object mỗi frame · DOM mutation mỗi frame · network call lúc chơi.
- Audio: master ceiling cưỡng chế, mục tiêu −16 LUFS, true peak ≤ −1 dBTP, ramp vào ≥ 20ms.

---

## 10. Testing strategy

| Loại        | Framework                     | Vị trí                        | Ngưỡng                   |
| ----------- | ----------------------------- | ----------------------------- | ------------------------ |
| Unit        | Vitest 4                      | `*.test.ts` cạnh source       | ≥ 80% toàn bộ            |
| Integration | Vitest + **PG thật** (Docker) | `apps/web/tests/integration/` | critical path ≥ 85%      |
| E2E         | Playwright                    | `apps/web/tests/e2e/`         | mỗi template ≥ 1 journey |
| Property    | `fast-check`                  | cạnh source                   | mọi bất biến §10.2       |
| Load        | k6                            | `infra/load/`                 | API P95 < 800 ms         |
| A11y        | `@axe-core/playwright`        | mọi page object               | 0 violation              |

**Critical path bắt buộc ≥ 85%:** auth · payment/approval · child profile · **access
gating** · play session · taxonomy traversal · content seeder gates.

**TDD:** RED → GREEN → REFACTOR. Cấu trúc AAA. Tên test: `test("<làm gì> khi <điều kiện>")`.

### 10.1 Test không được rút gọn

| Bài                                                                           | Vì sao                                                                 |
| ----------------------------------------------------------------------------- | ---------------------------------------------------------------------- |
| Gating **4 tier × 5 trạng thái người gọi = 20 ca**                            | Gating là ma trận; test vài ô sẽ để lọt ô còn lại                      |
| **404 trên MỌI endpoint** có tham số trẻ                                      | IDOR là lỗi lặp lại theo từng route mới                                |
| E2E thanh toán **xuyên hai app** (web + admin)                                | Luồng doanh thu; lỗi ở ranh giới hai app không bắt được bằng unit test |
| Approve **hai lần** trên cùng order                                           | Duyệt trùng tạo hai subscription                                       |
| Biên **nửa đêm ICT** cho hạn mức giờ chơi                                     | Lỗi múi giờ chỉ hiện ra một giờ trong ngày — đúng giờ trẻ hay chơi     |
| Round-trip `content_pack` × `content_contract` trên **toàn bộ** level đã seed | Sai schema làm crash engine trong lúc trẻ đang chơi                    |

### 10.2 Bất biến kiểm bằng property test

- `skill_prerequisites` là **DAG** ở mọi trạng thái seed.
- `p_learn ∈ [0,1]` sau mọi chuỗi cập nhật BKT.
- Mọi LO thuộc đúng một skill; mọi skill thuộc đúng một strand.
- **Access ladder bao hàm:** `canAccess(tier_n)` ⟹ `canAccess(tier_m)` ∀ m < n.
- Mọi `game_level.content_pack` parse được bằng `content_contract` của template nó dùng.

Bất biến của cây không kiểm được bằng ví dụ — một chu trình có thể chỉ xuất hiện ở tổ hợp
thứ 4.000.

### 10.3 Cấm trong test

Cấm Gọi LLM thật · Cấm **mock DB** (dùng PG Docker — mock DB không kiểm được ràng buộc, mà
ràng buộc là thứ đáng kiểm nhất) · Cấm `setTimeout` để chờ (dùng `expect.poll()`) · Cấm chạm
DB/S3/email production · Cấm dữ liệu random không seed.

Viewport mặc định E2E: **768×1024** tablet portrait. Touch target khẳng định trong DOM
snapshot. Offline test dùng Playwright offline mode, không mock `navigator.onLine`.

---

## 11. Boundaries

### Always

- Chạy `pnpm check` trước khi đánh dấu task xong.
- Đọc spec sở hữu trong `docs/specs/` **trước** khi implement module.
- Zod validate mọi body / query / params — kể cả route chỉ đọc.
- Map field tường minh khi `db.update().set()`.
- Kiểm access ladder và ownership child profile ở **server**.
- Ghi `audit_logs` cho mọi hành động ở §5.4.
- Mọi nội dung (`game_levels`, `curricula`, `skill_datasets`) định nghĩa trong seeder và nạp cứng vào DB.
- Emoji chỉ làm **nội dung** cho trẻ chưa đọc, không bao giờ làm affordance.
- Gate bằng `hasEntitlement(userId, key)`, không bằng tên gói.
- Tiếng Việt cho chuỗi hiển thị; tiếng Anh cho code, slug, spec.
- Seed idempotent, tra theo slug/code.

### Lưu ý: Ask first

- Đổi schema DB (thêm/xoá bảng, đổi kiểu cột, đổi PK).
- Thêm dependency mới vào bất kỳ package nào.
- Đổi giá, thời hạn, quota, hoặc `access_tier` của nội dung đã phát hành.
- Đổi `content_contract` của một template đã phát hành.
- Thêm SKU thứ ba vào catalog MVP.
- Đổi ánh xạ competency của một skill đã có nội dung gắn vào.
- Đổi số child profile tối đa của một gói.
- Đổi design token.
- Đổi cấu hình cổng tự động hoặc process manager.
- Mở rộng phạm vi tuân thủ ra ngoài Việt Nam.

### Cấm Never

- Đọc hoặc ghi `.env`. Commit `.env`, `*.tfvars`, `*.pem`, credentials.
- `terraform apply` / `destroy` — chỉ `plan` + `validate`.
- Raw SQL (trừ `sql\`\``cho tăng nguyên tử và`coalesce`).
- Đổ object Zod-parsed thẳng vào `db.update().set()`.
- Dùng `tenant_id`, persona enum, hay cột `role` trên `users`.
- Hardcode giá ngoài `PACKAGE_CATALOG`. Hardcode domain — dùng `{domain}`.
- Gửi `content_pack` của nội dung bị chặn xuống client.
- Kiểm entitlement chỉ ở client. Tin điểm/mastery do client gửi.
- Xoá cứng nội dung đang được `telemetry_events` hoặc `curriculum_items` trỏ tới.
- Cho admin sửa dữ liệu taxonomy, template, emoji, package, entitlement key, game level, curriculum qua UI.
- Upload SVG. Lưu URL tuyệt đối vào DB. Ảnh chụp trẻ em ở bất kỳ đâu.
- PII của trẻ trong `telemetry_events` hoặc trong prompt gửi LLM.
- Tracking script bên thứ ba trên bề mặt trẻ hoặc trang pháp lý.
- Tạo credential cho trẻ.
- Import Vue/Pinia/VueUse vào `packages/game-engine/`. Ghi DB từ `game-engine` hoặc `adaptive`.
- Import `packages/db` từ `apps/*/app/` — đi qua REST.
- Đặt business logic vào `packages/shared/`.
- Cho adaptive nhảy bước curriculum.
- **Để AI _phát hành_ nội dung cốt lõi.** AI agent IDE soạn được **file seeder trong repo**;
  chỉ **người** merge PR, và merge là phát hành. Agent không chạy `seed:content` lên môi
  trường nào ngoài local — xem §0 D7.
- **Để LLM sinh nội dung trong runtime.** Không có pipeline sinh nội dung nào chạy trong hệ
  thống. LLM duy nhất trong runtime là add-on [`ai-assistant.md`](specs/07-addon/ai-assistant.md), ngoài MVP.
- **Để AI sinh `skills` hoặc `strands`.** Taxonomy do người thiết kế. AI soạn được
  seeder `learning_objectives`, nhưng vẫn qua các cổng tự động và vẫn cần người đọc từng bản.
- Dùng ngoại lệ Task #14 để auto-merge, chạy migration ngoài local, hoặc phát hành nội dung. AI chỉ được soạn code trong
  repo; người review diff trước merge — xem mục 0 quyết định D7.
- Merge tự động code do AI sinh, hoặc sửa tay file `@generated`.
- Reset/checkout/revert công việc không liên quan khi chưa được yêu cầu.

---

## 12. Roadmap và phase gate

**MVP = P0 → P3.** Mỗi phase có cổng ra kiểm được ở §13.

| Phase                     | Nội dung                                                                                                                                                                   | Cắt được không                                      |
| ------------------------- | -------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | --------------------------------------------------- |
| **P0 — Foundation**       | Repo, schema, migration, auth, master seed (taxonomy 230 skill + ≥690 LO + emoji + package + entitlement key), cổng tự động                                                | Cấm chặn mọi thứ                                    |
| **P1 — Play core**        | Registry + game engine 6 template đầy đủ contract, catalog + gating 4 bậc, play session + event, healthy-play cap, báo cáo cơ bản, ≥120 game level seed, Public Site + SEO | Cấm core business                                   |
| **P2 — Commerce + Admin** | Package catalog, VietQR order, duyệt tay, entitlement, Admin dashboard, quản trị người dùng & vận hành, audit log                                                          | Cấm luồng doanh thu                                 |
| **P3 — Curriculum**       | 5 curriculum, curriculum player, mastery + adaptive ZPD, báo cáo nâng cao                                                                                                  | Lưu ý: Có thể ship 1 curriculum theo tuổi thay vì 5 |
| **P4 — Add-on**           | Custom Game Builder, Curriculum cá nhân, AI + credit ledger, export PDF. **Lên catalog cùng lúc với tính năng**                                                            | ngoài MVP                                           |
| **P5 — Web scale**        | Cổng thanh toán tự động, PWA install và offline curriculum pack nâng cao trên web                                                                                          | ngoài MVP; không gồm mở rộng mô hình sản phẩm       |

**Điểm cắt nếu nguồn lực căng** (theo thứ tự hy sinh):

1. P3 → 1 curriculum thay vì 5.
2. P1 → 80 game level thay vì 120.

Cấm cắt: gating, audit, tuân thủ §4. Ba thứ này rẻ khi làm
đúng lúc và rất đắt khi vá sau.

---

## 13. Success criteria

### Cổng ra P0

- [ ] `pnpm check` exit 0 · 0 lỗi typecheck mọi package.
- [ ] `pnpm db:migrate && pnpm db:seed:master` chạy sạch trên DB rỗng, **chạy lại được**.
- [ ] Đã chốt chủ sở hữu và cách lưu trữ an toàn của khoá mã hoá backup (`BACKUP_ENCRYPTION_KEY`) — chưa chốt thì chưa go-live.
- [ ] Seed đúng: 6 competency · 41 strand · **230 skill** · **≥690 LO**.
- [ ] Mọi skill `seeded` có ≥ 3 LO; `age_min ≤ age_max ∈ [3,6]`; `difficulty ∈ [1,5]`.
- [ ] `skill_prerequisites` là DAG — property test xanh trên toàn bộ seed.
- [ ] Truy vấn `skill → LO → asset` < 100 ms P95.
- [ ] Đăng ký / đăng nhập / quên mật khẩu / xác thực email chạy end-to-end.
- [ ] `social_identities` + `active_sessions.device_id/revoked_at` +
      `users.session_version`/`managers.session_version` có trong migration P0; reauth state
      authoritative nằm trong Redis session.

### Cổng ra P1

- [ ] **≥120 game level**, ≥20 mỗi competency, mọi `content_pack` round-trip
      qua `content_contract`.
- [ ] Guest chơi được 6 game allow-list, không giới hạn lượt, **không lưu tiến độ**.
- [ ] Guest gọi level `login`/`standard`/`premium` → **403**, body có `access_tier` +
      `required_entitlement`, **không có `content_pack`**.
- [ ] Ma trận gating 4 tier × 5 trạng thái = 20 ca đều có test.
- [ ] Property test: ladder bao hàm.
- [ ] Bỏ token/cookie ở client **không mở thêm gì**.
- [ ] Play session ghi đủ event, idempotent khi gửi trùng, không complete được hai lần.
- [ ] Điểm tính ở server; gửi điểm giả từ client không đổi kết quả lưu.
- [ ] 60 fps trên tablet Android 2GB, mỗi template có E2E journey xanh.
- [ ] User xem được báo cáo cơ bản của một trẻ sau khi trẻ chơi.
- [ ] Đăng ký và đăng nhập bằng **Google** và **Facebook** chạy end-to-end, gồm màn hình
      đồng ý hai checkbox.
- [ ] Email trùng giữa SNS và tài khoản sẵn có → **409**, **không** tự liên kết
      (`BR-SCL-04`) — và màn hình liên kết ở `/me/settings/security` dùng được.
- [ ] Gỡ phương thức đăng nhập cuối cùng bị chặn (`BR-SLK-04`), gồm ca hai tab đồng thời.

### Cổng ra P2

- [ ] User tạo order VietQR → upload chứng từ → nhận `soft_unlock` đúng 3 ngày.
- [ ] Manager duyệt → `entitlements.status='active'`, `expires_at` đúng theo gói.
- [ ] **Approve lần hai trên cùng order → 409**, không tạo thêm subscription.
- [ ] Manager từ chối → quyền từ order đó hết **trong cùng request**, không chờ cron.
- [ ] Mọi hành động ở §5.4 ghi `audit_logs` INSERT-only.
- [ ] Admin **không** sửa được taxonomy / template / emoji / package / game level / curriculum qua UI (405 hoặc
      không có route).

### Cổng ra P3

- [ ] 5 curriculum được seed, curriculum player chạy từ tuần 1 tới tuần cuối.
- [ ] `mastery_state` cập nhật theo `skill_id` FK sau mỗi session; `p_learn ∈ [0,1]`.
- [ ] ZPD selector không nhảy bước curriculum.
- [ ] Báo cáo nâng cao hiển thị theo competency / domain / skill với nhãn không kết luận
      quá mức (§13.1).
- [ ] Một trẻ có **≥ 4 tuần** nội dung liên tục không lặp lại.

### 13.1 Nhãn báo cáo — ranh giới cứng

**Được dùng:** `Chưa có đủ dữ liệu` · `Mới làm quen` · `Đang phát triển` · `Khá ổn định` ·
`Thành thạo trong phạm vi bài tập`.

Cấm — **NEVER dùng:** "chậm phát triển", "có vấn đề", "IQ", bất kỳ chẩn đoán rối loạn hay kết
luận y khoa nào.

Báo cáo phản ánh **hiệu suất trong hệ thống**, không phải năng lực của đứa trẻ. Mọi màn
hình báo cáo mang câu này.

### 13.2 MVP hoàn thành khi

- Toàn bộ nội dung (`game_levels`, `curricula`, `skill_datasets`) được biên soạn qua seeder trong repo và kiểm duyệt qua 10 cổng tự động + PR review.
- User đăng ký, tạo Child Profile, và trẻ chơi được cả game free lẫn trả phí.
- Hệ thống kiểm quyền **đúng** theo entitlement, kiểm ở server.
- Kết quả chơi lưu theo từng trẻ, truy vết trực tiếp về nội dung đã chơi.
- User xem được báo cáo cơ bản và nâng cao.
- Manager xác nhận thanh toán và kích hoạt gói, có audit đầy đủ.
- Curriculum liên kết các game level thành lộ trình.
- Có đủ nội dung để một trẻ quay lại **4–8 tuần**.
- Không có dữ liệu trẻ nào vượt danh sách đóng §4.1.
- **Cổng ra P0**: nhóm Nội dung hoàn tất review ≥690 LO trong master seed; chủ và baseline năng lực đã chốt tại [`mvp-scope.md`](specs/00-foundation/mvp-scope.md) Q1 (`D-CN`, thay thế quyết định hoãn `D-W`).
- **Cổng ra P0**: [`backup-and-restore.md`](specs/01-platform/backup-and-restore.md) + [`monitoring-and-alerting.md`](specs/01-platform/monitoring-and-alerting.md) approved và `backup_log`
  trong migration P0 (neo Q4/T9).
- **Cổng ra P1**: [`event-catalog.md`](specs/00-foundation/event-catalog.md) Q2 (partition) đóng lại trước khi `telemetry_events`
  vượt 5M hàng / 2GB (neo D-Z).

---

## 14. Cấu trúc spec corpus

Mỗi outcome có **đúng một** spec sở hữu. Spec khác **link tới**, không copy contract.

**166 spec module** cộng 38 phiếu engine. Bản đồ đầy đủ, bảng đếm theo khu
vực và cột task còn mở: [`docs/specs/index.md`](specs/index.md).

```
docs/
├── SPEC.md                    file này — contract toàn dự án
└── specs/
    ├── CONVENTIONS.md         quy ước viết spec
    ├── TEMPLATE.md · index.md · READING-GUIDE.md · roadmap.md
    ├── 00-foundation/  18     contract cắt ngang mọi bề mặt (registry, bản đồ schema)
    ├── 01-platform/    42     năng lực nội bộ: schema, auth, engine runtime, seeder, hạ tầng vận hành
    │   └── engines/    38     phiếu engine GT-000…GT-037 + TEMPLATE.md + index.md (sinh tự động)
    ├── 02-public/       9     khách chưa đăng nhập
    ├── 03-account/     23     User đã đăng nhập (hồ sơ trẻ, báo cáo, gói offline)
    ├── 04-play/        20     bề mặt trẻ — core business
    ├── 05-content/     19     mô hình nội dung và ràng buộc biên tập
    ├── 06-admin/       19     Manager (quản trị người dùng, duyệt thanh toán, vận hành, huỷ gói)
    ├── 07-addon/        5     spec đủ, KHÔNG bán ở MVP
    └── 08-quality/     11     test · bảo mật · a11y · hiệu năng · design · phủ tư duy · an toàn kiểu · cổng runtime
```

### 14.1 Luật cứng: một outcome, một file

Spec gộp nhiều outcome (`dashboard-and-users`, `identity-and-security`, `adaptive-and-curriculum`…)
**không trả lời được "tính năng này xong chưa"** — nhãn của outcome mạnh nhất che outcome yếu
nhất.

Cấm gộp. Kiểm bằng câu hỏi: _"tính năng này xong chưa?"_ — nếu câu trả lời phải là "phần
A xong, phần B chưa" thì file đang gộp và phải tách.

Chữ `and` trong tên file bị cấm khi nó nối **hai outcome**; được phép khi nó đặt tên cho
**một** outcome không tách được ([`backup-and-restore.md`](specs/01-platform/backup-and-restore.md) — một backup chưa từng restore không
phải backup).

### 14.2 Hình dạng một spec

| Quy ước | Vì sao |
| ------- | ------ |
| `status: draft \| approved \| implemented`; còn code chưa khớp thì thêm `open_tasks` và khối "Chưa hoàn thành" | Đo độ chín của spec và khoảng cách tới code bằng một chỗ, tra được bằng script |
| Section **Business rules** đánh số `BR-xxx` kèm **vì sao** | Tra chéo được từ test và code |
| Mã lỗi đăng ký ở [`error-codes.md`](specs/00-foundation/error-codes.md), spec chỉ trích | Mỗi mã lỗi có đúng một nơi sở hữu |
| Acceptance dạng **Gherkin** | Map thẳng sang test, mỗi scenario fail được |
| Không spec "lô" hay kế hoạch một lần — kế hoạch nằm ở `docs/tasks/` | Spec là contract còn hiệu lực, không là nhật ký đợt việc |

Quy ước đầy đủ: [`specs/CONVENTIONS.md`](specs/CONVENTIONS.md).

Giữ cấu trúc **theo bề mặt** thay vì theo tầng kỹ thuật (PRD §30.1). _Lý do:_ mỗi spec sở
hữu một outcome người dùng thấy được; tách theo `03-api`/`04-data`/`05-ui` làm một outcome bị
xé ra 5 file và không file nào trả lời được câu hỏi ở §14.1.

### 14.3 Registry

| Registry                                                     | Nội dung                                                     |
| ------------------------------------------------------------ | ------------------------------------------------------------ |
| [`business-rules.md`](specs/00-foundation/business-rules.md) | 240 prefix → spec; **danh sách rule không bao giờ được nới** |
| [`error-codes.md`](specs/00-foundation/error-codes.md)       | Mọi mã lỗi nghiệp vụ → HTTP status                           |
| [`event-catalog.md`](specs/00-foundation/event-catalog.md)   | Tên event + schema payload                                   |
| [`glossary.md`](specs/00-foundation/glossary.md)             | Từ vựng chuẩn + từ bị cấm                                    |
| [`id-conventions.md`](specs/00-foundation/id-conventions.md) | Định dạng mã + mã bất biến                                   |

**Mẫu feature spec** ([`TEMPLATE.md`](specs/TEMPLATE.md)) — 11 section đúng thứ tự: Objective · Actors ·
Entry points · Main flow · Alternative flows · Business rules · Data · API contract ·
Acceptance criteria (Gherkin) · Boundaries · Open questions. Spec `07-addon/` rút gọn; phiếu
engine dùng khuôn 18 mục của [`engine-spec-sheet.md`](specs/01-platform/engine-spec-sheet.md).

**Quy tắc ID** (nguồn sự thật: mục 7 của [`id-conventions.md`](specs/00-foundation/id-conventions.md)):

```
C1…C6              Competency            GL-C1-CNT-MATCH-0007  Game Level (instance)
C1.CNT             Strand                CUR-001               Curriculum
C1.CNT.03          Skill                 PKG-premium           Package
LO-C1.CNT.03-01    Learning Objective    play_premium_games    Entitlement key
GT-003             Game Template         F-001                 Feature (tài liệu)
BR-<SPEC>-01       Business Rule (tài liệu)
```

Mã taxonomy (`C1.CNT.03`) đã biên soạn, bất biến, không đổi. Event dùng `snake_case`, mã lỗi
`SCREAMING_SNAKE` — không có tiền tố số.

---

## 15. Open questions

| #   | Câu hỏi                                                                                                                                                                                                                         | Chặn                    |
| --- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | ----------------------- |
| 1   | **Giá cuối** của `standard` và `premium` (365 ngày / vĩnh viễn)                                                                                                                                                                 | Mở thanh toán           |
| 2   | 6 game level nào vào allow-list guest? 1 mỗi competency, difficulty 1–2                                                                                                                                                         | P1 gating               |
| 10  | Giữ VietQR duyệt tay vĩnh viễn hay thêm cổng thanh toán ở P5?                                                                                                                                                                   | Payment roadmap         |
| 11  | Backup + monitoring: ai sở hữu vận hành và ngân sách bao nhiêu?                                                                                                                                                      | Go-live                 |
| 12  | Bằng chứng nào đủ để nói sản phẩm **rèn luyện, khai phá tư duy**, thay vì chỉ chứng minh trẻ chơi được và quay lại? Cần chốt claim, KPI sư phạm và protocol kiểm thử với trẻ trước khi dùng kết quả đó làm thông điệp sản phẩm. | P1 nghiệm thu · Go-live |

### Đã chốt

| Câu                                                      | Quyết định                                                                                                                                                                                                                                                                                                                                                                                                                                                                                        | Ngày                           |
| -------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | ------------------------------ |
| Phạm vi                                                  | **Code viết theo spec**; taxonomy data, kho emoji và lõi `game-engine` nhập có chọn lọc                                                                                                                                                                                                                                                                                                                                                                                                                        | 2026-08-04                     |
| Quản lý nội dung                                         | **Toàn bộ qua seeder trong repo** — bỏ Authoring Studio, bỏ cơ chế đa version (`content_version`, `entity_id`) và cổng duyệt runtime                                                                                                                                                                                                                                                                                                                                                                      | Cập nhật 2026-10-25            |
| Add-on ở MVP                                             | **Chỉ spec, không lên catalog.** MVP bán đúng `standard` + `premium`                                                                                                                                                                                                                                                                                                                                                                                                                              | 2026-08-04                     |
| Premium vs Creator                                       | **Gộp.** Premium bao hàm quyền học của Creator; quyền tạo nằm ở add-on                                                                                                                                                                                                                                                                                                                                                                                                                            | 2026-08-04                     |
| Pháp lý                                                  | **Việt Nam** — Luật Bảo vệ dữ liệu cá nhân 91/2025/QH15 + Nghị định 13/2023 + Luật Trẻ em. Không COPPA/GDPR-K ở MVP                                                                                                                                                                                                                                                                                                                                                                               | Cập nhật 2026-08-14            |
| Legal singleton và re-consent (`D12`)                    | **Không quản lý policy version.** Ba tài liệu cần đồng ý là singleton code-owned; `super_admin` force bằng `reconsent_required_at`, mọi lần force ghi audit                                                                                                                                                                                                                                                                                                                                       | 2026-08-14                     |
| Chủ và năng lực review nội dung (`D-CN`, thay thế `D-W`) | Nhóm Nội dung sở hữu; baseline 20 LO hoặc 6 game level/người/ngày, đo lại sau pilot 30 LO + 6 level                                                                                                                                                                                                                                                                                                                                                                                     | 2026-08-09                     |
| 60 dạng game nguồn                                       | Giữ làm backlog **nội dung**, map dần thành `content_pack`; không biến 60 dạng thành 60 Session class. Sáu template vẫn là sàn MVP                                                                                                                                                                                                                                                                                                                                                            | Đối chiếu §2.4 ngày 2026-08-12 |
| Ngân sách rà soát pháp lý (`D-AS`)                       | 50M VND cho tư vấn IP/Bảo vệ dữ liệu trước go-live; owner chi tiết ở [`legal-pages.md`](specs/02-public/legal-pages.md)                                                                                                                                                                                                                                                                                                                                                                           | 2026-08-09                     |
| Thiết bị chuẩn 60 fps (`D-CH`)                           | Lenovo Tab M8 2 GB RAM; Chrome ổn định mới nhất, pin >30%, tắt tiết kiệm pin; chạy ba lần lấy median                                                                                                                                                                                                                                                                                                                                                                                              | 2026-08-09                     |
| Repo                                                     | **Repo riêng `mindkid/`**. Tài sản nhập có chọn lọc: `game-engine`, `emoji`, taxonomy data                                                                                                                                                                                                                                                                                                                                                                                                         | 2026-08-06 (D-A)               |
| Thư viện ảnh & asset động                                | **Không có.** Kho emoji cố định; bỏ hoàn toàn các bảng `content_images`, `content_audio`, `content_asset_refs`                                                                                                                                                                                                                                                                                                                                                                                    | Cập nhật 2026-10-25            |
| Master & Content data                                    | **Toàn bộ là code-owned, nạp cứng từ seeder, admin read-only**                                                                                                                                                                                                                                                                                                                                                                                                                                    | Cập nhật 2026-10-25            |
| Dùng AI để soạn game và code?                            | **Có — AI agent IDE soạn file trong repo, người merge.** Nội dung nền là **seeder** (10 cổng tự động → PR review → seed nạp vào DB). Code Task #14 được phép đi vào sáu vùng nhạy cảm nhưng phải có test âm, gate tự động và người review diff; không auto-merge, không chạy migration ngoài local. Cấm có pipeline LLM sinh nội dung trong runtime. Hard rule cũ "NEVER để AI sinh nội dung cốt lõi" viết sai chỗ — cái cần cấm là **phát hành không có người kiểm** | 2026-08-09                     |
| Tách nhỏ spec tới mức nào?                               | **Một outcome một file.** Tên file có `and` bị cấm khi nối hai outcome                                                                                                                                                                                                                                                                                                                                                                                              | 2026-08-05                     |
| Audio tiếng Việt & Fallback (`D-AV`)                     | **Kết hợp clip tĩnh + Web Speech API (TTS vi-VN)** với visual fallback (ghost hand / highlight / icon) không crash khi thiếu voice                                                                                                                                                                                                                                         | Cập nhật 2026-10-25            |
