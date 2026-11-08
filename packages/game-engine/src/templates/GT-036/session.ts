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
  hasSlotsOutsideStage,
  resolveStageRect,
} from "#src/layout/stage-groups";
import type { ZoneRect } from "#src/layout/stage-zones";
import type { Slot } from "#src/layout/types";
import {
  beadStringSegments,
  drawBeadString,
  drawSceneBackground,
  drawSlotItem,
  drawStoryCharacterInStage,
  nightingaleSway,
  spawnParticlesAtSlot,
  updateParticles,
} from "#src/render/index";
import type { MascotPose } from "#src/render/mascot";
import type { DegradationState } from "#src/systems/degradation";
import { MoodPulse } from "#src/systems/mood-pulse";
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

/**
 * Ô phụ "xoá hết dải" (`BR-E036-13`, ngoại lệ có phạm vi của `BR-PSZ-05`): slot
 * cuối, sau dải và bảng phần tử, nên chỉ số dải và bảng không đổi; trên màn nó
 * đứng trên dải — xa nút xong ở góc dưới. Hình chổi, không chữ.
 */
const CLEAR_ID = "clear-track";
const CLEAR_ASSET = { kind: "emoji", ref: "🧹" } as const;
const CLEAR_SPOKEN_LABEL = "Xoá hết dải";

/** Chốt mà chưa có luật: lời mời làm tiếp, không tính sai. */
const QUIET_OK: ActionResult = Object.freeze({
  valid: true,
  feedback: "none",
});

/** Khung chuyện đọc một lần ở vòng đầu (`BR-E036-10`, `BR-FBK-16`). */
export const GT036_STORY_LINE =
  "Họa Mi thích hát theo quy luật. Bé xâu các hạt thành một dãy lặp lại, rồi Họa Mi sẽ hát theo dãy của bé nhé!";

/** Mascot vui ngắn sau mỗi hạt đặt. */
export const GT036_HAPPY_MS = 500;
/** Mỗi ô sáng cách ô trước chừng này ms khi đọc luật ra (`BR-E036-11`). */
export const GT036_LIGHT_STEP_MS = 350;

/** Lời mời đọc thành tiếng khi chốt mà dải chưa thành quy luật (`BR-E036-11`). */
export const GT036_INVITE_LINE = "Bé xâu thêm hạt cho dãy dài hơn nữa nhé!";

/** Mascot khích lệ khi dãy chưa thành quy luật. */
export const GT036_ENCOURAGE_MS = 1500;

/** Số slot có vùng chạm ra ngoài sân khấu (`BR-PSZ-01`). */
function countOutsideStage(slots: readonly Slot[], stage: ZoneRect): number {
  return slots.filter((slot) => hasSlotsOutsideStage([slot], stage)).length;
}

/** Đưa slot ở chỉ số `from` về cuối (ô xoá), các slot sau nó lùi một. */
function moveSlotToEnd(slots: readonly Slot[], from: number): Slot[] {
  const last = slots.length - 1;
  return slots
    .map((slot): Slot => {
      if (slot.index === from) {
        return { ...slot, index: last, role: "neutral" };
      }
      return slot.index > from ? { ...slot, index: slot.index - 1 } : slot;
    })
    .sort((a, b) => a.index - b.index);
}

export class GT036Session extends TemplateGameSession<
  GT036Content,
  GT036Difficulty
