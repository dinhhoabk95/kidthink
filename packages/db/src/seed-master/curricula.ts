import { asc, eq } from "drizzle-orm";
import type { getOwnerDb } from "../client.ts";
import { lessons } from "../schema/content.ts";
import {
  curricula,
  curriculumItems,
  curriculumWeeks,
} from "../schema/curriculum.ts";
import { gameLevels } from "../schema/game.ts";

export interface MvpCurriculumConfig {
  code: string;
  titleVi: string;
  descriptionVi: string;
  programType: "age_based" | "journey";
  targetAgeMin: number;
  targetAgeMax: number;
  durationWeeks: number;
  sessionsPerWeek: number;
  accessTier: "free" | "login" | "standard" | "premium";
  status: "draft" | "in_review" | "approved" | "published";
  weekGoals: string[];
}

export const MVP_CURRICULA_CONFIGS: MvpCurriculumConfig[] = [
  {
    code: "CUR-BE3",
    titleVi: "Bé 3 Tuổi — Khám Phá Thế Giới & Làm Quen Số Lượng",
    descriptionVi:
      "Chương trình chuẩn bị nền tảng tư duy toán học cho trẻ 3–4 tuổi: nhận biết số lượng 1–3, so sánh to/nhỏ, phân loại màu sắc và hình dạng cơ bản.",
    programType: "age_based",
    targetAgeMin: 3,
    targetAgeMax: 4,
    durationWeeks: 8,
    sessionsPerWeek: 3,
    accessTier: "standard",
    status: "published",
    weekGoals: [
      "Làm quen thế giới đồ vật và nhận biết số 1",
      "Phân biệt to và nhỏ, làm quen số 2",
      "Phân loại theo màu sắc cơ bản đỏ, vàng, xanh",
      "Làm quen số lượng 3 và đếm ngón tay",
      "Khám phá hình tròn và hình vuông xung quanh",
      "So sánh nhiều hơn và ít hơn qua đồ chơi",
      "Ôn tập đếm nhóm 1–3 và phân loại hình học",
      "Tổng kết hành trình khám phá mầm non 3 tuổi",
    ],
  },
  {
    code: "CUR-BE4",
    titleVi: "Bé 4 Tuổi — Nhận Biết, Phân Loại & Đếm Đến 5",
    descriptionVi:
      "Chương trình phát triển tư duy logic cho trẻ 4–5 tuổi: đếm số lượng 1–5, nhận biết quy luật chuỗi đơn giản ABAB, so sánh dài/ngắn, cao/thấp.",
    programType: "age_based",
    targetAgeMin: 4,
    targetAgeMax: 5,
    durationWeeks: 8,
    sessionsPerWeek: 3,
    accessTier: "standard",
    status: "published",
    weekGoals: [
      "Ôn tập nhận biết số lượng và đếm đến 3",
      "Làm quen số 4 và phân loại theo 2 thuộc tính",
      "Quy luật lặp lại đơn giản ABAB qua hình khối",
      "Khám phá số lượng 5 và so sánh dài ngắn",
      "Nhận biết hình tam giác và vị trí trên dưới",
      "Tập hợp nhóm theo công dụng và màu sắc",
      "Ôn tập tổng hợp đếm 1–5 và ghép cặp logic",
      "Thử thách tư duy nhỏ cuối kỳ 4 tuổi",
    ],
  },
  {
    code: "CUR-BE5",
    titleVi: "Bé 5 Tuổi — Tư Duy Không Gian & Số Học Đến 10",
    descriptionVi:
      "Chương trình nâng cao cho trẻ 5–6 tuổi: đếm thành thạo 1–10, tách gộp nhóm, quy luật phức tạp ABC/AABB, tư duy không gian trái/phải, trước/sau.",
    programType: "age_based",
    targetAgeMin: 5,
    targetAgeMax: 6,
    durationWeeks: 8,
    sessionsPerWeek: 3,
    accessTier: "standard",
    status: "published",
    weekGoals: [
      "Đếm và so sánh số lượng trong phạm vi 5",
      "Làm quen số 6, 7 và nhận biết vị trí trái phải",
      "Quy luật mẫu chuỗi AABB và ABC",
      "Khám phá số 8, 9, 10 và khái niệm tách gộp",
      "Hình học không gian: khối cầu, khối lập phương",
      "So sánh nặng nhẹ và dung tích chứa",
      "Tư duy giải quyết vấn đề qua mê cung logic",
      "Báo cáo và tổng kết năng lực tư duy 5 tuổi",
    ],
  },
  {
    code: "CUR-BE6",
    titleVi: "Bé 6 Tuổi — Sẵn Sàng Vào Lớp 1 & Tư Duy Độc Lập",
    descriptionVi:
      "Chương trình hoàn thiện kỹ năng tư duy cho trẻ 6 tuổi: cấu tạo số trong phạm vi 10, cộng trừ trực quan, đọc biểu đồ đơn giản, tư duy suy luận có điều kiện.",
    programType: "age_based",
    targetAgeMin: 5,
    targetAgeMax: 6,
    durationWeeks: 8,
    sessionsPerWeek: 3,
    accessTier: "standard",
    status: "published",
    weekGoals: [
      "Củng cố hệ thống số đếm 1–10 và thứ tự số",
      "Tách gộp số trong phạm vi 10 và biểu diễn trực quan",
      "Làm quen phép thêm bớt cơ bản qua tranh vẽ",
      "Nhận biết thời gian: ngày đêm, các ngày trong tuần",
      "Thu thập và phân loại dữ liệu dạng bảng đơn giản",
      "Tư duy thuật toán: lập trình bước đi của robot",
      "Ôn tập toàn diện chuẩn bị bước vào lớp 1",
      "Lễ tốt nghiệp mầm non và vinh danh bé tư duy",
    ],
  },
  {
    code: "CUR-J42",
    titleVi: "Hành Trình 42 Tuần — Phát Triển Tư Duy Toàn Diện 3–6 Tuổi",
    descriptionVi:
      "Lộ trình 42 tuần xuyên suốt cả năm học mầm non, tích hợp 6 năng lực tư duy cốt lõi C1–C6 từ mức độ trực quan đến suy luận logic trừu tượng.",
    programType: "journey",
    targetAgeMin: 3,
    targetAgeMax: 6,
    durationWeeks: 42,
    sessionsPerWeek: 3,
    accessTier: "standard",
    status: "published",
    weekGoals: Array.from({ length: 42 }, (_, i) => {
      const w = i + 1;
      if (w <= 12) {
        return `Giai đoạn 1 (Tuần ${w}): Khám phá thế giới trực quan và số lượng cơ bản`;
      }
      if (w <= 24) {
        return `Giai đoạn 2 (Tuần ${w}): Mở rộng quy luật, phân loại và hình học`;
      }
      if (w <= 36) {
        return `Giai đoạn 3 (Tuần ${w}): Tách gộp, đo lường và tư duy không gian`;
      }
      return `Giai đoạn 4 (Tuần ${w}): Tổng hợp, suy luận logic và sẵn sàng vào lớp 1`;
    }),
  },
];

