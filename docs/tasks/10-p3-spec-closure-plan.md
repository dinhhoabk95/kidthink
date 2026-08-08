---
doc: 10-P3-SPEC-CLOSURE-PLAN
title: Kế hoạch — Task #10: Đóng corpus spec P3 (12 spec)
---

# Kế hoạch — Task #10: Đóng corpus spec P3 (12 spec)

> Viết 2026-08-08, đo tại commit `3dbebdd`. Checklist thực thi:
> [`10-p3-spec-closure-todo.md`](10-p3-spec-closure-todo.md). Bản đồ liên task:
> [`CORPUS-CLOSURE.md`](CORPUS-CLOSURE.md).
>
> Task #9 ([`09-p2-spec-closure-plan.md`](09-p2-spec-closure-plan.md)) đang chạy trên lô P2.
> Hai task **không** chặn nhau: không spec P3 nào `depends_on` một spec P2 còn `draft`. Nếu chạy
> song song hai session thì chỉ tranh nhau hai thứ — số cảnh báo lint và mã `D-*`; cả hai đều xử
> lý bằng cách đo lúc làm, xem mục 0.
>
> Mọi lệnh chạy từ `kidthink/`. Đặt lại Node mỗi phiên shell mới:
>
> ```
> export PATH=/Users/macbook/.nvm/versions/node/v24.15.0/bin:$PATH
> ```

## Tóm tắt

12 spec `phase: P3` đang `draft`: động cơ adaptive, ba model nội dung (activity, lesson,
curriculum), ba màn soạn tương ứng, ba màn chơi theo lộ trình, một trang giới thiệu chương
trình, một báo cáo nâng cao. Đây là lô **đường học** — nó quyết định trẻ gặp gì tiếp theo, nên
sai ở đây không phát hiện bằng test mà bằng dữ liệu học lệch sau nhiều tuần.

Số việc thật: 25 cảnh báo `C6`, 12 bảng mục 11 phải chuyển sang 5 cột, 22 hàng câu hỏi mở —
trong đó **7 hàng là ba câu hỏi trùng nhau hoặc đã có câu trả lời ở chỗ khác**, nên số quyết
định mới cần ra chỉ khoảng 15.

Lô này còn phải đóng một câu hỏi nằm trên spec **đã** `approved`:
[`taxonomy-service.md`](../specs/01-platform/taxonomy-service.md) Q3 (`strength` của prerequisite
dùng thang nhị phân hay 0–1) ghi rõ "hoãn — chốt lúc [`adaptive-engine.md`](../specs/01-platform/adaptive-engine.md) thiết kế (P3)". Không
đóng nó thì [`adaptive-engine.md`](../specs/01-platform/adaptive-engine.md) Q2 không có chỗ trỏ.

## 0. Điều kiện tiên quyết — đo lại trước khi bắt đầu

```
git status                                  # phải sạch
pnpm lint:specs 2>&1 | tail -2              # ghi lại số lỗi và cảnh báo
pnpm lint:specs 2>&1 | grep -oE "\[C[0-9]+\]" | sort | uniq -c
grep -rhoE "D-B[A-Z]" docs/specs docs/tasks | sort -u | tail -1   # mã D-* lớn nhất đang dùng
```

Tại `3dbebdd`: 0 lỗi, 162 cảnh báo (94 `C6` + 68 `C16`), mã lớn nhất `D-BE`. Task #9 đang tiêu
mã và giảm cảnh báo song song, nên **điều kiện chấp nhận của từng bước viết theo delta của chính
file đó**, không theo tổng corpus. Ví dụ đúng: "`C6` của [`adaptive-engine.md`](../specs/01-platform/adaptive-engine.md) từ 2 về 0". Ví dụ
sai: "tổng cảnh báo từ 162 về 160".

## 1. Phạm vi

**Trong phạm vi:**

- 12 spec `phase: P3` `draft` → `approved`, mỗi spec một commit.
- 25 cảnh báo `C6` — điền cột "vì sao".
- 12 bảng mục 11 sang 5 cột (`#`, `Câu hỏi`, `Chặn gì`, `Chặn phase`, `Chủ`).
- Đóng [`taxonomy-service.md`](../specs/01-platform/taxonomy-service.md) Q3 (spec đã `approved`,
  sửa đúng một hàng bảng mục 11 + ghi `D-*`).
