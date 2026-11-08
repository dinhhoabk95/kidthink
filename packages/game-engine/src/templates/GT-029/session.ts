import type { AgeBand } from "#src/contracts/types";
import {
  ACTION_CORRECT,
  ACTION_IGNORED,
  ACTION_RETRY,
  type ActionResult,
  type GameAction,
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
  resolveAssetSpeech,
} from "#src/labels/spoken-keyword";
import { resolveTouchFloor } from "#src/layout/constants";
import { isPointInSlot, TAP_TOLERANCE_PX } from "#src/layout/hit-test";
import { resolveLayout } from "#src/layout/registry";
import {
  dockRectAroundSlots,
  insetDrawSize,
  legacyStageArea,
  splitCaption,
} from "#src/layout/slot-fit";
import type { ZoneRect } from "#src/layout/stage-zones";
import type { Slot } from "#src/layout/types";
import {
  catMouthOpen,
  drawCat,
  drawProgressDots,
  drawSceneBackground,
  drawSlotItem,
  drawWoodenTokenDock,
  groupSlidePose,
  type ItemVisualState,
  spawnParticlesAtSlot,
  updateParticles,
} from "#src/render/index.js";
import type { MascotPose } from "#src/render/mascot";
import { deriveDerangement } from "#src/rng/derangement";
import { deriveStream } from "#src/rng/mulberry32";
import type { DegradationState } from "#src/systems/degradation";
import type { Particle, RenderSystem } from "#src/systems/render-system";
import { WrongFlash } from "#src/systems/wrong-flash";
import type { GT029Content, GT029Difficulty } from "./template.js";
import {
  computePackedItemsAndOptions,
  layoutOptionSlots,
  splitItemsAndOptions,
} from "./zone-layout.js";

interface GT029ActionPayload {
  item_id?: string;
  id?: string;
  option_id?: string;
  value?: number;
}

/** Khung chuyện đọc một lần ở vòng đầu (`BR-E029-06`, `BR-FBK-16`). */
export const GT029_STORY_LINE =
  "Mèo Mướp đói bụng rồi, bé bớt đồ ăn cho Mèo rồi đếm xem còn lại mấy nhé!";

/** Mascot reo ngắn khi Mèo ăn một vật (`BR-E029-06`). */
export const GT029_MUNCH_MS = 1000;
/** Mascot nghiêng đầu sau đáp án chưa đúng. */
export const GT029_WONDER_MS = 1500;

/** Nửa bề ngang/dọc chiếm chỗ của slot: lấy cạnh lớn hơn giữa ô vẽ và vùng chạm. */
function halfW(slot: Slot): number {
  return Math.max(slot.w, slot.hitW) / 2;
}

function halfH(slot: Slot): number {
  return Math.max(slot.h, slot.hitH) / 2;
}

/** Hộp chiếm chỗ (ô vẽ lẫn vùng chạm) của một slot, dạng mép trái/phải/trên/dưới. */
interface Edges {
  left: number;
  right: number;
  top: number;
  bottom: number;
}

function slotEdges(slot: Slot): Edges {
  return {
    left: slot.x - halfW(slot),
    right: slot.x + halfW(slot),
    top: slot.y - halfH(slot),
    bottom: slot.y + halfH(slot),
  };
}

function edgesOf(slots: readonly Slot[]): Edges {
  const all = slots.map(slotEdges);
  return {
    left: Math.min(...all.map((e) => e.left)),
    right: Math.max(...all.map((e) => e.right)),
    top: Math.min(...all.map((e) => e.top)),
    bottom: Math.max(...all.map((e) => e.bottom)),
  };
}

function rectEdges(rect: ZoneRect): Edges {
  return {
    left: rect.x,
    right: rect.x + rect.w,
    top: rect.y,
    bottom: rect.y + rect.h,
  };
}

/**
 * Hai hộp chồng hoặc chạm mép nhau. Chạm mép cũng tính: dock giáp sát ô nhóm thì
 * mất khe thấy được, phải tách dock như khi chồng.
 */
function edgesTouch(a: Edges, b: Edges): boolean {
  return (
    a.left <= b.right &&
    b.left <= a.right &&
    a.top <= b.bottom &&
    b.top <= a.bottom
  );
}

