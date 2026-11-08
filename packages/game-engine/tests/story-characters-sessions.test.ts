import { describe, expect, it, vi } from "vitest";
import type { AgeBand } from "#src/contracts/types";
import { deriveLogicSpace, type LogicSpace } from "#src/layout/constants";
import { computeStageZones, type ZoneRect } from "#src/layout/stage-zones";
import type { Slot } from "#src/layout/types";
import {
  drawStoryCharacterInStage,
  placeStoryCharacter,
  STORY_CHARACTER_SIZE_PX,
  type StoryCharacterKind,
} from "#src/render/craft-shapes";
import { RenderSystem } from "#src/systems/render-system";
import { GT005_FIXTURES } from "#src/templates/GT-005/fixtures.js";
import { GT005Session } from "#src/templates/GT-005/session.js";
import { GT007_FIXTURES } from "#src/templates/GT-007/fixtures.js";
import { GT007Session } from "#src/templates/GT-007/session.js";
import { GT008_FIXTURES } from "#src/templates/GT-008/fixtures.js";
import { GT008Session } from "#src/templates/GT-008/session.js";
import { GT009_FIXTURES } from "#src/templates/GT-009/fixtures.js";
import { GT009Session } from "#src/templates/GT-009/session.js";
import { GT010_FIXTURES } from "#src/templates/GT-010/fixtures.js";
import { SubstitutionSession } from "#src/templates/GT-010/session.js";
import { GT011_FIXTURES } from "#src/templates/GT-011/fixtures.js";
import { GT011Session } from "#src/templates/GT-011/session.js";
import { GT013_FIXTURES } from "#src/templates/GT-013/fixtures.js";
import { GT013Session } from "#src/templates/GT-013/session.js";
import { GT014_FIXTURES } from "#src/templates/GT-014/fixtures.js";
import { GT014Session } from "#src/templates/GT-014/session.js";
import { GT015_FIXTURES } from "#src/templates/GT-015/fixtures.js";
import { GT015Session } from "#src/templates/GT-015/session.js";
import { GT017_FIXTURES } from "#src/templates/GT-017/fixtures.js";
import { GT017Session } from "#src/templates/GT-017/session.js";
import { GT019_FIXTURES } from "#src/templates/GT-019/fixtures.js";
import { GT019Session } from "#src/templates/GT-019/session.js";
import { GT021_FIXTURES } from "#src/templates/GT-021/fixtures.js";
import { GT021Session } from "#src/templates/GT-021/session.js";
import { GT022_FIXTURES } from "#src/templates/GT-022/fixtures.js";
import { GT022Session } from "#src/templates/GT-022/session.js";
import { GT023_FIXTURES } from "#src/templates/GT-023/fixtures.js";
import { GT023Session } from "#src/templates/GT-023/session.js";
import { GT027_FIXTURES } from "#src/templates/GT-027/fixtures.js";
import { GT027Session } from "#src/templates/GT-027/session.js";
import { GT030_FIXTURES } from "#src/templates/GT-030/fixtures.js";
import { GT030Session } from "#src/templates/GT-030/session.js";
import { GT032_FIXTURES } from "#src/templates/GT-032/fixtures.js";
import { GT032Session } from "#src/templates/GT-032/session.js";
import { GT034_FIXTURES } from "#src/templates/GT-034/fixtures.js";
import { GT034Session } from "#src/templates/GT-034/session.js";
import { GT036_FIXTURES } from "#src/templates/GT-036/fixtures.js";
import { GT036Session } from "#src/templates/GT-036/session.js";
import { createFakeCanvas } from "./gates/fake-canvas.ts";

vi.mock("#src/render/craft-shapes", async (importOriginal) => {
  const actual =
    await importOriginal<typeof import("#src/render/craft-shapes")>();
  return {
    ...actual,
    drawStoryCharacterInStage: vi.fn(actual.drawStoryCharacterInStage),
  };
});

/**
 * Nhân vật kể chuyện của GT-005, GT-007..011 (Đợt A) và GT-013..015, GT-017,
 * GT-019, GT-021..023 (Đợt B): ở mọi khung, mọi band, mọi fixture, nhân vật (nếu vẽ)
 * nằm trong sân khấu, không chồng vùng chạm nào và không đổi `slots`.
 */
interface ProbeSession {
  readonly needsCommit: boolean;
  readonly needsTray: boolean;
  readonly slots: readonly Slot[];
  readonly stageRowCount: number;
  readonly trayHasLabels: boolean;
  readonly trayItemCount: number;
  prepareRound(
    band: AgeBand,
    space?: LogicSpace,
    stage?: ZoneRect,
    tray?: ZoneRect,
    cssPerLogic?: number
  ): void;
  render(ctx: CanvasRenderingContext2D, rs: RenderSystem, t: number): void;
}

