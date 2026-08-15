---
spec: CONTENT-LIFECYCLE
title: Vòng đời nội dung và cổng duyệt
area: foundation
status: implemented
mvp: true
phase: P0
reviewed: 2026-08-07
owns:
  - Enum trạng thái nội dung và bảng chuyển trạng thái
  - Quy tắc ai được chuyển trạng thái nào
  - Ngữ nghĩa ghi nhận content_review_log (❌ không định nghĩa cột — D-AC, xem
    schema-identity-billing.md §7.10a)
depends_on:
  - GLOSSARY
  - ACTORS
---

# Vòng đời nội dung và cổng duyệt

## 1. Objective

Nội dung sai gây hại cho trẻ. Một game level có đáp án sai dạy sai; một lesson gắn nhầm độ
tuổi làm trẻ thất bại liên tục. Cổng duyệt tồn tại để những thứ đó không lên production
bằng một cú click nhầm.

Dù MVP chỉ có một `super_admin`, workflow vẫn giữ đủ trạng thái. Nó không tốn thêm gì, và
nó là thứ duy nhất chặn xuất bản nhầm.

Áp cho **mọi thực thể Lớp 2**: `game_levels` · `lessons` · `activities` · `curricula` ·
`worksheets` · `seo_pages`.

## 2. Actors

| Actor | Chuyển được trạng thái nào |
|---|---|
| Manager `content_reviewer` | `draft → in_review` · `in_review → approved` · `in_review → rejected` · `approved → published` · `published → archived` |
| Manager `super_admin` | Tất cả, cộng `archived → published` (rollback) |
| `pnpm seed:content` | **Chỉ INSERT** hàng mới ở `published` sau khi PR đã được người merge (§4.1). Không `UPDATE`, không chuyển trạng thái hàng đã có |
| User | Không chạm. `lesson_plans` của User có vòng đời riêng, không duyệt |

## 3. Entry points

| Nơi | Ghi chú |
|---|---|
| [`game-level-studio.md`](../06-admin/game-level-studio.md) | Soạn và chuyển trạng thái |
| [`content-review-queue.md`](../06-admin/content-review-queue.md) | Hàng đợi `in_review` |
| [`publish-and-version.md`](../06-admin/publish-and-version.md) | Publish, archive, rollback |
| [`content-seed-authoring.md`](../01-platform/content-seed-authoring.md) | Nội dung nền từ seeder — sinh ra đã `published`, §4.1 |

## 4. Main flow

```
        ┌──────────────────── rejected ◄─────┐
        │                                    │
draft ──┴──► in_review ──► approved ──► published ──► archived
  ▲            │                                          │
  │            └── (sửa) ──────────────────────────────────┘
  │                                                        │
  └──────────────── tạo version mới ◄──────────────────────┘
                                        (super_admin: rollback)
```

1. Nội dung được tạo ở `draft` trong studio.
2. Người soạn tự kiểm, gửi duyệt → `in_review`.
3. Người duyệt xem preview trên **engine thật**, đối chiếu checklist §7.3.
4. Duyệt → `approved`. Từ chối → `rejected` kèm **lý do bắt buộc**.
5. Publish → `published`. Từ đây nội dung **bất biến**.
6. Cần sửa → tạo **version mới** ở `draft`; bản đang chạy vẫn `published` cho tới khi bản
   mới được publish, lúc đó bản cũ chuyển `archived`.

### 4.1 Đường thứ hai — nội dung nền từ seeder

Nội dung nền của MVP **không** đi qua studio. Nó được viết thành seeder file trong repo,
qua 8 cổng tự động, và **PR review là cổng người**. Merge = quyết định phát hành.

```
seeder file  ──8 cổng tự động──►  PR có người review  ──merge──►  seed  ──►  published
                                     ▲
                        cổng người ở đây, ❌ không ở hàng đợi duyệt
```

Hàng seed **sinh ra đã `published`** — nó không phải một chuyển trạng thái, nên không vi
phạm quy tắc `BR-CLC-02` (chỉ `approved` mới được `published`, không có đường tắt
`draft → published`). Ràng buộc đổi lại: seed **chỉ INSERT**, và phải qua đủ checklist §7.3 ở
tầng service như mọi lần publish khác (`BR-CLC-11`).

