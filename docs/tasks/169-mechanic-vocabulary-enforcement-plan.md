# Kế hoạch — Task #169: Từ vựng `mechanic` khớp registry và ép bằng kiểu

> **Loại task:** sửa nợ + cổng (M) — task con đầu tiên của
> [`Task #168`](168-v1-game-list-integration-plan.md), đợt 1.
> **Chặn:** mọi task còn lại của chương trình. 9 khuôn mới cần 7 giá trị `mechanic` mới, và đổ
> chúng vào một union đang lệch hai chiều là nhân lỗi lên.
> **Spec sở hữu:** [`content-tagging.md`](../specs/01-platform/content-tagging.md) mục 7.1 (từ vựng trục `mechanic`) ·
> [`game-template-contract.md`](../specs/01-platform/game-template-contract.md) (trường `mechanic` của template).

## 1. Trả lời ngắn

`packages/shared/src/taxonomy-types.ts:95` khai `GameMechanic` với **29** giá trị. Registry engine
đang chạy **27** mechanic. Hai bộ lệch nhau ở cả hai chiều, và **không nơi nào dùng kiểu đó** —
`TemplateDefinition.mechanic` ở `packages/game-engine/src/contracts/types.ts` khai là `string`.

Từ vựng tồn tại như tài liệu, không như ràng buộc. Đây là dạng cổng xanh giả: có thứ trông như
đang canh, nhưng gỡ nó đi thì không test nào đỏ.

## 2. Bằng chứng đã đo (2026-08-31)

| Chiều | Giá trị | Số |
|---|---|---:|
| Trong union, không template nào dùng | `drag-to-order` · `tap-count` · `balance` · `sequence-arrange` · `free-create` | 5 |
| Đang chạy, không có trong union | `spot-difference` · `go-nogo` · `rule-switch` | 3 |
| Nơi dùng kiểu `GameMechanic` ngoài file khai | `packages/taxonomy/src/types.ts:27` — một dòng re-export | 1 |

Lệnh tái dựng:

```bash
export PATH=/Users/macbook/.nvm/versions/node/v24.15.0/bin:$PATH
grep -rn "GameMechanic" packages/*/src apps/*/app apps/*/server
grep -n 'mechanic: "' packages/game-engine/src/templates/GT-*/template.ts | wc -l
```

## 3. Quyết định

| # | Quyết định | Vì sao |
|---|---|---|
| D1 | Bỏ 3 giá trị mồ côi: `drag-to-order` · `balance` · `sequence-arrange` | Đã gộp thật vào `sequence-order` và `balance-scale` theo bảng migration. Giữ lại là mời người sau dùng nhầm |
| D2 | **Giữ** `tap-count` và `free-create` | `GT-028` và `GT-036` sẽ dùng ở đợt 3–4. Khai tường minh là "đã đặt trước", không phải mồ côi |
| D3 | Thêm 3 giá trị đang chạy + 7 giá trị của chương trình, tổng union **36** | Bằng đúng số engine cuối chương trình |
| D4 | `TemplateDefinition.mechanic` đổi từ `string` sang `GameMechanic` | Ép ở chỗ typecheck bắt được, không ép bằng tài liệu |
| D5 | Danh sách "đã đặt trước" là **dữ liệu**, không phải comment | Cùng bài học của `montessori_ref`: con số có cổng canh thì phải là dữ liệu |

## 4. Việc

**Bước 1 — sửa union.** `packages/shared/src/taxonomy-types.ts`:
bỏ 3, thêm 10, kèm hằng `RESERVED_MECHANICS` liệt kê giá trị đã đặt trước và task sẽ dùng nó.

**Bước 2 — ép bằng kiểu.** `packages/game-engine/src/contracts/types.ts`:
`GameTemplate.mechanic: GameMechanic`. Import từ `@mindkid/shared`; nếu vòng phụ thuộc thì đặt
union ở `shared` và để `game-engine` import một chiều — cấm — NEVER nhân đôi union.

**Bước 3 — cổng đối chiếu.** `packages/game-engine/tests/contract.test.ts`:
- mọi `mechanic` trong registry nằm trong union;
- mọi giá trị union hoặc có template dùng, hoặc nằm trong `RESERVED_MECHANICS`;
- `RESERVED_MECHANICS` rỗng dần theo chương trình, cấm — NEVER phình ra.

**Bước 4 — đồng bộ tài liệu.** [`content-tagging.md`](../specs/01-platform/content-tagging.md) mục 7.1 trong cùng PR.

## 5. Điều kiện nghiệm thu

| # | Điều kiện | Kiểm bằng |
|---|---|---|
| 1 | Union đúng 36 giá trị, 0 mồ côi ngoài `RESERVED_MECHANICS` | `pnpm --filter @mindkid/game-engine test` |
| 2 | `mechanic` của template ép bằng kiểu | `pnpm typecheck:gate` |
| 3 | **Ca âm 1:** template khai `mechanic: "khong-co-that"` → typecheck đỏ | chạy tay, ghi lại đầu ra |
| 4 | **Ca âm 2:** thêm giá trị union không ai dùng và không đặt trước → test đỏ | chạy tay |
| 5 | Mục 7.1 của `content-tagging.md` khớp union | đối chiếu tay, ghi vào PR |
| 6 | `pnpm check` xanh | — |

## 6. Rủi ro

| Rủi ro | Mức | Giảm thiểu |
|---|---|---|
| Vòng phụ thuộc `shared` ↔ `game-engine` | Trung bình | Union sống ở `shared`; `game-engine` import một chiều. `pnpm lint:deps` bắt được |
| `RESERVED_MECHANICS` thành sọt rác | Trung bình | Test đòi mỗi giá trị đặt trước ghi rõ task sẽ dùng; chốt kiểm 4 đòi nó rỗng |
| Barrel `@mindkid/shared` rò xuống client | Thấp | Chỉ thêm `type`, không thêm runtime value ngoài một mảng hằng |