async function upsertCurriculumRecord(
  db: ReturnType<typeof getOwnerDb>,
  cfg: MvpCurriculumConfig,
  idx: number
): Promise<{ curriculumId: number; isNew: boolean }> {
  const [existing] = await db
    .select({ id: curricula.id, status: curricula.status })
    .from(curricula)
    .where(eq(curricula.code, cfg.code))
    .limit(1);

  if (existing?.id) {
    return { curriculumId: existing.id, isNew: false };
  }

  const [inserted] = await db
    .insert(curricula)
    .values({
      entityId: idx + 1,
      code: cfg.code,
      contentVersion: 1,
      programType: cfg.programType,
      targetAgeMin: cfg.targetAgeMin,
      targetAgeMax: cfg.targetAgeMax,
      durationWeeks: cfg.durationWeeks,
      sessionsPerWeek: cfg.sessionsPerWeek,
      titleVi: cfg.titleVi,
      descriptionVi: cfg.descriptionVi,
      accessTier: cfg.accessTier,
      status: cfg.status,
      authoredIn: "repo_seed",
      publishedAt: cfg.status === "published" ? new Date() : null,
    })
    .onConflictDoUpdate({
      target: [curricula.code, curricula.contentVersion],
      set: {
        titleVi: cfg.titleVi,
        descriptionVi: cfg.descriptionVi,
        accessTier: cfg.accessTier,
        status: cfg.status,
        updatedAt: new Date(),
      },
    })
    .returning({ id: curricula.id });

  return { curriculumId: inserted.id, isNew: true };
}

