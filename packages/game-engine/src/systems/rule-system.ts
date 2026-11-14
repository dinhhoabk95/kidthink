/**
 * Rule System — quản lý chuyển đổi luật (rule switching) cho bài tập linh hoạt nhận thức (C6.FLX).
 *
 * System này độc lập với khuôn.
 * Bắt buộc báo đổi luật bằng âm thanh và hình ảnh.
 */

export interface RuleDefinition<TItem = string> {
  readonly id: string;
  readonly name: string;
  readonly description: string;
  readonly signalText: string;
  readonly signalAudioPrompt?: string;
  readonly validator: (item: TItem) => boolean;
}

interface RuleSystemConfig<TItem = string> {
  readonly rules: readonly RuleDefinition<TItem>[];
  readonly switchAfterTrials: number;
  readonly signalDurationMs?: number;
}

export class RuleSystem<TItem = string> {
  private readonly rules: readonly RuleDefinition<TItem>[];
  private readonly switchAfterTrials: number;
  private readonly signalDurationMs: number;

  private currentRuleIndex = 0;
  private correctInCurrentRule = 0;
  private isSignalingSwitch = false;
  private signalElapsedMs = 0;
  private totalSwitches = 0;

  constructor(config: RuleSystemConfig<TItem>) {
    if (!config.rules || config.rules.length < 2) {
      throw new Error("RuleSystem requires at least 2 rules for switching");
    }
    this.rules = config.rules;
    this.switchAfterTrials = Math.max(1, config.switchAfterTrials);
    this.signalDurationMs = Math.max(500, config.signalDurationMs ?? 2000);
  }

  getActiveRule(): RuleDefinition<TItem> {
    const rule = this.rules[this.currentRuleIndex];
    if (!rule) {
      throw new Error(`Rule at index ${this.currentRuleIndex} not found`);
    }
    return rule;
  }

  isSignaling(): boolean {
    return this.isSignalingSwitch;
  }

  getSignalInfo(): { text: string; audioPrompt?: string } | null {
    if (!this.isSignalingSwitch) {
      return null;
    }
    const activeRule = this.getActiveRule();
    return {
      text: activeRule.signalText,
      audioPrompt: activeRule.signalAudioPrompt,
    };
  }

  getTotalSwitches(): number {
    return this.totalSwitches;
  }

  getCurrentRuleIndex(): number {
    return this.currentRuleIndex;
  }

  getCorrectInCurrentRule(): number {
    return this.correctInCurrentRule;
  }

  getSignalProgress(): number {
    if (!this.isSignalingSwitch || this.signalDurationMs <= 0) {
      return 0;
    }
    return Math.max(
      0,
      Math.min(1, this.signalElapsedMs / this.signalDurationMs)
    );
  }

  /**
   * Đánh giá một lựa chọn theo luật đang hiệu lực.
   * Nếu đang trong trạng thái báo đổi luật, từ chối nhận hành động.
   */
  evaluate(item: TItem): { valid: boolean; triggeredSwitch: boolean } {
    if (this.isSignalingSwitch) {
      return { valid: false, triggeredSwitch: false };
    }

    const currentRule = this.getActiveRule();
    const valid = currentRule.validator(item);

    let triggeredSwitch = false;
    if (valid) {
      this.correctInCurrentRule++;
      if (this.correctInCurrentRule >= this.switchAfterTrials) {
        this.currentRuleIndex = (this.currentRuleIndex + 1) % this.rules.length;
        this.correctInCurrentRule = 0;
        this.isSignalingSwitch = true;
        this.signalElapsedMs = 0;
        this.totalSwitches++;
        triggeredSwitch = true;
      }
    }

    return { valid, triggeredSwitch };
  }

  /**
   * Cập nhật thời gian báo hiệu chuyển đổi luật.
   * Khi hết thời gian signalDurationMs, kết thúc báo hiệu để trẻ tiếp tục.
   */
  tick(deltaMs: number): boolean {
    if (!this.isSignalingSwitch) {
      return false;
    }

    this.signalElapsedMs += deltaMs;
    if (this.signalElapsedMs >= this.signalDurationMs) {
      this.isSignalingSwitch = false;
      return true;
    }
    return false;
  }
}
