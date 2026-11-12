import type { AgeBand } from "#src/contracts/types";
import {
  ACTION_IGNORED,
  type ActionResult,
  type GameAction,
  TemplateGameSession,
} from "#src/game-session";
import type { EngineView, Gesture, ViewEntity } from "#src/interaction";
import { resolveAssetLabels } from "#src/labels/spoken-keyword.js";
import { resolveTouchFloor } from "#src/layout/constants";
import { findHitSlotIndex, TAP_TOLERANCE_PX } from "#src/layout/hit-test.js";
import { resolveLayout } from "#src/layout/registry";
import type { Slot } from "#src/layout/types";
import { SelectionMechanic } from "#src/mechanics/selection-mechanic";
import {
  drawGT001OptionToken,
  drawGT001TargetShowcase,
  drawGT001WoodenDock,
} from "#src/render/gt-001-shapes.js";
import {
  drawSceneBackground,
  type ItemVisualState,
  spawnParticlesAtSlot,
} from "#src/render/index.js";
import type { MascotPose } from "#src/render/mascot";
import { deriveStream } from "#src/rng/mulberry32";
import { shuffle } from "#src/rng/shuffle";
import type { DegradationState } from "#src/systems/degradation";
import type { Particle, RenderSystem } from "#src/systems/render-system";
import { WrongFlashMap } from "#src/systems/wrong-flash";
import {
  computeGT001StageLayout,
  type GT001StageLayout,
  stepParticlesByDelta,
} from "./layout.js";
import type { GT001Content, GT001Difficulty } from "./template.js";

type OptionItem = GT001Content["options"][number];

const SESSION_FRAME_CLOCK = new WeakMap<GT001Session, { ms: number }>();

function readClockMs(session: GT001Session): number {
  return SESSION_FRAME_CLOCK.get(session)?.ms ?? 0;
}

function writeClockMs(session: GT001Session, ms: number): void {
  const entry = SESSION_FRAME_CLOCK.get(session);
  if (entry) {
    entry.ms = ms;
  } else {
    SESSION_FRAME_CLOCK.set(session, { ms });
  }
}

/** Khung chuyện đọc một lần ở vòng đầu (`BR-E001-05`, `BR-FBK-16`). */
export const GT001_STORY_LINE =
  "Gấu Con đi chợ, bé giúp Gấu Con chọn đúng món nhé!";

/** Tiền tố id của entity thẻ đề — tách khỏi không gian id của lựa chọn. */
const PROMPT_CARD_ID_PREFIX = "prompt:";

export class GT001Session extends TemplateGameSession<
  GT001Content,
  GT001Difficulty