async function seedCurriculumWeeksData(
  db: ReturnType<typeof getOwnerDb>,
  curriculumId: number,
  cfg: MvpCurriculumConfig
): Promise<number> {
  let count = 0;
  for (let w = 1; w <= cfg.durationWeeks; w++) {
    const goal =
      cfg.weekGoals[w - 1] || `Mục tiêu sư phạm tuần ${w} cho trẻ mầm non`;
    await db
      .insert(curriculumWeeks)
      .values({
        curriculumId,
        weekNo: w,
        goal,
      })
      .onConflictDoUpdate({
        target: [curriculumWeeks.curriculumId, curriculumWeeks.weekNo],
        set: { goal },
      });
    count++;
  }
  return count;
}

async function seedCurriculumItemsData(
  db: ReturnType<typeof getOwnerDb>,
  curriculumId: number,
  cfg: MvpCurriculumConfig,
  lessonsList: Array<{ id: number; code: string }>,
  levelsList: Array<{ id: number; code: string }>
): Promise<number> {
  const existingItems = await db
    .select({ id: curriculumItems.id })
    .from(curriculumItems)
    .where(eq(curriculumItems.curriculumId, curriculumId))
    .limit(1);

  if (existingItems.length > 0) {
    return 0;
  }

  let count = 0;
  for (let w = 1; w <= cfg.durationWeeks; w++) {
    for (let s = 1; s <= cfg.sessionsPerWeek; s++) {
      const lessonIdx =
        (w * cfg.sessionsPerWeek + s) % (lessonsList.length || 1);
      const levelIdx = (w * cfg.sessionsPerWeek + s) % (levelsList.length || 1);

      if (lessonsList.length > 0 && s % 2 === 1) {
        const lesson = lessonsList[lessonIdx];
        await db.insert(curriculumItems).values({
          curriculumId,
          weekNo: w,
          sessionNo: s,
          position: 1,
          entityType: "lesson",
          entityId: lesson.id,
          isRequired: true,
        });
        count++;
      } else if (levelsList.length > 0) {
        const level = levelsList[levelIdx];
        await db.insert(curriculumItems).values({
          curriculumId,
          weekNo: w,
          sessionNo: s,
          position: 1,
          entityType: "game_level",
          entityId: level.id,
          isRequired: true,
        });
        count++;
      }
    }
  }
  return count;
}

export async function seedCurriculaMasterData(
  db: ReturnType<typeof getOwnerDb>
) {
  let seededCurriculaCount = 0;
  let seededWeeksCount = 0;
  let seededItemsCount = 0;

  const [availableLessons, availableLevels] = await Promise.all([
    db
      .select({ id: lessons.id, code: lessons.code })
      .from(lessons)
      .orderBy(asc(lessons.id))
      .limit(100),
    db
      .select({ id: gameLevels.id, code: gameLevels.code })
      .from(gameLevels)
      .orderBy(asc(gameLevels.id))
      .limit(100),
  ]);

  for (const [idx, cfg] of MVP_CURRICULA_CONFIGS.entries()) {
    const { curriculumId, isNew } = await upsertCurriculumRecord(db, cfg, idx);
    if (isNew) {
      seededCurriculaCount++;
    }

    const weeksCount = await seedCurriculumWeeksData(db, curriculumId, cfg);
    seededWeeksCount += weeksCount;

    const itemsCount = await seedCurriculumItemsData(
      db,
      curriculumId,
      cfg,
      availableLessons,
      availableLevels
    );
    seededItemsCount += itemsCount;
  }

  return {
    curriculaCount: seededCurriculaCount,
    weeksCount: seededWeeksCount,
    itemsCount: seededItemsCount,
  };
}