interface Probe {
  readonly code: string;
  readonly kind: StoryCharacterKind;
  /**
   * Fixture có ô chạm lấp kín sân khấu (GT-007 chia kẹo: ô tổng và hai khay cao
   * gần hết sân khấu) thì không còn góc trống ở khung nào — không vẽ nhân vật.
   */
  readonly fillsStage?: readonly boolean[];
  readonly sessions: readonly (() => ProbeSession)[];
}

const PROBES: readonly Probe[] = [
  {
    code: "GT-005",
    kind: "squirrel",
    sessions: GT005_FIXTURES.map(
      (f) => () => new GT005Session(f.content, f.difficulty, 0)
    ),
  },
  {
    code: "GT-007",
    kind: "monkey",
    fillsStage: GT007_FIXTURES.map(
      (f) => f.content.representation === "discrete-object"
    ),
    sessions: GT007_FIXTURES.map(
      (f) => () => new GT007Session(f.content, f.difficulty, 0)
    ),
  },
  {
    code: "GT-008",
    kind: "elephant",
    sessions: GT008_FIXTURES.map(
      (f) => () => new GT008Session(f.content, f.difficulty, 0)
    ),
  },
  {
    code: "GT-009",
    kind: "weasel",
    sessions: GT009_FIXTURES.map(
      (f) => () => new GT009Session(f.content, f.difficulty, 0)
    ),
  },
  {
    code: "GT-010",
    kind: "hen",
    sessions: GT010_FIXTURES.map(
      (f) => () => new SubstitutionSession(f.content, f.difficulty, 0)
    ),
  },
  {
    code: "GT-011",
    kind: "butterfly",
    sessions: GT011_FIXTURES.map(
      (f) => () => new GT011Session(f.content, f.difficulty, 0)
    ),
  },
  {
    code: "GT-013",
    kind: "mouse",
    sessions: GT013_FIXTURES.map(
      (f) => () => new GT013Session(f.content, f.difficulty, 0)
    ),
  },
  {
    code: "GT-014",
    kind: "hippo",
    sessions: GT014_FIXTURES.map(
      (f) => () => new GT014Session(f.content, f.difficulty, 0)
    ),
  },
  {
    code: "GT-015",
    kind: "giraffe",
    sessions: GT015_FIXTURES.map(
      (f) => () => new GT015Session(f.content, f.difficulty, 0)
    ),
  },
  {
    code: "GT-017",
    kind: "beaver",
    sessions: GT017_FIXTURES.map(
      (f) => () => new GT017Session(f.content, f.difficulty, 0)
    ),
  },
  {
    code: "GT-019",
    kind: "bat",
    sessions: GT019_FIXTURES.map(
      (f) => () => new GT019Session(f.content, f.difficulty, 0)
    ),
  },
  {
    code: "GT-021",
    kind: "fairy",
    sessions: GT021_FIXTURES.map(
      (f) => () => new GT021Session(f.content, f.difficulty, 0)
    ),
  },
  {
    code: "GT-022",
    kind: "duck",
    sessions: GT022_FIXTURES.map(
      (f) => () => new GT022Session(f.content, f.difficulty, 0)
    ),
  },
  {
    code: "GT-023",
    kind: "woodpecker",
    sessions: GT023_FIXTURES.map(
      (f) => () => new GT023Session(f.content, f.difficulty, 0)
    ),
  },
  {
    code: "GT-027",
    kind: "fox",
    sessions: GT027_FIXTURES.map(
      (f) => () => new GT027Session(f.content, f.difficulty, 0)
    ),
  },
  {
    code: "GT-030",
    kind: "caterpillar",
    sessions: GT030_FIXTURES.map(
      (f) => () => new GT030Session(f.content, f.difficulty, 0)
    ),
  },
  {
    code: "GT-032",
    kind: "pony",
    sessions: GT032_FIXTURES.map(
      (f) => () => new GT032Session(f.content, f.difficulty, 0)
    ),
  },
  {
    code: "GT-034",
    kind: "cricket",
    sessions: GT034_FIXTURES.map(
      (f) => () => new GT034Session(f.content, f.difficulty, 0)
    ),
  },
  {
    code: "GT-036",
    kind: "nightingale",
    sessions: GT036_FIXTURES.map(
      (f) => () => new GT036Session(f.content, f.difficulty, 0)
    ),
  },
];

const VIEWPORTS = [
  { name: "portrait 330x697", cssW: 330, cssH: 697 },
  { name: "portrait 390x844", cssW: 390, cssH: 844 },
  { name: "điện thoại ngang 610x350", cssW: 610, cssH: 350 },
  { name: "điện thoại ngang 844x390", cssW: 844, cssH: 390 },
  { name: "máy tính bảng 1024x640", cssW: 1024, cssH: 640 },
  { name: "mặc định 960x540", cssW: 960, cssH: 540 },
] as const;
const BANDS: readonly AgeBand[] = ["3-4", "4-5", "5-6"];

