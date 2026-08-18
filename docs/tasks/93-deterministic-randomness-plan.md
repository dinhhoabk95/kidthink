# Kế hoạch — Task #93: Ngẫu nhiên có seed (P1)

> **Loại task:** implementation lát dọc (M/L). Checklist: [`93-deterministic-randomness-todo.md`](93-deterministic-randomness-todo.md).
> **Chặn bởi** [`Task #92`](92-game-layout-engine-plan.md) — spec khai `depends_on` bộ dựng layout, nên thứ tự không đảo được. **Chặn** [`Task #97`](97-template-authoring-kit-plan.md).
> **Spec đóng:** [`deterministic-randomness.md`](../specs/01-platform/deterministic-randomness.md) (P1, `mvp: true`, 10 rule, 8 scenario).

## 1. Outcome

Một phiên chơi phát lại được. Cùng một seed cho cùng layout, cùng thứ tự item, cùng đường đi —
nên khi phụ huynh nói "màn này hôm qua khác", có cách dựng lại đúng màn hôm qua để xem.

Kèm theo, ba cờ xáo trộn trong hợp đồng template **bắt đầu có tác dụng**. Hôm nay chúng là khai
báo trơ: có trong lược đồ, có trong fixture, không tệp nào đọc.

## 2. Bằng chứng đo được (2026-08-18)

1. **Không có mã ngẫu nhiên có seed nào**: không tệp nào chứa `seededRandom`, `mulberry32`,
   `xorshift`, `splitmix`, `sfc32` hay `lcg`. `packages/game-engine/src/rng/` không tồn tại.
2. Ba cờ `shuffle_*` xuất hiện 8 lần và **trơ**: khai báo trong hợp đồng `gt001.ts:27`,
   `gt005.ts:28`, `gt006.ts:23`, một tham chiếu ở `levels/index.post.ts:99`, còn lại là fixture.
   Không tệp phiên nào đọc.
3. Spec §7 nêu một cột seed cho phiên chơi; **cột đó không tồn tại** — `game.ts:103` chỉ có tham
   số độ khó. Cần migration cộng thêm, theo `BR-RBK-02`.
4. Có một bản Mulberry32 trong `packages/adaptive` dưới `BR-REC-08` — **chủ khác**. Không gộp,
   không import chéo; ranh giới package ở [`monorepo-package-architecture.md`](../specs/00-foundation/monorepo-package-architecture.md) cấm.
5. Còn một lời gọi ngẫu nhiên của môi trường trong hệ phản hồi của `packages/game-engine`. Nó phải
   đi, nếu không thì "phát lại được" là lời khai.
6. Task này **sửa một hợp đồng đã `implemented`**: payload giao cấu hình màn chơi ở
   [`game-config-delivery.md`](../specs/04-play/game-config-delivery.md) phải mang seed.

## 3. Assumptions và ranh giới

1. **Thuật toán do người chốt** (§11 Q1): cần loại 32 bit, không phụ thuộc thư viện ngoài, chất
   lượng đủ cho xáo hiển thị — không dùng cho mã hoá. Chốt trước WP93.1.
2. **Seed sinh ở server khi mở phiên.** Chơi offline sinh seed ở client là câu hỏi P2 (§11 Q2),
   ngoài phạm vi task này.
3. **Migration cộng thêm.** Thêm cột cho phép rỗng, không đổi tên, không xoá — điều kiện để
   [`release-rollback.md`](../specs/01-platform/release-rollback.md) `BR-RBK-02` còn đúng.
4. **Sửa spec đã `implemented` phải qua cổng người.** Đổi payload giao cấu hình là đổi hợp đồng
   đang chạy; ghi vào §11 của spec đó, không sửa lặng lẽ.
5. **Không gộp với nguồn ngẫu nhiên của adaptive.** Hai nguồn, hai chủ, hai lý do tồn tại.

## 4. Thứ tự

```text
WP93.0  Chốt thuật toán (cổng người, §11 Q1)
  └──→ WP93.1  packages/game-engine/src/rng: Rng, createRng, deriveStream, shuffle, 5 luồng
         ├──→ WP93.2  Migration cộng thêm cột seed + server ghi seed lúc mở phiên
         │      └──→ WP93.3  Payload giao cấu hình mang seed (cổng người, sửa hợp đồng đang chạy)
         │             └──→ WP93.4  Ba cờ xáo trộn có tác dụng trong phiên
         └──→ WP93.5  Bỏ lời gọi ngẫu nhiên của môi trường + cổng chặn, kèm ca âm
                └──→ WP93.6  Test phát lại phiên, verification, lật status
```

