---
spec: CONFIG-OWNERSHIP
title: Sở hữu cấu hình — một hằng số, một nơi, một chủ
area: foundation
status: draft
mvp: true
phase: P1
reviewed: 2026-09-11
owns:
  - Cây quyết định nơi một hằng số cấu hình được phép sống
  - Phân loại bốn hạng cấu hình và chủ sở hữu của từng hạng
  - Luật cấm bản sao vật lý của một file cấu hình giữa các package
  - Cổng `check:config-ownership`
depends_on:
  - MONOREPO-PACKAGE-ARCHITECTURE
  - REPO-BOOTSTRAP
  - ENV-CONTRACT
---

# Sở hữu cấu hình

## 1. Objective

Một giá trị điều chỉnh được — ngưỡng, sàn, trần, danh sách, cờ — là một quyết định. Khi cùng một
quyết định tồn tại ở hai nơi, một trong hai sẽ lỗi thời mà không ai biết, và cái lỗi thời thường
là cái đang chạy.

Đo ngày 2026-09-11 trên repo `mindkid/`: cấu hình sống ở **chín nơi** khác nhau. Ba bằng chứng
cụ thể nhất:

- `packages/db/config/` chứa **sáu file trùng byte** với
  `packages/content-build/src/thresholds/` — md5 khớp từng cặp. Ba file khác ở cùng thư mục đã
  được đổi thành symlink, tức có người bắt đầu việc này rồi dừng giữa chừng.
- **Band tuổi có tám định nghĩa độc lập**, từ `AGE_BANDS` trong
  `packages/game-engine/src/contracts/types.ts:37` cho tới một union viết thẳng trong `ref<>` của
  một file `.vue` quản trị.
- **Sàn chạm có ba bản**: `TOUCH_FLOORS` (`packages/ui/src/index.ts:13`), `getTouchFloor()`
  (`packages/game-engine/src/layout/constants.ts:22`), và `MIN_TOUCH_PX`
  (`packages/game-engine/src/interaction.ts:7`) — cộng một giá trị thứ tư viết dưới dạng lớp
  Tailwind `min-h-19` trong `packages/ui/app.config.ts:24`.

Có một phần đã làm đúng và spec này giữ nguyên: biến môi trường. `.env`, `.env.example`, và
`ENV_REGISTRY` đều đúng 51 key, khớp nhau, và có cổng
`packages/config/tests/env-example.test.ts` giữ. Đó là mẫu để nhân rộng, không phải thứ cần sửa.
[`env-contract.md`](../01-platform/env-contract.md) tiếp tục sở hữu trọn biến môi trường; spec
này **không** đụng tới chúng.

Spec này trả lời đúng một câu hỏi: *"tôi vừa cần một hằng số mới, nó sống ở đâu?"* — và làm cho
câu trả lời sai trở nên đỏ được.

## 2. Actors

| Actor | Quyền cần | Làm được gì ở đây |
|---|---|---|
| Dev | — | Tra cây quyết định mục 7.1 trước khi đặt một hằng số mới |
| Người duyệt | reviewer | Từ chối thay đổi đặt hằng số sai hạng |
| Cổng kiểm tra | CI / `check.sh` | Chạy `check:config-ownership` |

## 3. Entry points

| File / Lệnh | Actor | Ghi chú |
|---|---|---|
| `packages/config/src/**` | Dev | Cấu hình vận hành dùng chung |
| `packages/shared/src/**` | Dev | Hợp đồng nghiệp vụ dùng chung |
| `packages/content-build/src/thresholds/*.json` | Dev / Nội dung | Ngưỡng biên soạn nội dung |
| `packages/game-engine/config/*.json` | Dev | Tham số engine |
| `scripts/*-baseline.json` | Dev | Ratchet cổng chất lượng |
| `scripts/check-config-ownership.ts` | CI / Dev | Script cổng, phải dựng mới |

## 4. Main flow

1. Dev cần một giá trị điều chỉnh được.
2. Tra cây quyết định mục 7.1 để xác định **hạng** của nó trong bốn hạng ở mục 7.2.
3. Đặt giá trị vào đúng module sở hữu hạng đó, dưới một tên `UPPER_SNAKE_CASE`.
4. Mọi nơi khác **import** giá trị, không chép lại.
5. `pnpm check:config-ownership` quét và đỏ khi thấy giá trị lặp, file trùng byte, hoặc hằng số
   nằm sai hạng.

