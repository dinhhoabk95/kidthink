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
import type { EngineView, Gesture, ViewEntity } from "#src/interaction";
import { TAP_TOLERANCE_PX } from "#src/layout/hit-test";
import { resolveLayout } from "#src/layout/registry";
import type { Slot } from "#src/layout/types";
import { PairingMechanic } from "#src/mechanics/pairing-mechanic";
import {
  drawSplitLine,
  drawStoryCharacterInStage,
  LINE_SPLIT_MS,
  splitLineSegments,
} from "#src/render/craft-shapes";
import {
  drawGT005MatchedRope,
  drawGT005PairCard,
  drawGT005PreviewRope,
} from "#src/render/gt-005-shapes";
import { drawSceneBackground } from "#src/render/index.js";
import type { MascotPose } from "#src/render/mascot";
import { deriveStream } from "#src/rng/mulberry32";
import type { DegradationState } from "#src/systems/degradation";
import { MoodPulse } from "#src/systems/mood-pulse";
import type { Particle, RenderSystem } from "#src/systems/render-system";
import { WrongFlashMap } from "#src/systems/wrong-flash";
import {
  type ActivePair,
  computeGT005CardAnchor,
  type GT005SideItem,
  resolveEquivalentMatch,
  resolveGT005LayoutOrientation,
  resolveGT005PairAccent,
  shuffleSidesWithDerangement,
  stepParticlesByDelta,
} from "./layout.js";
import {
  buildGT005ViewEntity,
  computePairColumnsInStage,
  createGT005MatchParticles,
  extractGT005MatchPayload,
  type GT005CardVisualState,
  nearestHitIndex,
  toGT005EntityState,
} from "./pair-columns.js";
import type { GT005Content, GT005Difficulty } from "./template.js";

const TARGET_MIN_HIT_W = 140;
const TARGET_MIN_HIT_H = 100;

interface GT005ClockState {
  ms: number;
  stagedAtMs: number | null;
  readonly matchedAtByLeftId: Map<string, number>;
}

const sessionClock = new WeakMap<GT005Session, GT005ClockState>();

function getClock(session: GT005Session): GT005ClockState {
  let state = sessionClock.get(session);
  if (!state) {
    state = { ms: 0, stagedAtMs: null, matchedAtByLeftId: new Map() };
    sessionClock.set(session, state);
  }
  return state;
}

export const GT005_STORY_LINE =
  "Sóc Nâu đang kẹp đồ lên dây phơi, bé giúp Sóc nối từng đôi bạn đi cùng nhau nhé!";
export const GT005_CHEER_MS = 1000;
export const GT005_WONDER_MS = 1500;

export class GT005Session extends TemplateGameSession<
  GT005Content,
  GT005Difficulty
