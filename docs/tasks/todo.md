# Todo — Task #2: 16 spec `00-foundation` → `approved`

> Bản 1, 2026-08-06. Chi tiết + acceptance + lý do: [`plan.md`](./plan.md).
> Task #1 lưu trữ: [`01-bootstrap-todo.md`](./01-bootstrap-todo.md).
>
> Thứ tự: `T1 → T2 → T3 → ⛔A → {T4, T5, T6} → ⛔B → T7 → ⛔C → T8 → T9 → T10 → T11 → T12 → ⛔D`
>
> ⚠️ Mọi lệnh prefix `export PATH=/Users/macbook/.nvm/versions/node/v24.15.0/bin:$PATH`
> — shell state không persist, shell mặc định vẫn node v20.17.0.

## Mục tiêu đo được

| Đo bây giờ | Đo lúc đóng task |
|---|---|
| 0/16 spec foundation `approved` | **16/16** |
| 48 OQ không phân loại | 48/48 có `Chặn phase` + `Chủ`; 14 nhóm 🔴 P0 đã đóng |
| Corpus không trong git | Trong `kidthink/`, `git log --follow` chạy được |
| Không có cổng kiểm spec | `pnpm lint:specs` — 11 check, 11 ca âm |
| `BR-RBS-04` chặn | **Mở khoá** |

---

## T1 — Đóng nợ migration CI → lefthook

- [ ] Ca dương `pre-commit`: commit hợp lệ đi qua
- [ ] ✅ **Ca âm** `pre-commit`: file `.ts` vi phạm được `git add` ⇒ `git commit` exit ≠ 0,
      `HEAD` không đổi, output in `file:line`
- [ ] ✅ **Ca âm** `pre-push`: `pnpm check` đỏ ⇒ push bị chặn
- [ ] Commit `chore: thay CI remote bằng lefthook gate local`
- [ ] ✅ `git status --short` trong `kidthink/` **rỗng**
- [ ] ✅ `kidthink/.github/` không còn tồn tại

## T2 — Chuyển corpus vào `kidthink/docs/` (đóng §11 Q10 · D-U)

- [ ] Đếm link resolve **TRƯỚC** khi di chuyển (số nền để so sánh)
- [ ] `docs/specs/` → `kidthink/docs/specs/` (135 file)
- [ ] `SPEC.md` (file thật 71K) → `kidthink/docs/SPEC.md`
- [ ] Symlink `kidthink/SPEC.md -> docs/SPEC.md` (`SPEC.md` §8: *"root SPEC.md symlink về đây"*)
- [ ] `docs/tasks/*` → `kidthink/docs/tasks/` (4 file: plan · todo · 01-bootstrap-plan · 01-bootstrap-todo)
- [ ] Sửa 13 tham chiếu đường dẫn trong `.agents/AGENTS.md`
- [ ] Xoá bản cũ ở workspace root — ❌ không để hai bản cùng tồn tại
- [ ] `repo-bootstrap.md` §11 Q10 → gạch `~~10~~` **Đóng 2026-08-06**, ghi D-U
- [ ] ✅ `git ls-files docs/specs | wc -l` = **135**
- [ ] ✅ 217 link `.md` resolve, **0 vỡ** — và **0 link phải sửa** (nếu phải sửa link ⇒ đặt sai chỗ `SPEC.md`)
- [ ] ✅ `cat kidthink/SPEC.md` ra nội dung (symlink sống)
- [ ] ✅ `git log --follow kidthink/docs/specs/00-foundation/glossary.md` ≥ 1 commit
- [ ] ✅ Root không còn `SPEC.md` · `docs/specs/` · `docs/tasks/`
- [ ] ✅ `docs/montessori/` **giữ nguyên** ở root

## T3 — `scripts/lint-specs.ts` + `pnpm lint:specs`

