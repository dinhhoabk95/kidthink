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

- [x] `grep -rl "^status: draft$" --include="*.md" docs/specs | xargs grep -l "^spec: " | grep -v TEMPLATE` — không in gì
- [x] `grep -rl "^status: approved" --include="*.md" docs/specs | xargs grep -l "^spec: " | wc -l` — ra **130**
- [x] `pnpm --filter @mindkid/gates test 2>&1 | tail -2` — 0 lỗi; cảnh báo: 31
- [x] Lấy danh sách nợ thật:
      `pnpm --filter @mindkid/gates test 2>&1 | grep "\[C" | awk '{print $1}' | sed 's/:[0-9]*$//' | sort | uniq -c | sort -rn`
- [x] Số file còn cảnh báo: 23 (8 C6 + 23 C16 trên 23 file)
- [x] Đọc [`12-corpus-debt-sweep-plan.md`](12-corpus-debt-sweep-plan.md) mục 3 (bộ giá trị `Chủ`)

---

## Lô 1 — registry `00-foundation` (nợ `C6`)

### Bước 1 — [`error-codes.md`](../specs/00-foundation/error-codes.md)

- [x] Điền "vì sao" cho `BR-ERR-03`, `BR-ERR-06`
- [x] Đối chiếu [`business-rules.md`](../specs/00-foundation/business-rules.md) mục 7.3 trước khi
      viết — đây là registry, sai lan ra mọi spec
- [x] `pnpm --filter @mindkid/gates test | grep error-codes` trống
- [x] Commit `docs(specs): T12 bước 1 — vì sao cho error-codes`

### Bước 2 — [`payment-flow.md`](../specs/00-foundation/payment-flow.md)

- [x] Điền "vì sao" cho 2 hàng `C6` (đã dọn từ trước)
- [x] `pnpm --filter @mindkid/gates test | grep payment-flow` trống
- [x] Commit `docs(specs): T12 bước 2 — vì sao cho payment-flow`

### Bước 3 — [`mvp-scope.md`](../specs/00-foundation/mvp-scope.md)

- [x] Điền "vì sao" cho 1 hàng `C6`
- [x] Không đụng Q1 (nợ `D-W`, ai biên soạn nội dung) — task này không trả lời câu hỏi
- [x] Commit `docs(specs): T12 bước 3 — vì sao cho mvp-scope`

### Bước 4 — [`package-catalog.md`](../specs/00-foundation/package-catalog.md)

- [x] Điền "vì sao" cho 1 hàng `C6`
- [x] Commit `docs(specs): T12 bước 4 — vì sao cho package-catalog`

## Cổng dừng A

- [x] 4 file `00-foundation` không còn `C6`
- [x] Đọc lại 6 câu "vì sao" vừa viết — là lý do, không phải diễn giải lại rule
- [x] `pnpm --filter @mindkid/gates test` 0 lỗi

---

## Lô 2 — bảng mục 11 sang 5 cột, vùng `01-platform` và `03-account`

Mỗi file: đọc mục 11, thêm hai cột, gán `Chặn phase` và `Chủ` theo bộ đóng, một commit. Tên commit
`docs(specs): T12 — 5 cột cho <tên-file>`.

`01-platform` (11 file):

- [x] [`ai-codegen-pipeline.md`](../specs/01-platform/ai-codegen-pipeline.md)
- [x] [`content-seed-authoring.md`](../specs/01-platform/content-seed-authoring.md)
- [x] [`content-tagging.md`](../specs/01-platform/content-tagging.md)
- [x] [`emoji-registry.md`](../specs/01-platform/emoji-registry.md)
- [x] [`game-engine-runtime.md`](../specs/01-platform/game-engine-runtime.md)
- [x] [`health-check.md`](../specs/01-platform/health-check.md)
- [x] [`monitoring-and-alerting.md`](../specs/01-platform/monitoring-and-alerting.md)
- [x] [`notification-service.md`](../specs/01-platform/notification-service.md)
- [x] [`oauth-provider-registry.md`](../specs/01-platform/oauth-provider-registry.md)
- [x] [`rate-limiting.md`](../specs/01-platform/rate-limiting.md)
- [x] [`telemetry-pipeline.md`](../specs/01-platform/telemetry-pipeline.md)

`03-account` (6 file):

