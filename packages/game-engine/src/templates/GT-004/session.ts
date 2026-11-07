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
import { TAP_TOLERANCE_PX } from "#src/layout/hit-test";
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
  drawSceneBackground,
  drawSlotItem,
  drawWoodenTokenDock,
  type ItemVisualState,
} from "#src/render/index.js";
import { deriveStream } from "#src/rng/mulberry32";
import { shuffle } from "#src/rng/shuffle";
import type { DegradationState } from "#src/systems/degradation";
import { designTokens } from "#src/systems/designTokens";
import type { RenderSystem } from "#src/systems/render-system";
import type { GT004Content, GT004Difficulty } from "./template.js";

type SortItem = GT004Content["items"][number];

/** Rổ trên sân khấu: rộng nhất 180 px, cao nhất 140 px — cùng cỡ `multi-bucket-bottom`. */
const BUCKET_MAX_W_PX = 180;
const BUCKET_MAX_H_PX = 140;

/** Vùng chạm tối thiểu của rổ ở bố cục cũ — rộng hơn thân rổ vẽ. */
const LEGACY_BUCKET_HIT: MinHitSize = { w: 140, h: 100 };

/** Nhịp hổ phách tạm thời khi phân loại nhầm rổ — tự tắt sau 260ms. */
const WRONG_FEEDBACK_MS = 260;

export class GT004Session extends TemplateGameSession<
  GT004Content,
  GT004Difficulty