- [ ] **Sửa spec trước** (`BR-RBS-08`): `SPEC.md` §7 — `check` thành 5 bước, thêm dòng `pnpm lint:specs`
- [ ] C1 — 9 field frontmatter đủ, `status ∈ {draft, approved, implemented}`
- [ ] C2 — `owns` không trùng giữa hai spec
- [ ] C3 — 11 section đúng thứ tự (`07-addon/**` = 7)
- [ ] C4 — mọi link `.md` nội bộ resolve
- [ ] C5 — mã lỗi dùng ở §8 phải có trong `error-codes.md`
- [ ] C6 — `BR-*` ID không trùng, cột "vì sao" không rỗng
- [ ] C7 — `depends_on` không chu trình
- [ ] C8 — spec `approved` ⇒ mọi `depends_on` cũng `approved`
- [ ] C9 — cấm `classification` · `tenant_id` · cột `role` trên `users` · persona enum
- [ ] C10 — cấm `CI` / "cổng CI" / "GitHub Actions"
- [ ] C11 — số spec mỗi thư mục khớp `SPEC.md` §14 + `index.md`
- [ ] ✅ **Chạy ngay khi viết xong (trước T4–T6) ⇒ exit 1**, báo đúng **C5 · C10 · C11**
      — script mới mà xanh ngay là dấu hiệu nó không đo gì
- [ ] ✅ **11 ca âm**: mỗi check một fixture vi phạm ⇒ exit 1 + `file:line` + tên check
- [ ] ✅ Ca âm wiring: gỡ `lint:specs` khỏi `check` ⇒ `pnpm check` không còn kiểm spec

## ⛔ CHECKPOINT A — người duyệt

- [ ] Corpus trong git, history truy được, 0 link vỡ
- [ ] `pnpm lint:specs` **đỏ đúng chỗ** trên 3 vi phạm đã biết
- [ ] 11/11 ca âm chặn đúng
- [ ] Duyệt trước khi động vào **nội dung** spec

---

## T4 — Q13: 17 file "CI" → "cổng tự động" (D-V) ⟂

- [ ] `00-foundation/`: `repo-bootstrap` · `monorepo-package-architecture` · `content-lifecycle` · `mvp-scope`
- [ ] `01-platform/`: `content-seed-authoring` (13 hit) · `ai-codegen-pipeline` (10) · `game-engine-runtime` · `emoji-registry`
- [ ] `08-quality/`: `testing-strategy` (7) · `performance-budgets` (7) · `security-checklist` (3) · `accessibility` · `design-system-contract`
- [ ] `06-admin/schema-driven-form`
- [ ] Meta: `SPEC.md` (§12 dòng P0 + §14) · `index.md` · `roadmap.md`
- [ ] ❌ **KHÔNG** đổi thành "lefthook" — §11 **Q12 còn mở**, lefthook bỏ qua được bằng
      `--no-verify` nên không thay được câu "không có cờ bỏ qua"
- [ ] ✅ `grep -rnE '\bCI\b|GitHub Actions' docs/` → rỗng (trừ mục §11 đã gạch ghi lịch sử)
- [ ] ✅ C10 xanh
- [ ] ✅ Diff chỉ đổi **tên cơ chế**, không đổi ngưỡng/hành vi rule nào

## T5 — `PARENT_GATE_REQUIRED` + quét mã lỗi mồ côi ⟂

- [ ] Thêm `PARENT_GATE_REQUIRED` → **403** vào `error-codes.md` (spec sở hữu: `parent-gate.md`)
- [ ] Chạy C5 trên **toàn 130 file** — không chỉ 2 call site đã biết
- [ ] Mỗi mã mồ côi khác: đăng ký vào registry **hoặc** sửa call site về mã đã có
- [ ] ✅ C5 xanh 130/130
- [ ] ✅ **Ca âm**: xoá `PARENT_GATE_REQUIRED` khỏi registry ⇒ C5 đỏ, in đúng 2 call site
      (`child-profile-switching.md:81` · `play-entry-and-profile-select.md:102`)

## T6 — Đếm lại corpus + dọn OQ chết + sync `docs/tasks/` ⟂

- [ ] `SPEC.md` §14: **124 → 130** spec module
- [ ] `SPEC.md` §14: `00-foundation/` **14 → 16** · `07-addon/` **6 → 7**
- [ ] `SPEC.md` §14.3: đối chiếu "120 prefix" với `business-rules.md` thật, sửa nếu lệch
- [ ] `SPEC.md` §15 **Q6** ("repo riêng hay branch v2?") → chuyển sang bảng *Đã chốt*: repo
      riêng `kidthink/`, D-A 2026-08-06
