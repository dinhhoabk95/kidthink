import type { AgeBand } from "#src/contracts/types";
import {
  ACTION_CORRECT,
  ACTION_IGNORED,
  ACTION_QUIET_OK,
  ACTION_RETRY,
  type ActionResult,
  type GameAction,
  type HintDemoStep,
  type HintLevel,
  type HintTarget,
  TemplateGameSession,
} from "#src/game-session";
import type { EngineView, Gesture } from "#src/interaction";
import { findHitSlotIndex, TAP_TOLERANCE_PX } from "#src/layout/hit-test";
import { resolveLayout } from "#src/layout/registry";
import {
  dockRectAroundSlots,
  insetDrawSize,
  splitCaption,
} from "#src/layout/slot-fit";
import type { ZoneRect } from "#src/layout/stage-zones";
import type { Slot } from "#src/layout/types";
import {
  drawGT028BrokenAssetFallback,
  drawGT028LilypadSlotBase,
  drawGT028PondTrackDecor,
  drawGT028RunningTotalBadge,
  drawGT028ScaffoldOverlay,
} from "#src/render/gt-028-shapes";
import {
  drawFrogNumberLine,
  drawHeaderRepresentation,
  drawMontessoriControlOfErrorPill,
  drawSceneBackground,
  drawSlotItem,
  drawStepGroupIcon,
  drawWoodenTokenDock,
  type SceneBox,
  sceneBox,
} from "#src/render/index.js";
import type { MascotPose } from "#src/render/mascot";
import type { DegradationState } from "#src/systems/degradation";
import {
  type ControlOfErrorDiagnostics,
  MontessoriExploreTracker,
} from "#src/systems/montessori-explore-system";
import type { RenderSystem } from "#src/systems/render-system";
import {
  GT028_TAP_RIPPLE_MS,
  GT028_WRONG_SUBMIT_MS,
  type GT028Clock,
  type GT028HintQuery,
  type GT028Item,
  gt28,
} from "./layout.js";
import type { GT028Content, GT028Difficulty } from "./template.js";

export const GT028_STORY_LINE =
  "Ếch Xanh nhảy cóc trên tia số. Bé chạm mỗi quả là Ếch nhảy thêm một bước, nhảy đủ rồi bé bấm xong nhé!";
export const GT028_HOP_MS = 700;
export const GT028_WONDER_MS = 1500;

interface Point2D {
  readonly x: number;
  readonly y: number;
}

interface RenderSlotParams {
  readonly clip: ZoneRect;
  readonly clock: GT028Clock;
  readonly isWrong: boolean;
  readonly item: GT028Item;
  readonly slot: Slot;
}

export class GT028Session extends TemplateGameSession<
  GT028Content,
  GT028Difficulty
