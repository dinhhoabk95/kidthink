---
spec: ENGINE-INPUT-CONTRACT
title: Hợp đồng nhập của engine — từ con trỏ tới dispatch
area: platform
status: draft
mvp: true
phase: P1
reviewed: 2026-09-04
owns:
  - Định nghĩa kiểu EngineInput, EngineView, ViewEntity, EntityVisual
  - Ba vòng đời con trỏ (tap, drag-drop, stroke)
  - Quy tắc chuyển đổi toạ độ logic qua toLogicPoint
  - Cơ chế dispatch phân tách giữa phán quyết thuần và commit trạng thái
depends_on:
  - GAME-ENGINE-RUNTIME
  - ENGINE-PLAY-LANGUAGE
  - ACCESSIBILITY
---

# Hợp đồng nhập của engine — từ con trỏ tới dispatch

## 1. Objective

Trang chơi hiện tại sử dụng nhiều đầu dò `typeof session.<tên>` để phán đoán hành vi từng khuôn,
dẫn đến mã dễ vỡ và không thể kiểm thử tự động trên toạ độ con trỏ thật.
Spec này chuẩn hoá **hợp đồng nhập**:
1. Định nghĩa kiểu `EngineInput`, `EngineView` cho phép engine công bố view snapshot và đón nhận cử chỉ.
2. Quy định 3 vòng đời con trỏ (`tap`, `drag-drop`, `stroke`) thống nhất cho 37 khuôn mẫu.
3. Tách biệt rõ ràng giữa kiểm tra phán quyết thuần (`validateAction` / `previewGesture`) và áp dụng thay đổi (`commit`).

## 2. Actors

| Actor | Quyền cần | Làm được gì ở đây |
|---|---|---|
| Trẻ 3–6 tuổi | — | Chạm, kéo, vẽ trên màn hình cảm ứng của thiết bị |
| `[code].vue` (App Shell) | — | Lắng nghe PointerEvents trên canvas, chuyển toạ độ qua `toLogicPoint` |
| `InteractionManager` | — | Quản lý vòng đời cử chỉ, hit test, snapping và dispatch tới session |
| Template Session | — | Cung cấp `getView()`, kiểm tra tính hợp lệ và thực thi `commit` |

## 3. Entry points

| File / Điểm truy cập | Actor | Ghi chú |
|---|---|---|
| `packages/game-engine/src/interaction.ts` | InteractionManager | Triển khai vòng đời con trỏ và hàm `toLogicPoint` |
| `packages/game-engine/src/templates/GT-*/session.ts` | Session | Cài đặt `getView()` và xử lý cử chỉ |
| `apps/web/app/pages/play/[code].vue` | App | Gọi vòng đời tương ứng dựa trên `template.input.family` |

## 4. Main flow

1. **Chuyển đổi toạ độ**: Khi nhận `pointerdown` / `pointermove` / `pointerup`, app chuyển toạ độ client sang không gian logic 960×540 thông qua `toLogicPoint(clientPoint, canvasRect)`.
2. **Lấy ảnh chụp View**: Engine gọi `session.getView()` để biết danh sách các thực thể đang có, toạ độ, bounding box và vai trò.
3. **Phát hiện cử chỉ**: `InteractionManager` thực hiện hit test theo vòng đời của họ (`tap`, `drag-drop`, hoặc `stroke`) với dung sai (`tolerance_px`) và hệ số hit band (`DRAGGABLE_HIT_MULTIPLIER = 1.25`, `DROP_TARGET_HIT_MULTIPLIER = 1.5`).
4. **Phán quyết thuần (Purity)**: Engine gọi `session.validateAction(action)` mà không thay đổi bất kỳ trạng thái nào của session, không phát sinh telemetry.
5. **Thực thi (Commit)**: Nếu hợp lệ, engine gọi `session.commit(action)` hoặc dispatch để cập nhật trạng thái thực tế và ghi telemetry một lần duy nhất.

## 5. Alternative flows

