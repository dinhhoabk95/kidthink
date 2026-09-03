import type { AgeBand } from "#src/contracts/types";
import type { LogicSpace } from "./constants.js";

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
}

export type LayoutFn = (input: LayoutInput) => Slot[];