## 5. Alternative flows

| Nhánh | Điều kiện | Hành vi |
|---|---|---|
| Giá trị chỉ một nơi dùng | Một call site duy nhất, trong cùng file | Cho phép đặt tại chỗ dưới dạng hằng có tên; cổng không đòi tách package |
| Hai package cần cùng giá trị nhưng không được phụ thuộc nhau | Luật tầng của `.dependency-cruiser.cjs` cấm cạnh đó | Nâng giá trị lên package tầng thấp hơn mà cả hai đã phụ thuộc; cấm chép |
| Cấu hình sinh ra lúc build | Giá trị là kết quả của một bước build | Sinh vào thư mục `generated/`, đánh dấu không sửa tay, và nguồn sinh là thứ được sở hữu |
| Giá trị đến từ hạ tầng | Ví dụ ngưỡng cảnh báo queue | Nguồn sự thật là file hạ tầng (`infra/monitoring/alerts.yml`); mã ứng dụng đọc hoặc sinh từ đó, không khai lại |

## 6. Business rules

| ID | Rule | Vì sao |
|---|---|---|
| `BR-CFO-01` (một giá trị, một khai báo) | Một quyết định cấu hình BẮT BUỘC chỉ có đúng một khai báo trong toàn workspace. Cấm — NEVER khai lại cùng giá trị ở package thứ hai | `PROOF_SIGNED_URL_TTL_MINUTES` hiện có hai bản, và hai nơi dùng hai bản khác nhau; ngày đổi giá trị sẽ chỉ đổi được một nửa hệ thống |
| `BR-CFO-02` (cấm bản sao vật lý) | Cấm — NEVER có hai file cấu hình trùng nội dung ở hai package. Dùng import, hoặc symlink, hoặc một bước build sinh ra | Sáu file trong `packages/db/config/` trùng byte với `packages/content-build/src/thresholds/`; ba file khác cùng thư mục đã là symlink, nên chính repo đã công nhận cách làm đúng rồi dừng giữa chừng |
| `BR-CFO-03` (hạng quyết định nơi ở) | Mỗi hằng số BẮT BUỘC thuộc đúng một trong bốn hạng ở mục 7.2, và sống trong module sở hữu hạng đó | Không có luật phân hạng thì "để tạm ở đây" luôn thắng, và chín nơi trở thành mười |
| `BR-CFO-04` (tên có nghĩa, không có số trần) | Giá trị dùng ở logic BẮT BUỘC qua một hằng có tên. Cấm — NEVER viết số trần trong thân hàm | `packages/adaptive/src/level-params.ts` hiện có ngưỡng ZPD `0.4`, `0.8`, `1.2` viết thẳng trong thân hàm; không ai tìm ra chúng khi cần đổi |
| `BR-CFO-05` (barrel đầy đủ) | Mọi module công khai của một package cấu hình BẮT BUỘC nằm trong barrel `index.ts`, hoặc package đó không có barrel | `packages/config` có `backup.ts` và `repo-paths.ts` chỉ với tới được qua subpath, tạo hai kiểu import cho một package |
| `BR-CFO-06` (band tuổi một nguồn) | Danh sách band tuổi BẮT BUỘC khai đúng một lần và mọi nơi khác dẫn xuất từ đó | Tám định nghĩa độc lập nghĩa là thêm một band là sửa tám chỗ, và quên một chỗ thì lỗi chỉ hiện ở đúng màn hình đó |
| `BR-CFO-07` (sàn chạm một nguồn) | Sàn chạm theo band tuổi BẮT BUỘC khai đúng một lần, kể cả bản viết dưới dạng lớp Tailwind | Bốn bản hiện có là bốn cơ hội để một bề mặt trẻ tụt xuống dưới sàn `BR-A11-04` mà cổng không thấy |
| `BR-CFO-08` (token thiết kế một nguồn) | Bảng màu và phông BẮT BUỘC sinh từ một nguồn duy nhất cho cả `packages/ui/assets/css/tailwind.css` và `packages/game-engine/src/systems/designTokens.ts` | Hai file đã drift: họ `surface` khác nhau, và `designTokens.ts` khai `Quicksand`/`Fredoka` trong khi chỉ `Baloo 2` và `Be Vietnam Pro` được nạp, nên mọi `ctx.font` của canvas rơi fallback âm thầm |
| `BR-CFO-09` (không chạy thì không phải cổng) | Mọi script `check:*` khai trong `package.json` BẮT BUỘC có call site trong `scripts/check.sh` hoặc `lefthook.yml`; script không có call site BẮT BUỘC bị xoá hoặc được nối | Mười một cổng hiện có script mà không ai gọi; `check:taxonomy-docs` là một trong số đó, và hệ quả đo được là dòng tóm tắt của 5/6 file `docs/taxonomy/c*.md` sai |
| `BR-CFO-10` (job có glob phải khai điểm mù) | Mọi job cổng gắn glob trong `lefthook.yml` BẮT BUỘC ghi trong chú thích việc nó bỏ qua commit nào | Job `engine-gates` chỉ chạy khi commit đụng bốn thư mục; một commit đổi `scripts/` bỏ qua trọn bộ cổng engine mà không báo gì |
| `BR-CFO-11` (`pre-push` không được để chết) | Khối `pre-push` của `lefthook.yml` BẮT BUỘC hoặc chạy hoặc bị xoá khỏi file. Cấm — NEVER để nó tồn tại dưới dạng comment | Một khối bị comment trông như một cổng đang có; người đọc tin là có cổng và bỏ bước kiểm tay |
| `BR-CFO-12` (ranh giới public và private có kiểu) | Giá trị cấu hình lộ ra client BẮT BUỘC đi qua `runtimeConfig.public` của Nuxt, không chỉ dựa vào quy ước đặt tên | `runtimeConfig` hiện gần như không dùng; ranh giới public và private chỉ tồn tại bằng tên biến, nên một lần đặt tên sai là một lần rò bí mật |

