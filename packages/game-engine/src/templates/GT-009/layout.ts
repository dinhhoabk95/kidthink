import { formatSpokenLabel } from "@mindkid/shared/preschool-terminology";
import type { AgeBand } from "#src/contracts/types";
import type { HintDemoStep, HintLevel, HintTarget } from "#src/game-session";
import type { ViewEntity } from "#src/interaction";
import { resolveAssetLabels } from "#src/labels/spoken-keyword";
import {
  type LogicSpace,
  resolveTouchFloor,
  SLOT_GAP_PX,
} from "#src/layout/constants";
import { insetDrawSize, legacyStageArea } from "#src/layout/slot-fit";
import type { ZoneRect } from "#src/layout/stage-zones";
import type { Slot } from "#src/layout/types";
import type { ItemVisualState, SceneBox } from "#src/render/types.js";
import { deriveStream } from "#src/rng/mulberry32";
import { shuffle } from "#src/rng/shuffle";
import { designTokens } from "#src/systems/designTokens";
import type { Particle } from "#src/systems/render-system";
import { survivingCandidates } from "./deduction.js";
import type { GT009Content } from "./template.js";

export type GT009CandidateItem = GT009Content["candidates"][number];
export type GT009ClueItem = GT009Content["clues"][number];
export type GT009Predicate = GT009ClueItem["predicate"];
export type GT009AttrPred = Extract<
  GT009Predicate,
  { readonly kind: "has_attribute" | "not_attribute" }
>;
export type GT009NumPred = Exclude<
  GT009Predicate,
  { readonly kind: "has_attribute" | "not_attribute" }
>;

export type GT009CandidateVisualState =
  | "idle"
  | "touching"
  | "eliminated"
  | "correct"
  | "wrong";

export type GT009AttrIconKind =
  | "tree"
  | "wave"
  | "car"
  | "triangle"
  | "square"
  | "dot";

export interface GT009ClueCardOptions {
  readonly clue: GT009ClueItem;
  readonly revealed: boolean;
  readonly revealElapsedMs: number | null;
  readonly isHovered: boolean;
  readonly isHinted: boolean;
  readonly isViolatedSpotlight: boolean;
}

export interface GT009CandidateOverlayOptions {
  readonly slot: Slot;
  readonly drawSlot: Slot;
  readonly state: ItemVisualState;
  readonly eliminated: boolean;
  readonly isTouching: boolean;
  readonly isHovered: boolean;
  readonly isHinted: boolean;
  readonly isHintDimmed: boolean;
  readonly wrongProgress: number | null;
}

const dc = designTokens.colors;
const ATTR_COLORS: readonly (readonly [readonly string[], string])[] = [
  [["red", "đỏ", "hoa quả"], dc.cta[500]],
  [["blue", "water"], dc.brand[500]],
  [["purple", "tím"], dc.brand[700]],
  [["green", "land", "plant"], dc.montessori.emerald],
  [["yellow"], dc.montessori.amber],
  [["brown"], dc.montessori.woodBorder],
];

export function resolveGT009AttrColor(val: string): string {
  const v = val.toLowerCase();
  const hit = ATTR_COLORS.find(([keys]) => keys.some((k) => v.includes(k)));
  return hit ? hit[1] : dc.brand[600];
}

const ATTR_ICONS: readonly (readonly [readonly string[], GT009AttrIconKind])[] =
  [
    [["tree", "cây", "plant"], "tree"],
    [["water", "nước", "wave"], "wave"],
    [["xe", "car", "vehicle"], "car"],
    [["triangle", "land", "meat", "tam giác"], "triangle"],
    [["rect", "square", "size", "vuông"], "square"],
  ];

export function resolveGT009AttrIconKind(
  key: string,
  attrValue: string
): GT009AttrIconKind {
  const s = `${key}:${attrValue}`.toLowerCase();
  const hit = ATTR_ICONS.find(([keys]) => keys.some((k) => s.includes(k)));
  return hit ? hit[1] : "dot";
}

