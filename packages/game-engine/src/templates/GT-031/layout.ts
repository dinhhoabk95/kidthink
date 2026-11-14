/**
 * Bố cục, đồng hồ hiệu ứng, hoán vị N7 và giải thuật gợi ý cho GT-031.
 *
 * Strict TypeScript: CẤM any, CẤM unknown, CẤM as T (ngoài as const).
 * Import alias: dùng `#src/...`, CẤM `../`.
 */

import type { GameActionValue } from "#src/game-session";
import { splitCaption } from "#src/layout/slot-fit";
import type { ZoneRect } from "#src/layout/stage-zones";
import type { Slot } from "#src/layout/types";
import { deriveStream } from "#src/rng/mulberry32";

export interface GT031DepositedCoinView {
  value: number;
  rank: number;
}

import { shuffle } from "#src/rng/shuffle";
import {
  type GT031Content,
  pickCoinHint,
} from "#src/templates/GT-031/template";

export type GT031Coin = GT031Content["coins"][number];

export interface GT031ActionPayload {
  readonly coin_id?: string;
  readonly id?: string;
}

export interface GT031VisualState {
  simMs: number;
  lastSeenRenderMs: number;
  depositRenderAnchorMs: number | null;
  depositSimAnchorMs: number | null;
  counterFrom: number;
  counterTo: number;
  counterStartRenderMs: number;
  counterStartSimMs: number;
  counterDurationMs: number;
  wrongAnchorRenderMs: number | null;
  wrongAnchorSimMs: number | null;
  wrongDurationMs: number;
  encourageUntilMs: number | null;
  hoveredCoinId: string | null;
  hintTargetId: string | null;
  hintLevel: 0 | 1 | 2 | 3;
  isClosedWrong: boolean;
}

const visualStateStore = new WeakMap<object, GT031VisualState>();

export function getGT031VisualState(key: object): GT031VisualState {
  const existing = visualStateStore.get(key);
  if (existing) {
    return existing;
  }
  const fresh: GT031VisualState = {
    simMs: 0,
    lastSeenRenderMs: 0,
    depositRenderAnchorMs: null,
    depositSimAnchorMs: null,
    counterFrom: 0,
    counterTo: 0,
    counterStartRenderMs: 0,
    counterStartSimMs: 0,
    counterDurationMs: 0,
    wrongAnchorRenderMs: null,
    wrongAnchorSimMs: null,
    wrongDurationMs: 1200,
    encourageUntilMs: null,
    hoveredCoinId: null,
    hintTargetId: null,
    hintLevel: 0,
    isClosedWrong: false,
  };
  visualStateStore.set(key, fresh);
  return fresh;
}

export function deleteGT031VisualState(key: object): void {
  visualStateStore.delete(key);
}

export function resetGT031VisualState(key: object): GT031VisualState {
  visualStateStore.delete(key);
  return getGT031VisualState(key);
}

export function markDepositAnchor(state: GT031VisualState): void {
  state.depositRenderAnchorMs = state.lastSeenRenderMs;
  state.depositSimAnchorMs = state.simMs;
}

export function clearDepositAnchor(state: GT031VisualState): void {
  state.depositRenderAnchorMs = null;
  state.depositSimAnchorMs = null;
}

export function startCounterAnim(
  state: GT031VisualState,
  from: number,
  to: number,
  reducedMotion: boolean
): void {
  state.counterFrom = from;
  state.counterTo = to;
  state.counterStartRenderMs = state.lastSeenRenderMs;
  state.counterStartSimMs = state.simMs;
  state.counterDurationMs = reducedMotion ? 90 : 220;
}

export function sampleDisplayedTotal(
  state: GT031VisualState,
  renderTimeMs: number,
  actualTotal: number,
  reducedMotion: boolean
): number {
  const duration = reducedMotion ? 90 : 220;
  if (state.counterDurationMs <= 0 || state.counterTo !== actualTotal) {
    return actualTotal;
  }
  const renderDelta = Math.max(0, renderTimeMs - state.counterStartRenderMs);
  const simDelta = Math.max(0, state.simMs - state.counterStartSimMs);
  const elapsed = Math.max(renderDelta, simDelta);
  if (elapsed >= duration) {
    return actualTotal;
  }
  const t = elapsed / duration;
  const eased = 1 - (1 - t) * (1 - t);
  return state.counterFrom + (state.counterTo - state.counterFrom) * eased;
}

