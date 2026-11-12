import { formatSpokenLabel } from "@mindkid/shared/preschool-terminology";
import type { AgeBand } from "#src/contracts/types";
import {
  ACTION_CORRECT,
  ACTION_IGNORED,
  ACTION_RETRY,
  type ActionResult,
  type GameAction,
  type HintDemoStep,
  type HintLevel,
  type HintTarget,
  TemplateGameSession,
} from "#src/game-session";
import type { EngineView, Gesture, ViewEntity } from "#src/interaction";
import { resolveAssetLabels } from "#src/labels/spoken-keyword";
import { resolveTouchFloor } from "#src/layout/constants";
import { TAP_TOLERANCE_PX } from "#src/layout/hit-test";
import { resolveLayout } from "#src/layout/registry";
import { trayBoxWithin } from "#src/layout/slot-fit.js";
import { computeStageCellSlots } from "#src/layout/stage-targets";
import {
  computeTraySourceSlots,
  findNearestHitSlot,
  pickTrayZones,
} from "#src/layout/tray-layout";
import type { Slot } from "#src/layout/types";
import {
  drawGT008InsetBoard,
  drawGT008SourceToken,
  drawGT008TargetWell,
} from "#src/render/gt-008-shapes";
import {
  boxFromSlots,
  drawClippedToZone,
  drawSceneBackground,
  drawStoryCharacterInStage,
  drawWoodenTokenDock,
  spawnParticlesAtSlot,
  stableBreathScale,
} from "#src/render/index.js";
import type { MascotPose } from "#src/render/mascot";
import type { DegradationState } from "#src/systems/degradation";
import { MoodPulse } from "#src/systems/mood-pulse";
import type { Particle, RenderSystem } from "#src/systems/render-system";
import { WRONG_FLASH_MS, WrongFlash } from "#src/systems/wrong-flash";
import {
  buildGT008DisplayItems,
  computeGT008HintDemoSteps,
  extractGT008PlacePayload,
  extractGT008RevertPayload,
  findGT008NextHintPair,
  type GT008Item,
  type GT008SlotDef,
  type GT008TokenVisualState,
  getGT008Clock,
  insetGT008Rect,
  placeGT008Action,
  resetGT008Clock,
  stepGT008Particles,
} from "./layout.js";
import type { GT008Content, GT008Difficulty } from "./template.js";

const TARGET_CELL_MAX = { w: 96, h: 96 };
const HIT_TOL = TAP_TOLERANCE_PX;

export const GT008_STORY_LINE =
  "Voi Con giữ bãi đỗ xe. Bé đưa từng bạn về đúng chỗ của mình nhé!";
export const GT008_CHEER_MS = 1000;
export const GT008_WONDER_MS = 1500;
export class GT008Session extends TemplateGameSession<
  GT008Content,
  GT008Difficulty
