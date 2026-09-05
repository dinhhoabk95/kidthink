/**
 * WP100.5 snapshot — verify 17 templates behave identically when
 * wrapped in RoundRunner with a single-round set vs run directly.
 *
 * Any test state change (even red→green) signals a behavior change.
 */
import { beforeAll, describe, expect, it } from "vitest";
import {
  ALL_TEMPLATE_CODES,
  createGameSessionSync,
  type EngineConfig,
  preloadGameSession,
  RoundRunner,
} from "#src/index";
import { FIXTURES_BY_CODE } from "./fixtures-map.js";

const FIXTURES_MAP = FIXTURES_BY_CODE;

describe("WP100.5 — RoundRunner snapshot comparison for 17 templates", () => {
  beforeAll(async () => {
    for (const c of ALL_TEMPLATE_CODES) {
      await preloadGameSession(c);
    }
  });
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