export const GT009_CLUE_POP_MS = 240;
const BASE_FRAME_MS = 16.667;
const CELEBRATE_COLORS: readonly string[] = Object.freeze([
  dc.montessori.emeraldBright,
  dc.montessori.amber,
  dc.brand[400],
  dc.cta[400],
]);

export interface GT009ClockState {
  logicMs: number;
  wrongTriggerSeq: number;
  seenTriggerSeq: number;
  wrongRenderAnchorMs: number | null;
  readonly clueRevealLogicMs: Map<string, number>;
  winLogicMs: number | null;
}

const RENDER_CLOCK = new WeakMap<object, GT009ClockState>();

function createClockState(): GT009ClockState {
  return {
    logicMs: 0,
    wrongTriggerSeq: 0,
    seenTriggerSeq: 0,
    wrongRenderAnchorMs: null,
    clueRevealLogicMs: new Map<string, number>(),
    winLogicMs: null,
  };
}

export function getGT009Clock(session: object): GT009ClockState {
  let st = RENDER_CLOCK.get(session);
  if (!st) {
    st = createClockState();
    RENDER_CLOCK.set(session, st);
  }
  return st;
}

export function resetGT009Clock(session: object): GT009ClockState {
  const st = createClockState();
  RENDER_CLOCK.set(session, st);
  return st;
}

export function buildGT009DisplayCandidates(
  candidates: readonly GT009CandidateItem[],
  layoutSeed: number
): readonly GT009CandidateItem[] {
  if (layoutSeed === 0 || candidates.length < 2) {
    return [...candidates];
  }
  const rng = deriveStream(layoutSeed, "items");
  for (let attempt = 0; attempt < 4; attempt++) {
    const mixed = shuffle(candidates, rng);
    if (
      mixed.some((cand, i) => cand.candidate_id !== candidates[i]?.candidate_id)
    ) {
      return mixed;
    }
  }
  return [
    candidates.at(-1) ?? candidates[0],
    ...candidates.slice(0, -1),
  ].filter((cand): cand is GT009CandidateItem => Boolean(cand));
}

export interface GT009LayoutInput {
  readonly clueCount: number;
  readonly candidateCount: number;
  readonly ageBand: AgeBand;
  readonly logicSpace: LogicSpace;
  readonly stageRect?: ZoneRect | null;
  readonly cssPerLogic?: number;
}

export interface GT009LayoutResult {
  readonly clueSlots: readonly Slot[];
  readonly candidateSlots: readonly Slot[];
  readonly allSlots: readonly Slot[];
  readonly clueBounds: SceneBox;
  readonly boardBounds: SceneBox;
}

function clampVal(v: number, min: number, max: number): number {
  return Math.max(min, Math.min(max, v));
}

function computeGroupBounds(
  slots: readonly Slot[],
  padX: number,
  padY: number,
  stage: ZoneRect
): SceneBox {
  if (slots.length === 0) {
    return { x: stage.x, y: stage.y, w: 0, h: 0 };
  }
  const left = Math.min(...slots.map((s) => s.x - s.w / 2));
  const right = Math.max(...slots.map((s) => s.x + s.w / 2));
  const top = Math.min(...slots.map((s) => s.y - s.h / 2));
  const bottom = Math.max(...slots.map((s) => s.y + s.h / 2));
  const x1 = clampVal(
    Math.round(left - padX),
    stage.x + 2,
    stage.x + stage.w - 2
  );
  const y1 = clampVal(
    Math.round(top - padY),
    stage.y + 2,
    stage.y + stage.h - 2
  );
  const x2 = clampVal(Math.round(right + padX), x1, stage.x + stage.w - 2);
  const y2 = clampVal(Math.round(bottom + padY), y1, stage.y + stage.h - 2);
  return { x: x1, y: y1, w: Math.max(0, x2 - x1), h: Math.max(0, y2 - y1) };
}

