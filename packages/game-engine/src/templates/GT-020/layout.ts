import type { AgeBand } from "#src/contracts/types";
import type { EngineView, EntityVisual, ViewEntity } from "#src/interaction";
import { resolveAssetLabels } from "#src/labels/spoken-keyword";
import { resolveLayout } from "#src/layout/registry";
import { dockRectAroundSlots, insetDrawSize } from "#src/layout/slot-fit";
import type { ZoneRect } from "#src/layout/stage-zones";
import type { Slot } from "#src/layout/types";
import { drawGT020BoardMat, drawGT020Card } from "#src/render/gt-020-shapes";
import {
  CARD_FLIP_MS,
  drawSceneBackground,
  type GT020CardVisualMode,
  type LogicSpace,
} from "#src/render/index";
import { deriveStream } from "#src/rng/mulberry32";
import { shuffle } from "#src/rng/shuffle";
import type { CardSystem } from "#src/systems/card-system";
import type { DegradationState } from "#src/systems/degradation";
import type {
  HintDemoStep,
  HintLevel,
  HintTarget,
} from "#src/systems/hint-ladder";
import type { RenderSystem } from "#src/systems/render-system";
import type { GT020Content } from "./template.js";

export interface FlatCard {
  readonly cardId: string;
  readonly pairKey: string;
  readonly pairIndex: number;
  readonly asset: GT020Content["pairs"][number]["card_a"]["asset"];
}

export interface GT020ClockState {
  logicMs: number;
  readonly lastFaceUp: Map<string, boolean>;
  readonly flipStartMs: Map<string, number>;
  readonly matchAtMs: Map<string, number>;
  readonly seenCardIds: Set<string>;
  l2PeekCardId: string | null;
  l2PeekRemainingMs: number;
  hoveredCardId: string | null;
  activeHintLevel: 0 | 1 | 2 | 3;
  autoRevealRemainingMs: number;
  prevOrderIds: readonly string[];
  boardRect: ZoneRect | undefined;
}

const CLOCK_MAP = new WeakMap<object, GT020ClockState>();

export function getGT020Clock(session: object): GT020ClockState {
  let state = CLOCK_MAP.get(session);
  if (!state) {
    state = {
      logicMs: 0,
      lastFaceUp: new Map<string, boolean>(),
      flipStartMs: new Map<string, number>(),
      matchAtMs: new Map<string, number>(),
      seenCardIds: new Set<string>(),
      l2PeekCardId: null,
      l2PeekRemainingMs: 0,
      hoveredCardId: null,
      activeHintLevel: 0,
      autoRevealRemainingMs: 0,
      prevOrderIds: [],
      boardRect: undefined,
    };
    CLOCK_MAP.set(session, state);
  }
  return state;
}

export function clearGT020Clock(session: object): void {
  CLOCK_MAP.delete(session);
}

export function shuffleGT020Cards(
  session: object,
  pairs: GT020Content["pairs"],
  layoutSeed: number,
  roundGen: number
): readonly FlatCard[] {
  const clock = getGT020Clock(session);
  const prevOrder = clock.prevOrderIds;
  clock.logicMs = 0;
  clock.lastFaceUp.clear();
  clock.flipStartMs.clear();
  clock.matchAtMs.clear();
  clock.seenCardIds.clear();
  clock.l2PeekCardId = null;
  clock.l2PeekRemainingMs = 0;
  clock.hoveredCardId = null;
  clock.activeHintLevel = 0;
  clock.autoRevealRemainingMs = 0;

  const flat: FlatCard[] = pairs.flatMap((p, pairIndex) => [
    {
      cardId: p.card_a.card_id,
      pairKey: p.pair_key,
      pairIndex,
      asset: p.card_a.asset,
    },
    {
      cardId: p.card_b.card_id,
      pairKey: p.pair_key,
      pairIndex,
      asset: p.card_b.asset,
    },
  ]);

  const seed = roundGen <= 0 ? layoutSeed : layoutSeed + roundGen * 7919;
  let ordered = shuffle(flat, deriveStream(seed, "items"));
  const sameAsPrev =
    roundGen >= 1 &&
    ordered.length >= 2 &&
    prevOrder.length === ordered.length &&
    ordered.every((c, idx) => c.cardId === prevOrder[idx]);
  if (sameAsPrev) {
    const shift = 1 + (roundGen % (ordered.length - 1));
    ordered = [...ordered.slice(shift), ...ordered.slice(0, shift)];
  }
  clock.prevOrderIds = ordered.map((c) => c.cardId);
  return ordered;
}

