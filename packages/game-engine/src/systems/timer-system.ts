/**
 * `timerSystem` — quản lý hiển thị chớp (flash) theo thời lượng `flash_ms`
 * và quyền xem lại (replay).
 * Mục 7.4 của [`montessori-template-batch.md`](../../../../docs/specs/01-platform/montessori-template-batch.md).
 *
 * System này **độc lập với khuôn** (`BR-MTB-15`): không phụ thuộc vào Zod
 * hay bất kỳ file nào trong `templates/`.
 *
 * Sàn `flash_ms` là 800ms để đảm bảo trẻ kịp nhận biết số lượng mà không biến
 * trò chơi thành thử thách phản xạ vận động.
 */

export const MIN_FLASH_MS = 800;
export const MAX_FLASH_MS = 3000;
export const DEFAULT_FLASH_MS = 1500;

export type FlashTimerState = "idle" | "running" | "expired";

export interface FlashTimerConfig {
  readonly flashMs: number;
  readonly allowReplay?: boolean;
}

export class FlashTimer {
  private readonly flashMs: number;
  private readonly allowReplay: boolean;
  private elapsedMs = 0;
  private state: FlashTimerState = "idle";
  private replayUsed = false;

  constructor(config: FlashTimerConfig) {
    this.flashMs = Math.max(
      MIN_FLASH_MS,
      Math.min(MAX_FLASH_MS, config.flashMs)
    );
    this.allowReplay = config.allowReplay ?? false;
  }

  start(): void {
    this.elapsedMs = 0;
    this.state = "running";
  }

  tick(deltaMs: number): FlashTimerState {
    if (this.state !== "running") {
      return this.state;
    }

    this.elapsedMs += deltaMs;
    if (this.elapsedMs >= this.flashMs) {
      this.state = "expired";
    }
    return this.state;
  }

  isVisible(): boolean {
    return this.state === "running";
  }

  isExpired(): boolean {
    return this.state === "expired";
  }

  getState(): FlashTimerState {
    return this.state;
  }

  getElapsedMs(): number {
    return this.elapsedMs;
  }

  getDurationMs(): number {
    return this.flashMs;
  }

  canReplay(): boolean {
    return this.allowReplay && !this.replayUsed && this.state === "expired";
  }

  replay(): boolean {
    if (!this.canReplay()) {
      return false;
    }
    this.replayUsed = true;
    this.start();
    return true;
  }

  hasUsedReplay(): boolean {
    return this.replayUsed;
  }

  reset(): void {
    this.elapsedMs = 0;
    this.state = "idle";
    this.replayUsed = false;
  }
}
