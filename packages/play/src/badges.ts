import { evaluateBadges } from "@mindkid/adaptive";
import {
  childBadges,
  childDailyStats,
  curriculumEnrollments,
  curriculumItemProgress,
  curriculumItems,
  masteryState,
  skills,
} from "@mindkid/db";
import { and, eq, inArray } from "drizzle-orm";
import type { DbOrTx } from "#src/types";

const STRAND_COMPLETE_THRESHOLD = 0.8;

export interface StrandSkillRef {
  readonly id: number;
  readonly strandId: number;
}

export interface CurriculumEnrollmentRef {
  readonly id: number;
  readonly curriculumId: number;
}

export interface CurriculumWeekItemRef {
  readonly id: number;
  readonly curriculumId: number;
  readonly weekNo: number;
  readonly isRequired: boolean;
}

export interface CurriculumCompletedProgressRef {
  readonly enrollmentId: number;
  readonly curriculumItemId: number;
}

export function evaluateStrandCompletion(params: {
  readonly masteredSkillIds: ReadonlySet<number>;
  readonly strandSkills: readonly StrandSkillRef[];
}): boolean {
  const { masteredSkillIds, strandSkills } = params;
  if (masteredSkillIds.size === 0 || strandSkills.length === 0) {
    return false;
  }

  const skillsByStrand = new Map<number, number[]>();
  for (const sk of strandSkills) {
    const list = skillsByStrand.get(sk.strandId) ?? [];
    list.push(sk.id);
    skillsByStrand.set(sk.strandId, list);
  }

  for (const [, skillIds] of skillsByStrand) {
    if (
      skillIds.length > 0 &&
      skillIds.every((id) => masteredSkillIds.has(id))
    ) {
      return true;
    }
  }

  return false;
}

function hasCompletedWeekInEnrollment(params: {
  readonly curriculumId: number;
  readonly items: readonly CurriculumWeekItemRef[];
  readonly completedIds: ReadonlySet<number>;
}): boolean {
  const { curriculumId, items, completedIds } = params;
  const itemsByWeek = new Map<
    number,
    Array<{ id: number; isRequired: boolean }>
  >();

  for (const item of items) {
    if (item.curriculumId !== curriculumId) {
      continue;
    }
    const list = itemsByWeek.get(item.weekNo) ?? [];
    list.push({ id: item.id, isRequired: item.isRequired });
    itemsByWeek.set(item.weekNo, list);
  }

  for (const [, weekItems] of itemsByWeek) {
    if (weekItems.length === 0) {
      continue;
    }
    const mandatoryItems = weekItems.filter((it) => it.isRequired !== false);
    const requiredToComplete =
      mandatoryItems.length > 0 ? mandatoryItems : weekItems;
    const hasCompletedInWeek = weekItems.some((it) => completedIds.has(it.id));
    if (
      hasCompletedInWeek &&
      requiredToComplete.every((it) => completedIds.has(it.id))
    ) {
      return true;
    }
  }

  return false;
}

export function evaluateWeekCurriculumCompletion(params: {
  readonly enrollments: readonly CurriculumEnrollmentRef[];
  readonly items: readonly CurriculumWeekItemRef[];
  readonly completedProgress: readonly CurriculumCompletedProgressRef[];
}): boolean {
  const { enrollments, items, completedProgress } = params;
  if (
    enrollments.length === 0 ||
    items.length === 0 ||
    completedProgress.length === 0
  ) {
    return false;
  }

  for (const enr of enrollments) {
    const completedIds = new Set<number>(
      completedProgress
        .filter((p) => p.enrollmentId === enr.id)
        .map((p) => p.curriculumItemId)
    );
    if (completedIds.size === 0) {
      continue;
    }
    if (
      hasCompletedWeekInEnrollment({
        curriculumId: enr.curriculumId,
        items,
        completedIds,
      })
    ) {
      return true;
    }
  }

  return false;
}

export function computeNewChildBadges(params: {
  readonly distinctPlayDays: number;
  readonly masteredSkillIds: ReadonlySet<number>;
  readonly strandSkills: readonly StrandSkillRef[];
  readonly enrollments: readonly CurriculumEnrollmentRef[];
  readonly items: readonly CurriculumWeekItemRef[];
  readonly completedProgress: readonly CurriculumCompletedProgressRef[];
  readonly existingBadgeCodes?: ReadonlySet<string>;
}): ReturnType<typeof evaluateBadges> {
  const isFirstStrandComplete = evaluateStrandCompletion({
    masteredSkillIds: params.masteredSkillIds,
    strandSkills: params.strandSkills,
  });
  const isWeekCurriculumComplete = evaluateWeekCurriculumCompletion({
    enrollments: params.enrollments,
    items: params.items,
    completedProgress: params.completedProgress,
  });

  return evaluateBadges({
    distinctPlayDays: params.distinctPlayDays,
    isFirstStrandComplete,
    isWeekCurriculumComplete,
    existingBadgeCodes: new Set(params.existingBadgeCodes ?? []),
  });
}

