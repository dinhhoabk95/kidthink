/**
 * Lesson Exemplar Service (BR-LEX-01..11).
 * Spec: docs/specs/05-content/lesson-exemplar-set.md
 *
 * Rules:
 * - BR-LEX-01: Exemplar is a flag on `lessons`, not a separate table.
 * - BR-LEX-02: Must have run with real children and have playtest records (≥1 completed lesson_runs).
 * - BR-LEX-03: Exemplar lessons always at `free` tier.
 * - BR-LEX-04: `origin` must be `human`.
 * - BR-LEX-05: Must balance activities: ≥1 off-screen activity and ≥1 digital game activity.
 * - BR-LEX-06: Evaluation section includes filled examples for all 3 observation levels.
 * - BR-LEX-07: Exemplar set covers 6 competencies × 3 age bands (18 cells), each cell ≥ 1.
 * - BR-LEX-08: Ceiling of 2 exemplars per cell (maximum 36 across entire matrix).
 * - BR-LEX-09: Editorial changes put exemplars into review queue first.
 * - BR-LEX-10: Only pedagogical experts (managers with super_admin / content_reviewer role) can approve exemplars.
 */

import {
  activities,
  auditLogs,
  getAppDb,
  lessonActivities,
  lessonRuns,
  lessons,
  managers,
} from "@mindkid/db";
import { and, count, eq, ne } from "drizzle-orm";

export type CompetencyCode = "C1" | "C2" | "C3" | "C4" | "C5" | "C6";
export type AgeBand = "3-4" | "4-5" | "5-6";

export const ALL_COMPETENCIES: readonly CompetencyCode[] = [
  "C1",
  "C2",
  "C3",
  "C4",
  "C5",
  "C6",
];

export const ALL_AGE_BANDS: readonly AgeBand[] = ["3-4", "4-5", "5-6"];

export interface ExemplarEligibilityResult {
  eligible: boolean;
  conditions: {
    isPublished: boolean;
    hasPlaytestEvidence: boolean;
    isFreeTier: boolean;
    isHumanOrigin: boolean;
    hasBalancedActivities: boolean;
  };
  errors: string[];
}

export interface NominateExemplarInput {
  lessonId: number;
  managerId: number;
  competency: CompetencyCode;
  ageBand: AgeBand;
  notes?: string;
}

export interface ApproveExemplarInput {
  lessonId: number;
  approverManagerId: number;
  competency: CompetencyCode;
  ageBand: AgeBand;
  notes?: string;
  now?: Date;
}

export interface RevokeExemplarInput {
  lessonId: number;
  managerId: number;
  reason: string;
  now?: Date;
}

async function verifyManagerPermission(
  managerId: number
): Promise<{ id: number; role: string }> {
  const db = getAppDb();
  const [manager] = await db
    .select()
    .from(managers)
    .where(eq(managers.id, managerId));

  if (
    !manager ||
    (manager.role !== "super_admin" && manager.role !== "content_reviewer")
  ) {
    const err = new Error("INSUFFICIENT_ROLE");
    err.name = "INSUFFICIENT_ROLE";
    throw err;
  }

  return manager;
}

async function checkActivityBalance(lessonId: number): Promise<boolean> {
  const db = getAppDb();
  const lActs = await db
    .select({
      kind: activities.kind,
    })
    .from(lessonActivities)
    .innerJoin(activities, eq(lessonActivities.activityId, activities.id))
    .where(eq(lessonActivities.lessonId, lessonId));

  let hasDigitalGame = false;
  let hasOffScreen = false;

  for (const act of lActs) {
    if (act.kind === "digital_game") {
      hasDigitalGame = true;
    } else {
      hasOffScreen = true;
    }
  }

  return hasDigitalGame && hasOffScreen;
}

async function checkPlaytestEvidence(lessonId: number): Promise<boolean> {
  const db = getAppDb();
  const [result] = await db
    .select({ total: count() })
    .from(lessonRuns)
    .where(
      and(eq(lessonRuns.lessonId, lessonId), eq(lessonRuns.status, "completed"))
    );

  return (result?.total ?? 0) > 0;
}

