import { curriculumEnrollments, getOwnerDb } from "@mindkid/db";
import { NotFoundError } from "@mindkid/errors/common";
import { resolveNextStep } from "@mindkid/shared";
import { eq } from "drizzle-orm";
import { defineEventHandler, getRouterParam } from "h3";

import { requireWebUserSession } from "#server/utils/auth-runtime";
import { resolveEnrolledChildCurriculum } from "#server/utils/curriculum-runtime";

export default defineEventHandler(async (event) => {
  const user = await requireWebUserSession(event);
  const uuid = getRouterParam(event, "uuid");
  if (!uuid) {
    throw new NotFoundError("NOT_FOUND");
  }

  const userId = Number(user.user_id);
  const db = getOwnerDb();

  // 1. Resolve child, active enrollment, items, published entities, and user allowed tiers in batch
  const { enrollment, items, weeks, completedItemIds, userAllowedTiers } =
    await resolveEnrolledChildCurriculum(event, userId, uuid, {
      requireActive: false,
    });

  // 2. Compute next step (BR-CUR-01..10, D-MG, D-ME, D-MD)
  const nextStep = resolveNextStep({
    durationWeeks: enrollment.duration_weeks,
    weeks,
    items,
    completedItemIds,
    allowedTiers: userAllowedTiers,
  });

  // 3. Handle D-MD state transitions
  if (enrollment.status === "completed" && nextStep.curriculum_progress < 1.0) {
    // Tier upgraded -> denominator expanded -> progress dropped below 1.0 -> revert to active
    await db
      .update(curriculumEnrollments)
      .set({ status: "active" })
      .where(eq(curriculumEnrollments.id, enrollment.id));
  } else if (enrollment.status === "active" && nextStep.is_completed) {
    // Child completed all mandatory available items in all weeks -> mark completed
    await db
      .update(curriculumEnrollments)
      .set({ status: "completed" })
      .where(eq(curriculumEnrollments.id, enrollment.id));
  }

  return {
    week_no: nextStep.week_no,
    session_no: nextStep.session_no,
    item: nextStep.item,
    week_progress: nextStep.week_progress,
    curriculum_progress: nextStep.curriculum_progress,
    week_blocked_by_tier: nextStep.week_blocked_by_tier,
    is_completed: nextStep.is_completed,
    next_curriculum_suggestion: nextStep.next_curriculum_suggestion,
  };
});
