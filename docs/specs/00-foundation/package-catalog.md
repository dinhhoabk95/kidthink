---
spec: PACKAGE-CATALOG
title: Catalog gói cước và giá
area: foundation
status: implemented
mvp: true
phase: P0
reviewed: 2026-08-06
owns:
  - Danh sách SKU và giá
  - Ánh xạ package → entitlement key → quota
  - Quy tắc gói nào được chào bán
depends_on:
  - ENTITLEMENT-MODEL
  - ACCESS-LADDER
---

# Catalog gói cước và giá

## 1. Objective

Một nguồn sự thật duy nhất cho **bán gì, giá nào, mở được gì**. Paywall xuất hiện ở ít nhất
bốn chỗ (game level, curriculum, báo cáo nâng cao, số hồ sơ trẻ) — bốn chỗ đó phải nói cùng
một điều.

`PACKAGE_CATALOG` là hằng số **Lớp 1**. Giá đổi qua PR, không qua UI.

## 2. Actors

| Actor | Làm gì |
|---|---|
| Guest / User | Xem catalog công khai, chọn gói |
| Manager `super_admin` | **Chỉ xem.** Không sửa giá qua UI |
| Dev | Đổi catalog qua PR + deploy |

## 3. Entry points

| Route / nơi | Ghi chú |
|---|---|
| `GET /api/guest/packages` | Catalog công khai — chỉ gói `is_public` |
| `/pricing` | Trang giá |
| `/me/subscription` | Gói hiện tại + gợi ý nâng cấp |
| `06-admin/package-catalog-admin.md` | Admin xem, read-only |

## 4. Main flow — hiển thị catalog

1. Đọc `PACKAGE_CATALOG` (hằng số), lọc `is_public = true` và `status = 'active'`.
2. Với mỗi gói, nạp offer (chu kỳ + giá) đang mở.
3. Nếu User đã đăng nhập: đánh dấu gói đang sở hữu, tính giá nâng cấp nếu có.
4. Trả kèm danh sách entitlement key và quota mà gói mở — để UI liệt kê quyền lợi **từ dữ
   liệu**, không từ chuỗi viết tay trong component.

## 5. Alternative flows

| Nhánh | Hành vi |
|---|---|
| Gói `is_public = false` | Không xuất hiện trong catalog. Chỉ Manager gán được |
| Gói `status = 'retired'` | Không bán mới. User đang giữ vẫn dùng tới `expires_at` |
| User đã có `premium` | `standard` hiện dạng "đã bao gồm", không cho mua |
| Add-on ở MVP | **Không xuất hiện.** Tạo đơn cho add-on → 400 `PACKAGE_NOT_SELLABLE` |

## 6. Business rules

| ID | Rule | Vì sao |
|---|---|---|
| `BR-PKG-01` | `PACKAGE_CATALOG` là **nguồn sự thật duy nhất** cho giá và thời hạn | Một giá copy sang 5 chỗ sẽ đổi được 4 |
| `BR-PKG-02` | **NEVER hardcode số tiền** ngoài catalog — kể cả trong spec, email, hay trang giá | Hardcode giá dẫn đến bất đồng bộ dữ liệu hiển thị và rủi ro sai lệch thương mại khi đổi giá |
| `BR-PKG-03` | **NEVER nhận giá từ client.** Server đọc từ catalog theo `package_code` | Giá từ client là lỗ hổng thanh toán kinh điển |
| `BR-PKG-04` | Catalog MVP chào bán **đúng 2 gói**: `standard`, `premium` | Bán gói không mở được tính năng nào là vấn đề đạo đức thương mại |
| `BR-PKG-05` | Add-on được **khai báo** nhưng `is_public = false` ở MVP | Contract ổn định trước; lên catalog cùng lúc với tính năng |
| `BR-PKG-06` | Quyền lợi hiển thị trên trang giá sinh **từ `package_entitlements`**, không từ chuỗi viết tay | Danh sách viết tay sẽ lệch khỏi thứ hệ thống thực sự cấp |
| `BR-PKG-07` | Package là **Lớp 1** — admin không tạo/sửa qua UI | Giá và quyền lợi là contract thương mại, đổi phải qua review |
| `BR-PKG-08` | `premium` **bao hàm** mọi entitlement của `standard` | Ladder bao hàm — `BR-LAD-01` |
| `BR-PKG-09` | Đổi giá không hồi tố. Entitlement đã cấp giữ nguyên thời hạn | Người đã trả tiền không bị ảnh hưởng bởi quyết định thương mại sau đó |

