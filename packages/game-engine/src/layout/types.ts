import type { AgeBand } from "#src/contracts/types";
import type { LogicSpace } from "./constants.js";
import type { ZoneRect } from "./stage-zones.js";

export type { LayoutId } from "#src/contracts/types";
export type SlotRole = "source" | "target" | "neutral";

export interface Slot {
  readonly index: number;
  readonly x: number; // Tâm slot, không gian logic (960x540)
  readonly y: number; // Tâm slot, không gian logic (960x540)
  readonly w: number; // Kích thước vẽ chiều rộng
  readonly h: number; // Kích thước vẽ chiều cao
  readonly hitW: number; // Vùng chạm chiều rộng (>= sàn chạm của band tuổi)
  readonly hitH: number; // Vùng chạm chiều cao (>= sàn chạm của band tuổi)
  readonly page: number; // 0 khi không phân trang
  readonly role: SlotRole;
}

export interface LayoutInput {
  readonly slotCount: number;
  readonly ageBand: AgeBand;
  readonly targetCount?: number;
  /**
   * Không gian logic của khung nhìn hiện tại. Bỏ trống thì dùng 960x540 —
   * giữ nguyên hành vi cũ cho mọi nơi gọi chưa truyền.
   */
  readonly logic?: LogicSpace;
  /**
   * Vùng sân khấu (`zones.stage`). Có thì mọi slot nằm trong rect này
   * (`BR-PSZ-01`); bỏ trống thì dùng lề `CONTENT_TOP_PX`/`SAFE_MARGIN_PX` cũ
   * và kết quả giữ nguyên (`BR-LAY-10`).
   */
  readonly stage?: ZoneRect;
  /**
   * Px CSS trên một logic px. Có thì sàn chạm tính trên px CSS thật
   * (`BR-PSZ-04`); bỏ trống thì sàn tính theo logic px như cũ.
   */
  readonly cssPerLogic?: number;
  /**
   * `placeInStage` đặt khi có `stage` (`BR-PSZ-01`): hàm hình học được phép thích
   * nghi với sân khấu — làm tròn xuống cạnh ô để tâm làm tròn không kéo hai vùng
   * chạm lại gần nhau hơn `SLOT_GAP_PX` (`BR-LAY-05`), thêm cột khi vùng thấp.
   * Không đặt thì kết quả giữ nguyên từng điểm ảnh (`BR-LAY-10`).
   */
  readonly inStage?: boolean;
}

export type LayoutFn = (input: LayoutInput) => Slot[];
