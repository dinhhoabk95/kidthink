import crypto from "node:crypto";
import {
  ACCESS_TIER,
  type AccessTier,
  CONTENT_ENTITY_TYPE,
  childProfiles,
  competencies,
  contentSkillMap,
  gameLevels,
  getOwnerDb,
  PLAY_COMPLETION_STATUS,
  type PlayCompletionStatus,
  playSessions,
  skillPrerequisites,
  skills,
  strands,
  users,
} from "@mindkid/db";
import type { CallerIdentity } from "@mindkid/shared";
import { eq } from "drizzle-orm";
import { beforeAll, describe, expect, it } from "vitest";
import {
  checkLevelIntroRequired,
  MAX_INTROS_PER_ENTRY,
} from "#server/utils/concept-intro-runtime";

// Cổng làm quen — BR-CIG-16 (tối đa 1 bài mỗi lượt vào) và BR-CIG-19 (bài
// làm quen trẻ không mở được thì không đòi). docs/specs/04-play/concept-intro-gate.md

const suffix = crypto.randomInt(10_000, 99_999);
const GUEST: CallerIdentity = { kind: "guest" };

interface SeededLevel {
  readonly id: number;
  readonly code: string;
  readonly templateCode: string;
}

let strandId = 0;
let childId = 0;
let childUuid = "";
let userId = 0;

async function insertSkill(code: string, name: string): Promise<number> {
  const [row] = await getOwnerDb()
    .insert(skills)
    .values({ code, strandId, name, ageMin: 3, ageMax: 6, difficulty: 1 })
    .returning();
  if (!row) {
    throw new Error(`Không tạo được kỹ năng ${code}`);
  }
  return row.id;
}

async function insertLevel(
  code: string,
  templateCode: string,
  accessTier: AccessTier,
  skillIds: readonly number[]
): Promise<SeededLevel> {
  const db = getOwnerDb();
  const [row] = await db
    .insert(gameLevels)
    .values({
      code,
      templateCode,
      title: `Level ${code}`,
      contentPack: {},
      difficultyParams: {},
      accessTier,
    })
    .returning();
  if (!row) {
    throw new Error(`Không tạo được level ${code}`);
  }
  for (const skillId of skillIds) {
    await db.insert(contentSkillMap).values({
      entityType: CONTENT_ENTITY_TYPE.GAME_LEVEL,
      entityId: row.id,
      skillId,
      weight: "1.00",
    });
  }
  return { id: row.id, code: row.code, templateCode: row.templateCode };
}

async function insertSession(
  level: SeededLevel,
  owner: { readonly guestDeviceId?: string; readonly childProfileId?: number },
  completionStatus: PlayCompletionStatus
): Promise<void> {
  await getOwnerDb()
    .insert(playSessions)
    .values({
      childProfileId: owner.childProfileId ?? null,
      guestDeviceId: owner.guestDeviceId ?? null,
      gameLevelId: level.id,
      templateCode: level.templateCode,
      completionStatus,
      isPreview: false,
    });
}

// Chuỗi kỹ năng: X cần BASE. Level đích chạm X → bao đóng {X, BASE}.
let target: SeededLevel;
let introBase: SeededLevel;
let introX1: SeededLevel;
let introX2: SeededLevel;
// Level free chạm kỹ năng chỉ có bài làm quen premium (BR-CIG-19).
let freeTarget: SeededLevel;
let premiumIntro: SeededLevel;

beforeAll(async () => {
  const db = getOwnerDb();
  const [comp] = await db
    .insert(competencies)
    .values({
      code: `CIG${suffix}`,
      name: "Cổng làm quen",
      colorToken: "brand-blue",
      icon: "icon-c1",
    })
    .returning();
  if (!comp) {
    throw new Error("Không tạo được competency");
  }
  const [strand] = await db
    .insert(strands)
    .values({
      code: `CIG${suffix}.S`,
      competencyId: comp.id,
      name: "Strand cổng",
    })
    .returning();
  if (!strand) {
    throw new Error("Không tạo được strand");
  }
  strandId = strand.id;

  const baseSkill = await insertSkill(`CIG${suffix}.S.01`, "Nền");
  const xSkill = await insertSkill(`CIG${suffix}.S.02`, "Kỹ năng X");
  const premSkill = await insertSkill(`CIG${suffix}.S.03`, "Kỹ năng P");
  await db
    .insert(skillPrerequisites)
    .values({ skillId: xSkill, prerequisiteId: baseSkill });

  target = await insertLevel(
    `GL-CIG-TGT-${suffix}`,
    "GT-001",
    ACCESS_TIER.FREE,
    [xSkill]
  );
  introBase = await insertLevel(
    `GL-CIG-INB-${suffix}`,
    "GT-000",
    ACCESS_TIER.FREE,
    [baseSkill]
  );
  introX1 = await insertLevel(
    `GL-CIG-INX1-${suffix}`,
    "GT-000",
    ACCESS_TIER.FREE,
    [xSkill]
  );
  introX2 = await insertLevel(
    `GL-CIG-INX2-${suffix}`,
    "GT-000",
    ACCESS_TIER.FREE,
    [xSkill]
  );
  freeTarget = await insertLevel(
    `GL-CIG-FREE-${suffix}`,
    "GT-001",
    ACCESS_TIER.FREE,
    [premSkill]
  );
  premiumIntro = await insertLevel(
    `GL-CIG-INP-${suffix}`,
    "GT-000",
    ACCESS_TIER.PREMIUM,
    [premSkill]
  );

  const [user] = await db
    .insert(users)
    .values({ email: `cig-${suffix}@example.com`, displayName: "CIG" })
    .returning();
  if (!user) {
    throw new Error("Không tạo được user");
  }
  userId = user.id;
  const [child] = await db
    .insert(childProfiles)
    .values({
      userId,
      displayName: "Bé CIG",
      birthYear: 2021,
      avatarId: "preset_01",
    })
    .returning();
  if (!child) {
    throw new Error("Không tạo được hồ sơ trẻ");
  }
  childId = child.id;
  childUuid = String(child.uuid);
});

