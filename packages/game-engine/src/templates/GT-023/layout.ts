import type { AgeBand } from "#src/contracts/types";
import type { HintLevel, HintTarget } from "#src/game-session";
import type { EngineView, EntityVisual, ViewEntity } from "#src/interaction";
import { resolveAssetSpeech } from "#src/labels/spoken-keyword.js";
import { resolveTouchFloor, SLOT_GAP_PX } from "#src/layout/constants";
import { hasHitOverlap } from "#src/layout/hit-overlap";
import { TAP_TOLERANCE_PX } from "#src/layout/hit-test.js";
import { resolveLayout } from "#src/layout/registry";
import { computeStageCellSlots } from "#src/layout/stage-targets";
import type { ZoneRect } from "#src/layout/stage-zones";
import {
  computeTraySourceSlots,
  findNearestHitSlot,
  pickTrayZones,
} from "#src/layout/tray-layout";
import type { Slot } from "#src/layout/types";
import {
  drawGT023AnchorOverlay as dAnchor,
  drawGT023Workbench as dBench,
  drawGT023ModelCard as dModel,
  drawGT023TrayPart as dTray,
} from "#src/render/gt-023-shapes";
import {
  drawEmptyTargetSlot,
  drawGhostAssetInSlot,
  drawSceneBackground,
  drawStoryCharacterInStage,
  drawWoodenTokenDock,
  placeStoryCharacter,
  snapWobbleOffset,
} from "#src/render/index.js";
import { deriveStream } from "#src/rng/mulberry32";
import { shuffle } from "#src/rng/shuffle";
import type { AssemblySystem } from "#src/systems/assembly-system";
import type { DegradationState } from "#src/systems/degradation";
import type { RenderSystem } from "#src/systems/render-system";
import { WRONG_FLASH_MS, WrongFlashMap } from "#src/systems/wrong-flash";
import type { GT023Content, GT023Difficulty } from "./template.js";

export const MIN_SNAP_RADIUS_PX = 64;
const [ANCHOR_CELL_MAX_PX, SHAPE_CELL_STEP_PX] = [96, 8];
const [MODEL_EDGE_PAD_PX, AUTO_SOLVE_DURATION_MS] = [4, 500];
export type GT023Anchor = GT023Content["anchors"][number];
export type GT023Part = GT023Content["parts"][number];
type A = GT023Anchor;
type P = GT023Part;
type PM = ReadonlyMap<string, P>;
type H = GT023RenderHost;
type C = GT023ClockState;
type Ctx = CanvasRenderingContext2D;
type RS = RenderSystem;
type Pt = readonly [number, number];
export type HitSourcePart = Readonly<
  Record<"part", GT023Part> & Record<"slot", Slot>
>;
type NumNull = "winAtMs" | "autoSolveAtMs";
type StrNull = "hoveredPartId" | "hoveredAnchorId";
export type GT023ClockState = Record<"logicMs" | "frameMs", number> &
  Readonly<Record<"partWrongFlashes" | "anchorWrongFlashes", WrongFlashMap>> &
  Readonly<Record<"snappedAtMs", Map<string, number>>> &
  Record<NumNull, number | null> &
  Record<StrNull, string | null> &
  Record<"hoveredModel", boolean> &
  Record<"activeHintLevel", 0 | 1 | 2 | 3>;
type SlotBag = Record<"slots" | "sourceSlots" | "targetSlots", readonly Slot[]>;
type ZoneBag = Partial<Record<"stageRect" | "trayRect", ZoneRect>>;
export interface GT023RenderHost extends Readonly<SlotBag & ZoneBag> {
  readonly content: GT023Content;
  readonly difficulty: GT023Difficulty;
  readonly displayParts: readonly GT023Part[];
  readonly themeId?: string;
  readonly cssPerLogic?: number;
  readonly logicSpace: { readonly w: number; readonly h: number };
  readonly assemblySystem: AssemblySystem;
  readonly degradation: DegradationState | null;
  readonly roundClosedOnWrong: boolean;
  checkWinCondition(): boolean;
  isAcceptingInput(): boolean;
  getStagedItemId(): string | null;
  getPlacements(): ReadonlyMap<string, string>;
}
export type GT023HintPair = Readonly<
  Record<"anchor", GT023Anchor> &
    Record<"part", GT023Part> &
    Record<"anchorSlot" | "sourceSlot", Slot>