Sau khi seed, nội dung nằm hoàn toàn dưới quyền quản lý của admin trong studio: sửa = tạo
version mới, đi đúng máy trạng thái §4. Contract đầy đủ:
[`01-platform/content-seed-authoring.md`](../01-platform/content-seed-authoring.md).

## 5. Alternative flows

| Nhánh | Hành vi |
|---|---|
| `rejected` | Quay lại `draft` được. Lý do từ chối giữ trong `content_review_log` |
| Publish khi thiếu ràng buộc bắt buộc (§7.3) | **422** kèm danh sách thiếu — không publish một phần |
| Archive nội dung đang nằm trong curriculum `published` | **409** kèm danh sách nơi dùng |
| Rollback | `super_admin` publish lại một version `archived`; version đang chạy chuyển `archived` |
| Xoá cứng | **Chỉ** cho nội dung chưa từng `published` và chưa có telemetry |

## 6. Business rules

| ID | Rule | Vì sao |
|---|---|---|
| `BR-CLC-01` | Nội dung `published` **bất biến**. Mọi `UPDATE` lên hàng `published` bị từ chối ở tầng service **và** ở DB trigger | Báo cáo học tập phải giải thích được bằng đúng nội dung trẻ đã chơi |
| `BR-CLC-02` | Chỉ `approved` mới `published` được. Không có đường tắt `draft → published` | Cổng duyệt bị bỏ qua một lần là bị bỏ qua mãi mãi |
| `BR-CLC-03` | Người **tạo** và người **duyệt** có thể là một ở MVP, nhưng hệ thống ghi rõ cả hai | Khi có người thứ hai, tách nhiệm vụ không cần đổi schema |
| `BR-CLC-04` | **NEVER** có tiến trình máy nào tự chuyển trạng thái nội dung. Mọi chuyển trạng thái do một `manager_id` cụ thể thực hiện; seed chỉ **INSERT** hàng mới (§4.1) | Ranh giới cứng giữa "AI hỗ trợ soạn" và "AI tự phát hành". Không có LLM nào chạy trong hệ thống |
| `BR-CLC-05` | `rejected` **bắt buộc** có lý do ≥ 10 ký tự | Từ chối không lý do làm người soạn lặp lại đúng lỗi cũ |
| `BR-CLC-06` | `content_review_log` **INSERT-only** | Lịch sử duyệt là bằng chứng, không phải trạng thái |
| `BR-CLC-07` | Publish chạy trong **một transaction** với việc archive version cũ | Hai bản cùng `published` là hai bản cùng được phục vụ |
| `BR-CLC-08` | Xoá cứng **chỉ** khi chưa từng `published` **và** không có telemetry trỏ tới | Xoá cứng làm mồ côi dữ liệu học tập của trẻ |
| `BR-CLC-09` | Publish kiểm **toàn bộ** ràng buộc §7.3 ở server, không tin client | Một `content_pack` sai schema làm crash engine trong lúc trẻ đang chơi |
| `BR-CLC-10` | Mọi chuyển trạng thái ghi `audit_logs` | Nội dung sai gây hại cho trẻ — phải trả lời được ai đổi gì lúc nào |
| `BR-CLC-11` | Hàng sinh ra từ seed ở `published` phải qua **đủ checklist §7.3** ở tầng service, ghi `content_review_log` với `actor_manager_id` = người approve PR, và **không được `UPDATE`** bởi seed | Seed đi vòng qua route studio. Nếu checklist chỉ nằm ở route thì seed là lỗ hổng lớn nhất của cổng duyệt |

## 7. Data

### 7.1 Enum

```ts
type ContentStatus = "draft" | "in_review" | "approved" | "published" | "archived" | "rejected";
```

Bảng chuyển hợp lệ:

| Từ ↓ / Sang → | draft | in_review | approved | published | archived | rejected |
|---|:--:|:--:|:--:|:--:|:--:|:--:|
| **draft** | — | Có | Không | Không | Không | Không |
| **in_review** | Có | — | Có | Không | Không | Có |
| **approved** | Có | Không | — | Có | Không | Không |
| **published** | Không | Không | Không | — | Có | Không |
| **archived** | Không | Không | Không | Có *(chỉ super_admin)* | — | Không |
| **rejected** | Có | Không | Không | Không | Không | — |

Chuyển ngoài bảng → **409** `INVALID_STATUS_TRANSITION`.

