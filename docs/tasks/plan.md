# Plan — Task #2: 16 spec `00-foundation` `draft` → `approved`

> Viết 2026-08-06. Checklist thực thi: [`todo.md`](./todo.md).
> Task #1 (bootstrap `kidthink/`) đã lưu trữ tại
> [`01-bootstrap-plan.md`](./01-bootstrap-plan.md) · [`01-bootstrap-todo.md`](./01-bootstrap-todo.md)
> — quyết định D-A…D-R nằm ở đó, plan này tiếp số từ **D-S**.
>
> Contract: `docs/specs/00-foundation/repo-bootstrap.md` `BR-RBS-04`/`BR-RBS-08` ·
> `docs/specs/CONVENTIONS.md` §3/§10 · `docs/specs/roadmap.md` P0 nguyên tắc 1.
>
> Phạm vi: **chỉ contract**. ❌ Không route, không schema, không service — `BR-RBS-04` vẫn
> chặn cho tới Checkpoint D.

## Context

`BR-RBS-04` chặn **mọi** code nghiệp vụ cho tới khi toàn bộ 16 spec `00-foundation` đạt
`status: approved`. Hiện **130/130 spec còn `draft`**. Task #1 (bootstrap `kidthink/`) đã
xong — gate local xanh, PG 17.9 + Valkey 9.1.1 sống — nên đây là việc duy nhất đứng giữa
repo hiện tại và dòng schema đầu tiên (`roadmap.md` P0 bước 7).

Không phải việc gõ code. Đây là việc **đọc–duyệt–đóng câu hỏi mở**, và nó có ba loại nợ
phải dọn trước khi động vào nội dung spec:

1. **Không có truy vết.** `SPEC.md` + `docs/specs/` (135 file) đang nằm ở workspace root,
   **không thuộc git repo nào** (`repo-bootstrap` §11 Q10). Task này sửa 16 file contract —
   không có history thì `BR-RBS-08` ("không sửa âm thầm") không kiểm được.
2. **Corpus nói sai sự thật.** 17 file còn viết "cổng CI"/"CI xanh" trong khi quyết định
   2026-08-06 đã bỏ CI remote (§11 Q5/Q13). `SPEC.md` §14 đếm 124 spec / 14 foundation /
   6 addon — thực tế 130 / 16 / 7. Không approve được một file khẳng định điều sai.
3. **Không có cổng đo được.** Checklist `CONVENTIONS.md` §10 mới chỉ chạy tay một lần.
   Dự án này đã dính xanh giả ba lần (`ultracite check` exit 0 khi có lỗi · `exclude`
   node_modules làm 2/3 rule dependency-cruiser vô dụng · `check-services` khẳng định
   version của container thuộc repo khác). Gate mới **phải có ca âm**.

Kết quả mong muốn: 16/16 `approved`, `BR-RBS-04` mở khoá, và một script chạy được
(`pnpm lint:specs`) giữ corpus không trôi lại.

---

## Trạng thái đo được

| Đo | Kết quả |
|---|---|
| `kidthink/` git | 3 commit (`1b87a08` · `1def069` · `75febf6`), branch `main` tracking `origin/main` |
| Working tree `kidthink/` | **bẩn**: `?? lefthook.yml`, `D .github/workflows/ci.yml`, `M package.json`, `M pnpm-workspace.yaml`, `M pnpm-lock.yaml` — migration CI→lefthook chưa commit |
| `.git/hooks/pre-commit`·`pre-push` | tồn tại, 2.3K — `lefthook install` đã chạy |
| `docs/tasks/todo.md` | vẫn ghi "⛔ bật lại CI" ở 3 chỗ — **stale** so với §11 Q5/Q11 đã đóng |
| Corpus spec | 135 file ở workspace root, **không trong git** |
| Spec status | 130/130 `draft` · 0 `approved` |
| Open question `00-foundation` | **48 mở** / 6 đã gạch (`repo-bootstrap` 9 · `mvp-scope`·`payment-flow`·`package-catalog`·`child-data-compliance` 4 mỗi cái · `glossary` **0**) |
| Vi phạm `CONVENTIONS.md` §10 | `PARENT_GATE_REQUIRED` dùng ở `child-profile-switching.md:81` + `play-entry-and-profile-select.md:102`, **không có** trong `error-codes.md` |
| Nhắc "CI" | 17 file (`content-seed-authoring` 13 · `ai-codegen-pipeline` 10 · `repo-bootstrap` 9 · `testing-strategy`/`performance-budgets` 7 · …) |
| `SPEC.md` §14 đếm spec | **124 / 14 foundation / 6 addon** — sai, thực tế 130 / 16 / 7 |
| `SPEC.md` §15 Q6 | "tạo repo riêng hay branch v2?" — **đã đóng** bởi D-A, còn nằm trong bảng mở |
| Link `.md` trong corpus | 217 |

