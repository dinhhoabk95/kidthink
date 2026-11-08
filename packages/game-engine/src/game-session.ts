import type { AgeBand } from "./contracts/types.js";
import type { EngineView, Gesture, SystemBeat } from "./interaction.js";
import { DEFAULT_LOGIC_SPACE, type LogicSpace } from "./layout/constants.js";
import type { ZoneRect } from "./layout/stage-zones.js";
import type { Slot } from "./layout/types";
import type { CommitIcon } from "./render/commit-button.js";
import type { MascotPose } from "./render/mascot.js";
import type { ItemVisualState } from "./render/types.js";
import {
  type HintDemoStep,
  type HintLevel,
  type HintTarget,
  resolveSteppedHintTarget,
} from "./systems/hint-ladder.js";
import type { RenderSystem } from "./systems/render-system";
import type { SFXType } from "./systems/sfx-engine.js";

export type {
  HintDemoStep,
  HintLevel,
  HintTarget,
} from "./systems/hint-ladder.js";

export type FeedbackKind =
  | "none"
  | "amber_soft"
  | "pop_celebrate"
  | "level_celebrate";

export type GameActionValue =
  | string
  | number
  | boolean
  | null
  | undefined
  | object;

export type TelemetryEventData = Record<string, GameActionValue>;

/** A player interaction handed to `validateAction`. */
export interface GameAction {
  type: string;
  data: GameActionValue;
}

/** Verdict of `validateAction` — pure, no side effects (BR-ENG-13). */
export interface ActionResult {
  valid: boolean;
  feedback: FeedbackKind;
}

/** Action the session does not handle — no feedback owed. */
export const ACTION_IGNORED: ActionResult = Object.freeze({
  valid: false,
  feedback: "none",
});

/** Correct answer — small pop at the touch point (BR-ENG-08). */
export const ACTION_CORRECT: ActionResult = Object.freeze({
  valid: true,
  feedback: "pop_celebrate",
});

/** Wrong answer — amber nudge, never punitive, never silent (BR-ENG-07). */
export const ACTION_RETRY: ActionResult = Object.freeze({
  valid: false,
  feedback: "amber_soft",
});

export interface TelemetryEvent {
  event_name: string;
  timestamp_ms: number;
  data?: TelemetryEventData;
}

export interface SessionTelemetry {
  events: TelemetryEvent[];
  start_time_ms: number;
  end_time_ms?: number;
}

export interface GameSession {
  /** Vòng nhiều lượt độc lập — `BR-SCO-09`. Thiếu thì coi là sai. */
  isTrialBased?(): boolean;
  setupEntities(): void;
  validateAction(a: GameAction): ActionResult;
  checkWinCondition(): boolean;
  /** Called every frame by `GameEngine.loop()` only when a canvas is attached. */
  render?(
    ctx: CanvasRenderingContext2D,
    rs: RenderSystem,
    timeMs: number
  ): void;
  // biome-ignore lint/suspicious/noConfusingVoidType: void needed for compatibility with void-returning sessions
  update?(deltaMs: number): ActionResult | void | null;
  getTelemetry(): SessionTelemetry;
  completeSession(): void;
  destroy(): void;
  getView?(): EngineView;
  dispatch?(gesture: Gesture): ActionResult | undefined;
  onBeat?(beat: SystemBeat): void;
  /**
   * Cổng cử chỉ của riêng session — `false` khi session đang đọc một câu hỏi
   * của chính nó (GT-000 ở mức bước, `BR-E000-12`). Bề mặt chơi nuốt cử chỉ và
   * engine dừng đồng hồ trợ giúp như với `GameEngine.acceptingInput`.
   */
  isAcceptingInput?(): boolean;
  /**
   * Engine báo trạng thái cổng cử chỉ mỗi khung (trước `update`) để session
   * không hiện thứ chạm sẽ bị nuốt — GT-026 ẩn kích thích khi cổng đóng
   * (`BR-E026-04`).
   */
  setInputOpen?(isOpen: boolean): void;
  /** Rút hàng đợi cue âm đặc trưng của session (`BR-FBK-14`). */
  takeSfxCues?(): readonly SFXType[];
  /** Tâm trạng mascot của session, `null` là không có (`BR-FBK-15`). */
  mascotMood?(): MascotPose | null;
  /** Câu bối cảnh đọc một lần ở vòng đầu (`BR-FBK-16`). */
  storyLine?(): string | null;
}

