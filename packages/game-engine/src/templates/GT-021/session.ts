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
import { resolveAssetLabels } from "#src/labels/spoken-keyword";
import { resolveTouchFloor } from "#src/layout/constants";
import { TAP_TOLERANCE_PX } from "#src/layout/hit-test";
import { resolveLayout } from "#src/layout/registry";
import { computeStageMirror, reindexSlots } from "#src/layout/stage-targets";
import {
  computeTraySourceSlots,
  findNearestHitSlot,
  pickTrayZones,
} from "#src/layout/tray-layout";
import type { Slot } from "#src/layout/types";
import { PlacementMechanic } from "#src/mechanics/placement-mechanic";
import {
  drawButterflyWingsBoard,
  drawCircleOutline,
  drawEmptyTargetSlot,
  drawMirrorAxis,
  drawMirroredSlotItem,
  drawMirrorFlash,
  drawSceneBackground,
  drawSlotItem,
  drawStoryCharacterInStage,
  drawWoodenTokenDock,
  mirrorFlashStrength,
  mirrorRevealAlpha,
  sceneBox,
} from "#src/render/index";
import type { MascotPose } from "#src/render/mascot";
import type { DegradationState } from "#src/systems/degradation";
import { designTokens } from "#src/systems/designTokens";
import { MirrorSystem } from "#src/systems/mirror-system";
import { MoodPulse } from "#src/systems/mood-pulse";
import type { RenderSystem } from "#src/systems/render-system";
import type { GT021Content, GT021Difficulty } from "./template.js";

/** Cạnh ô mẫu và ô đích lớn nhất trên sân khấu — cùng cỡ ô của `mirror-axis-split`. */
const MIRROR_CELL_MAX_PX = 96;

function findHitSourceOption(
  slots: readonly Slot[],
  options: readonly { item_id: string }[],
  x: number,
  y: number,
  tolerance = TAP_TOLERANCE_PX
): { option: { item_id: string }; index: number } | null {
  const sourceSlots = slots.filter((s) => s.role === "source");
  const index = findNearestHitSlot(
    sourceSlots.slice(0, options.length),
    x,
    y,
    tolerance
  );
  const option = options[index];
  return option ? { option, index } : null;
}

function findHitTargetSlot(
  slots: readonly Slot[],
  targets: readonly { slot_id: string }[],
  x: number,
  y: number,
  tolerance = TAP_TOLERANCE_PX
): { target: { slot_id: string }; index: number } | null {
  const targetSlots = slots.filter((s) => s.role === "target");
  const index = findNearestHitSlot(
    targetSlots.slice(0, targets.length),
    x,
    y,
    tolerance
  );
  const target = targets[index];
  return target ? { target, index } : null;
}

/** Khung chuyện đọc một lần ở vòng đầu (`BR-E021-06`, `BR-FBK-16`). */
export const GT021_STORY_LINE =
  "Cô Tiên có một chiếc gương thần. Bé làm cho bên kia gương giống hệt bên này nhé!";

/** Mascot vui sau mỗi ô đặt đúng. */
export const GT021_HAPPY_MS = 1000;
/** Mascot nghiêng đầu sau lần đặt chưa đúng. */
export const GT021_WONDER_MS = 1500;

export class GT021Session extends TemplateGameSession<
  GT021Content,
  GT021Difficulty
