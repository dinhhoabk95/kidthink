---
spec: GAME-ENGINE-RUNTIME
title: Runtime game engine trên canvas
area: platform
status: implemented
mvp: true
phase: P1
reviewed: 2026-08-08
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

TypeScript thuần, Canvas 2D. Cấm Vue, Pinia, reactivity — reactivity thêm
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

1. Page nhận game config từ [`game-config-delivery.md`](../04-play/game-config-delivery.md), gọi `engine.load(config)`.
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
| `prefers-reduced-motion` | Giảm chuyển động, **không** bỏ. Ăn mừng còn một nhịp scale 400ms |
| Trẻ giữ nút thoát | Long-press 800ms → Parent Gate |
| FPS tụt dưới 45 kéo dài | Giảm hạt và bóng, cấm giảm kích thước touch target |

## 6. Business rules

| ID | Rule | Vì sao |
|---|---|---|
| `BR-ENG-01` (thuần TS) | TypeScript thuần. Cấm — NEVER Vue/Pinia/VueUse trong engine | RAF loop 60 lần/giây không chịu được tầng reactivity |
| `BR-ENG-02` (không ghi DB) | Cấm — **NEVER ghi DB từ engine.** Engine phát event, server ghi | Client không phải nguồn sự thật |
| `BR-ENG-03` (offline-first) | Cấm — **NEVER network call trong lúc chơi.** Offline-first | Mạng chập chờn không được làm đứng game |
| `BR-ENG-04` (design token) | Mọi màu và font từ `designTokens.ts`. Cấm hex literal, cấm `ctx.font` inline | Hex rải rác làm canvas lệch khỏi bảng token. KHÔNG còn cổng nào đo (gỡ 2026-08-29) — grep tay theo [`design-system-contract.md`](../08-quality/design-system-contract.md) §7.5 |
| `BR-ENG-05` (sàn touch) | Sàn touch theo band tuổi qua **một hàm duy nhất**. Con số do [`accessibility.md`](../08-quality/accessibility.md) `BR-A11-04` sở hữu: band 3–4 **96px**, phần tử chính **76px**, sàn bề mặt trẻ **64px** | Sàn tự viết rải rác là 60 chỗ để lệch. Con số **không** khai lại ở đây — bản trước ghi "5–6: 72px" trong khi spec sở hữu ghi 76px, và không cổng nào bắt được vì hai file không đọc lẫn nhau (`D-AO`) |
| `BR-ENG-06` (fallback tap) | Mọi mechanic drag có **hit band khoan dung** và **fallback tap-tap** cho band 3–4 | Drag là cử chỉ khó nhất ở tuổi này |
| `BR-ENG-07` (sai có phản hồi) | Trả lời sai **phải có phản hồi**, và **không bao giờ trừng phạt**. Cấm đỏ, cấm buzzer, cấm trừ điểm — **im lặng cũng là defect** | Không phản hồi thì trẻ không biết mình đã thao tác |
| `BR-ENG-08` (ăn mừng đúng chỗ) | Ăn mừng lớn **chỉ khi hoàn thành level**. Item đúng chỉ pop nhỏ **tại điểm chạm** | Ăn mừng mọi lúc làm ăn mừng mất nghĩa |
| `BR-ENG-09` (một phần tử động) | **Một** phần tử động thu hút chú ý tại một thời điểm | Nhiều thứ nhấp nháy cùng lúc là không có thứ nào được chú ý |
| `BR-ENG-10` (chữ không đủ) | Chữ **không bao giờ** mang chỉ dẫn một mình — mọi chỉ dẫn đọc thành tiếng hoặc trình diễn bằng hình | Người dùng chưa biết đọc |
| `BR-ENG-11` (không áp lực) | Cấm đồng hồ đếm ngược, cấm điểm hiện lúc chơi, cấm nút thoát tap trúng được | Áp lực thời gian và điểm số phản tác dụng ở tuổi này |
| `BR-ENG-12` (vận động tinh) | Cấm pinch, xoay bằng cử chỉ, thao tác hai ngón, hay drag tính giờ | Vận động tinh chưa đủ |
| `BR-ENG-13` (hàm thuần) | `checkWinCondition()` và `validateAction()` **thuần** | Chúng được gọi nhiều lần mỗi frame |
| `BR-ENG-14` (RAF) | RAF cho vòng lặp. Cấm — NEVER `setInterval`/`setTimeout` | `setInterval` không đồng bộ với nhịp vẽ của màn hình: nó vẫn chạy khi tab ẩn (đốt pin tablet, và tích luỹ một loạt tick dồn lại khi tab hiện lại), và trôi dần so với thời gian thật vì không bù được frame trễ. RAF do trình duyệt gọi đúng trước mỗi lần vẽ và tự dừng khi tab ẩn — đó là hành vi `game_paused` ở §5 dựa vào |
| `BR-ENG-15` (zero alloc) | Cấm cấp phát object mỗi frame, cấm DOM mutation mỗi frame, cấm `JSON.parse` trong hot path | GC pause đọc thành giật |
| `BR-ENG-16` (audio) | Audio: master ceiling cưỡng chế trong code, mục tiêu −16 LUFS, true peak ≤ −1 dBTP, ramp vào ≥20ms ra ≥40ms | Onset tức thì làm trẻ giật mình |
| `BR-ENG-17` (bundle) | Ngân sách bundle mỗi template ≤ **80 KB** gzipped | Tablet 2GB trên mạng 4G |

