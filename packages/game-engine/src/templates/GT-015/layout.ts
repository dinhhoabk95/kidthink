import type { GameAction, GameActionValue } from "#src/game-session";
import type { EntityVisual, Gesture, ViewEntity } from "#src/interaction";
import { resolveAssetLabels } from "#src/labels/spoken-keyword";
import { findHitSlotIndex, TAP_TOLERANCE_PX } from "#src/layout/hit-test";
import type { Slot } from "#src/layout/types";
import { type GT015RenderContext, S015 } from "#src/render/gt-015-shapes.js";
import { drawEmptyTargetSlot } from "#src/render/index.js";
import { deriveDerangement } from "#src/rng/derangement";
import { deriveStream } from "#src/rng/mulberry32";
import {
  findConstraintViolations,
  type SudokuCell,
  type SudokuGrid,
} from "#src/systems/constraint-system";
import type { RenderSystem } from "#src/systems/render-system";
import type { GT015Content } from "./template.js";

export type GT015Symbol = GT015Content["symbols"][number];
export interface SudokuCellState {
  readonly row: number;
  readonly col: number;
  readonly value: string | null;
  readonly isInitial: boolean;
}
export type StateMap = ReadonlyMap<string, SudokuCellState>;
export type SolMap = ReadonlyMap<number, string> | null;
type C = GT015Content;
type Slots = readonly Slot[];
type EV = EntityVisual;
type Lbl = ReturnType<typeof resolveAssetLabels>;
type Pt = Pick<Slot, "x" | "y">;
type Ctx = CanvasRenderingContext2D;
type Sys = RenderSystem;
export type GT015Clock = GT015RenderContext["clock"];
type V = GT015RenderContext & {
  readonly clock: GT015Clock;
  readonly content: C;
};
export type GT015HintInput = Pick<
  V,
  "content" | "states" | "violations" | "solution"
>;

const PRESS_MS = 180;
const CLOCK_STORE = new WeakMap<object, GT015Clock>();
const SOL_CACHE = new WeakMap<C, SolMap>();
const act = (type: string, data: GameAction["data"]): GameAction => ({
  type,
  data,
});

function resetClk(owner: object): GT015Clock {
  const a = { elapsedMs: 0, winAtMs: null, scaffoldHintLevel: 0 as const };
  const b = { hoveredSlotIndex: null, pressedSlotIndex: null };
  const d = { pressedUntilMs: 0, selectedCellIndex: null };
  const stepPopMap = new Map<string, number>();
  const lockedShakeMap = new Map<string, number>();
  const c: GT015Clock = { ...a, ...b, ...d, stepPopMap, lockedShakeMap };
  CLOCK_STORE.set(owner, c);
  return c;
}

export const getGT015Clock = (o: object): GT015Clock =>
  CLOCK_STORE.get(o) ?? resetClk(o);

const dispSyms = (syms: readonly GT015Symbol[], seed: number): GT015Symbol[] =>
  seed === 0 || syms.length <= 1
    ? [...syms]
    : deriveDerangement(syms, deriveStream(seed, "items"));

interface Ov {
  clearKey?: string;
  setRow?: number;
  setCol?: number;
  setValue?: string | null;
}

function gridOf(c: C, st: StateMap, ov?: Ov): SudokuGrid<string> {
  const n = c.grid_size;
  const cells: SudokuCell<string>[] = [];
  for (let i = 0; i < n * n; i++) {
    const [r, col] = [Math.floor(i / n), i % n];
    const k = `${r},${col}`;
    let val = ov?.clearKey === k ? null : (st.get(k)?.value ?? null);
    if (ov?.setRow === r && ov?.setCol === col) {
      val = ov.setValue ?? null;
    }
    cells.push({ row: r, col, value: val });
  }
  return { size: n, cells, regions: c.regions };
}