## 7. Data

### 7.1 Catalog MVP

| | `standard` | `premium` |
|---|---|---|
| `code` | `PKG-standard` | `PKG-premium` |
| Tên hiển thị | Tiêu chuẩn | Premium |
| Đối tượng | Phụ huynh phổ thông | Phụ huynh theo dõi sâu + giáo viên |
| Offer | 365 ngày | 365 ngày · vĩnh viễn |
| Giá | **chờ chốt** §11 Q1 | **chờ chốt** §11 Q1 |
| `is_public` | Có | Có |

**Entitlement mở:**

| Key | `standard` | `premium` |
|---|:--:|:--:|
| `play_login_games` | Có | Có |
| `play_standard_games` | Có | Có |
| `play_premium_games` | Không | Có |
| `access_premium_curriculum` | Không | Có |
| `manage_children` | Có | Có |
| `view_basic_report` | Có | Có |
| `view_advanced_report` | Có | Có |

**Quota:**

| Quota | `standard` | `premium` |
|---|---:|---:|
| `child_profiles` | 3 | 5 |
| `daily_play_minutes` | 60 | 90 |

`premium` **bao hàm quyền học của Creator** — xem mọi nội dung, báo cáo nâng cao, curriculum
đặc biệt. Không có SKU "Creator" riêng. Quyền **tạo** nằm ở add-on.

### 7.2 Add-on — khai báo, `is_public = false` ở MVP

| `code` | Mở entitlement | Lên catalog khi |
|---|---|---|
| `PKG-addon_lesson_plan` | `create_lesson_plan` `duplicate_lesson` `customize_lesson` `export_pdf` | `07-addon/lesson-plan-creator.md` đạt `implemented` |
| `PKG-addon_curriculum` | `create_custom_curriculum` | `07-addon/personal-curriculum.md` đạt `implemented` |
| `PKG-addon_custom_game` | `create_custom_game` | `07-addon/custom-game-builder.md` đạt `implemented` |
| `PKG-addon_ai` | `use_ai_analysis` `use_ai_search` | `07-addon/ai-credit-ledger.md` đạt `implemented` |

Add-on là **trục độc lập** — không mở `access_tier` nào (quy tắc `BR-ENT-08` của
[`entitlement-model.md`](entitlement-model.md)).

**"Build game custom theo yêu cầu" không phải SKU tự phục vụ** — báo giá tay, Manager tạo
trong studio rồi gán bằng `manual_grant`. Lý do: mỗi yêu cầu custom cần thẩm định sư phạm,
không tự động hoá được ở quy mô hiện tại.

### 7.3 Hình dạng hằng số

```ts
interface PackageDefinition {
  code: `PKG-${string}`;
  name: string;
  audience: string;
  description: string;
  entitlements: EntitlementKey[];
  quotas: Partial<Record<QuotaKey, number>>;
  offers: Offer[];
  is_public: boolean;
  is_featured: boolean;
  status: "active" | "retired";
}

interface Offer {
  offer_code: string;         // "annual" | "lifetime"
  billing_period: string;  // "1 năm" | "trọn đời"
  price_vnd: number;
  duration_days: number | null;  // null = vĩnh viễn
}
```

### 7.4 Bảng DB

`packages` và `package_entitlements` là **bảng chiếu** của hằng số, seed idempotent theo
`code`. Chúng tồn tại để `entitlements.entitlement_key` có FK và để join báo cáo — không
phải để sửa từ UI.

## 8. API contract

### `GET /api/guest/packages`

| | |
|---|---|
| Auth | không |
| 200 | `{ packages: [{ code, name, audience, description, is_featured, offers: [{offer_code, billing_period, price_vnd, duration_days}], benefits: [{entitlement_key, label}], quotas: {...} }] }` |

Chỉ gói `is_public && status === 'active'`.

### `GET /api/users/packages/upgrade-options`