export function computeGT020Slots(
  session: object,
  slotCount: number,
  ageBand: AgeBand,
  logic: LogicSpace,
  stage: ZoneRect | undefined,
  cssPerLogic: number
): readonly Slot[] {
  const layoutFn = resolveLayout(slotCount <= 6 ? "grid" : "card-flip-grid");
  const raw = layoutFn({ slotCount, ageBand, logic, stage, cssPerLogic });
  const slots = insetDrawSize(raw, stage);
  getGT020Clock(session).boardRect = dockRectAroundSlots(slots, stage);
  return slots;
}

export function tickGT020Clock(session: object, deltaMs: number): void {
  const step = Math.max(0, deltaMs);
  const clock = getGT020Clock(session);
  clock.logicMs += step;
  if (clock.l2PeekRemainingMs > 0) {
    clock.l2PeekRemainingMs = Math.max(0, clock.l2PeekRemainingMs - step);
    if (clock.l2PeekRemainingMs === 0) {
      clock.l2PeekCardId = null;
    }
  }
  if (clock.autoRevealRemainingMs > 0) {
    clock.autoRevealRemainingMs = Math.max(
      0,
      clock.autoRevealRemainingMs - step
    );
  }
}

export function markGT020CardSeen(session: object, cardId: string): void {
  const clock = getGT020Clock(session);
  clock.seenCardIds.add(cardId);
  if (clock.l2PeekCardId !== null) {
    clock.l2PeekCardId = null;
    clock.l2PeekRemainingMs = 0;
  }
}

export function markGT020PairMatched(
  session: object,
  pairKey: string,
  cards: readonly FlatCard[]
): void {
  const clock = getGT020Clock(session);
  for (const card of cards) {
    if (card.pairKey === pairKey) {
      clock.matchAtMs.set(card.cardId, -1);
    }
  }
}

export interface GT020HintPair {
  readonly cardA: FlatCard;
  readonly idxA: number;
  readonly cardB: FlatCard;
  readonly idxB: number;
  readonly nextTapCard: FlatCard;
  readonly nextTapIdx: number;
  readonly hasOneOpen: boolean;
}

export interface GT020HintContext {
  readonly session: object;
  readonly displayCards: readonly FlatCard[];
  readonly cardSystem: CardSystem;
  readonly isWon: boolean;
  readonly isPeeking: boolean;
  readonly roundClosedOnWrong: boolean;
  readonly hasOpenMismatch: boolean;
}

function findOpenCardHintPair(ctx: GT020HintContext): GT020HintPair | null {
  if (ctx.hasOpenMismatch) {
    return null;
  }
  const openIdx = ctx.displayCards.findIndex(
    (c) => ctx.cardSystem.getCard(c.cardId)?.state === "face_up"
  );
  const openCard = openIdx >= 0 ? ctx.displayCards[openIdx] : undefined;
  if (!openCard) {
    return null;
  }
  const partnerIdx = ctx.displayCards.findIndex(
    (c) =>
      c.pairKey === openCard.pairKey &&
      c.cardId !== openCard.cardId &&
      ctx.cardSystem.getCard(c.cardId)?.state === "face_down"
  );
  const partnerCard =
    partnerIdx >= 0 ? ctx.displayCards[partnerIdx] : undefined;
  if (!partnerCard) {
    return null;
  }
  return {
    cardA: openCard,
    idxA: openIdx,
    cardB: partnerCard,
    idxB: partnerIdx,
    nextTapCard: partnerCard,
    nextTapIdx: partnerIdx,
    hasOneOpen: true,
  };
}

function buildUnopenedHintCandidate(
  ctx: GT020HintContext,
  seenIds: ReadonlySet<string>,
  idxA: number,
  cardA: FlatCard
): readonly [GT020HintPair, number] | null {
  if (ctx.cardSystem.getCard(cardA.cardId)?.state === "matched") {
    return null;
  }
  const idxB = ctx.displayCards.findIndex(
    (c, j) => j > idxA && c.pairKey === cardA.pairKey
  );
  const cardB = idxB >= 0 ? ctx.displayCards[idxB] : undefined;
  if (!cardB) {
    return null;
  }
  const seenA = seenIds.has(cardA.cardId) ? 1 : 0;
  const seenB = seenIds.has(cardB.cardId) ? 1 : 0;
  const [nextTapCard, nextTapIdx] =
    seenB > seenA ? [cardB, idxB] : [cardA, idxA];
  return [
    { cardA, idxA, cardB, idxB, nextTapCard, nextTapIdx, hasOneOpen: false },
    seenA + seenB,
  ];
}