export function samplePiggyElapsedMs(
  state: GT031VisualState,
  renderTimeMs: number
): number {
  if (
    state.depositRenderAnchorMs === null ||
    state.depositSimAnchorMs === null
  ) {
    return Number.POSITIVE_INFINITY;
  }
  const renderDelta = Math.max(0, renderTimeMs - state.depositRenderAnchorMs);
  const simDelta = Math.max(0, state.simMs - state.depositSimAnchorMs);
  return Math.max(renderDelta, simDelta);
}

export function sampleWrongIntensity(
  state: GT031VisualState,
  renderTimeMs: number
): number {
  if (state.wrongAnchorRenderMs === null || state.wrongAnchorSimMs === null) {
    return 0;
  }
  const renderDelta = Math.max(0, renderTimeMs - state.wrongAnchorRenderMs);
  const simDelta = Math.max(0, state.simMs - state.wrongAnchorSimMs);
  const elapsed = Math.max(renderDelta, simDelta);
  if (elapsed >= state.wrongDurationMs) {
    return 0;
  }
  return 1 - elapsed / state.wrongDurationMs;
}

function matchesCoinOrder(
  a: readonly GT031Coin[],
  b: readonly GT031Coin[]
): boolean {
  return (
    a.length === b.length &&
    a.every((coin, idx) => coin.coin_id === b[idx]?.coin_id)
  );
}

export function derangeCoins(
  coins: readonly GT031Coin[],
  layoutSeed: number,
  roundIndex = 0,
  prevOrder?: readonly GT031Coin[]
): readonly GT031Coin[] {
  if (layoutSeed <= 0 || coins.length <= 1) {
    return coins;
  }
  const rng = deriveStream(layoutSeed + roundIndex * 7919, "items");
  const shuffled = shuffle([...coins], rng);
  if (
    (matchesCoinOrder(shuffled, coins) ||
      (prevOrder && matchesCoinOrder(shuffled, prevOrder))) &&
    shuffled.length >= 2
  ) {
    const first = shuffled.shift();
    if (first) {
      shuffled.push(first);
    }
    if (
      prevOrder &&
      matchesCoinOrder(shuffled, prevOrder) &&
      shuffled.length >= 2
    ) {
      const a = shuffled[0];
      const b = shuffled[1];
      if (a && b) {
        shuffled[0] = b;
        shuffled[1] = a;
      }
    }
  }
  return shuffled;
}

function findExactSubset(
  coins: readonly GT031Coin[],
  needed: number
): readonly GT031Coin[] | null {
  if (needed === 0) {
    return [];
  }
  if (needed < 0) {
    return null;
  }

  const sorted = [...coins].sort((a, b) => b.value - a.value);
  let best: GT031Coin[] | null = null;

  const dfs = (index: number, sum: number, picked: GT031Coin[]): void => {
    if (sum === needed) {
      if (best === null || picked.length < best.length) {
        best = [...picked];
      }
      return;
    }
    if (sum > needed || index >= sorted.length) {
      return;
    }
    if (best !== null && picked.length >= best.length) {
      return;
    }

    const current = sorted[index];
    if (!current) {
      return;
    }
    picked.push(current);
    dfs(index + 1, sum + current.value, picked);
    picked.pop();
    dfs(index + 1, sum, picked);
  };

  dfs(0, 0, []);
  return best;
}

export interface GT031HintStep {
  kind: "deposit" | "remove" | "submit";
  coinId: string | null;
}

function resolveExactHintStep(
  coins: readonly GT031Coin[],
  depositedIds: readonly string[],
  depositedSet: ReadonlySet<string>,
  currentTotal: number,
  targetAmount: number
): GT031HintStep {
  if (currentTotal === targetAmount) {
    return { kind: "submit", coinId: "payment_target" };
  }
  const remaining = coins.filter((c) => !depositedSet.has(c.coin_id));
  const subset = findExactSubset(remaining, targetAmount - currentTotal);
  if (subset && subset.length > 0) {
    return { kind: "deposit", coinId: subset[0]?.coin_id ?? null };
  }
  if (depositedIds.length > 0) {
    return { kind: "remove", coinId: depositedIds.at(-1) ?? null };
  }
  return { kind: "deposit", coinId: null };
}

