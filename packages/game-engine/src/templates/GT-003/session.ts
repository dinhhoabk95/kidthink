import type { AgeBand } from "#src/contracts/types";
import {
  ACTION_IGNORED,
  type ActionResult,
  type GameAction,
  type HintTarget,
  TemplateGameSession,
} from "#src/game-session";
import type { EngineView, Gesture, ViewEntity } from "#src/interaction";
import { resolveAssetLabels } from "#src/labels/spoken-keyword.js";
import { resolveTouchFloor } from "#src/layout/constants";
import { isPointInSlot, TAP_TOLERANCE_PX } from "#src/layout/hit-test";
import { resolveLayout } from "#src/layout/registry";
import type { ZoneRect } from "#src/layout/stage-zones";
import {
  computeStageTargetSlot,
  computeTraySourceSlots,
} from "#src/layout/tray-layout";
import type { LayoutId, Slot } from "#src/layout/types";
import { PlacementMechanic } from "#src/mechanics/placement-mechanic";
import {
  drawGT003BasketTarget,
  drawGT003SourceToken,
} from "#src/render/gt-003-shapes";
import {
  type ContainerBox,
  drawClippedToZone,
  drawSceneBackground,
  drawWoodenTokenDock,
  type ItemVisualState,
  spawnParticlesAtSlot,
} from "#src/render/index.js";
import type { MascotPose } from "#src/render/mascot";
import { deriveStream } from "#src/rng/mulberry32";
import { shuffle } from "#src/rng/shuffle";
import type { DegradationState } from "#src/systems/degradation";
import type { Particle, RenderSystem } from "#src/systems/render-system";
import { WrongFlashMap } from "#src/systems/wrong-flash";
import {
  computeGT003ContainerBox,
  extractGT003DropPayload,
  type GT003RenderItem,
  type GT003TokenVisualState,
  stepParticlesByDelta,
} from "./layout.js";
import type { GT003Content, GT003Difficulty } from "./template.js";

type DraggableItem = GT003Content["items"][number];

/** Khung chuyện đọc một lần ở vòng đầu (`BR-E003-08`, `BR-FBK-16`). */
export const GT003_STORY_LINE =
  "Gấu Con đang dọn nhà, bé giúp Gấu Con bỏ đồ vào đúng chỗ nhé!";

/** Vật thả trượt trôi về chỗ cũ trong 260ms (`GT-003.md` §4 N4). */
export const WRONG_FEEDBACK_MS = 260;

const VIEW_STATE_MAP: Readonly<
  Record<string, "idle" | "selected" | "correct" | "incorrect">
> = {
  wrong: "incorrect",
  correct: "correct",
  selected: "selected",
};

interface TrayZones {
  readonly stage: ZoneRect;
  readonly tray: ZoneRect;
}

interface SessionClockState {
  ms: number;
  basketShakeStartMs: number | null;
  winAtMs: number | null;
  stagedAtMs: number | null;
}

const SESSION_CLOCK = new WeakMap<GT003Session, SessionClockState>();

function getClockState(session: GT003Session): SessionClockState {
  let state = SESSION_CLOCK.get(session);
  if (!state) {
    state = {
      ms: 0,
      basketShakeStartMs: null,
      winAtMs: null,
      stagedAtMs: null,
    };
    SESSION_CLOCK.set(session, state);
  }
  return state;
}

function readClockMs(session: GT003Session): number {
  return getClockState(session).ms;
}

export class GT003Session extends TemplateGameSession<
  GT003Content,
  GT003Difficulty
