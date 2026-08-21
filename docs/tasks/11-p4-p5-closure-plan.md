---
doc: 11-P4-P5-CLOSURE-PLAN
title: Kế hoạch — Task #11: Đóng corpus spec P4 và P5 (9 spec)
---

# Kế hoạch — Task #11: Đóng corpus spec P4 và P5 (9 spec)

> Viết 2026-08-08, đo tại commit `3dbebdd`. Checklist thực thi:
> [`11-p4-p5-closure-todo.md`](11-p4-p5-closure-todo.md). Bản đồ liên task:
> [`CORPUS-CLOSURE.md`](CORPUS-CLOSURE.md).
>
> Task trước trong chuỗi: [`10-p3-spec-closure-plan.md`](10-p3-spec-closure-plan.md). Năm trong
> chín spec của lô này chặn bởi spec P3, nên phần lớn task phải chạy **sau** #10 — trừ ba spec ở
> đợt 1, làm được ngay.
>
> ```
> export PATH=/Users/macbook/.nvm/versions/node/v24.15.0/bin:$PATH
> ```

## Tóm tắt

8 spec `phase: P4` (bốn add-on trả tiền, worksheet model, pdf export, semantic search, custom
game builder) cộng 1 spec `phase: P5` ([`pwa-install.md`](../specs/01-platform/pwa-install.md)). Đây là lô cuối của corpus: đóng xong thì
mọi spec dự án `approved`, chỉ còn nợ cảnh báo trên spec cũ (Task #12).

Đặc điểm riêng của lô: **9 trong 22 câu hỏi mở là quyết định giá và quota**, thuộc chủ dự án.
Điều đó **không** chặn `approved` — [`package-catalog.md`](../specs/00-foundation/package-catalog.md)
`BR-PKG-05` đã chốt "add-on được khai báo nhưng `is_public = false` ở MVP", nên approve spec
add-on là đóng **contract**, không phải mở bán. Hàng câu hỏi giá chỉ cần `Chặn phase` và
`Chủ: người quyết` là đủ điều kiện `C16`.

Một câu hỏi trong lô **thật sự** chặn kỹ thuật: [`semantic-search.md`](../specs/07-addon/semantic-search.md) Q1 — model embedding quyết
định `N` của cột `vector(N)`. Đổi `N` là đổi migration, không đổi config. Xem mục 4.

## 0. Điều kiện tiên quyết

```
git status
pnpm --filter @mindkid/gates test 2>&1 | tail -2
pnpm --filter @mindkid/gates test 2>&1 | grep -oE "\[C[0-9]+\]" | sort | uniq -c
grep -rhoE "D-B[A-Z]" docs/specs docs/tasks | sort -u | tail -1
for f in $(grep -rl "^phase: P3" --include="*.md" docs/specs); do grep -q "^status: draft$" $f && echo $f; done
```

Lệnh cuối phải **không in gì** trước khi vào đợt 2 (Task #10 đã xong). Ba spec đợt 1 không cần
điều kiện này.

## 1. Phạm vi

**Trong phạm vi:**

- 9 spec `draft` → `approved`, mỗi spec một commit.
- 21 cảnh báo `C6`, 9 bảng mục 11 sang 5 cột, 22 hàng câu hỏi mở.
- Vá bảng P4 và P5 của [`roadmap.md`](../specs/roadmap.md).
- Ghi một hàng nợ vào [`CORPUS-CLOSURE.md`](CORPUS-CLOSURE.md): cột `vector(N)` chưa có `N`.

**Ngoài phạm vi — cố ý:**

- Chốt giá, quota, provider AI. Chủ là người; agent chỉ ghi hàng câu hỏi đúng chuẩn.
- Viết migration `pgvector`. Không có `N` thì không có migration.
- Code sản phẩm.
- Dọn nợ cảnh báo trên spec đã `approved` — [`12-corpus-debt-sweep-plan.md`](12-corpus-debt-sweep-plan.md).

## 2. Số đo đầu vào — 9 spec đích

| Spec | Phase | Dòng | `C6` | Câu hỏi | Chặn bởi |
|---|---|---|---|---|---|
| [`ai-credit-ledger.md`](../specs/07-addon/ai-credit-ledger.md) | P4 | 150 | 2 | 3 | — |
| [`custom-game-builder.md`](../specs/07-addon/custom-game-builder.md) | P4 | 126 | 3 | 3 | — |
| [`pwa-install.md`](../specs/01-platform/pwa-install.md) | P5 | 124 | 1 | 1 | — |
| [`ai-assistant.md`](../specs/07-addon/ai-assistant.md) | P4 | 158 | 4 | 4 | [`ai-credit-ledger.md`](../specs/07-addon/ai-credit-ledger.md), [`advanced-report.md`](../specs/03-account/advanced-report.md) (P3) |
| [`lesson-plan-creator.md`](../specs/07-addon/lesson-plan-creator.md) | P4 | 112 | 3 | 3 | [`lesson-model.md`](../specs/05-content/lesson-model.md) (P3) |
| [`pdf-export.md`](../specs/07-addon/pdf-export.md) | P4 | 124 | 2 | 2 | [`lesson-plan-creator.md`](../specs/07-addon/lesson-plan-creator.md) |
| [`semantic-search.md`](../specs/07-addon/semantic-search.md) | P4 | 231 | 0 | 4 | [`ai-assistant.md`](../specs/07-addon/ai-assistant.md), [`ai-credit-ledger.md`](../specs/07-addon/ai-credit-ledger.md) |
| [`worksheet-model.md`](../specs/05-content/worksheet-model.md) | P4 | 124 | 3 | 1 | [`activity-model.md`](../specs/05-content/activity-model.md) (P3), [`pdf-export.md`](../specs/07-addon/pdf-export.md) |
| [`personal-curriculum.md`](../specs/07-addon/personal-curriculum.md) | P4 | 125 | 3 | 2 | [`curriculum-model.md`](../specs/05-content/curriculum-model.md), [`curriculum-player.md`](../specs/04-play/curriculum-player.md) (P3) |

Tổng 1.274 dòng, 21 `C6`, 22 câu hỏi.

## 3. Thứ tự — bốn đợt

```
Đợt 1 (không chờ #10): ai-credit-ledger · custom-game-builder · pwa-install   → Cổng dừng A
Đợt 2 (sau #10):       ai-assistant · lesson-plan-creator
Đợt 3:                 pdf-export · semantic-search                          → Cổng dừng B
Đợt 4:                 worksheet-model · personal-curriculum                 → Cổng dừng cuối
```

## 4. [`semantic-search.md`](../specs/07-addon/semantic-search.md) — chỗ duy nhất chặn kỹ thuật thật

Q1 hỏi model embedding nào, vì nó quyết định `N` của cột `vector(N)`. Ba hệ quả phải viết vào
spec chứ không để ngầm:

1. **Không migration nào được viết trước khi có `N`.** Chọn sai rồi đổi là `ALTER TABLE` trên
   bảng có index vector — đắt và không phải "đổi config".
2. Spec vẫn `approved` được: mô tả bảng, luồng, và ghi `N` là **tham số chờ**, giống cách Task #7
   đặt `PENDING_PRICE_VND` cho giá gói. Đặt tên rõ, ví dụ `PENDING_EMBEDDING_DIM`, để lần sau
   grep ra được.
3. Hàng câu hỏi ghi `Chặn gì: Migration schema pgvector`, `Chặn phase: P4`, `Chủ: người quyết`,
   và **trỏ** [`ai-assistant.md`](../specs/07-addon/ai-assistant.md) Q1 — cùng một quyết định provider, đừng để hai spec chọn hai
   provider khác nhau.

Q4 (provider lỗi giữa chừng có trừ credit không) chốt được từ corpus: [`ai-credit-ledger.md`](../specs/07-addon/ai-credit-ledger.md) là sổ
kế toán, và nguyên tắc sổ kế toán trong repo này là ghi nhận **có hậu quả thật**. Lời gọi thất
bại không tạo giá trị cho người dùng, nên không trừ; nếu trừ rồi mới lỗi thì phải có bút toán
hoàn. Chốt được nhưng phải ghi rõ hoàn bằng bút toán ngược, không phải sửa số dư.

## 5. Chín câu hỏi giá và quota — viết một khuôn

Cả chín hàng viết cùng một khuôn để phiên hỏi chủ dự án chỉ cần đọc một lượt:

| Cột | Giá trị |
|---|---|
| `Chặn gì` | `Lên catalog` (không phải `Approve spec`) |
| `Chặn phase` | `P4` |
| `Chủ` | `người quyết` |

Danh sách chín: giá gói credit · tỉ lệ trừ credit mỗi loại lời gọi ([`ai-assistant.md`](../specs/07-addon/ai-assistant.md) Q2 =
[`ai-credit-ledger.md`](../specs/07-addon/ai-credit-ledger.md) Q1, một câu) · credit không hết hạn có tạo nợ dài hạn · quota
`custom_games_saved` · giá [`lesson-plan-creator.md`](../specs/07-addon/lesson-plan-creator.md) bán tháng hay năm · quota giáo án mỗi tháng ·
quota export mỗi tháng · quota lộ trình lưu · DPA với provider AI (pháp lý, không phải giá,
nhưng cùng một phiên hỏi).

Cấm tự điền số. Số giả trong spec add-on nguy hiểm hơn số giả trong seed dev, vì spec là chỗ
người khác đọc để tin.

## 6. Cặp câu hỏi trùng trong lô

| Câu | Hai chỗ | Xử lý |
|---|---|---|
| Puppeteer khoảng 300MB RAM mỗi instance, chạy nổi trên t3.small? | [`pdf-export.md`](../specs/07-addon/pdf-export.md) Q1 · [`worksheet-model.md`](../specs/05-content/worksheet-model.md) Q1 | Một hàng, hai chỗ trỏ nhau, `Chủ: Infra` |
| Tỉ lệ trừ credit | [`ai-assistant.md`](../specs/07-addon/ai-assistant.md) Q2 · [`ai-credit-ledger.md`](../specs/07-addon/ai-credit-ledger.md) Q1 | Ghi ở [`ai-credit-ledger.md`](../specs/07-addon/ai-credit-ledger.md), [`ai-assistant.md`](../specs/07-addon/ai-assistant.md) trỏ sang |
| Provider và model | [`ai-assistant.md`](../specs/07-addon/ai-assistant.md) Q1 · [`semantic-search.md`](../specs/07-addon/semantic-search.md) Q1 | Một quyết định, [`semantic-search.md`](../specs/07-addon/semantic-search.md) thêm phần `N` |

## 7. Cổng dừng

### Cổng dừng A — sau đợt 1

- 3/3 spec `approved`; `C6` của ba file về 0; ba bảng mục 11 đủ 5 cột.
- [`pwa-install.md`](../specs/01-platform/pwa-install.md) Q1 (push notification qua PWA) đối chiếu ràng buộc "không gửi gì tới trẻ" ở
  [`child-data-compliance.md`](../specs/00-foundation/child-data-compliance.md) — nếu ràng buộc
  đã cấm thì hàng này **đóng được**, không phải hoãn.
- `pnpm --filter @mindkid/gates test` 0 lỗi.

### Cổng dừng B — sau đợt 3

- 7/9 spec `approved`.
- [`semantic-search.md`](../specs/07-addon/semantic-search.md) mang tham số chờ có tên grep được, và hàng câu hỏi `N` ghi rõ chặn migration.
- Không spec nào trong lô chứa số giá hoặc số quota tự điền:
  `grep -rnE "[0-9]{3,}( ?đ| ?VND)" docs/specs/07-addon/` — đọc từng kết quả, phải là ví dụ có
  nhãn rõ, không phải giá chốt.

### Cổng dừng cuối

- 9/9 `approved`. `phase: P4` và `phase: P5` không còn `draft`.
- **Toàn corpus 130/130 `approved`** — kiểm bằng lệnh ở mục 8.
- Bảng P4 và P5 của [`roadmap.md`](../specs/roadmap.md) khớp số spec thật.
- 22 hàng câu hỏi đều có `Chặn phase` và `Chủ`.
- `pnpm check && pnpm test` xanh.
- Ghi nợ còn lại vào [`CORPUS-CLOSURE.md`](CORPUS-CLOSURE.md): `N` của `vector`, giá, quota, DPA.

## 8. Rủi ro

| Rủi ro | Ảnh hưởng | Giảm thiểu |
|---|---|---|
| Điền số giá hoặc quota để "cho spec tròn" | Số giả thành số thật ở bước seed hoặc UI | Cổng dừng B có lệnh grep số tiền; mục 5 cấm tường minh |
| Chốt `N` của `vector` theo model đoán | Migration pgvector phải viết lại, có index vector | Mục 4 — `N` là tham số chờ, tên grep được |
| Approve add-on rồi hiểu thành "đã lên bán" | Bán tính năng chưa có | Nhắc `BR-PKG-05` trong mục 1 của từng spec add-on nếu chưa có |
| Hai spec chọn hai provider AI khác nhau | Hai hoá đơn, hai DPA, hai chất lượng tiếng Việt | Mục 6 — [`semantic-search.md`](../specs/07-addon/semantic-search.md) Q1 trỏ [`ai-assistant.md`](../specs/07-addon/ai-assistant.md) Q1 |
| [`worksheet-model.md`](../specs/05-content/worksheet-model.md) chờ [`pdf-export.md`](../specs/07-addon/pdf-export.md) mà [`pdf-export.md`](../specs/07-addon/pdf-export.md) chờ hạ tầng | Deadlock cảm giác | [`pdf-export.md`](../specs/07-addon/pdf-export.md) approve được với hàng hạ tầng để `Chủ: Infra`; chỉ **triển khai** mới chờ |

## 9. Kiểm chứng

```
pnpm --filter @mindkid/gates test 2>&1 | tail -2
grep -rl "^status: draft$" --include="*.md" docs/specs | xargs grep -l "^spec: " | grep -v TEMPLATE
grep -rl "^status: approved" --include="*.md" docs/specs | xargs grep -l "^spec: " | wc -l
pnpm check && pnpm test
```

Lệnh thứ hai phải **không in gì**. Lệnh thứ ba phải ra **130**. Đến đây corpus đóng về nội dung;
việc còn lại là nợ cảnh báo và lật cổng — [`12-corpus-debt-sweep-plan.md`](12-corpus-debt-sweep-plan.md).