## 5. Work packages

| ID | Cỡ | Công việc | Kết quả kiểm được |
|---|---:|---|---|
| WP93.0 | S | Chốt thuật toán cho `createRng`; ghi vào §11 kèm lý do | Hàng §11 Q1 gạch ngang kèm quyết định |
| WP93.1 | M | `Rng{next, nextInt}`, `createRng(seed)`, `deriveStream(seed, name)`, `shuffle(input, rng)` và 5 tên luồng đúng như spec §7 | Test: cùng seed cho cùng dãy; hai luồng khác tên cho dãy khác; `shuffle` không đổi phần tử, chỉ đổi thứ tự |
| WP93.2 | M | Migration cộng thêm cột seed trên bảng phiên chơi; server sinh và ghi seed khi mở phiên | Migration chạy trên cơ sở dữ liệu có dữ liệu; cột cho phép rỗng; phiên mới luôn có seed |
| WP93.3 | S | Payload giao cấu hình mang seed; ghi thay đổi vào §11 của [`game-config-delivery.md`](../specs/04-play/game-config-delivery.md) | Test hợp đồng payload; test cũ của route đó vẫn xanh |
| WP93.4 | M | Ba cờ xáo trộn đọc `Rng` theo luồng riêng; thứ tự item và thứ tự đáp án theo seed | Test: cùng seed cho cùng thứ tự; đổi seed đổi thứ tự; cờ tắt thì thứ tự gốc |
| WP93.5 | S | Bỏ lời gọi ngẫu nhiên của môi trường trong `packages/game-engine`; cổng chặn nó quay lại, kèm fixture sai | Cổng đỏ trên fixture; không lời gọi nào còn trong package |
| WP93.6 | M | Test phát lại một phiên đầy đủ từ seed; verification; lật `status` | Hai lần phát lại cho kết quả trùng khớp; 10 rule có test |

## 6. Acceptance criteria

```gherkin
Scenario: Cùng seed cho cùng phiên
  Given một phiên chơi đã lưu seed
  When dựng lại phiên từ seed đó hai lần
  Then layout, thứ tự item và thứ tự đáp án trùng khớp cả hai lần

Scenario: Hai luồng độc lập
  Given một seed và hai tên luồng khác nhau
  When lấy 100 giá trị từ mỗi luồng
  Then hai dãy khác nhau
  And mỗi dãy lặp lại được từ chính seed và tên luồng đó

Scenario: Cờ xáo trộn tắt thì giữ thứ tự gốc
  Given một màn chơi có cờ xáo trộn tắt
  When mở phiên hai lần với hai seed khác nhau
  Then thứ tự item giống nhau ở cả hai phiên

Scenario: Không còn nguồn ngẫu nhiên ngoài Rng
  Given mã trong packages/game-engine
  When chạy cổng chặn nguồn ngẫu nhiên của môi trường
  Then cổng báo 0 vi phạm

Scenario: BR-RBK-02 — migration cộng thêm
  Given migration của task này
  When chạy cổng kiểm migration cộng thêm
  Then cổng xanh vì không có cột nào bị xoá hay đổi tên
```

## 7. Verification

```bash
pnpm exec biome check .
pnpm lint:specs
pnpm db:generate && pnpm db:migrate
pnpm check
pnpm vitest run packages/game-engine packages/db apps/web/tests/api
pnpm test
```

## 8. Definition of done

- Một nguồn ngẫu nhiên duy nhất trong `packages/game-engine`, có seed, có luồng đặt tên.
- Cột seed tồn tại, phiên mới luôn có seed, payload giao cấu hình mang seed.
- Ba cờ xáo trộn có tác dụng đo được; cờ tắt thì giữ thứ tự gốc.
- Không lời gọi ngẫu nhiên của môi trường nào còn trong package, và có cổng chặn nó quay lại.
- Phát lại một phiên cho kết quả trùng khớp qua hai lần chạy.
- 10 rule của spec có test; spec `implemented`; `pnpm check` và `pnpm test` xanh.