> {
  displayItems: readonly DraggableItem[] = [];
  private placementTargets: readonly {
    id: string;
    targetId: string;
    isCorrect: boolean;
  }[] = [];
  private readonly mechanic = new PlacementMechanic();
  degradation: DegradationState | null = null;
  private particles: Particle[] = [];
  private itemStates: Map<string, ItemVisualState> = new Map();
  private readonly wrongFlashes = new WrongFlashMap(WRONG_FEEDBACK_MS);
  private isRoundClosed = false;
  private pressedItemId: string | null = null;
  hoveredContainer = false;

  override readonly needsTray = true;

  override get trayItemCount(): number {
    return this.content.items.length;
  }
  override readonly usesPromptZone = true;

  setupEntities(): void {
    this.mechanic.reset();
    this.isWon = false;
    this.isRoundClosed = false;
    this.pressedItemId = null;
    this.particles = [];
    this.itemStates = new Map();
    this.wrongFlashes.clearAll();
    this.hoveredContainer = false;
    SESSION_CLOCK.set(this, {
      ms: 0,
      basketShakeStartMs: null,
      winAtMs: null,
      stagedAtMs: null,
    });
    this.placementTargets = this.content.items
      .filter((i) => i.is_correct)
      .map((i) => ({
        id: i.item_id,
        targetId: this.content.container.container_id,
        isCorrect: true,
      }));
    this.displayItems =
      this.difficulty.shuffle_items === false
        ? [...this.content.items]
        : shuffle(this.content.items, deriveStream(this.layoutSeed, "items"));
  }

  override destroy(): void {
    SESSION_CLOCK.delete(this);
    super.destroy();
  }

  private resolveLayoutId(): LayoutId {
    return this.logicSpace.h > this.logicSpace.w
      ? "left-source-right-target"
      : "top-source-bottom-target";
  }

  private trayZones(): TrayZones | null {
    return this.stageRect && this.trayRect
      ? { stage: this.stageRect, tray: this.trayRect }
      : null;
  }

  protected computeSlots(ageBand: AgeBand): readonly Slot[] {
    const zones = this.trayZones();
    if (zones) {
      return this.computeZoneSlots(ageBand, zones);
    }
    const layoutFn = resolveLayout(this.resolveLayoutId());
    return layoutFn({
      slotCount: this.displayItems.length,
      ageBand,
      targetCount: 1,
      logic: this.logicSpace,
      stage: this.stageRect,
      cssPerLogic: this.cssPerLogic,
    });
  }

  private computeZoneSlots(ageBand: AgeBand, zones: TrayZones): Slot[] {
    const touchFloor = resolveTouchFloor(ageBand, this.cssPerLogic);
    const sources = computeTraySourceSlots(
      this.displayItems.length,
      zones.tray,
      touchFloor
    );
    const itemSize = sources[0]?.w ?? touchFloor;
    const target = computeStageTargetSlot(
      zones.stage,
      itemSize,
      touchFloor,
      sources.length
    );
    return [...sources, target];
  }

  private getTargetSlot(): Slot | undefined {
    return this.targetSlots[0] ?? this.slots.at(-1);
  }

  private getSourceSlot(index: number): Slot | undefined {
    return this.sourceSlots[index] ?? this.slots[index];
  }

  getContainerBox(): ContainerBox | null {
    return computeGT003ContainerBox(
      this.getTargetSlot(),
      this.sourceSlots,
      this.logicSpace,
      this.stageRect,
      this.trayRect
    );
  }

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

  private findLooseItemIndex(x: number, y: number): number {
    const placements = this.mechanic.getPlacements();
    for (let i = 0; i < this.displayItems.length; i++) {
      const slot = this.getSourceSlot(i);
      const item = this.displayItems[i];
      if (!(slot && item) || placements.has(item.item_id)) {
        continue;
      }
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
    if (this.mechanic.getPlacements().has(itemId)) {
      return "correct";
    }
    if (this.mechanic.getStagedItemId() === itemId) {
      return "selected";
    }
    const nowMs = readClockMs(this);
    if (
      this.wrongFlashes.isActive(itemId, nowMs) ||
      this.itemStates.get(itemId) === "wrong"
    ) {
      return "wrong";
    }
    if (this.pressedItemId === itemId) {
      return "touching";
    }
    return this.itemStates.get(itemId) ?? "idle";
  }

  private resolveTokenState(
    itemId: string,
    nowMs: number
  ): GT003TokenVisualState {
    if (this.mechanic.getPlacements().has(itemId)) {
      return "locked";
    }
    if (this.mechanic.getStagedItemId() === itemId) {
      return "selected";
    }
    if (
      this.wrongFlashes.isActive(itemId, nowMs) ||
      this.itemStates.get(itemId) === "wrong"
    ) {
      return "wrong";
    }
    if (this.pressedItemId === itemId) {
      return "touching";
    }
    return "idle";
  }

  stageItem(itemId: string | null): void {
    if (this.isWon || this.isRoundClosed) {
      this.mechanic.stageItem(null);
      this.hoveredContainer = false;
      getClockState(this).stagedAtMs = null;
      return;
    }
    if (itemId === null) {
      getClockState(this).stagedAtMs = null;
    } else {
      const exists = this.content.items.some((i) => i.item_id === itemId);
      const isPlaced = this.mechanic.getPlacements().has(itemId);
      if (!exists || isPlaced) {
        return;
      }
      this.wrongFlashes.clear(itemId);
      if (this.itemStates.get(itemId) === "wrong") {
        this.itemStates.delete(itemId);
      }
      getClockState(this).stagedAtMs = readClockMs(this);
    }
    this.mechanic.stageItem(itemId);
    this.hoveredContainer = itemId !== null;
  }

  getStagedItemId(): string | null {
    return this.mechanic.getStagedItemId();
  }

  setTouchingItem(itemId: string | null): void {
    if (this.isWon || this.isRoundClosed) {
      this.pressedItemId = null;
      return;
    }
    if (
      itemId !== null &&
      !this.mechanic.getPlacements().has(itemId) &&
      this.displayItems.some((item) => item.item_id === itemId)
    ) {
      this.pressedItemId = itemId;
      return;
    }
    this.pressedItemId = null;
  }

  getTouchingItemId(): string | null {
    return this.pressedItemId;
  }

  setPointerOver(x: number, y: number): void {
    if (this.isWon || this.isRoundClosed) {
      this.hoveredContainer = false;
      this.pressedItemId = null;
      return;
    }
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
    if (this.isWon || this.isRoundClosed) {
      return;
    }
    const item = this.resolveDrop(itemId, containerId);
    if (!item || this.mechanic.getPlacements().has(itemId)) {
      return;
    }

    this.pressedItemId = null;
    const nowMs = readClockMs(this);
    this.recordEvent("item_dropped", {
      item_id: itemId,
      container_id: containerId,
      is_correct: item.is_correct,
    });

    if (item.is_correct) {
      this.mechanic.place(itemId, containerId);
      this.queueSfx("drop_thud");
      const clock = getClockState(this);
      clock.basketShakeStartMs = nowMs;
      this.setItemState(itemId, "correct");
      this.wrongFlashes.clear(itemId);
      this.spawnSuccessParticles(itemId);
      if (this.checkWinCondition()) {
        clock.winAtMs = nowMs;
        this.hoveredContainer = false;
        this.winSession();
      }
      return;
    }

    this.setItemState(itemId, "wrong");
    this.wrongFlashes.trigger(itemId, nowMs);
    if (this.difficulty.allow_retry === false) {
      this.isRoundClosed = true;
      this.mechanic.stageItem(null);
      this.hoveredContainer = false;
      this.pressedItemId = null;
      getClockState(this).stagedAtMs = null;
      this.completeSession();
    }
  }

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

  update(deltaMs: number): void {
    const clock = getClockState(this);
    clock.ms += deltaMs;
    for (const itemId of this.wrongFlashes.drainExpired(clock.ms)) {
      if (this.itemStates.get(itemId) === "wrong") {
        this.itemStates.delete(itemId);
      }
    }
    this.particles = stepParticlesByDelta(this.particles, deltaMs);
  }

  override isAcceptingInput(): boolean {
    return !this.isRoundClosed;
  }

  override dispatch(gesture: Gesture): ActionResult | undefined {
    if (this.isRoundClosed) {
      return ACTION_IGNORED;
    }
    return super.dispatch(gesture);
  }

  override storyLine(): string {
    return GT003_STORY_LINE;
  }

  override mascotMood(): MascotPose | null {
    return !(this.isWon || this.isRoundClosed) &&
      this.mechanic.getPlacements().size > 0
      ? "cheer"
      : null;
  }

  override getView(): EngineView {
    const entities: ViewEntity[] = [];

    for (let i = 0; i < this.displayItems.length; i++) {
      const item = this.displayItems[i];
      const slot = this.getSourceSlot(i);
      if (!(item && slot)) {
        continue;
      }
      const rawState = this.getItemState(item.item_id);
      const state = VIEW_STATE_MAP[rawState] ?? "idle";
      const assetLabels = resolveAssetLabels(item.asset);
      entities.push({
        id: item.item_id,
        slotIndex: i,
        role: "source",
        state,
        x: slot.x,
        y: slot.y,
        w: slot.w,
        h: slot.h,
        label: item.label ?? assetLabels.label,
        spokenLabel: item.label ?? assetLabels.spokenLabel,
        spokenAudioPath: assetLabels.spokenAudioPath,
        glyph: assetLabels.glyph,
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
    if (!(draggedItem && this.isPointInContainer(gesture.toX, gesture.toY))) {
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
    if (this.isWon || this.isRoundClosed) {
      return null;
    }
    if (gesture.type === "drop") {
      return this.toDropAction(gesture);
    }
    if (gesture.type === "tap") {
      return this.toTapAction(gesture);
    }
    return null;
  }

  override getHintDestinationIndex(): number | null {
    if (
      this.isWon ||
      this.isRoundClosed ||
      this.getHintTargetIndex() === null
    ) {
      return null;
    }
    const target = this.getTargetSlot();
    const index = target ? this.slots.indexOf(target) : -1;
    return index >= 0 ? index : null;
  }

  override getHintTargetIndex(): number | null {
    if (this.isWon || this.isRoundClosed) {
      return null;
    }
    const placed = this.mechanic.getPlacements();
    const idx = this.displayItems.findIndex(
      (it) => it.is_correct && !placed.has(it.item_id)
    );
    return idx >= 0 ? idx : null;
  }

  override getHintTarget(): HintTarget | null {
    if (this.isWon || this.isRoundClosed) {
      return null;
    }
    return super.getHintTarget();
  }

  override commit(action: GameAction): void {
    if (this.isWon || this.isRoundClosed) {
      return;
    }
    if (action.type === "drop_item" || action.type === "tap_tap_item") {
      const payload = extractGT003DropPayload(action.data);
      if (payload) {
        this.stageItem(null);
        this.onItemDropped(payload.itemId, payload.containerId);
      }
    }
  }

  override checkWinCondition(): boolean {
    return this.mechanic.isPlacementComplete(this.placementTargets);
  }

  render(
    ctx: CanvasRenderingContext2D,
    rs: RenderSystem,
    timeMs: number
  ): void {
    getClockState(this).ms = timeMs;
    drawSceneBackground(ctx, rs, this.themeId);
    const zones = this.trayZones();
    if (!zones) {
      this.drawContainer(rs, ctx, timeMs);
      this.drawInteractive(rs, ctx, timeMs);
      this.drawFeedback(rs, ctx);
      return;
    }
    drawClippedToZone(ctx, zones.stage, () =>
      this.drawContainer(rs, ctx, timeMs)
    );
    drawWoodenTokenDock(ctx, rs, zones.tray);
    drawClippedToZone(ctx, zones.tray, () =>
      this.drawInteractive(rs, ctx, timeMs)
    );
    this.drawFeedback(rs, ctx);
  }

  private drawContainer(
    rs: RenderSystem,
    ctx: CanvasRenderingContext2D,
    timeMs: number
  ): void {
    const box = this.getContainerBox();
    if (!box) {
      return;
    }
    const placements = this.mechanic.getPlacements();
    const placedItems: GT003RenderItem[] = this.content.items
      .filter((i) => placements.has(i.item_id))
      .map((i) => ({
        id: i.item_id,
        asset: i.asset,
        label: i.label,
      }));
    const shakeStartMs = getClockState(this).basketShakeStartMs;
    const shakeElapsedMs = shakeStartMs === null ? null : timeMs - shakeStartMs;

    drawGT003BasketTarget(ctx, rs, box, {
      label: this.content.container.label,
      placedItems,
      targetCount: this.content.items.filter((i) => i.is_correct).length,
      isHovered: this.hoveredContainer,
      isWon: this.isWon,
      shakeElapsedMs,
    });
  }

  private drawInteractive(
    rs: RenderSystem,
    ctx: CanvasRenderingContext2D,
    timeMs: number
  ): void {
    const stagedAtMs = getClockState(this).stagedAtMs;
    for (let i = 0; i < this.displayItems.length; i++) {
      const item = this.displayItems[i];
      const slot = this.getSourceSlot(i);
      if (!(slot && item)) {
        continue;
      }
      const state = this.resolveTokenState(item.item_id, timeMs);
      drawGT003SourceToken(
        ctx,
        rs,
        slot,
        {
          id: item.item_id,
          asset: item.asset,
          label: item.label,
        },
        {
          state,
          timeMs,
          stagedAtMs,
          wrongProgress: this.wrongFlashes.progress(item.item_id, timeMs),
        }
      );
    }
  }

  private drawFeedback(rs: RenderSystem, ctx: CanvasRenderingContext2D): void {
    if (this.degradation?.particles_enabled === false) {
      return;
    }
    rs.drawParticles(ctx, this.particles);
  }
}