describe("BR-CIG-19 — bài làm quen trẻ không mở được thì không đòi", () => {
  it("khách vào level free không bị chặn bởi bài làm quen premium", async () => {
    const result = await checkLevelIntroRequired(freeTarget, GUEST, {
      guestDeviceId: `cig-guest-free-${suffix}`,
    });
    expect(result.intro_required).toBe(false);
  });

  it("người dùng chưa chọn hồ sơ trẻ cũng không bị chặn", async () => {
    const result = await checkLevelIntroRequired(
      freeTarget,
      { kind: "user", user_id: String(userId), active_child_id: null },
      { guestDeviceId: `cig-user-nochild-${suffix}`, activeKeys: [] }
    );
    expect(result.intro_required).toBe(false);
  });

  it("trẻ có gói premium vẫn bị đòi bài làm quen premium (ca đối chứng)", async () => {
    const result = await checkLevelIntroRequired(
      freeTarget,
      { kind: "user", user_id: String(userId), active_child_id: childUuid },
      {
        resolvedChildId: childId,
        activeKeys: ["play_standard_games", "play_premium_games"],
      }
    );
    expect(result.intro_required).toBe(true);
    expect(result.intro_queue?.map((q) => q.intro_level_code)).toEqual([
      premiumIntro.code,
    ]);
    expect(result.intro_remaining).toBe(0);
  });

  it("trẻ không có gói không bị đòi bài làm quen premium", async () => {
    const result = await checkLevelIntroRequired(
      freeTarget,
      { kind: "user", user_id: String(userId), active_child_id: childUuid },
      { resolvedChildId: childId, activeKeys: [] }
    );
    expect(result.intro_required).toBe(false);
  });
});

describe("BR-CIG-16 — tối đa một bài mỗi lượt vào", () => {
  it(`hàng 3 bài: đòi đúng ${MAX_INTROS_PER_ENTRY} bài nền trước, intro_remaining = 2`, async () => {
    const result = await checkLevelIntroRequired(target, GUEST, {
      guestDeviceId: `cig-guest-fresh-${suffix}`,
    });
    expect(MAX_INTROS_PER_ENTRY).toBe(1);
    expect(result.intro_required).toBe(true);
    expect(result.intro_queue?.map((q) => q.intro_level_code)).toEqual([
      introBase.code,
    ]);
    expect(result.intro_remaining).toBe(2);
    expect(result.return_level_code).toBe(target.code);
  });

  it("đi xong bài được đòi thì lượt vào đó mở; lượt sau đòi bài kế, không đòi lại bài đã xong", async () => {
    const guestDeviceId = `cig-guest-walk-${suffix}`;
    const owner = { guestDeviceId };

    await insertSession(introBase, owner, PLAY_COMPLETION_STATUS.COMPLETED);
    const afterIntro = await checkLevelIntroRequired(target, GUEST, {
      guestDeviceId,
    });
    expect(afterIntro.intro_required).toBe(false);

    // Trẻ vào chơi → có phiên mới của level đích, lượt vào sau đòi bài kế.
    await insertSession(target, owner, PLAY_COMPLETION_STATUS.COMPLETED);
    const nextEntry = await checkLevelIntroRequired(target, GUEST, {
      guestDeviceId,
    });
    expect(nextEntry.intro_required).toBe(true);
    const queued = nextEntry.intro_queue?.map((q) => q.intro_level_code) ?? [];
    expect(queued).toHaveLength(1);
    expect(queued).not.toContain(introBase.code);
    expect([introX1.code, introX2.code]).toContain(queued[0]);
    expect(nextEntry.intro_remaining).toBe(1);
  });

  it("phiên bài làm quen abandoned không trả bài cho lượt vào", async () => {
    const guestDeviceId = `cig-guest-abandon-${suffix}`;
    await insertSession(
      introBase,
      { guestDeviceId },
      PLAY_COMPLETION_STATUS.ABANDONED
    );
    const result = await checkLevelIntroRequired(target, GUEST, {
      guestDeviceId,
    });
    expect(result.intro_required).toBe(true);
    expect(result.intro_remaining).toBe(2);
  });

  it("đã đi hết mọi bài làm quen → mở, kể cả khi đã có phiên của level đích sau đó", async () => {
    const owner = { childProfileId: childId };
    for (const intro of [introBase, introX1, introX2]) {
      await insertSession(intro, owner, PLAY_COMPLETION_STATUS.COMPLETED);
    }
    await insertSession(target, owner, PLAY_COMPLETION_STATUS.COMPLETED);
    const result = await checkLevelIntroRequired(
      target,
      { kind: "user", user_id: String(userId), active_child_id: childUuid },
      { resolvedChildId: childId, activeKeys: [] }
    );
    expect(result.intro_required).toBe(false);
  });

  it("trạng thái theo từng chủ thể: khách khác vẫn bị đòi (BR-CIG-08)", async () => {
    const rows = await getOwnerDb()
      .select({ id: playSessions.id })
      .from(playSessions)
      .where(eq(playSessions.guestDeviceId, `cig-guest-other-${suffix}`));
    expect(rows).toHaveLength(0);
    const result = await checkLevelIntroRequired(target, GUEST, {
      guestDeviceId: `cig-guest-other-${suffix}`,
    });
    expect(result.intro_required).toBe(true);
  });
});
