import type { GameAction } from "#src/game-session";
import type { EngineView, Gesture, ViewEntity } from "#src/interaction";
import { resolveAssetLabels } from "#src/labels/spoken-keyword";
import { findHitSlotIndex, TAP_TOLERANCE_PX } from "#src/layout/hit-test";
import type { ZoneRect } from "#src/layout/stage-zones";
import type { Slot } from "#src/layout/types";
import { resolveEmojiGlyph, type SceneBox } from "#src/render/index.js";
import { deriveStream } from "#src/rng/mulberry32";
import { shuffle } from "#src/rng/shuffle";
import type { Particle } from "#src/systems/render-system";
import type { WrongFlash } from "#src/systems/wrong-flash";
import { evaluateQuestionAnswer, solveEquationSystem } from "./solver.js";
import type { GT010Content } from "./template.js";

export const REVEAL_ANIM_MS = 360;
export const WIN_POP_MS = 280;
const BASE_FRAME_MS = 16.67;

type Eq = GT010Content["equations"][number];
type Opt = GT010Content["options"][number];
type Sym = GT010Content["symbols"][number];
type Q = GT010Content["question"];
type Zone = ZoneRect | null | undefined;
type Slots = readonly Slot[];
type PList = readonly Particle[];
type HLevel = 0 | 1 | 2 | 3;
type Id = string | null;
type HShape = "square" | "circle";
type EState = ViewEntity["state"];
type RState = "idle" | "touching" | "selected" | "hinted" | "active";
type OState = "idle" | "touching" | "selected" | "correct" | "wrong";

export type GT010RuleVisualState = RState;
export type GT010OptionVisualState = OState;

export interface GT010SymbolToken {
  readonly symbolId: string;
  readonly glyph: string;
  readonly isHighlighted: boolean;
  readonly solvedValue: number | undefined;
}
export interface GT010ExpressionOptions {
  readonly tokens: readonly GT010SymbolToken[];
  readonly rhs: string;
  readonly hint?: string;
  readonly lookedUp?: boolean;
  readonly question?: boolean;
  readonly reveal?: number;
  readonly answer?: number;
}
export interface GT010OptionAnimOptions {
  readonly timeMs: number;
  readonly wrongProgress: number | null;
  readonly winElapsedMs: number | null;
}
export interface GT010OptionPose {
  readonly dx: number;
  readonly dy: number;
  readonly scale: number;
  readonly lift: number;
}
export interface GT010Clock {
  logicMs: number;
  winAtMs: number | null;
  closeAtMs: number | null;
  touchingSlotIndex: number | null;
  hoveredSlotIndex: number | null;
}
export interface GT010ViewInput {
  readonly c: GT010Content;
  readonly opts: readonly Opt[];
  readonly slots: Slots;
  readonly gMap: ReadonlyMap<string, string>;
  readonly sMap: ReadonlyMap<string, Sym>;
  readonly lId: Id;
  readonly sel: number | null;
  readonly wrong: boolean;
  readonly tIdx: number | null;
  readonly hints: ReadonlySet<string>;
}

type AnimOpt = GT010OptionAnimOptions;
type VIn = GT010ViewInput;
const SESSION_CLOCK = new WeakMap<object, GT010Clock>();

export function getGT010Clock(session: object): GT010Clock {
  const c = SESSION_CLOCK.get(session) ?? {
    logicMs: 0,
    winAtMs: null,
    closeAtMs: null,
    touchingSlotIndex: null,
    hoveredSlotIndex: null,
  };
  SESSION_CLOCK.set(session, c);
  return c;
}
export const resetGT010Clock = (s: object): void => {
  SESSION_CLOCK.delete(s);
};

export function resolveDisplayOptions(opts: readonly Opt[], seed: number) {
  if (seed === 0 || opts.length < 2) {
    return [...opts];
  }
  const shuf = shuffle(opts, deriveStream(seed, "items"));
  const same = shuf.every((o, i) => o.value === opts[i]?.value);
  return same && shuf[0] ? [...shuf.slice(1), shuf[0]] : shuf;
}

export function buildSymbolMaps(symbols: readonly Sym[]) {
  const symbolById = new Map<string, Sym>(symbols.map((s) => [s.symbol_id, s]));
  const glyphBySymbolId = new Map<string, string>(
    symbols.map((s) => {
      if (s.asset.kind === "emoji") {
        return [s.symbol_id, resolveEmojiGlyph(s.asset.ref) ?? "?"];
      }
      const l = resolveAssetLabels(s.asset);
      return [s.symbol_id, l.glyph ?? l.label ?? "?"];
    })
  );
  return { symbolById, glyphBySymbolId };
}

export function resolveSolvedState(c: GT010Content) {
  const ids = c.symbols.map((s) => s.symbol_id);
  const first = solveEquationSystem(ids, c.equations)[0];
  const solvedSymbolMap = first
    ? new Map(Object.entries(first.values))
    : new Map<string, number>();
  const expectedAnswer = first ? evaluateQuestionAnswer(first, c.question) : 0;
  return { solvedSymbolMap, expectedAnswer };
}