> {
  override readonly usesPromptZone = true;

  selectedItemId: string | null = null;
  displayOptions: readonly OptionItem[] = [];
  private selectionItems: readonly { id: string; isCorrect: boolean }[] = [];
  private readonly mechanic = new SelectionMechanic({ mode: "single" });
  degradation: DegradationState | null = null;
  private particles: Particle[] = [];
  private itemStates: Map<string, ItemVisualState> = new Map();
  private wrongItemId: string | null = null;
  private readonly wrongFlashes = new WrongFlashMap();
  /** Đã chọn sai và chưa chọn đúng — Gấu Con còn ngó nghiêng (`BR-E001-05`). */
  private hasPickedWrong = false;
  private isRoundClosed = false;
  private pressedItemId: string | null = null;
  private winTriggeredAtMs: number | null = null;
  private activeAgeBand: AgeBand = "4-5";

  constructor(
    content: GT001Content,
    difficulty: GT001Difficulty,
    layoutSeed = 0,
    themeId?: string
  ) {
    super(content, difficulty, layoutSeed, themeId);
  }

  setupEntities(): void {
    this.selectedItemId = null;
    this.mechanic.reset();
    this.isWon = false;
    this.isRoundClosed = false;
    this.pressedItemId = null;
    this.winTriggeredAtMs = null;
    this.particles = [];
    this.itemStates = new Map();
    this.wrongItemId = null;
    this.wrongFlashes.clearAll();
    writeClockMs(this, 0);
    this.hasPickedWrong = false;
    this.selectionItems = this.content.options.map((opt) => ({
      id: opt.item_id,
      isCorrect: opt.is_correct,
    }));
    if (this.difficulty.shuffle_items === false) {
      this.displayOptions = [...this.content.options];
    } else {
      const rng = deriveStream(this.layoutSeed, "items");
      this.displayOptions = shuffle(this.content.options, rng);
    }
  }

  protected computeSlots(ageBand: AgeBand): readonly Slot[] {
    this.activeAgeBand = ageBand;
    const count = this.displayOptions.length;
    if (this.content.target_item && count > 0) {
      const touchFloor = resolveTouchFloor(ageBand, this.cssPerLogic);
      const layout = computeGT001StageLayout(
        this.logicSpace,
        this.stageRect,
        count,
        touchFloor
      );
      return layout.optionSlots;
    }

    const layoutFn = resolveLayout("grid");
    return layoutFn({
      slotCount: this.displayOptions.length,
      ageBand,
      logic: this.logicSpace,
      stage: this.stageRect,
      cssPerLogic: this.cssPerLogic,
    });
  }

  private resolveCurrentLayout(): GT001StageLayout {
    const touchFloor = resolveTouchFloor(this.activeAgeBand, this.cssPerLogic);
    return computeGT001StageLayout(
      this.logicSpace,
      this.stageRect,
      this.displayOptions.length,
      touchFloor
    );
  }

  getItemState(itemId: string): ItemVisualState {
    return this.itemStates.get(itemId) ?? "idle";
  }

  setItemState(itemId: string, state: ItemVisualState): void {
    this.itemStates.set(itemId, state);
  }

  private findOption(itemId: string): OptionItem | undefined {
    return this.content.options.find((opt) => opt.item_id === itemId);
  }

  validateAction(action: GameAction): ActionResult {
    const items = this.content.options.map((opt) => ({
      id: opt.item_id,
      isCorrect: opt.is_correct,
    }));
    return this.mechanic.validate(action, items);
  }

  onItemLocked(itemId: string): void {
    if (this.isWon || this.isRoundClosed) {
      return;
    }
    const nowMs = readClockMs(this);
    if (
      this.selectedItemId === itemId &&
      this.wrongFlashes.isActive(itemId, nowMs)
    ) {
      this.setItemState(itemId, "wrong");
      this.wrongItemId = itemId;
      this.wrongFlashes.trigger(itemId, nowMs);
      return;
    }
    this.selectedItemId = itemId;
    this.pressedItemId = null;
    this.mechanic.select(itemId);
    const isCorrect = this.findOption(itemId)?.is_correct === true;
    // Token nằm trên khay gỗ: mỗi lần chạm có tiếng "cộc" (`BR-E001-05`).
    this.queueSfx("wood_tap");
    this.hasPickedWrong = !isCorrect;
    this.recordEvent("item_selected", {
      item_id: itemId,
      is_correct: isCorrect,
    });
    if (isCorrect) {
      this.applyCorrectSelection(itemId, nowMs);
    } else {
      this.applyWrongSelection(itemId, nowMs);
    }
  }

  private applyCorrectSelection(itemId: string, nowMs: number): void {
    this.setItemState(itemId, "correct");
    this.winTriggeredAtMs = nowMs;
    if (this.degradation?.particles_enabled !== false) {
      const idx = this.displayOptions.findIndex((o) => o.item_id === itemId);
      const slot = this.slots[idx];
      if (slot) {
        this.particles.push(...spawnParticlesAtSlot(slot, 12));
      }
    }
    this.winSession();
  }

  private applyWrongSelection(itemId: string, nowMs: number): void {
    this.setItemState(itemId, "wrong");
    this.wrongItemId = itemId;
    this.wrongFlashes.trigger(itemId, nowMs);
    if (this.difficulty.allow_retry === false) {
      this.isRoundClosed = true;
      const correctOpt = this.displayOptions.find((o) => o.is_correct);
      if (correctOpt) {
        this.setItemState(correctOpt.item_id, "selected");
      }
    }
  }

  override isAcceptingInput(): boolean {
    return !this.isRoundClosed;
  }

  override dispatch(gesture: Gesture): ActionResult | undefined {
    if (this.isRoundClosed) {
      return ACTION_IGNORED;
    }
    return super.dispatch(gesture);
  }

  setTouchingItem(itemId: string | null): void {
    if (this.isWon || this.isRoundClosed) {
      this.pressedItemId = null;
      return;
    }
    if (
      itemId !== null &&
      this.displayOptions.some((opt) => opt.item_id === itemId)
    ) {
      this.pressedItemId = itemId;
      return;
    }
    this.pressedItemId = null;
  }

  override storyLine(): string {
    return GT001_STORY_LINE;
  }

  override mascotMood(): MascotPose | null {
    return this.hasPickedWrong ? "wonder" : null;
  }

  override getView(): EngineView {
    const entities: ViewEntity[] = [];
    const stateMap: Record<
      string,
      "idle" | "selected" | "correct" | "incorrect"
    > = {
      wrong: "incorrect",
      correct: "correct",
      selected: "selected",
    };

    if (this.content.target_item) {
      const targetSlot = this.resolveCurrentLayout().cardSlot;
      const { glyph, label, spokenLabel, spokenAudioPath } = resolveAssetLabels(
        this.content.target_item.asset
      );
      entities.push({
        id: `${PROMPT_CARD_ID_PREFIX}${this.content.target_item.item_id}`,
        slotIndex: -1,
        role: "neutral",
        state: "idle",
        x: targetSlot.x,
        y: targetSlot.y,
        w: targetSlot.w,
        h: targetSlot.h,
        glyph,
        label,
        spokenLabel,
        spokenAudioPath,
      });
    }

    for (let i = 0; i < this.displayOptions.length; i++) {
      const opt = this.displayOptions[i];
      const slot = this.slots[i];
      if (!(opt && slot)) {
        continue;
      }
      const rawState = this.getItemState(opt.item_id);
      const state = stateMap[rawState] ?? "idle";
      const { glyph, label, spokenLabel, spokenAudioPath } = resolveAssetLabels(
        opt.asset
      );

      entities.push({
        id: opt.item_id,
        slotIndex: i,
        role: "source",
        state,
        x: slot.x,
        y: slot.y,
        w: slot.w,
        h: slot.h,
        glyph,
        label,
        spokenLabel,
        spokenAudioPath,
      });
    }
    return {
      entities,
      activePrompt: this.content.prompt,
    };
  }

  override toAction(gesture: Gesture): GameAction | null {
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
    if (hitIndex >= 0 && hitIndex < this.displayOptions.length) {
      const opt = this.displayOptions[hitIndex];
      if (opt) {
        return {
          type: "select_item",
          data: { item_id: opt.item_id },
        };
      }
    }

    return null;
  }

  override getHintTargetIndex(): number | null {
    if (this.isWon || this.isRoundClosed) {
      return null;
    }
    const idx = this.displayOptions.findIndex((opt) => opt.is_correct);
    return idx >= 0 ? idx : null;
  }

  override commit(action: GameAction): void {
    if (
      action.type === "select_item" &&
      action.data &&
      typeof action.data === "object" &&
      "item_id" in action.data
    ) {
      const itemId = String(
        (
          action.data as {
            item_id: string | number | boolean | null | undefined;
          }
        ).item_id
      );
      this.onItemLocked(itemId);
    }
  }

  override checkWinCondition(): boolean {
    return this.mechanic.isSelectionComplete(this.selectionItems);
  }

  update(deltaMs: number): void {
    const nextMs = readClockMs(this) + deltaMs;
    writeClockMs(this, nextMs);
    for (const id of this.wrongFlashes.drainExpired(nextMs)) {
      if (this.getItemState(id) === "wrong") {
        this.setItemState(id, "idle");
      }
      if (this.wrongItemId === id) {
        this.wrongItemId = null;
      }
      if (this.selectedItemId === id && !this.isWon && !this.isRoundClosed) {
        this.selectedItemId = null;
      }
    }
    if (this.particles.length > 0) {
      this.particles = stepParticlesByDelta(this.particles, deltaMs);
    }
  }

  override destroy(): void {
    super.destroy();
    this.wrongFlashes.clearAll();
    this.pressedItemId = null;
    this.winTriggeredAtMs = null;
    this.isRoundClosed = false;
    writeClockMs(this, 0);
  }

  render(
    ctx: CanvasRenderingContext2D,
    rs: RenderSystem,
    timeMs: number
  ): void {
    const frameMs = timeMs;
    writeClockMs(this, frameMs);
    const slots = this.slots;
    const layout = this.resolveCurrentLayout();
    const winElapsedMs =
      this.winTriggeredAtMs === null
        ? 0
        : Math.max(0, frameMs - this.winTriggeredAtMs);

    drawSceneBackground(ctx, rs, this.themeId);
    if (this.content.target_item) {
      drawGT001TargetShowcase(
        ctx,
        rs,
        layout.cardSlot,
        this.content.target_item.asset,
        {
          timeMs: frameMs,
          isWon: this.isWon,
          winElapsedMs,
        }
      );
    }
    drawGT001WoodenDock(ctx, rs, layout.dockRect, slots);
    this.drawInteractive(rs, ctx, slots, frameMs, winElapsedMs);
    this.drawFeedback(rs, ctx);
  }

  private drawInteractive(
    rs: RenderSystem,
    ctx: CanvasRenderingContext2D,
    slots: readonly Slot[],
    frameMs: number,
    winElapsedMs: number
  ): void {
    for (let i = 0; i < this.displayOptions.length; i++) {
      const opt = this.displayOptions[i];
      const slot = slots[i];
      if (!(slot && opt)) {
        continue;
      }
      const rawState = this.getItemState(opt.item_id);
      const state: ItemVisualState =
        rawState === "idle" && this.pressedItemId === opt.item_id
          ? "touching"
          : rawState;
      const isActiveWrong = this.wrongFlashes.isActive(opt.item_id, frameMs);
      const wrongProgress = isActiveWrong
        ? this.wrongFlashes.progress(opt.item_id, frameMs)
        : 0;

      drawGT001OptionToken(
        ctx,
        rs,
        slot,
        i,
        {
          id: opt.item_id,
          asset: opt.asset,
          state,
        },
        {
          timeMs: frameMs,
          winElapsedMs,
          wrongProgress,
          isActiveWrong,
        }
      );
    }
  }

  private drawFeedback(rs: RenderSystem, ctx: CanvasRenderingContext2D): void {
    if (this.degradation?.particles_enabled === false) {
      return;
    }
    if (this.particles.length === 0) {
      return;
    }
    rs.drawParticles(ctx, this.particles);
  }
}