export async function hasCompletedAnyStrand(
  db: DbOrTx,
  childId: number
): Promise<boolean> {
  const masteryRows = await db
    .select({
      skillId: masteryState.skillId,
      bestPLearn: masteryState.bestPLearn,
    })
    .from(masteryState)
    .where(eq(masteryState.childProfileId, childId));

  const masteredSkillIds = masteryRows
    .filter((r) => Number(r.bestPLearn) >= STRAND_COMPLETE_THRESHOLD)
    .map((r) => Number(r.skillId));

  if (masteredSkillIds.length === 0) {
    return false;
  }

  const masteredSkillRows = await db
    .select({ id: skills.id, strandId: skills.strandId })
    .from(skills)
    .where(inArray(skills.id, masteredSkillIds));

  const candidateStrandIds = [
    ...new Set(masteredSkillRows.map((s) => Number(s.strandId))),
  ];
  if (candidateStrandIds.length === 0) {
    return false;
  }

  const strandSkills = await db
    .select({ id: skills.id, strandId: skills.strandId })
    .from(skills)
    .where(inArray(skills.strandId, candidateStrandIds));

  return evaluateStrandCompletion({
    masteredSkillIds: new Set(masteredSkillIds),
    strandSkills: strandSkills.map((s) => ({
      id: Number(s.id),
      strandId: Number(s.strandId),
    })),
  });
}

export async function hasCompletedAnyCurriculumWeek(
  db: DbOrTx,
  childId: number
): Promise<boolean> {
  const enrollments = await db
    .select({
      id: curriculumEnrollments.id,
      curriculumId: curriculumEnrollments.curriculumId,
    })
    .from(curriculumEnrollments)
    .where(eq(curriculumEnrollments.childId, childId));

  if (enrollments.length === 0) {
    return false;
  }

  const enrollmentIds = enrollments.map((e) => Number(e.id));
  const curriculumIds = [
    ...new Set(enrollments.map((e) => Number(e.curriculumId))),
  ];

  const items = await db
    .select({
      id: curriculumItems.id,
      curriculumId: curriculumItems.curriculumId,
      weekNo: curriculumItems.weekNo,
      isRequired: curriculumItems.isRequired,
    })
    .from(curriculumItems)
    .where(inArray(curriculumItems.curriculumId, curriculumIds));

  if (items.length === 0) {
    return false;
  }

  const completedProgress = await db
    .select({
      enrollmentId: curriculumItemProgress.enrollmentId,
      curriculumItemId: curriculumItemProgress.curriculumItemId,
    })
    .from(curriculumItemProgress)
    .where(
      and(
        inArray(curriculumItemProgress.enrollmentId, enrollmentIds),
        eq(curriculumItemProgress.status, "completed")
      )
    );

  return evaluateWeekCurriculumCompletion({
    enrollments: enrollments.map((e) => ({
      id: Number(e.id),
      curriculumId: Number(e.curriculumId),
    })),
    items: items.map((i) => ({
      id: Number(i.id),
      curriculumId: Number(i.curriculumId),
      weekNo: i.weekNo,
      isRequired: i.isRequired,
    })),
    completedProgress: completedProgress.map((p) => ({
      enrollmentId: Number(p.enrollmentId),
      curriculumItemId: Number(p.curriculumItemId),
    })),
  });
}

export async function awardChildBadges(params: {
  readonly db: DbOrTx;
  readonly childId: number;
  readonly sessionUuid: string;
  readonly now: Date;
}): Promise<void> {
  const { db, childId, sessionUuid, now } = params;
  const existingBadgesRows = await db
    .select({ badgeCode: childBadges.badgeCode })
    .from(childBadges)
    .where(eq(childBadges.childProfileId, childId));
  const existingBadgeCodes = new Set<string>(
    existingBadgesRows.map((b: { badgeCode: string }) => b.badgeCode)
  );

  const dailyStatsRows = await db
    .select({ dateIct: childDailyStats.dateIct })
    .from(childDailyStats)
    .where(eq(childDailyStats.childProfileId, childId));
  const distinctDays = new Set(
    dailyStatsRows.map((d: { dateIct: string }) => d.dateIct)
  ).size;

  const isFirstStrandComplete = await hasCompletedAnyStrand(db, childId);
  const isWeekCurriculumComplete = await hasCompletedAnyCurriculumWeek(
    db,
    childId
  );

  const newBadges = evaluateBadges({
    distinctPlayDays: distinctDays,
    isFirstStrandComplete,
    isWeekCurriculumComplete,
    existingBadgeCodes,
  });

  for (const badgeCode of newBadges) {
    await db
      .insert(childBadges)
      .values({
        childProfileId: childId,
        badgeCode,
        awardedAt: now,
        sourceRef: sessionUuid,
      })
      .onConflictDoNothing();
  }
}
