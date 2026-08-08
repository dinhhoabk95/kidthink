---
doc: CORPUS-CLOSURE
title: Đóng corpus spec — bản đồ tuần tự tới 130/130
---

# Đóng corpus spec — bản đồ tuần tự tới 130/130

> Viết 2026-08-08, đo tại commit [`3dbebdd`](https://github.com/org/repo/commit/3dbebdd). File này là **bản đồ liên task**, không phải task.
> Nó trả lời đúng một câu: từ trạng thái hôm nay tới lúc mọi spec của dự án `approved` thì còn
> bao nhiêu việc, xếp theo thứ tự nào, và chỗ nào chặn bởi người.
>
> Task hoàn tất: [`09-p2-spec-closure-plan.md`](09-p2-spec-closure-plan.md) (P2).
> Task tiếp theo: [`10-p3-spec-closure-plan.md`](10-p3-spec-closure-plan.md) ·
> [`11-p4-p5-closure-plan.md`](11-p4-p5-closure-plan.md) ·
> [`12-corpus-debt-sweep-plan.md`](12-corpus-debt-sweep-plan.md).

## "Xong" nghĩa là gì

Bốn điều kiện, thiếu một điều là chưa xong:

1. 130/130 spec `status: approved`.
2. `pnpm lint:specs` — 0 lỗi **và 0 cảnh báo**.
3. `checkC16` chạy chặng 2: bảng mục 11 dưới 5 cột là **`fail`**, không phải `warn`. Cổng tự
   giữ corpus sau này, không phụ thuộc người nhớ.
4. Mọi câu hỏi mở còn lại có `Chặn phase` và `Chủ` không rỗng — kể cả khi câu trả lời là
   "hoãn". Corpus được phép còn câu hỏi; nó không được phép còn câu hỏi **vô chủ**.

Điều kiện 4 là chỗ làm cho 130/130 khả thi mà không chờ quyết định tiền: tiền lệ đã có ở
[`content-versioning.md`](../specs/00-foundation/content-versioning.md) mục 11 — spec `approved`
mang hai hàng `hoãn` với chủ ghi rõ.

## Số đo hiện tại (sau Task #11, trước Task #12)

| Đo | Giá trị |
|---|---|
| Spec trong corpus | 130 |
| `approved` | 130 (100% corpus closed) |
| `draft` | 0 |
| `pnpm lint:specs` | 0 lỗi, **31** cảnh báo = 8 `C6` + 23 `C16` |
| Cảnh báo nằm trên spec đã `approved` từ task cũ | 31 nợ thuộc phạm vi dọn sạch của Task #12 |

Task #10 đang chạy nên các số này giảm liên tục. Đo lại trước mỗi task, đừng tin số in ở đây:

```
export PATH=/Users/macbook/.nvm/versions/node/v24.15.0/bin:$PATH
pnpm lint:specs 2>&1 | tail -2
pnpm lint:specs 2>&1 | grep -oE "\[C[0-9]+\]" | sort | uniq -c
grep -rl "^status: draft$" --include="*.md" docs/specs | xargs grep -l "^spec: " | wc -l
```

Mã quyết định `D-*` là sổ liên task. Mã lớn nhất đang dùng là `D-BE`. Task #9 còn đang tiêu mã,
nhiều khi tiêu tới `D-BJ`, nên **không** hardcode mã trong todo; lấy mã kế tiếp lúc làm:

```
grep -rhoE "D-B[A-Z]" docs/specs docs/tasks | sort -u | tail -1
```

## Bốn task còn lại

| Task | Phạm vi | Số spec | Chặn bởi |
|---|---|---|---|
| #9 (đang chạy) | 26 spec `phase: P2` | 26 | Cổng dừng A cần một phiên với chủ dự án (6 câu về tiền, hạ tầng, năng lực review) |
| #10 | 12 spec `phase: P3` — adaptive, curriculum, lesson, activity | 12 | [`adaptive-engine.md`](../specs/01-platform/adaptive-engine.md) phải đi trước 3 spec khác; không chặn bởi #9 |
| #11 | 8 spec `phase: P4` + 1 spec `phase: P5` | 9 | 5 spec trong lô chặn bởi #10; 9 trong 22 câu hỏi mở là quyết định giá và quota |
| #12 | Nợ cảnh báo trên spec đã `approved`, rồi lật `C16` sang `fail` | 0 spec mới | Phải chạy **sau** #9, #10, #11 |

Thứ tự bắt buộc: #12 cuối cùng. #10 và #9 độc lập nhau (không spec P3 nào `depends_on` một spec
P2 còn `draft`) nên chạy song song được nếu có hai người. #11 phải sau #10 ở phần lớn lô.