## 7. Data

**Đọc:** `package.json` gốc; `scripts/check.sh`; `lefthook.yml`; nội dung mọi file `*.json` cấu
hình; AST của `packages/*/src/**/*.ts`.
**Ghi:** `scripts/config-ownership-baseline.json`.

### 7.1 Cây quyết định — hằng số này sống ở đâu

```
Giá trị này thay đổi theo môi trường triển khai
 ├─ Có  → biến môi trường. Chủ: env-contract.md. Hết.
 └─ Không
     │
     Giá trị này là ngưỡng của một cổng chất lượng, đo nợ hiện tại
      ├─ Có  → scripts/<tên>-baseline.json. Hạng D.
      └─ Không
          │
          Giá trị này ràng buộc việc biên soạn nội dung
           ├─ Có  → packages/content-build/src/thresholds/<tên>.json. Hạng C.
           └─ Không
               │
               Giá trị này là tham số của một engine cụ thể
                ├─ Có  → packages/game-engine/config/<tên>.json. Hạng C.
                └─ Không
                    │
                    Từ hai package trở lên cần giá trị này
                     ├─ Có
                     │   ├─ Là hợp đồng nghiệp vụ  → packages/shared/src/. Hạng B.
                     │   └─ Là cấu hình vận hành   → packages/config/src/. Hạng A.
                     └─ Không → hằng có tên tại chỗ, trong file dùng nó. Hạng B cục bộ.
```

### 7.2 Bốn hạng

| Hạng | Tên | Nơi ở | Chủ | Ví dụ |
|---|---|---|---|---|
| A | Cấu hình vận hành | `packages/config/src/` | Infra | thư mục backup, chuẩn hoá URL Valkey, TTL URL ký |
| B | Hợp đồng nghiệp vụ | `packages/shared/src/` | Backend | rate limit, feature flag, hạn mức giờ chơi, band tuổi, sàn chạm |
| C | Tham số nội dung và engine | `packages/content-build/src/thresholds/` · `packages/game-engine/config/` | Nội dung · Studio UI | hạn ngạch level, trần chủ đề, tham số độ khó |
| D | Ratchet cổng | `scripts/*-baseline.json` | Người dựng cổng | nợ typecheck, nợ kho giá trị, nợ cấu trúc tư duy |

Hạng B nhận hai thứ hiện nằm sai chỗ: **band tuổi** (`BR-CFO-06`) và **sàn chạm**
(`BR-CFO-07`). Cả hai là hợp đồng nghiệp vụ cắt ngang, không phải tham số engine.

