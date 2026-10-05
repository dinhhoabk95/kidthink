/**
 * Cổng lộ trình soạn (BR-LRM-02/05/10, BR-PAR-01, BR-CRM-01..11).
 *
 * Đo trên bản khai `RoadmapSeed`, trước mọi nội dung: một lộ trình đỏ thì dừng
 * ở đây, chưa tốn một level nào.
 */

import type {
  RoadmapBand,
  RoadmapSeed,
  RoadmapSession,
  RoadmapSessionRole,
  RoadmapWeek,
} from "@mindkid/content";
import type { CurriculumItemMetadata } from "@mindkid/shared";
import {
  measureCurriculum,
  ROADMAP_BLOCKING_WARNING_RULES,
  type RoadmapProgramRow,
  type RoadmapRuleId,
  type RoadmapViolation,
} from "./roadmap-measure.js";

export interface RoadmapSkillInfo {
  readonly code: string;
  readonly competency_code: string;
  readonly age_min: number;
  readonly age_max: number;
  readonly difficulty: number;
  readonly prerequisites: readonly string[];
}

export interface RoadmapSeedGateInput {
  readonly roadmaps: readonly RoadmapSeed[];
  readonly skills: ReadonlyMap<string, RoadmapSkillInfo>;
  readonly difficultyMaxByBand: Readonly<Record<RoadmapBand, number>>;
}

const ROLES: ReadonlySet<RoadmapSessionRole> = new Set([
  "introduce",
  "practice",
  "review",
  "offscreen",
]);
const CODE_REGEX = /^RM-(3-4|4-5|5-6)-[a-z0-9]+(?:-[a-z0-9]+)*$/;
const BAND_AGES: Readonly<Record<RoadmapBand, readonly [number, number]>> = {
  "3-4": [3, 4],
  "4-5": [4, 5],
  "5-6": [5, 6],
};
const DEFAULT_SESSION_MINUTES: Readonly<Record<RoadmapSessionRole, number>> = {
  introduce: 20,
  practice: 10,
  review: 20,
  offscreen: 15,
};

function violation(
  roadmap: RoadmapSeed,
  ruleId: RoadmapRuleId,
  message: string
): RoadmapViolation {
  return { program_code: roadmap.code, rule_id: ruleId, message };
}

function checkIdentity(roadmap: RoadmapSeed): RoadmapViolation[] {
  const found: RoadmapViolation[] = [];
  const matched = CODE_REGEX.exec(roadmap.code);
  if (!matched || matched[1] !== roadmap.band) {
    found.push(
      violation(
        roadmap,
        "BR-LRM-10",
        `BR-LRM-10: Mã ${roadmap.code} không đúng dạng RM-${roadmap.band}-<slug>`
      )
    );
  }
  if (!Number.isInteger(roadmap.version) || roadmap.version < 1) {
    found.push(
      violation(
        roadmap,
        "BR-LRM-10",
        `BR-LRM-10: version ${roadmap.version} không phải số nguyên ≥1`
      )
    );
  }
  return found;
}

function checkWeekShape(
  roadmap: RoadmapSeed,
  week: RoadmapWeek,
  index: number
): RoadmapViolation[] {
  const found: RoadmapViolation[] = [];
  const expected = index + 1;
  if (week.week_no !== expected) {
    found.push(
      violation(
        roadmap,
        "BR-LRM-05",
        `BR-LRM-05: Tuần thứ ${expected} khai week_no ${week.week_no}`
      )
    );
  }
  if (week.sessions.length !== roadmap.sessions_per_week) {
    found.push(
      violation(
        roadmap,
        "BR-LRM-05",
        `BR-LRM-05: Tuần ${week.week_no} có ${week.sessions.length} tiết, cần ${roadmap.sessions_per_week}`
      )
    );
  }
  const used = new Set(week.sessions.map((s) => s.skill_code));
  const targets = new Set(week.target_skills);
  const mismatch =
    used.size !== targets.size || [...used].some((code) => !targets.has(code));
  if (mismatch) {
    found.push(
      violation(
        roadmap,
        "BR-LRM-05",
        `BR-LRM-05: Tuần ${week.week_no} khai target_skills lệch với kỹ năng của các tiết`
      )
    );
  }
  week.sessions.forEach((session, sessionIndex) => {
    if (session.session_no !== sessionIndex + 1) {
      found.push(
        violation(
          roadmap,
          "BR-LRM-05",
          `BR-LRM-05: Tuần ${week.week_no} tiết thứ ${sessionIndex + 1} khai session_no ${session.session_no}`
        )
      );
    }
    if (!ROLES.has(session.role)) {
      found.push(
        violation(
          roadmap,
          "BR-LRM-05",
          `BR-LRM-05: Tuần ${week.week_no} tiết ${session.session_no} khai vai trò lạ '${session.role}'`
        )
      );
    }
  });
  return found;
}

