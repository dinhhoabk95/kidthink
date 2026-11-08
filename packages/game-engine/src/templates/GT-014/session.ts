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
import { resolveAssetLabels } from "#src/labels/spoken-keyword";
import { resolveTouchFloor } from "#src/layout/constants";
import {
  findHitSlotIndex,
  isPointInSlot,
  TAP_TOLERANCE_PX,
} from "#src/layout/hit-test";
import { resolveLayout } from "#src/layout/registry";
import { computeTraySourceSlots } from "#src/layout/tray-layout";
import type { Slot } from "#src/layout/types";
import {
  approachPanSink,
  drawBalanceScale,
  drawMontessoriControlOfErrorPill,
  drawReferenceScaleCard,
  drawSceneBackground,
  drawSlotItem,
  drawStoryCharacterInStage,
  drawWoodenTokenDock,
  insetBox,
  panSinkTarget,
  type SceneBox,
  sceneBox,
} from "#src/render/index.js";
import type { MascotPose } from "#src/render/mascot";
import {
  type BalanceState,
  canAchieveBalance,
  computeTiltAngle,
  getBalanceState,
  sumWeights,
  type WeightedItem,
} from "#src/systems/balance-system";
import type { DegradationState } from "#src/systems/degradation";
import {
  type ControlOfErrorDiagnostics,
  MontessoriExploreTracker,
} from "#src/systems/montessori-explore-system";
import { MoodPulse } from "#src/systems/mood-pulse";
import type { RenderSystem } from "#src/systems/render-system";
import { WRONG_FLASH_MS, WrongFlash } from "#src/systems/wrong-flash";
import type { GT014Content, GT014Difficulty } from "./template.js";
import {
  drawWeightedPanItems,
  maxItemWeight,
  type WeightedAssetItem,
  weightSizeFraction,
} from "./weight-size.js";
import {
  panTargetSlots,
  referenceScaleBoxesInStage,
  scaleBoxInStage,
} from "./zone-layout.js";

function validateSelectSide(
  data: GameAction["data"],
  goal: GT014Content["goal"],
  leftW: number,
  rightW: number
): ActionResult {
  if (data !== "left" && data !== "right") {
    return ACTION_RETRY;
  }
  let expected: "left" | "right";
  if (goal === "pick_lighter") {
    expected = leftW < rightW ? "left" : "right";
  } else {
    expected = leftW > rightW ? "left" : "right";
  }
  return data === expected ? ACTION_CORRECT : ACTION_RETRY;
}

function validatePlaceItem(data: GameAction["data"]): ActionResult {
  return extractPanItemData(data, "target_pan") ? ACTION_CORRECT : ACTION_RETRY;
}

function extractPanItemData(
  data: GameAction["data"],
  panKey: "target_pan" | "from_pan"
): { itemId: string; pan: "left" | "right" } | null {
  if (
    typeof data === "object" &&
    data !== null &&
    "item_id" in data &&
    panKey in data
  ) {
    const itemId = Reflect.get(data, "item_id");
    const pan = Reflect.get(data, panKey);
    if (typeof itemId === "string" && (pan === "left" || pan === "right")) {
      return { itemId, pan };
    }
  }
  return null;
}

function formatHeavierReasonVi(leftW: number, rightW: number): string {
  return leftW > rightW
    ? `Bên trái (${leftW}) nặng hơn bên phải (${rightW})`
    : `Bên phải (${rightW}) nặng hơn bên trái (${leftW})`;
}

function findTrayItemAt(
  x: number,
  y: number,
  trayItems: readonly WeightedItem[],
  sources: readonly Slot[]
): WeightedItem | null {
  const idx = findHitSlotIndex(sources, x, y, "circle", TAP_TOLERANCE_PX);
  return idx >= 0 ? (trayItems[idx] ?? null) : null;
}

