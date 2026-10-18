import { IncomingMessage, ServerResponse } from "node:http";
import { Socket } from "node:net";
import type { ValidationError } from "@mindkid/errors/common";
import type { ContentImmutableError } from "@mindkid/errors/content";
import { createEvent, type H3Event } from "h3";
import { beforeEach, describe, expect, it, vi } from "vitest";

const mocks = vi.hoisted(() => ({
  targetRow: null as {
    id: number;
    status: string;
    templateCode: string | null;
  } | null,
  activeTags: [] as Array<{ code: string }>,
  userTagRows: [] as Array<{ label: string }>,
  skillRows: [] as Array<{ id: number; code: string }>,
  validateAndAssignTags: vi.fn<() => Promise<void>>(),
  validateContentSkillMap: vi.fn(),
  writeAudit: vi.fn<() => Promise<void>>(),
  deleteSkillMap: vi.fn<() => Promise<void>>(),
  insertSkillMap: vi.fn<() => Promise<void>>(),
}));

vi.mock("@mindkid/audit", () => ({
  writeAudit: mocks.writeAudit,
}));

vi.mock("@mindkid/db", () => {
  const gameLevelsTable = {
    __table: "game_levels",
    id: "id",
    status: "status",
    templateCode: "templateCode",
  };
  const lessonsTable = {
    __table: "lessons",
    id: "id",
    status: "status",
  };
  const activitiesTable = {
    __table: "activities",
    id: "id",
    status: "status",
  };
  const contentTagsTable = {
    __table: "content_tags",
    code: "code",
    status: "status",
  };
  const userTagsTable = {
    __table: "user_tags",
    label: "label",
  };
  const skillsTable = {
    __table: "skills",
    id: "id",
    code: "code",
  };
  const contentSkillMapTable = {
    __table: "content_skill_map",
    entityType: "entityType",
    entityId: "entityId",
  };

  const makeDb = () => ({
    select: () => ({
      from: (table: { __table?: string }) => ({
        where: () => {
          if (table.__table === "content_tags") {
            return Promise.resolve(mocks.activeTags);
          }
          if (table.__table === "user_tags") {
            return Promise.resolve(mocks.userTagRows);
          }
          if (table.__table === "skills") {
            return Promise.resolve(mocks.skillRows);
          }
          return {
            limit: () =>
              Promise.resolve(mocks.targetRow ? [mocks.targetRow] : []),
          };
        },
      }),
    }),
    delete: () => ({
      where: mocks.deleteSkillMap,
    }),
    insert: () => ({
      values: mocks.insertSkillMap,
    }),
    transaction: async <T>(fn: (tx: ReturnType<typeof makeDb>) => Promise<T>) =>
      fn(makeDb()),
  });

  return {
    getOwnerDb: makeDb,
    gameLevels: gameLevelsTable,
    lessons: lessonsTable,
    activities: activitiesTable,
    contentTags: contentTagsTable,
    userTags: userTagsTable,
    skills: skillsTable,
    contentSkillMap: contentSkillMapTable,
    validateAndAssignTags: mocks.validateAndAssignTags,
    validateContentSkillMap: mocks.validateContentSkillMap,
  };
});

import putTagsHandler from "#server/api/managers/content/[type]/[id]/tags.put";

function makePutEvent(
  params: Record<string, string>,
  body: Record<
    string,
    string | boolean | string[] | Array<{ skill_code: string; weight: number }>
  >
): H3Event {
  const req = new IncomingMessage(new Socket());
  req.method = "PUT";
  req.url = `/api/managers/content/${params.type}/${params.id}/tags`;
  req.headers.cookie = "tm_m_csrf=csrf-42";
  req.headers["x-csrf-token"] = "csrf-42";
  const res = new ServerResponse(req);
  const event = createEvent(req, res);
  event.context.manager = {
    manager_id: 42,
    display_name: "Manager Test",
    session_id: "sess-42",
    role: "super_admin",
  };
  event.context.params = params;
  event.context.body = body;
  return event;
}