> {
  override readonly needsCommit = true;
  override readonly usesPromptZone = true;
  degradation: DegradationState | null = null;
  selectedItemIds: string[] = [];
  private readonly exploreTracker = new MontessoriExploreTracker({
    milestoneTarget: 2,
  });
  private items: GT028Item[] = [...this.content.items];
  private activeRoundGen = 0;
  private reactionPose: MascotPose | null = null;
  private reactionRemainingMs = 0;

  override canCommit(): boolean {
    return this.selectedItemIds.length > 0;
  }
  override isAcceptingInput(): boolean {
    return !this.isWon;
  }
  override storyLine(): string {
    return GT028_STORY_LINE;
  }
  override mascotMood(): MascotPose | null {
    return this.reactionRemainingMs > 0 && !this.isWon
      ? this.reactionPose
      : null;
  }
  override checkWinCondition(): boolean {
    return this.isWon;
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
  override takePillNarration(): string | null {
    return this.exploreTracker.takePillNarration();
  }
  getCurrentCount(): number {
    return this.selectedItemIds.length * this.content.step;
  }
  clearPointerOver(): void {
    gt28.clockOf(this).hoveredItemId = null;
  }
  override onScaffoldEscalated(lv: HintLevel, _t?: string): void {
    gt28.clockOf(this).activeHintLevel = lv;
  }
  override onHintCleared(): void {
    gt28.clockOf(this).activeHintLevel = 0;
  }
  override getHintTargetIndex(): number | null {
    return gt28.hintIdx(this.hintQ());
  }
  override getHintTargetForLevel(level: HintLevel): HintTarget | null {
    return gt28.hintForLv(level, this.hintQ());
  }
  override getHintDemoSequence(lv: HintLevel): readonly HintDemoStep[] | null {
    return gt28.hintDemo(lv, this.hintQ());
  }

  private react(pose: MascotPose, ms: number): void {
    this.reactionPose = pose;
    this.reactionRemainingMs = ms;
  }

  update(deltaMs: number): void {
    if (this.reactionRemainingMs > 0) {
      const rem = this.reactionRemainingMs - deltaMs;
      this.reactionRemainingMs = Math.max(0, rem);
    }
    const c = gt28.clockOf(this);
    c.updateMs += deltaMs;
    const wEl = gt28.elapsedMs(c, c.wrongSubmitStamp);
    if (c.wrongSubmitStamp && wEl >= GT028_WRONG_SUBMIT_MS) {
      c.wrongSubmitStamp = null;
    }
    this.exploreTracker.tick(deltaMs);
  }

  setupEntities(): void {
    this.isWon = false;
    this.selectedItemIds = [];
    this.renderItemStates.clear();
    this.reactionPose = null;
    this.reactionRemainingMs = 0;
    this.activeRoundGen = this.roundGeneration;
    gt28.clockOf(this, true);
    this.exploreTracker.reset(false);
    const shuf = this.difficulty.shuffle_items === true;
    const { items, step, target_total } = this.content;
    const gen = this.activeRoundGen;
    this.items = gt28.shuffleRound(items, shuf, this.layoutSeed, gen);
    const ev = { step, target_total, item_count: items.length };
    this.recordEvent("game_started", ev);
  }

  setPointerOver(xOrPt: number | Point2D, yArg?: number): void {
    if (!this.isAcceptingInput()) {
      gt28.clockOf(this).hoveredItemId = null;
      return;
    }
    const x = typeof xOrPt === "number" ? xOrPt : xOrPt.x;
    const y = typeof xOrPt === "number" ? (yArg ?? 0) : xOrPt.y;
    const idx = findHitSlotIndex(this.slots, x, y, "circle", TAP_TOLERANCE_PX);
    gt28.clockOf(this).hoveredItemId =
      idx >= 0 ? (this.items[idx]?.item_id ?? null) : null;
  }

  validateAction(action: GameAction): ActionResult {
    if (!this.isAcceptingInput()) {
      return ACTION_IGNORED;
    }
    if (action.type === "tap_item" || action.type === "select_item") {
      const id = gt28.parseItemId(action.data);
      if (id === null || !this.content.items.some((i) => i.item_id === id)) {
        return ACTION_IGNORED;
      }
      return this.selectedItemIds.includes(id) && !this.difficulty.allow_undo
        ? ACTION_IGNORED
        : ACTION_CORRECT;
    }
    if (action.type === "submit_count" || action.type === "submit") {
      return this.getCurrentCount() === this.content.target_total
        ? ACTION_CORRECT
        : ACTION_RETRY;
    }
    return ACTION_IGNORED;
  }

  override toAction(g: Gesture): GameAction | null {
    if (!this.isAcceptingInput()) {
      return null;
    }
    if (g.type === "commit") {
      return { type: "submit_count", data: {} };
    }
    if (g.type === "tap") {
      const tol = TAP_TOLERANCE_PX;
      const idx = findHitSlotIndex(this.slots, g.x, g.y, "circle", tol);
      const it = idx >= 0 ? this.items[idx] : undefined;
      return it ? { type: "tap_item", data: { item_id: it.item_id } } : null;
    }
    return null;
  }

  override commit(action: GameAction): void {
    if (action.type === "tap_item" || action.type === "select_item") {
      const id = gt28.parseItemId(action.data);
      if (id !== null) {
        this.onTapItem(id);
      }
    } else if (action.type === "submit_count" || action.type === "submit") {
      this.onSubmitCount();
    }
  }

  override getView(): EngineView {
    return gt28.buildView({
      clock: gt28.clockOf(this),
      isWon: this.isWon,
      items: this.items,
      prompt: this.content.prompt,
      renderStates: this.renderItemStates,
      selectedIds: this.selectedItemIds,
      slots: this.slots,
      step: this.content.step,
      targetTotal: this.content.target_total,
    });
  }

  onTapItem(itemId: string): ActionResult {
    const hasItem = this.content.items.some((i) => i.item_id === itemId);
    if (!(this.isAcceptingInput() && hasItem)) {
      return ACTION_IGNORED;
    }
    const ck = gt28.clockOf(this);
    const [pCnt, pTick] = [this.getCurrentCount(), this.selectedItemIds.length];
    const index = this.selectedItemIds.indexOf(itemId);
    const s = this.content.step;

    if (index === -1) {
      this.selectedItemIds.push(itemId);
      const nCnt = this.getCurrentCount();
      gt28.stepFrogCount(ck, pTick, pTick + 1, pCnt, nCnt);
      ck.itemTapStamps.set(itemId, gt28.stampOf(ck));
      ck.activeHintLevel = 0;
      this.setRenderItemState(itemId, "selected");
      this.exploreTracker.recordExploreAction("step_counted");
      this.queueSfx("frog_hop");
      this.react("happy", GT028_HOP_MS);
      const ev = { item_id: itemId, current_total: nCnt, step: s };
      this.recordEvent("item_tapped", ev);
      return ACTION_QUIET_OK;
    }

    if (this.difficulty.allow_undo) {
      this.selectedItemIds.splice(index, 1);
      const [nCnt, nTick] = [
        this.getCurrentCount(),
        this.selectedItemIds.length,
      ];
      gt28.stepFrogCount(ck, pTick, nTick, pCnt, nCnt);
      ck.activeHintLevel = 0;
      this.setRenderItemState(itemId, "idle");
      this.exploreTracker.recordExploreAction("step_counted");
      const ev = { item_id: itemId, current_total: nCnt, step: s };
      this.recordEvent("count_undone", ev);
      return ACTION_QUIET_OK;
    }
    return ACTION_IGNORED;
  }

  onSubmitCount(): ActionResult {
    if (!this.isAcceptingInput()) {
      return ACTION_IGNORED;
    }
    const [c, t] = [this.getCurrentCount(), this.content.target_total];
    const ok = c === t;
    const ck = gt28.clockOf(this);
    const sub = { submitted_total: c, target_total: t, is_correct: ok };
    this.recordEvent("count_submitted", sub);

    if (ok) {
      this.exploreTracker.recordCorrectAttempt();
      this.isWon = true;
      ck.winStamp = gt28.stampOf(ck);
      ck.activeHintLevel = 0;
      this.recordEvent("game_completed", { score: 100 });
      this.winSession();
      return ACTION_CORRECT;
    }

    const d = t - c;
    const reasonVi =
      d > 0
        ? "Còn thiếu một chút, bé đếm thêm nhé!"
        : "Nhiều quá rồi, bé bớt đi nhé!";
    const wInfo = { reasonVi, actualValue: c, expectedValue: t };
    this.exploreTracker.recordWrongAttempt(wInfo);
    const msb = this.exploreTracker.isMicroSandboxActive();
    const err = { current_total: c, target_total: t, micro_sandbox: msb };
    this.recordEvent("control_of_error", err);
    ck.wrongSubmitStamp = gt28.stampOf(ck);
    this.react("wonder", GT028_WONDER_MS);
    return ACTION_RETRY;
  }

  override destroy(): void {
    super.destroy();
    this.renderItemStates.clear();
    this.selectedItemIds = [];
    gt28.clockOf(this, true);
  }

  private hintQ(): GT028HintQuery {
    return {
      allowUndo: this.difficulty.allow_undo !== false,
      currentTotal: this.getCurrentCount(),
      disabled: !this.isAcceptingInput(),
      items: this.items,
      selectedIds: this.selectedItemIds,
      slots: this.slots,
      step: this.content.step,
      targetTotal: this.content.target_total,
    };
  }

  override getHintTarget(): HintTarget | null {
    const target = super.getHintTarget();
    const ok = this.getCurrentCount() === this.content.target_total;
    return target?.kind === "action" && !ok ? null : target;
  }

  protected computeSlots(ageBand: AgeBand): readonly Slot[] {
    const stage = this.stageRect
      ? splitCaption(this.stageRect).body
      : undefined;
    const slotCount = this.content.items.length;
    const { logicSpace: logic, cssPerLogic } = this;
    const cfg = { slotCount, ageBand, logic, stage, cssPerLogic };
    return insetDrawSize(resolveLayout("grid")(cfg), stage ?? this.stageRect);
  }

  private renderSlot(
    ctx: CanvasRenderingContext2D,
    rs: RenderSystem,
    p: RenderSlotParams
  ): void {
    const { item: it, slot: s, clip: c, clock: ck, isWrong: isWr } = p;
    const selIdx = this.selectedItemIds.indexOf(it.item_id);
    const [isSel, isHov] = [selIdx !== -1, ck.hoveredItemId === it.item_id];
    const label = isSel ? `${(selIdx + 1) * this.content.step}` : undefined;
    const tapEl = gt28.elapsedMs(ck, ck.itemTapStamps.get(it.item_id));
    const tapProgress =
      tapEl < GT028_TAP_RIPPLE_MS ? tapEl / GT028_TAP_RIPPLE_MS : null;
    const state = gt28.lilyState(this.isWon, isSel, isHov, isWr);
    const lilyParams = {
      clip: c,
      label,
      particlesOff: this.degradation?.particles_enabled === false,
      shadowsOff: this.degradation?.soft_shadows_enabled === false,
      slot: s,
      state,
      step: this.content.step,
      tapProgress,
      timeMs: ck.lastRenderMs ?? 0,
    };
    drawGT028LilypadSlotBase(ctx, rs, lilyParams);
    if (gt28.isBrokenAsset(it.asset)) {
      drawGT028BrokenAssetFallback(ctx, rs, lilyParams);
    } else {
      const fb = this.getRenderItemState(it.item_id);
      const vis = gt28.slotVisual(this.isWon, isSel, isHov, fb);
      drawSlotItem(ctx, rs, s, {
        id: it.item_id,
        asset: it.asset,
        label,
        state: vis,
      });
    }
    if (isSel) {
      const gSz = Math.max(20, Math.min(s.w, s.h) * 0.36);
      const [gx, gy] = [s.x + s.w * 0.28, s.y - s.h * 0.28];
      drawStepGroupIcon(ctx, gx, gy, gSz, this.content.step);
    }
  }

  render(
    ctx: CanvasRenderingContext2D,
    rs: RenderSystem,
    timeMs: number
  ): void {
    const ck = gt28.clockOf(this);
    gt28.tickClock(ck, timeMs);
    drawSceneBackground(ctx, rs, this.themeId);
    const c: ZoneRect = this.stageRect ?? sceneBox(rs);
    const body = this.stageRect ? splitCaption(this.stageRect).body : undefined;
    const dock: SceneBox | undefined =
      dockRectAroundSlots(this.slots, body) ?? undefined;
    if (dock) {
      drawWoodenTokenDock(ctx, rs, dock);
    }
    const [lw, lh] = [rs.LOGIC_WIDTH, rs.LOGIC_HEIGHT];
    const fbCap: ZoneRect = { x: lw * 0.1, y: lh * 0.2, w: lw * 0.8, h: 44 };
    const cap = this.stageRect ? splitCaption(this.stageRect).caption : fbCap;
    const h = ck.frogStamp ? gt28.elapsedMs(ck, ck.frogStamp) : 0;
    const [step, ticks] = [this.content.step, this.items.length];
    const [f0, f1] = [ck.frogFromTick, ck.frogToTick];
    const wEl = gt28.elapsedMs(ck, ck.wrongSubmitStamp);
    const wp = wEl < GT028_WRONG_SUBMIT_MS ? wEl / GT028_WRONG_SUBMIT_MS : null;
    const line = { step, ticks, fromTick: f0, toTick: f1, hopElapsedMs: h };
    drawGT028PondTrackDecor(ctx, rs, {
      captionRect: cap,
      clip: c,
      dockRect: dock,
      line,
      wrongProgress: wp,
    });
    drawFrogNumberLine(ctx, rs, cap, line);

    const cur = this.getCurrentCount();
    const rep = this.content.representation;
    if (!this.stageRect && (rep === "tally" || rep === "rekenrek")) {
      drawHeaderRepresentation(ctx, rs, rep, cur);
    }
    this.items.forEach((item, i) => {
      const slot = this.slots[i];
      if (slot) {
        this.renderSlot(ctx, rs, {
          clip: c,
          clock: ck,
          isWrong: wp !== null,
          item,
          slot,
        });
      }
    });
    const [tot, isCnt, pulse] = gt28.countView(ck, cur, rs.reducedMotion);
    const badgeBox = drawGT028RunningTotalBadge(ctx, rs, {
      clip: c,
      displayedTotal: tot,
      dockRect: dock,
      isCounting: isCnt,
      isWon: this.isWon,
      scalePulse: pulse,
      shadowsOff: this.degradation?.soft_shadows_enabled === false,
      wrongProgress: wp,
    });
    const sc = gt28.scaffoldVis({
      badgeBox,
      captionRect: cap,
      clip: c,
      clock: ck,
      query: this.hintQ(),
    });
    if (sc) {
      drawGT028ScaffoldOverlay(ctx, rs, sc);
    }
    const scScale = rs.viewport?.scale;
    drawMontessoriControlOfErrorPill(ctx, c, this.exploreTracker, scScale);
  }
}