function findTargetPanAt(
  x: number,
  y: number,
  leftPanSlot: Slot | undefined,
  rightPanSlot: Slot | undefined
): "left" | "right" | null {
  if (
    leftPanSlot &&
    isPointInSlot(leftPanSlot, x, y, "square", TAP_TOLERANCE_PX)
  ) {
    return "left";
  }
  if (
    rightPanSlot &&
    isPointInSlot(rightPanSlot, x, y, "square", TAP_TOLERANCE_PX)
  ) {
    return "right";
  }
  return null;
}

/** Khung chuyện đọc một lần ở vòng đầu (`BR-E014-05`, `BR-FBK-16`). */
export const GT014_STORY_LINE = {
  balance:
    "Hà Mã Nhỏ chơi bập bênh cùng bạn. Bé đặt thêm quả cân cho hai bên bằng nhau nhé!",
  pick_heavier:
    "Hà Mã Nhỏ chơi bập bênh cùng bạn. Bé xem bên nào nặng hơn nhé!",
  pick_lighter: "Hà Mã Nhỏ chơi bập bênh cùng bạn. Bé xem bên nào nhẹ hơn nhé!",
} as const satisfies Record<GT014Content["goal"], string>;

/** Mascot vui ngắn sau mỗi lần đặt hoặc nhấc vật (`BR-E014-05`). */
export const GT014_HAPPY_MS = 700;
/** Mascot nghiêng đầu sau lần chọn bên chưa đúng. */
export const GT014_WONDER_MS = 1500;

export class BalanceScaleSession extends TemplateGameSession<
  GT014Content,
  GT014Difficulty
