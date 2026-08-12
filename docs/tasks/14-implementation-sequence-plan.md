# Kế hoạch — Task #14: Thứ tự implement cho toàn bộ 130 spec

> Viết 2026-08-08, đo tại commit `be75db4` (Task #12 đóng, corpus 130/130 `approved`, lint 0 lỗi
> 0 cảnh báo). Bản đồ liên task: [`CORPUS-CLOSURE.md`](CORPUS-CLOSURE.md).
>
> Đây là task đầu tiên **viết code sản phẩm**. Mọi task từ #1 tới #13 là spec và tooling.
>
> ```
> export PATH=/Users/macbook/.nvm/versions/node/v24.15.0/bin:$PATH
> ```

## Tóm tắt

Corpus spec đóng. Việc kế tiếp là code, và câu hỏi duy nhất cần trả lời trước dòng code đầu tiên
là **thứ tự**. Thứ tự đã có sẵn một phần: [`roadmap.md`](../specs/roadmap.md) chia P0–P5 và ghi
các bước đánh số trong từng phase.

Đo lại roadmap đối chiếu 130 spec: nó phủ **118/130**. Mười hai spec không có bước nào sở hữu,
và **cả 12 đều là P0** — tức là chúng chặn sớm nhất mà lại vô hình nhất. Kế hoạch này vá lỗ hổng
đó trước, rồi biến từng bước roadmap thành việc làm được có tiêu chí nghiệm thu.

## 0. Điều kiện tiên quyết

```
pnpm lint:specs 2>&1 | tail -2                  # 0 lỗi, 0 cảnh báo
grep -rl "^status: approved" --include="*.md" docs/specs | xargs grep -l "^spec: " | wc -l
pnpm check && pnpm test
```

Lệnh 2 ra **130**. `BR-RBS-04` mở khoá code nghiệp vụ khi `00-foundation` `approved` — đã đạt.

## 1. Số đo tại `be75db4`

| Đo | Giá trị |
|---|---|
| Spec | 130, tất cả `approved` |
| Phân bố phase | P0 **35** · P1 **43** · P2 **31** · P3 **12** · P4 **8** · P5 **1** |
| `mvp: true` | 120 |
| Cạnh `depends_on` | 171, đồ thị **không chu trình** |
| Bước đánh số trong [`roadmap.md`](../specs/roadmap.md) | P0 11 · P1 16 · P2 11 · P3 8 · P4/P5 dạng danh sách |
| Spec roadmap phủ | 118/130 |
| Phase frontmatter lệch chỗ roadmap đặt | **0** — hai nguồn khớp nhau ở chỗ chúng giao |

## 2. Mười hai lỗ hổng roadmap — vá trước khi code

Chín spec **không xuất hiện ở bất kỳ đâu** trong [`roadmap.md`](../specs/roadmap.md):

| Spec | Vì sao nó chặn |
|---|---|
| [`admin-auth.md`](../specs/06-admin/admin-auth.md) | 8 spec `06-admin` phase P2 khai `depends_on` nó; không có nó thì cả vùng admin không vào được |
| [`notification-service.md`](../specs/01-platform/notification-service.md) | [`email-verification.md`](../specs/03-account/email-verification.md) và [`password-recovery.md`](../specs/03-account/password-recovery.md) — cả hai P0 — gửi email qua nó |
| [`rate-limiting.md`](../specs/01-platform/rate-limiting.md) | Guard của mọi endpoint auth; [`oauth-provider-registry.md`](../specs/01-platform/oauth-provider-registry.md) khai phụ thuộc |
| [`testing-strategy.md`](../specs/08-quality/testing-strategy.md) | Định nghĩa cổng test mà mọi bước sau phải qua — thiếu nó thì "xong" không đo được |
| [`security-checklist.md`](../specs/08-quality/security-checklist.md) | Cổng bảo mật trước go-live |
| [`health-check.md`](../specs/01-platform/health-check.md) | Điều kiện để deploy có thể quan sát được |
| [`backup-and-restore.md`](../specs/01-platform/backup-and-restore.md) | Phải có **trước** dữ liệu thật, không phải sau |
| [`ai-codegen-pipeline.md`](../specs/01-platform/ai-codegen-pipeline.md) | Sáu vùng nhạy cảm của AI codegen và cổng review tăng cường áp lên chính task này |
| [`mvp-scope.md`](../specs/00-foundation/mvp-scope.md) | Định nghĩa cắt MVP mà mọi cổng ra phase đối chiếu |

