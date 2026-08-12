export type FeedbackKind =
  | "none"
  | "amber_soft"
  | "pop_celebrate"
  | "level_celebrate";

export interface TelemetryEvent {
  event_name: string;
  timestamp_ms: number;
  data?: Record<string, unknown>;
}

export interface SessionTelemetry {
  events: TelemetryEvent[];
  start_time_ms: number;
  end_time_ms?: number;
}

export interface GameSession {
  setupEntities(): void;
  validateAction(a: { type: string; data: unknown }): {
    valid: boolean;
    feedback: FeedbackKind;
  };
  checkWinCondition(): boolean;
  render?(ctx: CanvasRenderingContext2D, timeMs: number): void;
  update?(deltaMs: number): void;
  getTelemetry(): SessionTelemetry;
  completeSession(): void;
  destroy(): void;
}

export abstract class BaseGameSession implements GameSession {
  protected events: TelemetryEvent[] = [];
  protected startTimeMs: number = Date.now();
  protected endTimeMs?: number;
  protected isCompleted = false;

  abstract setupEntities(): void;
  abstract validateAction(a: { type: string; data: unknown }): {
    valid: boolean;
    feedback: FeedbackKind;
  };
  abstract checkWinCondition(): boolean;

  recordEvent(eventName: string, data?: Record<string, unknown>): void {
    this.events.push({
      event_name: eventName,
      timestamp_ms: Date.now(),
      data,
    });
  }

  getTelemetry(): SessionTelemetry {
    return {
      events: [...this.events],
      start_time_ms: this.startTimeMs,
      end_time_ms: this.endTimeMs,
    };
  }

  completeSession(): void {
    if (this.isCompleted) {
      return;
    }
    this.isCompleted = true;
    this.endTimeMs = Date.now();
    this.recordEvent("game_completed");
  }

  destroy(): void {
    this.events = [];
  }
}
