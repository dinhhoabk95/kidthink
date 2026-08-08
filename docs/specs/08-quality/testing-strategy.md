---
spec: TESTING-STRATEGY
title: Chiến lược kiểm thử
area: quality
status: approved
mvp: true
phase: P0
reviewed: 2026-08-08
owns:
  - Tầng test, ngưỡng coverage, bài test không được rút gọn
depends_on:
  - CONVENTIONS
---

# Chiến lược kiểm thử

## 1. Objective

Test là **cách duy nhất** biết một thay đổi có phá thứ đang chạy không. Trên một hệ thống có
gating, thanh toán, và dữ liệu trẻ em, "chắc là ổn" không phải một mức đảm bảo.

Spec này sở hữu **ngưỡng và danh sách bắt buộc**. Cách viết test theo [`CONVENTIONS.md`](../CONVENTIONS.md) §6 —
mọi Gherkin scenario map sang đúng một test.

## 2. Actors

Dev · cổng tự động.

## 3. Entry points

`pnpm test` · `pnpm test:coverage` · `pnpm test:e2e` · cổng tự động.

## 4. Main flow

1. Spec `approved` → `pnpm gen:tests` sinh `test.todo` từ Gherkin.
2. TDD: RED → GREEN → REFACTOR.
3. `pnpm check` + `pnpm test` xanh trước khi mở PR.
4. Cổng tự động chạy đủ tầng, chặn merge khi đỏ hoặc coverage tụt.

## 5. Alternative flows

| Nhánh | Hành vi |
|---|---|
| Test flaky | Quarantine + issue, Cấm — **NEVER xoá** |
| Coverage tụt dưới ngưỡng | cổng tự động fail |
| Test chậm | Tách suite, không bỏ |

## 6. Business rules

| ID | Rule | Vì sao |
|---|---|---|
| `BR-TST-01` | Critical path ≥ **85%**; toàn bộ ≥ **80%** | Dưới 80% là không biết thay đổi có phá gì không; 85% cho critical vì hậu quả khi bug ở gating/thanh toán lớn hơn |
| `BR-TST-02` | Cấm — **NEVER mock DB** — dùng PostgreSQL thật qua Docker | Mock DB không kiểm được ràng buộc, mà ràng buộc là thứ đáng kiểm nhất |
| `BR-TST-03` | Cấm — **NEVER gọi LLM thật** trong test | Chi phí và không tái lập |
| `BR-TST-04` | Cấm — **NEVER `setTimeout` để chờ** — dùng `expect.poll()` / `waitFor` | Test chờ theo đồng hồ là test flaky |
| `BR-TST-05` | Cấm — **NEVER chạm DB / S3 / email production** | Test đụng DB production là sự cố dữ liệu; đụng S3 production là tốn tiền và rủi ro ghi đè |
| `BR-TST-06` | Cấm — **NEVER dữ liệu random không seed** | Snapshot test cần tái lập |
| `BR-TST-07` | Test flaky **quarantine**, không xoá | Xoá test flaky là xoá tín hiệu |
| `BR-TST-08` | Bài ở §7.3 Cấm — **NEVER rút gọn** | Đó là danh sách bài đã chốt vì hậu quả khi thiếu; rút gọn là tự mở cửa cho bug ở vùng nhạy cảm |
| `BR-TST-09` | Mock **chỉ biên ngoài**: LLM, S3, email, OAuth. Cấm — NEVER mock module nội bộ | Mock nội bộ test cái mock, không test hệ thống |
| `BR-TST-10` | Test sinh từ Gherkin là `test.todo`, không test rỗng pass | `BR-AIG-05` |

## 7. Data

### 7.1 Sáu tầng

| Tầng | Framework | Vị trí | Ngưỡng |
|---|---|---|---|
| Unit | Vitest | `*.test.ts` cạnh source | ≥80% |
| Integration | Vitest + PG Docker | `apps/web/tests/integration/` | critical ≥85% |
| Property | `fast-check` | cạnh source | mọi bất biến §7.2 |
| E2E | Playwright | `apps/web/tests/e2e/` | mỗi template ≥1 journey |
| A11y | `@axe-core/playwright` | mọi page object | 0 violation |
| Load | k6 | `infra/load/` | API P95 < 800 ms |

### 7.2 Bất biến kiểm bằng property test

