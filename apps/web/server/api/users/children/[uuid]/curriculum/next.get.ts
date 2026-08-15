import { AppError } from "@kidthink/auth";
import { curriculumEnrollments, getOwnerDb } from "@kidthink/db";
import { resolveNextStep } from "@kidthink/shared";
import { eq } from "drizzle-orm";
import {
  createError,
  defineEventHandler,
  getRouterParam,
  setResponseStatus,
} from "h3";
import {
  requireWebUserSession,
  respondToUserAuthError,
} from "../../../../../utils/auth-runtime.js";
import { resolveEnrolledChildCurriculum } from "../../../../../utils/curriculum-runtime.js";

export default defineEventHandler(async (event) => {
  try {
    const user = await requireWebUserSession(event);
    const uuid = getRouterParam(event, "uuid");
    if (!uuid) {
      setResponseStatus(event, 404);
      throw createError({ statusCode: 404, statusMessage: "NOT_FOUND" });
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
    if (
      enrollment.status === "completed" &&
      nextStep.curriculum_progress < 1.0
    ) {
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
  } catch (err: unknown) {
    const errorObj = err as { statusCode?: number };
    if (errorObj?.statusCode) {
      setResponseStatus(event, errorObj.statusCode);
      throw err;
    }
    if (err instanceof AppError) {
      setResponseStatus(event, err.status);
      throw createError({
        statusCode: err.status,
        statusMessage: err.code,
        data: { code: err.code, message: err.message },
      });
    }
    return respondToUserAuthError(event, err);
  }
});
