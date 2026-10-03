import {
  computeStageZones,
  createGameSessionSync,
  type EngineConfig,
  type GameSession,
  type GT006Content,
  type GT006Difficulty,
  preloadGameSession,
  RoundRunner,
  type StageZones,
} from "@mindkid/game-engine";
import { beforeAll, describe, expect, it, vi } from "vitest";
import { ref } from "vue";
import { usePlayGesture } from "~/composables/play/use-play-gesture";

/**
 * Task #283 B4, `BR-PSZ-05` — GT-006 chỉ kết lượt qua gesture `commit`
 * (`GT-006/session.ts` `toAction` → `check_sequence`), còn bề mặt web chỉ có
 * `tap` tại một toạ độ canvas. Cùng họ lỗi H3 của GT-028
 * (`play-commit-reachability.test.ts`): khi chạm vào `zones.action`, shell đổi
 * `tap` thành `commit`. Ca âm: phiên không khai `needsCommit` thì quét tap
 * toàn canvas không thắng được.
 */

const GT006_CONTENT: GT006Content = {
  prompt: "Bé hãy xếp các bước rửa tay theo đúng thứ tự nhé!",
  sequence: [
    { step_id: "s1", order_index: 0, asset: { kind: "emoji", ref: "🚰" } },
    { step_id: "s2", order_index: 1, asset: { kind: "emoji", ref: "🧼" } },
    { step_id: "s3", order_index: 2, asset: { kind: "emoji", ref: "🧴" } },
  ],
};

/** Không xáo: dãy đã đúng ngay từ đầu, chỉ còn thiếu bước nộp. */
const GT006_DIFFICULTY: GT006Difficulty = {
  hint_after_ms: 10_000,
  allow_retry: true,
  shuffle_initial: false,
};

const GT006_ENGINE_CONFIG: EngineConfig = {
  level_code: "GL-TEST-GT006",
  content_version: 1,
  template_code: "GT-006",
  content_pack: GT006_CONTENT,
  difficulty_params: GT006_DIFFICULTY,
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
        content_pack: GT006_CONTENT,
        difficulty_params: { ...GT006_DIFFICULTY, item_count: 3 },
      },
    ],
    ageBand: "5-6",
    layoutSeed: 1,
    sessionFactory: (contentPack, difficultyParams, roundSeed) =>
      createGameSessionSync("GT-006", {
        ...GT006_ENGINE_CONFIG,
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
    throw new Error("Thiếu session GT-006");
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

/** Chạm hai lần cùng điểm: chạm trúng ô thì chọn rồi bỏ chọn, dãy không đổi. */
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

describe("Task #283 B4 — BR-PSZ-05: GT-006 nộp bài từ bề mặt web", () => {
  beforeAll(async () => {
    await preloadGameSession("GT-006");
  });

  it("dãy đúng nhưng chưa nộp thì chưa thắng; dispatch commit thì thắng — engine đúng", () => {
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
