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
import type { EngineView, Gesture, ViewEntity } from "#src/interaction";
import { resolveAssetLabels } from "#src/labels/spoken-keyword";
import { findHitSlotIndex, TAP_TOLERANCE_PX } from "#src/layout/hit-test";
import { resolveLayout } from "#src/layout/registry";
import {
  dockRectAroundSlots,
  insetDrawSize,
  legacyStageArea,
} from "#src/layout/slot-fit";
import type { ZoneRect } from "#src/layout/stage-zones";
import type { Slot } from "#src/layout/types";
import {
  drawClocheScene,
  drawLabelText,
  drawSceneBackground,
  drawSlotItem,
  drawSubPromptText,
  drawWoodenTokenDock,
} from "#src/render/index.js";
import type { DegradationState } from "#src/systems/degradation";
import type { RenderSystem } from "#src/systems/render-system";
import { FlashTimer } from "#src/systems/timer-system";
import { WRONG_FLASH_MS, WrongFlash } from "#src/systems/wrong-flash";
import type { GT012Content, GT012Difficulty } from "./template.js";
import {
  computeFlashSlots,
  plateSlot,
  type RecallAreas,
  splitRecallStage,
} from "./zone-layout.js";

export class FlashRecallSession extends TemplateGameSession<
  GT012Content,
  GT012Difficulty