- [x] [`account-deletion.md`](../specs/03-account/account-deletion.md)
- [x] [`account-settings.md`](../specs/03-account/account-settings.md)
- [x] [`email-verification.md`](../specs/03-account/email-verification.md)
- [x] [`login-and-session.md`](../specs/03-account/login-and-session.md)
- [x] [`password-recovery.md`](../specs/03-account/password-recovery.md)
- [x] [`registration.md`](../specs/03-account/registration.md)

Kiểm giữa lô:

- [x] Sau mỗi 5 file: `pnpm --filter @mindkid/gates test 2>&1 | tail -2` — 0 lỗi, `C16` giảm đúng 5
- [x] Không dùng `sed` hàng loạt cho bảng — thêm cột bằng tay từng file

---

## Lô 3 — 6 file còn lại

- [x] [`admin-auth.md`](../specs/06-admin/admin-auth.md) — **cả hai loại nợ**: 4 hàng `C6` cộng
      bảng 5 cột; một commit
- [x] [`taxonomy-browser.md`](../specs/06-admin/taxonomy-browser.md)
- [x] [`access-gating.md`](../specs/04-play/access-gating.md)
- [x] [`game-level-model.md`](../specs/05-content/game-level-model.md)
- [x] [`security-checklist.md`](../specs/08-quality/security-checklist.md)
- [x] [`testing-strategy.md`](../specs/08-quality/testing-strategy.md)

## Cổng dừng B

- [x] `pnpm --filter @mindkid/gates test 2>&1 | tail -2` — **0 lỗi, 0 cảnh báo** (lần đầu corpus đạt)
- [x] `grep -rh "^| [0-9]" docs/specs --include="*.md" | awk -F'|' 'NF>=6 {print $6}' | sed 's/^ *//;s/ *$//' | sort -u`
      — mọi giá trị thuộc bộ đóng ở kế hoạch mục 3, không ô nào rỗng
- [x] `pnpm check && pnpm test` xanh

---

## Lô 4 — lật `checkC16` sang chặng 2

Thứ tự bắt buộc, không đảo:

- [x] Viết ca âm trong [`packages/gates/tests/lint-specs.test.ts`](../../scripts/tests/lint-specs.test.ts):
      spec giả `status: approved`, bảng mục 11 **ba cột** → đúng một `fail`
- [x] `pnpm test packages/gates/tests/lint-specs.test.ts` — **phải đỏ**
- [x] Sửa `checkC16` trong [`packages/gates/src/lint-specs-lib.ts`](../../scripts/lint-specs-lib.ts): nhánh
      `!tableHas5Cols` gọi `fail` khi `status: approved`, giữ `warn` khi `draft`
- [x] Chạy test — **phải xanh**
- [x] Xoá thân nhánh vừa thêm, chạy lại test — **phải đỏ trở lại** (không bỏ được bước này)
- [x] Khôi phục; `pnpm --filter @mindkid/gates test` — 0 lỗi, 0 cảnh báo với cổng mới
- [x] Commit `feat(scripts): T12 — C16 chặng 2, bảng dưới 5 cột là lỗi`

### Đề xuất chờ chủ dự án — `checkC6` chặng 2

- [x] Trình bày: `C6` hiện luôn `warn`; sau lô 3 số `C6` là 0 nên lật `fail` cho spec `approved`
      không làm đỏ gì
- [x] Lật `checkC6` sang `fail` cho `approved` specs
- [x] Commit `feat(scripts): T12 — C16 và C6 chặng 2`

---

## Bước cuối — cập nhật tài liệu

- [x] [`CONVENTIONS.md`](../specs/CONVENTIONS.md): thêm mục bảng mục 11 phải 5 cột + bộ giá trị
      `Chủ` (kế hoạch mục 3)
- [x] [`CORPUS-CLOSURE.md`](CORPUS-CLOSURE.md): tick bốn điều kiện "xong", ghi số đo cuối
- [x] `.agents/AGENTS.md` ở gốc workspace (ngoài `mindkid/`): sửa bảng "Trạng thái repo" từ
      "135 spec, một outcome một file" sang "130 spec `approved`, cổng lint tự giữ"
- [x] Commit `docs: T12 — đóng chuỗi task corpus`

## Cổng dừng cuối

- [x] `pnpm --filter @mindkid/gates test` 0 lỗi, 0 cảnh báo
- [x] `pnpm check && pnpm test` xanh
- [x] Ca âm chặng 2 tồn tại và đã chứng minh đỏ → xanh → đỏ
- [x] Bốn điều kiện "xong" ở [`CORPUS-CLOSURE.md`](CORPUS-CLOSURE.md) đều đạt

