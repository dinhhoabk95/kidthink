import { MVP_TEMPLATES } from "@mindkid/game-engine/registry";
import { defineEventHandler } from "h3";

export default defineEventHandler(() => {
  const templates = Object.values(MVP_TEMPLATES).map((tmpl) => ({
    code: tmpl.code,
    name: tmpl.name,
    mechanic: tmpl.mechanic,
    age_min: tmpl.age_min,
    age_max: tmpl.age_max,
  }));

  return { templates };
});
