import { ALL_SEED_LEVELS } from "@mindkid/content-build";
import { beforeAll, describe, expect, it, vi } from "vitest";
import type { AgeBand } from "#src/contracts/types";
import { type GameSession, TemplateGameSession } from "#src/game-session";
import {
  createGameSessionSync,
  type EngineConfig,
  preloadGameSession,
} from "#src/index";
import {
  DEFAULT_LOGIC_SPACE,
  deriveLogicSpace,
  getTouchFloor,
} from "#src/layout/constants";
import { computeStageZones, type StageZones } from "#src/layout/stage-zones";
import { RenderSystem } from "#src/systems/render-system";
import { GT034_FIXTURES } from "#src/templates/GT-034/fixtures";
import { GT034Session } from "#src/templates/GT-034/session";
import {
  GT034ContentSchema,
  GT034DifficultySchema,
} from "#src/templates/GT-034/template";
import { GT035_FIXTURES } from "#src/templates/GT-035/fixtures";
import { GT035Session } from "#src/templates/GT-035/session";
import {
  GT035ContentSchema,
  GT035DifficultySchema,
} from "#src/templates/GT-035/template";
import { GT036_FIXTURES } from "#src/templates/GT-036/fixtures";
import { GT036Session } from "#src/templates/GT-036/session";
import {
  GT036ContentSchema,
  GT036DifficultySchema,
} from "#src/templates/GT-036/template";
import { FIXTURES_BY_CODE } from "../fixtures-map.ts";
import { GT035LegacyCoordsSession } from "./fixtures/gt-035-legacy-coords.ts";
import { MIGRATED_CODES } from "./migrated-codes.ts";
import {
  findDrawsOutsideStage,
  findHitPairViolations,
  findSlotsOutsideStage,
} from "./stage-checks.ts";

vi.mock("#src/render/shared-render", async (importOriginal) => {
  const actual =
    await importOriginal<typeof import("#src/render/shared-render")>();
  // Nền cảnh phủ cả canvas là lớp 1 của khung, không phải phần engine vẽ.
  return { ...actual, drawSceneBackground: vi.fn() };
});

/**
 * Engine đã dời vào khung năm vùng (`MIGRATED_CODES`), tham số theo mã:
 * khối đầu kiểm chung cho cả sáu engine; các khối sau là hành vi riêng của
 * GT-034/035/036 (Task #277 S7, plan H12).
 *
 * Portrait 390x844: hộp canvas còn 330x697 px CSS sau HUD và đệm
 * (`277-play-stage-zones-plan.md` mục 1.3, M2). Ba engine chỉ cho band 5-6.
 */
const PORTRAIT_CANVAS_CSS = { w: 330, h: 697 } as const;
const BAND: AgeBand = "5-6";

type StageSession = GT034Session | GT035Session | GT036Session;

interface LevelCase {
  readonly name: string;
  readonly create: () => StageSession;
}

function portraitZones(): {
  zones: StageZones;
  space: { w: number; h: number };
} {
  const space = deriveLogicSpace(PORTRAIT_CANVAS_CSS.w, PORTRAIT_CANVAS_CSS.h);
  const zones = computeStageZones({
    logicW: space.w,
    logicH: space.h,
    ageBand: BAND,
    cssPerLogic: PORTRAIT_CANVAS_CSS.w / space.w,
    needsTray: false,
    needsCommit: true,
  });
  return { zones, space };
}

function seededLevels(code: string) {
  return ALL_SEED_LEVELS.filter((level) => level.header.template_code === code);
}

const GT034_CASES: LevelCase[] = [
  ...GT034_FIXTURES.map((f) => ({
    name: `mẫu ${f.id}`,
    create: () => new GT034Session(f.content, f.difficulty),
  })),
  ...seededLevels("GT-034").map((level) => ({
    name: `seed ${level.header.code}`,
    create: () =>
      new GT034Session(
        GT034ContentSchema.parse(level.content_pack),
        GT034DifficultySchema.parse(level.difficulty_params)
      ),
  })),
];

const GT035_CASES: LevelCase[] = [
  ...GT035_FIXTURES.map((f) => ({
    name: `mẫu ${f.id}`,
    create: () => new GT035Session(f.content, f.difficulty),
  })),
  ...seededLevels("GT-035").map((level) => ({
    name: `seed ${level.header.code}`,
    create: () =>
      new GT035Session(
        GT035ContentSchema.parse(level.content_pack),
        GT035DifficultySchema.parse(level.difficulty_params)
      ),
  })),
];

