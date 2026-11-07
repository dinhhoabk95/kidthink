import type { AgeBand } from "#src/contracts/types";
import {
  ACTION_CORRECT,
  ACTION_IGNORED,
  type ActionResult,
  type GameAction,
  type HintTarget,
  TemplateGameSession,
} from "#src/game-session";
import type { EngineView, Gesture, ViewEntity } from "#src/interaction";
import {
  resolveAssetLabels,
  resolveAssetSpeech,
} from "#src/labels/spoken-keyword";
import { findHitSlotIndex, TAP_TOLERANCE_PX } from "#src/layout/hit-test";
import {
  computeStageGroupsLayout,
  resolveStageRect,
} from "#src/layout/stage-groups";
import type { Slot } from "#src/layout/types";
import {
  drawSceneBackground,
  drawSlotItem,
  spawnParticlesAtSlot,
  updateParticles,
} from "#src/render/index";
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
} from "./template";

export interface GT036ActionPayload {
  readonly paletteId?: string;
  readonly slotIndex?: number;
  readonly elementId?: string;
}

/** Chốt mà chưa có luật: lời mời làm tiếp, không tính sai. */
const QUIET_OK: ActionResult = Object.freeze({
  valid: true,
  feedback: "none",
});

export class GT036Session extends TemplateGameSession<
  GT036Content,
  GT036Difficulty