Bảng này nói về **chuyển** trạng thái. Trạng thái **khởi sinh** có hai giá trị hợp lệ:
`draft` (tạo trong studio) và `published` (INSERT từ seed, §4.1). Không có giá trị khởi
sinh nào khác.

### 7.2 `content_review_log` — INSERT-only

**Định nghĩa cột chuyển sang [`schema-identity-billing.md`](../01-platform/schema-identity-billing.md)
mục 7.10a, theo quyết định D-AC** (2026-08-07 — cột `content_review_log` thuộc
[`schema-identity-billing.md`](../01-platform/schema-identity-billing.md), không thuộc file
này). Mục 7 của [`data-model-overview.md`](../01-platform/data-model-overview.md) xếp bảng này
vào module `ops`, sở hữu bởi file đó. File này (content-lifecycle) giữ quyền định nghĩa **ngữ
nghĩa**: mỗi hàng ghi một lần chuyển trạng thái (`from_status`/`to_status`), `reason` bắt buộc
≥10 ký tự khi `to_status = 'rejected'` (quy tắc `BR-CLC-05` — `rejected` bắt buộc có lý do dài
tối thiểu 10 ký tự), `checklist_snapshot` là kết quả §7.3 tại thời điểm chuyển. Cột thật — tên,
kiểu, `entity_id` polymorphic — xem mục 7.10a của cùng file trên.

### 7.3 Checklist publish — kiểm ở server

| Thực thể | Ràng buộc bắt buộc |
|---|---|
| **Mọi** | `access_tier` có mặt · gắn ≥1 skill · gắn ≥1 learning objective · band tuổi hiệu lực không rỗng, nằm trong `[3,6]` (lấy từ cột với `game_levels`/`lessons` và từ giao band skill với `activities` theo `D-LC`) · title tiếng Việt không rỗng |
| `game_levels` | `content_pack` parse được bằng `content_contract` của template · có ít nhất một đáp án đúng · không câu hỏi rỗng · mọi asset id resolve được · số lượng item nằm trong giới hạn template · `difficulty ∈ [1,5]` |
| `activities` | `kind` hợp lệ · 2–20 phút · `instruction` đủ bốn phần (chuẩn bị, các bước, dễ hơn, khó hơn) · ≥1 câu nói với trẻ · 1–2 skill · vật liệu bắt buộc với kind ngoài màn hình · qua cổng an toàn theo band suy ra · ràng buộc riêng theo kind của [`activity-model.md`](../05-content/activity-model.md) §7.2 · `digital_game` trỏ level `published` |
| `lessons` | ≥1 activity · `estimated_minutes ∈ [5,45]` · có `guide` |
| `curricula` | Mọi `curriculum_item` trỏ tới nội dung `published` · không tuần rỗng |
| `worksheets` | Render thử ra PDF thành công |

Thiếu bất kỳ mục nào → **422** kèm mảng `missing[]`, không publish một phần.

### 7.4 Ràng buộc DB

```sql
-- Chặn sửa hàng đã published ở tầng thấp nhất
CREATE TRIGGER trg_game_levels_immutable
BEFORE UPDATE ON game_levels
FOR EACH ROW WHEN (OLD.status = 'published' AND NEW.status = 'published')
EXECUTE FUNCTION reject_published_mutation();
```

Trigger tồn tại vì tầng service có thể bị bỏ qua bởi seeder, migration, hay một script vận
hành. Ràng buộc quan trọng nhất được ép ở nơi thấp nhất.

## 8. API contract

### `POST /api/managers/content/{entity_type}/{id}/transition`

| | |
|---|---|
| Auth | `requireManagerAuth()` + `requireRole` theo §2 |
| Body | `{ to_status, reason?, expected_version }` |
| 200 | `{ status, content_version, review_log_id }` |
| 409 | `INVALID_STATUS_TRANSITION` · `CONTENT_IN_USE` · `VERSION_CONFLICT` |
| 422 | `PUBLISH_CHECKLIST_FAILED` + `{ missing: string[] }` |
| 403 | `INSUFFICIENT_ROLE` |

`expected_version` chống ghi đè khi hai Manager mở cùng một bản.

## 9. Acceptance criteria