export async function validateExemplarEligibility(
  lessonId: number
): Promise<ExemplarEligibilityResult> {
  const db = getAppDb();
  const [lesson] = await db
    .select()
    .from(lessons)
    .where(eq(lessons.id, lessonId));

  if (!lesson) {
    const err = new Error("NOT_FOUND");
    err.name = "NOT_FOUND";
    throw err;
  }

  const isPublished = lesson.status === "published";
  const isFreeTier = lesson.accessTier === "free";
  const isHumanOrigin = lesson.origin === "human";
  const hasBalancedActivities = await checkActivityBalance(lessonId);
  const hasPlaytestEvidence = await checkPlaytestEvidence(lessonId);

  const errors: string[] = [];
  if (!isPublished) {
    errors.push("Tiết học phải ở trạng thái đã xuất bản (published).");
  }
  if (!hasPlaytestEvidence) {
    errors.push(
      "Thiếu bằng chứng chơi thử (BR-LEX-02: cần ít nhất 1 lượt chạy hoàn thành với trẻ thật)."
    );
  }
  if (!isFreeTier) {
    errors.push(
      "Tiết học mẫu bắt buộc phải ở gói miễn phí (BR-LEX-03: access_tier = 'free')."
    );
  }
  if (!isHumanOrigin) {
    errors.push(
      "Tiết học mẫu bắt buộc phải do con người biên soạn (BR-LEX-04: origin = 'human')."
    );
  }
  if (!hasBalancedActivities) {
    errors.push(
      "Tiết học mẫu bắt buộc phải bắc nhịp cả hoạt động ngoài màn hình và trò chơi tương tác (BR-LEX-05)."
    );
  }

  return {
    eligible: errors.length === 0,
    conditions: {
      isPublished,
      hasPlaytestEvidence,
      isFreeTier,
      isHumanOrigin,
      hasBalancedActivities,
    },
    errors,
  };
}

async function checkCellCeiling(
  competency: CompetencyCode,
  ageBand: AgeBand,
  excludingLessonId?: number
): Promise<void> {
  const db = getAppDb();
  const conditions = [
    eq(lessons.isExemplar, true),
    eq(lessons.status, "published"),
    eq(lessons.exemplarCompetency, competency),
    eq(lessons.exemplarAgeBand, ageBand),
  ];

  if (excludingLessonId) {
    conditions.push(ne(lessons.id, excludingLessonId));
  }

  const [existing] = await db
    .select({ total: count() })
    .from(lessons)
    .where(and(...conditions));

  const totalInCell = existing?.total ?? 0;
  if (totalInCell >= 2) {
    const err = new Error("EXEMPLAR_CELL_LIMIT_EXCEEDED");
    err.name = "EXEMPLAR_CELL_LIMIT_EXCEEDED";
    throw err;
  }
}

export async function nominateExemplar(
  input: NominateExemplarInput
): Promise<{ nominated: boolean; eligibility: ExemplarEligibilityResult }> {
  await verifyManagerPermission(input.managerId);

  const eligibility = await validateExemplarEligibility(input.lessonId);
  if (!eligibility.eligible) {
    const err = new Error(eligibility.errors.join("; "));
    err.name = "VALIDATION_FAILED";
    throw err;
  }

  await checkCellCeiling(input.competency, input.ageBand, input.lessonId);

  const db = getAppDb();
  await db.insert(auditLogs).values({
    actorType: "manager",
    actorId: input.managerId,
    action: "nominate_exemplar",
    entityType: "lesson",
    entityId: String(input.lessonId),
    afterData: {
      action: "nominate_exemplar",
      competency: input.competency,
      age_band: input.ageBand,
      notes: input.notes || "",
    },
  });

  return { nominated: true, eligibility };
}