function resolveCandCols(
  candidateCount: number,
  clueRows: number,
  touchFloor: number,
  availW: number,
  availH: number
): number {
  const maxCols = Math.max(
    1,
    Math.floor((availW + SLOT_GAP_PX) / (touchFloor + SLOT_GAP_PX))
  );
  let cols =
    availW >= availH * 1.15 && candidateCount <= Math.min(5, maxCols)
      ? Math.min(5, maxCols, candidateCount)
      : Math.max(1, Math.min(maxCols, Math.ceil(candidateCount / 2)));
  const limit = Math.min(maxCols, candidateCount);
  while (cols < limit) {
    const tRows = clueRows + Math.ceil(candidateCount / cols);
    if (tRows * touchFloor + (tRows - 1) * SLOT_GAP_PX <= availH) {
      break;
    }
    cols += 1;
  }
  return cols;
}

interface RowMetrics {
  readonly gapX: number;
  readonly hitW: number;
  readonly roundX: boolean;
}

function buildGridRowSlots(params: {
  readonly count: number;
  readonly cols: number;
  readonly startIndex: number;
  readonly startY: number;
  readonly row: RowMetrics;
  readonly hitH: number;
  readonly gapY: number;
  readonly stageX: number;
  readonly availW: number;
  readonly role: "source" | "target";
}): Slot[] {
  const { hitW, gapX, roundX } = params.row;
  const out: Slot[] = [];
  for (let i = 0; i < params.count; i++) {
    const r = Math.floor(i / params.cols);
    const c = i % params.cols;
    const colsInRow = Math.min(params.cols, params.count - r * params.cols);
    const rowW = colsInRow * hitW + (colsInRow - 1) * gapX;
    const rawStartX = params.stageX + Math.max(0, (params.availW - rowW) / 2);
    const startX = roundX ? Math.round(rawStartX) : rawStartX;
    out.push({
      index: params.startIndex + i,
      x: startX + c * (hitW + gapX) + hitW / 2,
      y: params.startY + r * (params.hitH + params.gapY) + params.hitH / 2,
      w: hitW,
      h: params.hitH,
      hitW,
      hitH: params.hitH,
      page: 0,
      role: params.role,
    });
  }
  return out;
}

function splitOverlappingBounds(
  rawClue: SceneBox,
  rawBoard: SceneBox
): { readonly clueBounds: SceneBox; readonly boardBounds: SceneBox } {
  if (
    rawClue.h <= 0 ||
    rawBoard.h <= 0 ||
    rawClue.y + rawClue.h + 2 <= rawBoard.y
  ) {
    return { clueBounds: rawClue, boardBounds: rawBoard };
  }
  const midY = Math.round((rawClue.y + rawClue.h + rawBoard.y) / 2);
  const nextTop = midY + 1;
  return {
    clueBounds: { ...rawClue, h: Math.max(0, midY - 1 - rawClue.y) },
    boardBounds: {
      ...rawBoard,
      y: nextTop,
      h: Math.max(0, rawBoard.y + rawBoard.h - nextTop),
    },
  };
}

function resolveRowMetrics(
  cols: number,
  availW: number,
  touchFloor: number,
  maxW: number
): RowMetrics {
  const rawGapX =
    cols > 1 ? (availW - cols * touchFloor) / (cols - 1) : SLOT_GAP_PX;
  const roundX = rawGapX >= SLOT_GAP_PX;
  const gapX = roundX ? SLOT_GAP_PX : Math.max(0.25, rawGapX);
  const availColW = (availW - (cols - 1) * gapX) / cols;
  return {
    gapX,
    hitW: clampVal(Math.floor(availColW), touchFloor, maxW),
    roundX,
  };
}