```gherkin
Scenario: BR-CLC-01 — không sửa được bản đã publish
  Given một game level ở trạng thái published
  When gửi PATCH đổi content_pack của nó
  Then hệ thống trả 409
  And nội dung trong DB không đổi

Scenario: BR-CLC-01 — trigger DB chặn cả đường vòng
  Given một game level ở trạng thái published
  When chạy UPDATE trực tiếp trên DB đổi content_pack, giữ nguyên status
  Then transaction bị trigger từ chối

Scenario: BR-CLC-02 — không có đường tắt tới published
  Given một game level ở trạng thái draft
  When manager gửi transition tới published
  Then hệ thống trả 409 INVALID_STATUS_TRANSITION

Scenario: BR-CLC-04 — không tiến trình máy nào chuyển được trạng thái
  When quét toàn bộ đường code gọi transition
  Then mọi lời gọi đều mang một actor_manager_id có thật
  And không job, script, hay seeder nào gọi được transition

Scenario: BR-CLC-11 — seed ghi published nhưng vẫn qua checklist
  Given một batch seed có một game level thiếu learning objective
  When chạy pnpm seed:content
  Then transaction bị rollback
  And không hàng nào trong batch được ghi

Scenario: BR-CLC-11 — seed không UPDATE được hàng đã published
  Given một game level published có nguồn từ seed
  When seeder đổi content_pack mà giữ nguyên content_version
  Then seed từ chối
  And nội dung trong DB không đổi

Scenario: BR-CLC-09 — publish kiểm checklist ở server
  Given một game level approved có content_pack thiếu đáp án đúng
  When manager publish
  Then hệ thống trả 422 PUBLISH_CHECKLIST_FAILED
  And missing chứa "no_correct_answer"
  And status vẫn là approved

Scenario: BR-CLC-05 — từ chối bắt buộc có lý do
  Given một game level ở in_review
  When manager reject với reason rỗng
  Then hệ thống trả 422
  And status vẫn là in_review

Scenario: BR-CLC-07 — publish và archive trong một transaction
  Given version 1 đang published và version 2 đã approved
  When manager publish version 2
  Then đúng một version có status = published
  And version 1 có status = archived

Scenario: BR-CLC-08 — không xoá được nội dung có telemetry
  Given một game level đã published và có telemetry_events trỏ tới
  When manager gọi DELETE
  Then hệ thống trả 409 CONTENT_IN_USE
  And body liệt kê nơi đang dùng
```

## 10. Boundaries

**Always**
- Kiểm bảng chuyển trạng thái §7.1 ở server.
- Chạy checklist publish đầy đủ, trả `missing[]` khi thiếu.
- Ghi `content_review_log` và `audit_logs` mọi lần chuyển.
- Publish + archive trong một transaction.

**Ask first**
- Thêm trạng thái mới.
- Nới một mục checklist publish.
- Cho phép một chuyển trạng thái không có trong §7.1.

**Never**
- Sửa hàng đã `published` — kể cả từ seeder.
- Đường tắt `draft → published`.
- Cho một tiến trình máy chuyển trạng thái nội dung.
- Seed một hàng `published` mà không chạy checklist §7.3.
- Từ chối không lý do.
- Xoá cứng nội dung đã publish hoặc có telemetry.
- `UPDATE`/`DELETE` trên `content_review_log`.

## 11. Open questions

| # | Câu hỏi | Chặn gì | Chặn phase | Chủ |
|---|---|---|---|---|
| 1 | Ở MVP một người vừa soạn vừa duyệt. Có nên chặn tự duyệt bản do chính mình tạo khi có ≥2 manager? | Khi tuyển người thứ hai | Hoãn, chặn phase P2 | hoãn |
| 2 | Nội dung `authored_in = repo_seed` có cần hiển thị khác trong studio để admin biết sửa nó nghĩa là tách khỏi seeder không? | [`content-seed-authoring.md`](../01-platform/content-seed-authoring.md), quy tắc `BR-CSA-11` (seeder file là nguồn sự thật của lô nền) | Hoãn, chặn phase P1 | hoãn |
| ~~3~~ | ~~Có cần trạng thái `scheduled`~~ **Đóng 2026-08-06 (T10)**: **không ở MVP**. Thêm giá trị enum vòng đời sau là migration non-breaking. MVP không có chiến dịch nội dung theo mùa | — | Đã đóng | D-X (T10) |
