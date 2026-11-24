import { IncomingMessage, ServerResponse } from "node:http";
import { Socket } from "node:net";
import {
  ACCESS_TIER,
  aiUsageLog,
  CHILD_STATUS,
  CONSENT_ACTION,
  CONSENT_TYPE,
  childDailyStats,
  childProfiles,
  consentLogs,
  gameLevels,
  getOwnerDb,
  USER_STATUS,
  users,
} from "@mindkid/db";
import { getDateIct } from "@mindkid/shared";
import { eq } from "drizzle-orm";
import { H3Event } from "h3";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

// DB thật (BR-TST-02): user, trẻ, consent, level, thống kê chơi trong ngày là hàng SQLite test.
const hoisted = vi.hoisted(() => ({
  userId: 0,
  gameLevelTier: "free" as "free" | "standard",
  activeEntitlements: [] as string[],
  updateCustomGameMock: vi.fn(async () => ({ uuid: "cg-1" })),
}));

vi.mock("@mindkid/game-engine/registry", () => ({
  getGameTemplate: vi.fn(() => ({
    code: "GT-001",
    kind: "practice",
    defaultScoringWeights: {},
  })),
  validateContentPack: vi.fn(() => ({ success: true, data: {} })),
}));

vi.mock("#server/utils/concept-intro-runtime", () => ({
  checkLevelIntroRequired: vi.fn(async () => null),
}));

vi.mock("#server/utils/round-set-runtime", () => ({
  RUNTIME_SCORING_MODE: "standard",
  loadRoundSet: vi.fn(() => []),
}));

vi.mock("#server/utils/auth-runtime", async (importOriginal) => ({
  ...(await importOriginal<typeof import("#server/utils/auth-runtime")>()),
  requireWebUserSession: vi.fn(async () => ({
    user_id: String(hoisted.userId),
    session_id: `sess-${hoisted.userId}`,
  })),
}));

vi.mock("#server/utils/entitlements-runtime", () => ({
  resolveUserActiveEntitlements: vi.fn(async () => hoisted.activeEntitlements),
}));

vi.mock("#server/services/index.js", () => ({
  updateCustomGame: hoisted.updateCustomGameMock,
}));

vi.mock("#server/services/ai-credit.ts", () => ({
  debitCredits: vi.fn(async () => ({ newBalance: 9 })),
  refundCredits: vi.fn(async () => undefined),
}));

function makeEvent(options: {
  method?: string;
  url?: string;
  headers?: Record<string, string>;
  params?: Record<string, string>;
  body?: Record<string, string>;
}): H3Event {
  const socket = new Socket();
  const req = new IncomingMessage(socket);
  req.method = options.method ?? "GET";
  req.url = options.url ?? "/";
  for (const [k, v] of Object.entries(options.headers ?? {})) {
    req.headers[k.toLowerCase()] = v;
  }
  const res = new ServerResponse(req);
  const event = new H3Event(req, res);
  if (options.params) {
    event.context.params = options.params;
  }
  if (options.body) {
    event.context.body = options.body;
  }
  return event;
}

interface SeededS4 {
  readonly userId: number;
  readonly childUuid: string;
  readonly freeLevelCode: string;
  readonly standardLevelCode: string;
}

let seq = 0;
let seeded: SeededS4;

async function seedS4(): Promise<SeededS4> {
  const db = getOwnerDb();
  seq += 1;
  const stamp = `${Date.now()}${seq}`;
  const [u] = await db
    .insert(users)
    .values({
      email: `s4-${stamp}@example.com`,
      displayName: "S4",
      emailVerified: true,
      emailVerifiedAt: new Date("2026-07-01T00:00:00Z"),
      status: USER_STATUS.ACTIVE,
    })
    .returning();
  if (!u) {
    throw new Error("seed user failed");
  }
  const [child] = await db
    .insert(childProfiles)
    .values({
      userId: u.id,
      displayName: "Bé Test",
      birthYear: 2021,
      avatarId: "fox",
      status: CHILD_STATUS.ACTIVE,
      dailyPlayCapMinutes: 15,
    })
    .returning();
  if (!child) {
    throw new Error("seed child failed");
  }
  await db.insert(childDailyStats).values({
    childProfileId: child.id,
    dateIct: getDateIct(),
    totalPlayTimeSeconds: 15 * 60,
  });
  await db.insert(consentLogs).values({
    userId: u.id,
    consentType: CONSENT_TYPE.CHILD_DATA,
    action: CONSENT_ACTION.ACCEPTED,
    ipAddress: "127.0.0.1",
    userAgent: "vitest",
  });
  const freeLevelCode = `GL-C1-CNT-S4F-${stamp}`;
  const standardLevelCode = `GL-C1-CNT-S4S-${stamp}`;
  for (const [code, tier] of [
    [freeLevelCode, ACCESS_TIER.FREE],
    [standardLevelCode, ACCESS_TIER.STANDARD],
  ] as const) {
    await db.insert(gameLevels).values({
      code,
      templateCode: "GT-001",
      difficulty: 1,
      title: "Đếm vật",
      accessTier: tier,
      ageMin: 3,
      ageMax: 6,
      contentPack: {},
      difficultyParams: {},
    });
  }
  return {
    userId: u.id,
    childUuid: child.uuid,
    freeLevelCode,
    standardLevelCode,
  };
}

