# Kế hoạch — Task #97: Bộ dựng template (P4)

> **Loại task:** tái cấu trúc có bảo toàn hành vi, cộng công cụ (L). Checklist: [`97-template-authoring-kit-todo.md`](97-template-authoring-kit-todo.md).
> **Chặn bởi** [`Task #92`](92-game-layout-engine-plan.md) và [`Task #93`](93-deterministic-randomness-plan.md) — spec khai `depends_on` cả hai.
> **Spec đóng:** [`template-authoring-kit.md`](../specs/01-platform/template-authoring-kit.md) (P4, 14 rule, 9 scenario).

## 1. Outcome

Thêm một template mới là việc của một người trong một buổi, không phải việc đọc sáu template cũ để
đoán quy ước. Bốn nguyên thuỷ dùng lại được, một bố cục thư mục cố định, một lệnh sinh khung.

Điểm cần nói thẳng: **đây là tái cấu trúc sáu template đang chạy**, không phải thêm mới. Rủi ro
lớn nhất của task là làm hỏng thứ đang hoạt động, nên bảo toàn hành vi là điều kiện, không phải
mong muốn.

## 2. Bằng chứng đo được (2026-08-18)

1. Sáu thư mục template GT-001 tới GT-006 đã tồn tại và đang chạy.
2. Hôm nay khai báo template nằm tách trong thư mục hợp đồng, kèm một registry **duy trì bằng
   tay**. Spec đòi mỗi template có tệp khai báo và tệp phiên riêng dưới thư mục của chính nó.
3. §7 của spec nêu hai khái niệm lưu trữ — gói nội dung và phiên bản nội dung. **Cả hai không có
   trong lược đồ** (đã quét 78 bảng). Hoặc thêm migration, hoặc thu hẹp phạm vi spec: đây là quyết
   định người, không phải chi tiết cài đặt.
4. Spec khai `depends_on` cả bộ dựng layout và ngẫu nhiên có seed — hai thứ vừa được làm ở
   [`Task #92`](92-game-layout-engine-plan.md) và [`Task #93`](93-deterministic-randomness-plan.md).
   Làm task này trước hai task đó là viết nguyên thuỷ quanh hai lỗ trống.
5. §11 Q1 (bốn nguyên thuỷ có phủ được template 7 tới 20 không) cần **danh sách cơ chế dự kiến từ
   phía nội dung**; §11 Q3 (60 loại game của bản v1 port sang bao nhiêu template) giờ trả lời được.

## 3. Assumptions và ranh giới

1. **Bảo toàn hành vi là điều kiện đóng task.** Test template hiện có phải cho **cùng kết quả**
   trước và sau tái cấu trúc, không chỉ "vẫn xanh".
2. **Không thiết kế nguyên thuỷ cho tương lai chưa ai mô tả.** Nếu phía nội dung chưa đưa danh
   sách cơ chế, WP97.2 dừng ở bốn nguyên thuỷ mà sáu template hiện tại thật sự cần.
3. **Gói nội dung và phiên bản nội dung**: mặc định là thu hẹp phạm vi spec cho MVP và ghi lý do,
   vì thêm hai khái niệm lưu trữ chỉ để phục vụ một bộ công cụ soạn là đổi mô hình dữ liệu vì lý
   do sai. Người quyết ở WP97.4.
4. **Lệnh sinh khung chỉ sinh khung.** Nó không sửa template đang có, không tự đăng ký vào
   registry mà không có người xem.
5. **Không chạm sáu template về mặt nội dung.** Chỉ đổi chỗ đặt tệp và chỗ dùng lại mã.

## 4. Thứ tự

```text
WP97.0  Danh sách cơ chế dự kiến từ phía nội dung (cổng người, §11 Q1 và Q3)
  └──→ WP97.1  Chuyển sáu template sang bố cục thư mục của spec, giữ nguyên hành vi
         └──→ WP97.2  Bốn nguyên thuỷ, rút từ chỗ sáu template đang lặp
                ├──→ WP97.3  Lệnh sinh khung template + thư mục sinh
                ├──→ WP97.4  Quyết định gói nội dung và phiên bản nội dung (cổng người)
                └──→ WP97.5  Cổng chặn template lệch bố cục, kèm ca âm
                       └──→ WP97.6  Verification, lật status
```

## 5. Work packages

| ID | Cỡ | Công việc | Kết quả kiểm được |
|---|---:|---|---|
| WP97.0 | S | Lấy danh sách cơ chế dự kiến cho template 7 tới 20; trả lời Q1 và Q3; ghi vào §11 | Danh sách có thật, hoặc ghi rõ WP97.2 chỉ phục vụ sáu template hiện tại |
| WP97.1 | L | Chuyển sáu template sang bố cục `templates/<mã>/` với tệp khai báo và tệp phiên riêng; bỏ registry duy trì tay | Test template cho **cùng kết quả** trước và sau; snapshot hành vi so khớp |
| WP97.2 | M | Rút bốn nguyên thuỷ từ phần sáu template đang lặp; dùng bộ dựng layout của [`Task #92`](92-game-layout-engine-plan.md) và nguồn ngẫu nhiên của [`Task #93`](93-deterministic-randomness-plan.md) | Mỗi nguyên thuỷ có test riêng; số dòng lặp giữa sáu template giảm, đo được |
| WP97.3 | M | Lệnh sinh khung template: sinh thư mục, khai báo, phiên, và test rỗng | Sinh một template thử, `pnpm check` xanh, template thử không tự vào registry |
| WP97.4 | S | Quyết định: thêm migration cho hai khái niệm lưu trữ, hay thu hẹp phạm vi spec | Một trong hai đường được ghi vào spec kèm lý do |
| WP97.5 | S | Cổng chặn template lệch bố cục hoặc thiếu tệp bắt buộc, kèm fixture sai | Cổng đỏ trên fixture; xanh trên sáu template đã chuyển |
| WP97.6 | S | Verification đầy đủ; lật `status` | 14 rule có test; `pnpm check` và `pnpm test` xanh |

## 6. Acceptance criteria

```gherkin
Scenario: Tái cấu trúc không đổi hành vi
  Given sáu template đang chạy và bộ test của chúng
  When chuyển sang bố cục thư mục mới
  Then mọi test template cho cùng kết quả như trước khi chuyển

Scenario: Template lệch bố cục bị chặn
  Given một thư mục template thiếu tệp khai báo
  When chạy cổng kiểm bố cục template
  Then cổng báo đỏ và nêu tệp còn thiếu

Scenario: Lệnh sinh khung không tự đăng ký
  Given một template vừa được sinh
  When chạy cổng kiểm registry
  Then template đó chưa được đăng ký, và cổng nói rõ cần người xem

Scenario: Nguyên thuỷ dùng nguồn ngẫu nhiên có seed
  Given một nguyên thuỷ cần xáo trộn
  When dựng phiên hai lần với cùng seed
  Then hai lần cho cùng kết quả
```

## 7. Verification

```bash
pnpm exec biome check .
pnpm lint:specs
pnpm check
pnpm vitest run packages/game-engine
pnpm test
```

## 8. Definition of done

- Sáu template nằm trong bố cục của spec; registry không còn duy trì bằng tay.
- Test template cho cùng kết quả trước và sau tái cấu trúc.
- Bốn nguyên thuỷ có test riêng, và dùng bộ dựng layout cùng nguồn ngẫu nhiên có seed.
- Lệnh sinh khung sinh được một template chạy được, và không tự đăng ký.
- Quyết định về hai khái niệm lưu trữ được ghi vào spec, không để lửng.
- Cổng bố cục có ca âm; 14 rule có test; spec `implemented`.
