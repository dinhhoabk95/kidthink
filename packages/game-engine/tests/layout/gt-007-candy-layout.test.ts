import { ALL_SEED_LEVELS } from "@mindkid/content-build";
import { describe, expect, it, vi } from "vitest";
import type { AgeBand } from "#src/contracts/types";
import { deriveLogicSpace } from "#src/layout/constants";
import { computeStageZones } from "#src/layout/stage-zones";
import { RenderSystem } from "#src/systems/render-system";
import { GT007_FIXTURES } from "#src/templates/GT-007/fixtures";
import { GT007Session } from "#src/templates/GT-007/session";
import {
  GT007ContentSchema,
  GT007DifficultySchema,
} from "#src/templates/GT-007/template";
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
 * GT-007 vật thật (`BR-E007-06..09`): ô tổng và hai khay là ba vùng chạm lớn nằm
 * trọn trong `zones.stage`, không dùng khay, vùng chạm cách nhau ≥ `SLOT_GAP_PX`
 * (`BR-LAY-05`), vẽ không tràn sân khấu (`BR-PSZ-01`), ở mọi khung và mọi band.
 */
const VIEWPORTS = [
  { name: "portrait 330x697", cssW: 330, cssH: 697 },
  { name: "điện thoại ngang 610x350", cssW: 610, cssH: 350 },
  { name: "máy tính 964x628", cssW: 964, cssH: 628 },
] as const;
const BANDS: readonly AgeBand[] = ["3-4", "4-5", "5-6"];

interface CandyCase {
  readonly name: string;
  readonly create: () => GT007Session;
}

const fixtureCases: CandyCase[] = GT007_FIXTURES.flatMap((f, i) =>
  f.content.representation === "discrete-object"
    ? [
        {
          name: `mẫu ${i}`,
          create: () => new GT007Session(f.content, f.difficulty, 0),
        },
      ]
    : []
);

const seedCases: CandyCase[] = ALL_SEED_LEVELS.filter(
  (level) => level.header.template_code === "GT-007"
).flatMap((level) => {
  const content = GT007ContentSchema.parse(level.content_pack);
  return content.representation === "discrete-object"
    ? [
        {
          name: `seed ${level.header.code}`,
          create: () =>
            new GT007Session(
              content,
              GT007DifficultySchema.parse(level.difficulty_params),
              0
            ),
        },
      ]
    : [];
});

const CASES = [...fixtureCases, ...seedCases];

describe("GT-007 vật thật — hình học ba vùng trong sân khấu", () => {
  it("có ít nhất hai mẫu vật thật để đo", () => {
    expect(fixtureCases.length).toBeGreaterThanOrEqual(2);
  });

  for (const viewport of VIEWPORTS) {
    for (const band of BANDS) {
      it(`${viewport.name} band ${band}: vùng chạm trong sân khấu, đủ khe, vẽ không tràn`, () => {
        const problems: string[] = [];
        for (const { name, create } of CASES) {
          const session = create();
          const space = deriveLogicSpace(viewport.cssW, viewport.cssH);
          const cssPerLogic = Math.min(
            viewport.cssW / space.w,
            viewport.cssH / space.h
          );
          const zones = computeStageZones({
            logicW: space.w,
            logicH: space.h,
            ageBand: band,
            cssPerLogic,
            needsTray: session.needsTray,
            trayItems: session.trayItemCount,
            needsCommit: session.needsCommit,
          });
          session.prepareRound(
            band,
            space,
            zones.stage,
            zones.tray ?? undefined,
            cssPerLogic
          );
          for (const issue of [
            ...findSlotsOutsideStage(session.slots, zones.stage),
            ...findHitPairViolations(session.slots),
            ...findDrawsOutsideStage(zones.stage, (ctx) =>
              session.render(ctx, new RenderSystem(), 0)
            ),
          ]) {
            problems.push(`${name}: ${issue}`);
          }
          if (zones.tray !== null) {
            problems.push(`${name}: khung còn cấp khay`);
          }
        }
        expect(problems).toEqual([]);
      });
    }
  }
});