> {
  /** Nút ở `zones.action` là nút xong (`BR-PSZ-05`); không có nút xoá. */
  override readonly needsCommit = true;
  override readonly usesPromptZone = true;

  override canCommit(): boolean {
    return (
      !(this.isWin || this.isWon) &&
      this.placedItems.some((item) => item !== null)
    );
  }

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
  private readonly paletteMap: ReadonlyMap<string, GT036PaletteItem>;

  constructor(
    content: GT036Content,
    difficulty: GT036Difficulty,
    _ageBandOrSeed?: AgeBand | number
  ) {
    super(content, difficulty);
    this.paletteMap = new Map(content.palette.map((p) => [p.id, p]));
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

  override destroy(): void {
    this.sfxEngine.dispose();
    super.destroy();
  }

  /**
   * Bước gợi ý kế tiếp: mở đầu một mô-típ hai loại rồi lặp nó (`BR-E036-06`).
   * Chỉ là gợi ý — hai ô đầu luôn khác loại để dải có luật; `null` khi dải đã khớp.
   */
  private hintPlan(): { slot: number; elementId: string } | null {
    const palette = this.content.palette.map((p) => p.id);
    const first = this.placedItems[0] ?? palette[0];
    if (!first) {
      return null;
    }
    const placedSecond = this.placedItems[1];
    const second =
      placedSecond && placedSecond !== first
        ? placedSecond
        : palette.find((id) => id !== first);
    if (!second) {
      return null;
    }
    const motif = [first, second];
    for (let i = 0; i < this.content.track_length; i++) {
      const want = motif[i % 2];
      if (want && this.placedItems[i] !== want) {
        return { slot: i, elementId: want };
      }
    }
    return null;
  }

  override getHintTargetIndex(): number | null {
    if (this.isWin || this.isWon) {
      return null;
    }
    const plan = this.hintPlan();
    // Dải đã khớp thì bước kế là nút xong ở `zones.action` — không phải slot
    // của sân khấu (`BR-PSZ-05`), nên không có ô nào để chỉ.
    if (!plan) {
      return null;
    }
    if (plan.elementId !== this.selectedPaletteId) {
      const palIdx = this.content.palette.findIndex(
        (p) => p.id === plan.elementId
      );
      return palIdx >= 0 ? this.content.track_length + palIdx : plan.slot;
    }
    return plan.slot;
  }

  override getHintTarget(): HintTarget | null {
    if (this.isWin || this.isWon) {
      return null;
    }
    const index = this.getHintTargetIndex();
    if (index !== null) {
      return { kind: "slot", index };
    }
    if (this.placedItems.includes(null) === false || this.hintPlan() === null) {
      return { kind: "action" };
    }
    return super.getHintTarget();
  }

  protected computeSlots(band: AgeBand): readonly Slot[] {
    // Dải mẫu trên, bảng phần tử dưới — trong sân khấu của khung (`BR-PSZ-01`).
    // Nút xong không còn là slot: shell vẽ ở `zones.action`; nút xoá bỏ hẳn
    // (`BR-PSZ-05`) — chạm lại ô đang mang đúng phần tử đang cầm là gỡ nó.
    return computeStageGroupsLayout({
      stage: resolveStageRect(this.logicSpace, band, this.stageRect),
      ageBand: band,
      cssPerLogic: this.cssPerLogic,
      groups: [
        { count: this.content.track_length, role: "target" },
        { count: this.content.palette.length, role: "source" },
      ],
    });
  }

  override validateAction(action: GameAction): ActionResult {
    if (this.isWin || this.isWon) {
      return ACTION_IGNORED;
    }

    const data = (action.data as GT036ActionPayload | undefined) ?? {};
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

  private validateSelectPalette(data: GT036ActionPayload): ActionResult {
    const paletteId = String(data.paletteId ?? "");
    const exists = this.content.palette.some((p) => p.id === paletteId);
    return exists ? ACTION_CORRECT : ACTION_IGNORED;
  }

  private validatePlaceElement(data: GT036ActionPayload): ActionResult {
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

  private validateRemoveElement(data: GT036ActionPayload): ActionResult {
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
    // Không có luật chưa phải sai: tác phẩm của trẻ chỉ cần làm tiếp (`BR-E036-07`).
    return result.isWin ? ACTION_CORRECT : QUIET_OK;
  }

  override commit(action: GameAction): void {
    const data = (action.data as GT036ActionPayload | undefined) ?? {};
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

  private commitSelectPalette(data: GT036ActionPayload): void {
    const paletteId = String(data.paletteId ?? "");
    const exists = this.content.palette.some((p) => p.id === paletteId);
    if (!exists) {
      return;
    }
    this.selectedPaletteId = paletteId;
    this.sfxEngine.play("tap");
  }

  private commitPlaceElement(data: GT036ActionPayload): void {
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

  private commitRemoveElement(data: GT036ActionPayload): void {
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

    // Chưa có luật: tiếng nhẹ như mọi lần đặt, các ô đã đặt sáng mời làm tiếp.
    this.sfxEngine.play("tap");
  }

  update(_deltaMs: number): void {
    if (this.particles.length > 0) {
      this.particles = updateParticles(this.particles);
    }
  }

  private findTappedPalette(gx: number, gy: number): GameAction | null {
    const count = this.content.track_length;
    const palCount = this.content.palette.length;
    const palSlots = this.slots.slice(count, count + palCount);
    const hitIdx = findHitSlotIndex(
      palSlots,
      gx,
      gy,
      "circle",
      TAP_TOLERANCE_PX
    );
    const pal = hitIdx >= 0 ? this.content.palette[hitIdx] : undefined;
    return pal ? { type: "select_palette", data: { paletteId: pal.id } } : null;
  }

  private findTappedTrack(gx: number, gy: number): GameAction | null {
    const count = this.content.track_length;
    const trackSlots = this.slots.slice(0, count);
    const hitIdx = findHitSlotIndex(
      trackSlots,
      gx,
      gy,
      "circle",
      TAP_TOLERANCE_PX
    );
    if (hitIdx < 0) {
      return null;
    }
    const placed = this.placedItems[hitIdx];
    if (this.selectedPaletteId && placed !== this.selectedPaletteId) {
      return {
        type: "place_element",
        data: { slotIndex: hitIdx, elementId: this.selectedPaletteId },
      };
    }
    if (placed) {
      return { type: "remove_element", data: { slotIndex: hitIdx } };
    }
    return null;
  }

  private findDroppedElement(
    gesture: Extract<Gesture, { type: "drop" }>
  ): GameAction | null {
    const count = this.content.track_length;
    const palCount = this.content.palette.length;
    const palSlots = this.slots.slice(count, count + palCount);
    const palIdx = findHitSlotIndex(
      palSlots,
      gesture.fromX,
      gesture.fromY,
      "circle",
      TAP_TOLERANCE_PX
    );
    const draggedPaletteId =
      palIdx >= 0 ? (this.content.palette[palIdx]?.id ?? null) : null;
    if (!draggedPaletteId) {
      return null;
    }

    const trackSlots = this.slots.slice(0, count);
    const trackIdx = findHitSlotIndex(
      trackSlots,
      gesture.toX,
      gesture.toY,
      "circle",
      TAP_TOLERANCE_PX
    );
    if (trackIdx < 0) {
      return null;
    }
    return {
      type: "place_element",
      data: { slotIndex: trackIdx, elementId: draggedPaletteId },
    };
  }

  override toAction(gesture: Gesture): GameAction | null {
    // Chạm nút ở `zones.action` tới đây thành `commit` (`BR-PSZ-05`): nộp dải.
    if (gesture.type === "commit") {
      return { type: "submit_creation", data: {} };
    }
    if (gesture.type === "drop") {
      return this.findDroppedElement(gesture);
    }
    if (gesture.type !== "tap") {
      return null;
    }

    return (
      this.findTappedPalette(gesture.x, gesture.y) ??
      this.findTappedTrack(gesture.x, gesture.y)
    );
  }

  private trackEntityState(
    index: number,
    placedId: string | null | undefined
  ): ViewEntity["state"] {
    if (this.isTrackCellLit(index)) {
      return "active";
    }
    return placedId ? "selected" : "idle";
  }

  private appendTrackEntities(entities: ViewEntity[], count: number): void {
    for (let i = 0; i < count; i++) {
      const slot = this.slots[i];
      if (!slot) {
        continue;
      }
      const placedId = this.placedItems[i];
      const palItem = placedId ? this.paletteMap.get(placedId) : undefined;
      const assetLabels = palItem
        ? resolveAssetLabels(palItem.asset)
        : undefined;
      const itemSpoken = assetLabels?.spokenLabel ?? assetLabels?.label;
      entities.push({
        id: `track_${i}`,
        slotIndex: i,
        role: "target",
        state: this.trackEntityState(i, placedId),
        x: slot.x,
        y: slot.y,
        w: slot.w,
        h: slot.h,
        hitShape: "circle",
        glyph: assetLabels?.glyph,
        label: assetLabels ? undefined : `${i + 1}`,
        spokenLabel: itemSpoken
          ? `Ô số ${i + 1}: ${itemSpoken}`
          : `Ô số ${i + 1} đang trống`,
        spokenAudioPath: assetLabels?.spokenAudioPath,
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
      const { glyph, spokenLabel, spokenAudioPath } = resolveAssetSpeech(
        pal.asset
      );
      entities.push({
        id: `palette_${pal.id}`,
        slotIndex: count + p,
        role: "source",
        state: this.selectedPaletteId === pal.id ? "selected" : "idle",
        x: slot.x,
        y: slot.y,
        w: slot.w,
        h: slot.h,
        hitShape: "circle",
        glyph,
        spokenLabel: spokenLabel ?? pal.id,
        spokenAudioPath,
      });
    }
  }

  override getView(): EngineView {
    const entities: ViewEntity[] = [];
    const count = this.content.track_length;
    const palCount = this.content.palette.length;

    this.appendTrackEntities(entities, count);
    this.appendPaletteEntities(entities, count, palCount);

    return {
      activePrompt: this.content.prompt,
      entities,
      focusIndex: this.getHintTargetIndex() ?? undefined,
    };
  }

  override checkWinCondition(): boolean {
    return this.isWin || this.isWon;
  }

  render(ctx: CanvasRenderingContext2D, rs: RenderSystem): void {
    drawSceneBackground(ctx, rs, this.themeId);

    // Không vẽ dòng chữ nào: lời mời và lời khen do lời dẫn đọc, mô-típ sáng trên dải (`BR-E036-09`).
    this.renderTrackSlots(ctx, rs);
    this.renderPaletteDock(ctx, rs);

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
    for (let i = 0; i < this.content.track_length; i++) {
      const slot = this.slots[i];
      if (!slot) {
        continue;
      }
      const elementId = this.placedItems[i];
      const palItem = elementId ? this.paletteMap.get(elementId) : undefined;
      if (palItem) {
        drawSlotItem(ctx, rs, slot, {
          id: `placed-${i}`,
          asset: palItem.asset,
          state: this.isTrackCellLit(i) ? "touching" : "idle",
        });
      } else {
        drawSlotItem(ctx, rs, slot, {
          id: `empty-track-${i}`,
          text: `${i + 1}`,
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

    for (let i = 0; i < palCount; i++) {
      const slot = this.slots[count + i];
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

  /** Lời đọc sau khi chốt, không vẽ ra canvas (`BR-E036-09`); không in mã phần tử thô (`BR-E036-08`). */
  ruleOverlayText(): string | null {
    if (!(this.submitted && this.detectedRule?.detected)) {
      return null;
    }
    return `Tuyệt vời! Quy luật của bé lặp lại ${this.detectedRule.repetitions} lần!`;
  }

  /** Ô đã đặt sáng lên khi chốt mà chưa có luật, hoặc nằm trong mô-típ vừa đọc ra. */
  private isTrackCellLit(index: number): boolean {
    if (!(this.submitted && this.placedItems[index])) {
      return false;
    }
    if (!this.detectedRule?.detected) {
      return true;
    }
    return index < this.detectedRule.motif.length;
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