export async function approveExemplar(
  input: ApproveExemplarInput
): Promise<{ success: boolean; lessonId: number }> {
  const approver = await verifyManagerPermission(input.approverManagerId);
  const timestamp = input.now ?? new Date();

  const eligibility = await validateExemplarEligibility(input.lessonId);
  if (!eligibility.eligible) {
    const err = new Error(eligibility.errors.join("; "));
    err.name = "VALIDATION_FAILED";
    throw err;
  }

  await checkCellCeiling(input.competency, input.ageBand, input.lessonId);

  const db = getAppDb();
  await db
    .update(lessons)
    .set({
      isExemplar: true,
      exemplarCompetency: input.competency,
      exemplarAgeBand: input.ageBand,
      exemplarApprovedById: approver.id,
      exemplarApprovedAt: timestamp,
      updatedAt: timestamp,
    })
    .where(eq(lessons.id, input.lessonId));

  await db.insert(auditLogs).values({
    actorType: "manager",
    actorId: approver.id,
    action: "approve_exemplar",
    entityType: "lesson",
    entityId: String(input.lessonId),
    afterData: {
      is_exemplar: true,
      exemplar_competency: input.competency,
      exemplar_age_band: input.ageBand,
      notes: input.notes || "",
    },
  });

  return { success: true, lessonId: input.lessonId };
}

export async function revokeExemplar(
  input: RevokeExemplarInput
): Promise<{ revoked: boolean }> {
  const manager = await verifyManagerPermission(input.managerId);
  const timestamp = input.now ?? new Date();
  const db = getAppDb();

  await db
    .update(lessons)
    .set({
      isExemplar: false,
      exemplarCompetency: null,
      exemplarAgeBand: null,
      exemplarApprovedById: null,
      exemplarApprovedAt: null,
      updatedAt: timestamp,
    })
    .where(eq(lessons.id, input.lessonId));

  await db.insert(auditLogs).values({
    actorType: "manager",
    actorId: manager.id,
    action: "revoke_exemplar",
    entityType: "lesson",
    entityId: String(input.lessonId),
    afterData: {
      is_exemplar: false,
      reason: input.reason,
    },
  });

  return { revoked: true };
}

export interface ExemplarMatrixSummary {
  matrix: Record<
    CompetencyCode,
    Record<
      AgeBand,
      Array<{
        id: number;
        code: string;
        title: string;
        approvedAt: Date | null;
      }>
    >
  >;
  totalCount: number;
  missingCells: string[];
}

function isCompetencyCode(
  val: string | null | undefined
): val is CompetencyCode {
  return (
    val === "C1" ||
    val === "C2" ||
    val === "C3" ||
    val === "C4" ||
    val === "C5" ||
    val === "C6"
  );
}

function isAgeBand(val: string | null | undefined): val is AgeBand {
  return val === "3-4" || val === "4-5" || val === "5-6";
}

export async function getExemplarMatrix(): Promise<ExemplarMatrixSummary> {
  const db = getAppDb();
  const exemplarLessons = await db
    .select()
    .from(lessons)
    .where(and(eq(lessons.isExemplar, true), eq(lessons.status, "published")));

  const matrix: ExemplarMatrixSummary["matrix"] = {
    C1: { "3-4": [], "4-5": [], "5-6": [] },
    C2: { "3-4": [], "4-5": [], "5-6": [] },
    C3: { "3-4": [], "4-5": [], "5-6": [] },
    C4: { "3-4": [], "4-5": [], "5-6": [] },
    C5: { "3-4": [], "4-5": [], "5-6": [] },
    C6: { "3-4": [], "4-5": [], "5-6": [] },
  };

  for (const l of exemplarLessons) {
    const comp = l.exemplarCompetency;
    const band = l.exemplarAgeBand;
    if (isCompetencyCode(comp) && isAgeBand(band) && matrix[comp]?.[band]) {
      matrix[comp][band].push({
        id: l.id,
        code: l.code,
        title: l.title,
        approvedAt: l.exemplarApprovedAt,
      });
    }
  }

  const missingCells: string[] = [];
  for (const c of ALL_COMPETENCIES) {
    for (const b of ALL_AGE_BANDS) {
      if (matrix[c][b].length === 0) {
        missingCells.push(`${c} ${b}`);
      }
    }
  }

  return {
    matrix,
    totalCount: exemplarLessons.length,
    missingCells,
  };
}

export const LessonExemplarService = {
  validateExemplarEligibility,
  nominateExemplar,
  approveExemplar,
  revokeExemplar,
  getExemplarMatrix,
};