function resolveLooseHintStep(
  coins: readonly GT031Coin[],
  depositedIds: readonly string[],
  depositedSet: ReadonlySet<string>,
  currentTotal: number,
  targetAmount: number
): GT031HintStep {
  if (currentTotal >= targetAmount) {
    return { kind: "submit", coinId: "payment_target" };
  }
  const picked = pickCoinHint(coins, depositedIds, targetAmount);
  if (picked && picked.action === "deposit") {
    return { kind: "deposit", coinId: picked.coin_id };
  }
  const remaining = coins.filter((c) => !depositedSet.has(c.coin_id));
  const deficit = targetAmount - currentTotal;
  const enoughSingle = remaining
    .filter((c) => c.value >= deficit)
    .sort((a, b) => a.value - b.value)[0];
  if (enoughSingle) {
    return { kind: "deposit", coinId: enoughSingle.coin_id };
  }
  const largest = [...remaining].sort((a, b) => b.value - a.value)[0];
  return { kind: "deposit", coinId: largest ? largest.coin_id : null };
}

export function resolveNextHintStep(
  coins: readonly GT031Coin[],
  depositedIds: readonly string[],
  targetAmount: number,
  exactChange: boolean
): GT031HintStep {
  const depositedSet = new Set(depositedIds);
  const currentTotal = coins.reduce(
    (acc, c) => (depositedSet.has(c.coin_id) ? acc + c.value : acc),
    0
  );
  return exactChange
    ? resolveExactHintStep(
        coins,
        depositedIds,
        depositedSet,
        currentTotal,
        targetAmount
      )
    : resolveLooseHintStep(
        coins,
        depositedIds,
        depositedSet,
        currentTotal,
        targetAmount
      );
}

export function resolveHintTargetForLevel(
  level: 1 | 2 | 3,
  coins: readonly GT031Coin[],
  depositedIds: readonly string[],
  targetAmount: number,
  exactChange: boolean
): string | null {
  if (level === 1) {
    return "total_meter";
  }
  const step = resolveNextHintStep(
    coins,
    depositedIds,
    targetAmount,
    exactChange
  );
  return step.coinId;
}

export function resolveHintDemoSequence(
  level: 1 | 2 | 3,
  coins: readonly GT031Coin[],
  depositedIds: readonly string[],
  targetAmount: number,
  exactChange: boolean
): readonly GT031HintStep[] {
  if (level < 3) {
    return [];
  }
  const sequence: GT031HintStep[] = [];
  const simulated = [...depositedIds];
  for (let i = 0; i < 3; i++) {
    const step = resolveNextHintStep(
      coins,
      simulated,
      targetAmount,
      exactChange
    );
    if (!step.coinId || step.kind === "submit") {
      break;
    }
    sequence.push(step);
    if (step.kind === "deposit") {
      simulated.push(step.coinId);
    } else {
      const idx = simulated.lastIndexOf(step.coinId);
      if (idx >= 0) {
        simulated.splice(idx, 1);
      }
    }
  }
  return sequence;
}

export function buildCoinRankMap(
  coins: readonly GT031Coin[]
): ReadonlyMap<number, number> {
  const distinct = [...new Set(coins.map((c) => c.value))].sort(
    (a, b) => a - b
  );
  const map = new Map<number, number>();
  distinct.forEach((val, idx) => {
    map.set(val, idx);
  });
  return map;
}

export function computeSolutionSubset(
  coins: readonly GT031Coin[],
  targetAmount: number,
  exactChange: boolean
): readonly GT031DepositedCoinView[] {
  const rankByVal = buildCoinRankMap(coins);
  const exact = findExactSubset(coins, targetAmount);
  if (exact && exact.length > 0) {
    return exact.map((c) => ({
      value: c.value,
      rank: rankByVal.get(c.value) ?? 0,
    }));
  }
  if (!exactChange) {
    const sorted = [...coins].sort((a, b) => b.value - a.value);
    const picked: GT031DepositedCoinView[] = [];
    let sum = 0;
    for (const c of sorted) {
      if (sum >= targetAmount) {
        break;
      }
      sum += c.value;
      picked.push({ value: c.value, rank: rankByVal.get(c.value) ?? 0 });
    }
    return picked;
  }
  return [];
}

