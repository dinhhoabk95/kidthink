# Checklist — Task #13: Chuẩn hoá cột `Chủ`, và cổng `C17`

> Kế hoạch: [`13-question-owner-normalization-plan.md`](13-question-owner-normalization-plan.md).
> Bản đồ liên task: [`CORPUS-CLOSURE.md`](CORPUS-CLOSURE.md).
>
> Mỗi file một commit. Quy trình chuẩn cho một file: kế hoạch mục 5, sáu việc.
>
> ```
> export PATH=/Users/macbook/.nvm/versions/node/v24.15.0/bin:$PATH
> ```

## Bước 0 — điều kiện tiên quyết

- [ ] Task #12 đã đóng: `pnpm lint:specs 2>&1 | tail -2` — **0 lỗi, 0 cảnh báo**
- [ ] `grep -rl "^status: approved" --include="*.md" docs/specs | xargs grep -l "^spec: " | wc -l` — ra **130**
- [ ] `git status --short` sạch
- [ ] Mã `D-*` kế tiếp: `grep -rhoE "D-B[A-Z]" docs/specs docs/tasks | sort -u | tail -1` → ghi ở đây: ____
- [ ] Đọc kế hoạch mục 3 (bộ giá trị đóng + bảng quy đổi nhóm B + khuôn đóng nhóm A)

---

## Bước 1 — `checkC17` chặng 1, mức `warn`

- [ ] Viết ca âm trong [`scripts/tests/lint-specs.test.ts`](../../scripts/tests/lint-specs.test.ts):
      spec giả `approved`, hàng mục 11 có `Chủ` = `Product / QA` → đúng một `warn` `C17`
- [ ] Ca dương cùng chỗ: `Chủ` = `người quyết` → im lặng
- [ ] Ca biên bắt buộc: `Chủ` = `người quyết — chặn P2` → **phải** `warn` (khớp lỏng là cổng giả)
- [ ] Ca biên: hàng gạch `~~2~~` với `Chủ` = `D-AE (T11)` → im lặng; cùng hàng đó với `Chủ` = `Infra` → `warn`
- [ ] `pnpm test scripts/tests/lint-specs.test.ts` — **phải đỏ**
- [ ] Viết `checkC17` trong [`scripts/lint-specs-lib.ts`](../../scripts/lint-specs-lib.ts), đăng ký vào danh sách check
- [ ] Chạy test — **phải xanh**
- [ ] `pnpm lint:specs 2>&1 | tail -2` — 0 lỗi; số cảnh báo `C17`: ____ (kế hoạch đo 76 lúc viết)
- [ ] `pnpm lint:specs 2>&1 | grep -F "[C17]" > /tmp/c17-baseline.txt` — giữ làm mốc đếm ngược
- [ ] Commit `feat(scripts): T13 bước 1 — C17 chặng 1, bộ giá trị cột Chủ`

## Cổng dừng A

