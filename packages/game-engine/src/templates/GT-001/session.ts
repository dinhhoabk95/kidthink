import type { AgeBand } from "#src/contracts/types";
import {
  type ActionResult,
  type GameAction,
  TemplateGameSession,
} from "#src/game-session";
import type { EngineView, Gesture, ViewEntity } from "#src/interaction";
import { spokenKeywordForAsset } from "#src/labels/spoken-keyword";
import { getTouchFloor } from "#src/layout/constants";
import { findHitSlotIndex, TAP_TOLERANCE_PX } from "#src/layout/hit-test.js";
import { resolveLayout } from "#src/layout/registry";
import type { Slot } from "#src/layout/types";
import { SelectionMechanic } from "#src/mechanics/selection-mechanic";
import {
  drawCentralTargetCard,
  drawPromptText,
  drawSceneBackground,
  drawSlotItem,
  drawWoodenTokenDock,
  getCentralTargetCardSlot,
  getWoodenTokenDockRect,
  type ItemVisualState,
  spawnParticlesAtSlot,
  updateParticles,
} from "#src/render/index.js";
import { deriveStream } from "#src/rng/mulberry32";
import { shuffle } from "#src/rng/shuffle";
import type { DegradationState } from "#src/systems/degradation";
import type { Particle, RenderSystem } from "#src/systems/render-system";
import type { GT001Content, GT001Difficulty } from "./template.js";

type OptionItem = GT001Content["options"][number];
type ItemAsset = OptionItem["asset"];

/** Tiền tố id của entity thẻ đề — tách khỏi không gian id của lựa chọn. */
const PROMPT_CARD_ID_PREFIX = "prompt:";

/**
 * Chữ hiện trên thẻ và từ khoá đọc được của nó (`spokenLabel`) — dùng chung
 * cho thẻ lựa chọn và thẻ đề giữa màn, cả hai đều đọc lại khi trẻ chạm
 * (Task #273, `BR-PNR-02`). Từ khoá đi qua `spokenKeywordForAsset` — cùng
 * hàm cổng `check:narration-coverage` dùng để đếm glyph không đọc được tên;
 * không dựng được tên thì không có `spokenLabel` (Task #274 S7).
 */
function resolveAssetLabels(asset: ItemAsset): {
  glyph?: string;
  label?: string;
  spokenLabel?: string;
  spokenAudioPath?: string;
} {
  const spokenLabel = spokenKeywordForAsset(asset);
  if (asset.kind === "emoji") {
    return {
      glyph: asset.ref,
      label: asset.ref,
      spokenLabel,
      spokenAudioPath: asset.audio_path,
    };
  }
  if (asset.kind === "text") {
    return {
      label: asset.text,
      spokenLabel,
      spokenAudioPath: asset.audio_path,
    };
  }
  return {};
}

export class GT001Session extends TemplateGameSession<
  GT001Content,
  GT001Difficulty