function checkShape(roadmap: RoadmapSeed): RoadmapViolation[] {
  const found: RoadmapViolation[] = [];
  if (roadmap.weeks.length !== roadmap.duration_weeks) {
    found.push(
      violation(
        roadmap,
        "BR-LRM-05",
        `BR-LRM-05: duration_weeks ${roadmap.duration_weeks} nhưng khai ${roadmap.weeks.length} tuần`
      )
    );
  }
  roadmap.weeks.forEach((week, index) => {
    found.push(...checkWeekShape(roadmap, week, index));
  });
  return found;
}

function checkSkill(
  roadmap: RoadmapSeed,
  code: string,
  skills: ReadonlyMap<string, RoadmapSkillInfo>,
  difficultyMax: number
): RoadmapViolation[] {
  const skill = skills.get(code);
  if (!skill) {
    return [
      violation(
        roadmap,
        "BR-LRM-02",
        `BR-LRM-02: Mã kỹ năng '${code}' không có trong skills`
      ),
    ];
  }
  const found: RoadmapViolation[] = [];
  const [low, high] = BAND_AGES[roadmap.band];
  if (skill.age_max < low || skill.age_min > high) {
    found.push(
      violation(
        roadmap,
        "BR-PAR-01",
        `BR-PAR-01: Kỹ năng ${code} dạy tuổi ${skill.age_min}-${skill.age_max}, ngoài band ${roadmap.band}`
      )
    );
  }
  if (skill.difficulty > difficultyMax) {
    found.push(
      violation(
        roadmap,
        "BR-PAR-01",
        `BR-PAR-01: Kỹ năng ${code} độ khó ${skill.difficulty} vượt trần ${difficultyMax} của band ${roadmap.band}`
      )
    );
  }
  return found;
}

function flatSessions(
  roadmap: RoadmapSeed
): ReadonlyArray<{ week: RoadmapWeek; session: RoadmapSession }> {
  return roadmap.weeks.flatMap((week) =>
    week.sessions.map((session) => ({ week, session }))
  );
}

function firstIntroduceWeeks(roadmap: RoadmapSeed): Map<string, number> {
  const introducedAt = new Map<string, number>();
  for (const { week, session } of flatSessions(roadmap)) {
    if (session.role === "introduce" && !introducedAt.has(session.skill_code)) {
      introducedAt.set(session.skill_code, week.week_no);
    }
  }
  return introducedAt;
}

function checkUsedBeforeIntroduced(
  roadmap: RoadmapSeed,
  introducedAt: ReadonlyMap<string, number>
): RoadmapViolation[] {
  const found: RoadmapViolation[] = [];
  const reported = new Set<string>();
  for (const { week, session } of flatSessions(roadmap)) {
    if (session.role === "introduce" || session.role === "offscreen") {
      continue;
    }
    const introduced = introducedAt.get(session.skill_code);
    const tooEarly = introduced === undefined || introduced > week.week_no;
    if (tooEarly && !reported.has(session.skill_code)) {
      reported.add(session.skill_code);
      found.push(
        violation(
          roadmap,
          "BR-LRM-05",
          `BR-LRM-05: Kỹ năng ${session.skill_code} được ${session.role} ở tuần ${week.week_no} trước khi có tiết introduce`
        )
      );
    }
  }
  return found;
}