Ba spec nữa — [`business-rules.md`](../specs/00-foundation/business-rules.md),
[`error-codes.md`](../specs/00-foundation/error-codes.md),
[`event-catalog.md`](../specs/00-foundation/event-catalog.md) — có tên trong sơ đồ ASCII của P0
("registry, viết song song") nhưng không có bước đánh số. Chúng là registry: không "làm xong"
một lần, mà được tra và bồi trong suốt mọi bước. Vá bằng cách ghi rõ điều đó, không bằng cách
thêm một bước giả.

Vá roadmap là **bước 1 của task này**, không phải việc phụ. Chín spec trên nằm đúng chỗ dễ quên
nhất: hạ tầng không có màn hình để demo.

## 3. Nguồn thứ tự — và vì sao không dùng `depends_on` một mình

Cám dỗ tự nhiên là topo-sort `depends_on` rồi lấy đó làm thứ tự build. Đo trước khi tin:

| Đo trên 171 cạnh `depends_on` | Kết quả |
|---|---|
| Cạnh mà **thân spec không nhắc file dep lần nào** | **133** (78%) |
| Liên kết trong thân spec mà **không** được khai ở `depends_on` | **448** |
| Cạnh trỏ tới spec ở phase **sau** | 4 tại `be75db4`; Task #15 phát hiện thêm 1 cạnh |

Ví dụ đo được: [`registration.md`](../specs/03-account/registration.md) khai `depends_on`
`ERROR-CODES`, nhưng thân spec không nhắc file registry mã lỗi lần nào;
[`entitlement-model.md`](../specs/00-foundation/entitlement-model.md) khai `ACTORS` mà thân
không nhắc file tác nhân.

Nghĩa là `depends_on` và văn xuôi là **hai nguồn chưa bao giờ được đối chiếu**. Cả hai đều không
sai hẳn — một cạnh có thể thật mà không cần nhắc tên file — nhưng không nguồn nào tự nó chứng
minh được thứ tự.

**Quyết định:** [`roadmap.md`](../specs/roadmap.md) là **nguồn thứ tự** (người viết, có lý do
kèm theo). `depends_on` là **kiểm tra chéo**: trước mỗi bước, liệt kê dep của các spec trong bước
và xác nhận chúng đã `implemented`. Lệch thì dừng lại, sửa một trong hai nguồn, ghi vào sổ `D-*`
— không im lặng chọn bên nào.

Sóng topo tính từ `depends_on` (P0 11/9/9/6 · P1 23/15/5 · P2 24/6/1 · P3 8/3/1 · P4 6/2 · P5 1)
dùng làm **cảnh báo**: nếu roadmap xếp một spec trước dep của nó, sóng sẽ lệch và phải giải thích.

Năm cạnh đảo phase đã được xử lý, bốn cạnh đầu ở bước 1 và cạnh thứ năm ở Task #15:

| Cạnh | Đọc được gì |
|---|---|
| [`schema-identity-billing.md`](../specs/01-platform/schema-identity-billing.md) (P0) → [`payment-flow.md`](../specs/00-foundation/payment-flow.md) (P2) | `D-BQ`: contract-only; P0 tạo cột theo enum `status`, P2 làm luồng thanh toán |
| [`schema-content-taxonomy.md`](../specs/01-platform/schema-content-taxonomy.md) (P0) → [`game-template-contract.md`](../specs/01-platform/game-template-contract.md) (P1) | `D-BR`: contract-only; taxonomy schema P0 đứng trước template contract P1 |
| [`ai-codegen-pipeline.md`](../specs/01-platform/ai-codegen-pipeline.md) (P0) → [`game-template-contract.md`](../specs/01-platform/game-template-contract.md) (P1) | `D-BS`: contract-only; ranh giới codegen và cổng review phải có trước implementation P1 |
| [`backup-and-restore.md`](../specs/01-platform/backup-and-restore.md) (P0) → [`job-queue.md`](../specs/01-platform/job-queue.md) (P1) | `D-BT`: P0 dựng khung queue/worker tối thiểu cho `backup:postgres`; job queue đầy đủ vẫn ở P1 |
| [`notification-service.md`](../specs/01-platform/notification-service.md) (P0) → [`job-queue.md`](../specs/01-platform/job-queue.md) (P1) | `D-BU`: P0 dùng lại khung tối thiểu của `D-BT` cho `email:send`; catalog/retry/alerting đầy đủ vẫn ở P1 |

## 4. Năm quyết định thiết kế