---

## Quyết định đã chốt trong lượt planning này

| ID | Quyết định | Ai |
|---|---|---|
| **D-S** | Phạm vi = **Task #2 đầy đủ**, 16/16 spec foundation → `approved` | 👤 người dùng |
| **D-T** | Bar approve = **đóng OQ chặn P0**, phần còn lại hoãn *có chủ* (ghi rõ chặn phase nào + ai sở hữu) — không đòi đóng cả 48 | 👤 người dùng |
| **D-U** | Đóng §11 **Q10**: corpus spec **chuyển vào `kidthink/docs/`** | 👤 người dùng |
| **D-V** | Đóng §11 **Q13**: sửa **cả 17 file**, dùng từ **"cổng tự động"** (provider-agnostic) | 👤 người dùng |
| **D-W** | `mvp-scope` Q1 (ai biên soạn ≥690 LO · ≥120 game level · ≥60 lesson) **hạ từ chặn-P0 xuống chặn-P1**. Nó chặn đường găng *nội dung*, không chạm schema/migration/auth ⇒ **không** chặn Task #2 | 👤 người dùng, 2026-08-06 |

⚠️ **D-W không làm câu hỏi biến mất.** Nó vẫn là rủi ro lớn nhất của MVP (`SPEC.md` §15 Q3–Q4:
*"soạn 500 bản mà review được 20/ngày thì seeder không giúp gì"*). Hệ quả: nó chuyển thành
🟡 hoãn **có chủ + có hạn**, và hạn là **trước khi P1 bắt đầu** — cụ thể trước
`content-seed-authoring`, đường găng dài nhất của MVP (`roadmap.md` §Đường găng). `mvp-scope`
§11 phải ghi đúng câu đó, không ghi chung chung "P1".

**D-U không phải thay đổi kiến trúc — nó khôi phục cấu trúc đã ghi trong spec.**
`SPEC.md` §8 và §14 *đã* mô tả đích là `kidthink/docs/SPEC.md` + `kidthink/docs/specs/` +
`kidthink/docs/tasks/`. Vị trí hiện tại ở workspace root mới là cái lệch.

Hệ quả kỹ thuật: giữ `kidthink/docs/SPEC.md` làm **file thật** và `kidthink/SPEC.md` làm
symlink về nó (đúng chữ trong §8: *"root SPEC.md symlink về đây"*). Khi đó mọi link tương
đối trong corpus (`../SPEC.md` từ `docs/specs/`, `../../SPEC.md` từ `docs/specs/00-*/`)
**giữ nguyên giá trị** — không phải sửa 217 link nào.

---

## Dependency graph

```
T1 Commit nợ lefthook  ─┐
                        ├─▶ T2 Chuyển corpus vào kidthink/docs/  ─▶ T3 scripts/lint-specs.ts
                        │        (đóng Q10 · git truy vết)              (+ SPEC.md §7)
                        │                                                     │
                        │                                          ⛔ CHECKPOINT A
                        │                                                     │
                        └──────────────────────────────────────────▶  T4 · T5 · T6  ⟂ song song
                                                                    (Q13 · error-codes · đếm lại)
                                                                              │
                                                                    ⛔ CHECKPOINT B
                                                                              │
                                                                     T7 Phân loại 48 OQ
                                                                              │
                                                                    ⛔ CHECKPOINT C  ← người quyết
                                                                              │
   T8  L0: glossary · business-rules · repo-bootstrap
    │
   T9  L1: actors · id-conventions · error-codes · mvp-scope · monorepo-package-architecture
    │
   T10 L2: access-ladder · child-data-compliance · content-lifecycle
    │
   T11 L3: content-versioning · entitlement-model · event-catalog
    │
   T12 L4/L5: package-catalog · payment-flow
                                                                              │
                                                                    ⛔ CHECKPOINT D
                                                                    BR-RBS-04 mở khoá
```

Thứ tự T8→T12 suy ra từ `depends_on` (`CONVENTIONS.md` §3: *"spec id phải approved trước"*).
Không đảo được — approve một spec khi dependency của nó còn `draft` là ký vào contract dựa
trên contract chưa ký.

---

## Phase 0 — Nền truy vết

### T1 — Đóng nợ migration CI → lefthook

**Mô tả:** Working tree `kidthink/` đang bẩn với migration chưa commit. Không chuyển corpus
vào một repo đang dở dang.

**Làm:**
- Chạy lại ca dương + **ca âm** cho `lefthook` (`repo-bootstrap` §9 scenario `BR-RBS-03`):
  file `.ts` vi phạm được `git add` ⇒ `git commit` exit ≠ 0, `HEAD` không đổi, output in
  `file:line`.