> {
  degradation: DegradationState | null = null;

  readonly mirrorSystem = new MirrorSystem();
  private readonly placementMechanic = new PlacementMechanic();
  neutralSlots: readonly Slot[] = [];
  private wrongPlacementTimerMs = 0;
  private wrongTargetSlotId: string | null = null;
  private wrongItemId: string | null = null;

  /** Mảnh chọn nằm trong khay, hai nửa đối xứng đứng trên sân khấu (`BR-PSZ-01`). */
  override readonly needsTray = true;

  /** Số vật nguồn trong khay của vòng — shell đo chiều cao khay (`BR-PSZ-13`). */
  override get trayItemCount(): number {
    return this.content.options.length;
  }
  override readonly usesPromptZone = true;
  private assetByRef: Map<string, GT021Content["options"][number]["asset"]> =
    new Map();

  protected override computeRoundDerived(): void {
    this.neutralSlots = this.slots.filter((s) => s.role === "neutral");
  }

  private readonly mood = new MoodPulse();
  private lastFrameMs = 0;
  /** Mốc đồng hồ khung lúc vật vào từng ô đích (ảnh phản chiếu hiện dần từ đây). */
  private readonly placedAtMs: Map<string, number> = new Map();
  /** Mốc đồng hồ khung của lần đặt đúng gần nhất (trục gương loé từ đây), `null` nếu chưa có. */
  private lastCorrectAtMs: number | null = null;

  override storyLine(): string {
    return GT021_STORY_LINE;
  }

  /** Chỉ phản ứng sau lần đặt, không báo trước (`BR-E021-06`). */
  override mascotMood(): MascotPose | null {
    return this.isWon ? null : this.mood.current();
  }

  setupEntities(): void {
    this.mood.clear();
    this.lastFrameMs = 0;
    this.placedAtMs.clear();
    this.lastCorrectAtMs = null;
    this.isWon = false;
    this.wrongPlacementTimerMs = 0;
    this.wrongTargetSlotId = null;
    this.wrongItemId = null;
    this.placementMechanic.reset();
    this.assetByRef = new Map(
      this.content.options.map((o) => [o.asset_ref, o.asset])
    );

    const symmetricPairs = this.content.target_slots.map((t, idx) => ({
      referenceSlotId:
        this.content.reference_pattern[idx]?.slot_id ?? `ref-${idx}`,
      targetSlotId: t.slot_id,
      expectedAssetRef: t.expected_asset_ref,
    }));

    this.mirrorSystem.init(symmetricPairs);

    this.recordEvent("round_started", {
      round_index: 0,
      axis: this.content.axis,
      target_count: this.content.target_slots.length,
      option_count: this.content.options.length,
    });
  }

  validateAction(action: GameAction): ActionResult {
    if (
      action.type === "place_item" ||
      action.type === "drop_item" ||
      action.type === "tap_tap_item"
    ) {
      const data = action.data as
        | { item_id?: string; target_id?: string }
        | undefined;
      const itemId = data?.item_id;
      const targetId = data?.target_id;

      if (!(itemId && targetId)) {
        return ACTION_IGNORED;
      }

      const opt = this.content.options.find((o) => o.item_id === itemId);
      const target = this.content.target_slots.find(
        (t) => t.slot_id === targetId
      );

      if (!(opt && target)) {
        return ACTION_IGNORED;
      }

      return opt.asset_ref === target.expected_asset_ref
        ? ACTION_CORRECT
        : ACTION_RETRY;
    }

    return ACTION_IGNORED;
  }

  onPlaceOption(itemId: string, targetSlotId: string): ActionResult {
    const opt = this.content.options.find((o) => o.item_id === itemId);
    const target = this.content.target_slots.find(
      (t) => t.slot_id === targetSlotId
    );

    if (!(opt && target)) {
      return ACTION_IGNORED;
    }

    this.placementMechanic.place(itemId, targetSlotId);
    const isCorrect = this.mirrorSystem.place(targetSlotId, opt.asset_ref);
    this.placedAtMs.set(targetSlotId, this.lastFrameMs);

    this.recordEvent("item_placed", {
      item_id: itemId,
      target_slot_id: targetSlotId,
      asset_ref: opt.asset_ref,
      is_correct: isCorrect,
    });

    if (isCorrect) {
      this.lastCorrectAtMs = this.lastFrameMs;
      this.queueSfx("mirror_chime");
      this.mood.set("happy", GT021_HAPPY_MS);
    } else {
      this.mood.set("wonder", GT021_WONDER_MS);
    }

    if (this.checkWinCondition()) {
      this.wrongPlacementTimerMs = 0;
      this.wrongTargetSlotId = null;
      this.wrongItemId = null;
      this.recordEvent("round_completed", { round_index: 0 });
      this.winSession();
      return ACTION_CORRECT;
    }

    if (isCorrect) {
      this.wrongPlacementTimerMs = 0;
      this.wrongTargetSlotId = null;
      this.wrongItemId = null;
      return ACTION_CORRECT;
    }

    this.wrongPlacementTimerMs = 400;
    this.wrongTargetSlotId = targetSlotId;
    this.wrongItemId = itemId;
    return ACTION_RETRY;
  }

  override checkWinCondition(): boolean {
    return this.mirrorSystem.isComplete();
  }

  update(deltaMs: number): void {
    this.mood.tick(deltaMs);
    this.lastFrameMs += deltaMs;
    if (this.wrongPlacementTimerMs > 0) {
      this.wrongPlacementTimerMs = Math.max(
        0,
        this.wrongPlacementTimerMs - deltaMs
      );
      if (this.wrongPlacementTimerMs === 0) {
        if (this.wrongTargetSlotId) {
          this.mirrorSystem.remove(this.wrongTargetSlotId);
          this.wrongTargetSlotId = null;
        }
        if (this.wrongItemId) {
          this.placementMechanic.remove(this.wrongItemId);
          this.wrongItemId = null;
        }
      }
    }
  }

  override destroy(): void {
    super.destroy();
    this.wrongPlacementTimerMs = 0;
    this.wrongTargetSlotId = null;
    this.wrongItemId = null;
  }

  getStagedItemId(): string | null {
    return this.placementMechanic.getStagedItemId();
  }

  getPlacements(): ReadonlyMap<string, string> {
    return this.placementMechanic.getPlacements();
  }

  private toDropAction(
    gesture: Extract<Gesture, { type: "drop" }>
  ): GameAction | null {
    const hitSource = findHitSourceOption(
      this.slots,
      this.content.options,
      gesture.fromX,
      gesture.fromY
    );
    if (!hitSource) {
      return null;
    }
    const hitTarget = findHitTargetSlot(
      this.slots,
      this.content.target_slots,
      gesture.toX,
      gesture.toY
    );
    if (!hitTarget) {
      return null;
    }
    return {
      type: "drop_item",
      data: {
        item_id: hitSource.option.item_id,
        target_id: hitTarget.target.slot_id,
      },
    };
  }

  private toTapAction(
    gesture: Extract<Gesture, { type: "tap" }>
  ): GameAction | null {
    // Ô đích tràn sân khấu thì chồng lên khay: chọn theo tâm gần nhất trong cả hai.
    const targets = this.targetSlots.slice(0, this.content.target_slots.length);
    const sources = this.sourceSlots.slice(0, this.content.options.length);
    const hit = findNearestHitSlot(
      [...targets, ...sources],
      gesture.x,
      gesture.y,
      TAP_TOLERANCE_PX
    );
    const target = this.content.target_slots[hit];
    if (hit >= 0 && hit < targets.length && target) {
      const stagedId = this.placementMechanic.getStagedItemId();
      return stagedId
        ? {
            type: "tap_tap_item",
            data: { item_id: stagedId, target_id: target.slot_id },
          }
        : null;
    }

    const option = this.content.options[hit - targets.length];
    if (hit >= targets.length && option) {
      const stagedId = this.placementMechanic.getStagedItemId();
      this.placementMechanic.stageItem(
        stagedId === option.item_id ? null : option.item_id
      );
      return null;
    }

    this.placementMechanic.stageItem(null);
    return null;
  }

  override toAction(gesture: Gesture): GameAction | null {
    if (gesture.type === "drop") {
      return this.toDropAction(gesture);
    }
    if (gesture.type === "tap") {
      return this.toTapAction(gesture);
    }
    return null;
  }

  override commit(action: GameAction): void {
    if (
      action.type === "place_item" ||
      action.type === "drop_item" ||
      action.type === "tap_tap_item"
    ) {
      const data = action.data as
        | { item_id?: string; target_id?: string }
        | undefined;
      const itemId = data?.item_id;
      const targetId = data?.target_id;
      if (itemId && targetId) {
        this.onPlaceOption(itemId, targetId);
        if (this.placementMechanic.getStagedItemId() === itemId) {
          this.placementMechanic.stageItem(null);
        }
      }
    }
  }

  private allocateEntityId(
    rawId: string,
    prefix: string,
    usedIds: Set<string>
  ): string {
    const id = usedIds.has(rawId) ? `${prefix}:${rawId}` : rawId;
    usedIds.add(id);
    return id;
  }

  /**
   * Ô đối xứng của mảnh đang nhấc (N4): ô đích còn trống mà mảnh đó thuộc về.
   * Rỗng khi chưa nhấc mảnh nào hoặc khi đã thắng.
   */
  private isSymmetricToStaged(
    target: GT021Content["target_slots"][number]
  ): boolean {
    const stagedId = this.placementMechanic.getStagedItemId();
    if (!stagedId || this.isWon) {
      return false;
    }
    const staged = this.content.options.find((o) => o.item_id === stagedId);
    return (
      staged !== undefined &&
      staged.asset_ref === target.expected_asset_ref &&
      this.mirrorSystem.getPlacement(target.slot_id) === undefined
    );
  }

  private toTargetViewEntity(
    slot: Slot,
    target: GT021Content["target_slots"][number],
    usedIds: Set<string>
  ): ViewEntity {
    const placedRef = this.mirrorSystem.getPlacement(target.slot_id);
    let state: EntityVisual = "idle";
    if (placedRef) {
      state = placedRef === target.expected_asset_ref ? "correct" : "incorrect";
    } else if (this.isSymmetricToStaged(target)) {
      state = "active";
    }
    const placedAsset = placedRef ? this.assetByRef.get(placedRef) : undefined;
    return {
      id: this.allocateEntityId(target.slot_id, "target", usedIds),
      slotIndex: slot.index,
      role: "target",
      state,
      x: slot.x,
      y: slot.y,
      w: slot.w,
      h: slot.h,
      hitShape: "square",
      ...(placedAsset ? resolveAssetLabels(placedAsset) : {}),
    };
  }

  override getView(): EngineView {
    const stagedId = this.placementMechanic.getStagedItemId();
    const entities: ViewEntity[] = [];
    const usedIds = new Set<string>();

    this.neutralSlots.forEach((slot, i) => {
      const ref = this.content.reference_pattern[i];
      if (ref) {
        entities.push({
          id: this.allocateEntityId(ref.slot_id, "ref", usedIds),
          slotIndex: slot.index,
          role: "neutral",
          state: "idle",
          x: slot.x,
          y: slot.y,
          w: slot.w,
          h: slot.h,
          hitShape: "square",
          ...resolveAssetLabels(ref.asset),
        });
      }
    });

    this.targetSlots.forEach((slot, i) => {
      const target = this.content.target_slots[i];
      if (target) {
        entities.push(this.toTargetViewEntity(slot, target, usedIds));
      }
    });

    this.sourceSlots.forEach((slot, i) => {
      const opt = this.content.options[i];
      if (opt) {
        entities.push({
          id: this.allocateEntityId(opt.item_id, "src", usedIds),
          slotIndex: slot.index,
          role: "source",
          state: stagedId === opt.item_id ? "selected" : "idle",
          x: slot.x,
          y: slot.y,
          w: slot.w,
          h: slot.h,
          ...resolveAssetLabels(opt.asset),
        });
      }
    });

    return {
      activePrompt: this.content.prompt,
      entities,
    };
  }

  override getHintTargetIndex(): number | null {
    if (this.isWon) {
      return null;
    }
    const unplacedTarget = this.content.target_slots.find(
      (t) => this.mirrorSystem.getPlacement(t.slot_id) !== t.expected_asset_ref
    );
    if (!unplacedTarget) {
      return null;
    }
    const stagedId = this.placementMechanic.getStagedItemId();
    if (stagedId) {
      const targetIdx = this.content.target_slots.findIndex(
        (t) => t.slot_id === unplacedTarget.slot_id
      );
      const targetSlot = this.targetSlots[targetIdx];
      return targetSlot ? targetSlot.index : null;
    }
    const optIdx = this.content.options.findIndex(
      (o) => o.asset_ref === unplacedTarget.expected_asset_ref
    );
    const sourceSlot = this.sourceSlots[optIdx];
    return sourceSlot ? sourceSlot.index : null;
  }

  /** Chưa chọn vật thì bước đúng là kéo vật đúng vào ô gương chưa khớp. */
  override getHintDestinationIndex(): number | null {
    if (this.isWon || this.placementMechanic.getStagedItemId()) {
      return null;
    }
    const targetIdx = this.content.target_slots.findIndex(
      (t) => this.mirrorSystem.getPlacement(t.slot_id) !== t.expected_asset_ref
    );
    const slot = this.targetSlots[targetIdx];
    return slot ? slot.index : null;
  }

  protected computeSlots(ageBand: AgeBand): readonly Slot[] {
    const zones = pickTrayZones(this.stageRect, this.trayRect);
    if (zones) {
      const touchFloor = resolveTouchFloor(ageBand, this.cssPerLogic);
      const mirror = computeStageMirror({
        count: Math.max(
          this.content.reference_pattern.length,
          this.content.target_slots.length
        ),
        axis: this.content.axis,
        stage: zones.stage,
        touchFloor,
        maxCell: { w: MIRROR_CELL_MAX_PX, h: MIRROR_CELL_MAX_PX },
      });
      const options = computeTraySourceSlots(
        this.content.options.length,
        zones.tray,
        touchFloor
      );
      return reindexSlots([
        ...mirror.reference.slice(0, this.content.reference_pattern.length),
        ...mirror.targets.slice(0, this.content.target_slots.length),
        ...options,
      ]);
    }
    const layoutFn = resolveLayout("mirror-axis-split");
    return layoutFn({
      slotCount: this.content.options.length,
      targetCount: this.content.target_slots.length,
      ageBand,
      logic: this.logicSpace,
    });
  }

  render(
    ctx: CanvasRenderingContext2D,
    rs: RenderSystem,
    timeMs: number
  ): void {
    this.lastFrameMs = timeMs;
    drawSceneBackground(ctx, rs, this.themeId);
    // Cô Tiên ở góc trống, ngoài vùng chạm (`BR-E021-08`).
    drawStoryCharacterInStage(ctx, "fairy", this.stageRect, this.slots);
    const zones = pickTrayZones(this.stageRect, this.trayRect);
    // Có khung: bàn đối xứng ở sân khấu, mảnh chọn trên khay, lời dẫn do shell vẽ.
    drawButterflyWingsBoard(ctx, zones?.stage ?? sceneBox(rs));
    if (this.difficulty.show_axis_guide) {
      drawMirrorAxis(ctx, rs, this.content.axis, zones?.stage);
      // Trục gương loé sáng sau lần đặt đúng (`BR-E021-08`).
      if (this.lastCorrectAtMs !== null) {
        drawMirrorFlash(
          ctx,
          this.content.axis,
          zones?.stage ?? sceneBox(rs),
          mirrorFlashStrength(timeMs - this.lastCorrectAtMs, rs.reducedMotion)
        );
      }
    }
    drawWoodenTokenDock(ctx, rs, zones?.tray);

    const targets = this.targetSlots;
    const sources = this.sourceSlots;
    const neutral = this.neutralSlots;
    const assetByRef = this.assetByRef;

    // Mẫu tham chiếu nằm ở vùng neutral bên kia trục.
    this.content.reference_pattern.forEach((ref, i) => {
      const slot = neutral[i];
      if (!slot) {
        return;
      }
      drawSlotItem(
        ctx,
        rs,
        slot,
        { id: ref.slot_id, asset: ref.asset, state: "locked" },
        "square"
      );
    });

    this.content.target_slots.forEach((target, i) => {
      const slot = targets[i];
      if (!slot) {
        return;
      }
      const placedRef = this.mirrorSystem.getPlacement(target.slot_id);
      if (!placedRef) {
        drawEmptyTargetSlot(ctx, slot);
        if (this.isSymmetricToStaged(target)) {
          // Ánh sáng nhẹ, tĩnh: không cần chuyển động nên giữ nguyên khi giảm chuyển động.
          drawCircleOutline(
            ctx,
            slot,
            designTokens.colors.montessori.amber,
            4,
            2
          );
        }
        return;
      }
      const isWrong = placedRef !== target.expected_asset_ref;
      // Nửa phản chiếu: vật đặt vào ô đích hiện lật gương qua trục (`BR-E021-05`),
      // hiện dần sau khi đặt (`BR-E021-08`).
      ctx.save();
      ctx.globalAlpha = mirrorRevealAlpha(
        timeMs - (this.placedAtMs.get(target.slot_id) ?? 0),
        rs.reducedMotion
      );
      drawMirroredSlotItem(
        ctx,
        rs,
        slot,
        {
          id: target.slot_id,
          asset: assetByRef.get(placedRef),
          state: isWrong ? "wrong" : "correct",
        },
        this.content.axis
      );
      ctx.restore();
      if (isWrong && this.wrongPlacementTimerMs > 0) {
        rs.drawRetryRing(
          ctx,
          slot.x,
          slot.y,
          (slot.w ?? 64) / 2,
          1 - this.wrongPlacementTimerMs / 400
        );
      }
    });

    this.content.options.forEach((opt, i) => {
      const slot = sources[i];
      if (!slot) {
        return;
      }
      drawSlotItem(ctx, rs, slot, {
        id: opt.item_id,
        asset: opt.asset,
        state:
          this.placementMechanic.getStagedItemId() === opt.item_id
            ? "selected"
            : this.getRenderItemState(opt.item_id),
      });
    });
  }
}