> {
  override readonly usesPromptZone = true;

  selectedItemId: string | null = null;
  displayOptions: readonly OptionItem[] = [];
  private readonly mechanic = new SelectionMechanic({ mode: "single" });
  degradation: DegradationState | null = null;
  private particles: Particle[] = [];
  private itemStates: Map<string, ItemVisualState> = new Map();
  private wrongItemId: string | null = null;
  private wrongTimestamp = 0;

  constructor(
    content: GT001Content,
    difficulty: GT001Difficulty,
    layoutSeed = 0,
    themeId?: string
  ) {
    super(content, difficulty, layoutSeed, themeId);
  }
  /**
   * Mốc thời gian của khung vẽ gần nhất.
   *
   * `render()` nhận `performance.now()` (`core.ts:16`), còn `onItemLocked` chạy
   * ngoài vòng vẽ. Ghi mốc bằng `Date.now()` như bản trước làm `elapsed` âm
   * khoảng 1,79e12 — luôn `< 400`, nên hiệu ứng rung sai đáp án chạy MÃI sau
   * lần chạm sai đầu tiên. Hai mốc phải cùng một đồng hồ.
   */
  private lastFrameMs = 0;

  setupEntities(): void {
    this.selectedItemId = null;
    this.mechanic.reset();
    this.isWon = false;
    this.particles = [];
    this.itemStates = new Map();
    this.wrongItemId = null;
    this.wrongTimestamp = 0;
    if (this.difficulty.shuffle_items === false) {
      this.displayOptions = [...this.content.options];
    } else {
      const rng = deriveStream(this.layoutSeed, "items");
      this.displayOptions = shuffle(this.content.options, rng);
    }
  }

  protected computeSlots(ageBand: AgeBand): readonly Slot[] {
    const count = this.displayOptions.length;
    if (this.content.target_item && count > 0) {
      const touchFloor = getTouchFloor(ageBand);
      const dock = getWoodenTokenDockRect(this.logicSpace, this.stageRect);
      const centerY = dock.y + dock.h / 2;
      const gap = 24;
      const slotW = Math.max(
        touchFloor,
        Math.min(104, (dock.w - (count - 1) * gap) / count)
      );
      const slotH = slotW;
      const totalW = count * slotW + (count - 1) * gap;
      const startX = dock.x + (dock.w - totalW) / 2;
      const slots: Slot[] = [];
      for (let i = 0; i < count; i++) {
        slots.push({
          index: i,
          x: Math.round(startX + i * (slotW + gap) + slotW / 2),
          y: Math.round(centerY),
          w: Math.round(slotW),
          h: Math.round(slotH),
          hitW: Math.max(touchFloor, Math.round(slotW)),
          hitH: Math.max(touchFloor, Math.round(slotH)),
          page: 0,
          role: "source",
        });
      }
      return slots;
    }

    const layoutFn = resolveLayout("grid");
    return layoutFn({
      slotCount: this.displayOptions.length,
      ageBand,
      logic: this.logicSpace,
    });
  }

  private getItemState(itemId: string): ItemVisualState {
    return this.itemStates.get(itemId) ?? "idle";
  }

  setItemState(itemId: string, state: ItemVisualState): void {
    this.itemStates.set(itemId, state);
  }

  private findOption(itemId: string) {
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
    if (this.selectedItemId === itemId) {
      return;
    }
    this.selectedItemId = itemId;
    this.mechanic.select(itemId);
    const isCorrect = this.findOption(itemId)?.is_correct === true;
    this.recordEvent("item_selected", {
      item_id: itemId,
      is_correct: isCorrect,
    });
    if (isCorrect) {
      this.setItemState(itemId, "correct");
      const idx = this.displayOptions.findIndex((o) => o.item_id === itemId);
      const slot = this.slots[idx];
      if (slot) {
        this.particles.push(...spawnParticlesAtSlot(slot, 8));
      }
      this.winSession();
    } else {
      this.setItemState(itemId, "wrong");
      this.wrongItemId = itemId;
      this.wrongTimestamp = this.lastFrameMs;
    }
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

    // Thẻ đề giữa màn — role `neutral`, KHÔNG nằm trong `this.slots` nên
    // Cấm — NEVER được `toAction()` chấm là một lượt chọn. Chạm lại để nghe
    // từ khoá vẫn đi qua `spokenLabel` như mọi entity khác (Task #273).
    // Id mang tiền tố `prompt:` vì bộ sinh level đặt `target_item.item_id`
    // bằng đúng id của lựa chọn đúng (2.976/2.976 vòng, Task #274 E1) — mượn
    // nguyên id là hai entity cùng khoá.
    if (this.content.target_item) {
      const targetSlot = getCentralTargetCardSlot(
        this.logicSpace,
        this.stageRect
      );
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

    // Hình tròn vì `drawInteractive` vẽ token tròn (`drawSlotItem(...,
    // "circle")`); dung sai `TAP_TOLERANCE_PX` = `input.tolerance_px` của
    // `template.ts`. Bề mặt web tìm entity để đọc lại từ khoá bằng đúng phép
    // đo này (`findHitEntity`, Task #274 S1d). Trước #273 đây là hình vuông
    // nửa cạnh `max(hitW, w)/2 + 24` — nhận cả bốn góc nằm ngoài token.
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
      const itemId = String((action.data as { item_id: unknown }).item_id);
      this.onItemLocked(itemId);
    }
  }

  override checkWinCondition(): boolean {
    const items = this.content.options.map((opt) => ({
      id: opt.item_id,
      isCorrect: opt.is_correct,
    }));
    return this.mechanic.isSelectionComplete(items);
  }

  render(
    ctx: CanvasRenderingContext2D,
    rs: RenderSystem,
    timeMs: number
  ): void {
    this.lastFrameMs = timeMs;
    const slots = this.slots;
    drawSceneBackground(ctx, rs, this.themeId);
    if (!this.stageRect) {
      drawPromptText(ctx, rs, this.content.prompt);
    }
    if (this.content.target_item) {
      drawCentralTargetCard(
        ctx,
        rs,
        this.content.target_item.asset,
        undefined,
        this.stageRect
      );
    }
    drawWoodenTokenDock(
      ctx,
      rs,
      getWoodenTokenDockRect(this.logicSpace, this.stageRect)
    );
    this.drawInteractive(rs, ctx, slots);
    this.drawFeedback(rs, ctx, slots, timeMs);
  }

  private drawInteractive(
    rs: RenderSystem,
    ctx: CanvasRenderingContext2D,
    slots: readonly Slot[]
  ): void {
    for (let i = 0; i < this.displayOptions.length; i++) {
      const opt = this.displayOptions[i];
      const slot = slots[i];
      if (!(slot && opt)) {
        continue;
      }
      const state = this.getItemState(opt.item_id);
      drawSlotItem(
        ctx,
        rs,
        slot,
        {
          id: opt.item_id,
          asset: opt.asset,
          state,
        },
        "circle"
      );
    }
  }

  private drawFeedback(
    rs: RenderSystem,
    ctx: CanvasRenderingContext2D,
    slots: readonly Slot[],
    timeMs: number
  ): void {
    if (this.degradation?.particles_enabled === false) {
      return;
    }

    this.particles = updateParticles(this.particles);
    rs.drawParticles(ctx, this.particles);

    if (this.wrongItemId) {
      const elapsed = timeMs - this.wrongTimestamp;
      if (elapsed < 400) {
        const idx = this.displayOptions.findIndex(
          (o) => o.item_id === this.wrongItemId
        );
        const slot = slots[idx];
        if (slot) {
          const shakeX = Math.sin(elapsed * 0.05) * 4;
          rs.drawScaffoldingHighlight(
            ctx,
            slot.x + shakeX,
            slot.y,
            Math.min(slot.hitW, slot.hitH) / 2 + 4,
            (elapsed % 1000) / 1000
          );
        }
      }
    }
  }
}

export default GT001Session;