- Ca âm cho `pre-push`: `pnpm check` đỏ ⇒ push bị chặn.
- Commit: `chore: thay CI remote bằng lefthook gate local`.

**Acceptance:**
- [ ] `git status --short` trong `kidthink/` rỗng
- [ ] Ca âm `pre-commit` chặn đúng, in `file:line`
- [ ] Ca âm `pre-push` chặn đúng
- [ ] `.github/` không còn tồn tại trong `kidthink/`

**Verify:** `cd kidthink && git status --short && ls .github 2>&1`
**Dependencies:** None · **Files:** `kidthink/lefthook.yml`, `package.json`, `pnpm-workspace.yaml` · **Scope:** S

---

### T2 — Chuyển corpus spec vào `kidthink/docs/` (đóng §11 Q10)

**Mô tả:** Đưa `SPEC.md` + `docs/specs/` + `docs/tasks/` vào repo `kidthink/`, khôi phục
cấu trúc `SPEC.md` §8. Từ đây mọi thay đổi contract có history và đi cùng PR code.

**Làm:**
- `docs/specs/` → `kidthink/docs/specs/` (135 file, `git add` trong `kidthink/`)
- `SPEC.md` (file thật, 71K) → `kidthink/docs/SPEC.md`; tạo symlink `kidthink/SPEC.md -> docs/SPEC.md`
- `docs/tasks/{plan.md,todo.md}` → `kidthink/docs/tasks/`
- Sửa đường dẫn trong `.agents/AGENTS.md` (13 tham chiếu `../SPEC.md` / `../docs/specs/**`
  → `../kidthink/docs/**`). `.agents/` **giữ nguyên ở root** — nó phục vụ cả workspace, di
  chuyển nó làm Claude Code mất `CLAUDE.md`. Ghi thành việc theo dõi riêng.
- Xoá bản cũ ở root sau khi verify (không để hai bản — cùng lỗi "hai scope" của `BR-RBS-02`)
- Cập nhật `repo-bootstrap.md` §11 Q10 → **Đóng 2026-08-06**, ghi quyết định D-U

**Acceptance:**
- [ ] 217 link `.md` trong corpus resolve được, **0 link vỡ** — không sửa link nào
- [ ] `kidthink/SPEC.md` là symlink, trỏ tới `docs/SPEC.md`; `cat kidthink/SPEC.md` ra nội dung
- [ ] `git log --follow kidthink/docs/specs/00-foundation/glossary.md` có ít nhất 1 commit
- [ ] Workspace root **không còn** `SPEC.md`, `docs/specs/`, `docs/tasks/`
- [ ] `docs/montessori/` giữ nguyên ở root (không thuộc corpus, `SPEC.md` §8 không liệt kê)

**Verify:**
```bash
cd kidthink && git ls-files docs/specs | wc -l          # mong đợi 135
# quét link vỡ: mỗi target tương đối phải tồn tại
grep -rhoE '\]\(([^)#]+\.md)' docs/specs docs/SPEC.md | ...   # 0 miss
ls -l SPEC.md                                            # -> docs/SPEC.md
```
**Dependencies:** T1 · **Files:** ~140 file di chuyển + `.agents/AGENTS.md` + `repo-bootstrap.md` · **Scope:** M

---

### T3 — `scripts/lint-specs.ts` + `pnpm lint:specs`

**Mô tả:** Biến `CONVENTIONS.md` §10 từ checklist người thành cổng máy. Không có nó, "16/16
approved" là lời khai, không phải phép đo — và corpus trôi lại ngay sau khi đóng task.

**Sửa spec TRƯỚC (`BR-RBS-08`):** `SPEC.md` §7 — `pnpm check` = `lint` + `lint:tokens` +
`lint:deps` + **`lint:specs`** + `typecheck` (5 bước), thêm dòng `pnpm lint:specs`.

**Check phải có** (mỗi check một ca âm riêng):

| # | Check | Bắt được gì |
|---|---|---|
| C1 | 9 field frontmatter đủ; `status ∈ {draft, approved, implemented}` | Field thiếu / typo status |
| C2 | `owns` không trùng giữa hai spec | Hai file cùng sở hữu một outcome (`CONVENTIONS` §3) |
| C3 | 11 section đúng thứ tự (`07-addon/**` = 7 section) | Section thiếu / sai thứ tự |
| C4 | Mọi link `.md` nội bộ resolve | Link vỡ sau khi đổi tên file |
| C5 | Mã lỗi `SCREAMING_SNAKE` dùng trong §8 phải có trong `error-codes.md` | **Chính là `PARENT_GATE_REQUIRED`** |
| C6 | `BR-*` ID không trùng; mỗi hàng `BR` có cột thứ ba không rỗng | Rule không có "vì sao" (`CONVENTIONS` §5) |
| C7 | `depends_on` không có chu trình | Vòng lặp phụ thuộc |
| C8 | Spec `approved` ⇒ mọi `depends_on` của nó cũng `approved` | Approve ngược thứ tự — **cổng của T8–T12** |
| C9 | Cấm token: `classification`, `tenant_id`, cột `role` trên `users`, persona enum | `CONVENTIONS` §10 |
| C10 | Cấm chữ `CI`/"cổng CI"/"GitHub Actions" trong corpus | Giữ D-V không trôi lại |
| C11 | Số spec mỗi thư mục khớp bảng `SPEC.md` §14 + `index.md` §Tổng | Đếm lệch (đang lệch 124 vs 130) |