export const resolveQuestionSymbolIds = (q: Q): readonly string[] =>
  q.kind === "value" ? [q.symbol_id] : q.symbol_ids;

export function resolveRelatedEquations(c: GT010Content): readonly Eq[] {
  const qSet = new Set(resolveQuestionSymbolIds(c.question));
  const rel = c.equations.filter((eq) => eq.left.some((sym) => qSet.has(sym)));
  return rel.length > 0 ? rel : c.equations;
}

export function resolveHintedRuleIds(c: GT010Content, lv: HLevel) {
  if (lv === 0) {
    return new Set<string>();
  }
  const rel = resolveRelatedEquations(c).map((eq) => eq.equation_id);
  return new Set(lv === 1 ? [rel[0] ?? ""] : rel);
}

export function resolveHighlightedSymbolIds(
  c: GT010Content,
  id: Id,
  lv: HLevel
) {
  const res = new Set<string>();
  const eq = c.equations.find((e) => e.equation_id === id);
  for (const s of eq?.left ?? []) {
    res.add(s);
  }
  if (lv >= 2) {
    for (const s of resolveQuestionSymbolIds(c.question)) {
      res.add(s);
    }
  }
  return res;
}

export function resolveLookupBridgeSlots(
  c: GT010Content,
  eqs: Slots,
  id: Id,
  lv: HLevel
) {
  const qSet = new Set(resolveQuestionSymbolIds(c.question));
  if (id !== null) {
    const idx = c.equations.findIndex((eq) => eq.equation_id === id);
    const eq = c.equations[idx];
    const slot = eqs[idx];
    return eq && slot && eq.left.some((s) => qSet.has(s)) ? [slot] : [];
  }
  if (lv < 2) {
    return [];
  }
  return c.equations.flatMap((eq, i) => {
    const s = eqs[i];
    return s && eq.left.some((sym) => qSet.has(sym)) ? [s] : [];
  });
}

const spokenSym = (s: Sym | undefined) =>
  s ? resolveAssetLabels(s.asset).spokenLabel : "hình";
const joinSpoken = (ids: readonly string[], m: ReadonlyMap<string, Sym>) =>
  ids.map((id) => spokenSym(m.get(id))).join(" cộng ");
const joinGlyphs = (ids: readonly string[], m: ReadonlyMap<string, string>) =>
  ids.map((id) => m.get(id) ?? "?").join(" + ");

export const resolveWrongFlashProgress = (f: WrongFlash, ms: number) =>
  f.isActive(ms) ? f.progress(ms) : null;

export function resolveRevealProgress(clk: GT010Clock, red: boolean): number {
  const start = clk.winAtMs ?? clk.closeAtMs;
  if (start === null) {
    return 0;
  }
  return red
    ? 1
    : Math.min(1, Math.max(0.2, (clk.logicMs - start) / REVEAL_ANIM_MS));
}

function resolveCorrectPopScale(elMs: number | null, red: boolean): number {
  if (red) {
    return 1;
  }
  const el = elMs ?? WIN_POP_MS;
  return el >= 0 && el < WIN_POP_MS
    ? 1 + Math.sin((el / WIN_POP_MS) * Math.PI) * 0.06
    : 1.03;
}

export function getOptionPose(st: OState, i: number, a: AnimOpt, red: boolean) {
  if (st === "correct") {
    const scale = resolveCorrectPopScale(a.winElapsedMs, red);
    return { dx: 0, dy: 0, scale, lift: 2.5 };
  }
  if (st === "wrong") {
    const wp = a.wrongProgress ?? 0;
    const dx = red ? 0 : Math.sin(wp * Math.PI * 4) * (1 - wp) * 2.5;
    return { dx, dy: 0, scale: 1, lift: 2.5 };
  }
  if (st === "touching") {
    return { dx: 0, dy: red ? 0 : 1.5, scale: red ? 1 : 0.96, lift: 1.2 };
  }
  if (st === "selected") {
    return { dx: 0, dy: red ? 0 : -1.5, scale: 1.02, lift: 3.5 };
  }
  const dy = red ? 0 : Math.sin(a.timeMs / 640 + i * 0.9);
  return { dx: 0, dy, scale: 1, lift: 3 };
}

export function clampRadiusInStage(x: number, y: number, r: number, z?: Zone) {
  if (!z) {
    return Math.max(8, r);
  }
  const dx = Math.min(x - z.x - 2, z.x + z.w - x - 2);
  const dy = Math.min(y - z.y - 2, z.y + z.h - y - 2);
  return Math.max(8, Math.min(r, dx, dy));
}

export function clampBoxInStage(b: SceneBox, stage?: Zone, pad = 2): SceneBox {
  if (!stage) {
    return b;
  }
  const x = Math.max(stage.x + pad, b.x);
  const y = Math.max(stage.y + pad, b.y);
  const r = Math.min(stage.x + stage.w - pad, b.x + b.w);
  const btm = Math.min(stage.y + stage.h - pad, b.y + b.h);
  return { x, y, w: Math.max(24, r - x), h: Math.max(24, btm - y) };
}

