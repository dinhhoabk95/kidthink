import type { AgeBand } from "#src/contracts/types";
import type { GameAction, GameActionValue } from "#src/game-session";
import type { EntityVisual, Gesture, ViewEntity } from "#src/interaction";
import { resolveAssetSpeech } from "#src/labels/spoken-keyword";
import { resolveTouchFloor } from "#src/layout/constants";
import { findHitSlotIndex, TAP_TOLERANCE_PX } from "#src/layout/hit-test";
import { resolveLayout } from "#src/layout/registry";
import { computeStageCellSlots } from "#src/layout/stage-targets";
import type { ZoneRect } from "#src/layout/stage-zones";
import { computeTraySourceSlots, pickTrayZones } from "#src/layout/tray-layout";
import type { Slot } from "#src/layout/types";
import {
  drawGT019FlashlightHolder,
  drawGT019FlipButton,
  drawGT019LightsPass,
  drawGT019TargetSlot,
  drawGT019TrayPiece,
} from "#src/render/gt-019-shapes";
import {
  beamFadeIn,
  drawSceneBackground,
  drawWoodenTokenDock,
} from "#src/render/index";
import type { GT019LitTarget, ItemVisualState } from "#src/render/types";
import { deriveStream } from "#src/rng/mulberry32";
import { shuffle } from "#src/rng/shuffle";
import type { HintDemoStep, HintLevel } from "#src/systems/hint-ladder";
import type { RenderSystem } from "#src/systems/render-system";
import {
  type FlipAxis,
  isPieceTransformMatch,
  type PieceTransform,
  type RotationAngle90,
} from "#src/systems/rotation-system";
import { WrongFlashMap } from "#src/systems/wrong-flash";
import type {
  GT019Content,
  GT019Difficulty,
} from "#src/templates/GT-019/template";

export type GT019Piece = GT019Content["pieces"][number];
export type GT019Target = GT019Content["target_slots"][number];
export type GT019HoverInput =
  | string
  | number
  | { readonly x: number; readonly y: number }
  | null;
type Ctx = CanvasRenderingContext2D;
type RS = RenderSystem;

export const GT019_WRONG_MS = 450;
export const GT019_ROTATE_ANIM_MS = 220;
export const GT019_FLIP_ANIM_MS = 220;
export const GT019_FLIP_PULSE_MS = 240;
export const GT019_BURST_MS = 520;
export const GT019_AUTO_RESOLVE_MS = 900;
const TARGET_CELL_MAX_PX = 96;
const FEW_TARGETS = 2;
const FEW_TARGET_CELL_MAX_PX = 160;
const ALL_ROTATIONS: readonly RotationAngle90[] = [0, 90, 180, 270];

export const toRotationAngle = (v: number | undefined): RotationAngle90 =>
  v === 90 || v === 180 || v === 270 ? v : 0;

export const toFlipAxis = (v: string | undefined): FlipAxis =>
  v === "horizontal" || v === "vertical" ? v : "none";

const flipSx = (f: FlipAxis): number => (f === "horizontal" ? -1 : 1);
const flipSy = (f: FlipAxis): number => (f === "vertical" ? -1 : 1);

interface RotateAnim {
  fromDeg: number;
  toDeg: number;
  elapsedMs: number;
}
interface FlipAnim {
  fromFlip: FlipAxis;
  toFlip: FlipAxis;
  elapsedMs: number;
}

export interface GT019ClockState {
  logicMs: number;
  readonly placedAt: Map<string, { logicMs: number; anchorMs: number | null }>;
  readonly rotateAnims: Map<string, RotateAnim>;
  readonly flipAnims: Map<string, FlipAnim>;
  readonly burstTimers: Map<string, number>;
  readonly pieceWrongFlashes: WrongFlashMap;
  readonly slotWrongFlashes: WrongFlashMap;
  flipBtnPulseMs: number;
  autoResolveMs: number;
}