**Acceptance:**
- [ ] `pnpm lint:specs` exit 0 trên corpus **sau khi** T4·T5·T6 xong
- [ ] **11 ca âm**: mỗi check có một fixture vi phạm ⇒ exit 1 + in `file:line` + tên check
- [ ] Chạy `pnpm lint:specs` **ngay bây giờ** (trước T4–T6) ⇒ exit 1, báo đúng C5 · C10 · C11
- [ ] `pnpm check` gọi `lint:specs`; bỏ script ⇒ `pnpm check` không còn kiểm spec (ca âm của wiring)

⚠️ Ca âm ở dòng 3 là quan trọng nhất: script mới viết mà xanh ngay là dấu hiệu nó không đo gì.
Ta **đã biết** corpus đang có 3 vi phạm — script phải thấy đủ cả ba.

**Dependencies:** T2 · **Files:** `kidthink/scripts/lint-specs.ts`, `package.json`, `docs/SPEC.md` §7 · **Scope:** M

---

### ⛔ CHECKPOINT A
- [ ] Corpus trong git, history truy được, 0 link vỡ
- [ ] `pnpm lint:specs` **đỏ đúng chỗ** (C5 · C10 · C11) — chứng minh cổng thật
- [ ] 11/11 ca âm chặn đúng
- [ ] Người duyệt trước khi động vào nội dung spec

---

## Phase 1 — Sửa drift cơ học (không đổi contract)

Ba task này **⟂ song song được**. Không cái nào đổi nghĩa của một rule; chúng làm corpus
khớp lại với sự thật đã quyết định.

### T4 — Q13: 17 file "CI" → "cổng tự động" (D-V)

**Làm:** Thay mọi "cổng CI" · "CI xanh" · "CI đỏ" · "GitHub Actions" · "8 cổng CI" bằng
diễn đạt provider-agnostic ("cổng tự động", "8 cổng tự động"). Gồm `SPEC.md` §12 (dòng P0
liệt kê "CI" là nội dung phase) và §14.

⚠️ **Không** đổi thành "lefthook": `repo-bootstrap` §11 **Q12 còn mở** — lefthook bỏ qua được
bằng `--no-verify`, nên nó *không* thay được câu "không có cờ bỏ qua" của
`content-seed-authoring` §5. Giữ từ trung tính; Q12 xử ở T7.

**Acceptance:**
- [ ] `grep -rnE '\bCI\b|GitHub Actions' docs/` → 0 kết quả (trừ mục §11 đã gạch của `repo-bootstrap` ghi lại lịch sử)
- [ ] Check C10 của `lint:specs` xanh
- [ ] Không câu nào đổi **nghĩa** của rule, chỉ đổi tên cơ chế — diff đọc được trong 1 lượt

**Dependencies:** T3 · **Files:** 17 file `.md` · **Scope:** M

---

### T5 — `PARENT_GATE_REQUIRED` + quét toàn bộ mã lỗi mồ côi

**Làm:**
- Thêm `PARENT_GATE_REQUIRED` → 403 vào `error-codes.md` (spec sở hữu là `parent-gate.md`)
- Chạy C5 trên **toàn corpus 130 file** — không chỉ 2 chỗ đã biết. Mỗi mã mồ côi khác:
  hoặc đăng ký vào registry, hoặc sửa call site về mã đã có.

**Acceptance:**
- [ ] C5 xanh trên 130/130
- [ ] Mỗi mã mới thêm có HTTP status + spec sở hữu, đúng khuôn `error-codes.md` §7
- [ ] Ca âm: xoá `PARENT_GATE_REQUIRED` khỏi registry ⇒ C5 đỏ, in đúng 2 call site

**Dependencies:** T3 · **Files:** `error-codes.md` (+ file phát sinh từ quét) · **Scope:** S

---

### T6 — Đếm lại corpus + dọn OQ chết + sync `docs/tasks/`

**Làm:**
- `SPEC.md` §14: 124 → **130** spec module; `00-foundation/` 14 → **16**; `07-addon/` 6 → **7**
- `SPEC.md` §14.3 "120 prefix" — đối chiếu `business-rules.md` thật, sửa nếu lệch
- `SPEC.md` §15 **Q6** ("repo riêng hay branch v2?") → chuyển sang bảng *Đã chốt*: repo riêng
  `kidthink/`, quyết định D-A 2026-08-06
