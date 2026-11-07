import type { AgeBand } from "#src/contracts/types";
import {
  ACTION_CORRECT,
  ACTION_IGNORED,
  ACTION_RETRY,
  type ActionResult,
  type GameAction,
  TemplateGameSession,
} from "#src/game-session";
import type { EngineView, Gesture, ViewEntity } from "#src/interaction";
import { resolveAssetLabels } from "#src/labels/spoken-keyword.js";
import { JITTER_MAX_PX } from "#src/layout/constants";
import { findHitSlotIndex, TAP_TOLERANCE_PX } from "#src/layout/hit-test.js";
import { resolveLayout } from "#src/layout/registry.js";
import type { Slot } from "#src/layout/types";
import {
  drawCircleOutline,
  drawSceneBackground,
  drawSlotItem,
  drawSubPromptText,
  spawnParticlesAtSlot,
  updateParticles,
} from "#src/render/index.js";
import type { MascotPose } from "#src/render/mascot";
import { deriveStream } from "#src/rng/mulberry32";
import { shuffle } from "#src/rng/shuffle";
import type { DegradationState } from "#src/systems/degradation";
import { designTokens } from "#src/systems/designTokens";
import type { Particle, RenderSystem } from "#src/systems/render-system";
import { WrongFlash } from "#src/systems/wrong-flash";
import type { GT037Content, GT037Difficulty, GT037Symbol } from "./template.js";

interface GT037Commission {
  readonly slotIndex: number;
  readonly symbolId: string;
  readonly timeMs: number;
}

interface GT037OrderStep {
  readonly slotIndex: number;
  readonly symbolId: string;
  readonly isTarget: boolean;
  readonly timeMs: number;
}

interface ProgressSnapshot {
  readonly found: readonly { index: number; symbolId: string }[];
  readonly order: readonly GT037OrderStep[];
  readonly commissions: readonly GT037Commission[];
}

/** Khung chuyện đọc một lần ở vòng đầu (`BR-E037-10`, `BR-FBK-16`). */
export const GT037_STORY_LINE =
  "Gấu Con đi nhặt đồ bỏ vào lọ, bé tìm giúp Gấu Con tất cả nhé!";

/** Gấu Con reo bấy lâu sau mỗi ô đích mới tìm (`BR-E037-10`). */
export const GT037_CHEER_MS = 1200;

const SCATTER_BOARD_CAPACITY: Record<AgeBand, number> = {
  "3-4": 10,
  "4-5": 16,
  "5-6": 20,
};

function buildTargetSymbols(
  targetIds: readonly string[],
  targetCopies: number,
  symbolMap: ReadonlyMap<string, GT037Symbol>
): GT037Symbol[] {
  const result: GT037Symbol[] = [];
  if (targetIds.length === 1) {
    const sym = symbolMap.get(targetIds[0] ?? "");
    if (sym) {
      for (let i = 0; i < targetCopies; i++) {
        result.push(sym);
      }
    }
    return result;
  }

  const count1 = Math.ceil(targetCopies / 2);
  const count2 = targetCopies - count1;
  const sym1 = symbolMap.get(targetIds[0] ?? "");
  const sym2 = symbolMap.get(targetIds[1] ?? "");
  if (sym1 && sym2) {
    for (let i = 0; i < count1; i++) {
      result.push(sym1);
    }
    for (let i = 0; i < count2; i++) {
      result.push(sym2);
    }
  }
  return result;
}

function buildChosenDistractors(
  content: GT037Content,
  itemCount: number,
  targetCopies: number,
  targetSet: ReadonlySet<string>,
  symbolMap: ReadonlyMap<string, GT037Symbol>,
  seed: number
): GT037Symbol[] {
  const confusableSymbols: GT037Symbol[] = [];
  for (const cId of content.confusable_ids) {
    const sym = symbolMap.get(cId);
    if (sym) {
      confusableSymbols.push(sym);
    }
  }

  const nonTargetSymbols = content.symbols.filter((s) => !targetSet.has(s.id));
  const distractorsStream = deriveStream(seed, "distractors");
  const chosen = [...confusableSymbols];
  const remainingCount = itemCount - targetCopies - confusableSymbols.length;

  for (let i = 0; i < remainingCount; i++) {
    const idx = distractorsStream.nextInt(nonTargetSymbols.length);
    const sym = nonTargetSymbols[idx];
    if (sym) {
      chosen.push(sym);
    }
  }
  return chosen;
}

