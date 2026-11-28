import { describe, expect, it } from "vitest";
import {
  createGameSessionSync,
  type EngineConfig,
  preloadGameSession,
  TemplateGameSession,
} from "#src/index";
import { FIXTURES_BY_CODE } from "../fixtures-map.js";
import { NoopHintSession } from "./fixtures/hint-noop/session.js";
import { playByHint, violatesHintActionable } from "./hint-actionable.js";
import type { SolverFixture } from "./web-gesture-solver.js";

/**
 * Sổ nợ `BR-SCF-14`: template mà theo `getHintTarget()` thì bài không tiến
 * (>= 2 bước no-op liên tiếp hoặc không thắng). Đỏ khi có template mới vi phạm
 * và khi template trong sổ đã lành.
 */
export const KNOWN_HINT_NOT_ACTIONABLE: readonly string[] = [];

const BANDS = ["3-4", "4-5", "5-6"] as const;

async function runFixture(
  code: string,
  fixture: SolverFixture,
  index: number
): Promise<boolean> {
  await preloadGameSession(code);
  const band = BANDS.find((b) => b === fixture.band) ?? "4-5";
  const config: EngineConfig = {
    level_code: `HINT-${code}-${index}`,
    content_version: 1,
    template_code: code,
    content_pack: fixture.content,
    difficulty_params: fixture.difficulty,
    theme_id: "default",
    age_band: band,
    reduced_motion: false,
    audio_enabled: false,
    layout_seed: 1,
  };
  const session = createGameSessionSync(code, config);
  if (!(session instanceof TemplateGameSession)) {
    return false;
  }
  session.prepareRound(band);
  const run = playByHint(session);
  if (process.env.HINT_DEBUG) {
    console.info(code, index, JSON.stringify(run));
  }
  return violatesHintActionable(run);
}

describe("Gate hint-actionable — gợi ý trỏ vào thứ bấm được (BR-SCF-14, Task #321)", () => {
  it("không template nào mới vi phạm; mục đã lành phải gỡ khỏi sổ nợ", async () => {
    const violating = new Set<string>();
    for (const [code, fixtures] of Object.entries(FIXTURES_BY_CODE)) {
      for (const [index, fixture] of (
        fixtures as readonly SolverFixture[]
      ).entries()) {
        if (await runFixture(code, fixture, index)) {
          violating.add(code);
        }
      }
    }
    const added = [...violating].filter(
      (c) => !KNOWN_HINT_NOT_ACTIONABLE.includes(c)
    );
    const fixed = KNOWN_HINT_NOT_ACTIONABLE.filter((c) => !violating.has(c));
    expect({ added, fixed }).toEqual({ added: [], fixed: [] });
  }, 180_000);

  it("ca âm: session có gợi ý trỏ vào đích no-op bị báo vi phạm", () => {
    const run = playByHint(new NoopHintSession());
    expect(run.won).toBe(false);
    expect(run.maxConsecutiveNoop).toBeGreaterThanOrEqual(2);
    expect(violatesHintActionable(run)).toBe(true);
  });
});
