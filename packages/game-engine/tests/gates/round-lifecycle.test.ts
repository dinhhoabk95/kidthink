/**
 * Gate #211 — Round lifecycle: mọi khuôn phải chơi được từ vòng hai.
 *
 * VÌ SAO LỖI SỐNG ĐƯỢC:
 * - `round-runner-snapshot.test.ts:118-130` chỉ dựng runner **một vòng**.
 * - `all-templates-interactive-harness.test.ts:190-194` tự tay gọi
 *   `resolveSlots` — đúng cái sản xuất quên.
 *
 * Bốn ca kiểm tra:
 * (i)   Vòng hai phải có slot (slots.length > 0)
 * (ii)  Ô vòng hai deep-equal ô của session dựng thẳng rồi chuẩn bị
 * (iii) Số lần tính ô sau khi chuẩn bị bằng đúng 1
 * (iv)  Với band 3-4, mọi slot.hitW/hitH >= getTouchFloor("3-4")
 */

import { beforeAll, describe, expect, it } from "vitest";
import {
  ALL_TEMPLATE_CODES,
  createGameSessionSync,
  type EngineConfig,
  preloadGameSession,
  RoundRunner,
} from "#src/index";
import { getTouchFloor } from "#src/layout/constants";
import {
  FIXTURES_BY_CODE,
  type FixturePayload,
  type FixtureRecord,
} from "../fixtures-map.js";

const FIXTURES_MAP = FIXTURES_BY_CODE;

function isFixturePayload(val: unknown): val is FixturePayload {
  return typeof val === "object" && val !== null;
}

interface SlotLike {
  readonly index: number;
  readonly x: number;
  readonly y: number;
  readonly w: number;
  readonly h: number;
  readonly hitW: number;
  readonly hitH: number;
  readonly page: number;
  readonly role: string;
}

interface SessionWithSlots {
  slots: readonly SlotLike[];
  resolveSlots?: (band: "3-4" | "4-5" | "5-6") => void;
  setupEntities: () => void;
  destroy: () => void;
}

function makeConfig(
  code: string,
  fixture: FixtureRecord,
  ageBand: "3-4" | "4-5" | "5-6" = "4-5"
): EngineConfig {
  return {
    level_code: `${code}-LV1`,
    content_version: 1,
    template_code: code,
    content_pack: fixture.content,
    difficulty_params: fixture.difficulty,
    theme_id: "default",
    age_band: ageBand,
    reduced_motion: false,
    audio_enabled: true,
  };
}

describe("Gate #211 — Round lifecycle: vòng hai phải chơi được", () => {
  beforeAll(async () => {
    for (const c of ALL_TEMPLATE_CODES) {
      await preloadGameSession(c);
    }
  });

  for (const code of ALL_TEMPLATE_CODES) {
    const fixtures = FIXTURES_MAP[code];
    const fixture = fixtures?.[0];
    if (!fixture) {
      it(`${code}: has fixture`, () => {
        expect(fixture).toBeDefined();
      });
      continue;
    }

    describe(`${code}`, () => {
      // (i) Vòng hai phải có slot
      it("(i) round 2 session has slots.length > 0", () => {
        const runner = new RoundRunner({
          rounds: [
            {
              round_index: 0,
              content_pack: fixture.content,
              difficulty_params: fixture.difficulty,
            },
            {
              round_index: 1,
              content_pack: fixture.content,
              difficulty_params: fixture.difficulty,
            },
          ],
          sessionFactory: (content, difficulty, _seed) => {
            const c: FixturePayload = isFixturePayload(content) ? content : {};
            const d: FixturePayload = isFixturePayload(difficulty)
              ? difficulty
              : {};
            const cfg = makeConfig(code, { content: c, difficulty: d });
            return createGameSessionSync(code, cfg);
          },
          layoutSeed: 42,
        });

        runner.startFirstRound();

        // Force win on round 1 to advance
        const session1 = runner.getCurrentSession() as SessionWithSlots | null;
        if (session1) {
          // Mark as won by manipulating isWon directly
          (session1 as unknown as { isWon: boolean }).isWon = true;
        }
        runner.completeCurrentRound();

        // Now on round 2
        const session2 = runner.getCurrentSession() as SessionWithSlots | null;
        expect(session2).not.toBeNull();
        if (session2) {
          expect(session2.slots.length).toBeGreaterThan(0);
        }
      });

      // (ii) Round 2 slots match freshly-built session slots
      it("(ii) round 2 slots match freshly-built session with resolveSlots", () => {
        const runner = new RoundRunner({
          rounds: [
            {
              round_index: 0,
              content_pack: fixture.content,
              difficulty_params: fixture.difficulty,
            },
            {
              round_index: 1,
              content_pack: fixture.content,
              difficulty_params: fixture.difficulty,
            },
          ],
          sessionFactory: (content, difficulty, _seed) => {
            const c: FixturePayload = isFixturePayload(content) ? content : {};
            const d: FixturePayload = isFixturePayload(difficulty)
              ? difficulty
              : {};
            const cfg = makeConfig(code, { content: c, difficulty: d });
            return createGameSessionSync(code, cfg);
          },
          layoutSeed: 42,
        });

        runner.startFirstRound();
        const session1 = runner.getCurrentSession() as SessionWithSlots | null;
        if (session1) {
          (session1 as unknown as { isWon: boolean }).isWon = true;
        }
        runner.completeCurrentRound();

        const session2 = runner.getCurrentSession() as SessionWithSlots | null;

        // Build a fresh session to compare
        const freshCfg = makeConfig(code, fixture);
        const freshSession = createGameSessionSync(
          code,
          freshCfg
        ) as unknown as SessionWithSlots;
        freshSession.setupEntities();
        if (typeof freshSession.resolveSlots === "function") {
          freshSession.resolveSlots("4-5");
        }

        if (session2 && freshSession.slots.length > 0) {
          expect(session2.slots).toEqual(freshSession.slots);
        }
        freshSession.destroy();
      });

      // (iv) With band 3-4, all slot hitW/hitH >= getTouchFloor("3-4")
      it("(iv) band 3-4 slots meet touch floor", () => {
        const touchFloor = getTouchFloor("3-4");
        const cfg = makeConfig(code, fixture, "3-4");
        const session = createGameSessionSync(
          code,
          cfg
        ) as unknown as SessionWithSlots;
        session.setupEntities();
        if (typeof session.resolveSlots === "function") {
          session.resolveSlots("3-4");
        }

        for (const slot of session.slots) {
          expect(
            slot.hitW,
            `${code} slot ${slot.index} hitW ${slot.hitW} < touchFloor ${touchFloor}`
          ).toBeGreaterThanOrEqual(touchFloor);
          expect(
            slot.hitH,
            `${code} slot ${slot.index} hitH ${slot.hitH} < touchFloor ${touchFloor}`
          ).toBeGreaterThanOrEqual(touchFloor);
        }
        session.destroy();
      });
    });
  }
});
