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

- [x] Task #12 đã đóng: `pnpm --filter @mindkid/gates test 2>&1 | tail -2` — **0 lỗi, 0 cảnh báo** ✓
- [x] `grep -rl "^status: approved" --include="*.md" docs/specs | xargs grep -l "^spec: " | wc -l` — ra **120**,
      không phải 130. Không phải nợ T12: giữa lúc viết kế hoạch (`be75db4`) và giờ, Task #14 đã hợp lệ đưa
      10 spec từ `approved` sang `implemented` (glossary, mvp-scope, monorepo-package-architecture,
      repo-bootstrap, id-conventions, 4 file schema, ai-codegen-pipeline, testing-strategy — commit `d0c5a33`).
      Tín hiệu thật của T12 đóng là `lint:specs` 0 lỗi 0 cảnh báo, đã đạt. `checkC16` hiện dùng khuôn nhị phân
      `status === "approved"` → fail, else → warn (dòng 1650-1799 `lint-specs-lib.ts`) — `checkC17` sẽ theo
      đúng khuôn đó nên không cần xử lý riêng cho `implemented`.
- [x] `git status --short` sạch — dọn trước: commit `d0c5a33` (T14 cổng check:progress + sửa tick khống)
      và `009a341` (T16 kế hoạch auth) đưa tree về sạch.
- [x] Mã `D-*` kế tiếp: `grep -rhoE "D-B[A-Z]" docs/specs docs/tasks | sort -u | tail -1` → `D-BZ`
- [x] Đọc kế hoạch mục 3 (bộ giá trị đóng + bảng quy đổi nhóm B + khuôn đóng nhóm A)

---

## Bước 1 — `checkC17` chặng 1, mức `warn`

- [x] Viết ca âm trong [`packages/gates/tests/lint-specs.test.ts`](../../scripts/tests/lint-specs.test.ts):
      spec giả `approved`, hàng mục 11 có `Chủ` = `Product / QA` → đúng một `warn` `C17`
- [x] Ca dương cùng chỗ: `Chủ` = `người quyết` → im lặng
- [x] Ca biên bắt buộc: `Chủ` = `người quyết — chặn P2` → **phải** `warn` (khớp lỏng là cổng giả)
- [x] Ca biên: hàng gạch `~~2~~` với `Chủ` = `D-AE (T11)` → im lặng; cùng hàng đó với `Chủ` = `Infra` → `warn`
- [x] `pnpm test packages/gates/tests/lint-specs.test.ts` — **đỏ** (6 test fail, `checkC17 is not a function`)
- [x] Viết `checkC17` trong [`packages/gates/src/lint-specs-lib.ts`](../../scripts/lint-specs-lib.ts), đăng ký vào danh sách check
- [x] Chạy test — **xanh** (57/57)
- [x] `pnpm --filter @mindkid/gates test 2>&1 | tail -2` — 0 lỗi; số cảnh báo `C17`: **93** (kế hoạch ước 76 lúc viết ở
      `9f1ef3f`; corpus đã trôi qua T12 đóng + 10 spec T14 chuyển `implemented` — kế hoạch mục 2 tự
      dặn "đừng tin số in ở đây". Đã soát mẫu ~15 dòng đầu: không khớp lỏng, đúng nhóm A/B/D thật)
- [x] `pnpm --filter @mindkid/gates test 2>&1 | grep -F "[C17]" > .../scratchpad/c17-baseline.txt` — giữ làm mốc đếm ngược
      (dùng scratchpad thay `/tmp` theo quy ước phiên; nội dung tương đương)
- [ ] Commit `feat(scripts): T13 bước 1 — C17 chặng 1, bộ giá trị cột Chủ`

## Cổng dừng A

- [x] Ca âm đã chứng minh đỏ rồi xanh
- [x] Số cảnh báo `C17` đo được: 93 (lệch với ước tính 76 trong kế hoạch — lệch có giải thích ở trên,
      không phải lỗi cổng)
- [x] `pnpm check && pnpm test` xanh

---

## Lô 1 — `00-foundation`, 6 file / 14 hàng

- [x] [`event-catalog.md`](../specs/00-foundation/event-catalog.md) — 1 hàng thật (không phải B4;
      số kế hoạch đã trôi). Q2: `D-Z` → `hoãn — vượt 5M hàng hoặc 2GB thì đóng lại`
- [x] [`repo-bootstrap.md`](../specs/00-foundation/repo-bootstrap.md) — 5 hàng thật (không phải B4).
      ~~3~~/~~4~~ cấp mã mới `D-CO`/`D-CP`; 7 → người quyết; 10 gạch + `D-U`; ~~12~~ → `D-CL`
