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
import { resolveAssetSpeech } from "#src/labels/spoken-keyword.js";
import { resolveTouchFloor } from "#src/layout/constants";
import { hasHitOverlap } from "#src/layout/hit-overlap";
import { TAP_TOLERANCE_PX } from "#src/layout/hit-test.js";
import { resolveLayout } from "#src/layout/registry";
import { computeStageCellSlots } from "#src/layout/stage-targets";
import {
  computeTraySourceSlots,
  findNearestHitSlot,
  pickTrayZones,
} from "#src/layout/tray-layout";
import type { Slot } from "#src/layout/types";
import { PlacementMechanic } from "#src/mechanics/placement-mechanic";
import {
  drawEmptyTargetSlot,
  drawGhostAssetInSlot,
  drawSceneBackground,
  drawSlotItem,
  drawStoryCharacterInStage,
  drawWoodenTokenDock,
  snapWobbleOffset,
} from "#src/render/index.js";
import type { MascotPose } from "#src/render/mascot";
import {
  type AssemblyPlacementResult,
  AssemblySystem,
} from "#src/systems/assembly-system";
import type { DegradationState } from "#src/systems/degradation";
import { MoodPulse } from "#src/systems/mood-pulse";
import type { RenderSystem } from "#src/systems/render-system";
import { WRONG_FLASH_MS, WrongFlash } from "#src/systems/wrong-flash";
import type { GT023Content, GT023Difficulty } from "./template.js";

interface HitSourcePart {
  readonly part: GT023Content["parts"][number];
  readonly slot: Slot;
}

/** Bán kính hút tối thiểu quanh mỏ neo, dù `snap_radius_px` nhỏ hơn. */
const MIN_SNAP_RADIUS_PX = 64;

/** Cạnh ô mỏ neo lớn nhất trên sân khấu. */
const ANCHOR_CELL_MAX_PX = 96;

/** Bước co ô mỏ neo khi trải mô hình. */
const SHAPE_CELL_STEP_PX = 8;
/** Đệm tối thiểu giữa ô mỏ neo ngoài cùng và mép sân khấu. */
const MODEL_EDGE_PAD_PX = 4;
/** Mô hình được kéo giãn một trục nhiều nhất bấy nhiêu lần so với trục kia. */
const MODEL_STRETCH_MAX = 2.5;

function findHitSourcePart(
  slots: readonly Slot[],
  parts: readonly GT023Content["parts"][number][],
  placements: ReadonlyMap<string, string>,
  x: number,
  y: number,
  tolerance = TAP_TOLERANCE_PX
): HitSourcePart | null {
  const sources = slots.filter((s) => s.role === "source");
  const placedPartIds = new Set(placements.values());
  const open = parts.flatMap((part, i) => {
    const slot = sources[i];
    return slot && !placedPartIds.has(part.part_id) ? [{ part, slot }] : [];
  });
  const hit = findNearestHitSlot(
    open.map((entry) => entry.slot),
    x,
    y,
    tolerance
  );
  return open[hit] ?? null;
}

/** Hệ số co hai trục của mô hình; `null` khi không có chỗ hoặc mô hình suy biến. */
function modelScales(
  spanX: number,
  spanY: number,
  room: { readonly w: number; readonly h: number }
): { scaleX: number; scaleY: number } | null {
  const fitX = spanX > 0 ? room.w / spanX : Number.POSITIVE_INFINITY;
  const fitY = spanY > 0 ? room.h / spanY : Number.POSITIVE_INFINITY;
  if (!(Number.isFinite(fitX) || Number.isFinite(fitY)) || room.w <= 0) {
    return null;
  }
  // Hai trục co độc lập nhưng lệch tối đa `MODEL_STRETCH_MAX` lần: sân khấu
  // thấp thì trải ngang hơn, vẫn giữ thứ tự trên-dưới và trái-phải của mô hình.
  const scaleY = Math.min(fitY, fitX * MODEL_STRETCH_MAX);
  const scaleX = Math.min(fitX, fitY * MODEL_STRETCH_MAX);
  return scaleX > 0 && scaleY > 0 ? { scaleX, scaleY } : null;
}

/** Khung chuyện đọc một lần ở vòng đầu (`BR-E023-07`, `BR-FBK-16`). */
export const GT023_STORY_LINE =
  "Chim Gõ Kiến đang lắp một mô hình bằng gỗ. Bé giúp Chim Gõ Kiến ghép từng mảnh vào đúng chỗ nhé!";

