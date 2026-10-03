import type { AgeBand } from "#src/contracts/types";
import {
  ACTION_CORRECT,
  ACTION_IGNORED,
  ACTION_RETRY,
  type ActionResult,
  type GameAction,
  TemplateGameSession,
} from "#src/game-session";
import type { EngineView, Gesture, ViewEntity } from "#src/interaction";
import { resolveTouchFloor } from "#src/layout/constants";
import { resolveLayout } from "#src/layout/registry";
import { computeStageTreeSlots } from "#src/layout/stage-targets";
import {
  computeTraySourceSlots,
  findNearestHitSlot,
  type MinHitSize,
  pickTrayZones,
} from "#src/layout/tray-layout";
import type { Slot } from "#src/layout/types";
import {
  drawEmptyTargetSlot,
  drawMatchLine,
  drawPromptText,
  drawQuantityRepresentation,
  drawSceneBackground,
  drawSlotItem,
  drawWoodenTokenDock,
  type ItemVisualState,
  updateParticles,
} from "#src/render/index.js";
import type { DegradationState } from "#src/systems/degradation";
import { designTokens } from "#src/systems/designTokens";
import type { Particle, RenderSystem } from "#src/systems/render-system";
import type { GT007Content, GT007Difficulty } from "./template.js";

/** Cạnh ô tổng và ô phần lớn nhất trên sân khấu — cùng cỡ ô của `number-bond-tree`. */
const TREE_CELL_MAX_PX = 96;

/** Khoảng chạm thêm quanh vùng chạm của slot (`GT-007.md` §6). */
const HIT_TOLERANCE_PX = 24;

/** Vùng chạm tối thiểu của ô phần ở bố cục cũ — rộng hơn thân ô vẽ. */
const LEGACY_PART_HIT: MinHitSize = { w: 100, h: 100 };

function extractOptionId(data: unknown): string | undefined {
  if (typeof data === "object" && data !== null && "option_id" in data) {
    const val = Reflect.get(data, "option_id");
    return typeof val === "string" ? val : undefined;
  }
  return undefined;
}

export class GT007Session extends TemplateGameSession<
  GT007Content,
  GT007Difficulty
