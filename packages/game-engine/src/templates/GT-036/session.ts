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
import { getTouchFloor } from "#src/layout/constants";
import type { Slot } from "#src/layout/types";
import {
  drawPromptText,
  drawSceneBackground,
  drawSlotItem,
  drawSubPromptText,
  drawWoodenTokenDock,
  spawnParticlesAtSlot,
} from "#src/render/index.js";
import type { DegradationState } from "#src/systems/degradation";
import type { Particle, RenderSystem } from "#src/systems/render-system";
import {
  detectRule,
  type RuleDetectionResult,
} from "#src/systems/rule-detection-system";
import { SFXEngine } from "#src/systems/sfx-engine";
import type {
  GT036Content,
  GT036Difficulty,
  GT036PaletteItem,
} from "./template.js";

export class GT036Session extends TemplateGameSession<
  GT036Content,
  GT036Difficulty
> {
  degradation: DegradationState | null = null;

  placedItems: (string | null)[] = [];
  selectedPaletteId: string | null = null;
  submitted = false;
  detectedRule: RuleDetectionResult | null = null;
  isWin = false;
  sessionScore = 0;
  sessionStars = 0;
  private particles: Particle[] = [];
  private readonly sfxEngine: SFXEngine;

  constructor(
    content: GT036Content,
    difficulty: GT036Difficulty,
    _ageBandOrSeed?: AgeBand | number
  ) {
    super(content, difficulty);
    this.sfxEngine = new SFXEngine();
  }

  setupEntities(): void {
    this.placedItems = new Array(this.content.track_length).fill(null);
    this.selectedPaletteId = this.content.palette[0]?.id ?? null;
    this.submitted = false;
    this.detectedRule = null;
    this.isWin = false;
    this.sessionScore = 0;
    this.sessionStars = 0;
    this.particles = [];

    this.recordEvent("game_started", {
      template_code: "GT-036",
      difficulty: this.difficulty.track_length ?? 6,
      age_band: "5-6",
      device: "tablet",
      reduced_motion: false,
      round_index: 0,
    });
  }

  protected computeSlots(band: AgeBand): readonly Slot[] {
    const floor = getTouchFloor(band);
    const slots: Slot[] = [];
    const count = this.content.track_length;
    const palCount = this.content.palette.length;

    // 1. Track slots (horizontal track)
    const trackSlotSize = Math.min(68, Math.floor((960 - 160) / count));
    const trackTotalWidth = count * (trackSlotSize + 8) - 8;
    const trackStartX = (960 - trackTotalWidth) / 2;
    const trackY = 170;

    for (let i = 0; i < count; i++) {
      slots.push({
        index: i,
        role: "target",
        x: trackStartX + i * (trackSlotSize + 8) + trackSlotSize / 2,
        y: trackY + trackSlotSize / 2,
        w: trackSlotSize,
        h: trackSlotSize,
        hitW: Math.max(trackSlotSize, floor),
        hitH: Math.max(trackSlotSize, floor),
        page: 0,
      });
    }

    // 2. Palette slots
    const palSlotSize = 80;
    const palTotalWidth = palCount * (palSlotSize + 16) - 16;
    const palStartX = (960 - palTotalWidth) / 2;
    const palY = 320;

    for (let i = 0; i < palCount; i++) {
      slots.push({
        index: count + i,
        role: "source",
        x: palStartX + i * (palSlotSize + 16) + palSlotSize / 2,
        y: palY + palSlotSize / 2,
        w: palSlotSize,
        h: palSlotSize,
        hitW: Math.max(palSlotSize, floor),
        hitH: Math.max(palSlotSize, floor),
        page: 0,
      });
    }

    // 3. Submit button slot
    slots.push({
      index: count + palCount,
      role: "target",
      x: 480 - 70,
      y: 465,
      w: 120,
      h: 50,
      hitW: Math.max(120, floor),
      hitH: Math.max(50, floor),
      page: 0,
    });

    // 4. Clear button slot
    slots.push({
      index: count + palCount + 1,
      role: "target",
      x: 480 + 70,
      y: 465,
      w: 120,
      h: 50,
      hitW: Math.max(120, floor),
      hitH: Math.max(50, floor),
      page: 0,
    });

    return slots;
  }

  override validateAction(action: GameAction): ActionResult {
    if (this.isWin || this.isWon) {
      return ACTION_IGNORED;
    }

    const data = (action.data as Record<string, unknown>) ?? {};
    switch (action.type) {
      case "select_palette":
      case "palette":
        return this.validateSelectPalette(data);
      case "place_element":
      case "place":
        return this.validatePlaceElement(data);
      case "remove_element":
      case "remove":
        return this.validateRemoveElement(data);
      case "clear_track":
      case "clear":
        return ACTION_CORRECT;
      case "submit_creation":
      case "submit":
        return this.validateSubmitCreation();
      default:
        return ACTION_IGNORED;
    }
  }

  private validateSelectPalette(data: Record<string, unknown>): ActionResult {
    const paletteId = String(data.paletteId ?? "");
    const exists = this.content.palette.some((p) => p.id === paletteId);
    return exists ? ACTION_CORRECT : ACTION_IGNORED;
  }

  private validatePlaceElement(data: Record<string, unknown>): ActionResult {
    const slotIdx = Number(data.slotIndex ?? -1);
    if (slotIdx < 0 || slotIdx >= this.content.track_length) {
      return ACTION_IGNORED;
    }

    const elementId =
      typeof data.elementId === "string" && data.elementId !== ""
        ? data.elementId
        : this.selectedPaletteId;

    if (!elementId) {
      return ACTION_IGNORED;
    }

    return ACTION_CORRECT;
  }

  private validateRemoveElement(data: Record<string, unknown>): ActionResult {
    const slotIdx = Number(data.slotIndex ?? -1);
    if (slotIdx < 0 || slotIdx >= this.content.track_length) {
      return ACTION_IGNORED;
    }
    return ACTION_CORRECT;
  }

  private validateSubmitCreation(): ActionResult {
    const result = detectRule(this.placedItems, {
      minRepetitions: this.content.min_repetitions,
      strictness: this.difficulty.strictness,
      paletteSize: this.content.palette.length,
    });
    return result.isWin ? ACTION_CORRECT : ACTION_RETRY;
  }

  override commit(action: GameAction): void {
    const data = (action.data as Record<string, unknown>) ?? {};
    switch (action.type) {
      case "select_palette":
      case "palette":
        this.commitSelectPalette(data);
        break;
      case "place_element":
      case "place":
        this.commitPlaceElement(data);
        break;
      case "remove_element":
      case "remove":
        this.commitRemoveElement(data);
        break;
      case "clear_track":
      case "clear":
        this.commitClearTrack();
        break;
      case "submit_creation":
      case "submit":
        this.commitSubmitCreation();
        break;
      default:
        break;
    }
  }

  private commitSelectPalette(data: Record<string, unknown>): void {
    const paletteId = String(data.paletteId ?? "");
    const exists = this.content.palette.some((p) => p.id === paletteId);
    if (!exists) {
      return;
    }
    this.selectedPaletteId = paletteId;
    this.sfxEngine.play("tap");
  }

  private commitPlaceElement(data: Record<string, unknown>): void {
    const slotIdx = Number(data.slotIndex ?? -1);
    if (slotIdx < 0 || slotIdx >= this.content.track_length) {
      return;
    }

    const elementId =
      typeof data.elementId === "string" && data.elementId !== ""
        ? data.elementId
        : this.selectedPaletteId;

    if (!elementId) {
      return;
    }

    this.placedItems[slotIdx] = elementId;
    this.submitted = false;
    this.detectedRule = null;
    this.sfxEngine.play("tap");

    this.recordEvent("element_placed", {
      slot_index: slotIdx,
      element_id: elementId,
      round_index: 0,
    });
  }

  private commitRemoveElement(data: Record<string, unknown>): void {
    const slotIdx = Number(data.slotIndex ?? -1);
    if (slotIdx < 0 || slotIdx >= this.content.track_length) {
      return;
    }

    const removedId = this.placedItems[slotIdx];
    this.placedItems[slotIdx] = null;
    this.submitted = false;
    this.detectedRule = null;
    this.sfxEngine.play("tap");

    this.recordEvent("element_removed", {
      slot_index: slotIdx,
      removed_id: removedId ?? undefined,
      round_index: 0,
    });
  }

  private commitClearTrack(): void {
    this.placedItems = new Array(this.content.track_length).fill(null);
    this.submitted = false;
    this.detectedRule = null;
    this.isWin = false;
    this.sfxEngine.play("tap");
  }

  private commitSubmitCreation(): void {
    this.recordEvent("creation_submitted", {
      placed_items: this.placedItems,
      round_index: 0,
    });

    const result = detectRule(this.placedItems, {
      minRepetitions: this.content.min_repetitions,
      strictness: this.difficulty.strictness,
      paletteSize: this.content.palette.length,
    });

    this.submitted = true;
    this.detectedRule = result;
    this.sessionScore = result.score;
    this.isWin = result.isWin;

    this.recordEvent("rule_detected", {
      detected: result.detected,
      motif: result.motif,
      repetitions: result.repetitions,
      score: result.score,
      is_win: result.isWin,
      round_index: 0,
    });

    if (result.isWin) {
      this.isWon = true;
      if (result.score >= 100) {
        this.sessionStars = 3;
      } else if (result.score >= 80) {
        this.sessionStars = 2;
      } else {
        this.sessionStars = 1;
      }
      this.sfxEngine.play("pop_celebrate");
      this.recordEvent("game_completed", {
        duration_ms: 10_000,
        rounds_total: 1,
        rounds_correct: 1,
      });

      for (let i = 0; i < this.content.track_length; i++) {
        const slot = this.slots[i];
        if (slot) {
          this.particles.push(...spawnParticlesAtSlot(slot, 8));
        }
      }
      this.winSession();
      this.completeSession();
      return;
    }

    this.sfxEngine.play("amber_soft");
  }

  private isHitSlot(slot: Slot, gx: number, gy: number, tol: number): boolean {
    const hw = (slot.hitW ?? slot.w) / 2 + tol;
    const hh = (slot.hitH ?? slot.h) / 2 + tol;
    return Math.abs(gx - slot.x) <= hw && Math.abs(gy - slot.y) <= hh;
  }

  private findTappedControl(
    gx: number,
    gy: number,
    tol: number
  ): GameAction | null {
    const count = this.content.track_length;
    const palCount = this.content.palette.length;

    const submitSlot = this.slots[count + palCount];
    if (submitSlot && this.isHitSlot(submitSlot, gx, gy, tol)) {
      return { type: "submit_creation", data: {} };
    }

    const clearSlot = this.slots[count + palCount + 1];
    if (clearSlot && this.isHitSlot(clearSlot, gx, gy, tol)) {
      return { type: "clear_track", data: {} };
    }

    return null;
  }

  private findTappedPalette(
    gx: number,
    gy: number,
    tol: number
  ): GameAction | null {
    const count = this.content.track_length;
    const palCount = this.content.palette.length;

    for (let p = 0; p < palCount; p++) {
      const slot = this.slots[count + p];
      const pal = this.content.palette[p];
      if (slot && pal && this.isHitSlot(slot, gx, gy, tol)) {
        return { type: "select_palette", data: { paletteId: pal.id } };
      }
    }
    return null;
  }

  private findTappedTrack(
    gx: number,
    gy: number,
    tol: number
  ): GameAction | null {
    const count = this.content.track_length;
    for (let i = 0; i < count; i++) {
      const slot = this.slots[i];
      if (slot && this.isHitSlot(slot, gx, gy, tol)) {
        if (this.selectedPaletteId) {
          return {
            type: "place_element",
            data: { slotIndex: i, elementId: this.selectedPaletteId },
          };
        }
        if (this.placedItems[i]) {
          return { type: "remove_element", data: { slotIndex: i } };
        }
      }
    }
    return null;
  }

  override toAction(gesture: Gesture): GameAction | null {
    if (gesture.type !== "tap") {
      return null;
    }

    const hitTolerance = 24;
    return (
      this.findTappedControl(gesture.x, gesture.y, hitTolerance) ??
      this.findTappedPalette(gesture.x, gesture.y, hitTolerance) ??
      this.findTappedTrack(gesture.x, gesture.y, hitTolerance)
    );
  }

  private appendTrackEntities(entities: ViewEntity[], count: number): void {
    for (let i = 0; i < count; i++) {
      const slot = this.slots[i];
      if (!slot) {
        continue;
      }
      entities.push({
        id: `track_${i}`,
        slotIndex: i,
        role: "target",
        state: this.placedItems[i] ? "selected" : "idle",
        x: slot.x,
        y: slot.y,
        w: slot.w,
        h: slot.h,
      });
    }
  }

  private appendPaletteEntities(
    entities: ViewEntity[],
    count: number,
    palCount: number
  ): void {
    for (let p = 0; p < palCount; p++) {
      const slot = this.slots[count + p];
      const pal = this.content.palette[p];
      if (!(slot && pal)) {
        continue;
      }
      entities.push({
        id: `palette_${pal.id}`,
        slotIndex: count + p,
        role: "source",
        state: this.selectedPaletteId === pal.id ? "selected" : "idle",
        x: slot.x,
        y: slot.y,
        w: slot.w,
        h: slot.h,
      });
    }
  }

  override getView(): EngineView {
    const entities: ViewEntity[] = [];
    const count = this.content.track_length;
    const palCount = this.content.palette.length;

    this.appendTrackEntities(entities, count);
    this.appendPaletteEntities(entities, count, palCount);

    const submitSlot = this.slots[count + palCount];
    if (submitSlot) {
      entities.push({
        id: "submit_btn",
        slotIndex: count + palCount,
        role: "target",
        state: "idle",
        x: submitSlot.x,
        y: submitSlot.y,
        w: submitSlot.w,
        h: submitSlot.h,
      });
    }

    const clearSlot = this.slots[count + palCount + 1];
    if (clearSlot) {
      entities.push({
        id: "clear_btn",
        slotIndex: count + palCount + 1,
        role: "target",
        state: "idle",
        x: clearSlot.x,
        y: clearSlot.y,
        w: clearSlot.w,
        h: clearSlot.h,
      });
    }

    return {
      activePrompt: this.content.prompt,
      entities,
    };
  }

  override checkWinCondition(): boolean {
    return this.isWin || this.isWon;
  }

  render(ctx: CanvasRenderingContext2D, rs: RenderSystem): void {
    drawSceneBackground(ctx, rs, this.themeId);

    drawPromptText(ctx, rs, this.content.prompt);
    drawSubPromptText(
      ctx,
      rs,
      `Bé chọn hình và xếp dải lặp lại ít nhất ${this.content.min_repetitions} lần nhé!`
    );

    this.renderTrackSlots(ctx, rs);
    this.renderPaletteDock(ctx, rs);
    this.renderControlButtons(ctx, rs);

    if (this.submitted && this.detectedRule?.detected) {
      this.renderRuleOverlay(ctx, rs);
    }

    if (
      this.particles.length > 0 &&
      this.degradation?.particles_enabled !== false
    ) {
      rs.drawParticles(ctx, this.particles);
    }
  }

  private renderTrackSlots(
    ctx: CanvasRenderingContext2D,
    rs: RenderSystem
  ): void {
    const palMap = new Map<string, GT036PaletteItem>(
      this.content.palette.map((p) => [p.id, p])
    );

    for (let i = 0; i < this.content.track_length; i++) {
      const slot = this.slots[i];
      if (!slot) {
        continue;
      }
      const elementId = this.placedItems[i];
      if (elementId && palMap.has(elementId)) {
        const palItem = palMap.get(elementId);
        if (palItem) {
          drawSlotItem(ctx, rs, slot, {
            id: `placed-${i}`,
            asset: palItem.asset,
            state: "idle",
          });
        }
      } else {
        drawSlotItem(ctx, rs, slot, {
          id: `empty-track-${i}`,
          label: `${i + 1}`,
          state: "idle",
        });
      }
    }
  }

  private renderPaletteDock(
    ctx: CanvasRenderingContext2D,
    rs: RenderSystem
  ): void {
    const count = this.content.track_length;
    const palCount = this.content.palette.length;
    const palSlots = this.slots.slice(count, count + palCount);

    drawWoodenTokenDock(ctx, rs);

    for (let i = 0; i < palCount; i++) {
      const slot = palSlots[i];
      const pItem = this.content.palette[i];
      if (!(slot && pItem)) {
        continue;
      }

      const isSelected = this.selectedPaletteId === pItem.id;
      drawSlotItem(ctx, rs, slot, {
        id: pItem.id,
        asset: pItem.asset,
        state: isSelected ? "selected" : "idle",
      });
    }
  }

  private renderControlButtons(
    ctx: CanvasRenderingContext2D,
    rs: RenderSystem
  ): void {
    const count = this.content.track_length;
    const palCount = this.content.palette.length;
    const submitSlot = this.slots[count + palCount];
    const clearSlot = this.slots[count + palCount + 1];

    if (submitSlot) {
      drawSlotItem(ctx, rs, submitSlot, {
        id: "btn-submit-item",
        label: "NỘP BÀI",
        state: this.isWin ? "selected" : "idle",
      });
    }

    if (clearSlot) {
      drawSlotItem(ctx, rs, clearSlot, {
        id: "btn-clear-item",
        label: "XOÁ HẾT",
        state: "idle",
      });
    }
  }

  private renderRuleOverlay(
    ctx: CanvasRenderingContext2D,
    rs: RenderSystem
  ): void {
    if (!this.detectedRule?.detected) {
      return;
    }
    const motifStr = this.detectedRule.motif.join(" - ");

    drawSubPromptText(
      ctx,
      rs,
      `Tuyệt vời! Quy luật [${motifStr}] lặp lại ${this.detectedRule.repetitions} lần!`
    );
  }

  get score(): number {
    return this.sessionScore;
  }

  get stars(): number {
    return this.sessionStars;
  }

  get placedElements(): readonly (string | null)[] {
    return this.placedItems;
  }
}
