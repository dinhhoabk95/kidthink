---
spec: GAME-ENGINE-RUNTIME
title: Runtime game engine trên canvas
area: platform
status: draft
mvp: true
phase: P1
reviewed: 2026-08-04
owns:
  - Vòng lặp render và ngân sách hiệu năng
  - Ràng buộc thiết kế cho bề mặt trẻ 3–6
  - Ranh giới engine với phần còn lại
depends_on:
  - GAME-TEMPLATE-CONTRACT
  - EVENT-CATALOG
---

# Runtime game engine trên canvas

## 1. Objective

Engine là **core business**. Nó chạy 60 lần mỗi giây trên tablet Android 2GB, trước mặt một
đứa trẻ 3 tuổi chưa biết đọc. Hai ràng buộc đó quyết định mọi thứ còn lại.

TypeScript thuần, Canvas 2D. ❌ Không Vue, không Pinia, không reactivity — reactivity thêm
một tầng theo dõi không đoán trước được vào đúng chỗ không được phép chậm.

## 2. Actors

| Actor | Vai trò |
|---|---|
| Trẻ 3–6 | Người dùng duy nhất của bề mặt này |
| Engine | Dựng phiên từ `content_pack`, chạy vòng lặp, phát event |
| Server | Cấp config, nhận event, tính điểm |

## 3. Entry points

| Nơi | |
|---|---|
| `packages/game-engine/src/index.ts` | Barrel — entry public **duy nhất** |
| `core.ts` | `GameEngine` — RAF loop, buffer, render |
| `templates/<mã GT>/` | Session class mỗi template (ví dụ `GT-001/`) |
| `systems/` | render · audio · scene · scaffolding · designTokens |
| `apps/web/app/pages/play/[code].vue` | Mount canvas |

## 4. Main flow

1. Page nhận game config từ `game-config-delivery`, gọi `engine.load(config)`.
2. Engine parse `content_pack` bằng contract của template (kiểm lại phía client — server đã
   kiểm, đây là lưới an toàn thứ hai).
3. `setupEntities()` — tính layout **một lần**, cache. Tính lại **chỉ** khi resize.
4. Preload asset của round hiện tại + round kế tiếp.
5. Phát `game_started`, hiện hướng dẫn (audio + hình).
6. Vòng lặp RAF: `update(delta)` → `render(ctx)`.
7. Tương tác → `validateAction()` (thuần) → phản hồi → side effect ở `onItemLocked`.
8. `checkWinCondition()` (thuần) → `completeSession()` → phát `game_completed`.
9. Flush event, `destroy()` gỡ mọi listener.

## 5. Alternative flows

| Nhánh | Hành vi |
|---|---|
| Asset load fail | Phát `asset_load_failed`, thay bằng placeholder trung tính, **tiếp tục chơi** |
| Mất mạng giữa chừng | Buffer event vào IndexedDB, chơi tiếp bình thường |
| Trang ẩn | `game_paused`, dừng RAF, flush event qua `sendBeacon` |
| `prefers-reduced-motion` | Giảm chuyển động, ❌ **không** bỏ. Ăn mừng còn một nhịp scale 400ms |
| Trẻ giữ nút thoát | Long-press 800ms → Parent Gate |
| FPS tụt dưới 45 kéo dài | Giảm hạt và bóng, ❌ không giảm kích thước touch target |

## 6. Business rules

