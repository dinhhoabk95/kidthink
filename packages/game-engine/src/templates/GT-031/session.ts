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
import { coinDiameter, coinTierOf } from "#src/layout/coin-tiers";
import { resolveTouchFloor } from "#src/layout/constants";
import { findHitSlotIndex, TAP_TOLERANCE_PX } from "#src/layout/hit-test.js";
import { resolveLayout } from "#src/layout/registry";
import { insetDrawSize, splitCaption } from "#src/layout/slot-fit";
import type { ZoneRect } from "#src/layout/stage-zones";
import {
  computeStageTargetSlot,
  computeTraySourceSlots,
  pickTrayZones,
} from "#src/layout/tray-layout";
import type { Slot } from "#src/layout/types";
import {
  drawGT031CoinTrayDecor,
  drawGT031DepositedStack,
  drawGT031SolutionGhost,
  drawGT031TargetDecor,
  drawGT031TotalMeter,
} from "#src/render/gt-031-shapes";
import {
  drawMarketStall,
  drawMontessoriCoin,
  drawPiggyBank,
  drawProgressDots,
  drawSceneBackground,
  drawSlotItem,
  drawWoodenTokenDock,
  type ItemVisualState,
  marketStallGeometry,
  piggyBounceScale,
  slotLabelBandPx,
  spawnParticlesAtSlot,
  updateParticles,
} from "#src/render/index";
import type { MascotPose } from "#src/render/mascot";
import { spaceOf } from "#src/render/type-scale";
import type { DegradationState } from "#src/systems/degradation";
import type { Particle, RenderSystem } from "#src/systems/render-system";
import {
  buildDepositedCoinViews,
  clearDepositAnchor,
  computeCoinTrayBox,
  computeDepositedStackLayout,
  computeSolutionGhostPills,
  computeSolutionSubset,
  computeTargetDecorLayout,
  computeTotalMeterDots,
  computeTotalMeterRect,
  deleteGT031VisualState,
  derangeCoins,
  extractCoinIdFromData,
  type GT031Coin,
  getGT031VisualState,
  markDepositAnchor,
  resetGT031VisualState,
  resolveHintDemoSequence,
  resolveHintTargetForLevel,
  resolveNextHintStep,
  sampleDisplayedTotal,
  samplePiggyElapsedMs,
  sampleWrongIntensity,
  startCounterAnim,
} from "#src/templates/GT-031/layout";
import type {
  GT031Content,
  GT031Difficulty,
} from "#src/templates/GT-031/template";
import {
  buildGT031EngineView,
  resolveGT031DisplayAsset,
  resolveGT031DropAction,
} from "#src/templates/GT-031/view";

const PAYMENT_TARGET_MAX_PX = 160;
const WRONG_PAY_MS = 1200;
const QUIET_OK: ActionResult = Object.freeze({ valid: true, feedback: "none" });
const PAYMENT_TARGET_PAD_PX = 32;
const MONEY_PROGRESS_MAX_DOTS = 12;

const DEPOSIT_ACTION_TYPES = new Set([
  "deposit_coin",
  "place_coin",
  "tap_coin",
  "select_coin",
  "drag_coin",
]);
const REMOVE_ACTION_TYPES = new Set([
  "remove_coin",
  "undo_coin",
  "withdraw_coin",
]);

export const GT031_STORY_LINE =
  "Heo Đất đi chợ quê, bé gom xu bỏ vào bụng Heo cho đủ tiền mua nhé, gom xong thì bấm trả!";
export const GT031_ENCOURAGE_MS = 1500;

export class GT031Session extends TemplateGameSession<
  GT031Content,
  GT031Difficulty