/**
 * Cắt dock của một khối vật bớt tại **giữa khe** giữa nó và các ô kề bên
 * (`BR-E029-09`): ô nhóm cùng hàng cắt theo chiều ngang, ô ở hàng kề
 * cắt theo chiều dọc. Cắt ở giữa khe (không phải sát mép ô nhóm) nên dock luôn
 * ôm trọn ô bớt, luôn có bề rộng dương và còn khoảng hở thấy được với nhóm.
 */
function trimDockAroundGroup(
  dock: ZoneRect,
  removed: readonly Slot[],
  groupSlots: readonly Slot[]
): ZoneRect {
  const inner = edgesOf(removed);
  const out = rectEdges(dock);
  for (const slot of groupSlots) {
    const g = slotEdges(slot);
    // Hàng xóm cùng dải ngang thì cắt trái/phải; cùng dải dọc thì cắt trên/dưới.
    // Không đòi chồng thật: dock chỉ chạm mép ô kề bên cũng phải lùi về giữa khe.
    const sameRow = g.top < out.bottom && out.top < g.bottom;
    const sameColumn = g.left < out.right && out.left < g.right;
    if (sameRow && g.right <= inner.left) {
      out.left = Math.max(out.left, (g.right + inner.left) / 2);
    } else if (sameRow && g.left >= inner.right) {
      out.right = Math.min(out.right, (g.left + inner.right) / 2);
    } else if (sameColumn && g.bottom <= inner.top) {
      out.top = Math.max(out.top, (g.bottom + inner.top) / 2);
    } else if (sameColumn && g.top >= inner.bottom) {
      out.bottom = Math.min(out.bottom, (g.top + inner.bottom) / 2);
    }
  }
  // Làm tròn từng mép (không làm tròn rộng/cao riêng) để hai dock giáp khe không lấn nhau 1 px.
  const left = Math.ceil(out.left);
  const top = Math.ceil(out.top);
  return {
    x: left,
    y: top,
    w: Math.floor(out.right) - left,
    h: Math.floor(out.bottom) - top,
  };
}

export class GT029Session extends TemplateGameSession<
  GT029Content,
  GT029Difficulty
