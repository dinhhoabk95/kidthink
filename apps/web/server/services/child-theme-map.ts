/**
 * Bản đồ chủ đề tuần cho trẻ tự học — `child-theme-map.md`, `BR-WTM-01..08`.
 *
 * Tổng hợp lộ trình 36 tuần theo 10 chủ đề GDMN, gắn trạng thái màn chơi
 * từ `play_sessions` của trẻ và xác định vị trí Gấu Con định vị.
 */

import {
  CONTENT_ENTITY_TYPE,
  type DbExecutor,
  PLAY_COMPLETION_STATUS,
} from "@mindkid/db";
import {
  createRepositories,
  type MindKidRepositories,
} from "@mindkid/db/repositories";
import { deriveAgeBand } from "@mindkid/shared";
import { useOwnerRepositories } from "#server/utils/repositories";

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
  "Toán tư duy — Quy luật và phân loại": "🧩",
  "Phát triển trí não — Ghép đôi tương đồng": "🧠",
  "Tinh mắt tìm điểm khác biệt": "🔍",
  "Thử thách tổng hợp — Bé thông minh 3–4 tuổi": "🏆",
  "Cán cân kỳ diệu — So sánh và sắp thứ tự": "⚖️",
  "Mở khóa trí thông minh — Hình khối và tìm hình ẩn": "🔷",
  "Mật mã tọa độ lưới và phản xạ nhanh": "🗺️",
  "Thử thách tổng hợp — Mở khóa trí thông minh": "🏅",
  "Đánh vần tiếng Việt và Mê cung kỳ thú": "🧭",
  "Thám tử suy luận và Ma trận quy luật": "🕵️",
  "Sudoku tư duy hình ảnh sáng tạo": "🔢",
  "Hành trang vào lớp Một — Chinh phục đỉnh cao": "🎓",
};

function isRepositories(
  target: DbExecutor | MindKidRepositories
): target is MindKidRepositories {
  return "curricula" in target;
}

function toRepositories(
  target?: DbExecutor | MindKidRepositories
): MindKidRepositories {
  if (!target) {
    return useOwnerRepositories();
  }
  return isRepositories(target) ? target : createRepositories(target);
}

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
  repos: MindKidRepositories,
  childId: number
): Promise<Map<string, "not_started" | "in_progress" | "completed">> {
  const playRows = await repos.playSessions.listLevelStatusesForChild(childId);

  const statusByLevelCode = new Map<
    string,
    "not_started" | "in_progress" | "completed"
  >();
  for (const row of playRows) {
    const levelCode = row.gameLevel.code;
    const current = statusByLevelCode.get(levelCode);
    if (row.completionStatus === PLAY_COMPLETION_STATUS.COMPLETED) {
      statusByLevelCode.set(levelCode, "completed");
    } else if (
      row.completionStatus === PLAY_COMPLETION_STATUS.IN_PROGRESS &&
      current !== "completed"
    ) {
      statusByLevelCode.set(levelCode, "in_progress");
    }
  }
  return statusByLevelCode;
}

async function fetchCurriculumWeeksAndItems(
  repos: MindKidRepositories,
  currId: number | null
): Promise<{ weekGoalsMap: Map<number, string>; itemsList: RawLevelItem[] }> {
  const weekGoalsMap = new Map<number, string>();
  if (!currId) {
    return { weekGoalsMap, itemsList: [] };
  }

  const [rawWeeks, rawItems] = await Promise.all([
    repos.curricula.listWeeks(currId),
    repos.curricula.listItems([currId]),
  ]);

  for (const w of rawWeeks) {
    weekGoalsMap.set(w.weekNo, w.goal);
  }

  const gameLevelItems = rawItems.filter(
    (item) => item.entityType === CONTENT_ENTITY_TYPE.GAME_LEVEL
  );
  const levelMap = await repos.gameLevels.mapByIds(
    gameLevelItems.map((item) => item.entityId)
  );

  const itemsList: RawLevelItem[] = [];
  for (const item of gameLevelItems) {
    const lvl = levelMap.get(item.entityId);
    if (!lvl) {
      continue;
    }
    itemsList.push({
      weekNo: item.weekNo,
      levelId: lvl.id,
      code: lvl.code,
      title: lvl.title,
      thumbnailEmoji: lvl.thumbnailEmoji,
    });
  }

  return { weekGoalsMap, itemsList };
}

async function fetchFallbackLevelItems(
  repos: MindKidRepositories
): Promise<RawLevelItem[]> {
  const published = await repos.gameLevels.listAllOrdered(36);

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
  input: GetChildThemeMapInput
): Promise<ChildThemeMapResponse>;
export async function getChildThemeMap(
  dbOrRepos: DbExecutor | MindKidRepositories,
  input: GetChildThemeMapInput
): Promise<ChildThemeMapResponse>;
export async function getChildThemeMap(
  first: DbExecutor | MindKidRepositories | GetChildThemeMapInput,
  maybeInput?: GetChildThemeMapInput
): Promise<ChildThemeMapResponse> {
  const isLegacyCall = maybeInput !== undefined;
  const repos = isLegacyCall
    ? toRepositories(first as DbExecutor | MindKidRepositories)
    : useOwnerRepositories();
  const input = isLegacyCall ? maybeInput : (first as GetChildThemeMapInput);

  const currentYear = (input.now ?? new Date()).getFullYear();
  const ageBand = deriveAgeBand(input.birthYear, currentYear);

  const activeEnrollment = await repos.curricula.findEnrollmentForChild(
    input.childId,
    true
  );

  const targetCurriculumCode = resolveTargetCurriculumCode(
    ageBand,
    activeEnrollment?.curriculum.code
  );

  const curriculumRow = await repos.curricula.findByCode(targetCurriculumCode);

  const currId = curriculumRow?.id ?? activeEnrollment?.curriculumId ?? null;
  const roadmapTitle =
    curriculumRow?.title ??
    activeEnrollment?.curriculum.title ??
    `Chương trình phát triển tư duy ${ageBand} tuổi`;

  const statusByLessonCode = await fetchChildLevelStatuses(
    repos,
    input.childId
  );

  const { weekGoalsMap, itemsList: rawItemsList } =
    await fetchCurriculumWeeksAndItems(repos, currId);

  const itemsList =
    rawItemsList.length > 0
      ? rawItemsList
      : await fetchFallbackLevelItems(repos);

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
