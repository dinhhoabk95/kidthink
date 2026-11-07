/**
 * Hệ thống Quản lý 2 Pha Khám Phá (Explore -> Challenge) & Tự Kiểm Chứng Lỗi
 * (Control of Error + Micro-Sandbox Retry) theo triết lý Sư phạm Montessori.
 */

export type MontessoriPhase = "explore" | "challenge" | "micro_sandbox";

export interface ControlOfErrorDiagnostics {
  readonly reasonVi: string;
  readonly targetId?: string;
  readonly actualValue?: number | string;
  readonly expectedValue?: number | string;
}

export interface MontessoriExploreConfig {
  readonly milestoneTarget?: number;
  readonly softTimeoutMs?: number;
  readonly startInExplore?: boolean;
  readonly calloutDurationMs?: number;
}

const DEFAULT_MILESTONE_TARGET = 2;
const DEFAULT_SOFT_TIMEOUT_MS = 30_000;
const DEFAULT_CALLOUT_DURATION_MS = 2400;
const MICRO_SANDBOX_WRONG_THRESHOLD = 2;

export class MontessoriExploreTracker {
  private phase: MontessoriPhase;
  private readonly milestoneTarget: number;
  private readonly softTimeoutMs: number;
  private readonly calloutDurationMs: number;
  private exploreActionsCount = 0;
  private consecutiveWrongCount = 0;
  private elapsedExploreMs = 0;
  private calloutRemainingMs = 0;
  private lastExploreKind: string | null = null;
  private diagnostics: ControlOfErrorDiagnostics | null = null;

  constructor(config?: MontessoriExploreConfig) {
    this.milestoneTarget = Math.max(
      1,
      config?.milestoneTarget ?? DEFAULT_MILESTONE_TARGET
    );
    this.softTimeoutMs = Math.max(
      1000,
      config?.softTimeoutMs ?? DEFAULT_SOFT_TIMEOUT_MS
    );
    this.calloutDurationMs = Math.max(
      400,
      config?.calloutDurationMs ?? DEFAULT_CALLOUT_DURATION_MS
    );
    this.phase = config?.startInExplore ? "explore" : "challenge";
  }

  reset(startInExplore = false): void {
    this.phase = startInExplore ? "explore" : "challenge";
    this.exploreActionsCount = 0;
    this.consecutiveWrongCount = 0;
    this.elapsedExploreMs = 0;
    this.calloutRemainingMs = 0;
    this.lastExploreKind = null;
    this.diagnostics = null;
  }

  getPhase(): MontessoriPhase {
    return this.phase;
  }

  getExploreActionsCount(): number {
    return this.exploreActionsCount;
  }

  getMilestoneTarget(): number {
    return this.milestoneTarget;
  }

  getLastExploreKind(): string | null {
    return this.lastExploreKind;
  }

  isExploreMilestoneReached(): boolean {
    return this.exploreActionsCount >= this.milestoneTarget;
  }

  getConsecutiveWrongCount(): number {
    return this.consecutiveWrongCount;
  }

  isMicroSandboxActive(): boolean {
    return this.phase === "micro_sandbox";
  }

  getControlOfErrorDiagnostics(): ControlOfErrorDiagnostics | null {
    return this.diagnostics;
  }

  /**
   * Ghi nhận 1 thao tác khám phá nhân-quả của bé trên giáo cụ.
   * Trả về `true` nếu vừa chạm ngưỡng chuyển sang Pha Giải đố (`challenge`).
   */
  recordExploreAction(actionKind = "manipulate"): boolean {
    this.exploreActionsCount += 1;
    this.lastExploreKind = actionKind;
    if (
      this.phase === "explore" &&
      this.exploreActionsCount >= this.milestoneTarget
    ) {
      this.phase = "challenge";
      return true;
    }
    return false;
  }

  advanceToChallenge(): void {
    this.phase = "challenge";
  }

  /**
   * Ghi nhận lượt trả lời đúng: xóa trạng thái lỗi và tắt Micro-Sandbox.
   */
  recordCorrectAttempt(): void {
    this.consecutiveWrongCount = 0;
    this.diagnostics = null;
    this.calloutRemainingMs = 0;
    this.phase = "challenge";
  }

  /**
   * Ghi nhận lượt trả lời chưa đúng kèm chẩn đoán Nhân-Quả Vật lý (Control of Error).
   * Nếu sai liên tiếp >= 2 lần, tự động kích hoạt `micro_sandbox` để bé thử nghiệm lại.
   */
  recordWrongAttempt(diagnostics: ControlOfErrorDiagnostics): boolean {
    this.consecutiveWrongCount += 1;
    this.diagnostics = diagnostics;
    this.calloutRemainingMs = this.calloutDurationMs;
    if (this.consecutiveWrongCount >= MICRO_SANDBOX_WRONG_THRESHOLD) {
      this.phase = "micro_sandbox";
      return true;
    }
    return false;
  }

  tick(deltaMs: number): void {
    if (deltaMs <= 0) {
      return;
    }
    if (this.phase === "explore") {
      this.elapsedExploreMs += deltaMs;
      if (this.elapsedExploreMs >= this.softTimeoutMs) {
        this.phase = "challenge";
      }
    }
    if (this.calloutRemainingMs > 0) {
      this.calloutRemainingMs = Math.max(0, this.calloutRemainingMs - deltaMs);
      if (this.calloutRemainingMs === 0 && this.phase !== "micro_sandbox") {
        this.diagnostics = null;
      }
    }
  }
}
