# Kế hoạch — Task #91: Bằng chứng test cho hai spec P0 còn nợ

> **Loại task:** đóng nợ bằng chứng (S/M). Checklist: [`91-p0-test-evidence-todo.md`](91-p0-test-evidence-todo.md).
> Thứ tự và phạm vi tám task: [`REMAINING-SEQUENCE.md`](REMAINING-SEQUENCE.md). Chạy song song với [`Task #90`](90-vps-deploy-plan.md).
> **Spec đóng:** [`security-checklist.md`](../specs/08-quality/security-checklist.md) · [`business-rules.md`](../specs/00-foundation/business-rules.md).

## 1. Outcome

Hai spec P0 cuối cùng rời `approved` sang `implemented` **bằng bằng chứng máy đọc được**, không
bằng lời khai. Sau task này, mọi spec P0 còn lại đều là spec chưa có code (năm spec phát hành),
nên cổng ra P0 chỉ còn chờ [`Task #90`](90-vps-deploy-plan.md).

Hai spec này khác nhau về bản chất, và đó là lý do chúng nằm cùng một task: cả hai đều **không
thiếu code**, chúng thiếu thứ chứng minh code tuân rule.

## 2. Bằng chứng đo được (2026-08-18)

1. **Không test nào gọi tên `BR-SEC-*`.** Cổng `check:progress` đã siết nên bằng chứng đi vay
   (`BR-ACT-03`, `BR-CDC-06`) không còn tính.
2. Chỉ **2 trong 10** rule của [`security-checklist.md`](../specs/08-quality/security-checklist.md)
   có neo trong mã: `BR-SEC-04` ở `apps/web/server/utils/request-body.ts:5`, `BR-SEC-05` ở
   `apps/web/server/api/managers/levels/index.post.ts:21`. Tám rule còn lại không có neo nào.
3. Việc thi hành **có tồn tại nhưng vô danh**: `lint:route-validation` quét 245 route và báo **24
   route còn nợ** validate body; cấu hình `nuxt-security` cộng chính sách nội dung ở cả hai app;
   66 route trả 404 khi record thuộc người khác. Không chỗ nào nhắc mã rule.
4. `BR-SEC-04` hiện là **ngưỡng "không tăng"**, không phải luật: 24 route nợ vẫn xanh.
5. [`business-rules.md`](../specs/00-foundation/business-rules.md) sở hữu 4 rule `BR-REG2-*`.
   `BR-REG2-01` và `BR-REG2-03` được `lint:specs` C6 thi hành một phần; **`BR-REG2-02` và
   `BR-REG2-04` không có cổng nào**.
6. §3 của nó dẫn `pnpm gen:check` — **lệnh không tồn tại** trong `package.json`.
7. Hai đảo chiều phụ thuộc: [`type-safety.md`](../specs/08-quality/type-safety.md) đã
   `implemented` mà khai `depends_on` spec chưa implemented này; bốn spec P5 đã `implemented` khai
   `depends_on` [`business-rules.md`](../specs/00-foundation/business-rules.md).

## 3. Assumptions và ranh giới

1. **Không viết lại code bảo mật.** Task này viết test và đặt tên rule cho việc thi hành đã có.
   Ngoại lệ duy nhất là 24 route còn nợ validate body ở WP91.2.
2. **Rule kiểm được bằng máy mới có test.** `BR-SEC-01` (review người thứ hai) và phần thuê kiểm
   thử xâm nhập là cổng người; chúng được ghi là cổng người, không giả vờ tự động hoá.
3. **Cổng mới phải kèm ca âm.** Kho đã có tiền lệ một cổng thoát mã 0 trong khi có lỗi.
4. **Trạng thái của một registry là câu hỏi người.** Nếu chủ dự án chốt rằng
   [`business-rules.md`](../specs/00-foundation/business-rules.md) giữ `approved` vĩnh viễn thì
   WP91.3 và WP91.5 đổi thành một dòng lý do trong spec, và task vẫn đóng.

## 4. Thứ tự