> {
  degradation: DegradationState | null = null;
  private renderParticles: Particle[] = [];
  private readonly renderItemStates: Map<string, ItemVisualState> = new Map();
  private stagedOptionId: string | null = null;
  private wrongOptionId: string | null = null;
  private wrongTimestamp = 0;

  filledParts: Map<string, number> = new Map();

  /** Lựa chọn nằm trong khay, cây tách gộp đứng trên sân khấu (`BR-PSZ-01`). */
  override readonly needsTray = true;

  /** Số vật nguồn trong khay của vòng — shell đo chiều cao khay (`BR-PSZ-13`). */
  override get trayItemCount(): number {
    return this.content.options.length;
  }
  override readonly usesPromptZone = true;

  setupEntities(): void {
    this.filledParts.clear();
    this.stagedOptionId = null;
    this.isWon = false;
  }

  getStagedOptionId(): string | null {
    return this.stagedOptionId;
  }

  validateAction(action: GameAction): ActionResult {
    if (action.type === "fill_part" || action.type === "tap_option") {
      const optionId = extractOptionId(action.data);
      const option = this.content.options.find((o) => o.id === optionId);

      if (!option) {
        return ACTION_RETRY;
      }

      if (option.is_correct) {
        return ACTION_CORRECT;
      }

      return ACTION_RETRY;
    }

    return ACTION_IGNORED;
  }

  private getTargetPartId(): string {
    const targetPart = this.content.parts.find((p) => p.is_target);
    return targetPart ? targetPart.id : (this.content.parts[0]?.id ?? "part_0");
  }

  onPartFilled(optionId: string, partId?: string): void {
    const targetId = partId ?? this.getTargetPartId();
    const option = this.content.options.find((o) => o.id === optionId);
    if (!option) {
      return;
    }

    this.recordEvent("bond_selected", {
      option_id: optionId,
      part_id: targetId,
      is_correct: option.is_correct,
    });

    if (option.is_correct) {
      this.filledParts.set(targetId, option.value);
      this.recordEvent("part_filled", {
        part_id: targetId,
        value: option.value,
      });

      if (this.checkWinCondition()) {
        this.winSession();
      }
    } else {
      this.wrongOptionId = optionId;
      this.wrongTimestamp = Date.now();
    }
  }

  onItemPlaced(itemId: string, slotId?: string): void {
    this.onPartFilled(itemId, slotId);
  }

  override checkWinCondition(): boolean {
    const targetParts = this.content.parts.filter((p) => p.is_target);
    if (targetParts.length === 0) {
      return true;
    }

    return targetParts.every((tp) => {
      const filledVal = this.filledParts.get(tp.id);
      return filledVal === tp.value;
    });
  }

  protected computeSlots(ageBand: AgeBand): readonly Slot[] {
    const zones = pickTrayZones(this.stageRect, this.trayRect);
    if (zones) {
      const touchFloor = resolveTouchFloor(ageBand, this.cssPerLogic);
      const tree = computeStageTreeSlots({
        partCount: this.content.parts.length,
        stage: zones.stage,
        touchFloor,
        maxCell: TREE_CELL_MAX_PX,
      });
      const options = computeTraySourceSlots(
        this.content.options.length,
        zones.tray,
        touchFloor,
        tree.length
      );
      return [...tree, ...options];
    }
    const layoutKey =
      this.content.layout === "ten-frame-split" ||
      this.content.representation === "ten-frame"
        ? "ten-frame-split"
        : "number-bond-tree";
    const layoutFn = resolveLayout(layoutKey);
    return layoutFn({
      slotCount: this.content.options.length,
      targetCount: this.content.parts.length,
      ageBand,
      logic: this.logicSpace,
    });
  }

  private findDraggedOption(
    x: number,
    y: number,
    sources: readonly Slot[],
    hitTolerance: number
  ): GT007Content["options"][number] | null {
    const index = findNearestHitSlot(
      sources.slice(0, this.content.options.length),
      x,
      y,
      hitTolerance
    );
    return this.content.options[index] ?? null;
  }

  private findTargetPart(
    x: number,
    y: number,
    targets: readonly Slot[],
    hitTolerance: number
  ): GT007Content["parts"][number] | null {
    const isInFrame = pickTrayZones(this.stageRect, this.trayRect) !== null;
    const open = this.content.parts.flatMap((part, i) => {
      const slot = targets[i + 1];
      return slot && part.is_target && !this.filledParts.has(part.id)
        ? [{ part, slot }]
        : [];
    });
    const hit = findNearestHitSlot(
      open.map((entry) => entry.slot),
      x,
      y,
      hitTolerance,
      isInFrame ? undefined : LEGACY_PART_HIT
    );
    return open[hit]?.part ?? null;
  }

  private toDropAction(
    gesture: Extract<Gesture, { type: "drop" }>,
    sources: readonly Slot[],
    targets: readonly Slot[],
    hitTolerance: number
  ): GameAction | null {
    const opt = this.findDraggedOption(
      gesture.fromX,
      gesture.fromY,
      sources,
      hitTolerance
    );
    if (!opt) {
      return null;
    }
    const part = this.findTargetPart(
      gesture.toX,
      gesture.toY,
      targets,
      hitTolerance
    );
    if (!part) {
      return null;
    }
    return {
      type: "fill_part",
      data: {
        option_id: opt.id,
        part_id: part.id,
      },
    };
  }

  private handleTapTarget(
    gesture: Extract<Gesture, { type: "tap" }>,
    targets: readonly Slot[],
    hitTolerance: number
  ): GameAction | null {
    if (!this.stagedOptionId) {
      return null;
    }
    const part = this.findTargetPart(
      gesture.x,
      gesture.y,
      targets,
      hitTolerance
    );
    if (!part) {
      return null;
    }
    return {
      type: "fill_part",
      data: {
        option_id: this.stagedOptionId,
        part_id: part.id,
      },
    };
  }

  private handleTapSource(
    gesture: Extract<Gesture, { type: "tap" }>,
    sources: readonly Slot[],
    hitTolerance: number
  ): void {
    const opt = this.findDraggedOption(
      gesture.x,
      gesture.y,
      sources,
      hitTolerance
    );
    if (!opt) {
      return;
    }
    this.stagedOptionId = this.stagedOptionId === opt.id ? null : opt.id;
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
    const idx = this.content.options.findIndex((o) => o.is_correct);
    const sourceSlot = this.sourceSlots[idx];
    return sourceSlot ? this.slots.indexOf(sourceSlot) : null;
  }

  override commit(action: GameAction): void {
    if (
      action.type === "fill_part" &&
      action.data &&
      typeof action.data === "object"
    ) {
      const data = action.data as { option_id?: string; part_id?: string };
      if (data.option_id) {
        this.onPartFilled(data.option_id, data.part_id);
        this.stagedOptionId = null;
      }
    }
  }

  private toOptionEntityState(
    optId: string,
    rawState: ItemVisualState
  ): ViewEntity["state"] {
    const now = Date.now();
    if (this.wrongOptionId === optId && now - this.wrongTimestamp < 400) {
      return "incorrect";
    }
    if (this.stagedOptionId === optId || rawState === "selected") {
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

  override getView(): EngineView {
    const entities: ViewEntity[] = [];
    const targets = this.targetSlots;
    const sources = this.sourceSlots;

    const wholeSlot = targets[0];
    if (wholeSlot) {
      entities.push({
        id: this.content.whole.id,
        slotIndex: this.slots.indexOf(wholeSlot),
        role: "target",
        state: "idle",
        x: wholeSlot.x,
        y: wholeSlot.y,
        w: wholeSlot.w,
        h: wholeSlot.h,
      });
    }

    this.content.parts.forEach((part, i) => {
      const slot = targets[i + 1];
      if (!slot) {
        return;
      }
      const isFilled = this.filledParts.has(part.id);
      entities.push({
        id: part.id,
        slotIndex: this.slots.indexOf(slot),
        role: "target",
        state: isFilled ? "correct" : "idle",
        x: slot.x,
        y: slot.y,
        w: slot.w,
        h: slot.h,
      });
    });

    this.content.options.forEach((opt, i) => {
      const slot = sources[i];
      if (!slot) {
        return;
      }
      const rawState = this.getRenderItemState(opt.id);
      entities.push({
        id: opt.id,
        slotIndex: this.slots.indexOf(slot),
        role: "source",
        state: this.toOptionEntityState(opt.id, rawState),
        x: slot.x,
        y: slot.y,
        w: slot.w,
        h: slot.h,
      });
    });

    return {
      entities,
      activePrompt: this.content.prompt,
    };
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
    const zones = pickTrayZones(this.stageRect, this.trayRect);
    if (!zones) {
      drawPromptText(ctx, rs, this.content.prompt);
    }
    if (zones) {
      // Lời dẫn do shell vẽ; lựa chọn nằm trên khay của khung năm vùng.
      drawWoodenTokenDock(ctx, rs, zones.tray);
    }
    const targets = this.targetSlots;
    const sources = this.sourceSlots;

    const isTenFrame =
      this.content.layout === "ten-frame-split" ||
      this.content.representation === "ten-frame";

    // Slot 0 của number-bond-tree / ten-frame-split là ô tổng, các ô sau là nhánh.
    const wholeSlot = targets[0];
    if (wholeSlot) {
      if (isTenFrame) {
        drawQuantityRepresentation(ctx, rs, wholeSlot, {
          kind: "ten-frame",
          count: this.content.whole.value,
        });
      } else {
        this.content.parts.forEach((_, i) => {
          const slot = targets[i + 1];
          if (slot) {
            drawMatchLine(
              ctx,
              wholeSlot.x,
              wholeSlot.y,
              slot.x,
              slot.y,
              designTokens.colors.montessori.woodBevel
            );
          }
        });
        drawSlotItem(ctx, rs, wholeSlot, {
          id: this.content.whole.id,
          text: String(this.content.whole.value),
        });
      }
    }

    this.content.parts.forEach((part, i) => {
      const slot = targets[i + 1];
      if (!slot) {
        return;
      }
      const filled = this.filledParts.get(part.id);
      if (part.is_target && filled === undefined) {
        drawEmptyTargetSlot(ctx, slot);
        return;
      }
      const partVal = filled ?? part.value;
      if (isTenFrame) {
        drawQuantityRepresentation(ctx, rs, slot, {
          kind: "ten-frame",
          count: partVal,
        });
      } else {
        drawSlotItem(ctx, rs, slot, {
          id: part.id,
          text: String(partVal),
          state: filled === undefined ? "idle" : "correct",
        });
      }
    });

    this.content.options.forEach((opt, i) => {
      const slot = sources[i];
      if (!slot) {
        return;
      }
      const now = Date.now();
      const isWrong =
        this.wrongOptionId === opt.id && now - this.wrongTimestamp < 400;
      const shakeX = isWrong
        ? Math.sin((now - this.wrongTimestamp) / 30) * 4
        : 0;
      const renderSlot = shakeX === 0 ? slot : { ...slot, x: slot.x + shakeX };
      drawSlotItem(ctx, rs, renderSlot, {
        id: opt.id,
        text: String(opt.value),
        state: isWrong ? "wrong" : this.getRenderItemState(opt.id),
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

export default GT007Session;
