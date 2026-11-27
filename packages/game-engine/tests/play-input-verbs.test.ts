import { beforeAll, describe, expect, it } from "vitest";
import type { EngineConfig } from "#src/core";
import { ACTION_QUIET_OK, TemplateGameSession } from "#src/game-session";
import {
  createGameSessionSync,
  preloadGameSession,
} from "#src/generated/session-loader";
import { acceptsDragVerb } from "#src/interaction";
import { CandySplit } from "#src/templates/GT-007/candy-split";
import { GT016_FIXTURES } from "#src/templates/GT-016/fixtures";
import { ClockHandsSession } from "#src/templates/GT-016/session";
import { GT034_FIXTURES } from "#src/templates/GT-034/fixtures";
import { GT034Session } from "#src/templates/GT-034/session";

/** Task #320 — verb phiên nhận quyết định shell có bật kéo không (BR-EIC-08). */

function configFor(
  code: string,
  fixture: { content: object; difficulty: object }
): EngineConfig {
  return {
    level_code: `GL-TEST-${code}`,
    content_version: 1,
    template_code: code,
    content_pack: fixture.content,
    difficulty_params: fixture.difficulty,
    theme_id: "default",
    age_band: "5-6",
    reduced_motion: false,
    audio_enabled: false,
    layout_seed: 1,
  } as EngineConfig;
}

describe("acceptedVerbs (BR-EIC-08)", () => {
  beforeAll(async () => {
    await preloadGameSession("GT-016");
  });

  it("createGameSessionSync gán verb template khai cho phiên", () => {
    const fixture = GT016_FIXTURES[1];
    if (!fixture) {
      throw new Error("Thiếu fixture GT-016");
    }
    const session = createGameSessionSync(
      "GT-016",
      configFor("GT-016", fixture)
    );
    expect(session).toBeInstanceOf(TemplateGameSession);
    if (session instanceof TemplateGameSession) {
      expect(session.acceptedVerbs()).toEqual([
        "tap",
        "adjust",
        "drop",
        "commit",
      ]);
    }
  });

  it("phiên dựng tay (chưa gán) nhận đủ sáu verb — giữ hành vi cũ", () => {
    const fixture = GT034_FIXTURES[0];
    if (!fixture) {
      throw new Error("Thiếu fixture GT-034");
    }
    const session = new GT034Session(fixture.content, fixture.difficulty);
    expect(session.acceptedVerbs()).toHaveLength(6);
  });

  it("GT-016 chỉ chế độ set mới kéo kim; read/match chỉ chạm", () => {
    const modes = GT016_FIXTURES.map((f) => {
      const s = new ClockHandsSession(f.content, f.difficulty);
      s.setDeclaredVerbs(["tap", "adjust", "drop", "commit"]);
      return [f.content.mode, acceptsDragVerb(s.acceptedVerbs())] as const;
    });
    expect(modes).toEqual([
      ["read", false],
      ["set", true],
      ["match", false],
    ]);
  });
});

describe("Thao tác không phải câu trả lời thì không chấm (BR-EIC-10)", () => {
  it("GT-034: bấm Nghe mẫu trả quiet, không pop", () => {
    const fixture = GT034_FIXTURES[0];
    if (!fixture) {
      throw new Error("Thiếu fixture GT-034");
    }
    const session = new GT034Session(fixture.content, fixture.difficulty);
    session.prepareRound("5-6");
    expect(session.validateAction({ type: "play_pattern", data: {} })).toEqual(
      ACTION_QUIET_OK
    );
  });

  it("GT-007: thả lại đúng khay đã khoá là noop, không tính sai", () => {
    const split = new CandySplit(5, [
      { id: "a", locked: true, goal: 2, initial: 2 },
      { id: "b", locked: false, goal: 3, initial: 0 },
    ]);
    expect(
      split.preview({ kind: "tray", index: 0 }, { kind: "tray", index: 0 })
    ).toBe("noop");
    expect(
      split.preview({ kind: "tray", index: 0 }, { kind: "tray", index: 1 })
    ).toBe("locked");
  });
});