export interface GT019BoardState {
  readonly owner: object;
  readonly content: GT019Content;
  readonly difficulty: GT019Difficulty;
  readonly displayPieces: readonly GT019Piece[];
  readonly slots: readonly Slot[];
  readonly targetSlots: readonly Slot[];
  readonly sourceSlots: readonly Slot[];
  readonly flipButtonSlot: Slot | undefined;
  readonly pieceTransforms: ReadonlyMap<string, PieceTransform>;
  readonly pieceIdBySlotId: ReadonlyMap<string, string>;
  readonly placedPieceIds: ReadonlySet<string>;
  readonly stagedId: string | null;
  readonly hoveredId: string | null;
  readonly activeHintLevel: 0 | HintLevel;
  readonly isWon: boolean;
  readonly roundClosedOnWrong: boolean;
  readonly particlesEnabled: boolean;
  readonly firstPiece: GT019Piece | null;
  readonly themeId: string;
  readonly stageRect: ZoneRect | undefined;
  readonly trayRect: ZoneRect | undefined;
  readonly getBaseItemState: (pieceId: string) => ItemVisualState;
}

type B = GT019BoardState;
type Clk = GT019ClockState;
const SESSION_CLOCKS = new WeakMap<object, Clk>();

const createClockState = (): Clk => ({
  logicMs: 0,
  placedAt: new Map(),
  rotateAnims: new Map(),
  flipAnims: new Map(),
  burstTimers: new Map(),
  pieceWrongFlashes: new WrongFlashMap(GT019_WRONG_MS),
  slotWrongFlashes: new WrongFlashMap(GT019_WRONG_MS),
  flipBtnPulseMs: 0,
  autoResolveMs: 0,
});

export function getGT019Clock(owner: object, reset = false): Clk {
  let clock = reset ? undefined : SESSION_CLOCKS.get(owner);
  if (!clock) {
    clock = createClockState();
    SESSION_CLOCKS.set(owner, clock);
  }
  return clock;
}

function advanceAnimMap<T extends { elapsedMs: number }>(
  m: Map<string, T>,
  d: number,
  dur: number
): void {
  for (const [id, a] of m.entries()) {
    a.elapsedMs += d;
    if (a.elapsedMs >= dur) {
      m.delete(id);
    }
  }
}

export function stepGT019Clock(o: object, ms: number, closed: boolean): void {
  const d = Number.isFinite(ms) && ms > 0 ? ms : 0;
  const c = getGT019Clock(o);
  c.logicMs += d;
  c.pieceWrongFlashes.drainExpired(c.logicMs);
  c.slotWrongFlashes.drainExpired(c.logicMs);
  c.flipBtnPulseMs = Math.max(0, c.flipBtnPulseMs - d);
  if (closed) {
    c.autoResolveMs = Math.min(GT019_AUTO_RESOLVE_MS, c.autoResolveMs + d);
  }
  advanceAnimMap(c.rotateAnims, d, GT019_ROTATE_ANIM_MS);
  advanceAnimMap(c.flipAnims, d, GT019_FLIP_ANIM_MS);
  for (const [slotId, rem] of c.burstTimers.entries()) {
    if (rem <= d) {
      c.burstTimers.delete(slotId);
    } else {
      c.burstTimers.set(slotId, rem - d);
    }
  }
}

export function recordGT019RotateAnim(
  o: object,
  id: string,
  fromDeg: number,
  dir: "cw" | "ccw"
): void {
  const c = getGT019Clock(o);
  const step = dir === "ccw" ? -90 : 90;
  const p = c.rotateAnims.get(id);
  const act = p && p.elapsedMs < GT019_ROTATE_ANIM_MS;
  const t = act ? Math.min(1, p.elapsedMs / GT019_ROTATE_ANIM_MS) : 0;
  const cur = act
    ? p.fromDeg + (p.toDeg - p.fromDeg) * (1 - (1 - t) ** 2)
    : fromDeg;
  const toDeg = (act ? p.toDeg : fromDeg) + step;
  c.rotateAnims.set(id, { fromDeg: cur, toDeg, elapsedMs: 0 });
}

export function recordGT019FlipAnim(
  o: object,
  id: string,
  fromFlip: FlipAxis,
  toFlip: FlipAxis
): void {
  const c = getGT019Clock(o);
  c.flipAnims.set(id, { fromFlip, toFlip, elapsedMs: 0 });
  c.flipBtnPulseMs = GT019_FLIP_PULSE_MS;
}

export function recordGT019Placed(o: object, targetSlotId: string): void {
  const c = getGT019Clock(o);
  c.placedAt.set(targetSlotId, { logicMs: c.logicMs, anchorMs: null });
  c.burstTimers.set(targetSlotId, GT019_BURST_MS);
}

export interface GT019VisualTransform {
  readonly visualRotDeg: number;
  readonly flipScaleX: number;
  readonly flipScaleY: number;
}

