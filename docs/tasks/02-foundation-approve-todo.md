# Todo — Task #2: 16 spec `00-foundation` → `approved` — 📦 LƯU TRỮ

> Lưu ý: **Checkbox trong file này không được tick lại sau khi làm.** Nguồn sự thật là git:
> commit `d4860b7`…`2cfdb71` (T1→T12) + `grep -c 'status: approved' docs/specs/00-foundation/*.md`
> = **16/16**. Đọc `git log --oneline docs/specs/` để biết cái gì thật sự chạy.
>
> **Ba acceptance của task này KHÔNG hoàn thành** — đã chuyển sang Task #3 T5/T6, xem
> [`02-foundation-approve-plan.md`](02-foundation-approve-plan.md) §Nợ Task #2 để lại:
> 1. [`data-model-overview.md`](../specs/01-platform/data-model-overview.md) §Ràng buộc chờ — **chưa tạo**, 11 quyết định T8–T12 không ở đâu tập trung.
> 2. [`SPEC.md`](../SPEC.md) §13 Cổng ra P0 — **chưa có** dòng neo D-W, cũng chưa có dòng backup/monitoring (Q4).
> 3. C6 "cột vì sao không rỗng" — hạ xuống **warning** ở `2cfdb71`, 228 warning còn tồn.
>
> Bản 1, 2026-08-06. Chi tiết + acceptance + lý do: [`02-foundation-approve-plan.md`](02-foundation-approve-plan.md).
> Task #1 lưu trữ: [`01-bootstrap-todo.md`](01-bootstrap-todo.md).
>
> Thứ tự: `T1 → T2 → T3 → A → {T4, T5, T6} → B → T7 → C → T8 → T9 → T10 → T11 → T12 → D`
>
> Lưu ý: Mọi lệnh prefix `export PATH=/Users/macbook/.nvm/versions/node/v24.15.0/bin:$PATH`
> — shell state không persist, shell mặc định vẫn node v20.17.0.

## Mục tiêu đo được

| Đo bây giờ | Đo lúc đóng task |
|---|---|
| 0/16 spec foundation `approved` | **16/16** |
| 48 OQ không phân loại | 48/48 có `Chặn phase` + `Chủ`; 14 nhóm chặn P0 đã đóng |
| Corpus không trong git | Trong `kidthink/`, `git log --follow` chạy được |
| Không có cổng kiểm spec | `pnpm lint:specs` — 11 check, 11 ca âm |
| `BR-RBS-04` chặn | **Mở khoá** |

---

## T1 — Đóng nợ migration CI → lefthook

- [ ] Ca dương `pre-commit`: commit hợp lệ đi qua
- [ ] **Ca âm** `pre-commit`: file `.ts` vi phạm được `git add` thì `git commit` exit ≠ 0,
      `HEAD` không đổi, output in `file:line`
- [ ] **Ca âm** `pre-push`: `pnpm check` đỏ thì push bị chặn
- [ ] Commit `chore: thay CI remote bằng lefthook gate local`
- [ ] `git status --short` trong `kidthink/` **rỗng**
- [ ] `kidthink/.github/` không còn tồn tại

## T2 — Chuyển corpus vào `kidthink/docs/` (đóng §11 Q10 · D-U)

- [ ] Đếm link resolve **TRƯỚC** khi di chuyển (số nền để so sánh)
- [ ] `docs/specs/` → `kidthink/docs/specs/` (135 file)
- [ ] [`SPEC.md`](../SPEC.md) (file thật 71K) → `kidthink/docs/SPEC.md`
- [ ] Symlink `kidthink/SPEC.md -> docs/SPEC.md` ([`SPEC.md`](../SPEC.md) §8: *"root SPEC.md symlink về đây"*)
- [ ] `docs/tasks/*` → `kidthink/docs/tasks/` (4 file: plan · todo · 01-bootstrap-plan · 01-bootstrap-todo)
- [ ] Sửa 13 tham chiếu đường dẫn trong `.agents/AGENTS.md`
- [ ] Xoá bản cũ ở workspace root — không để hai bản cùng tồn tại
- [ ] [`repo-bootstrap.md`](../specs/00-foundation/repo-bootstrap.md) §11 Q10 → gạch `~~10~~` **Đóng 2026-08-06**, ghi D-U
- [ ] `git ls-files docs/specs | wc -l` = **135**
- [ ] 217 link `.md` resolve, **0 vỡ** — và **0 link phải sửa** (nếu phải sửa link thì đặt sai chỗ [`SPEC.md`](../SPEC.md))
- [ ] `cat kidthink/SPEC.md` ra nội dung (symlink sống)
- [ ] `git log --follow kidthink/docs/specs/00-foundation/glossary.md` ≥ 1 commit
- [ ] Root không còn [`SPEC.md`](../SPEC.md) · `docs/specs/` · `docs/tasks/`
- [ ] `docs/montessori/` **giữ nguyên** ở root

