/**
 * Bản đồ chủ đề tuần cho trẻ tự học — `child-theme-map.md`, `BR-WTM-01..08`.
 *
 * Tổng hợp lộ trình 36 tuần theo 10 chủ đề GDMN, gắn trạng thái màn chơi
 * từ `play_sessions` của trẻ và xác định vị trí Gấu Con định vị.
 */

import {
  curricula,
  curriculumEnrollments,
  curriculumItems,
  curriculumWeeks,
  gameLevels,
  type getOwnerDb,
  playSessions,
} from "@mindkid/db";
import { deriveAgeBand } from "@mindkid/shared";
import { and, asc, eq } from "drizzle-orm";

type Db = ReturnType<typeof getOwnerDb>;

const FALLBACK_LEVEL_EMOJI = "🎯";

export interface ThemeMapLesson {
  code: string;
  title: string;
  thumbnail_emoji: string;
  status: "not_started" | "in_progress" | "completed";
  is_current: boolean;
}

export interface ThemeMapWeek {
  week_no: number;
  theme_title: string;
  theme_emoji: string;
  goal: string;
  is_current: boolean;
  is_completed: boolean;
  lessons: ThemeMapLesson[];
}

export interface ChildThemeMapResponse {
  child: {
    uuid: string;
    display_name: string;
    age_band: string;
  };
  roadmap_code: string;
  roadmap_title: string;
  current_week_no: number;
  current_lesson_code: string | null;
  total_lessons: number;
  completed_lessons: number;
  weeks: ThemeMapWeek[];
}

export interface GetChildThemeMapInput {
  childId: number;
  childUuid: string;
  displayName: string;
  birthYear: number;
  now?: Date;
}

interface RawLevelItem {
  weekNo: number;
  levelId: number;
  code: string;
  title: string;
  thumbnailEmoji: string | null;
}

const THEME_EMOJI_MAP: Record<string, string> = {
  "Trường mầm non": "🏫",
  "Bản thân": "👦",
  "Gia đình": "🏡",
  "Nghề nghiệp": "🧑‍🚒",
  "Thực vật": "🌻",
  "Thế giới thực vật": "🌻",
  "Động vật": "🐘",
  "Thế giới động vật": "🐘",
  "Phương tiện giao thông": "🚗",
  "Giao thông": "🚗",
  "Hiện tượng tự nhiên": "🌧️",
  "Nước & Hiện tượng tự nhiên": "🌧️",
  "Quê hương – Đất nước – Bác Hồ": "🇻🇳",
  "Quê hương - Đất nước - Bác Hồ": "🇻🇳",
  "Mùa hè và ôn tập cuối năm": "🎒",
  "Bé lên lớp Một": "🎒",
};

export function resolveThemeEmoji(themeTitle: string): string {
  for (const [key, emoji] of Object.entries(THEME_EMOJI_MAP)) {
    if (themeTitle.includes(key) || key.includes(themeTitle)) {
      return emoji;
    }
  }
  return "⭐";
}

const THEME_TITLE_REGEX = /«([^»]+)»/;

export function extractThemeTitle(goal: string, weekNo: number): string {
  const match = goal.match(THEME_TITLE_REGEX);
  if (match?.[1]) {
    return match[1].trim();
  }
  return `Tuần ${weekNo}`;
}

export function resolveTargetCurriculumCode(
  ageBand: string,
  activeCurriculumCode?: string
): string {
  if (activeCurriculumCode) {
    return activeCurriculumCode;
  }
  if (ageBand === "5-6") {
    return "CUR-RM-5-6-la-year-01";
  }
  if (ageBand === "4-5") {
    return "CUR-RM-4-5-chi-year-01";
  }
  return "CUR-RM-3-4-mam-year-01";
}

async function fetchChildLevelStatuses(
  db: Db,
  childId: number
): Promise<Map<string, "not_started" | "in_progress" | "completed">> {
  const playRows = await db
    .select({
      levelCode: gameLevels.code,
      status: playSessions.completionStatus,
    })
    .from(playSessions)
    .innerJoin(gameLevels, eq(gameLevels.id, playSessions.gameLevelId))
    .where(
      and(
        eq(playSessions.childProfileId, childId),
        eq(playSessions.isPreview, false)
      )
    );

  const statusByLevelCode = new Map<
    string,
    "not_started" | "in_progress" | "completed"
  >();
  for (const row of playRows) {
    const current = statusByLevelCode.get(row.levelCode);
    if (row.status === "completed") {
      statusByLevelCode.set(row.levelCode, "completed");
    } else if (row.status === "in_progress" && current !== "completed") {
      statusByLevelCode.set(row.levelCode, "in_progress");
    }
  }
  return statusByLevelCode;
}

