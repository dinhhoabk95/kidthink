# Kế hoạch — Task #88: Chuẩn hoá 5 quy ước schema toàn cục

> **Loại task:** refactor xuyên suốt (L). Chạy trên nền lần gộp migration ngay trước đó — `packages/db/src/migrations` đã về một `0000_init.sql` sinh từ `src/schema/*.ts`.
> **Spec sở hữu:** [`data-model-overview.md`](../specs/01-platform/data-model-overview.md) · [`schema-identity-billing.md`](../specs/01-platform/schema-identity-billing.md) · [`schema-content-taxonomy.md`](../specs/01-platform/schema-content-taxonomy.md) · [`schema-play-telemetry.md`](../specs/01-platform/schema-play-telemetry.md) · [`auth-tokens-sessions.md`](../specs/01-platform/auth-tokens-sessions.md).

## 1. Outcome

Năm quy ước do người quyết định chốt, áp cho **toàn bộ** schema và mọi nơi code chạm tới:

1. **Bỏ hậu tố `_vi`.** Hệ thống một ngôn ngữ hiển thị, hậu tố không mang thông tin.
2. **Bỏ refresh token.** Phiên đăng nhập dùng session + remember me, không còn vòng đời token thứ hai.
3. **Mọi bảng có `created_at` và `updated_at`**, theo kiểu timestamps của Laravel.
4. **Cặp đa hình `(model_type, model_id)` đánh index, không đặt khoá ngoại.**
5. **Mọi bảng có `id` tự tăng**, trừ bảng pivot trung gian — pivot đặt PK ghép theo các cột `*_id`.

Vì migration đã gộp về một file init và chưa deploy ở đâu ngoài máy local, mọi thay đổi
dưới đây sinh lại `0000_init.sql`, không viết migration tiến tới.

## 2. Bằng chứng đã đo (2026-08-16)

| Hạng mục | Số đo |
|---|---|
| Cột `_vi` | 19 tên khác nhau, trên 17 bảng |
| File chạm `_vi` | 186 (packages/db 77 · apps/web 77 · packages/shared 15 · apps/admin 11 · khác 6) |
| Va chạm tên khi bỏ hậu tố | **0** — không bảng nào có sẵn cột trùng tên đích |
| File chạm refresh token | 82 |
| Bảng thiếu `created_at` hoặc `updated_at` hoặc `id` | 53 / 78 |
| Bảng có cặp đa hình `*_type` + `*_id` | 24 |
| Bảng hiện không có cột `id` | 20 |

## 3. Assumptions và ranh giới

Những chỗ chỉ thị của người quyết định không tự nói hết. Ghi ra đây để bác được, không hỏi lại
bằng multiple-choice.

1. **Quy ước 1 chỉ đổi hậu tố, không đổi tên cột đa hình.** `entity_type`/`owner_type`/
   `account_type`/`ref_type`/`recipient_type` giữ nguyên. Cụm từ `model_type, model_id` ở quy
   ước 4 đọc là **mô tả mẫu thiết kế đa hình**, không phải yêu cầu đổi mọi cặp sang đúng hai
   tên đó. Đổi tên chúng là một outcome riêng, đụng thêm ~40 file và ba spec schema.
2. **Quy ước 4, chữ "unique" áp có điều kiện.** Đọc nguyên văn "index unique 2 trường" thì
   không áp được: `content_images` có nhiều ảnh trên một owner, `content_tag_map` nhiều tag
   trên một entity, `audit_logs` nhiều dòng trên một entity. Hiểu đúng ý là:
   - cặp `(type, id)` **luôn có index ghép** — đây là phần bắt buộc, đang thiếu ở nhiều bảng;
   - **UNIQUE** chỉ ở nơi cặp đó thật sự định danh hàng (quan hệ 1–1);
   - **không bao giờ là khoá ngoại** — Postgres không ép được FK đa hình, và
     `BR-DM-04` đã quy định toàn vẹn do tầng service giữ + bắt buộc test orphan.