export function computeGT009Layout(input: GT009LayoutInput): GT009LayoutResult {
  const clueCount = clampVal(Math.floor(input.clueCount), 1, 4);
  const candidateCount = clampVal(Math.floor(input.candidateCount), 1, 6);
  const touchFloor = resolveTouchFloor(input.ageBand, input.cssPerLogic);
  const stage: ZoneRect = input.stageRect ?? legacyStageArea(input.logicSpace);
  const availW = Math.max(touchFloor, stage.w);
  const availH = Math.max(touchFloor, stage.h);

  const fitsOneRow =
    clueCount * touchFloor + (clueCount - 1) * SLOT_GAP_PX <= availW;
  const clueRows = fitsOneRow ? 1 : 2;
  const clueCols = clueRows === 1 ? clueCount : Math.ceil(clueCount / 2);
  const candCols = resolveCandCols(
    candidateCount,
    clueRows,
    touchFloor,
    availW,
    availH
  );
  const candRows = Math.max(1, Math.ceil(candidateCount / candCols));
  const totalRows = clueRows + candRows;
  const numGapsY = Math.max(1, totalRows - 1);

  const rawGapY = (availH - totalRows * touchFloor) / numGapsY;
  const hasFullY = rawGapY >= SLOT_GAP_PX;
  const gapY = hasFullY ? SLOT_GAP_PX : Math.max(0.25, rawGapY);
  const extraH = Math.max(
    0,
    availH - (totalRows * touchFloor + numGapsY * gapY)
  );
  const sectionExtraY = hasFullY ? Math.min(12, Math.floor(extraH * 0.25)) : 0;
  const sectionGapY = gapY + sectionExtraY;
  const remainH = Math.max(0, extraH - sectionExtraY);

  const clueGrowH = hasFullY
    ? Math.min(
        Math.max(0, 92 - touchFloor),
        Math.floor((remainH * 0.35) / clueRows)
      )
    : 0;
  const clueHitH = touchFloor + clueGrowH;
  const afterClueH = Math.max(0, remainH - clueGrowH * clueRows);
  const cardGrowH = hasFullY
    ? Math.min(
        Math.max(0, 116 - touchFloor),
        Math.floor((afterClueH * 0.5) / candRows)
      )
    : 0;
  const cardHitH = touchFloor + cardGrowH;

  let maxClueW = 240;
  if (clueRows > 1) {
    maxClueW = 196;
  } else if (clueCount >= 3) {
    maxClueW = 210;
  }
  const clueRow = resolveRowMetrics(clueCols, availW, touchFloor, maxClueW);
  const candRow = resolveRowMetrics(candCols, availW, touchFloor, 118);

  const clueBlockH = clueRows * clueHitH + (clueRows - 1) * gapY;
  const candBlockH = candRows * cardHitH + (candRows - 1) * gapY;
  const totalBlockH = clueBlockH + sectionGapY + candBlockH;
  const rawStartY = stage.y + Math.max(0, (availH - totalBlockH) / 2);
  const startY = hasFullY ? Math.round(rawStartY) : rawStartY;

  const rawClueSlots = buildGridRowSlots({
    count: clueCount,
    cols: clueCols,
    startIndex: 0,
    startY,
    row: clueRow,
    hitH: clueHitH,
    gapY,
    stageX: stage.x,
    availW,
    role: "source",
  });
  const rawCandSlots = buildGridRowSlots({
    count: candidateCount,
    cols: candCols,
    startIndex: clueCount,
    startY: startY + clueBlockH + sectionGapY,
    row: candRow,
    hitH: cardHitH,
    gapY,
    stageX: stage.x,
    availW,
    role: "target",
  });

  const stageForInset = input.stageRect ?? undefined;
  const clueSlots = insetDrawSize(rawClueSlots, stageForInset);
  const candidateSlots = insetDrawSize(rawCandSlots, stageForInset);
  const { clueBounds, boardBounds } = splitOverlappingBounds(
    computeGroupBounds(clueSlots, 8, 5, stage),
    computeGroupBounds(candidateSlots, 10, 5, stage)
  );
  return {
    clueSlots,
    candidateSlots,
    allSlots: [...clueSlots, ...candidateSlots],
    clueBounds,
    boardBounds,
  };
}

export interface GT009CandidateDrawParams {
  readonly candidate: GT009CandidateItem;
  readonly state: GT009CandidateVisualState;
  readonly wrongProgress: number | null;
  readonly isHintSway: boolean;
  readonly isHintDimmed: boolean;
  readonly timeMs: number;
}

export interface GT009CandidatePose {
  readonly offsetX: number;
  readonly offsetY: number;
  readonly scale: number;
  readonly rotationRad: number;
  readonly baseDepth: number;
}

