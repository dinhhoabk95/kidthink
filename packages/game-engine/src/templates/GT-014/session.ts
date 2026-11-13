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
import type { EngineView, Gesture } from "#src/interaction";
import type { KeywordAsset } from "#src/labels/spoken-keyword";
import { resolveTouchFloor } from "#src/layout/constants";
import { findHitSlotIndex, TAP_TOLERANCE_PX } from "#src/layout/hit-test";
import { resolveLayout } from "#src/layout/registry";
import type { ZoneRect } from "#src/layout/stage-zones";
import { computeTraySourceSlots } from "#src/layout/tray-layout";
import type { Slot } from "#src/layout/types";
import {
  approachPanSink,
  drawClippedToZone,
  drawSceneBackground,
  panSinkTarget,
  sceneBox,
} from "#src/render/index.js";
import type { MascotPose } from "#src/render/mascot";
import {
  type BalanceState,
  computeTiltAngle,
  getBalanceState,
  sumWeights,
  type WeightedItem,
} from "#src/systems/balance-system";
import type { DegradationState } from "#src/systems/degradation";
import {
  type ControlOfErrorDiagnostics,
  MontessoriExploreTracker,
} from "#src/systems/montessori-explore-system";
import { MoodPulse } from "#src/systems/mood-pulse";
import type { RenderSystem } from "#src/systems/render-system";
import { WrongFlash } from "#src/systems/wrong-flash";
import {
  buildGT014ViewEntities,
  type GT014StateSnapshot,
  resolveGT014HintDemoSequence,
  resolveGT014HintDestinationIndex,
  resolveGT014HintTargetForLevel,
  resolveGT014HintTargetIndex,
  resolveGT014TrayOrder,
  resolvePickExpectedSide,
} from "./layout.js";
import {
  allGT014WeightGroups,
  extractGT014PanItemData,
  GT014_HAPPY_MS,
  GT014_STORY_LINE,
  GT014_WONDER_MS,
  type GT014Content,
  type GT014Difficulty,
  populateGT014AssetMap,
  type WeightedAssetItem,
} from "./template.js";
import {
  layoutPanItems,
  maxItemWeight,
  renderGT014Stage,
  renderGT014Tray,
} from "./weight-size.js";
import {
  computeGT014PanBoxes,
  getGT014Clock,
  panTargetSlots,
  resetGT014Clock,
  resolveGT014GestureAction,
  scaleBoxInStage,
  spawnGT014CelebrateParticles,
  stepGT014Particles,
} from "./zone-layout.js";

export class BalanceScaleSession extends TemplateGameSession<
  GT014Content,
  GT014Difficulty