- [ ] `SPEC.md` §15: rà 10 câu còn lại, cái nào trùng OQ foundation thì trỏ link thay vì lặp
- [ ] `01-bootstrap-todo.md`: 3 mục "bật lại CI" → đánh dấu **huỷ**, không phải hoãn (D-V thay)
- [ ] `01-bootstrap-todo.md` T8/T9đk2: ghi rõ CI đã bị bỏ hẳn
- [ ] `01-bootstrap-plan.md` §5: thêm hệ quả D-Q + ghi D-S…D-V
- [ ] ✅ C11 xanh — `SPEC.md` §14 = `index.md` = số file thật
- [ ] ✅ `grep -rn 'bật lại CI' docs/` → rỗng

## ⛔ CHECKPOINT B

- [ ] ✅ `pnpm lint:specs` **exit 0** trên 130/130 — lần đầu corpus sạch cơ học **có đo**
- [ ] ✅ `pnpm check` (5 bước) exit 0
- [ ] ✅ `pnpm test` exit 0 — 56/56
- [ ] 1 commit / task, message ghi rõ đóng OQ nào

---

## T7 — Phân loại 48 OQ: thêm cột `Chặn phase` · `Chủ`

- [ ] Thêm 2 cột vào bảng §11 của cả **16** spec foundation
- [ ] 🔴 **P0 — 14 câu** (12 phải trả lời + 2 đã đóng ở T2/T4):
  - [ ] `id-conventions` Q1 (`template_code` trong mã Game Level) · Q2 (3 hay **4** chữ số)
  - [ ] `actors` Q1 (Manager MFA ngày đầu) · Q2 (`pending_verification` tạo child profile)
  - [ ] `access-ladder` Q3 (gộp bậc `login` vào `standard`)
  - [ ] `content-lifecycle` Q3 (trạng thái `scheduled`)
  - [ ] `content-versioning` Q2 (FK `code` vs `(code, version)`)
  - [ ] `event-catalog` Q2 (partition `telemetry_events` theo tháng)
  - [ ] `package-catalog` Q2 (gói tháng ⇒ enum `billing_period`)
  - [ ] `monorepo-package-architecture` Q3 (`packages/payment` · `notification` tách hay inline)
  - [ ] `repo-bootstrap` Q2 (bump PG > 17) · Q12 (`--no-verify` vs 10 spec nói "không có cờ bỏ qua")
  - [ ] `mvp-scope` Q4 (backup/monitoring thuộc phase nào)
  - [ ] ✅ đã đóng: `repo-bootstrap` Q10 (T2) · Q13 (T4)
- [ ] 👤 **Người quyết — 3 câu**: `mvp-scope` Q2 · Q3 · `package-catalog` Q1
- [ ] 🟡 **Hoãn có chủ — 31 câu**: mỗi câu phải có **tên chủ** và **phase chặn**
- [ ] ⚠️ `mvp-scope` **Q1** (ai biên soạn ≥690 LO · ≥120 level · ≥60 lesson) → 🟡 **P1** theo
      **D-W**. Ghi hạn **cụ thể**: *trước khi `content-seed-authoring` khởi động* — ❌ không
      ghi "P1" chung chung. Phải có **tên chủ**, ❌ không ghi "team"
- [ ] ✅ 48/48 có `Chặn phase` ∈ {P0, P1, P2, P3, P5, go-live} và `Chủ` không rỗng
- [ ] ✅ **Không OQ nào bị xoá** — diff chỉ thêm cột

## ⛔ CHECKPOINT C — người quyết, quan trọng nhất

- [ ] Duyệt bảng phân loại (14 🔴 P0 / 31 🟡 hoãn / 3 👤 người)
- [x] ✅ **`mvp-scope` Q1 → chặn P1** — chốt 2026-08-06 (**D-W**), trước cả Checkpoint C.
      Không còn chặn Task #2
- [ ] `mvp-scope` Q2 (ngân sách + lịch P0→P3) · Q3 (mốc phát hành cứng) — trả lời hoặc hoãn có chủ
- [ ] `repo-bootstrap` Q12 — chọn: chấp nhận rủi ro `--no-verify` (ghi rõ vào 10 spec)
      **hoặc** cổng server-side ở P1
- [ ] Gán **chủ + hạn**: Q7 AWS SES production access · `child-data-compliance` Q1 (pháp lý) · Q2 (DPIA)

---

## Phase 3 — Approve theo layer (`depends_on`, ❌ không đảo)