async function fetchCurriculumWeeksAndItems(
  db: Db,
  currId: number | null
): Promise<{ weekGoalsMap: Map<number, string>; itemsList: RawLevelItem[] }> {
  const weekGoalsMap = new Map<number, string>();
  if (!currId) {
    return { weekGoalsMap, itemsList: [] };
  }

  const [rawWeeks, rawItems] = await Promise.all([
    db
      .select({
        weekNo: curriculumWeeks.weekNo,
        goal: curriculumWeeks.goal,
      })
      .from(curriculumWeeks)
      .where(eq(curriculumWeeks.curriculumId, currId))
      .orderBy(asc(curriculumWeeks.weekNo)),
    db
      .select({
        weekNo: curriculumItems.weekNo,
        levelId: gameLevels.id,
        code: gameLevels.code,
        title: gameLevels.title,
        thumbnailEmoji: gameLevels.thumbnailEmoji,
      })
      .from(curriculumItems)
      .innerJoin(gameLevels, eq(curriculumItems.entityId, gameLevels.id))
      .where(
        and(
          eq(curriculumItems.curriculumId, currId),
          eq(curriculumItems.entityType, "game_level")
        )
      )
      .orderBy(
        asc(curriculumItems.weekNo),
        asc(curriculumItems.sessionNo),
        asc(curriculumItems.position)
      ),
  ]);

  for (const w of rawWeeks) {
    weekGoalsMap.set(w.weekNo, w.goal);
  }

  return { weekGoalsMap, itemsList: rawItems };
}

async function fetchFallbackLevelItems(db: Db): Promise<RawLevelItem[]> {
  const published = await db
    .select({
      id: gameLevels.id,
      code: gameLevels.code,
      title: gameLevels.title,
      thumbnailEmoji: gameLevels.thumbnailEmoji,
    })
    .from(gameLevels)
    .orderBy(asc(gameLevels.code))
    .limit(36);

  return published.map((lvl, index) => ({
    weekNo: Math.floor(index / 2) + 1,
    levelId: lvl.id,
    code: lvl.code,
    title: lvl.title,
    thumbnailEmoji: lvl.thumbnailEmoji,
  }));
}

function buildSingleWeekLessons(params: {
  weekNo: number;
  weekRawItems: RawLevelItem[];
  statusByLessonCode: Map<string, "not_started" | "in_progress" | "completed">;
  foundCurrent: boolean;
}): {
  lessonsInWeek: ThemeMapLesson[];
  weekAllCompleted: boolean;
  newFoundCurrent: boolean;
  nextLessonCode: string | null;
  totalLessonsDelta: number;
  completedLessonsDelta: number;
} {
  const { weekRawItems, statusByLessonCode } = params;
  let newFoundCurrent = params.foundCurrent;
  let nextLessonCode: string | null = null;
  let totalLessonsDelta = 0;
  let completedLessonsDelta = 0;
  let weekAllCompleted = weekRawItems.length > 0;
  const lessonsInWeek: ThemeMapLesson[] = [];

  for (const item of weekRawItems) {
    totalLessonsDelta += 1;
    const status = statusByLessonCode.get(item.code) ?? "not_started";
    if (status === "completed") {
      completedLessonsDelta += 1;
    } else {
      weekAllCompleted = false;
    }

    let isCurrentLesson = false;
    if (!newFoundCurrent && status !== "completed") {
      isCurrentLesson = true;
      newFoundCurrent = true;
      nextLessonCode = item.code;
    }

    lessonsInWeek.push({
      code: item.code,
      title: item.title,
      thumbnail_emoji: item.thumbnailEmoji || FALLBACK_LEVEL_EMOJI,
      status,
      is_current: isCurrentLesson,
    });
  }

  return {
    lessonsInWeek,
    weekAllCompleted,
    newFoundCurrent,
    nextLessonCode,
    totalLessonsDelta,
    completedLessonsDelta,
  };
}