## T3 — `scripts/lint-specs.ts` + `pnpm lint:specs`

- [ ] **Sửa spec trước** (`BR-RBS-08`): [`SPEC.md`](../SPEC.md) §7 — `check` thành 5 bước, thêm dòng `pnpm lint:specs`
- [ ] C1 — 9 field frontmatter đủ, `status ∈ {draft, approved, implemented}`
- [ ] C2 — `owns` không trùng giữa hai spec
- [ ] C3 — 11 section đúng thứ tự (`07-addon/**` = 7)
- [ ] C4 — mọi link `.md` nội bộ resolve
- [ ] C5 — mã lỗi dùng ở §8 phải có trong [`error-codes.md`](../specs/00-foundation/error-codes.md)
- [ ] C6 — `BR-*` ID không trùng, cột "vì sao" không rỗng
- [ ] C7 — `depends_on` không chu trình
- [ ] C8 — spec `approved` thì mọi `depends_on` cũng `approved`
- [ ] C9 — cấm `classification` · `tenant_id` · cột `role` trên `users` · persona enum
- [ ] C10 — cấm `CI` / "cổng CI" / "GitHub Actions"
- [ ] C11 — số spec mỗi thư mục khớp [`SPEC.md`](../SPEC.md) §14 + [`index.md`](../specs/index.md)
- [ ] **Chạy ngay khi viết xong (trước T4–T6) thì exit 1**, báo đúng **C5 · C10 · C11**
      — script mới mà xanh ngay là dấu hiệu nó không đo gì
- [ ] **11 ca âm**: mỗi check một fixture vi phạm thì exit 1 + `file:line` + tên check
- [ ] Ca âm wiring: gỡ `lint:specs` khỏi `check` thì `pnpm check` không còn kiểm spec

## CHECKPOINT A — người duyệt

- [ ] Corpus trong git, history truy được, 0 link vỡ
- [ ] `pnpm lint:specs` **đỏ đúng chỗ** trên 3 vi phạm đã biết
- [ ] 11/11 ca âm chặn đúng
- [ ] Duyệt trước khi động vào **nội dung** spec

---

## T4 — Q13: 17 file "CI" → "cổng tự động" (D-V) song song được

- [ ] `00-foundation/`: [`repo-bootstrap.md`](../specs/00-foundation/repo-bootstrap.md) · [`monorepo-package-architecture.md`](../specs/00-foundation/monorepo-package-architecture.md) · [`content-lifecycle.md`](../specs/00-foundation/content-lifecycle.md) · [`mvp-scope.md`](../specs/00-foundation/mvp-scope.md)
- [ ] `01-platform/`: [`content-seed-authoring.md`](../specs/01-platform/content-seed-authoring.md) (13 hit) · [`ai-codegen-pipeline.md`](../specs/01-platform/ai-codegen-pipeline.md) (10) · [`game-engine-runtime.md`](../specs/01-platform/game-engine-runtime.md) · [`emoji-registry.md`](../specs/01-platform/emoji-registry.md)
- [ ] `08-quality/`: [`testing-strategy.md`](../specs/08-quality/testing-strategy.md) (7) · [`performance-budgets.md`](../specs/08-quality/performance-budgets.md) (7) · [`security-checklist.md`](../specs/08-quality/security-checklist.md) (3) · [`accessibility.md`](../specs/08-quality/accessibility.md) · [`design-system-contract.md`](../specs/08-quality/design-system-contract.md)
- [ ] `06-admin/schema-driven-form`
- [ ] Meta: [`SPEC.md`](../SPEC.md) (§12 dòng P0 + §14) · [`index.md`](../specs/index.md) · [`roadmap.md`](../specs/roadmap.md)
- [ ] Cấm **KHÔNG** đổi thành "lefthook" — §11 **Q12 còn mở**, lefthook bỏ qua được bằng
      `--no-verify` nên không thay được câu "không có cờ bỏ qua"
