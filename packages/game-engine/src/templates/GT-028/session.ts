import type { AgeBand } from "#src/contracts/types";
import {
  ACTION_CORRECT,
  ACTION_IGNORED,
  ACTION_RETRY,
  type ActionResult,
  type GameAction,
  type HintTarget,
  TemplateGameSession,
} from "#src/game-session";
import type {
  EngineView,
  EntityVisual,
  Gesture,
  ViewEntity,
} from "#src/interaction";
import {
  resolveAssetLabels,
  spokenKeywordForAsset,
} from "#src/labels/spoken-keyword";
import { findHitSlotIndex, TAP_TOLERANCE_PX } from "#src/layout/hit-test";
import { resolveLayout } from "#src/layout/registry";
import {
  dockRectAroundSlots,
  insetDrawSize,
  splitCaption,
} from "#src/layout/slot-fit";
import type { Slot } from "#src/layout/types";
import {
  drawHeaderRepresentation,
  drawMontessoriControlOfErrorPill,
  drawSceneBackground,
  drawSlotItem,
  drawSubPromptText,
  drawWoodenTokenDock,
  sceneBox,
} from "#src/render/index.js";
import type { DegradationState } from "#src/systems/degradation";
import {
  type ControlOfErrorDiagnostics,
  MontessoriExploreTracker,
} from "#src/systems/montessori-explore-system";
import type { RenderSystem } from "#src/systems/render-system";
import type { GT028Content, GT028Difficulty } from "./template.js";

interface ItemActionPayload {
  item_id?: string;
  id?: string;
}

function getItemId(data: object | null | undefined): string | undefined {
  if (data && typeof data === "object") {
    const payload = data as ItemActionPayload;
    if (typeof payload.item_id === "string") {
      return payload.item_id;
    }
    if (typeof payload.id === "string") {
      return payload.id;
    }
  }
  return undefined;
}

export class GT028Session extends TemplateGameSession<
  GT028Content,
  GT028Difficulty
