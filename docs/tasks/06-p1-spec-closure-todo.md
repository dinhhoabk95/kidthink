# Checklist — Task #6: Đóng corpus spec P1, lô 1

> Lý do, đồ thị phụ thuộc, bảy quyết định `D-AH`–`D-AN` và quy trình chuẩn bảy việc:
> [`06-p1-spec-closure-plan.md`](06-p1-spec-closure-plan.md).
>
> Mọi lệnh chạy từ thư mục `kidthink/`. Đặt lại đường dẫn Node trước mỗi phiên shell mới —
> **kể cả trước mỗi lệnh `git commit`**, vì lefthook chạy `pnpm` và shell mặc định là v20:
>
> ```
> export PATH=/Users/macbook/.nvm/versions/node/v24.15.0/bin:$PATH
> ```
>
> **Tick ô ngay khi làm xong.** Task #2 từng để lại một file 217 dòng toàn ô trống trong khi
> việc đã xong. Đừng lặp lại.
>
> Cấm `git commit --no-verify` và `git push --no-verify` — không có cổng remote đỡ phía sau
> ([`repo-bootstrap.md`](../specs/00-foundation/repo-bootstrap.md) §10).

## Thứ tự làm

```
Bước 0 -> Bước 1 -> Bước 2 -> Bước 3 -> Cổng dừng A
                                            |
        +-----------------------------------+
        |                                   |
   Bước 4..7 (lô 1)                   Bước 8..11 (lô 2)         Bước 12..14 (lô 3)
   đường găng                         platform                  tài khoản và admin
        |                                   |                          |
        +-----------------------------------+--------------------------+
                                            |
                                       Cổng dừng B
                                            |
                              Bước 15 -> Bước 16 -> Bước 17 -> Cổng dừng cuối
```

Mười một spec ở Bước 4–14 **không phụ thuộc lẫn nhau** — ba lô chạy song song được.

---

## Bước 0 — Sửa gate đỏ (đã xong, commit `c4c910e`)