export function resolveGT020HintPair(
  ctx: GT020HintContext
): GT020HintPair | null {
  if (ctx.isWon || ctx.isPeeking || ctx.roundClosedOnWrong) {
    return null;
  }
  const openPair = findOpenCardHintPair(ctx);
  if (openPair) {
    return openPair;
  }
  const seenIds = getGT020Clock(ctx.session).seenCardIds;
  let best: GT020HintPair | null = null;
  let bestScore = -1;
  const visited = new Set<string>();

  for (let i = 0; i < ctx.displayCards.length; i++) {
    const cardA = ctx.displayCards[i];
    if (!cardA || visited.has(cardA.pairKey)) {
      continue;
    }
    const candidate = buildUnopenedHintCandidate(ctx, seenIds, i, cardA);
    if (!candidate) {
      continue;
    }
    visited.add(cardA.pairKey);
    if (candidate[1] > bestScore) {
      [best, bestScore] = candidate;
    }
  }
  return best;
}

export function escalateGT020Scaffold(
  ctx: GT020HintContext,
  level: 1 | 2 | 3
): void {
  const clock = getGT020Clock(ctx.session);
  clock.activeHintLevel = level;
  if (level === 2) {
    const pair = resolveGT020HintPair(ctx);
    if (pair) {
      clock.l2PeekCardId = pair.nextTapCard.cardId;
      clock.l2PeekRemainingMs = 900;
    }
  } else {
    clock.l2PeekCardId = null;
    clock.l2PeekRemainingMs = 0;
  }
}

export function clearGT020Hint(session: object): void {
  const clock = getGT020Clock(session);
  clock.activeHintLevel = 0;
  clock.l2PeekCardId = null;
  clock.l2PeekRemainingMs = 0;
}

export function buildGT020HintTarget(
  ctx: GT020HintContext,
  level: 1 | 2 | 3
): HintTarget | null {
  const pair = resolveGT020HintPair(ctx);
  if (!pair) {
    return null;
  }
  if (level === 1) {
    return { kind: "region", ids: [pair.nextTapCard.cardId] };
  }
  if (level === 2) {
    return { kind: "region", ids: [pair.cardA.cardId, pair.cardB.cardId] };
  }
  return { kind: "slot", index: pair.nextTapIdx };
}

export function buildGT020HintDemoSequence(
  ctx: GT020HintContext,
  level: HintLevel
): readonly HintDemoStep[] | null {
  if (level < 3) {
    return null;
  }
  const pair = resolveGT020HintPair(ctx);
  if (!pair) {
    return null;
  }
  return pair.hasOneOpen
    ? [{ from: pair.nextTapIdx }]
    : [{ from: pair.idxA }, { from: pair.idxB }];
}

export interface GT020ViewContext extends GT020HintContext {
  readonly prompt: string;
  readonly slots: readonly Slot[];
  readonly mismatchElapsedMs: number;
  readonly flipBackDelayMs: number;
  readonly themeId: Parameters<typeof drawSceneBackground>[2];
  readonly degradation: DegradationState | null;
}

function resolveEntityVisual(
  raw: string,
  faceUp: boolean,
  hovered: boolean
): EntityVisual {
  if (raw === "matched") {
    return "correct";
  }
  if (faceUp) {
    return "selected";
  }
  return hovered ? "active" : "idle";
}

export function buildGT020View(ctx: GT020ViewContext): EngineView {
  const clock = getGT020Clock(ctx.session);
  const autoRev = ctx.roundClosedOnWrong && clock.autoRevealRemainingMs > 0;
  const entities: ViewEntity[] = ctx.displayCards.map((card, slotIndex) => {
    const slot = ctx.slots[slotIndex];
    const raw = ctx.cardSystem.getCard(card.cardId)?.state ?? "face_down";
    const faceUp =
      raw === "face_up" || raw === "matched" || ctx.isPeeking || autoRev;
    const state = resolveEntityVisual(
      raw,
      faceUp,
      clock.hoveredCardId === card.cardId
    );
    const labels = faceUp ? resolveAssetLabels(card.asset) : {};
    return {
      ...slot,
      id: card.cardId,
      slotIndex,
      role: "target",
      state,
      x: slot?.x ?? 0,
      y: slot?.y ?? 0,
      w: slot?.w ?? 80,
      h: slot?.h ?? 80,
      hitShape: "square",
      ...labels,
    };
  });
  return { activePrompt: ctx.prompt, entities };
}

