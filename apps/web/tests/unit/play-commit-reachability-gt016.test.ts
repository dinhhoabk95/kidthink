import {
  computeStageZones,
  createGameSessionSync,
  type EngineConfig,
  type GameSession,
  type GT016Content,
  type GT016Difficulty,
  preloadGameSession,
  RoundRunner,
  type StageZones,
} from "@mindkid/game-engine";
import { beforeAll, describe, expect, it, vi } from "vitest";
import { ref } from "vue";
import { usePlayGesture } from "~/composables/play/use-play-gesture";

/**
 * Task #283 B5, `BR-PSZ-05` — GT-016 `mode = set` chỉ nộp giờ qua gesture `commit`;
 * `tap` lên mặt đồng hồ không nộp (`GT-016.md` N3). Bề mặt web chỉ có `tap` tại
 * một toạ độ canvas, nên khi chạm vào `zones.action` shell đổi `tap` thành
 * `commit`. Ca âm: phiên không khai `needsCommit` thì quét tap toàn canvas không
 * thắng được, kể cả khi kim đã đúng giờ.
 */

const GT016_CONTENT: GT016Content = {
  prompt: "Bé hãy xoay kim đồng hồ về đúng 4 giờ nhé!",
  mode: "set",
  target_time: { hour: 4, minute: 0 },
  initial_time: { hour: 4, minute: 0 },
  options: [],
  activity_cards: [],
};

/** Kim đã đứng đúng giờ ngay từ đầu: chỉ còn thiếu bước nộp. */
const GT016_DIFFICULTY: GT016Difficulty = {
  item_count: 1,
  minute_step: 60,
  distractor_count: 0,
  hint_after_ms: 10_000,
  allow_retry: true,
};

const GT016_ENGINE_CONFIG: EngineConfig = {
  level_code: "GL-TEST-GT016",
  content_version: 1,
  template_code: "GT-016",
  content_pack: GT016_CONTENT,
  difficulty_params: GT016_DIFFICULTY,
  theme_id: "default",
  age_band: "5-6",
  reduced_motion: false,
  audio_enabled: false,
};

const LOGIC_W = 960;
const LOGIC_H = 540;
const SWEEP_STEP_PX = 12;

function makeRunner(): RoundRunner {
  return new RoundRunner({
    rounds: [
      {
        round_index: 0,
        content_pack: GT016_CONTENT,
        difficulty_params: GT016_DIFFICULTY,
      },
    ],
    ageBand: "5-6",
    layoutSeed: 1,
    sessionFactory: (contentPack, difficultyParams, roundSeed) =>
      createGameSessionSync("GT-016", {
        ...GT016_ENGINE_CONFIG,
        content_pack: contentPack,
        difficulty_params: difficultyParams,
        layout_seed: roundSeed,
      }),
    onPlayNarration: () => undefined,
  });
}

function zonesFor(needsCommit: boolean): StageZones {
  return computeStageZones({
    logicW: LOGIC_W,
    logicH: LOGIC_H,
    ageBand: "5-6",
    cssPerLogic: 1,
    needsTray: false,
    needsCommit,
  });
}

function makeGesture(session: GameSession, zones: StageZones) {
  const engine = {
    activeSession: session,
    acceptingInput: true,
    audio: {
      playSnapSound: vi.fn(),
      playPopCelebrateSound: vi.fn(),
      playSoftFeedbackSound: vi.fn(),
      playPromptAudio: vi.fn(),
      speakPrompt: vi.fn(),
    },
    renderSystem: {
      LOGIC_WIDTH: LOGIC_W,
      LOGIC_HEIGHT: LOGIC_H,
      toLogicPoint: (clientX: number, clientY: number) => ({
        x: clientX,
        y: clientY,
      }),
    },
  };
  const gesture = usePlayGesture({
    getEngine: () => engine as never,
    canvasRef: ref(null),
    onRoundWon: vi.fn(),
    getStageZones: () => zones,
  });
  gesture.syncView();
  return gesture;
}

function startSession(): GameSession {
  const runner = makeRunner();
  runner.startFirstRound();
  const session = runner.getCurrentSession();
  if (!session) {
    throw new Error("Thiếu session GT-016");
  }
  return session;
}

function tapAt(
  gesture: ReturnType<typeof usePlayGesture>,
  x: number,
  y: number,
  timeStamp: number
): void {
  gesture.handlePointerDown({
    pointerId: 1,
    clientX: x,
    clientY: y,
    timeStamp,
  } as PointerEvent);
  gesture.handlePointerUp({
    pointerId: 1,
    clientX: x,
    clientY: y,
    timeStamp: timeStamp + 10,
  } as PointerEvent);
}

/** Chạm hai lần cùng điểm: tap không bao giờ nộp giờ ở `mode = set`. */
function sweepAllCanvas(
  gesture: ReturnType<typeof usePlayGesture>,
  session: GameSession
): void {
  for (
    let y = 0;
    y <= LOGIC_H && !session.checkWinCondition();
    y += SWEEP_STEP_PX
  ) {
    for (
      let x = 0;
      x <= LOGIC_W && !session.checkWinCondition();
      x += SWEEP_STEP_PX
    ) {
      tapAt(gesture, x, y, 10);
      if (!session.checkWinCondition()) {
        tapAt(gesture, x, y, 40);
      }
    }
  }
}

describe("Task #283 B5 — BR-PSZ-05: GT-016 nộp giờ từ bề mặt web", () => {
  beforeAll(async () => {
    await preloadGameSession("GT-016");
  });

  it("kim đúng giờ nhưng chưa nộp thì chưa thắng; dispatch commit thì thắng — engine đúng", () => {
    const session = startSession();

    expect(session.checkWinCondition()).toBe(false);
    session.dispatch?.({ type: "commit", timeMs: 0 });

    expect(session.checkWinCondition()).toBe(true);
  });

  it("BR-PSZ-05 — chỉ dùng tap trên canvas vẫn thắng được vòng nhờ shell đổi chạm tại action zone", () => {
    const session = startSession();
    const gesture = makeGesture(session, zonesFor(true));

    sweepAllCanvas(gesture, session);

    expect(session.checkWinCondition()).toBe(true);
  });

  it("ca âm: khi needsCommit=false, quét tap trên canvas không bao giờ thắng được", () => {
    const session = startSession();
    const withoutCommit = Object.assign(Object.create(session), {
      needsCommit: false,
    });
    const gesture = makeGesture(withoutCommit, zonesFor(false));

    sweepAllCanvas(gesture, session);

    expect(session.checkWinCondition()).toBe(false);
  });
});