const GT036_CASES: LevelCase[] = [
  ...GT036_FIXTURES.map((f) => ({
    name: `mẫu ${f.id}`,
    create: () => new GT036Session(f.content, f.difficulty),
  })),
  ...seededLevels("GT-036").map((level) => ({
    name: `seed ${level.header.code}`,
    create: () =>
      new GT036Session(
        GT036ContentSchema.parse(level.content_pack),
        GT036DifficultySchema.parse(level.difficulty_params)
      ),
  })),
];

/** Đi gần hết lượt để nhãn dưới ô (nhạc cụ, lệnh, robot) cũng được vẽ. */
function playMostOfRound(session: StageSession): void {
  if (session instanceof GT034Session) {
    for (const step of session.content.target_pattern.slice(0, -1)) {
      session.commit({
        type: step === null ? "tap_rest" : "tap_instrument",
        data: { instrument_id: step ?? "" },
      });
    }
    return;
  }
  if (session instanceof GT035Session) {
    const first = session.content.allowed_commands?.[0] ?? "forward";
    const maxCommands = session.difficulty.max_commands ?? 0;
    for (let i = 0; i < maxCommands; i++) {
      session.commit({ type: "add_command", data: { command: first } });
    }
    return;
  }
  const first = session.content.palette[0];
  for (let i = 0; i < session.content.track_length; i++) {
    session.commit({
      type: "place_element",
      data: { slotIndex: i, elementId: first?.id ?? "" },
    });
  }
}

describe.each([
  { code: "GT-034", cases: GT034_CASES },
  { code: "GT-035", cases: GT035_CASES },
  { code: "GT-036", cases: GT036_CASES },
])(
  "$code vào khung năm vùng ở portrait 390 (Task #277 S7)",
  ({ code, cases }) => {
    const { zones, space } = portraitZones();

    it("có level đã seed để chạy lại, không chỉ level mẫu (BR-LAY-10)", () => {
      expect(seededLevels(code).length).toBeGreaterThan(0);
    });

    it.each(cases)(
      "$name — không cặp vùng chạm nào chồng nhau (BR-LAY-05)",
      ({ create }) => {
        const session = create();
        session.prepareRound(BAND, space, zones.stage);

        expect(findHitPairViolations(session.slots)).toEqual([]);
        expect(findSlotsOutsideStage(session.slots, zones.stage)).toEqual([]);
      }
    );

    it.each(cases)(
      "$name — mọi lệnh vẽ nằm trong zones.stage (BR-PSZ-01)",
      ({ create }) => {
        const session = create();
        session.prepareRound(BAND, space, zones.stage);
        const rs = new RenderSystem();

        const opening = findDrawsOutsideStage(zones.stage, (ctx) =>
          session.render(ctx, rs)
        );
        playMostOfRound(session);
        const midRound = findDrawsOutsideStage(zones.stage, (ctx) =>
          session.render(ctx, rs)
        );

        expect(opening).toEqual([]);
        expect(midRound).toEqual([]);
      }
    );

    it("nút phụ không còn là slot trên sân khấu — shell vẽ ở zones.action (BR-PSZ-05)", () => {
      const first = cases[0];
      if (!first) {
        throw new Error(`${code} không có level`);
      }
      const session = first.create();
      session.prepareRound(BAND, space, zones.stage);

      expect(session.needsCommit).toBe(true);
      const ids = session.getView().entities.map((entity) => entity.id);
      for (const buttonId of [
        "replay_btn",
        "run_btn",
        "submit_btn",
        "clear_btn",
      ]) {
        expect(ids).not.toContain(buttonId);
      }
      expect(session.getView().entities).toHaveLength(session.slots.length);
    });
  }
);

