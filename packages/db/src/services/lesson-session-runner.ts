/**
 * Lesson Session Runner Service (BR-LSR-01..16).
 * Spec: docs/specs/04-play/lesson-session-runner.md
 *
 * Rules:
 * - BR-LSR-01: Single-step presentation logic.
 * - BR-LSR-02: Instructor-paced (no automatic step advance).
 * - BR-LSR-03: Child surface has NO countdown or score display.
 * - BR-LSR-04: Off-screen activities supported with explicit dual-branch guidance.
 * - BR-LSR-05: Closed 3-level observation vocabulary (did_it, with_help, not_yet), NO free-text.
 * - BR-LSR-06: Observations tied to behavioral descriptors from lesson.
 * - BR-LSR-07: Pinned content_version per session run.
 * - BR-LSR-08: Skipping steps permitted with outcome='skipped'.
 * - BR-LSR-09: Daily play cap only gates digital_game activities, off-screen continues.
 * - BR-LSR-10: No text-reading requirement on child surfaces.
 * - BR-LSR-11: Incomplete runs older than 7 days auto-marked 'abandoned'.
 */

import { and, eq } from "drizzle-orm";
import { getAppDb } from "#src/client";
import { childProfiles } from "#src/schema/child";
import { activities, lessonActivities, lessons } from "#src/schema/content";
import {
  lessonRunObservations,
  lessonRunSteps,
  lessonRuns,
} from "#src/schema/lesson-runs";

export interface StartLessonRunInput {
  userId: number;
  childProfileUuid?: string;
  childProfileId?: number;
  lessonCode: string;
  now?: Date;
}

export interface LessonRunStepDetail {
  stepIndex: number;
  kind: "warm_up" | "off_screen" | "digital_game" | "reflection" | "assessment";
  outcome: "pending" | "done" | "skipped";
  activity?: {
    id: number;
    code: string;
    kind: string;
    title: string;
    instruction: string | null;
  } | null;
}

export interface StartLessonRunResult {
  runUuid: string;
  lesson: {
    id: number;
    code: string;
    title: string;
    contentVersion: number;
    guide: unknown;
    status: string;
  };
  steps: LessonRunStepDetail[];
  currentStep: number;
  status: "in_progress" | "completed" | "abandoned";
}

async function resolveChildId(
  userId: number,
  childProfileId?: number,
  childProfileUuid?: string
): Promise<number> {
  const db = getAppDb();
  if (childProfileId) {
    return childProfileId;
  }

  if (childProfileUuid) {
    const [child] = await db
      .select()
      .from(childProfiles)
      .where(
        and(
          eq(childProfiles.uuid, childProfileUuid),
          eq(childProfiles.userId, userId)
        )
      );
    if (child) {
      return child.id;
    }
  }

  const [firstActiveChild] = await db
    .select()
    .from(childProfiles)
    .where(
      and(eq(childProfiles.userId, userId), eq(childProfiles.status, "active"))
    );
  if (firstActiveChild) {
    return firstActiveChild.id;
  }

  const err = new Error("NO_ACTIVE_CHILD");
  err.name = "NO_ACTIVE_CHILD";
  throw err;
}

async function resolveLesson(lessonCode: string) {
  const db = getAppDb();
  const [lesson] = await db
    .select()
    .from(lessons)
    .where(eq(lessons.code, lessonCode));

  if (lesson?.status !== "published") {
    if (lesson?.status === "archived") {
      const err = new Error("CONTENT_ARCHIVED");
      err.name = "CONTENT_ARCHIVED";
      throw err;
    }
    const err = new Error("NOT_FOUND");
    err.name = "NOT_FOUND";
    throw err;
  }

  return lesson;
}

async function checkExistingRun(
  userId: number,
  childId: number,
  lessonId: number,
  now: Date
): Promise<string | null> {
  const db = getAppDb();
  const [existingRun] = await db
    .select()
    .from(lessonRuns)
    .where(
      and(
        eq(lessonRuns.userId, userId),
        eq(lessonRuns.childProfileId, childId),
        eq(lessonRuns.lessonId, lessonId),
        eq(lessonRuns.status, "in_progress")
      )
    );

  if (!existingRun) {
    return null;
  }

  const diffMs = now.getTime() - new Date(existingRun.startedAt).getTime();
  const sevenDaysMs = 7 * 24 * 60 * 60 * 1000;

  if (diffMs > sevenDaysMs) {
    await db
      .update(lessonRuns)
      .set({ status: "abandoned", endedAt: now, updatedAt: now })
      .where(eq(lessonRuns.id, existingRun.id));
    return null;
  }

  return existingRun.uuid;
}