function buildWeeksStructure(params: {
  allWeekNumbers: number[];
  weekGoalsMap: Map<number, string>;
  itemsByWeek: Map<number, RawLevelItem[]>;
  statusByLessonCode: Map<string, "not_started" | "in_progress" | "completed">;
}): {
  weeks: ThemeMapWeek[];
  currentWeekNo: number;
  currentLessonCode: string | null;
  totalLessons: number;
  completedLessons: number;
} {
  const { allWeekNumbers, weekGoalsMap, itemsByWeek, statusByLessonCode } =
    params;

  let foundCurrent = false;
  let currentWeekNo = allWeekNumbers[0] ?? 1;
  let currentLessonCode: string | null = null;
  let totalLessons = 0;
  let completedLessons = 0;

  const weeks: ThemeMapWeek[] = [];

  for (const weekNo of allWeekNumbers) {
    const goal = weekGoalsMap.get(weekNo) ?? `Kế hoạch học tập tuần ${weekNo}`;
    const themeTitle = extractThemeTitle(goal, weekNo);
    const themeEmoji = resolveThemeEmoji(themeTitle);

    const weekRawItems = itemsByWeek.get(weekNo) ?? [];
    const lessonResult = buildSingleWeekLessons({
      weekNo,
      weekRawItems,
      statusByLessonCode,
      foundCurrent,
    });

    totalLessons += lessonResult.totalLessonsDelta;
    completedLessons += lessonResult.completedLessonsDelta;

    if (!foundCurrent && lessonResult.newFoundCurrent) {
      foundCurrent = true;
      currentWeekNo = weekNo;
      currentLessonCode = lessonResult.nextLessonCode;
    }

    weeks.push({
      week_no: weekNo,
      theme_title: themeTitle,
      theme_emoji: themeEmoji,
      goal,
      is_current: false,
      is_completed: lessonResult.weekAllCompleted,
      lessons: lessonResult.lessonsInWeek,
    });
  }

  if (!foundCurrent && weeks.length > 0) {
    const lastWeek = weeks.at(-1);
    if (lastWeek) {
      currentWeekNo = lastWeek.week_no;
      currentLessonCode = lastWeek.lessons.at(-1)?.code ?? null;
    }
  }

  for (const w of weeks) {
    if (w.week_no === currentWeekNo) {
      w.is_current = true;
    }
  }

  return {
    weeks,
    currentWeekNo,
    currentLessonCode,
    totalLessons,
    completedLessons,
  };
}

export async function getChildThemeMap(
  db: Db,
  input: GetChildThemeMapInput
): Promise<ChildThemeMapResponse> {
  const currentYear = (input.now ?? new Date()).getFullYear();
  const ageBand = deriveAgeBand(input.birthYear, currentYear);

  // 1. Kiểm tra enrollment đang active của trẻ
  const [activeEnrollment] = await db
    .select({
      curriculumId: curriculumEnrollments.curriculumId,
      curriculumCode: curricula.code,
      curriculumTitle: curricula.title,
    })
    .from(curriculumEnrollments)
    .innerJoin(curricula, eq(curricula.id, curriculumEnrollments.curriculumId))
    .where(
      and(
        eq(curriculumEnrollments.childId, input.childId),
        eq(curriculumEnrollments.status, "active")
      )
    )
    .limit(1);

  // 2. Lộ trình theo enrollment hoặc band tuổi (BR-WTM-01)
  const targetCurriculumCode = resolveTargetCurriculumCode(
    ageBand,
    activeEnrollment?.curriculumCode
  );

  const [curriculumRow] = await db
    .select()
    .from(curricula)
    .where(eq(curricula.code, targetCurriculumCode))
    .limit(1);

  const currId = curriculumRow?.id ?? activeEnrollment?.curriculumId ?? null;
  const roadmapTitle =
    curriculumRow?.title ??
    activeEnrollment?.curriculumTitle ??
    `Chương trình phát triển tư duy ${ageBand} tuổi`;

  // 3. Lấy toàn bộ phiên chơi của trẻ để suy trạng thái trạm (BR-WTM-02)
  const statusByLessonCode = await fetchChildLevelStatuses(db, input.childId);

  // 4. Lấy các tuần và màn chơi từ DB nếu có curriculum
  const { weekGoalsMap, itemsList: rawItemsList } =
    await fetchCurriculumWeeksAndItems(db, currId);

  // 5. Dự phòng nếu DB chưa liên kết curriculumItems
  const itemsList =
    rawItemsList.length > 0 ? rawItemsList : await fetchFallbackLevelItems(db);

  // Gom theo tuần
  const itemsByWeek = new Map<number, RawLevelItem[]>();
  for (const item of itemsList) {
    const existing = itemsByWeek.get(item.weekNo) ?? [];
    existing.push(item);
    itemsByWeek.set(item.weekNo, existing);
  }

  const allWeekNumbers = [
    ...new Set([...weekGoalsMap.keys(), ...itemsByWeek.keys()]),
  ].sort((a, b) => a - b);

  if (allWeekNumbers.length === 0) {
    allWeekNumbers.push(1);
  }

  const structure = buildWeeksStructure({
    allWeekNumbers,
    weekGoalsMap,
    itemsByWeek,
    statusByLessonCode,
  });

  return {
    child: {
      uuid: input.childUuid,
      display_name: input.displayName,
      age_band: ageBand,
    },
    roadmap_code: targetCurriculumCode,
    roadmap_title: roadmapTitle,
    current_week_no: structure.currentWeekNo,
    current_lesson_code: structure.currentLessonCode,
    total_lessons: structure.totalLessons,
    completed_lessons: structure.completedLessons,
    weeks: structure.weeks,
  };
}
