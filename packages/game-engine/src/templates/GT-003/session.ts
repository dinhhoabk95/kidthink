import type { AgeBand } from "#src/contracts/types";
import {
  type ActionResult,
  type GameAction,
  TemplateGameSession,
} from "#src/game-session";
import type { EngineView, Gesture, ViewEntity } from "#src/interaction";
import {
  CONTENT_TOP_PX,
  SAFE_MARGIN_PX,
  SLOT_GAP_PX,
} from "#src/layout/constants";
import { isPointInSlot, TAP_TOLERANCE_PX } from "#src/layout/hit-test";
import { resolveLayout } from "#src/layout/registry";
import type { LayoutId, Slot } from "#src/layout/types";
import { PlacementMechanic } from "#src/mechanics/placement-mechanic";
import {
  type ContainerBox,
  drawContainerTarget,
  drawPromptText,
  drawSceneBackground,
  drawSlotItem,
  type ItemVisualState,
  spawnParticlesAtSlot,
  updateParticles,
} from "#src/render/index.js";
import { deriveStream } from "#src/rng/mulberry32";
import { shuffle } from "#src/rng/shuffle";
import type { DegradationState } from "#src/systems/degradation";
import type { Particle, RenderSystem } from "#src/systems/render-system";
import type { GT003Content, GT003Difficulty } from "./template.js";

type DraggableItem = GT003Content["items"][number];

/**
 * Vật thả trượt trôi về chỗ cũ trong 260ms (`GT-003.md` §4 N4). Hết nhịp đó,
 * vật trở lại trung tính: dấu sai KHÔNG ở lại trên màn (Montessori).
 */
const WRONG_FEEDBACK_MS = 260;

/** Đích chứa phải rộng hơn vật rõ ràng (`GT-003.md` §10, §14). */
const CONTAINER_WIDTH_PER_ITEM = 2.2;
const CONTAINER_HEIGHT_PER_ITEM = 1.5;
const CONTAINER_MIN_W = 260;
const CONTAINER_MIN_H = 150;

export class GT003Session extends TemplateGameSession<
  GT003Content,
  GT003Difficulty
