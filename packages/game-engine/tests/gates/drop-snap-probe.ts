import type { AgeBand } from "@mindkid/shared/age-bands";
import {
  type ActionResult,
  createGameSessionSync,
  type EngineConfig,
  type GameAction,
  type GameSession,
  type Gesture,
  preloadGameSession,
  TemplateGameSession,
} from "#src/index";
import { touchFloorOf } from "#src/layout/touch-floor";
import { type CanvasBox, placeRound } from "../layout/helpers/shell-frame.ts";
import { candidatesOf } from "./web-gesture-solver.js";

/** Tỉ lệ sàn chạm mà điểm thả được phép lệch tâm đích (`BR-ENG-19`). */
export const DROP_JITTER_RATIO = 0.4;

/** Trường chỉ mang toạ độ thả thô: khác nhau không làm hai lần thả khác nghĩa. */
const RAW_POINT_KEYS: readonly string[] = [
  "x",
  "y",
  "offset_px",
  "strokePoints",
];

const MAX_STEPS = 60;
const WAIT_MS = 6000;
const MAX_WAITS = 12;
const STEP_MS = 800;

export type DropDir = "trái" | "phải" | "trên" | "dưới";
const DIRS: readonly DropDir[] = ["trái", "phải", "trên", "dưới"];

export interface DropSnapReport {
  /** Số thả hợp lệ (thả vào tâm đích) đã thử lệch. */
  readonly probed: number;
  /** Thả lệch tâm mà bị từ chối hoặc ra action khác thả tâm. */
  readonly rejected: readonly string[];
  /** Sàn chạm CSS (px) của band, và độ lệch logic đã dùng. */
  readonly floorCss: number;
  readonly jitterLogic: number;
}

const DIR_VECTOR: Readonly<Record<DropDir, readonly [number, number]>> = {
  trái: [-1, 0],
  phải: [1, 0],
  trên: [0, -1],
  dưới: [0, 1],
};

function shift(
  g: Extract<Gesture, { type: "drop" }>,
  dir: DropDir,
  d: number
): Extract<Gesture, { type: "drop" }> {
  const [ux, uy] = DIR_VECTOR[dir];
  return { ...g, toX: g.toX + ux * d, toY: g.toY + uy * d };
}

/** Điểm đích thả của bàn tay ma (dải đo GT-030…): không trùng tâm entity nào. */
function hintDropCandidates(
  session: TemplateGameSession,
  t: number
): Gesture[] {
  const entities = session.getView?.().entities ?? [];
  const dest = session.getHintDestinationPoint?.() ?? null;
  const src = entities.find(
    (e) => e.slotIndex === session.getHintTargetIndex?.()
  );
  if (!(dest && src)) {
    return [];
  }
  return [
    {
      type: "drop",
      fromX: src.x,
      fromY: src.y,
      toX: dest.x,
      toY: dest.y,
      timeMs: t,
    },
  ];
}

/** Phần của session mà phép thử đụng tới: đổi cử chỉ thành hành động và chấm. */
export interface DropSubject {
  toAction?(g: Gesture): GameAction | null;
  validateAction(a: GameAction): ActionResult;
}

function acceptedAction(session: DropSubject, g: Gesture): string | null {
  const action = session.toAction?.(g);
  if (!(action && session.validateAction(action).valid)) {
    return null;
  }
  // Nhận như nhau = cùng hành động (bỏ trường toạ độ thô mà engine tự căn) và
  // cùng phán quyết.
  return JSON.stringify(
    [action, session.validateAction(action)],
    (key, value) => (RAW_POINT_KEYS.includes(key) ? undefined : value)
  );
}

/**
 * Hướng mà thả lệch tâm đích `jitter` (logic px) bị nhận khác thả tâm. Rỗng là
 * đạt `BR-ENG-19`. Điểm lệch ra ngoài canvas bị bỏ qua: ngón tay không thả được
 * ra ngoài khung.
 */
export function rejectedJitters(
  subject: DropSubject,
  g: Extract<Gesture, { type: "drop" }>,
  jitter: number,
  space: { readonly w: number; readonly h: number }
): DropDir[] {
  const base = acceptedAction(subject, g);
  const out: DropDir[] = [];
  for (const dir of DIRS) {
    const moved = shift(g, dir, jitter);
    const inside =
      moved.toX >= 0 &&
      moved.toY >= 0 &&
      moved.toX <= space.w &&
      moved.toY <= space.h;
    if (inside && acceptedAction(subject, moved) !== base) {
      out.push(dir);
    }
  }
  return out;
}

