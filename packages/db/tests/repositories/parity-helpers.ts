import { expect } from "vitest";
import {
  ACCESS_TIER,
  CHILD_RELATIONSHIP,
  CONTENT_ENTITY_TYPE,
  competencies,
  contentTags,
  createRepositories,
  curricula,
  curriculumItems,
  curriculumWeeks,
  DB,
  gameLevelRounds,
  gameLevels,
  learningObjectives,
  MANAGER_ROLE,
  type MindKidRepositories,
  PROGRAM_TYPE,
  SKILL_TIER,
  skillDatasets,
  skillPrerequisites,
  skills,
  strands,
  TAG_AXIS,
  TAG_STATUS,
  USER_STATUS,
} from "#src/index";
import { createInMemoryD1Database } from "#tests/helpers/d1-memory-binding";

export const UUID_V4_REGEX =
  /^[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/;
export const INSERT_ONLY_REGEX = /BR-DM-05/;

export const FIXED_T0 = new Date("2026-11-22T08:00:00.000Z");
export const FIXED_T1 = new Date("2026-11-22T08:05:00.000Z");
export const FIXED_T2 = new Date("2026-11-22T08:10:00.000Z");
export const FIXED_T3 = new Date("2026-11-22T08:15:00.000Z");
export const FIXED_EXPIRES_PAST = new Date("2026-11-22T07:00:00.000Z");
export const FIXED_EXPIRES_FUTURE = new Date("2026-12-22T08:00:00.000Z");

export const USER_1_UUID = "10000000-0000-4000-8000-000000000001";
export const USER_2_UUID = "10000000-0000-4000-8000-000000000002";
export const MANAGER_1_UUID = "20000000-0000-4000-8000-000000000001";
export const CHILD_1_UUID = "30000000-0000-4000-8000-000000000001";
export const CHILD_2_UUID = "30000000-0000-4000-8000-000000000002";
export const ORDER_1_UUID = "40000000-0000-4000-8000-000000000001";
export const ORDER_2_UUID = "40000000-0000-4000-8000-000000000002";
export const AUDIT_1_UUID = "50000000-0000-4000-8000-000000000001";
export const AUDIT_2_UUID = "50000000-0000-4000-8000-000000000002";
export const NOTIF_1_UUID = "60000000-0000-4000-8000-000000000001";
export const MFA_REQ_1_UUID = "70000000-0000-4000-8000-000000000001";
export const MFA_REQ_2_UUID = "70000000-0000-4000-8000-000000000002";
export const SESSION_1_UUID = "80000000-0000-4000-8000-000000000001";
export const SESSION_2_UUID = "80000000-0000-4000-8000-000000000002";

export interface DriverSide {
  readonly name: "sqlite" | "d1";
  readonly repos: MindKidRepositories;
}

export interface SeededLearningFixtures {
  readonly competencyId: number;
  readonly strandId: number;
  readonly prereqSkillId: number;
  readonly skillId: number;
  readonly levelId: number;
  readonly tagId: number;
  readonly curriculumId: number;
  readonly curriculumItemId: number;
}

export function extractDbErrorMessage(err: Error | object | string): string {
  if (typeof err === "string") {
    return err;
  }
  if ("cause" in err && err.cause && typeof err.cause === "object") {
    const causeObj = err.cause as { message?: string };
    if (typeof causeObj.message === "string" && causeObj.message.length > 0) {
      return causeObj.message;
    }
  }
  if (err instanceof Error) {
    return err.message;
  }
  return String(err);
}

export async function expectInsertOnlyViolation(
  operation: () => Promise<void>
): Promise<void> {
  let message = "";
  try {
    await operation();
  } catch (err) {
    const safeErr =
      err instanceof Error || (typeof err === "object" && err !== null)
        ? err
        : String(err);
    message = extractDbErrorMessage(safeErr);
  }
  expect(message).toMatch(INSERT_ONLY_REGEX);
}

export async function runBoth<T>(
  fn: (side: DriverSide) => Promise<T>
): Promise<{
  readonly fromSqlite: T;
  readonly fromD1: T;
}> {
  DB.configureSqlite({ dataDir: ":memory:" });
  const fromSqlite = await fn({
    name: "sqlite",
    repos: createRepositories(DB.connection("sqlite")),
  });

  const d1Ctx = createInMemoryD1Database();
  DB.registerD1Bindings({ core: d1Ctx.d1 });
  try {
    const fromD1 = await fn({
      name: "d1",
      repos: createRepositories(DB.connection("d1")),
    });
    return { fromSqlite, fromD1 };
  } finally {
    DB.clearD1Bindings();
    d1Ctx.close();
  }
}

export async function seedUserPair(repos: MindKidRepositories) {
  const u1 = await repos.users.create({
    uuid: USER_1_UUID,
    email: "Parent.Alpha@MindKid.VN",
    displayName: "Phụ huynh Minh Anh",
    emailVerified: true,
    status: USER_STATUS.ACTIVE,
    emailVerifiedAt: FIXED_T0,
    createdAt: FIXED_T0,
    updatedAt: FIXED_T0,
  });
  const u2 = await repos.users.create({
    uuid: USER_2_UUID,
    email: "parent.beta@mindkid.vn",
    displayName: "Phụ huynh Hoàng Nam",
    emailVerified: false,
    status: USER_STATUS.PENDING_VERIFICATION,
    createdAt: FIXED_T1,
    updatedAt: FIXED_T1,
  });
  return { u1, u2 };
}

export async function seedAdminManager(
  repos: MindKidRepositories,
  email: string
) {
  return await repos.managers.create({
    uuid: MANAGER_1_UUID,
    email,
    passwordHash: "$argon2id$v=19$m=19456,t=2,p=1$hash",
    displayName: "Quản trị tối cao",
    role: MANAGER_ROLE.SUPER_ADMIN,
    mfaEnabled: true,
    createdAt: FIXED_T0,
    updatedAt: FIXED_T0,
  });
}

export async function seedChildPair(
  repos: MindKidRepositories,
  userId: number
) {
  const c1 = await repos.childProfiles.create({
    uuid: CHILD_1_UUID,
    userId,
    displayName: "Bé Bơ",
    birthYear: 2021,
    avatarId: "fox",
    relationship: CHILD_RELATIONSHIP.CHILD,
    dailyPlayCapMinutes: 45,
    createdAt: FIXED_T0,
    updatedAt: FIXED_T0,
  });
  const c2 = await repos.childProfiles.create({
    uuid: CHILD_2_UUID,
    userId,
    displayName: "Bé Cam",
    birthYear: 2022,
    avatarId: "panda",
    relationship: CHILD_RELATIONSHIP.CHILD,
    createdAt: FIXED_T1,
    updatedAt: FIXED_T1,
  });
  return { c1, c2 };
}

export async function seedLearningFixtures(
  connName: "sqlite" | "d1"
): Promise<SeededLearningFixtures> {
  const db = DB.connection(connName);
  const [comp] = await db
    .insert(competencies)
    .values({
      code: "C1",
      name: "Số đếm & Phép tính",
      description: "Năng lực số học mầm non",
      colorToken: "berry",
      icon: "i-lucide-hash",
      position: 1,
      createdAt: FIXED_T0,
      updatedAt: FIXED_T0,
    })
    .returning();
  if (!comp) {
    throw new Error("Failed to seed competency");
  }

  const [strand] = await db
    .insert(strands)
    .values({
      code: "C1.CNT",
      competencyId: comp.id,
      name: "Đếm đến 10",
      description: "Nhận biết và đếm vật thể",
      position: 1,
      createdAt: FIXED_T0,
      updatedAt: FIXED_T0,
    })
    .returning();
  if (!strand) {
    throw new Error("Failed to seed strand");
  }

  const [prereqSkill] = await db
    .insert(skills)
    .values({
      code: "C1.CNT.01",
      strandId: strand.id,
      name: "Đếm 1–3",
      ageMin: 3,
      ageMax: 4,
      difficulty: 1,
      thinkingProcesses: ["observing"],
      whatAxis: ["number"],
      tier: SKILL_TIER.CORE,
      position: 1,
      createdAt: FIXED_T0,
      updatedAt: FIXED_T0,
    })
    .returning();
  const [skill] = await db
    .insert(skills)
    .values({
      code: "C1.CNT.02",
      strandId: strand.id,
      name: "Đếm 1–5",
      ageMin: 4,
      ageMax: 5,
      difficulty: 2,
      thinkingProcesses: ["counting", "comparing"],
      whatAxis: ["number"],
      tier: SKILL_TIER.CORE,
      position: 2,
      createdAt: FIXED_T0,
      updatedAt: FIXED_T0,
    })
    .returning();
  if (!(prereqSkill && skill)) {
    throw new Error("Failed to seed skills");
  }

  await db.insert(skillPrerequisites).values({
    skillId: skill.id,
    prerequisiteId: prereqSkill.id,
    strength: "0.90",
    createdAt: FIXED_T0,
    updatedAt: FIXED_T0,
  });

  await db.insert(learningObjectives).values([
    {
      code: "LO-C1-CNT-02-1",
      skillId: skill.id,
      behaviour: "Đếm đúng 5 đồ vật",
      observableCriteria: "Không bỏ sót",
      position: 1,
      createdAt: FIXED_T0,
      updatedAt: FIXED_T0,
    },
    {
      code: "LO-C1-CNT-02-2",
      skillId: skill.id,
      behaviour: "Chỉ tay tương ứng 1-1",
      observableCriteria: null,
      position: 2,
      createdAt: FIXED_T0,
      updatedAt: FIXED_T0,
    },
    {
      code: "LO-C1-CNT-02-3",
      skillId: skill.id,
      behaviour: "Nêu tổng số sau khi đếm",
      observableCriteria: null,
      position: 3,
      createdAt: FIXED_T0,
      updatedAt: FIXED_T0,
    },
  ]);

  const [dataset] = await db
    .insert(skillDatasets)
    .values({
      code: "DS-C1-CNT-02",
      skillId: skill.id,
      conceptLabel: "Đếm trái cây 1–5",
      items: [{ emoji: "🍎", count: 3 }],
      relations: [{ target: 3 }],
      ordering: ["asc"],
      axes: { what: "number" },
      ladder: [{ step: 1 }],
      phrasing: { prompt: "Có mấy quả táo?" },
      createdAt: FIXED_T0,
      updatedAt: FIXED_T0,
    })
    .returning();
  if (!dataset) {
    throw new Error("Failed to seed skill dataset");
  }

  const [level] = await db
    .insert(gameLevels)
    .values({
      code: "GL-C1-001",
      templateCode: "GT-001",
      title: "Đếm táo nông trại",
      description: "Đếm số táo trên cây",
      instruction: "Chạm để đếm táo",
      contentPack: { item: "apple", count: 3 },
      difficultyParams: { max_count: 3, hints: 2 },
      themeId: "farm",
      ageMin: 3,
      ageMax: 4,
      difficulty: 1,
      accessTier: ACCESS_TIER.FREE,
      thumbnailEmoji: "🍎",
      skillDatasetId: dataset.id,
      createdAt: FIXED_T0,
      updatedAt: FIXED_T0,
    })
    .returning();
  if (!level) {
    throw new Error("Failed to seed game level");
  }

  await db.insert(gameLevelRounds).values({
    gameLevelId: level.id,
    roundIndex: 0,
    instruction: "Đếm 3 quả táo",
    contentPack: { count: 3 },
    difficultyParams: { hints: 1 },
    difficulty: 1,
    createdAt: FIXED_T0,
    updatedAt: FIXED_T0,
  });

  const [tag] = await db
    .insert(contentTags)
    .values({
      code: "theme:farm",
      axis: TAG_AXIS.THEME,
      label: "Nông trại",
      status: TAG_STATUS.ACTIVE,
      createdAt: FIXED_T0,
      updatedAt: FIXED_T0,
    })
    .returning();
  if (!tag) {
    throw new Error("Failed to seed content tag");
  }

  const [curr] = await db
    .insert(curricula)
    .values({
      code: "AGE-3-4-KOGUMA-01",
      programType: PROGRAM_TYPE.AGE_BASED,
      targetAgeMin: 3,
      targetAgeMax: 4,
      durationWeeks: 12,
      sessionsPerWeek: 3,
      title: "Koguma Nền tảng 3–4 tuổi",
      description: "Lộ trình 12 tuần cho bé 3–4 tuổi",
      accessTier: ACCESS_TIER.FREE,
      createdAt: FIXED_T0,
      updatedAt: FIXED_T0,
    })
    .returning();
  if (!curr) {
    throw new Error("Failed to seed curriculum");
  }

  await db.insert(curriculumWeeks).values({
    curriculumId: curr.id,
    weekNo: 1,
    goal: "Làm quen số 1–3",
    createdAt: FIXED_T0,
    updatedAt: FIXED_T0,
  });

  const [currItem] = await db
    .insert(curriculumItems)
    .values({
      curriculumId: curr.id,
      weekNo: 1,
      sessionNo: 1,
      position: 1,
      entityType: CONTENT_ENTITY_TYPE.GAME_LEVEL,
      entityId: level.id,
      isRequired: true,
      createdAt: FIXED_T0,
      updatedAt: FIXED_T0,
    })
    .returning();
  if (!currItem) {
    throw new Error("Failed to seed curriculum item");
  }

  return {
    competencyId: comp.id,
    strandId: strand.id,
    prereqSkillId: prereqSkill.id,
    skillId: skill.id,
    levelId: level.id,
    tagId: tag.id,
    curriculumId: curr.id,
    curriculumItemId: currItem.id,
  };
}