> {
  displayItems: readonly DraggableItem[] = [];
  private readonly mechanic = new PlacementMechanic();
  degradation: DegradationState | null = null;
  private particles: Particle[] = [];
  private itemStates: Map<string, ItemVisualState> = new Map();
  /** item_id -> mili-giây còn lại của nhịp phản hồi "thả trượt". */
  private readonly transientStateMs: Map<string, number> = new Map();
  hoveredContainer = false;

  setupEntities(): void {
    this.mechanic.reset();
    this.isWon = false;
    this.particles = [];
    this.itemStates = new Map();
    this.transientStateMs.clear();
    this.hoveredContainer = false;
    // Vị trí xuất phát đổi theo seed mỗi lượt chơi (`GT-003.md` §4 N7, §5/8).
    // Không xáo thì đáp án đứng nguyên chỗ cũ và trẻ học vị trí, không học
    // thuộc tính.
    this.displayItems =
      this.difficulty.shuffle_items === false
        ? [...this.content.items]
        : shuffle(this.content.items, deriveStream(this.layoutSeed, "items"));
  }

  /**
   * Bố cục chọn theo khung nhìn, trong hai bố cục `template.ts` khai:
   * màn cao hơn rộng thì xếp nguồn–đích theo chiều ngang, vì một hàng 6 vật
   * không vừa bề ngang 540px.
   */
  private resolveLayoutId(): LayoutId {
    return this.logicSpace.h > this.logicSpace.w
      ? "left-source-right-target"
      : "top-source-bottom-target";
  }

  protected computeSlots(ageBand: AgeBand): readonly Slot[] {
    const layoutFn = resolveLayout(this.resolveLayoutId());
    // `slotCount` của bố cục lưỡng phân là số slot **nguồn**, còn `targetCount`
    // là số slot đích — layout tự cộng hai vế. GT-003 luôn có đúng một đích.
    return layoutFn({
      slotCount: this.displayItems.length,
      ageBand,
      targetCount: 1,
      logic: this.logicSpace,
    });
  }

  private getTargetSlot(): Slot | undefined {
    return this.targetSlots[0] ?? this.slots.at(-1);
  }

  private getSourceSlot(index: number): Slot | undefined {
    return this.sourceSlots[index] ?? this.slots[index];
  }

  /**
   * Hộp vẽ **và** hộp chạm của đích chứa — một nguồn duy nhất.
   *
   * Slot đích do bố cục cấp có cùng cỡ với slot nguồn, nên vẽ đúng cỡ slot thì
   * cái chứa nhỏ hơn cái được bỏ vào. Hộp này nở ra tới sát vùng an toàn,
   * nhưng cấm — NEVER lấn sang vùng nguồn: lấn là chạm nhầm.
   */
  getContainerBox(): ContainerBox | null {
    const slot = this.getTargetSlot();
    if (!slot) {
      return null;
    }

    const sources = this.sourceSlots.length ? this.sourceSlots : [];
    const itemW = Math.max(slot.w, ...sources.map((s) => s.w));
    const itemH = Math.max(slot.h, ...sources.map((s) => s.h));

    const srcBottom = sources.length
      ? Math.max(...sources.map((s) => s.y + s.h / 2))
      : CONTENT_TOP_PX;
    const srcRight = sources.length
      ? Math.max(...sources.map((s) => s.x + s.w / 2))
      : SAFE_MARGIN_PX;

    const topLimit =
      slot.y > srcBottom ? srcBottom + SLOT_GAP_PX : CONTENT_TOP_PX;
    const leftLimit =
      slot.x > srcRight ? srcRight + SLOT_GAP_PX : SAFE_MARGIN_PX;

    const maxW =
      2 *
      Math.min(slot.x - leftLimit, this.logicSpace.w - SAFE_MARGIN_PX - slot.x);
    const maxH =
      2 *
      Math.min(slot.y - topLimit, this.logicSpace.h - SAFE_MARGIN_PX - slot.y);

    const w = Math.max(
      slot.hitW,
      Math.min(
        Math.max(CONTAINER_MIN_W, itemW * CONTAINER_WIDTH_PER_ITEM),
        maxW
      )
    );
    const h = Math.max(
      slot.hitH,
      Math.min(
        Math.max(CONTAINER_MIN_H, itemH * CONTAINER_HEIGHT_PER_ITEM),
        maxH
      )
    );

    return { x: slot.x, y: slot.y, w, h };
  }

  /** Cùng hình học chạm cho `toAction()` và cho bề mặt web (`hitShape`). */
  private isPointInContainer(x: number, y: number): boolean {
    const box = this.getContainerBox();
    if (!box) {
      return false;
    }
    const boxSlot: Slot = {
      index: -1,
      x: box.x,
      y: box.y,
      w: box.w,
      h: box.h,
      hitW: box.w,
      hitH: box.h,
      page: 0,
      role: "target",
    };
    return isPointInSlot(boxSlot, x, y, "square", TAP_TOLERANCE_PX);
  }

  /** Chỉ số vật **chưa bỏ vào rổ** trúng điểm chạm, `-1` nếu không có. */
  private findLooseItemIndex(x: number, y: number): number {
    const placements = this.mechanic.getPlacements();
    for (let i = 0; i < this.displayItems.length; i++) {
      const slot = this.getSourceSlot(i);
      const item = this.displayItems[i];
      if (!(slot && item) || placements.has(item.item_id)) {
        continue;
      }
      // Vật vẽ bằng `drawSlotItem(..., "circle")` nên vùng chạm cũng tròn.
      if (isPointInSlot(slot, x, y, "circle", TAP_TOLERANCE_PX)) {
        return i;
      }
    }
    return -1;
  }

  setItemState(itemId: string, state: ItemVisualState): void {
    this.itemStates.set(itemId, state);
  }

  getItemState(itemId: string): ItemVisualState {
    const stagedId = this.mechanic.getStagedItemId();
    if (stagedId === itemId) {
      return "selected";
    }
    return this.itemStates.get(itemId) ?? "idle";
  }

  stageItem(itemId: string | null): void {
    this.mechanic.stageItem(itemId);
    // Chạm vật lần 1 bật luôn trạng thái "đích đang nhận" — đường chạm-chạm
    // dùng chung trạng thái với đường kéo (`GT-003.md` §12).
    this.hoveredContainer = itemId !== null;
  }

  getStagedItemId(): string | null {
    return this.mechanic.getStagedItemId();
  }

  /** Bề mặt chơi gọi khi ngón tay đi ngang qua đích trong lúc kéo. */
  setPointerOver(x: number, y: number): void {
    this.hoveredContainer =
      this.getStagedItemId() !== null || this.isPointInContainer(x, y);
  }

  getContainerId(): string {
    return this.content.container.container_id;
  }

  getPlacements(): ReadonlyMap<string, string> {
    return this.mechanic.getPlacements();
  }

  private resolveDrop(itemId: string, containerId: string) {
    if (containerId !== this.content.container.container_id) {
      return;
    }
    return this.content.items.find((i) => i.item_id === itemId);
  }

  validateAction(action: GameAction): ActionResult {
    const items = this.content.items.map((i) => ({
      id: i.item_id,
      targetId: this.content.container.container_id,
      isCorrect: i.is_correct,
    }));
    return this.mechanic.validate(
      action,
      items,
      (cId) => cId === this.content.container.container_id
    );
  }

  onItemDropped(itemId: string, containerId: string): void {
    const item = this.resolveDrop(itemId, containerId);
    if (!item) {
      return;
    }
    // Vật đã nằm trong rổ thì cú thả thứ hai không phải một lượt trả lời: ghi
    // event lần nữa là thổi phồng telemetry, và `scaffolding.onSuccess()` của
    // bề mặt sẽ hạ thang trợ giúp về L0 nên gợi ý không bao giờ leo lên.
    if (this.mechanic.getPlacements().has(itemId)) {
      return;
    }

    this.recordEvent("item_dropped", {
      item_id: itemId,
      container_id: containerId,
      is_correct: item.is_correct,
    });

    if (item.is_correct) {
      this.mechanic.place(itemId, containerId);
      this.setItemState(itemId, "correct");
      this.transientStateMs.delete(itemId);
      this.spawnSuccessParticles(itemId);
      if (this.checkWinCondition()) {
        this.winSession();
      }
    } else {
      this.setItemState(itemId, "wrong");
      this.transientStateMs.set(itemId, WRONG_FEEDBACK_MS);
    }
  }

  /**
   * Hạt mừng ở chỗ vật rời đi và ở rổ. Máy yếu thì cấm — NEVER sinh: mô phỏng
   * hạt rồi không vẽ vẫn tốn đúng số phép tính đã định bỏ.
   */
  private spawnSuccessParticles(itemId: string): void {
    if (this.degradation?.particles_enabled === false) {
      return;
    }
    const index = this.displayItems.findIndex((i) => i.item_id === itemId);
    const sourceSlot = this.getSourceSlot(index);
    if (sourceSlot) {
      this.particles.push(...spawnParticlesAtSlot(sourceSlot, 6));
    }
    const containerSlot = this.getTargetSlot();
    if (containerSlot) {
      this.particles.push(...spawnParticlesAtSlot(containerSlot, 8));
    }
  }

  /** Nhịp hổ phách tắt sau `WRONG_FEEDBACK_MS`; vật về trung tính. */
  update(deltaMs: number): void {
    for (const [itemId, remaining] of [...this.transientStateMs]) {
      const next = remaining - deltaMs;
      if (next <= 0) {
        this.transientStateMs.delete(itemId);
        if (this.itemStates.get(itemId) === "wrong") {
          this.itemStates.delete(itemId);
        }
      } else {
        this.transientStateMs.set(itemId, next);
      }
    }
    this.particles = updateParticles(this.particles);
  }

  private toSpokenLabel(item: DraggableItem): string | undefined {
    if (item.label) {
      return item.label;
    }
    return item.asset.kind === "text" ? item.asset.text : undefined;
  }

  private toGlyph(item: DraggableItem): string | undefined {
    return item.asset.kind === "emoji" ? item.asset.ref : undefined;
  }

  private toSpokenAudioPath(item: DraggableItem): string | undefined {
    return item.asset.kind === "image" ? undefined : item.asset.audio_path;
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

    for (let i = 0; i < this.displayItems.length; i++) {
      const item = this.displayItems[i];
      const slot = this.getSourceSlot(i);
      if (!(item && slot)) {
        continue;
      }
      const rawState = this.getItemState(item.item_id);
      const state = stateMap[rawState] ?? "idle";
      entities.push({
        id: item.item_id,
        slotIndex: i,
        role: "source",
        state,
        x: slot.x,
        y: slot.y,
        w: slot.w,
        h: slot.h,
        label: item.label,
        spokenLabel: this.toSpokenLabel(item),
        spokenAudioPath: this.toSpokenAudioPath(item),
        glyph: this.toGlyph(item),
      });
    }

    const box = this.getContainerBox();
    if (box) {
      entities.push({
        id: this.content.container.container_id,
        slotIndex: this.slots.length - 1,
        role: "target",
        state: this.containerState(),
        x: box.x,
        y: box.y,
        w: box.w,
        h: box.h,
        // Khay là hình chữ nhật: bề mặt phải chạm theo hộp, không theo đường
        // tròn nội tiếp, nếu không sẽ có vành chạm được mà không đọc tên.
        hitShape: "square",
        label: this.content.container.label,
        spokenLabel: this.content.container.label,
      });
    }

    return {
      entities,
      activePrompt: this.content.prompt,
    };
  }

  private containerState(): "idle" | "selected" | "correct" {
    if (this.isWon) {
      return "correct";
    }
    return this.hoveredContainer ? "selected" : "idle";
  }

  private toDropAction(
    gesture: Extract<Gesture, { type: "drop" }>
  ): GameAction | null {
    const index = this.findLooseItemIndex(gesture.fromX, gesture.fromY);
    const draggedItem = index >= 0 ? this.displayItems[index] : null;
    if (!draggedItem) {
      return null;
    }

    if (!this.isPointInContainer(gesture.toX, gesture.toY)) {
      // Thả ra vùng trống: không sinh action, nên không tính một lần sai
      // (`BR-E003-02`).
      return null;
    }

    return {
      type: "drop_item",
      data: {
        item_id: draggedItem.item_id,
        container_id: this.content.container.container_id,
      },
    };
  }

  private toTapAction(
    gesture: Extract<Gesture, { type: "tap" }>
  ): GameAction | null {
    if (this.isPointInContainer(gesture.x, gesture.y)) {
      const stagedId = this.getStagedItemId();
      if (stagedId) {
        return {
          type: "tap_tap_item",
          data: {
            item_id: stagedId,
            container_id: this.content.container.container_id,
          },
        };
      }
      return null;
    }

    const index = this.findLooseItemIndex(gesture.x, gesture.y);
    const item = index >= 0 ? this.displayItems[index] : null;
    if (item) {
      this.stageItem(
        this.getStagedItemId() === item.item_id ? null : item.item_id
      );
    }
    return null;
  }

  override toAction(gesture: Gesture): GameAction | null {
    if (gesture.type === "drop") {
      return this.toDropAction(gesture);
    }
    if (gesture.type === "tap") {
      return this.toTapAction(gesture);
    }
    return null;
  }

  override getHintTargetIndex(): number | null {
    const placed = this.mechanic.getPlacements();
    const idx = this.displayItems.findIndex(
      (it) => it.is_correct && !placed.has(it.item_id)
    );
    return idx >= 0 ? idx : null;
  }

  override commit(action: GameAction): void {
    if (
      (action.type === "drop_item" || action.type === "tap_tap_item") &&
      action.data &&
      typeof action.data === "object"
    ) {
      const data = action.data as {
        item_id?: string;
        container_id?: string;
      };
      if (data.item_id && data.container_id) {
        this.onItemDropped(data.item_id, data.container_id);
        this.stageItem(null);
      }
    }
  }

  override checkWinCondition(): boolean {
    const items = this.content.items
      .filter((i) => i.is_correct)
      .map((i) => ({
        id: i.item_id,
        targetId: this.content.container.container_id,
        isCorrect: true,
      }));
    return this.mechanic.isPlacementComplete(items);
  }

  render(
    ctx: CanvasRenderingContext2D,
    rs: RenderSystem,
    _timeMs: number
  ): void {
    drawSceneBackground(ctx, rs, this.themeId);
    drawPromptText(ctx, rs, this.content.prompt);
    this.drawContainer(rs, ctx);
    this.drawInteractive(rs, ctx);
    this.drawFeedback(rs, ctx);
  }

  private drawContainer(rs: RenderSystem, ctx: CanvasRenderingContext2D): void {
    const box = this.getContainerBox();
    if (!box) {
      return;
    }
    const placements = this.mechanic.getPlacements();
    const placedItems = this.content.items.filter((i) =>
      placements.has(i.item_id)
    );

    drawContainerTarget(ctx, rs, box, {
      label: this.content.container.label,
      placedItems,
      // Số trên rổ là số vật thật sự phải bỏ vào — cùng một số với điều kiện
      // thắng. `target_count` chỉ là bản sao trong `difficulty_params`.
      targetCount: this.content.items.filter((i) => i.is_correct).length,
      isHovered: this.hoveredContainer,
    });
  }

  private drawInteractive(
    rs: RenderSystem,
    ctx: CanvasRenderingContext2D
  ): void {
    const placements = this.mechanic.getPlacements();

    for (let i = 0; i < this.displayItems.length; i++) {
      const item = this.displayItems[i];
      const slot = this.getSourceSlot(i);
      if (!(slot && item)) {
        continue;
      }
      const isPlaced = placements.has(item.item_id);
      const state = isPlaced ? "locked" : this.getItemState(item.item_id);

      ctx.save();
      if (isPlaced) {
        ctx.globalAlpha = 0.35;
      }
      drawSlotItem(
        ctx,
        rs,
        slot,
        {
          id: item.item_id,
          asset: item.asset,
          state,
        },
        "circle"
      );
      ctx.restore();
    }
  }

  private drawFeedback(rs: RenderSystem, ctx: CanvasRenderingContext2D): void {
    if (this.degradation?.particles_enabled === false) {
      return;
    }
    rs.drawParticles(ctx, this.particles);
  }
}

export default GT003Session;