export function computeTotalMeterRect(
  stageRect: ZoneRect,
  _targetSlot: Slot
): ZoneRect {
  const caption = splitCaption(stageRect).caption;
  const meterW = Math.min(240, Math.max(120, caption.w - 16));
  const meterH = Math.min(38, Math.max(28, caption.h - 6));
  return {
    x: caption.x + (caption.w - meterW) / 2,
    y: caption.y + Math.max(2, (caption.h - meterH) / 2),
    w: meterW,
    h: meterH,
  };
}

export function computeDepositedStackLayout(
  coins: readonly { value: number; rank: number }[],
  targetSlot: Slot,
  bodyRect: ZoneRect,
  softShadowsEnabled: boolean,
  reducedMotion: boolean
): {
  plate: ZoneRect | null;
  items: {
    cx: number;
    cy: number;
    r: number;
    ry: number;
    value: number;
    rank: number;
  }[];
} {
  if (coins.length === 0) {
    return { plate: null, items: [] };
  }
  const leftAvail = targetSlot.x - targetSlot.w / 2 - 8 - (bodyRect.x + 6);
  const zoneW =
    leftAvail >= 44
      ? Math.min(110, leftAvail)
      : Math.min(110, targetSlot.w * 0.8);
  const zoneX =
    leftAvail >= 44
      ? targetSlot.x - targetSlot.w / 2 - 8 - zoneW
      : Math.max(bodyRect.x + 6, targetSlot.x - zoneW / 2);
  const n = Math.min(coins.length, 5);
  const r = Math.max(11, Math.min(17, zoneW * 0.18));
  const sp = Math.min(
    r * 1.5,
    Math.max(12, (zoneW - r * 2) / Math.max(1, n - 1))
  );
  const cy = Math.min(
    bodyRect.y + bodyRect.h - r - 8,
    targetSlot.y + targetSlot.h * 0.2
  );
  const plate: ZoneRect | null =
    leftAvail >= 44
      ? {
          x: Math.max(bodyRect.x + 1, zoneX),
          y: Math.max(bodyRect.y + 1, cy - r - 6),
          w: zoneW,
          h: r * 2 + 12,
        }
      : null;
  const ry = !reducedMotion && softShadowsEnabled ? r * 0.84 : r;
  const items: {
    cx: number;
    cy: number;
    r: number;
    ry: number;
    value: number;
    rank: number;
  }[] = [];
  for (let i = 0; i < n; i++) {
    const coin = coins[i];
    if (!coin) {
      continue;
    }
    const rawCx = zoneX + zoneW / 2 - ((n - 1) * sp) / 2 + i * sp;
    const cx = Math.max(
      bodyRect.x + r + 4,
      Math.min(bodyRect.x + bodyRect.w - r - 4, rawCx)
    );
    items.push({ cx, cy, r, ry, value: coin.value, rank: coin.rank });
  }
  return { plate, items };
}

export function computeSolutionGhostPills(
  solutionCoins: readonly { value: number; rank: number }[],
  targetSlot: Slot,
  bodyRect: ZoneRect,
  piggyBox?: { cx: number; cy: number; size: number } | null
): { rect: ZoneRect; value: number; rank: number }[] {
  if (solutionCoins.length === 0) {
    return [];
  }
  const n = Math.min(solutionCoins.length, 6);
  const pw = Math.min(34, (bodyRect.w * 0.72) / n);
  const ph = 22;
  const tw = n * pw + (n - 1) * 6;
  const sx = Math.max(
    bodyRect.x + 6,
    Math.min(bodyRect.x + bodyRect.w - tw - 6, targetSlot.x - tw / 2)
  );
  const ay = piggyBox
    ? piggyBox.cy + piggyBox.size * 0.56
    : targetSlot.y + targetSlot.h * 0.34;
  const y = Math.max(
    bodyRect.y + 6,
    Math.min(bodyRect.y + bodyRect.h - ph - 4, ay)
  );
  const pills: { rect: ZoneRect; value: number; rank: number }[] = [];
  for (let i = 0; i < n; i++) {
    const coin = solutionCoins[i];
    if (!coin) {
      continue;
    }
    pills.push({
      rect: { x: sx + i * (pw + 6), y, w: pw, h: ph },
      value: coin.value,
      rank: coin.rank,
    });
  }
  return pills;
}