export function stepGT010Particles(list: PList, dt: number, st?: Zone) {
  if (list.length === 0 || dt <= 0) {
    return [...list];
  }
  const ratio = Math.min(4, Math.max(0.1, dt / BASE_FRAME_MS));
  const next: Particle[] = [];
  for (const p of list) {
    const life = p.life - (dt / 1000) * 1.6;
    if (life <= 0) {
      continue;
    }
    const r = p.size * life + 1;
    const nx = p.x + p.vx * ratio;
    const ny = p.y + p.vy * ratio;
    const x = st ? Math.max(st.x + r, Math.min(st.x + st.w - r, nx)) : nx;
    const y = st ? Math.max(st.y + r, Math.min(st.y + st.h - r, ny)) : ny;
    next.push({ ...p, x, y, vy: p.vy + 0.28 * ratio, life });
  }
  return next;
}

const hitIdx = (s: Slots, x: number, y: number, sh: HShape) =>
  findHitSlotIndex(s, x, y, sh, TAP_TOLERANCE_PX);

export function findGT010HoveredSlot(
  s: Slots,
  n: number,
  x: number,
  y: number
) {
  const rows = s.slice(0, n + 1);
  const rIdx = hitIdx(rows, x, y, "square");
  if (rIdx >= 0 && rows[rIdx]) {
    return s.indexOf(rows[rIdx]);
  }
  const opts = s.slice(n + 1);
  const oIdx = hitIdx(opts, x, y, "circle");
  return oIdx >= 0 && opts[oIdx] ? s.indexOf(opts[oIdx]) : null;
}

export function resolveGT010TapAction(v: VIn, g: Gesture): GameAction | null {
  if (g.type !== "tap") {
    return null;
  }
  const { c, opts, slots: s } = v;
  const eqN = c.equations.length;
  const eq = c.equations[hitIdx(s.slice(0, eqN), g.x, g.y, "square")];
  if (eq) {
    return { type: "look_up_rule", data: eq.equation_id };
  }
  const qSlot = s[eqN];
  if (qSlot && hitIdx([qSlot], g.x, g.y, "square") === 0) {
    return null;
  }
  const opt = opts[hitIdx(s.slice(eqN + 1), g.x, g.y, "circle")];
  return opt ? { type: "select_value", data: opt.value } : null;
}

export function getRuleState(v: VIn, eqId: string, sIdx: number): RState {
  if (v.lId === eqId) {
    return "selected";
  }
  if (v.tIdx === sIdx) {
    return "touching";
  }
  if (v.wrong) {
    return "active";
  }
  return v.hints.has(eqId) ? "hinted" : "idle";
}

export function getOptionState(v: VIn, opt: Opt, sIdx: number): OState {
  if (v.sel === opt.value) {
    if (opt.is_correct) {
      return "correct";
    }
    if (v.wrong) {
      return "wrong";
    }
  }
  return v.tIdx === sIdx ? "touching" : "idle";
}

function toOptEntState(opt: Opt, sel: number | null, wrong: boolean): EState {
  if (sel !== opt.value) {
    return "idle";
  }
  return opt.is_correct ? "correct" : (wrong && "incorrect") || "idle";
}

export function buildGT010View(v: VIn): EngineView {
  const { c, opts, slots, gMap, sMap, lId, sel, wrong } = v;
  const eqN = c.equations.length;
  const entities: ViewEntity[] = [];
  const add = (i: number, id: string, st: EState, lbl: string, spk: string) => {
    const s = slots[i];
    if (s) {
      const isOpt = id.startsWith("opt-");
      entities.push({
        id,
        slotIndex: slots.indexOf(s),
        role: isOpt ? "source" : "neutral",
        state: st,
        x: s.x,
        y: s.y,
        w: Math.max(s.w, s.hitW),
        h: Math.max(s.h, s.hitH),
        hitShape: isOpt ? "circle" : "square",
        label: lbl,
        spokenLabel: spk,
      });
    }
  };
  c.equations.forEach((eq, i) => {
    const st =
      lId === eq.equation_id ? "selected" : (wrong && "active") || "idle";
    const lbl = `${joinGlyphs(eq.left, gMap)} = ${eq.right_value}`;
    const spk = `${joinSpoken(eq.left, sMap)} bằng ${eq.right_value}`;
    add(i, eq.equation_id, st, lbl, spk);
  });
  const qIds = resolveQuestionSymbolIds(c.question);
  const qLbl = `${joinGlyphs(qIds, gMap)} = ?`;
  const qSpk = `${joinSpoken(qIds, sMap)} bằng mấy`;
  add(eqN, "question-row", "idle", qLbl, qSpk);
  opts.forEach((opt, i) => {
    const lbl = String(opt.value);
    add(
      eqN + 1 + i,
      `opt-${i}`,
      toOptEntState(opt, sel, wrong),
      lbl,
      `Số ${lbl}`
    );
  });
  return { activePrompt: c.prompt, entities };
}
