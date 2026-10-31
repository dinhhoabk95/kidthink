import { IncomingMessage, ServerResponse } from "node:http";
import { Socket } from "node:net";
import { H3Event } from "h3";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

type MockScalar =
  | string
  | number
  | boolean
  | null
  | undefined
  | Record<string, string | number>;
type MockRow = Record<string, MockScalar>;

const hoisted = vi.hoisted(() => ({
  curriculumStatus: "in_review" as string,
  activeEntitlements: [] as string[],
  updateCustomGameMock: vi.fn(async () => ({ uuid: "cg-1" })),
  resetSelectIndex: () => undefined,
}));

vi.mock("@mindkid/db", () => {
  const curriculaTable = {
    __table: "curricula",
    id: "id",
    code: "code",
    title: "title",
    description: "description",
    programType: "program_type",
    targetAgeMin: "target_age_min",
    targetAgeMax: "target_age_max",
    durationWeeks: "duration_weeks",
    sessionsPerWeek: "sessions_per_week",
    accessTier: "access_tier",
    status: "status",
  };
  const gameLevelsTable = {
    __table: "gameLevels",
    id: "id",
    code: "code",
    title: "title",
    contentVersion: "content_version",
    status: "status",
    accessTier: "access_tier",
  };
  const childProfilesTable = {
    __table: "childProfiles",
    id: "id",
    uuid: "uuid",
    userId: "user_id",
  };
  const childDailyStatsTable = {
    __table: "childDailyStats",
    childProfileId: "child_profile_id",
    dateIct: "date_ict",
  };

  const mockDb = {
    select: vi.fn((fields?: Record<string, string>) => {
      let currentTable = "";
      const resolveRows = (): MockRow[] => {
        if (currentTable === "curricula") {
          if (hoisted.curriculumStatus !== "published") {
            return [];
          }
          return [
            {
              id: 1,
              code: "CUR-C1-34-STD",
              title: "Lộ trình C1",
              description: "Mô tả",
              programType: "core",
              targetAgeMin: 3,
              targetAgeMax: 4,
              durationWeeks: 4,
              sessionsPerWeek: 3,
              accessTier: "free",
            },
          ];
        }
        if (currentTable === "gameLevels") {
          if (fields && "accessTier" in fields) {
            return [
              {
                code: "GL-C1-CNT-OBJ-0001",
                title: "Đếm vật Standard",
                accessTier: "standard",
              },
            ];
          }
          return [
            {
              id: 100,
              code: "GL-C1-CNT-OBJ-0001",
              templateCode: "GT-001",
              contentVersion: 1,
              status: "published",
              accessTier: "free",
              ageMin: 3,
              ageMax: 6,
              title: "Đếm vật",
              thumbnailEmoji: "🍎",
              contentPack: {},
              difficultyParams: {},
            },
          ];
        }
        if (currentTable === "childProfiles") {
          return [
            {
              id: 10,
              uuid: "00000000-0000-4000-8000-000000000010",
              userId: 42,
              status: "active",
              dailyPlayCapMinutes: 15,
            },
          ];
        }
        if (currentTable === "childDailyStats") {
          return [
            {
              childProfileId: 10,
              dateIct: "2026-10-24",
              totalPlayTimeSeconds: 15 * 60,
            },
          ];
        }
        return [];
      };

      const chain = {
        from: vi.fn((table?: { __table?: string }) => {
          currentTable = table?.__table ?? "";
          return chain;
        }),
        where: vi.fn(() => chain),
        orderBy: vi.fn(() => chain),
        limit: vi.fn(async () => resolveRows()),
        // biome-ignore lint/suspicious/noThenProperty: Drizzle query builder mock
        then: (resolve: (val: MockRow[]) => void) =>
          Promise.resolve(resolveRows()).then(resolve),
      };
      return chain;
    }),
    insert: vi.fn(() => ({
      values: vi.fn(async () => undefined),
    })),
    resetSelectIndex: () => undefined,
  };

  return {
    getOwnerDb: vi.fn(() => mockDb),
    getDb: vi.fn(() => mockDb),
    curricula: curriculaTable,
    curriculumWeeks: {
      curriculumId: "curriculum_id",
      weekNo: "week_no",
      goal: "goal",
    },
    curriculumItems: {
      id: "id",
      curriculumId: "curriculum_id",
      weekNo: "week_no",
      sessionNo: "session_no",
      position: "position",
      entityType: "entity_type",
      entityId: "entity_id",
    },
    curriculumRedirects: {},
    gameLevels: gameLevelsTable,
    skills: {},
    childProfiles: childProfilesTable,
    childDailyStats: childDailyStatsTable,
    playSessions: {},
    aiUsageLog: {},
    masteryState: {},
    __mockDb: mockDb,
  };
});

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

vi.mock("#server/utils/auth-runtime", () => ({
  requireWebUserSession: vi.fn(async () => ({
    user_id: "42",
    session_id: "sess-42",
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

describe("Slice S4 Security Fixes ([H-10], [M-11], [L-01])", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    hoisted.curriculumStatus = "in_review";
    hoisted.activeEntitlements = [];
    hoisted.resetSelectIndex();
  });

  afterEach(() => {
    vi.unstubAllEnvs();
  });

  it("[H-10] GET /api/guest/curricula/[code] rejects in_review, approved, and rejected curricula with 404", async () => {
    const { default: handler } = await import(
      "#server/api/guest/curricula/[code].get"
    );

    for (const status of ["in_review", "approved", "rejected"]) {
      hoisted.curriculumStatus = status;
      const event = makeEvent({
        url: "/api/guest/curricula/CUR-C1-34-STD",
        params: { code: "CUR-C1-34-STD" },
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
      url: "/api/users/games/GL-C1-CNT-OBJ-0001/config",
    });

    await expect(
      deliverGameConfig(fakeEvent, "GL-C1-CNT-OBJ-0001", {
        caller: {
          kind: "user",
          user_id: "42",
          active_child_id: "00000000-0000-4000-8000-000000000010",
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
    hoisted.activeEntitlements = [];

    const result = await aiAssistantService.suggestContent(42, {
      contentType: "game",
      limit: 5,
    });

    expect(result.suggestions).toHaveLength(1);
    expect(result.suggestions[0]).toMatchObject({
      code: "GL-C1-CNT-OBJ-0001",
      access_tier: "standard",
      locked: true,
    });
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
