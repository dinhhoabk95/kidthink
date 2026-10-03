import { beforeAll, describe, expect, it } from "vitest";
import { type GameSession, TemplateGameSession } from "#src/game-session";
import {
  createGameSessionSync,
  type EngineConfig,
  preloadGameSession,
} from "#src/index";
import {
  computeZonesForSession,
  stageFlagsOf,
} from "#src/layout/session-zones";
import { computeStageZones } from "#src/layout/stage-zones";
import { FIXTURES_BY_CODE } from "../fixtures-map.ts";

/**
 * Shell tính vùng qua `computeZonesForSession` (`BR-PSZ-13`): khay cao theo số vật
 * nên mọi nơi tính vùng phải đưa cùng `trayItems` của session.
 */
const TRAY_CODE = "GT-004";
const PLAIN_CODE = "GT-009";
const LOGIC = {
  logicW: 540,
  logicH: 1140,
  ageBand: "4-5",
  cssPerLogic: 0.611,
} as const;

function sessionFor(code: string): GameSession {
  const fixture = FIXTURES_BY_CODE[code]?.[0];
  if (!fixture) {
    throw new Error(`thiếu fixture ${code}`);
  }
  const config: EngineConfig = {
    level_code: `${code}-LV1`,
    content_version: 1,
    template_code: code,
    content_pack: fixture.content,
    difficulty_params: fixture.difficulty,
    theme_id: "default",
    age_band: "4-5",
    reduced_motion: false,
    audio_enabled: true,
  };
  return createGameSessionSync(code, config);
}

beforeAll(async () => {
  await preloadGameSession(TRAY_CODE);
  await preloadGameSession(PLAIN_CODE);
});

describe("stageFlagsOf", () => {
  it("session có khay khai số vật khay từ content", () => {
    const session = sessionFor(TRAY_CODE);

    const flags = stageFlagsOf(session);

    expect(flags.needsTray).toBe(true);
    expect(session instanceof TemplateGameSession).toBe(true);
    expect(flags.trayItems).toBeGreaterThan(0);
  });

  it("session không khay không có số vật khay", () => {
    const flags = stageFlagsOf(sessionFor(PLAIN_CODE));

    expect(flags.needsTray).toBe(false);
    expect(flags.trayItems).toBe(0);
  });

  it("không có session thì không khay và không nút", () => {
    expect(stageFlagsOf(null)).toEqual({
      needsTray: false,
      needsCommit: false,
    });
  });
});

describe("computeZonesForSession", () => {
  it("khớp computeStageZones với cờ của session — khay không lệch khay engine đặt", () => {
    const session = sessionFor(TRAY_CODE);

    const viaSession = computeZonesForSession(LOGIC, session);
    const direct = computeStageZones({
      ...LOGIC,
      ...stageFlagsOf(session),
    });

    expect(viaSession).toEqual(direct);
  });

  it("khay đông cao hơn khay ít vật ở cùng viewport", () => {
    const base = computeStageZones({
      ...LOGIC,
      needsTray: true,
      needsCommit: false,
      trayItems: 2,
    });
    const crowded = computeStageZones({
      ...LOGIC,
      needsTray: true,
      needsCommit: false,
      trayItems: 10,
    });

    expect(crowded.tray?.h).toBeGreaterThan(base.tray?.h ?? 0);
  });
});