export function resolveGT009ClueScaleX(
  revealElapsedMs: number | null,
  reducedMotion: boolean
): number {
  if (
    reducedMotion ||
    revealElapsedMs === null ||
    revealElapsedMs < 0 ||
    revealElapsedMs >= GT009_CLUE_POP_MS
  ) {
    return 1;
  }
  return (
    0.86 +
    0.14 * Math.sin((revealElapsedMs / GT009_CLUE_POP_MS) * (Math.PI / 2))
  );
}

function makePose(
  offsetX: number,
  offsetY: number,
  scale: number,
  rotationRad: number,
  baseDepth: number
): GT009CandidatePose {
  return { offsetX, offsetY, scale, rotationRad, baseDepth };
}

function idlePose(
  slotIndex: number,
  p: GT009CandidateDrawParams,
  rm: boolean
): GT009CandidatePose {
  const w = !rm && p.isHintSway ? Math.sin(p.timeMs / 180 + slotIndex) : 0;
  return makePose(
    w * 2,
    0,
    p.isHintDimmed ? 0.96 : 1,
    w * 0.045,
    p.isHintDimmed ? 2 : 4
  );
}

export function resolveGT009CandidatePose(
  slotIndex: number,
  params: GT009CandidateDrawParams,
  rm: boolean
): GT009CandidatePose {
  if (params.state === "wrong") {
    const p = params.wrongProgress ?? 0;
    const shake = rm ? 0 : Math.sin(p * Math.PI * 5) * (1 - p) * 4.5;
    return makePose(shake, 0, 1, 0, 3);
  }
  if (params.state === "touching") {
    return makePose(0, rm ? 0 : 2, rm ? 1 : 0.96, 0, 2);
  }
  if (params.state === "eliminated") {
    return makePose(0, 1, 0.94, 0, 1.5);
  }
  if (params.state === "correct") {
    const sc = rm ? 1.03 : 1.04 + 0.02 * Math.sin(params.timeMs / 280);
    return makePose(0, rm ? 0 : -2, sc, 0, 4.5);
  }
  return idlePose(slotIndex, params, rm);
}

export function resolveGT009CandidateDrawSlot(
  sl: Slot,
  pose: GT009CandidatePose
): Slot {
  const maxW = Math.max(24, sl.hitW - 8);
  const maxH = Math.max(24, sl.hitH - 10);
  const w = Math.max(20, Math.min(maxW, Math.round(sl.w * pose.scale)));
  const h = Math.max(20, Math.min(maxH, Math.round(sl.h * pose.scale)));
  const maxDx = Math.max(0, (sl.hitW - w) / 2 - 2);
  const x = Math.max(sl.x - maxDx, Math.min(sl.x + maxDx, sl.x + pose.offsetX));
  const minY = sl.y - sl.hitH / 2 + h / 2 + 2;
  const maxY = sl.y + sl.hitH / 2 - h / 2 - 5;
  const y = Math.max(minY, Math.min(maxY, sl.y + pose.offsetY));
  return { ...sl, x, y, w, h };
}

export function stepGT009Particles(
  particles: readonly Particle[],
  deltaMs: number,
  stage?: ZoneRect
): Particle[] {
  if (particles.length === 0 || deltaMs <= 0) {
    return [...particles];
  }
  const ratio = clampVal(deltaMs / BASE_FRAME_MS, 0.05, 4);
  const out: Particle[] = [];
  for (const p of particles) {
    const life = p.life - (deltaMs / 1000) * 1.6;
    if (life <= 0) {
      continue;
    }
    const rx = p.x + p.vx * ratio;
    const ry = p.y + p.vy * ratio;
    const pad = Math.max(6, p.size + 2);
    const x = stage ? clampVal(rx, stage.x + pad, stage.x + stage.w - pad) : rx;
    const y = stage ? clampVal(ry, stage.y + pad, stage.y + stage.h - pad) : ry;
    out.push({ ...p, x, y, vy: p.vy + 0.22 * ratio, life });
  }
  return out;
}