describe("Gesture commit từ vùng hành động (BR-PSZ-05)", () => {
  const { zones, space } = portraitZones();

  it("GT-034: commit là nghe mẫu; nút mờ khi mẫu đang phát", () => {
    const f = GT034_FIXTURES[0];
    if (!f) {
      throw new Error("Thiếu fixture GT-034");
    }
    const session = new GT034Session(f.content, f.difficulty);
    session.prepareRound(BAND, space, zones.stage);

    expect(session.commitIcon).toBe("listen");
    expect(session.canCommit()).toBe(true);
    const verdict = session.dispatch({ type: "commit", timeMs: 0 });

    expect(verdict?.valid).toBe(true);
    expect(session.replaysUsed).toBe(1);
    expect(session.canCommit()).toBe(false);
  });

  it("GT-035: commit là chạy chương trình; nút mờ khi hàng lệnh rỗng", () => {
    const f = GT035_FIXTURES[0];
    if (!f) {
      throw new Error("Thiếu fixture GT-035");
    }
    const session = new GT035Session(f.content, f.difficulty);
    session.prepareRound(BAND, space, zones.stage);

    expect(session.commitIcon).toBe("play");
    expect(session.canCommit()).toBe(false);
    session.commit({ type: "add_command", data: { command: "forward" } });
    expect(session.canCommit()).toBe(true);

    session.dispatch({ type: "commit", timeMs: 0 });
    expect(session.executionResult).not.toBeNull();
  });

  it("GT-036: commit là nộp dải; chạm lại ô đang mang đúng phần tử đang cầm thì gỡ", () => {
    const f = GT036_FIXTURES[0];
    if (!f) {
      throw new Error("Thiếu fixture GT-036");
    }
    const session = new GT036Session(f.content, f.difficulty);
    session.prepareRound(BAND, space, zones.stage);
    const track0 = session.slots[0];
    if (!track0) {
      throw new Error("Thiếu ô dải đầu");
    }

    expect(session.canCommit()).toBe(false);
    session.dispatch({ type: "tap", x: track0.x, y: track0.y, timeMs: 0 });
    expect(session.placedElements[0]).toBe(session.selectedPaletteId);
    expect(session.canCommit()).toBe(true);

    session.dispatch({ type: "tap", x: track0.x, y: track0.y, timeMs: 1 });
    expect(session.placedElements[0]).toBeNull();

    session.dispatch({ type: "tap", x: track0.x, y: track0.y, timeMs: 2 });
    session.dispatch({ type: "commit", timeMs: 3 });
    expect(session.submitted).toBe(true);
  });
});

describe("Ca âm: GT-035 với toạ độ cứng cũ (plan H12)", () => {
  const f = GT035_FIXTURES[0];
  if (!f) {
    throw new Error("Thiếu fixture GT-035");
  }

  it("portrait 390: slot cũ ra ngoài zones.stage", () => {
    const { zones, space } = portraitZones();
    const session = new GT035LegacyCoordsSession(f.content, f.difficulty);
    session.prepareRound(BAND, space, zones.stage);

    expect(
      findSlotsOutsideStage(session.slots, zones.stage).length
    ).toBeGreaterThan(0);
  });

  it("canvas 960x540: hàng lệnh và khay lệnh cũ có vùng chạm chồng nhau", () => {
    const session = new GT035LegacyCoordsSession(f.content, f.difficulty);
    session.prepareRound(BAND, DEFAULT_LOGIC_SPACE);

    expect(findHitPairViolations(session.slots).length).toBeGreaterThan(0);
  });
});

/** Phần của `TemplateGameSession` mà khối kiểm chung cần. */
type ZoneSession = GameSession &
  Pick<
    TemplateGameSession<never, never>,
    "needsCommit" | "needsTray" | "prepareRound" | "slots" | "usesPromptZone"
  >;

function isFixturePayload(val: unknown): val is Record<string, unknown> {
  return typeof val === "object" && val !== null;
}

function configFor(
  code: string,
  content: unknown,
  difficulty: unknown
): EngineConfig {
  return {
    level_code: `${code}-LV1`,
    content_version: 1,
    template_code: code,
    content_pack: isFixturePayload(content) ? content : {},
    difficulty_params: isFixturePayload(difficulty) ? difficulty : {},
    theme_id: "default",
    age_band: BAND,
    reduced_motion: false,
    audio_enabled: true,
  };
}

function zoneSessionCases(
  code: string
): Array<{ name: string; create: () => ZoneSession }> {
  const make = (config: EngineConfig): ZoneSession => {
    const session = createGameSessionSync(code, config);
    if (!(session instanceof TemplateGameSession)) {
      throw new Error(`${code} không phải TemplateGameSession`);
    }
    return session;
  };
  const fromFixtures = (FIXTURES_BY_CODE[code] ?? []).map((f, i) => ({
    name: `mẫu ${i}`,
    create: () => make(configFor(code, f.content, f.difficulty)),
  }));
  const fromSeeds = seededLevels(code).map((level) => ({
    name: `seed ${level.header.code}`,
    create: () =>
      make(configFor(code, level.content_pack, level.difficulty_params)),
  }));
  return [...fromFixtures, ...fromSeeds];
}