- `docs/tasks/todo.md`: xoá 3 mục "bật lại CI" (đã bị D-V/Q5 thay thế), đánh dấu T8/T9đk2
  là **huỷ, không phải hoãn**; thêm mục Task #2 trỏ về plan này
- `docs/tasks/plan.md` §5: thêm D-Q hệ quả (CI xoá hẳn, không phải tạm tắt) + D-S…D-V

**Acceptance:**
- [ ] Check C11 xanh — số đếm trong `SPEC.md` §14 = số đếm `index.md` = số file thật
- [ ] `grep -rn 'bật lại CI' docs/` → rỗng
- [ ] `SPEC.md` §15 không còn câu hỏi đã có câu trả lời

**Dependencies:** T3 · **Files:** `docs/SPEC.md`, `docs/tasks/todo.md`, `docs/tasks/plan.md` · **Scope:** S

---

### ⛔ CHECKPOINT B
- [ ] `pnpm lint:specs` **exit 0** trên 130/130 — lần đầu corpus sạch cơ học có đo
- [ ] `pnpm check` (5 bước) exit 0 · `pnpm test` exit 0
- [ ] 1 commit cho mỗi task, message nói rõ đóng OQ nào

---

## Phase 2 — Phân loại 48 open question

### T7 — Bảng phân loại + thêm cột "Chặn phase" · "Chủ" vào §11

**Mô tả:** D-T nói bar approve = đóng OQ **chặn P0**. Muốn dùng bar đó thì phải phân loại
được. Task này không *trả lời* câu hỏi nào — nó *xếp loại* và ghi lại tiêu chí.

**Tiêu chí phân loại — chỉ một câu hỏi:** *câu này để mở thì P0 (schema · migration · auth ·
audit · Lớp 1 seed) có viết sai không?* Cụ thể là **chặn P0** nếu để mở thì hoặc (a) hình
dạng schema sai (enum, FK, partition, format mã), hoặc (b) một guard P0 hành xử sai.

**Phân loại — 14 chặn P0 / 31 hoãn có chủ / 3 người quyết** (sau D-W):