> {
  /**
   * Nút ở `zones.action` là nút xong (`BR-PSZ-05`); nút xoá dải là ô phụ trong
   * sân khấu (`BR-E036-13`), không phải nút thứ hai ở vùng hành động.
   */
  override readonly needsCommit = true;
  override readonly usesPromptZone = true;

  override canCommit(): boolean {
    return !(this.isWin || this.isWon) && this.hasPlaced;
  }

  degradation: DegradationState | null = null;

  placedItems: (string | null)[] = [];
  selectedPaletteId: string | null = null;
  submitted = false;
  detectedRule: RuleDetectionResult | null = null;
  isWin = false;
  sessionScore = 0;
  sessionStars = 0;
  /** Thời gian từ lúc chốt, để các ô sáng lần lượt (`BR-E036-11`). */
  private litElapsedMs = 0;
  private pendingInvitation: string | null = null;
  private particles: Particle[] = [];
  private readonly mood = new MoodPulse();
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

  /** Slot đầu của bảng phần tử: ngay sau dải (dải là slot 0..track_length-1). */
  private get paletteBase(): number {
    return this.content.track_length;
  }

  /** Chỉ số ô xoá: sau dải và bảng phần tử. */
  private get clearSlotIndex(): number {
    return this.paletteBase + this.content.palette.length;
  }

  /**
   * Slot ô xoá; không có khi sân khấu không còn chỗ mà không làm tràn thêm
   * (`BR-E036-13`) — khi đó trẻ gỡ từng hạt như cũ.
   */
  private get clearSlot(): Slot | undefined {
    return this.slots[this.clearSlotIndex];
  }

  /** Có hạt nào trên dải để xoá không (nút xoá chỉ hiện khi có). */
  private get hasPlaced(): boolean {
    return this.placedItems.some((item) => item !== null);
  }

  private get isClearVisible(): boolean {
    return (
      this.clearSlot !== undefined &&
      this.hasPlaced &&
      !(this.isWin || this.isWon)
    );
  }

  override storyLine(): string {
    return GT036_STORY_LINE;
  }

  /** Vui sau mỗi hạt, khích lệ khi dãy chưa thành quy luật (`BR-E036-10`). */
  override mascotMood(): MascotPose | null {
    return this.isWon ? null : this.mood.current();
  }

  setupEntities(): void {
    this.mood.clear();
    this.placedItems = new Array(this.content.track_length).fill(null);
    this.selectedPaletteId = this.content.palette[0]?.id ?? null;
    this.submitted = false;
    this.detectedRule = null;
    this.pendingInvitation = null;
    this.isWin = false;
    this.sessionScore = 0;
    this.sessionStars = 0;
    this.litElapsedMs = 0;
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
      return palIdx >= 0 ? this.paletteBase + palIdx : plan.slot;
    }
    return plan.slot;
  }

  /**
   * `BR-E036-12`: chưa cầm đúng phần tử thì bước đúng là kéo nó từ bảng vào ô dải,
   * đích là ô dải; đã cầm sẵn thì chỉ còn chạm ô nên không có đích.
   */
  override getHintDestinationIndex(): number | null {
    if (this.isWin || this.isWon) {
      return null;
    }
    const plan = this.hintPlan();
    if (!plan || plan.elementId === this.selectedPaletteId) {
      return null;
    }
    const palIdx = this.content.palette.findIndex(
      (p) => p.id === plan.elementId
    );
    return palIdx >= 0 ? plan.slot : null;
  }

  override getHintTarget(): HintTarget | null {
    if (this.isWin || this.isWon) {
      return null;
    }
    const index = this.getHintTargetIndex();
    if (index !== null) {
      const toIndex = this.getHintDestinationIndex();
      return toIndex === null
        ? { kind: "slot", index }
        : { kind: "slot", index, toIndex };
    }
    if (this.placedItems.includes(null) === false || this.hintPlan() === null) {
      return { kind: "action" };
    }
    return super.getHintTarget();
  }

  protected computeSlots(band: AgeBand): readonly Slot[] {
    // Dải mẫu trên, bảng phần tử dưới — trong sân khấu của khung (`BR-PSZ-01`).
    // Nút xong không còn là slot: shell vẽ ở `zones.action` (`BR-PSZ-05`). Ô xoá
    // dải là slot cuối (`BR-E036-13`); chạm lại ô đang mang đúng phần tử đang
    // cầm vẫn gỡ phần tử đó.
    const base = {
      stage: resolveStageRect(this.logicSpace, band, this.stageRect),
      ageBand: band,
      cssPerLogic: this.cssPerLogic,
    };
    const track = { count: this.content.track_length, role: "target" } as const;
    const palette = {
      count: this.content.palette.length,
      role: "source",
    } as const;
    const plain = computeStageGroupsLayout({
      ...base,
      groups: [track, palette],
    });
    // Ô xoá không bao giờ được làm tràn thêm sân khấu: ô dải hay phần tử bị
    // đẩy ra ngoài là bài không chơi được, mất nút xoá thì chỉ chậm hơn.
    const plainOutside = countOutsideStage(plain, base.stage);
    const fits = (slots: readonly Slot[], clearIndex: number): boolean => {
      const clear = slots.find((slot) => slot.index === clearIndex);
      return (
        clear !== undefined &&
        !hasSlotsOutsideStage([clear], base.stage) &&
        countOutsideStage(slots, base.stage) <= plainOutside
      );
    };
    // Ưu tiên: ô xoá là nhóm riêng đứng trước dải — xa nút xong ở góc dưới nhất.
    const onTop = computeStageGroupsLayout({
      ...base,
      groups: [{ count: 1, role: "neutral", cols: 1 }, track, palette],
    });
    if (fits(onTop, 0)) {
      return moveSlotToEnd(onTop, 0);
    }
    // Sân khấu chật (điện thoại ngang, dải dài): ô xoá nhường vào đầu hàng bảng
    // phần tử — ô ngoài cùng bên trái, xa nút xong ở góc phải.
    const merged = computeStageGroupsLayout({
      ...base,
      groups: [track, { count: palette.count + 1, role: "source" }],
    });
    if (fits(merged, track.count)) {
      return moveSlotToEnd(merged, track.count);
    }
    // Không còn chỗ: không có ô xoá, bố cục như khi chưa có nút.
    return plain;
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
        // Dải rỗng thì không có gì để xoá (`BR-E036-13`).
        return this.hasPlaced ? ACTION_CORRECT : ACTION_IGNORED;
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
    this.pendingInvitation = null;
    this.sfxEngine.play("tap");
    // Tiếng hạt như nhau mọi hạt: bài mở, không có hạt "đúng" (`BR-E036-10`).
    this.queueSfx("bead_click");
    this.mood.set("happy", GT036_HAPPY_MS);

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
    this.pendingInvitation = null;
    this.sfxEngine.play("tap");

    this.recordEvent("element_removed", {
      slot_index: slotIdx,
      removed_id: removedId ?? undefined,
      round_index: 0,
    });
  }

  private commitClearTrack(): void {
    // Mỗi hạt gỡ ghi một `element_removed` (đã có trong catalog); không phải lượt
    // sai, không đụng điểm (`BR-E036-13`).
    this.placedItems.forEach((removedId, slotIndex) => {
      if (removedId) {
        this.recordEvent("element_removed", {
          slot_index: slotIndex,
          removed_id: removedId,
          round_index: 0,
        });
      }
    });
    this.placedItems = new Array(this.content.track_length).fill(null);
    this.submitted = false;
    this.detectedRule = null;
    this.pendingInvitation = null;
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
    this.litElapsedMs = 0;
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
    this.mood.set("encourage", GT036_ENCOURAGE_MS);
    this.pendingInvitation = GT036_INVITE_LINE;
  }

  override takeSpokenInvitation(): string | null {
    const line = this.pendingInvitation;
    this.pendingInvitation = null;
    return line;
  }

  update(deltaMs: number): void {
    this.mood.tick(deltaMs);
    if (this.submitted) {
      this.litElapsedMs += deltaMs;
    }
    if (this.particles.length > 0) {
      this.particles = updateParticles(this.particles);
    }
  }

  private findTappedClear(gx: number, gy: number): GameAction | null {
    const slot = this.clearSlot;
    if (!(slot && this.isClearVisible)) {
      return null;
    }
    const hit = findHitSlotIndex([slot], gx, gy, "circle", TAP_TOLERANCE_PX);
    return hit >= 0 ? { type: "clear_track", data: {} } : null;
  }

  private findTappedPalette(gx: number, gy: number): GameAction | null {
    const palCount = this.content.palette.length;
    const palSlots = this.slots.slice(
      this.paletteBase,
      this.paletteBase + palCount
    );
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
    const palSlots = this.slots.slice(
      this.paletteBase,
      this.paletteBase + palCount
    );
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
      this.findTappedClear(gesture.x, gesture.y) ??
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
    palCount: number
  ): void {
    for (let p = 0; p < palCount; p++) {
      const slot = this.slots[this.paletteBase + p];
      const pal = this.content.palette[p];
      if (!(slot && pal)) {
        continue;
      }
      const { glyph, spokenLabel, spokenAudioPath } = resolveAssetSpeech(
        pal.asset
      );
      entities.push({
        id: `palette_${pal.id}`,
        slotIndex: this.paletteBase + p,
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

  /** Ô xoá dải: chỉ có trong view khi có slot và dải có hạt (`BR-E036-13`). */
  private appendClearEntity(entities: ViewEntity[]): void {
    const slot = this.clearSlot;
    if (!(slot && this.isClearVisible)) {
      return;
    }
    // `neutral` như nút lật của GT-019: là nút, không phải vật kéo — đường bàn
    // phím gửi chạm thẳng thay vì "cầm" nó như một phần tử.
    entities.push({
      id: CLEAR_ID,
      slotIndex: this.clearSlotIndex,
      role: "neutral",
      state: "idle",
      x: slot.x,
      y: slot.y,
      w: slot.w,
      h: slot.h,
      hitShape: "circle",
      glyph: resolveAssetLabels(CLEAR_ASSET).glyph,
      spokenLabel: CLEAR_SPOKEN_LABEL,
    });
  }

  override getView(): EngineView {
    const entities: ViewEntity[] = [];
    const count = this.content.track_length;
    const palCount = this.content.palette.length;

    this.appendTrackEntities(entities, count);
    this.appendPaletteEntities(entities, palCount);
    this.appendClearEntity(entities);

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
    this.renderClearSlot(ctx, rs);
    // Dây xâu hạt nối các ô dải cùng hàng, dưới các hạt (`BR-E036-14`).
    drawBeadString(
      ctx,
      beadStringSegments(this.slots.slice(0, this.content.track_length))
    );
    // Họa Mi ở góc trống, nhún theo từng bước sáng của mô-típ sau khi chốt (`BR-E036-14`).
    drawStoryCharacterInStage(
      ctx,
      "nightingale",
      this.stageRect,
      this.slots,
      nightingaleSway(
        this.litElapsedMs,
        GT036_LIGHT_STEP_MS,
        this.submitted ? this.litOrder().length : 0,
        rs.reducedMotion
      )
    );
    this.renderTrackSlots(ctx, rs);
    this.renderPaletteDock(ctx, rs);

    if (
      this.particles.length > 0 &&
      this.degradation?.particles_enabled !== false
    ) {
      rs.drawParticles(ctx, this.particles);
    }
  }

  private renderClearSlot(
    ctx: CanvasRenderingContext2D,
    rs: RenderSystem
  ): void {
    const slot = this.clearSlot;
    if (slot && this.isClearVisible) {
      drawSlotItem(ctx, rs, slot, {
        id: CLEAR_ID,
        asset: CLEAR_ASSET,
        state: "idle",
      });
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
          state: this.isTrackCellLit(i, rs.reducedMotion) ? "touching" : "idle",
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
    const palCount = this.content.palette.length;

    for (let i = 0; i < palCount; i++) {
      const slot = this.slots[this.paletteBase + i];
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

  /**
   * Ô sáng sau khi chốt: các ô đã đặt (chưa có luật) hoặc các ô của mô-típ vừa
   * đọc ra, sáng **lần lượt** từ trái sang phải (`BR-E036-11`). `instant` là
   * `prefers-reduced-motion`: sáng cùng lúc.
   */
  private isTrackCellLit(index: number, instant = false): boolean {
    if (!(this.submitted && this.placedItems[index])) {
      return false;
    }
    if (
      this.detectedRule?.detected &&
      index >= this.detectedRule.motif.length
    ) {
      return false;
    }
    if (instant) {
      return true;
    }
    const order = this.litOrder();
    const litCount = Math.floor(this.litElapsedMs / GT036_LIGHT_STEP_MS) + 1;
    return order.indexOf(index) < litCount;
  }

  /** Thứ tự sáng: chỉ số các ô sẽ sáng, từ trái sang phải. */
  private litOrder(): number[] {
    const limit = this.detectedRule?.detected
      ? this.detectedRule.motif.length
      : this.placedItems.length;
    const order: number[] = [];
    for (let i = 0; i < limit; i++) {
      if (this.placedItems[i]) {
        order.push(i);
      }
    }
    return order;
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