| | |
|---|---|
| Auth | `requireUserAuth()` |
| 200 | Catalog + `already_owned: boolean` + `is_upgrade: boolean` mỗi gói |

| Mã lỗi | HTTP | Khi nào |
|---|---|---|
| `PACKAGE_NOT_FOUND` | 404 | `code` không có trong catalog |
| `PACKAGE_NOT_SELLABLE` | 400 | Gói `is_public = false` hoặc `retired` |
| `OFFER_NOT_FOUND` | 400 | `offer_code` không thuộc gói |

## 9. Acceptance criteria

```gherkin
Scenario: BR-PKG-04 — catalog MVP đúng 2 gói
  When guest gọi GET /api/guest/packages
  Then response chứa đúng 2 gói
  And code của chúng là PKG-standard và PKG-premium

Scenario: BR-PKG-05 — add-on không bán được ở MVP
  Given user đã đăng nhập
  When user gọi POST /api/users/orders với package_code = "PKG-addon_ai"
  Then hệ thống trả 400 PACKAGE_NOT_SELLABLE
  And không tạo đơn nào

Scenario: BR-PKG-03 — giá không nhận từ client
  Given user đã đăng nhập
  When user POST /api/users/orders với body chứa amount = 1000
  Then đơn được tạo với số tiền đọc từ PACKAGE_CATALOG
  And amount trong body bị bỏ qua

Scenario: BR-PKG-06 — quyền lợi sinh từ dữ liệu
  Given trang /pricing được render
  When so sánh danh sách quyền lợi hiển thị với package_entitlements trong DB
  Then hai danh sách khớp nhau hoàn toàn

Scenario: BR-PKG-08 — premium bao hàm standard
  Given user chỉ mua gói premium
  When phân giải entitlement
  Then tập key chứa mọi key mà standard cấp

Scenario: BR-PKG-02 — không hardcode giá
  When grep tìm số tiền dạng chữ số trong apps và packages
  Then không kết quả nào nằm ngoài file định nghĩa PACKAGE_CATALOG

Scenario: BR-PKG-09 — đổi giá không hồi tố
  Given user đã mua premium với giá cũ, expires_at = D
  When PACKAGE_CATALOG đổi giá premium
  Then entitlement của user vẫn expires_at = D
  And không phát sinh khoản thu thêm
```

## 10. Boundaries

**Always**
- Đọc giá và thời hạn từ `PACKAGE_CATALOG`.
- Sinh danh sách quyền lợi từ `package_entitlements`.
- Seed bảng `packages` idempotent theo `code`.

**Ask first**
- Đổi giá, thời hạn, hoặc quota của một gói.
- Thêm SKU thứ ba vào catalog MVP.
- Đặt `is_public = true` cho một add-on.
- Retire một gói đang có người dùng.

**Never**
- Hardcode giá ngoài catalog.
- Nhận giá từ client.
- Cho admin tạo/sửa package qua UI.
- Bán một gói chưa mở được tính năng nào.
- Viết tay danh sách quyền lợi trong component.

## 11. Open questions

| # | Câu hỏi | Chặn gì | Chặn phase | Chủ |
|---|---|---|---|---|
| 1 | **Giá cuối** của `standard` (365 ngày) và `premium` (365 ngày / vĩnh viễn) | Mở thanh toán, P2 | Hoãn, chặn phase P2 | người quyết |
| ~~2~~ | ~~Có bán gói tháng không, hay chỉ năm~~ **Đóng 2026-08-06 (T12)**: **chỉ năm ở MVP**. Enum `billing_period` giữ chỗ cho `monthly`; kích hoạt khi có cổng thanh toán tự động (P5). Gói tháng tăng tải duyệt tay VietQR lên 12× | — | Đã đóng | D-X (T12) |
| 3 | Giá nâng cấp `standard → premium` giữa chu kỳ tính thế nào — trừ theo tỉ lệ hay giá đầy đủ? | Luồng nâng cấp | Hoãn, chặn phase P2 | hoãn |
| 4 | `premium` vĩnh viễn có rủi ro chi phí dài hạn không? Cần mô hình chi phí phục vụ mỗi user/năm | Quyết định thương mại | Hoãn, chặn thương mại | hoãn |