export function spawnGT009CelebrateParticles(
  slot: Slot | undefined,
  particlesEnabled: boolean
): Particle[] {
  if (!(slot && particlesEnabled)) {
    return [];
  }
  const count = 14;
  const spawned: Particle[] = [];
  for (let i = 0; i < count; i++) {
    const angle = (Math.PI * 2 * i) / count;
    const speed = 1.6 + (i % 3) * 0.6;
    spawned.push({
      x: slot.x,
      y: slot.y,
      vx: Math.cos(angle) * speed,
      vy: Math.sin(angle) * speed - 1.2,
      color:
        CELEBRATE_COLORS[i % CELEBRATE_COLORS.length] ??
        dc.montessori.emeraldBright,
      size: 4 + (i % 3),
      life: 1,
      maxLife: 1,
    });
  }
  return spawned;
}

export function toGT009ClueEntityId(
  clueId: string,
  candidateIdSet: ReadonlySet<string>
): string {
  return candidateIdSet.has(clueId) ? `clue:${clueId}` : clueId;
}

export function buildGT009ViewEntities(params: {
  readonly clues: readonly GT009ClueItem[];
  readonly candidates: readonly GT009CandidateItem[];
  readonly slots: readonly Slot[];
  readonly revealedClueIds: readonly string[];
  readonly stateForCandidate: (id: string) => ViewEntity["state"];
}): ViewEntity[] {
  const clueCount = params.clues.length;
  const candidateIds = new Set(params.candidates.map((c) => c.candidate_id));
  const entities: ViewEntity[] = [];
  params.clues.forEach((clue, i) => {
    const slot = params.slots[i];
    if (!slot) {
      return;
    }
    const isRevealed = params.revealedClueIds.includes(clue.clue_id);
    entities.push({
      id: toGT009ClueEntityId(clue.clue_id, candidateIds),
      slotIndex: i,
      role: "target",
      state: isRevealed ? "selected" : "idle",
      x: slot.x,
      y: slot.y,
      w: Math.max(slot.hitW, slot.w),
      h: Math.max(slot.hitH, slot.h),
      hitShape: "square",
      spokenLabel: isRevealed ? clue.text : "Manh mối bí ẩn",
    });
  });
  params.candidates.forEach((cand, i) => {
    const slot = params.slots[clueCount + i];
    if (!slot) {
      return;
    }
    const labels =
      cand.asset && cand.asset.kind !== "text"
        ? resolveAssetLabels(cand.asset)
        : undefined;
    const valueStr = String(cand.value);
    entities.push({
      id: cand.candidate_id,
      slotIndex: clueCount + i,
      role: "source",
      state: params.stateForCandidate(cand.candidate_id),
      x: slot.x,
      y: slot.y,
      w: Math.max(slot.hitW, slot.w),
      h: Math.max(slot.hitH, slot.h),
      hitShape: "square",
      glyph: labels?.glyph,
      label: valueStr,
      spokenLabel: formatSpokenLabel(valueStr),
      spokenAudioPath: labels?.spokenAudioPath,
    });
  });
  return entities;
}

export function findGT009ViolatedClue(
  content: GT009Content,
  candidateId: string
): GT009ClueItem | null {
  if (!content.candidates.some((c) => c.candidate_id === candidateId)) {
    return null;
  }
  return (
    content.clues.find(
      (clue) =>
        !survivingCandidates(content, [clue.clue_id]).some(
          (c) => c.candidate_id === candidateId
        )
    ) ?? null
  );
}

export interface GT009HintState {
  readonly focusClue: GT009ClueItem | undefined;
  readonly focusClueEntityId: string | null;
  readonly contradictedAliveIds: readonly string[];
  readonly canvasHintCandidateIds: ReadonlySet<string>;
}