export function resolveGT019VisualTransform(
  o: object,
  id: string,
  cur: PieceTransform,
  rm: boolean
): GT019VisualTransform {
  const clock = getGT019Clock(o);
  const [tSx, tSy] = [flipSx(cur.flip), flipSy(cur.flip)];
  if (rm) {
    return { visualRotDeg: cur.rotation, flipScaleX: tSx, flipScaleY: tSy };
  }
  let visualRotDeg: number = cur.rotation;
  const rot = clock.rotateAnims.get(id);
  if (rot && rot.elapsedMs < GT019_ROTATE_ANIM_MS) {
    const t = Math.min(1, rot.elapsedMs / GT019_ROTATE_ANIM_MS);
    const e = 1 - (1 - t) * (1 - t);
    visualRotDeg =
      (((rot.fromDeg + (rot.toDeg - rot.fromDeg) * e) % 360) + 360) % 360;
  }
  let [flipScaleX, flipScaleY] = [tSx, tSy];
  const flip = clock.flipAnims.get(id);
  if (flip && flip.elapsedMs < GT019_FLIP_ANIM_MS) {
    const p = Math.min(1, flip.elapsedMs / GT019_FLIP_ANIM_MS);
    const c = (1 - Math.cos(Math.PI * p)) * 0.5;
    flipScaleX = flipSx(flip.fromFlip) + (tSx - flipSx(flip.fromFlip)) * c;
    flipScaleY = flipSy(flip.fromFlip) + (tSy - flipSy(flip.fromFlip)) * c;
  }
  return { visualRotDeg, flipScaleX, flipScaleY };
}

export function resolveGT019RoundSetup(
  c: GT019Content,
  seed: number,
  roundGen = 0
): { displayPieces: GT019Piece[]; transforms: Map<string, PieceTransform> } {
  const transforms = new Map<string, PieceTransform>();
  const roundSeed = seed === 0 ? 0 : seed + roundGen * 7919 || 1;
  const displayPieces =
    roundSeed !== 0 && c.pieces.length >= 2
      ? shuffle(c.pieces, deriveStream(roundSeed, "items"))
      : [...c.pieces];
  const rotRng = seed === 0 ? null : deriveStream(seed, "initial");
  for (const p of c.pieces) {
    const initFlip = toFlipAxis(p.initial_flip);
    const initRot = toRotationAngle(p.initial_rotation);
    if (!rotRng) {
      transforms.set(p.piece_id, { rotation: initRot, flip: initFlip });
      continue;
    }
    const target = c.target_slots.find((s) => s.slot_id === p.target_slot_id);
    const tRot = toRotationAngle(target?.target_rotation);
    const cands =
      initFlip === toFlipAxis(target?.target_flip)
        ? ALL_ROTATIONS.filter((r) => r !== tRot)
        : ALL_ROTATIONS;
    const pickIdx = (rotRng.nextInt(cands.length) + roundGen) % cands.length;
    transforms.set(p.piece_id, {
      rotation: cands[pickIdx] ?? initRot,
      flip: initFlip,
    });
  }
  return { displayPieces, transforms };
}

/** Trần cạnh ô đích: ít đích thì to hơn để bóng xoay đọc được trên sân khấu trống. */
function targetCellCap(
  targetCount: number,
  stage: { readonly w: number; readonly h: number }
): number {
  if (targetCount > FEW_TARGETS) {
    return TARGET_CELL_MAX_PX;
  }
  return Math.max(
    TARGET_CELL_MAX_PX,
    Math.min(
      FEW_TARGET_CELL_MAX_PX,
      Math.floor(Math.min(stage.w, stage.h) * 0.45)
    )
  );
}

export function computeGT019LayoutSlots(
  b: B,
  ageBand: AgeBand,
  cssPerLogic: number,
  logic: { readonly w: number; readonly h: number }
): readonly Slot[] {
  const targetCount = b.content.target_slots.length;
  const slotCount = b.content.pieces.length + (b.difficulty.allow_flip ? 1 : 0);
  const zones = pickTrayZones(b.stageRect, b.trayRect);
  if (zones) {
    const touchFloor = resolveTouchFloor(ageBand, cssPerLogic);
    const cap = targetCellCap(targetCount, zones.stage);
    const maxCell = { w: cap, h: cap };
    const targets = computeStageCellSlots({
      count: targetCount,
      stage: zones.stage,
      touchFloor,
      maxCell,
      role: "target",
      hasLabels: false,
    });
    const sources = computeTraySourceSlots(
      slotCount,
      zones.tray,
      touchFloor,
      targets.length,
      false
    );
    return [...targets, ...sources];
  }
  return resolveLayout("top-source-bottom-target")({
    slotCount,
    targetCount,
    ageBand,
    logic,
  });
}