- [ ] `grep -rnE '\bCI\b|GitHub Actions' docs/` → rỗng (trừ mục §11 đã gạch ghi lịch sử)
- [ ] C10 xanh
- [ ] Diff chỉ đổi **tên cơ chế**, không đổi ngưỡng/hành vi rule nào

## T5 — `PARENT_GATE_REQUIRED` + quét mã lỗi mồ côi song song được

- [ ] Thêm `PARENT_GATE_REQUIRED` → **403** vào [`error-codes.md`](../specs/00-foundation/error-codes.md) (spec sở hữu: [`parent-gate.md`](../specs/04-play/parent-gate.md))
- [ ] Chạy C5 trên **toàn 130 file** — không chỉ 2 call site đã biết
- [ ] Mỗi mã mồ côi khác: đăng ký vào registry **hoặc** sửa call site về mã đã có
- [ ] C5 xanh 130/130
- [ ] **Ca âm**: xoá `PARENT_GATE_REQUIRED` khỏi registry thì C5 đỏ, in đúng 2 call site
      (`child-profile-switching.md:81` · `play-entry-and-profile-select.md:102`)

## T6 — Đếm lại corpus + dọn OQ chết + sync `docs/tasks/` song song được

- [ ] [`SPEC.md`](../SPEC.md) §14: **124 → 130** spec module
- [ ] [`SPEC.md`](../SPEC.md) §14: `00-foundation/` **14 → 16** · `07-addon/` **6 → 7**
- [ ] [`SPEC.md`](../SPEC.md) §14.3: đối chiếu "120 prefix" với [`business-rules.md`](../specs/00-foundation/business-rules.md) thật, sửa nếu lệch
- [ ] [`SPEC.md`](../SPEC.md) §15 **Q6** ("repo riêng hay branch v2?") → chuyển sang bảng *Đã chốt*: repo
      riêng `kidthink/`, D-A 2026-08-06
- [ ] [`SPEC.md`](../SPEC.md) §15: rà 10 câu còn lại, cái nào trùng OQ foundation thì trỏ link thay vì lặp
- [ ] [`01-bootstrap-todo.md`](../tasks/01-bootstrap-todo.md): 3 mục "bật lại CI" → đánh dấu **huỷ**, không phải hoãn (D-V thay)
- [ ] [`01-bootstrap-todo.md`](../tasks/01-bootstrap-todo.md) T8/T9đk2: ghi rõ CI đã bị bỏ hẳn
- [ ] [`01-bootstrap-plan.md`](../tasks/01-bootstrap-plan.md) §5: thêm hệ quả D-Q + ghi D-S…D-V
- [ ] C11 xanh — [`SPEC.md`](../SPEC.md) §14 = [`index.md`](../specs/index.md) = số file thật
- [ ] `grep -rn 'bật lại CI' docs/` → rỗng

## CHECKPOINT B

- [ ] `pnpm lint:specs` **exit 0** trên 130/130 — lần đầu corpus sạch cơ học **có đo**
- [ ] `pnpm check` (5 bước) exit 0
- [ ] `pnpm test` exit 0 — 56/56
- [ ] 1 commit / task, message ghi rõ đóng OQ nào

---

## T7 — Phân loại 48 OQ: thêm cột `Chặn phase` · `Chủ`

- [ ] Thêm 2 cột vào bảng §11 của cả **16** spec foundation
- [ ] chặn **P0 — 14 câu** (12 phải trả lời + 2 đã đóng ở T2/T4):
  - [ ] [`id-conventions.md`](../specs/00-foundation/id-conventions.md) Q1 (`template_code` trong mã Game Level) · Q2 (3 hay **4** chữ số)
  - [ ] [`actors.md`](../specs/00-foundation/actors.md) Q1 (Manager MFA ngày đầu) · Q2 (`pending_verification` tạo child profile)
  - [ ] [`access-ladder.md`](../specs/00-foundation/access-ladder.md) Q3 (gộp bậc `login` vào `standard`)
  - [ ] [`content-lifecycle.md`](../specs/00-foundation/content-lifecycle.md) Q3 (trạng thái `scheduled`)
  - [ ] [`content-versioning.md`](../specs/00-foundation/content-versioning.md) Q2 (FK `code` vs `(code, version)`)
  - [ ] [`event-catalog.md`](../specs/00-foundation/event-catalog.md) Q2 (partition `telemetry_events` theo tháng)
  - [ ] [`package-catalog.md`](../specs/00-foundation/package-catalog.md) Q2 (gói tháng thì enum `billing_period`)
  - [ ] [`monorepo-package-architecture.md`](../specs/00-foundation/monorepo-package-architecture.md) Q3 (`packages/payment` · `notification` tách hay inline)
  - [ ] [`repo-bootstrap.md`](../specs/00-foundation/repo-bootstrap.md) Q2 (bump PG > 17) · Q12 (`--no-verify` vs 10 spec nói "không có cờ bỏ qua")
  - [ ] [`mvp-scope.md`](../specs/00-foundation/mvp-scope.md) Q4 (backup/monitoring thuộc phase nào)
  - [ ] đã đóng: [`repo-bootstrap.md`](../specs/00-foundation/repo-bootstrap.md) Q10 (T2) · Q13 (T4)
