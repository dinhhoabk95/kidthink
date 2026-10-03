import { ALL_SEED_LEVELS } from "@mindkid/content-build";
import { beforeAll, describe, expect, it } from "vitest";
import { type GameSession, TemplateGameSession } from "#src/game-session";
import {
  createGameSessionSync,
  type EngineConfig,
  preloadGameSession,
} from "#src/index";
import { deriveLogicSpace } from "#src/layout/constants";
import {
  computeZonesForSession,
  stageFlagsOf,
} from "#src/layout/session-zones";
import { computeStageZones } from "#src/layout/stage-zones";
import { FIXTURES_BY_CODE } from "../fixtures-map.ts";
import { findSlotsOutsideStage } from "./stage-checks.ts";

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

describe("số vật khay đổi theo vòng (BR-PSZ-13)", () => {
  const space = deriveLogicSpace(330, 697);
  const cssPerLogic = Math.min(330 / space.w, 697 / space.h);

  function seededTraySessions(): TemplateGameSession<never, never>[] {
    return ALL_SEED_LEVELS.filter(
      (level) => level.header.template_code === TRAY_CODE
    ).map((level) => {
      const session = createGameSessionSync(TRAY_CODE, {
        level_code: level.header.code,
        content_version: 1,
        template_code: TRAY_CODE,
        content_pack: level.content_pack,
        difficulty_params: level.difficulty_params,
        theme_id: "default",
        age_band: "4-5",
        reduced_motion: false,
        audio_enabled: true,
      });
      if (!(session instanceof TemplateGameSession)) {
        throw new Error("GT-004 không phải TemplateGameSession");
      }
      return session;
    });
  }

  it("vòng đông vật có khay cao hơn vòng ít vật và slot nguồn nằm trong khay của chính nó", () => {
    const sessions = seededTraySessions().sort(
      (a, b) => a.trayItemCount - b.trayItemCount
    );
    const few = sessions[0];
    const many = sessions.at(-1);
    if (!(few && many)) {
      throw new Error("thiếu level seed GT-004");
    }
    expect(many.trayItemCount).toBeGreaterThan(few.trayItemCount);

    const input = {
      logicW: space.w,
      logicH: space.h,
      ageBand: "4-5",
      cssPerLogic,
    } as const;
    const zonesFew = computeZonesForSession(input, few);
    const zonesMany = computeZonesForSession(input, many);
    many.prepareRound(
      "4-5",
      space,
      zonesMany.stage,
      zonesMany.tray ?? undefined,
      cssPerLogic
    );

    expect(zonesMany.tray?.h).toBeGreaterThan(zonesFew.tray?.h ?? 0);
    const tray = zonesMany.tray;
    expect(tray).not.toBeNull();
    const sources = many.slots.filter((slot) => slot.role === "source");
    expect(sources.length).toBe(many.trayItemCount);
    expect(sources.every((slot) => slot.page === 0)).toBe(true);
    expect(
      tray ? findSlotsOutsideStage(sources, tray) : ["thiếu khay"]
    ).toEqual([]);
  });
});
