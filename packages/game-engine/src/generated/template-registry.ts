/** @generated from TEMPLATES@a1b2c3d4 — DO NOT EDIT MANUALLY (BR-TAK-03) */

import { zodToJsonSchema } from "zod-to-json-schema";
import type { AgeBand, GameTemplate } from "../contracts/types.js";
import GT001Template from "../templates/GT-001/template.js";
import GT002Template from "../templates/GT-002/template.js";
import GT003Template from "../templates/GT-003/template.js";
import GT004Template from "../templates/GT-004/template.js";
import GT005Template from "../templates/GT-005/template.js";
import GT006Template from "../templates/GT-006/template.js";
import GT007Template from "../templates/GT-007/template.js";
import GT008Template from "../templates/GT-008/template.js";
import GT009Template from "../templates/GT-009/template.js";
import GT010Template from "../templates/GT-010/template.js";
import GT011Template from "../templates/GT-011/template.js";
import GT012Template from "../templates/GT-012/template.js";
import GT013Template from "../templates/GT-013/template.js";
import GT014Template from "../templates/GT-014/template.js";
import GT015Template from "../templates/GT-015/template.js";
import GT016Template from "../templates/GT-016/template.js";
import GT017Template from "../templates/GT-017/template.js";

export const ALL_TEMPLATES: Record<string, GameTemplate> = {
  "GT-001": GT001Template,
  "GT-002": GT002Template,
  "GT-003": GT003Template,
  "GT-004": GT004Template,
  "GT-005": GT005Template,
  "GT-006": GT006Template,
  "GT-007": GT007Template,
  "GT-008": GT008Template,
  "GT-009": GT009Template,
  "GT-010": GT010Template,
  "GT-011": GT011Template,
  "GT-012": GT012Template,
  "GT-013": GT013Template,
  "GT-014": GT014Template,
  "GT-015": GT015Template,
  "GT-016": GT016Template,
  "GT-017": GT017Template,
};

export const MVP_TEMPLATES = ALL_TEMPLATES;

export function getGameTemplate(code: string): GameTemplate | undefined {
  return ALL_TEMPLATES[code];
}

export function exportTemplateContracts(code: string) {
  const template = getGameTemplate(code);
  if (!template) {
    throw new Error(`TEMPLATE_NOT_SUPPORTED: Template ${code} not found`);
  }
  return {
    code: template.code,
    content_contract_json_schema: zodToJsonSchema(template.content_contract, {
      name: `${code.replace("-", "")}Content`,
    }),
    difficulty_contract_json_schema: zodToJsonSchema(
      template.difficulty_contract,
      {
        name: `${code.replace("-", "")}Difficulty`,
      }
    ),
    limits: template.limits,
    ui_hints: {
      mechanic: template.mechanic,
      layouts: template.layouts,
      requires_tap_fallback: template.requires_tap_fallback,
    },
  };
}

export function validateContentPack(code: string, contentPack: unknown) {
  const template = getGameTemplate(code);
  if (!template) {
    return {
      success: false,
      error: {
        code: "TEMPLATE_NOT_SUPPORTED",
        message: `Template ${code} is not supported`,
      },
    };
  }

  const result = template.content_contract.safeParse(contentPack);
  if (!result.success) {
    return {
      success: false,
      error: {
        code: "CONTENT_PACK_INVALID",
        message: `Content pack invalid for ${code}`,
        details: {
          issues: result.error.issues,
        },
      },
    };
  }

  return { success: true, data: result.data };
}

export function validateAgeBandForTemplate(
  template: GameTemplate,
  targetAge: number
): boolean {
  if (targetAge < template.age_min || targetAge > template.age_max) {
    return false;
  }
  if (template.banned_age_bands) {
    let ageBand: AgeBand = "5-6";
    if (targetAge <= 3) {
      ageBand = "3-4";
    } else if (targetAge <= 4) {
      ageBand = "4-5";
    }
    if (template.banned_age_bands.includes(ageBand)) {
      return false;
    }
  }
  return true;
}