> {
  override readonly needsTray: boolean;
  override readonly usesPromptZone = true;
  degradation: DegradationState | null = null;

  private leftItems: WeightedItem[] = [];
  private rightItems: WeightedItem[] = [];
  private trayItems: WeightedItem[] = [];
  private initialLeftIds = new Set<string>();
  private initialRightIds = new Set<string>();
  private readonly assetById = new Map<string, KeywordAsset>();
  private selectedSide: "left" | "right" | null = null;
  private stagedItemId: string | null = null;
  private wrongSide: "left" | "right" | null = null;
  private isRoundClosed = false;
  private activeHintTier: 0 | 1 | 2 | 3 = 0;
  private currentBand: AgeBand = "5-6";
  private readonly wrongFlash = new WrongFlash();
  private readonly mood = new MoodPulse();
  private readonly exploreTracker = new MontessoriExploreTracker({
    milestoneTarget: 2,
  });
  private smoothTiltDeg = 0;
  private smoothSink: { left: number; right: number } = { left: 0, right: 0 };

  constructor(
    content: GT014Content,
    difficulty: GT014Difficulty,
    layoutSeed = 0
  ) {
    super(content, difficulty, layoutSeed);
    this.needsTray = content.goal === "balance" && content.tray.length > 0;
  }

  override get trayItemCount(): number {
    return this.content.goal === "balance" ? this.content.tray.length : 0;
  }

  getPanSinkTarget(): { left: number; right: number } {
    const c = this.content;
    const total =
      sumWeights(c.left_pan) + sumWeights(c.right_pan) + sumWeights(c.tray);
    return {
      left: panSinkTarget(sumWeights(this.leftItems), total),
      right: panSinkTarget(sumWeights(this.rightItems), total),
    };
  }

  getPanSink(): { left: number; right: number } {
    return { ...this.smoothSink };
  }

  override isAcceptingInput(): boolean {
    return !(this.isWon || this.isRoundClosed);
  }

  override takePillNarration(): string | null {
    return this.exploreTracker.takePillNarration();
  }

  setupEntities(): void {
    const c = this.content;
    this.leftItems = [...c.left_pan];
    this.rightItems = [...c.right_pan];
    this.initialLeftIds = new Set(c.left_pan.map((i) => i.item_id));
    this.initialRightIds = new Set(c.right_pan.map((i) => i.item_id));
    this.trayItems =
      c.goal === "balance"
        ? resolveGT014TrayOrder(c.tray, this.layoutSeed)
        : [];
    this.assetById.clear();
    this.selectedSide = null;
    this.stagedItemId = null;
    this.wrongSide = null;
    this.isRoundClosed = false;
    this.activeHintTier = 0;
    this.wrongFlash.clear();
    this.mood.clear();
    resetGT014Clock(this);
    this.isWon = false;
    this.exploreTracker.reset(false);
    this.smoothTiltDeg = this.getTiltAngle();
    this.smoothSink = this.getPanSinkTarget();
    this.recordEvent("game_started", {
      template_code: "GT-014",
      goal: c.goal,
      initial_tilt: this.getTiltAngle(),
    });
  }

  override storyLine(): string {
    return GT014_STORY_LINE[this.content.goal];
  }

  override mascotMood(): MascotPose | null {
    return this.isWon ? null : this.mood.current();
  }

  override onScaffoldEscalated(
    level: HintLevel,
    _trigger: "timer" | "miss_streak"
  ): void {
    this.activeHintTier = level;
  }

  override onHintCleared(): void {
    this.activeHintTier = 0;
  }

  setPointerOver(
    xOrPt: number | { readonly x: number; readonly y: number } | null,
    y?: number
  ): void {
    const px = typeof xOrPt === "number" ? xOrPt : (xOrPt?.x ?? 0);
    const py = typeof xOrPt === "number" ? (y ?? 0) : (xOrPt?.y ?? 0);
    const idx =
      xOrPt === null || !this.isAcceptingInput()
        ? -1
        : findHitSlotIndex(this.slots, px, py, "square", TAP_TOLERANCE_PX);
    getGT014Clock(this).hoveredSlotIndex = idx >= 0 ? idx : null;
  }

  clearPointerOver(): void {
    getGT014Clock(this).hoveredSlotIndex = null;
  }

  setTouchingSlot(index: number | null): void {
    getGT014Clock(this).touchingSlotIndex = index;
  }

  getTouchingSlot(): number | null {
    return getGT014Clock(this).touchingSlotIndex;
  }

  update(deltaMs: number): void {
    const safeDelta = Math.max(0, deltaMs);
    const clk = getGT014Clock(this);
    clk.logicMs += safeDelta;
    this.mood.tick(safeDelta);
    this.exploreTracker.tick(safeDelta);
    const targetTilt = this.getTiltAngle();
    const diff = targetTilt - this.smoothTiltDeg;
    const maxStep = (safeDelta / 250) * 50;
    this.smoothTiltDeg =
      Math.abs(diff) <= maxStep
        ? targetTilt
        : this.smoothTiltDeg + Math.sign(diff) * maxStep;
    const sinkTgt = this.getPanSinkTarget();
    const step = (c: number, t: number): number =>
      approachPanSink(c, t, safeDelta);
    this.smoothSink = {
      left: step(this.smoothSink.left, sinkTgt.left),
      right: step(this.smoothSink.right, sinkTgt.right),
    };
    if (this.wrongSide && this.wrongFlash.hasExpired(clk.logicMs)) {
      this.wrongSide = null;
    }
    const bounds = this.stageRect ?? { x: 0, y: 0, ...this.logicSpace };
    stepGT014Particles(clk.particles, bounds);
    this.syncStagePanSlots();
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

  getSmoothTiltAngle(): number {
    return this.smoothTiltDeg;
  }

  getLeftItems(): readonly WeightedItem[] {
    return this.leftItems;
  }

  getRightItems(): readonly WeightedItem[] {
    return this.rightItems;
  }

  getTrayItems(): readonly WeightedItem[] {
    return this.trayItems;
  }

  getLeftWeight(): number {
    return sumWeights(this.leftItems);
  }

  getRightWeight(): number {
    return sumWeights(this.rightItems);
  }

  getTiltAngle(): number {
    return computeTiltAngle(this.getLeftWeight(), this.getRightWeight());
  }

  getBalanceState(): BalanceState {
    return getBalanceState(this.getLeftWeight(), this.getRightWeight());
  }

  private snapshot(reducedMotion = false): GT014StateSnapshot {
    const c = this.content;
    const targets = this.targetSlots.slice().sort((a, b) => a.x - b.x);
    const maxWeight = maxItemWeight(allGT014WeightGroups(c));
    const assetById = populateGT014AssetMap(c, this.assetById);
    const { stageBounds, leftPan, rightPan, refBoxes } = computeGT014PanBoxes({
      stageRect: this.stageRect,
      logicSpace: this.logicSpace,
      referenceCount: c.reference_scales?.length ?? 0,
      smoothTiltDeg: this.smoothTiltDeg,
      smoothSink: this.smoothSink,
    });
    const wItems = (items: readonly WeightedItem[]): WeightedAssetItem[] =>
      items.map((i) => ({ ...i, asset: assetById.get(i.item_id) }));
    return {
      session: this,
      content: c,
      accepting: this.isAcceptingInput(),
      leftWeight: this.getLeftWeight(),
      rightWeight: this.getRightWeight(),
      slots: this.slots,
      leftPanSlot: targets[0],
      rightPanSlot: targets[1],
      sourceSlots: this.sourceSlots,
      stageRect: this.stageRect,
      stageBounds,
      leftPanBox: leftPan,
      rightPanBox: rightPan,
      leftPlaced: layoutPanItems(leftPan, wItems(this.leftItems), maxWeight),
      rightPlaced: layoutPanItems(rightPan, wItems(this.rightItems), maxWeight),
      refBoxes,
      assetById,
      maxWeight,
      tiltDeg: reducedMotion ? this.getTiltAngle() : this.smoothTiltDeg,
      sink: reducedMotion ? this.getPanSinkTarget() : this.smoothSink,
      isBalanced: this.getBalanceState() === "balanced",
      isWon: this.isWon,
      isRoundClosed: this.isRoundClosed,
      selectedSide: this.selectedSide,
      stagedItemId: this.stagedItemId,
      wrongSide: this.wrongSide,
      wrongFlash: this.wrongFlash,
      activeHintTier: this.activeHintTier,
      exploreTracker: this.exploreTracker,
      getItemState: (id: string) => this.getRenderItemState(id),
      solverInput: {
        initialLeftIds: this.initialLeftIds,
        initialRightIds: this.initialRightIds,
        leftItems: this.leftItems,
        rightItems: this.rightItems,
        trayItems: this.trayItems,
      },
    };
  }

  private completeWinIfReady(): boolean {
    if (!this.checkWinCondition()) {
      return false;
    }
    this.wrongSide = null;
    this.exploreTracker.recordCorrectAttempt();
    this.winSession();
    const s = this.snapshot();
    const pans =
      this.content.goal === "balance"
        ? [s.leftPanBox, s.rightPanBox]
        : [this.selectedSide === "right" ? s.rightPanBox : s.leftPanBox];
    const particlesOn = this.degradation?.particles_enabled ?? true;
    getGT014Clock(this).particles = spawnGT014CelebrateParticles(
      pans,
      s.stageBounds,
      particlesOn
    );
    return true;
  }

  private applyPanTransfer(
    from: WeightedItem[],
    to: WeightedItem[],
    itemId: string,
    placedPan?: "left" | "right"
  ): boolean {
    if (!this.isAcceptingInput()) {
      return false;
    }
    const idx = from.findIndex((t) => t.item_id === itemId);
    const item = idx >= 0 ? from.splice(idx, 1)[0] : undefined;
    if (!item) {
      return false;
    }
    to.push(item);
    this.activeHintTier = 0;
    this.queueSfx("scale_creak");
    this.mood.set("happy", GT014_HAPPY_MS);
    this.exploreTracker.recordExploreAction("pan_item_changed");
    this.recordEvent("explore_action", {
      kind: "pan_item_changed",
      count: this.exploreTracker.getExploreActionsCount(),
    });
    if (placedPan) {
      this.recordEvent("item_placed", { item_id: itemId, pan: placedPan });
    }
    this.recordEvent("balance_changed", {
      tilt_angle: this.getTiltAngle(),
      state: this.getBalanceState(),
    });
    this.syncStagePanSlots();
    this.completeWinIfReady();
    return true;
  }

  placeItem(itemId: string, targetPan: "left" | "right"): boolean {
    const dest = targetPan === "left" ? this.leftItems : this.rightItems;
    return this.applyPanTransfer(this.trayItems, dest, itemId, targetPan);
  }

  returnItem(itemId: string, fromPan: "left" | "right"): boolean {
    return this.returnItemToTray(itemId, fromPan);
  }

  private canReturnPanItem(itemId: string, pan: "left" | "right"): boolean {
    const initIds = pan === "left" ? this.initialLeftIds : this.initialRightIds;
    const panItems = pan === "left" ? this.leftItems : this.rightItems;
    return !initIds.has(itemId) && panItems.some((i) => i.item_id === itemId);
  }

  returnItemToTray(itemId: string, fromPan: "left" | "right"): boolean {
    if (!this.canReturnPanItem(itemId, fromPan)) {
      return false;
    }
    const src = fromPan === "left" ? this.leftItems : this.rightItems;
    return this.applyPanTransfer(src, this.trayItems, itemId);
  }

  selectSide(side: "left" | "right"): void {
    if (!this.isAcceptingInput()) {
      return;
    }
    this.selectedSide = side;
    this.activeHintTier = 0;
    if (this.completeWinIfReady()) {
      return;
    }
    const clk = getGT014Clock(this);
    this.wrongSide = side;
    this.wrongFlash.clear();
    this.wrongFlash.trigger(clk.logicMs);
    this.mood.set("wonder", GT014_WONDER_MS);
    const leftW = this.getLeftWeight();
    const rightW = this.getRightWeight();
    const reasonVi =
      leftW > rightW
        ? `Bên trái (${leftW}) nặng hơn bên phải (${rightW})`
        : `Bên phải (${rightW}) nặng hơn bên trái (${leftW})`;
    this.exploreTracker.recordWrongAttempt({
      reasonVi,
      targetId: side,
      actualValue: side === "left" ? leftW : rightW,
      expectedValue: side === "left" ? rightW : leftW,
    });
    this.recordEvent("control_of_error", {
      side,
      left_weight: leftW,
      right_weight: rightW,
      micro_sandbox: this.exploreTracker.isMicroSandboxActive(),
    });
    if (this.difficulty.allow_retry === false) {
      this.isRoundClosed = true;
      this.completeSession();
    }
  }

  getSelectedSide(): "left" | "right" | null {
    return this.selectedSide;
  }

  getStagedItemId(): string | null {
    return this.stagedItemId;
  }

  validateAction(action: GameAction): ActionResult {
    if (!this.isAcceptingInput()) {
      return ACTION_IGNORED;
    }
    if (action.type === "place_item") {
      const place = extractGT014PanItemData(action.data, "target_pan");
      return place && this.trayItems.some((i) => i.item_id === place.itemId)
        ? ACTION_CORRECT
        : ACTION_RETRY;
    }
    if (action.type === "return_item") {
      const r = extractGT014PanItemData(
        action.data,
        "from_pan",
        this.leftItems
      );
      return r &&
        this.content.goal === "balance" &&
        this.canReturnPanItem(r.itemId, r.pan)
        ? ACTION_CORRECT
        : ACTION_RETRY;
    }
    if (action.type === "select_side") {
      const exp = resolvePickExpectedSide(
        this.content.goal,
        this.getLeftWeight(),
        this.getRightWeight()
      );
      return action.data === exp ? ACTION_CORRECT : ACTION_RETRY;
    }
    return ACTION_IGNORED;
  }

  override toAction(gesture: Gesture): GameAction | null {
    if (!this.isAcceptingInput()) {
      return null;
    }
    const res = resolveGT014GestureAction(this.snapshot(), gesture);
    this.stagedItemId = res.nextStagedItemId;
    return res.action;
  }

  override getHintTargetIndex(): number | null {
    return resolveGT014HintTargetIndex(this.snapshot());
  }

  override getHintDestinationIndex(): number | null {
    return resolveGT014HintDestinationIndex(this.snapshot());
  }

  override getHintTargetForLevel(level: HintLevel): HintTarget | null {
    return resolveGT014HintTargetForLevel(this.snapshot(), level);
  }

  override getHintDemoSequence(
    level: HintLevel = 3
  ): readonly HintDemoStep[] | null {
    return resolveGT014HintDemoSequence(this.snapshot(), level);
  }

  override commit(action: GameAction): void {
    if (!this.isAcceptingInput()) {
      return;
    }
    if (action.type === "place_item") {
      const p = extractGT014PanItemData(action.data, "target_pan");
      if (p) {
        this.placeItem(p.itemId, p.pan);
        this.stagedItemId = null;
      }
    } else if (action.type === "return_item") {
      const r = extractGT014PanItemData(
        action.data,
        "from_pan",
        this.leftItems
      );
      if (r) {
        this.returnItemToTray(r.itemId, r.pan);
      }
    } else if (
      action.type === "select_side" &&
      (action.data === "left" || action.data === "right")
    ) {
      this.selectSide(action.data);
    }
  }

  override getView(): EngineView {
    return {
      activePrompt: this.content.prompt,
      entities: buildGT014ViewEntities(this.snapshot()),
    };
  }

  override checkWinCondition(): boolean {
    const leftW = this.getLeftWeight();
    const rightW = this.getRightWeight();
    if (this.content.goal === "balance") {
      return leftW === rightW && leftW > 0;
    }
    return (
      this.selectedSide !== null &&
      this.selectedSide ===
        resolvePickExpectedSide(this.content.goal, leftW, rightW)
    );
  }

  override destroy(): void {
    super.destroy();
    this.leftItems = [];
    this.rightItems = [];
    this.trayItems = [];
    this.selectedSide = null;
  }

  private computeCurrentPanTargets(
    ageBand = this.currentBand
  ): readonly Slot[] {
    if (!this.stageRect) {
      return [];
    }
    const refCount = this.content.reference_scales?.length ?? 0;
    return panTargetSlots(
      scaleBoxInStage(this.stageRect, refCount),
      resolveTouchFloor(ageBand, this.cssPerLogic),
      this.smoothTiltDeg,
      this.smoothSink,
      this.stageRect
    );
  }

  private syncStagePanSlots(): void {
    if (this.stageRect) {
      this.targetSlots = this.computeCurrentPanTargets();
      this._slotsInternal = [...this.targetSlots, ...this.sourceSlots];
    }
  }

  protected computeSlots(ageBand: AgeBand): readonly Slot[] {
    this.currentBand = ageBand;
    if (!this.stageRect) {
      return resolveLayout("split-columns")({
        slotCount: this.trayItems.length,
        targetCount: 2,
        ageBand,
        logic: this.logicSpace,
      });
    }
    const floor = resolveTouchFloor(ageBand, this.cssPerLogic);
    const n = this.trayItems.length;
    const src = this.trayRect
      ? computeTraySourceSlots(n, this.trayRect, floor, 2, false)
      : [];
    return [...this.computeCurrentPanTargets(ageBand), ...src];
  }

  render(
    ctx: CanvasRenderingContext2D,
    rs: RenderSystem,
    timeMs: number
  ): void {
    drawSceneBackground(ctx, rs, this.themeId);
    const snap = this.snapshot(rs.reducedMotion);
    const clip = (z: ZoneRect | undefined, fn: () => void): void =>
      z ? drawClippedToZone(ctx, z, fn) : fn();
    clip(this.stageRect, () => renderGT014Stage(ctx, rs, snap, timeMs));
    if (this.trayItems.length > 0) {
      const tb = this.trayRect ?? sceneBox(rs);
      clip(this.trayRect, () => renderGT014Tray(ctx, rs, snap, tb, timeMs));
    }
  }
}

export const GT014Session = BalanceScaleSession;
