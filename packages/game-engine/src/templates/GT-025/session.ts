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
import { resolveTouchFloor } from "#src/layout/constants";
import { resolveLayout } from "#src/layout/registry";
import { insetDrawSize, splitCaption } from "#src/layout/slot-fit";
import {
  computeSplitGridSlots,
  slotsFitStage,
} from "#src/layout/stage-split-grids";
import type { ZoneRect } from "#src/layout/stage-zones";
import type { Slot } from "#src/layout/types";
import {
  drawGT025ComparisonFrames,
  drawGT025ItemEffectOverlay,
  drawGT025ItemEffectUnderlay,
  drawGT025ScaffoldOverlay,
  type GT025ItemEffectOpts,
  resolveGT025VisualState,
} from "#src/render/gt-025-shapes";
import {
  drawFindRing,
  drawProgressDots,
  drawSceneBackground,
  drawSlotItem,
  findRingPose,
  type ItemVisualState,
  type MascotPose,
  type SceneBox,
  sceneBox,
  sceneObjectSlot,
} from "#src/render/index.js";
import type { DegradationState } from "#src/systems/degradation";
import type { RenderSystem } from "#src/systems/render-system";
import { WRONG_FLASH_MS } from "#src/systems/wrong-flash";
import {
  buildGT025ScaffoldVisual,
  buildGT025ViewEntities,
  elapsedDualMs,
  findHitSpotObject,
  type GT025HintQuery,
  getGT025Clock,
  makeDualStamp,
  observeGT025RenderClock,
  type ResolvedSpotObject,
  resolveGT025HintDemoSequence,
  resolveGT025HintTargetForLevel,
  resolveGT025RoundData,
  type SpotDiffItem,
  type SpotSide,
} from "./layout.js";
import type { GT025Content, GT025Difficulty } from "./template.js";

const FIND_RING_RADIUS_RATIO = 0.62;
const SPLIT_CELL_MAX_PX = 120;

/** Khung chuyện đọc một lần ở vòng đầu (`BR-E025-05`, `BR-FBK-16`). */
export const GT025_STORY_LINE =
  "Gấu Con vẽ hai bức tranh gần giống nhau, bé tìm giúp Gấu Con chỗ khác nhau nhé!";

type Ctx = CanvasRenderingContext2D;
type RS = RenderSystem;
type Obj = ResolvedSpotObject;
type SMap = ReadonlyMap<string, Slot>;
type ActTgt = [string, SpotSide?];

function parseRawTarget(raw: string, side?: SpotSide): ActTgt {
  if (raw.startsWith("left:")) {
    return [raw.slice(5), "left"];
  }
  return raw.startsWith("right:") ? [raw.slice(6), "right"] : [raw, side];
}

function readActionTarget(action: GameAction): ActTgt | null {
  const d = action.data;
  if (typeof d !== "object" || d === null) {
    return null;
  }
  const rec: { object_id?: string; item_id?: string; side?: string } = d;
  const raw = rec.object_id ?? rec.item_id;
  if (typeof raw !== "string") {
    return null;
  }
  const side =
    rec.side === "left" || rec.side === "right" ? rec.side : undefined;
  return parseRawTarget(raw, side);
}

function slotItemState(f: boolean, w: boolean, h: boolean): ItemVisualState {
  const k: ItemVisualState[] = ["correct", "wrong", "touching"];
  const i = [f, w, h].findIndex(Boolean);
  return (i >= 0 ? k[i] : undefined) ?? "idle";
}

export class GT025Session extends TemplateGameSession<
  GT025Content,
  GT025Difficulty