interface ProbeContext {
  readonly session: TemplateGameSession;
  readonly space: { readonly w: number; readonly h: number };
  readonly jitter: number;
  readonly seen: Set<string>;
}

/**
 * Lần thả được phép đo: bàn có ô đích thì đích thả là entity `target` (thả lên
 * nguồn/khay/ô tham chiếu chỉ trúng nhờ dung sai của ô kề); template khai điểm
 * đích riêng (bàn tay ma kéo tới đó) thì đích thả là điểm đó, tâm entity chỉ là
 * cặp chạm–chạm của shell chứ không phải thả vào ô.
 */
function probeableDrops(session: TemplateGameSession, all: readonly Gesture[]) {
  const entities = session.getView?.().entities ?? [];
  const hasTargets = entities.some((e) => e.role === "target");
  const ownDest = session.getHintDestinationPoint?.() ?? null;
  const roleAt = (x: number, y: number): string | undefined =>
    entities.find((e) => e.x === x && e.y === y)?.role;
  const drops: Extract<Gesture, { type: "drop" }>[] = [];
  for (const g of all) {
    if (g.type !== "drop") {
      continue;
    }
    const role = roleAt(g.toX, g.toY);
    const wrongRole = hasTargets && role !== undefined && role !== "target";
    const notOwnDest =
      ownDest !== null && !(g.toX === ownDest.x && g.toY === ownDest.y);
    if (!(wrongRole || notOwnDest)) {
      drops.push(g);
    }
  }
  return drops;
}

/** Lượt 1 của một bước: thử lệch mọi lần thả hợp lệ ở trạng thái hiện tại. */
function probeStep(
  ctx: ProbeContext,
  all: readonly Gesture[]
): { probed: number; rejected: string[] } {
  const rejected: string[] = [];
  let probed = 0;
  for (const g of probeableDrops(ctx.session, all)) {
    const key = `${ctx.session.getTelemetry().events.length}|${JSON.stringify(g)}`;
    if (ctx.seen.has(key) || acceptedAction(ctx.session, g) === null) {
      continue;
    }
    ctx.seen.add(key);
    probed++;
    for (const dir of rejectedJitters(ctx.session, g, ctx.jitter, ctx.space)) {
      rejected.push(`${dir} ${JSON.stringify(g)}`);
    }
  }
  return { probed, rejected };
}

/** Lượt 2: đi tiếp bằng gesture hợp lệ đầu tiên (trẻ có thể đi bằng chạm). */
function advance(
  session: TemplateGameSession,
  all: readonly Gesture[]
): boolean {
  for (const g of all) {
    const action =
      acceptedAction(session, g) === null ? null : session.toAction?.(g);
    if (action) {
      session.commit?.(action);
      return true;
    }
  }
  return false;
}

export async function probeDropSnap(
  code: string,
  config: EngineConfig,
  band: AgeBand,
  box: CanvasBox
): Promise<DropSnapReport | null> {
  await preloadGameSession(code);
  const session = createGameSessionSync(code, config);
  if (
    !(
      session instanceof TemplateGameSession &&
      session.acceptedVerbs().includes("drop")
    )
  ) {
    return null;
  }
  const round = placeRound(session, band, box);
  const floorCss = touchFloorOf(band);
  const ctx: ProbeContext = {
    session,
    space: round.space,
    jitter: (DROP_JITTER_RATIO * floorCss) / round.scale,
    seen: new Set<string>(),
  };
  let probed = 0;
  const rejected: string[] = [];
  let waits = 0;
  for (let step = 0; step < MAX_STEPS && !session.checkWinCondition(); step++) {
    const t = step * STEP_MS;
    const all = [
      ...hintDropCandidates(session, t),
      ...candidatesOf(session, t),
    ];
    const r = probeStep(ctx, all);
    probed += r.probed;
    rejected.push(...r.rejected);
    if (!(advance(session, all) || session.checkWinCondition())) {
      if (waits >= MAX_WAITS) {
        break;
      }
      waits++;
      (session as GameSession).update?.(WAIT_MS);
    }
  }
  return { probed, rejected, floorCss, jitterLogic: ctx.jitter };
}