const hitSlot = (
  slots: readonly Slot[],
  x: number,
  y: number,
  shape: "circle" | "square"
): number => findHitSlotIndex(slots, x, y, shape, TAP_TOLERANCE_PX);

const hitSrc = (b: B, x: number, y: number): number =>
  hitSlot(b.sourceSlots.slice(0, b.displayPieces.length), x, y, "circle");

const hitTgt = (b: B, x: number, y: number): number =>
  hitSlot(
    b.targetSlots.slice(0, b.content.target_slots.length),
    x,
    y,
    "square"
  );

const hitFlip = (b: B, x: number, y: number): boolean =>
  b.flipButtonSlot !== undefined &&
  hitSlot([b.flipButtonSlot], x, y, "circle") >= 0;

export function resolveGT019HoverId(
  b: B,
  accepting: boolean,
  arg: GT019HoverInput,
  y?: number
): string | null {
  if (arg === null || !accepting || typeof arg === "string") {
    return typeof arg === "string" && accepting ? arg : null;
  }
  const px = typeof arg === "number" ? arg : arg.x;
  const py = typeof arg === "number" ? (y ?? 0) : arg.y;
  if (hitFlip(b, px, py)) {
    return "btn_flip";
  }
  const p = b.displayPieces[hitSrc(b, px, py)];
  return p && !b.placedPieceIds.has(p.piece_id) ? p.piece_id : null;
}

export const readGT019ActionStr = (
  d: GameActionValue,
  k: string
): string | null => {
  const v = typeof d === "object" && d !== null ? Reflect.get(d, k) : null;
  return typeof v === "string" ? v : null;
};

function resolveSourceEntityState(b: B, id: string): EntityVisual {
  if (b.placedPieceIds.has(id)) {
    return "correct";
  }
  if (b.stagedId === id) {
    return "selected";
  }
  return b.hoveredId === id ? "active" : "idle";
}

function toEnt(
  s: Slot,
  id: string,
  slotIndex: number,
  role: ViewEntity["role"],
  state: EntityVisual,
  spokenLabel: string,
  labels?: Partial<ViewEntity>
): ViewEntity {
  const hitShape = role === "target" ? "square" : "circle";
  return { ...s, id, slotIndex, role, state, hitShape, ...labels, spokenLabel };
}

export function buildGT019ViewEntities(b: B): ViewEntity[] {
  const entities: ViewEntity[] = [];
  b.targetSlots.forEach((slot, i) => {
    const t = b.content.target_slots[i];
    if (!t) {
      return;
    }
    const placedId = b.pieceIdBySlotId.get(t.slot_id);
    const refP = b.content.pieces.find(
      (p) => p.piece_id === placedId || p.target_slot_id === t.slot_id
    );
    const labels = refP ? resolveAssetSpeech(refP.asset) : undefined;
    const spk = `Cái bóng của ${labels?.spokenLabel ?? `Mảnh ${i + 1}`}`;
    const st = placedId ? "correct" : "idle";
    entities.push(toEnt(slot, t.slot_id, i, "target", st, spk, labels));
  });
  b.sourceSlots.slice(0, b.displayPieces.length).forEach((slot, i) => {
    const p = b.displayPieces[i];
    if (!p) {
      return;
    }
    const labels = resolveAssetSpeech(p.asset);
    const spk = labels.spokenLabel ?? `Mảnh ${i + 1}`;
    const idx = b.targetSlots.length + i;
    const st = resolveSourceEntityState(b, p.piece_id);
    entities.push(toEnt(slot, p.piece_id, idx, "source", st, spk, labels));
  });
  if (b.flipButtonSlot) {
    const idx = b.targetSlots.length + b.displayPieces.length;
    const st = b.hoveredId === "btn_flip" ? "active" : "idle";
    entities.push(
      toEnt(b.flipButtonSlot, "btn_flip", idx, "neutral", st, "Nút lật hình")
    );
  }
  return entities;
}

