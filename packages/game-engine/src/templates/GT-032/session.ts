import {
  formatNumberWord,
  formatSpokenLabel,
} from "@mindkid/shared/preschool-terminology";
import type { AgeBand } from "#src/contracts/types";
import {
  ACTION_CORRECT,
  ACTION_IGNORED,
  ACTION_RETRY,
  type ActionResult,
  type GameAction,
  type HintLevel,
  type HintTarget,
  TemplateGameSession,
} from "#src/game-session";
import type {
  EngineView,
  EntityVisual,
  Gesture,
  ViewEntity,
} from "#src/interaction";
import { findHitSlotIndex, TAP_TOLERANCE_PX } from "#src/layout/hit-test";
import { resolveLayout } from "#src/layout/registry";
import type { ZoneRect } from "#src/layout/stage-zones";
import type { Slot } from "#src/layout/types";
import {
  drawDetachedWaterColumns,
  drawLabelText,
  drawLiquidCup,
  drawPourDemo,
  drawSceneBackground,
  drawWoodenTokenDock,
  liquidCupRect,
  spawnParticlesAtSlot,
  updateParticles,
} from "#src/render/index";
import type { MascotPose } from "#src/render/mascot";
import type { DegradationState } from "#src/systems/degradation";
import { MoodPulse } from "#src/systems/mood-pulse";
import type { Particle, RenderSystem } from "#src/systems/render-system";
import type { GT032Content, GT032Cup, GT032Difficulty } from "./template";

/** Rót hoặc chọn cốc hợp lệ nhưng chưa chấm đúng sai. */
const QUIET_OK: ActionResult = Object.freeze({
  valid: true,
  feedback: "none",
});

interface GT032ActionPayload {
  readonly cup_id?: string;
  readonly id?: string;
  readonly option_id?: string;
  readonly delta?: number;
  readonly fill_units?: number;
}

/** Khung chuyện theo loại bài, đọc một lần ở vòng đầu (`BR-E032-09`, `BR-FBK-16`). */
export const GT032_STORY_LINE_POUR =
  "Ngựa Con khát nước quá. Bé rót nước vào cốc tới vạch rồi bấm xong cho Ngựa Con uống nhé!";
export const GT032_STORY_LINE_PICK =
  "Ngựa Con khát nước quá. Bé nhìn kỹ các cốc nước rồi chọn đúng cốc cho Ngựa Con uống nhé!";

/** Mascot vui sau mỗi nấc rót. */
export const GT032_HAPPY_MS = 600;
/** Cột nước tách khỏi cốc xếp cạnh nhau trong chừng này ms (chậm 0,5× so với 700 ms) — `BR-E032-10`. */
export const GT032_COLUMNS_TWEEN_MS = 1400;
/** Màn rót giữa hai cốc của bài bảo toàn chạy chừng này ms đồng hồ khung (`BR-E032-12`). */
export const GT032_POUR_DEMO_MS = 2000;
/** Mascot nghiêng đầu sau lần chọn cốc hoặc chốt rót chưa đúng. */
export const GT032_WONDER_MS = 1500;

export class GT032Session extends TemplateGameSession<
  GT032Content,
  GT032Difficulty