| Spec | OQ | Loại | Vì sao |
|---|---|---|---|
| `glossary` | — | — | 0 OQ |
| `id-conventions` | Q1 mã Game Level mang `template_code`? | 🔴 **P0** | Format mã = cột schema. Đổi sau khi có level là migration |
| `id-conventions` | Q2 3 chữ số đủ chưa (3.000+ level)? | 🔴 **P0** | Cùng lý do. Đề xuất: **4 chữ số** |
| `actors` | Q1 Manager MFA từ ngày đầu? | 🔴 **P0** | Cột `mfa_secret` ở `schema-identity-billing`. `index.md` ghi `admin-auth` = P0 "MFA bắt buộc" ⇒ đóng bằng tham chiếu chéo |
| `actors` | Q2 `pending_verification` tạo được child profile? | 🔴 **P0** | Guard P0 của `registration`/`child-profile-crud`. `email-verification` đã ghi là điều kiện tiên quyết ⇒ đóng bằng tham chiếu chéo |
| `access-ladder` | Q3 gộp bậc `login` vào `standard`? | 🔴 **P0** | Enum `access_tier`. Bỏ một bậc sau khi có dữ liệu là migration + sửa ma trận 20 ô |
| `content-lifecycle` | Q3 có trạng thái `scheduled`? | 🔴 **P0** | Thêm giá trị enum vòng đời sau là migration |
| `content-versioning` | Q2 curriculum trỏ `code` hay `(code, version)`? | 🔴 **P0** | Hình dạng FK trong `schema-content-taxonomy` |
| `event-catalog` | Q2 partition `telemetry_events` theo tháng ngay? | 🔴 **P0** | Partition quyết định lúc `CREATE TABLE`. Chuyển bảng lớn sang partitioned sau = downtime |
| `package-catalog` | Q2 có bán gói tháng? | 🔴 **P0** | Enum `billing_period`. Đề xuất: chỉ năm ở MVP, enum để chỗ |
| `monorepo-package-architecture` | Q3 tách `packages/payment`/`notification`? | 🔴 **P0** | Cấu trúc package. Đề xuất: inline tới khi `apps/admin` cần dùng lại |
| `repo-bootstrap` | Q2 bump PostgreSQL > 17? | 🔴 **P0** | `BR-RBS-07` — major version phải chốt trước migration. Đề xuất: **giữ 17** |
| `repo-bootstrap` | Q10 git cho corpus | ✅ đóng ở T2 | D-U |
| `repo-bootstrap` | Q13 wording CI | ✅ đóng ở T4 | D-V |
| `repo-bootstrap` | Q12 lefthook bỏ qua được bằng `--no-verify` | 🔴 **P0** | Không phải vì P0 cần cưỡng chế, mà vì **10 spec khác đang khẳng định "không có cờ bỏ qua"**. Để mở = 10 spec nói sai. Đóng bằng cách chọn: chấp nhận rủi ro (ghi rõ) *hoặc* thêm cổng server-side |
| `mvp-scope` | Q4 backup/monitoring thuộc phase nào? | 🔴 **P0** | `backup-and-restore` là P0 trong `index.md` nhưng không gắn cổng ra nào. Đề xuất: gắn vào cổng ra P0 |
| `mvp-scope` | Q1 ai biên soạn ≥690 LO / ≥120 level / ≥60 lesson | 🟡 **P1** (D-W) | Hạ từ P0. Chặn đường găng nội dung, ❌ không chạm schema. Hạn: **trước khi `content-seed-authoring` khởi động**. Cần chủ có tên — không để "team" |
| `mvp-scope` | Q2 ngân sách + lịch P0→P3 | 👤 **người** | Không đóng được bằng kỹ thuật |
| `mvp-scope` | Q3 có mốc phát hành cứng? | 👤 **người** | Nếu có thì `mvp-scope` §5 (điểm cắt) phải kích hoạt sớm |
| `package-catalog` | Q1 giá cuối `standard`/`premium` | 👤 **người** | Chặn P2. Trùng `SPEC.md` §15 Q1 |
| `child-data-compliance` | Q1 ngân sách rà soát pháp lý · Q2 DPIA Bộ Công an | 🟡 go-live | Chặn go-live, không chặn schema. Cần **chủ + hạn** |
| `child-data-compliance` | Q3 retention telemetry ẩn danh · Q4 COPPA/GDPR-K | 🟡 P5 / chi phí | Hoãn |
| `access-ladder` | Q1 6 level allow-list guest · Q2 ngưỡng mời đăng ký | 🟡 P1 | Chọn nội dung, không đổi schema |
| `entitlement-model` | Q1 `daily_play_minutes` 30/60/90 · Q2 `grace_period` · Q3 ledger vs counter | 🟡 P1 / P4 | Giá trị hằng số + chuyện của P4 add-on |
| `content-lifecycle` | Q1 chặn tự duyệt khi ≥2 manager · Q2 hiển thị `repo_seed` khác | 🟡 P2 / P1 | Cột đã có; chỉ là hành vi UI |
| `content-versioning` | Q1 giữ bao nhiêu version · Q3 báo cáo loại version cũ | 🟡 chi phí / P3 | Hoãn |
| `error-codes` | Q1 i18n `message` · Q2 `EVENT_DUPLICATE` im lặng? | 🟡 P5 / P1 | Hoãn |
| `event-catalog` | Q1 `fps_sample` 30s quá dày? · Q3 giữ event thô bao lâu | 🟡 P1 | Tuning, đo được sau khi có lưu lượng thật |
| `business-rules` | Q1 tự sinh registry từ corpus? | 🟡 tooling | `lint-specs.ts` (T3) là bước đầu về hướng đó |
| `payment-flow` | Q1 đối chiếu sao kê tự động · Q2 `SOFT_UNLOCK_DAYS=3` · Q3 hoàn tiền · Q4 VietQR vĩnh viễn | 🟡 P2 / P5 | Toàn bộ hoãn — không cái nào đụng schema P0 |
| `package-catalog` | Q3 tính giá nâng cấp giữa chu kỳ · Q4 rủi ro `premium` vĩnh viễn | 🟡 P2 / thương mại | Hoãn |
| `repo-bootstrap` | Q1 audit `packages/ui` · Q6 phụ thuộc `img.vietqr.io` · Q7 AWS SES production access · Q8 Sentry vs GlitchTip · Q9 pool size Postgres | 🟡 P1 / P2 / go-live | **Q7 cần chủ + hạn ngay** — độ trễ duyệt của AWS nằm ngoài tầm kiểm soát |

**Làm:** thêm 2 cột `Chặn phase` và `Chủ` vào bảng §11 của cả 16 spec, điền theo phân loại
trên. Không xoá OQ nào — hoãn *có chủ* nghĩa là câu hỏi ở lại, kèm tên người và phase.

**Acceptance:**
- [ ] 48/48 OQ có `Chặn phase` ∈ {P0, P1, P2, P3, P5, go-live} và `Chủ` không rỗng
- [ ] Nhóm 🔴 P0 = **14** câu (12 phải trả lời + 2 đã đóng ở T2/T4)
- [ ] Không OQ nào bị xoá lặng — diff chỉ thêm cột

**Dependencies:** T4·T5·T6 · **Files:** 16 file `00-foundation/*.md` (chỉ §11) · **Scope:** M