function solveGivens(c: C): SolMap {
  if (SOL_CACHE.has(c)) {
    return SOL_CACHE.get(c) ?? null;
  }
  const n = c.grid_size;
  const vals = Array.from<string | null>({ length: n * n }).fill(null);
  for (const cell of c.cells) {
    vals[cell.row * n + cell.col] = cell.symbol_id;
  }
  const blanks = vals.flatMap((v, i) => (v === null ? [i] : []));
  const rc = (v: string | null, i: number) => ({
    row: Math.floor(i / n),
    col: i % n,
    value: v,
  });
  const search = (at: number): boolean => {
    const key = blanks[at];
    if (key === undefined) {
      return true;
    }
    for (const sym of c.symbols) {
      vals[key] = sym.symbol_id;
      const g = { size: n, regions: c.regions, cells: vals.map(rc) };
      const bad = findConstraintViolations(g).some(
        (v) => v.row * n + v.col === key
      );
      if (!bad && search(at + 1)) {
        return true;
      }
    }
    vals[key] = null;
    return false;
  };
  const sol = search(0)
    ? new Map(vals.flatMap((v, i) => (v === null ? [] : [[i, v]])))
    : null;
  SOL_CACHE.set(c, sol);
  return sol;
}

const canPlace = (c: C, st: StateMap, r: number, col: number, id: string) =>
  !findConstraintViolations(
    gridOf(c, st, { setRow: r, setCol: col, setValue: id })
  ).some((v) => v.row === r && v.col === col);

function pickWrongPlaced(h: GT015HintInput, confOnly: boolean): number | null {
  const n = h.content.grid_size;
  const bad = new Set<number>();
  for (const v of h.violations) {
    bad.add(v.row * n + v.col);
    bad.add(v.conflictingWith.row * n + v.conflictingWith.col);
  }
  const ok = (s: SudokuCellState) =>
    !(s.isInitial || !s.value) && (!confOnly || bad.has(s.row * n + s.col));
  const play = [...h.states.values()].filter(ok);
  const mis = play.find((s) => {
    const ans = h.solution?.get(s.row * n + s.col);
    return ans !== undefined && s.value !== ans;
  });
  const pick = mis ?? (confOnly ? play[0] : undefined);
  return pick ? pick.row * n + pick.col : null;
}

function pickHint(h: GT015HintInput): number | null {
  if (h.violations.length > 0) {
    const hit = pickWrongPlaced(h, true);
    if (hit !== null) {
      return hit;
    }
  }
  const c = h.content;
  const n = c.grid_size;
  const open = [...h.states.values()].filter((s) => !(s.isInitial || s.value));
  if (open.length === 0) {
    return null;
  }
  const cnt = (r: number, col: number) =>
    c.symbols.filter((s) => canPlace(c, h.states, r, col, s.symbol_id)).length;
  const scored = open.map((x) => ({
    idx: x.row * n + x.col,
    c: cnt(x.row, x.col),
  }));
  const valid = scored.filter((x) => x.c > 0).sort((a, b) => a.c - b.c);
  return valid[0]?.idx ?? pickWrongPlaced(h, false) ?? scored[0]?.idx ?? null;
}

function hintSym(h: GT015HintInput, idx: number): string | null {
  const c = h.content;
  const n = c.grid_size;
  return (
    h.solution?.get(idx) ??
    c.symbols.find((s) =>
      canPlace(c, h.states, Math.floor(idx / n), idx % n, s.symbol_id)
    )?.symbol_id ??
    c.symbols[0]?.symbol_id ??
    null
  );
}

const hitPal = (ss: Slots, cells: number, x: number, y: number) => {
  const i = findHitSlotIndex(ss.slice(cells), x, y, "circle", TAP_TOLERANCE_PX);
  return i >= 0 ? i : null;
};

const hitCell = (ss: Slots, cells: number, x: number, y: number) => {
  const sub = ss.slice(0, cells);
  const i = findHitSlotIndex(sub, x, y, "square", TAP_TOLERANCE_PX);
  return i >= 0 ? i : null;
};

function hitAt(ss: Slots, n2: number, pt: Pt): number | null {
  const ci = hitCell(ss, n2, pt.x, pt.y);
  const po = hitPal(ss, n2, pt.x, pt.y);
  const pi = po === null ? null : n2 + po;
  const [cs, ps] = [ci === null ? null : ss[ci], pi === null ? null : ss[pi]];
  if (ci !== null && pi !== null && cs && ps) {
    const dp = Math.hypot(pt.x - ps.x, pt.y - ps.y);
    return dp < Math.hypot(pt.x - cs.x, pt.y - cs.y) ? pi : ci;
  }
  return pi ?? ci;
}

function parsePt(ptOrX: Pt | number, y?: number): Pt | null {
  if (typeof ptOrX === "number") {
    return typeof y === "number" ? { x: ptOrX, y } : null;
  }
  return ptOrX;
}

