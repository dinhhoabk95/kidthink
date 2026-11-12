import type { AgeBand } from "#src/contracts/types";
import {
  ACTION_IGNORED,
  type ActionResult,
  type GameAction,
  type HintDemoStep,
  type HintLevel,
  type HintTarget,
  TemplateGameSession,
} from "#src/game-session";
import type { EngineView, Gesture, ViewEntity } from "#src/interaction";
import { resolveAssetLabels } from "#src/labels/spoken-keyword.js";
import { findHitSlotIndex, TAP_TOLERANCE_PX } from "#src/layout/hit-test.js";
import { resolveLayout } from "#src/layout/registry";
import { insetDrawSize } from "#src/layout/slot-fit";
import type { Slot } from "#src/layout/types";
import { SelectionMechanic } from "#src/mechanics/selection-mechanic";
import {
  drawGT002BoardFrame,
  drawGT002ChoicePlate,
  drawGT002WrongRing,
} from "#src/render/gt-002-shapes.js";
import {
  drawSceneBackground,
  type ItemVisualState,
  spawnParticlesAtSlot,
} from "#src/render/index.js";
import type { MascotPose } from "#src/render/mascot";
import { deriveStream } from "#src/rng/mulberry32.js";
import { shuffle } from "#src/rng/shuffle.js";
import type { DegradationState } from "#src/systems/degradation";
import { MoodPulse } from "#src/systems/mood-pulse";
import type { Particle, RenderSystem } from "#src/systems/render-system";
import { WrongFlash } from "#src/systems/wrong-flash";
import {
  computeGT002BoardRect,
  type GT002TokenAnimState,
  stepParticlesByDelta,
} from "./layout.js";
import type { GT002Content, GT002Difficulty } from "./template.js";

type TargetItem = GT002Content["items"][number];

interface SessionClockState {
  ms: number;
  winAtMs: number | null;
  selectedAtMs: Map<string, number>;
}

const SESSION_CLOCKS = new WeakMap<GT002Session, SessionClockState>();

function getClockState(session: GT002Session): SessionClockState {
  let state = SESSION_CLOCKS.get(session);
  if (!state) {
    state = { ms: 0, winAtMs: null, selectedAtMs: new Map() };
    SESSION_CLOCKS.set(session, state);
  }
  return state;
}

function resetClockState(session: GT002Session): void {
  const state = getClockState(session);
  state.ms = 0;
  state.winAtMs = null;
  state.selectedAtMs.clear();
}

function readClockMs(session: GT002Session): number {
  return getClockState(session).ms;
}

function writeClockMs(session: GT002Session, ms: number): void {
  getClockState(session).ms = ms;
}

function extractItemId(data: GameAction["data"]): string | null {
  if (!data || typeof data !== "object") {
    return null;
  }
  const raw = Reflect.get(data, "item_id");
  if (typeof raw === "string" && raw.length > 0) {
    return raw;
  }
  if (typeof raw === "number" || typeof raw === "boolean") {
    return String(raw);
  }
  return null;
}

/** Khung chuyện đọc một lần ở vòng đầu (`BR-E002-05`, `BR-FBK-16`). */
export const GT002_STORY_LINE =
  "Bé thả lưới bắt cá nhé! Chọn những chú cá đúng rồi bấm kéo lưới lên.";

/** Mascot reo ngắn sau mỗi lần chọn cá (`BR-E002-05`). */
export const GT002_CHEER_MS = 800;
/** Mascot nghiêng đầu sau lần kéo lưới chưa đúng. */
export const GT002_WONDER_MS = 1500;

export class GT002Session extends TemplateGameSession<
  GT002Content,
  GT002Difficulty