> {
  degradation: DegradationState | null = null;

  displayItems: readonly SortItem[] = [];
  private placementTargets: readonly {
    id: string;
    targetId: string;
    isCorrect: boolean;
  }[] = [];
  private readonly mechanic = new PlacementMechanic();
  private readonly transientStateMs: Map<string, number> = new Map();

  /** Vật nằm trong khay, rổ đứng trên sân khấu (`BR-PSZ-01`). */
  override readonly needsTray = true;

  /** Số vật nguồn trong khay của vòng — shell đo chiều cao khay (`BR-PSZ-13`). */
  override get trayItemCount(): number {
    return this.content.items.length;
  }
  override readonly usesPromptZone = true;

  setupEntities(): void {
    this.mechanic.reset();
    this.renderItemStates.clear();
    this.transientStateMs.clear();
    this.isWon = false;
    this.placementTargets = this.content.items.map((i) => ({
      id: i.item_id,
      targetId: i.correct_group_id,
      isCorrect: true,
    }));
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
    if (
      action.type === "sort_item" &&
      action.data &&
      typeof action.data === "object"
    ) {
      const itemId = (action.data as { item_id?: string }).item_id;
      if (itemId && this.mechanic.getPlacements().has(itemId)) {
        return ACTION_IGNORED;
      }
    }
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
    if (!item || this.mechanic.getPlacements().has(itemId)) {
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
      this.renderItemStates.set(itemId, "correct");
      this.transientStateMs.delete(itemId);
      if (this.checkWinCondition()) {
        this.winSession();
      }
    } else {
      this.renderItemStates.set(itemId, "wrong");
      this.transientStateMs.set(itemId, WRONG_FEEDBACK_MS);
    }
  }

  update(deltaMs: number): void {
    if (this.transientStateMs.size === 0) {
      return;
    }
    for (const [itemId, remaining] of this.transientStateMs) {
      const next = remaining - deltaMs;
      if (next <= 0) {
        this.transientStateMs.delete(itemId);
        if (this.renderItemStates.get(itemId) === "wrong") {
          this.renderItemStates.delete(itemId);
        }
      } else {
        this.transientStateMs.set(itemId, next);
      }
    }
  }

  override checkWinCondition(): boolean {
    return this.mechanic.isPlacementComplete(this.placementTargets);
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

  /** Vật chưa phân loại đúng chỗ chạm, gần tâm nhất — khay hẹp làm vùng chạm kề nhau chồng lên. */
  private findHitItem(
    x: number,
    y: number,
    sources: readonly Slot[],
    hitTolerance: number
  ): SortItem | null {
    const placements = this.mechanic.getPlacements();
    const looseItems: SortItem[] = [];
    const looseSlots: Slot[] = [];
    for (let i = 0; i < this.displayItems.length; i++) {
      const item = this.displayItems[i];
      const slot = sources[i];
      if (item && slot && !placements.has(item.item_id)) {
        looseItems.push(item);
        looseSlots.push(slot);
      }
    }
    const index = findNearestHitSlot(looseSlots, x, y, hitTolerance);
    return looseItems[index] ?? null;
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
        ...resolveAssetLabels(item.asset),
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
        hitShape: "square",
        label: group.label,
        spokenLabel: group.label,
        glyph: group.label_emoji,
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
    const sources = this.sourceSlots;
    const targets = this.targetSlots;

    if (gesture.type === "drop") {
      return this.toDropAction(gesture, sources, targets, TAP_TOLERANCE_PX);
    }
    if (gesture.type === "tap") {
      return this.toTapAction(gesture, sources, targets, TAP_TOLERANCE_PX);
    }
    return null;
  }

  override getHintTargetIndex(): number | null {
    const placed = this.mechanic.getPlacements();
    const idx = this.displayItems.findIndex((it) => !placed.has(it.item_id));
    return idx >= 0 ? idx : null;
  }

  /** Bước đúng là kéo vật chưa phân loại vào rổ nhóm đúng của nó. */
  override getHintDestinationIndex(): number | null {
    const itemIdx = this.getHintTargetIndex();
    const item = itemIdx === null ? undefined : this.displayItems[itemIdx];
    if (!item) {
      return null;
    }
    const groupIdx = this.content.groups.findIndex(
      (g) => g.group_id === item.correct_group_id
    );
    const slot = this.targetSlots[groupIdx];
    const index = slot ? this.slots.indexOf(slot) : -1;
    return index >= 0 ? index : null;
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

  getPlacements(): ReadonlyMap<string, string> {
    return this.mechanic.getPlacements();
  }

  getStagedItemId(): string | null {
    return this.mechanic.getStagedItemId();
  }

  render(
    ctx: CanvasRenderingContext2D,
    rs: RenderSystem,
    _timeMs: number
  ): void {
    drawSceneBackground(ctx, rs, this.themeId);
    const zones = pickTrayZones(this.stageRect, this.trayRect);
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

      const placedItems = this.displayItems.filter(
        (item) => placements.get(item.item_id) === group.group_id
      );

      if (placedItems.length === 0) {
        drawGlyphInSlot(ctx, group.label_emoji, {
          ...slot,
          y: slot.y + slot.h * 0.14,
          w: slot.w * 0.72,
          h: slot.h * 0.72,
        });
      } else {
        const badgeSlot: Slot = {
          ...slot,
          y: slot.y + slot.h * 0.18,
        };
        drawGlyphInSlot(ctx, group.label_emoji, badgeSlot);

        const count = placedItems.length;
        const innerW = slot.w * 0.72;
        const chipR = Math.min(20, Math.max(12, innerW / (count * 2.2)));
        const spacing = Math.min(innerW / count, chipR * 2.4);
        const startX = slot.x - ((count - 1) * spacing) / 2;
        const chipY = slot.y - slot.h * 0.12;

        for (let j = 0; j < count; j++) {
          const pItem = placedItems[j];
          if (!pItem) {
            continue;
          }
          const chipX = startX + j * spacing;
          const chipSlot: Slot = {
            ...slot,
            role: "target",
            x: chipX,
            y: chipY,
            w: chipR * 2,
            h: chipR * 2,
            hitW: chipR * 2,
            hitH: chipR * 2,
          };
          drawSlotItem(ctx, rs, chipSlot, {
            id: pItem.item_id,
            asset: pItem.asset,
            state: "correct",
          });
        }
      }
    });

    const stagedId = this.mechanic.getStagedItemId();
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
      const rawState = this.getRenderItemState(item.item_id);
      drawSlotItem(ctx, rs, slot, {
        id: item.item_id,
        asset: item.asset,
        state:
          stagedId === item.item_id && rawState === "idle"
            ? "selected"
            : rawState,
      });
    });
  }
}