> {
  override readonly usesPromptZone = true;
  /** Rót tới vạch phải tự bấm chốt; chạm lướt qua vạch đích không thắng (`BR-E032-07`). */
  override readonly needsCommit: boolean;

  degradation: DegradationState | null = null;
  selectedCupId: string | null = null;
  isWin = false;
  showHintMarks = false;
  /** Bậc hint đang hiện trên canvas (0 = chưa có); về 0 khi trẻ thao tác (`BR-E032-10`). */
  private hintLevel: 0 | HintLevel = 0;
  private columnsStartMs: number | null = null;
  /** Đồng hồ khung của màn rót, cộng dồn từ `update` (`BR-E032-12`). */
  private pourElapsedMs = 0;
  /** Lần vẽ gần nhất có giảm chuyển động không: bỏ hoạt ảnh rót, mở cổng ngay. */
  private reducedMotion = false;

  private readonly cupFills: Map<string, number> = new Map();
  private particles: Particle[] = [];
  private readonly mood = new MoodPulse();

  override storyLine(): string {
    return this.content.question_type === "pour_to_mark"
      ? GT032_STORY_LINE_POUR
      : GT032_STORY_LINE_PICK;
  }

  /** Chỉ phản ứng sau thao tác, không báo trước cốc hay vạch đúng (`BR-E032-09`). */
  override mascotMood(): MascotPose | null {
    return this.isWon ? null : this.mood.current();
  }

  update(deltaMs: number): void {
    this.mood.tick(deltaMs);
    if (this.pourElapsedMs < GT032_POUR_DEMO_MS) {
      this.pourElapsedMs += deltaMs;
    }
  }

  /** Cặp cốc bẫy: hai cốc đầu cùng `fill_units` khác `shape`, ưu tiên cùng dung tích (`BR-E032-02`). */
  private pourDemoPair(): readonly [number, number] | null {
    if (
      !this.content.conservation_trap ||
      this.content.question_type === "pour_to_mark"
    ) {
      return null;
    }
    const cups = this.content.cups;
    let fallback: readonly [number, number] | null = null;
    for (let i = 0; i < cups.length; i++) {
      for (let j = i + 1; j < cups.length; j++) {
        const a = cups[i];
        const b = cups[j];
        if (!(a && b) || a.fill_units !== b.fill_units || a.shape === b.shape) {
          continue;
        }
        if (a.capacity_units === b.capacity_units) {
          return [i, j];
        }
        fallback = fallback ?? [i, j];
      }
    }
    return fallback;
  }

  /** Đang rót giữa hai cốc: chưa hết giờ và không giảm chuyển động (`BR-E032-12`). */
  private isPourDemoActive(): boolean {
    return (
      !this.reducedMotion &&
      this.pourElapsedMs < GT032_POUR_DEMO_MS &&
      this.pourDemoPair() !== null
    );
  }

  /** Cổng cử chỉ đóng trong lúc rót; bề mặt chơi nuốt cử chỉ, đồng hồ trợ giúp dừng. */
  override isAcceptingInput(): boolean {
    return !this.isPourDemoActive();
  }

  constructor(
    content: GT032Content,
    difficulty: GT032Difficulty,
    layoutSeed = 0,
    themeId?: string
  ) {
    super(content, difficulty, layoutSeed, themeId);
    this.needsCommit = content.question_type === "pour_to_mark";
    for (const cup of content.cups) {
      this.cupFills.set(cup.cup_id, cup.fill_units);
    }
  }

  setupEntities(): void {
    this.mood.clear();
    this.pourElapsedMs = 0;
    this.selectedCupId = null;
    this.isWin = false;
    const diff = this.difficulty as GT032Difficulty & {
      show_hint_marks?: boolean;
    };
    this.showHintMarks = diff.show_hint_marks ?? false;
    this.clearHintLevel();
    this.particles = [];
    this.cupFills.clear();
    for (const cup of this.content.cups) {
      this.cupFills.set(cup.cup_id, cup.fill_units);
    }
    this.recordEvent("game_started", {
      template_code: "GT-032",
      question_type: this.content.question_type,
      cup_count: this.content.cups.length,
    });
  }

  getCupFill(cupId: string): number {
    const tracked = this.cupFills.get(cupId);
    if (tracked !== undefined) {
      return tracked;
    }
    const cup = this.content.cups.find((c) => c.cup_id === cupId);
    return cup?.fill_units ?? 0;
  }

  getTargetFill(cup: GT032Cup): number {
    return cup.target_units ?? this.content.target_units ?? cup.capacity_units;
  }

  /** Bậc hint đang hiện trên canvas — test và shell đọc. */
  getShownHintLevel(): 0 | HintLevel {
    return this.hintLevel;
  }

  override getHintTargetForLevel(level: HintLevel): HintTarget | null {
    if (this.checkWinCondition()) {
      this.hintLevel = 0;
    } else if (level !== this.hintLevel) {
      this.hintLevel = level;
      this.columnsStartMs = null;
    }
    return super.getHintTargetForLevel(level);
  }

  override onHintCleared(): void {
    this.clearHintLevel();
  }

  private clearHintLevel(): void {
    this.hintLevel = 0;
    this.columnsStartMs = null;
  }

  /** `L3` tách cột nước cho ba dạng so sánh; dạng rót giữ `L3` là chỉ cốc cần rót. */
  private showsDetachedColumns(): boolean {
    return (
      this.hintLevel === 3 && this.content.question_type !== "pour_to_mark"
    );
  }

  override getHintTargetIndex(): number | null {
    if (this.isWin || this.isWon) {
      return null;
    }
    if (this.content.question_type === "pour_to_mark") {
      // Đã tới vạch: bước kế là bấm nút chốt, không còn cốc để chỉ.
      const idx = this.content.cups.findIndex((c) => !this.isCupCorrect(c));
      return idx >= 0 ? idx : null;
    }
    const idx = this.content.cups.findIndex((c) => this.isCupCorrect(c));
    return idx >= 0 ? idx : null;
  }

  protected computeSlots(band: AgeBand): readonly Slot[] {
    const layoutFn = resolveLayout("grid");
    return layoutFn({
      slotCount: this.content.cups.length,
      ageBand: band,
      logic: this.logicSpace,
      stage: this.stageRect,
      cssPerLogic: this.cssPerLogic,
    });
  }

  isCupCorrect(cup: GT032Cup): boolean {
    const qType = this.content.question_type;
    const cups = this.content.cups;
    const fill = this.getCupFill(cup.cup_id);

    if (qType === "more") {
      const maxFill = Math.max(...cups.map((c) => this.getCupFill(c.cup_id)));
      return fill === maxFill;
    }

    if (qType === "less") {
      const minFill = Math.min(...cups.map((c) => this.getCupFill(c.cup_id)));
      return fill === minFill;
    }

    if (qType === "same") {
      const matchingCount = cups.filter(
        (c) => this.getCupFill(c.cup_id) === fill
      ).length;
      return matchingCount >= 2;
    }

    return fill === this.getTargetFill(cup);
  }

  private resolvePourTargetCup(cupId?: string): GT032Cup | null {
    if (cupId) {
      return this.content.cups.find((c) => c.cup_id === cupId) ?? null;
    }
    if (this.selectedCupId) {
      const selected = this.content.cups.find(
        (c) => c.cup_id === this.selectedCupId
      );
      if (selected) {
        return selected;
      }
    }
    return (
      this.content.cups.find((c) => !this.isCupCorrect(c)) ??
      this.content.cups[0] ??
      null
    );
  }

  private computeNextPourFill(
    cup: GT032Cup,
    data: GT032ActionPayload
  ): number | null {
    const current = this.getCupFill(cup.cup_id);
    if (data.fill_units !== undefined) {
      if (
        !Number.isInteger(data.fill_units) ||
        data.fill_units < 0 ||
        data.fill_units > cup.capacity_units
      ) {
        return null;
      }
      return data.fill_units;
    }
    const delta = data.delta ?? 0;
    if (!Number.isFinite(delta) || delta === 0) {
      return null;
    }
    const stepDelta =
      delta > 0
        ? Math.max(1, Math.round(delta))
        : Math.min(-1, Math.round(delta));
    const next = Math.max(0, Math.min(cup.capacity_units, current + stepDelta));
    return next === current ? null : next;
  }

  private validateAdjustCup(data: GT032ActionPayload): ActionResult {
    if (this.content.question_type !== "pour_to_mark") {
      return ACTION_IGNORED;
    }
    const cup = this.resolvePourTargetCup(
      data.cup_id ?? data.id ?? data.option_id
    );
    if (!cup) {
      return ACTION_IGNORED;
    }
    const nextFill = this.computeNextPourFill(cup, data);
    if (nextFill === null) {
      return ACTION_IGNORED;
    }
    // Rót từng vạch không báo đúng sai: chốt mới là lúc chấm (`BR-E032-07`).
    return QUIET_OK;
  }

  private validateConfirmPour(): ActionResult {
    if (this.content.question_type !== "pour_to_mark") {
      return ACTION_IGNORED;
    }
    const active = this.resolvePourTargetCup();
    return active && this.isPourGoalSatisfied(active)
      ? ACTION_CORRECT
      : ACTION_RETRY;
  }

  private validateSelectCup(cupId: string): ActionResult {
    const cup = this.content.cups.find((c) => c.cup_id === cupId);
    if (!cup) {
      return ACTION_IGNORED;
    }

    if (this.content.question_type === "pour_to_mark") {
      return QUIET_OK;
    }

    if (this.isCupCorrect(cup)) {
      return ACTION_CORRECT;
    }

    return ACTION_RETRY;
  }

  validateAction(action: GameAction): ActionResult {
    if (this.isWin || this.isWon) {
      return ACTION_IGNORED;
    }

    const type = action.type;
    const data = (
      typeof action.data === "object" && action.data !== null ? action.data : {}
    ) as GT032ActionPayload;

    if (
      type === "select_cup" ||
      type === "tap_cup" ||
      type === "choose_cup" ||
      type === "select_option"
    ) {
      const cupId = data.cup_id ?? data.id ?? data.option_id ?? "";
      return this.validateSelectCup(cupId);
    }

    if (type === "adjust_cup" || type === "pour_cup") {
      return this.validateAdjustCup(data);
    }

    if (type === "confirm_pour") {
      return this.validateConfirmPour();
    }

    if (type === "show_hint") {
      return ACTION_CORRECT;
    }

    return ACTION_IGNORED;
  }

  private isPourGoalSatisfied(activeCup: GT032Cup): boolean {
    const cupsWithExplicitTarget = this.content.cups.filter(
      (c) => c.target_units !== undefined
    );
    if (cupsWithExplicitTarget.length > 0) {
      return cupsWithExplicitTarget.every((c) => this.isCupCorrect(c));
    }
    return this.isCupCorrect(activeCup);
  }

  private commitAdjustCup(data: GT032ActionPayload): void {
    if (this.content.question_type !== "pour_to_mark") {
      return;
    }
    const cup = this.resolvePourTargetCup(
      data.cup_id ?? data.id ?? data.option_id
    );
    if (!cup) {
      return;
    }
    const nextFill = this.computeNextPourFill(cup, data);
    if (nextFill === null) {
      return;
    }
    this.cupFills.set(cup.cup_id, nextFill);
    this.selectedCupId = cup.cup_id;
    // Tiếng rót như nhau dù đã tới vạch hay chưa: rót là thao tác nháp (`BR-E032-09`).
    this.queueSfx("water_pour");
    this.mood.set("happy", GT032_HAPPY_MS);
    const reachedTarget = this.isCupCorrect(cup);
    this.recordEvent("liquid_poured", {
      cup_id: cup.cup_id,
      fill_units: nextFill,
      target_units: this.getTargetFill(cup),
      is_correct: reachedTarget,
    });
  }

  private commitConfirmPour(): void {
    const active = this.resolvePourTargetCup();
    if (
      this.content.question_type !== "pour_to_mark" ||
      !active ||
      !this.isPourGoalSatisfied(active)
    ) {
      this.mood.set("wonder", GT032_WONDER_MS);
      this.recordEvent("pour_confirm_wrong", {});
      return;
    }
    this.isWin = true;
    this.isWon = true;
    const cupIdx = this.content.cups.findIndex(
      (c) => c.cup_id === active.cup_id
    );
    const slot = this.slots[cupIdx];
    if (slot) {
      this.particles.push(...spawnParticlesAtSlot(slot, 16));
    }
    this.recordEvent("game_completed", { score: 100 });
    this.winSession();
  }

  private commitSelectCup(cupId: string): void {
    const cup = this.content.cups.find((c) => c.cup_id === cupId);
    if (!cup) {
      return;
    }

    if (this.content.question_type === "pour_to_mark") {
      this.selectedCupId = cup.cup_id;
      return;
    }

    const correct = this.isCupCorrect(cup);
    this.recordEvent("cup_selected", {
      cup_id: cup.cup_id,
      fill_units: this.getCupFill(cup.cup_id),
      is_correct: correct,
    });

    if (correct) {
      this.isWin = true;
      this.isWon = true;
      this.selectedCupId = cupId;
      const cupIdx = this.content.cups.findIndex((c) => c.cup_id === cupId);
      const slot = this.slots[cupIdx];
      if (slot) {
        this.particles.push(...spawnParticlesAtSlot(slot, 16));
      }
      this.recordEvent("game_completed", { score: 100 });
      this.winSession();
    } else {
      this.mood.set("wonder", GT032_WONDER_MS);
    }
  }

  override commit(action: GameAction): void {
    const type = action.type;
    if (type !== "show_hint") {
      this.clearHintLevel();
    }
    const data = (
      typeof action.data === "object" && action.data !== null ? action.data : {}
    ) as GT032ActionPayload;

    if (
      type === "select_cup" ||
      type === "tap_cup" ||
      type === "choose_cup" ||
      type === "select_option"
    ) {
      const cupId = data.cup_id ?? data.id ?? data.option_id ?? "";
      this.commitSelectCup(cupId);
      return;
    }

    if (type === "adjust_cup" || type === "pour_cup") {
      this.commitAdjustCup(data);
      return;
    }

    if (type === "confirm_pour") {
      this.commitConfirmPour();
      return;
    }

    if (type === "show_hint") {
      this.showHintMarks = true;
    }
  }

  override toAction(gesture: Gesture): GameAction | null {
    if (gesture.type === "commit") {
      return this.needsCommit ? { type: "confirm_pour", data: {} } : null;
    }
    if (gesture.type === "adjust") {
      return this.toAdjustAction(gesture);
    }
    if (gesture.type === "tap") {
      return this.toTapAction(gesture.x, gesture.y);
    }
    return null;
  }

  private toAdjustAction(
    gesture: Extract<Gesture, { type: "adjust" }>
  ): GameAction | null {
    if (this.content.question_type !== "pour_to_mark") {
      return null;
    }
    const targetCup = this.resolvePourTargetCup();
    if (!(targetCup && Number.isFinite(gesture.delta)) || gesture.delta === 0) {
      return null;
    }
    return {
      type: "adjust_cup",
      data: { cup_id: targetCup.cup_id, delta: gesture.delta },
    };
  }

  private toTapAction(x: number, y: number): GameAction | null {
    const cupSlots = this.slots.slice(0, this.content.cups.length);
    const index = findHitSlotIndex(cupSlots, x, y, "square", TAP_TOLERANCE_PX);
    const cup = this.content.cups[index];
    if (!cup) {
      return null;
    }
    if (this.content.question_type === "pour_to_mark") {
      const targetFill = this.getTargetFill(cup);
      const fill = this.getCupFill(cup.cup_id);
      if (fill === targetFill) {
        return {
          type: "select_cup",
          data: { cup_id: cup.cup_id },
        };
      }
      if (fill >= cup.capacity_units) {
        return {
          type: "adjust_cup",
          data: { cup_id: cup.cup_id, delta: -fill },
        };
      }
      return {
        type: "adjust_cup",
        data: { cup_id: cup.cup_id, delta: 1 },
      };
    }
    return {
      type: "select_cup",
      data: { cup_id: cup.cup_id },
    };
  }

  override getView(): EngineView {
    const entities: ViewEntity[] = [];

    for (let i = 0; i < this.content.cups.length; i++) {
      const cup = this.content.cups[i];
      const slot = this.slots[i];
      if (!(cup && slot)) {
        continue;
      }

      let state: EntityVisual = "idle";
      if (this.selectedCupId === cup.cup_id) {
        state = this.isCupCorrect(cup) ? "correct" : "selected";
      }

      // Không đọc hay in mức nước: đó là đáp án (`BR-E032-06`).
      const cupNumberWord = formatNumberWord(i + 1);
      const spokenLabel = formatSpokenLabel(`cốc số ${cupNumberWord}`);

      entities.push({
        id: cup.cup_id,
        slotIndex: i,
        role: "source",
        state,
        x: slot.x,
        y: slot.y,
        w: slot.w,
        h: slot.h,
        hitShape: "square",
        glyph: "🥛",
        spokenLabel,
      });
    }

    return {
      activePrompt: this.content.prompt,
      entities,
    };
  }

  override checkWinCondition(): boolean {
    return this.isWin || this.isWon;
  }

  getSelectedCupId(): string | null {
    return this.selectedCupId;
  }

  private maxCapacityUnits(): number {
    return Math.max(...this.content.cups.map((c) => c.capacity_units));
  }

  private drawCupTray(ctx: CanvasRenderingContext2D, rs: RenderSystem): void {
    const cupSlots = this.slots.slice(0, this.content.cups.length);
    if (cupSlots.length === 0) {
      return;
    }
    let minX = Number.POSITIVE_INFINITY;
    let minY = Number.POSITIVE_INFINITY;
    let maxX = Number.NEGATIVE_INFINITY;
    let maxY = Number.NEGATIVE_INFINITY;
    for (let i = 0; i < cupSlots.length; i++) {
      const slot = cupSlots[i];
      if (!slot) {
        continue;
      }
      const cup = this.content.cups[i];
      if (!cup) {
        continue;
      }
      const rect = liquidCupRect(
        slot,
        cup.shape,
        cup.capacity_units,
        this.maxCapacityUnits()
      );
      const cupX = rect.x;
      const cupY = rect.y;
      const cupW = rect.w;
      const cupH = rect.h;
      minX = Math.min(minX, cupX);
      minY = Math.min(minY, cupY);
      maxX = Math.max(maxX, cupX + cupW);
      maxY = Math.max(maxY, cupY + cupH);
    }
    const padX = 24;
    const padY = 16;
    const trayRect: ZoneRect = {
      x: Math.round(minX - padX),
      y: Math.round(minY - padY),
      w: Math.round(maxX - minX + 2 * padX),
      h: Math.round(maxY - minY + 2 * padY),
    };
    drawWoodenTokenDock(ctx, rs, trayRect);
  }

  /** `L2`: số vạch có nước, chữ số nhỏ dưới mỗi cốc (`BR-E032-10`). */
  private drawFillCount(
    ctx: CanvasRenderingContext2D,
    cup: GT032Cup,
    slot: Slot
  ): void {
    const rect = liquidCupRect(
      slot,
      cup.shape,
      cup.capacity_units,
      this.maxCapacityUnits()
    );
    drawLabelText(
      ctx,
      String(this.getCupFill(cup.cup_id)),
      slot.x,
      rect.y + rect.h + 18,
      24
    );
  }

  /** `L3`: cột nước tách khỏi cốc, xếp cạnh nhau; chậm 0,5×, giảm chuyển động thì xếp ngay. */
  private drawDetachedColumns(
    ctx: CanvasRenderingContext2D,
    rs: RenderSystem,
    timeMs: number
  ): void {
    if (this.columnsStartMs === null) {
      this.columnsStartMs = timeMs;
    }
    const progress = rs.reducedMotion
      ? 1
      : (timeMs - this.columnsStartMs) / GT032_COLUMNS_TWEEN_MS;
    const cups = this.content.cups.flatMap((cup, i) => {
      const slot = this.slots[i];
      return slot
        ? [
            {
              slot,
              shape: cup.shape,
              capacityUnits: cup.capacity_units,
              fillUnits: this.getCupFill(cup.cup_id),
              color: cup.color,
            },
          ]
        : [];
    });
    drawDetachedWaterColumns(ctx, cups, this.maxCapacityUnits(), progress);
  }

  /** Cốc bản sao nghiêng + tia nước từ cốc thứ nhất sang cốc thứ hai (`BR-E032-12`). */
  private drawPourDemoOverlay(
    ctx: CanvasRenderingContext2D,
    rs: RenderSystem,
    pair: readonly [number, number],
    progress: number
  ): void {
    const src = this.content.cups[pair[0]];
    const dst = this.content.cups[pair[1]];
    const srcSlot = this.slots[pair[0]];
    const dstSlot = this.slots[pair[1]];
    if (!(src && dst && srcSlot && dstSlot)) {
      return;
    }
    drawPourDemo(
      ctx,
      rs,
      {
        slot: srcSlot,
        shape: src.shape,
        capacityUnits: src.capacity_units,
        fillUnits: src.fill_units,
        color: src.color,
      },
      {
        slot: dstSlot,
        shape: dst.shape,
        capacityUnits: dst.capacity_units,
        fillUnits: dst.fill_units,
        color: dst.color,
      },
      this.maxCapacityUnits(),
      progress
    );
  }

  /** Một cốc: `fillScale` < 1 là cốc nhận đang dâng trong màn rót (`BR-E032-12`). */
  private drawCup(
    ctx: CanvasRenderingContext2D,
    rs: RenderSystem,
    index: number,
    detached: boolean,
    fillScale: number
  ): void {
    const cup = this.content.cups[index];
    const slot = this.slots[index];
    if (!(cup && slot)) {
      return;
    }
    drawLiquidCup(ctx, rs, slot, {
      cupId: cup.cup_id,
      shape: cup.shape,
      capacityUnits: cup.capacity_units,
      // L3: nước đã rời cốc, nằm ở cột tách bên dưới.
      fillUnits: detached ? 0 : this.getCupFill(cup.cup_id) * fillScale,
      color: cup.color,
      isSelected: this.selectedCupId === cup.cup_id,
      showHintMarks: this.showHintMarks || this.hintLevel >= 1,
      maxCapacityUnits: this.maxCapacityUnits(),
    });
    if (this.hintLevel >= 2 && !detached) {
      this.drawFillCount(ctx, cup, slot);
    }
  }

  render(
    ctx: CanvasRenderingContext2D,
    rs: RenderSystem,
    timeMs: number
  ): void {
    this.reducedMotion = rs.reducedMotion;
    drawSceneBackground(ctx, rs, this.themeId);

    this.drawCupTray(ctx, rs);

    const detached = this.showsDetachedColumns();
    const pourPair = this.isPourDemoActive() ? this.pourDemoPair() : null;
    const pourProgress = Math.min(1, this.pourElapsedMs / GT032_POUR_DEMO_MS);
    for (let i = 0; i < this.content.cups.length; i++) {
      this.drawCup(
        ctx,
        rs,
        i,
        detached,
        pourPair?.[1] === i ? pourProgress : 1
      );
    }
    if (detached) {
      this.drawDetachedColumns(ctx, rs, timeMs);
    }
    if (pourPair) {
      this.drawPourDemoOverlay(ctx, rs, pourPair, pourProgress);
    }

    if (this.degradation?.particles_enabled !== false) {
      this.particles = updateParticles(this.particles);
      rs.drawParticles(ctx, this.particles);
    }
  }
}