> {
  override readonly needsTray: boolean;

  /** Số vật nguồn trong khay của vòng — shell đo chiều cao khay (`BR-PSZ-13`). */
  override get trayItemCount(): number {
    return this.content.goal === "balance" ? this.content.tray.length : 0;
  }

  /** Khối lượng nằm ở cỡ vật, không in nhãn dưới vật khay (`BR-E014-06`). */
  override get trayHasLabels(): boolean {
    return false;
  }
  override readonly usesPromptZone = true;

  degradation: DegradationState | null = null;

  private leftItems: WeightedItem[] = [];
  private rightItems: WeightedItem[] = [];
  private trayItems: WeightedItem[] = [];
  private assetById = new Map<string, GT014Content["tray"][number]["asset"]>();
  private selectedSide: "left" | "right" | null = null;
  private stagedItemId: string | null = null;
  private wrongSide: "left" | "right" | null = null;
  private readonly wrongFlash = new WrongFlash();
  private readonly mood = new MoodPulse();
  private lastFrameMs = 0;
  private readonly exploreTracker = new MontessoriExploreTracker({
    milestoneTarget: 2,
  });

  private smoothTiltDeg = 0;
  private smoothSink: { left: number; right: number } = { left: 0, right: 0 };
  /** Tổng khối lượng mọi vật của bài (hai đĩa đầu bài + khay) — mốc để độ lún không bão hoà sớm. */
  private get totalLevelWeight(): number {
    return (
      sumWeights(this.content.left_pan) +
      sumWeights(this.content.right_pan) +
      sumWeights(this.content.tray)
    );
  }

  /** Mức lún đích (0..1) của từng đĩa: chỉ theo vật **đang nằm trên đĩa đó**, không theo đích hay phía đúng. */
  getPanSinkTarget(): { left: number; right: number } {
    const total = this.totalLevelWeight;
    return {
      left: panSinkTarget(sumWeights(this.leftItems), total),
      right: panSinkTarget(sumWeights(this.rightItems), total),
    };
  }

  /** Mức lún đang vẽ (0..1) của hai đĩa (tiến dần tới đích theo đồng hồ khung). */
  getPanSink(): { left: number; right: number } {
    return { ...this.smoothSink };
  }

  /** Khối lượng lớn nhất của bài — mốc để vật cùng khối lượng luôn cùng cỡ (`BR-E014-03`). */
  private get maxWeight(): number {
    const refs = (this.content.reference_scales ?? []).flatMap((scale) => [
      scale.left_pan,
      scale.right_pan,
    ]);
    return maxItemWeight([
      this.content.left_pan,
      this.content.right_pan,
      this.content.tray,
      ...refs,
    ]);
  }

  constructor(
    content: GT014Content,
    difficulty: GT014Difficulty,
    layoutSeed = 0
  ) {
    super(content, difficulty, layoutSeed);
    this.needsTray = content.goal === "balance" && content.tray.length > 0;
  }

  override takePillNarration(): string | null {
    return this.exploreTracker.takePillNarration();
  }

  setupEntities(): void {
    this.leftItems = [...this.content.left_pan];
    this.rightItems = [...this.content.right_pan];
    this.trayItems =
      this.content.goal === "balance" ? [...this.content.tray] : [];
    this.assetById = this.buildAssetMap();
    this.selectedSide = null;
    this.stagedItemId = null;
    this.wrongSide = null;
    this.wrongFlash.clear();
    this.mood.clear();
    this.lastFrameMs = 0;
    this.isWon = false;
    this.exploreTracker.reset(false);
    this.smoothTiltDeg = this.getTiltAngle();
    this.smoothSink = this.getPanSinkTarget();

    this.recordEvent("game_started", {
      template_code: "GT-014",
      goal: this.content.goal,
      initial_tilt: this.getTiltAngle(),
    });
  }

  private buildAssetMap(): Map<string, GT014Content["tray"][number]["asset"]> {
    const refItems = (this.content.reference_scales ?? []).flatMap((s) => [
      ...s.left_pan,
      ...s.right_pan,
    ]);
    return new Map(
      [
        ...refItems,
        ...this.content.left_pan,
        ...this.content.right_pan,
        ...this.content.tray,
      ].map((item) => [item.item_id, item.asset])
    );
  }

  private resolveAssetById(): ReadonlyMap<
    string,
    GT014Content["tray"][number]["asset"]
  > {
    return this.assetById.size > 0 ? this.assetById : this.buildAssetMap();
  }

  override storyLine(): string {
    return GT014_STORY_LINE[this.content.goal];
  }

  /** Vui sau thao tác đặt/nhấc, nghiêng đầu sau lần chọn bên chưa đúng (`BR-E014-05`). */
  override mascotMood(): MascotPose | null {
    return this.isWon ? null : this.mood.current();
  }

  update(deltaMs: number): void {
    this.mood.tick(deltaMs);
    this.lastFrameMs += deltaMs;
    this.exploreTracker.tick(deltaMs);
    const targetTilt = this.getTiltAngle();
    const diff = targetTilt - this.smoothTiltDeg;
    const maxStep = (Math.max(0, deltaMs) / 250) * 50;
    this.smoothTiltDeg =
      Math.abs(diff) <= maxStep
        ? targetTilt
        : this.smoothTiltDeg + Math.sign(diff) * maxStep;
    const sinkTarget = this.getPanSinkTarget();
    this.smoothSink = {
      left: approachPanSink(this.smoothSink.left, sinkTarget.left, deltaMs),
      right: approachPanSink(this.smoothSink.right, sinkTarget.right, deltaMs),
    };
    if (this.wrongSide && this.wrongFlash.hasExpired(this.lastFrameMs)) {
      this.wrongSide = null;
    }
  }

  startExplorePhase(): void {
    this.exploreTracker.reset(true);
  }

  getExploreTracker(): MontessoriExploreTracker {
    return this.exploreTracker;
  }

  getControlOfError(): ControlOfErrorDiagnostics | null {
    return this.exploreTracker.getControlOfErrorDiagnostics();
  }

  isMicroSandboxActive(): boolean {
    return this.exploreTracker.isMicroSandboxActive();
  }

  getSmoothTiltAngle(): number {
    return this.smoothTiltDeg;
  }

  getLeftItems(): readonly WeightedItem[] {
    return this.leftItems;
  }

  getRightItems(): readonly WeightedItem[] {
    return this.rightItems;
  }

  getTrayItems(): readonly WeightedItem[] {
    return this.trayItems;
  }

  getLeftWeight(): number {
    return sumWeights(this.leftItems);
  }

  getRightWeight(): number {
    return sumWeights(this.rightItems);
  }

  getTiltAngle(): number {
    return computeTiltAngle(this.getLeftWeight(), this.getRightWeight());
  }

  getBalanceState(): BalanceState {
    return getBalanceState(this.getLeftWeight(), this.getRightWeight());
  }

  private recordPanExplore(): void {
    this.exploreTracker.recordExploreAction("pan_item_changed");
    this.recordEvent("explore_action", {
      kind: "pan_item_changed",
      count: this.exploreTracker.getExploreActionsCount(),
    });
  }

  placeItem(itemId: string, targetPan: "left" | "right"): boolean {
    const idx = this.trayItems.findIndex((t) => t.item_id === itemId);
    const item = idx >= 0 ? this.trayItems.splice(idx, 1)[0] : undefined;
    if (!item) {
      return false;
    }
    (targetPan === "left" ? this.leftItems : this.rightItems).push(item);
    // Tiếng kẽo kẹt như nhau dù cân nghiêng hay thăng bằng (`BR-E014-05`).
    this.queueSfx("scale_creak");
    this.mood.set("happy", GT014_HAPPY_MS);

    this.recordPanExplore();
    this.recordEvent("item_placed", { item_id: itemId, pan: targetPan });
    this.recordEvent("balance_changed", {
      tilt_angle: this.getTiltAngle(),
      state: this.getBalanceState(),
    });

    if (this.checkWinCondition()) {
      this.wrongSide = null;
      this.exploreTracker.recordCorrectAttempt();
      this.winSession();
    }
    // Đặt vật không bao giờ bị báo sai (BR-E014-04): cân chỉ nghiêng thêm, trẻ
    // tự nhấc vật ra. Engine không đánh dấu lỗi và không đẩy vật về khay hộ.
    return true;
  }

  returnItem(itemId: string, fromPan: "left" | "right"): boolean {
    return this.returnItemToTray(itemId, fromPan);
  }

  returnItemToTray(itemId: string, fromPan: "left" | "right"): boolean {
    const pan = fromPan === "left" ? this.leftItems : this.rightItems;
    const idx = pan.findIndex((t) => t.item_id === itemId);
    const item = idx >= 0 ? pan.splice(idx, 1)[0] : undefined;
    if (!item) {
      return false;
    }
    this.trayItems.push(item);
    this.queueSfx("scale_creak");
    this.mood.set("happy", GT014_HAPPY_MS);

    this.recordPanExplore();
    this.recordEvent("balance_changed", {
      tilt_angle: this.getTiltAngle(),
      state: this.getBalanceState(),
    });

    if (this.checkWinCondition()) {
      this.exploreTracker.recordCorrectAttempt();
      this.winSession();
    }
    return true;
  }

  selectSide(side: "left" | "right"): void {
    this.selectedSide = side;
    if (this.checkWinCondition()) {
      this.wrongSide = null;
      this.exploreTracker.recordCorrectAttempt();
      this.winSession();
    } else {
      this.wrongSide = side;
      this.wrongFlash.trigger(this.lastFrameMs);
      this.mood.set("wonder", GT014_WONDER_MS);
      const leftW = this.getLeftWeight();
      const rightW = this.getRightWeight();
      this.exploreTracker.recordWrongAttempt({
        reasonVi: formatHeavierReasonVi(leftW, rightW),
        targetId: side,
        actualValue: side === "left" ? leftW : rightW,
        expectedValue: side === "left" ? rightW : leftW,
      });
      this.recordEvent("control_of_error", {
        side,
        left_weight: leftW,
        right_weight: rightW,
        micro_sandbox: this.exploreTracker.isMicroSandboxActive(),
      });
    }
  }

  getSelectedSide(): "left" | "right" | null {
    return this.selectedSide;
  }

  getStagedItemId(): string | null {
    return this.stagedItemId;
  }

  validateAction(action: GameAction): ActionResult {
    if (action.type === "place_item") {
      return validatePlaceItem(action.data);
    }
    if (action.type === "return_item") {
      return ACTION_CORRECT;
    }
    if (action.type === "select_side") {
      return validateSelectSide(
        action.data,
        this.content.goal,
        this.getLeftWeight(),
        this.getRightWeight()
      );
    }
    return ACTION_IGNORED;
  }

  private toDropAction(
    gesture: Extract<Gesture, { type: "drop" }>,
    leftPanSlot: Slot | undefined,
    rightPanSlot: Slot | undefined,
    sources: readonly Slot[]
  ): GameAction | null {
    const dragged = findTrayItemAt(
      gesture.fromX,
      gesture.fromY,
      this.trayItems,
      sources
    );
    if (!dragged) {
      return null;
    }
    const targetPan = findTargetPanAt(
      gesture.toX,
      gesture.toY,
      leftPanSlot,
      rightPanSlot
    );
    if (!targetPan) {
      return null;
    }
    return {
      type: "place_item",
      data: { item_id: dragged.item_id, target_pan: targetPan },
    };
  }

  private findReturnItemInPan(pan: "left" | "right"): string | null {
    const initialList =
      pan === "left" ? this.content.left_pan : this.content.right_pan;
    const initialIds = new Set(initialList.map((i) => i.item_id));
    const items = pan === "left" ? this.leftItems : this.rightItems;
    for (let i = items.length - 1; i >= 0; i--) {
      const item = items[i];
      if (item && !initialIds.has(item.item_id)) {
        return item.item_id;
      }
    }
    return null;
  }

  private toTapAction(
    gesture: Extract<Gesture, { type: "tap" }>,
    leftPanSlot: Slot | undefined,
    rightPanSlot: Slot | undefined,
    sources: readonly Slot[]
  ): GameAction | null {
    const targetPan = findTargetPanAt(
      gesture.x,
      gesture.y,
      leftPanSlot,
      rightPanSlot
    );
    if (
      this.content.goal === "pick_heavier" ||
      this.content.goal === "pick_lighter"
    ) {
      return targetPan ? { type: "select_side", data: targetPan } : null;
    }

    if (this.stagedItemId && targetPan) {
      return {
        type: "place_item",
        data: { item_id: this.stagedItemId, target_pan: targetPan },
      };
    }

    if (targetPan) {
      const returnItemId = this.findReturnItemInPan(targetPan);
      if (returnItemId) {
        return { type: "return_item", data: { item_id: returnItemId } };
      }
    }

    const tappedItem = findTrayItemAt(
      gesture.x,
      gesture.y,
      this.trayItems,
      sources
    );
    if (tappedItem) {
      this.stagedItemId =
        this.stagedItemId === tappedItem.item_id ? null : tappedItem.item_id;
    }
    return null;
  }

  override toAction(gesture: Gesture): GameAction | null {
    const targets = this.targetSlots.slice().sort((a, b) => a.x - b.x);
    const sources = this.sourceSlots;
    const leftPanSlot = targets[0];
    const rightPanSlot = targets[1];

    if (gesture.type === "drop") {
      return this.toDropAction(gesture, leftPanSlot, rightPanSlot, sources);
    }
    if (gesture.type === "tap") {
      return this.toTapAction(gesture, leftPanSlot, rightPanSlot, sources);
    }
    return null;
  }

  /**
   * Gợi ý trỏ vào slot thật trong `this.slots`, không phải chỉ số trong khay:
   * ở stage, slot xếp `[đĩa trái, đĩa phải, ...khay]`.
   */
  override getHintTargetIndex(): number | null {
    if (this.content.goal === "balance") {
      const idx = this.findBalancingTrayIndex();
      const slot = idx >= 0 ? this.sourceSlots[idx] : undefined;
      return slot ? this.slots.indexOf(slot) : null;
    }
    const leftW = this.getLeftWeight();
    const rightW = this.getRightWeight();
    const heavier = leftW > rightW ? "left" : "right";
    const lighter = heavier === "left" ? "right" : "left";
    const side = this.content.goal === "pick_heavier" ? heavier : lighter;
    const pans = this.targetSlots.slice().sort((a, b) => a.x - b.x);
    const slot = side === "left" ? pans[0] : pans[1];
    return slot ? this.slots.indexOf(slot) : null;
  }

  /**
   * Mục `balance`: bước đúng là kéo vật khay tới đĩa còn đường tới cân bằng
   * (đĩa trái nếu cả hai đều được). Mục chọn nặng/nhẹ chỉ là chạm, không có đích.
   */
  override getHintDestinationIndex(): number | null {
    if (this.content.goal !== "balance") {
      return null;
    }
    const idx = this.findBalancingTrayIndex();
    const item = idx >= 0 ? this.trayItems[idx] : undefined;
    if (!item) {
      return null;
    }
    const rest = this.trayItems.filter((_, j) => j !== idx);
    const leftOk = canAchieveBalance(
      [...this.leftItems, item],
      this.rightItems,
      rest
    );
    const pans = this.targetSlots.slice().sort((a, b) => a.x - b.x);
    const slot = leftOk ? pans[0] : pans[1];
    return slot ? this.slots.indexOf(slot) : null;
  }

  /** Vật khay mà đặt xuống (bên nào cũng được) vẫn còn đường tới cân bằng. */
  private findBalancingTrayIndex(): number {
    return this.trayItems.findIndex((item, i) => {
      const rest = this.trayItems.filter((_, j) => j !== i);
      return (
        canAchieveBalance([...this.leftItems, item], this.rightItems, rest) ||
        canAchieveBalance(this.leftItems, [...this.rightItems, item], rest)
      );
    });
  }

  private commitReturnItem(data: GameAction["data"]): void {
    const ret = extractPanItemData(data, "from_pan");
    if (ret) {
      this.returnItemToTray(ret.itemId, ret.pan);
      return;
    }
    if (typeof data === "object" && data !== null && "item_id" in data) {
      const itemId = String(Reflect.get(data, "item_id"));
      if (this.leftItems.some((i) => i.item_id === itemId)) {
        this.returnItemToTray(itemId, "left");
      } else if (this.rightItems.some((i) => i.item_id === itemId)) {
        this.returnItemToTray(itemId, "right");
      }
    }
  }

  override commit(action: GameAction): void {
    if (action.type === "place_item") {
      const place = extractPanItemData(action.data, "target_pan");
      if (place) {
        this.placeItem(place.itemId, place.pan);
        this.stagedItemId = null;
      }
      return;
    }
    if (action.type === "select_side") {
      if (action.data === "left" || action.data === "right") {
        this.selectSide(action.data);
      }
      return;
    }
    if (action.type === "return_item") {
      this.commitReturnItem(action.data);
    }
  }

  override getView(): EngineView {
    const targets = this.targetSlots.slice().sort((a, b) => a.x - b.x);
    const sources = this.sourceSlots;
    const entities: ViewEntity[] = [];
    const assetById = this.resolveAssetById();

    const leftPanSlot = targets[0];
    const rightPanSlot = targets[1];
    for (const [id, side, slotIndex, slot, label] of [
      ["left_pan", "left", 0, leftPanSlot, "Đĩa cân bên trái"],
      ["right_pan", "right", 1, rightPanSlot, "Đĩa cân bên phải"],
    ] as const) {
      if (slot) {
        entities.push({
          id,
          slotIndex,
          role: "target",
          state: this.selectedSide === side ? "selected" : "idle",
          x: slot.x,
          y: slot.y,
          w: slot.w,
          h: slot.h,
          hitShape: "square",
          label,
          spokenLabel: label,
        });
      }
    }

    this.appendPanItemEntities(
      entities,
      this.leftItems,
      leftPanSlot,
      0,
      assetById
    );
    this.appendPanItemEntities(
      entities,
      this.rightItems,
      rightPanSlot,
      1,
      assetById
    );

    this.trayItems.forEach((item, i) => {
      const slot = sources[i];
      if (!slot) {
        return;
      }
      const asset = assetById.get(item.item_id);
      const labels = asset ? resolveAssetLabels(asset) : {};
      entities.push({
        id: item.item_id,
        slotIndex: 2 + i,
        role: "source",
        state: this.stagedItemId === item.item_id ? "selected" : "idle",
        x: slot.x,
        y: slot.y,
        w: slot.w,
        h: slot.h,
        ...labels,
        spokenLabel: labels.spokenLabel ?? "Quả cân",
      });
    });

    return {
      activePrompt: this.content.prompt,
      entities,
    };
  }

  override checkWinCondition(): boolean {
    const leftW = this.getLeftWeight();
    const rightW = this.getRightWeight();
    if (this.content.goal === "balance") {
      return leftW === rightW && leftW > 0;
    }
    if (!this.selectedSide) {
      return false;
    }
    const isHeavier = leftW > rightW ? "left" : "right";
    const isLighter = leftW < rightW ? "left" : "right";
    return (
      this.selectedSide ===
      (this.content.goal === "pick_heavier" ? isHeavier : isLighter)
    );
  }

  override destroy(): void {
    super.destroy();
    this.leftItems = [];
    this.rightItems = [];
    this.trayItems = [];
    this.selectedSide = null;
  }

  protected computeSlots(ageBand: AgeBand): readonly Slot[] {
    if (this.stageRect) {
      const touchFloor = resolveTouchFloor(ageBand, this.cssPerLogic);
      const refCount = this.content.reference_scales?.length ?? 0;
      const targets = panTargetSlots(
        scaleBoxInStage(this.stageRect, refCount),
        touchFloor
      );
      const sources = this.trayRect
        ? computeTraySourceSlots(
            this.trayItems.length,
            this.trayRect,
            touchFloor,
            2,
            true
          )
        : [];
      return [...targets, ...sources];
    }
    const layoutFn = resolveLayout("split-columns");
    return layoutFn({
      slotCount: this.trayItems.length,
      targetCount: 2,
      ageBand,
      logic: this.logicSpace,
    });
  }

  private renderReferenceScales(
    ctx: CanvasRenderingContext2D,
    rs: RenderSystem,
    baseStageBox: { x: number; y: number; w: number; h: number },
    weighted: (items: readonly WeightedItem[]) => WeightedAssetItem[]
  ): void {
    const refScales = this.content.reference_scales ?? [];
    if (refScales.length === 0) {
      return;
    }
    const refBoxes = referenceScaleBoxesInStage(baseStageBox, refScales.length);
    refScales.forEach((ref, idx) => {
      const refBox = refBoxes[idx];
      if (!refBox) {
        return;
      }
      drawReferenceScaleCard(ctx, refBox);
      const refPans = drawBalanceScale(
        ctx,
        refBox,
        ref.left_pan,
        ref.right_pan
      );
      const maxWeight = this.maxWeight;
      drawWeightedPanItems(
        ctx,
        rs,
        refPans.leftPan,
        weighted(ref.left_pan),
        maxWeight
      );
      drawWeightedPanItems(
        ctx,
        rs,
        refPans.rightPan,
        weighted(ref.right_pan),
        maxWeight
      );
    });
  }

  /**
   * Hà Mã Nhỏ ở góc trống rồi cân với đĩa lún theo vật đã đặt (`BR-E014-07`);
   * `reduced_motion` vẽ ngay mức lún đích.
   */
  private drawScaleWithSink(
    ctx: CanvasRenderingContext2D,
    rs: RenderSystem,
    scaleBox: SceneBox
  ): { leftPan: SceneBox; rightPan: SceneBox } {
    drawStoryCharacterInStage(ctx, "hippo", this.stageRect, this.slots);
    const sink = rs.reducedMotion ? this.getPanSinkTarget() : this.smoothSink;
    return drawBalanceScale(
      ctx,
      scaleBox,
      this.leftItems,
      this.rightItems,
      this.smoothTiltDeg,
      sink
    );
  }

  render(
    ctx: CanvasRenderingContext2D,
    rs: RenderSystem,
    timeMs: number
  ): void {
    this.lastFrameMs = timeMs;
    if (this.wrongSide && this.wrongFlash.hasExpired(timeMs)) {
      this.wrongSide = null;
    }
    drawSceneBackground(ctx, rs, this.themeId);
    const sources = this.sourceSlots;
    // `WeightedItem` chỉ mang id + khối lượng; asset nằm ở content.
    const assetById = this.resolveAssetById();
    const weighted = (items: readonly WeightedItem[]): WeightedAssetItem[] =>
      items.map((i) => ({
        item_id: i.item_id,
        weight: i.weight,
        asset: assetById.get(i.item_id),
      }));

    const refScales = this.content.reference_scales ?? [];
    const baseStageBox = this.stageRect ?? insetBox(sceneBox(rs), 0.12);
    this.renderReferenceScales(ctx, rs, baseStageBox, weighted);

    const scaleBox =
      this.stageRect || refScales.length > 0
        ? scaleBoxInStage(baseStageBox, refScales.length)
        : baseStageBox;
    if (this.trayRect && sources.length > 0) {
      drawWoodenTokenDock(ctx, rs, this.trayRect);
    }
    const { leftPan, rightPan } = this.drawScaleWithSink(ctx, rs, scaleBox);
    const maxWeight = this.maxWeight;
    drawWeightedPanItems(ctx, rs, leftPan, weighted(this.leftItems), maxWeight);
    drawWeightedPanItems(
      ctx,
      rs,
      rightPan,
      weighted(this.rightItems),
      maxWeight
    );

    if (this.wrongSide) {
      const elapsed = this.wrongFlash.elapsedMs(timeMs);
      if (elapsed < WRONG_FLASH_MS) {
        const pan = this.wrongSide === "left" ? leftPan : rightPan;
        rs.drawRetryRing(
          ctx,
          pan.x + pan.w / 2,
          pan.y + pan.h / 2,
          Math.max(pan.w, pan.h) / 2 + 6,
          elapsed / WRONG_FLASH_MS
        );
      }
    }

    this.trayItems.forEach((item, i) => {
      const slot = sources[i];
      if (!slot) {
        return;
      }
      // Cỡ vật là khối lượng; cùng ô chạm, thân vật co theo `√khối lượng` (`BR-E014-03`).
      const side = Math.round(
        Math.min(slot.w, slot.h) * weightSizeFraction(item.weight, maxWeight)
      );
      drawSlotItem(
        ctx,
        rs,
        { ...slot, w: side, h: side },
        {
          id: item.item_id,
          asset: assetById.get(item.item_id),
          state:
            this.stagedItemId === item.item_id
              ? "selected"
              : this.getRenderItemState(item.item_id),
        }
      );
    });

    const stage = this.stageRect ?? sceneBox(rs);
    drawMontessoriControlOfErrorPill(
      ctx,
      stage,
      this.exploreTracker,
      rs.viewport?.scale
    );
  }

  private appendPanItemEntities(
    entities: ViewEntity[],
    items: readonly WeightedItem[],
    slot: Slot | undefined,
    slotIndex: number,
    assetById: ReadonlyMap<string, GT014Content["tray"][number]["asset"]>
  ): void {
    if (!slot) {
      return;
    }
    for (const item of items) {
      const asset = assetById.get(item.item_id);
      const labels = asset ? resolveAssetLabels(asset) : {};
      entities.push({
        id: `pan-${slotIndex}:${item.item_id}`,
        slotIndex,
        role: "neutral",
        state: "correct",
        x: slot.x,
        y: slot.y,
        w: slot.w,
        h: slot.h,
        ...labels,
        spokenLabel: labels.spokenLabel ?? "Quả cân",
      });
    }
  }
}

export const GT014Session = BalanceScaleSession;
