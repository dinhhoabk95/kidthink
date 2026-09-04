import { ALL_GAME_MECHANICS, RESERVED_MECHANICS } from "@mindkid/shared";
import { describe, expect, it } from "vitest";
import {
  ALL_TEMPLATES,
  exportTemplateContracts,
  getGameTemplate,
  MVP_TEMPLATES,
  validateAgeBandForTemplate,
  validateContentPack,
} from "#src/index";

import {
  everyGroupHasAtLeastOneItem,
  everyItemTargetsAnExistingGroup,
} from "#src/templates/GT-004/template";

describe("Task 2 — Game Template Contracts (BR-GTC-01..07)", () => {
  it("BR-GTC-01: no template contains skill_id or competency_id", () => {
    for (const [_code, template] of Object.entries(MVP_TEMPLATES)) {
      const keys = Object.keys(template);
      expect(keys).not.toContain("skill_id");
      expect(keys).not.toContain("competency_id");
      expect(
        (template as unknown as Record<string, unknown>).skill_id
      ).toBeUndefined();
      expect(
        (template as unknown as Record<string, unknown>).competency_id
      ).toBeUndefined();
    }
  });

  it("BR-GTC-02: validateContentPack rejects invalid schema with CONTENT_PACK_INVALID 422 error details", () => {
    const invalidPack = {
      prompt: "Hi", // too short (min 4)
    };
    const res = validateContentPack("GT-001", invalidPack);
    expect(res.success).toBe(false);
    if (!res.success && res.error) {
      expect(res.error.code).toBe("CONTENT_PACK_INVALID");
      expect(res.error.details?.issues.length).toBeGreaterThan(0);
    }
  });

  it("BR-GTC-02: validateContentPack returns TEMPLATE_NOT_SUPPORTED for unknown template code", () => {
    const res = validateContentPack("GT-999", {});
    expect(res.success).toBe(false);
    if (!res.success && res.error) {
      expect(res.error.code).toBe("TEMPLATE_NOT_SUPPORTED");
    }
  });

  it("BR-GTC-03: separates content and difficulty contracts (no mixing)", () => {
    for (const [_code, template] of Object.entries(MVP_TEMPLATES)) {
      const contentKeys = Object.keys(
        (template.content_contract as any)._def?.shape?.() ?? {}
      );
      expect(contentKeys).not.toContain("distractor_count");
      expect(contentKeys).not.toContain("hint_after_ms");
    }
  });

  it("BR-GTC-05: validates age bands and banned age bands", () => {
    const gt006 = getGameTemplate("GT-006");
    expect(gt006).toBeDefined();
    if (!gt006) {
      return;
    }

    expect(gt006.age_min).toBe(5);
    expect(validateAgeBandForTemplate(gt006, 3)).toBe(false);
    expect(validateAgeBandForTemplate(gt006, 4)).toBe(false);
    expect(validateAgeBandForTemplate(gt006, 5)).toBe(true);

    const gt002 = getGameTemplate("GT-002");
    expect(gt002).toBeDefined();
    if (!gt002) {
      return;
    }

    expect(validateAgeBandForTemplate(gt002, 3)).toBe(false);
    expect(validateAgeBandForTemplate(gt002, 4)).toBe(true);
  });

  it("BR-GTC-06: all drag mechanic templates enforce requires_tap_fallback = true", () => {
    for (const [_code, template] of Object.entries(MVP_TEMPLATES)) {
      if (
        template.mechanic.includes("drag") ||
        template.mechanic.includes("sort") ||
        template.mechanic.includes("pair") ||
        template.mechanic.includes("sequence")
      ) {
        expect(template.requires_tap_fallback).toBe(true);
      }
    }
  });

  it("BR-GTC-07: exportTemplateContracts exports valid JSON Schema for all MVP templates", () => {
    for (const code of [
      "GT-001",
      "GT-002",
      "GT-003",
      "GT-004",
      "GT-005",
      "GT-006",
    ]) {
      const exported = exportTemplateContracts(code);
      expect(exported.code).toBe(code);
      expect(exported.content_contract_json_schema).toBeDefined();
      expect(exported.difficulty_contract_json_schema).toBeDefined();
      expect(exported.limits).toBeDefined();
    }
  });

  it("GT-004 refines: everyItemTargetsAnExistingGroup and everyGroupHasAtLeastOneItem work as expected", () => {
    const validData = {
      groups: [{ group_id: "g1" }, { group_id: "g2" }],
      items: [{ correct_group_id: "g1" }, { correct_group_id: "g2" }],
    };

    const invalidGroupTarget = {
      groups: [{ group_id: "g1" }, { group_id: "g2" }],
      items: [{ correct_group_id: "g1" }, { correct_group_id: "g9" }],
    };

    const unassignedGroup = {
      groups: [{ group_id: "g1" }, { group_id: "g2" }],
      items: [{ correct_group_id: "g1" }, { correct_group_id: "g1" }],
    };

    expect(everyItemTargetsAnExistingGroup(validData)).toBe(true);
    expect(everyGroupHasAtLeastOneItem(validData)).toBe(true);

    expect(everyItemTargetsAnExistingGroup(invalidGroupTarget)).toBe(false);
    expect(everyGroupHasAtLeastOneItem(unassignedGroup)).toBe(false);
  });

  describe("Task #169 — GameMechanic Vocabulary & Template Alignment", () => {
    it("every template mechanic belongs to ALL_GAME_MECHANICS", () => {
      const allowed = new Set(ALL_GAME_MECHANICS);
      for (const [code, template] of Object.entries(ALL_TEMPLATES)) {
        expect(
          allowed.has(template.mechanic),
          `Template ${code} has unknown mechanic: '${template.mechanic}'`
        ).toBe(true);
      }
    });

    it("every mechanic in ALL_GAME_MECHANICS is either used by a template or in RESERVED_MECHANICS", () => {
      const usedMechanics = new Set(
        Object.values(ALL_TEMPLATES).map((t) => t.mechanic)
      );
      const reserved = new Set(RESERVED_MECHANICS.map((r) => r.mechanic));

      for (const mechanic of ALL_GAME_MECHANICS) {
        const isCovered = usedMechanics.has(mechanic) || reserved.has(mechanic);
        expect(
          isCovered,
          `Mechanic '${mechanic}' is neither used in ALL_TEMPLATES nor listed in RESERVED_MECHANICS`
        ).toBe(true);
      }
    });

    it("RESERVED_MECHANICS does not contain mechanics that are already used in ALL_TEMPLATES", () => {
      const usedMechanics = new Set(
        Object.values(ALL_TEMPLATES).map((t) => t.mechanic)
      );
      for (const item of RESERVED_MECHANICS) {
        expect(
          usedMechanics.has(item.mechanic),
          `Mechanic '${item.mechanic}' is in RESERVED_MECHANICS but is already implemented in templates`
        ).toBe(false);
      }
    });

    it("ALL_GAME_MECHANICS contains exactly 37 values", () => {
      expect(ALL_GAME_MECHANICS).toHaveLength(37);
    });
  });
});
