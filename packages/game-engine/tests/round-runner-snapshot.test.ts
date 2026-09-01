/**
 * WP100.5 snapshot — verify 17 templates behave identically when
 * wrapped in RoundRunner with a single-round set vs run directly.
 *
 * Any test state change (even red→green) signals a behavior change.
 */
import { describe, expect, it } from "vitest";
import {
  ALL_TEMPLATE_CODES,
  createGameSessionSync,
  type EngineConfig,
  GT001_FIXTURES,
  GT002_FIXTURES,
  GT003_FIXTURES,
  GT004_FIXTURES,
  GT005_FIXTURES,
  GT006_FIXTURES,
  GT007_FIXTURES,
  GT008_FIXTURES,
  GT009_FIXTURES,
  GT010_FIXTURES,
  GT011_FIXTURES,
  GT012_FIXTURES,
  GT013_FIXTURES,
  GT014_FIXTURES,
  GT015_FIXTURES,
  GT016_FIXTURES,
  GT017_FIXTURES,
  GT018_FIXTURES,
  GT019_FIXTURES,
  GT020_FIXTURES,
  GT021_FIXTURES,
  GT022_FIXTURES,
  GT023_FIXTURES,
  GT024_FIXTURES,
  GT025_FIXTURES,
  GT026_FIXTURES,
  GT027_FIXTURES,
  GT028_FIXTURES,
  GT029_FIXTURES,
  GT030_FIXTURES,
  GT031_FIXTURES,
  GT032_FIXTURES,
  GT033_FIXTURES,
  GT034_FIXTURES,
  GT035_FIXTURES,
  RoundRunner,
} from "#src/index";

const FIXTURES_MAP: Record<
  string,
  { content: unknown; difficulty: unknown }[]
> = {
  "GT-001": GT001_FIXTURES,
  "GT-002": GT002_FIXTURES,
  "GT-003": GT003_FIXTURES,
  "GT-004": GT004_FIXTURES,
  "GT-005": GT005_FIXTURES,
  "GT-006": GT006_FIXTURES,
  "GT-007": GT007_FIXTURES,
  "GT-008": GT008_FIXTURES,
  "GT-009": GT009_FIXTURES,
  "GT-010": GT010_FIXTURES,
  "GT-011": GT011_FIXTURES,
  "GT-012": GT012_FIXTURES,
  "GT-013": GT013_FIXTURES,
  "GT-014": GT014_FIXTURES,
  "GT-015": GT015_FIXTURES,
  "GT-016": GT016_FIXTURES,
  "GT-017": GT017_FIXTURES,
  "GT-018": GT018_FIXTURES,
  "GT-019": GT019_FIXTURES,
  "GT-020": GT020_FIXTURES,
  "GT-021": GT021_FIXTURES,
  "GT-022": GT022_FIXTURES,
  "GT-023": GT023_FIXTURES,
  "GT-024": GT024_FIXTURES,
  "GT-025": GT025_FIXTURES,
  "GT-026": GT026_FIXTURES,
  "GT-027": GT027_FIXTURES,
  "GT-028": GT028_FIXTURES,
  "GT-029": GT029_FIXTURES,
  "GT-030": GT030_FIXTURES,
  "GT-031": GT031_FIXTURES,
  "GT-032": GT032_FIXTURES,
  "GT-033": GT033_FIXTURES,
  "GT-034": GT034_FIXTURES,
  "GT-035": GT035_FIXTURES,
};

describe("WP100.5 — RoundRunner snapshot comparison for 17 templates", () => {
  for (const code of ALL_TEMPLATE_CODES) {
    describe(`${code}: single-round via RoundRunner matches direct`, () => {
      const fixtures = FIXTURES_MAP[code];
      const fixture = fixtures?.[0];
      if (!fixture) {
        it(`${code}: has valid fixture`, () => {
          expect(fixture).toBeDefined();
        });
        return;
      }

      const nonNullFixture = fixture;
      const baseCfg: EngineConfig = {
        level_code: `${code}-LV1`,
        content_version: 1,
        template_code: code,
        content_pack: nonNullFixture.content,
        difficulty_params: nonNullFixture.difficulty,
        theme_id: "default",
        age_band: "4-5",
        reduced_motion: false,
        audio_enabled: true,
      };

      function makeRunner() {
        const events: Array<{
          roundIndex: number;
          wasSkipped?: boolean;
        }> = [];
        const runner = new RoundRunner({
          rounds: [
            {
              round_index: 0,
              content_pack: nonNullFixture.content,
              difficulty_params: nonNullFixture.difficulty,
            },
          ],
          sessionFactory: (contentPack, difficultyParams, _seed) => {
            const cfg: EngineConfig = {
              ...baseCfg,
              content_pack: contentPack,
              difficulty_params: difficultyParams,
            };
            return createGameSessionSync(code, cfg);
          },
          onRoundStarted: (roundIndex) => events.push({ roundIndex }),
          onRoundCompleted: (roundIndex, wasSkipped) =>
            events.push({ roundIndex, wasSkipped }),
        });
        return { runner, events };
      }

      it("setupEntities produces same initial checkWinCondition", () => {
        const directSession = createGameSessionSync(code, baseCfg);
        directSession.setupEntities();
        const directWin = directSession.checkWinCondition();

        const { runner } = makeRunner();
        runner.startFirstRound();

        const roundSession = runner.getCurrentSession();
        expect(roundSession).toBeDefined();
        if (roundSession) {
          const roundWin = roundSession.checkWinCondition();
          expect(roundWin).toBe(directWin);
        }
      });

      it("validateAction returns same result structure", () => {
        const directSession = createGameSessionSync(code, baseCfg);
        directSession.setupEntities();

        const { runner } = makeRunner();
        runner.startFirstRound();

        const unknownAction = {
          type: "unknown_snapshot_test",
          data: {},
        };

        const directRes = directSession.validateAction(unknownAction);
        const roundSession = runner.getCurrentSession();
        expect(roundSession).toBeDefined();
        if (roundSession) {
          const roundRes = roundSession.validateAction(unknownAction);
          expect(roundRes.valid).toBe(directRes.valid);
          expect(typeof roundRes.feedback).toBe(typeof directRes.feedback);
        }
      });

      it("emits round_started on startFirstRound", () => {
        const { runner, events } = makeRunner();
        runner.startFirstRound();

        const started = events.filter((e) => e.wasSkipped === undefined);
        expect(started.length).toBe(1);
        expect(started[0]?.roundIndex).toBe(0);
      });

      it("destroy cleans up without error", () => {
        const { runner } = makeRunner();
        runner.startFirstRound();
        expect(() => runner.destroy()).not.toThrow();
      });
    });
  }
});