> {
  displayItems: readonly TargetItem[] = [];
  private readonly mechanic = new SelectionMechanic({ mode: "multi" });
  degradation: DegradationState | null = null;
  private particles: Particle[] = [];
  private readonly wrongFlash = new WrongFlash();
  private readonly mood = new MoodPulse();
  private isRoundClosed = false;
  private pressedItemId: string | null = null;

  /** Nút Xong ở `zones.action` (`BR-PSZ-05`); chỉ sáng khi đã chọn ít nhất một vật. */
  override readonly needsCommit = true;
  override readonly usesPromptZone = true;

  setupEntities(): void {
    this.mechanic.reset();
    this.isWon = false;
    this.isRoundClosed = false;
    this.pressedItemId = null;
    this.particles = [];
    this.wrongFlash.clear();
    this.mood.clear();
    resetClockState(this);
    const rng = deriveStream(this.layoutSeed, "items");
    this.displayItems = shuffle(this.content.items, rng);
  }

  protected computeSlots(ageBand: AgeBand): readonly Slot[] {
    const layoutFn = resolveLayout("grid-2x4");
    return insetDrawSize(
      layoutFn({
        slotCount: this.displayItems.length,
        ageBand,
        logic: this.logicSpace,
        stage: this.stageRect,
        cssPerLogic: this.cssPerLogic,
      }),
      this.stageRect
    );
  }

  override isAcceptingInput(): boolean {
    return !this.isRoundClosed;
  }

  override canCommit(): boolean {
    return !(this.isWon || this.isRoundClosed) && this.hasSelection();
  }

  private hasSelection(): boolean {
    return this.mechanic.getSelectedIds().length > 0;
  }

  override storyLine(): string {
    return GT002_STORY_LINE;
  }

  /** Reo sau khi chọn cá, nghiêng đầu sau lần kéo chưa đúng (`BR-E002-05`). */
  override mascotMood(): MascotPose | null {
    return this.isWon ? null : this.mood.current();
  }

  update(deltaMs: number): void {
    this.mood.tick(deltaMs);
    writeClockMs(this, readClockMs(this) + deltaMs);
    if (this.particles.length > 0) {
      this.particles = stepParticlesByDelta(this.particles, deltaMs);
    }
  }

  override destroy(): void {
    super.destroy();
    this.wrongFlash.clear();
    this.mood.clear();
    this.pressedItemId = null;
    this.isRoundClosed = false;
    this.particles = [];
    resetClockState(this);
  }

  /** Các vật đang chọn còn nháy sai (nhịp `WrongFlash` chưa hết). */
  isWrongFlashing(): boolean {
    return this.wrongFlash.isActive(readClockMs(this));
  }

  setTouchingItem(itemId: string | null): void {
    if (this.isWon || this.isRoundClosed) {
      this.pressedItemId = null;
      return;
    }
    if (
      itemId !== null &&
      this.displayItems.some((it) => it.item_id === itemId)
    ) {
      this.pressedItemId = itemId;
      return;
    }
    this.pressedItemId = null;
  }

  getItemState(itemId: string): ItemVisualState {
    const item = this.content.items.find((it) => it.item_id === itemId);
    if (this.isWon) {
      return item?.is_correct ? "correct" : "idle";
    }
    if (this.isRoundClosed) {
      return item?.is_correct ? "selected" : "idle";
    }
    if (this.mechanic.isSelected(itemId)) {
      return "selected";
    }
    if (this.pressedItemId === itemId) {
      return "touching";
    }
    return "idle";
  }

  getRenderState(itemId: string): ItemVisualState {
    if (
      !this.isWon &&
      this.isWrongFlashing() &&
      this.mechanic.isSelected(itemId)
    ) {
      return "wrong";
    }
    return this.getItemState(itemId);
  }

  toggleItemSelection(itemId: string): void {
    if (this.isWon || this.isRoundClosed) {
      return;
    }
    const item = this.content.items.find((it) => it.item_id === itemId);
    if (!item) {
      return;
    }
    this.pressedItemId = null;
    this.wrongFlash.clear();
    const wasSelected = this.mechanic.isSelected(itemId);
    this.mechanic.toggle(itemId);
    const clock = getClockState(this);
    if (wasSelected) {
      clock.selectedAtMs.delete(itemId);
      return;
    }
    clock.selectedAtMs.set(itemId, clock.ms);
    this.recordEvent("item_selected", {
      item_id: item.item_id,
      is_correct: item.is_correct,
    });
    // Cue và reo giống nhau với cá đúng lẫn sai: không báo trước đáp án.
    this.queueSfx("net_splash");
    this.mood.set("cheer", GT002_CHEER_MS);
  }

  validateAction(action: GameAction): ActionResult {
    if (action.type === "toggle_item") {
      const itemId = extractItemId(action.data);
      const exists =
        itemId !== null && this.content.items.some((i) => i.item_id === itemId);
      return exists ? { valid: true, feedback: "none" } : ACTION_IGNORED;
    }
    const items = this.content.items.map((i) => ({
      id: i.item_id,
      isCorrect: i.is_correct,
    }));
    return this.mechanic.validate(action, items);
  }

  private spawnVictoryParticles(): void {
    if (this.degradation?.particles_enabled === false) {
      return;
    }
    for (let i = 0; i < this.displayItems.length; i++) {
      const item = this.displayItems[i];
      const slot = this.slots[i];
      if (item?.is_correct && slot) {
        this.particles.push(...spawnParticlesAtSlot(slot, 6));
      }
    }
  }

  onSubmitSelection(): void {
    if (this.isWon || this.isRoundClosed) {
      return;
    }
    this.pressedItemId = null;
    const result = this.validateAction({
      type: "submit_selection",
      data: {},
    });
    const nowMs = readClockMs(this);
    this.recordEvent("selection_submitted", { is_correct: result.valid });
    if (result.valid) {
      getClockState(this).winAtMs = nowMs;
      this.spawnVictoryParticles();
      this.winSession();
      return;
    }
    this.wrongFlash.trigger(nowMs);
    this.mood.set("wonder", GT002_WONDER_MS);
    if (this.difficulty.allow_retry === false) {
      this.isRoundClosed = true;
      this.completeSession();
    }
  }

  private toEntityState(rawState: ItemVisualState): ViewEntity["state"] {
    if (rawState === "correct") {
      return "correct";
    }
    if (rawState === "selected") {
      return "selected";
    }
    return "idle";
  }

  override getView(): EngineView {
    const entities: ViewEntity[] = [];

    for (let i = 0; i < this.displayItems.length; i++) {
      const item = this.displayItems[i];
      const slot = this.slots[i];
      if (!(item && slot)) {
        continue;
      }
      const rawState = this.getItemState(item.item_id);
      const state = this.toEntityState(rawState);
      const labels = resolveAssetLabels(item.asset);
      entities.push({
        id: item.item_id,
        slotIndex: i,
        role: "neutral",
        state,
        ...labels,
        x: slot.x,
        y: slot.y,
        w: slot.w,
        h: slot.h,
      });
    }
    return {
      entities,
      activePrompt: this.content.prompt,
    };
  }

  override dispatch(gesture: Gesture): ActionResult | undefined {
    if (this.isRoundClosed) {
      return ACTION_IGNORED;
    }
    return super.dispatch(gesture);
  }

  override toAction(gesture: Gesture): GameAction | null {
    if (this.isWon || this.isRoundClosed) {
      return null;
    }
    if (gesture.type === "commit") {
      // Chưa chọn vật nào thì nuốt cử chỉ: nút đang mờ (`N1`), Cấm — NEVER
      // tính một lần sai.
      return this.hasSelection()
        ? { type: "submit_selection", data: {} }
        : null;
    }
    if (gesture.type !== "tap") {
      return null;
    }

    const hitIndex = findHitSlotIndex(
      this.slots,
      gesture.x,
      gesture.y,
      "circle",
      TAP_TOLERANCE_PX
    );
    if (hitIndex >= 0 && hitIndex < this.displayItems.length) {
      const item = this.displayItems[hitIndex];
      if (item) {
        return {
          type: "toggle_item",
          data: { item_id: item.item_id },
        };
      }
    }

    return null;
  }

  override getHintTargetIndex(): number | null {
    if (this.isWon || this.isRoundClosed) {
      return null;
    }
    const missingCorrectIdx = this.displayItems.findIndex(
      (it) => it.is_correct && !this.mechanic.isSelected(it.item_id)
    );
    if (missingCorrectIdx >= 0) {
      return missingCorrectIdx;
    }
    const extraDistractorIdx = this.displayItems.findIndex(
      (it) => !it.is_correct && this.mechanic.isSelected(it.item_id)
    );
    return extraDistractorIdx >= 0 ? extraDistractorIdx : null;
  }

  override getHintTarget(): HintTarget | null {
    if (this.isWon || this.isRoundClosed) {
      return null;
    }
    return super.getHintTarget();
  }

  override getHintDemoSequence(
    level: HintLevel
  ): readonly HintDemoStep[] | null {
    if (level !== 3 || this.isWon || this.isRoundClosed) {
      return null;
    }
    const missingCorrect: number[] = [];
    const extraDistractor: number[] = [];
    for (let i = 0; i < this.displayItems.length; i++) {
      const item = this.displayItems[i];
      if (!item) {
        continue;
      }
      const selected = this.mechanic.isSelected(item.item_id);
      if (item.is_correct && !selected) {
        missingCorrect.push(i);
      } else if (!item.is_correct && selected) {
        extraDistractor.push(i);
      }
    }
    const steps = [...missingCorrect, ...extraDistractor];
    return steps.length >= 2 ? steps.map((idx) => ({ from: idx })) : null;
  }

  override commit(action: GameAction): void {
    if (action.type === "toggle_item") {
      const itemId = extractItemId(action.data);
      if (itemId !== null) {
        this.toggleItemSelection(itemId);
      }
    } else if (action.type === "submit_selection") {
      this.onSubmitSelection();
    }
  }

  render(
    ctx: CanvasRenderingContext2D,
    rs: RenderSystem,
    timeMs: number
  ): void {
    writeClockMs(this, timeMs);
    const slots = this.slots;
    const boardRect = computeGT002BoardRect(
      slots,
      this.logicSpace,
      this.stageRect
    );

    drawSceneBackground(ctx, rs, this.themeId);
    drawGT002BoardFrame(ctx, rs, boardRect);
    this.drawInteractive(rs, ctx, slots, timeMs);
    this.drawFeedback(rs, ctx, slots, timeMs);
  }

  private buildTokenAnim(itemId: string, timeMs: number): GT002TokenAnimState {
    const clock = getClockState(this);
    const selectedAt = clock.selectedAtMs.get(itemId);
    const selectElapsedMs =
      selectedAt === undefined ? 9999 : Math.max(0, timeMs - selectedAt);
    const winElapsedMs =
      clock.winAtMs === null ? 0 : Math.max(0, timeMs - clock.winAtMs);
    const isActiveWrong = this.wrongFlash.isActive(timeMs);
    const wrongProgress = isActiveWrong ? this.wrongFlash.progress(timeMs) : 0;
    return {
      timeMs,
      selectElapsedMs,
      winElapsedMs,
      wrongProgress,
      isActiveWrong,
    };
  }

  private drawInteractive(
    rs: RenderSystem,
    ctx: CanvasRenderingContext2D,
    slots: readonly Slot[],
    timeMs: number
  ): void {
    for (let i = 0; i < this.displayItems.length; i++) {
      const item = this.displayItems[i];
      const slot = slots[i];
      if (!(slot && item)) {
        continue;
      }
      const renderState = this.getRenderState(item.item_id);
      const anim = this.buildTokenAnim(item.item_id, timeMs);
      drawGT002ChoicePlate(
        ctx,
        rs,
        slot,
        i,
        {
          id: item.item_id,
          asset: item.asset,
          state: renderState,
        },
        anim
      );
    }
  }

  private drawFeedback(
    rs: RenderSystem,
    ctx: CanvasRenderingContext2D,
    slots: readonly Slot[],
    timeMs: number
  ): void {
    for (let i = 0; i < this.displayItems.length; i++) {
      const item = this.displayItems[i];
      const slot = slots[i];
      if (!(slot && item)) {
        continue;
      }
      if (this.getRenderState(item.item_id) === "wrong") {
        const anim = this.buildTokenAnim(item.item_id, timeMs);
        drawGT002WrongRing(ctx, rs, slot, i, anim);
      }
    }
    if (this.degradation?.particles_enabled === false) {
      return;
    }
    if (this.particles.length === 0) {
      return;
    }
    rs.drawParticles(ctx, this.particles);
  }
}
