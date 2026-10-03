import type { AgeBand } from "#src/contracts/types";
import {
  type ActionResult,
  type GameAction,
  TemplateGameSession,
} from "#src/game-session";
import type { EngineView, Gesture, ViewEntity } from "#src/interaction";
import { resolveTouchFloor } from "#src/layout/constants";
import { resolveLayout } from "#src/layout/registry";
import { computeStageCellSlots } from "#src/layout/stage-targets";
import {
  computeTraySourceSlots,
  findNearestHitSlot,
  type MinHitSize,
  pickTrayZones,
} from "#src/layout/tray-layout";
import type { Slot } from "#src/layout/types";
import { PlacementMechanic } from "#src/mechanics/placement-mechanic";
import {
  drawBasketSlot,
  drawEmptyTargetSlot,
  drawGlyphInSlot,
  drawPromptText,
  drawSceneBackground,
  drawSlotItem,
  drawWoodenTokenDock,
  type ItemVisualState,
  updateParticles,
} from "#src/render/index.js";
import { deriveStream } from "#src/rng/mulberry32";
import { shuffle } from "#src/rng/shuffle";
import type { DegradationState } from "#src/systems/degradation";
import { designTokens } from "#src/systems/designTokens";
import type { Particle, RenderSystem } from "#src/systems/render-system";
import type { GT004Content, GT004Difficulty } from "./template.js";

type SortItem = GT004Content["items"][number];

/** Rổ trên sân khấu: rộng nhất 180 px, cao nhất 140 px — cùng cỡ `multi-bucket-bottom`. */
const BUCKET_MAX_W_PX = 180;
const BUCKET_MAX_H_PX = 140;

/** Vùng chạm tối thiểu của rổ ở bố cục cũ — rộng hơn thân rổ vẽ. */
const LEGACY_BUCKET_HIT: MinHitSize = { w: 140, h: 100 };

export class GT004Session extends TemplateGameSession<
  GT004Content,
  GT004Difficulty