```text
WP91.0  Chốt câu hỏi trạng thái registry (cổng người)
  ├──→ WP91.1  Test gọi tên BR-SEC-* cho phần kiểm được bằng máy
  │      └──→ WP91.2  Đóng 24 route nợ validate; BR-SEC-04 từ ngưỡng thành luật
  ├──→ WP91.3  Cổng cho BR-REG2-02 và BR-REG2-04, kèm ca âm
  │      └──→ WP91.4  Sửa §3: bỏ hoặc hiện thực hoá lệnh được dẫn
  └──────────→ WP91.5  Lật status hai spec, xác nhận cổng
```

WP91.1 và WP91.3 độc lập nhau, chạy song song được.

## 5. Work packages

| ID | Cỡ | Công việc | Kết quả kiểm được |
|---|---:|---|---|
| WP91.0 | S | Trả lời: registry quản trị corpus có bao giờ đạt `implemented` không? Ghi câu trả lời vào spec | Một trong hai đường đi được chọn bằng văn bản, không bằng im lặng |
| WP91.1 | M | Test gọi tên `BR-SEC-02`, `BR-SEC-04`, `BR-SEC-05`, `BR-SEC-06`, `BR-SEC-07`, `BR-SEC-10` — mỗi rule một test khẳng định hành vi, không phải khẳng định sự tồn tại của tệp | `pnpm vitest run` xanh; mã rule xuất hiện trong tệp test |
| WP91.2 | M | Thêm validate body cho 24 route còn nợ; đổi `lint:route-validation` từ ngưỡng "không tăng" sang 0 | Cổng báo 0 route nợ; fixture route thiếu validate làm cổng đỏ |
| WP91.3 | M | Cổng `lint:rule-ids`: so với `HEAD`, mã rule biến mất hoặc bị tái dùng thì đỏ (`BR-REG2-02`); mã rule không được spec nào dẫn thì đỏ (`BR-REG2-04`) | Ca âm: xoá một mã rule trong fixture, đổi nghĩa một mã — cả hai đỏ |
| WP91.4 | S | Sửa §3 của [`business-rules.md`](../specs/00-foundation/business-rules.md): bỏ lệnh không tồn tại, hoặc thêm lệnh thật vào `package.json` | Mọi lệnh được spec dẫn đều chạy được |
| WP91.5 | S | Lật `status` hai spec sang `implemented` sau khi có test gọi mã rule của chúng | `pnpm check:progress` xanh; `pnpm lint:specs` xanh |

## 6. Acceptance criteria

```gherkin
Scenario: BR-SEC-04 — mọi route đều validate body
  Given một route mới nhận body mà không validate
  When chạy cổng kiểm validate route
  Then cổng báo đỏ và nêu đường dẫn route đó

Scenario: BR-SEC-07 — record của người khác trả 404
  Given một người dùng đã đăng nhập
  When gọi route đọc record thuộc người dùng khác
  Then phản hồi là 404
  And phản hồi không tiết lộ record đó tồn tại

Scenario: BR-REG2-02 — mã rule bất biến
  Given một mã rule đã tồn tại ở HEAD
  When mã đó bị xoá hoặc bị gán nghĩa khác
  Then cổng kiểm mã rule báo đỏ

Scenario: Bằng chứng đi vay không đóng được spec
  Given security-checklist chỉ có test gọi mã rule của spec khác
  When chạy check:progress với status implemented
  Then cổng báo IMPLEMENTED_SPEC_WITHOUT_BR_TEST
```

## 7. Verification

```bash
pnpm exec biome check .
pnpm lint:specs
pnpm lint:route-validation
pnpm check
pnpm vitest run apps/web/tests scripts/tests
```

## 8. Definition of done

- Sáu rule `BR-SEC-*` kiểm được bằng máy đều có test gọi đúng mã.
- `lint:route-validation` báo 0 route còn nợ, và ngưỡng "không tăng" đã bị thay bằng 0.
- `BR-REG2-02` và `BR-REG2-04` có cổng, mỗi cổng có ca âm chứng minh đỏ được.
- Không lệnh nào được spec dẫn mà không tồn tại.
- Hai spec `implemented`, hoặc [`business-rules.md`](../specs/00-foundation/business-rules.md) mang một dòng lý do vì sao nó giữ `approved` vĩnh viễn.
- `pnpm check` và `pnpm test` xanh.
