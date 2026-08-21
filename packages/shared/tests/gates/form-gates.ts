import { readdirSync, statSync } from "node:fs";
import { join } from "node:path";
import { type GameTemplate, MVP_TEMPLATES } from "@mindkid/game-engine";

import {
  CONFIG_DICTIONARY,
  TEXT_FALLBACK_ALLOWLIST,
} from "../../src/config-dictionary.ts";
import {
  getMaxNestingDepth,
  introspectZodSchema,
  type UiHintResult,
} from "../../src/zod-introspect.ts";

export interface FormGateViolation {
  code: string;
  templateCode?: string;
  field?: string;
  message: string;
}

const ARRAY_SUFFIX_REGEX = /\[\]$/;
const FORBIDDEN_GT_REGEX_1 = /gt-?00[1-6]/i;
const FORBIDDEN_GT_REGEX_2 = /Gt00[1-6]/i;

export function checkLabelGate(
  templates: Record<string, GameTemplate> = MVP_TEMPLATES,
  dictionary: Record<string, unknown> = CONFIG_DICTIONARY
): FormGateViolation[] {
  const violations: FormGateViolation[] = [];

  function checkNode(node: UiHintResult, templateCode: string) {
    const rawName = node.name.replace(ARRAY_SUFFIX_REGEX, "");
    if (!dictionary[rawName]) {
      violations.push({
        code: "MISSING_DICTIONARY_LABEL",
        templateCode,
        field: node.path,
        message: `[${templateCode}] Field '${node.path}' (${rawName}) lacks Vietnamese translation in CONFIG_DICTIONARY (BR-SDF-06, D-JU).`,
      });
    }

    if (node.children) {
      for (const child of Object.values(node.children)) {
        checkNode(child, templateCode);
      }
    }
    if (node.elementHint) {
      checkNode(node.elementHint, templateCode);
    }
  }

  for (const [code, tpl] of Object.entries(templates)) {
    const contentHints = introspectZodSchema(tpl.content_contract);
    for (const hint of Object.values(contentHints)) {
      checkNode(hint, code);
    }

    const diffHints = introspectZodSchema(tpl.difficulty_contract);
    for (const hint of Object.values(diffHints)) {
      checkNode(hint, code);
    }
  }

  return violations;
}

export function checkTextFallbackGate(
  templates: Record<string, GameTemplate> = MVP_TEMPLATES,
  allowlist: Record<string, string> = TEXT_FALLBACK_ALLOWLIST
): FormGateViolation[] {
  const violations: FormGateViolation[] = [];

  function checkNode(node: UiHintResult, templateCode: string) {
    if (node.hint === "text") {
      const rawName = node.name.replace(ARRAY_SUFFIX_REGEX, "");
      const isAllowed = rawName.endsWith("_vi") || Boolean(allowlist[rawName]);
      if (!isAllowed) {
        violations.push({
          code: "TEXT_FALLBACK_NOT_ALLOWLISTED",
          templateCode,
          field: node.path,
          message: `[${templateCode}] Field '${node.path}' fell into 'text' fallback without '_vi' suffix and is not in TEXT_FALLBACK_ALLOWLIST (BR-SDF-08, D-JT).`,
        });
      }
    }

    if (node.children) {
      for (const child of Object.values(node.children)) {
        checkNode(child, templateCode);
      }
    }
    if (node.elementHint) {
      checkNode(node.elementHint, templateCode);
    }
  }

  for (const [code, tpl] of Object.entries(templates)) {
    const contentHints = introspectZodSchema(tpl.content_contract);
    for (const hint of Object.values(contentHints)) {
      checkNode(hint, code);
    }

    const diffHints = introspectZodSchema(tpl.difficulty_contract);
    for (const hint of Object.values(diffHints)) {
      checkNode(hint, code);
    }
  }

  return violations;
}

export function checkDepthGate(
  templates: Record<string, GameTemplate> = MVP_TEMPLATES,
  maxAllowedDepth = 3
): FormGateViolation[] {
  const violations: FormGateViolation[] = [];

  for (const [code, tpl] of Object.entries(templates)) {
    const contentHints = introspectZodSchema(tpl.content_contract);
    const contentDepth = getMaxNestingDepth(contentHints);
    if (contentDepth > maxAllowedDepth) {
      violations.push({
        code: "MAX_DEPTH_EXCEEDED",
        templateCode: code,
        message: `[${code}] Content schema nesting depth is ${contentDepth}, exceeding maximum allowed depth of ${maxAllowedDepth} (D-JU).`,
      });
    }

    const diffHints = introspectZodSchema(tpl.difficulty_contract);
    const diffDepth = getMaxNestingDepth(diffHints);
    if (diffDepth > maxAllowedDepth) {
      violations.push({
        code: "MAX_DEPTH_EXCEEDED",
        templateCode: code,
        message: `[${code}] Difficulty schema nesting depth is ${diffDepth}, exceeding maximum allowed depth of ${maxAllowedDepth} (D-JU).`,
      });
    }
  }

  return violations;
}

export function checkTemplateComponentGate(
  adminComponentsDir = "apps/admin/app/components"
): FormGateViolation[] {
  const violations: FormGateViolation[] = [];

  function scanDir(dir: string) {
    try {
      const entries = readdirSync(dir);
      for (const entry of entries) {
        const fullPath = join(dir, entry);
        const stat = statSync(fullPath);
        if (stat.isDirectory()) {
          scanDir(fullPath);
        } else if (
          stat.isFile() &&
          entry.endsWith(".vue") &&
          (FORBIDDEN_GT_REGEX_1.test(entry) || FORBIDDEN_GT_REGEX_2.test(entry))
        ) {
          violations.push({
            code: "FORBIDDEN_PER_TEMPLATE_COMPONENT",
            field: fullPath,
            message: `Found per-template component '${fullPath}'. Admin studio MUST use generic schema form renderer (BR-SDF-01).`,
          });
        }
      }
    } catch {
      // ignore missing directory in test mocks
    }
  }

  scanDir(adminComponentsDir);
  return violations;
}

export function runAllFormGates(): FormGateViolation[] {
  return [
    ...checkLabelGate(),
    ...checkTextFallbackGate(),
    ...checkDepthGate(),
    ...checkTemplateComponentGate(),
  ];
}
