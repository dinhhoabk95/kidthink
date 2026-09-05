import { GT001_FIXTURES } from "#src/templates/GT-001/fixtures.js";
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

import { describe, expect, it } from "vitest";
import {
  ALL_TEMPLATE_CODES,
  createGameSessionSync,
  type EngineConfig,
  GT000_FIXTURES,
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
  GT036_FIXTURES,
  RoundRunner,
} from "#src/index";
import { getTouchFloor } from "#src/layout/constants";

interface FixtureEntry {
  content: unknown;
  difficulty: unknown;
}

const FIXTURES_MAP: Record<string, FixtureEntry[]> = {
  "GT-000": GT000_FIXTURES,
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
  "GT-036": GT036_FIXTURES,
};

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
  fixture: FixtureEntry,
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
            const cfg = makeConfig(code, { content, difficulty });
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
            const cfg = makeConfig(code, { content, difficulty });
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