export function computeTargetDecorLayout(
  targetSlot: Slot,
  bodyRect: ZoneRect,
  targetAmount: number
): { box: ZoneRect; dots: { x: number; y: number }[] } {
  const x = Math.max(bodyRect.x + 1, targetSlot.x - targetSlot.w / 2 - 4);
  const y = Math.max(bodyRect.y + 1, targetSlot.y - targetSlot.h / 2 - 4);
  const box: ZoneRect = {
    x,
    y,
    w: Math.min(targetSlot.w + 8, Math.max(4, bodyRect.x + bodyRect.w - 1 - x)),
    h: Math.min(targetSlot.h + 8, Math.max(4, bodyRect.y + bodyRect.h - 1 - y)),
  };
  const count = Math.min(10, Math.max(0, targetAmount));
  const cols = Math.min(5, Math.max(1, count));
  const gap = Math.min(10, (targetSlot.w * 0.6) / cols);
  const startX = targetSlot.x - ((cols - 1) * gap) / 2;
  const topY = Math.max(bodyRect.y + 8, targetSlot.y - targetSlot.h * 0.36);
  const dots: { x: number; y: number }[] = [];
  for (let i = 0; i < count; i++) {
    dots.push({
      x: startX + (i % 5) * gap,
      y: topY + Math.floor(i / 5) * 9,
    });
  }
  return { box, dots };
}

export function computeCoinTrayBox(slot: Slot, trayRect: ZoneRect): ZoneRect {
  const x = Math.max(trayRect.x + 1, slot.x - slot.w / 2 + 3);
  const y = Math.max(trayRect.y + 1, slot.y - slot.h / 2 + 3);
  return {
    x,
    y,
    w: Math.min(
      Math.max(8, slot.w - 6),
      Math.max(4, trayRect.x + trayRect.w - 1 - x)
    ),
    h: Math.min(
      Math.max(8, slot.h - 6),
      Math.max(4, trayRect.y + trayRect.h - 1 - y)
    ),
  };
}

export function computeTotalMeterDots(
  rect: ZoneRect,
  displayedTotal: number,
  targetAmount: number,
  isWin: boolean
): { cx: number; cy: number; r: number; active: boolean }[] {
  const count = Math.min(12, Math.max(1, targetAmount));
  const done = Math.min(
    count,
    Math.floor((displayedTotal / Math.max(1, targetAmount)) * count)
  );
  const start = rect.x + Math.min(54, rect.w * 0.36);
  const step =
    Math.max(24, rect.x + rect.w - 14 - (isWin ? 16 : 0) - start) / count;
  const r = Math.max(3, Math.min(5.5, step * 0.32));
  const cy = rect.y + rect.h / 2;
  const out: { cx: number; cy: number; r: number; active: boolean }[] = [];
  for (let i = 0; i < count; i++) {
    out.push({ cx: start + (i + 0.5) * step, cy, r, active: i < done });
  }
  return out;
}

export function buildDepositedCoinViews(
  coins: readonly GT031Coin[],
  depositedIds: readonly string[]
): { value: number; rank: number }[] {
  const rankMap = buildCoinRankMap(coins);
  const out: { value: number; rank: number }[] = [];
  for (const id of depositedIds) {
    const coin = coins.find((c) => c.coin_id === id);
    if (coin) {
      out.push({ value: coin.value, rank: rankMap.get(coin.value) ?? 0 });
    }
  }
  return out;
}

export function extractCoinIdFromData(
  data?: GameActionValue | null
): string | null {
  if (!data || typeof data !== "object") {
    return null;
  }
  if ("coin_id" in data && typeof data.coin_id === "string") {
    return data.coin_id;
  }
  if ("id" in data && typeof data.id === "string") {
    return data.id;
  }
  return null;
}
