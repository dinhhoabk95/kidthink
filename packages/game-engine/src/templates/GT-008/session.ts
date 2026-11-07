import { formatSpokenLabel } from "@mindkid/shared/preschool-terminology";
import type { AgeBand } from "#src/contracts/types";
import {
  ACTION_CORRECT,
  ACTION_IGNORED,
  ACTION_RETRY,
  type ActionResult,
  type GameAction,
  type GameActionValue,
  TemplateGameSession,
} from "#src/game-session";
import type { EngineView, Gesture, ViewEntity } from "#src/interaction";
import { resolveAssetLabels } from "#src/labels/spoken-keyword";
import { resolveTouchFloor } from "#src/layout/constants";
import { TAP_TOLERANCE_PX } from "#src/layout/hit-test";
import { resolveLayout } from "#src/layout/registry";
import { trayBoxWithin } from "#src/layout/slot-fit.js";
import { computeStageCellSlots } from "#src/layout/stage-targets";
import type { ZoneRect } from "#src/layout/stage-zones";
import {
  computeTraySourceSlots,
  findNearestHitSlot,
  pickTrayZones,
} from "#src/layout/tray-layout";
import type { Slot } from "#src/layout/types";
import {
  boxFromSlots,
  drawEmptyTargetSlot,
  drawGhostAssetInSlot,
  drawSceneBackground,
  drawShapeTray,
  drawSlotItem,
  drawWoodenTokenDock,
  spawnParticlesAtSlot,
  updateParticles,
} from "#src/render/index.js";
import type { DegradationState } from "#src/systems/degradation";
import type { Particle, RenderSystem } from "#src/systems/render-system";
import { WRONG_FLASH_MS, WrongFlash } from "#src/systems/wrong-flash";
import type { GT008Content, GT008Difficulty } from "./template.js";

/** Cạnh ô đích lớn nhất trên sân khấu — cùng cỡ ô của `horizontal-slot-track`. */
const TARGET_CELL_MAX_PX = 96;

/**
 * Khay ô đích (`drawShapeTray`) vẽ rộng hơn các ô: lề 22 ngang, 16 dọc, cộng gờ
 * dưới 4 px. `computeStageCellSlots` đã chừa sẵn 16 px quanh khối ô, nên chỉ
 * bù phần còn thiếu — chừa thừa làm điện thoại ngang mất cả cột ô.
 */
const SHAPE_TRAY_INSET_X_PX = 6;
const SHAPE_TRAY_INSET_Y_PX = 4;

/** Khoảng chạm thêm quanh vùng chạm của slot (`GT-008.md` §6). */
const HIT_TOLERANCE_PX = TAP_TOLERANCE_PX;

function insetRect(rect: ZoneRect, insetX: number, insetY: number): ZoneRect {
  return {
    x: rect.x + insetX,
    y: rect.y + insetY,
    w: Math.max(0, rect.w - 2 * insetX),
    h: Math.max(0, rect.h - 2 * insetY),
  };
}

function extractSlotData(
  data: GameActionValue
): { item_id: string; slot_id: string } | undefined {
  if (
    typeof data === "object" &&
    data !== null &&
    "item_id" in data &&
    "slot_id" in data
  ) {
    const itemId = Reflect.get(data, "item_id");
    const slotId = Reflect.get(data, "slot_id");
    if (typeof itemId === "string" && typeof slotId === "string") {
      return { item_id: itemId, slot_id: slotId };
    }
  }
  return undefined;
}

export class GT008Session extends TemplateGameSession<
  GT008Content,
  GT008Difficulty