---

### ⛔ CHECKPOINT C — người quyết, quan trọng nhất

Đây là điểm mà bar approve được cố định. Cần bạn:
- [ ] Duyệt bảng phân loại (14 🔴 P0 / 31 🟡 hoãn / 3 👤 người)
- [ ] ✅ **Đã chốt trước Checkpoint C**: `mvp-scope` Q1 → chặn **P1** (D-W). Không còn chặn Task #2
- [ ] Trả lời `mvp-scope` Q2 (ngân sách/lịch) · Q3 (mốc cứng) — hoặc chấp nhận hoãn có chủ
- [ ] Chọn cho `repo-bootstrap` Q12: chấp nhận rủi ro `--no-verify` (ghi rõ trong 10 spec)
      *hoặc* thêm cổng server-side ở P1
- [ ] Gán **chủ + hạn** cho Q7 (AWS SES) và Q1/Q2 `child-data-compliance` (pháp lý)

---

## Phase 3 — Đóng OQ chặn P0 và approve theo layer

Mỗi task T8–T12 chạy đúng một quy trình trên từng spec trong layer:

1. Chạy checklist `CONVENTIONS.md` §10 phần **không tự động được** (Gherkin có fail được
   không · tên file có gộp hai outcome không · prose có nói như thể B2B/multi-tenant không)
2. Đóng OQ 🔴 P0 của spec đó — mỗi câu ghi **quyết định + vì sao + ngày**, gạch số câu
   (`~~3~~`) đúng khuôn đang dùng ở `repo-bootstrap` §11
3. `status: draft` → `approved`, `reviewed:` → ngày hôm nay
4. `pnpm lint:specs` xanh — **check C8** đảm bảo không approve ngược thứ tự

**Acceptance chung cho T8–T12:**
- [ ] Mọi OQ 🔴 P0 của layer đã gạch, có quyết định + lý do
- [ ] Mọi OQ 🟡 còn nguyên, có `Chặn phase` + `Chủ`
- [ ] `status: approved` + `reviewed` đúng ngày
- [ ] `pnpm lint:specs` exit 0 (C8 chứng minh dependency đã approved trước)
- [ ] Mỗi quyết định đóng OQ đụng schema ⇒ ghi thêm dòng vào `data-model-overview.md`
      §Ràng buộc chờ (để P0 bước 7 không phải đọc lại 16 file)

---

### T8 — Layer 0: `glossary` · `business-rules` · `repo-bootstrap`
OQ P0 phải đóng: `repo-bootstrap` Q2 (giữ PG 17) · Q12 (chọn lối cho `--no-verify`).
`glossary` 0 OQ — approve thẳng sau checklist. `business-rules` Q1 hoãn.
**Dependencies:** Checkpoint C · **Scope:** S

### T9 — Layer 1: `actors` · `id-conventions` · `error-codes` · `mvp-scope` · `monorepo-package-architecture`
OQ P0: `actors` Q1·Q2 (đóng bằng tham chiếu chéo `admin-auth` / `email-verification`) ·
`id-conventions` Q1·Q2 (format mã Game Level) · `mvp-scope` Q4 (gắn backup/monitoring vào
cổng ra P0) · `monorepo-package-architecture` Q3 (inline payment/notification).
`mvp-scope` Q1 → 🟡 P1 kèm hạn + chủ (D-W); Q2·Q3 theo Checkpoint C.
⚠️ Layer nặng nhất — 5 spec. Tách làm 2 lượt nếu diff vượt sức đọc một lần.
**Dependencies:** T8 · **Scope:** M

### T10 — Layer 2: `access-ladder` · `child-data-compliance` · `content-lifecycle`
OQ P0: `access-ladder` Q3 (bậc `login`) · `content-lifecycle` Q3 (trạng thái `scheduled`).
`child-data-compliance` — cả 4 hoãn, cần chủ + hạn từ Checkpoint C.
**Dependencies:** T9 · **Scope:** S

### T11 — Layer 3: `content-versioning` · `entitlement-model` · `event-catalog`
OQ P0: `content-versioning` Q2 (FK `code` vs `(code, version)`) · `event-catalog` Q2
(partition `telemetry_events`). `entitlement-model` — cả 3 hoãn.
**Dependencies:** T10 · **Scope:** S

### T12 — Layer 4/5: `package-catalog` · `payment-flow`
OQ P0: `package-catalog` Q2 (gói tháng / enum `billing_period`). `payment-flow` — cả 4 hoãn.
**Dependencies:** T11 · **Scope:** S

---