- [ ] Ca âm đã chứng minh đỏ rồi xanh
- [ ] Số cảnh báo `C17` khớp số hàng đo trong kế hoạch mục 2 (± hàng Task #12 mới thêm)
- [ ] `pnpm check && pnpm test` xanh

---

## Lô 1 — `00-foundation`, 6 file / 14 hàng

- [ ] [`event-catalog.md`](../specs/00-foundation/event-catalog.md) — B4
- [ ] [`repo-bootstrap.md`](../specs/00-foundation/repo-bootstrap.md) — B4
- [ ] [`access-ladder.md`](../specs/00-foundation/access-ladder.md) — A1+B1
- [ ] [`child-data-compliance.md`](../specs/00-foundation/child-data-compliance.md) — B2
- [ ] [`mvp-scope.md`](../specs/00-foundation/mvp-scope.md) — B1; **không** đụng Q1 (nợ `D-W`)
- [ ] [`package-catalog.md`](../specs/00-foundation/package-catalog.md) — B1
- [ ] Sau lô: `pnpm lint:specs 2>&1 | grep -F "[C17]" | wc -l` giảm đúng 14

## Lô 2 — `01-platform`, 6 file / 9 hàng

- [ ] [`content-search.md`](../specs/01-platform/content-search.md) — B2
- [ ] [`game-template-contract.md`](../specs/01-platform/game-template-contract.md) — A2
- [ ] [`offline-play.md`](../specs/01-platform/offline-play.md) — A1+B1
- [ ] [`backup-and-restore.md`](../specs/01-platform/backup-and-restore.md) — B1
- [ ] [`data-model-overview.md`](../specs/01-platform/data-model-overview.md) — B1
- [ ] [`pwa-install.md`](../specs/01-platform/pwa-install.md) — B1
- [ ] Sau lô: `C17` giảm đúng 9

## Lô 3 — `02-public`, 7 file / 11 hàng

- [ ] [`landing-page.md`](../specs/02-public/landing-page.md) — A2
- [ ] [`seo-and-structured-data.md`](../specs/02-public/seo-and-structured-data.md) — A2
- [ ] [`legal-pages.md`](../specs/02-public/legal-pages.md) — A1+C2
- [ ] [`cookie-and-consent-banner.md`](../specs/02-public/cookie-and-consent-banner.md) — A1
- [ ] [`faq-and-help.md`](../specs/02-public/faq-and-help.md) — A1
- [ ] [`game-catalog-public.md`](../specs/02-public/game-catalog-public.md) — A1
- [ ] [`game-detail-public.md`](../specs/02-public/game-detail-public.md) — A1
- [ ] Sau lô: `C17` giảm đúng 11

## Lô 4 — `03-account`, 9 file / 14 hàng

- [ ] [`basic-report.md`](../specs/03-account/basic-report.md) — A2
- [ ] [`child-profile-crud.md`](../specs/03-account/child-profile-crud.md) — A1+C1
- [ ] [`consent-management.md`](../specs/03-account/consent-management.md) — A1+B1
- [ ] [`social-account-linking.md`](../specs/03-account/social-account-linking.md) — A1+B1
- [ ] [`social-login.md`](../specs/03-account/social-login.md) — A1+D1
- [ ] [`child-profile-archive.md`](../specs/03-account/child-profile-archive.md) — C1
- [ ] [`child-profile-switching.md`](../specs/03-account/child-profile-switching.md) — B1
- [ ] [`member-dashboard.md`](../specs/03-account/member-dashboard.md) — B1
- [ ] [`my-library.md`](../specs/03-account/my-library.md) — B1

## Cổng dừng B — giữa đường

- [ ] `C17` giảm đúng 48 so với mốc bước 1
- [ ] Đọc lại 5 hàng nhóm A đã đóng bất kỳ: câu trả lời nằm ở cột `Câu hỏi`, không bị bỏ rơi
- [ ] Mọi mã `D-*` mới cấp xuất hiện đúng một lần: `grep -rhoE "D-B[A-Z]" docs/specs | sort | uniq -c | awk '$1>1'`
- [ ] `pnpm check && pnpm test` xanh

---

## Lô 5 — `04-play`, 11 file / 22 hàng

Lô nặng nhất, gần như toàn nhóm A.

- [ ] [`healthy-play-limits.md`](../specs/04-play/healthy-play-limits.md) — A2+B1
- [ ] [`feedback-and-celebration.md`](../specs/04-play/feedback-and-celebration.md) — A2
- [ ] [`play-entry-and-profile-select.md`](../specs/04-play/play-entry-and-profile-select.md) — A2
- [ ] [`play-event-ingestion.md`](../specs/04-play/play-event-ingestion.md) — A2
- [ ] [`play-session-lifecycle.md`](../specs/04-play/play-session-lifecycle.md) — A2
- [ ] [`game-config-delivery.md`](../specs/04-play/game-config-delivery.md) — A1+B1
- [ ] [`scoring-and-result.md`](../specs/04-play/scoring-and-result.md) — A1+B1
- [ ] [`parent-gate.md`](../specs/04-play/parent-gate.md) — C1+D1
- [ ] [`scaffolding-and-hints.md`](../specs/04-play/scaffolding-and-hints.md) — D2
- [ ] [`next-game-recommendation.md`](../specs/04-play/next-game-recommendation.md) — B2
- [ ] [`curriculum-player.md`](../specs/04-play/curriculum-player.md) — B1
- [ ] Sau mỗi 5 file: `pnpm lint:specs 2>&1 | tail -2` — 0 lỗi, `C17` giảm đúng số hàng đã làm

## Lô 6 — `08-quality`, 3 file / 6 hàng

- [ ] [`accessibility.md`](../specs/08-quality/accessibility.md) — A1+B1
- [ ] [`design-system-contract.md`](../specs/08-quality/design-system-contract.md) — A2
- [ ] [`performance-budgets.md`](../specs/08-quality/performance-budgets.md) — A1+B1

## Cổng dừng C — hết nợ

- [ ] `pnpm lint:specs 2>&1 | tail -2` — **0 lỗi, 0 cảnh báo**
- [ ] Không ô `Chủ` nào ngoài bộ đóng:
      `grep -rh "^| [0-9~]" docs/specs --include="*.md" | awk -F'|' 'NF>=6 {print $6}' | sed 's/^ *//;s/ *$//' | sort -u`
- [ ] `pnpm check && pnpm test` xanh

---

## Bước cuối — `C17` chặng 2 và tài liệu

Thứ tự bắt buộc, không đảo:

- [ ] Thêm ca âm chặng 2: spec giả `approved` với `Chủ` sai → đúng một `fail`; spec `draft` cùng lỗi → `warn`
- [ ] `pnpm test scripts/tests/lint-specs.test.ts` — **phải đỏ**
- [ ] Sửa `checkC17`: `fail` khi `status: approved`, giữ `warn` khi `draft`
- [ ] Chạy test — **phải xanh**
- [ ] Xoá thân nhánh vừa thêm, chạy lại test — **phải đỏ trở lại**
- [ ] Khôi phục; `pnpm lint:specs` — 0 lỗi, 0 cảnh báo với cổng mới
- [ ] Commit `feat(scripts): T13 — C17 chặng 2, Chủ ngoài bộ đóng là lỗi`
- [ ] [`CONVENTIONS.md`](../specs/CONVENTIONS.md): thêm bộ giá trị `Chủ` (kế hoạch mục 3) + khuôn đóng một hàng
- [ ] [`CORPUS-CLOSURE.md`](CORPUS-CLOSURE.md): cập nhật số câu hỏi mở thật sau khi trừ nhóm A
- [ ] Commit `docs: T13 — chốt bộ giá trị Chủ vào quy ước`

## Cổng dừng cuối

- [ ] `pnpm lint:specs` 0 lỗi, 0 cảnh báo
- [ ] `pnpm check && pnpm test && pnpm check:services` xanh
- [ ] Ca âm `C17` cả hai chặng tồn tại và đã chứng minh đỏ → xanh → đỏ
- [ ] Số câu hỏi mở in ở [`CORPUS-CLOSURE.md`](CORPUS-CLOSURE.md) khớp lệnh đếm ở kế hoạch mục 10