function checkNeverIntroduced(
  roadmap: RoadmapSeed,
  introducedAt: ReadonlyMap<string, number>
): RoadmapViolation[] {
  const found: RoadmapViolation[] = [];
  const reported = new Set<string>();
  for (const { week, session } of flatSessions(roadmap)) {
    const orphan =
      session.role === "offscreen" && !introducedAt.has(session.skill_code);
    if (orphan && !reported.has(session.skill_code)) {
      reported.add(session.skill_code);
      found.push(
        violation(
          roadmap,
          "BR-LRM-05",
          `BR-LRM-05: Kỹ năng ${session.skill_code} (tuần ${week.week_no}) chưa bao giờ có tiết introduce`
        )
      );
    }
  }
  return found;
}

function checkIntroduceOrder(roadmap: RoadmapSeed): RoadmapViolation[] {
  const introducedAt = firstIntroduceWeeks(roadmap);
  return [
    ...checkUsedBeforeIntroduced(roadmap, introducedAt),
    ...checkNeverIntroduced(roadmap, introducedAt),
  ];
}

function buildItems(
  roadmap: RoadmapSeed,
  skills: ReadonlyMap<string, RoadmapSkillInfo>
): CurriculumItemMetadata[] {
  return flatSessions(roadmap).map(({ week, session }, index) => {
    const skill = skills.get(session.skill_code);
    return {
      week_no: week.week_no,
      session_no: session.session_no,
      position: 1,
      entity_type: session.role === "practice" ? "game_level" : "lesson",
      entity_id: index + 1,
      code: `${roadmap.code}:W${week.week_no}S${session.session_no}`,
      is_required: true,
      competency_code: skill?.competency_code,
      skill_codes: [session.skill_code],
      difficulty: skill?.difficulty,
      estimated_minutes: DEFAULT_SESSION_MINUTES[session.role],
      is_offline: session.role === "offscreen",
    };
  });
}

function prerequisiteMap(
  roadmap: RoadmapSeed,
  skills: ReadonlyMap<string, RoadmapSkillInfo>
): Record<string, string[]> {
  const map: Record<string, string[]> = {};
  for (const { session } of flatSessions(roadmap)) {
    const skill = skills.get(session.skill_code);
    if (skill) {
      map[skill.code] = [...skill.prerequisites];
    }
  }
  return map;
}

export function measureRoadmap(
  roadmap: RoadmapSeed,
  skills: ReadonlyMap<string, RoadmapSkillInfo>,
  difficultyMax: number
): RoadmapProgramRow {
  const skillCodes = [
    ...new Set(flatSessions(roadmap).map(({ session }) => session.skill_code)),
  ];
  const structural = [
    ...checkIdentity(roadmap),
    ...checkShape(roadmap),
    ...skillCodes.flatMap((code) =>
      checkSkill(roadmap, code, skills, difficultyMax)
    ),
    ...checkIntroduceOrder(roadmap),
  ];
  return measureCurriculum(
    roadmap.code,
    {
      code: roadmap.code,
      program_type: "age_based",
      target_age_min: BAND_AGES[roadmap.band][0],
      target_age_max: BAND_AGES[roadmap.band][1],
      duration_weeks: roadmap.duration_weeks,
      sessions_per_week: roadmap.sessions_per_week,
      title: roadmap.title,
      status: "published",
      items: buildItems(roadmap, skills),
      weeks: roadmap.weeks.map((week) => ({
        week_no: week.week_no,
        goal: week.goal,
      })),
      skill_prerequisites_map: prerequisiteMap(roadmap, skills),
    },
    ROADMAP_BLOCKING_WARNING_RULES,
    structural
  );
}

export function evaluateRoadmapSeeds(
  input: RoadmapSeedGateInput
): RoadmapProgramRow[] {
  return input.roadmaps.map((roadmap) =>
    measureRoadmap(
      roadmap,
      input.skills,
      input.difficultyMaxByBand[roadmap.band]
    )
  );
}