## Đồ thị phụ thuộc — 5 đợt

Tính bằng `depends_on` của frontmatter, luật `C8` (spec `approved` thì `depends_on` cũng phải
`approved`). Trong cùng một đợt thì thứ tự tự do.

| Đợt | Spec P3 | Spec P4/P5 |
|---|---|---|
| 1 | [`adaptive-engine.md`](../specs/01-platform/adaptive-engine.md) · [`activity-model.md`](../specs/05-content/activity-model.md) | [`ai-credit-ledger.md`](../specs/07-addon/ai-credit-ledger.md) · [`custom-game-builder.md`](../specs/07-addon/custom-game-builder.md) · [`pwa-install.md`](../specs/01-platform/pwa-install.md) |
| 2 | [`advanced-report.md`](../specs/03-account/advanced-report.md) · [`progress-and-mastery.md`](../specs/04-play/progress-and-mastery.md) · [`lesson-model.md`](../specs/05-content/lesson-model.md) · [`activity-authoring.md`](../specs/06-admin/activity-authoring.md) | [`ai-assistant.md`](../specs/07-addon/ai-assistant.md) · [`lesson-plan-creator.md`](../specs/07-addon/lesson-plan-creator.md) |
| 3 | [`curriculum-model.md`](../specs/05-content/curriculum-model.md) · [`lesson-authoring.md`](../specs/06-admin/lesson-authoring.md) | [`pdf-export.md`](../specs/07-addon/pdf-export.md) · [`semantic-search.md`](../specs/07-addon/semantic-search.md) |
| 4 | [`program-showcase.md`](../specs/02-public/program-showcase.md) · [`curriculum-player.md`](../specs/04-play/curriculum-player.md) · [`curriculum-builder.md`](../specs/06-admin/curriculum-builder.md) | [`worksheet-model.md`](../specs/05-content/worksheet-model.md) · [`personal-curriculum.md`](../specs/07-addon/personal-curriculum.md) |
| 5 | [`next-game-recommendation.md`](../specs/04-play/next-game-recommendation.md) | — |

Ba spec P4 ở đợt 1 ([`ai-credit-ledger.md`](../specs/07-addon/ai-credit-ledger.md), [`custom-game-builder.md`](../specs/07-addon/custom-game-builder.md), [`pwa-install.md`](../specs/01-platform/pwa-install.md)) không có
`depends_on` nào còn `draft` — làm được ngay, không cần đợi #10.

## Câu hỏi cần chủ dự án — gom một chỗ

Đây là toàn bộ chỗ mà agent **không** được tự chốt. Gom lại để hỏi theo lô, không hỏi lẻ.