> {
  degradation: DegradationState | null = null;
  private renderParticles: Particle[] = [];
  private readonly renderItemStates: Map<string, ItemVisualState> = new Map();

  displayItems: readonly SortItem[] = [];
  private readonly mechanic = new PlacementMechanic();

  /** Vật nằm trong khay, rổ đứng trên sân khấu (`BR-PSZ-01`). */
  override readonly needsTray = true;

  /** Số vật nguồn trong khay của vòng — shell đo chiều cao khay (`BR-PSZ-13`). */
  override get trayItemCount(): number {
    return this.content.items.length;
  }
  override readonly usesPromptZone = true;

  setupEntities(): void {
    this.mechanic.reset();
    this.isWon = false;
    if (this.difficulty.shuffle_items === false) {
      this.displayItems = [...this.content.items];
    } else {
      const rng = deriveStream(this.layoutSeed, "items");
      this.displayItems = shuffle(this.content.items, rng);
    }
  }

  private findItem(itemId: string) {
    return this.content.items.find((i) => i.item_id === itemId);
  }

  validateAction(action: GameAction): ActionResult {
    const items = this.content.items.map((i) => ({
      id: i.item_id,
      targetId: i.correct_group_id,
      isCorrect: true,
    }));
    return this.mechanic.validate(action, items, (gId) =>
      this.content.groups.some((g) => g.group_id === gId)
    );
  }

  onItemSorted(itemId: string, groupId: string): void {
    const item = this.findItem(itemId);
    if (!item) {
      return;
    }

    const isCorrect = item.correct_group_id === groupId;
    this.recordEvent("item_sorted", {
      item_id: itemId,
      group_id: groupId,
      is_correct: isCorrect,
    });

    if (isCorrect) {
      this.mechanic.place(itemId, groupId);
      if (this.checkWinCondition()) {
        this.winSession();
      }
    }
  }

  override checkWinCondition(): boolean {
    const items = this.content.items.map((i) => ({
      id: i.item_id,
      targetId: i.correct_group_id,
      isCorrect: true,
    }));
    return this.mechanic.isPlacementComplete(items);
  }

  protected computeSlots(ageBand: AgeBand): readonly Slot[] {
    const zones = pickTrayZones(this.stageRect, this.trayRect);
    if (zones) {
      const touchFloor = resolveTouchFloor(ageBand, this.cssPerLogic);
      const sources = computeTraySourceSlots(
        this.displayItems.length,
        zones.tray,
        touchFloor
      );
      const buckets = computeStageCellSlots({
        count: this.content.groups.length,
        stage: zones.stage,
        touchFloor,
        maxCell: { w: BUCKET_MAX_W_PX, h: BUCKET_MAX_H_PX },
        role: "target",
        firstIndex: sources.length,
      });
      return [...sources, ...buckets];
    }
    const layoutFn = resolveLayout("multi-bucket-bottom");
    return layoutFn({
      slotCount: this.displayItems.length,
      targetCount: this.content.groups.length,
      ageBand,
      logic: this.logicSpace,
    });
  }

  /** Rổ đúng chỗ chạm: khung mới theo thân rổ, bố cục cũ nới rộng hơn thân rổ. */
  private findHitGroup(
    x: number,
    y: number,
    targets: readonly Slot[],
    hitTolerance: number
  ): GT004Content["groups"][number] | null {
    const isInFrame = pickTrayZones(this.stageRect, this.trayRect) !== null;
    const index = findNearestHitSlot(
      targets.slice(0, this.content.groups.length),
      x,
      y,
      hitTolerance,
      isInFrame ? undefined : LEGACY_BUCKET_HIT
    );
    return this.content.groups[index] ?? null;
  }

  /** Vật đúng chỗ chạm, gần tâm nhất — khay hẹp làm vùng chạm kề nhau chồng lên. */
  private findHitItem(
    x: number,
    y: number,
    sources: readonly Slot[],
    hitTolerance: number
  ): SortItem | null {
    const index = findNearestHitSlot(
      sources.slice(0, this.displayItems.length),
      x,
      y,
      hitTolerance
    );
    return this.displayItems[index] ?? null;
  }

  private toItemEntityState(
    stagedItemId: string | null,
    itemId: string,
    rawState: ItemVisualState
  ): ViewEntity["state"] {
    if (stagedItemId === itemId || rawState === "selected") {
      return "selected";
    }
    if (rawState === "correct") {
      return "correct";
    }
    if (rawState === "wrong") {
      return "incorrect";
    }
    return "idle";
  }

  private buildSourceEntities(sources: readonly Slot[]): ViewEntity[] {
    const stagedId = this.mechanic.getStagedItemId();
    const result: ViewEntity[] = [];
    for (let i = 0; i < this.displayItems.length; i++) {
      const item = this.displayItems[i];
      const slot = sources[i];
      if (!(item && slot)) {
        continue;
      }
      result.push({
        id: item.item_id,
        slotIndex: this.slots.indexOf(slot),
        role: "source",
        state: this.toItemEntityState(
          stagedId,
          item.item_id,
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
    for (let i = 0; i < this.content.groups.length; i++) {
      const group = this.content.groups[i];
      const slot = targets[i];
      if (!(group && slot)) {
        continue;
      }
      result.push({
        id: group.group_id,
        slotIndex: this.slots.indexOf(slot),
        role: "target",
        state: "idle",
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

  private toDropAction(
    gesture: Extract<Gesture, { type: "drop" }>,
    sources: readonly Slot[],
    targets: readonly Slot[],
    hitTolerance: number
  ): GameAction | null {
    const draggedItem = this.findHitItem(
      gesture.fromX,
      gesture.fromY,
      sources,
      hitTolerance
    );
    if (!draggedItem) {
      return null;
    }

    const group = this.findHitGroup(
      gesture.toX,
      gesture.toY,
      targets,
      hitTolerance
    );
    if (!group) {
      return null;
    }
    return {
      type: "sort_item",
      data: { item_id: draggedItem.item_id, group_id: group.group_id },
    };
  }

  private handleTapTarget(
    gesture: Extract<Gesture, { type: "tap" }>,
    targets: readonly Slot[],
    hitTolerance: number
  ): GameAction | null {
    const stagedId = this.mechanic.getStagedItemId();
    if (!stagedId) {
      return null;
    }

    const group = this.findHitGroup(
      gesture.x,
      gesture.y,
      targets,
      hitTolerance
    );
    if (!group) {
      return null;
    }
    return {
      type: "sort_item",
      data: { item_id: stagedId, group_id: group.group_id },
    };
  }

  private handleTapSource(
    gesture: Extract<Gesture, { type: "tap" }>,
    sources: readonly Slot[],
    hitTolerance: number
  ): void {
    const item = this.findHitItem(gesture.x, gesture.y, sources, hitTolerance);
    if (!item) {
      return;
    }
    this.mechanic.stageItem(
      this.mechanic.getStagedItemId() === item.item_id ? null : item.item_id
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
    const placed = this.mechanic.getPlacements();
    const idx = this.displayItems.findIndex((it) => !placed.has(it.item_id));
    return idx >= 0 ? idx : null;
  }

  override commit(action: GameAction): void {
    if (
      action.type === "sort_item" &&
      action.data &&
      typeof action.data === "object"
    ) {
      const data = action.data as { item_id?: string; group_id?: string };
      if (data.item_id && data.group_id) {
        this.onItemSorted(data.item_id, data.group_id);
        this.mechanic.stageItem(null);
      }
    }
  }

  setRenderItemState(itemId: string, state: ItemVisualState): void {
    this.renderItemStates.set(itemId, state);
  }

  getPlacements(): ReadonlyMap<string, string> {
    return this.mechanic.getPlacements();
  }

  getStagedItemId(): string | null {
    return this.mechanic.getStagedItemId();
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
    const zones = pickTrayZones(this.stageRect, this.trayRect);
    if (!zones) {
      drawPromptText(ctx, rs, this.content.prompt);
    }
    if (zones) {
      // Lời dẫn do shell vẽ ở vùng lời dẫn; engine chỉ vẽ trong sân khấu và khay.
      drawWoodenTokenDock(ctx, rs, zones.tray);
    }
    const targets = this.targetSlots;
    const sources = this.sourceSlots;
    const placements = this.mechanic.getPlacements();

    this.content.groups.forEach((group, i) => {
      const slot = targets[i];
      if (!slot) {
        return;
      }
      const rimColor =
        i === 0
          ? designTokens.colors.montessori.coral
          : designTokens.colors.montessori.amber;
      drawBasketSlot(ctx, slot, group.label, rimColor);
      drawGlyphInSlot(ctx, group.label_emoji, slot);
    });

    this.displayItems.forEach((item, i) => {
      const slot = sources[i];
      if (!slot) {
        return;
      }
      const placedIn = placements.get(item.item_id);
      if (placedIn) {
        drawEmptyTargetSlot(ctx, slot);
        return;
      }
      drawSlotItem(ctx, rs, slot, {
        id: item.item_id,
        asset: item.asset,
        state: this.getRenderItemState(item.item_id),
      });
    });
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

export default GT004Session;
