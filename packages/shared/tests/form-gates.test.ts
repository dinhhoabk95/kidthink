import { type GameTemplate, MVP_TEMPLATES } from "@mindkid/game-engine";
import { describe, expect, it } from "vitest";
import { z } from "zod";
import {
  checkDepthGate,
  checkLabelGate,
  checkTemplateComponentGate,
  checkTextFallbackGate,
  runAllFormGates,
} from "./gates/form-gates.ts";

function createMockTemplate(
  code: `GT-${string}`,
  content_contract: z.ZodType,
  difficulty_contract: z.ZodType = z.object({})
): GameTemplate {
  return {
    code,
    name: "Test Template",
    mechanic: "tap-select",
    layouts: ["grid", "horizontal-row"],
    content_contract,
    difficulty_contract,
    limits: {
      item_count: [2, 6],
      distractor_count: [1, 5],
      target_count: [1, 1],
    },
    age_min: 3,
    age_max: 6,
    requires_tap_fallback: false,
    asset_kinds: ["emoji", "image", "audio"],
    scoring: {
      max_score: 100,
      pass_threshold: 60,
      star_thresholds: [60, 80, 100],
    },
    events: ["game_started", "item_selected", "game_completed"],
    engine_session: "TapSelectSession",
    status: "published",
    version: 1,
  };
}

describe("Schema-Driven Form Anti-Drift Gates (BR-SDF-01, BR-SDF-06, BR-SDF-08, D-JT, D-JU)", () => {
  describe("Gate 1: Label Gate (BR-SDF-06, D-JU)", () => {
    it("passes on all 6 MVP templates", () => {
      const violations = checkLabelGate(MVP_TEMPLATES);
      expect(violations).toEqual([]);
    });

    it("negative case: flags missing dictionary label when a field is unmapped", () => {
      const mockTemplates: Record<string, GameTemplate> = {
        "GT-999": createMockTemplate(
          "GT-999",
          z.object({
            unknown_mystery_field: z.string().max(20),
          })
        ),
      };

      const violations = checkLabelGate(mockTemplates);
      expect(violations.length).toBeGreaterThan(0);
      expect(violations[0]?.code).toBe("MISSING_DICTIONARY_LABEL");
      expect(violations[0]?.message).toContain("unknown_mystery_field");
    });
  });

  describe("Gate 2: Text Fallback Gate (BR-SDF-08, D-JT)", () => {
    it("passes on all 6 MVP templates using allowlist with documented rationales", () => {
      const violations = checkTextFallbackGate(MVP_TEMPLATES);
      expect(violations).toEqual([]);
    });

    it("negative case: flags field falling into text without _vi suffix or allowlist entry", () => {
      const mockTemplates: Record<string, GameTemplate> = {
        "GT-999": createMockTemplate(
          "GT-999",
          z.object({
            basketEmoji: z.string().max(10), // Should have been basket_emoji
          })
        ),
      };

      const violations = checkTextFallbackGate(mockTemplates);
      expect(violations.length).toBeGreaterThan(0);
      expect(violations[0]?.code).toBe("TEXT_FALLBACK_NOT_ALLOWLISTED");
      expect(violations[0]?.message).toContain("basketEmoji");
    });
  });

  describe("Gate 3: Nesting Depth Gate (D-JU)", () => {
    it("passes on all 6 MVP templates (depth <= 3)", () => {
      const violations = checkDepthGate(MVP_TEMPLATES, 3);
      expect(violations).toEqual([]);
    });

    it("negative case: flags schema exceeding max nesting depth of 3", () => {
      const deepSchema = z.object({
        l1: z.array(
          z.object({
            l2: z.array(
              z.object({
                l3: z.array(
                  z.object({
                    l4_too_deep: z.string().max(10),
                  })
                ),
              })
            ),
          })
        ),
      });

      const mockTemplates: Record<string, GameTemplate> = {
        "GT-DEEP": createMockTemplate("GT-DEEP", deepSchema),
      };

      const violations = checkDepthGate(mockTemplates, 3);
      expect(violations.length).toBeGreaterThan(0);
      expect(violations[0]?.code).toBe("MAX_DEPTH_EXCEEDED");
    });
  });

  describe("Gate 4: Per-Template Component Gate (BR-SDF-01)", () => {
    it("passes on clean admin components directory", () => {
      const violations = checkTemplateComponentGate();
      expect(violations).toEqual([]);
    });

    it("overall gate runner passes on current codebase", () => {
      const allViolations = runAllFormGates();
      expect(allViolations).toEqual([]);
    });
  });
});
