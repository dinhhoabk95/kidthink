import {
  childProfiles,
  curricula,
  curriculumItems,
  getOwnerDb,
} from "@mindkid/db";
import { NotFoundError } from "@mindkid/errors/common";
import { and, asc, eq, inArray } from "drizzle-orm";
import { getRouterParam } from "h3";
import { z } from "zod";
import { defineApiRoute } from "#server/utils/define-api-route";

const ParamsSchema = z.object({
  uuid: z.string().uuid(),
});

interface RankedChildFlow {
  readonly code: string;
  readonly title: string;
  readonly session_count: number;
  readonly age_label: string;
  readonly fits_age: boolean;
  readonly age_gap: number;
  readonly recommend_score: number;
  readonly warning?: string;
}

function computeAgeGap(input: {
  childAge: number;
  targetAgeMin?: number | null;
  targetAgeMax?: number | null;
}): number {
  const { childAge, targetAgeMin, targetAgeMax } = input;
  if (targetAgeMin != null && childAge < targetAgeMin) {
    return targetAgeMin - childAge;
  }
  if (targetAgeMax != null && childAge > targetAgeMax) {
    return childAge - targetAgeMax;
  }
  return 0;
}

function buildAgeRecommendationWarning(input: {
  childAge: number;
  targetAgeMin?: number | null;
  targetAgeMax?: number | null;
}): string | undefined {
  if (computeAgeGap(input) === 0) {
    return;
  }
  const { childAge, targetAgeMin, targetAgeMax } = input;
  return `Chương trình này gợi ý cho trẻ ${targetAgeMin ?? 3}–${targetAgeMax ?? 6} tuổi, bé nhà bạn ${childAge} tuổi`;
}

async function listCurriculaFlowsForChild(
  db: ReturnType<typeof getOwnerDb>,
  birthYear: number
): Promise<RankedChildFlow[]> {
  const childAge = new Date().getFullYear() - birthYear;
  const rows = await db
    .select({
      id: curricula.id,
      code: curricula.code,
      title: curricula.title,
      targetAgeMin: curricula.targetAgeMin,
      targetAgeMax: curricula.targetAgeMax,
      durationWeeks: curricula.durationWeeks,
      sessionsPerWeek: curricula.sessionsPerWeek,
    })
    .from(curricula)
    .orderBy(asc(curricula.code));

  if (rows.length === 0) {
    return [];
  }

  const curriculumIds = rows.map((row) => row.id);
  const itemRows = await db
    .select({ curriculumId: curriculumItems.curriculumId })
    .from(curriculumItems)
    .where(inArray(curriculumItems.curriculumId, curriculumIds));

  const itemCountByCurriculum = new Map<number, number>();
  for (const item of itemRows) {
    itemCountByCurriculum.set(
      item.curriculumId,
      (itemCountByCurriculum.get(item.curriculumId) ?? 0) + 1
    );
  }

  return rows
    .map((row) => {
      const actualItems = itemCountByCurriculum.get(row.id) ?? 0;
      const sessionCount =
        actualItems > 0 ? actualItems : row.durationWeeks * row.sessionsPerWeek;
      const ageGap = computeAgeGap({
        childAge,
        targetAgeMin: row.targetAgeMin,
        targetAgeMax: row.targetAgeMax,
      });
      const warning = buildAgeRecommendationWarning({
        childAge,
        targetAgeMin: row.targetAgeMin,
        targetAgeMax: row.targetAgeMax,
      });
      return {
        code: row.code,
        title: row.title,
        session_count: sessionCount,
        age_label: `${row.targetAgeMin ?? 3}–${row.targetAgeMax ?? 6}`,
        fits_age: ageGap === 0,
        age_gap: ageGap,
        recommend_score: Math.max(0, 100 - ageGap * 25),
        ...(warning ? { warning } : {}),
      };
    })
    .sort((a, b) => a.age_gap - b.age_gap || a.code.localeCompare(b.code));
}

export default defineApiRoute({
  auth: "user",
  handler: async ({ event, auth: user }) => {
    const parsedParams = ParamsSchema.safeParse({
      uuid: getRouterParam(event, "uuid"),
    });
    if (!parsedParams.success) {
      throw new NotFoundError("Không tìm thấy hồ sơ trẻ.");
    }

    const userId = Number(user.user_id);
    const db = getOwnerDb();

    const [child] = await db
      .select()
      .from(childProfiles)
      .where(
        and(
          eq(childProfiles.uuid, parsedParams.data.uuid),
          eq(childProfiles.userId, userId),
          eq(childProfiles.status, "active")
        )
      )
      .limit(1);

    if (!child) {
      throw new NotFoundError("Không tìm thấy hồ sơ trẻ.");
    }

    const flows = await listCurriculaFlowsForChild(db, child.birthYear);

    return { flows };
  },
});