- `skill_prerequisites` là **DAG** ở mọi trạng thái seed
- `p_learn ∈ [0,1]` sau mọi chuỗi cập nhật BKT
- Mọi LO thuộc đúng một skill; mọi skill thuộc đúng một strand
- **Access ladder bao hàm**: `canAccess(tier_n)` ⟹ `canAccess(tier_m)` ∀ m < n
- Mọi `content_pack` parse được bằng `content_contract` của template nó dùng
- Mọi hàng `published` từ chối UPDATE
- Số dư credit = tổng ledger

Bất biến của cây không kiểm được bằng ví dụ — một chu trình có thể chỉ xuất hiện ở tổ hợp
thứ 4.000.

### 7.3 Bài test không được rút gọn

| Bài | Vì sao |
|---|---|
| **Gating 4 tier × 5 trạng thái = 20 ô** | Gating là ma trận; test vài ô sẽ để lọt ô còn lại |
| **404 trên MỌI endpoint** có tham số trẻ | IDOR là lỗi lặp lại theo từng route mới |
| **E2E thanh toán xuyên hai app** | Luồng doanh thu; lỗi ở ranh giới hai app không bắt được bằng unit test |
| **Approve hai lần** trên cùng đơn | Duyệt trùng tạo hai subscription |
| **Biên nửa đêm ICT** cho hạn mức giờ chơi | Lỗi múi giờ chỉ hiện một giờ trong ngày — đúng giờ trẻ hay chơi |
| **Round-trip `content_pack`** trên toàn bộ level đã seed | Một level lọt lưới là một đứa trẻ gặp màn hình trắng |
| **Danh sách đóng `child_profiles`** | Ràng buộc pháp lý |
| **Không PII trong telemetry và prompt LLM** | idem |
| **E2E mỗi template** | 6 template là 6 đường code khác nhau |

### 7.4 Critical path

auth · payment và approval · child profile · **access gating** · play session ·
taxonomy traversal · content lifecycle.

### 7.5 Cấu hình E2E

Viewport mặc định **768×1024** tablet portrait · throttle 4G cho assertion hiệu năng ·
Chrome + WebKit + Firefox, 2 major gần nhất · offline test dùng **Playwright offline mode**,
không mock `navigator.onLine` · screenshot khi fail.

## 8. API contract

Không có. Ràng buộc lên cổng tự động:

```
pnpm check            → lint + tokens + typecheck
pnpm test             → unit + integration + property
pnpm test:coverage    → chặn khi tụt ngưỡng
pnpm test:e2e         → Playwright
pnpm gen:check        → spec ↔ code
```

Cả năm phải xanh để merge.

## 9. Acceptance criteria

```gherkin
Scenario: BR-TST-01 — ngưỡng coverage được ép
  When coverage critical path tụt xuống 80%
  Then cổng tự động fail

Scenario: BR-TST-02 — không mock DB
  When quét test tìm mock của drizzle hay của kết nối DB
  Then không kết quả nào

Scenario: BR-TST-04 — không chờ bằng setTimeout
  When quét test tìm setTimeout dùng để chờ
  Then không kết quả nào

Scenario: BR-TST-08 — 20 ô gating đều có test
  When đếm test của ma trận gating
  Then có đủ 20 ca

Scenario: BR-TST-10 — test sinh ra là todo
  Given một spec mới approved
  When chạy pnpm gen:tests
  Then test sinh ra là test.todo
  And pnpm test báo số todo

Scenario: BR-TST-07 — test flaky bị quarantine không bị xoá
  Given một test flaky
  Then nó nằm trong suite quarantine
  And vẫn tồn tại trong repo

Scenario: E2E chạy đúng viewport
  When chạy suite e2e
  Then viewport mặc định là 768x1024
```

## 10. Boundaries

**Always**
- PG thật cho integration test.
- Property test cho mọi bất biến §7.2.
- Giữ đủ bài §7.3.

**Ask first**
- Hạ ngưỡng coverage.
- Bỏ một bài trong §7.3.
- Thêm framework test.

**Never**
- Mock DB hoặc module nội bộ.
- Gọi LLM thật.
- `setTimeout` để chờ.
- Xoá test flaky.
- Test rỗng pass.

## 11. Open questions

| # | Câu hỏi | Chặn gì | Chặn phase | Chủ |
|---|---|---|---|---|
| 1 | Cổng tự động chạy PG Docker mất bao lâu? Nếu quá chậm cần tách suite | P0 | P0 | Infra |
| 2 | Thiết bị chuẩn đo 60 fps trong E2E là gì? | [`game-engine-runtime.md`](../01-platform/game-engine-runtime.md) Q1 | P1 | người quyết |