> {
  override readonly usesPromptZone = true;
  degradation: DegradationState | null = null;

  private activeRoundIndex = 0;
  private roundClosedOnWrong = false;
  private effectiveDifferences: readonly SpotDiffItem[] = [];
  private effectiveTargetCount = 0;
  private readonly foundDifferenceIds = new Set<string>();
  private readonly foundKeys = new Set<string>();
  resolvedObjects: Obj[] = [];

  update(deltaMs: number): void {
    const c = getGT025Clock(this);
    c.logicMs += deltaMs;
    for (const [k, s] of c.wrongStamps) {
      if (elapsedDualMs(s, c) >= WRONG_FLASH_MS) {
        c.wrongStamps.delete(k);
      }
    }
  }

  setupEntities(): void {
    this.isWon = false;
    this.roundClosedOnWrong = false;
    this.activeRoundIndex = this.roundGeneration;
    getGT025Clock(this, true);
    this.foundDifferenceIds.clear();
    this.foundKeys.clear();
    this.computeRoundDerived();
    const ev = {
      round_index: this.activeRoundIndex,
      total_differences: this.effectiveTargetCount,
    };
    this.recordEvent("round_started", ev);
  }

  protected override computeRoundDerived(): void {
    const { content: c, sourceSlots: s, targetSlots: t } = this;
    const round = resolveGT025RoundData(
      c,
      s,
      t,
      this.layoutSeed,
      this.activeRoundIndex
    );
    this.resolvedObjects = [...round.objects];
    this.effectiveDifferences = round.effectiveDifferences;
    this.effectiveTargetCount = round.effectiveTargetCount;
  }

  override isAcceptingInput(): boolean {
    return !(this.isWon || this.roundClosedOnWrong);
  }

  setPointerOver(p: { readonly x: number; readonly y: number }): void {
    const hit = this.isAcceptingInput()
      ? findHitSpotObject(this.resolvedObjects, p.x, p.y)
      : null;
    getGT025Clock(this).hoveredKey = hit ? hit.key : null;
  }

  clearPointerOver(): void {
    getGT025Clock(this).hoveredKey = null;
  }

  private findDiff(id: string, side?: SpotSide): SpotDiffItem | undefined {
    const e = this.effectiveDifferences;
    if (side === "left") {
      return e.find((d) => d.left_id === id);
    }
    return side === "right"
      ? e.find((d) => d.right_id === id)
      : e.find((d) => d.left_id === id || d.right_id === id);
  }

  onTapObject(rawObjectId: string, explicitSide?: SpotSide): ActionResult {
    if (!this.isAcceptingInput()) {
      return ACTION_IGNORED;
    }
    const [id, side] = parseRawTarget(rawObjectId, explicitSide);
    const diff = this.findDiff(id, side);
    const clock = getGT025Clock(this);

    if (!diff) {
      const m = this.resolvedObjects.find(
        (o) => o.id === id && (!side || o.side === side)
      );
      const wrongKey = m ? m.key : `${side ?? "left"}:${id}`;
      clock.wrongStamps.set(wrongKey, makeDualStamp(clock));
      this.recordEvent("item_selected", { object_id: id, is_correct: false });
      if (this.difficulty.allow_retry === false) {
        this.roundClosedOnWrong = true;
        clock.closeStamp = makeDualStamp(clock);
        this.completeSession();
      }
      return ACTION_RETRY;
    }

    if (this.foundDifferenceIds.has(diff.id)) {
      return ACTION_IGNORED;
    }

    const stamp = makeDualStamp(clock);
    for (const k of [`left:${diff.left_id}`, `right:${diff.right_id}`]) {
      this.foundKeys.add(k);
      clock.foundStamps.set(k, stamp);
    }
    this.foundDifferenceIds.add(diff.id);
    clock.activeHintLevel = 0;
    this.queueSfx("sparkle_find");
    const bEv = { object_id: id, is_correct: true, difference_id: diff.id };
    const cEv = {
      found_count: this.foundDifferenceIds.size,
      total_differences: this.effectiveTargetCount,
    };
    this.recordEvent("item_selected", { ...bEv, ...cEv });

    if (this.checkWinCondition()) {
      this.isWon = true;
      const rEv = { round_index: this.activeRoundIndex };
      this.recordEvent("round_completed", rEv);
      this.winSession();
    }
    return ACTION_CORRECT;
  }

  validateAction(a: GameAction): ActionResult {
    const ok = a.type === "tap_object" || a.type === "select_item";
    const t = ok && this.isAcceptingInput() ? readActionTarget(a) : null;
    const d = t ? this.findDiff(t[0], t[1]) : null;
    if (!t || (d && this.foundDifferenceIds.has(d.id))) {
      return ACTION_IGNORED;
    }
    return d ? ACTION_CORRECT : ACTION_RETRY;
  }

  override checkWinCondition(): boolean {
    const n = this.effectiveTargetCount;
    return n > 0 && this.foundDifferenceIds.size >= n;
  }

  override toAction(g: Gesture): GameAction | null {
    const ok = this.isAcceptingInput() && g.type === "tap";
    const h = ok ? findHitSpotObject(this.resolvedObjects, g.x, g.y) : null;
    const d = h ? { object_id: h.id, side: h.side } : null;
    return d ? { type: "tap_object", data: d } : null;
  }

  override commit(action: GameAction): void {
    if (action.type === "tap_object" || action.type === "select_item") {
      const t = readActionTarget(action);
      if (t) {
        this.onTapObject(t[0], t[1]);
      }
    }
  }

  override getView(): EngineView {
    const c = getGT025Clock(this);
    const e = buildGT025ViewEntities(this.resolvedObjects, this.foundKeys, c);
    return { activePrompt: this.content.prompt, entities: e };
  }

  override storyLine(): string {
    return GT025_STORY_LINE;
  }

  override mascotMood(): MascotPose | null {
    const mid = this.foundDifferenceIds.size > 0 && !this.checkWinCondition();
    return mid && !this.roundClosedOnWrong ? "wonder" : null;
  }

  getFoundCount(): number {
    return this.foundDifferenceIds.size;
  }

  private hintQuery(): GT025HintQuery {
    const { resolvedObjects: objects, effectiveDifferences: diffs } = this;
    const disabled = !this.isAcceptingInput();
    return { objects, diffs, foundDiffIds: this.foundDifferenceIds, disabled };
  }

  override onScaffoldEscalated(lv: HintLevel, _t?: string): void {
    getGT025Clock(this).activeHintLevel = lv;
  }

  override onHintCleared(): void {
    getGT025Clock(this).activeHintLevel = 0;
  }

  override getHintTargetIndex(): number | null {
    const t = resolveGT025HintTargetForLevel(3, this.hintQuery());
    return t?.kind === "slot" ? t.index : null;
  }

  override getHintTargetForLevel(level: HintLevel): HintTarget | null {
    return resolveGT025HintTargetForLevel(level, this.hintQuery());
  }

  override getHintDemoSequence(lv: HintLevel): readonly HintDemoStep[] | null {
    return resolveGT025HintDemoSequence(lv, this.hintQuery());
  }

  override destroy(): void {
    super.destroy();
    this.foundDifferenceIds.clear();
    this.foundKeys.clear();
    getGT025Clock(this, true);
  }

  private showsCounter(): boolean {
    const d = this.difficulty;
    return d.show_difference_counter ?? d.show_counter !== false;
  }

  private sceneStage(): ZoneRect | undefined {
    const stage = this.stageRect;
    return stage && this.showsCounter() ? splitCaption(stage).body : stage;
  }

  protected computeSlots(ageBand: AgeBand): readonly Slot[] {
    const stage = this.sceneStage();
    const leftCount = this.content.left_objects.length;
    const rightCount = this.content.right_objects.length;
    const { logicSpace: logic, cssPerLogic } = this;
    const a1 = { slotCount: leftCount, targetCount: rightCount, ageBand };
    const a2 = { ...a1, logic, stage, cssPerLogic };
    const slots = insetDrawSize(resolveLayout("split-columns")(a2), stage);
    if (!stage || slotsFitStage(slots, stage)) {
      return slots;
    }
    const maxCell = { w: SPLIT_CELL_MAX_PX, h: SPLIT_CELL_MAX_PX };
    const touchFloor = resolveTouchFloor(ageBand, cssPerLogic);
    const g1 = { leftCount, rightCount, stage, touchFloor, maxCell };
    const g2 = { leftRole: "source" as const, rightRole: "target" as const };
    return insetDrawSize(computeSplitGridSlots({ ...g1, ...g2 }), stage);
  }

  private resolveDrawSlot(rs: RS, half: SceneBox, obj: Obj): Slot {
    if (this.stageRect || obj.origX === undefined || obj.origY === undefined) {
      return obj.slot;
    }
    const raw = { id: obj.id, asset: obj.asset, x: obj.origX, y: obj.origY };
    return sceneObjectSlot(rs, half, raw, obj.slot) ?? obj.slot;
  }

  private renderObj(ctx: Ctx, rs: RS, o: Obj, clip: ZoneRect, m: SMap): void {
    const clock = getGT025Clock(this);
    const timeMs = clock.lastRenderMs ?? 0;
    const s = m.get(o.key) ?? o.slot;
    const isFound = this.foundKeys.has(o.key);
    const wElapsed = elapsedDualMs(clock.wrongStamps.get(o.key), clock);
    const isWrong = wElapsed < WRONG_FLASH_MS;
    const diff = this.findDiff(o.id, o.side);
    const closed = this.roundClosedOnWrong && !isFound && Boolean(diff);
    const hov = clock.hoveredKey === o.key;
    const vState = resolveGT025VisualState([isFound, isWrong, closed, hov]);
    const fStamp = clock.foundStamps.get(o.key);
    const fElapsed = fStamp ? elapsedDualMs(fStamp, clock) : undefined;
    const partnerSlot =
      isFound && diff && o.side === "left"
        ? m.get(`right:${diff.right_id}`)
        : undefined;
    const particlesOff = this.degradation?.particles_enabled === false;
    const wrongProgress = wElapsed / WRONG_FLASH_MS;
    const isRightSide = o.side === "right";
    const o1 = { clip, slot: s, state: vState, timeMs, particlesOff };
    const o2 = { forcePlaceholder: o.forcePlaceholder, isRightSide };
    const o3 = { foundElapsedMs: fElapsed, partnerSlot, wrongProgress };
    const fxOpts: GT025ItemEffectOpts = { ...o1, ...o2, ...o3 };

    drawGT025ItemEffectUnderlay(ctx, rs, fxOpts);
    if (!o.forcePlaceholder) {
      const state = slotItemState(isFound, isWrong, hov);
      drawSlotItem(ctx, rs, s, { id: o.id, asset: o.asset, state });
    }
    drawGT025ItemEffectOverlay(ctx, rs, fxOpts);

    if (isFound && fElapsed !== undefined) {
      const dx = Math.min(s.x - clip.x, clip.x + clip.w - s.x);
      const dy = Math.min(s.y - clip.y, clip.y + clip.h - s.y);
      const r0 = Math.min(s.w, s.h) * FIND_RING_RADIUS_RATIO;
      const r = Math.max(4, Math.min(r0, dx, dy));
      const pose = findRingPose(Math.max(1, fElapsed), rs.reducedMotion);
      drawFindRing(ctx, s.x, s.y, r, pose);
    }
  }

  render(
    ctx: CanvasRenderingContext2D,
    rs: RenderSystem,
    timeMs: number
  ): void {
    const clock = getGT025Clock(this);
    observeGT025RenderClock(clock, timeMs);
    drawSceneBackground(ctx, rs, this.themeId);
    const scene = this.sceneStage() ?? sceneBox(rs);
    const clip: ZoneRect = this.stageRect ?? scene;

    if (this.stageRect && this.showsCounter()) {
      const done = this.foundDifferenceIds.size;
      const prog = { done, total: this.effectiveTargetCount };
      drawProgressDots(ctx, rs, prog, splitCaption(this.stageRect).caption);
    }

    const hw = scene.w / 2;
    const sx = scene.x + hw;
    const leftHalf: SceneBox = { x: scene.x, y: scene.y, w: hw, h: scene.h };
    const rightHalf: SceneBox = { x: sx, y: scene.y, w: hw, h: scene.h };
    const fw = Math.max(12, hw - 10);
    const fh = Math.max(12, scene.h - 8);
    const leftBox = { x: scene.x + 3, y: scene.y + 3, w: fw, h: fh };
    const rightBox = { x: sx + 7, y: scene.y + 3, w: fw, h: fh };
    const shadowsOff = this.degradation?.soft_shadows_enabled === false;
    const fOpts = { clip, isWon: this.isWon, leftBox, rightBox, shadowsOff };
    drawGT025ComparisonFrames(ctx, rs, fOpts);

    const drawSlots = new Map<string, Slot>();
    for (const o of this.resolvedObjects) {
      const half = o.side === "left" ? leftHalf : rightHalf;
      drawSlots.set(o.key, this.resolveDrawSlot(rs, half, o));
    }
    for (const o of this.resolvedObjects) {
      this.renderObj(ctx, rs, o, clip, drawSlots);
    }

    const scaffold = buildGT025ScaffoldVisual(this.hintQuery(), clock, clip);
    if (scaffold) {
      drawGT025ScaffoldOverlay(ctx, rs, scaffold);
    }
  }
}
