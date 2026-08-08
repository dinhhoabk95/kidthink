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
| [`ai-codegen-pipeline.md`](../specs/01-platform/ai-codegen-pipeline.md) | 6 vùng cấm của AI codegen; luật này áp lên chính cách task này viết code |
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
| Cạnh trỏ tới spec ở phase **sau** | 4 |

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

Bốn cạnh đảo phase, xử lý từng cái ở bước 1:

| Cạnh | Đọc được gì |
|---|---|
| [`schema-identity-billing.md`](../specs/01-platform/schema-identity-billing.md) (P0) → [`payment-flow.md`](../specs/00-foundation/payment-flow.md) (P2) | Chỉ mượn enum `status` §7. Contract-only: P0 tạo cột, P2 làm luồng. Giữ nguyên |
| [`schema-content-taxonomy.md`](../specs/01-platform/schema-content-taxonomy.md) (P0) → [`game-template-contract.md`](../specs/01-platform/game-template-contract.md) (P1) | Thân không nhắc. Cạnh cần xác minh hoặc bỏ |
| [`ai-codegen-pipeline.md`](../specs/01-platform/ai-codegen-pipeline.md) (P0) → [`game-template-contract.md`](../specs/01-platform/game-template-contract.md) (P1) | Thân không nhắc. Cạnh cần xác minh hoặc bỏ |
| [`backup-and-restore.md`](../specs/01-platform/backup-and-restore.md) (P0) → [`job-queue.md`](../specs/01-platform/job-queue.md) (P1) | Thân không nhắc. Nếu backup chạy bằng job định kỳ thì đây là dep thật và một trong hai spec sai phase |

## 4. Bốn quyết định thiết kế

**D1 — Đơn vị làm việc là một bước roadmap, không phải một spec.** Nhiều bước gộp 3–8 spec chỉ
có nghĩa khi đi cùng nhau (bước P0 #10 gộp 4 spec auth; tách ra thì không có gì chạy được giữa
chừng). Một bước = một nhánh = một PR.

**D2 — Mỗi bước là một lát dọc.** Schema → API → UI → test trong cùng một bước, không phải làm
hết schema toàn dự án rồi mới tới API. Đây là nguyên tắc 5 của chính
[`roadmap.md`](../specs/roadmap.md), và là lý do bước P0 #10 tồn tại dưới dạng "auth end-to-end"
chứ không phải "bảng `users`".

**D3 — Độ chi tiết giảm dần theo phase.** P0 viết chi tiết tới từng spec ngay bây giờ. P1–P2
viết ở mức bước, danh sách spec đầy đủ, tiêu chí nghiệm thu viết khi vào phase. P3–P5 chỉ giữ
thứ tự và điều kiện mở.
Lý do đo được: 9 trong 22 câu hỏi mở của P4/P5 là giá và quota **chưa chốt**
([`CORPUS-CLOSURE.md`](CORPUS-CLOSURE.md)); viết tiêu chí nghiệm thu cho chúng bây giờ là bịa số.

**D4 — Không spec nào được coi là "xong" khi chưa có test.** [`testing-strategy.md`](../specs/08-quality/testing-strategy.md)
là spec P0 và là một trong 9 lỗ hổng — nó phải vào sớm, vì nó định nghĩa "xong" cho mọi bước sau.

## 5. Quy trình chuẩn cho một bước — tám việc, đúng thứ tự

1. Đọc **toàn bộ** spec của bước, không chỉ mục 7. Mục 11 (câu hỏi mở) đọc trước tiên: câu chưa
   chốt trong bước này là rủi ro phải nêu ngay, không phải phát hiện lúc code.
2. Liệt kê `depends_on` của mọi spec trong bước; xác nhận từng dep đã `implemented`. Lệch với
   roadmap thì dừng, theo mục 3.
3. Liệt kê mã `BR-*` mà bước phải thực thi; đối chiếu [`business-rules.md`](../specs/00-foundation/business-rules.md)
   để không bỏ rule nào và không tự chế rule mới.
4. Viết test trước theo [`testing-strategy.md`](../specs/08-quality/testing-strategy.md) — **phải đỏ**.
5. Code tới khi test xanh. Không đụng 6 vùng cấm của [`ai-codegen-pipeline.md`](../specs/01-platform/ai-codegen-pipeline.md).
6. `pnpm check && pnpm test && pnpm lint:specs` xanh.
7. Nếu bước làm lộ ra spec sai: sửa spec **trong cùng PR**, kèm lý do. Spec là hợp đồng — code
   lệch spec mà spec không đổi là nợ im lặng.
8. Một commit cho mỗi lát chạy được; PR gộp cả bước.

Việc 3 là việc hay bị bỏ nhất. [`business-rules.md`](../specs/00-foundation/business-rules.md)
có 126 tiền tố `BR`; bỏ sót một rule gating
hoặc một rule dữ liệu trẻ là loại lỗi không lộ ra ở test hạnh phúc.

## 6. Thứ tự — toàn bộ 130 spec