- Vá bảng P3 của [`roadmap.md`](../specs/roadmap.md) nếu nó thiếu spec, cùng khuyết tật mà Task
  #8 vá cho P1 và Task #9 vá cho P2.

**Ngoài phạm vi — cố ý:**

- Code sản phẩm. Task này không đụng `packages/` hay `apps/`.
- Spec P4/P5 — [`11-p4-p5-closure-plan.md`](11-p4-p5-closure-plan.md).
- Nợ cảnh báo trên spec đã `approved` — [`12-corpus-debt-sweep-plan.md`](12-corpus-debt-sweep-plan.md).
- Chốt "ai biên soạn ≥60 lesson". Đó là nợ `D-W` của
  [`mvp-scope.md`](../specs/00-foundation/mvp-scope.md) Q1, chủ là người, không phải agent.

## 2. Số đo đầu vào — 12 spec đích

| Spec | Dòng | `C6` | Câu hỏi | Chặn bởi (trong lô) |
|---|---|---|---|---|
| [`adaptive-engine.md`](../specs/01-platform/adaptive-engine.md) | 222 | 2 | 3 | — |
| [`activity-model.md`](../specs/05-content/activity-model.md) | 148 | 1 | 1 | — |
| [`advanced-report.md`](../specs/03-account/advanced-report.md) | 169 | 1 | 2 | [`adaptive-engine.md`](../specs/01-platform/adaptive-engine.md) |
| [`progress-and-mastery.md`](../specs/04-play/progress-and-mastery.md) | 181 | 3 | 2 | [`adaptive-engine.md`](../specs/01-platform/adaptive-engine.md) |
| [`lesson-model.md`](../specs/05-content/lesson-model.md) | 143 | 3 | 2 | [`activity-model.md`](../specs/05-content/activity-model.md) |
| [`activity-authoring.md`](../specs/06-admin/activity-authoring.md) | 155 | 3 | 1 | [`activity-model.md`](../specs/05-content/activity-model.md) |
| [`curriculum-model.md`](../specs/05-content/curriculum-model.md) | 148 | 4 | 2 | [`lesson-model.md`](../specs/05-content/lesson-model.md) |
| [`lesson-authoring.md`](../specs/06-admin/lesson-authoring.md) | 163 | 1 | 2 | [`lesson-model.md`](../specs/05-content/lesson-model.md), [`activity-authoring.md`](../specs/06-admin/activity-authoring.md) |
| [`program-showcase.md`](../specs/02-public/program-showcase.md) | 147 | 3 | 1 | [`curriculum-model.md`](../specs/05-content/curriculum-model.md) |
| [`curriculum-player.md`](../specs/04-play/curriculum-player.md) | 184 | 1 | 2 | [`curriculum-model.md`](../specs/05-content/curriculum-model.md) |
| [`curriculum-builder.md`](../specs/06-admin/curriculum-builder.md) | 176 | 2 | 2 | [`curriculum-model.md`](../specs/05-content/curriculum-model.md), [`lesson-authoring.md`](../specs/06-admin/lesson-authoring.md) |
| [`next-game-recommendation.md`](../specs/04-play/next-game-recommendation.md) | 193 | 1 | 2 | [`adaptive-engine.md`](../specs/01-platform/adaptive-engine.md), [`curriculum-player.md`](../specs/04-play/curriculum-player.md) |

Tổng 2.029 dòng, 25 `C6`, 22 câu hỏi. Cỡ: mỗi spec là một bước S (một file, một commit); riêng
[`adaptive-engine.md`](../specs/01-platform/adaptive-engine.md) là M vì nó kéo theo sửa [`taxonomy-service.md`](../specs/01-platform/taxonomy-service.md).

## 3. Thứ tự — năm đợt theo `C8`

```
Đợt 1: adaptive-engine · activity-model
Đợt 2: advanced-report · progress-and-mastery · lesson-model · activity-authoring   → Cổng dừng A
Đợt 3: curriculum-model · lesson-authoring
Đợt 4: program-showcase · curriculum-player · curriculum-builder                    → Cổng dừng B
Đợt 5: next-game-recommendation                                                     → Cổng dừng cuối
```

Trong cùng một đợt thứ tự tự do. [`adaptive-engine.md`](../specs/01-platform/adaptive-engine.md) đi đầu vì bốn spec khác trỏ vào bảng nhãn
thành thạo §7.4 của nó.

