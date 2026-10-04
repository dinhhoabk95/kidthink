import { ALL_SEED_LEVELS } from "@mindkid/content-build";
import { beforeAll, describe, expect, it } from "vitest";
import type { AgeBand } from "#src/contracts/types";
import { TemplateGameSession } from "#src/game-session";
import {
  createGameSessionSync,
  type EngineConfig,
  preloadGameSession,
} from "#src/index";
import { deriveLogicSpace } from "#src/layout/constants";
import { computeStageZones } from "#src/layout/stage-zones";
import type { FixturePayload } from "../fixtures-map.ts";

/**
 * GT-025 trong khung năm vùng: vật vẽ ở slot của `zones.stage` nên chạm vào
 * tâm slot phải trúng đúng vật đó. Level seed khai `x`/`y` kiểu bố cục cũ
 * (100/200, cột phải +480); nếu vùng chạm lấy toạ độ đó thì chạm vào chỗ vẽ
 * không ăn (đo ở trình duyệt thật 390x844, `GL-C2-GEO-SPOT-0001`).
 */
const FRAMES = [
  { cssW: 330, cssH: 697 },
  { cssW: 610, cssH: 350 },
  { cssW: 964, cssH: 628 },
] as const;
const BANDS: readonly AgeBand[] = ["4-5", "5-6"];

/** Gói nội dung của seed khai kiểu rộng; sao chép qua JSON để có kiểu `FixturePayload`. */
function payloadOf(
  value: Parameters<typeof JSON.stringify>[0]
): FixturePayload {
  return JSON.parse(JSON.stringify(value));
}

function makeSession(
  band: AgeBand,
  content: FixturePayload,
  difficulty: FixturePayload
) {
  const config: EngineConfig = {
    level_code: "GT-025-LV1",
    content_version: 1,
    template_code: "GT-025",
    content_pack: content,
    difficulty_params: difficulty,
    theme_id: "default",
    age_band: band,
    reduced_motion: false,
    audio_enabled: true,
  };
  const session = createGameSessionSync("GT-025", config);
  if (!(session instanceof TemplateGameSession)) {
    throw new Error("GT-025 không phải TemplateGameSession");
  }
  return session;
}

const SEEDS = ALL_SEED_LEVELS.filter(
  (l) => l.header.template_code === "GT-025"
);

describe("GT-025 — chạm vào chỗ vật được vẽ", () => {
  beforeAll(async () => {
    await preloadGameSession("GT-025");
  });

  it("có level seed để đo", () => {
    expect(SEEDS.length).toBeGreaterThan(0);
  });

  it.each(FRAMES)(
    "tâm slot nào cũng trúng đúng một vật ($cssW x $cssH)",
    (frame) => {
      const misses: string[] = [];
      for (const band of BANDS) {
        for (const level of SEEDS) {
          const session = makeSession(
            band,
            payloadOf(level.content_pack),
            payloadOf(level.difficulty_params)
          );
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
          for (const slot of session.slots) {
            const action = session.toAction?.({
              type: "tap",
              x: slot.x,
              y: slot.y,
              timeMs: 1,
            });
            if (action === null || action === undefined) {
              misses.push(`${band} ${level.header.code} slot ${slot.index}`);
            }
          }
          expect(session.slots.length).toBeGreaterThan(0);
        }
      }
      expect(misses.slice(0, 6), `${misses.length} slot không ăn chạm`).toEqual(
        []
      );
    }
  );
});
