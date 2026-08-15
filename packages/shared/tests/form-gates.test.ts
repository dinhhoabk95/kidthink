import { describe, expect, it } from "vitest";
import { z } from "zod";
import {
  checkDepthGate,
  checkLabelGate,
  checkTemplateComponentGate,
  checkTextFallbackGate,
  runAllFormGates,
} from "../../../scripts/lint-form-gates.ts";
import { MVP_TEMPLATES } from "../../game-engine/src/contracts/registry";

describe("Schema-Driven Form Anti-Drift Gates (BR-SDF-01, BR-SDF-06, BR-SDF-08, D-JT, D-JU)", () => {
  describe("Gate 1: Label Gate (BR-SDF-06, D-JU)", () => {
    it("passes on all 6 MVP templates", () => {
      const violations = checkLabelGate(MVP_TEMPLATES);
      expect(violations).toEqual([]);
    });

    it("negative case: flags missing dictionary label when a field is unmapped", () => {
      const mockTemplates = {
        "GT-999": {
          code: "GT-999",
          content_contract: z.object({
            unknown_mystery_field: z.string().max(20),
          }),
          difficulty_contract: z.object({}),
        } as any,
      };

      const violations = checkLabelGate(mockTemplates);
      expect(violations.length).toBeGreaterThan(0);
      expect(violations[0].code).toBe("MISSING_DICTIONARY_LABEL");
      expect(violations[0].message).toContain("unknown_mystery_field");
    });
  });

  describe("Gate 2: Text Fallback Gate (BR-SDF-08, D-JT)", () => {
    it("passes on all 6 MVP templates using allowlist with documented rationales", () => {
      const violations = checkTextFallbackGate(MVP_TEMPLATES);
      expect(violations).toEqual([]);
    });

    it("negative case: flags field falling into text without _vi suffix or allowlist entry", () => {
      const mockTemplates = {
        "GT-999": {
          code: "GT-999",
          content_contract: z.object({
            basketEmoji: z.string().max(10), // Should have been basket_emoji
          }),
          difficulty_contract: z.object({}),
        } as any,
      };

      const violations = checkTextFallbackGate(mockTemplates);
      expect(violations.length).toBeGreaterThan(0);
      expect(violations[0].code).toBe("TEXT_FALLBACK_NOT_ALLOWLISTED");
      expect(violations[0].message).toContain("basketEmoji");
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

      const mockTemplates = {
        "GT-DEEP": {
          code: "GT-DEEP",
          content_contract: deepSchema,
          difficulty_contract: z.object({}),
        } as any,
      };

      const violations = checkDepthGate(mockTemplates, 3);
      expect(violations.length).toBeGreaterThan(0);
      expect(violations[0].code).toBe("MAX_DEPTH_EXCEEDED");
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