> {
  degradation: DegradationState | null = null;
  displayItems: readonly GT008Item[] = [];
  placedSlots: Map<string, string> = new Map();
  private renderParticles: Particle[] = [];
  private stagedItemId: string | null = null;
  private stagedSlotId: string | null = null;
  private touchingItemId: string | null = null;
  private hoveredSlotId: string | null = null;
  private wrongItemId: string | null = null;
  private wrongSlotId: string | null = null;
  private isRoundClosed = false;
  private readonly wrongFlash = new WrongFlash();
  private readonly mood = new MoodPulse();
  private itemById = new Map<string, GT008Item>();
  private slotById = new Map<string, GT008SlotDef>();

  override readonly needsTray = true;
  override readonly usesPromptZone = true;
  override get trayItemCount(): number {
    return this.content.items.length;
  }
  override get trayHasLabels(): boolean {
    return false;
  }

  setupEntities(): void {
    this.placedSlots.clear();
    this.itemById = new Map(this.content.items.map((it) => [it.item_id, it]));
    this.slotById = new Map(this.content.slots.map((s) => [s.slot_id, s]));
    const items = this.content.items;
    this.displayItems = buildGT008DisplayItems(items, this.layoutSeed);
    this.clearTransientSelection();
    this.wrongItemId = null;
    this.wrongSlotId = null;
    this.isRoundClosed = false;
    this.isWon = false;
    this.isCompleted = false;
    this.wrongFlash.clear();
    this.mood.clear();
    this.renderParticles = [];
    resetGT008Clock(this);
  }
  private clearTransientSelection(): void {
    this.stagedItemId = null;
    this.stagedSlotId = null;
    this.touchingItemId = null;
    this.hoveredSlotId = null;
  }
  override isAcceptingInput(): boolean {
    return !(this.isWon || this.isRoundClosed);
  }
  private resolveDisplayItems(): readonly GT008Item[] {
    const items = this.content.items;
    if (this.displayItems.length !== items.length) {
      this.displayItems = buildGT008DisplayItems(items, this.layoutSeed);
    }
    return this.displayItems;
  }
  private resolveItemById(): ReadonlyMap<string, GT008Item> {
    return this.itemById.size === this.content.items.length
      ? this.itemById
      : new Map(this.content.items.map((it) => [it.item_id, it]));
  }
  private resolveSlotById(): ReadonlyMap<string, GT008SlotDef> {
    return this.slotById.size === this.content.slots.length
      ? this.slotById
      : new Map(this.content.slots.map((s) => [s.slot_id, s]));
  }
  override storyLine(): string {
    return GT008_STORY_LINE;
  }
  override mascotMood(): MascotPose | null {
    return this.isWon ? null : this.mood.current();
  }
  getStagedItemId(): string | null {
    return this.stagedItemId;
  }
  getStagedSlotId(): string | null {
    return this.stagedSlotId;
  }
  getTouchingItemId(): string | null {
    return this.touchingItemId;
  }
  getHoveredSlotId(): string | null {
    return this.hoveredSlotId;
  }
  setTouchingItem(itemId: string | null): void {
    const placedIds = new Set(this.placedSlots.values());
    const valid =
      this.isAcceptingInput() &&
      Boolean(itemId) &&
      this.resolveItemById().has(itemId ?? "") &&
      !placedIds.has(itemId ?? "");
    this.touchingItemId = valid ? itemId : null;
  }
  setPointerOver(x: number, y: number): void {
    if (!this.isAcceptingInput()) {
      this.clearPointerOver();
      return;
    }
    const def = this.findNearestTargetDef(x, y);
    const openDef = def && !this.placedSlots.has(def.slot_id) ? def : null;
    this.hoveredSlotId = openDef?.slot_id ?? null;
    if (!def) {
      this.touchingItemId = this.findOpenSourceItem(x, y)?.item_id ?? null;
    }
  }
  clearPointerOver(): void {
    this.hoveredSlotId = null;
    this.touchingItemId = null;
  }
  update(deltaMs: number): void {
    const clk = getGT008Clock(this);
    clk.logicMs += deltaMs;
    this.mood.tick(deltaMs);
    if (this.wrongItemId && this.wrongFlash.hasExpired(clk.logicMs)) {
      this.setRenderItemState(this.wrongItemId, "idle");
      this.wrongItemId = null;
      this.wrongSlotId = null;
    }
    if (this.degradation?.particles_enabled !== false) {
      const z = pickTrayZones(this.stageRect, this.trayRect);
      const pts = this.renderParticles;
      this.renderParticles = stepGT008Particles(
        pts,
        deltaMs,
        z?.stage ?? this.stageRect
      );
    }
  }
  validateAction(action: GameAction): ActionResult {
    if (!this.isAcceptingInput() || action.type === "revert_item") {
      return ACTION_IGNORED;
    }
    if (action.type !== "place_item" && action.type !== "drop_to_slot") {
      return ACTION_IGNORED;
    }
    const data = extractGT008PlacePayload(action.data);
    if (!data) {
      return ACTION_RETRY;
    }
    if (this.placedSlots.has(data.slot_id)) {
      return ACTION_IGNORED;
    }
    const slot = this.resolveSlotById().get(data.slot_id);
    return slot?.expected_item_id === data.item_id
      ? ACTION_CORRECT
      : ACTION_RETRY;
  }
  onItemPlaced(itemId: string, slotId: string): void {
    const slotDef = this.resolveSlotById().get(slotId);
    if (!slotDef) {
      return;
    }
    const ok = slotDef.expected_item_id === itemId;
    const ev = { item_id: itemId, slot_id: slotId, is_correct: ok };
    this.recordEvent("item_placed", ev);
    if (!ok) {
      return;
    }
    const clk = getGT008Clock(this);
    this.placedSlots.set(slotId, itemId);
    clk.slotPopAtMs.set(slotId, clk.logicMs);
    this.setRenderItemState(itemId, "correct");
    this.queueSfx("park_thunk");
    this.mood.set("cheer", GT008_CHEER_MS);
    const idx = this.content.slots.findIndex((s) => s.slot_id === slotId);
    const targetSlot = this.targetSlots[idx];
    if (targetSlot) {
      this.renderParticles.push(...spawnParticlesAtSlot(targetSlot, 12));
    }
    if (this.checkWinCondition()) {
      this.winSession();
    }
  }
  override checkWinCondition(): boolean {
    const slots = this.content.slots;
    return (
      slots.length === 0 ||
      slots.every((s) => this.placedSlots.get(s.slot_id) === s.expected_item_id)
    );
  }
  protected computeSlots(ageBand: AgeBand): readonly Slot[] {
    const zones = pickTrayZones(this.stageRect, this.trayRect);
    if (zones) {
      const tf = resolveTouchFloor(ageBand, this.cssPerLogic);
      const stg = insetGT008Rect(zones.stage, 6, 4);
      const count = this.content.slots.length;
      const targets = computeStageCellSlots({
        count,
        stage: stg,
        touchFloor: tf,
        maxCell: TARGET_CELL_MAX,
        role: "target",
        hasLabels: false,
      });
      const n = this.content.items.length;
      const sources = computeTraySourceSlots(n, zones.tray, tf, count, false);
      return [...targets, ...sources];
    }
    return resolveLayout("horizontal-slot-track")({
      slotCount: this.content.items.length,
      targetCount: this.content.slots.length,
      ageBand,
      logic: this.logicSpace,
    });
  }
  private findOpenSourceItem(x: number, y: number): GT008Item | null {
    const sources = this.sourceSlots;
    const placedIds = new Set(this.placedSlots.values());
    const open = this.resolveDisplayItems().flatMap((item, i) => {
      const slot = sources[i];
      return slot && !placedIds.has(item.item_id) ? [{ item, slot }] : [];
    });
    const slots = open.map((e) => e.slot);
    return open[findNearestHitSlot(slots, x, y, HIT_TOL)]?.item ?? null;
  }
  private findNearestTargetDef(x: number, y: number): GT008SlotDef | null {
    const idx = findNearestHitSlot(this.targetSlots, x, y, HIT_TOL);
    return idx >= 0 ? (this.content.slots[idx] ?? null) : null;
  }
  private isPointInTrayRegion(x: number, y: number): boolean {
    const t = pickTrayZones(this.stageRect, this.trayRect)?.tray;
    const inRect =
      Boolean(t) &&
      x >= (t?.x ?? 0) - HIT_TOL &&
      x <= (t?.x ?? 0) + (t?.w ?? 0) + HIT_TOL &&
      y >= (t?.y ?? 0) - HIT_TOL &&
      y <= (t?.y ?? 0) + (t?.h ?? 0) + HIT_TOL;
    return inRect || findNearestHitSlot(this.sourceSlots, x, y, HIT_TOL) >= 0;
  }
  private toTapAction(g: Extract<Gesture, { type: "tap" }>): GameAction | null {
    const clk = getGT008Clock(this);
    const target = this.findNearestTargetDef(g.x, g.y);
    if (target) {
      if (this.placedSlots.has(target.slot_id)) {
        this.clearTransientSelection();
        clk.stagedAtMs = null;
        return null;
      }
      if (this.stagedItemId !== null) {
        return placeGT008Action(this.stagedItemId, target.slot_id);
      }
      this.stagedSlotId =
        this.stagedSlotId === target.slot_id ? null : target.slot_id;
      return null;
    }
    const item = this.findOpenSourceItem(g.x, g.y);
    if (item) {
      if (this.stagedSlotId !== null) {
        const slotId = this.stagedSlotId;
        this.stagedSlotId = null;
        return placeGT008Action(item.item_id, slotId);
      }
      const same = this.stagedItemId === item.item_id;
      this.stagedItemId = same ? null : item.item_id;
      this.stagedSlotId = null;
      clk.stagedAtMs = same ? null : clk.logicMs;
      return null;
    }
    this.clearTransientSelection();
    clk.stagedAtMs = null;
    return null;
  }
  override toAction(g: Gesture): GameAction | null {
    if (!this.isAcceptingInput()) {
      return null;
    }
    if (g.type === "tap") {
      return this.toTapAction(g);
    }
    if (g.type !== "drop") {
      return null;
    }
    this.clearPointerOver();
    const item = this.findOpenSourceItem(g.fromX, g.fromY);
    if (item) {
      const def = this.findNearestTargetDef(g.toX, g.toY);
      return def && !this.placedSlots.has(def.slot_id)
        ? placeGT008Action(item.item_id, def.slot_id)
        : null;
    }
    const fromDef = this.findNearestTargetDef(g.fromX, g.fromY);
    const isPlaced = Boolean(fromDef && this.placedSlots.has(fromDef.slot_id));
    return fromDef && isPlaced && this.isPointInTrayRegion(g.toX, g.toY)
      ? { type: "revert_item", data: { slot_id: fromDef.slot_id } }
      : null;
  }
  private resolveHintPair() {
    const items = this.resolveDisplayItems();
    const s = this.content.slots;
    const p = this.placedSlots;
    return this.isAcceptingInput()
      ? findGT008NextHintPair(s, items, p, this.stagedItemId, this.stagedSlotId)
      : null;
  }
  override getHintTargetIndex(): number | null {
    const pair = this.resolveHintPair();
    const src = pair ? this.sourceSlots[pair.sourceItemIdx] : undefined;
    const idx = src ? this.slots.indexOf(src) : -1;
    return idx >= 0 ? idx : null;
  }
  override getHintDestinationIndex(): number | null {
    const pair = this.resolveHintPair();
    const dst = pair ? this.targetSlots[pair.targetSlotIdx] : undefined;
    const idx = dst ? this.slots.indexOf(dst) : -1;
    return idx >= 0 ? idx : null;
  }
  override getHintTarget(): HintTarget | null {
    return this.getHintTargetForLevel(2);
  }
  override getHintTargetForLevel(level: HintLevel): HintTarget | null {
    const pair = this.resolveHintPair();
    if (!pair) {
      return null;
    }
    if (level === 1) {
      return { kind: "region", ids: [pair.slotDef.slot_id] };
    }
    const srcIdx = this.getHintTargetIndex() ?? -1;
    const dstIdx = this.getHintDestinationIndex() ?? -1;
    if (srcIdx < 0) {
      return null;
    }
    return dstIdx >= 0
      ? { kind: "slot", index: srcIdx, toIndex: dstIdx }
      : { kind: "slot", index: srcIdx };
  }
  override getHintDemoSequence(
    level: HintLevel = 3
  ): readonly HintDemoStep[] | null {
    const items = this.resolveDisplayItems();
    const s = this.content.slots;
    return level < 3 || !this.isAcceptingInput()
      ? null
      : computeGT008HintDemoSteps(
          s,
          items,
          this.placedSlots,
          this.slots,
          this.sourceSlots,
          this.targetSlots
        );
  }
  override commit(action: GameAction): void {
    if (!this.isAcceptingInput()) {
      return;
    }
    if (action.type === "revert_item") {
      const rev = extractGT008RevertPayload(action.data);
      const itemId = rev ? this.placedSlots.get(rev.slot_id) : undefined;
      if (!(rev && itemId)) {
        return;
      }
      const slotId = rev.slot_id;
      this.placedSlots.delete(slotId);
      getGT008Clock(this).slotPopAtMs.delete(slotId);
      this.setRenderItemState(itemId, "idle");
      this.clearTransientSelection();
      this.recordEvent("item_reverted", { item_id: itemId, slot_id: slotId });
      return;
    }
    const result = this.validateAction(action);
    const data = extractGT008PlacePayload(action.data);
    if (!data || (!result.valid && result.feedback === "none")) {
      return;
    }
    const clk = getGT008Clock(this);
    this.clearTransientSelection();
    clk.stagedAtMs = null;
    if (result.valid) {
      this.onItemPlaced(data.item_id, data.slot_id);
      this.wrongItemId = null;
      this.wrongSlotId = null;
      return;
    }
    const { item_id, slot_id } = data;
    this.recordEvent("item_placed", { item_id, slot_id, is_correct: false });
    const nowMs = clk.logicMs;
    this.wrongItemId = item_id;
    this.wrongSlotId = slot_id;
    this.wrongFlash.clear();
    this.wrongFlash.trigger(nowMs);
    this.setRenderItemState(item_id, "wrong");
    this.mood.set("wonder", GT008_WONDER_MS);
    if (this.difficulty.allow_retry === false) {
      this.isRoundClosed = true;
      clk.closedFlashUntilMs = nowMs + WRONG_FLASH_MS;
      this.completeSession();
    }
  }
  private buildTargetEntity(
    defSlot: GT008SlotDef,
    i: number,
    slot: Slot,
    itemById: ReadonlyMap<string, GT008Item>
  ): ViewEntity {
    const pId = this.placedSlots.get(defSlot.slot_id);
    const pItem = pId ? itemById.get(pId) : undefined;
    const eItem = itemById.get(defSlot.expected_item_id);
    const pLbl = pItem ? resolveAssetLabels(pItem.asset) : undefined;
    const eLbl = eItem ? resolveAssetLabels(eItem.asset) : undefined;
    const raw = pItem?.label ?? defSlot.label ?? eItem?.label;
    const fb = pLbl?.spokenLabel ?? eLbl?.spokenLabel ?? `Ô đích ${i + 1}`;
    let st: ViewEntity["state"] = "idle";
    if (pId !== undefined) {
      st = "correct";
    } else if (this.stagedSlotId === defSlot.slot_id) {
      st = "selected";
    }
    const spoken = raw ? formatSpokenLabel(raw) : fb;
    return this.makeEntity(defSlot.slot_id, slot, "target", st, spoken, pLbl);
  }
  private makeEntity(
    id: string,
    slot: Slot,
    role: "target" | "source",
    state: ViewEntity["state"],
    spokenLabel: string,
    lbl?: { readonly glyph?: string; readonly spokenAudioPath?: string }
  ): ViewEntity {
    const slotIndex = this.slots.indexOf(slot);
    const glyph = lbl?.glyph;
    const spokenAudioPath = lbl?.spokenAudioPath;
    return {
      ...slot,
      id,
      slotIndex,
      role,
      state,
      glyph,
      spokenLabel,
      spokenAudioPath,
    };
  }
  override getView(): EngineView {
    const targets = this.targetSlots;
    const sources = this.sourceSlots;
    const itemById = this.resolveItemById();
    const placedIds = new Set(this.placedSlots.values());
    const entities: ViewEntity[] = [];
    this.content.slots.forEach((defSlot, i) => {
      const slot = targets[i];
      if (slot) {
        entities.push(this.buildTargetEntity(defSlot, i, slot, itemById));
      }
    });
    this.resolveDisplayItems().forEach((item, i) => {
      const slot = sources[i];
      if (!slot) {
        return;
      }
      const aLbl = resolveAssetLabels(item.asset);
      const raw = item.label ?? aLbl.spokenLabel ?? `Vật ${i + 1}`;
      const spoken = item.label ? formatSpokenLabel(item.label) : raw;
      const clk = getGT008Clock(this);
      const wrong =
        (this.wrongItemId === item.item_id &&
          this.wrongFlash.isActive(clk.logicMs)) ||
        this.getRenderItemState(item.item_id) === "wrong";
      let st: ViewEntity["state"] = wrong ? "incorrect" : "idle";
      if (placedIds.has(item.item_id)) {
        st = "correct";
      } else if (this.stagedItemId === item.item_id) {
        st = "selected";
      }
      entities.push(
        this.makeEntity(item.item_id, slot, "source", st, spoken, aLbl)
      );
    });
    return { activePrompt: this.content.prompt, entities };
  }
  render(
    ctx: CanvasRenderingContext2D,
    rs: RenderSystem,
    timeMs: number
  ): void {
    const clk = getGT008Clock(this);
    const logicMs = clk.logicMs;
    drawSceneBackground(ctx, rs, this.themeId);
    const zones = pickTrayZones(this.stageRect, this.trayRect);
    const stg = zones?.stage ?? this.stageRect;
    const targets = this.targetSlots;
    const sources = this.sourceSlots;
    const itemById = this.resolveItemById();
    const displayItems = this.resolveDisplayItems();
    const placedIds = new Set(this.placedSlots.values());
    const hasStaged = this.stagedItemId !== null;
    const breath = stableBreathScale(timeMs, hasStaged, rs.reducedMotion);
    const flashProg = this.wrongFlash.isActive(logicMs)
      ? this.wrongFlash.elapsedMs(logicMs) / WRONG_FLASH_MS
      : null;
    const drawStage = (): void => {
      drawStoryCharacterInStage(ctx, "elephant", stg, this.slots);
      const tBox = boxFromSlots(targets);
      if (tBox) {
        drawGT008InsetBoard(ctx, rs, stg ? trayBoxWithin(tBox, stg) : tBox);
      }
      this.content.slots.forEach((defSlot, i) => {
        const slot = targets[i];
        if (!slot) {
          return;
        }
        const pId = this.placedSlots.get(defSlot.slot_id);
        const popAt = clk.slotPopAtMs.get(defSlot.slot_id);
        drawGT008TargetWell(ctx, rs, slot, {
          slotDef: defSlot,
          expectedItem: itemById.get(defSlot.expected_item_id),
          placedItem: pId ? itemById.get(pId) : undefined,
          breath,
          isReceiving: this.hoveredSlotId === defSlot.slot_id,
          isStagedTarget: this.stagedSlotId === defSlot.slot_id,
          isHighlightedEmpty:
            this.isRoundClosed && logicMs < clk.closedFlashUntilMs,
          wrongProgress:
            defSlot.slot_id === this.wrongSlotId ? flashProg : null,
          popElapsedMs:
            popAt === undefined ? null : Math.max(0, logicMs - popAt),
        });
      });
      if (
        this.degradation?.particles_enabled !== false &&
        this.renderParticles.length > 0
      ) {
        rs.drawParticles(ctx, this.renderParticles);
      }
    };
    const drawTray = (): void => {
      if (sources.length > 0) {
        drawWoodenTokenDock(ctx, rs, zones?.tray);
      }
      displayItems.forEach((item, i) => {
        const slot = sources[i];
        if (!slot || placedIds.has(item.item_id)) {
          return;
        }
        const st = this.sourceVisualState(item.item_id, flashProg);
        const isStaged =
          this.stagedItemId === item.item_id && clk.stagedAtMs !== null;
        const stagedElapsedMs = isStaged
          ? Math.max(0, logicMs - (clk.stagedAtMs ?? 0))
          : null;
        const wrongProgress = st === "wrong" ? flashProg : null;
        const o = { item, state: st, timeMs, stagedElapsedMs, wrongProgress };
        drawGT008SourceToken(ctx, rs, slot, o);
      });
    };
    const clip = drawClippedToZone;
    const tr = zones?.tray;
    if (stg) {
      clip(ctx, stg, drawStage);
    } else {
      drawStage();
    }
    if (tr) {
      clip(ctx, tr, drawTray);
    } else {
      drawTray();
    }
  }
  private sourceVisualState(
    id: string,
    flashProg: number | null
  ): GT008TokenVisualState {
    if (this.wrongItemId === id && flashProg !== null) {
      return "wrong";
    }
    if (this.stagedItemId === id) {
      return "selected";
    }
    return this.touchingItemId === id ? "touching" : "idle";
  }
}