describe("PUT /api/managers/content/[type]/[id]/tags API Contract (BR-TAG-01..06)", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mocks.targetRow = { id: 101, status: "draft", templateCode: "GT-001" };
    mocks.activeTags = [{ code: "cnt" }, { code: "visual" }];
    mocks.userTagRows = [];
    mocks.skillRows = [{ id: 1, code: "C1.CNT.01" }];
  });

  it("BR-TAG-01: rejects tag outside closed Layer-1 vocabulary with 422", async () => {
    mocks.activeTags = [{ code: "cnt" }];
    const event = makePutEvent(
      { type: "game_level", id: "101" },
      { tags: ["cnt", "unknown_tag"] }
    );

    try {
      await putTagsHandler(event);
      expect.fail("Should have thrown 422 ValidationError");
    } catch (err) {
      const e = err as ValidationError;
      expect(e.status).toBe(422);
      expect(e.message).toContain("BR-TAG-01");
    }
  });

  it("BR-TAG-05: rejects user-created tag from user_tags with 422", async () => {
    mocks.activeTags = [];
    mocks.userTagRows = [{ label: "my_private_tag" }];
    const event = makePutEvent(
      { type: "game_level", id: "101" },
      { tags: ["my_private_tag"] }
    );

    try {
      await putTagsHandler(event);
      expect.fail("Should have thrown 422 ValidationError for user tag");
    } catch (err) {
      const e = err as ValidationError;
      expect(e.status).toBe(422);
      expect(e.message).toContain("BR-TAG-05");
    }
  });

  it("BR-TAG-06: rejects direct tagging on curriculum and unconfirmed AI tags with 422", async () => {
    const curriculumEvent = makePutEvent(
      { type: "curriculum", id: "10" },
      { tags: ["cnt"] }
    );
    try {
      await putTagsHandler(curriculumEvent);
      expect.fail("Should have rejected curriculum tagging with 422");
    } catch (err) {
      const e = err as ValidationError;
      expect(e.status).toBe(422);
      expect(e.message).toContain("BR-TAG-06");
    }

    const aiUnconfirmedEvent = makePutEvent(
      { type: "game_level", id: "101" },
      {
        tags: ["cnt"],
        origin: "ai_suggested",
        confirmed_by_manager: false,
      }
    );
    try {
      await putTagsHandler(aiUnconfirmedEvent);
      expect.fail("Should have rejected unconfirmed AI tags with 422");
    } catch (err) {
      const e = err as ValidationError;
      expect(e.status).toBe(422);
      expect(e.message).toContain("BR-TAG-06");
    }
  });

  it("returns 409 CONTENT_IMMUTABLE when target content is already published", async () => {
    mocks.targetRow = { id: 101, status: "published", templateCode: "GT-001" };
    const event = makePutEvent(
      { type: "game_level", id: "101" },
      { tags: ["cnt", "visual"] }
    );

    try {
      await putTagsHandler(event);
      expect.fail("Should have thrown 409 CONTENT_IMMUTABLE");
    } catch (err) {
      const e = err as ContentImmutableError;
      expect(e.status).toBe(409);
      expect(e.code).toBe("CONTENT_IMMUTABLE");
    }
  });

  it("returns 200, assigns tags + skills, and records writeAudit on draft content", async () => {
    const event = makePutEvent(
      { type: "game_level", id: "101" },
      {
        tags: ["cnt", "visual"],
        skills: [{ skill_code: "C1.CNT.01", weight: 1.0 }],
      }
    );

    const res = await putTagsHandler(event);
    expect(res).toEqual({
      ok: true,
      entity_type: "game_level",
      entity_id: 101,
      tags: ["cnt", "visual"],
    });
    expect(mocks.validateContentSkillMap).toHaveBeenCalledWith([
      { skillId: 1, weight: 1.0 },
    ]);
    expect(mocks.validateAndAssignTags).toHaveBeenCalledTimes(1);
    expect(mocks.writeAudit).toHaveBeenCalledTimes(1);
  });
});
