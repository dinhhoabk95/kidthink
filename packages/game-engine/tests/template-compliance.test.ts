import { beforeAll, describe, expect, it } from "vitest";
import {
  ALL_TEMPLATE_CODES,
  createGameSessionSync,
  type EngineConfig,
  getGameTemplate,
  loadGameSession,
  preloadGameSession,
} from "#src/index";
import { FIXTURES_BY_CODE } from "./fixtures-map.js";

const FIXTURES_MAP = FIXTURES_BY_CODE;

describe("Universal Template Compliance Test Suite (§7.4, BR-TAK-01..14)", () => {
  beforeAll(async () => {
    for (const c of ALL_TEMPLATE_CODES) {
      await preloadGameSession(c);
    }
  });

  it("throws TEMPLATE_NOT_LOADED if synchronous creation called without preload", () => {
    const pattern = "TEMPLATE_NOT_LOADED";
    expect(() =>
      createGameSessionSync("GT-999", {
        level_code: "GT-999-LV1",
        content_version: 1,
        template_code: "GT-999",
        content_pack: {},
        difficulty_params: {},
        theme_id: "default",
        age_band: "4-5",
        reduced_motion: false,
        audio_enabled: true,
      })
    ).toThrow(pattern);
  });

  it("registers all MVP template codes", () => {
    expect(ALL_TEMPLATE_CODES).toEqual([
      "GT-000",
      "GT-001",
      "GT-002",
      "GT-003",
      "GT-004",
      "GT-005",
      "GT-006",
      "GT-007",
      "GT-008",
      "GT-009",
      "GT-010",
      "GT-011",
      "GT-012",
      "GT-013",
      "GT-014",
      "GT-015",
      "GT-016",
      "GT-017",
      "GT-018",
      "GT-019",
      "GT-020",
      "GT-021",
      "GT-022",
      "GT-023",
      "GT-024",
      "GT-025",
      "GT-026",
      "GT-027",
      "GT-028",
      "GT-029",
      "GT-030",
      "GT-031",
      "GT-032",
      "GT-033",
      "GT-034",
      "GT-035",
      "GT-036",
    ]);
  });

  for (const code of ALL_TEMPLATE_CODES) {
    describe(`Template ${code} compliance`, () => {
      const template = getGameTemplate(code);

      it("is defined and registered", () => {
        expect(template).toBeDefined();
        expect(template?.code).toBe(code);
      });

      it("has valid age ranges and well-ordered limits (BR-TAK-04)", () => {
        if (!template) {
          return;
        }
        expect(template.age_min).toBeGreaterThanOrEqual(3);
        expect(template.age_max).toBeLessThanOrEqual(6);
        expect(template.age_min).toBeLessThanOrEqual(template.age_max);

        expect(template.limits.item_count[0]).toBeLessThanOrEqual(
          template.limits.item_count[1]
        );
        expect(template.limits.distractor_count[0]).toBeLessThanOrEqual(
          template.limits.distractor_count[1]
        );
        expect(template.limits.target_count[0]).toBeLessThanOrEqual(
          template.limits.target_count[1]
        );
      });

      it("has valid scoring parameters", () => {
        if (!template) {
          return;
        }
        const { scoring } = template;
        expect(scoring.max_score).toBeGreaterThanOrEqual(
          scoring.pass_threshold
        );
        expect(scoring.star_thresholds[0]).toBeLessThanOrEqual(
          scoring.star_thresholds[1]
        );
        expect(scoring.star_thresholds[1]).toBeLessThanOrEqual(
          scoring.star_thresholds[2]
        );
      });

      it("has at least 3 fixtures that validate against content and difficulty schemas (BR-TAK-09)", () => {
        if (!template) {
          return;
        }
        const fixtures = FIXTURES_MAP[code];
        expect(fixtures).toBeDefined();
        expect(fixtures?.length).toBeGreaterThanOrEqual(3);

        for (const [index, fixture] of (fixtures ?? []).entries()) {
          const contentRes = template.content_contract.safeParse(
            fixture.content
          );
          expect(
            contentRes.success,
            `Fixture #${index} content parsing failed for ${code}: ${JSON.stringify(contentRes.error?.issues)}`
          ).toBe(true);

          const diffRes = template.difficulty_contract.safeParse(
            fixture.difficulty
          );
          expect(
            diffRes.success,
            `Fixture #${index} difficulty parsing failed for ${code}: ${JSON.stringify(diffRes.error?.issues)}`
          ).toBe(true);
        }
      });

      it("dynamically lazy-loads session class (BR-TAK-08)", async () => {
        const SessionClass = await loadGameSession(code);
        expect(SessionClass).toBeDefined();
        expect(typeof SessionClass).toBe("function");
      });

      it("instantiates session synchronously and initializes cleanly", () => {
        const fixtures = FIXTURES_MAP[code];
        const fixture = fixtures?.[0];
        expect(fixture).toBeDefined();
        if (!fixture) {
          return;
        }
        const cfg: EngineConfig = {
          level_code: `${code}-LV1`,
          content_version: 1,
          template_code: code,
          content_pack: fixture.content,
          difficulty_params: fixture.difficulty,
          theme_id: "default",
          age_band: "4-5",
          reduced_motion: false,
          audio_enabled: true,
        };

        const session = createGameSessionSync(code, cfg);
        expect(session).toBeDefined();
        session.setupEntities();
        expect(session.checkWinCondition()).toBe(false);

        // Check purity of checkWinCondition
        const win1 = session.checkWinCondition();
        const win2 = session.checkWinCondition();
        expect(win1).toBe(win2);

        // Validates unknown action safely
        const res = session.validateAction({
          type: "unknown_action_test",
          data: {},
        });
        expect(res).toBeDefined();
        expect(typeof res.valid).toBe("boolean");
      });
    });
  }
});
