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
  // Gợi ý chỉ ô đích (GT-015: ô trống kế tiếp): thử lần lượt mọi vật thả vào đó,
  // vật sai bị `validateAction` từ chối nên chỉ vật đúng đi tiếp.
  const hintDropsIn: Gesture[] = hintEntity
    ? entities
        .filter((e) => e.id !== hintEntity.id)
        .map((e) => ({
          type: "drop",
          fromX: e.x,
          fromY: e.y,
          toX: hintEntity.x,
          toY: hintEntity.y,
          timeMs: t,
        }))
    : [];
  // Bàn tay ma: kéo đúng từ nguồn gợi ý tới đích gợi ý (GT-015/036, BR-E015-08/BR-E036-12).
  const hintedTo = session.getHintDestinationIndex?.() ?? null;
  const destEntity = entities.find((e) => e.slotIndex === hintedTo);
  const ghostDrag: Gesture[] =
    hintEntity && destEntity
      ? [
          {
            type: "drop",
            fromX: hintEntity.x,
            fromY: hintEntity.y,
            toX: destEntity.x,
            toY: destEntity.y,
            timeMs: t,
          },
        ]
      : [];
  const commit: Gesture[] = session.needsCommit
    ? [{ type: "commit", timeMs: t }]
    : [];
  // Nút chốt đứng sau gợi ý: còn gợi ý nghĩa là còn việc phải đặt trước khi chốt
  // (GT-035: chạy chương trình chỉ khi hàng lệnh đã đủ, vì chạy không còn là phán quyết).
  return [
    ...ghostDrag,
    ...hintTap,
    ...hintDrops,
    ...hintDropsIn,
    ...commit,
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

/** Chỉ phần nhìn thấy được: ghi lại cùng một giá trị vào cùng một ô chỉ thêm event, không đổi view. */
function viewFingerprint(session: TemplateGameSession): string {
  return JSON.stringify(
    (session.getView?.().entities ?? []).map((e) => [
      e.state,
      e.label,
      e.x,
      e.y,
    ])
  );
}

type ActionOutcome = "progress" | "skip" | "none";

/**
 * Thử một action từ `toAction`: `skip` khi bị từ chối hoặc chỉ ghi lại đúng giá
 * trị cũ (hết lượt lặp mà view không đổi — GT-015 ghi lại cùng ký hiệu vào ô đã
 * điền chỉ thêm event, tính nó là tiến triển thì bộ giải quay vòng mãi ở ô đó);
 * `progress` khi còn lượt lặp; `none` khi đã commit nhưng phải xét tiếp bằng
 * dấu vân tay toàn session.
 */
function tryAction(
  session: TemplateGameSession,
  action: NonNullable<ReturnType<NonNullable<TemplateGameSession["toAction"]>>>,
  uses: Map<string, number>
): ActionOutcome {
  // Nút dừng (GT-035, `BR-E035-13`) là lối thoát của trẻ muốn bỏ chương trình đang chạy;
  // người giải chờ robot chạy hết thay vì tự dừng nó.
  if (action.type === "stop_program") {
    return "skip";
  }
  const beforeView = viewFingerprint(session);
  if (!session.validateAction(action).valid) {
    return "skip";
  }
  session.commit?.(action);
  const key = JSON.stringify(action);
  const used = uses.get(key) ?? 0;
  if (used < MAX_REPEAT) {
    uses.set(key, used + 1);
    return "progress";
  }
  return viewFingerprint(session) === beforeView ? "skip" : "none";
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
    const outcome = action ? tryAction(session, action, uses) : "none";
    if (outcome === "progress") {
      return true;
    }
    if (outcome === "skip") {
      continue;
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