## 4. Ba quyết định phải ra trong lô này

### 4.1 Thang `strength` của prerequisite ([`adaptive-engine.md`](../specs/01-platform/adaptive-engine.md) Q2 = [`taxonomy-service.md`](../specs/01-platform/taxonomy-service.md) Q3)

Chốt được từ corpus. `BR-ADP-04` đã dùng `content_skill_map.weight` làm hệ số điều tiết liên
tục, và `packages/db/src/schema/taxonomy.ts` đã tồn tại — đọc kiểu cột thật của `strength` trước
khi chốt, đừng chốt bằng trí nhớ. Nếu cột đã là số thực thì thang 0–1 là kết luận **đã bị schema
quyết định rồi**, việc còn lại chỉ là ghi vào spec. Nếu cột là boolean thì đổi thang là đổi
migration, và khi đó câu hỏi này chặn một migration mới — phải nói ra ở Cổng dừng A.

### 4.2 Luồng chấm tay cho skill C5 ([`adaptive-engine.md`](../specs/01-platform/adaptive-engine.md) Q3 = [`progress-and-mastery.md`](../specs/04-play/progress-and-mastery.md) Q1)

Hai spec hỏi cùng một câu. Chốt một lần, hai chỗ trỏ về nhau như cặp
[`image-storage.md`](../specs/01-platform/image-storage.md) Q1 ↔ [`image-upload.md`](../specs/06-admin/image-upload.md) Q1 mà Task #9 đã làm. Ràng buộc corpus có sẵn: `BR-ADP-06`
cấm ghi mastery từ phiên guest hoặc preview, và
[`child-data-compliance.md`](../specs/00-foundation/child-data-compliance.md) cấm cơ chế gây áp
lực. Nghĩa là luồng chấm tay phải do **người lớn của chính tài khoản** thực hiện, ghi
`assessed_by` trỏ tài khoản đó, và không hiện cho trẻ. Nếu thiết kế UI chưa có chỗ, để `Chặn
phase: P3` và `Chủ: Studio UI` chứ đừng tự vẽ màn hình mới trong spec model.

### 4.3 Ghim version hay lấy bản published mới nhất

**Không phải quyết định mới** — đã đóng ở
[`content-versioning.md`](../specs/00-foundation/content-versioning.md) Q2, cơ chế `entity_id`
neo dòng dõi (`D-AE`). Ba hàng câu hỏi ([`curriculum-player.md`](../specs/04-play/curriculum-player.md) Q1, [`curriculum-builder.md`](../specs/06-admin/curriculum-builder.md) Q1,
[`lesson-authoring.md`](../specs/06-admin/lesson-authoring.md) Q2) chỉ cần viết lại thành hàng đã đóng, gạch số và trỏ tới `D-AE`. Cấm mở
lại: mở lại là đổi FK của [`schema-content-taxonomy.md`](../specs/01-platform/schema-content-taxonomy.md)
và đổi migration đã chạy ở Task #7.

## 5. Điền "vì sao" — nguyên tắc và các hàng đã có đích rõ

Nguyên tắc: rule là bản sao hoặc bản đối xứng của rule khác thì "vì sao" viết dạng **con trỏ**,
không viện lý do mới. Rule đứng một mình thì viết **hậu quả khi vi phạm**, không viết lại nội
dung rule.

| Rule | Đề nghị |
|---|---|
| `BR-ADP-07` (không tin mastery từ client) | Cặp đôi với `BR-PRG-06`; client là môi trường không kiểm được, event thô kiểm được bằng luật, mastery thành phẩm thì không |
| `BR-ADP-09` (điều chỉnh trong bước hiện tại) | Mặt đối xứng của `BR-ADP-05` (cấm nhảy bước) — nêu rõ ranh giới, nếu không thì "điều chỉnh" trượt thành "đổi thứ tự" |
| `BR-PRG-05` (không so sánh giữa trẻ) | Trỏ ràng buộc trẻ em ở [`child-data-compliance.md`](../specs/00-foundation/child-data-compliance.md) — cùng họ với `BR-PRG-07`/`BR-CDC-09` |
| `BR-PRG-06` (mastery ghi ở server) | Trỏ `BR-ADP-07` |
| `BR-PRG-08` (nhãn theo bảng §7.4) | Hai nguồn nhãn là hai bản đồ tiến độ khác nhau cho cùng một đứa trẻ |
| `BR-CRM-04` `BR-CRM-05` `BR-CRM-08` `BR-CRM-09` | Lý do sư phạm, viết một câu mỗi hàng; `BR-CRM-08` (phủ 6 competency) là mặt đối xứng của `BR-CRM-07` (trần 40%) |
| 14 hàng còn lại | Viết lúc đọc file, một câu, ngôn ngữ tự nhiên theo [`04-readability-spec.md`](04-readability-spec.md) |