> {
  override readonly usesPromptZone = true;

  degradation: DegradationState | null = null;
  removedItemIds: Set<string> = new Set();
  selectedOptionId: string | null = null;
  isWin = false;

  /** Thứ tự bày vật: content, hoặc hoán vị không động theo seed khi `shuffle_items` bật (`BR-E029-07`). */
  private items: GT029Content["initial_items"] = this.content.initial_items;
  private lastFrameMs = 0;
  /** Ô lưới mỗi vật đang hướng tới; đổi ô thì nhóm trượt (`BR-E029-10`). */
  private readonly itemCellTo = new Map<string, number>();
  /** Chỗ vẽ ban đầu của vật vừa đổi ô, tính tới `slideStartMs`. */
  private readonly itemSlideFrom = new Map<
    string,
    { readonly x: number; readonly y: number }
  >();
  private slideStartMs = 0;
  /** Đồng hồ khung lúc Mèo ngoạm vật gần nhất (`BR-E029-11`). */
  private lastBiteMs = Number.NEGATIVE_INFINITY;
  private readonly wrongOptionFlash = new WrongFlash();
  private wrongItemId: string | null = null;
  private readonly wrongItemFlash = new WrongFlash();
  private particles: Particle[] = [];
  private reactionPose: MascotPose | null = null;
  private reactionRemainingMs = 0;

  private react(pose: MascotPose, ms: number): void {
    this.reactionPose = pose;
    this.reactionRemainingMs = ms;
  }

  override storyLine(): string {
    return GT029_STORY_LINE;
  }

  /** Reo khi Mèo ăn một vật, nghiêng đầu sau đáp án chưa đúng (`BR-E029-06`). */
  override mascotMood(): MascotPose | null {
    return this.reactionRemainingMs > 0 && !this.isWon
      ? this.reactionPose
      : null;
  }

  update(deltaMs: number): void {
    if (this.reactionRemainingMs > 0) {
      this.reactionRemainingMs = Math.max(
        0,
        this.reactionRemainingMs - deltaMs
      );
    }
    this.lastFrameMs += deltaMs;
    this.expireWrongFlashes(this.lastFrameMs);
  }

  /** Hết nhịp sai thì ô đáp án/vật về trung tính (cùng đồng hồ khung với lúc kích). */
  private expireWrongFlashes(nowMs: number): void {
    if (this.wrongOptionFlash.hasExpired(nowMs)) {
      this.wrongOptionFlash.clear();
      this.selectedOptionId = null;
    }
    if (this.wrongItemFlash.hasExpired(nowMs)) {
      this.wrongItemFlash.clear();
      this.wrongItemId = null;
    }
  }

  setupEntities(): void {
    this.removedItemIds.clear();
    this.itemSlideFrom.clear();
    this.slideStartMs = 0;
    this.lastBiteMs = Number.NEGATIVE_INFINITY;
    this.items =
      this.difficulty.shuffle_items === true &&
      this.content.initial_items.length > 1
        ? deriveDerangement(
            this.content.initial_items,
            deriveStream(this.layoutSeed, "items")
          )
        : this.content.initial_items;
    this.itemCellTo.clear();
    this.items.forEach((it, i) => {
      this.itemCellTo.set(it.item_id, i);
    });
    this.selectedOptionId = null;
    this.isWin = false;
    this.particles = [];
    this.reactionPose = null;
    this.reactionRemainingMs = 0;
    this.recordEvent("game_started", {
      template_code: "GT-029",
      initial_count: this.items.length,
      remove_count: this.content.remove_count,
    });
  }

  /**
   * Ô lưới của vật `itemIndex` (`BR-E029-03`): vật còn trong nhóm dồn về đầu lưới
   * theo thứ tự gốc, vật đã bớt rời sang cuối lưới theo thứ tự bớt — nhóm co lại
   * thật và phần bớt nằm riêng, không đứng nguyên tại chỗ.
   */
  private itemCellIndex(itemIndex: number): number {
    const items = this.items;
    const item = items[itemIndex];
    if (!item) {
      return itemIndex;
    }
    const removedOrder = [...this.removedItemIds];
    const removedRank = removedOrder.indexOf(item.item_id);
    if (removedRank >= 0) {
      return items.length - 1 - removedRank;
    }
    let remainingRank = 0;
    for (let i = 0; i < itemIndex; i++) {
      const other = items[i];
      if (other && !this.removedItemIds.has(other.item_id)) {
        remainingRank++;
      }
    }
    return remainingRank;
  }

  /**
   * Vật đổi ô thì ghi lại chỗ cũ và mốc đồng hồ khung để `renderItems` trượt từ
   * đó (`BR-E029-10`). Gọi ngay sau khi tập vật bớt đổi và đầu mỗi khung.
   */
  private syncSlide(): void {
    const moved: [string, number, number][] = [];
    this.items.forEach((it, i) => {
      const cell = this.itemCellIndex(i);
      const prev = this.itemCellTo.get(it.item_id) ?? cell;
      if (cell !== prev) {
        moved.push([it.item_id, prev, cell]);
      }
    });
    if (moved.length === 0) {
      return;
    }
    this.itemSlideFrom.clear();
    for (const [id, prev, cell] of moved) {
      const from = this.slots[prev];
      if (from) {
        this.itemSlideFrom.set(id, { x: from.x, y: from.y });
      }
      this.itemCellTo.set(id, cell);
    }
    this.slideStartMs = this.lastFrameMs;
  }

  private itemSlotFor(itemIndex: number): Slot | undefined {
    return this.slots[this.itemCellIndex(itemIndex)];
  }

  override getHintTargetIndex(): number | null {
    if (this.isWin || this.isWon) {
      return null;
    }
    const totalItems = this.items.length;
    if (this.removedItemIds.size < this.content.remove_count) {
      const unremovedIdx = this.items.findIndex(
        (it) => !this.removedItemIds.has(it.item_id)
      );
      return unremovedIdx >= 0 ? this.itemCellIndex(unremovedIdx) : null;
    }
    const correctOptIdx = this.content.answer_options.findIndex(
      (opt) => opt.is_correct
    );
    if (correctOptIdx >= 0) {
      return totalItems + correctOptIdx;
    }
    return null;
  }

  protected computeSlots(band: AgeBand): readonly Slot[] {
    const totalItems = this.items.length;
    const optionCount = this.content.answer_options.length;
    const params = {
      ageBand: band,
      logic: this.logicSpace,
      cssPerLogic: this.cssPerLogic,
    };
    const areas = splitItemsAndOptions(
      this.stageRect ?? legacyStageArea(this.logicSpace),
      optionCount,
      params
    );

    const gridFn = resolveLayout("grid");
    const itemSlots = gridFn({
      slotCount: totalItems,
      ageBand: band,
      logic: this.logicSpace,
      cssPerLogic: this.cssPerLogic,
      stage: areas.items,
    });
    const optionSlots = layoutOptionSlots(areas, optionCount, params).map(
      (slot, i) => ({ ...slot, index: totalItems + i })
    );

    if (this.stageRect && itemSlots.some((slot) => slot.page !== 0)) {
      return insetDrawSize(
        computePackedItemsAndOptions(
          this.stageRect,
          totalItems,
          optionCount,
          resolveTouchFloor(band, this.cssPerLogic)
        ),
        this.stageRect
      );
    }
    return insetDrawSize([...itemSlots, ...optionSlots], this.stageRect);
  }

  private handleItemRemoval(itemId: string): ActionResult {
    const itemExists = this.items.some((it) => it.item_id === itemId);
    if (!itemExists) {
      return ACTION_IGNORED;
    }

    if (this.removedItemIds.has(itemId)) {
      this.removedItemIds.delete(itemId);
      this.syncSlide();
      this.selectedOptionId = null;
      this.recordEvent("item_restored", {
        item_id: itemId,
        removed_count: this.removedItemIds.size,
        remaining_needed: this.content.remove_count - this.removedItemIds.size,
      });
      return ACTION_CORRECT;
    }

    if (this.removedItemIds.size >= this.content.remove_count) {
      this.wrongItemId = itemId;
      this.wrongItemFlash.trigger(this.lastFrameMs);
      return ACTION_RETRY;
    }

    this.removedItemIds.add(itemId);
    this.syncSlide();
    this.lastBiteMs = this.lastFrameMs;
    this.queueSfx("cat_munch");
    this.react("cheer", GT029_MUNCH_MS);
    this.recordEvent("item_removed", {
      item_id: itemId,
      removed_count: this.removedItemIds.size,
      target_remove_count: this.content.remove_count,
    });

    return ACTION_CORRECT;
  }

  private handleOptionSelection(data: GT029ActionPayload): ActionResult {
    const optionId =
      data.option_id ??
      data.id ??
      (data.value === undefined ? "" : `opt_${data.value}`);

    const option = this.content.answer_options.find(
      (o) =>
        o.option_id === optionId ||
        (data.value !== undefined && o.value === data.value)
    );

    if (!option) {
      return ACTION_IGNORED;
    }

    if (this.removedItemIds.size < this.content.remove_count) {
      return ACTION_RETRY;
    }

    this.selectedOptionId = option.option_id;
    this.recordEvent("answer_selected", {
      option_id: option.option_id,
      value: option.value,
      is_correct: option.is_correct,
    });

    if (option.is_correct) {
      this.isWin = true;
      this.isWon = true;
      const optIndex = this.content.answer_options.indexOf(option);
      const slot = this.slots[this.items.length + optIndex];
      if (slot) {
        this.particles.push(...spawnParticlesAtSlot(slot, 12));
      }
      this.recordEvent("game_completed", { score: 100 });
      this.winSession();
      return ACTION_CORRECT;
    }

    this.wrongOptionFlash.trigger(this.lastFrameMs);
    this.react("wonder", GT029_WONDER_MS);
    return ACTION_RETRY;
  }

  private validateItemRemovalAction(data: GT029ActionPayload): ActionResult {
    const itemId = data.item_id ?? data.id;
    if (!itemId) {
      return ACTION_IGNORED;
    }
    const itemExists = this.items.some((it) => it.item_id === itemId);
    if (!itemExists) {
      return ACTION_IGNORED;
    }
    if (this.removedItemIds.has(itemId)) {
      return ACTION_CORRECT;
    }
    if (this.removedItemIds.size >= this.content.remove_count) {
      return ACTION_RETRY;
    }
    return ACTION_CORRECT;
  }

  private validateOptionSelectionAction(
    data: GT029ActionPayload
  ): ActionResult {
    const optionId =
      data.option_id ??
      data.id ??
      (data.value === undefined ? "" : `opt_${data.value}`);

    const option = this.content.answer_options.find(
      (o) =>
        o.option_id === optionId ||
        (data.value !== undefined && o.value === data.value)
    );

    if (!option) {
      return ACTION_IGNORED;
    }

    if (this.removedItemIds.size < this.content.remove_count) {
      return ACTION_RETRY;
    }

    return option.is_correct ? ACTION_CORRECT : ACTION_RETRY;
  }

  validateAction(action: GameAction): ActionResult {
    if (this.isWin || this.isWon) {
      return ACTION_IGNORED;
    }

    const type = action.type;
    const data = (
      typeof action.data === "object" && action.data !== null ? action.data : {}
    ) as GT029ActionPayload;

    if (
      type === "remove_item" ||
      type === "tap_item" ||
      type === "select_item"
    ) {
      return this.validateItemRemovalAction(data);
    }

    if (type === "select_option" || type === "choose_answer") {
      return this.validateOptionSelectionAction(data);
    }

    return ACTION_IGNORED;
  }

  private findTappedOption(
    gesture: Extract<Gesture, { type: "tap" }>
  ): GameAction | null {
    if (this.removedItemIds.size < this.content.remove_count) {
      return null;
    }
    const totalItems = this.items.length;
    for (let i = 0; i < this.content.answer_options.length; i++) {
      const slot = this.slots[totalItems + i];
      const opt = this.content.answer_options[i];
      if (!(slot && opt)) {
        continue;
      }
      if (
        isPointInSlot(slot, gesture.x, gesture.y, "square", TAP_TOLERANCE_PX)
      ) {
        return {
          type: "select_option",
          data: { option_id: opt.option_id, value: opt.value },
        };
      }
    }
    return null;
  }

  private findTappedItem(
    gesture: Extract<Gesture, { type: "tap" }>
  ): GameAction | null {
    const totalItems = this.items.length;
    for (let i = 0; i < totalItems; i++) {
      const slot = this.itemSlotFor(i);
      const item = this.items[i];
      if (!(slot && item)) {
        continue;
      }
      if (
        isPointInSlot(slot, gesture.x, gesture.y, "circle", TAP_TOLERANCE_PX)
      ) {
        return {
          type: "remove_item",
          data: { item_id: item.item_id },
        };
      }
    }
    return null;
  }

  private findDroppedItem(
    gesture: Extract<Gesture, { type: "drop" }>
  ): GameAction | null {
    const itemCount = this.items.length;
    for (let i = 0; i < itemCount; i++) {
      const slot = this.itemSlotFor(i);
      const item = this.items[i];
      if (!(slot && item)) {
        continue;
      }
      if (
        isPointInSlot(
          slot,
          gesture.fromX,
          gesture.fromY,
          "circle",
          TAP_TOLERANCE_PX
        )
      ) {
        const dragDist = Math.hypot(gesture.toX - slot.x, gesture.toY - slot.y);
        if (dragDist <= slot.w / 2) {
          return null;
        }
        return {
          type: "remove_item",
          data: { item_id: item.item_id },
        };
      }
    }
    return null;
  }

  override toAction(gesture: Gesture): GameAction | null {
    if (gesture.type === "drop") {
      return this.findDroppedItem(gesture);
    }
    if (gesture.type !== "tap") {
      return null;
    }

    return this.findTappedOption(gesture) ?? this.findTappedItem(gesture);
  }

  override commit(action: GameAction): void {
    const type = action.type;
    const data = (
      typeof action.data === "object" && action.data !== null ? action.data : {}
    ) as GT029ActionPayload;

    if (
      type === "remove_item" ||
      type === "tap_item" ||
      type === "select_item"
    ) {
      const itemId = data.item_id ?? data.id;
      if (typeof itemId === "string") {
        this.handleItemRemoval(itemId);
      }
      return;
    }

    if (type === "select_option" || type === "choose_answer") {
      this.handleOptionSelection(data);
    }
  }

  private getItemEntities(): ViewEntity[] {
    const totalItems = this.items.length;
    const entities: ViewEntity[] = [];

    for (let i = 0; i < totalItems; i++) {
      const it = this.items[i];
      const slot = this.itemSlotFor(i);
      if (!(it && slot)) {
        continue;
      }
      const isRemoved = this.removedItemIds.has(it.item_id);
      entities.push({
        id: it.item_id,
        slotIndex: slot.index,
        role: "source",
        state: isRemoved ? "selected" : "idle",
        x: slot.x,
        y: slot.y,
        w: slot.w,
        h: slot.h,
        ...resolveAssetSpeech(it.asset),
      });
    }
    return entities;
  }

  private getOptionEntities(): ViewEntity[] {
    if (this.removedItemIds.size < this.content.remove_count) {
      return [];
    }
    const totalItems = this.items.length;
    const entities: ViewEntity[] = [];

    for (let i = 0; i < this.content.answer_options.length; i++) {
      const opt = this.content.answer_options[i];
      const slot = this.slots[totalItems + i];
      if (!(opt && slot)) {
        continue;
      }
      const isSelected = this.selectedOptionId === opt.option_id;
      let state: EntityVisual = "idle";
      if (isSelected) {
        state = opt.is_correct ? "correct" : "incorrect";
      }
      entities.push({
        id: opt.option_id,
        slotIndex: slot.index,
        role: "target",
        state,
        x: slot.x,
        y: slot.y,
        w: slot.w,
        h: slot.h,
        hitShape: "square",
        ...resolveAssetLabels({ kind: "text", text: String(opt.value) }),
      });
    }
    return entities;
  }

  override getView(): EngineView {
    return {
      activePrompt: this.content.prompt,
      entities: [...this.getItemEntities(), ...this.getOptionEntities()],
    };
  }

  override checkWinCondition(): boolean {
    return this.isWin || this.isWon;
  }

  getRemovedCount(): number {
    return this.removedItemIds.size;
  }

  getRemainingCount(): number {
    return this.items.length - this.removedItemIds.size;
  }

  /**
   * Dock riêng của vật đã bớt (`BR-E029-09`). Một dock ôm mọi ô bớt khi nó
   * không đè nhóm còn lại. Lưới lẻ cột thì hàng đầu của phần bớt chia ô với
   * nhóm: tách thành hai dock — hàng chia ô và khối các hàng chỉ có vật bớt —
   * mỗi dock cắt tại giữa khe với nhóm và giữa khe với dock kia, nên vật bớt
   * luôn có dock, dock không đè nhóm và hai dock không chồng nhau.
   */
  getRemovedDockRects(): ZoneRect[] {
    const removedSlots: Slot[] = [];
    const groupSlots: Slot[] = [];
    this.items.forEach((it, i) => {
      const slot = this.itemSlotFor(i);
      if (slot) {
        (this.removedItemIds.has(it.item_id) ? removedSlots : groupSlots).push(
          slot
        );
      }
    });
    const whole = dockRectAroundSlots(removedSlots, this.stageRect);
    if (!whole) {
      return [];
    }
    if (!groupSlots.some((g) => edgesTouch(rectEdges(whole), slotEdges(g)))) {
      return [whole];
    }
    const groupRows = new Set(groupSlots.map((g) => g.y));
    const shared = removedSlots.filter((r) => groupRows.has(r.y));
    const rest = removedSlots.filter((r) => !groupRows.has(r.y));
    const parts = [shared, rest].filter((p) => p.length > 0);
    const docks: ZoneRect[] = [];
    for (const [k, part] of parts.entries()) {
      const dock = dockRectAroundSlots(part, this.stageRect);
      if (!dock) {
        continue;
      }
      // Phần bớt còn lại cũng là "hàng xóm" phải cắt khe, để hai dock không chồng.
      const other = parts[1 - k] ?? [];
      docks.push(trimDockAroundGroup(dock, part, [...groupSlots, ...other]));
    }
    return docks;
  }

  private renderItems(ctx: CanvasRenderingContext2D, rs: RenderSystem): void {
    for (const removedDock of this.getRemovedDockRects()) {
      drawWoodenTokenDock(ctx, rs, removedDock);
    }
    for (let i = 0; i < this.items.length; i++) {
      const it = this.items[i];
      const slot = this.itemSlotFor(i);
      if (!(it && slot)) {
        continue;
      }

      const isRemoved = this.removedItemIds.has(it.item_id);
      const from = this.itemSlideFrom.get(it.item_id);
      const pose = from
        ? groupSlidePose(
            from,
            slot,
            this.lastFrameMs - this.slideStartMs,
            rs.reducedMotion
          )
        : { x: slot.x, y: slot.y, scale: 1 };
      drawSlotItem(
        ctx,
        rs,
        pose.scale === 1 && pose.x === slot.x && pose.y === slot.y
          ? slot
          : {
              ...slot,
              x: pose.x,
              y: pose.y,
              w: slot.w * pose.scale,
              h: slot.h * pose.scale,
            },
        {
          id: it.item_id,
          asset: it.asset,
          state: isRemoved ? "locked" : "idle",
        },
        "circle"
      );
    }
  }

  private renderOptions(ctx: CanvasRenderingContext2D, rs: RenderSystem): void {
    const isReady = this.removedItemIds.size >= this.content.remove_count;

    drawWoodenTokenDock(
      ctx,
      rs,
      dockRectAroundSlots(this.slots.slice(this.items.length), this.stageRect)
    );

    for (let i = 0; i < this.content.answer_options.length; i++) {
      const opt = this.content.answer_options[i];
      const slot = this.slots[this.items.length + i];
      if (!(opt && slot)) {
        continue;
      }

      if (!isReady) {
        ctx.save();
        ctx.globalAlpha = 0.6;
        drawSlotItem(
          ctx,
          rs,
          slot,
          {
            id: opt.option_id,
            text: String(opt.value),
            state: "locked",
          },
          "square"
        );
        ctx.restore();
        continue;
      }

      const isSelected = this.selectedOptionId === opt.option_id;
      let optState: ItemVisualState = "idle";
      if (isSelected) {
        optState = opt.is_correct ? "correct" : "wrong";
      }

      drawSlotItem(
        ctx,
        rs,
        slot,
        {
          id: opt.option_id,
          text: String(opt.value),
          state: optState,
        },
        "square"
      );

      if (
        isSelected &&
        !opt.is_correct &&
        this.wrongOptionFlash.isActive(this.lastFrameMs)
      ) {
        const progress = this.wrongOptionFlash.progress(this.lastFrameMs);
        rs.drawRetryRing(
          ctx,
          slot.x,
          slot.y,
          Math.max(slot.w, slot.h) / 2 + 4,
          progress
        );
      }
    }
  }

  render(
    ctx: CanvasRenderingContext2D,
    rs: RenderSystem,
    timeMs: number
  ): void {
    this.lastFrameMs = timeMs;
    this.expireWrongFlashes(timeMs);
    drawSceneBackground(ctx, rs, this.themeId);

    const removedCount = this.removedItemIds.size;
    const targetRemove = this.content.remove_count;
    this.syncSlide();
    // Mèo Mướp ở cuối dải nhãn; hàng chấm nhường chỗ (`BR-E029-11`).
    const caption = this.stageRect
      ? splitCaption(this.stageRect).caption
      : undefined;
    const catSize = Math.min(40, (caption?.h ?? 44) - 4);
    const catCx = caption
      ? caption.x + caption.w - catSize / 2 - 6
      : rs.LOGIC_WIDTH - catSize / 2 - 12;
    const catCy = caption ? caption.y + caption.h / 2 : rs.LOGIC_HEIGHT * 0.12;
    // Không chữ: `-n` và n chấm lấp dần cho mỗi vật đã bớt (`BR-E029-05`).
    drawProgressDots(
      ctx,
      rs,
      {
        done: Math.min(removedCount, targetRemove),
        total: targetRemove,
        badge: `-${targetRemove}`,
      },
      caption
        ? { ...caption, w: Math.max(0, caption.w - catSize - 12) }
        : undefined
    );
    drawCat(
      ctx,
      catCx,
      catCy,
      catSize,
      catMouthOpen(timeMs - this.lastBiteMs, rs.reducedMotion)
    );

    this.renderItems(ctx, rs);

    if (this.wrongItemFlash.isActive(timeMs) && this.wrongItemId) {
      const itemIdx = this.items.findIndex(
        (it) => it.item_id === this.wrongItemId
      );
      const slot = this.itemSlotFor(itemIdx);
      if (slot) {
        const progress = this.wrongItemFlash.progress(timeMs);
        rs.drawRetryRing(
          ctx,
          slot.x,
          slot.y,
          Math.max(slot.w, slot.h) / 2 + 4,
          progress
        );
      }
    }

    this.renderOptions(ctx, rs);

    if (this.degradation?.particles_enabled !== false) {
      this.particles = updateParticles(this.particles);
      rs.drawParticles(ctx, this.particles);
    }
  }
}