> {
  override readonly usesPromptZone = true;
  degradation: DegradationState | null = null;
  displayLeft: readonly GT005SideItem[] = [];
  displayRight: readonly GT005SideItem[] = [];
  private activePairs: readonly ActivePair[] = [];
  private readonly mechanic = new PairingMechanic();
  private stagedRightId: string | null = null;
  private readonly wrongFlashes = new WrongFlashMap(LINE_SPLIT_MS);
  private readonly mood = new MoodPulse();
  private isRoundClosed = false;
  private pointerHoverPoint: { readonly x: number; readonly y: number } | null =
    null;
  private touchingKey: string | null = null;
  private particles: Particle[] = [];
  private splitPair: {
    readonly leftId: string;
    readonly rightId: string;
    readonly startMs: number;
  } | null = null;

  setupEntities(): void {
    this.mechanic.reset();
    this.stagedRightId = null;
    this.isWon = false;
    this.isRoundClosed = false;
    this.wrongFlashes.clearAll();
    this.splitPair = null;
    this.pointerHoverPoint = null;
    this.touchingKey = null;
    this.particles = [];
    this.mood.clear();

    const clock = getClock(this);
    clock.ms = 0;
    clock.stagedAtMs = null;
    clock.matchedAtByLeftId.clear();

    this.activePairs = this.content.pairs.map((p) => ({
      pairId: p.pair_id,
      leftId: p.left.item_id,
      rightId: p.right.item_id,
    }));

    if (this.difficulty.shuffle_sides === false) {
      this.displayLeft = this.content.pairs.map((p) => p.left);
      this.displayRight = this.content.pairs.map((p) => p.right);
    } else {
      const rng = deriveStream(this.layoutSeed, "sides");
      const shuffled = shuffleSidesWithDerangement(this.content.pairs, rng);
      this.displayLeft = shuffled.displayLeft;
      this.displayRight = shuffled.displayRight;
    }
  }

  override isAcceptingInput(): boolean {
    return !(this.isWon || this.isRoundClosed);
  }

  getActivePairs(): readonly ActivePair[] {
    return this.activePairs;
  }

  private resolveMatch(leftId: string, rightId: string) {
    return resolveEquivalentMatch(
      leftId,
      rightId,
      this.activePairs,
      this.displayLeft,
      this.displayRight,
      (id) => this.mechanic.isLeftMatched(id),
      (id) => this.mechanic.isRightMatched(id)
    );
  }

  validateAction(action: GameAction): ActionResult {
    if (this.isWon || this.isRoundClosed || action.type !== "match_pair") {
      return ACTION_IGNORED;
    }
    const p = extractGT005MatchPayload(action.data);
    if (
      !p ||
      this.mechanic.isLeftMatched(p.leftId) ||
      this.mechanic.isRightMatched(p.rightId)
    ) {
      return ACTION_IGNORED;
    }
    return this.resolveMatch(p.leftId, p.rightId)
      ? ACTION_CORRECT
      : ACTION_RETRY;
  }

  onPairMatched(leftItemId: string, rightItemId: string): void {
    const res = this.resolveMatch(leftItemId, rightItemId);
    if (!res) {
      return;
    }
    this.activePairs = res.nextActivePairs;
    const clock = getClock(this);
    clock.matchedAtByLeftId.set(leftItemId, clock.ms);
    clock.stagedAtMs = null;
    this.mechanic.match(leftItemId, rightItemId);
    this.stagedRightId = null;
    this.wrongFlashes.clear(`left:${leftItemId}`);
    this.wrongFlashes.clear(`right:${rightItemId}`);
    this.splitPair = null;
    this.spawnMatchedParticles(leftItemId, rightItemId);
    this.queueSfx("peg_clip");
    this.mood.set("cheer", GT005_CHEER_MS);
    this.recordEvent("pair_matched", {
      pair_id: res.matchedPair.pairId,
      left_item_id: leftItemId,
      right_item_id: rightItemId,
    });
    if (this.checkWinCondition()) {
      this.winSession();
    }
  }

  override checkWinCondition(): boolean {
    return this.mechanic.isPairingComplete(this.activePairs);
  }

  protected computeSlots(ageBand: AgeBand): readonly Slot[] {
    if (this.stageRect) {
      return computePairColumnsInStage({
        stage: this.stageRect,
        ageBand,
        cssPerLogic: this.cssPerLogic,
        leftCount: this.displayLeft.length,
        rightCount: this.displayRight.length,
      });
    }
    const fn = resolveLayout("two-column-matching");
    return fn({
      slotCount: this.displayLeft.length,
      targetCount: this.displayRight.length,
      ageBand,
      logic: this.logicSpace,
    });
  }

  getMatchedPairs(): ReadonlyMap<string, string> {
    return this.mechanic.getMatchedPairs();
  }

  override storyLine(): string {
    return GT005_STORY_LINE;
  }

  override mascotMood(): MascotPose | null {
    return this.isWon ? null : this.mood.current();
  }

  update(deltaMs: number): void {
    const clock = getClock(this);
    clock.ms += deltaMs;
    this.mood.tick(deltaMs);
    this.wrongFlashes.drainExpired(clock.ms);
    this.particles = stepParticlesByDelta(
      this.particles,
      deltaMs,
      this.stageRect
    );
  }

  getStagedLeftId(): string | null {
    return this.mechanic.getStagedLeftId();
  }

  getStagedRightId(): string | null {
    return this.stagedRightId;
  }

  setTouchingItem(side: "left" | "right", itemId: string | null): void {
    this.touchingKey =
      this.isWon || this.isRoundClosed || !itemId ? null : `${side}:${itemId}`;
  }

  setPointerOver(x: number, y: number): void {
    if (this.isWon || this.isRoundClosed) {
      this.clearPointerOver();
      return;
    }
    this.pointerHoverPoint = { x, y };
    const lh = this.findLeftAt(x, y);
    const rh = this.findRightAt(x, y);
    if (this.getStagedLeftId()) {
      this.touchingKey = rh ? `right:${rh.item_id}` : null;
    } else if (this.stagedRightId) {
      this.touchingKey = lh ? `left:${lh.item_id}` : null;
    } else if (lh) {
      this.touchingKey = `left:${lh.item_id}`;
    } else {
      this.touchingKey = rh ? `right:${rh.item_id}` : null;
    }
  }

  clearPointerOver(): void {
    this.pointerHoverPoint = null;
    this.touchingKey = null;
  }

  private stageLeftItem(leftId: string | null): void {
    this.mechanic.stageLeft(leftId);
    this.stagedRightId = null;
    getClock(this).stagedAtMs = leftId ? getClock(this).ms : null;
    if (leftId) {
      this.wrongFlashes.clear(`left:${leftId}`);
    }
  }

  private stageRightItem(rightId: string | null): void {
    this.stagedRightId = rightId;
    this.mechanic.stageLeft(null);
    getClock(this).stagedAtMs = rightId ? getClock(this).ms : null;
    if (rightId) {
      this.wrongFlashes.clear(`right:${rightId}`);
    }
  }

  private isSideMatched(side: "left" | "right", id: string): boolean {
    return side === "left"
      ? this.mechanic.isLeftMatched(id)
      : this.mechanic.isRightMatched(id);
  }

  private buildSideEntities(
    side: "left" | "right",
    dupIds?: ReadonlySet<string>
  ): ViewEntity[] {
    const nowMs = getClock(this).ms;
    const items = side === "left" ? this.displayLeft : this.displayRight;
    const slots = side === "left" ? this.sourceSlots : this.targetSlots;
    const staged =
      side === "left" ? this.getStagedLeftId() : this.stagedRightId;
    const res: ViewEntity[] = [];
    items.forEach((item, i) => {
      const slot = slots[i];
      if (!slot) {
        return;
      }
      const matched = this.isSideMatched(side, item.item_id);
      const wrong = this.wrongFlashes.isActive(
        `${side}:${item.item_id}`,
        nowMs
      );
      const raw = this.getRenderItemState(item.item_id);
      const state = toGT005EntityState(
        matched,
        item.item_id === staged,
        wrong,
        raw
      );
      res.push(
        buildGT005ViewEntity(
          side,
          item,
          slot,
          this.slots.indexOf(slot),
          state,
          dupIds
        )
      );
    });
    return res;
  }

  override getView(): EngineView {
    const leftIds = new Set(this.displayLeft.map((i) => i.item_id));
    return {
      entities: [
        ...this.buildSideEntities("left"),
        ...this.buildSideEntities("right", leftIds),
      ],
      activePrompt: this.content.prompt,
    };
  }

  private findLeftAt(x: number, y: number): GT005SideItem | null {
    const taken = this.displayLeft.map((i) =>
      this.mechanic.isLeftMatched(i.item_id)
    );
    const probe = { x, y, hitTolerance: TAP_TOLERANCE_PX, minW: 0, minH: 0 };
    return (
      this.displayLeft[nearestHitIndex(this.sourceSlots, taken, probe)] ?? null
    );
  }

  private findRightAt(x: number, y: number): GT005SideItem | null {
    const taken = this.displayRight.map((i) =>
      this.mechanic.isRightMatched(i.item_id)
    );
    const minW = this.stageRect ? 0 : TARGET_MIN_HIT_W;
    const minH = this.stageRect ? 0 : TARGET_MIN_HIT_H;
    const probe = { x, y, hitTolerance: TAP_TOLERANCE_PX, minW, minH };
    return (
      this.displayRight[nearestHitIndex(this.targetSlots, taken, probe)] ?? null
    );
  }

  private buildMatchAction(leftId: string, rightId: string): GameAction {
    return {
      type: "match_pair",
      data: { left_item_id: leftId, right_item_id: rightId },
    };
  }

  private toDropAction(
    g: Extract<Gesture, { type: "drop" }>
  ): GameAction | null {
    const ld = this.findLeftAt(g.fromX, g.fromY);
    if (ld) {
      const rt = this.findRightAt(g.toX, g.toY);
      return rt ? this.buildMatchAction(ld.item_id, rt.item_id) : null;
    }
    const rd = this.findRightAt(g.fromX, g.fromY);
    const lt = rd ? this.findLeftAt(g.toX, g.toY) : null;
    return rd && lt ? this.buildMatchAction(lt.item_id, rd.item_id) : null;
  }

  private toTapAction(g: Extract<Gesture, { type: "tap" }>): GameAction | null {
    const lt = this.findLeftAt(g.x, g.y);
    const rt = this.findRightAt(g.x, g.y);
    const sl = this.mechanic.getStagedLeftId();
    if (sl && rt) {
      return this.buildMatchAction(sl, rt.item_id);
    }
    if (this.stagedRightId && lt) {
      return this.buildMatchAction(lt.item_id, this.stagedRightId);
    }
    if (lt) {
      this.stageLeftItem(sl === lt.item_id ? null : lt.item_id);
    } else if (rt) {
      this.stageRightItem(
        this.stagedRightId === rt.item_id ? null : rt.item_id
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
    return gesture.type === "tap" ? this.toTapAction(gesture) : null;
  }

  override dispatch(gesture: Gesture): ActionResult | undefined {
    if (gesture.type === "drop") {
      this.clearPointerOver();
    }
    if (this.isRoundClosed || this.checkWinCondition() || this.isWon) {
      return ACTION_IGNORED;
    }
    return super.dispatch(gesture);
  }

  override getHintTargetIndex(): number | null {
    if (this.isWon || this.isRoundClosed) {
      return null;
    }
    const sl = this.getStagedLeftId();
    if (sl) {
      const p = this.activePairs.find((x) => x.leftId === sl);
      const ri = this.displayRight.findIndex((r) => r.item_id === p?.rightId);
      return ri >= 0 ? this.displayLeft.length + ri : null;
    }
    if (this.stagedRightId) {
      const p = this.activePairs.find((x) => x.rightId === this.stagedRightId);
      const li = this.displayLeft.findIndex((l) => l.item_id === p?.leftId);
      return li >= 0 ? li : null;
    }
    const li = this.displayLeft.findIndex(
      (l) => !this.mechanic.isLeftMatched(l.item_id)
    );
    return li >= 0 ? li : null;
  }

  override getHintDestinationIndex(): number | null {
    if (
      this.isWon ||
      this.isRoundClosed ||
      this.getStagedLeftId() ||
      this.stagedRightId
    ) {
      return null;
    }
    const li = this.getHintTargetIndex();
    const left = li === null ? undefined : this.displayLeft[li];
    if (!left) {
      return null;
    }
    const p = this.activePairs.find((x) => x.leftId === left.item_id);
    const ri = this.displayRight.findIndex((r) => r.item_id === p?.rightId);
    return ri >= 0 ? this.displayLeft.length + ri : null;
  }

  override getHintTarget(): HintTarget | null {
    return this.isWon || this.isRoundClosed ? null : super.getHintTarget();
  }

  override commit(action: GameAction): void {
    this.clearPointerOver();
    if (this.isWon || this.isRoundClosed || action.type !== "match_pair") {
      return;
    }
    const p = extractGT005MatchPayload(action.data);
    if (
      !p ||
      this.mechanic.isLeftMatched(p.leftId) ||
      this.mechanic.isRightMatched(p.rightId)
    ) {
      return;
    }
    if (this.resolveMatch(p.leftId, p.rightId)) {
      this.onPairMatched(p.leftId, p.rightId);
      return;
    }
    const nowMs = getClock(this).ms;
    this.wrongFlashes.trigger(`left:${p.leftId}`, nowMs);
    this.wrongFlashes.trigger(`right:${p.rightId}`, nowMs);
    this.splitPair = { leftId: p.leftId, rightId: p.rightId, startMs: nowMs };
    this.mood.set("wonder", GT005_WONDER_MS);
    this.stageLeftItem(null);
    this.stageRightItem(null);

    if (this.difficulty.allow_retry === false) {
      this.isRoundClosed = true;
      this.completeSession();
    }
  }

  private resolvePairColorForLeft(leftId: string): string {
    const idx = this.content.pairs.findIndex((p) => p.left.item_id === leftId);
    return resolveGT005PairAccent(idx >= 0 ? idx : 0);
  }

  private resolvePairColorForRight(rightId: string): string | null {
    for (const [leftId, matchedRightId] of this.mechanic.getMatchedPairs()) {
      if (matchedRightId === rightId) {
        return this.resolvePairColorForLeft(leftId);
      }
    }
    return null;
  }

  private resolveMatchedAccent(
    side: "left" | "right",
    itemId: string,
    isMatched: boolean
  ): string | null {
    if (!isMatched) {
      return null;
    }
    return side === "left"
      ? this.resolvePairColorForLeft(itemId)
      : this.resolvePairColorForRight(itemId);
  }

  private findLeftSlot(id: string | null): Slot | undefined {
    return id
      ? this.sourceSlots[this.displayLeft.findIndex((x) => x.item_id === id)]
      : undefined;
  }

  private findRightSlot(id: string | null): Slot | undefined {
    return id
      ? this.targetSlots[this.displayRight.findIndex((x) => x.item_id === id)]
      : undefined;
  }

  private spawnMatchedParticles(leftId: string, rightId: string): void {
    if (this.degradation?.particles_enabled === false) {
      return;
    }
    const ls = this.findLeftSlot(leftId);
    const rslot = this.findRightSlot(rightId);
    if (!(ls && rslot)) {
      return;
    }
    const orient = resolveGT005LayoutOrientation(
      this.sourceSlots,
      this.targetSlots
    );
    const anchors = [
      computeGT005CardAnchor(ls, "source", orient),
      computeGT005CardAnchor(rslot, "target", orient),
    ];
    const col = this.resolvePairColorForLeft(leftId);
    this.particles.push(
      ...createGT005MatchParticles(anchors, col, this.stageRect)
    );
  }

  private resolveCardVisualState(
    side: "left" | "right",
    itemId: string,
    isMatched: boolean,
    isStaged: boolean,
    timeMs: number
  ): GT005CardVisualState {
    const key = `${side}:${itemId}`;
    const rawState = this.getRenderItemState(itemId);
    if (isMatched || rawState === "correct") {
      return "correct";
    }
    if (this.wrongFlashes.isActive(key, timeMs) || rawState === "wrong") {
      return "wrong";
    }
    if (isStaged || rawState === "selected") {
      return "selected";
    }
    return this.touchingKey === key || rawState === "touching"
      ? "touching"
      : "idle";
  }

  private renderSideCards(
    ctx: CanvasRenderingContext2D,
    rs: RenderSystem,
    side: "left" | "right",
    orient: "horizontal" | "vertical",
    timeMs: number
  ): void {
    const clock = getClock(this);
    const items = side === "left" ? this.displayLeft : this.displayRight;
    const slots = side === "left" ? this.sourceSlots : this.targetSlots;
    const staged =
      side === "left" ? this.mechanic.getStagedLeftId() : this.stagedRightId;
    const role = side === "left" ? "source" : "target";
    items.forEach((item, i) => {
      const slot = slots[i];
      if (!slot) {
        return;
      }
      const isMatched = this.isSideMatched(side, item.item_id);
      const isStaged = item.item_id === staged;
      const state = this.resolveCardVisualState(
        side,
        item.item_id,
        isMatched,
        isStaged,
        timeMs
      );
      const anchor = computeGT005CardAnchor(slot, role, orient);
      const key = `${side}:${item.item_id}`;
      const matchedAt =
        side === "left"
          ? (clock.matchedAtByLeftId.get(item.item_id) ?? null)
          : null;
      drawGT005PairCard(ctx, rs, slot, {
        id: item.item_id,
        asset: item.asset,
        state,
        timeMs,
        stagedAtMs: isStaged ? clock.stagedAtMs : null,
        matchedAtMs: matchedAt,
        wrongProgress:
          state === "wrong" ? this.wrongFlashes.progress(key, timeMs) : null,
        accentColor: this.resolveMatchedAccent(side, item.item_id, isMatched),
        anchorSide: anchor.side,
        stageRect: this.stageRect,
      });
    });
  }

  render(
    ctx: CanvasRenderingContext2D,
    rs: RenderSystem,
    timeMs: number
  ): void {
    const clock = getClock(this);
    clock.ms = timeMs;
    drawSceneBackground(ctx, rs, this.themeId);
    const orient = resolveGT005LayoutOrientation(
      this.sourceSlots,
      this.targetSlots
    );

    this.renderSideCards(ctx, rs, "left", orient, timeMs);
    this.renderSideCards(ctx, rs, "right", orient, timeMs);

    for (const [leftId, rightId] of this.mechanic.getMatchedPairs()) {
      const ls = this.findLeftSlot(leftId);
      const rslot = this.findRightSlot(rightId);
      if (ls && rslot) {
        const dt = Math.max(
          0,
          timeMs - (clock.matchedAtByLeftId.get(leftId) ?? timeMs)
        );
        const a1 = computeGT005CardAnchor(ls, "source", orient);
        const a2 = computeGT005CardAnchor(rslot, "target", orient);
        const col = this.resolvePairColorForLeft(leftId);
        drawGT005MatchedRope(ctx, rs, a1, a2, this.stageRect, col, dt);
      }
    }

    this.renderPreviewRope(ctx, orient);
    this.renderSplitLine(ctx, rs, timeMs);
    if (
      this.degradation?.particles_enabled !== false &&
      this.particles.length > 0
    ) {
      rs.drawParticles(ctx, this.particles);
    }
    drawStoryCharacterInStage(ctx, "squirrel", this.stageRect, this.slots);
  }

  private renderPreviewRope(
    ctx: CanvasRenderingContext2D,
    orient: "horizontal" | "vertical"
  ): void {
    const hover = this.pointerHoverPoint;
    if (!hover) {
      return;
    }
    const ls = this.findLeftSlot(this.mechanic.getStagedLeftId());
    if (ls) {
      const hr = this.findRightAt(hover.x, hover.y);
      const rslot = hr ? this.findRightSlot(hr.item_id) : undefined;
      const from = computeGT005CardAnchor(ls, "source", orient);
      const to = rslot
        ? computeGT005CardAnchor(rslot, "target", orient)
        : hover;
      drawGT005PreviewRope(ctx, from, to, this.stageRect, Boolean(rslot));
      return;
    }
    const rslot = this.findRightSlot(this.stagedRightId);
    if (rslot) {
      const hl = this.findLeftAt(hover.x, hover.y);
      const lslot = hl ? this.findLeftSlot(hl.item_id) : undefined;
      const from = computeGT005CardAnchor(rslot, "target", orient);
      const to = lslot
        ? computeGT005CardAnchor(lslot, "source", orient)
        : hover;
      drawGT005PreviewRope(ctx, from, to, this.stageRect, Boolean(lslot));
    }
  }

  private renderSplitLine(
    ctx: CanvasRenderingContext2D,
    rs: RenderSystem,
    timeMs: number
  ): void {
    const split = this.splitPair;
    if (!split) {
      return;
    }
    const ls = this.findLeftSlot(split.leftId);
    const rslot = this.findRightSlot(split.rightId);
    if (!(ls && rslot)) {
      return;
    }
    const elapsed = timeMs - split.startMs;
    const segments = splitLineSegments(ls, rslot, elapsed, rs.reducedMotion);
    if (segments) {
      drawSplitLine(ctx, segments, elapsed / LINE_SPLIT_MS);
    }
  }
}