const makePlaceAction = (
  type: "drop_item" | "tap_tap_item",
  piece_id: string,
  target_slot_id: string
): GameAction => ({
  type,
  data: {
    piece_id,
    target_slot_id,
    item_id: piece_id,
    target_id: target_slot_id,
  },
});

export function resolveGT019GestureAction(
  b: B,
  g: Gesture,
  stageItem: (pieceId: string | null) => void
): GameAction | null {
  if (g.type === "drop") {
    const src = b.displayPieces[hitSrc(b, g.fromX, g.fromY)];
    const dst = b.content.target_slots[hitTgt(b, g.toX, g.toY)];
    return src && !b.placedPieceIds.has(src.piece_id) && dst
      ? makePlaceAction("drop_item", src.piece_id, dst.slot_id)
      : null;
  }
  const active =
    b.displayPieces.find(
      (p) => p.piece_id === b.stagedId && !b.placedPieceIds.has(p.piece_id)
    ) ?? b.displayPieces.find((p) => !b.placedPieceIds.has(p.piece_id));
  if (g.type === "adjust") {
    const direction = g.delta >= 0 ? "cw" : "ccw";
    return active
      ? { type: "rotate_piece", data: { piece_id: active.piece_id, direction } }
      : null;
  }
  return g.type === "tap" ? resolveTapGesture(b, g, active, stageItem) : null;
}

function resolveTapGesture(
  b: B,
  g: Extract<Gesture, { type: "tap" }>,
  active: GT019Piece | undefined,
  stageItem: (pieceId: string | null) => void
): GameAction | null {
  if (active && hitFlip(b, g.x, g.y)) {
    const t = b.content.target_slots.find(
      (s) => s.slot_id === active.target_slot_id
    );
    const axis =
      toFlipAxis(t?.target_flip) === "vertical" ? "vertical" : "horizontal";
    return { type: "flip_piece", data: { piece_id: active.piece_id, axis } };
  }
  const [tIdx, sIdx] = [hitTgt(b, g.x, g.y), hitSrc(b, g.x, g.y)];
  const [hitT, hitS] = [b.content.target_slots[tIdx], b.displayPieces[sIdx]];
  const [tSlot, sSlot] = [b.targetSlots[tIdx], b.sourceSlots[sIdx]];
  const tgtCloser =
    !(sSlot && tSlot) ||
    Math.hypot(g.x - tSlot.x, g.y - tSlot.y) <=
      Math.hypot(g.x - sSlot.x, g.y - sSlot.y);
  if (b.stagedId && hitT && tgtCloser) {
    return makePlaceAction("tap_tap_item", b.stagedId, hitT.slot_id);
  }
  if (hitS && !b.placedPieceIds.has(hitS.piece_id)) {
    const piece_id = hitS.piece_id;
    if (b.stagedId === piece_id) {
      return { type: "rotate_piece", data: { piece_id, direction: "cw" } };
    }
    stageItem(piece_id);
    return null;
  }
  stageItem(null);
  return null;
}

const getPieceTf = (b: B, p: GT019Piece): PieceTransform =>
  b.pieceTransforms.get(p.piece_id) ?? {
    rotation: toRotationAngle(p.initial_rotation),
    flip: toFlipAxis(p.initial_flip),
  };

export function resolveGT019HintTargetIndex(b: B): number | null {
  const p = b.firstPiece;
  if (!p) {
    return null;
  }
  const t = b.content.target_slots.find((s) => s.slot_id === p.target_slot_id);
  const tf = getPieceTf(b, p);
  if (
    b.difficulty.allow_flip &&
    tf.flip !== toFlipAxis(t?.target_flip) &&
    b.flipButtonSlot
  ) {
    const flipIdx = b.slots.indexOf(b.flipButtonSlot);
    if (flipIdx >= 0) {
      return flipIdx;
    }
  }
  const idx = b.displayPieces.indexOf(p);
  const slot = b.sourceSlots[idx];
  return slot ? b.slots.indexOf(slot) : null;
}

export function resolveGT019HintDestinationIndex(b: B): number | null {
  const p = b.firstPiece;
  if (!p) {
    return null;
  }
  const tIdx = b.content.target_slots.findIndex(
    (s) => s.slot_id === p.target_slot_id
  );
  const t = b.content.target_slots[tIdx];
  const matches = isPieceTransformMatch(getPieceTf(b, p), {
    rotation: toRotationAngle(t?.target_rotation),
    flip: toFlipAxis(t?.target_flip),
  });
  const slot = b.targetSlots[tIdx];
  const index = matches && slot ? b.slots.indexOf(slot) : -1;
  return index >= 0 ? index : null;
}