### ⛔ CHECKPOINT D — `BR-RBS-04` mở khoá
- [ ] 16/16 `00-foundation` = `status: approved`
- [ ] `pnpm lint:specs` exit 0 · `pnpm check` exit 0 · `pnpm test` exit 0
- [ ] Ca âm cuối: đặt một spec về `draft` ⇒ C8 làm đỏ mọi spec phụ thuộc nó
- [ ] `docs/tasks/todo.md` ghi rõ **P0 bước 7 (`data-model-overview` → `schema-*`) là việc kế tiếp**
- [ ] Người duyệt — đây là hành động khó đảo: mở đường cho PR schema đầu tiên

---

## Rủi ro

| Rủi ro | Mức | Giảm thiểu |
|---|---|---|
| "Approved" thành nghi lễ đóng dấu — đọc lướt 16 file rồi đổi 16 dòng frontmatter | **Cao** | C8 + checklist thủ công ở bước 1 mỗi layer + checkpoint người ở C và D. Bar là *đóng OQ chặn P0*, không phải *đổi status* |
| Đóng OQ schema bằng phỏng đoán (partition, FK, enum) rồi P0 bước 7 phải đảo lại | Cao | Mỗi quyết định 🔴 phải ghi **vì sao đo được**, và đẩy sang `data-model-overview` §Ràng buộc chờ để bước 7 kiểm lại trước khi viết cột |
| Di chuyển 140 file làm vỡ link mà không ai thấy | Trung bình | Check C4 chạy **trước và sau** T2, so số link resolve. Giữ `docs/SPEC.md` làm file thật ⇒ 0 link phải sửa |
| `lint-specs.ts` xanh giả — bài học `ultracite`/`dependency-cruiser`/`check-services` | **Cao** | 11 ca âm bắt buộc + yêu cầu script phải **đỏ ngay lần chạy đầu** trên 3 vi phạm đã biết |
| D-W trở thành cách chôn câu hỏi: hạ xuống P1 rồi quên mất, tới lúc P1 vẫn không có người biên soạn | **Cao** | `mvp-scope` §11 phải ghi hạn cụ thể (*trước khi `content-seed-authoring` khởi động*) + tên chủ, ❌ không ghi "P1" chung chung. Cổng ra P0 ở `SPEC.md` §13 thêm một dòng: Q1 phải có chủ trước khi mở P1 |
| Sửa wording 17 file vô tình đổi nghĩa rule | Trung bình | T4 chỉ đổi **tên cơ chế**, không đổi ngưỡng/hành vi. Đọc diff theo từng file |

---

## Ngoài phạm vi

| Việc | Vì sao |
|---|---|
| Approve 114 spec `01-*`…`08-*` | `BR-RBS-04` chỉ đòi `00-foundation`. Các spec khác approve khi phase của chúng tới |
| Viết `packages/db` schema | Đó là P0 bước 7, **sau** khi task này mở khoá |
| Chuyển `.agents/` vào `kidthink/` | `SPEC.md` §8 ghi vậy, nhưng `.agents/` đang phục vụ cả workspace — di chuyển làm mất `CLAUDE.md` ở cwd. Theo dõi riêng |
| Chuyển `infra/`, `docs/montessori/` | Không thuộc corpus spec. `infra/` theo dõi riêng khi tới deploy |
| Task #3 — khảo sát 60 game type v1 → 6 template | P1, `game-template-contract` §11 Q1 |
| Cổng server-side thay `--no-verify` | Phụ thuộc quyết định Q12 ở Checkpoint C; nếu chọn thì là task P1 riêng |

---

## Verification tổng

```bash
cd kidthink

# Cổng cơ học — phải xanh ở Checkpoint B trở đi
pnpm lint:specs          # 11 check trên 130 spec
pnpm check               # lint · lint:tokens · lint:deps · lint:specs · typecheck
pnpm test                # 56/56
pnpm check:services      # PG 17.9 + Valkey 9.1.1

# Ca âm bắt buộc (gate không có ca âm là gate chưa tồn tại)
#  · mỗi check C1–C11: một fixture vi phạm ⇒ exit 1 + file:line + tên check
#  · C8: đặt glossary về draft ⇒ 11 spec phụ thuộc nó chuyển đỏ
#  · lefthook: file .ts vi phạm được add ⇒ git commit exit ≠ 0, HEAD không đổi

# Đo kết quả cuối
grep -c 'status: approved' docs/specs/00-foundation/*.md | grep -c ':1$'   # mong đợi 16
git log --oneline docs/specs/                                              # history tồn tại
```

**Cổng ra của Task #2:** 16/16 `approved` · `pnpm lint:specs` xanh có ca âm · mọi OQ 🟡 có
chủ và phase · `data-model-overview` §Ràng buộc chờ ghi đủ quyết định schema đã chốt.

**Vị trí file này:** hiện ở `docs/tasks/plan.md` tại workspace root. **T2 di chuyển nó** sang
`kidthink/docs/tasks/plan.md` cùng toàn bộ corpus — đó là đích ghi trong `SPEC.md` §8.
