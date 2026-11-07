import {
  createGameSessionSync,
  type EngineConfig,
  type GameSession,
  type Gesture,
  preloadGameSession,
  TemplateGameSession,
} from "#src/index";

/**
 * Task #313 Phase 0 — solver tham lam chỉ dùng gesture mà bề mặt web phát ra
 * (`tap`, `drop`, `adjust`, `commit`; `stroke` rơi về `drop` khi session không
 * đọc nét). Mỗi bước thử các gesture ứng viên theo thứ tự cố định, thực hiện
 * cái đầu tiên mà `validateAction` trả đúng, rồi lặp tới khi thắng hoặc kẹt.
 */

export interface SolverFixture {
  readonly content: EngineConfig["content_pack"];
  readonly difficulty: EngineConfig["difficulty_params"];
  readonly band?: string;
}

export type SolveOutcome = "won" | "stuck" | "no-session";

const MAX_STEPS = 80;
/** Một hành động hợp lệ không đổi view (xoay…) được lặp tối đa từng này lần. */
const MAX_REPEAT = 4;
/** Trẻ chạm đều tay mỗi ~0,8 s: đủ cho engine chấm nhịp gõ (GT-034, 70-80 BPM). */
const GESTURE_SPACING_MS = 800;
/** Một lần chờ khi kẹt và số lần chờ tối đa mỗi level. */
const WAIT_MS = 6000;
const MAX_WAITS = 40;
const BANDS = ["3-4", "4-5", "5-6"] as const;
type Band = (typeof BANDS)[number];

function toBand(raw: string | undefined, fallback: Band): Band {
  return BANDS.find((b) => b === raw) ?? fallback;
}

function candidatesOf(session: TemplateGameSession, t: number): Gesture[] {
  const entities = session.getView?.().entities ?? [];
  const taps: Gesture[] = entities.map((e) => ({
    type: "tap",
    x: e.x,
    y: e.y,
    timeMs: t,
  }));
  const drops: Gesture[] = [];
  for (const from of entities) {
    for (const to of entities) {
      if (from.id !== to.id) {
        drops.push({
          type: "drop",
          fromX: from.x,
          fromY: from.y,
          toX: to.x,
          toY: to.y,
          timeMs: t,
        });
      }
    }
  }
  const hinted = session.getHintTargetIndex?.() ?? null;
  const hintEntity = entities.find((e) => e.slotIndex === hinted);
  const hintTap: Gesture[] = hintEntity
    ? [{ type: "tap", x: hintEntity.x, y: hintEntity.y, timeMs: t }]
    : [];
  const hintDrops: Gesture[] = hintEntity
    ? entities
        .filter((e) => e.id !== hintEntity.id)
        .map((e) => ({
          type: "drop",
          fromX: hintEntity.x,
          fromY: hintEntity.y,
          toX: e.x,
          toY: e.y,
          timeMs: t,
        }))
    : [];
  const commit: Gesture[] = session.needsCommit
    ? [{ type: "commit", timeMs: t }]
    : [];
  return [
    ...commit,
    ...hintTap,
    ...hintDrops,
    ...taps,
    ...drops,
    { type: "adjust", delta: 1, timeMs: t },
    { type: "adjust", delta: -1, timeMs: t },
    { type: "commit", timeMs: t },
  ];
}

/** Một bước: chạy gesture đầu tiên cho verdict đúng. `false` khi kẹt. */
function fingerprint(session: TemplateGameSession): string {
  return JSON.stringify([
    session.getTelemetry().events.length,
    (session.getView?.().entities ?? []).map((e) => [
      e.state,
      e.label,
      e.x,
      e.y,
    ]),
  ]);
}

function stepOnce(
  session: TemplateGameSession,
  t: number,
  seen: Set<string>,
  uses: Map<string, number>
): boolean {
  const before = fingerprint(session);
  for (const gesture of candidatesOf(session, t)) {
    const action = session.toAction?.(gesture);
    if (action) {
      if (!session.validateAction(action).valid) {
        continue;
      }
      session.commit?.(action);
      const key = JSON.stringify(action);
      const used = uses.get(key) ?? 0;
      if (used < MAX_REPEAT) {
        uses.set(key, used + 1);
        return true;
      }
    }
    // `toAction` null có thể vẫn đổi state (chọn mảnh để chạm-chạm).
    const after = fingerprint(session);
    if (after !== before && !seen.has(after)) {
      seen.add(after);
      return true;
    }
  }
  return false;
}

export async function solveWithWebGestures(
  code: string,
  fixture: SolverFixture,
  index: number
): Promise<SolveOutcome> {
  await preloadGameSession(code);
  const band = toBand(fixture.band, "4-5");
  const config: EngineConfig = {
    level_code: `SOLVE-${code}-${index}`,
    content_version: 1,
    template_code: code,
    content_pack: fixture.content,
    difficulty_params: fixture.difficulty,
    theme_id: "default",
    age_band: band,
    reduced_motion: false,
    audio_enabled: false,
    layout_seed: 1,
  };
  const session = createGameSessionSync(code, config);
  if (!(session instanceof TemplateGameSession)) {
    return "no-session";
  }
  session.prepareRound(band);
  const seen = new Set<string>([fingerprint(session)]);
  const uses = new Map<string, number>();
  let waits = 0;
  for (let step = 0; step < MAX_STEPS; step++) {
    if (session.checkWinCondition()) {
      return "won";
    }
    let progressed = stepOnce(session, step * GESTURE_SPACING_MS, seen, uses);
    // Trẻ chờ: shell vẫn gọi `update()` khi hết gesture (xem trước, khoảng nghỉ,
    // hết giờ lượt nogo…), nên chờ rồi thử lại cho tới khi hết lượt chờ.
    while (!(progressed || session.checkWinCondition()) && waits < MAX_WAITS) {
      (session as GameSession).update?.(WAIT_MS);
      waits++;
      progressed = stepOnce(session, step * GESTURE_SPACING_MS, seen, uses);
    }
    if (!(progressed || session.checkWinCondition())) {
      return "stuck";
    }
  }
  return session.checkWinCondition() ? "won" : "stuck";
}