## 6. Cổng dừng

### Cổng dừng A — sau đợt 2

- 6/6 spec đợt 1 và 2 `approved`; `C6` của sáu file đó về 0; sáu bảng mục 11 đủ 5 cột.
- [`taxonomy-service.md`](../specs/01-platform/taxonomy-service.md) Q3 đã đóng, có mã `D-*`, và `pnpm lint:specs` vẫn 0 lỗi (sửa spec
  `approved` là chỗ dễ sinh lỗi `C16` mới vì hàng thiếu `Chủ` trên spec `approved` là `fail`).
- Nói rõ: quyết định 4.1 có phát sinh migration mới hay không.
- `pnpm check` và `pnpm test` xanh.

### Cổng dừng B — sau đợt 4

- 11/12 spec `approved`.
- Ba hàng "ghim version" đã trỏ `D-AE`, không có hàng nào tự chốt lại.
- Câu "42 tuần cần khoảng 126 buổi" xuất hiện ở hai file với **cùng một** nội dung hàng và cùng
  `Chủ`.

### Cổng dừng cuối

- 12/12 `approved`; `phase: P3` không còn `draft`.
- Tổng `C6` giảm đúng 25 so với lúc bắt đầu; tổng `C16` giảm đúng 12.
- `pnpm lint:specs` 0 lỗi; `pnpm check` và `pnpm test` xanh.
- Bảng P3 của [`roadmap.md`](../specs/roadmap.md) khớp số spec mang `phase: P3`.
- Mọi câu hỏi còn mở có `Chặn phase` và `Chủ` không rỗng.

## 7. Rủi ro

| Rủi ro | Ảnh hưởng | Giảm thiểu |
|---|---|---|
| Tự chốt lại "ghim version" theo trí nhớ | Đổi FK và migration đã chạy ở Task #7 | Mục 4.3 — chỉ trỏ `D-AE`, cấm mở lại |
| Sửa [`taxonomy-service.md`](../specs/01-platform/taxonomy-service.md) (spec `approved`) làm hàng câu hỏi thiếu `Chủ` | `C16` sinh **lỗi**, không phải cảnh báo, pipeline đỏ | Chạy `pnpm lint:specs` ngay sau lần sửa đó, trước khi commit |
| Chốt thang `strength` bằng trí nhớ thay vì đọc `packages/db/src/schema/taxonomy.ts` | Spec nói khác schema đã chạy | Mục 4.1 buộc đọc cột thật trước |
| Hai session cùng tiêu mã `D-*` | Hai quyết định khác nhau cùng một mã, sổ cái mất giá trị tra cứu | Lấy mã bằng lệnh ở mục 0 ngay trước khi ghi, không lấy từ kế hoạch |
| Viết "vì sao" bằng cách diễn giải lại rule | Cột "vì sao" đầy mà vẫn không giải thích gì | Mục 5 — hoặc con trỏ, hoặc hậu quả |

## 8. Kiểm chứng

Sau mỗi bước:

```
pnpm lint:specs 2>&1 | grep -E "<tên-file-vừa-sửa>"     # phải không còn dòng nào
pnpm lint:specs 2>&1 | tail -2                          # 0 lỗi
```

Sau lô:

```
pnpm lint:specs 2>&1 | grep -oE "\[C[0-9]+\]" | sort | uniq -c
for f in $(grep -rl "^phase: P3" --include="*.md" docs/specs); do grep -q "^status: draft$" $f && echo $f; done
pnpm check && pnpm test
```

Lệnh thứ hai phải không in gì. Đích sau task: `phase: P3` đạt 12/12 `approved`, corpus còn 34
spec `draft` (8 P4, 1 P5, và phần P2 mà Task #9 chưa đóng).