### 7.3 Hiện trạng chín nơi — đo ngày 2026-09-11

| # | Nơi | Số file | Hạng đúng | Việc phải làm |
|---|---|---:|---|---|
| 1 | `packages/config/src` | 8 TS | A | Đưa `backup.ts` và `repo-paths.ts` vào barrel |
| 2 | `packages/config/vitest` + `tsconfig.base.json` | 3 | A | Giữ nguyên |
| 3 | `packages/shared/src` | 66 TS | B | Nhận thêm band tuổi và sàn chạm |
| 4 | `packages/game-engine/config/` | 8 JSON | C | Giữ nguyên |
| 5 | `packages/game-engine/src/layout` · `contracts` | 4 TS | B cho band tuổi và sàn chạm, C cho phần còn lại | Chuyển hai thứ lên hạng B |
| 6 | `packages/content-build/src/thresholds/` | 12 JSON | C | Thành nguồn duy nhất cho nhóm 7 |
| 7 | `packages/db/config/` | 9 entry | không phải một nơi | Đổi trọn 6 file trùng byte thành symlink, hoàn tất việc đã bỏ dở |
| 8 | `scripts/*-baseline.json` | 10 JSON | D | Giữ nguyên |
| 9 | root · `apps/*` · `infra/` | — | ngoài phạm vi hạng | `apps/worker/src/monitor.ts` đọc từ `infra/monitoring/alerts.yml`, không khai lại |

### 7.4 Hình dạng ratchet

```jsonc
// scripts/config-ownership-baseline.json
{
  "duplicate_config_files": 6,
  "duplicate_constant_values": 2,
  "age_band_declarations": 8,
  "touch_floor_declarations": 4,
  "token_source_count": 2,
  "orphan_check_scripts": 11,
  "commented_lefthook_blocks": 1
}
```

Mọi số ở đây chỉ được giảm. Đích cuối: `duplicate_config_files` 0 ·
`duplicate_constant_values` 0 · `age_band_declarations` 1 · `touch_floor_declarations` 1 ·
`token_source_count` 1 · `orphan_check_scripts` 0 · `commented_lefthook_blocks` 0.

## 8. API contract

Không có. Spec này là contract kho mã và cổng build-time.

## 9. Acceptance criteria

```gherkin
Scenario: BR-CFO-02 — hai file cấu hình trùng byte thì cổng đỏ
  Given packages/db/config/engine-depth.json và packages/content-build/src/thresholds/engine-depth.json có cùng md5
  And cả hai đều là file thật, không phải symlink
  When chạy pnpm check:config-ownership
  Then cổng thoát khác 0
  And báo cáo nêu đúng cặp đường dẫn trùng

Scenario: BR-CFO-01 — cùng một hằng khai ở hai package thì cổng đỏ
  Given packages/config/src/constants.ts khai PROOF_SIGNED_URL_TTL_MINUTES là 15
  And packages/storage/src/index.ts cũng khai một hằng cùng tên cùng giá trị
  When chạy pnpm check:config-ownership
  Then cổng thoát khác 0
  And báo cáo nêu cả hai đường dẫn và tên hằng

Scenario: BR-CFO-06 — khai band tuổi lần thứ hai thì cổng đỏ
  Given AGE_BANDS đã khai trong packages/shared
  And một file .vue khai lại union "3-4" | "4-5" | "5-6"
  When chạy pnpm check:config-ownership
  Then cổng thoát khác 0
  And báo cáo nêu đúng file khai lại

Scenario: BR-CFO-08 — hai nguồn token lệch nhau thì cổng đỏ
  Given tailwind.css khai surface-500 là #78716c
  And designTokens.ts khai surface-500 là #827660
  When chạy pnpm check:config-ownership
  Then cổng thoát khác 0
  And báo cáo nêu đúng bậc màu lệch và hai giá trị

Scenario: BR-CFO-08 — phông khai mà không nạp thì cổng đỏ
  Given designTokens.ts khai họ phông chứa "Quicksand"
  And packages/ui/nuxt.config.ts không nạp Quicksand
  When chạy pnpm check:config-ownership
  Then cổng thoát khác 0
  And báo cáo nêu Quicksand được khai mà không được nạp

Scenario: BR-CFO-09 — script check không có call site thì cổng đỏ
  Given package.json khai script check:taxonomy-docs
  And scripts/check.sh và lefthook.yml đều không gọi nó
  When chạy pnpm check:config-ownership
  Then cổng thoát khác 0
  And báo cáo liệt kê check:taxonomy-docs là cổng mồ côi

Scenario: BR-CFO-11 — khối pre-push bị comment thì cổng đỏ
  Given lefthook.yml có khối pre-push nằm trọn trong comment
  When chạy pnpm check:config-ownership
  Then cổng thoát khác 0
  And báo cáo nêu số dòng của khối bị comment

Scenario: BR-CFO-04 — số trần trong thân hàm thì cổng đỏ
  Given packages/adaptive/src/level-params.ts so sánh trực tiếp với 0.4 trong thân hàm
  When chạy pnpm check:config-ownership
  Then cổng thoát khác 0
  And báo cáo nêu đúng dòng và giá trị
```