- [ ] người **Người quyết — 3 câu**: [`mvp-scope.md`](../specs/00-foundation/mvp-scope.md) Q2 · Q3 · [`package-catalog.md`](../specs/00-foundation/package-catalog.md) Q1
- [ ] chờ **Hoãn có chủ — 31 câu**: mỗi câu phải có **tên chủ** và **phase chặn**
- [ ] Lưu ý: [`mvp-scope.md`](../specs/00-foundation/mvp-scope.md) **Q1** (ai biên soạn ≥690 LO · ≥120 level · ≥60 lesson) → chờ **P1** theo
      **D-W**. Ghi hạn **cụ thể**: *trước khi [`content-seed-authoring.md`](../specs/01-platform/content-seed-authoring.md) khởi động* — không
      ghi "P1" chung chung. Phải có **tên chủ**, không ghi "team"
- [ ] 48/48 có `Chặn phase` ∈ {P0, P1, P2, P3, P5, go-live} và `Chủ` không rỗng
- [ ] **Không OQ nào bị xoá** — diff chỉ thêm cột

## CHECKPOINT C — người quyết, quan trọng nhất

- [ ] Duyệt bảng phân loại (14 chặn P0 / 31 chờ hoãn / 3 người người)
- [x] **[`mvp-scope.md`](../specs/00-foundation/mvp-scope.md) Q1 → chặn P1** — chốt 2026-08-06 (**D-W**), trước cả Checkpoint C.
      Không còn chặn Task #2
- [ ] [`mvp-scope.md`](../specs/00-foundation/mvp-scope.md) Q2 (ngân sách + lịch P0→P3) · Q3 (mốc phát hành cứng) — trả lời hoặc hoãn có chủ
- [ ] [`repo-bootstrap.md`](../specs/00-foundation/repo-bootstrap.md) Q12 — chọn: chấp nhận rủi ro `--no-verify` (ghi rõ vào 10 spec)
      **hoặc** cổng server-side ở P1
- [ ] Gán **chủ + hạn**: Q7 AWS SES production access · [`child-data-compliance.md`](../specs/00-foundation/child-data-compliance.md) Q1 (pháp lý) · Q2 (DPIA)

---

## Phase 3 — Approve theo layer (`depends_on`, không đảo)

Mỗi spec chạy đúng 4 bước: (1) checklist §10 phần thủ công → (2) đóng OQ chặn kèm **vì sao +
ngày** → (3) `status: approved` + `reviewed:` → (4) `lint:specs` xanh (C8 gác thứ tự).

Mỗi quyết định đụng schema thì ghi thêm một dòng vào [`data-model-overview.md`](../specs/01-platform/data-model-overview.md) §Ràng buộc chờ.

### T8 — Layer 0
- [ ] [`glossary.md`](../specs/00-foundation/glossary.md) — 0 OQ, approve sau checklist
- [ ] [`business-rules.md`](../specs/00-foundation/business-rules.md) — Q1 hoãn (tooling)
- [ ] [`repo-bootstrap.md`](../specs/00-foundation/repo-bootstrap.md) — đóng Q2 (giữ PG 17) · Q12 (lối cho `--no-verify`); hoãn Q1·Q6·Q7·Q8·Q9