function resolveEntityState(
  isFound: boolean,
  isWrong: boolean
): "idle" | "correct" | "incorrect" {
  if (isFound) {
    return "correct";
  }
  if (isWrong) {
    return "incorrect";
  }
  return "idle";
}

function resolveSlotItemState(
  isFound: boolean,
  isWrong: boolean
): "idle" | "selected" | "wrong" {
  if (isFound) {
    return "selected";
  }
  if (isWrong) {
    return "wrong";
  }
  return "idle";
}

export class GT037Session extends TemplateGameSession<
  GT037Content,
  GT037Difficulty
> {
  override readonly usesPromptZone = true;
  override readonly needsCommit: boolean;

  boardSymbols: GT037Symbol[] = [];
  rotations: number[] = [];
  readonly foundTargets = new Set<number>();
  readonly commissions: GT037Commission[] = [];
  readonly order: GT037OrderStep[] = [];
  private particles: Particle[] = [];
  degradation: DegradationState | null = null;
  wrongSlotIndex: number | null = null;
  private readonly wrongFlash = new WrongFlash();
  private lastFrameMs = 0;
  itemCount = 0;
  targetCopies = 0;
  targetSet = new Set<string>();
  private currentBand: AgeBand = "5-6";
  /** Thời gian còn lại của nhịp reo sau ô đích mới tìm. */
  private cheerRemainingMs = 0;

  constructor(
    content: GT037Content,
    difficulty: GT037Difficulty = {},
    layoutSeed = 0,
    themeId?: string
  ) {
    super(content, difficulty, layoutSeed, themeId);
    this.needsCommit = this.difficulty.finish_mode === "declare";
    this.targetSet = new Set(content.target_ids);
  }

  override canCommit(): boolean {
    return !(this.isWon || this.isCompleted);
  }

  get finishMode(): "auto" | "declare" {
    return this.difficulty.finish_mode ?? "auto";
  }

  get targetSymbol(): GT037Symbol | undefined {
    const firstId = this.content.target_ids[0];
    return this.content.symbols.find((s) => s.id === firstId);
  }

  setupEntities(): void {
    this.isWon = false;
    this.foundTargets.clear();
    this.commissions.length = 0;
    this.order.length = 0;
    this.particles = [];
    this.wrongSlotIndex = null;
    this.wrongFlash.clear();
    this.lastFrameMs = 0;
    this.cheerRemainingMs = 0;
    this.rebuildBoard();

    this.recordEvent("game_started", {
      template_code: "GT-037",
      item_count: this.itemCount,
      target_copies: this.targetCopies,
      target_ids: this.content.target_ids,
      confusable_ids: this.content.confusable_ids,
    });
  }

  /** Dựng lại `boardSymbols` theo band hiện tại; không đụng tiến độ của trẻ. */
  private rebuildBoard(): void {
    this.targetSet = new Set(this.content.target_ids);

    const maxBandCapacity = SCATTER_BOARD_CAPACITY[this.currentBand] ?? 20;
    const requestedCount =
      this.difficulty.item_count ?? this.content.item_count;
    this.itemCount = Math.min(requestedCount, maxBandCapacity);
    this.targetCopies = Math.min(
      this.difficulty.target_copies ?? this.content.target_copies,
      this.itemCount
    );

    const symbolMap = new Map<string, GT037Symbol>();
    for (const sym of this.content.symbols) {
      symbolMap.set(sym.id, sym);
    }

    const targetSymbols = buildTargetSymbols(
      this.content.target_ids,
      this.targetCopies,
      symbolMap
    );

    const chosenDistractors = buildChosenDistractors(
      this.content,
      this.itemCount,
      this.targetCopies,
      this.targetSet,
      symbolMap,
      this.layoutSeed
    );

    const assignStream = deriveStream(this.layoutSeed, "assign");
    const unassignedItems = [...targetSymbols, ...chosenDistractors];
    this.boardSymbols = shuffle(unassignedItems, assignStream);
  }

  /** Chụp tiến độ theo id ký hiệu để dựng lại bảng mà không mất ô đã khoanh. */
  private snapshotProgress(): ProgressSnapshot {
    return {
      found: [...this.foundTargets].map((i) => ({
        index: i,
        symbolId: this.boardSymbols[i]?.id ?? "",
      })),
      order: [...this.order],
      commissions: [...this.commissions],
    };
  }

  /** Gắn tiến độ đã chụp vào bảng mới: mỗi ô đã khoanh nhận một ô cùng ký hiệu. */
  private restoreProgress(saved: ProgressSnapshot): void {
    const claimed = new Map<number, number>();
    const taken = new Set<number>();
    for (const f of saved.found) {
      const next = this.boardSymbols.findIndex(
        (sym, i) => sym.id === f.symbolId && !taken.has(i)
      );
      if (next >= 0) {
        taken.add(next);
        claimed.set(f.index, next);
      }
    }
    this.foundTargets.clear();
    for (const next of claimed.values()) {
      this.foundTargets.add(next);
    }
    const remap = <T extends { slotIndex: number; symbolId: string }>(
      step: T
    ): T => {
      const mapped = claimed.get(step.slotIndex);
      if (
        mapped !== undefined &&
        this.boardSymbols[mapped]?.id === step.symbolId
      ) {
        return { ...step, slotIndex: mapped };
      }
      const anyIdx = this.boardSymbols.findIndex(
        (sym) => sym.id === step.symbolId
      );
      return anyIdx >= 0 ? { ...step, slotIndex: anyIdx } : step;
    };
    this.order.splice(0, this.order.length, ...saved.order.map(remap));
    this.commissions.splice(
      0,
      this.commissions.length,
      ...saved.commissions.map(remap)
    );
  }

  private trimBoardSymbols(targetCount: number): void {
    if (this.boardSymbols.length <= targetCount) {
      return;
    }
    const targets: GT037Symbol[] = [];
    const distractors: GT037Symbol[] = [];
    for (const sym of this.boardSymbols) {
      if (this.targetSet.has(sym.id)) {
        targets.push(sym);
      } else {
        distractors.push(sym);
      }
    }
    const neededDistractors = Math.max(0, targetCount - targets.length);
    const keptDistractors = distractors.slice(0, neededDistractors);
    const assignStream = deriveStream(this.layoutSeed, "assign");
    this.boardSymbols = shuffle([...targets, ...keptDistractors], assignStream);
  }

  protected computeSlots(band: AgeBand): readonly Slot[] {
    this.currentBand = band;
    const saved = this.snapshotProgress();
    const maxBandCapacity = SCATTER_BOARD_CAPACITY[band] ?? 20;
    if (this.boardSymbols.length === 0) {
      this.setupEntities();
    } else if (this.itemCount > maxBandCapacity) {
      this.rebuildBoard();
    }

    const layoutFn = resolveLayout("scatter-board");
    let candidateSlots: readonly Slot[] = [];
    let currentCount = Math.min(this.itemCount, maxBandCapacity);
    const minCount = Math.max(1, this.targetCopies);

    while (currentCount >= minCount) {
      try {
        candidateSlots = layoutFn({
          slotCount: currentCount,
          ageBand: band,
          logic: this.logicSpace,
          stage: this.stageRect,
          cssPerLogic: this.cssPerLogic,
        });
        break;
      } catch (_err) {
        currentCount--;
      }
    }

    if (candidateSlots.length === 0) {
      candidateSlots = layoutFn({
        slotCount: minCount,
        ageBand: band,
        logic: this.logicSpace,
        stage: this.stageRect,
        cssPerLogic: this.cssPerLogic,
      });
      currentCount = minCount;
    }

    if (currentCount !== this.itemCount) {
      this.itemCount = currentCount;
      this.trimBoardSymbols(currentCount);
    }
    this.restoreProgress(saved);

    const cellsStream = deriveStream(this.layoutSeed, "cells");
    const shuffledCandidates = shuffle(candidateSlots, cellsStream);
    const chosenSlots = shuffledCandidates.slice(0, this.itemCount);

    const jitterStream = deriveStream(this.layoutSeed, "jitter");
    const placedSlots: Slot[] = [];
    this.rotations = [];

    for (let i = 0; i < this.itemCount; i++) {
      const candidate = chosenSlots[i];
      if (!candidate) {
        continue;
      }
      const symbol = this.boardSymbols[i];

      const dx = (jitterStream.next() * 2 - 1) * JITTER_MAX_PX;
      const dy = (jitterStream.next() * 2 - 1) * JITTER_MAX_PX;
      const rawRot = jitterStream.next() * 2 * Math.PI;
      const rot =
        this.difficulty.rotation_jitter !== false && symbol?.orientation_free
          ? rawRot
          : 0;
      this.rotations.push(rot);

      placedSlots.push({
        index: i,
        x: Math.round(candidate.x + dx),
        y: Math.round(candidate.y + dy),
        w: candidate.w,
        h: candidate.h,
        hitW: candidate.hitW,
        hitH: candidate.hitH,
        page: 0,
        role: "neutral",
      });
    }

    return placedSlots;
  }

  override getHintTargetIndex(): number | null {
    if (this.isWon || this.isCompleted) {
      return null;
    }
    for (let i = 0; i < this.boardSymbols.length; i++) {
      const sym = this.boardSymbols[i];
      if (sym && this.targetSet.has(sym.id) && !this.foundTargets.has(i)) {
        return i;
      }
    }
    return null;
  }

  override checkWinCondition(): boolean {
    return this.isWon;
  }

  override toAction(gesture: Gesture): GameAction | null {
    if (gesture.type === "commit" && this.needsCommit) {
      return { type: "commit_declare", data: {} };
    }

    if (gesture.type === "tap") {
      const hitIndex = findHitSlotIndex(
        this.slots,
        gesture.x,
        gesture.y,
        "circle",
        TAP_TOLERANCE_PX
      );
      if (hitIndex >= 0 && hitIndex < this.boardSymbols.length) {
        const sym = this.boardSymbols[hitIndex];
        if (sym) {
          return {
            type: "tap_symbol",
            data: { slotIndex: hitIndex, symbolId: sym.id },
          };
        }
      }
    }

    return null;
  }

  private validateTapSymbol(slotIndex: number): ActionResult {
    if (this.foundTargets.has(slotIndex)) {
      return ACTION_IGNORED;
    }
    const symbol = this.boardSymbols[slotIndex];
    if (!symbol) {
      return ACTION_IGNORED;
    }
    const isTarget = this.targetSet.has(symbol.id);
    if (isTarget) {
      const willBeAllFound = this.foundTargets.size + 1 >= this.targetCopies;
      if (willBeAllFound && this.finishMode === "auto") {
        return { valid: true, feedback: "level_celebrate" };
      }
      return ACTION_CORRECT;
    }
    return ACTION_RETRY;
  }

  override validateAction(action: GameAction): ActionResult {
    if (action.type === "tap_symbol") {
      const data = action.data as { slotIndex: number; symbolId: string };
      return this.validateTapSymbol(data.slotIndex);
    }

    if (action.type === "commit_declare") {
      if (this.foundTargets.size >= this.targetCopies) {
        return { valid: true, feedback: "level_celebrate" };
      }
      return ACTION_RETRY;
    }

    return ACTION_IGNORED;
  }

  private commitTapSymbol(slotIndex: number, now: number): void {
    if (this.foundTargets.has(slotIndex)) {
      return;
    }
    const symbol = this.boardSymbols[slotIndex];
    if (!symbol) {
      return;
    }
    const isTarget = this.targetSet.has(symbol.id);

    this.order.push({
      slotIndex,
      symbolId: symbol.id,
      isTarget,
      timeMs: now,
    });

    if (isTarget) {
      this.foundTargets.add(slotIndex);
      this.queueSfx("star_collect");
      this.cheerRemainingMs = GT037_CHEER_MS;
      this.wrongSlotIndex = null;
      const slot = this.slots[slotIndex];
      if (slot) {
        this.particles.push(...spawnParticlesAtSlot(slot, 6));
      }
      this.recordEvent("item_selected", {
        item_id: symbol.id,
        is_correct: true,
        commission: false,
      });

      if (
        this.finishMode === "auto" &&
        this.foundTargets.size >= this.targetCopies
      ) {
        this.winSession();
      }
    } else {
      this.commissions.push({
        slotIndex,
        symbolId: symbol.id,
        timeMs: now,
      });
      this.wrongSlotIndex = slotIndex;
      this.wrongFlash.trigger(now);
      this.recordEvent("item_selected", {
        item_id: symbol.id,
        is_correct: false,
        commission: true,
      });

      if (this.difficulty.allow_retry === false) {
        this.completeSession();
      }
    }
  }

  private commitDeclare(): void {
    const omissions = Math.max(0, this.targetCopies - this.foundTargets.size);
    this.recordEvent("selection_submitted", {
      is_correct: omissions === 0,
    });
    if (omissions === 0) {
      this.winSession();
    } else if (this.difficulty.allow_retry === false) {
      this.completeSession();
    }
  }

  override commit(action: GameAction): void {
    const now = this.lastFrameMs;
    if (action.type === "tap_symbol") {
      const data = action.data as { slotIndex: number; symbolId: string };
      this.commitTapSymbol(data.slotIndex, now);
    } else if (action.type === "commit_declare") {
      this.commitDeclare();
    }
  }

  override completeSession(): void {
    if (this.isCompleted) {
      return;
    }
    const omissions = Math.max(0, this.targetCopies - this.foundTargets.size);
    this.recordEvent("round_completed", {
      round_index: 0,
      attempts: this.order.length,
      hints_used: 0,
      duration_ms: 0,
      omissions,
      commissions: this.commissions.length,
      order: this.order.map((o) => o.slotIndex),
    });
    super.completeSession();
  }

  override storyLine(): string {
    return GT037_STORY_LINE;
  }

  override mascotMood(): MascotPose | null {
    return this.cheerRemainingMs > 0 && !this.isWon ? "cheer" : null;
  }

  update(deltaMs: number): void {
    if (this.cheerRemainingMs > 0) {
      this.cheerRemainingMs = Math.max(0, this.cheerRemainingMs - deltaMs);
    }
    if (this.particles.length > 0) {
      this.particles = updateParticles(this.particles);
    }
    this.lastFrameMs += deltaMs;
    this.expireWrongFlash();
  }

  /** Hết nhịp sai thì ô về trung tính (cùng đồng hồ khung với lúc kích). */
  private expireWrongFlash(): void {
    if (this.wrongFlash.hasExpired(this.lastFrameMs)) {
      this.wrongFlash.clear();
      this.wrongSlotIndex = null;
    }
  }

  override getView(): EngineView {
    const entities: ViewEntity[] = [];
    for (let i = 0; i < this.slots.length; i++) {
      const slot = this.slots[i];
      const symbol = this.boardSymbols[i];
      if (!(slot && symbol)) {
        continue;
      }
      const isFound = this.foundTargets.has(i);
      const isWrong = this.wrongSlotIndex === i;
      const state = resolveEntityState(isFound, isWrong);
      const { glyph, label, spokenLabel, spokenAudioPath } = resolveAssetLabels(
        symbol.asset
      );
      const displayLabel = symbol.label ?? label ?? symbol.id;

      entities.push({
        id: `${symbol.id}_${i}`,
        slotIndex: i,
        role: "neutral",
        state,
        x: slot.x,
        y: slot.y,
        w: slot.w,
        h: slot.h,
        hitShape: "circle",
        glyph,
        label: displayLabel,
        spokenLabel: spokenLabel ?? symbol.label ?? displayLabel,
        spokenAudioPath,
      });
    }

    return {
      entities,
      activePrompt: this.content.prompt,
      focusIndex: this.getHintTargetIndex() ?? undefined,
    };
  }

  private renderPrompt(ctx: CanvasRenderingContext2D, rs: RenderSystem): void {
    if (this.stageRect) {
      return;
    }
    drawSubPromptText(ctx, rs, this.getCounterText());
  }

  /** `show_target_counter` tường minh thắng; mặc định bật ở auto, tắt ở declare (`BR-E037-01`). */
  get showTargetCounter(): boolean {
    return this.difficulty.show_target_counter ?? this.finishMode === "auto";
  }

  /** Dòng phụ dưới đề: `Đã tìm: n/m` khi bật bộ đếm, không thì lời nhắc không lộ tổng. */
  getCounterText(): string {
    if (this.showTargetCounter) {
      return `Đã tìm: ${this.foundTargets.size}/${this.targetCopies}`;
    }
    const targetSym = this.targetSymbol;
    const targetLabel = targetSym?.label ?? targetSym?.id ?? "ký hiệu";
    return `Tìm tất cả ${targetLabel}`;
  }

  private renderSingleSlotItem(
    ctx: CanvasRenderingContext2D,
    rs: RenderSystem,
    slot: Slot,
    symbol: GT037Symbol,
    index: number,
    timeMs: number
  ): void {
    const isFound = this.foundTargets.has(index);
    const isWrong = this.wrongSlotIndex === index;
    const rot = this.rotations[index] ?? 0;

    let drawSlot = slot;
    if (isWrong && !rs.reducedMotion) {
      drawSlot = { ...slot, x: slot.x + Math.sin(timeMs * 0.05) * 4 };
    }

    const state = resolveSlotItemState(isFound, isWrong);
    const itemData = {
      id: `${symbol.id}_${index}`,
      asset: symbol.asset,
      state,
    };

    if (rot === 0) {
      drawSlotItem(ctx, rs, drawSlot, itemData, "circle");
    } else {
      ctx.save();
      ctx.translate(drawSlot.x, drawSlot.y);
      ctx.rotate(rot);
      const localSlot: Slot = {
        ...drawSlot,
        x: 0,
        y: 0,
      };
      drawSlotItem(ctx, rs, localSlot, itemData, "circle");
      ctx.restore();
    }
  }

  private renderInteractiveSlots(
    ctx: CanvasRenderingContext2D,
    rs: RenderSystem,
    timeMs: number
  ): void {
    for (let i = 0; i < this.slots.length; i++) {
      const slot = this.slots[i];
      const symbol = this.boardSymbols[i];
      if (!(slot && symbol)) {
        continue;
      }
      this.renderSingleSlotItem(ctx, rs, slot, symbol, i, timeMs);
    }
  }

  private renderFeedback(
    ctx: CanvasRenderingContext2D,
    rs: RenderSystem
  ): void {
    if (this.foundTargets.size > 0) {
      for (const foundIdx of this.foundTargets) {
        const slot = this.slots[foundIdx];
        if (slot) {
          drawCircleOutline(
            ctx,
            slot,
            designTokens.colors.montessori.emerald,
            4,
            4
          );
        }
      }
    }

    if (
      this.particles.length > 0 &&
      this.degradation?.particles_enabled !== false
    ) {
      rs.drawParticles(ctx, this.particles);
    }
  }

  render(
    ctx: CanvasRenderingContext2D,
    rs: RenderSystem,
    timeMs: number
  ): void {
    this.lastFrameMs = timeMs;
    this.expireWrongFlash();
    drawSceneBackground(ctx, rs, this.themeId);
    this.renderPrompt(ctx, rs);
    this.renderInteractiveSlots(ctx, rs, timeMs);
    this.renderFeedback(ctx, rs);
  }
}