export function resolveGT009HintState(params: {
  readonly content: GT009Content;
  readonly candidates: readonly GT009CandidateItem[];
  readonly revealedClueIds: readonly string[];
  readonly eliminatedIds: ReadonlySet<string>;
}): GT009HintState {
  const answerId = params.content.answer_candidate_id;
  const candidateIdSet = new Set(params.candidates.map((c) => c.candidate_id));
  const wrongAliveIds = params.candidates
    .map((c) => c.candidate_id)
    .filter((id) => id !== answerId && !params.eliminatedIds.has(id));
  const firstUnrevealed = params.content.clues.find(
    (c) => !params.revealedClueIds.includes(c.clue_id)
  );
  const firstWrongId = wrongAliveIds[0];
  const fallbackClue = firstWrongId
    ? (findGT009ViolatedClue(params.content, firstWrongId) ??
      params.content.clues.at(-1))
    : params.content.clues.at(-1);
  const focusClue = firstUnrevealed ?? fallbackClue;
  const focusSurvivors = focusClue
    ? new Set(
        survivingCandidates(params.content, [focusClue.clue_id]).map(
          (c) => c.candidate_id
        )
      )
    : null;
  const contradictedAliveIds = focusSurvivors
    ? wrongAliveIds.filter((id) => !focusSurvivors.has(id))
    : [];
  const fallbackCanvasIds = firstUnrevealed === undefined ? wrongAliveIds : [];
  const canvasIds =
    contradictedAliveIds.length > 0 ? contradictedAliveIds : fallbackCanvasIds;
  return {
    focusClue,
    focusClueEntityId: focusClue
      ? toGT009ClueEntityId(focusClue.clue_id, candidateIdSet)
      : null,
    contradictedAliveIds,
    canvasHintCandidateIds: new Set(canvasIds),
  };
}

export function resolveGT009HintTargetForLevel(params: {
  readonly level: HintLevel;
  readonly content: GT009Content;
  readonly candidates: readonly GT009CandidateItem[];
  readonly revealedClueIds: readonly string[];
  readonly eliminatedIds: ReadonlySet<string>;
  readonly canCommit: boolean;
  readonly fallbackTarget: () => HintTarget | null;
}): HintTarget | null {
  const answerId = params.content.answer_candidate_id;
  if (params.canCommit && !params.eliminatedIds.has(answerId)) {
    return { kind: "action" };
  }
  const { focusClueEntityId, contradictedAliveIds } =
    resolveGT009HintState(params);
  const cluePart = focusClueEntityId ? [focusClueEntityId] : [];
  if (params.level === 1) {
    return { kind: "region", ids: cluePart };
  }
  if (params.level === 2) {
    const fallbackCand = params.eliminatedIds.has(answerId) ? [answerId] : [];
    const candPart =
      contradictedAliveIds.length > 0 ? contradictedAliveIds : fallbackCand;
    return { kind: "region", ids: [...cluePart, ...candPart] };
  }
  return params.fallbackTarget();
}

export function resolveGT009HintDemoSequence(params: {
  readonly level: HintLevel;
  readonly clueCount: number;
  readonly candidates: readonly GT009CandidateItem[];
  readonly eliminatedIds: ReadonlySet<string>;
  readonly answerId: string;
}): readonly HintDemoStep[] | null {
  if (params.level < 3) {
    return null;
  }
  const steps: HintDemoStep[] = [];
  const ansIdx = params.eliminatedIds.has(params.answerId)
    ? params.candidates.findIndex((c) => c.candidate_id === params.answerId)
    : -1;
  if (ansIdx >= 0) {
    steps.push({ from: params.clueCount + ansIdx });
  }
  for (let i = 0; i < params.candidates.length && steps.length < 3; i++) {
    const id = params.candidates[i]?.candidate_id;
    if (id && id !== params.answerId && !params.eliminatedIds.has(id)) {
      steps.push({ from: params.clueCount + i });
    }
  }
  return steps.length > 0 ? steps : null;
}

export function resolveGT009CandidateStates(params: {
  readonly baseState: ItemVisualState;
  readonly isCorrect: boolean;
  readonly eliminated: boolean;
  readonly isWrong: boolean;
  readonly isSelected: boolean;
  readonly isTouching: boolean;
}): {
  readonly itemState: ItemVisualState;
  readonly visualState: GT009CandidateVisualState;
} {
  if (params.isCorrect) {
    return { itemState: "correct", visualState: "correct" };
  }
  if (params.eliminated) {
    return { itemState: "locked", visualState: "eliminated" };
  }
  if (params.isWrong) {
    return { itemState: "wrong", visualState: "wrong" };
  }
  const active = params.isSelected || params.isTouching;
  return {
    itemState: params.isSelected ? "selected" : params.baseState,
    visualState: active ? "touching" : "idle",
  };
}
