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
  getGameTemplate,
  loadGameSession,
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
};

describe("Universal Template Compliance Test Suite (§7.4, BR-TAK-01..14)", () => {
  it("registers all MVP template codes", () => {
    expect(ALL_TEMPLATE_CODES).toEqual([
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