3. **Quy ước 5 không áp cho khoá tự nhiên đã được spec chốt.** Bốn bảng giữ nguyên PK hiện tại
   vì spec sở hữu định nghĩa rõ và có lý do vận hành:
   - `packages(code)` và `entitlement_keys(key)` — catalog, `code`/`key` là định danh đối ngoại
     và đang là đích của FK thật (`BR-SIB-02`);
   - `telemetry_events(session_uuid, seq)` — chốt tại [`event-catalog.md`](../specs/00-foundation/event-catalog.md) Q2, gắn với ngưỡng
     partition 5M hàng;
   - `consent_requirements(consent_type)` — singleton đúng ba hàng (`BR-SIB-12`).

   Thêm `id` cho bốn bảng này là đổi contract, phải sửa spec trước. Xem mục 5.
4. **Bảng rollup/1–1 được coi là bảng thường**, nhận `id` tự tăng và giữ UNIQUE trên khoá
   nghiệp vụ cũ: `child_daily_stats`, `level_daily_stats`, `skill_daily_stats`,
   `mastery_state`, `level_params`, `quota_usage`, `ai_credit_balance`,
   `child_session_summaries`, `notification_reads`.
5. **Bảng pivot thật** (chỉ nối hai bảng, không có định danh riêng) giữ PK ghép, không thêm
   `id`: `package_entitlements`, `skill_prerequisites`, `content_tag_map`,
   `content_skill_map`, `user_tag_map`, `library_items`, `lesson_activities`.
6. **`updated_at` trên bảng INSERT-only là cột chết nhưng vẫn thêm** cho đồng nhất. Quyền DB
   vẫn REVOKE UPDATE nên không ai ghi được vào đó — quy ước thắng, ngữ nghĩa không đổi.

## 4. Thứ tự thực hiện

```text
P1  bỏ hậu tố _vi            (schema → code → seed → test → spec)
P2  bỏ refresh token          (packages/auth → endpoint → contract → test)
P3  created_at + updated_at   (53 bảng)
P4  index cặp đa hình         (24 bảng)
P5  id tự tăng + PK pivot     (20 bảng)
P6  sinh lại 0000_init.sql, dựng DB rỗng, chạy seed, chạy full test
```

Mỗi phase chạy `pnpm exec vitest run` trong `packages/db` trước khi sang phase sau; phase nào
đỏ thì dừng ở đó chứ không dồn.

## 5. Xung đột spec phải xử lý

Bốn chỉ thị đụng spec đang `approved`. Theo nguyên tắc "sửa spec trước, code sau" của
[`roadmap.md`](../specs/roadmap.md), phần này cần cập nhật spec cùng lượt:

| Chỉ thị | Spec bị đụng | Nội dung phải sửa |
|---|---|---|
| Bỏ `_vi` | ba spec `schema-*` | Vốn đã ghi tên trơn (`title`, `instruction`, `notice`) — code lệch, spec đúng. Không phải sửa spec, chỉ sửa code. |
| Bỏ refresh token | [`auth-tokens-sessions.md`](../specs/01-platform/auth-tokens-sessions.md) | Spec đang mô tả vòng đời refresh token và `session_version`. Phải viết lại §7.2/§7.5 sang mô hình session + remember me. |
| `updated_at` mọi bảng | [`data-model-overview.md`](../specs/01-platform/data-model-overview.md) `BR-DM-08` | Rule hiện ghi "bảng sửa được có `updated_at`". Siết thành "mọi bảng" là mở rộng, cần sửa câu chữ. |
| `id` mọi bảng | [`schema-identity-billing.md`](../specs/01-platform/schema-identity-billing.md) §7.5/§7.6, [`schema-play-telemetry.md`](../specs/01-platform/schema-play-telemetry.md) | Chỉ ảnh hưởng bốn bảng khoá tự nhiên ở giả định 3. Nếu người quyết định muốn ép cả bốn thì sửa spec trước. |

## 6. Rủi ro

1. **Đổi tên cột diện rộng dễ sót ở chuỗi động.** Rà cả `sql\`\`` template và tên cột trong
   JSON seed, không chỉ property TypeScript.
2. **Bỏ refresh token chạm đường đăng nhập thật.** 82 file, phần lớn là test dựng sẵn payload
   phiên. Sai một chỗ là toàn bộ route auth 401.
3. **Đổi PK của bảng pivot làm FK trỏ vào nó gãy.** Kiểm `lesson_activities` trước khi đổi PK
   từ `(lesson_id, position)` sang `(lesson_id, activity_id)`.
4. **DB local của người dùng phải dựng lại** sau P6; dữ liệu dev hiện có không migrate được và
   cũng không cần.
