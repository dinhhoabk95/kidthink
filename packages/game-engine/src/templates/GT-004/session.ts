import type { AgeBand } from "#src/contracts/types";
import {
  ACTION_IGNORED,
  type ActionResult,
  type GameAction,
  type HintLevel,
  type HintTarget,
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
import {
  type PlacementItem,
  PlacementMechanic,
} from "#src/mechanics/placement-mechanic";
import {
  drawGT004SortTray,
  drawGT004SourceToken,
} from "#src/render/gt-004-shapes";
import {
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
import { WRONG_FLASH_MS, WrongFlashMap } from "#src/systems/wrong-flash";
import {
  extractSortItemPayload,
  type GT004RenderItem,
  type GT004TokenVisualState,
  resolveFlashProgress,
  resolveGT004GroupLabel,
  stepParticlesWithinBounds,
} from "./layout.js";
import type { GT004Content, GT004Difficulty } from "./template.js";

type SortItem = GT004Content["items"][number];

const BUCKET_MAX_W_PX = 180;
const BUCKET_MAX_H_PX = 140;
const LEGACY_BUCKET_HIT: MinHitSize = { w: 140, h: 100 };

export const GT004_STORY_LINE =
  "Cún Con đang xếp gọn đồ của mình, bé giúp Cún Con xếp mỗi bạn vào đúng chỗ nhé!";
export const GT004_REACTION_MS = 1500;

interface SessionRenderClock {
  renderMs: number;
  stagedAtMs: number | null;
  readonly groupPopAtMs: Map<string, number>;
  readonly itemPopAtMs: Map<string, number>;
}

const SESSION_CLOCK = new WeakMap<GT004Session, SessionRenderClock>();

function getRenderClock(session: GT004Session): SessionRenderClock {
  const existing = SESSION_CLOCK.get(session);
  if (existing) {
    return existing;
  }
  const state: SessionRenderClock = {
    renderMs: 0,
    stagedAtMs: null,
    groupPopAtMs: new Map(),
    itemPopAtMs: new Map(),
  };
  SESSION_CLOCK.set(session, state);
  return state;
}

export class GT004Session extends TemplateGameSession<
  GT004Content,
  GT004Difficulty
> {
  degradation: DegradationState | null = null;
  displayItems: readonly SortItem[] = [];
  private placementTargets: readonly PlacementItem[] = [];
  private readonly mechanic = new PlacementMechanic();
  private readonly wrongFlashes = new WrongFlashMap();
  private readonly groupWrongFlashes = new WrongFlashMap();
  private logicClockMs = 0;
  private isRoundClosed = false;
  private pressedItemId: string | null = null;
  private hoveredGroupId: string | null = null;
  private particles: Particle[] = [];
  private reactionPose: MascotPose | null = null;
  private reactionRemainingMs = 0;

  override readonly needsTray = true;
  override get trayItemCount(): number {
    return this.content.items.length;
  }
  override readonly usesPromptZone = true;

  setupEntities(): void {
    this.mechanic.reset();
    this.renderItemStates.clear();
    this.wrongFlashes.clearAll();
    this.groupWrongFlashes.clearAll();
    this.logicClockMs = 0;
    this.isRoundClosed = false;
    this.pressedItemId = null;
    this.hoveredGroupId = null;
    this.particles = [];
    this.reactionPose = null;
    this.reactionRemainingMs = 0;
    this.isWon = false;
    SESSION_CLOCK.delete(this);
    this.placementTargets = this.content.items.map((i) => ({
      id: i.item_id,
      targetId: i.correct_group_id,
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

  private isGroupComplete(groupId: string): boolean {
    const placements = this.mechanic.getPlacements();
    const groupItems = this.content.items.filter(
      (i) => i.correct_group_id === groupId
    );
    return groupItems.length > 0
      ? groupItems.every((i) => placements.get(i.item_id) === groupId)
      : this.isWon;
  }

  stageItem(itemId: string | null): void {
    if (this.isWon || this.isRoundClosed || itemId === null) {
      this.mechanic.stageItem(null);
      getRenderClock(this).stagedAtMs = null;
      return;
    }
    const item = this.content.items.find((i) => i.item_id === itemId);
    if (!item || this.mechanic.getPlacements().has(itemId)) {
      return;
    }
    this.wrongFlashes.clear(itemId);
    if (this.renderItemStates.get(itemId) === "wrong") {
      this.renderItemStates.delete(itemId);
    }
    this.mechanic.stageItem(itemId);
    const clock = getRenderClock(this);
    clock.stagedAtMs = Math.max(this.logicClockMs, clock.renderMs);
  }

  setTouchingItem(itemId: string | null): void {
    if (this.isWon || this.isRoundClosed || itemId === null) {
      this.pressedItemId = null;
      return;
    }
    const canTouch =
      !this.mechanic.getPlacements().has(itemId) &&
      this.displayItems.some((item) => item.item_id === itemId);
    this.pressedItemId = canTouch ? itemId : null;
  }

  getTouchingItemId(): string | null {
    return this.pressedItemId;
  }

  setPointerOver(x: number, y: number): void {
    if (this.isWon || this.isRoundClosed) {
      this.hoveredGroupId = null;
      this.pressedItemId = null;
      return;
    }
    const group = this.findHitGroup(x, y);
    this.hoveredGroupId = group?.group_id ?? null;
    if (group === null && this.mechanic.getStagedItemId() === null) {
      this.pressedItemId = this.findHitItem(x, y)?.item_id ?? null;
    }
  }

  clearPointerOver(): void {
    this.hoveredGroupId = null;
    this.pressedItemId = null;
  }

  getHoveredGroupId(): string | null {
    return this.hoveredGroupId;
  }

  override isAcceptingInput(): boolean {
    return !(this.isWon || this.isRoundClosed);
  }

  override dispatch(gesture: Gesture): ActionResult | undefined {
    return this.isWon || this.isRoundClosed
      ? ACTION_IGNORED
      : super.dispatch(gesture);
  }

  validateAction(action: GameAction): ActionResult {
    if (this.isWon || this.isRoundClosed) {
      return ACTION_IGNORED;
    }
    if (action.type === "sort_item") {
      const payload = extractSortItemPayload(action.data);
      if (payload && this.mechanic.getPlacements().has(payload.itemId)) {
        return ACTION_IGNORED;
      }
    }
    return this.mechanic.validate(action, this.placementTargets, (gId) =>
      this.content.groups.some((g) => g.group_id === gId)
    );
  }

  onItemSorted(itemId: string, groupId: string): void {
    if (this.isWon || this.isRoundClosed) {
      return;
    }
    const item = this.content.items.find((i) => i.item_id === itemId);
    if (!item || this.mechanic.getPlacements().has(itemId)) {
      return;
    }
    this.pressedItemId = null;
    this.hoveredGroupId = null;

    const isCorrect = item.correct_group_id === groupId;
    this.recordEvent("item_sorted", {
      item_id: itemId,
      group_id: groupId,
      is_correct: isCorrect,
    });

    if (isCorrect) {
      this.mechanic.place(itemId, groupId);
      this.renderItemStates.set(itemId, "correct");
      this.wrongFlashes.clear(itemId);
      this.groupWrongFlashes.clear(groupId);
      const clock = getRenderClock(this);
      const nowAnim = Math.max(this.logicClockMs, clock.renderMs);
      clock.groupPopAtMs.set(groupId, nowAnim);
      clock.itemPopAtMs.set(itemId, nowAnim);
      this.spawnSuccessParticles(groupId);
      this.queueSfx("lid_click");
      this.reactionPose = "happy";
      this.reactionRemainingMs = GT004_REACTION_MS;
      if (this.checkWinCondition()) {
        this.winSession();
      }
      return;
    }

    this.renderItemStates.set(itemId, "wrong");
    this.wrongFlashes.trigger(itemId, this.logicClockMs);
    this.groupWrongFlashes.trigger(groupId, this.logicClockMs);
    this.reactionPose = "wonder";
    this.reactionRemainingMs = GT004_REACTION_MS;
    if (this.difficulty.allow_retry === false) {
      this.isRoundClosed = true;
      this.stageItem(null);
      this.completeSession();
    }
  }

  private spawnSuccessParticles(groupId: string): void {
    if (this.degradation?.particles_enabled === false) {
      return;
    }
    const idx = this.content.groups.findIndex((g) => g.group_id === groupId);
    const targetSlot = this.targetSlots[idx];
    if (targetSlot) {
      const stageBounds = pickTrayZones(this.stageRect, this.trayRect)?.stage;
      const fresh = spawnParticlesAtSlot(targetSlot, 7);
      this.particles.push(
        ...stepParticlesWithinBounds(fresh, 0.1, stageBounds)
      );
    }
  }

  override storyLine(): string {
    return GT004_STORY_LINE;
  }

  override mascotMood(): MascotPose | null {
    return this.reactionRemainingMs > 0 && !(this.isWon || this.isRoundClosed)
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
    this.logicClockMs += deltaMs;
    for (const itemId of this.wrongFlashes.drainExpired(this.logicClockMs)) {
      if (this.renderItemStates.get(itemId) === "wrong") {
        this.renderItemStates.delete(itemId);
      }
    }
    this.groupWrongFlashes.drainExpired(this.logicClockMs);
    const stageBounds = pickTrayZones(this.stageRect, this.trayRect)?.stage;
    this.particles = stepParticlesWithinBounds(
      this.particles,
      deltaMs,
      stageBounds
    );
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
    return resolveLayout("multi-bucket-bottom")({
      slotCount: this.displayItems.length,
      targetCount: this.content.groups.length,
      ageBand,
      logic: this.logicSpace,
    });
  }

  private findHitGroup(
    x: number,
    y: number
  ): GT004Content["groups"][number] | null {
    const isInFrame = pickTrayZones(this.stageRect, this.trayRect) !== null;
    const index = findNearestHitSlot(
      this.targetSlots.slice(0, this.content.groups.length),
      x,
      y,
      TAP_TOLERANCE_PX,
      isInFrame ? undefined : LEGACY_BUCKET_HIT
    );
    return this.content.groups[index] ?? null;
  }

  private findHitItem(x: number, y: number): SortItem | null {
    const placed = this.mechanic.getPlacements();
    const loose = this.displayItems.flatMap((it, i) => {
      const slot = this.sourceSlots[i];
      return slot && !placed.has(it.item_id) ? [{ it, slot }] : [];
    });
    const slots = loose.map((e) => e.slot);
    const index = findNearestHitSlot(slots, x, y, TAP_TOLERANCE_PX);
    return loose[index]?.it ?? null;
  }

  private resolveTokenState(itemId: string): GT004TokenVisualState {
    if (this.mechanic.getPlacements().has(itemId)) {
      return "locked";
    }
    if (this.mechanic.getStagedItemId() === itemId) {
      return "selected";
    }
    if (
      this.wrongFlashes.isActive(itemId, this.logicClockMs) ||
      this.getRenderItemState(itemId) === "wrong"
    ) {
      return "wrong";
    }
    return this.pressedItemId === itemId ? "touching" : "idle";
  }

  private toItemEntityState(
    stagedItemId: string | null,
    itemId: string,
    rawState: ItemVisualState
  ): ViewEntity["state"] {
    if (this.mechanic.getPlacements().has(itemId) || rawState === "correct") {
      return "correct";
    }
    if (stagedItemId === itemId || rawState === "selected") {
      return "selected";
    }
    if (
      this.wrongFlashes.isActive(itemId, this.logicClockMs) ||
      rawState === "wrong"
    ) {
      return "incorrect";
    }
    return this.pressedItemId === itemId ? "active" : "idle";
  }

  private toGroupEntityState(groupId: string): ViewEntity["state"] {
    if (this.groupWrongFlashes.isActive(groupId, this.logicClockMs)) {
      return "incorrect";
    }
    if (this.isWon || this.isGroupComplete(groupId)) {
      return "correct";
    }
    return this.hoveredGroupId === groupId ? "selected" : "idle";
  }

  override getView(): EngineView {
    const stagedId = this.mechanic.getStagedItemId();
    const entities: ViewEntity[] = [];
    for (let i = 0; i < this.displayItems.length; i++) {
      const item = this.displayItems[i];
      const slot = this.sourceSlots[i];
      if (item && slot) {
        const raw = this.getRenderItemState(item.item_id);
        entities.push({
          id: item.item_id,
          slotIndex: this.slots.indexOf(slot),
          role: "source",
          state: this.toItemEntityState(stagedId, item.item_id, raw),
          x: slot.x,
          y: slot.y,
          w: slot.w,
          h: slot.h,
          ...resolveAssetLabels(item.asset),
        });
      }
    }
    for (let i = 0; i < this.content.groups.length; i++) {
      const group = this.content.groups[i];
      const slot = this.targetSlots[i];
      if (group && slot) {
        const label = resolveGT004GroupLabel(group.label, group.label_emoji, i);
        entities.push({
          id: group.group_id,
          slotIndex: this.slots.indexOf(slot),
          role: "target",
          state: this.toGroupEntityState(group.group_id),
          x: slot.x,
          y: slot.y,
          w: slot.w,
          h: slot.h,
          hitShape: "square",
          label,
          spokenLabel: label,
          glyph: group.label_emoji,
        });
      }
    }
    return { entities, activePrompt: this.content.prompt };
  }

  private toDropAction(
    gesture: Extract<Gesture, { type: "drop" }>
  ): GameAction | null {
    const dragged = this.findHitItem(gesture.fromX, gesture.fromY);
    const group = dragged ? this.findHitGroup(gesture.toX, gesture.toY) : null;
    return dragged && group
      ? {
          type: "sort_item",
          data: { item_id: dragged.item_id, group_id: group.group_id },
        }
      : null;
  }

  private toTapAction(
    gesture: Extract<Gesture, { type: "tap" }>
  ): GameAction | null {
    const stagedId = this.mechanic.getStagedItemId();
    const group = stagedId ? this.findHitGroup(gesture.x, gesture.y) : null;
    if (stagedId && group) {
      return {
        type: "sort_item",
        data: { item_id: stagedId, group_id: group.group_id },
      };
    }
    const item = this.findHitItem(gesture.x, gesture.y);
    if (item) {
      this.stageItem(stagedId === item.item_id ? null : item.item_id);
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
    return gesture.type === "tap" ? this.toTapAction(gesture) : null;
  }

  override getHintTargetIndex(): number | null {
    if (this.isWon || this.isRoundClosed) {
      return null;
    }
    const placed = this.mechanic.getPlacements();
    const stagedId = this.mechanic.getStagedItemId();
    if (stagedId !== null && !placed.has(stagedId)) {
      const idx = this.displayItems.findIndex((it) => it.item_id === stagedId);
      if (idx >= 0) {
        return idx;
      }
    }
    const idx = this.displayItems.findIndex((it) => !placed.has(it.item_id));
    return idx >= 0 ? idx : null;
  }

  override getHintDestinationIndex(): number | null {
    const itemIdx = this.getHintTargetIndex();
    const item = itemIdx === null ? undefined : this.displayItems[itemIdx];
    if (!item) {
      return null;
    }
    const gId = item.correct_group_id;
    const gIdx = this.content.groups.findIndex((g) => g.group_id === gId);
    const slot = this.targetSlots[gIdx];
    const index = slot ? this.slots.indexOf(slot) : -1;
    return index >= 0 ? index : null;
  }

  override getHintTargetForLevel(level: HintLevel): HintTarget | null {
    const srcIdx = this.getHintTargetIndex();
    const destIdx = this.getHintDestinationIndex();
    if (srcIdx === null) {
      return null;
    }
    if (level === 1) {
      const stagedId = this.mechanic.getStagedItemId();
      const canPointDest =
        stagedId !== null &&
        !this.mechanic.getPlacements().has(stagedId) &&
        destIdx !== null;
      return { kind: "slot", index: canPointDest ? destIdx : srcIdx };
    }
    return destIdx === null
      ? { kind: "slot", index: srcIdx }
      : { kind: "slot", index: srcIdx, toIndex: destIdx };
  }

  override commit(action: GameAction): void {
    if (this.isWon || this.isRoundClosed || action.type !== "sort_item") {
      return;
    }
    const payload = extractSortItemPayload(action.data);
    if (payload) {
      this.stageItem(null);
      this.onItemSorted(payload.itemId, payload.groupId);
    }
  }

  getPlacements(): ReadonlyMap<string, string> {
    return this.mechanic.getPlacements();
  }

  getStagedItemId(): string | null {
    return this.mechanic.getStagedItemId();
  }

  private collectPlacedItems(
    groupId: string,
    animMs: number
  ): GT004RenderItem[] {
    const placements = this.mechanic.getPlacements();
    const clock = getRenderClock(this);
    const result: GT004RenderItem[] = [];
    for (const item of this.displayItems) {
      if (placements.get(item.item_id) === groupId) {
        const popStart = clock.itemPopAtMs.get(item.item_id);
        result.push({
          id: item.item_id,
          asset: item.asset,
          label: resolveAssetLabels(item.asset).label,
          popElapsedMs: popStart === undefined ? null : animMs - popStart,
        });
      }
    }
    return result;
  }

  render(
    ctx: CanvasRenderingContext2D,
    rs: RenderSystem,
    timeMs: number
  ): void {
    getRenderClock(this).renderMs = timeMs;
    drawSceneBackground(ctx, rs, this.themeId);
    const zones = pickTrayZones(this.stageRect, this.trayRect);
    this.drawGroupTrays(ctx, rs, timeMs);
    if (zones) {
      drawWoodenTokenDock(ctx, rs, zones.tray);
      drawClippedToZone(ctx, zones.tray, () =>
        this.drawSourceTokens(ctx, rs, timeMs)
      );
    } else {
      this.drawSourceTokens(ctx, rs, timeMs);
    }
    if (this.degradation?.particles_enabled !== false) {
      rs.drawParticles(ctx, this.particles);
    }
  }

  private drawGroupTrays(
    ctx: CanvasRenderingContext2D,
    rs: RenderSystem,
    timeMs: number
  ): void {
    const clock = getRenderClock(this);
    const now = this.logicClockMs;
    const animMs = Math.max(timeMs, now);
    for (let i = 0; i < this.content.groups.length; i++) {
      const group = this.content.groups[i];
      const slot = this.targetSlots[i];
      if (!(group && slot)) {
        continue;
      }
      const gId = group.group_id;
      const popStart = clock.groupPopAtMs.get(gId);
      const wrongProg = resolveFlashProgress(
        this.groupWrongFlashes,
        gId,
        now,
        timeMs
      );
      drawGT004SortTray(ctx, rs, slot, {
        groupIndex: i,
        label: resolveGT004GroupLabel(group.label, group.label_emoji, i),
        labelEmoji: group.label_emoji,
        placedItems: this.collectPlacedItems(gId, animMs),
        isHovered: this.hoveredGroupId === gId,
        isComplete: this.isWon || this.isGroupComplete(gId),
        isWrong: this.groupWrongFlashes.isActive(gId, now),
        shakeElapsedMs: wrongProg === null ? null : wrongProg * WRONG_FLASH_MS,
        popElapsedMs: popStart === undefined ? null : animMs - popStart,
        wrongProgress: wrongProg,
      });
    }
  }

  private drawSourceTokens(
    ctx: CanvasRenderingContext2D,
    rs: RenderSystem,
    timeMs: number
  ): void {
    const clock = getRenderClock(this);
    const now = this.logicClockMs;
    const animMs = Math.max(timeMs, now);
    for (let i = 0; i < this.displayItems.length; i++) {
      const item = this.displayItems[i];
      const slot = this.sourceSlots[i];
      if (item && slot) {
        const id = item.item_id;
        const wrongProgress = resolveFlashProgress(
          this.wrongFlashes,
          id,
          now,
          timeMs
        );
        const label = resolveAssetLabels(item.asset).label;
        drawGT004SourceToken(
          ctx,
          rs,
          slot,
          { id, asset: item.asset, label },
          {
            state: this.resolveTokenState(id),
            timeMs: animMs,
            stagedAtMs: clock.stagedAtMs,
            wrongProgress,
          }
        );
      }
    }
  }
}
