# Checklist — Task #12: Dọn nợ cảnh báo, rồi lật cổng

> Kế hoạch: [`12-corpus-debt-sweep-plan.md`](12-corpus-debt-sweep-plan.md). Bản đồ liên task:
> [`CORPUS-CLOSURE.md`](CORPUS-CLOSURE.md).
>
> Mỗi file một commit. Lô 4 (lật cổng) chỉ chạy khi lint đã 0 cảnh báo.
>
> ```
> export PATH=/Users/macbook/.nvm/versions/node/v24.15.0/bin:$PATH
> ```

## Bước 0 — điều kiện tiên quyết

- [ ] `grep -rl "^status: draft$" --include="*.md" docs/specs | xargs grep -l "^spec: " | grep -v TEMPLATE` — không in gì
- [ ] `grep -rl "^status: approved" --include="*.md" docs/specs | xargs grep -l "^spec: " | wc -l` — ra **130**
- [ ] `pnpm lint:specs 2>&1 | tail -2` — 0 lỗi; cảnh báo: ____
- [ ] Lấy danh sách nợ thật:
      `pnpm lint:specs 2>&1 | grep "\[C" | awk '{print $1}' | sed 's/:[0-9]*$//' | sort | uniq -c | sort -rn`
- [ ] Số file còn cảnh báo: ____ (kế hoạch đo được 27 lúc viết, phải giảm sau #9/#10/#11)
- [ ] Đọc [`12-corpus-debt-sweep-plan.md`](12-corpus-debt-sweep-plan.md) mục 3 (bộ giá trị `Chủ`)

---

## Lô 1 — registry `00-foundation` (nợ `C6`)

### Bước 1 — [`error-codes.md`](../specs/00-foundation/error-codes.md)

- [ ] Điền "vì sao" cho `BR-ERR-03`, `BR-ERR-06`
- [ ] Đối chiếu [`business-rules.md`](../specs/00-foundation/business-rules.md) mục 7.3 trước khi
      viết — đây là registry, sai lan ra mọi spec
- [ ] `pnpm lint:specs | grep error-codes` trống
- [ ] Commit `docs(specs): T12 bước 1 — vì sao cho error-codes`

### Bước 2 — [`payment-flow.md`](../specs/00-foundation/payment-flow.md)

- [ ] Điền "vì sao" cho 2 hàng `C6` (lấy ID bằng `pnpm lint:specs | grep payment-flow`)
- [ ] `pnpm lint:specs | grep payment-flow` trống
- [ ] Commit `docs(specs): T12 bước 2 — vì sao cho payment-flow`

### Bước 3 — [`mvp-scope.md`](../specs/00-foundation/mvp-scope.md)

- [ ] Điền "vì sao" cho 1 hàng `C6`
- [ ] Không đụng Q1 (nợ `D-W`, ai biên soạn nội dung) — task này không trả lời câu hỏi
- [ ] Commit `docs(specs): T12 bước 3 — vì sao cho mvp-scope`

### Bước 4 — [`package-catalog.md`](../specs/00-foundation/package-catalog.md)

- [ ] Điền "vì sao" cho 1 hàng `C6`
- [ ] Commit `docs(specs): T12 bước 4 — vì sao cho package-catalog`

## Cổng dừng A

- [ ] 4 file `00-foundation` không còn `C6`
- [ ] Đọc lại 6 câu "vì sao" vừa viết — là lý do, không phải diễn giải lại rule
- [ ] `pnpm lint:specs` 0 lỗi

---

## Lô 2 — bảng mục 11 sang 5 cột, vùng `01-platform` và `03-account`

Mỗi file: đọc mục 11, thêm hai cột, gán `Chặn phase` và `Chủ` theo bộ đóng, một commit. Tên commit
`docs(specs): T12 — 5 cột cho <tên-file>`.

`01-platform` (11 file):

- [ ] [`ai-codegen-pipeline.md`](../specs/01-platform/ai-codegen-pipeline.md)
- [ ] [`content-seed-authoring.md`](../specs/01-platform/content-seed-authoring.md)
- [ ] [`content-tagging.md`](../specs/01-platform/content-tagging.md)
- [ ] [`emoji-registry.md`](../specs/01-platform/emoji-registry.md)
- [ ] [`game-engine-runtime.md`](../specs/01-platform/game-engine-runtime.md)
- [ ] [`health-check.md`](../specs/01-platform/health-check.md)
- [ ] [`monitoring-and-alerting.md`](../specs/01-platform/monitoring-and-alerting.md)
- [ ] [`notification-service.md`](../specs/01-platform/notification-service.md)
- [ ] [`oauth-provider-registry.md`](../specs/01-platform/oauth-provider-registry.md)
- [ ] [`rate-limiting.md`](../specs/01-platform/rate-limiting.md)
- [ ] [`telemetry-pipeline.md`](../specs/01-platform/telemetry-pipeline.md)

`03-account` (6 file):

- [ ] [`account-deletion.md`](../specs/03-account/account-deletion.md)
- [ ] [`account-settings.md`](../specs/03-account/account-settings.md)
- [ ] [`email-verification.md`](../specs/03-account/email-verification.md)
- [ ] [`login-and-session.md`](../specs/03-account/login-and-session.md)
- [ ] [`password-recovery.md`](../specs/03-account/password-recovery.md)
- [ ] [`registration.md`](../specs/03-account/registration.md)

Kiểm giữa lô:

- [ ] Sau mỗi 5 file: `pnpm lint:specs 2>&1 | tail -2` — 0 lỗi, `C16` giảm đúng 5
- [ ] Không dùng `sed` hàng loạt cho bảng — thêm cột bằng tay từng file

---

## Lô 3 — 6 file còn lại

- [ ] [`admin-auth.md`](../specs/06-admin/admin-auth.md) — **cả hai loại nợ**: 4 hàng `C6` cộng
      bảng 5 cột; một commit
- [ ] [`taxonomy-browser.md`](../specs/06-admin/taxonomy-browser.md)
- [ ] [`access-gating.md`](../specs/04-play/access-gating.md)
- [ ] [`game-level-model.md`](../specs/05-content/game-level-model.md)
- [ ] [`security-checklist.md`](../specs/08-quality/security-checklist.md)
- [ ] [`testing-strategy.md`](../specs/08-quality/testing-strategy.md)

## Cổng dừng B

- [ ] `pnpm lint:specs 2>&1 | tail -2` — **0 lỗi, 0 cảnh báo** (lần đầu corpus đạt)
- [ ] `grep -rh "^| [0-9]" docs/specs --include="*.md" | awk -F'|' 'NF>=6 {print $6}' | sed 's/^ *//;s/ *$//' | sort -u`
      — mọi giá trị thuộc bộ đóng ở kế hoạch mục 3, không ô nào rỗng
- [ ] `pnpm check && pnpm test` xanh
- [ ] Commit `docs(specs): T12 — corpus đạt 0 cảnh báo`

---

## Lô 4 — lật `checkC16` sang chặng 2

Thứ tự bắt buộc, không đảo:

- [ ] Viết ca âm trong [`scripts/tests/lint-specs.test.ts`](../../scripts/tests/lint-specs.test.ts):
      spec giả `status: approved`, bảng mục 11 **ba cột** → đúng một `fail`
- [ ] `pnpm test scripts/tests/lint-specs.test.ts` — **phải đỏ**
- [ ] Sửa `checkC16` trong [`scripts/lint-specs-lib.ts`](../../scripts/lint-specs-lib.ts): nhánh
      `!tableHas5Cols` gọi `fail` khi `status: approved`, giữ `warn` khi `draft`
- [ ] Chạy test — **phải xanh**
- [ ] Xoá thân nhánh vừa thêm, chạy lại test — **phải đỏ trở lại** (không bỏ được bước này)
- [ ] Khôi phục; `pnpm lint:specs` — 0 lỗi, 0 cảnh báo với cổng mới
- [ ] Commit `feat(scripts): T12 — C16 chặng 2, bảng dưới 5 cột là lỗi`

### Đề xuất chờ chủ dự án — `checkC6` chặng 2

- [ ] Trình bày: `C6` hiện luôn `warn`; sau lô 3 số `C6` là 0 nên lật `fail` cho spec `approved`
      không làm đỏ gì
- [ ] Chủ dự án **duyệt** hay **bác** — ghi vào sổ `D-*` cả hai trường hợp
- [ ] Nếu duyệt: làm đúng sáu bước như `C16` ở trên, ca âm trước
- [ ] Commit `feat(scripts): T12 — C6 chặng 2` (chỉ khi duyệt)

---

## Bước cuối — cập nhật tài liệu

- [ ] [`CONVENTIONS.md`](../specs/CONVENTIONS.md): thêm mục bảng mục 11 phải 5 cột + bộ giá trị
      `Chủ` (kế hoạch mục 3)
- [ ] [`CORPUS-CLOSURE.md`](CORPUS-CLOSURE.md): tick bốn điều kiện "xong", ghi số đo cuối
- [ ] `.agents/AGENTS.md` ở gốc workspace (ngoài `kidthink/`): sửa bảng "Trạng thái repo" từ
      "135 spec, một outcome một file" sang "130 spec `approved`, cổng lint tự giữ"
- [ ] Commit `docs: T12 — đóng chuỗi task corpus`

## Cổng dừng cuối

- [ ] `pnpm lint:specs` 0 lỗi, 0 cảnh báo
- [ ] `pnpm check && pnpm test && pnpm check:services` xanh
- [ ] Ca âm chặng 2 tồn tại và đã chứng minh đỏ → xanh → đỏ
- [ ] Bốn điều kiện "xong" ở [`CORPUS-CLOSURE.md`](CORPUS-CLOSURE.md) đều đạt
