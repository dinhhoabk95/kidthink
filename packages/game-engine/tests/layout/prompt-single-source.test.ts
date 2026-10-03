import { beforeAll, describe, expect, it, vi } from "vitest";
import type { AgeBand } from "#src/contracts/types";
import { type GameSession, TemplateGameSession } from "#src/game-session";
import {
  ALL_TEMPLATE_CODES,
  createGameSessionSync,
  type EngineConfig,
  preloadGameSession,
} from "#src/index";
import { deriveLogicSpace } from "#src/layout/constants";
import { computeStageZones } from "#src/layout/stage-zones";
import { drawPromptText } from "#src/render/shared-render";
import { RenderSystem } from "#src/systems/render-system";
import { GT009_FIXTURES } from "#src/templates/GT-009/fixtures";
import { FIXTURES_BY_CODE, type FixturePayload } from "../fixtures-map.ts";
import { createFakeCanvas } from "../gates/fake-canvas.ts";
import { GT009PromptZoneFlagWrongSession } from "./fixtures/gt-009-prompt-zone-flag-wrong.ts";

vi.mock("#src/render/shared-render", async (importOriginal) => {
  const actual =
    await importOriginal<typeof import("#src/render/shared-render")>();
  return { ...actual, drawPromptText: vi.fn(actual.drawPromptText) };
});

/**
 * Task #283 N0 — lời dẫn chỉ có một nguồn trong mỗi khung hình (`BR-PSZ-08..10`).
 *
 * Shell vẽ `drawPromptZone` khi session khai `usesPromptZone`; engine chưa dời
 * tự vẽ bằng `drawPromptText`. Hai nguồn cùng lúc là lời dẫn vẽ đôi.
 */
const PORTRAIT_CANVAS_CSS = { w: 330, h: 697 } as const;
const BAND: AgeBand = "5-6";

/** Sáu engine đã dời vào khung. Dời thêm engine thì thêm mã vào đây và đổi cờ. */
const MIGRATED_CODES: readonly string[] = [
  "GT-001",
  "GT-003",
  "GT-028",
  "GT-034",
  "GT-035",
  "GT-036",
];

function isFixturePayload(val: unknown): val is FixturePayload {
  return typeof val === "object" && val !== null;
}

function buildConfig(code: string): EngineConfig {
  const fixture = FIXTURES_BY_CODE[code]?.[0];
  if (!fixture) {
    throw new Error(`${code} không có fixture`);
  }
  return {
    level_code: `${code}-LV1`,
    content_version: 1,
    template_code: code,
    content_pack: isFixturePayload(fixture.content) ? fixture.content : {},
    difficulty_params: isFixturePayload(fixture.difficulty)
      ? fixture.difficulty
      : {},
    theme_id: "default",
    age_band: BAND,
    reduced_motion: false,
    audio_enabled: true,
  };
}

/** Phần của `TemplateGameSession` mà shell đọc để dựng khung và vẽ lời dẫn. */
type PromptShellSession = GameSession &
  Pick<
    TemplateGameSession<never, never>,
    "needsCommit" | "needsTray" | "prepareRound" | "usesPromptZone"
  >;

function createTemplateSession(code: string): PromptShellSession {
  const session = createGameSessionSync(code, buildConfig(code));
  if (!(session instanceof TemplateGameSession)) {
    throw new Error(`${code} không phải TemplateGameSession`);
  }
  return session;
}

/** Chuẩn bị vòng với `stageRect` như `RoundRunner`, vẽ một khung, đếm nguồn lời dẫn. */
function countPromptSources(session: PromptShellSession): number {
  const space = deriveLogicSpace(PORTRAIT_CANVAS_CSS.w, PORTRAIT_CANVAS_CSS.h);
  const zones = computeStageZones({
    logicW: space.w,
    logicH: space.h,
    ageBand: BAND,
    cssPerLogic: PORTRAIT_CANVAS_CSS.w / space.w,
    needsTray: session.needsTray,
    needsCommit: session.needsCommit,
  });
  session.prepareRound(BAND, space, zones.stage, zones.tray ?? undefined);
  const ctx = createFakeCanvas(
    PORTRAIT_CANVAS_CSS.w,
    PORTRAIT_CANVAS_CSS.h
  ).getContext("2d");
  if (!ctx) {
    throw new Error("fake canvas không có context");
  }
  const spy = vi.mocked(drawPromptText);
  spy.mockClear();
  session.render?.(ctx as CanvasRenderingContext2D, new RenderSystem(), 0);
  const engineDraws = spy.mock.calls.length;
  const hasPrompt = Boolean(session.getView?.().activePrompt);
  const shellDraws = session.usesPromptZone && hasPrompt ? 1 : 0;
  return engineDraws + shellDraws;
}

describe("lời dẫn chỉ vẽ một nơi cho mỗi khung hình (Task #283 N0)", () => {
  beforeAll(async () => {
    for (const code of ALL_TEMPLATE_CODES) {
      await preloadGameSession(code);
    }
  });

  it.each(ALL_TEMPLATE_CODES)(
    "%s — đúng một nguồn lời dẫn ở portrait 390",
    (code) => {
      expect(countPromptSources(createTemplateSession(code))).toBe(1);
    }
  );

  it.each(ALL_TEMPLATE_CODES)(
    "%s — cờ usesPromptZone khớp danh sách đã dời",
    (code) => {
      expect(createTemplateSession(code).usesPromptZone).toBe(
        MIGRATED_CODES.includes(code)
      );
    }
  );

  it("ca âm: engine chưa dời khai cờ sai thì có hai nguồn lời dẫn", () => {
    const fixture = GT009_FIXTURES[0];
    if (!fixture) {
      throw new Error("GT-009 không có fixture");
    }
    const session = new GT009PromptZoneFlagWrongSession(
      fixture.content,
      fixture.difficulty
    );

    expect(countPromptSources(session)).toBe(2);
  });
});