/** Trần hàng đợi cue — lượt chạm dồn dập không xếp hàng vô hạn (`BR-FBK-14`). */
export const MAX_QUEUED_SFX_CUES = 8;

export abstract class BaseGameSession implements GameSession {
  protected events: TelemetryEvent[] = [];
  protected startTimeMs: number = Date.now();
  protected endTimeMs?: number;
  protected isCompleted = false;

  onBeat(_beat: SystemBeat): void {
    // Default no-op for system beats (reveal, hint, timeout)
  }

  /**
   * Vòng gồm nhiều lượt độc lập (GT-026, GT-027): điểm vòng theo tỉ lệ lượt
   * đúng, không theo "cả vòng không sai lượt nào" (`BR-SCO-09`).
   */
  isTrialBased(): boolean {
    return false;
  }

  abstract setupEntities(): void;
  abstract validateAction(a: GameAction): ActionResult;
  abstract checkWinCondition(): boolean;

  recordEvent(eventName: string, data?: TelemetryEventData): void {
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
    // Nhiều engine tự ghi `game_completed` kèm điểm trước khi `winSession` — không ghi đôi.
    if (!this.events.some((e) => e.event_name === "game_completed")) {
      this.recordEvent("game_completed");
    }
  }

  destroy(): void {
    this.events = [];
  }

  /** Mặc định luôn nhận cử chỉ; session tự đọc câu hỏi thì ghi đè. */
  isAcceptingInput(): boolean {
    return true;
  }

  private sfxCues: SFXType[] = [];

  /**
   * Xếp một cue âm tổng hợp đặc trưng của trò. Session Cấm — NEVER giữ
   * `AudioContext`: `GameEngine.advanceFrame` rút hàng đợi và phát (`BR-FBK-14`).
   */
  protected queueSfx(type: SFXType): void {
    if (this.sfxCues.length < MAX_QUEUED_SFX_CUES) {
      this.sfxCues.push(type);
    }
  }

  takeSfxCues(): readonly SFXType[] {
    if (this.sfxCues.length === 0) {
      return NO_CUES;
    }
    const cues = this.sfxCues;
    this.sfxCues = [];
    return cues;
  }

  /** Mặc định không có tâm trạng riêng; trò muốn mascot phản ứng thì ghi đè. */
  mascotMood(): MascotPose | null {
    return null;
  }

  /** Mặc định không có khung chuyện; trò có bối cảnh nói được thì ghi đè. */
  storyLine(): string | null {
    return null;
  }
}

const NO_CUES: readonly SFXType[] = Object.freeze([]);

/**
 * Base for the GT-001..GT-006 template sessions: each one is built from a
 * validated `content_pack` plus its `difficulty_params`, and wins exactly once.
 */
export abstract class TemplateGameSession<
  TContent extends
    | object
    | string
    | number
    | boolean
    | null
    | undefined = object,
  TDifficulty = object,
