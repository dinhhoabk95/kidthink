import { inferKogumaMetaFromTitleOrCode } from "@mindkid/taxonomy";
import { defineEventHandler } from "h3";
import { listPersonalCurricula } from "#server/services/index.js";
import { requireWebUserSession } from "#server/utils/auth-runtime";

export default defineEventHandler(async (event) => {
  const user = await requireWebUserSession(event);
  const userId = Number(user.user_id);

  const list = await listPersonalCurricula({ userId });
  const enrichedItems = list.map((item) => {
    const meta = inferKogumaMetaFromTitleOrCode({
      title: item.title,
      durationWeeks: item.duration_weeks,
      ageMin: item.age_min ?? null,
    });
    return {
      ...item,
      is_koguma: meta.is_koguma,
      koguma_track: meta.koguma_track,
      koguma_stage: meta.koguma_stage,
      koguma_variant: meta.koguma_variant,
      koguma_track_label_vi: meta.koguma_track_label_vi,
      moet_themes: meta.moet_themes,
    };
  });

  return {
    items: enrichedItems,
    total: enrichedItems.length,
  };
});