## 10. Boundaries

**Always**
- Chuyển một hằng số sang nơi mới thì xoá bản cũ trong cùng một thay đổi. Để lại bản cũ "cho an
  toàn" chính là cách sinh ra bản sao thứ hai.
- Cổng đọc bằng AST cho mã TypeScript, đọc md5 cho file JSON. Đọc bằng regex thì một lần xuống
  dòng khác là một lần bỏ sót.
- Mỗi luật ở mục 6 có một ca âm trong test.
- Cổng lấy gốc repo từ `REPO_ROOT` hoặc `repoPath()` của `@mindkid/config/paths`. Cấm — NEVER
  đọc `process.cwd()` — đây chính là loại lỗi cổng này tồn tại để bắt.
- Chạy lệnh cổng qua `rtk proxy <lệnh>`; tin exit code hơn tin dòng chữ.

**Ask first**
- Gộp `packages/db/config/` vào `packages/content-build/src/thresholds/`. Việc này đổi đường dẫn
  mà seeder và mười hai cổng đang đọc.
- Nâng `packages/config` thành package có `dist/`. Hiện `ENV_REGISTRY` phải chạy được trước
  `pnpm install` nên không được có dependency và không được qua bước build; đổi điều này là đổi
  trình tự bootstrap của repo.
- Đổi `packages/shared` để nhận band tuổi và sàn chạm. `packages/shared` đã có lịch sử rò barrel
  xuống client; thêm thứ vào nó cần xem lại ranh giới `./client`.

**Never**
- Cấm — NEVER đặt biến môi trường mới ngoài `ENV_REGISTRY`; `env-contract.md` sở hữu trọn nhánh đó.
- Cấm — NEVER thêm một nơi cấu hình thứ mười.
- Cấm — NEVER để một script `check:*` tồn tại mà không có call site.
- Cấm — NEVER dùng `sed` hàng loạt để dọn hằng số; mỗi chỗ cần đọc lại ngữ cảnh trước khi đổi.

## 11. Open questions

| # | Câu hỏi | Chặn gì | Chặn phase | Chủ |
|---|---|---|---|---|
| 1 | Nguồn duy nhất của token thiết kế là file CSS rồi sinh ra TypeScript, hay ngược lại; CSS sinh ra TS thì cần một bước build mới, TS sinh ra CSS thì Tailwind mất khả năng đọc tĩnh `@theme` | `BR-CFO-08` | P1 | Studio UI |
| 2 | Sáu file trong `packages/db/config/` đổi thành symlink hay bỏ hẳn và sửa đường dẫn đọc; symlink không chạy trên Windows và repo chưa chốt có hỗ trợ Windows không | `BR-CFO-02` | P1 | Infra |
| 3 | Mười một cổng mồ côi: nối tất cả vào `check.sh` hay chỉ nối những cổng chạy dưới một ngưỡng thời gian; `check:skill-quota` phải dựng trọn 6.388 level nên có thể không hợp với vòng lặp cục bộ | `BR-CFO-09` | P1 | người quyết |
| 4 | `pre-push` mở lại với nội dung gì; bản cũ chạy `pnpm services` và `pnpm check`, `pnpm services` cần Postgres và Valkey đang chạy nên hỏng trên máy chưa dựng dịch vụ | `BR-CFO-11` | P1 | Infra |
