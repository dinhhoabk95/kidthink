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
import { deriveStream } from "#src/rng/mulberry32";
import { shuffle } from "#src/rng/shuffle";
import type { DegradationState } from "#src/systems/degradation";
import { designTokens } from "#src/systems/designTokens";
import type { Particle, RenderSystem } from "#src/systems/render-system";
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
  wrongTimestamp = 0;
  itemCount = 0;
  targetCopies = 0;
  targetSet = new Set<string>();

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
    this.wrongTimestamp = 0;
    this.targetSet = new Set(this.content.target_ids);

    this.itemCount = this.difficulty.item_count ?? this.content.item_count;
    this.targetCopies =
      this.difficulty.target_copies ?? this.content.target_copies;

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

    this.recordEvent("game_started", {
      template_code: "GT-037",
      item_count: this.itemCount,
      target_copies: this.targetCopies,
      target_ids: this.content.target_ids,
      confusable_ids: this.content.confusable_ids,
    });
  }

  protected computeSlots(band: AgeBand): readonly Slot[] {
    if (this.boardSymbols.length === 0) {
      this.setupEntities();
    }

    const layoutFn = resolveLayout("scatter-board");
    const candidateSlots = layoutFn({
      slotCount: this.itemCount,
      ageBand: band,
      logic: this.logicSpace,
      stage: this.stageRect,
      cssPerLogic: this.cssPerLogic,
    });

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
      const rot = symbol?.orientation_free ? rawRot : 0;
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
    if (this.difficulty.allow_retry === false) {
      return { valid: false, feedback: "none" };
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
      this.wrongTimestamp = now;
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
    const now = Date.now();
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

  update(_deltaMs: number): void {
    if (this.particles.length > 0) {
      this.particles = updateParticles(this.particles);
    }
    if (
      this.wrongSlotIndex !== null &&
      Date.now() - this.wrongTimestamp > 800
    ) {
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
      const isTarget = this.targetSet.has(symbol.id);
      const isFound = this.foundTargets.has(i);
      const isWrong = this.wrongSlotIndex === i;
      const state = resolveEntityState(isFound, isWrong);
      const { glyph, label, spokenLabel, spokenAudioPath } = resolveAssetLabels(
        symbol.asset
      );

      entities.push({
        id: `${symbol.id}_${i}`,
        slotIndex: i,
        role: isTarget ? "target" : "neutral",
        state,
        x: slot.x,
        y: slot.y,
        w: slot.w,
        h: slot.h,
        hitShape: "circle",
        glyph,
        label,
        spokenLabel,
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
    const targetSym = this.targetSymbol;
    const targetLabel = targetSym?.label ?? targetSym?.id ?? "ký hiệu";
    const counterText =
      this.finishMode === "declare"
        ? `Tìm tất cả ${targetLabel}`
        : `Đã tìm: ${this.foundTargets.size}/${this.targetCopies}`;
    drawSubPromptText(ctx, rs, counterText);
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
    drawSceneBackground(ctx, rs, this.themeId);
    this.renderPrompt(ctx, rs);
    this.renderInteractiveSlots(ctx, rs, timeMs);
    this.renderFeedback(ctx, rs);
  }
}