export function buildGT019HintDemoSequence(
  b: B,
  level: HintLevel
): readonly HintDemoStep[] | null {
  const p = level === 3 ? b.firstPiece : null;
  if (!p) {
    return null;
  }
  const srcSlot = b.sourceSlots[b.displayPieces.indexOf(p)];
  const tIdx = b.content.target_slots.findIndex(
    (s) => s.slot_id === p.target_slot_id
  );
  const target = b.content.target_slots[tIdx];
  const tSlot = b.targetSlots[tIdx];
  const pieceIdx = srcSlot ? b.slots.indexOf(srcSlot) : -1;
  const targetIdx = tSlot ? b.slots.indexOf(tSlot) : -1;
  if (pieceIdx < 0 || targetIdx < 0 || !target) {
    return null;
  }
  const cur = getPieceTf(b, p);
  const flipIdx = b.flipButtonSlot ? b.slots.indexOf(b.flipButtonSlot) : -1;
  const steps: HintDemoStep[] = [];
  if (
    b.difficulty.allow_flip &&
    cur.flip !== toFlipAxis(target.target_flip) &&
    flipIdx >= 0
  ) {
    steps.push({ from: flipIdx });
  }
  const rotDiff =
    ((toRotationAngle(target.target_rotation) - cur.rotation) % 360) + 360;
  const rotSteps = (rotDiff % 360) / 90;
  if (rotSteps > 0 && b.stagedId !== p.piece_id) {
    steps.push({ from: pieceIdx });
  }
  for (let k = 0; k < rotSteps; k++) {
    steps.push({ from: pieceIdx });
  }
  steps.push({ from: pieceIdx, to: targetIdx });
  return steps.length >= 2 ? steps : null;
}

const wrongStrength = (m: WrongFlashMap, id: string, now: number): number =>
  m.isActive(id, now) ? 1 - m.progress(id, now) : 0;

function resolveTargetTransform(
  b: B,
  t: GT019Target,
  placed: GT019Piece | undefined,
  effProg: number
): { rotDeg: number; flipScaleX: number; flipScaleY: number } {
  const tRot = toRotationAngle(t.target_rotation);
  const tFlip = toFlipAxis(t.target_flip);
  if (placed || !(b.roundClosedOnWrong && effProg > 0)) {
    const tf = placed ? getPieceTf(b, placed) : { rotation: tRot, flip: tFlip };
    return {
      rotDeg: tf.rotation,
      flipScaleX: flipSx(tf.flip),
      flipScaleY: flipSy(tf.flip),
    };
  }
  const srcP = b.content.pieces.find((p) => p.target_slot_id === t.slot_id);
  const sTf = srcP ? getPieceTf(b, srcP) : { rotation: tRot, flip: tFlip };
  return {
    rotDeg: sTf.rotation + (tRot - sTf.rotation) * effProg,
    flipScaleX: flipSx(sTf.flip) + (flipSx(tFlip) - flipSx(sTf.flip)) * effProg,
    flipScaleY: flipSy(sTf.flip) + (flipSy(tFlip) - flipSy(sTf.flip)) * effProg,
  };
}

function renderOneTargetSlot(
  b: B,
  ctx: Ctx,
  rs: RS,
  c: Clk,
  i: number,
  autoProg: number
): void {
  const t = b.content.target_slots[i];
  const slot = b.targetSlots[i];
  if (!(t && slot)) {
    return;
  }
  const placedId = b.pieceIdBySlotId.get(t.slot_id);
  const placed = b.content.pieces.find((p) => p.piece_id === placedId);
  const effProg = b.roundClosedOnWrong && rs.reducedMotion ? 1 : autoProg;
  const burstRem = c.burstTimers.get(t.slot_id) ?? 0;
  let mode: "empty" | "placed" | "auto_resolved" = "empty";
  if (placed) {
    mode = "placed";
  } else if (b.roundClosedOnWrong && effProg > 0) {
    mode = "auto_resolved";
  }
  drawGT019TargetSlot(ctx, rs, slot, {
    asset: placed ? placed.asset : t.asset,
    ...resolveTargetTransform(b, t, placed, effProg),
    mode,
    hintLevel:
      t.slot_id === b.firstPiece?.target_slot_id ? b.activeHintLevel : 0,
    wrongProgress: wrongStrength(c.slotWrongFlashes, t.slot_id, c.logicMs),
    burstProgress: burstRem > 0 ? burstRem / GT019_BURST_MS : 0,
    autoResolveProgress: effProg,
    isWon: b.isWon,
    showParticles: b.particlesEnabled,
  });
}