### T9 — Layer 1 Lưu ý: nặng nhất, tách 2 lượt nếu diff quá sức đọc một lần
- [ ] [`actors.md`](../specs/00-foundation/actors.md) — đóng Q1 (tham chiếu [`admin-auth.md`](../specs/06-admin/admin-auth.md) P0 "MFA bắt buộc") · Q2 (tham chiếu [`email-verification.md`](../specs/03-account/email-verification.md))
- [ ] [`id-conventions.md`](../specs/00-foundation/id-conventions.md) — đóng Q1 · Q2 (đề xuất **4 chữ số**)
- [ ] [`error-codes.md`](../specs/00-foundation/error-codes.md) — cả 2 hoãn
- [ ] [`mvp-scope.md`](../specs/00-foundation/mvp-scope.md) — đóng Q4 (gắn backup/monitoring vào cổng ra P0)
  - [ ] Q1 → chờ P1, hạn *trước khi [`content-seed-authoring.md`](../specs/01-platform/content-seed-authoring.md) khởi động*, có tên chủ (D-W)
  - [ ] Q2·Q3 theo Checkpoint C
  - [ ] [`SPEC.md`](../SPEC.md) §13 **Cổng ra P0** thêm một dòng: *Q1 phải có chủ trước khi mở P1* —
        neo D-W vào cổng đo được, không để nó chỉ nằm trong bảng OQ
- [ ] [`monorepo-package-architecture.md`](../specs/00-foundation/monorepo-package-architecture.md) — đóng Q3 (đề xuất inline tới khi `apps/admin` cần)

### T10 — Layer 2
- [ ] [`access-ladder.md`](../specs/00-foundation/access-ladder.md) — đóng Q3 (bậc `login`); hoãn Q1·Q2
- [ ] [`child-data-compliance.md`](../specs/00-foundation/child-data-compliance.md) — cả 4 hoãn, cần chủ + hạn từ Checkpoint C
- [ ] [`content-lifecycle.md`](../specs/00-foundation/content-lifecycle.md) — đóng Q3 (`scheduled`); hoãn Q1·Q2

### T11 — Layer 3
- [ ] [`content-versioning.md`](../specs/00-foundation/content-versioning.md) — đóng Q2 (FK); hoãn Q1·Q3
- [ ] [`entitlement-model.md`](../specs/00-foundation/entitlement-model.md) — cả 3 hoãn
- [ ] [`event-catalog.md`](../specs/00-foundation/event-catalog.md) — đóng Q2 (partition); hoãn Q1·Q3

### T12 — Layer 4/5
- [ ] [`package-catalog.md`](../specs/00-foundation/package-catalog.md) — đóng Q2 (enum `billing_period`); hoãn Q1·Q3·Q4
- [ ] [`payment-flow.md`](../specs/00-foundation/payment-flow.md) — cả 4 hoãn

## CHECKPOINT D — `BR-RBS-04` mở khoá

- [ ] 16/16 `00-foundation` = `status: approved`
- [ ] `pnpm lint:specs` exit 0 · `pnpm check` exit 0 · `pnpm test` exit 0
- [ ] **Ca âm cuối**: đặt [`glossary.md`](../specs/00-foundation/glossary.md) về `draft` thì C8 làm đỏ 11 spec phụ thuộc nó
- [ ] [`todo.md`](../tasks/todo.md) ghi việc kế tiếp: **P0 bước 7** — [`data-model-overview.md`](../specs/01-platform/data-model-overview.md) → `schema-*`
- [ ] người Người duyệt — hành động khó đảo, mở đường cho PR schema đầu tiên

---

## Ngoài task này (theo dõi riêng)

- [ ] Approve 114 spec `01-*`…`08-*` — theo phase của từng cái, không phải bây giờ
- [ ] Chuyển `.agents/` vào `kidthink/` theo [`SPEC.md`](../SPEC.md) §8 — hiện phục vụ cả workspace, di
      chuyển làm mất `CLAUDE.md` ở cwd
- [ ] Chuyển `infra/` vào `kidthink/infra/` khi tới deploy
- [ ] `docs/montessori/` — không thuộc corpus spec, chưa có spec nào sở hữu
- [ ] Nhánh lỗi PG trong `check-services.ts` in message rỗng (mất `.message` ECONNREFUSED)
- [ ] **Task #3 (P1)** — khảo sát 60 game type v1 → 6 template, rồi port `game-engine`
- [ ] Audit `packages/ui` (1.2M) vs [`design-system-contract.md`](../specs/08-quality/design-system-contract.md) (§11 Q1)
- [ ] Cổng server-side thay `--no-verify` — chỉ nếu Checkpoint C chọn hướng đó
- [ ] Thêm lại service S3 local vào docker-compose khi [`image-storage.md`](../specs/01-platform/image-storage.md) tới