describe("Slice S4 Security Fixes ([H-10], [M-11], [L-01])", () => {
  beforeEach(async () => {
    vi.clearAllMocks();
    hoisted.gameLevelTier = "free";
    hoisted.activeEntitlements = [];
    seeded = await seedS4();
    hoisted.userId = seeded.userId;
  });

  afterEach(async () => {
    vi.unstubAllEnvs();
    const db = getOwnerDb();
    await db.delete(aiUsageLog).where(eq(aiUsageLog.userId, seeded.userId));
    await db
      .delete(gameLevels)
      .where(eq(gameLevels.code, seeded.freeLevelCode));
    await db
      .delete(gameLevels)
      .where(eq(gameLevels.code, seeded.standardLevelCode));
    // `consent_logs` là bảng chỉ-thêm (INSERT-only) nên không xoá được user; email duy nhất theo lần chạy.
    await db
      .delete(childProfiles)
      .where(eq(childProfiles.userId, seeded.userId));
  });

  it("[H-10] GET /api/guest/curricula/[code] rejects in_review, approved, and rejected curricula with 404", async () => {
    const { default: handler } = await import(
      "#server/api/guest/curricula/[code].get"
    );

    // Bảng `curricula` không có cột status: lộ trình chưa công bố đơn giản là không có hàng,
    // nên ca âm dùng mã không tồn tại cho từng trạng thái.
    for (const status of ["in_review", "approved", "rejected"]) {
      const code = `CUR-S4-${status.toUpperCase().replace("_", "")}-${seeded.userId}`;
      const event = makeEvent({
        url: `/api/guest/curricula/${code}`,
        params: { code },
      });
      await expect(handler(event)).rejects.toMatchObject({
        code: "NOT_FOUND",
        statusCode: 404,
      });
    }
  });

  it("[H-10] deliverGameConfig enforces DailyPlayCapReachedError when daily play cap is reached", async () => {
    const { deliverGameConfig } = await import(
      "#server/utils/game-config-runtime"
    );

    const fakeEvent = makeEvent({
      url: `/api/users/games/${seeded.freeLevelCode}/config`,
    });

    await expect(
      deliverGameConfig(fakeEvent, seeded.freeLevelCode, {
        caller: {
          kind: "user",
          user_id: String(seeded.userId),
          active_child_id: seeded.childUuid,
        },
        activeKeys: ["play_login_games"],
      })
    ).rejects.toMatchObject({
      code: "DAILY_PLAY_CAP_REACHED",
    });
  });

  it("[M-11] PATCH /api/users/custom-games/[uuid] rejects user without create_custom_game entitlement", async () => {
    const { default: patchHandler } = await import(
      "#server/api/users/custom-games/[uuid]/index.patch"
    );
    hoisted.activeEntitlements = ["play_standard_games"];

    const event = makeEvent({
      method: "PATCH",
      url: "/api/users/custom-games/00000000-0000-4000-8000-000000000099",
      params: { uuid: "00000000-0000-4000-8000-000000000099" },
      body: { title: "Game sửa tên" },
    });

    await expect(patchHandler(event)).rejects.toMatchObject({
      code: "ENTITLEMENT_REQUIRED",
      statusCode: 403,
    });
    expect(hoisted.updateCustomGameMock).not.toHaveBeenCalled();
  });

  it("[M-11] AiAssistantService.suggestContent marks standard content as locked when user lacks play_standard_games", async () => {
    const { aiAssistantService } = await import(
      "#server/services/ai-assistant"
    );
    hoisted.activeEntitlements = ["use_ai_analysis"];
    hoisted.gameLevelTier = "standard";

    const result = await aiAssistantService.suggestContent(seeded.userId, {
      contentType: "game",
      limit: 5,
    });

    // Catalog thật có thể chứa level khác; level vừa seed có id lớn nhất nên đứng đầu.
    expect(result.suggestions.length).toBeGreaterThanOrEqual(1);
    expect(result.suggestions[0]).toMatchObject({
      code: seeded.standardLevelCode,
      access_tier: "standard",
      locked: true,
    });
  });

  it("[M-11] AiAssistantService.suggestContent rejects user without use_ai_analysis entitlement with 403 ENTITLEMENT_REQUIRED", async () => {
    const { aiAssistantService } = await import(
      "#server/services/ai-assistant"
    );
    const { debitCredits } = await import("#server/services/ai-credit.ts");
    hoisted.activeEntitlements = ["play_standard_games"];
    hoisted.gameLevelTier = "standard";

    await expect(
      aiAssistantService.suggestContent(seeded.userId, {
        contentType: "game",
        limit: 5,
      })
    ).rejects.toMatchObject({
      statusCode: 403,
      code: "ENTITLEMENT_REQUIRED",
    });
    expect(debitCredits).not.toHaveBeenCalled();
  });

  it("[L-01] factoryAssertSameOriginRequest rejects missing Origin and Sec-Fetch-Site in production", async () => {
    const { factoryAssertSameOriginRequest } = await import(
      "#server/utils/auth-runtime-factory"
    );
    vi.stubEnv("NODE_ENV", "production");

    const missingHeadersEvent = makeEvent({
      method: "POST",
      url: "/api/users/children",
      headers: { host: "mindkid.vn" },
    });
    expect(() =>
      factoryAssertSameOriginRequest(missingHeadersEvent)
    ).toThrowError();

    const sameOriginFetchSiteEvent = makeEvent({
      method: "POST",
      url: "/api/users/children",
      headers: {
        host: "mindkid.vn",
        "sec-fetch-site": "same-origin",
      },
    });
    expect(() =>
      factoryAssertSameOriginRequest(sameOriginFetchSiteEvent)
    ).not.toThrow();
  });
});