> extends BaseGameSession {
  readonly content: TContent;
  readonly difficulty: TDifficulty;
  readonly layoutSeed: number;
  readonly themeId?: string;
  readonly isTemplateSession = true;
  protected isWon = false;

  /** Backing store for slots — do NOT assign directly, use prepareRound. */
  private _slots: readonly Slot[] = [];

  /** Increases by 1 every prepareRound. Tests use this to assert slot recomputation count. */
  roundGeneration = 0;

  /**
   * Âm thanh của thiết bị còn bật không (`audio_enabled` của config tải).
   * Engine có kênh nghe (GT-018) đọc cờ này để hiện kênh thị giác thay thế
   * (`BR-E018-06`). Mặc định bật; `createGameSessionSync` gán từ config.
   */
  private audioEnabled = true;

  setAudioEnabled(enabled: boolean): void {
    this.audioEnabled = enabled;
  }

  isAudioEnabled(): boolean {
    return this.audioEnabled;
  }

  /** Read-only view of the current round's slots. */
  get slots(): readonly Slot[] {
    return this._slots;
  }

  constructor(
    content: TContent,
    difficulty: TDifficulty,
    layoutSeed = 0,
    themeId?: string
  ) {
    super();
    this.content = content;
    this.difficulty = difficulty;
    this.layoutSeed = Math.abs(Math.floor(layoutSeed)) || 0;
    this.themeId = themeId;
  }

  sourceSlots: readonly Slot[] = [];
  targetSlots: readonly Slot[] = [];

  /** Trạng thái vẽ của từng vật (idle/selected/correct/wrong...), theo id. */
  protected readonly renderItemStates: Map<string, ItemVisualState> = new Map();

  setRenderItemState(itemId: string, state: ItemVisualState): void {
    this.renderItemStates.set(itemId, state);
  }

  getRenderItemState(itemId: string): ItemVisualState {
    return this.renderItemStates.get(itemId) ?? "idle";
  }

  /** Active logic space for responsive slot calculations (Task #203 / #259). */
  logicSpace: LogicSpace = DEFAULT_LOGIC_SPACE;

  /** Set or update the logic space for responsive layouts. */
  setLogicSpace(space: LogicSpace): void {
    this.logicSpace = space;
  }

  /**
   * Returns the index of the slot/entity that hints/scaffolding should target, or null if none.
   * Default implementation returns null (no guess).
   */
  getHintTargetIndex(): number | null {
    return null;
  }

  /**
   * Chỗ gợi ý trỏ tới. Mặc định suy từ `getHintTargetIndex()`; engine có nút nộp
   * ghi đè để trỏ vào nút khi bước kế là nộp (`BR-PSZ-05`).
   */
  getHintTarget(): HintTarget | null {
    const index = this.getHintTargetIndex();
    if (index !== null) {
      const toIndex = this.getHintDestinationIndex();
      return toIndex === null
        ? { kind: "slot", index }
        : { kind: "slot", index, toIndex };
    }
    // Không còn vật nào để chỉ mà nút nộp đang sáng: bước kế là bấm nút.
    return this.needsCommit && !this.isWon && this.canCommit()
      ? { kind: "action" }
      : null;
  }

  /**
   * Slot đích của bước đúng kế tiếp khi nó là kéo/đặt `getHintTargetIndex()` tới
   * đó; `null` khi bước chỉ là chạm. Bàn tay ma kéo từ nguồn tới đích (Task #313).
   */
  getHintDestinationIndex(): number | null {
    return null;
  }

  /**
   * Đồng hồ trợ giúp chung vừa leo lên `level` (1–3). `trigger` là `timer` khi trẻ
   * không phản ứng quá `hint_after_ms`, `miss_streak` khi leo vì chuỗi chạm sai.
   * Engine có thang riêng (GT-026: nới cửa sổ → giãn nhịp nghỉ → không tính giờ,
   * `BR-E026-10`) ghi đè; mặc định không làm gì. Gọi đúng một lần mỗi lần leo.
   */
  onScaffoldEscalated(
    _level: HintLevel,
    _trigger: "timer" | "miss_streak"
  ): void {
    // Mặc định: chỉ thang gợi ý chung (`getHintTargetForLevel`).
  }

  /**
   * Chữ âm đề cần tự đọc khi vòng mở, sau khi câu dẫn của vòng đọc xong
   * (GT-018 `auto_play_audio`, `BR-E018-05`). `null` = không tự đọc; trẻ chạm vật
   * có `spokenLabel` để nghe. Bề mặt chơi đọc đúng một lần mỗi vòng.
   */
  getOpeningAudioText(): string | null {
    return null;
  }

  /**
   * Lời đọc cho pill Montessori đang hiện (`BR-PNR-12`): lý do control-of-error
   * hoặc tiến độ khám phá. Trả nội dung mới đúng một lần; `null` khi không có gì
   * mới hoặc engine không có pill. Bề mặt chơi gọi sau mỗi verdict.
   */
  takePillNarration(): string | null {
    return null;
  }

  /**
   * Lời mời đọc thành tiếng sau một cử chỉ không phải lần sai (phán quyết im,
   * `valid: true`), ví dụ GT-036 chốt khi dải chưa thành quy luật. Trả nội dung
   * đúng một lần; `null` khi không có. Bề mặt chơi đọc nó qua giọng nói sẵn có.
   */
  takeSpokenInvitation(): string | null {
    return null;
  }

  /**
   * Trợ giúp vừa về `L0` (trẻ làm đúng, vòng mới…): dọn mọi trạng thái gợi ý
   * riêng của session — âm phát lặp, hình tách… Mặc định không có gì để dọn.
   */
  onHintCleared(): void {
    // Session không giữ trạng thái gợi ý riêng.
  }

  /**
   * Mục tiêu gợi ý theo bậc `L1` / `L2` / `L3` (Task #301 S2).
   * Mặc định kiểm tra bộ giải trung tâm (`resolveSteppedHintTarget`), nếu chưa
   * tách bậc thì rơi về `getHintTarget()`.
   */
  getHintTargetForLevel(level: HintLevel): HintTarget | null {
    const stepped = resolveSteppedHintTarget(this, level);
    if (stepped !== undefined) {
      return stepped;
    }
    return this.getHintTarget();
  }

  /**
   * Chuỗi bước demo cho bàn tay ma ở `L3` (Task #313): nhiều cặp nguồn→đích
   * diễn liền nhau (GT-035 `BR-E035-12`: ba thẻ đầu của lời giải). `null` (mặc
   * định) = chỉ một bàn tay theo `getHintTargetForLevel`. Bước đầu phải trùng
   * hint của cùng bậc để slot được tô sáng khớp bàn tay.
   */
  getHintDemoSequence(_level: HintLevel): readonly HintDemoStep[] | null {
    return null;
  }

  /** Phiên có cần khay vật thể riêng không (`BR-PSZ-01`). Mặc định false. */
  readonly needsTray: boolean = false;

  /**
   * Số vật nguồn trong khay của vòng này, shell dùng để đo chiều cao khay —
   * khay nhiều hàng, không phân trang (`BR-PSZ-13`). Chỉ có nghĩa khi
   * `needsTray`; 0 là một hàng. Đọc từ content, không từ trạng thái vòng: shell
   * hỏi trước `prepareRound`.
   */
  get trayItemCount(): number {
    return 0;
  }

  /**
   * Số hàng ô sân khấu cần ở sàn chạm (lưới GT-015). 0 là không đòi hơn mức
   * tối thiểu của khung. Đọc từ content như `trayItemCount`.
   */
  get stageRowCount(): number {
    return 0;
  }

  /** Vật trong khay có nhãn vẽ dưới thân (GT-031, GT-033): khay chừa dải nhãn mỗi hàng. */
  get trayHasLabels(): boolean {
    return false;
  }

  /**
   * Phiên đã dời vào khung năm vùng: shell vẽ lời dẫn ở `zones.prompt` và engine
   * không tự vẽ `drawPromptText` (`BR-PSZ-08..10`). Mặc định false — engine chưa
   * dời tự vẽ lời dẫn, shell không vẽ thêm. `stageRect` không thay được cờ này
   * vì `RoundRunner` cấp nó cho mọi session. Task #283 N0.
   */
  readonly usesPromptZone: boolean = false;

  /**
   * Bàn không vừa ở sàn chạm của khung hiện tại thì shell phủ lớp xoay máy dọc
   * (`BR-PSZ-14`). Đọc sau `prepareRound`; chưa có sân khấu thì sai. Mặc định
   * sai — chỉ engine mà portrait vừa còn landscape thấp không vừa mới khai
   * (GT-035, `BR-E035-06`).
   */
  requiresPortrait(): boolean {
    return false;
  }

  /** Phiên có cần nút nộp bài không (`BR-PSZ-05`). Mặc định false. */
  readonly needsCommit: boolean = false;

  /** Trạng thái sáng/mờ của nút nộp bài (`BR-PSZ-05`). Mặc định true khi needsCommit là true. */
  canCommit(): boolean {
    return true;
  }

  /**
   * Icon nút ở `zones.action` khi hành động chính không phải nộp (`BR-PSZ-05`):
   * ▶ chạy hoặc ■ dừng khi đang chạy (GT-035), loa nghe mẫu (GT-034). Bỏ trống là ✓.
   * Là getter để icon đổi theo trạng thái phiên.
   */
  get commitIcon(): CommitIcon | undefined {
    return undefined;
  }

  /** Vùng sân khấu được cấp bởi shell (`BR-PSZ-01`, Task #277 S3). */
  stageRect?: ZoneRect;

  /** Vùng khay được cấp bởi shell khi `needsTray` (`BR-PSZ-01`, Task #277 S5). */
  trayRect?: ZoneRect;

  /**
   * Px CSS trên một logic px do shell đo. Có thì sàn chạm tính trên px CSS thật
   * (`BR-PSZ-04`); chưa có thì sàn tính theo logic px như cũ. Task #283 N.
   */
  cssPerLogic?: number;

  /** Nhận không gian logic và vùng shell cấp; thứ không truyền thì giữ nguyên. */
  private applyZones(
    space?: LogicSpace,
    stage?: ZoneRect,
    tray?: ZoneRect,
    cssPerLogic?: number
  ): void {
    if (cssPerLogic !== undefined) {
      this.cssPerLogic = cssPerLogic;
    }
    if (space) {
      this.logicSpace = space;
    }
    if (stage) {
      this.stageRect = stage;
    }
    if (tray) {
      this.trayRect = tray;
    }
  }

  /**
   * Final — orchestrates a round: setup entities → compute slots → derived state.
   * Called by RoundRunner and GameEngine instead of raw setupEntities+resolveSlots.
   */
  prepareRound(
    band: AgeBand,
    space?: LogicSpace,
    stage?: ZoneRect,
    tray?: ZoneRect,
    cssPerLogic?: number
  ): void {
    this.applyZones(space, stage, tray, cssPerLogic);
    this.setupEntities();
    this._slots = this.computeSlots(band);
    this.sourceSlots = this._slots.filter((s) => s.role === "source");
    this.targetSlots = this._slots.filter((s) => s.role === "target");
    this.computeRoundDerived?.();
    this.roundGeneration++;
  }

  /**
   * Backward compatibility for callers/tests calling resolveSlots directly.
   * Delegates to computeSlots and caches the result on this._slots.
   */
  resolveSlots(
    band: AgeBand,
    space?: LogicSpace,
    stage?: ZoneRect,
    tray?: ZoneRect,
    cssPerLogic?: number
  ): void {
    this.applyZones(space, stage, tray, cssPerLogic);
    this._slots = this.computeSlots(band);
    this.sourceSlots = this._slots.filter((s) => s.role === "source");
    this.targetSlots = this._slots.filter((s) => s.role === "target");
    this.computeRoundDerived?.();
  }

  /**
   * Compute the layout slots for this round.
   * All 37 template sessions implement this method (Task #216).
   */
  protected abstract computeSlots(band: AgeBand): readonly Slot[];

  /**
   * Override to cache values derived from the round's entity/slot state.
   * Called after computeSlots inside prepareRound.
   */
  protected computeRoundDerived?(): void;

  /** Pure — safe to call every frame (BR-ENG-13). */
  checkWinCondition(): boolean {
    return this.isWon;
  }

  /** Close out a won round. Call AFTER recording the winning action's event. */
  protected winSession(): void {
    this.isWon = true;
    this.completeSession();
  }

  /**
   * Internal setter for slots — used by shim and resolveSlots migration path.
   * @internal
   */
  protected set _slotsInternal(value: readonly Slot[]) {
    this._slots = value;
  }

  /** Optional view snapshot of active entities (BR-EIC-01). */
  getView?(): EngineView;

  /** Convert a physical gesture into a logical GameAction. */
  toAction?(gesture: Gesture): GameAction | null;

  /** Commit the action state change and record events. */
  commit?(action: GameAction): void;

  /**
   * Unified input dispatcher (BR-EIC-04):
   * 1. Swallows gestures if session/round is won.
   * 2. Maps gesture to logical action via `toAction`.
   * 3. Validates action purely via `validateAction`.
   * 4. Commits state mutation via `commit` unconditionally (Task #259 / T15:
   *    `commit` is called unconditionally on all non-null actions so templates can
   *    trigger amber vibrations, failure shakes, or state rollbacks on incorrect inputs).
   */
  dispatch(gesture: Gesture): ActionResult | undefined {
    if (this.checkWinCondition() || this.isWon) {
      return ACTION_IGNORED;
    }

    const action = this.toAction?.(gesture);
    if (!action) {
      return ACTION_IGNORED;
    }

    const verdict = this.validateAction(action);
    this.commit?.(action);
    return verdict;
  }
}

function isTemplateGameSessionInstance(
  this: object,
  instance: object | null | undefined
): boolean {
  if (!instance || typeof instance !== "object") {
    return false;
  }
  if (this !== TemplateGameSession) {
    return Function.prototype[Symbol.hasInstance].call(this, instance);
  }
  if (
    Function.prototype[Symbol.hasInstance].call(TemplateGameSession, instance)
  ) {
    return true;
  }
  const candidate = instance as {
    isTemplateSession?: boolean;
    prepareRound?: () => void;
  };
  return (
    candidate.isTemplateSession === true &&
    typeof candidate.prepareRound === "function"
  );
}

Object.defineProperty(TemplateGameSession, Symbol.hasInstance, {
  value: isTemplateGameSessionInstance,
  configurable: true,
});