async function createStepsForRun(
  runId: number,
  lessonId: number,
  now: Date
): Promise<void> {
  const db = getAppDb();
  const lActivities = await db
    .select({
      lessonActivity: lessonActivities,
      activity: activities,
    })
    .from(lessonActivities)
    .leftJoin(activities, eq(lessonActivities.activityId, activities.id))
    .where(eq(lessonActivities.lessonId, lessonId));

  const sortedActivities = [...lActivities].sort(
    (a, b) => a.lessonActivity.position - b.lessonActivity.position
  );

  if (sortedActivities.length === 0) {
    await db.insert(lessonRunSteps).values({
      lessonRunId: runId,
      stepIndex: 0,
      kind: "reflection",
      outcome: "pending",
      startedAt: now,
    });
    return;
  }

  for (let idx = 0; idx < sortedActivities.length; idx++) {
    const act = sortedActivities[idx]?.activity;
    let stepKind:
      | "warm_up"
      | "off_screen"
      | "digital_game"
      | "reflection"
      | "assessment" = "off_screen";

    if (act?.kind === "digital_game") {
      stepKind = "digital_game";
    } else if (act?.kind === "assessment") {
      stepKind = "assessment";
    } else if (act?.kind === "discussion" || act?.kind === "storytelling") {
      stepKind = "warm_up";
    }

    await db.insert(lessonRunSteps).values({
      lessonRunId: runId,
      stepIndex: idx,
      activityId: act ? act.id : null,
      kind: stepKind,
      outcome: "pending",
      startedAt: idx === 0 ? now : null,
    });
  }
}

/**
 * Starts or resumes a lesson session run for a user and child (BR-LSR-07, BR-LSR-11).
 */
export async function startLessonRun(
  input: StartLessonRunInput
): Promise<StartLessonRunResult> {
  const db = getAppDb();
  const now = input.now ?? new Date();

  const childId = await resolveChildId(
    input.userId,
    input.childProfileId,
    input.childProfileUuid
  );
  const lesson = await resolveLesson(input.lessonCode);

  const existingUuid = await checkExistingRun(
    input.userId,
    childId,
    lesson.id,
    now
  );
  if (existingUuid) {
    return await getLessonRun(existingUuid, input.userId);
  }

  const [newRun] = await db
    .insert(lessonRuns)
    .values({
      userId: input.userId,
      childProfileId: childId,
      lessonId: lesson.id,
      contentVersion: lesson.contentVersion,
      status: "in_progress",
      currentStep: 0,
      startedAt: now,
    })
    .returning();

  await createStepsForRun(newRun.id, lesson.id, now);
  return await getLessonRun(newRun.uuid, input.userId);
}

/**
 * Retrieves a lesson run by UUID with ownership verification.
 */
export async function getLessonRun(
  runUuid: string,
  userId: number
): Promise<StartLessonRunResult> {
  const db = getAppDb();
  const [run] = await db
    .select({
      run: lessonRuns,
      lesson: lessons,
    })
    .from(lessonRuns)
    .innerJoin(lessons, eq(lessonRuns.lessonId, lessons.id))
    .where(and(eq(lessonRuns.uuid, runUuid), eq(lessonRuns.userId, userId)));

  if (!run) {
    const err = new Error("NOT_FOUND");
    err.name = "NOT_FOUND";
    throw err;
  }

  const stepsRaw = await db
    .select({
      step: lessonRunSteps,
      activity: activities,
    })
    .from(lessonRunSteps)
    .leftJoin(activities, eq(lessonRunSteps.activityId, activities.id))
    .where(eq(lessonRunSteps.lessonRunId, run.run.id));

  const sortedSteps = [...stepsRaw].sort(
    (a, b) => a.step.stepIndex - b.step.stepIndex
  );

  const steps: LessonRunStepDetail[] = sortedSteps.map((s) => ({
    stepIndex: s.step.stepIndex,
    kind: s.step.kind,
    outcome: s.step.outcome,
    activity: s.activity
      ? {
          id: s.activity.id,
          code: s.activity.code,
          kind: s.activity.kind,
          title: s.activity.title,
          instruction: s.activity.instruction,
        }
      : null,
  }));

  return {
    runUuid: run.run.uuid,
    lesson: {
      id: run.lesson.id,
      code: run.lesson.code,
      title: run.lesson.title,
      contentVersion: run.run.contentVersion,
      guide: run.lesson.guide,
      status: run.lesson.status,
    },
    steps,
    currentStep: run.run.currentStep,
    status: run.run.status,
  };
}

/**
 * Updates a step outcome (done / skipped) and advances current step (BR-LSR-01, BR-LSR-02, BR-LSR-08).
 */