| ID | Rule | Vì sao |
|---|---|---|
| `BR-ENG-01` | TypeScript thuần. ❌ NEVER Vue/Pinia/VueUse trong engine | RAF loop 60 lần/giây không chịu được tầng reactivity |
| `BR-ENG-02` | ❌ **NEVER ghi DB từ engine.** Engine phát event, server ghi | Client không phải nguồn sự thật |
| `BR-ENG-03` | ❌ **NEVER network call trong lúc chơi.** Offline-first | Mạng chập chờn không được làm đứng game |
| `BR-ENG-04` | Mọi màu và font từ `designTokens.ts`. ❌ NEVER hex literal, ❌ NEVER `ctx.font` inline | Ép bằng `pnpm lint:tokens` trong cổng tự động |
| `BR-ENG-05` | Sàn touch theo band tuổi qua **một hàm duy nhất**. Band 3–4: **96px**; 5–6: **72px**; sàn tuyệt đối **64px** | Sàn tự viết rải rác là 60 chỗ để lệch |
| `BR-ENG-06` | Mọi mechanic drag có **hit band khoan dung** và **fallback tap-tap** cho band 3–4 | Drag là cử chỉ khó nhất ở tuổi này |
| `BR-ENG-07` | Trả lời sai **phải có phản hồi**, và **không bao giờ trừng phạt**. ❌ Không đỏ, không buzzer, không trừ điểm — **im lặng cũng là defect** | Không phản hồi thì trẻ không biết mình đã thao tác |
| `BR-ENG-08` | Ăn mừng lớn **chỉ khi hoàn thành level**. Item đúng chỉ pop nhỏ **tại điểm chạm** | Ăn mừng mọi lúc làm ăn mừng mất nghĩa |
| `BR-ENG-09` | **Một** phần tử động thu hút chú ý tại một thời điểm | Nhiều thứ nhấp nháy cùng lúc là không có thứ nào được chú ý |
| `BR-ENG-10` | Chữ ❌ **không bao giờ** mang chỉ dẫn một mình — mọi chỉ dẫn đọc thành tiếng hoặc trình diễn bằng hình | Người dùng chưa biết đọc |
| `BR-ENG-11` | ❌ Không đồng hồ đếm ngược · không điểm hiện lúc chơi · không nút thoát tap trúng được | Áp lực thời gian và điểm số phản tác dụng ở tuổi này |
| `BR-ENG-12` | ❌ Không pinch, xoay bằng cử chỉ, thao tác hai ngón, hay drag tính giờ | Vận động tinh chưa đủ |
| `BR-ENG-13` | `checkWinCondition()` và `validateAction()` **thuần** | Chúng được gọi nhiều lần mỗi frame |
| `BR-ENG-14` | RAF cho vòng lặp. ❌ NEVER `setInterval`/`setTimeout` | |
| `BR-ENG-15` | ❌ Không cấp phát object mỗi frame · không DOM mutation mỗi frame · không `JSON.parse` trong hot path | GC pause đọc thành giật |
| `BR-ENG-16` | Audio: master ceiling cưỡng chế trong code, mục tiêu −16 LUFS, true peak ≤ −1 dBTP, ramp vào ≥ 20ms ra ≥ 40ms | Onset tức thì làm trẻ giật mình |
| `BR-ENG-17` | Ngân sách bundle mỗi template ≤ **80 KB** gzipped | Tablet 2GB trên mạng 4G |

## 7. Data

### 7.1 Không gian canvas

Logic **cố định 960×540**, scale theo DPR, `object-fit: contain`. Mọi toạ độ trong Session
class là toạ độ logic — ❌ không bao giờ pixel thiết bị.

### 7.2 Ngân sách hiệu năng

| Chỉ số | Mục tiêu | Đo bằng |
|---|---|---|
| FPS | 60 trên tablet Android 2GB | `fps_sample` mỗi 30s |
| Thời gian frame | P95 < 16 ms | `performance.now()` mỗi tick |
| Thời gian tới màn hình đầu | < 2,5 s trên 4G | Playwright throttle |
| Bundle mỗi template | ≤ 80 KB gz | cổng tự động size check |
| Cấp phát mỗi frame | 0 | Object pool cho sprite/particle |

### 7.3 Scaffolding — leo thang theo đồng hồ hoặc miss

| Band | L1 nudge | L2 hướng dẫn | L3 trình diễn |
|---|---|---|---|
| 3–4 | 1 miss / 10s | 2 / 18s | 3 / 25s |
| 4–5 | 2 / 15s | 3 / 25s | 4 / 35s |
| 5–6 | 2 / 20s | 3 / 30s | 5 / 40s |

❌ **NEVER theo yêu cầu** — trẻ 3 tuổi sẽ không xin trợ giúp.
Chi tiết: `04-play/scaffolding-and-hints.md`.

### 7.4 Cấu trúc thư mục

```
packages/game-engine/src/
├── core.ts               GameEngine — RAF, buffer, render
├── interaction.ts        drag/tap/snap, validateDrop, onSnap
├── gameSession.ts        BaseGameSession / StatefulGameSession
├── templates/{GT-001…GT-006}/
├── mechanics/            DragDropSession · TapSelectSession
├── pipeline/             ProcessPipeline + stage
├── systems/              renderSystem · audioController · sceneManager · scaffolding · designTokens
├── utils/                layoutUtils · winCondition · shuffle
└── index.ts              barrel — entry public DUY NHẤT
```

