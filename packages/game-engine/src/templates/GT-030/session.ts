import {
  formatNumberWord,
  formatSpokenLabel,
} from "@mindkid/shared/preschool-terminology";
import type { AgeBand } from "#src/contracts/types";
import {
  ACTION_CORRECT,
  ACTION_IGNORED,
  ACTION_RETRY,
  type ActionResult,
  type GameAction,
  TemplateGameSession,
} from "#src/game-session";
import type {
  EngineView,
  EntityVisual,
  Gesture,
  ViewEntity,
} from "#src/interaction";
import { resolveAssetLabels } from "#src/labels/spoken-keyword.js";
import { resolveTouchFloor } from "#src/layout/constants";
import {
  findHitSlotIndex,
  isPointInSlot,
  TAP_TOLERANCE_PX,
} from "#src/layout/hit-test.js";
import { resolveLayout } from "#src/layout/registry";
import { insetDrawSize } from "#src/layout/slot-fit";
import { pickTrayZones } from "#src/layout/tray-layout";
import type { Slot } from "#src/layout/types";
import {
  drawMeasurementGuideBar,
  drawNumberRodAcrossSlots,
  drawSceneBackground,
  drawSlotItem,
  drawSubPromptText,
  drawUnitGapHatch,
  drawWoodenTokenDock,
  type ItemVisualState,
  spawnParticlesAtSlot,
  updateParticles,
} from "#src/render/index.js";
import type { MascotPose } from "#src/render/mascot";
import type { DegradationState } from "#src/systems/degradation";
import { MoodPulse } from "#src/systems/mood-pulse";
import type { Particle, RenderSystem } from "#src/systems/render-system";
import { WrongFlash } from "#src/systems/wrong-flash";
import type { GT030Content, GT030Difficulty } from "./template.js";
import { computeMeasureStageSlots } from "./zone-layout.js";

interface GT030ActionPayload {
  readonly option_id?: string;
  readonly id?: string;
  readonly value?: number;
  /** Độ lệch ngang có dấu (px) giữa chỗ thả và mép cần nối; thiếu = đặt đúng mép. */
  readonly offset_px?: number;
}

/** Khe hoặc chồng lấn của lần thả vừa rồi — trẻ phải thấy nó (`BR-E030-06`). */
export interface GapFlash {
  readonly kind: "gap" | "overlap";
  /** Chỉ số slot đơn vị đang cần nối. */
  readonly slotIndex: number;
  /** Độ rộng khe/chồng (px), đã kẹp trong một cạnh đơn vị. */
  readonly widthPx: number;
}

/** Dung sai bám dính tối thiểu (px) để ngón tay run nhẹ vẫn bám (`BR-E030-05`). */
const MIN_SNAP_PX = 8;
/** Thời gian khe/chồng còn hiện (ms). */
const GAP_FLASH_MS = 1500;

/** Khung chuyện đọc một lần ở vòng đầu (`BR-E030-07`, `BR-FBK-16`). */
export const GT030_STORY_LINE =
  "Sâu Nhỏ muốn biết mọi thứ dài bao nhiêu. Bé xếp các đơn vị nối liền nhau để đo giúp Sâu Nhỏ nhé!";

/** Mascot vui sau mỗi đơn vị nối khít. */
export const GT030_HAPPY_MS = 700;
/** Mascot nghiêng đầu sau khe/chồng hoặc số đo chưa đúng. */
export const GT030_WONDER_MS = 1500;

export class GT030Session extends TemplateGameSession<
  GT030Content,
  GT030Difficulty