/**
 * Nợ đã đo: số ca (mẫu + seed) có cặp vùng chạm cách nhau < `SLOT_GAP_PX`
 * (`BR-LAY-05`), theo mã. GT-003 với 6 vật trở lên trong khay 508 px (đo: 20 ca seed): sàn 64 cộng khe
 * 16 = 480 > 476 chỗ trống, nên cặp chỉ cách 15. Số chỉ được giảm; gỡ mục này
 * khi `computeTraySourceSlots` cho khay đổi cột hoặc phân trang.
 */
const KNOWN_HIT_GAP_DEBT_CASES: Readonly<Record<string, number>> = {
  "GT-003": 20,
  // Task #283 B3 — khay một hàng portrait chứa tối đa 4 nguồn ở sàn 64 px CSS:
  // GT-004 có 4–10 vật, GT-008 có tới 9 vật. Chi tiết theo khung ở
  // `stage-engines-b3.test.ts`.
  "GT-004": 320,
  "GT-008": 4,
  // Task #283 B6 — GT-031 có tới 4+ xu trong khay một hàng portrait; chi tiết
  // theo khung ở `stage-engines-b6.test.ts`.
  "GT-031": 14,
};

/** Vùng sân khấu và khay (nếu có) — slot hợp lệ nằm trọn trong một trong hai. */
function findSlotsOutsideZones(session: ZoneSession, zones: StageZones) {
  return session.slots.filter(
    (slot) =>
      findSlotsOutsideStage([slot], zones.stage).length > 0 &&
      (zones.tray === null ||
        findSlotsOutsideStage([slot], zones.tray).length > 0)
  );
}

describe.each(MIGRATED_CODES)(
  "%s vào khung năm vùng — kiểm chung theo mã (Task #283 N)",
  (code) => {
    beforeAll(async () => {
      await preloadGameSession(code);
    });

    it("khai usesPromptZone — shell vẽ lời dẫn (BR-PSZ-08)", () => {
      const first = zoneSessionCases(code)[0];
      expect(first?.create().usesPromptZone).toBe(true);
    });

    it("mọi slot nằm trong zones.stage hoặc zones.tray và vùng chạm không chồng (BR-PSZ-01, BR-LAY-05)", () => {
      const gapViolatingCases: string[] = [];
      for (const { name, create } of zoneSessionCases(code)) {
        const session = create();
        const space = deriveLogicSpace(
          PORTRAIT_CANVAS_CSS.w,
          PORTRAIT_CANVAS_CSS.h
        );
        const zones = computeStageZones({
          logicW: space.w,
          logicH: space.h,
          ageBand: BAND,
          cssPerLogic: PORTRAIT_CANVAS_CSS.w / space.w,
          needsTray: session.needsTray,
          needsCommit: session.needsCommit,
        });
        session.prepareRound(BAND, space, zones.stage, zones.tray ?? undefined);

        expect(
          findSlotsOutsideZones(session, zones),
          `${code} ${name}`
        ).toEqual([]);
        if (findHitPairViolations(session.slots).length > 0) {
          gapViolatingCases.push(name);
        }
      }
      expect(
        gapViolatingCases.length,
        gapViolatingCases.join(", ")
      ).toBeLessThanOrEqual(KNOWN_HIT_GAP_DEBT_CASES[code] ?? 0);
    });

    it("vùng chạm × cssPerLogic ≥ sàn band khi shell truyền cssPerLogic (BR-PSZ-04)", () => {
      const floor = getTouchFloor(BAND);
      for (const { name, create } of zoneSessionCases(code)) {
        const session = create();
        const space = deriveLogicSpace(
          PORTRAIT_CANVAS_CSS.w,
          PORTRAIT_CANVAS_CSS.h
        );
        const cssPerLogic = PORTRAIT_CANVAS_CSS.w / space.w;
        const zones = computeStageZones({
          logicW: space.w,
          logicH: space.h,
          ageBand: BAND,
          cssPerLogic,
          needsTray: session.needsTray,
          needsCommit: session.needsCommit,
        });
        session.prepareRound(
          BAND,
          space,
          zones.stage,
          zones.tray ?? undefined,
          cssPerLogic
        );

        const below = session.slots.filter(
          (slot) =>
            slot.role !== "neutral" &&
            Math.min(slot.hitW, slot.hitH) * cssPerLogic < floor - 0.01
        );
        expect(below.length, `${code} ${name}`).toBe(0);
      }
    });
  }
);