/** Mascot vui sau mỗi mảnh khớp. */
export const GT023_HAPPY_MS = 1000;
/** Mascot nghiêng đầu sau mảnh chưa khớp neo. */
export const GT023_WONDER_MS = 1500;

export class GT023Session extends TemplateGameSession<
  GT023Content,
  GT023Difficulty
> {
  degradation: DegradationState | null = null;

  readonly assemblySystem = new AssemblySystem();
  private readonly placementMechanic = new PlacementMechanic();
  private partById: Map<string, GT023Content["parts"][number]> = new Map();
  private wrongPartId: string | null = null;
  private readonly wrongFlash = new WrongFlash();
  private lastFrameMs = 0;
  /** Mốc đồng hồ khung lúc mảnh khớp từng neo (mảnh rung từ đây, `BR-E023-10`). */
  private readonly snappedAtMs: Map<string, number> = new Map();

  /** Mảnh nằm trong khay, mỏ neo đứng trên sân khấu (`BR-PSZ-01`). */
  override readonly needsTray = true;

  /** Số vật nguồn trong khay của vòng — shell đo chiều cao khay (`BR-PSZ-13`). */
  override get trayItemCount(): number {
    return this.content.parts.length;
  }

  /** Tên mảnh chỉ đọc thành tiếng, không vẽ chữ dưới mảnh (`BR-E023-06`). */
  override get trayHasLabels(): boolean {
    return false;
  }
  override readonly usesPromptZone = true;

  private readonly mood = new MoodPulse();

  override storyLine(): string {
    return GT023_STORY_LINE;
  }

  /** Chỉ phản ứng sau khi thả mảnh, không báo trước (`BR-E023-07`). */
  override mascotMood(): MascotPose | null {
    return this.isWon ? null : this.mood.current();
  }

  update(deltaMs: number): void {
    this.mood.tick(deltaMs);
    this.lastFrameMs += deltaMs;
  }

  setupEntities(): void {
    this.mood.clear();
    this.isWon = false;
    this.wrongPartId = null;
    this.wrongFlash.clear();
    this.lastFrameMs = 0;
    this.snappedAtMs.clear();
    this.placementMechanic.reset();
    this.partById = new Map(this.content.parts.map((p) => [p.part_id, p]));

    const anchors = this.content.anchors.map((a) => ({
      anchorId: a.anchor_id,
      x: a.x,
      y: a.y,
      acceptedPartId: a.accepted_part_id,
      label: a.label,
    }));

    const parts = this.content.parts.map((p) => ({
      partId: p.part_id,
      targetAnchorId: p.target_anchor_id,
      name: p.name,
      shapeKey: JSON.stringify(p.asset),
    }));

    this.assemblySystem.init(anchors, parts);

    this.recordEvent("round_started", {
      round_index: 0,
      anchor_count: anchors.length,
      part_count: parts.length,
    });
  }

  validateAction(action: GameAction): ActionResult {
    if (action.type === "stage_part") {
      return ACTION_IGNORED;
    }

    if (
      action.type === "place_item" ||
      action.type === "drop_item" ||
      action.type === "tap_tap_item"
    ) {
      const data = action.data as
        | { item_id?: string; target_id?: string }
        | undefined;
      const partId = data?.item_id;
      const anchorId = data?.target_id;

      if (!(partId && anchorId)) {
        return ACTION_IGNORED;
      }

      const anchor = this.assemblySystem.getAnchor(anchorId);
      const part = this.assemblySystem.getPart(partId);

      // Neo đã có mảnh đúng thì khoá vĩnh viễn (`BR-E023-03`): thả thêm là không có gì.
      if (
        !(anchor && part) ||
        this.assemblySystem.getPlacements().has(anchorId)
      ) {
        return ACTION_IGNORED;
      }

      return this.assemblySystem.acceptsPart(anchorId, partId)
        ? ACTION_CORRECT
        : ACTION_RETRY;
    }

    return ACTION_IGNORED;
  }

  onAssemblePart(partId: string, anchorId: string): AssemblyPlacementResult {
    if (this.assemblySystem.getPlacements().has(anchorId)) {
      return { valid: false, isAnchorMatch: false, isComplete: false };
    }
    const result = this.assemblySystem.assemblePart(partId, anchorId);

    if (result.valid) {
      if (result.isAnchorMatch) {
        this.snappedAtMs.set(anchorId, this.lastFrameMs);
        this.queueSfx("piece_click");
        this.mood.set("happy", GT023_HAPPY_MS);
      } else {
        this.mood.set("wonder", GT023_WONDER_MS);
      }
      this.wrongPartId = null;
      this.placementMechanic.place(partId, anchorId);

      this.recordEvent("item_placed", {
        part_id: partId,
        anchor_id: anchorId,
        is_anchor_match: result.isAnchorMatch,
      });

      if (this.checkWinCondition()) {
        this.recordEvent("round_completed", { round_index: 0 });
        this.winSession();
      }
    } else {
      this.wrongPartId = partId;
      this.wrongFlash.trigger(this.lastFrameMs);
      this.setRenderItemState(partId, "wrong");
    }

    return result;
  }

  onSnapPart(
    partId: string,
    x: number,
    y: number
  ): AssemblyPlacementResult | null {
    // Đã có slot thì chỉ hit-test theo ô neo vẽ ra (`BR-E023-09`): rơi về toạ độ
    // content lúc này là thả trúng một neo vô hình, có khi nằm ngay trên khay.
    // Toạ độ content chỉ dùng khi chưa dựng slot (phiên chưa `prepareRound`).
    if (this.targetSlots.length > 0) {
      const hitAnchor = this.findHitAnchor(x, y);
      return hitAnchor
        ? this.onAssemblePart(partId, hitAnchor.anchor_id)
        : null;
    }
    // Cùng bán kính hút với `findHitAnchor`: hai đường thả không được lệch nhau.
    const snapRadius = Math.max(
      this.difficulty.snap_radius_px,
      MIN_SNAP_RADIUS_PX
    );
    const anchorId = this.assemblySystem.findNearestAnchor(
      x,
      y,
      snapRadius
    )?.anchorId;
    if (!anchorId) {
      return null;
    }
    return this.onAssemblePart(partId, anchorId);
  }

  override checkWinCondition(): boolean {
    return this.assemblySystem.isAllAssembled();
  }

  getStagedItemId(): string | null {
    return this.placementMechanic.getStagedItemId();
  }

  getPlacements(): ReadonlyMap<string, string> {
    return this.assemblySystem.getPlacements();
  }

  /**
   * Slot của mỏ neo `index`: luôn là ô đích của layout, cùng hệ toạ độ với khay
   * mảnh — khung năm vùng xếp trên sân khấu, khung cũ ở vùng đích dưới
   * (`BR-E023-09`). Chưa tính slot thì chưa có neo để thả.
   */
  private anchorSlot(index: number): Slot | null {
    return this.targetSlots[index] ?? null;
  }

  /** Mỏ neo gần điểm thả nhất trong bán kính hút. */
  private findHitAnchor(
    x: number,
    y: number
  ): GT023Content["anchors"][number] | null {
    const maxDist =
      Math.max(this.difficulty.snap_radius_px, MIN_SNAP_RADIUS_PX) +
      TAP_TOLERANCE_PX;
    let best: GT023Content["anchors"][number] | null = null;
    let bestDist = Number.POSITIVE_INFINITY;
    this.content.anchors.forEach((anchor, i) => {
      const slot = this.anchorSlot(i);
      const dist = slot ? Math.hypot(slot.x - x, slot.y - y) : maxDist + 1;
      if (dist <= maxDist && dist < bestDist) {
        best = anchor;
        bestDist = dist;
      }
    });
    return best;
  }

  private toDropAction(
    gesture: Extract<Gesture, { type: "drop" }>
  ): GameAction | null {
    const hitSource = findHitSourcePart(
      this.slots,
      this.content.parts,
      this.assemblySystem.getPlacements(),
      gesture.fromX,
      gesture.fromY
    );
    if (!hitSource) {
      return null;
    }
    const hitAnchor = this.findHitAnchor(gesture.toX, gesture.toY);
    if (!hitAnchor) {
      return null;
    }
    return {
      type: "drop_item",
      data: {
        item_id: hitSource.part.part_id,
        target_id: hitAnchor.anchor_id,
      },
    };
  }

  private toTapAction(
    gesture: Extract<Gesture, { type: "tap" }>
  ): GameAction | null {
    const stagedId = this.placementMechanic.getStagedItemId();

    if (stagedId) {
      const hitAnchor = this.findHitAnchor(gesture.x, gesture.y);
      if (hitAnchor) {
        return {
          type: "tap_tap_item",
          data: {
            item_id: stagedId,
            target_id: hitAnchor.anchor_id,
          },
        };
      }
    }

    const hitSource = findHitSourcePart(
      this.slots,
      this.content.parts,
      this.assemblySystem.getPlacements(),
      gesture.x,
      gesture.y
    );
    if (hitSource) {
      const partId = hitSource.part.part_id;
      if (stagedId === partId) {
        this.placementMechanic.stageItem(null);
      } else {
        this.placementMechanic.stageItem(partId);
      }
      return null;
    }

    if (stagedId) {
      this.placementMechanic.stageItem(null);
      return null;
    }

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
    if (action.type === "stage_part") {
      const data = action.data as { part_id?: string | null } | undefined;
      const partId = data?.part_id ?? null;
      if (partId && this.placementMechanic.getStagedItemId() === partId) {
        this.placementMechanic.stageItem(null);
      } else {
        this.placementMechanic.stageItem(partId);
      }
      return;
    }

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
        this.onAssemblePart(itemId, targetId);
        if (this.placementMechanic.getStagedItemId() === itemId) {
          this.placementMechanic.stageItem(null);
        }
      }
    }
  }

  /** Thực thể mỏ neo: ô đích của layout; chưa có slot thì chưa có thực thể. */
  private toAnchorEntity(
    anchor: GT023Content["anchors"][number],
    index: number,
    isPlaced: boolean,
    usedIds: Set<string>
  ): ViewEntity | null {
    const state: EntityVisual = isPlaced ? "correct" : "idle";
    const id = usedIds.has(anchor.anchor_id)
      ? `anchor:${anchor.anchor_id}`
      : anchor.anchor_id;
    usedIds.add(id);
    const labelProps = anchor.label
      ? resolveAssetSpeech({ kind: "text", text: anchor.label })
      : {};
    const slot = this.targetSlots[index];
    if (!slot) {
      return null;
    }
    return {
      id,
      slotIndex: this.slots.indexOf(slot),
      role: "target",
      state,
      x: slot.x,
      y: slot.y,
      w: slot.w,
      h: slot.h,
      ...labelProps,
    };
  }

  override getView(): EngineView {
    const placements = this.assemblySystem.getPlacements();
    const sources = this.sourceSlots;
    const stagedId = this.placementMechanic.getStagedItemId();
    const placedPartIds = new Set(placements.values());
    const entities: ViewEntity[] = [];
    const usedIds = new Set<string>();

    this.content.anchors.forEach((anchor, i) => {
      const entity = this.toAnchorEntity(
        anchor,
        i,
        placements.has(anchor.anchor_id),
        usedIds
      );
      if (entity) {
        entities.push(entity);
      }
    });

    for (let i = 0; i < this.content.parts.length; i++) {
      const part = this.content.parts[i];
      const slot = sources[i];
      if (!(part && slot)) {
        continue;
      }
      const isPlaced = placedPartIds.has(part.part_id);
      let state: EntityVisual = "idle";
      if (isPlaced) {
        state = "correct";
      } else if (part.part_id === stagedId) {
        state = "selected";
      }
      const id = usedIds.has(part.part_id)
        ? `part:${part.part_id}`
        : part.part_id;
      usedIds.add(id);
      const assetLabels = resolveAssetSpeech(part.asset);
      const nameLabels = part.name
        ? resolveAssetSpeech({ kind: "text", text: part.name })
        : {};
      entities.push({
        id,
        slotIndex: slot.index,
        role: "source",
        state,
        x: slot.x,
        y: slot.y,
        w: slot.w,
        h: slot.h,
        ...assetLabels,
        ...nameLabels,
      });
    }

    return {
      activePrompt: this.content.prompt,
      entities,
    };
  }

  override getHintTargetIndex(): number | null {
    if (this.isWon) {
      return null;
    }
    const placements = this.assemblySystem.getPlacements();
    const stagedId = this.placementMechanic.getStagedItemId();
    if (stagedId) {
      const anchorIdx = this.content.anchors.findIndex(
        (a) =>
          !placements.has(a.anchor_id) &&
          this.assemblySystem.acceptsPart(a.anchor_id, stagedId)
      );
      const anchorSlot = this.targetSlots[anchorIdx];
      if (anchorSlot) {
        return this.slots.indexOf(anchorSlot);
      }
    }
    const placedPartIds = new Set(placements.values());
    const unplacedPartIdx = this.content.parts.findIndex(
      (p) => !placedPartIds.has(p.part_id)
    );
    if (unplacedPartIdx >= 0) {
      const slot = this.sourceSlots[unplacedPartIdx];
      return slot ? slot.index : null;
    }
    return null;
  }

  /** Chưa chọn mảnh thì bước đúng là kéo mảnh chưa đặt vào chốt nhận nó. */
  override getHintDestinationIndex(): number | null {
    if (this.isWon || this.placementMechanic.getStagedItemId()) {
      return null;
    }
    const placements = this.assemblySystem.getPlacements();
    const placedPartIds = new Set(placements.values());
    const part = this.content.parts.find((p) => !placedPartIds.has(p.part_id));
    if (!part) {
      return null;
    }
    const anchorIdx = this.content.anchors.findIndex(
      (a) =>
        !placements.has(a.anchor_id) &&
        this.assemblySystem.acceptsPart(a.anchor_id, part.part_id)
    );
    const slot = this.targetSlots[anchorIdx];
    return slot ? this.slots.indexOf(slot) : null;
  }

  /**
   * Mỏ neo đứng đúng hình mô hình: toạ độ `x`/`y` của content co về một khối
   * trong sân khấu, giữ tỉ lệ (mái trên thân, bánh hai bên thân xe). Kích cỡ ô
   * lấy từ lưới `grid`; co không đủ chỗ cho vùng chạm không chồng thì lùi về
   * lưới (`BR-E023-05`, `BR-LAY-05`).
   */
  private placeAnchorsAsModel(
    grid: readonly Slot[],
    stage: NonNullable<GT023Session["stageRect"]>,
    firstIndex: number,
    touchFloor: number
  ): readonly Slot[] {
    const anchors = this.content.anchors;
    const cell = grid[0];
    if (!cell) {
      return grid;
    }
    const xs = anchors.map((a) => a.x);
    const ys = anchors.map((a) => a.y);
    const spanX = Math.max(...xs) - Math.min(...xs);
    const spanY = Math.max(...ys) - Math.min(...ys);
    const midX = (Math.max(...xs) + Math.min(...xs)) / 2;
    const midY = (Math.max(...ys) + Math.min(...ys)) / 2;
    const centerX = stage.x + stage.w / 2;
    const centerY = stage.y + stage.h / 2;
    // Thử ô lớn trước, co dần tới sàn chạm: ô nhỏ hơn thì mô hình trải rộng hơn.
    for (let size = cell.hitW; size >= touchFloor; size -= SHAPE_CELL_STEP_PX) {
      const room = {
        w: stage.w - 2 * MODEL_EDGE_PAD_PX - size,
        h: stage.h - 2 * MODEL_EDGE_PAD_PX - size,
      };
      const scales = modelScales(spanX, spanY, room);
      if (!scales) {
        return grid;
      }
      const { scaleX, scaleY } = scales;
      const shaped = anchors.map((a, i) => ({
        ...cell,
        index: firstIndex + i,
        w: Math.min(cell.w, size),
        h: Math.min(cell.h, size),
        hitW: size,
        hitH: size,
        x: Math.round(centerX + (a.x - midX) * scaleX),
        y: Math.round(centerY + (a.y - midY) * scaleY),
      }));
      if (!hasHitOverlap(shaped)) {
        return shaped;
      }
    }
    return grid;
  }

  protected computeSlots(ageBand: AgeBand): readonly Slot[] {
    const zones = pickTrayZones(this.stageRect, this.trayRect);
    if (zones) {
      const touchFloor = resolveTouchFloor(ageBand, this.cssPerLogic);
      const parts = computeTraySourceSlots(
        this.content.parts.length,
        zones.tray,
        touchFloor,
        0,
        this.trayHasLabels
      );
      const anchors = computeStageCellSlots({
        count: this.content.anchors.length,
        stage: zones.stage,
        touchFloor,
        maxCell: { w: ANCHOR_CELL_MAX_PX, h: ANCHOR_CELL_MAX_PX },
        role: "target",
        hasLabels: false,
        firstIndex: parts.length,
      });
      return [
        ...parts,
        ...this.placeAnchorsAsModel(
          anchors,
          zones.stage,
          parts.length,
          touchFloor
        ),
      ];
    }
    const layoutFn = resolveLayout("top-source-bottom-target");
    return layoutFn({
      slotCount: this.content.parts.length,
      targetCount: this.content.anchors.length,
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
    if (this.wrongPartId && this.wrongFlash.hasExpired(timeMs)) {
      this.setRenderItemState(this.wrongPartId, "idle");
      this.wrongPartId = null;
    }
    drawSceneBackground(ctx, rs, this.themeId);
    // Chim Gõ Kiến ở góc trống, ngoài vùng chạm (`BR-E023-10`).
    drawStoryCharacterInStage(ctx, "woodpecker", this.stageRect, this.slots);
    const zones = pickTrayZones(this.stageRect, this.trayRect);
    if (zones) {
      // Lời dẫn do shell vẽ; mảnh nằm trên khay của khung năm vùng.
      drawWoodenTokenDock(ctx, rs, zones.tray);
    }
    const sources = this.sourceSlots;
    const placements = this.assemblySystem.getPlacements();
    const partById = this.partById;
    const placedPartIds = new Set(placements.values());

    // Mỏ neo có toạ độ riêng trong content — đó là hình dạng của mô hình đích.
    for (const [anchorIndex, anchor] of this.content.anchors.entries()) {
      const slot = this.anchorSlot(anchorIndex);
      if (!slot) {
        continue;
      }
      const partId = placements.get(anchor.anchor_id);
      const part = partId ? partById.get(partId) : undefined;
      if (!part) {
        // Khung viền mỏ neo chỉ vẽ khi `show_anchor_outline` bật (`GT-023.md` N1).
        if (this.difficulty.show_anchor_outline !== false) {
          drawEmptyTargetSlot(ctx, slot);
        }
        // Bóng mờ của mảnh ô này nhận thay cho nhãn "Khung n" (`BR-E023-06`).
        drawGhostAssetInSlot(
          ctx,
          partById.get(anchor.accepted_part_id)?.asset,
          slot
        );
        continue;
      }
      this.drawSnappedPart(ctx, rs, slot, part, anchor.anchor_id, timeMs);
    }

    this.content.parts.forEach((part, i) => {
      const slot = sources[i];
      if (!slot || placedPartIds.has(part.part_id)) {
        return;
      }
      const isWrong = part.part_id === this.wrongPartId;
      const elapsed = isWrong ? this.wrongFlash.elapsedMs(timeMs) : 0;
      const shakeX =
        isWrong && elapsed < WRONG_FLASH_MS && !rs.reducedMotion
          ? Math.sin(elapsed * 0.05) * 4
          : 0;
      const drawSlot = shakeX === 0 ? slot : { ...slot, x: slot.x + shakeX };

      drawSlotItem(ctx, rs, drawSlot, {
        id: part.part_id,
        asset: part.asset,
        state: this.resolveSourcePartState(part.part_id),
      });

      if (isWrong && elapsed < WRONG_FLASH_MS) {
        rs.drawRetryRing(
          ctx,
          slot.x + shakeX,
          slot.y,
          Math.min(slot.hitW, slot.hitH) / 2 + 4,
          elapsed / WRONG_FLASH_MS
        );
      }
    });
  }

  /** Mảnh đã khớp neo, rung nhẹ rồi đứng yên (`BR-E023-10`); chỉ dời chỗ vẽ, không đổi vùng chạm. */
  private drawSnappedPart(
    ctx: CanvasRenderingContext2D,
    rs: RenderSystem,
    slot: Slot,
    part: GT023Content["parts"][number],
    anchorId: string,
    timeMs: number
  ): void {
    const wobble = snapWobbleOffset(
      timeMs - (this.snappedAtMs.get(anchorId) ?? Number.NEGATIVE_INFINITY),
      rs.reducedMotion
    );
    drawSlotItem(
      ctx,
      rs,
      wobble === 0 ? slot : { ...slot, x: slot.x + wobble },
      { id: part.part_id, asset: part.asset, state: "correct" }
    );
  }

  private resolveSourcePartState(partId: string) {
    const rawState = this.getRenderItemState(partId);
    return this.placementMechanic.getStagedItemId() === partId &&
      rawState === "idle"
      ? "selected"
      : rawState;
  }
}