function actFields(d: GameActionValue) {
  const ok = typeof d === "object" && d !== null;
  const num = (k: string): number | null => {
    const v = ok ? Reflect.get(d, k) : null;
    return typeof v === "number" ? v : null;
  };
  const s = ok ? Reflect.get(d, "symbol_id") : undefined;
  const sym = s === null || typeof s === "string" ? s : undefined;
  const a = { r: num("row"), c: num("col") };
  return { ...a, fr: num("from_row"), fc: num("from_col"), sym };
}

const toEnt = (s: Slot, id: string, i: number, st: EV, l: Lbl, d?: boolean) => {
  const src = d === undefined;
  const role = src ? ("source" as const) : ("target" as const);
  const hitShape = src ? ("circle" as const) : ("square" as const);
  const a = { id, slotIndex: i, role, state: st, hitShape };
  return { ...a, draggable: d ?? true, x: s.x, y: s.y, w: s.w, h: s.h, ...l };
};

function viewEnts(v: V): ViewEntity[] {
  const n = v.content.grid_size;
  const cells = n * n;
  const out: ViewEntity[] = [];
  v.symbols.forEach((sym, i) => {
    const s = v.slots[cells + i];
    const vis: EV = v.selectedSymbolId === sym.symbol_id ? "selected" : "idle";
    if (s) {
      const lbl = resolveAssetLabels(sym.asset);
      out.push(toEnt(s, sym.symbol_id, cells + i, vis, lbl));
    }
  });
  for (const c of v.content.cells) {
    const idx = c.row * n + c.col;
    const s = v.slots[idx];
    if (!s) {
      continue;
    }
    const st = v.states.get(`${c.row},${c.col}`);
    const bad = v.violations.some((x) => x.row === c.row && x.col === c.col);
    const val = st?.value ?? c.symbol_id;
    const sym = v.content.symbols.find((x) => x.symbol_id === val);
    const [r1, c1] = [c.row + 1, c.col + 1];
    const lbl = sym
      ? resolveAssetLabels(sym.asset)
      : { label: `H${r1}C${c1}`, spokenLabel: `Ô hàng ${r1} cột ${c1}` };
    let vis: EV = v.clock.selectedCellIndex === idx ? "selected" : "idle";
    if (bad) {
      vis = "incorrect";
    } else if (st?.value) {
      vis = "correct";
    }
    const drag = Boolean(st && !st.isInitial && st.value !== null);
    out.push(toEnt(s, `cell-${c.row}-${c.col}`, idx, vis, lbl, drag));
  }
  return out;
}

function handleCellDrag(v: V, fcIdx: number, toCell: number | null) {
  const n = v.content.grid_size;
  const [fr, fc] = [Math.floor(fcIdx / n), fcIdx % n];
  const fs = v.states.get(`${fr},${fc}`);
  if (!fs || fs.isInitial || fs.value === null || toCell === fcIdx) {
    return null;
  }
  if (toCell === null) {
    return act("clear_cell", { row: fr, col: fc });
  }
  const [tr, tc] = [Math.floor(toCell / n), toCell % n];
  const ts = v.states.get(`${tr},${tc}`);
  const from = { from_row: fr, from_col: fc };
  const d = { ...from, row: tr, col: tc, symbol_id: fs.value };
  return ts && !ts.isInitial ? act("move_cell", d) : null;
}

function handleDrop(v: V, g: Extract<Gesture, { type: "drop" }>) {
  const n = v.content.grid_size;
  const cells = n * n;
  v.clock.selectedCellIndex = null;
  const fromPal = hitPal(v.slots, cells, g.fromX, g.fromY);
  const toCell = hitCell(v.slots, cells, g.toX, g.toY);
  if (toCell !== null) {
    v.clock.pressedSlotIndex = toCell;
    v.clock.pressedUntilMs = v.clock.elapsedMs + PRESS_MS;
  }
  if (fromPal === null) {
    const fcIdx = hitCell(v.slots, cells, g.fromX, g.fromY);
    if (fcIdx !== null) {
      return handleCellDrag(v, fcIdx, toCell);
    }
  }
  const symId =
    fromPal === null
      ? v.selectedSymbolId
      : (v.symbols[fromPal]?.symbol_id ?? null);
  if (symId === null || toCell === null) {
    return null;
  }
  const [r, c] = [Math.floor(toCell / n), toCell % n];
  return v.states.get(`${r},${c}`)?.isInitial === false
    ? act("fill_cell", { row: r, col: c, symbol_id: symId })
    : null;
}