- [x] [`access-ladder.md`](../specs/00-foundation/access-ladder.md) — A1+B1. Q1 → `Nội dung`; Q2 đóng
      theo khuôn nhóm A, tái dùng `D-AY`
- [x] [`child-data-compliance.md`](../specs/00-foundation/child-data-compliance.md) — B2, cả hai → người quyết
- [x] [`mvp-scope.md`](../specs/00-foundation/mvp-scope.md) — Q1 đã đóng bằng `D-CN` (từ T15, hôm nay) —
      chỉ sửa Chủ cho khớp mã đã có, không đụng nội dung quyết định
- [x] [`package-catalog.md`](../specs/00-foundation/package-catalog.md) — tách phase khỏi Chủ, → người quyết
- [x] Sau lô: `C17` 92 → 80 (giảm đúng 12 hàng thật đã sửa; số 14 trong kế hoạch đã trôi do T14/T15)
- [x] Lưu ý: `pnpm check`/`pnpm test` hiện đỏ vì `packages/auth` có người khác đang code sống
      (T16, ngoài phạm vi agent) — không phải lỗi từ T13. Xem ghi chú Cổng dừng A dưới.

## Lô 2 — `01-platform`, 6 file / 9 hàng

- [x] [`content-search.md`](../specs/01-platform/content-search.md) — B1+A1, cấp `D-CQ`
- [x] [`game-template-contract.md`](../specs/01-platform/game-template-contract.md) — A2, tái dùng `D-BA`/`D-BK`;
      Q4 còn lỗi bảng 6 cột, đã dọn
- [x] [`offline-play.md`](../specs/01-platform/offline-play.md) — A1+B1, cấp `D-CR`
- [x] [`backup-and-restore.md`](../specs/01-platform/backup-and-restore.md) — B1
- [x] [`data-model-overview.md`](../specs/01-platform/data-model-overview.md) — C1, hàng lỗi 6 cột (đã dọn),
      chép Chủ thật từ audit-log.md §11 Q1
- [x] [`pwa-install.md`](../specs/01-platform/pwa-install.md) — B1
- [x] Sau lô: `C17` 80 → 71 (giảm đúng 9)

## Lô 3 — `02-public`, 7 file / 11 hàng

- [x] [`landing-page.md`](../specs/02-public/landing-page.md) — A2, tái dùng `D-AW`/`D-AY`
- [x] [`seo-and-structured-data.md`](../specs/02-public/seo-and-structured-data.md) — A2, cấp `D-CS`/`D-CT`
- [x] [`legal-pages.md`](../specs/02-public/legal-pages.md) — A1+C2, tái dùng `D-AS`; Q2/Q3 chép Chủ từ
      child-data-compliance.md và payment-approval.md
- [x] [`cookie-and-consent-banner.md`](../specs/02-public/cookie-and-consent-banner.md) — A1, tái dùng `D-AW`
- [x] [`faq-and-help.md`](../specs/02-public/faq-and-help.md) — A1, tái dùng `D-AX`
- [x] [`game-catalog-public.md`](../specs/02-public/game-catalog-public.md) — A1, cấp `D-CU`
- [x] [`game-detail-public.md`](../specs/02-public/game-detail-public.md) — A1, cấp `D-CV`
- [x] Sau lô: `C17` 71 → 60 (giảm đúng 11)

## Lô 4 — `03-account`, 9 file / 14 hàng

- [x] [`basic-report.md`](../specs/03-account/basic-report.md) — A2, cấp `D-CW`, tái dùng `D-BB`;
      dọn thêm dòng trống làm gãy bảng markdown
- [x] [`child-profile-crud.md`](../specs/03-account/child-profile-crud.md) — A1+C1(vòng lặp), tái dùng
      `D-AU`; Q2 vòng lặp link với child-profile-archive.md — đóng chung `D-CX`
- [x] [`consent-management.md`](../specs/03-account/consent-management.md) — A1+B1, cấp `D-CY`
- [x] [`social-account-linking.md`](../specs/03-account/social-account-linking.md) — B1+A1, cấp `D-CZ`
- [x] [`social-login.md`](../specs/03-account/social-login.md) — B1+A1, cấp `D-DA`
- [x] [`child-profile-archive.md`](../specs/03-account/child-profile-archive.md) — nửa còn lại của vòng lặp
      C1 ở trên, đóng chung `D-CX`