function openProbe(
  make: () => ProbeSession,
  cssW: number,
  cssH: number,
  band: AgeBand
): { readonly session: ProbeSession; readonly stage: ZoneRect } {
  const session = make();
  const space = deriveLogicSpace(cssW, cssH);
  const cssPerLogic = Math.min(cssW / space.w, cssH / space.h);
  const zones = computeStageZones({
    logicW: space.w,
    logicH: space.h,
    ageBand: band,
    cssPerLogic,
    needsTray: session.needsTray,
    trayItems: session.trayItemCount,
    trayLabels: session.trayHasLabels,
    stageRows: session.stageRowCount,
    needsCommit: session.needsCommit,
  });
  session.prepareRound(
    band,
    space,
    zones.stage,
    zones.tray ?? undefined,
    cssPerLogic
  );
  return { session, stage: zones.stage };
}

function drawFrame(session: ProbeSession): void {
  vi.mocked(drawStoryCharacterInStage).mockClear();
  const ctx = createFakeCanvas(960, 540).getContext("2d");
  if (!ctx) {
    throw new Error("Không lấy được context");
  }
  session.render(ctx as CanvasRenderingContext2D, new RenderSystem(), 0);
}

function hitsOf(session: ProbeSession): readonly number[][] {
  return session.slots.map((s) => [s.x, s.y, s.hitW, s.hitH]);
}

describe("Nhân vật kể chuyện GT-005, GT-007..011, GT-013..015, GT-017, GT-019, GT-021..023 (Task #313 Đợt A, B)", () => {
  for (const probe of PROBES) {
    it(`${probe.code}: có fixture để đo`, () => {
      expect(probe.sessions.length).toBeGreaterThan(0);
    });

    it(`${probe.code}: khung mặc định 960x540 band 5-6 có chỗ cho ${probe.kind} (trừ fixture lấp kín sân khấu)`, () => {
      probe.sessions.forEach((make, fixtureIndex) => {
        const { session } = openProbe(make, 960, 540, "5-6");
        drawFrame(session);
        const call = vi.mocked(drawStoryCharacterInStage).mock.calls[0];
        const spot = placeStoryCharacter(call?.[2], session.slots);
        if (probe.fillsStage?.[fixtureIndex] === true) {
          expect(spot, `fixture ${fixtureIndex}`).toBeNull();
        } else {
          expect(spot, `fixture ${fixtureIndex}`).not.toBeNull();
        }
      });
    });

    for (const viewport of VIEWPORTS) {
      for (const band of BANDS) {
        it(`${probe.code} ${viewport.name} band ${band}: ${probe.kind} vẽ một lần, trong sân khấu, không chồng vùng chạm, slots không đổi`, () => {
          probe.sessions.forEach((make, fixtureIndex) => {
            const { session, stage } = openProbe(
              make,
              viewport.cssW,
              viewport.cssH,
              band
            );
            const before = hitsOf(session);
            drawFrame(session);
            const calls = vi.mocked(drawStoryCharacterInStage).mock.calls;
            expect(calls, `fixture ${fixtureIndex}`).toHaveLength(1);
            const [, kind, usedStage, usedSlots] = calls[0] ?? [];
            expect(kind).toBe(probe.kind);
            expect(usedSlots).toBe(session.slots);
            expect(hitsOf(session)).toEqual(before);
            const spot = placeStoryCharacter(usedStage, session.slots);
            if (!spot) {
              // Không còn góc trống thì không vẽ — vẫn hợp lệ.
              return;
            }
            const half = STORY_CHARACTER_SIZE_PX / 2;
            // Nhân vật nằm trong sân khấu của khung năm vùng.
            expect(spot.cx - half).toBeGreaterThanOrEqual(stage.x);
            expect(spot.cy - half).toBeGreaterThanOrEqual(stage.y);
            expect(spot.cx + half).toBeLessThanOrEqual(stage.x + stage.w);
            expect(spot.cy + half).toBeLessThanOrEqual(stage.y + stage.h);
            for (const s of session.slots) {
              const hitW = Math.max(s.hitW, s.w);
              const hitH = Math.max(s.hitH, s.h);
              const overlap =
                spot.cx + half > s.x - hitW / 2 &&
                spot.cx - half < s.x + hitW / 2 &&
                spot.cy + half > s.y - hitH / 2 &&
                spot.cy - half < s.y + hitH / 2;
              expect(
                overlap,
                `fixture ${fixtureIndex} slot ${s.index} bị che`
              ).toBe(false);
            }
          });
        });
      }
    }
  }
});