## 8. API contract

```ts
interface EngineConfig {
  level_code: string; content_version: number; template_code: string;
  content_pack: unknown; difficulty_params: unknown;
  theme_id: string; age_band: AgeBand;
  reduced_motion: boolean; audio_enabled: boolean;
}

engine.load(config): Promise<void>;
engine.start(): void;
engine.pause(reason): void;
engine.destroy(): void;
engine.on("event", (e: TelemetryEvent) => void): void;
```

Engine ❌ không biết gì về HTTP, cookie, hay entitlement. Nó nhận config đã qua gating.

## 9. Acceptance criteria

```gherkin
Scenario: BR-ENG-01 — engine không phụ thuộc Vue
  When quét import của packages/game-engine
  Then không import nào từ vue, pinia, hay @vueuse

Scenario: BR-ENG-04 — không hex literal
  When chạy pnpm lint:tokens
  Then 0 vi phạm ngoài designTokens.ts

Scenario: BR-ENG-13 — checkWinCondition thuần
  Given một phiên đang chạy
  When gọi checkWinCondition 100 lần liên tiếp
  Then trạng thái không đổi và không event nào được phát

Scenario: BR-ENG-05 — sàn touch theo band
  Given một level cho band tuổi 3-4
  When đo mọi phần tử chạm được trong DOM snapshot
  Then không phần tử nào nhỏ hơn 96px

Scenario: BR-ENG-07 — sai có phản hồi, không trừng phạt
  Given trẻ thả sai vị trí
  Then có nhịp hổ phách trên target và âm nhẹ
  And không có màu đỏ trên canvas
  And điểm không giảm

Scenario: BR-ENG-03 — không network call lúc chơi
  Given một phiên đang chạy
  When ghi lại mọi request mạng từ lúc start tới lúc complete
  Then không request nào phát ra trong khoảng đó

Scenario: FPS đạt mục tiêu
  Given một level chạy trên thiết bị chuẩn
  When đo 60 giây liên tục
  Then p95 frame time dưới 16 ms

Scenario: reduced-motion giảm chứ không bỏ
  Given prefers-reduced-motion bật
  When trẻ hoàn thành level
  Then vẫn có ăn mừng, dạng một nhịp scale 400ms
  And độ khó, nhịp, và cách tính điểm không đổi

Scenario: asset lỗi không làm đứng game
  Given một emoji trong content_pack không load được
  Then phát asset_load_failed
  And hiện placeholder trung tính
  And trẻ vẫn hoàn thành được level
```

## 10. Boundaries

**Always**
- Tính layout ở `setupEntities()`, tính lại chỉ khi resize.
- Object pool cho sprite và particle.
- Preload asset round kế tiếp.
- `destroy()` gỡ mọi listener và system.

**Ask first**
- Thêm system mới vào vòng lặp.
- Đổi không gian canvas 960×540.
- Đổi ngân sách bundle.
- Refactor Session class vượt quá một template.

**Never**
- Vue/Pinia/VueUse trong engine · ghi DB · network call lúc chơi.
- Hex literal · `ctx.font` inline · sàn touch tự viết.
- Đỏ, buzzer, trừ điểm khi sai — **và cũng không được im lặng**.
- `setInterval` làm game loop · cấp phát mỗi frame.
- Side effect trong `checkWinCondition` hoặc `validateAction`.
- Đồng hồ đếm ngược · điểm hiện lúc chơi · nút thoát tap trúng được.

## 11. Open questions

| # | Câu hỏi | Chặn gì |
|---|---|---|
| 1 | Model tablet Android 2GB nào làm chuẩn đo 60 fps? Chưa chốt thiết bị chuẩn thì con số 60 fps không nghiệm thu được | Cổng ra P1 |
| 2 | WebGL cho template về sau? Canvas 2D đủ cho 6 template MVP | P4 |
| 3 | Audio narration tiếng Việt — thu âm người thật hay TTS? Ảnh hưởng kích thước bundle và chất lượng | Nội dung P1 |