function renderTrayPieceList(b: B, ctx: Ctx, rs: RS, c: Clk): void {
  const firstId = b.firstPiece?.piece_id ?? null;
  b.displayPieces.forEach((p, i) => {
    const slot = b.sourceSlots[i];
    if (!slot || b.placedPieceIds.has(p.piece_id)) {
      return;
    }
    const vis = resolveGT019VisualTransform(
      b.owner,
      p.piece_id,
      getPieceTf(b, p),
      rs.reducedMotion
    );
    const wp = wrongStrength(c.pieceWrongFlashes, p.piece_id, c.logicMs);
    let state: ItemVisualState = b.getBaseItemState(p.piece_id);
    if (wp > 0) {
      state = "wrong";
    } else if (b.stagedId === p.piece_id) {
      state = "selected";
    } else if (b.hoveredId === p.piece_id) {
      state = "touching";
    }
    drawGT019TrayPiece(ctx, rs, slot, {
      asset: p.asset,
      ...vis,
      state,
      wrongProgress: wp,
      isHinted: p.piece_id === firstId && b.activeHintLevel >= 2,
      timeMs: c.logicMs,
    });
  });
}

function collectLitTargets(b: B, rs: RS, c: Clk, ms: number): GT019LitTarget[] {
  return b.content.target_slots.flatMap((t, i) => {
    const slot = b.targetSlots[i];
    const stamp = slot ? c.placedAt.get(t.slot_id) : undefined;
    if (!(slot && stamp && b.pieceIdBySlotId.has(t.slot_id))) {
      return [];
    }
    stamp.anchorMs ??= ms;
    const el = Math.max(0, c.logicMs - stamp.logicMs, ms - stamp.anchorMs);
    return [{ slot, strength: beamFadeIn(el, rs.reducedMotion) }];
  });
}

function renderFlipBtn(b: B, ctx: Ctx, rs: RS, c: Clk): void {
  if (!(b.difficulty.allow_flip && b.flipButtonSlot)) {
    return;
  }
  const fp = b.firstPiece;
  const actFlip = b.pieceTransforms.get(b.stagedId ?? fp?.piece_id ?? "")?.flip;
  const firstT = b.content.target_slots.find(
    (s) => s.slot_id === fp?.target_slot_id
  );
  const fFlip =
    (fp ? b.pieceTransforms.get(fp.piece_id)?.flip : null) ?? "none";
  drawGT019FlipButton(ctx, rs, b.flipButtonSlot, {
    isFlipped: (actFlip ?? "none") !== "none",
    isHovered: b.hoveredId === "btn_flip",
    isHinted:
      fp !== null &&
      b.activeHintLevel >= 3 &&
      fFlip !== toFlipAxis(firstT?.target_flip),
    pulseProgress:
      c.flipBtnPulseMs > 0 ? c.flipBtnPulseMs / GT019_FLIP_PULSE_MS : 0,
  });
}

export function renderGT019Board(b: B, ctx: Ctx, rs: RS, timeMs: number): void {
  const clock = getGT019Clock(b.owner);
  drawSceneBackground(ctx, rs, b.themeId);
  const beamOrigin = drawGT019FlashlightHolder(ctx, b.stageRect, b.slots);
  const zones = pickTrayZones(b.stageRect, b.trayRect);
  if (zones && b.sourceSlots.length > 0) {
    drawWoodenTokenDock(ctx, rs, zones.tray);
  }
  drawGT019LightsPass(ctx, beamOrigin, collectLitTargets(b, rs, clock, timeMs));
  const autoProg = Math.min(1, clock.autoResolveMs / GT019_AUTO_RESOLVE_MS);
  for (let i = 0; i < b.content.target_slots.length; i++) {
    renderOneTargetSlot(b, ctx, rs, clock, i, autoProg);
  }
  renderTrayPieceList(b, ctx, rs, clock);
  renderFlipBtn(b, ctx, rs, clock);
}