export async function updateStep(
  runUuid: string,
  userId: number,
  stepIndex: number,
  outcome: "done" | "skipped",
  now?: Date
): Promise<{ currentStep: number; status: string }> {
  const db = getAppDb();
  const timestamp = now ?? new Date();

  const [run] = await db
    .select()
    .from(lessonRuns)
    .where(and(eq(lessonRuns.uuid, runUuid), eq(lessonRuns.userId, userId)));

  if (!run) {
    const err = new Error("NOT_FOUND");
    err.name = "NOT_FOUND";
    throw err;
  }

  if (run.status !== "in_progress") {
    const err = new Error("SESSION_ALREADY_COMPLETED");
    err.name = "SESSION_ALREADY_COMPLETED";
    throw err;
  }

  const [step] = await db
    .select()
    .from(lessonRunSteps)
    .where(
      and(
        eq(lessonRunSteps.lessonRunId, run.id),
        eq(lessonRunSteps.stepIndex, stepIndex)
      )
    );

  if (!step) {
    const err = new Error("VALIDATION_FAILED");
    err.name = "VALIDATION_FAILED";
    throw err;
  }

  await db
    .update(lessonRunSteps)
    .set({
      outcome,
      completedAt: timestamp,
      updatedAt: timestamp,
    })
    .where(eq(lessonRunSteps.id, step.id));

  const nextStepIndex = stepIndex + 1;
  await db
    .update(lessonRuns)
    .set({
      currentStep: nextStepIndex,
      updatedAt: timestamp,
    })
    .where(eq(lessonRuns.id, run.id));

  return {
    currentStep: nextStepIndex,
    status: run.status,
  };
}

/**
 * Records an observation against closed 3-level vocabulary (BR-LSR-05, BR-LSR-06).
 */
export async function recordObservation(
  runUuid: string,
  userId: number,
  objectiveCode: string,
  level: "did_it" | "with_help" | "not_yet",
  rawBodyKeys?: string[],
  now?: Date
): Promise<{ recorded: boolean }> {
  const db = getAppDb();
  const timestamp = now ?? new Date();

  if (rawBodyKeys) {
    const allowedKeys = new Set(["objective_code", "level"]);
    const hasDisallowed = rawBodyKeys.some((k) => !allowedKeys.has(k));
    if (hasDisallowed) {
      const err = new Error("CHILD_FIELD_NOT_ALLOWED");
      err.name = "CHILD_FIELD_NOT_ALLOWED";
      throw err;
    }
  }

  if (!["did_it", "with_help", "not_yet"].includes(level)) {
    const err = new Error("VALIDATION_FAILED");
    err.name = "VALIDATION_FAILED";
    throw err;
  }

  const [run] = await db
    .select()
    .from(lessonRuns)
    .where(and(eq(lessonRuns.uuid, runUuid), eq(lessonRuns.userId, userId)));

  if (!run) {
    const err = new Error("NOT_FOUND");
    err.name = "NOT_FOUND";
    throw err;
  }

  await db
    .insert(lessonRunObservations)
    .values({
      lessonRunId: run.id,
      objectiveCode,
      level,
      observedAt: timestamp,
    })
    .onConflictDoUpdate({
      target: [
        lessonRunObservations.lessonRunId,
        lessonRunObservations.objectiveCode,
      ],
      set: {
        level,
        observedAt: timestamp,
      },
    });

  return { recorded: true };
}

/**
 * Completes a lesson run session.
 */
export async function completeLessonRun(
  runUuid: string,
  userId: number,
  now?: Date
): Promise<{ status: "completed"; observationsCount: number }> {
  const db = getAppDb();
  const timestamp = now ?? new Date();

  const [run] = await db
    .select()
    .from(lessonRuns)
    .where(and(eq(lessonRuns.uuid, runUuid), eq(lessonRuns.userId, userId)));

  if (!run) {
    const err = new Error("NOT_FOUND");
    err.name = "NOT_FOUND";
    throw err;
  }

  if (run.status === "completed") {
    const err = new Error("SESSION_ALREADY_COMPLETED");
    err.name = "SESSION_ALREADY_COMPLETED";
    throw err;
  }

  await db
    .update(lessonRuns)
    .set({
      status: "completed",
      endedAt: timestamp,
      updatedAt: timestamp,
    })
    .where(eq(lessonRuns.id, run.id));

  const obs = await db
    .select()
    .from(lessonRunObservations)
    .where(eq(lessonRunObservations.lessonRunId, run.id));

  return {
    status: "completed",
    observationsCount: obs.length,
  };
}

export const LessonSessionRunnerService = {
  startLessonRun,
  getLessonRun,
  updateStep,
  recordObservation,
  completeLessonRun,
};
