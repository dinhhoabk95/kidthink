import type { AgeBand } from "#src/contracts/types";
import {
  type ActionResult,
  type GameAction,
  TemplateGameSession,
} from "#src/game-session";
import type { EngineView, Gesture, ViewEntity } from "#src/interaction";
import { resolveLayout } from "#src/layout/registry";
import type { Slot } from "#src/layout/types";
import { PairingMechanic } from "#src/mechanics/pairing-mechanic";
import {
  drawMatchLine,
  drawPromptText,
  drawSceneBackground,
  drawSlotItem,
  type ItemVisualState,
  updateParticles,
} from "#src/render/index.js";
import { deriveStream } from "#src/rng/mulberry32";
import { shuffle } from "#src/rng/shuffle";
import type { DegradationState } from "#src/systems/degradation";
import type { Particle, RenderSystem } from "#src/systems/render-system";
import { computePairColumnsInStage } from "./pair-columns.js";
import type { GT005Content, GT005Difficulty } from "./template.js";

type LeftItem = GT005Content["pairs"][number]["left"];
type RightItem = GT005Content["pairs"][number]["right"];

/** Vùng chạm tối thiểu của ô đích khi chạm hoặc thả (giữ hành vi cũ). */
const TARGET_MIN_HIT_W = 140;
const TARGET_MIN_HIT_H = 100;

interface HitProbe {
  readonly x: number;
  readonly y: number;
  readonly hitTolerance: number;
  readonly minW: number;
  readonly minH: number;
}

/**
 * Chỉ số ô chưa ghép có tâm gần điểm chạm nhất trong số ô mà điểm đó rơi vào
 * (vùng chạm nới thêm dung sai); -1 khi không ô nào trúng.
 */
function nearestHitIndex(
  slots: readonly Slot[],
  isTaken: readonly boolean[],
  probe: HitProbe
): number {
  let best = -1;
  let bestDist = Number.POSITIVE_INFINITY;
  isTaken.forEach((taken, i) => {
    const slot = slots[i];
    if (!slot || taken) {
      return;
    }
    const halfW =
      Math.max(slot.hitW, slot.w, probe.minW) / 2 + probe.hitTolerance;
    const halfH =
      Math.max(slot.hitH, slot.h, probe.minH) / 2 + probe.hitTolerance;
    const dx = Math.abs(probe.x - slot.x);
    const dy = Math.abs(probe.y - slot.y);
    if (dx > halfW || dy > halfH) {
      return;
    }
    const dist = Math.hypot(dx, dy);
    if (dist < bestDist) {
      bestDist = dist;
      best = i;
    }
  });
  return best;
}

export class GT005Session extends TemplateGameSession<
  GT005Content,
  GT005Difficulty