| Nhóm | Câu | Chặn |
|---|---|---|
| Giá và quota | Giá `standard`/`premium` (Task #9) · giá gói credit · tỉ lệ trừ credit mỗi loại lời gọi · giá [`lesson-plan-creator.md`](../specs/07-addon/lesson-plan-creator.md) bán tháng hay năm · quota `custom_games_saved` · quota giáo án/tháng · quota export/tháng · quota lộ trình lưu | Lên catalog — 9 hàng, Task #11 |
| AI | Provider và model nào (chất lượng tiếng Việt, chi phí) · embedding model quyết định `N` của cột `vector` | [`ai-assistant.md`](../specs/07-addon/ai-assistant.md) · [`semantic-search.md`](../specs/07-addon/semantic-search.md), và `N` chặn **migration schema** |
| Pháp lý | Có cần DPA với provider AI dù không gửi PII | [`ai-assistant.md`](../specs/07-addon/ai-assistant.md) |
| Hạ tầng | Puppeteer khoảng 300MB RAM mỗi instance — chạy nổi trên t3.small cùng web và worker? · CDN trước S3 ngay hay sau | [`pdf-export.md`](../specs/07-addon/pdf-export.md) + [`worksheet-model.md`](../specs/05-content/worksheet-model.md) (cùng một câu, hỏi một lần) · [`image-storage.md`](../specs/01-platform/image-storage.md) Q2 |
| Năng lực người | Ai biên soạn ≥60 lesson (nền sư phạm mầm non) — cùng câu với nợ `D-W` ở [`mvp-scope.md`](../specs/00-foundation/mvp-scope.md) Q1 · năng lực đọc review mỗi ngày | [`lesson-model.md`](../specs/05-content/lesson-model.md) + [`lesson-authoring.md`](../specs/06-admin/lesson-authoring.md) (cùng một câu) · Task #9 |
| Phạm vi nội dung | 42 tuần cần khoảng 126 buổi, MVP có ≥60 lesson nên mỗi lesson dùng lại 2 lần — chấp nhận không | [`curriculum-model.md`](../specs/05-content/curriculum-model.md) + [`curriculum-builder.md`](../specs/06-admin/curriculum-builder.md) (cùng một câu) |

Không câu nào trong bảng này chặn `approved`, miễn hàng câu hỏi ghi đủ `Chặn phase` và `Chủ`.

## Cặp câu hỏi trùng — chốt một lần, áp hai chỗ

Đếm 84 câu hỏi mở theo **hàng bảng** là đếm quá số việc thật. Sáu cặp sau là cùng một câu:

| Câu | Hai chỗ |
|---|---|
| Ghim version hay lấy bản published mới nhất | [`curriculum-player.md`](../specs/04-play/curriculum-player.md) Q1 · [`curriculum-builder.md`](../specs/06-admin/curriculum-builder.md) Q1 · [`lesson-authoring.md`](../specs/06-admin/lesson-authoring.md) Q2 — **đã đóng** ở [`content-versioning.md`](../specs/00-foundation/content-versioning.md) Q2 (`D-AE`), ba chỗ này chỉ cần trỏ tới |
| Ai biên soạn ≥60 lesson | [`lesson-model.md`](../specs/05-content/lesson-model.md) Q1 · [`lesson-authoring.md`](../specs/06-admin/lesson-authoring.md) Q1 |
| 42 tuần / 126 buổi so với ≥60 lesson | [`curriculum-model.md`](../specs/05-content/curriculum-model.md) Q1 · [`curriculum-builder.md`](../specs/06-admin/curriculum-builder.md) Q2 |
| Skill C5 cần người lớn chấm — luồng nào | [`adaptive-engine.md`](../specs/01-platform/adaptive-engine.md) Q3 · [`progress-and-mastery.md`](../specs/04-play/progress-and-mastery.md) Q1 |
| Puppeteer trên t3.small | [`worksheet-model.md`](../specs/05-content/worksheet-model.md) Q1 · [`pdf-export.md`](../specs/07-addon/pdf-export.md) Q1 |
| Tỉ lệ trừ credit | [`ai-assistant.md`](../specs/07-addon/ai-assistant.md) Q2 · [`ai-credit-ledger.md`](../specs/07-addon/ai-credit-ledger.md) Q1 |

Cộng thêm [`adaptive-engine.md`](../specs/01-platform/adaptive-engine.md) Q2 — nó là **câu trả lời** cho
[`taxonomy-service.md`](../specs/01-platform/taxonomy-service.md) Q3, spec đó ghi rõ "chốt lúc
[`adaptive-engine.md`](../specs/01-platform/adaptive-engine.md) thiết kế (P3)". Nghĩa là Task #10 phải đóng một câu hỏi nằm trên spec **đã**
`approved`, không chỉ trên spec của lô mình.

## Rủi ro xuyên task

| Rủi ro | Ảnh hưởng | Giảm thiểu |
|---|---|---|
| Hai session sửa corpus cùng lúc (đang xảy ra: Task #9 chạy song song với việc lập kế hoạch này) | Số cảnh báo trong todo lệch ngay khi viết; hai người tiêu cùng một mã `D-*` | Cổng viết theo delta từng mã kiểm tra, không theo tổng; mã `D-*` lấy bằng lệnh lúc làm |
| Approve spec P4 khi giá và quota chưa chốt | Số giả lọt vào seed rồi ra production | Hàng câu hỏi giữ `Chủ: người quyết`; mọi hằng số giá dùng tên kiểu `PENDING_*` như Task #7 đã làm |
| [`semantic-search.md`](../specs/07-addon/semantic-search.md) chốt `N` của cột `vector` sai | Đổi `N` là đổi migration, không phải đổi config | Không approve phần schema vector tới khi có provider; giữ câu hỏi ở trạng thái chặn migration |
| Lật `C16` sang `fail` trước khi dọn 24 spec `approved` | Pipeline đỏ toàn bộ, không ai push được | Task #12 dọn trước, lật sau — đúng thiết kế hai chặng ở [`09-p2-spec-closure-plan.md`](09-p2-spec-closure-plan.md) mục 8 |
| Đếm việc theo số hàng câu hỏi | Ước lượng phồng khoảng 15 phần trăm | Trừ 6 cặp trùng ở trên trước khi ước lượng |