>;
const CLOCK_MAP = new WeakMap<object, C>();
function createClock(): C {
  const [pWf, aWf] = [new WrongFlashMap(), new WrongFlashMap()];
  const snappedAtMs = new Map<string, number>();
  const t1 = { logicMs: 0, frameMs: 0, partWrongFlashes: pWf };
  const t2 = { anchorWrongFlashes: aWf, snappedAtMs, winAtMs: null };
  const [autoSolveAtMs, hoveredPartId, hoveredAnchorId] = [null, null, null];
  const t3 = { autoSolveAtMs, hoveredPartId, hoveredAnchorId };
  return { ...t1, ...t2, ...t3, hoveredModel: false, activeHintLevel: 0 };
}
export function getClock(owner: object): C {
  let c = CLOCK_MAP.get(owner);
  if (!c) {
    c = createClock();
    CLOCK_MAP.set(owner, c);
  }
  return c;
}
export function resetClock(owner: object): void {
  CLOCK_MAP.set(owner, createClock());
}
export function syncClock(owner: object, timeMs: number): C {
  const c = getClock(owner);
  [c.frameMs, c.logicMs] = [timeMs, Math.max(c.logicMs, timeMs)];
  return c;
}
export function resolveDisplayParts(p: readonly P[], s: number, g: number) {
  if (g <= 0 || s <= 0 || p.length <= 1) {
    return [...p];
  }
  const out = shuffle(p, deriveStream(s + g * 7919, "items"));
  const same = out.every((it, idx) => it.part_id === p[idx]?.part_id);
  return same ? [...out.slice(1), ...out.slice(0, 1)] : out;
}
export function findHitSourcePart(b: H, pt: Pt): HitSourcePart | null {
  const sources = b.slots.filter((s) => s.role === "source");
  const placed = new Set(b.getPlacements().values());
  const open = b.displayParts.flatMap((part, i) => {
    const slot = sources[i];
    return slot && !placed.has(part.part_id) ? [{ part, slot }] : [];
  });
  const oSlots = open.map((e) => e.slot);
  const hit = findNearestHitSlot(oSlots, pt[0], pt[1], TAP_TOLERANCE_PX);
  return open[hit] ?? null;
}
export function findHitAnchorSlot(b: H, pt: Pt): GT023Anchor | null {
  const r = Math.max(b.difficulty.snap_radius_px, MIN_SNAP_RADIUS_PX);
  const [maxD, placed] = [r + TAP_TOLERANCE_PX, b.getPlacements()];
  let [best, bestD]: [GT023Anchor | null, number] = [null, maxD + 1];
  b.content.anchors.forEach((anchor, i) => {
    const s = placed.has(anchor.anchor_id) ? undefined : b.targetSlots[i];
    const d = s ? Math.hypot(s.x - pt[0], s.y - pt[1]) : maxD + 1;
    if (d <= maxD && d < bestD) {
      [best, bestD] = [anchor, d];
    }
  });
  return best;
}
function modelScale(pts: readonly A[], sz: number, rw: number, rh: number) {
  const [xs, ys] = [pts.map((p) => p.x), pts.map((p) => p.y)];
  const sx = Math.max(...xs) - Math.min(...xs);
  const sy = Math.max(...ys) - Math.min(...ys);
  const fitX = sx > 0 ? rw / sx : Number.POSITIVE_INFINITY;
  const fitY = sy > 0 ? rh / sy : Number.POSITIVE_INFINITY;
  if (!(Number.isFinite(fitX) || Number.isFinite(fitY)) || rw <= 0) {
    return null;
  }
  let nearest = Number.POSITIVE_INFINITY;
  for (const [i, a] of pts.entries()) {
    for (const b of pts.slice(i + 1)) {
      const sep = Math.max(Math.abs(a.x - b.x), Math.abs(a.y - b.y));
      if (sep > 0) {
        nearest = Math.min(nearest, sep);
      }
    }
  }
  const tight = Number.isFinite(nearest)
    ? (sz + SLOT_GAP_PX) / nearest
    : Number.POSITIVE_INFINITY;
  const scale = Math.min(fitX, fitY, tight);
  return Number.isFinite(scale) && scale > 0 ? scale : null;
}
type PlaceArgs = readonly [H, readonly Slot[], ZoneRect, number];
function placeAnchorsAsModel([b, grid, st, tf]: PlaceArgs): readonly Slot[] {
  const [cell, anchors] = [grid[0], b.content.anchors];
  if (!cell) {
    return grid;
  }
  const fIdx = b.displayParts.length;
  const [xs, ys] = [anchors.map((a) => a.x), anchors.map((a) => a.y)];
  const midX = (Math.max(...xs) + Math.min(...xs)) / 2;
  const midY = (Math.max(...ys) + Math.min(...ys)) / 2;
  const [cx, cy] = [st.x + st.w / 2, st.y + st.h / 2];
  for (let size = cell.hitW; size >= tf; size -= SHAPE_CELL_STEP_PX) {
    const rw = st.w - 2 * MODEL_EDGE_PAD_PX - size;
    const rh = st.h - 2 * MODEL_EDGE_PAD_PX - size;
    const scale = modelScale(anchors, size, rw, rh);
    if (scale === null) {
      return grid;
    }
    const [w, h] = [Math.min(cell.w, size), Math.min(cell.h, size)];
    const base = { ...cell, w, h, hitW: size, hitH: size };
    const shaped = anchors.map((a, i) => ({
      ...base,
      index: fIdx + i,
      x: Math.round(cx + (a.x - midX) * scale),
      y: Math.round(cy + (a.y - midY) * scale),
    }));
    if (!hasHitOverlap(shaped)) {
      return shaped;
    }
  }
  return grid;
}
type ModelArgs = readonly [ZoneRect, readonly Slot[], readonly Slot[], number];
function tryPlaceModelSlot([st, ps, as, sz]: ModelArgs): Slot | null {
  const [pad, idx] = [MODEL_EDGE_PAD_PX + 2, ps.length + as.length];
  if (st.w < sz + pad * 2 || st.h < sz + pad * 2) {
    return null;
  }
  const [l, r] = [
    Math.round(st.x + pad + sz / 2),
    Math.round(st.x + st.w - pad - sz / 2),
  ];
  const [t, b] = [
    Math.round(st.y + pad + sz / 2),
    Math.round(st.y + st.h - pad - sz / 2),
  ];
  const cPts: readonly Pt[] = [
    [l, t],
    [r, t],
    [l, b],
    [r, b],
  ];
  for (const [x, y] of cPts) {
    const c1 = { index: idx, page: 0, role: "neutral" as const, x, y };
    const cand: Slot = { ...c1, w: sz, h: sz, hitW: sz, hitH: sz };
    const allStage = [...as, cand];
    const hasGap = as.every((a) => {
      const dx = Math.abs(a.x - x) - (a.hitW + sz) / 2;
      const dy = Math.abs(a.y - y) - (a.hitH + sz) / 2;
      return Math.max(dx, dy) >= SLOT_GAP_PX;
    });
    const charOk = placeStoryCharacter(st, [...ps, ...allStage]) !== null;
    if (!hasHitOverlap(allStage) && hasGap && charOk) {
      return cand;
    }
  }
  return null;
}
export function computeGT023Slots(host: H, ageBand: AgeBand): readonly Slot[] {
  const zones = pickTrayZones(host.stageRect, host.trayRect);
  if (zones) {
    const floor = resolveTouchFloor(ageBand, host.cssPerLogic);
    const nParts = host.displayParts.length;
    const parts = computeTraySourceSlots(nParts, zones.tray, floor, 0, false);
    const maxCell = { w: ANCHOR_CELL_MAX_PX, h: ANCHOR_CELL_MAX_PX };
    const c1 = { count: host.content.anchors.length, stage: zones.stage };
    const c2 = { touchFloor: floor, maxCell, role: "target" as const };
    const c3 = { hasLabels: false, firstIndex: nParts };
    const raw = computeStageCellSlots({ ...c1, ...c2, ...c3 });
    const anchors = placeAnchorsAsModel([host, raw, zones.stage, floor]);
    const model = tryPlaceModelSlot([zones.stage, parts, anchors, floor]);
    return model ? [...parts, ...anchors, model] : [...parts, ...anchors];
  }
  const l1 = { slotCount: host.displayParts.length, ageBand };
  const l2 = {
    targetCount: host.content.anchors.length,
    logic: host.logicSpace,
  };
  return resolveLayout("top-source-bottom-target")({ ...l1, ...l2 });
}
export function resolveHintPair(host: H): GT023HintPair | null {
  if (host.checkWinCondition() || !host.isAcceptingInput()) {
    return null;
  }
  const placements = host.getPlacements();
  const placed = new Set(placements.values());
  const stagedId = host.getStagedItemId();
  const findForPart = (i: number): GT023HintPair | null => {
    const [part, sourceSlot] = [host.displayParts[i], host.sourceSlots[i]];
    if (!(part && sourceSlot) || placed.has(part.part_id)) {
      return null;
    }
    const sys = host.assemblySystem;
    const aIdx = host.content.anchors.findIndex(
      (a) =>
        !placements.has(a.anchor_id) &&
        sys.acceptsPart(a.anchor_id, part.part_id)
    );
    const anchor = host.content.anchors[aIdx];
    const anchorSlot = host.targetSlots[aIdx];
    return anchor && anchorSlot
      ? { anchor, anchorSlot, part, sourceSlot }
      : null;
  };
  if (stagedId) {
    const sIdx = host.displayParts.findIndex((p) => p.part_id === stagedId);
    const stagedPair = sIdx >= 0 ? findForPart(sIdx) : null;
    if (stagedPair) {
      return stagedPair;
    }
  }
  for (let i = 0; i < host.displayParts.length; i++) {
    const pair = findForPart(i);
    if (pair) {
      return pair;
    }
  }
  return null;
}
export function resolveSteppedHint(host: H, lv: HintLevel): HintTarget | null {
  const pair = resolveHintPair(host);
  if (!pair) {
    return null;
  }
  if (lv === 1) {
    return { kind: "region", ids: [pair.anchor.anchor_id] };
  }
  if (lv === 2) {
    return { kind: "region", ids: [pair.part.part_id, pair.anchor.anchor_id] };
  }
  const toIndex = host.slots.indexOf(pair.anchorSlot);
  return { kind: "slot", index: pair.sourceSlot.index, toIndex };
}
export function resolveDemoSequence(host: H, lv: HintLevel) {
  const pair = lv >= 3 ? resolveHintPair(host) : null;
  const to = pair ? host.slots.indexOf(pair.anchorSlot) : -1;
  return pair ? [{ from: pair.sourceSlot.index, to }] : null;
}
function spOf(asset?: GT023Part["asset"], text?: string) {
  const aSp = asset ? resolveAssetSpeech(asset) : {};
  const tSp = text ? resolveAssetSpeech({ kind: "text", text }) : {};
  return { ...aSp, ...tSp };
}
type Sp = Partial<Readonly<Record<"spokenLabel", string>>>;
type Role = ViewEntity["role"];
type EntArgs = readonly [string, number, Role, EntityVisual, Slot, Sp];
function makeEnt([id, slotIndex, role, state, s, sp]: EntArgs): ViewEntity {
  const p1 = { id, slotIndex, role, state, x: s.x, y: s.y };
  const p2 = { w: s.w, h: s.h, hitW: s.hitW, hitH: s.hitH };
  return { ...p1, ...p2, hitShape: "square", ...sp };
}
export function buildGT023View(host: H): EngineView {
  const clock = getClock(host);
  const placed = new Set(host.getPlacements().values());
  const entities: ViewEntity[] = [];
  const usedIds = new Set<string>();
  const claim = (raw: string, pre: string): string => {
    const id = usedIds.has(raw) ? `${pre}:${raw}` : raw;
    usedIds.add(id);
    return id;
  };
  host.content.anchors.forEach((a, i) => {
    const s = host.targetSlots[i];
    if (!s) {
      return;
    }
    const isHov = clock.hoveredAnchorId === a.anchor_id;
    let st: EntityVisual = isHov ? "active" : "idle";
    if (host.getPlacements().has(a.anchor_id)) {
      st = "correct";
    } else if (clock.anchorWrongFlashes.isActive(a.anchor_id, clock.frameMs)) {
      st = "incorrect";
    }
    const [id, idx] = [claim(a.anchor_id, "anchor"), host.slots.indexOf(s)];
    const sp = spOf(undefined, a.label);
    entities.push(makeEnt([id, idx, "target", st, s, sp]));
  });
  host.displayParts.forEach((p, i) => {
    const s = host.sourceSlots[i];
    if (!s) {
      return;
    }
    const isHov = clock.hoveredPartId === p.part_id;
    let st: EntityVisual = isHov ? "active" : "idle";
    if (placed.has(p.part_id)) {
      st = "correct";
    } else if (clock.partWrongFlashes.isActive(p.part_id, clock.frameMs)) {
      st = "incorrect";
    } else if (host.getStagedItemId() === p.part_id) {
      st = "selected";
    }
    const id = claim(p.part_id, "part");
    const sp = spOf(p.asset, p.name);
    entities.push(makeEnt([id, s.index, "source", st, s, sp]));
  });
  const ms = host.slots.find((s) => s.role === "neutral");
  if (ms) {
    const tm = host.content.target_model;
    let st: EntityVisual = clock.hoveredModel ? "active" : "idle";
    if (host.checkWinCondition()) {
      st = "correct";
    }
    const id = claim("target-model", "model");
    const sp = spOf(tm.asset, tm.name);
    entities.push(makeEnt([id, ms.index, "neutral", st, ms, sp]));
  }
  return { activePrompt: host.content.prompt, entities };
}
function wrongRatio(m: WrongFlashMap, id: string, now: number): number | null {
  return m.isActive(id, now)
    ? Math.min(1, m.elapsedMs(id, now) / WRONG_FLASH_MS)
    : null;
}
type AnchorDrawCtx = Readonly<{
  host: H;
  ctx: Ctx;
  rs: RS;
  timeMs: number;
  partById: ReadonlyMap<string, GT023Part>;
  hintPair: GT023HintPair | null;
  autoSolveProgress: number;
  winElapsedMs: number | null;
}>;
function drawSingleAnchor(dc: AnchorDrawCtx, anchor: A, index: number): void {
  const { host, ctx, rs, timeMs, partById, hintPair } = dc;
  const slot = host.targetSlots[index];
  if (!slot) {
    return;
  }
  const clock = getClock(host);
  const partId = host.getPlacements().get(anchor.anchor_id);
  const placedPart = partId ? partById.get(partId) : undefined;
  const expectedPart = partById.get(anchor.accepted_part_id);
  const showOutline = host.difficulty.show_anchor_outline !== false;
  if (!placedPart) {
    if (showOutline) {
      drawEmptyTargetSlot(ctx, slot);
    }
    drawGhostAssetInSlot(ctx, expectedPart?.asset, slot);
  }
  const snappedAt = clock.snappedAtMs.get(anchor.anchor_id);
  const dt = timeMs - (snappedAt ?? Number.NEGATIVE_INFINITY);
  const wobbleX = placedPart ? snapWobbleOffset(dt, rs.reducedMotion) : 0;
  const isHint = hintPair?.anchor.anchor_id === anchor.anchor_id;
  const aFl = clock.anchorWrongFlashes;
  const wp = wrongRatio(aFl, anchor.anchor_id, clock.frameMs);
  const snappedElapsedMs =
    snappedAt === undefined ? null : Math.max(0, timeMs - snappedAt);
  const hintLevel = isHint ? clock.activeHintLevel : 0;
  const isSnapPreview = clock.hoveredAnchorId === anchor.anchor_id;
  const showParticles = host.degradation?.particles_enabled ?? true;
  const a1 = { slot, index, showOutline, hintLevel, isSnapPreview };
  const a2 = { wrongProgress: wp, placedAsset: placedPart?.asset };
  const a3 = { expectedAsset: expectedPart?.asset, wobbleX, snappedElapsedMs };
  const a4 = { isAutoSolved: host.roundClosedOnWrong && !placedPart };
  const { autoSolveProgress, winElapsedMs } = dc;
  const a5 = { autoSolveProgress, winElapsedMs, showParticles };
  const a6 = { stageRect: host.stageRect, timeMs: clock.frameMs };
  dAnchor(ctx, rs, { ...a1, ...a2, ...a3, ...a4, ...a5, ...a6 });
}
export function renderGT023Frame(h: H, ctx: Ctx, rs: RS, t: number, pm: PM) {
  const [host, partById] = [h, pm];
  const clock = syncClock(host, t);
  drawSceneBackground(ctx, rs, host.themeId);
  drawStoryCharacterInStage(ctx, "woodpecker", host.stageRect, host.slots);
  const zones = pickTrayZones(host.stageRect, host.trayRect);
  if (zones) {
    drawWoodenTokenDock(ctx, rs, zones.tray);
  }
  const isWon = host.checkWinCondition();
  const winElapsedMs =
    clock.winAtMs === null ? null : Math.max(0, clock.frameMs - clock.winAtMs);
  const wb1 = { stageRect: host.stageRect, anchorSlots: host.targetSlots };
  dBench(ctx, rs, { ...wb1, isWon, winElapsedMs });
  const softShadows = host.degradation?.soft_shadows_enabled !== false;
  const modelSlot = host.slots.find((s) => s.role === "neutral");
  if (modelSlot) {
    const asset = host.content.target_model.asset;
    const mc1 = { box: modelSlot, asset, isWon, softShadows };
    const mc2 = { isHovered: clock.hoveredModel, stageRect: host.stageRect };
    dModel(ctx, rs, { ...mc1, ...mc2 });
  }
  const hintPair = clock.activeHintLevel > 0 ? resolveHintPair(host) : null;
  const dtAp = clock.frameMs - (clock.autoSolveAtMs ?? clock.frameMs);
  const rawAp =
    clock.autoSolveAtMs === null ? 0 : dtAp / AUTO_SOLVE_DURATION_MS;
  const autoSolveProgress = Math.min(1, Math.max(0, rawAp));
  const d1 = { host, ctx, rs, timeMs: t, partById };
  const dc = { ...d1, hintPair, autoSolveProgress, winElapsedMs };
  host.content.anchors.forEach((anchor, i) => {
    drawSingleAnchor(dc, anchor, i);
  });
  const placed = new Set(host.getPlacements().values());
  const stagedId = host.getStagedItemId();
  host.displayParts.forEach((part, i) => {
    const slot = host.sourceSlots[i];
    const autoDone = host.roundClosedOnWrong && autoSolveProgress >= 1;
    if (!slot || placed.has(part.part_id) || autoDone) {
      return;
    }
    const wp = wrongRatio(clock.partWrongFlashes, part.part_id, clock.frameMs);
    const isHintL2 =
      clock.activeHintLevel >= 2 && hintPair?.part.part_id === part.part_id;
    const isHovered = clock.hoveredPartId === part.part_id;
    const tp1 = { slot, asset: part.asset, index: i, isHovered };
    const isStaged = stagedId === part.part_id;
    const tp2 = { isStaged, isHintL2, wrongProgress: wp };
    const tp3 = { trayRect: zones?.tray, timeMs: clock.frameMs, softShadows };
    dTray(ctx, rs, { ...tp1, ...tp2, ...tp3 });
  });
}