> {
  degradation: DegradationState | null = null;
  private renderParticles: Particle[] = [];
  private stagedItemId: string | null = null;
  private wrongItemId: string | null = null;
  private wrongSlotId: string | null = null;
  private readonly wrongFlash = new WrongFlash();
  private lastFrameMs = 0;

  placedSlots: Map<string, string> = new Map(); // slot_id -> item_id
  private itemById = new Map<string, GT008Content["items"][number]>();
  private slotById = new Map<string, GT008Content["slots"][number]>();

  /** Vật nằm trong khay, dãy ô đích đứng trên sân khấu (`BR-PSZ-01`). */
  override readonly needsTray = true;

  /** Số vật nguồn trong khay của vòng — shell đo chiều cao khay (`BR-PSZ-13`). */
  override get trayItemCount(): number {
    return this.content.items.length;
  }

  /** Không nhãn chữ trên khay: tên vật chỉ đọc thành tiếng (`BR-E008-05`). */
  override get trayHasLabels(): boolean {
    return false;
  }
  override readonly usesPromptZone = true;

  setupEntities(): void {
    this.placedSlots.clear();
    this.itemById = new Map(this.content.items.map((it) => [it.item_id, it]));
    this.slotById = new Map(this.content.slots.map((s) => [s.slot_id, s]));
    this.stagedItemId = null;
    this.wrongItemId = null;
    this.wrongSlotId = null;
    this.wrongFlash.clear();
    this.lastFrameMs = 0;
    this.isWon = false;
    this.renderParticles = [];
  }

  private resolveItemById(): ReadonlyMap<
    string,
    GT008Content["items"][number]
  > {
    if (this.itemById.size === this.content.items.length) {
      return this.itemById;
    }
    return new Map(this.content.items.map((it) => [it.item_id, it]));
  }

  private resolveSlotById(): ReadonlyMap<
    string,
    GT008Content["slots"][number]
  > {
    if (this.slotById.size === this.content.slots.length) {
      return this.slotById;
    }
    return new Map(this.content.slots.map((s) => [s.slot_id, s]));
  }

  update(deltaMs: number): void {
    this.lastFrameMs += deltaMs;
    if (this.wrongItemId && this.wrongFlash.hasExpired(this.lastFrameMs)) {
      this.setRenderItemState(this.wrongItemId, "idle");
      this.wrongItemId = null;
      this.wrongSlotId = null;
    }
  }

  getStagedItemId(): string | null {
    return this.stagedItemId;
  }

  validateAction(action: GameAction): ActionResult {
    if (action.type === "place_item" || action.type === "drop_to_slot") {
      const data = extractSlotData(action.data);
      if (!data) {
        return ACTION_RETRY;
      }
      const slot = this.resolveSlotById().get(data.slot_id);

      if (!slot) {
        return ACTION_RETRY;
      }

      if (slot.expected_item_id === data.item_id) {
        return ACTION_CORRECT;
      }

      return ACTION_RETRY;
    }

    return ACTION_IGNORED;
  }

  onItemPlaced(itemId: string, slotId: string): void {
    const slotDef = this.resolveSlotById().get(slotId);
    if (!slotDef) {
      return;
    }

    const isCorrect = slotDef.expected_item_id === itemId;

    this.recordEvent("item_placed", {
      item_id: itemId,
      slot_id: slotId,
      is_correct: isCorrect,
    });

    if (isCorrect) {
      this.placedSlots.set(slotId, itemId);
      const slotDefIdx = this.content.slots.findIndex(
        (s) => s.slot_id === slotId
      );
      const targets = this.targetSlots;
      const targetSlot = targets[slotDefIdx];
      if (targetSlot) {
        this.renderParticles.push(...spawnParticlesAtSlot(targetSlot, 12));
      }
      if (this.checkWinCondition()) {
        this.winSession();
      }
    }
  }

  override checkWinCondition(): boolean {
    if (this.content.slots.length === 0) {
      return true;
    }

    return this.content.slots.every((s) => {
      const placed = this.placedSlots.get(s.slot_id);
      return placed === s.expected_item_id;
    });
  }

  protected computeSlots(ageBand: AgeBand): readonly Slot[] {
    const zones = pickTrayZones(this.stageRect, this.trayRect);
    if (zones) {
      const touchFloor = resolveTouchFloor(ageBand, this.cssPerLogic);
      const targets = computeStageCellSlots({
        count: this.content.slots.length,
        stage: insetRect(
          zones.stage,
          SHAPE_TRAY_INSET_X_PX,
          SHAPE_TRAY_INSET_Y_PX
        ),
        touchFloor,
        maxCell: { w: TARGET_CELL_MAX_PX, h: TARGET_CELL_MAX_PX },
        role: "target",
        hasLabels: false,
      });
      const sources = computeTraySourceSlots(
        this.content.items.length,
        zones.tray,
        touchFloor,
        targets.length,
        this.trayHasLabels
      );
      return [...targets, ...sources];
    }
    const layoutFn = resolveLayout("horizontal-slot-track");
    return layoutFn({
      slotCount: this.content.items.length,
      targetCount: this.content.slots.length,
      ageBand,
      logic: this.logicSpace,
    });
  }

  private findDraggedItem(
    x: number,
    y: number,
    sources: readonly Slot[],
    hitTolerance: number
  ): GT008Content["items"][number] | null {
    const placedItemIds = new Set(this.placedSlots.values());
    const open = this.content.items.flatMap((item, i) => {
      const slot = sources[i];
      return slot && !placedItemIds.has(item.item_id) ? [{ item, slot }] : [];
    });
    const hit = findNearestHitSlot(
      open.map((entry) => entry.slot),
      x,
      y,
      hitTolerance
    );
    return open[hit]?.item ?? null;
  }

  private findTargetSlot(
    x: number,
    y: number,
    targets: readonly Slot[],
    hitTolerance: number
  ): GT008Content["slots"][number] | null {
    const open = this.content.slots.flatMap((slotDef, i) => {
      const slot = targets[i];
      return slot && !this.placedSlots.has(slotDef.slot_id)
        ? [{ slotDef, slot }]
        : [];
    });
    const hit = findNearestHitSlot(
      open.map((entry) => entry.slot),
      x,
      y,
      hitTolerance
    );
    return open[hit]?.slotDef ?? null;
  }

  private toDropAction(
    gesture: Extract<Gesture, { type: "drop" }>,
    sources: readonly Slot[],
    targets: readonly Slot[],
    hitTolerance: number
  ): GameAction | null {
    const item = this.findDraggedItem(
      gesture.fromX,
      gesture.fromY,
      sources,
      hitTolerance
    );
    if (!item) {
      return null;
    }
    const target = this.findTargetSlot(
      gesture.toX,
      gesture.toY,
      targets,
      hitTolerance
    );
    if (!target) {
      return null;
    }
    return {
      type: "place_item",
      data: { item_id: item.item_id, slot_id: target.slot_id },
    };
  }

  private handleTapTarget(
    target: GT008Content["slots"][number]
  ): GameAction | null {
    if (!this.stagedItemId) {
      return null;
    }
    return {
      type: "place_item",
      data: { item_id: this.stagedItemId, slot_id: target.slot_id },
    };
  }

  private handleTapSource(item: GT008Content["items"][number]): null {
    if (this.stagedItemId === item.item_id) {
      this.stagedItemId = null;
    } else {
      this.stagedItemId = item.item_id;
    }
    return null;
  }

  private toTapAction(
    gesture: Extract<Gesture, { type: "tap" }>,
    sources: readonly Slot[],
    targets: readonly Slot[],
    hitTolerance: number
  ): GameAction | null {
    const target = this.findTargetSlot(
      gesture.x,
      gesture.y,
      targets,
      hitTolerance
    );
    if (target && this.stagedItemId) {
      return this.handleTapTarget(target);
    }
    const item = this.findDraggedItem(
      gesture.x,
      gesture.y,
      sources,
      hitTolerance
    );
    if (item) {
      return this.handleTapSource(item);
    }
    this.stagedItemId = null;
    return null;
  }

  override toAction(gesture: Gesture): GameAction | null {
    const hitTolerance = HIT_TOLERANCE_PX;
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
    const unplaced = this.content.slots.find(
      (s) => !this.placedSlots.has(s.slot_id)
    );
    if (!unplaced) {
      return null;
    }
    const idx = this.content.items.findIndex(
      (it) => it.item_id === unplaced.expected_item_id
    );
    const sourceSlot = this.sourceSlots[idx];
    return sourceSlot ? this.slots.indexOf(sourceSlot) : null;
  }

  /** Bước đúng là kéo vật mong đợi vào ô trống đầu tiên. */
  override getHintDestinationIndex(): number | null {
    const slotIdx = this.content.slots.findIndex(
      (s) => !this.placedSlots.has(s.slot_id)
    );
    const slot = this.targetSlots[slotIdx];
    const index = slotIdx >= 0 && slot ? this.slots.indexOf(slot) : -1;
    return index >= 0 ? index : null;
  }

  override commit(action: GameAction): void {
    const result = this.validateAction(action);
    const data = extractSlotData(action.data);

    if (result.valid && data) {
      this.onItemPlaced(data.item_id, data.slot_id);
      this.stagedItemId = null;
      this.wrongItemId = null;
      return;
    }

    if (data) {
      this.recordEvent("item_placed", {
        item_id: data.item_id,
        slot_id: data.slot_id,
        is_correct: false,
      });
      this.wrongItemId = data.item_id;
      this.wrongSlotId = data.slot_id;
      this.wrongFlash.trigger(this.lastFrameMs);
      this.setRenderItemState(data.item_id, "wrong");
    }
  }

  override getView(): EngineView {
    const targets = this.targetSlots;
    const sources = this.sourceSlots;
    const itemById = this.resolveItemById();
    const placedItemIds = new Set(this.placedSlots.values());
    const entities: ViewEntity[] = [];

    this.content.slots.forEach((defSlot, i) => {
      const slot = targets[i];
      if (!slot) {
        return;
      }
      const placedId = this.placedSlots.get(defSlot.slot_id);
      const isPlaced = placedId !== undefined;
      const placedItem = placedId ? itemById.get(placedId) : undefined;
      const placedLabels = placedItem
        ? resolveAssetLabels(placedItem.asset)
        : undefined;
      const spokenLabel = defSlot.label
        ? formatSpokenLabel(defSlot.label)
        : (placedLabels?.spokenLabel ?? `Ô đích ${i + 1}`);
      entities.push({
        id: defSlot.slot_id,
        slotIndex: this.slots.indexOf(slot),
        role: "target",
        state: isPlaced ? "correct" : "idle",
        x: slot.x,
        y: slot.y,
        w: slot.w,
        h: slot.h,
        glyph: placedLabels?.glyph,
        spokenLabel,
        spokenAudioPath: placedLabels?.spokenAudioPath,
      });
    });

    this.content.items.forEach((item, i) => {
      const slot = sources[i];
      if (!slot) {
        return;
      }
      const isPlaced = placedItemIds.has(item.item_id);
      const isStaged = this.stagedItemId === item.item_id;
      const assetLabels = resolveAssetLabels(item.asset);
      const spokenLabel = item.label
        ? formatSpokenLabel(item.label)
        : assetLabels.spokenLabel;
      entities.push({
        id: item.item_id,
        slotIndex: this.slots.indexOf(slot),
        role: "source",
        state: this.toSourceEntityState(item.item_id, isPlaced, isStaged),
        x: slot.x,
        y: slot.y,
        w: slot.w,
        h: slot.h,
        glyph: assetLabels.glyph,
        spokenLabel,
        spokenAudioPath: assetLabels.spokenAudioPath,
      });
    });

    return {
      activePrompt: this.content.prompt,
      entities,
    };
  }

  private toSourceEntityState(
    itemId: string,
    isPlaced: boolean,
    isStaged: boolean
  ): ViewEntity["state"] {
    if (isPlaced) {
      return "correct";
    }
    if (isStaged) {
      return "selected";
    }
    if (
      this.wrongItemId === itemId ||
      this.getRenderItemState(itemId) === "wrong"
    ) {
      return "incorrect";
    }
    return "idle";
  }

  render(
    ctx: CanvasRenderingContext2D,
    rs: RenderSystem,
    timeMs: number
  ): void {
    this.lastFrameMs = timeMs;
    if (this.wrongItemId && this.wrongFlash.hasExpired(timeMs)) {
      this.setRenderItemState(this.wrongItemId, "idle");
      this.wrongItemId = null;
      this.wrongSlotId = null;
    }
    drawSceneBackground(ctx, rs, this.themeId);
    const zones = pickTrayZones(this.stageRect, this.trayRect);
    const targets = this.targetSlots;
    const sources = this.sourceSlots;
    const targetBox = boxFromSlots(targets);
    if (targetBox) {
      drawShapeTray(
        ctx,
        trayBoxWithin(targetBox, zones?.stage ?? this.stageRect)
      );
    }
    if (sources.length > 0) {
      // Lời dẫn do shell vẽ; khay nguồn là vùng khay của khung năm vùng.
      drawWoodenTokenDock(ctx, rs, zones?.tray);
    }
    const itemById = this.resolveItemById();
    const placedItemIds = new Set(this.placedSlots.values());

    this.content.slots.forEach((defSlot, i) => {
      const slot = targets[i];
      if (!slot) {
        return;
      }
      const placedId = this.placedSlots.get(defSlot.slot_id);
      const placed = placedId ? itemById.get(placedId) : undefined;
      if (!placed) {
        drawEmptyTargetSlot(ctx, slot);
        // Bóng mờ của vật ô này nhận thay cho nhãn chữ (`BR-E008-05`).
        drawGhostAssetInSlot(
          ctx,
          itemById.get(defSlot.expected_item_id)?.asset,
          slot
        );
        if (
          defSlot.slot_id === this.wrongSlotId &&
          this.wrongFlash.isActive(timeMs)
        ) {
          const elapsed = this.wrongFlash.elapsedMs(timeMs);
          rs.drawRetryRing(
            ctx,
            slot.x,
            slot.y,
            Math.min(slot.hitW, slot.hitH) / 2 + 4,
            elapsed / WRONG_FLASH_MS
          );
        }
        return;
      }
      drawSlotItem(ctx, rs, slot, {
        id: placed.item_id,
        asset: placed.asset,
        state: "correct",
      });
    });

    this.content.items.forEach((item, i) => {
      const slot = sources[i];
      if (!slot || placedItemIds.has(item.item_id)) {
        return;
      }
      const isWrong = item.item_id === this.wrongItemId;
      const elapsed = isWrong ? this.wrongFlash.elapsedMs(timeMs) : 0;
      const shakeX =
        isWrong && elapsed < WRONG_FLASH_MS && !rs.reducedMotion
          ? Math.sin(elapsed * 0.05) * 4
          : 0;
      const drawSlot = shakeX === 0 ? slot : { ...slot, x: slot.x + shakeX };

      drawSlotItem(ctx, rs, drawSlot, {
        id: item.item_id,
        asset: item.asset,
        state: this.resolveSourceItemState(item.item_id),
      });

      if (isWrong && elapsed < WRONG_FLASH_MS) {
        rs.drawRetryRing(
          ctx,
          slot.x + shakeX,
          slot.y,
          Math.min(slot.hitW, slot.hitH) / 2 + 4,
          elapsed / WRONG_FLASH_MS
        );
      }
    });
    this.drawRenderFeedback(rs, ctx);
  }

  private resolveSourceItemState(itemId: string) {
    const rawState = this.getRenderItemState(itemId);
    return this.stagedItemId === itemId && rawState === "idle"
      ? "selected"
      : rawState;
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