## 7. Data

### 7.1 Không gian canvas

Không gian logic có **cạnh ngắn cố định 540**; cạnh dài suy ra từ tỉ lệ khung nhìn và
bị chặn ở 1280. Màn ngang 16:9 vì thế vẫn ra đúng **960×540** như trước. Scale theo DPR,
`object-fit: contain`. Mọi toạ độ trong Session class là toạ độ logic — cấm dùng pixel
thiết bị.

Phép biến đổi từ toạ độ logic sang pixel thiết bị **thuộc về `RenderSystem`**, và
hit-test bắt buộc đọc **cùng một** `viewport` đó. Cấm — NEVER dựng lại công thức
letterbox ở nơi thứ hai: hai bản sao sẽ trôi khỏi nhau và điểm chạm rơi lệch khỏi ô
đang vẽ.

| Khung nhìn | Không gian logic | Sàn chạm band 3-4 quy ra px CSS |
|---|---|---|
| 1280×720 | 960×540 | 128 |
| 1440×900 | 864×540 | 160 |
| 820×1180 | 540×777 | 146 |
| 390×844 | 540×1169 | 69 |

Vì sao không giữ 960×540 cố định: ở khung 390×844, tỉ lệ thu nhỏ khi đó là 0,406 nên sàn
chạm 96 px của band 3-4 chỉ còn **39 px CSS** — dưới cả ngưỡng 44 px của WCAG, và xa
ngưỡng riêng cho trẻ 3-6 ở [`accessibility.md`](../08-quality/accessibility.md).
Cạnh ngắn cố định làm tỉ lệ chỉ còn phụ thuộc cạnh ngắn của khung nhìn.

Hệ quả bắt buộc: `Slot[]` phụ thuộc khung nhìn, nên phải **tính lại khi khung đổi**.
Layout tính một lần lúc nạp là sai.

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

Cấm — **NEVER theo yêu cầu** — trẻ 3 tuổi sẽ không xin trợ giúp.
Chi tiết: [`scaffolding-and-hints.md`](../04-play/scaffolding-and-hints.md).

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

Engine không biết gì về HTTP, cookie, hay entitlement. Nó nhận config đã qua gating.

## 9. Acceptance criteria

```gherkin
Scenario: BR-ENG-01 — engine không phụ thuộc Vue
  When quét import của packages/game-engine
  Then không import nào từ vue, pinia, hay @vueuse

Scenario: BR-ENG-04 — không hex literal
  When grep hex trong packages/game-engine/src
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

Scenario: BR-ENG-10 — audio fallback sang visual khi thiếu voice tiếng Việt hoặc offline
  Given thiết bị không có voice vi-VN hoặc autoplay bị chặn
  When engine phát chỉ dẫn
  Then engine kích hoạt visual demonstration (ghost hand) và highlighting
  And trẻ vẫn hiểu được nhiệm vụ và hoàn thành level bình thường
  And không xảy ra lỗi crash hoặc im lặng treo màn hình
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

| # | Câu hỏi | Chặn gì | Chặn phase | Chủ |
|---|---|---|---|---|
| ~~1~~ | ~~Model tablet Android 2GB nào làm chuẩn đo 60 fps?~~ **Đóng 2026-08-09 (`D-CH`)**: Lenovo Tab M8 bản 2 GB RAM; Chrome ổn định mới nhất, pin >30%, tắt tiết kiệm pin; ba lần chạy lấy median | — | Đã đóng | D-CH |
| 2 | WebGL cho template về sau? Canvas 2D đủ cho 6 template MVP | P4 | P4 | Studio UI |
| ~~3~~ | ~~Audio narration tiếng Việt — thu âm người thật hay TTS?~~ **Đóng 2026-08-16 (`D-AV`, Task #80)**: P1 kết hợp clip tĩnh (SFX, core cues) + Web Speech API (TTS `vi-VN`) với fallback trực quan (ghost hand / highlight / icon); P2 spec riêng cho audio asset storage/authoring | — | Đã đóng | D-AV |