function handleCellTap(v: V, hit: number): GameAction | null {
  const n = v.content.grid_size;
  const [row, col] = [Math.floor(hit / n), hit % n];
  const st = v.states.get(`${row},${col}`);
  if (!st || st.isInitial) {
    if (st?.isInitial) {
      v.clock.lockedShakeMap.set(`${row},${col}`, v.clock.elapsedMs);
    }
    return null;
  }
  if (v.selectedSymbolId !== null) {
    v.clock.selectedCellIndex = null;
    return st.value === v.selectedSymbolId
      ? act("clear_cell", { row, col })
      : act("fill_cell", { row, col, symbol_id: v.selectedSymbolId });
  }
  if (st.value !== null) {
    v.clock.selectedCellIndex = null;
    return act("clear_cell", { row, col });
  }
  v.clock.selectedCellIndex = v.clock.selectedCellIndex === hit ? null : hit;
  return null;
}

function onGesture(v: V, g: Gesture, onSelect: (id: string | null) => void) {
  if (g.type === "drop") {
    return handleDrop(v, g);
  }
  if (g.type !== "tap") {
    return null;
  }
  const n = v.content.grid_size;
  const cells = n * n;
  const hit = hitAt(v.slots, cells, g);
  if (hit === null) {
    return null;
  }
  v.clock.pressedSlotIndex = hit;
  v.clock.pressedUntilMs = v.clock.elapsedMs + PRESS_MS;
  if (hit < cells) {
    return handleCellTap(v, hit);
  }
  const sym = v.symbols[hit - cells];
  if (!sym) {
    return null;
  }
  const selCell = v.clock.selectedCellIndex;
  if (selCell !== null) {
    const [row, col] = [Math.floor(selCell / n), selCell % n];
    return v.states.get(`${row},${col}`)?.isInitial === false
      ? act("fill_cell", { row, col, symbol_id: sym.symbol_id })
      : null;
  }
  onSelect(v.selectedSymbolId === sym.symbol_id ? null : sym.symbol_id);
  return null;
}

function drawFilled(ctx: Ctx, rs: Sys, s0: Slot, k: string, v: V, b: boolean) {
  const at = v.clock.stepPopMap.get(k);
  const pop = S015.progressWindow(
    v.clock.elapsedMs,
    at,
    S015.GT015_STEP_POP_MS
  );
  const prs = Number(v.clock.pressedSlotIndex === v.slots.indexOf(s0));
  const sc = pop > 0 && !rs.reducedMotion ? 1.05 : 1 - prs * 0.05;
  const [w, h] = [Math.round(s0.w * sc), Math.round(s0.h * sc)];
  const s = { ...s0, y: s0.y + prs * 2, w, h };
  S015.drawSym(ctx, rs, s, k, v, b ? "wrong" : "correct");
  if (b && v.wrongFlashAlpha > 0) {
    const rr = S015.retryRad(v.stageBounds, s);
    rs.drawRetryRing(ctx, s.x, s.y, rr, v.wrongFlashAlpha);
  }
}

function drawCellAt(ctx: Ctx, rs: Sys, v: V, i: number, s0: Slot): void {
  const n = v.content.grid_size;
  const [r, c] = [Math.floor(i / n), i % n];
  const k = `${r},${c}`;
  const cell = v.states.get(k);
  const bad =
    v.violations.length > 0 &&
    v.violations.some(
      (x) =>
        (x.row === r && x.col === c) ||
        (x.conflictingWith.row === r && x.conflictingWith.col === c)
    );
  if (cell?.isInitial) {
    S015.drawLocked(ctx, rs, s0, k, v);
  } else if ((cell?.value ?? null) === null) {
    drawEmptyTargetSlot(ctx, s0);
    const sel = v.clock.selectedCellIndex === i;
    if (sel || v.selectedSymbolId !== null || v.clock.hoveredSlotIndex === i) {
      S015.drawInvite(ctx, s0, sel);
    }
  } else {
    drawFilled(ctx, rs, s0, k, v, bad);
  }
  if (!cell?.isInitial && (!cell?.value || bad)) {
    S015.drawGhost(ctx, rs, s0, v, i);
  }
}

const l1 = { PRESS_MS, resetClk, getClk: getGT015Clock, dispSyms, gridOf };
const l2 = { solveGivens, pickHint, hintSym, hitAt, parsePt };
export const L = { ...l1, ...l2, actFields, viewEnts, onGesture, drawCellAt };
