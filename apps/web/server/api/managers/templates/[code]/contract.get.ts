import { NotFoundError, ValidationError } from "@mindkid/errors/common";
import {
  exportTemplateContracts,
  getGameTemplate,
} from "@mindkid/game-engine/registry";
import { CONFIG_DICTIONARY, introspectZodSchema } from "@mindkid/shared";
import { defineEventHandler, getRouterParam } from "h3";
import { requireManagerSession } from "#server/utils/admin-auth-runtime";

export default defineEventHandler(async (event) => {
  await requireManagerSession(event);

  const code = getRouterParam(event, "code");
  if (!code) {
    throw new ValidationError("Template code is required");
  }

  const template = getGameTemplate(code);
  if (!template) {
    throw new NotFoundError(`Template ${code} not found`);
  }

  const exported = exportTemplateContracts(code);
  const contentUiHints = introspectZodSchema(
    template.content_contract,
    "content"
  );
  const difficultyUiHints = introspectZodSchema(
    template.difficulty_contract,
    "difficulty"
  );

  return {
    ...exported,
    name: template.name,
    ui_hints: {
      content: contentUiHints,
      difficulty: difficultyUiHints,
      meta: exported.ui_hints,
    },
    labels: CONFIG_DICTIONARY,
    limits: template.limits,
  };
});