> {
  override readonly needsTray = true;

  /** Số vật nguồn trong khay của vòng — shell đo chiều cao khay (`BR-PSZ-13`). */
  override get trayItemCount(): number {
    return 1;
  }

  /** Nhãn dụng cụ vẽ dưới vật trong khay (`BR-PSZ-13`). */
  override get trayHasLabels(): boolean {
    return true;
  }
  override readonly usesPromptZone = true;

  degradation: DegradationState | null = null;
  placedUnitsCount = 0;
  selectedOptionId: string | null = null;
  isWin = false;

  private lastFrameMs = 0;
  private readonly wrongOptionFlash = new WrongFlash();
  private readonly wrongPlaceFlash = new WrongFlash();
  private gapFlash: (GapFlash & { readonly untilMs: number }) | null = null;
  private particles: Particle[] = [];
  private readonly mood = new MoodPulse();

  override storyLine(): string {
    return GT030_STORY_LINE;
  }

  /** Chỉ phản ứng sau khi đặt hoặc chọn số đo, không báo trước (`BR-E030-07`). */
  override mascotMood(): MascotPose | null {
    return this.isWon ? null : this.mood.current();
  }

  update(deltaMs: number): void {
    this.lastFrameMs += deltaMs;
    this.mood.tick(deltaMs);
    this.expireWrongFlashes(this.lastFrameMs);
    this.expireGapFlash();
  }

  /** Hết nhịp sai thì ô đáp án về trung tính (cùng đồng hồ khung với lúc kích). */
  private expireWrongFlashes(nowMs: number): void {
    if (this.wrongOptionFlash.hasExpired(nowMs)) {
      this.wrongOptionFlash.clear();
      this.selectedOptionId = null;
    }
    if (this.wrongPlaceFlash.hasExpired(nowMs)) {
      this.wrongPlaceFlash.clear();
    }
  }

  private expireGapFlash(): void {
    if (this.gapFlash && this.lastFrameMs >= this.gapFlash.untilMs) {
      this.gapFlash = null;
    }
  }

  /** Khe/chồng đang hiện, hoặc `null`. */
  getGapFlash(): GapFlash | null {
    return this.gapFlash;
  }

  /** Dung sai bám dính (px) quanh mép cần nối: `gap_tolerance_pct` của cạnh đơn vị. */
  private snapTolerancePx(): number {
    const slot = this.slots[1 + this.placedUnitsCount];
    const unitW = slot?.w ?? 0;
    return Math.max(
      MIN_SNAP_PX,
      (unitW * this.difficulty.gap_tolerance_pct) / 100
    );
  }

  setupEntities(): void {
    this.placedUnitsCount = 0;
    this.selectedOptionId = null;
    this.isWin = false;
    this.mood.clear();
    this.gapFlash = null;
    this.particles = [];
    this.recordEvent("game_started", {
      template_code: "GT-030",
      target_length: this.content.object.length_in_units,
      unit_id: this.content.unit.unit_id,
    });
  }

  override getHintTargetIndex(): number | null {
    if (this.isWin || this.isWon) {
      return null;
    }
    const targetLength = this.content.object.length_in_units;
    if (this.placedUnitsCount < targetLength) {
      return 1 + targetLength;
    }
    const correctOptIdx = this.content.answer_options.findIndex(
      (opt) => opt.is_correct
    );
    if (correctOptIdx >= 0) {
      return 2 + targetLength + correctOptIdx;
    }
    return null;
  }

  protected computeSlots(band: AgeBand): readonly Slot[] {
    const zones = pickTrayZones(this.stageRect, this.trayRect);
    if (zones) {
      return insetDrawSize(
        computeMeasureStageSlots({
          unitCount: this.content.object.length_in_units,
          optionCount: this.content.answer_options.length,
          stage: zones.stage,
          tray: zones.tray,
          touchFloor: resolveTouchFloor(band, this.cssPerLogic),
        }),
        zones.stage
      );
    }
    const layoutFn = resolveLayout("measure-strip");
    return layoutFn({
      slotCount: this.content.answer_options.length,
      ageBand: band,
      targetCount: this.content.object.length_in_units,
      logic: this.logicSpace,
    });
  }

  private validatePlaceAction(data: GT030ActionPayload): ActionResult {
    if (this.placedUnitsCount >= this.content.object.length_in_units) {
      return ACTION_RETRY;
    }
    if (
      data.offset_px !== undefined &&
      Math.abs(data.offset_px) > this.snapTolerancePx()
    ) {
      return ACTION_RETRY;
    }
    return ACTION_CORRECT;
  }

  private validateRemoveAction(): ActionResult {
    if (this.placedUnitsCount <= 0) {
      return ACTION_IGNORED;
    }
    return ACTION_CORRECT;
  }

  private validateOptionAction(data: GT030ActionPayload): ActionResult {
    if (this.placedUnitsCount < this.content.object.length_in_units) {
      return ACTION_RETRY;
    }

    const optionId =
      data.option_id ??
      data.id ??
      (data.value === undefined ? "" : `opt_${data.value}`);

    const option = this.content.answer_options.find(
      (o) =>
        o.option_id === optionId ||
        (data.value !== undefined && o.value === data.value)
    );

    if (!option) {
      return ACTION_IGNORED;
    }

    return option.is_correct ? ACTION_CORRECT : ACTION_RETRY;
  }

  validateAction(action: GameAction): ActionResult {
    if (this.isWin || this.isWon) {
      return ACTION_IGNORED;
    }

    const type = action.type;
    const data = (
      typeof action.data === "object" && action.data !== null ? action.data : {}
    ) as GT030ActionPayload;

    if (
      type === "place_unit" ||
      type === "tap_unit" ||
      type === "drag_unit" ||
      type === "snap_unit"
    ) {
      return this.validatePlaceAction(data);
    }

    if (type === "remove_unit" || type === "undo_unit") {
      return this.validateRemoveAction();
    }

    if (type === "select_option" || type === "choose_answer") {
      return this.validateOptionAction(data);
    }

    return ACTION_IGNORED;
  }

  private commitOptionSelection(data: GT030ActionPayload): void {
    const targetLength = this.content.object.length_in_units;
    if (this.placedUnitsCount < targetLength) {
      return;
    }

    const optionId =
      data.option_id ??
      data.id ??
      (data.value === undefined ? "" : `opt_${data.value}`);

    const option = this.content.answer_options.find(
      (o) =>
        o.option_id === optionId ||
        (data.value !== undefined && o.value === data.value)
    );

    if (!option) {
      return;
    }

    this.selectedOptionId = option.option_id;
    this.recordEvent("answer_selected", {
      option_id: option.option_id,
      value: option.value,
      is_correct: option.is_correct,
    });

    if (option.is_correct) {
      this.isWin = true;
      this.isWon = true;
      const optIndex = this.content.answer_options.indexOf(option);
      const slotIndex = 2 + targetLength + optIndex;
      const slot = this.slots[slotIndex];
      if (slot) {
        this.particles.push(...spawnParticlesAtSlot(slot, 12));
      }
      this.recordEvent("game_completed", { score: 100 });
      this.winSession();
    } else {
      this.wrongOptionFlash.trigger(this.lastFrameMs);
      this.mood.set("wonder", GT030_WONDER_MS);
    }
  }

  /** Một lần thả: bám dính khi đủ gần mép, không thì để lại khe/chồng nhìn thấy. */
  private commitPlace(offset: number | undefined): void {
    const targetLength = this.content.object.length_in_units;
    if (this.placedUnitsCount >= targetLength) {
      this.wrongPlaceFlash.trigger(this.lastFrameMs);
      return;
    }
    if (offset !== undefined && Math.abs(offset) > this.snapTolerancePx()) {
      const slot = this.slots[1 + this.placedUnitsCount];
      this.gapFlash = {
        kind: offset > 0 ? "gap" : "overlap",
        slotIndex: 1 + this.placedUnitsCount,
        widthPx: Math.min(Math.abs(offset), slot?.w ?? Math.abs(offset)),
        untilMs: this.lastFrameMs + GAP_FLASH_MS,
      };
      this.mood.set("wonder", GT030_WONDER_MS);
      return;
    }
    this.gapFlash = null;
    this.placedUnitsCount++;
    this.queueSfx("clip_link");
    this.mood.set("happy", GT030_HAPPY_MS);
    this.recordEvent("unit_placed", {
      slot_index: this.placedUnitsCount,
      placed_count: this.placedUnitsCount,
      target_count: targetLength,
    });
  }

  override commit(action: GameAction): void {
    const type = action.type;
    const data = (
      typeof action.data === "object" && action.data !== null ? action.data : {}
    ) as GT030ActionPayload;

    if (
      type === "place_unit" ||
      type === "tap_unit" ||
      type === "drag_unit" ||
      type === "snap_unit"
    ) {
      this.commitPlace(data.offset_px);
      return;
    }

    if (type === "remove_unit" || type === "undo_unit") {
      if (this.placedUnitsCount > 0) {
        const removedIndex = this.placedUnitsCount;
        this.placedUnitsCount--;
        this.selectedOptionId = null;
        this.recordEvent("unit_removed", {
          slot_index: removedIndex,
          placed_count: this.placedUnitsCount,
        });
      }
      return;
    }

    if (type === "select_option" || type === "choose_answer") {
      this.commitOptionSelection(data);
    }
  }

  /**
   * Mọi đích chạm của lượt này, kèm hành động nó gửi. Chọn theo tâm gần nhất:
   * ở khung thấp các vùng chạm kề nhau chồng lên nhau (`BR-ENG-06`).
   */
  private tapTargets(): { slot: Slot; action: GameAction }[] {
    const targetLength = this.content.object.length_in_units;
    const targets: { slot: Slot; action: GameAction }[] = [];
    const place: GameAction = { type: "place_unit", data: {} };
    const source = this.slots[1 + targetLength];
    if (source) {
      targets.push({ slot: source, action: place });
    }
    const next = this.slots[1 + this.placedUnitsCount];
    if (this.placedUnitsCount < targetLength && next) {
      targets.push({ slot: next, action: place });
    }
    for (let i = 1; i <= this.placedUnitsCount; i++) {
      const slot = this.slots[i];
      if (slot) {
        targets.push({ slot, action: { type: "remove_unit", data: {} } });
      }
    }
    if (this.placedUnitsCount >= targetLength) {
      this.content.answer_options.forEach((opt, i) => {
        const slot = this.slots[2 + targetLength + i];
        if (slot) {
          targets.push({
            slot,
            action: {
              type: "select_option",
              data: { option_id: opt.option_id, value: opt.value },
            },
          });
        }
      });
    }
    return targets;
  }

  private toTapAction(
    gesture: Extract<Gesture, { type: "tap" }>
  ): GameAction | null {
    const targets = this.tapTargets();
    const index = findHitSlotIndex(
      targets.map((t) => t.slot),
      gesture.x,
      gesture.y,
      "square",
      TAP_TOLERANCE_PX
    );
    return targets[index]?.action ?? null;
  }

  /** Kéo từ khay đơn vị lên sân khấu (`BR-ENG-06`): một lần thả là một đơn vị. */
  private toDropAction(
    gesture: Extract<Gesture, { type: "drop" }>
  ): GameAction | null {
    const source = this.slots[1 + this.content.object.length_in_units];
    if (!source) {
      return null;
    }
    const isFromSource = isPointInSlot(
      source,
      gesture.fromX,
      gesture.fromY,
      "square",
      TAP_TOLERANCE_PX
    );
    if (!isFromSource) {
      return null;
    }
    const next = this.slots[1 + this.placedUnitsCount];
    if (!next) {
      return { type: "place_unit", data: {} };
    }
    // Thả ngoài dải đo (khay, đáp án) không phải một lần đặt.
    if (Math.abs(gesture.toY - next.y) > next.h) {
      return null;
    }
    return {
      type: "place_unit",
      data: { offset_px: Math.round(gesture.toX - next.x) },
    };
  }

  override toAction(gesture: Gesture): GameAction | null {
    if (gesture.type === "drop") {
      return this.toDropAction(gesture);
    }
    return gesture.type === "tap" ? this.toTapAction(gesture) : null;
  }

  private getOptionEntities(): ViewEntity[] {
    const targetLength = this.content.object.length_in_units;
    if (this.placedUnitsCount < targetLength) {
      return [];
    }
    const entities: ViewEntity[] = [];
    for (let i = 0; i < this.content.answer_options.length; i++) {
      const opt = this.content.answer_options[i];
      const slotIndex = 2 + targetLength + i;
      const slot = this.slots[slotIndex];
      if (!(opt && slot)) {
        continue;
      }
      const isSelected = this.selectedOptionId === opt.option_id;
      let state: EntityVisual = "idle";
      if (isSelected) {
        state = opt.is_correct ? "correct" : "incorrect";
      }
      entities.push({
        id: opt.option_id,
        slotIndex,
        role: "target",
        state,
        x: slot.x,
        y: slot.y,
        w: slot.w,
        h: slot.h,
        hitShape: "square",
        label: String(opt.value),
        spokenLabel: formatNumberWord(opt.value),
      });
    }
    return entities;
  }

  private buildObjectEntity(): ViewEntity | null {
    const objSlot = this.slots[0];
    if (!objSlot) {
      return null;
    }
    const objLabels = resolveAssetLabels(this.content.object.asset);
    const objectEntityId =
      this.content.object.object_id === this.content.unit.unit_id
        ? `object:${this.content.object.object_id}`
        : this.content.object.object_id;
    return {
      id: objectEntityId,
      slotIndex: 0,
      role: "neutral",
      state: "idle",
      x: objSlot.x,
      y: objSlot.y,
      w: objSlot.w,
      h: objSlot.h,
      hitShape: "square",
      glyph: objLabels.glyph,
      label: objLabels.label ?? "Vật cần đo",
      spokenLabel: objLabels.spokenLabel ?? "vật cần đo",
      spokenAudioPath: objLabels.spokenAudioPath,
    };
  }

  private buildSourceUnitEntity(targetLength: number): ViewEntity | null {
    const sourceSlot = this.slots[1 + targetLength];
    if (!sourceSlot) {
      return null;
    }
    const unitLabels = resolveAssetLabels(this.content.unit.asset);
    return {
      id: this.content.unit.unit_id,
      slotIndex: 1 + targetLength,
      role: "source",
      state: "idle",
      x: sourceSlot.x,
      y: sourceSlot.y,
      w: sourceSlot.w,
      h: sourceSlot.h,
      hitShape: "square",
      glyph: unitLabels.glyph,
      label: unitLabels.label ?? "Chạm để xếp",
      spokenLabel: unitLabels.spokenLabel ?? "đơn vị đo",
      spokenAudioPath: unitLabels.spokenAudioPath,
    };
  }

  override getView(): EngineView {
    const targetLength = this.content.object.length_in_units;
    const entities: ViewEntity[] = [];

    const objEntity = this.buildObjectEntity();
    if (objEntity) {
      entities.push(objEntity);
    }

    const unitLabels = resolveAssetLabels(this.content.unit.asset);
    for (let i = 0; i < targetLength; i++) {
      const slot = this.slots[1 + i];
      if (!slot) {
        continue;
      }
      const isPlaced = i < this.placedUnitsCount;
      // Ô chưa đặt không vẽ sẵn: chỉ mép kế tiếp để thả vào (`BR-E030-05`).
      if (i > this.placedUnitsCount) {
        continue;
      }
      const numWord = formatNumberWord(i + 1);
      entities.push({
        id: `unit_slot_${i + 1}`,
        slotIndex: 1 + i,
        role: "target",
        state: isPlaced ? "active" : "idle",
        x: slot.x,
        y: slot.y,
        w: slot.w,
        h: slot.h,
        hitShape: "square",
        glyph: isPlaced ? unitLabels.glyph : undefined,
        label: isPlaced ? `${i + 1}` : "?",
        spokenLabel: isPlaced
          ? numWord
          : formatSpokenLabel(`ô đo số ${numWord}`),
      });
    }

    const sourceEntity = this.buildSourceUnitEntity(targetLength);
    if (sourceEntity) {
      entities.push(sourceEntity);
    }

    entities.push(...this.getOptionEntities());

    return {
      activePrompt: this.content.prompt,
      entities,
    };
  }

  override checkWinCondition(): boolean {
    return this.isWin || this.isWon;
  }

  getPlacedUnitsCount(): number {
    return this.placedUnitsCount;
  }

  private renderObject(ctx: CanvasRenderingContext2D, rs: RenderSystem): void {
    const objectSlot = this.slots[0];
    if (!objectSlot) {
      return;
    }

    drawMeasurementGuideBar(ctx, objectSlot);

    drawSlotItem(
      ctx,
      rs,
      objectSlot,
      {
        id: this.content.object.object_id,
        asset: this.content.object.asset,
        label: "Vật cần đo",
        state: "idle",
      },
      "square"
    );
  }

  /** Đơn vị đã đặt nối nhau; ô chưa đặt không vẽ để không lộ đáp số (`BR-E030-05`). */
  private renderStripUnits(
    ctx: CanvasRenderingContext2D,
    rs: RenderSystem
  ): void {
    const targetLength = this.content.object.length_in_units;

    if (this.content.representation === "number-rod") {
      const firstSlot = this.slots[1];
      const lastPlacedSlot = this.slots[this.placedUnitsCount];
      if (this.placedUnitsCount > 0 && firstSlot && lastPlacedSlot) {
        drawNumberRodAcrossSlots(
          ctx,
          firstSlot,
          lastPlacedSlot,
          this.placedUnitsCount,
          targetLength
        );
      }
      return;
    }

    for (let i = 0; i < this.placedUnitsCount; i++) {
      const slot = this.slots[1 + i];
      if (!slot) {
        continue;
      }
      drawSlotItem(
        ctx,
        rs,
        slot,
        {
          id: `placed_unit_${i + 1}`,
          asset: this.content.unit.asset,
          label: `${i + 1}`,
          state: "selected",
        },
        "square"
      );
    }
  }

  /** Vạch chéo ở khe hoặc chỗ chồng của lần thả vừa rồi (`BR-E030-06`). */
  private renderGapFlash(ctx: CanvasRenderingContext2D): void {
    const flash = this.gapFlash;
    const slot = flash ? this.slots[flash.slotIndex] : undefined;
    if (!(flash && slot)) {
      return;
    }
    const edgeX = slot.x - slot.w / 2;
    const left = flash.kind === "gap" ? edgeX : edgeX - flash.widthPx;
    drawUnitGapHatch(ctx, {
      x: left,
      y: slot.y - slot.h / 2,
      w: flash.widthPx,
      h: slot.h,
    });
  }

  private renderTray(ctx: CanvasRenderingContext2D, rs: RenderSystem): void {
    const targetLength = this.content.object.length_in_units;
    drawWoodenTokenDock(
      ctx,
      rs,
      pickTrayZones(this.stageRect, this.trayRect)?.tray
    );

    // Source unit in tray
    const sourceSlot = this.slots[1 + targetLength];
    if (sourceSlot) {
      drawSlotItem(
        ctx,
        rs,
        sourceSlot,
        {
          id: this.content.unit.unit_id,
          asset: this.content.unit.asset,
          label: "Chạm để xếp",
          state: "idle",
        },
        "circle"
      );

      if (this.wrongPlaceFlash.isActive(this.lastFrameMs)) {
        const progress = this.wrongPlaceFlash.progress(this.lastFrameMs);
        rs.drawRetryRing(
          ctx,
          sourceSlot.x,
          sourceSlot.y,
          Math.max(sourceSlot.w, sourceSlot.h) / 2 + 4,
          progress
        );
      }
    }
  }

  private renderAnswerOptions(
    ctx: CanvasRenderingContext2D,
    rs: RenderSystem
  ): void {
    const targetLength = this.content.object.length_in_units;
    if (this.placedUnitsCount < targetLength) {
      return;
    }

    for (let j = 0; j < this.content.answer_options.length; j++) {
      const opt = this.content.answer_options[j];
      const slot = this.slots[2 + targetLength + j];
      if (!(opt && slot)) {
        continue;
      }

      const isSelected = this.selectedOptionId === opt.option_id;
      let optState: ItemVisualState = "idle";
      if (isSelected) {
        optState = opt.is_correct ? "correct" : "wrong";
      }

      drawSlotItem(
        ctx,
        rs,
        slot,
        {
          id: opt.option_id,
          text: String(opt.value),
          state: optState,
        },
        "square"
      );

      if (
        isSelected &&
        !opt.is_correct &&
        this.wrongOptionFlash.isActive(this.lastFrameMs)
      ) {
        const progress = this.wrongOptionFlash.progress(this.lastFrameMs);
        rs.drawRetryRing(
          ctx,
          slot.x,
          slot.y,
          Math.max(slot.w, slot.h) / 2 + 4,
          progress
        );
      }
    }
  }

  private drawLegacySubPrompt(
    ctx: CanvasRenderingContext2D,
    rs: RenderSystem
  ): void {
    const targetLength = this.content.object.length_in_units;
    const subPrompt =
      this.placedUnitsCount < targetLength
        ? `Đã đặt: ${this.placedUnitsCount}/${targetLength} đơn vị`
        : "Đã xếp kín dải đo! Vật dài bao nhiêu đơn vị?";
    drawSubPromptText(ctx, rs, subPrompt);
  }

  render(
    ctx: CanvasRenderingContext2D,
    rs: RenderSystem,
    timeMs: number
  ): void {
    this.lastFrameMs = timeMs;
    this.expireWrongFlashes(timeMs);
    this.expireGapFlash();
    drawSceneBackground(ctx, rs, this.themeId);
    const zones = pickTrayZones(this.stageRect, this.trayRect);
    if (!zones) {
      this.drawLegacySubPrompt(ctx, rs);
    }

    this.renderObject(ctx, rs);
    this.renderStripUnits(ctx, rs);
    this.renderGapFlash(ctx);
    this.renderTray(ctx, rs);
    this.renderAnswerOptions(ctx, rs);

    if (this.degradation?.particles_enabled !== false) {
      this.particles = updateParticles(this.particles);
      rs.drawParticles(ctx, this.particles);
    }
  }
}