> {
  override readonly usesPromptZone = true;
  readonly holdsClockWhileInputClosed = true;

  degradation: DegradationState | null = null;

  private readonly timer: FlashTimer;
  private selectedValue: number | null = null;
  private wasVisible = false;
  /** Trẻ chưa bấm bắt đầu: chưa chớp, đồng hồ chưa chạy (`BR-E012-04`). */
  private awaitingStart = true;
  private readonly wrongFlash = new WrongFlash();
  private lastFrameMs = 0;
  /** Vùng đĩa và vùng lựa chọn của vòng này (`BR-PSZ-01`). */
  private areas: RecallAreas | null = null;
  /** Vị trí vật loé trên đĩa — không chạm được nên không nằm trong `slots`. */
  private flashSlots: readonly Slot[] = [];

  constructor(
    content: GT012Content,
    difficulty: GT012Difficulty,
    layoutSeed = 0
  ) {
    super(content, difficulty, layoutSeed);
    this.timer = new FlashTimer({
      flashMs: difficulty.flash_ms,
      allowReplay: difficulty.allow_replay,
    });
  }

  setupEntities(): void {
    this.selectedValue = null;
    this.wrongFlash.clear();
    this.lastFrameMs = 0;
    this.timer.reset();
    this.wasVisible = false;
    this.awaitingStart = true;
    this.isWon = false;

    this.recordEvent("game_started", {
      template_code: "GT-012",
      item_count: this.content.flash_items.length,
      flash_ms: this.timer.getDurationMs(),
    });
  }

  /** Đang chờ trẻ bấm nút bắt đầu — Cấm — NEVER tự đếm ngược (`BR-E012-04`). */
  isAwaitingStart(): boolean {
    return this.awaitingStart;
  }

  /** Trẻ bấm bắt đầu: vật hiện đúng `flash_ms` rồi tắt. */
  startFlash(): boolean {
    if (!this.awaitingStart) {
      return false;
    }
    this.awaitingStart = false;
    this.timer.start();
    this.wasVisible = true;
    this.recordEvent("flash_shown", {
      duration_ms: this.timer.getDurationMs(),
    });
    return true;
  }

  getFlashItems(): GT012Content["flash_items"] {
    return this.content.flash_items;
  }

  getArrangement(): GT012Content["arrangement"] {
    return this.content.arrangement;
  }

  getOptions(): GT012Content["options"] {
    return this.content.options;
  }

  isFlashVisible(): boolean {
    return this.timer.isVisible();
  }

  isCovered(): boolean {
    return !(this.awaitingStart || this.timer.isVisible());
  }

  get plateRect(): ZoneRect | null {
    return this.areas?.plate ?? null;
  }

  canReplay(): boolean {
    return this.timer.canReplay();
  }

  replayFlash(): boolean {
    const ok = this.timer.replay();
    if (ok) {
      this.wasVisible = true;
      this.recordEvent("flash_replayed", {});
      this.recordEvent("flash_shown", {
        duration_ms: this.timer.getDurationMs(),
      });
    }
    return ok;
  }

  update(deltaMs: number): void {
    this.lastFrameMs += deltaMs;
    if (
      this.selectedValue !== null &&
      this.wrongFlash.hasExpired(this.lastFrameMs)
    ) {
      this.selectedValue = null;
      this.wrongFlash.clear();
    }

    const prevState = this.timer.getState();
    this.timer.tick(deltaMs);
    const currState = this.timer.getState();

    if (prevState === "running" && currState === "expired" && this.wasVisible) {
      this.wasVisible = false;
      this.recordEvent("flash_hidden", {
        elapsed_ms: this.timer.getElapsedMs(),
      });
    }
  }

  selectValue(value: number): boolean {
    this.selectedValue = value;
    const isCorrect = value === this.content.flash_items.length;
    if (isCorrect) {
      this.wrongFlash.clear();
    } else {
      this.wrongFlash.trigger(this.lastFrameMs);
    }

    this.recordEvent("value_selected", {
      value,
      is_correct: isCorrect,
    });

    if (this.checkWinCondition()) {
      this.winSession();
    }

    return isCorrect;
  }

  getSelectedValue(): number | null {
    return this.selectedValue;
  }

  validateAction(action: GameAction): ActionResult {
    if (action.type === "start_flash") {
      return this.awaitingStart
        ? { valid: true, feedback: "none" }
        : ACTION_IGNORED;
    }
    if (this.awaitingStart) {
      return ACTION_IGNORED;
    }
    if (action.type === "replay_flash") {
      return ACTION_IGNORED;
    }
    if (action.type === "select_value") {
      if (typeof action.data !== "number") {
        return ACTION_RETRY;
      }
      const val = action.data;
      return val === this.content.flash_items.length
        ? ACTION_CORRECT
        : ACTION_RETRY;
    }
    return ACTION_IGNORED;
  }

  override toAction(gesture: Gesture): GameAction | null {
    if (gesture.type !== "tap") {
      return null;
    }
    if (this.awaitingStart) {
      return this.hitPlate(gesture.x, gesture.y)
        ? { type: "start_flash", data: null }
        : null;
    }
    if (this.isCovered() && this.timer.canReplay() && this.plateRect) {
      const p = this.plateRect;
      if (
        gesture.x >= p.x - TAP_TOLERANCE_PX &&
        gesture.x <= p.x + p.w + TAP_TOLERANCE_PX &&
        gesture.y >= p.y - TAP_TOLERANCE_PX &&
        gesture.y <= p.y + p.h + TAP_TOLERANCE_PX
      ) {
        return { type: "replay_flash", data: null };
      }
    }
    if (this.timer.isVisible()) {
      return null;
    }
    const idx = findHitSlotIndex(
      this.slots,
      gesture.x,
      gesture.y,
      "circle",
      TAP_TOLERANCE_PX
    );
    const opt = idx >= 0 ? this.content.options[idx] : undefined;
    if (!opt) {
      return null;
    }
    return {
      type: "select_value",
      data: opt.value,
    };
  }

  private hitPlate(x: number, y: number): boolean {
    const p = this.plateRect;
    return (
      p !== null &&
      x >= p.x - TAP_TOLERANCE_PX &&
      x <= p.x + p.w + TAP_TOLERANCE_PX &&
      y >= p.y - TAP_TOLERANCE_PX &&
      y <= p.y + p.h + TAP_TOLERANCE_PX
    );
  }

  override getHintTargetIndex(): number | null {
    if (this.awaitingStart) {
      return null;
    }
    const idx = this.content.options.findIndex((o) => o.is_correct);
    return idx >= 0 ? idx : null;
  }

  override getHintTargetForLevel(level: HintLevel): HintTarget | null {
    if (this.checkWinCondition()) {
      return null;
    }
    if (this.awaitingStart) {
      // Bước kế là bấm nút bắt đầu: không lộ gì về đáp án.
      return { kind: "region", ids: ["cloche-plate"] };
    }
    if (level === 1) {
      return {
        kind: "region",
        ids: ["cloche-plate"],
      };
    }
    if (level === 2) {
      const correctOpt = this.content.options.find((o) => o.is_correct);
      const distractorOpt = this.content.options.find((o) => !o.is_correct);
      const narrowedIds: string[] = [];
      if (correctOpt) {
        narrowedIds.push(`opt-${correctOpt.value}`);
      }
      if (distractorOpt) {
        narrowedIds.push(`opt-${distractorOpt.value}`);
      }
      return {
        kind: "region",
        ids: narrowedIds.length > 0 ? narrowedIds : ["options-narrowed"],
      };
    }
    return this.getHintTarget();
  }

  override commit(action: GameAction): void {
    if (action.type === "select_value" && typeof action.data === "number") {
      this.selectValue(action.data);
    } else if (action.type === "start_flash") {
      this.startFlash();
    } else if (action.type === "replay_flash") {
      this.replayFlash();
    }
  }

  override getView(): EngineView {
    if (this.awaitingStart && this.plateRect) {
      const p = this.plateRect;
      return {
        activePrompt: this.content.prompt,
        entities: [
          {
            id: "cloche-plate",
            role: "neutral",
            state: "idle",
            x: p.x + p.w / 2,
            y: p.y + p.h / 2,
            w: p.w,
            h: p.h,
            hitShape: "circle",
            slotIndex: -1,
            label: "Bắt đầu",
            spokenLabel: "Chạm để mở nắp và nhìn thật kỹ",
          },
        ],
      };
    }
    if (this.timer.isVisible()) {
      const entities: ViewEntity[] = [];
      this.content.flash_items.forEach((item, i) => {
        const slot = this.flashSlots[i];
        if (!slot) {
          return;
        }
        entities.push({
          id: item.item_id,
          slotIndex: i,
          role: "neutral",
          state: "idle",
          x: slot.x,
          y: slot.y,
          w: slot.w,
          h: slot.h,
          ...resolveAssetLabels(item.asset),
        });
      });
      return {
        activePrompt: this.isCovered()
          ? this.content.prompt
          : this.content.prompt || "Bé hãy nhìn kỹ các đồ vật trên đĩa nhé!",
        entities,
      };
    }

    const entities: ViewEntity[] = [];
    if (this.isCovered() && this.timer.canReplay() && this.plateRect) {
      const p = this.plateRect;
      entities.push({
        id: "cloche-plate",
        role: "neutral",
        state: "idle",
        x: p.x + p.w / 2,
        y: p.y + p.h / 2,
        w: p.w,
        h: p.h,
        hitShape: "circle",
        slotIndex: -1,
        label: "Mở lại nắp",
        spokenLabel: "Chạm để xem lại các đồ vật",
      });
    }

    this.content.options.forEach((opt, i) => {
      const slot = this.slots[i];
      if (!slot) {
        return;
      }
      let state: ViewEntity["state"] = "idle";
      if (this.selectedValue === opt.value) {
        state = opt.is_correct ? "correct" : "incorrect";
      }
      const optLabel = String(opt.value);
      entities.push({
        id: `opt-${opt.value}`,
        slotIndex: i,
        role: "source",
        state,
        x: slot.x,
        y: slot.y,
        w: slot.w,
        h: slot.h,
        label: optLabel,
        spokenLabel: `Số ${optLabel}`,
      });
    });

    return {
      activePrompt: this.isCovered()
        ? this.content.prompt
        : this.content.prompt || "Bé hãy nhìn kỹ các đồ vật trên đĩa nhé!",
      entities,
    };
  }

  override checkWinCondition(): boolean {
    if (this.selectedValue === null) {
      return false;
    }
    return this.selectedValue === this.content.flash_items.length;
  }

  override destroy(): void {
    super.destroy();
    this.timer.reset();
    this.selectedValue = null;
    this.wasVisible = false;
    this.awaitingStart = true;
  }

  protected computeSlots(ageBand: AgeBand): readonly Slot[] {
    this.areas = splitRecallStage(
      this.stageRect ?? legacyStageArea(this.logicSpace)
    );
    const layoutFn = resolveLayout("grid");
    return insetDrawSize(
      layoutFn({
        slotCount: this.content.options.length,
        ageBand,
        logic: this.logicSpace,
        stage: this.areas.options,
        cssPerLogic: this.cssPerLogic,
      }),
      this.stageRect
    );
  }

  protected override computeRoundDerived(): void {
    if (!this.areas) {
      return;
    }
    this.flashSlots = computeFlashSlots(
      this.areas.plate,
      this.content.flash_items.length,
      this.content.arrangement
    );
  }

  render(
    ctx: CanvasRenderingContext2D,
    rs: RenderSystem,
    timeMs: number
  ): void {
    this.lastFrameMs = timeMs;
    if (this.selectedValue !== null && this.wrongFlash.hasExpired(timeMs)) {
      this.selectedValue = null;
      this.wrongFlash.clear();
    }

    drawSceneBackground(ctx, rs, this.themeId);

    const plate = this.areas ? plateSlot(this.areas.plate) : null;
    if (!plate) {
      return;
    }

    if (this.awaitingStart) {
      // Chờ trẻ bấm: nắp đậy và nút bắt đầu ▶ ngay trên đĩa (`BR-E012-04`).
      drawClocheScene(ctx, plate, false);
      drawLabelText(ctx, "▶", plate.x, plate.y, 48);
      return;
    }

    // Hai pha: đang loé thì mở nắp cloche thấy vật; hết loé thì đậy nắp cloche và hiện thẻ chọn.
    if (this.timer.isVisible()) {
      if (!this.stageRect) {
        drawSubPromptText(ctx, rs, "Nhìn nhanh!");
      }
      drawClocheScene(ctx, plate, true);
      this.content.flash_items.forEach((item, i) => {
        const slot = this.flashSlots[i];
        if (!slot) {
          return;
        }
        drawSlotItem(ctx, rs, slot, { id: item.item_id, asset: item.asset });
      });
      return;
    }

    if (!this.stageRect) {
      drawSubPromptText(ctx, rs, "Bé nhớ có bao nhiêu đồ vật?");
    }
    drawClocheScene(ctx, plate, false);
    drawWoodenTokenDock(
      ctx,
      rs,
      dockRectAroundSlots(this.slots, this.stageRect)
    );

    this.content.options.forEach((opt, i) => {
      const slot = this.slots[i];
      if (!slot) {
        return;
      }
      let state: "correct" | "wrong" | "idle" = "idle";
      if (this.selectedValue === opt.value) {
        state = opt.is_correct ? "correct" : "wrong";
      }
      drawSlotItem(ctx, rs, slot, {
        id: `opt-${opt.value}`,
        text: String(opt.value),
        state,
      });
      if (
        this.selectedValue === opt.value &&
        !opt.is_correct &&
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
    });
  }
}

export const GT012Session = FlashRecallSession;
export default FlashRecallSession;
