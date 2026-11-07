/**
 * Nhịp phản hồi "sai" dùng chung cho mọi template (Task #313 Phase 2).
 *
 * Một thời lượng (`WRONG_FLASH_MS`) và một đồng hồ: người gọi luôn truyền đồng
 * hồ khung của session (`lastFrameMs`, cùng thứ `render(…, timeMs)` cấp), nên
 * kích và đọc không bao giờ lệch nền thời gian. Dấu sai KHÔNG ở lại trên màn
 * (Montessori): hết nhịp thì người gọi dọn trạng thái của mình về trung tính.
 */
export const WRONG_FLASH_MS = 400;

export class WrongFlash {
  private startedAtMs: number | null = null;

  /** Đã kích và chưa `clear()` — kể cả khi nhịp đã hết hạn mà chưa được dọn. */
  get started(): boolean {
    return this.startedAtMs !== null;
  }

  trigger(nowMs: number): void {
    this.startedAtMs = nowMs;
  }

  clear(): void {
    this.startedAtMs = null;
  }

  /** Mili-giây từ lúc kích; 0 khi chưa kích. */
  elapsedMs(nowMs: number): number {
    return this.startedAtMs === null ? 0 : nowMs - this.startedAtMs;
  }

  /** Đang trong nhịp: đã kích và chưa đủ `WRONG_FLASH_MS`. */
  isActive(nowMs: number): boolean {
    return this.started && this.elapsedMs(nowMs) < WRONG_FLASH_MS;
  }

  /** Đã kích và nhịp đã trôi hết: tới lúc người gọi dọn trạng thái "sai". */
  hasExpired(nowMs: number): boolean {
    return this.started && this.elapsedMs(nowMs) >= WRONG_FLASH_MS;
  }

  /** 0 → 1 trong nhịp, kẹp ở 1 sau đó; 0 khi chưa kích. */
  progress(nowMs: number): number {
    return Math.min(1, Math.max(0, this.elapsedMs(nowMs) / WRONG_FLASH_MS));
  }
}

/**
 * Biến thể theo khoá: nhiều vật nháy sai cùng lúc, mỗi vật một mốc, chung một
 * đồng hồ khung. `durationMs` mặc định `WRONG_FLASH_MS`; chỉ truyền số khác khi
 * spec engine chốt số riêng (vd BR của GT-003: vật trôi về chỗ cũ 260 ms).
 */
export class WrongFlashMap {
  private readonly startedAtMs = new Map<string, number>();

  private readonly durationMs: number;

  constructor(durationMs: number = WRONG_FLASH_MS) {
    this.durationMs = durationMs;
  }

  get size(): number {
    return this.startedAtMs.size;
  }

  has(key: string): boolean {
    return this.startedAtMs.has(key);
  }

  trigger(key: string, nowMs: number): void {
    this.startedAtMs.set(key, nowMs);
  }

  clear(key: string): void {
    this.startedAtMs.delete(key);
  }

  clearAll(): void {
    this.startedAtMs.clear();
  }

  elapsedMs(key: string, nowMs: number): number {
    const startedAt = this.startedAtMs.get(key);
    return startedAt === undefined ? 0 : nowMs - startedAt;
  }

  isActive(key: string, nowMs: number): boolean {
    return this.has(key) && this.elapsedMs(key, nowMs) < this.durationMs;
  }

  progress(key: string, nowMs: number): number {
    return Math.min(
      1,
      Math.max(0, this.elapsedMs(key, nowMs) / this.durationMs)
    );
  }

  /** Các khoá đã kích và nhịp đã trôi hết (chưa xoá). */
  expiredKeys(nowMs: number): string[] {
    const keys: string[] = [];
    for (const [key, startedAt] of this.startedAtMs) {
      if (nowMs - startedAt >= this.durationMs) {
        keys.push(key);
      }
    }
    return keys;
  }

  /** Như `expiredKeys` nhưng xoá luôn: người gọi dọn trạng thái "sai" của từng khoá. */
  drainExpired(nowMs: number): string[] {
    const keys = this.expiredKeys(nowMs);
    for (const key of keys) {
      this.startedAtMs.delete(key);
    }
    return keys;
  }
}