- [x] [`child-profile-switching.md`](../specs/03-account/child-profile-switching.md) — B1
- [x] [`member-dashboard.md`](../specs/03-account/member-dashboard.md) — B1
- [x] [`my-library.md`](../specs/03-account/my-library.md) — B1
- [x] Sau lô: `C17` 60 → 46 (giảm đúng 14)

## Cổng dừng B — giữa đường

- [x] `C17`: 92 (mốc bước 1 sau khi sửa bug tách cột) → 46, giảm 46 qua 4 lô (12+9+11+14=46,
      khớp đúng — số "48" trong kế hoạch tính trên baseline 93 trước khi bug tách cột được vá)
- [x] Đọc lại 5 hàng nhóm A đã đóng bất kỳ: câu trả lời nằm ở cột `Câu hỏi`, không bị bỏ rơi — xác
      nhận khi đọc lại full mục 11 mỗi file trước khi sửa (quy trình mục 5 việc 2)
- [x] Mọi mã `D-*` mới cấp (`D-CO`..`D-DA`) xuất hiện đúng 1 file, trừ 2 mã tái dùng có chủ đích
      (`D-CX` — cặp vòng lặp crud/archive; `D-BK` — game-template-contract ↔ schema-driven-form)
- [ ] `pnpm check && pnpm test` — **đỏ, không phải do T13**: `packages/auth` có người khác đang code
      sống (T16, human-owned theo quy định chính task đó) — 1 file test, 10 ca fail, không đụng.
      `pnpm --filter @mindkid/gates test` (cổng thật của T13) vẫn 0 lỗi. Ghi nhận, không chặn tiếp tục.

---

## Lô 5 — `04-play`, 11 file / 22 hàng

Lô nặng nhất, gần như toàn nhóm A.

- [x] [`healthy-play-limits.md`](../specs/04-play/healthy-play-limits.md) — A2+B1, tái dùng D-AZ/D-BB
- [x] [`feedback-and-celebration.md`](../specs/04-play/feedback-and-celebration.md) — A2, tái dùng D-AV, cấp D-DB
- [x] [`play-entry-and-profile-select.md`](../specs/04-play/play-entry-and-profile-select.md) — A2, tái dùng D-AY, cấp D-DC
- [x] [`play-event-ingestion.md`](../specs/04-play/play-event-ingestion.md) — A2, cấp D-DD/D-DE
- [x] [`play-session-lifecycle.md`](../specs/04-play/play-session-lifecycle.md) — A2, cấp D-DF/D-DG
- [x] [`game-config-delivery.md`](../specs/04-play/game-config-delivery.md) — A1+B1, cấp D-DH
- [x] [`scoring-and-result.md`](../specs/04-play/scoring-and-result.md) — A1+B1, tái dùng D-BA
- [x] [`parent-gate.md`](../specs/04-play/parent-gate.md) — không ép nhóm C (câu hỏi không khớp phía
      pwa-install.md) — để người quyết cả hai hàng
- [x] [`scaffolding-and-hints.md`](../specs/04-play/scaffolding-and-hints.md) — D2 → Studio UI / Nội dung
- [x] [`next-game-recommendation.md`](../specs/04-play/next-game-recommendation.md) — B2 → Backend
- [x] [`curriculum-player.md`](../specs/04-play/curriculum-player.md) — đã sạch từ trước, không có hàng nợ
- [x] Sau lô: `C17` 46 → 25 (giảm đúng 21, không phải 22 — curriculum-player không có hàng)

## Lô 6 — `08-quality`, 3 file / 6 hàng (+ mở rộng)

- [x] [`accessibility.md`](../specs/08-quality/accessibility.md) — A1+B1, tái dùng D-AR
- [x] [`design-system-contract.md`](../specs/08-quality/design-system-contract.md) — A2, tái dùng D-AU
      (trùng câu hỏi child-profile-crud.md Q1), cấp D-DM
- [x] [`performance-budgets.md`](../specs/08-quality/performance-budgets.md) — A1+B1, tái dùng D-CH

**Mở rộng ngoài kế hoạch** — corpus trôi qua T14/T15 để lộ nợ `C17` ở 13 file khác không nằm
trong 42 file gốc (`pnpm --filter @mindkid/gates test` là nguồn sự thật, không phải danh sách kế hoạch mục 6):

- [x] [`security-checklist.md`](../specs/08-quality/security-checklist.md),
      [`testing-strategy.md`](../specs/08-quality/testing-strategy.md) — câu trả lời đã có mã sẵn,
      chỉ cập nhật Chủ