Mỗi spec chạy đúng 4 bước: (1) checklist §10 phần thủ công → (2) đóng OQ 🔴 kèm **vì sao +
ngày** → (3) `status: approved` + `reviewed:` → (4) `lint:specs` xanh (C8 gác thứ tự).

Mỗi quyết định đụng schema ⇒ ghi thêm một dòng vào `data-model-overview.md` §Ràng buộc chờ.

### T8 — Layer 0
- [ ] `glossary` — 0 OQ, approve sau checklist
- [ ] `business-rules` — Q1 hoãn (tooling)
- [ ] `repo-bootstrap` — đóng Q2 (giữ PG 17) · Q12 (lối cho `--no-verify`); hoãn Q1·Q6·Q7·Q8·Q9

### T9 — Layer 1 ⚠️ nặng nhất, tách 2 lượt nếu diff quá sức đọc một lần
- [ ] `actors` — đóng Q1 (tham chiếu `admin-auth` P0 "MFA bắt buộc") · Q2 (tham chiếu `email-verification`)
- [ ] `id-conventions` — đóng Q1 · Q2 (đề xuất **4 chữ số**)
- [ ] `error-codes` — cả 2 hoãn
- [ ] `mvp-scope` — đóng Q4 (gắn backup/monitoring vào cổng ra P0)
  - [ ] Q1 → 🟡 P1, hạn *trước khi `content-seed-authoring` khởi động*, có tên chủ (D-W)
  - [ ] Q2·Q3 theo Checkpoint C
  - [ ] ✅ `SPEC.md` §13 **Cổng ra P0** thêm một dòng: *Q1 phải có chủ trước khi mở P1* —
        neo D-W vào cổng đo được, ❌ không để nó chỉ nằm trong bảng OQ
- [ ] `monorepo-package-architecture` — đóng Q3 (đề xuất inline tới khi `apps/admin` cần)

### T10 — Layer 2
- [ ] `access-ladder` — đóng Q3 (bậc `login`); hoãn Q1·Q2
- [ ] `child-data-compliance` — cả 4 hoãn, cần chủ + hạn từ Checkpoint C
- [ ] `content-lifecycle` — đóng Q3 (`scheduled`); hoãn Q1·Q2

### T11 — Layer 3
- [ ] `content-versioning` — đóng Q2 (FK); hoãn Q1·Q3
- [ ] `entitlement-model` — cả 3 hoãn
- [ ] `event-catalog` — đóng Q2 (partition); hoãn Q1·Q3

### T12 — Layer 4/5
- [ ] `package-catalog` — đóng Q2 (enum `billing_period`); hoãn Q1·Q3·Q4
- [ ] `payment-flow` — cả 4 hoãn

## ⛔ CHECKPOINT D — `BR-RBS-04` mở khoá

- [ ] ✅ 16/16 `00-foundation` = `status: approved`
- [ ] ✅ `pnpm lint:specs` exit 0 · `pnpm check` exit 0 · `pnpm test` exit 0
- [ ] ✅ **Ca âm cuối**: đặt `glossary` về `draft` ⇒ C8 làm đỏ 11 spec phụ thuộc nó
- [ ] `todo.md` ghi việc kế tiếp: **P0 bước 7** — `data-model-overview` → `schema-*`
- [ ] 👤 Người duyệt — hành động khó đảo, mở đường cho PR schema đầu tiên

---

## Ngoài task này (theo dõi riêng)

- [ ] Approve 114 spec `01-*`…`08-*` — theo phase của từng cái, không phải bây giờ
- [ ] Chuyển `.agents/` vào `kidthink/` theo `SPEC.md` §8 — hiện phục vụ cả workspace, di
      chuyển làm mất `CLAUDE.md` ở cwd
- [ ] Chuyển `infra/` vào `kidthink/infra/` khi tới deploy
- [ ] `docs/montessori/` — không thuộc corpus spec, chưa có spec nào sở hữu
- [ ] Nhánh lỗi PG trong `check-services.ts` in message rỗng (mất `.message` ECONNREFUSED)
- [ ] **Task #3 (P1)** — khảo sát 60 game type v1 → 6 template, rồi port `game-engine`
- [ ] Audit `packages/ui` (1.2M) vs `design-system-contract.md` (§11 Q1)
- [ ] Cổng server-side thay `--no-verify` — chỉ nếu Checkpoint C chọn hướng đó
- [ ] Thêm lại service S3 local vào docker-compose khi `image-storage` tới
