import { zodToJsonSchema } from "zod-to-json-schema";
import { GT001Template } from "./templates/gt001.js";
import { GT002Template } from "./templates/gt002.js";
import { GT003Template } from "./templates/gt003.js";
import { GT004Template } from "./templates/gt004.js";
import { GT005Template } from "./templates/gt005.js";
import { GT006Template } from "./templates/gt006.js";
import type { AgeBand, GameTemplate } from "./types.js";

export const MVP_TEMPLATES: Record<string, GameTemplate> = {
  "GT-001": GT001Template,
  "GT-002": GT002Template,
  "GT-003": GT003Template,
  "GT-004": GT004Template,
  "GT-005": GT005Template,
  "GT-006": GT006Template,
};

export function getGameTemplate(code: string): GameTemplate | undefined {
  return MVP_TEMPLATES[code];
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