- [x] Đổi tên `06-first-migration-{plan,todo}.md` thành `07-first-migration-*` (migration lùi
      thành Task #7)
- [x] Sửa 21 tham chiếu trần thành liên kết markdown (`C15`)
- [x] Sửa 3 link vỡ do đổi tên (`C4`) và 16 liên kết lồng đôi do thay thế hàng loạt
- [x] `pnpm lint:specs` — 0 lỗi, 179 cảnh báo
- [x] Commit `docs(tasks): T6 bước 0 — plan migration đổi số 06 sang 07, sửa 21 lỗi C15`

## Bước 1 — Ca âm `C7` (chứng minh cổng bắt được chu trình)

`C7` chưa từng được chứng minh là bắt đúng. Nó cũng chưa từng đỏ, vì nó chỉ gọi `warn()`.

- [x] Đọc `checkC7` ở [`scripts/lint-specs-lib.ts`](../../scripts/lint-specs-lib.ts) dòng 734
- [x] Đọc ca âm `C8` đã có ở [`scripts/tests/lint-specs.test.ts`](../../scripts/tests/lint-specs.test.ts)
      làm khuôn
- [x] **Đo được: bốn ca này ĐÃ tồn tại sẵn** (`A → B → A`, `A → B → C → A`, DAG không chu
      trình, dep ngoài đồ thị). Bước 1 vì vậy thu lại thành: siết assertion và thêm ca thiếu
- [x] Siết hai ca chu trình từ `.some(...)` sang **đếm chính xác** — `.some()` chỉ bắt
      under-report, không bắt over-report
- [x] Thêm **ca mới**: hai chu trình rời nhau phải báo riêng (bắt lỗi `cycleKey` đụng độ)
- [x] Thêm **ca mới**: self-edge `A → A` (chu trình suy biến, dễ viết nhầm khi copy
      frontmatter)
- [x] `pnpm test` — 208 sang 210
- [x] **Xác minh bằng mutation, ghi kết quả vào comment của test và commit body**:
      rỗng hoá `checkC7` → đỏ 2 ca sẵn có · thu hẹp back-edge thành `dep !== node` → đỏ ca
      self-edge · `cycleKey = String(cycle.length)` → đỏ ca hai chu trình rời **và** corpus
      thật tụt âm thầm 8 sang 2 · bỏ guard `reportedCycles` → **không đổi gì** trên mọi input
      đã thử, kể cả corpus thật (guard đó phòng thủ, hiện chưa mang tải)
- [x] Commit `test(specs): T6 bước 1 — ca âm C7 cho chu trình depends_on`

## Bước 2 — Cắt tám chu trình và ba tham chiếu tiến

Sáu quyết định, mỗi cái sửa `depends_on` **và** đổi chỗ nhắc trong văn xuôi thành liên kết.
Cấm xoá thông tin — chỉ đổi cạnh phụ thuộc thành liên kết tham chiếu.

### `D-AH` — [`accessibility.md`](../specs/08-quality/accessibility.md)

- [x] Xoá `DESIGN-SYSTEM-CONTRACT` khỏi `depends_on`, để `depends_on: []`
- [x] Xác nhận văn xuôi không nhắc [`design-system-contract.md`](../specs/08-quality/design-system-contract.md) ở đâu (đã đo: không nhắc) — nếu
      có thì đổi thành liên kết
- [x] Xác nhận chiều ngược `DESIGN-SYSTEM-CONTRACT → ACCESSIBILITY` còn nguyên

### `D-AI` — [`legal-pages.md`](../specs/02-public/legal-pages.md)

- [x] Xoá `CONSENT-MANAGEMENT` khỏi `depends_on`, còn `CHILD-DATA-COMPLIANCE`
- [x] Đổi mọi chỗ nhắc luồng đồng ý trong văn xuôi thành liên kết tới
      [`consent-management.md`](../specs/03-account/consent-management.md)
- [x] Xác nhận chiều `CONSENT-MANAGEMENT → LEGAL-PAGES` còn nguyên

### `D-AJ` — [`seo-and-structured-data.md`](../specs/02-public/seo-and-structured-data.md)

- [x] Xoá **cả hai** `GAME-DETAIL-PUBLIC` và `PROGRAM-SHOWCASE` khỏi `depends_on`, để
      `depends_on: []`
- [x] Đổi chỗ nhắc hai trang đó thành liên kết
- [x] Xác nhận ba chiều ngược còn nguyên: `GAME-CATALOG-PUBLIC`, `GAME-DETAIL-PUBLIC`,
      `PROGRAM-SHOWCASE` đều còn `depends_on: SEO-AND-STRUCTURED-DATA`

### `D-AK` — [`basic-report.md`](../specs/03-account/basic-report.md)

- [x] Xoá `PROGRESS-AND-MASTERY` khỏi `depends_on`, còn `TELEMETRY-PIPELINE` và
      `ENTITLEMENT-MODEL`
- [x] Thêm câu văn xuôi + liên kết ghi rõ bản đồ tiến bộ mở rộng ở P3 qua
      [`progress-and-mastery.md`](../specs/04-play/progress-and-mastery.md)
- [x] Xác nhận spec không đọc `mastery_state` ở §7 hay §8 — nếu có thì `D-AK` sai, dừng lại
      và ghi vào sổ cái trước khi sửa

### `D-AL` — [`faq-and-help.md`](../specs/02-public/faq-and-help.md)

- [x] Xoá `SEO-CONTENT-ADMIN` khỏi `depends_on`, còn `SEO-AND-STRUCTURED-DATA`
- [x] Đổi chỗ nhắc màn hình admin thành liên kết tới
      [`seo-content-admin.md`](../specs/06-admin/seo-content-admin.md), ghi rõ sửa qua CMS là
      năng lực P2

### `D-AN` — ba chu trình P2

- [x] [`emoji-picker.md`](../specs/06-admin/emoji-picker.md): xoá `SCHEMA-DRIVEN-FORM` khỏi
      `depends_on`, còn `EMOJI-REGISTRY`
- [x] [`image-upload.md`](../specs/06-admin/image-upload.md): xoá `SCHEMA-DRIVEN-FORM` khỏi
      `depends_on`, còn `IMAGE-STORAGE`
- [x] [`live-preview.md`](../specs/06-admin/live-preview.md): xoá `GAME-LEVEL-STUDIO` khỏi
      `depends_on`, còn `GAME-ENGINE-RUNTIME`
- [x] Xác nhận ba chiều ngược còn nguyên: `SCHEMA-DRIVEN-FORM → EMOJI-PICKER`,
      `SCHEMA-DRIVEN-FORM → IMAGE-UPLOAD`, `GAME-LEVEL-STUDIO → LIVE-PREVIEW`
- [x] Đổi chỗ nhắc trong văn xuôi ba file thành liên kết

### Kiểm chung Bước 2

- [x] `pnpm lint:specs` — **0 cảnh báo `C7`** (nền là 8)
- [x] `pnpm lint:specs` — 0 lỗi
- [x] Commit `fix(specs): T6 bước 2 — cắt 8 chu trình depends_on (D-AH..D-AN)`

## Bước 3 — `D-AM`: [`next-game-recommendation.md`](../specs/04-play/next-game-recommendation.md) P1 sang P3

- [x] Đọc lại §P1 và §P3 của [`roadmap.md`](../specs/roadmap.md), xác nhận nó ở P3 mục 6 và
      **không** có trong danh sách P1
- [x] Đổi `phase: P1` thành `phase: P3` trong frontmatter
- [x] Cập nhật `reviewed`
- [x] Cập nhật dòng tương ứng trong bảng `04-play` của [`index.md`](../specs/index.md)
- [x] Xác nhận [`roadmap.md`](../specs/roadmap.md) **không cần sửa** (nó đã đúng)
- [x] Đếm lại: `P1` phải ra **43**, `P3` phải ra **12**
- [x] Cập nhật [`SPEC.md`](../SPEC.md) §14 nếu nó có số đếm theo phase
- [x] `pnpm lint:specs` 0 lỗi
- [x] Commit `fix(specs): T6 bước 3 — next-game-recommendation P1 sang P3 (D-AM)`

## Cổng dừng A

- [x] `pnpm lint:specs` — 0 lỗi **và 0 cảnh báo `C7`**
- [x] `pnpm test` xanh, có ca âm `C7`
- [x] `pnpm check` xanh
- [x] Đếm: `P1` = 43, `P3` = 12, `approved` = 38 (chưa approve gì ở bước này)
- [x] `git status` sạch

---

## Lô 1 — đường găng

### Bước 4 — [`game-engine-runtime.md`](../specs/01-platform/game-engine-runtime.md) (232 dòng, 17 rule, 3 hỏi mở, 0 `C6`)

- [x] Đọc hết file
- [x] Đối chiếu với [`game-template-contract.md`](../specs/01-platform/game-template-contract.md)
      và [`event-catalog.md`](../specs/00-foundation/event-catalog.md), cả hai đã `approved`
- [x] Xác nhận ràng buộc bất biến bề mặt trẻ khớp
      [`accessibility.md`](../specs/08-quality/accessibility.md) §7.1 (sàn chạm theo band tuổi)
- [x] Xác nhận tên `packages/game-engine` khớp
      [`monorepo-package-architecture.md`](../specs/00-foundation/monorepo-package-architecture.md) §7.1
- [x] **Chốt hoặc xác nhận hoãn câu hỏi thiết bị chuẩn đo 60 fps** — nó là 1 trong 3 câu hỏi
      chặn nhiều nhất của [`index.md`](../specs/index.md), và
      [`testing-strategy.md`](../specs/08-quality/testing-strategy.md) §11 Q2 trỏ về đây
- [x] Checklist [`CONVENTIONS.md`](../specs/CONVENTIONS.md) §10
- [x] `status: approved`, cập nhật `reviewed`
- [x] `pnpm lint:specs` 0 lỗi
- [x] Commit `feat(specs): T6 bước 4 — approve game-engine-runtime`

### Bước 5 — [`access-gating.md`](../specs/04-play/access-gating.md) (205 dòng, 8 rule, 2 hỏi mở, 1 `C6`)

Spec mà `D-AG` của Task #5 đã cắt cạnh để không phải kéo vào lô trước. Giờ tới lượt nó.

- [x] Đọc hết file
- [x] Đối chiếu **ma trận 20 ô** với [`access-ladder.md`](../specs/00-foundation/access-ladder.md)
      và [`entitlement-model.md`](../specs/00-foundation/entitlement-model.md) §7.1
- [x] Xác nhận 7 bước gating khớp `BR-ENT-01` (gate bằng entitlement key, không bằng
      `package_code`) và `BR-ENT-06` (đọc từ DB/cache, không từ JWT)
- [x] Xác nhận mọi chỗ [`security-checklist.md`](../specs/08-quality/security-checklist.md)
      nhắc gating (sau `D-AG`) vẫn đúng với nội dung file này
- [x] Điền "vì sao" cho rule còn trống (1 cảnh báo `C6`)
- [x] Xác nhận [`testing-strategy.md`](../specs/08-quality/testing-strategy.md) §7.3 "20 ô
      gating" khớp đúng 20 ô ở đây — nếu lệch thì một trong hai sai, ghi sổ cái trước khi sửa
- [x] Checklist [`CONVENTIONS.md`](../specs/CONVENTIONS.md) §10
- [x] `status: approved`, cập nhật `reviewed`
- [x] `pnpm lint:specs` 0 lỗi
- [x] Commit `feat(specs): T6 bước 5 — approve access-gating`

### Bước 6 — [`content-seed-authoring.md`](../specs/01-platform/content-seed-authoring.md) (405 dòng, 14 rule, 6 hỏi mở, 0 `C6`)

**File dài nhất và quan trọng nhất của lô.** Đường găng dài nhất của MVP.

- [x] Đọc hết file — 405 dòng, không đọc lướt
- [x] Đối chiếu 6 `depends_on` đều `approved`: `CONTENT-LIFECYCLE` · `CONTENT-VERSIONING` ·
      `GAME-TEMPLATE-CONTRACT` · `TAXONOMY-SERVICE` · `EMOJI-REGISTRY` · `AI-CODEGEN-PIPELINE`
- [x] Xác nhận **8 cổng tự động** của seeder không mâu thuẫn quyết định "không có cổng remote"
      ([`repo-bootstrap.md`](../specs/00-foundation/repo-bootstrap.md) §11 Q5) — cổng ở đây
      chạy local hoặc trong script seed, không phải cổng CI
- [x] Xác nhận câu "không có cờ bỏ qua" đã sửa đúng thực tế ở Task #5 (`D-S`, Q12) — cờ
      `--no-verify` tồn tại ở máy cá nhân
- [x] Xác nhận bảng `content_seed_batches` khớp
      [`schema-identity-billing.md`](../specs/01-platform/schema-identity-billing.md) §7.10b
      (bảng **hoãn**, không vào migration #1)
- [x] Xác nhận cột `origin` · `authored_in` · `seed_batch_id` khớp
      [`schema-content-taxonomy.md`](../specs/01-platform/schema-content-taxonomy.md) §7.4
- [x] Xử lý 6 câu hỏi mở — **câu "ai biên soạn ≥690 LO, ≥120 game level"** là 1 trong 3 câu
      chặn nhiều nhất corpus ([`index.md`](../specs/index.md)); nếu chưa có chủ thì ghi rõ nó
      chặn P1 và cần **người**, không tự chốt
- [x] Checklist [`CONVENTIONS.md`](../specs/CONVENTIONS.md) §10
- [x] `status: approved`, cập nhật `reviewed`
- [x] `pnpm lint:specs` 0 lỗi
- [x] Commit `feat(specs): T6 bước 6 — approve content-seed-authoring`

### Bước 7 — [`game-level-model.md`](../specs/05-content/game-level-model.md) (162 dòng, 10 rule, 2 hỏi mở, 0 `C6`)

- [x] Đọc hết file
- [x] Đối chiếu trần item theo band với
      [`game-template-contract.md`](../specs/01-platform/game-template-contract.md) `limits`
- [x] Xác nhận định dạng mã `GL-*` khớp
      [`id-conventions.md`](../specs/00-foundation/id-conventions.md) §7 **và** regex
      `GAME_LEVEL_CODE_REGEX` ở [`packages/shared/src/ids.ts`](../../packages/shared/src/ids.ts)
      (`/^GL-C[1-6]-[A-Z]{2,5}-[A-Z]{2,5}-\d{4}$/`)
- [x] Xác nhận cột khớp [`schema-content-taxonomy.md`](../specs/01-platform/schema-content-taxonomy.md) §7.4,
      gồm `entity_id` neo dòng dõi (`D-AE`) và `access_tier` NOT NULL không default
- [x] Xác nhận "chỉ dẫn ≤12 từ" không mâu thuẫn `BR-A11-11` (chỉ dẫn không bao giờ chỉ bằng chữ)
- [x] Checklist [`CONVENTIONS.md`](../specs/CONVENTIONS.md) §10
- [x] `status: approved`, cập nhật `reviewed`
- [x] `pnpm lint:specs` 0 lỗi
- [x] Commit `feat(specs): T6 bước 7 — approve game-level-model`

---

## Lô 2 — platform

### Bước 8 — [`content-tagging.md`](../specs/01-platform/content-tagging.md) (172 dòng, 7 rule, 2 hỏi mở, 2 `C6`)

- [ ] Đọc hết file
- [ ] Đối chiếu ba trục `what`/`thinking`/`mechanic` với
      [`taxonomy-service.md`](../specs/01-platform/taxonomy-service.md)
- [ ] Xác nhận enum `axis` khớp [`schema-content-taxonomy.md`](../specs/01-platform/schema-content-taxonomy.md) §7.2
      — spec schema ghi **bốn** giá trị (`what`·`thinking`·`mechanic`·`theme`); nếu file này
      chỉ tả ba thì ghi sổ cái chỗ lệch trước khi sửa
- [ ] Xác nhận `content_skill_map.weight` miền `(0,1]` khớp `BR-SCT-07` và `BR-DM-03`
- [ ] Xác nhận FK dùng `id` không dùng `code` (`D-AE`, `BR-DM-13`)
- [ ] Điền "vì sao" cho 2 rule còn trống
- [ ] Checklist [`CONVENTIONS.md`](../specs/CONVENTIONS.md) §10
- [ ] `status: approved`, cập nhật `reviewed`
- [ ] `pnpm lint:specs` 0 lỗi
- [ ] Commit `feat(specs): T6 bước 8 — approve content-tagging`

### Bước 9 — [`telemetry-pipeline.md`](../specs/01-platform/telemetry-pipeline.md) (186 dòng, 9 rule, 3 hỏi mở, 2 `C6`)

- [ ] Đọc hết file
- [ ] Đối chiếu §7.1 (cột bảng rollup) với
      [`schema-play-telemetry.md`](../specs/01-platform/schema-play-telemetry.md) §7.5 — spec
      schema **trỏ về đây** cho chi tiết cột, nên đây là nguồn sở hữu
- [ ] Xác nhận không cột nào chứa PII, khớp
      [`child-data-compliance.md`](../specs/00-foundation/child-data-compliance.md) §7.3
- [ ] Xác nhận mốc ngày dùng `date_ict` (múi giờ ICT), khớp `BR-ENT-10`
- [ ] Xác nhận `telemetry_events` không partition ở P0 (`D-Z`) và không FK nào trỏ vào nó
- [ ] Điền "vì sao" cho 2 rule còn trống
- [ ] Checklist [`CONVENTIONS.md`](../specs/CONVENTIONS.md) §10
- [ ] `status: approved`, cập nhật `reviewed`
- [ ] `pnpm lint:specs` 0 lỗi
- [ ] Commit `feat(specs): T6 bước 9 — approve telemetry-pipeline`

### Bước 10 — [`oauth-provider-registry.md`](../specs/01-platform/oauth-provider-registry.md) (254 dòng, 15 rule, 2 hỏi mở, 0 `C6`)

- [ ] Đọc hết file
- [ ] Đối chiếu với [`auth-tokens-sessions.md`](../specs/01-platform/auth-tokens-sessions.md),
      [`schema-identity-billing.md`](../specs/01-platform/schema-identity-billing.md) §7.3a,
      [`error-codes.md`](../specs/00-foundation/error-codes.md),
      [`rate-limiting.md`](../specs/01-platform/rate-limiting.md) — cả bốn đã `approved`
- [ ] Xác nhận `BR-OAP-06` (chỉ hai provider) khớp enum `social_identities.provider`
- [ ] Xác nhận `BR-OAP-07` và `BR-OAP-15` (không lưu token provider) khớp `BR-SIB-10` — cột
      không tồn tại thì không rò được
- [ ] Xác nhận PKCE bắt buộc và `nuxt-auth-utils` là thư viện nền
      ([`repo-bootstrap.md`](../specs/00-foundation/repo-bootstrap.md) §7.1), gọi qua
      `packages/auth` không import thẳng vào app (`BR-MPA-01`)
- [ ] Xác nhận `apps/admin` **không đăng ký route OAuth nào** — cấm bằng việc không có file
- [ ] Checklist [`CONVENTIONS.md`](../specs/CONVENTIONS.md) §10
- [ ] `status: approved`, cập nhật `reviewed`
- [ ] `pnpm lint:specs` 0 lỗi
- [ ] Commit `feat(specs): T6 bước 10 — approve oauth-provider-registry`

### Bước 11 — [`monitoring-and-alerting.md`](../specs/01-platform/monitoring-and-alerting.md) (192 dòng, 7 rule, 3 hỏi mở, 2 `C6`)

- [ ] Đọc hết file
- [ ] Đối chiếu với [`health-check.md`](../specs/01-platform/health-check.md) và
      [`job-queue.md`](../specs/01-platform/job-queue.md), cả hai đã `approved`
- [ ] Xác nhận kênh alert khớp [`repo-bootstrap.md`](../specs/00-foundation/repo-bootstrap.md) §7.1:
      Healthchecks.io cho liveness, Telegram Bot API cho ngưỡng và crash, email là dự phòng
- [ ] Xác nhận Sentry là `@sentry/nuxt` và câu hỏi SaaS hay GlitchTip vẫn để hoãn
      ([`repo-bootstrap.md`](../specs/00-foundation/repo-bootstrap.md) §11 Q8)
- [ ] Xác nhận "alert **tới người**" có nghĩa đo được — ai nhận, kênh nào, trong bao lâu
- [ ] Điền "vì sao" cho 2 rule còn trống
- [ ] Checklist [`CONVENTIONS.md`](../specs/CONVENTIONS.md) §10
- [ ] `status: approved`, cập nhật `reviewed`
- [ ] `pnpm lint:specs` 0 lỗi
- [ ] Commit `feat(specs): T6 bước 11 — approve monitoring-and-alerting`

---

## Lô 3 — tài khoản và admin

### Bước 12 — [`account-settings.md`](../specs/03-account/account-settings.md) (203 dòng, 11 rule, 1 hỏi mở, 0 `C6`)

- [ ] Đọc hết file
- [ ] Đối chiếu với [`login-and-session.md`](../specs/03-account/login-and-session.md),
      [`password-recovery.md`](../specs/03-account/password-recovery.md),
      [`notification-service.md`](../specs/01-platform/notification-service.md) — cả ba đã
      `approved` (cái cuối nhờ `D-AF`)
- [ ] Xác nhận đổi mật khẩu **giết mọi phiên** khớp
      [`login-and-session.md`](../specs/03-account/login-and-session.md) và
      `users.refresh_token_version`
- [ ] Xác nhận đổi email đi qua **reauth 5 phút**
      ([`auth-tokens-sessions.md`](../specs/01-platform/auth-tokens-sessions.md) §7.4,
      cột `active_sessions.reauth_at`)
- [ ] Xác nhận câu hỏi 1 của
      [`password-recovery.md`](../specs/03-account/password-recovery.md) §11 (nó ghi là chặn
      file này) đã được trả lời ở đây, hoặc ghi rõ vẫn hoãn
- [ ] Checklist [`CONVENTIONS.md`](../specs/CONVENTIONS.md) §10
- [ ] `status: approved`, cập nhật `reviewed`
- [ ] `pnpm lint:specs` 0 lỗi
- [ ] Commit `feat(specs): T6 bước 12 — approve account-settings`

### Bước 13 — [`account-deletion.md`](../specs/03-account/account-deletion.md) (193 dòng, 10 rule, 2 hỏi mở, 0 `C6`)

- [ ] Đọc hết file
- [ ] Đối chiếu với [`child-data-compliance.md`](../specs/00-foundation/child-data-compliance.md)
      và [`job-queue.md`](../specs/01-platform/job-queue.md), cả hai đã `approved`
- [ ] Xác nhận 30 ngày hoàn tác khớp cột `users.purge_at`
      ([`schema-identity-billing.md`](../specs/01-platform/schema-identity-billing.md) §7.1)
- [ ] Xác nhận `audit_logs` **giữ lại** khi xoá tài khoản (`BR-AUD-08`) và
      `telemetry_events.child_uuid` đặt về NULL thay vì xoá hàng (`BR-SPT-04`) — hai quy tắc
      này nằm ở spec khác, file này phải khớp chứ không định nghĩa lại
- [ ] Xác nhận `social_identities` cascade theo `users` (`BR-SIB-11`) — danh tính mồ côi chặn
      người dùng đăng ký lại
- [ ] Checklist [`CONVENTIONS.md`](../specs/CONVENTIONS.md) §10
- [ ] `status: approved`, cập nhật `reviewed`
- [ ] `pnpm lint:specs` 0 lỗi
- [ ] Commit `feat(specs): T6 bước 13 — approve account-deletion`

### Bước 14 — [`taxonomy-browser.md`](../specs/06-admin/taxonomy-browser.md) (155 dòng, 6 rule, 1 hỏi mở, 1 `C6`)

- [ ] Đọc hết file
- [ ] Đối chiếu với [`taxonomy-service.md`](../specs/01-platform/taxonomy-service.md) và
      [`admin-auth.md`](../specs/06-admin/admin-auth.md), cả hai đã `approved`
- [ ] Xác nhận **chỉ đọc** — không route ghi nào, khớp `BR-TAX-*` (taxonomy là Lớp 1)
- [ ] Xác nhận "chỉ báo khoảng trống" đọc từ `content_skill_map`, không tự tính lại taxonomy
- [ ] Điền "vì sao" cho rule còn trống
- [ ] Checklist [`CONVENTIONS.md`](../specs/CONVENTIONS.md) §10
- [ ] `status: approved`, cập nhật `reviewed`
- [ ] `pnpm lint:specs` 0 lỗi
- [ ] Commit `feat(specs): T6 bước 14 — approve taxonomy-browser`

## Cổng dừng B

- [ ] 11/11 spec đích `approved`
- [ ] `pnpm lint:specs` 0 lỗi, 0 cảnh báo `C7`
- [ ] Cảnh báo `C6` giảm ít nhất 8 so với nền 171
- [ ] `pnpm test` xanh
- [ ] Mọi quyết định mới ghi vào sổ cái của
      [`06-p1-spec-closure-plan.md`](06-p1-spec-closure-plan.md), đánh số tiếp từ `D-AN`
- [ ] Đếm `approved` toàn corpus = **49** (38 + 11)

---

## Bước 15 — [`data-model-overview.md`](../specs/01-platform/data-model-overview.md) §7.2: danh sách FK đa hình 7 sang 9

Lý do đầy đủ: [`07-first-migration-plan.md`](07-first-migration-plan.md) §2a.

- [ ] Đọc lại [`schema-content-taxonomy.md`](../specs/01-platform/schema-content-taxonomy.md)
      §7.5 (`activities.ref_id` theo `ref_type`) và §7.6 (`curriculum_items.entity_id` theo
      `entity_type`) — xác nhận cả hai là đa hình thật, không phải FK đơn bảng
- [ ] Thêm hai dòng vào bảng "danh sách đóng" §7.2 kèm cột "Test bắt buộc"
- [ ] Sửa "**Bảy chỗ**" thành "**Chín chỗ**" trong văn xuôi ngay dưới bảng
- [ ] Sửa `BR-DM-04` nếu nó nhắc con số bảy
- [ ] Sửa dòng "Ask first: Thêm một FK polymorphic thứ tám" ở §10 thành "thứ mười"
- [ ] Ghi quyết định vào sổ cái, đánh số tiếp từ `D-AN`
- [ ] Cập nhật `reviewed`, giữ `status: approved`
- [ ] `pnpm lint:specs` 0 lỗi
- [ ] Commit `fix(specs): T6 bước 15 — DMO §7.2 danh sách đa hình 7 sang 9`

## Bước 16 — Nâng `C7` từ cảnh báo lên lỗi

Chỉ làm **sau** khi Cổng dừng A đã xác nhận `C7` về 0. Nâng sớm hơn là làm đỏ gate.

- [ ] Đổi `warn(` thành `fail(` trong `checkC7`
      ([`scripts/lint-specs-lib.ts`](../../scripts/lint-specs-lib.ts) dòng 785)
- [ ] Cập nhật ca âm Bước 1 để khẳng định nó nằm trong danh sách **lỗi**, không phải cảnh báo
- [ ] Cập nhật phần chú thích đầu file liệt kê 15 kiểm tra (dòng 15: "C7 — depends_on không
      chu trình") nếu nó ghi mức nghiêm trọng
- [ ] `pnpm lint:specs` — vẫn 0 lỗi (vì đã cắt hết chu trình ở Bước 2)
- [ ] **Ca âm cuối**: thêm tạm một chu trình vào hai file spec thật, chạy `pnpm lint:specs`,
      phải **đỏ**; rồi hoàn tác
- [ ] `pnpm test` xanh
- [ ] Commit `feat(lint): T6 bước 16 — C7 chu trình depends_on chuyển từ cảnh báo sang lỗi`

## Bước 17 — Đối chiếu tay và đóng sổ

Cổng máy không bắt được mọi thứ. Task #3 và Task #5 đều chạy bước này và đều tìm ra chỗ lệch
mà kiểm tra tự động bỏ qua.

- [ ] Đếm `status: approved` toàn corpus — phải ra **49/130**
- [ ] Đếm `phase: P1` — phải ra **43**; `phase: P3` — phải ra **12**
- [ ] Đếm `P1` và `approved` — phải ra **13** (2 nền + 11 lô này)
- [ ] Mọi `BR-*` vừa sửa hoặc vừa điền "vì sao" có mặt trong
      [`business-rules.md`](../specs/00-foundation/business-rules.md)
- [ ] [`index.md`](../specs/index.md) khớp `phase` mới của
      [`next-game-recommendation.md`](../specs/04-play/next-game-recommendation.md)
- [ ] [`index.md`](../specs/index.md) §Tổng — số MVP mỗi khu vực còn đúng sau `D-AM`
- [ ] [`SPEC.md`](../SPEC.md) §14 khớp số đếm mới
- [ ] Đọc lại mọi cột "vì sao" vừa viết. Hỏi từng cái: người sau đọc câu này có hiểu vì sao
      không được xoá rule không? Câu nào chỉ diễn giải lại tên rule thì viết lại
- [ ] Đọc lại bảy nhát cắt `D-AH`–`D-AN`: mỗi cạnh bị xoá có còn một liên kết văn xuôi thay
      thế không? Cạnh bị xoá mà không còn dấu vết là thông tin bị mất
- [ ] Commit `docs(specs): T6 bước 17 — đóng lô 1 corpus P1, đối chiếu tay`

## Cổng dừng cuối — kết thúc task

- [ ] 11/11 spec đích `approved`, tổng corpus 49/130
- [ ] `pnpm lint:specs` 0 lỗi, **0 chu trình** toàn corpus, `C7` là mức lỗi
- [ ] `pnpm check` xanh
- [ ] `pnpm test` xanh
- [ ] `git push` thật thành công (không phải `lefthook run pre-push` thủ công — lệnh thủ công
      thiếu ref data trên stdin và skip cả 3 job, exit 0 giả, đo được 2026-08-06)
- [ ] Việc tiếp theo: lô 2 của P1 (31 spec còn lại), rồi **Task #7** —
      [`07-first-migration-plan.md`](07-first-migration-plan.md)

## Lệnh đếm dùng ở Bước 17

```
export PATH=/Users/macbook/.nvm/versions/node/v24.15.0/bin:$PATH

# Tổng approved
grep -rh "^status: approved" docs/specs/*/ --include="*.md" | wc -l      # 49

# Số spec mỗi phase
grep -rh "^phase:" docs/specs/*/ --include="*.md" | sort | uniq -c        # P1=43, P3=12

# P1 đã approved
for f in $(grep -rl "^phase: P1" docs/specs/*/ --include="*.md"); do
  grep -m1 "^status:" "$f"
done | sort | uniq -c                                                     # approved 13

# Cổng
pnpm lint:specs && pnpm test && pnpm check
```