> {
  override readonly usesPromptZone = true;
  degradation: DegradationState | null = null;
  private renderParticles: Particle[] = [];
  private readonly renderItemStates: Map<string, ItemVisualState> = new Map();

  displayLeft: readonly LeftItem[] = [];
  displayRight: readonly RightItem[] = [];
  private readonly mechanic = new PairingMechanic();

  setupEntities(): void {
    this.mechanic.reset();
    this.isWon = false;

    const lefts = this.content.pairs.map((p) => p.left);
    const rights = this.content.pairs.map((p) => p.right);

    if (this.difficulty.shuffle_sides === false) {
      this.displayLeft = [...lefts];
      this.displayRight = [...rights];
    } else {
      const rng = deriveStream(this.layoutSeed, "sides");
      this.displayLeft = shuffle(lefts, rng);
      this.displayRight = shuffle(rights, rng);
    }
  }

  private findPair(leftItemId: string, rightItemId: string) {
    return this.content.pairs.find(
      (p) => p.left.item_id === leftItemId && p.right.item_id === rightItemId
    );
  }

  validateAction(action: GameAction): ActionResult {
    const validPairs = this.content.pairs.map((p) => ({
      leftId: p.left.item_id,
      rightId: p.right.item_id,
    }));
    return this.mechanic.validate(action, validPairs);
  }

  onPairMatched(leftItemId: string, rightItemId: string): void {
    const pair = this.findPair(leftItemId, rightItemId);
    if (!pair) {
      return;
    }

    this.mechanic.match(leftItemId, rightItemId);
    this.recordEvent("pair_matched", {
      pair_id: pair.pair_id,
      left_item_id: leftItemId,
      right_item_id: rightItemId,
    });

    if (this.checkWinCondition()) {
      this.winSession();
    }
  }

  override checkWinCondition(): boolean {
    const validPairs = this.content.pairs.map((p) => ({
      leftId: p.left.item_id,
      rightId: p.right.item_id,
    }));
    return this.mechanic.isPairingComplete(validPairs);
  }

  protected computeSlots(ageBand: AgeBand): readonly Slot[] {
    if (this.stageRect) {
      return computePairColumnsInStage({
        stage: this.stageRect,
        ageBand,
        cssPerLogic: this.cssPerLogic,
        leftCount: this.displayLeft.length,
        rightCount: this.displayRight.length,
      });
    }
    const layoutFn = resolveLayout("two-column-matching");
    return layoutFn({
      slotCount: this.displayLeft.length,
      targetCount: this.displayRight.length,
      ageBand,
      logic: this.logicSpace,
    });
  }

  getMatchedPairs(): ReadonlyMap<string, string> {
    return this.mechanic.getMatchedPairs();
  }

  getStagedLeftId(): string | null {
    return this.mechanic.getStagedLeftId();
  }

  private toItemEntityState(
    isMatched: boolean,
    isStaged: boolean,
    rawState: ItemVisualState
  ): ViewEntity["state"] {
    if (isMatched || rawState === "correct") {
      return "correct";
    }
    if (isStaged || rawState === "selected") {
      return "selected";
    }
    if (rawState === "wrong") {
      return "incorrect";
    }
    return "idle";
  }

  private buildSourceEntities(sources: readonly Slot[]): ViewEntity[] {
    const stagedLeftId = this.mechanic.getStagedLeftId();
    const result: ViewEntity[] = [];
    for (let i = 0; i < this.displayLeft.length; i++) {
      const item = this.displayLeft[i];
      const slot = sources[i];
      if (!(item && slot)) {
        continue;
      }
      const isMatched = this.mechanic.isLeftMatched(item.item_id);
      const isStaged = item.item_id === stagedLeftId;
      result.push({
        id: item.item_id,
        slotIndex: this.slots.indexOf(slot),
        role: "source",
        state: this.toItemEntityState(
          isMatched,
          isStaged,
          this.getRenderItemState(item.item_id)
        ),
        x: slot.x,
        y: slot.y,
        w: slot.w,
        h: slot.h,
      });
    }
    return result;
  }

  private buildTargetEntities(targets: readonly Slot[]): ViewEntity[] {
    const result: ViewEntity[] = [];
    for (let i = 0; i < this.displayRight.length; i++) {
      const item = this.displayRight[i];
      const slot = targets[i];
      if (!(item && slot)) {
        continue;
      }
      const isMatched = this.mechanic.isRightMatched(item.item_id);
      result.push({
        id: item.item_id,
        slotIndex: this.slots.indexOf(slot),
        role: "target",
        state: this.toItemEntityState(
          isMatched,
          false,
          this.getRenderItemState(item.item_id)
        ),
        x: slot.x,
        y: slot.y,
        w: slot.w,
        h: slot.h,
      });
    }
    return result;
  }

  override getView(): EngineView {
    const sources = this.sourceSlots;
    const targets = this.targetSlots;

    return {
      entities: [
        ...this.buildSourceEntities(sources),
        ...this.buildTargetEntities(targets),
      ],
      activePrompt: this.content.prompt,
    };
  }

  /** Ô nguồn chưa ghép gần điểm (x, y) nhất; cột con sát nhau không nhầm ô. */
  private findLeftAt(
    x: number,
    y: number,
    sources: readonly Slot[],
    hitTolerance: number
  ): LeftItem | null {
    const idx = nearestHitIndex(
      sources,
      this.displayLeft.map((item) => this.mechanic.isLeftMatched(item.item_id)),
      { x, y, hitTolerance, minW: 0, minH: 0 }
    );
    return this.displayLeft[idx] ?? null;
  }

  private findRightAt(
    x: number,
    y: number,
    targets: readonly Slot[],
    hitTolerance: number
  ): RightItem | null {
    const idx = nearestHitIndex(
      targets,
      this.displayRight.map((item) =>
        this.mechanic.isRightMatched(item.item_id)
      ),
      { x, y, hitTolerance, minW: TARGET_MIN_HIT_W, minH: TARGET_MIN_HIT_H }
    );
    return this.displayRight[idx] ?? null;
  }

  private toDropAction(
    gesture: Extract<Gesture, { type: "drop" }>,
    sources: readonly Slot[],
    targets: readonly Slot[],
    hitTolerance: number
  ): GameAction | null {
    const draggedLeft = this.findLeftAt(
      gesture.fromX,
      gesture.fromY,
      sources,
      hitTolerance
    );
    if (!draggedLeft) {
      return null;
    }

    const targetRight = this.findRightAt(
      gesture.toX,
      gesture.toY,
      targets,
      hitTolerance
    );
    if (!targetRight) {
      return null;
    }

    return {
      type: "match_pair",
      data: {
        left_item_id: draggedLeft.item_id,
        right_item_id: targetRight.item_id,
      },
    };
  }

  private handleTapTarget(
    gesture: Extract<Gesture, { type: "tap" }>,
    targets: readonly Slot[],
    hitTolerance: number
  ): GameAction | null {
    const stagedLeftId = this.mechanic.getStagedLeftId();
    if (!stagedLeftId) {
      return null;
    }
    const item = this.findRightAt(gesture.x, gesture.y, targets, hitTolerance);
    if (!item) {
      return null;
    }
    return {
      type: "match_pair",
      data: {
        left_item_id: stagedLeftId,
        right_item_id: item.item_id,
      },
    };
  }

  private handleTapSource(
    gesture: Extract<Gesture, { type: "tap" }>,
    sources: readonly Slot[],
    hitTolerance: number
  ): void {
    const item = this.findLeftAt(gesture.x, gesture.y, sources, hitTolerance);
    if (!item) {
      return;
    }
    this.mechanic.stageLeft(
      this.mechanic.getStagedLeftId() === item.item_id ? null : item.item_id
    );
  }

  private toTapAction(
    gesture: Extract<Gesture, { type: "tap" }>,
    sources: readonly Slot[],
    targets: readonly Slot[],
    hitTolerance: number
  ): GameAction | null {
    const targetAction = this.handleTapTarget(gesture, targets, hitTolerance);
    if (targetAction) {
      return targetAction;
    }
    this.handleTapSource(gesture, sources, hitTolerance);
    return null;
  }

  override toAction(gesture: Gesture): GameAction | null {
    const hitTolerance = 24;
    const sources = this.sourceSlots;
    const targets = this.targetSlots;

    if (gesture.type === "drop") {
      return this.toDropAction(gesture, sources, targets, hitTolerance);
    }
    if (gesture.type === "tap") {
      return this.toTapAction(gesture, sources, targets, hitTolerance);
    }
    return null;
  }

  override getHintTargetIndex(): number | null {
    const matched = this.getMatchedPairs();
    const staged = this.getStagedLeftId();
    if (staged) {
      const pair = this.content.pairs.find((p) => p.left.item_id === staged);
      const rightIdx = this.displayRight.findIndex(
        (r) => r.item_id === pair?.right.item_id
      );
      return rightIdx >= 0 ? this.displayLeft.length + rightIdx : null;
    }
    const leftIdx = this.displayLeft.findIndex((l) => !matched.has(l.item_id));
    return leftIdx >= 0 ? leftIdx : null;
  }

  override commit(action: GameAction): void {
    if (
      action.type === "match_pair" &&
      action.data &&
      typeof action.data === "object"
    ) {
      const data = action.data as {
        left_item_id?: string;
        right_item_id?: string;
      };
      if (data.left_item_id && data.right_item_id) {
        this.onPairMatched(data.left_item_id, data.right_item_id);
        this.mechanic.stageLeft(null);
      }
    }
  }

  setRenderItemState(itemId: string, state: ItemVisualState): void {
    this.renderItemStates.set(itemId, state);
  }

  getRenderItemState(itemId: string): ItemVisualState {
    return this.renderItemStates.get(itemId) ?? "idle";
  }

  render(
    ctx: CanvasRenderingContext2D,
    rs: RenderSystem,
    _timeMs: number
  ): void {
    drawSceneBackground(ctx, rs, this.themeId);
    if (!this.stageRect) {
      drawPromptText(ctx, rs, this.content.prompt);
    }
    const sources = this.sourceSlots;
    const targets = this.targetSlots;
    const matched = this.mechanic.getMatchedPairs();
    const stagedLeftId = this.mechanic.getStagedLeftId();

    this.displayLeft.forEach((item, i) => {
      const slot = sources[i];
      if (!slot) {
        return;
      }
      const isMatched = this.mechanic.isLeftMatched(item.item_id);
      let state = this.getRenderItemState(item.item_id);
      if (isMatched) {
        state = "correct";
      } else if (item.item_id === stagedLeftId) {
        state = "selected";
      }
      drawSlotItem(ctx, rs, slot, {
        id: item.item_id,
        asset: item.asset,
        state,
      });
    });

    this.displayRight.forEach((item, i) => {
      const slot = targets[i];
      if (!slot) {
        return;
      }
      const state = this.mechanic.isRightMatched(item.item_id)
        ? "correct"
        : this.getRenderItemState(item.item_id);
      drawSlotItem(ctx, rs, slot, {
        id: item.item_id,
        asset: item.asset,
        state,
      });
    });

    // Nối cặp đã ghép — trẻ thấy việc mình vừa làm còn nguyên trên màn.
    for (const [leftId, rightId] of matched) {
      const li = this.displayLeft.findIndex((x) => x.item_id === leftId);
      const ri = this.displayRight.findIndex((x) => x.item_id === rightId);
      const ls = sources[li];
      const rslot = targets[ri];
      if (ls && rslot) {
        drawMatchLine(ctx, ls.x, ls.y, rslot.x, rslot.y);
      }
    }
    this.drawRenderFeedback(rs, ctx);
  }

  private drawRenderFeedback(
    rs: RenderSystem,
    ctx: CanvasRenderingContext2D
  ): void {
    if (this.degradation?.particles_enabled === false) {
      return;
    }
    this.renderParticles = updateParticles(this.renderParticles);
    rs.drawParticles(ctx, this.renderParticles);
  }
}

export default GT005Session;
