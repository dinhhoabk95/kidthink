import { ALL_SEED_LEVELS } from "@mindkid/content-build";
import { beforeAll, describe, expect, it } from "vitest";
import type { AgeBand } from "#src/contracts/types";
import { type GameSession, TemplateGameSession } from "#src/game-session";
import {
  createGameSessionSync,
  type EngineConfig,
  preloadGameSession,
} from "#src/index";
import type { ViewEntity } from "#src/interaction";
import { deriveLogicSpace } from "#src/layout/constants";
import { findHitEntity } from "#src/layout/hit-test";
import { computeStageZones } from "#src/layout/stage-zones";
import { GT022_FIXTURES } from "#src/templates/GT-022/fixtures";
import { FIXTURES_BY_CODE, type FixturePayload } from "../fixtures-map.ts";
import { GT022LegacyHitCoordsSession } from "./fixtures/gt-022-legacy-hit-coords.ts";
import { findHitMismatches } from "./hit-matches-drawn-check.ts";
import { MIGRATED_CODES } from "./migrated-codes.ts";

/**
 * Vùng chạm phải trùng chỗ vật được vẽ (loại lỗi của GT-025: vẽ theo slot của
 * `zones.stage` nhưng vùng chạm đọc `x`/`y` cũ trong nội dung level).
 * Với mọi engine đã dời vào khung năm vùng, mẫu và seed (ở band level được
 * cấp), ba khung hình: mỗi entity của `getView()` (1) cùng tâm với slot đã vẽ,
 * (2) chạm vào tâm thì `findHitEntity` — phép đo bề mặt web dùng — trả về
 * chính nó. Entity nằm trong stage đã do `stage-engines*.test.ts` đo.
 */
const FRAMES = [
  { name: "portrait 330x697", cssW: 330, cssH: 697 },
  { name: "ngang 610x350", cssW: 610, cssH: 350 },
  { name: "tablet 964x628", cssW: 964, cssH: 628 },
] as const;
const AGE_BANDS: readonly AgeBand[] = ["3-4", "4-5", "5-6"];
/** Đủ dài để pha loé của GT-012 hết và lựa chọn hiện ra. */
const PHASE_ADVANCE_MS = 5000;
const MAX_SEEDS_PER_CODE = 5;
const MAX_REPORTED = 6;

function payload(value: unknown): FixturePayload {
  return typeof value === "object" && value !== null
    ? JSON.parse(JSON.stringify(value))
    : {};
}

function configFor(
  code: string,
  band: AgeBand,
  content: unknown,
  difficulty: unknown
): EngineConfig {
  return {
    level_code: `${code}-LV1`,
    content_version: 1,
    template_code: code,
    content_pack: payload(content),
    difficulty_params: payload(difficulty),
    theme_id: "default",
    age_band: band,
    reduced_motion: false,
    audio_enabled: true,
  };
}

interface Case {
  readonly name: string;
  readonly band: AgeBand;
  readonly content: unknown;
  readonly difficulty: unknown;
}

function bandOf(levelBand: string): AgeBand | null {
  return AGE_BANDS.find((b) => b === levelBand) ?? null;
}

function casesFor(code: string): Case[] {
  const seeds = ALL_SEED_LEVELS.filter((l) => l.header.template_code === code);
  const servedBands = [
    ...new Set(
      seeds.flatMap(
        (l) => bandOf(`${l.header.age_min}-${l.header.age_max}`) ?? []
      )
    ),
  ];
  const fixtures = (FIXTURES_BY_CODE[code] ?? []).flatMap((f, i) =>
    (servedBands.length > 0 ? servedBands : ["5-6" as const]).map((band) => ({
      name: `mẫu ${i}`,
      band,
      content: f.content,
      difficulty: f.difficulty,
    }))
  );
  const step = Math.max(1, Math.floor(seeds.length / MAX_SEEDS_PER_CODE));
  const sampled = seeds
    .filter((_, i) => i % step === 0)
    .slice(0, MAX_SEEDS_PER_CODE)
    .flatMap((l) => {
      const band = bandOf(`${l.header.age_min}-${l.header.age_max}`);
      return band ? [{ l, band }] : [];
    })
    .map(({ l, band }) => ({
      name: `seed ${l.header.code}`,
      band,
      content: l.content_pack,
      difficulty: l.difficulty_params,
    }));
  return [...fixtures, ...sampled];
}

type HitSession = GameSession &
  Pick<
    TemplateGameSession<never, never>,
    | "needsCommit"
    | "needsTray"
    | "trayItemCount"
    | "trayHasLabels"
    | "prepareRound"
    | "slots"
  >;

function measureSession(
  session: HitSession,
  band: AgeBand,
  frame: { cssW: number; cssH: number }
): string[] {
  const space = deriveLogicSpace(frame.cssW, frame.cssH);
  const cssPerLogic = frame.cssW / space.w;
  const zones = computeStageZones({
    logicW: space.w,
    logicH: space.h,
    ageBand: band,
    cssPerLogic,
    needsTray: session.needsTray,
    trayItems: session.trayItemCount,
    trayLabels: session.trayHasLabels,
    needsCommit: session.needsCommit,
  });
  session.prepareRound(
    band,
    space,
    zones.stage,
    zones.tray ?? undefined,
    cssPerLogic
  );
  session.update?.(PHASE_ADVANCE_MS);
  const entities: readonly ViewEntity[] = session.getView?.().entities ?? [];
  return findHitMismatches(entities, session.slots, findHitEntity);
}

function measureCase(
  code: string,
  testCase: Case,
  frame: { cssW: number; cssH: number }
): string[] {
  const session = createGameSessionSync(
    code,
    configFor(code, testCase.band, testCase.content, testCase.difficulty)
  );
  if (!(session instanceof TemplateGameSession)) {
    return [];
  }
  try {
    return measureSession(session, testCase.band, frame);
  } catch (e) {
    if (e instanceof Error && e.message.includes("LAYOUT_CAPACITY_EXCEEDED")) {
      return [];
    }
    throw e;
  }
}

describe.each(MIGRATED_CODES.filter((c) => c !== "GT-000"))(
  "%s — vùng chạm trùng chỗ vẽ",
  (code) => {
    beforeAll(async () => {
      await preloadGameSession(code);
    });

    it.each(FRAMES)("$name", (frame) => {
      const found: string[] = [];
      for (const testCase of casesFor(code)) {
        const result = measureCase(code, testCase, frame);
        for (const v of result) {
          found.push(`${testCase.band} ${testCase.name}: ${v}`);
        }
      }
      expect(
        found.slice(0, MAX_REPORTED),
        `${found.length} vi phạm: ${found.slice(0, MAX_REPORTED).join(" ; ")}`
      ).toEqual([]);
    });
  }
);

describe("quét vùng chạm trùng chỗ vẽ — ca âm", () => {
  it.each(FRAMES)(
    "GT-022 giữ toạ độ vùng chạm cũ thì báo lệch ($name)",
    (frame) => {
      const fixture = GT022_FIXTURES[0];
      if (!fixture) {
        throw new Error("GT-022 không có mẫu");
      }
      const session = new GT022LegacyHitCoordsSession(
        fixture.content,
        fixture.difficulty
      );

      expect(measureSession(session, "5-6", frame).length).toBeGreaterThan(0);
    }
  );
});
