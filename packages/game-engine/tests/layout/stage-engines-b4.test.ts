import { ALL_SEED_LEVELS } from "@mindkid/content-build";
import { beforeAll, describe, expect, it, vi } from "vitest";
import type { AgeBand } from "#src/contracts/types";
import { type GameSession, TemplateGameSession } from "#src/game-session";
import {
  createGameSessionSync,
  type EngineConfig,
  preloadGameSession,
} from "#src/index";
import { deriveLogicSpace } from "#src/layout/constants";
import { computeStageZones } from "#src/layout/stage-zones";
import { RenderSystem } from "#src/systems/render-system";
import { FIXTURES_BY_CODE, type FixturePayload } from "../fixtures-map.ts";
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
 * Lô B4 (Task #283): GT-005 ghép cặp, GT-006 xếp dãy, GT-013 mê cung, GT-020
 * lật thẻ, GT-024 tô đường. Mỗi mã chạy ở ba cỡ canvas CSS, hai vòng liên tiếp,
 * trên mọi level mẫu và level đã seed (`BR-LAY-05`, `BR-PSZ-01`).
 */
const B4_CODES = ["GT-005", "GT-006", "GT-013", "GT-020", "GT-024"] as const;
const BAND: AgeBand = "5-6";
const VIEWPORTS = [
  { name: "portrait 330x697", w: 330, h: 697 },
  { name: "landscape điện thoại 784x250", w: 784, h: 250 },
  { name: "desktop 964x628", w: 964, h: 628 },
] as const;
/**
 * Nợ đã đo (`BR-LAY-05`): số level (mẫu + seed) có cặp vùng chạm cách nhau
 * < `SLOT_GAP_PX`, theo mã và cỡ canvas. Chỉ GT-024: waypoint của hình nhiều
 * đỉnh (ngôi sao) tự nó đã gần nhau hơn sàn chạm 105 logic px của điện thoại,
 * không dịch được vì toạ độ do nội dung quyết định. Số chỉ được giảm.
 */
const KNOWN_HIT_GAP_DEBT: Readonly<
  Record<string, Readonly<Record<string, number>>>
> = {
  "GT-024": {
    "portrait 330x697": 1,
    "landscape điện thoại 784x250": 9,
    "desktop 964x628": 1,
  },
};

/** Số lần chạm thử để đẩy trạng thái vòng đi tới giữa chừng. */
const MID_ROUND_TAPS = 3;

function isPayload(val: unknown): val is FixturePayload {
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
    content_pack: isPayload(content) ? content : {},
    difficulty_params: isPayload(difficulty) ? difficulty : {},
    theme_id: "default",
    age_band: BAND,
    reduced_motion: false,
    audio_enabled: true,
  };
}

interface Case {
  readonly name: string;
  readonly config: EngineConfig;
}

function casesFor(code: string): Case[] {
  const fixtures = (FIXTURES_BY_CODE[code] ?? []).map((f, i) => ({
    name: `mẫu ${i}`,
    config: configFor(code, f.content, f.difficulty),
  }));
  const seeds = ALL_SEED_LEVELS.filter(
    (level) => level.header.template_code === code
  ).map((level) => ({
    name: `seed ${level.header.code}`,
    config: configFor(code, level.content_pack, level.difficulty_params),
  }));
  return [...fixtures, ...seeds];
}

/** Phần của `TemplateGameSession` mà phép kiểm khung cần, cộng giao diện vẽ/gửi cử chỉ. */
type StageSession = GameSession &
  Pick<
    TemplateGameSession<never, never>,
    "needsCommit" | "needsTray" | "prepareRound" | "slots"
  >;

function makeSession(config: EngineConfig): StageSession {
  const session = createGameSessionSync(config.template_code, config);
  if (!(session instanceof TemplateGameSession)) {
    throw new Error(`${config.template_code} không phải TemplateGameSession`);
  }
  return session;
}

describe.each(B4_CODES)("lô B4 — %s trong khung năm vùng", (code) => {
  beforeAll(async () => {
    await preloadGameSession(code);
  });

  describe.each(VIEWPORTS)("$name", (viewport) => {
    it("hai vòng liên tiếp: vùng chạm không chồng, vẽ trong stage, không vẽ lời dẫn riêng", () => {
      const space = deriveLogicSpace(viewport.w, viewport.h);
      const cssPerLogic = viewport.w / space.w;
      const rs = new RenderSystem();
      const problems: string[] = [];
      const hitGapCases = new Set<string>();

      for (const { name, config } of casesFor(code)) {
        const session = makeSession(config);
        const zones = computeStageZones({
          logicW: space.w,
          logicH: space.h,
          ageBand: BAND,
          cssPerLogic,
          needsTray: session.needsTray,
          needsCommit: session.needsCommit,
        });
        for (const round of [1, 2]) {
          session.prepareRound(
            BAND,
            space,
            zones.stage,
            zones.tray ?? undefined,
            cssPerLogic
          );
          const hit = findHitPairViolations(session.slots);
          if (hit.length > 0) {
            hitGapCases.add(`${name}: ${hit[0]}`);
          }
          const outside = findSlotsOutsideStage(session.slots, zones.stage);
          if (outside.length > 0) {
            problems.push(`${name} vòng ${round} slot ngoài: ${outside[0]}`);
          }
          const opening = findDrawsOutsideStage(zones.stage, (ctx) =>
            session.render?.(ctx, rs, 0)
          );
          if (opening.length > 0) {
            problems.push(`${name} vòng ${round} vẽ ngoài: ${opening[0]}`);
          }
          for (const slot of session.slots.slice(0, MID_ROUND_TAPS)) {
            session.dispatch?.({
              type: "tap",
              x: slot.x,
              y: slot.y,
              timeMs: 1,
            });
          }
          const mid = findDrawsOutsideStage(zones.stage, (ctx) =>
            session.render?.(ctx, rs, 2000)
          );
          if (mid.length > 0) {
            problems.push(
              `${name} vòng ${round} giữa vòng vẽ ngoài: ${mid[0]}`
            );
          }
        }
      }

      expect(problems.length, problems.slice(0, 4).join("; ")).toBe(0);
      expect(hitGapCases.size, [...hitGapCases].join("; ")).toBeLessThanOrEqual(
        KNOWN_HIT_GAP_DEBT[code]?.[viewport.name] ?? 0
      );
    });
  });
});