- **Cử chỉ không trúng thực thể**: `InteractionManager` bỏ qua cử chỉ, không gửi action tới session.
- **Hành động không hợp lệ**: `validateAction` trả về `{ valid: false, feedback: "retry" }`, session kích hoạt nhịp hổ phách tại chỗ và trả thực thể về vị trí ban đầu.
- **Con trỏ trượt ra ngoài vùng canvas**: Con trỏ bị huỷ (`pointercancel`), trạng thái kéo thả được reset về an toàn.

## 6. Business rules

| ID | Rule | Vì sao |
|---|---|---|
| `BR-EIC-01` | Mọi session đăng ký sẵn sàng trong `engine-input-ready.json` bắt buộc phải cài đặt phương thức `getView(): EngineView` | Đảm bảo trang chơi và harness có thể đọc cấu trúc thực thể mà không cần duck typing |
| `BR-EIC-02` | Session thuộc họ mới cấm xuất hoặc phụ thuộc vào các callback `on*` duck-typed cũ (`onItemLocked`, `onSnapPart`...) | Loại bỏ hoàn toàn duck typing và bảo vệ contract API |
| `BR-EIC-03` | Trang chơi `[code].vue` không được chứa kiểm tra `typeof session.<tên>` cho các engine đã chuyển đổi | Đảm bảo luồng đi qua một hợp đồng nhập chuẩn hoá duy nhất |
| `BR-EIC-04` | Phương thức `validateAction` và `previewGesture` phải là hàm thuần: cấm thay đổi trạng thái phiên, cấm phát sinh sự kiện telemetry | Tránh làm sai lệch dữ liệu học tập khi hover hoặc kiểm tra tạm thời |
| `BR-EIC-05` | Cấm gọi `this.resolveSlots` trong `setupEntities`. Bố cục ô bắt buộc tính qua `prepareRound(band)` | Tránh tính đúp ô hoặc gán cứng band tuổi của vòng chơi |
| `BR-EIC-06` | Toạ độ con trỏ bắt buộc phải chuẩn hoá qua `toLogicPoint` trước khi so khớp hit box | Ngăn ngừa lỗi lệch hệ toạ độ 20% trên màn hình khác tỷ lệ |

## 7. Data

```ts
export type InputFamily = "tap" | "drag-drop" | "stroke";

export interface ViewEntity {
  id: string;
  slotIndex: number;
  role: "source" | "target" | "neutral";
  state: "idle" | "active" | "selected" | "correct" | "incorrect";
  x: number;
  y: number;
  w: number;
  h: number;
}

export interface EngineView {
  entities: readonly ViewEntity[];
  activePrompt?: string;
  focusIndex?: number;
}

export interface EngineInputConfig {
  family: InputFamily;
  verbs: readonly PlayVerb[];
  tolerance_px?: number;
}
```

## 8. API contract

Giao thức in-process qua `InteractionManager.dispatch(action)`.

## 9. Acceptance criteria

```gherkin
Scenario: BR-EIC-04 — validateAction giữ nguyên tính thuần
  Given một session đang ở trạng thái ban đầu
  When gọi validateAction với action hợp lệ
  Then trạng thái session không đổi
  And độ dài mảng telemetry events bằng 0

Scenario: BR-EIC-06 — chuyển đổi toạ độ logic chính xác
  Given canvas có kích thước client 1200x675
  When nhận điểm chạm client (600, 337.5)
  Then toLogicPoint trả về điểm logic đúng tâm (480, 270)
```

## 10. Boundaries

**Always**
- Mọi thao tác trỏ chuột/chạm phải quy đổi qua `toLogicPoint`.
- Phân tách tuyệt đối giữa phán quyết thuần và commit trạng thái.

**Ask first**
- Thay đổi hệ số nhân hit multiplier (`DRAGGABLE_HIT_MULTIPLIER`, `DROP_TARGET_HIT_MULTIPLIER`).

**Never**
- Gọi trực tiếp các method duck-typing cũ từ app shell hoặc test harness.
- Ghi nhận telemetry hoặc thay đổi state trong `validateAction`.

## 11. Open questions

Không có.