```
Bước 1  : Vá 12 lỗ hổng roadmap + xử lý 4 cạnh đảo phase   → Cổng dừng A
P0      : 11 bước roadmap + 9 spec mới vá vào (35 spec)     → Cổng ra P0 (SPEC.md §13)
P1      : 16 bước roadmap (43 spec)                         → Cổng ra P1
P2      : 11 bước roadmap (31 spec)                         → Cổng ra P2
P3      :  8 bước roadmap (12 spec)                         → Cổng ra P3 = hết MVP
P4      :  8 spec add-on, mỗi cái lên catalog cùng tính năng
P5      :  1 spec + hạng mục scale
```

Chín spec vá vào P0 xếp thế này, suy từ cái chúng chặn:

| Chèn vào | Spec | Vì sao đúng chỗ đó |
|---|---|---|
| Trước bước 1 | [`testing-strategy.md`](../specs/08-quality/testing-strategy.md) · [`ai-codegen-pipeline.md`](../specs/01-platform/ai-codegen-pipeline.md) · [`mvp-scope.md`](../specs/00-foundation/mvp-scope.md) | Định nghĩa "xong", vùng cấm, và cắt phạm vi — ba thứ áp lên mọi bước sau |
| Sau bước 8 (migration đầu) | [`backup-and-restore.md`](../specs/01-platform/backup-and-restore.md) · [`health-check.md`](../specs/01-platform/health-check.md) | Có dữ liệu thật rồi mới có cái để sao lưu; deploy phải quan sát được |
| Trước bước 10 (auth) | [`notification-service.md`](../specs/01-platform/notification-service.md) · [`rate-limiting.md`](../specs/01-platform/rate-limiting.md) | Auth P0 gửi email và cần guard ngay lần chạy đầu, không vá sau |
| Sau bước 11 (audit) | [`admin-auth.md`](../specs/06-admin/admin-auth.md) | Cần audit trước, và mở khoá cả vùng admin P2 |
| Cổng ra P0 | [`security-checklist.md`](../specs/08-quality/security-checklist.md) | Là chính cổng, không phải một bước |

Ba registry ([`business-rules.md`](../specs/00-foundation/business-rules.md),
[`error-codes.md`](../specs/00-foundation/error-codes.md),
[`event-catalog.md`](../specs/00-foundation/event-catalog.md)) không nhận bước riêng. Thay vào
đó, việc 3 của quy trình mục 5 bắt buộc tra chúng ở **mọi** bước.

## 7. Cổng dừng

### Cổng dừng A — sau bước 1, trước dòng code đầu tiên

- [`roadmap.md`](../specs/roadmap.md) phủ **130/130** spec; lệnh đếm ở mục 9 ra 0 spec thiếu.
- Bốn cạnh đảo phase đã xử lý: mỗi cái hoặc được xác minh là contract-only, hoặc bị bỏ, hoặc
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
| Code lệch spec, spec không đổi | Nợ im lặng: spec thành tài liệu chết trong khi nó là hợp đồng | Việc 7 mục 5 — sửa spec trong cùng PR |
| Viết tiêu chí nghiệm thu cho P4/P5 ngay bây giờ | Bịa số cho 9 câu hỏi giá/quota chưa chốt | D3 — độ chi tiết giảm dần; P4/P5 chỉ giữ thứ tự |
| Bắt đầu code khi Task #13 chưa xong | Điều kiện 3 của cổng ra phase không kiểm được bằng máy | Task #13 chạy trước hoặc song song bước 1; hai task không đụng cùng file |
| Nội dung là đường găng, không phải code | ≥120 game level + ≥690 LO cần **người đọc review**; seeder không giảm chi phí đó | Nhóm D của [`roadmap.md`](../specs/roadmap.md) — bắt đầu biên soạn seeder sớm nhất có thể, song song P0 |

## 9. Kiểm chứng

Roadmap phủ hết 130 spec (phải in ra rỗng sau bước 1):

```
for f in $(grep -rl "^spec: " --include="*.md" docs/specs | grep -v TEMPLATE); do
  b=$(basename "$f"); grep -q -- "$b" docs/specs/roadmap.md || echo "THIẾU: $f";
done
```

Đếm tiến độ theo `status`:

```
grep -rh "^status: " --include="*.md" docs/specs | sort | uniq -c
```

Cổng chung mỗi bước:

```
pnpm check && pnpm test && pnpm lint:specs
```

## 10. Ngoài phạm vi

- Trả lời câu hỏi mở về giá, quota, provider AI. Task này xếp thứ tự, không quyết định thương mại.
- Chuẩn hoá cột `Chủ` ở mục 11 — đó là [`13-question-owner-normalization-plan.md`](13-question-owner-normalization-plan.md).
- Viết lại nội dung spec. Spec chỉ đổi khi code chứng minh nó sai (việc 7 mục 5).
- Hạ tầng production (domain, CDN, instance type) — chặn bởi câu hỏi hạ tầng ở
  [`CORPUS-CLOSURE.md`](CORPUS-CLOSURE.md), không chặn P0.