> {
  override readonly needsCommit = true;
  override readonly usesPromptZone = true;

  override canCommit(): boolean {
    return this.selectedItemIds.length > 0;
  }

  degradation: DegradationState | null = null;
  selectedItemIds: string[] = [];
  private readonly exploreTracker = new MontessoriExploreTracker({
    milestoneTarget: 2,
  });

  override takePillNarration(): string | null {
    return this.exploreTracker.takePillNarration();
  }
  private lastFrameMs = 0;
  private wrongSubmitUntilMs = 0;

  update(deltaMs: number): void {
    this.lastFrameMs += deltaMs;
    this.exploreTracker.tick(deltaMs);
  }

  startExplorePhase(): void {
    this.exploreTracker.reset(true);
  }

  getExploreTracker(): MontessoriExploreTracker {
    return this.exploreTracker;
  }

  getControlOfError(): ControlOfErrorDiagnostics | null {
    return this.exploreTracker.getControlOfErrorDiagnostics();
  }

  isMicroSandboxActive(): boolean {
    return this.exploreTracker.isMicroSandboxActive();
  }

  setupEntities(): void {
    this.isWon = false;
    this.selectedItemIds = [];
    this.renderItemStates.clear();
    this.exploreTracker.reset(false);

    this.recordEvent("game_started", {
      step: this.content.step,
      target_total: this.content.target_total,
      item_count: this.content.items.length,
    });
  }

  getCurrentCount(): number {
    return this.selectedItemIds.length * this.content.step;
  }

  validateAction(action: GameAction): ActionResult {
    switch (action.type) {
      case "tap_item":
      case "select_item": {
        const itemId = getItemId(action.data as object | null | undefined);

        if (typeof itemId !== "string") {
          return ACTION_IGNORED;
        }

        const itemExists = this.content.items.some((i) => i.item_id === itemId);
        if (!itemExists) {
          return ACTION_IGNORED;
        }

        const isAlreadySelected = this.selectedItemIds.includes(itemId);
        if (isAlreadySelected && !this.difficulty.allow_undo) {
          return ACTION_IGNORED;
        }

        return ACTION_CORRECT;
      }
      case "submit_count":
      case "submit": {
        const currentTotal = this.getCurrentCount();
        const isCorrect = currentTotal === this.content.target_total;
        return isCorrect ? ACTION_CORRECT : ACTION_RETRY;
      }
      default:
        return ACTION_IGNORED;
    }
  }

  override toAction(gesture: Gesture): GameAction | null {
    if (gesture.type === "commit") {
      return {
        type: "submit_count",
        data: {},
      };
    }

    if (gesture.type === "tap") {
      const hitIndex = findHitSlotIndex(
        this.slots,
        gesture.x,
        gesture.y,
        "circle",
        TAP_TOLERANCE_PX
      );
      if (hitIndex === -1) {
        return null;
      }
      const item = this.content.items[hitIndex];
      if (!item) {
        return null;
      }
      return {
        type: "tap_item",
        data: { item_id: item.item_id },
      };
    }

    return null;
  }

  override commit(action: GameAction): void {
    switch (action.type) {
      case "tap_item":
      case "select_item": {
        const itemId = getItemId(action.data as object | null | undefined);
        if (typeof itemId === "string") {
          this.onTapItem(itemId);
        }
        break;
      }
      case "submit_count":
      case "submit": {
        this.onSubmitCount();
        break;
      }
      default:
        break;
    }
  }

  private resolveEntityState(
    itemId: string,
    isSelected: boolean
  ): EntityVisual {
    if (isSelected) {
      return "selected";
    }
    const renderState = this.getRenderItemState(itemId);
    if (renderState === "correct") {
      return "correct";
    }
    if (renderState === "wrong") {
      return "incorrect";
    }
    return "idle";
  }

  override getView(): EngineView {
    const entities: ViewEntity[] = this.content.items.map((item, i) => {
      const slot = this.slots[i];
      const selectedIndex = this.selectedItemIds.indexOf(item.item_id);
      const isSelected = selectedIndex !== -1;
      const state = this.resolveEntityState(item.item_id, isSelected);
      const countForTap = isSelected
        ? (selectedIndex + 1) * this.content.step
        : (this.selectedItemIds.length + 1) * this.content.step;
      const assetLabels = resolveAssetLabels(item.asset);
      const spokenLabel =
        spokenKeywordForAsset({ kind: "text", text: String(countForTap) }) ??
        assetLabels.spokenLabel ??
        String(countForTap);
      return {
        id: item.item_id,
        slotIndex: slot?.index ?? i,
        role: "source",
        state,
        x: slot?.x ?? 0,
        y: slot?.y ?? 0,
        w: slot?.w ?? 80,
        h: slot?.h ?? 80,
        ...assetLabels,
        label: isSelected ? String(countForTap) : assetLabels.label,
        spokenLabel,
      };
    });

    return {
      activePrompt: this.content.prompt,
      entities,
    };
  }

  onTapItem(itemId: string): ActionResult {
    const itemExists = this.content.items.some((i) => i.item_id === itemId);
    if (!itemExists) {
      return ACTION_IGNORED;
    }

    const index = this.selectedItemIds.indexOf(itemId);
    if (index === -1) {
      // Chọn mới
      this.selectedItemIds.push(itemId);
      this.setRenderItemState(itemId, "selected");
      this.exploreTracker.recordExploreAction("step_counted");
      this.recordEvent("item_tapped", {
        item_id: itemId,
        current_total: this.getCurrentCount(),
        step: this.content.step,
      });
      return ACTION_CORRECT;
    }

    // Đã chọn trước đó -> kiểm tra quyền undo (BR-E028-03)
    if (this.difficulty.allow_undo) {
      this.selectedItemIds.splice(index, 1);
      this.setRenderItemState(itemId, "idle");
      this.exploreTracker.recordExploreAction("step_counted");
      this.recordEvent("count_undone", {
        item_id: itemId,
        current_total: this.getCurrentCount(),
        step: this.content.step,
      });
      return ACTION_CORRECT;
    }

    return ACTION_IGNORED;
  }

  onSubmitCount(): ActionResult {
    const currentTotal = this.getCurrentCount();
    const isCorrect = currentTotal === this.content.target_total;

    this.recordEvent("count_submitted", {
      submitted_total: currentTotal,
      target_total: this.content.target_total,
      is_correct: isCorrect,
    });

    if (isCorrect) {
      this.exploreTracker.recordCorrectAttempt();
      this.isWon = true;
      this.recordEvent("game_completed", { score: 100 });
      this.winSession();
      return ACTION_CORRECT;
    }

    const diff = this.content.target_total - currentTotal;
    const reasonVi =
      diff > 0
        ? `Đang có ${currentTotal}, còn thiếu ${diff} để đủ ${this.content.target_total}`
        : `Đang có ${currentTotal}, dư ${Math.abs(diff)} so với ${this.content.target_total}`;
    this.exploreTracker.recordWrongAttempt({
      reasonVi,
      actualValue: currentTotal,
      expectedValue: this.content.target_total,
    });
    this.recordEvent("control_of_error", {
      current_total: currentTotal,
      target_total: this.content.target_total,
      micro_sandbox: this.exploreTracker.isMicroSandboxActive(),
    });
    this.wrongSubmitUntilMs = this.lastFrameMs + 400;
    return ACTION_RETRY;
  }

  override checkWinCondition(): boolean {
    return this.isWon;
  }

  override destroy(): void {
    super.destroy();
    this.renderItemStates.clear();
    this.selectedItemIds = [];
  }

  /** Đếm vượt đích thì nộp là sai — chỉ gợi ý nút Xong khi đếm vừa đủ. */
  override getHintTarget(): HintTarget | null {
    const target = super.getHintTarget();
    if (target?.kind === "action") {
      return this.getCurrentCount() === this.content.target_total
        ? target
        : null;
    }
    return target;
  }

  override getHintTargetIndex(): number | null {
    if (this.isWon) {
      return null;
    }
    const currentTotal = this.getCurrentCount();
    if (currentTotal < this.content.target_total) {
      const nextUnselectedIdx = this.content.items.findIndex(
        (it) => !this.selectedItemIds.includes(it.item_id)
      );
      return nextUnselectedIdx >= 0 ? nextUnselectedIdx : null;
    }
    return null;
  }

  protected computeSlots(ageBand: AgeBand): readonly Slot[] {
    const layoutFn = resolveLayout("grid");
    const bodyRect = this.stageRect
      ? splitCaption(this.stageRect).body
      : undefined;
    return insetDrawSize(
      layoutFn({
        slotCount: this.content.items.length,
        ageBand,
        logic: this.logicSpace,
        // Dải nhãn đếm ở đỉnh sân khấu; lưới nằm dưới nó (`BR-PSZ-01`).
        stage: bodyRect,
        cssPerLogic: this.cssPerLogic,
      }),
      bodyRect ?? this.stageRect
    );
  }

  render(
    ctx: CanvasRenderingContext2D,
    rs: RenderSystem,
    timeMs: number
  ): void {
    this.lastFrameMs = timeMs;
    drawSceneBackground(ctx, rs, this.themeId);

    const bodyRect = this.stageRect
      ? splitCaption(this.stageRect).body
      : undefined;
    const dock = dockRectAroundSlots(this.slots, bodyRect);
    if (dock) {
      drawWoodenTokenDock(ctx, rs, dock);

      if (this.wrongSubmitUntilMs > timeMs) {
        const elapsed = 400 - (this.wrongSubmitUntilMs - timeMs);
        const progress = Math.min(1, Math.max(0, elapsed / 400));
        const centerX = dock.x + dock.w / 2;
        const centerY = dock.y + dock.h / 2;
        const radius = Math.max(dock.w, dock.h) / 2 + 8;
        rs.drawRetryRing(ctx, centerX, centerY, radius, progress);
      }
    }

    // Lời dẫn do shell vẽ ở vùng lời dẫn (`BR-PSZ-08`).
    const subText = `Bước nhảy: +${this.content.step}  |  Đã đếm: ${this.getCurrentCount()} / Mục tiêu: ${this.content.target_total}`;
    drawSubPromptText(
      ctx,
      rs,
      subText,
      this.stageRect ? splitCaption(this.stageRect).caption : undefined
    );

    const currentCount = this.getCurrentCount();
    if (
      !this.stageRect &&
      (this.content.representation === "tally" ||
        this.content.representation === "rekenrek")
    ) {
      drawHeaderRepresentation(
        ctx,
        rs,
        this.content.representation,
        currentCount
      );
    }

    this.content.items.forEach((item, i) => {
      const slot = this.slots[i];
      if (!slot) {
        return;
      }
      const selectedIndex = this.selectedItemIds.indexOf(item.item_id);
      const isSelected = selectedIndex !== -1;
      const label = isSelected
        ? `${(selectedIndex + 1) * this.content.step}`
        : undefined;
      const state = isSelected
        ? "selected"
        : this.getRenderItemState(item.item_id);

      drawSlotItem(ctx, rs, slot, {
        id: item.item_id,
        asset: item.asset,
        label,
        state,
      });
    });

    drawMontessoriControlOfErrorPill(
      ctx,
      this.stageRect ?? sceneBox(rs),
      this.exploreTracker,
      rs.viewport?.scale
    );
  }
}
