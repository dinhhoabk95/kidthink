import {
  computeZonesForSession,
  createGameSessionSync,
  type EngineConfig,
  type GameSession,
  type GT035Content,
  type GT035Difficulty,
  preloadGameSession,
  TemplateGameSession,
} from "@mindkid/game-engine";
import { beforeAll, describe, expect, it } from "vitest";
import {
  PORTRAIT_GATE_LABEL,
  resolveRequiresPortrait,
} from "~/composables/play/play-portrait-gate";

/** BR-PSZ-14 — shell xin xoay máy dọc khi bàn GT-035 không vừa ở khung ngang. */
const CONTENT: GT035Content = {
  prompt: "Bé xếp các lệnh mũi tên để dẫn robot về ngôi sao nhé!",
  grid: { rows: 3, cols: 3 },
  start: { col: 0, row: 0, facing: "right" },
  goal: { col: 2, row: 2, asset: { kind: "emoji", ref: "⭐" } },
  obstacles: [],
  collectibles: [],
  allowed_commands: ["forward", "turn_left", "turn_right"],
};

const DIFFICULTY: GT035Difficulty = {
  item_count: 2,
  max_commands: 6,
  obstacle_count: 0,
  collectible_count: 0,
  allow_loop: false,
  allow_retry: true,
  hint_after_ms: 10_000,
};

const CONFIG: EngineConfig = {
  level_code: "GL-TEST-GT035",
  content_version: 1,
  template_code: "GT-035",
  content_pack: CONTENT,
  difficulty_params: DIFFICULTY,
  theme_id: "default",
  age_band: "5-6",
  reduced_motion: false,
  audio_enabled: false,
};

const LOGIC_SHORT_SIDE = 540;
const LANDSCAPE = { w: 610, h: 350 };
const PORTRAIT = { w: 330, h: 697 };

function prepare(session: TemplateGameSession, canvas: typeof LANDSCAPE): void {
  const long = Math.floor(
    (LOGIC_SHORT_SIDE * Math.max(canvas.w, canvas.h)) /
      Math.min(canvas.w, canvas.h)
  );
  const space =
    canvas.w >= canvas.h
      ? { w: long, h: LOGIC_SHORT_SIDE }
      : { w: LOGIC_SHORT_SIDE, h: long };
  const cssPerLogic = canvas.w / space.w;
  const zones = computeZonesForSession(
    { logicW: space.w, logicH: space.h, ageBand: "5-6", cssPerLogic },
    session
  );
  session.prepareRound("5-6", space, zones.stage, undefined, cssPerLogic);
}

function createSession(): TemplateGameSession {
  const session: GameSession = createGameSessionSync("GT-035", CONFIG);
  if (!(session instanceof TemplateGameSession)) {
    throw new Error("GT-035 phải là TemplateGameSession");
  }
  return session;
}

describe("resolveRequiresPortrait (BR-PSZ-14)", () => {
  beforeAll(async () => {
    await preloadGameSession("GT-035");
  });

  it("GT-035 ở điện thoại ngang 610x350 xin xoay máy", () => {
    const session = createSession();
    prepare(session, LANDSCAPE);

    expect(resolveRequiresPortrait(session)).toBe(true);
  });

  it("GT-035 ở portrait 330x697 không xin xoay", () => {
    const session = createSession();
    prepare(session, PORTRAIT);

    expect(resolveRequiresPortrait(session)).toBe(false);
  });

  it("xoay từ ngang sang dọc thì lớp biến mất", () => {
    const session = createSession();
    prepare(session, LANDSCAPE);
    expect(resolveRequiresPortrait(session)).toBe(true);

    prepare(session, PORTRAIT);

    expect(resolveRequiresPortrait(session)).toBe(false);
  });

  it("không có session thì không xin xoay", () => {
    expect(resolveRequiresPortrait(null)).toBe(false);
    expect(resolveRequiresPortrait(undefined)).toBe(false);
  });

  it("nhãn a11y là câu tiếng Việt cố định", () => {
    expect(PORTRAIT_GATE_LABEL).toBe("Xoay máy dọc để chơi");
  });
});