**D1 — Bước roadmap sở hữu outcome; work package S/M mới là đơn vị implementation.** Nhiều
bước gộp 3–8 spec chỉ có nghĩa khi nghiệm thu cùng nhau (bước P0 #10 gộp 4 spec auth), nhưng
không vì thế mà ép toàn bộ bước vào một nhánh hoặc một PR. Mỗi bước phải tách thành các work
package dọc, khoảng 1–5 file, có test và để hệ thống chạy được; bước chỉ được tick khi mọi work
package đã hợp lại và acceptance end-to-end xanh.

**D2 — Mỗi bước là một lát dọc.** Schema → API → UI → test trong cùng một bước, không phải làm
hết schema toàn dự án rồi mới tới API. Đây là nguyên tắc 5 của chính
[`roadmap.md`](../specs/roadmap.md), và là lý do bước P0 #10 tồn tại dưới dạng "auth end-to-end"
chứ không phải "bảng `users`".

**D3 — Master plan giảm chi tiết theo phase; increment plan tăng chi tiết khi contract tới
hạn.** File này giữ thứ tự và phase gate. Task #16–#69 hiện đã có plan/todo riêng với acceptance
criteria; Task #70–#72 và #78 giữ P5 ở contract-first. Các contract gap tìm thấy ngày
2026-08-12 đi qua Task #80–#82 trước implementation. Không viết số giá, quota, provider hay
ngưỡng sư phạm chưa được người sở hữu duyệt chỉ để làm plan trông hoàn chỉnh.

**D4 — Không spec nào được coi là "xong" khi chưa có test.** [`testing-strategy.md`](../specs/08-quality/testing-strategy.md)
là spec P0 và là một trong 9 lỗ hổng — nó phải vào sớm, vì nó định nghĩa "xong" cho mọi bước sau.

**D5 — Ngoại lệ codegen chỉ thuộc Task #14.** Theo quyết định D7 của
[`SPEC.md`](../SPEC.md) mục 0, AI được phép sinh code trong sáu vùng nhạy cảm của Task #14:
auth, thanh toán, gating, dữ liệu trẻ, code điều phối migration và xử lý nội dung đã
`published`. Mỗi increment phải có test âm tham chiếu business rule sở hữu, gate đầy đủ và
người review diff trước merge. Không auto-merge, không chạy migration ngoài local, không sửa
trực tiếp hàng `published`, không gọi transition publish và không phát hành nội dung.

## 5. Quy trình chuẩn cho một bước — chín việc, đúng thứ tự

1. Đọc **toàn bộ** spec của bước, không chỉ mục 7. Mục 11 (câu hỏi mở) đọc trước tiên: câu chưa
   chốt trong bước này là rủi ro phải nêu ngay, không phải phát hiện lúc code.
2. Liệt kê `depends_on` của mọi spec trong bước; xác nhận từng dep đã `implemented`. Lệch với
   roadmap thì dừng, theo mục 3.
3. Tách mọi phần cỡ `L`/`XL` thành work package S/M, mỗi package khoảng 1–5 file, acceptance
   criteria và verification riêng. Không bắt đầu test RED khi work package vẫn mang nhãn L/XL.
4. Liệt kê mã `BR-*` mà bước phải thực thi; đối chiếu [`business-rules.md`](../specs/00-foundation/business-rules.md)
   để không bỏ rule nào và không tự chế rule mới.
5. Viết test trước theo [`testing-strategy.md`](../specs/08-quality/testing-strategy.md) — **phải đỏ**.
6. Code tới khi test xanh. Với sáu vùng nhạy cảm, áp ngoại lệ D5: test âm trước, ghi rõ phần
   AI soạn và giữ cổng người review diff; không dùng ngoại lệ để auto-merge, chạy migration
   ngoài local hoặc phát hành nội dung.
7. `pnpm check && pnpm test && pnpm lint:specs` xanh.
8. Nếu bước làm lộ ra spec sai: sửa spec **trong cùng PR**, kèm lý do. Spec là hợp đồng — code
   lệch spec mà spec không đổi là nợ im lặng.
9. Một commit cho mỗi lát chạy được; mỗi PR chỉ mang một work package. PR cuối của bước chạy
   acceptance end-to-end và phase gate liên quan.

Việc 4 là việc hay bị bỏ nhất. [`business-rules.md`](../specs/00-foundation/business-rules.md)
có 126 tiền tố `BR`; bỏ sót một rule gating
hoặc một rule dữ liệu trẻ là loại lỗi không lộ ra ở test hạnh phúc.

## 6. Thứ tự — toàn bộ 130 spec

```
Bước 1  : Vá 12 lỗ hổng roadmap + xử lý 5 cạnh đảo phase   → Cổng dừng A
P0      : 11 bước roadmap + 9 spec mới vá vào (35 spec)     → Cổng ra P0 (SPEC.md §13)
P1      : 16 bước hiện có (43 spec) + 2 contract gate       → Cổng ra P1
P2      : 11 bước roadmap (31 spec)                         → Cổng ra P2
P3      :  9 bước roadmap (12 spec; bước 9 tích hợp account)→ Cổng ra P3 = hết MVP
P4      :  8 spec add-on, mỗi cái lên catalog cùng tính năng
P5      :  1 spec hiện có + contract-first cho Web scale
```

Chín spec vá vào P0 xếp thế này, suy từ cái chúng chặn:

| Chèn vào | Spec | Vì sao đúng chỗ đó |
|---|---|---|
| Trước bước 1 | [`testing-strategy.md`](../specs/08-quality/testing-strategy.md) · [`ai-codegen-pipeline.md`](../specs/01-platform/ai-codegen-pipeline.md) · [`mvp-scope.md`](../specs/00-foundation/mvp-scope.md) | Định nghĩa "xong", cổng review vùng nhạy cảm, và cắt phạm vi — ba thứ áp lên mọi bước sau |
| Sau bước 8 (migration đầu) | [`backup-and-restore.md`](../specs/01-platform/backup-and-restore.md) · [`health-check.md`](../specs/01-platform/health-check.md) | Có dữ liệu thật rồi mới có cái để sao lưu; deploy phải quan sát được |
| Trước bước 10 (auth) | [`notification-service.md`](../specs/01-platform/notification-service.md) · [`rate-limiting.md`](../specs/01-platform/rate-limiting.md) | Auth P0 gửi email và cần guard ngay lần chạy đầu, không vá sau |
| Sau bước 11 (audit) | [`admin-auth.md`](../specs/06-admin/admin-auth.md) | Cần audit trước, và mở khoá cả vùng admin P2 |
| Cổng ra P0 | [`security-checklist.md`](../specs/08-quality/security-checklist.md) | Là chính cổng, không phải một bước |

Ba registry ([`business-rules.md`](../specs/00-foundation/business-rules.md),
[`error-codes.md`](../specs/00-foundation/error-codes.md),
[`event-catalog.md`](../specs/00-foundation/event-catalog.md)) không nhận bước riêng. Thay vào
đó, việc 4 của quy trình mục 5 bắt buộc tra chúng ở **mọi** bước.

## 7. Cổng dừng

### Cổng dừng A — sau bước 1, trước dòng code đầu tiên

- [`roadmap.md`](../specs/roadmap.md) phủ **130/130** spec; lệnh đếm ở mục 9 ra 0 spec thiếu.
- Năm cạnh đảo phase đã xử lý: mỗi cái hoặc được xác minh là contract-only, hoặc bị bỏ, hoặc
  spec đổi phase — kèm mã `D-*` cho từng cái.
- `pnpm lint:specs` 0 lỗi 0 cảnh báo (roadmap cũng bị lint chấm).

### Cổng ra mỗi phase

Điều kiện đầy đủ ở [`SPEC.md`](../SPEC.md) §13. Thêm ba điều kiện của task này, áp cho mọi phase:

- Mọi spec của phase có `status: implemented` **và** test theo [`testing-strategy.md`](../specs/08-quality/testing-strategy.md).
- Mọi `BR-*` mà phase sở hữu có ít nhất một test tham chiếu tới mã rule.
- Không spec nào của phase còn câu hỏi mở mang `Chặn phase` bằng chính phase đó.

Điều kiện 3 là chỗ nối với Task #13: nếu cột `Chủ`/`Chặn phase` chưa chuẩn hoá thì điều kiện này
không kiểm được bằng máy. Task #13 nên chạy trước hoặc song song bước 1.

## 8. Rủi ro

| Rủi ro | Ảnh hưởng | Giảm thiểu |
|---|---|---|
| Tin `depends_on` như thứ tự build | 133 cạnh không có dấu vết trong văn xuôi — build sai thứ tự mà vẫn thấy "đúng đồ thị" | Mục 3: roadmap là nguồn, `depends_on` là kiểm tra chéo, lệch thì dừng |
| Chín spec vá vào bị rơi lại | Chúng vô hình vì không có màn hình; rơi lần nữa là rơi ở đúng chỗ chặn nhất | Bước 1 vá vào roadmap **trước** khi code; cổng dừng A đếm bằng lệnh |
| Code lệch spec, spec không đổi | Nợ im lặng: spec thành tài liệu chết trong khi nó là hợp đồng | Việc 8 mục 5 — sửa spec trong cùng PR |
| Plan mới tái xuất hiện work package cỡ L/XL rồi vẫn bắt đầu code | Diff quá rộng, acceptance không cô lập được, review người mất hiệu lực | Việc 3 mục 5 — tách S/M trước test RED; Task #79 đã đưa inventory 19 package về 0 và giữ query regression |
| Viết tiêu chí nghiệm thu cho outcome P4/P5 chưa có quyết định | Bịa số hoặc tạo contract giả | D3 — P4 giữ thứ tự; P5 qua Task #70 và spec owner trước implementation |
| Bắt đầu code khi Task #13 chưa xong | Điều kiện 3 của cổng ra phase không kiểm được bằng máy | Task #13 chạy trước hoặc song song bước 1; hai task không đụng cùng file |
| Nội dung là đường găng, không phải code | P0 cần review ≥690 LO; P1 cần review ≥120 game level. Seeder không giảm chi phí đọc review | Seed LO chạy trong P0; nhóm D của [`roadmap.md`](../specs/roadmap.md) bắt đầu level ngay sau P1.2 |

## 9. Kiểm chứng

Roadmap phủ hết 130 spec (phải in ra rỗng sau bước 1):

```
for f in $(grep -rl "^phase: P" --include="*.md" docs/specs | grep -v TEMPLATE); do
  grep -q "^doc: " "$f" && continue
  b=$(basename "$f"); grep -q -- "$b" docs/specs/roadmap.md || echo "THIẾU: $f";
done
```

Hai lớp lọc, cả hai đều cần — đo được 2026-08-09 sau khi bước 1 đã làm **đúng** mà lệnh vẫn báo
thiếu 2 file. [`CONVENTIONS.md`](../specs/CONVENTIONS.md) và
[`READING-GUIDE.md`](../specs/READING-GUIDE.md) khớp cả `^spec: ` lẫn `^phase: P`, vì chúng in
khuôn frontmatter làm ví dụ trong thân tài liệu. Chúng không phải spec. Dấu hiệu phân biệt duy
nhất đáng tin là khoá `doc:` — cũng chính là dấu hiệu mà `checkC16` trong
[`lint-specs-lib.ts`](../../scripts/lint-specs-lib.ts) dùng để miễn trừ.

Đếm tiến độ theo `status`:

```
grep -rh "^status: " --include="*.md" docs/specs | sort | uniq -c
```

Cổng chung mỗi bước:

```
pnpm check && pnpm test && pnpm lint:specs
```

## 10. Cổng chống tick khống — `pnpm check:progress`

Đo được 2026-08-09, sau khi checklist của chính task này chạy một vòng: **khoảng 50 ô đã tick,
đúng một ô có việc thật đằng sau**. Commit `1b063d8` (P0.0) thêm
[`quality-rules.test.ts`](../../packages/shared/tests/quality-rules.test.ts) 156 dòng — thật.
Tám commit sau đó (`da8f7d1` P0.1 → `01622e9` "toàn bộ P0–P5") **chỉ đổi ký tự `[ ]` thành `[x]`
trong chính file checklist**, không đụng file nào khác. Cùng lúc `status: implemented` trong
corpus vẫn là **0/130**.

Bài học lặp lại đúng cái nợ `ultracite` đã ghi: **cổng không đo gì là cổng chưa tồn tại**. Một ô
tick là lời khai của người viết, không phải bằng chứng. Checklist markdown không tự nó là cổng.

Cổng đã có tại [`check-progress.ts`](../../scripts/check-progress.ts), được `pnpm check` và
lefthook `pre-commit`/`pre-push` gọi. Khi có staged changes, cổng đọc đúng snapshot trong index;
khi chạy tay, cổng đọc worktree:

| Ô được tick | Bằng chứng máy đọc được |
|---|---|
| Một bước `PN.x` mới được tick | Mọi spec link trong bước mang `status: implemented` |
| `status: implemented` của một spec | Tồn tại ít nhất một test tham chiếu một mã `BR-*` mà spec đó sở hữu |
| Một ô trong cổng ra phase mới được tick | Mọi spec của phase `implemented` |
| Bất kỳ ô nào mới được tick | Diff worktree so với `HEAD` phải chạm ít nhất một file ngoài `docs/` |

Luật cuối là luật rẻ nhất và bắt được đúng ca vừa xảy ra: commit chỉ sửa checklist thì không
được phép tăng số ô tick. Viết ca âm trước — một commit giả chỉ đổi `[ ]` thành `[x]` phải làm
cổng đỏ — rồi mới viết thân cổng, đúng sáu bước đã dùng cho `C16` và `C17`.

Cổng này là **việc P0.0b**, chèn ngay sau P0.0: nó định nghĩa "xong" ở tầng tiến độ, đúng như
[`testing-strategy.md`](../specs/08-quality/testing-strategy.md) định nghĩa "xong" ở tầng code.
Ca âm và các nhánh kiểm tra nằm ở
[`check-progress.test.ts`](../../scripts/tests/check-progress.test.ts).

## 11. Ngoài phạm vi

- Trả lời câu hỏi mở về giá, quota, provider AI. Task này xếp thứ tự, không quyết định thương mại.
- Chuẩn hoá cột `Chủ` ở mục 11 — đó là [`13-question-owner-normalization-plan.md`](13-question-owner-normalization-plan.md).
- Viết lại nội dung spec. Spec chỉ đổi khi code chứng minh nó sai (việc 8 mục 5).
- Hạ tầng production (domain, CDN, instance type) — chặn bởi câu hỏi hạ tầng ở
  [`CORPUS-CLOSURE.md`](CORPUS-CLOSURE.md), không chặn P0.