function resolveCardHintLevel(
  cardId: string,
  lvl: 0 | 1 | 2 | 3,
  pair: GT020HintPair | null
): 0 | 1 | 2 | 3 {
  if (lvl === 0 || !pair) {
    return 0;
  }
  if (lvl === 1) {
    return cardId === pair.nextTapCard.cardId ? 1 : 0;
  }
  return cardId === pair.cardA.cardId || cardId === pair.cardB.cardId ? lvl : 0;
}

function updateCardTimings(
  clock: GT020ClockState,
  cardId: string,
  rawState: string,
  isFaceUp: boolean,
  nowMs: number
): readonly [number, number | null] {
  const previous = clock.lastFaceUp.get(cardId);
  if (previous !== undefined && previous !== isFaceUp) {
    clock.flipStartMs.set(cardId, nowMs);
  }
  clock.lastFaceUp.set(cardId, isFaceUp);

  const startMs = clock.flipStartMs.get(cardId);
  const flipElapsedMs =
    startMs === undefined ? CARD_FLIP_MS : Math.max(0, nowMs - startMs);
  if (flipElapsedMs >= CARD_FLIP_MS) {
    clock.flipStartMs.delete(cardId);
  }

  let matchElapsedMs: number | null = null;
  if (rawState === "matched") {
    const mStart = clock.matchAtMs.get(cardId);
    if (mStart === -1 || mStart === undefined) {
      clock.matchAtMs.set(cardId, nowMs);
      matchElapsedMs = 0;
    } else {
      matchElapsedMs = Math.max(0, nowMs - mStart);
    }
  }
  return [flipElapsedMs, matchElapsedMs];
}

function resolveCardMode(
  rawState: string,
  isFaceUp: boolean,
  isAutoRevealing: boolean,
  hasOpenMismatch: boolean,
  isHovered: boolean
): GT020CardVisualMode {
  if (rawState === "matched") {
    return "matched";
  }
  if (isAutoRevealing && rawState === "face_down") {
    return "auto_reveal";
  }
  if (hasOpenMismatch && rawState === "face_up") {
    return "mismatch_open";
  }
  if (isFaceUp) {
    return "face_up";
  }
  return isHovered ? "hovered" : "face_down";
}

export function renderGT020Board(
  canvasCtx: CanvasRenderingContext2D,
  rs: RenderSystem,
  ctx: GT020ViewContext,
  timeMs: number
): void {
  const clock = getGT020Clock(ctx.session);
  const nowMs = timeMs > 0 ? timeMs : clock.logicMs;
  const autoReveal = ctx.roundClosedOnWrong && clock.autoRevealRemainingMs > 0;
  const hintPair = clock.activeHintLevel > 0 ? resolveGT020HintPair(ctx) : null;
  const mismatchRatio =
    ctx.flipBackDelayMs > 0
      ? Math.min(1, ctx.mismatchElapsedMs / ctx.flipBackDelayMs)
      : 0;
  const showParticles = ctx.degradation?.particles_enabled ?? true;

  drawSceneBackground(canvasCtx, rs, ctx.themeId);
  drawGT020BoardMat(canvasCtx, rs, clock.boardRect, ctx.isPeeking);

  for (let i = 0; i < ctx.displayCards.length; i++) {
    const card = ctx.displayCards[i];
    const slot = ctx.slots[i];
    if (!(card && slot)) {
      continue;
    }
    const raw = ctx.cardSystem.getCard(card.cardId)?.state ?? "face_down";
    const isL2 =
      clock.l2PeekRemainingMs > 0 && clock.l2PeekCardId === card.cardId;
    const isFaceUp = raw !== "face_down" || ctx.isPeeking || isL2 || autoReveal;
    const isHovered = clock.hoveredCardId === card.cardId;
    const [flipElapsedMs, matchElapsedMs] = updateCardTimings(
      clock,
      card.cardId,
      raw,
      isFaceUp,
      nowMs
    );
    const mode = resolveCardMode(
      raw,
      isFaceUp,
      autoReveal,
      ctx.hasOpenMismatch,
      isHovered
    );
    const hintLevel = resolveCardHintLevel(
      card.cardId,
      clock.activeHintLevel,
      hintPair
    );

    drawGT020Card(canvasCtx, rs, {
      slot,
      asset: card.asset,
      pairIndex: card.pairIndex,
      mode,
      isFaceUp,
      isHovered,
      isDimmedByMismatch: ctx.hasOpenMismatch && !isFaceUp,
      flipElapsedMs,
      mismatchRatio,
      matchElapsedMs,
      hintLevel,
      timeMs: nowMs,
      showParticles,
    });
  }
}