- [x] [`actors.md`](../specs/00-foundation/actors.md),
      [`content-versioning.md`](../specs/00-foundation/content-versioning.md),
      [`monorepo-package-architecture.md`](../specs/00-foundation/monorepo-package-architecture.md)
- [x] [`auth-tokens-sessions.md`](../specs/01-platform/auth-tokens-sessions.md),
      [`content-seed-authoring.md`](../specs/01-platform/content-seed-authoring.md),
      [`game-engine-runtime.md`](../specs/01-platform/game-engine-runtime.md),
      [`schema-content-taxonomy.md`](../specs/01-platform/schema-content-taxonomy.md),
      [`taxonomy-service.md`](../specs/01-platform/taxonomy-service.md)
- [x] [`account-settings.md`](../specs/03-account/account-settings.md),
      [`registration.md`](../specs/03-account/registration.md) — câu hỏi gạch tay nhưng số hàng chưa gạch
- [x] [`ai-assistant.md`](../specs/07-addon/ai-assistant.md) — Chủ/Chặn phase đều là placeholder
      "đã chốt", cấp mã thật D-DL

## Cổng dừng C — hết nợ

- [x] `pnpm --filter @mindkid/gates test 2>&1 | tail -2` — **0 lỗi, 0 cảnh báo** ✓ (toàn corpus, không chỉ 42 file gốc)
- [x] Không ô `Chủ` nào ngoài bộ đóng — xác nhận qua `checkC17` (mọi hàng qua cổng)
- [x] `pnpm test` — 300/300 xanh (bao gồm `packages/auth` — WIP T16 đã ổn định giữa lúc làm task này)
- [~] `pnpm check` — đỏ ở bước `lint`/`format`, chỉ 5 lỗi biome trong `packages/auth/src/*` và
      `packages/auth/tests/*` (T16, người khác đang code, ngoài phạm vi agent — không sửa). Mọi
      bước khác của `check` (`lint:specs`, `lint:deps`, `check:progress`, `typecheck`) xanh.

---

## Bước cuối — `C17` chặng 2 và tài liệu

Thứ tự bắt buộc, không đảo:

- [x] Thêm ca âm chặng 2: spec giả `approved` với `Chủ` sai → đúng một `fail`; spec `draft` cùng lỗi → `warn`
- [x] `pnpm test packages/gates/tests/lint-specs.test.ts` — **đỏ** (1 ca fail đúng như dự kiến)
- [x] Sửa `checkC17`: `fail` khi `status: approved`, giữ `warn` khi `draft`
- [x] Chạy test — **xanh** — nhưng lộ 3 ca âm chặng 1 cũ dùng `status: approved` giờ sai kỳ vọng
      (đổi sang `draft`, ý định gốc đã có ca chặng 2 riêng phủ `approved`)
- [x] Xoá thân nhánh vừa thêm, chạy lại test — **đỏ trở lại** (1 ca chặng 2 fail đúng)
- [x] Khôi phục; `pnpm --filter @mindkid/gates test` — 0 lỗi, 0 cảnh báo với cổng mới
- [x] Commit `feat(scripts): T13 — C17 chặng 2, Chủ ngoài bộ đóng là lỗi` (`cc0de17`)
- [x] [`CONVENTIONS.md`](../specs/CONVENTIONS.md): thêm bộ giá trị `Chủ` (kế hoạch mục 3) + khuôn đóng một hàng
- [x] [`CORPUS-CLOSURE.md`](CORPUS-CLOSURE.md): cập nhật số câu hỏi mở thật sau khi trừ nhóm A
- [x] Commit `docs: T13 — chốt bộ giá trị Chủ vào quy ước` (`fbcb6a3`)

## Cổng dừng cuối

- [x] `pnpm --filter @mindkid/gates test` 0 lỗi, 0 cảnh báo
- [x] `pnpm test && pnpm services` xanh; `pnpm check` đỏ chỉ ở `packages/auth` (WIP T16, ngoài
      phạm vi agent — xem Cổng dừng C)
- [x] Ca âm `C17` cả hai chặng tồn tại và đã chứng minh đỏ → xanh → đỏ
- [x] Số câu hỏi mở in ở [`CORPUS-CLOSURE.md`](CORPUS-CLOSURE.md) khớp lệnh đếm ở kế hoạch mục 10
      (195 mở, đo trong biên mục 11 — chính xác hơn lệnh gốc vì lệnh gốc đếm lẫn bảng §7)