> {
  override readonly needsTray = true;
  override readonly usesPromptZone = true;
  override readonly needsCommit = true;

  override get trayItemCount(): number {
    return this.content.coins.length;
  }
  override get trayHasLabels(): boolean {
    return true;
  }

  degradation: DegradationState | null = null;
  depositedCoinIds: string[] = [];
  currentTotal = 0;
  isWin = false;

  private particles: Particle[] = [];
  private encourageRemainingMs = 0;
  private coinTouchFloor = 0;
  private orderedCoins: readonly GT031Coin[] = [];
  private replayRound = 0;

  private getTrayCoins(): readonly GT031Coin[] {
    if (this.orderedCoins.length === this.content.coins.length) {
      return this.orderedCoins;
    }
    return derangeCoins(this.content.coins, this.layoutSeed, this.replayRound);
  }

  getOrderedCoins(): readonly GT031Coin[] {
    return this.getTrayCoins();
  }

  override storyLine(): string {
    return GT031_STORY_LINE;
  }

  override mascotMood(): MascotPose | null {
    const visual = getGT031VisualState(this);
    if (visual.isClosedWrong || this.isWon) {
      return null;
    }
    return this.encourageRemainingMs > 0 ? "encourage" : null;
  }

  override canCommit(): boolean {
    const visual = getGT031VisualState(this);
    if (this.isWin || this.isWon || visual.isClosedWrong) {
      return false;
    }
    return this.depositedCoinIds.length > 0;
  }

  override isAcceptingInput(): boolean {
    const visual = getGT031VisualState(this);
    return !(this.isWin || this.isWon || visual.isClosedWrong);
  }

  override destroy(): void {
    deleteGT031VisualState(this);
    this.particles = [];
    super.destroy();
  }

  override onHintCleared(): void {
    const visual = getGT031VisualState(this);
    visual.hintTargetId = null;
    visual.hintLevel = 0;
  }

  setPointerOver(x: number, y: number): void {
    if (!this.isAcceptingInput()) {
      this.clearPointerOver();
      return;
    }
    const visual = getGT031VisualState(this);
    const coins = this.getTrayCoins();
    const coinSlots = this.slots.slice(1, 1 + coins.length);
    const index = findHitSlotIndex(coinSlots, x, y, "circle", TAP_TOLERANCE_PX);
    const coin = coins[index];
    visual.hoveredCoinId = coin ? coin.coin_id : null;
  }

  clearPointerOver(): void {
    getGT031VisualState(this).hoveredCoinId = null;
  }

  update(deltaMs: number): void {
    const visual = getGT031VisualState(this);
    visual.simMs += deltaMs;
    if (this.encourageRemainingMs > 0) {
      this.encourageRemainingMs = Math.max(
        0,
        this.encourageRemainingMs - deltaMs
      );
    }
    if (this.particles.length > 0) {
      this.particles = updateParticles(this.particles);
    }
  }

  setupEntities(): void {
    resetGT031VisualState(this);
    this.replayRound += 1;
    this.orderedCoins = derangeCoins(
      this.content.coins,
      this.layoutSeed,
      this.replayRound,
      this.orderedCoins.length > 0 ? this.orderedCoins : undefined
    );
    this.encourageRemainingMs = 0;
    this.depositedCoinIds = [];
    this.currentTotal = 0;
    this.isWin = false;
    this.particles = [];
    this.recordEvent("game_started", {
      template_code: "GT-031",
      target_amount: this.content.target_amount,
      coin_count: this.content.coins.length,
    });
  }

  override getHintTarget(): HintTarget | null {
    if (!this.isAcceptingInput()) {
      return null;
    }
    const step = resolveNextHintStep(
      this.getTrayCoins(),
      this.depositedCoinIds,
      this.content.target_amount,
      this.difficulty.exact_change
    );
    if (step.kind === "submit") {
      return { kind: "action" };
    }
    return super.getHintTarget();
  }

  override getHintTargetIndex(): number | null {
    if (!this.isAcceptingInput()) {
      return null;
    }
    const coins = this.getTrayCoins();
    const step = resolveNextHintStep(
      coins,
      this.depositedCoinIds,
      this.content.target_amount,
      this.difficulty.exact_change
    );
    if (!step.coinId || step.kind === "submit") {
      return null;
    }
    const coinIdx = coins.findIndex((c) => c.coin_id === step.coinId);
    const slot = this.sourceSlots[coinIdx];
    return slot ? slot.index : null;
  }

  override getHintDestinationIndex(): number | null {
    const index = this.getHintTargetIndex();
    if (index === null || index === 0) {
      return null;
    }
    const coins = this.getTrayCoins();
    const coinIdx = this.sourceSlots.findIndex((slot) => slot.index === index);
    const coin = coins[coinIdx];
    if (!coin || this.depositedCoinIds.includes(coin.coin_id)) {
      return null;
    }
    return this.slots[0] ? 0 : null;
  }

  override getHintTargetForLevel(level: HintLevel): HintTarget | null {
    if (!this.isAcceptingInput()) {
      return null;
    }
    const visual = getGT031VisualState(this);
    const coins = this.getTrayCoins();
    visual.hintLevel = level;
    visual.hintTargetId = resolveHintTargetForLevel(
      level,
      coins,
      this.depositedCoinIds,
      this.content.target_amount,
      this.difficulty.exact_change
    );
    const step = resolveNextHintStep(
      coins,
      this.depositedCoinIds,
      this.content.target_amount,
      this.difficulty.exact_change
    );
    if (step.kind === "submit") {
      return { kind: "action" };
    }
    if (!step.coinId) {
      return null;
    }
    if (level === 1) {
      return { kind: "region", ids: ["current-total", "payment-target"] };
    }
    if (level === 2) {
      return { kind: "region", ids: [step.coinId] };
    }
    const coinIdx = coins.findIndex((c) => c.coin_id === step.coinId);
    const slot = this.sourceSlots[coinIdx];
    if (!slot) {
      return null;
    }
    return step.kind === "deposit"
      ? { kind: "slot", index: slot.index, toIndex: 0 }
      : { kind: "slot", index: slot.index };
  }

  override getHintDemoSequence(
    level: HintLevel
  ): readonly HintDemoStep[] | null {
    if (!this.isAcceptingInput() || level < 3) {
      return null;
    }
    const coins = this.getTrayCoins();
    const seqSteps = resolveHintDemoSequence(
      level,
      coins,
      this.depositedCoinIds,
      this.content.target_amount,
      this.difficulty.exact_change
    );
    const steps: HintDemoStep[] = [];
    for (const step of seqSteps) {
      if (!step.coinId || step.kind === "submit") {
        break;
      }
      const coinIdx = coins.findIndex((c) => c.coin_id === step.coinId);
      const slot = this.sourceSlots[coinIdx];
      if (!slot) {
        continue;
      }
      steps.push(
        step.kind === "remove"
          ? { from: slot.index }
          : { from: slot.index, to: 0 }
      );
    }
    return steps.length >= 2 ? steps : null;
  }

  protected computeSlots(band: AgeBand): readonly Slot[] {
    this.coinTouchFloor = resolveTouchFloor(band, this.cssPerLogic);
    const zones = pickTrayZones(this.stageRect, this.trayRect);
    if (zones) {
      const touchFloor = this.coinTouchFloor;
      const { body } = splitCaption(zones.stage);
      const size = Math.max(
        touchFloor,
        Math.floor(
          Math.min(
            PAYMENT_TARGET_MAX_PX,
            body.w - PAYMENT_TARGET_PAD_PX,
            body.h - PAYMENT_TARGET_PAD_PX
          )
        )
      );
      const target = computeStageTargetSlot(body, size, touchFloor, 0);
      const coins = computeTraySourceSlots(
        this.content.coins.length,
        zones.tray,
        touchFloor,
        1,
        true
      );
      return insetDrawSize([target, ...coins], zones.stage);
    }
    const layoutFn = resolveLayout("multi-bucket-bottom");
    const laidOut = layoutFn({
      slotCount: this.content.coins.length,
      ageBand: band,
      targetCount: 1,
      logic: this.logicSpace,
    });
    const target = laidOut.filter((slot) => slot.role === "target");
    const coins = laidOut.filter((slot) => slot.role !== "target");
    return [...target, ...coins].map((slot, index) => ({ ...slot, index }));
  }

  private isPaymentEnough(): boolean {
    return this.difficulty.exact_change
      ? this.currentTotal === this.content.target_amount
      : this.currentTotal >= this.content.target_amount;
  }

  validateAction(action: GameAction): ActionResult {
    if (!this.isAcceptingInput()) {
      return ACTION_IGNORED;
    }
    const coinId = extractCoinIdFromData(action.data);
    if (DEPOSIT_ACTION_TYPES.has(action.type)) {
      return this.canDepositCoin(coinId) ? QUIET_OK : ACTION_IGNORED;
    }
    if (REMOVE_ACTION_TYPES.has(action.type)) {
      const targetId = coinId ?? this.depositedCoinIds.at(-1);
      return targetId && this.depositedCoinIds.includes(targetId)
        ? QUIET_OK
        : ACTION_IGNORED;
    }
    if (action.type === "pay" && this.canCommit()) {
      return this.isPaymentEnough() ? ACTION_CORRECT : ACTION_RETRY;
    }
    return ACTION_IGNORED;
  }

  private canDepositCoin(coinId: string | null): boolean {
    if (!coinId || this.depositedCoinIds.includes(coinId)) {
      return false;
    }
    return this.content.coins.some((c) => c.coin_id === coinId);
  }

  private commitDepositCoin(coinId: string): void {
    const coin = this.content.coins.find((c) => c.coin_id === coinId);
    if (!coin || this.depositedCoinIds.includes(coinId)) {
      return;
    }
    const visual = getGT031VisualState(this);
    const prevTotal = this.currentTotal;
    this.depositedCoinIds.push(coinId);
    this.currentTotal += coin.value;
    markDepositAnchor(visual);
    startCounterAnim(visual, prevTotal, this.currentTotal, false);
    this.queueSfx("coin_clink");
    this.recordEvent("coin_placed", {
      coin_id: coin.coin_id,
      value: coin.value,
      current_total: this.currentTotal,
      target_amount: this.content.target_amount,
    });
  }

  private commitPay(): void {
    const visual = getGT031VisualState(this);
    if (!(this.canCommit() && this.isPaymentEnough())) {
      visual.wrongDurationMs = WRONG_PAY_MS;
      visual.wrongAnchorRenderMs = visual.lastSeenRenderMs;
      visual.wrongAnchorSimMs = visual.simMs;
      this.recordEvent("payment_wrong", {
        current_total: this.currentTotal,
        target_amount: this.content.target_amount,
      });
      if (this.difficulty.allow_retry === false) {
        visual.isClosedWrong = true;
        this.encourageRemainingMs = 0;
        this.recordEvent("game_completed", { score: 0 });
      } else {
        this.encourageRemainingMs = GT031_ENCOURAGE_MS;
      }
      return;
    }
    this.isWin = true;
    this.isWon = true;
    const targetSlot = this.slots[0];
    if (targetSlot && this.degradation?.particles_enabled !== false) {
      this.particles.push(...spawnParticlesAtSlot(targetSlot, 16));
    }
    this.recordEvent("game_completed", { score: 100 });
    this.winSession();
  }

  private commitRemoveCoin(coinId?: string): void {
    const targetId = coinId ?? this.depositedCoinIds.at(-1);
    if (!targetId) {
      return;
    }
    const coinIndex = this.depositedCoinIds.indexOf(targetId);
    if (coinIndex === -1) {
      return;
    }
    const coin = this.content.coins.find((c) => c.coin_id === targetId);
    if (!coin) {
      return;
    }

    const visual = getGT031VisualState(this);
    const prevTotal = this.currentTotal;
    this.depositedCoinIds.splice(coinIndex, 1);
    this.currentTotal -= coin.value;
    this.isWin = false;
    clearDepositAnchor(visual);
    startCounterAnim(visual, prevTotal, this.currentTotal, false);
    this.recordEvent("coin_removed", {
      coin_id: coin.coin_id,
      value: coin.value,
      current_total: this.currentTotal,
      target_amount: this.content.target_amount,
    });
  }

  override commit(action: GameAction): void {
    const type = action.type;
    const coinId = extractCoinIdFromData(action.data);
    if (
      type === "deposit_coin" ||
      type === "place_coin" ||
      type === "tap_coin" ||
      type === "select_coin" ||
      type === "drag_coin"
    ) {
      this.commitDepositCoin(coinId ?? "");
      return;
    }
    if (
      type === "remove_coin" ||
      type === "undo_coin" ||
      type === "withdraw_coin"
    ) {
      this.commitRemoveCoin(coinId ?? undefined);
      return;
    }
    if (type === "pay") {
      this.commitPay();
    }
  }

  override toAction(gesture: Gesture): GameAction | null {
    if (!this.isAcceptingInput()) {
      return null;
    }
    if (gesture.type === "commit") {
      return this.canCommit() ? { type: "pay", data: {} } : null;
    }
    const coins = this.getTrayCoins();
    if (gesture.type === "drop") {
      return resolveGT031DropAction({
        gesture,
        coins,
        slots: this.slots,
        depositedCoinIds: this.depositedCoinIds,
      });
    }
    if (gesture.type !== "tap") {
      return null;
    }

    const coinSlots = this.slots.slice(1, 1 + coins.length);
    const index = findHitSlotIndex(
      coinSlots,
      gesture.x,
      gesture.y,
      "circle",
      TAP_TOLERANCE_PX
    );
    const coin = coins[index];
    if (!coin) {
      return null;
    }
    return this.depositedCoinIds.includes(coin.coin_id)
      ? { type: "remove_coin", data: { coin_id: coin.coin_id } }
      : { type: "deposit_coin", data: { coin_id: coin.coin_id } };
  }

  override getView(): EngineView {
    const visual = getGT031VisualState(this);
    const isWrong =
      visual.isClosedWrong ||
      sampleWrongIntensity(visual, visual.lastSeenRenderMs) > 0;
    return buildGT031EngineView({
      content: this.content,
      coins: this.getTrayCoins(),
      slots: this.slots,
      depositedCoinIds: this.depositedCoinIds,
      hoveredCoinId: visual.hoveredCoinId,
      isWin: this.isWin,
      isWrong,
    });
  }

  override checkWinCondition(): boolean {
    return this.isWin || this.isWon;
  }

  getCurrentTotal(): number {
    return this.currentTotal;
  }

  getDepositedCoinIds(): readonly string[] {
    return this.depositedCoinIds;
  }

  private renderPiggyStall(
    ctx: CanvasRenderingContext2D,
    rs: RenderSystem,
    targetSlot: Slot,
    bodyRect: ZoneRect,
    visual: ReturnType<typeof getGT031VisualState>,
    timeMs: number
  ): { cx: number; cy: number; size: number } | null {
    const geometry = marketStallGeometry(
      targetSlot,
      bodyRect,
      slotLabelBandPx(targetSlot, rs)
    );
    drawMarketStall(ctx, geometry);
    if (!geometry.piggy) {
      return null;
    }
    drawPiggyBank(
      ctx,
      geometry.piggy.cx,
      geometry.piggy.cy,
      geometry.piggy.size,
      piggyBounceScale(samplePiggyElapsedMs(visual, timeMs), rs.reducedMotion)
    );
    return geometry.piggy;
  }

  private renderTargetArea(
    ctx: CanvasRenderingContext2D,
    rs: RenderSystem,
    timeMs: number
  ): void {
    const targetSlot = this.slots[0];
    if (!targetSlot) {
      return;
    }

    const visual = getGT031VisualState(this);
    const targetPrice = this.content.target_amount;
    const zones = pickTrayZones(this.stageRect, this.trayRect);
    const stage = zones?.stage;
    const bodyRect = stage ? splitCaption(stage).body : undefined;
    const { space, scale } = spaceOf(rs);
    const wrongIntensity = sampleWrongIntensity(visual, timeMs);
    const isHintL1 = visual.hintLevel === 1;
    const softShadowsEnabled = this.degradation?.soft_shadows_enabled !== false;

    const piggyBox =
      stage && bodyRect
        ? this.renderPiggyStall(ctx, rs, targetSlot, bodyRect, visual, timeMs)
        : null;

    let targetState: ItemVisualState = "idle";
    if (this.isWin) {
      targetState = "correct";
    } else if (visual.isClosedWrong || wrongIntensity > 0) {
      targetState = "wrong";
    }
    drawSlotItem(
      ctx,
      rs,
      targetSlot,
      {
        id: "payment_target",
        asset: resolveGT031DisplayAsset(this.content),
        label: String(targetPrice),
        state: targetState,
      },
      "square"
    );

    if (stage && bodyRect) {
      drawGT031TargetDecor(ctx, {
        ...computeTargetDecorLayout(targetSlot, bodyRect, targetPrice),
        isHintL1,
        timeMs,
      });
      const stackLayout = computeDepositedStackLayout(
        buildDepositedCoinViews(this.content.coins, this.depositedCoinIds),
        targetSlot,
        bodyRect,
        softShadowsEnabled,
        rs.reducedMotion
      );
      drawGT031DepositedStack(ctx, { ...stackLayout, space, scale });
      const meterRect = computeTotalMeterRect(stage, targetSlot);
      const displayedTotal = sampleDisplayedTotal(
        visual,
        timeMs,
        this.currentTotal,
        rs.reducedMotion
      );
      drawGT031TotalMeter(ctx, {
        rect: meterRect,
        space,
        scale,
        displayedTotal,
        dots: computeTotalMeterDots(
          meterRect,
          displayedTotal,
          targetPrice,
          this.isWin
        ),
        isHintL1,
        wrongIntensity,
        isClosedWrong: visual.isClosedWrong,
        isWin: this.isWin,
        softShadowsEnabled,
        reducedMotion: rs.reducedMotion,
        timeMs,
      });
      if (visual.isClosedWrong) {
        const pills = computeSolutionGhostPills(
          computeSolutionSubset(
            this.content.coins,
            targetPrice,
            this.difficulty.exact_change
          ),
          targetSlot,
          bodyRect,
          piggyBox
        );
        drawGT031SolutionGhost(ctx, { pills, space, scale });
      }
    } else {
      drawProgressDots(
        ctx,
        rs,
        this.moneyProgress(targetPrice),
        this.stageRect ? splitCaption(this.stageRect).caption : undefined
      );
    }
  }

  private moneyProgress(targetPrice: number): { done: number; total: number } {
    const total = Math.min(MONEY_PROGRESS_MAX_DOTS, Math.max(1, targetPrice));
    const done = Math.min(
      total,
      Math.floor((this.currentTotal / Math.max(1, targetPrice)) * total)
    );
    return { done, total };
  }

  private renderCoins(
    ctx: CanvasRenderingContext2D,
    rs: RenderSystem,
    timeMs: number
  ): void {
    const trayRect = pickTrayZones(this.stageRect, this.trayRect)?.tray;
    drawWoodenTokenDock(ctx, rs, trayRect);

    const visual = getGT031VisualState(this);
    const coins = this.getTrayCoins();
    const values = coins.map((c) => c.value);
    for (let i = 0; i < coins.length; i++) {
      const coin = coins[i];
      const slot = this.slots[1 + i];
      if (!(coin && slot)) {
        continue;
      }

      const isDeposited = this.depositedCoinIds.includes(coin.coin_id);
      if (trayRect) {
        drawGT031CoinTrayDecor(ctx, {
          box: computeCoinTrayBox(slot, trayRect),
          isDeposited,
          isHovered: visual.hoveredCoinId === coin.coin_id,
          isHintL2:
            visual.hintLevel >= 2 && visual.hintTargetId === coin.coin_id,
          timeMs,
        });
      }
      const tier = coinTierOf(values, coin.value);
      const hit = Math.min(slot.hitW, slot.hitH);
      drawMontessoriCoin(ctx, slot, coin.value, isDeposited, {
        diameter: coinDiameter(tier.rank, tier.count, hit, this.coinTouchFloor),
        rank: tier.rank,
      });
    }
  }

  render(
    ctx: CanvasRenderingContext2D,
    rs: RenderSystem,
    timeMs: number
  ): void {
    getGT031VisualState(this).lastSeenRenderMs = timeMs;
    drawSceneBackground(ctx, rs, this.themeId);
    if (!pickTrayZones(this.stageRect, this.trayRect)) {
      drawProgressDots(ctx, rs, this.moneyProgress(this.content.target_amount));
    }
    this.renderTargetArea(ctx, rs, timeMs);
    this.renderCoins(ctx, rs, timeMs);
    if (this.degradation?.particles_enabled !== false) {
      rs.drawParticles(ctx, this.particles);
    }
  }
}
