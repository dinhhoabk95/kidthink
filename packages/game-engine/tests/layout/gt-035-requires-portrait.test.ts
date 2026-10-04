import { ALL_SEED_LEVELS } from "@mindkid/content-build";
import { describe, expect, it } from "vitest";
import type { AgeBand } from "#src/contracts/types";
import { deriveLogicSpace } from "#src/layout/constants";
import { computeZonesForSession } from "#src/layout/session-zones";
import { GT035_FIXTURES } from "#src/templates/GT-035/fixtures";
import { GT035Session } from "#src/templates/GT-035/session";
import {
  GT035ContentSchema,
  GT035DifficultySchema,
} from "#src/templates/GT-035/template";

/**
 * BR-E035-06 / BR-PSZ-14: bàn GT-035 không vừa ở sàn chạm thì session xin xoay
 * máy dọc, không thu ô dưới sàn. Đo 2026-10-04: ở canvas 610x350 (điện thoại
 * 844x390 sau HUD cột lề) hàng lệnh và thẻ lệnh tràn sân khấu.
 */
const PHONE_LANDSCAPE = { w: 610, h: 350 };
const PORTRAIT = { w: 330, h: 697 };
const DESKTOP = { w: 964, h: 628 };
const BANDS: readonly AgeBand[] = ["3-4", "5-6"];

function createCases(): { name: string; create: () => GT035Session }[] {
  const seeded = ALL_SEED_LEVELS.filter(
    (level) => level.header.template_code === "GT-035"
  ).map((level) => ({
    name: `seed ${level.header.code}`,
    create: () =>
      new GT035Session(
        GT035ContentSchema.parse(level.content_pack),
        GT035DifficultySchema.parse(level.difficulty_params)
      ),
  }));
  const fixtures = GT035_FIXTURES.map((f) => ({
    name: `mẫu ${f.id}`,
    create: () => new GT035Session(f.content, f.difficulty),
  }));
  return [...fixtures, ...seeded];
}

function prepare(
  session: GT035Session,
  frame: { w: number; h: number },
  band: AgeBand
) {
  const space = deriveLogicSpace(frame.w, frame.h);
  const cssPerLogic = frame.w / space.w;
  const zones = computeZonesForSession(
    { logicW: space.w, logicH: space.h, ageBand: band, cssPerLogic },
    session
  );
  session.prepareRound(band, space, zones.stage, undefined, cssPerLogic);
  return zones;
}

describe("GT-035 requiresPortrait (BR-E035-06)", () => {
  const cases = createCases();

  it("chưa prepareRound thì không xin xoay máy", () => {
    const first = cases[0];
    if (!first) {
      throw new Error("thiếu level GT-035");
    }
    expect(first.create().requiresPortrait()).toBe(false);
  });

  describe.each(BANDS)("band %s", (band) => {
    it.each(cases)(
      "$name: điện thoại ngang 610x350 xin xoay máy",
      ({ create }) => {
        const session = create();
        prepare(session, PHONE_LANDSCAPE, band);

        expect(session.requiresPortrait()).toBe(true);
      }
    );
  });

  // Portrait không bao giờ xin xoay: lớp xoay máy không được nhốt trẻ đã ở dọc,
  // kể cả khi bàn tràn (3 seed lớn ở 330x697 với sàn chạm tính trên px CSS).
  it.each(cases)("$name: portrait 330x697 không xin xoay", ({ create }) => {
    const session = create();
    prepare(session, PORTRAIT, "5-6");

    expect(session.requiresPortrait()).toBe(false);
  });

  it.each(cases)(
    "$name: máy tính 964x628 band 5-6 vừa, không xin xoay",
    ({ create }) => {
      const session = create();
      prepare(session, DESKTOP, "5-6");

      expect(session.requiresPortrait()).toBe(false);
    }
  );

  it("xoay từ ngang sang dọc thì hết xin (prepareRound lại)", () => {
    const first = cases[0];
    if (!first) {
      throw new Error("thiếu level GT-035");
    }
    const session = first.create();
    prepare(session, PHONE_LANDSCAPE, "5-6");
    expect(session.requiresPortrait()).toBe(true);

    prepare(session, PORTRAIT, "5-6");

    expect(session.requiresPortrait()).toBe(false);
  });
});
