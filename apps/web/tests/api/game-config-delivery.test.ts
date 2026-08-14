import { gzipSync } from "node:zlib";
import {
  gameLevels,
  gameTemplates,
  getOwnerDb,
  playSessions,
} from "@kidthink/db";
import { resolveAssets } from "@kidthink/shared";
import { eq } from "drizzle-orm";
import { describe, expect, it } from "vitest";
import guestConfigHandler from "../../server/api/guest/levels/[code]/config.get.js";
import managerConfigHandler from "../../server/api/managers/levels/[code]/config.get.js";
import userConfigHandler from "../../server/api/users/levels/[code]/config.get.js";

function mockEvent(
  method: string,
  authContext?: { user?: any; manager?: any },
  params: Record<string, string> = {},
  query: Record<string, unknown> = {}
) {
  const responseHeaders: Record<string, string> = {};
  const statusCode = 200;

  const queryString = Object.entries(query)
    .map(
      ([k, v]) => `${encodeURIComponent(k)}=${encodeURIComponent(String(v))}`
    )
    .join("&");
  const path = params.code ? `/api/levels/${params.code}/config` : "/";
  const url = queryString ? `${path}?${queryString}` : path;

  return {
    method,
    path,
    node: {
      req: { headers: {}, url, originalUrl: url },
      res: {
        setHeader: (name: string, value: string) => {
          responseHeaders[name.toLowerCase()] = value;
        },
        getHeader: (name: string) => responseHeaders[name.toLowerCase()],
        statusCode,
      },
    },
    context: {
      ...(authContext?.user ? { user: authContext.user } : {}),
      ...(authContext?.manager ? { manager: authContext.manager } : {}),
      params,
      query,
    },
    query,
    __responseHeaders: responseHeaders,
  } as any;
}

function mockUserAuth(userId = 1) {
  return {
    user: {
      user_id: userId,
      display_name: "Test Parent",
      session_id: `user_sess_${userId}`,
      refresh_token_version: 1,
    },
  };
}

function mockManagerAuth(managerId = 1) {
  return {
    manager: {
      manager_id: managerId,
      display_name: "Manager One",
      session_id: `mgr_sess_${managerId}`,
      refresh_token_version: 1,
      role: "content_reviewer",
    },
  };
}

async function seedTestLevel(options: {
  code: string;
  accessTier?: "free" | "login" | "standard" | "premium";
  status?: "draft" | "published" | "archived";
  contentVersion?: number;
  contentPack?: any;
}) {
  const db = getOwnerDb();
  const gtCode = "GT-001";

  let [gt] = await db
    .select()
    .from(gameTemplates)
    .where(eq(gameTemplates.code, gtCode));

  if (!gt) {
    [gt] = await db
      .insert(gameTemplates)
      .values({
        code: gtCode,
        nameVi: "Chọn một đáp án",
        mechanic: "tap-select",
      })
      .returning();
  }

  const validGT001Pack = options.contentPack || {
    prompt: "Bé hãy chọn quả táo đỏ",
    target_item: {
      item_id: "i1",
      asset: { kind: "emoji", ref: "EMJ-red-apple" },
    },
    options: [
      {
        item_id: "i1",
        asset: { kind: "emoji", ref: "EMJ-red-apple" },
        is_correct: true,
      },
      {
        item_id: "i2",
        asset: { kind: "emoji", ref: "EMJ-green-apple" },
        is_correct: false,
      },
    ],
  };

  const [level] = await db
    .insert(gameLevels)
    .values({
      entityId: Math.floor(Math.random() * 900_000) + 100_000,
      code: options.code,
      contentVersion: options.contentVersion || 1,
      templateId: gt.id,
      titleVi: "Level Test Config",
      instructionVi: "Hướng dẫn làm bài",
      contentPack: validGT001Pack,
      difficultyParams: {
        distractor_count: 1,
        hint_after_ms: 10_000,
        allow_retry: true,
        shuffle_items: true,
      },
      accessTier: options.accessTier || "free",
      status: options.status || "published",
    })
    .returning();

  return { level, template: gt };
}

describe("Task P1.4 — Game Config Delivery End-to-End Suite", () => {
  describe("Task 1 — Server Asset Resolution (BR-CFG-07)", () => {
    it("resolves emoji, image, audio asset refs without hardcoding CDN strings in client", () => {
      const pack = {
        prompt_audio_ref: "AUD-prompt-1",
        target_item: {
          item_id: "i1",
          asset: { kind: "emoji", ref: "EMJ-red-apple" },
        },
      };

      const assets = resolveAssets(pack);
      expect(assets).toEqual(
        expect.arrayContaining([
          { ref: "EMJ-red-apple", kind: "emoji", glyph: "🍎" },
          { ref: "AUD-prompt-1", kind: "audio", error: "not_found" },
        ])
      );
    });
  });

  describe("Task 2 — Ba Route Config & Gating Matrix", () => {
    it("GET /api/guest/levels/[code]/config returns config for free level", async () => {
      const code = `GL-C1-CNT-TEST-${Math.floor(Math.random() * 8999 + 1000)}`;
      await seedTestLevel({ code, accessTier: "free" });

      const event = mockEvent("GET", undefined, { code });
      const res = (await guestConfigHandler(event)) as any;

      expect(res.level_code).toBe(code);
      expect(res.content_version).toBe(1);
      expect(res.template_code).toBe("GT-001");
      expect(res.session).toBeDefined();
      expect(res.session.uuid).toBeDefined();
      expect(res.assets).toBeDefined();
    });

    it("GET /api/guest/levels/[code]/config returns 403 TIER_LOCKED for premium level", async () => {
      const code = `GL-C1-CNT-PREM-${Math.floor(Math.random() * 8999 + 1000)}`;
      await seedTestLevel({ code, accessTier: "premium" });

      const event = mockEvent("GET", undefined, { code });
      try {
        await guestConfigHandler(event);
        expect.fail("Should throw 403");
      } catch (err: any) {
        expect(err.statusCode || err.status).toBe(403);
      }
    });

    it("GET /api/users/levels/[code]/config rejects request with 401 if unauthenticated", async () => {
      const code = `GL-C1-CNT-USER-${Math.floor(Math.random() * 8999 + 1000)}`;
      await seedTestLevel({ code, accessTier: "free" });

      const event = mockEvent("GET", undefined, { code });
      try {
        await userConfigHandler(event);
        expect.fail("Should throw 401");
      } catch (err: any) {
        expect(err.statusCode || err.status).toBe(401);
      }
    });

    it("GET /api/users/levels/[code]/config returns 428 NO_ACTIVE_CHILD if active_child_id cookie missing", async () => {
      const code = `GL-C1-CNT-USRA-${Math.floor(Math.random() * 8999 + 1000)}`;
      await seedTestLevel({ code, accessTier: "login" });

      const event = mockEvent("GET", mockUserAuth(99), { code });
      try {
        await userConfigHandler(event);
        expect.fail("Should throw 428");
      } catch (err: any) {
        expect(err.statusCode || err.status).toBe(428);
      }
    });

    it("GET /api/managers/levels/[code]/config?version= returns manager preview with is_preview = true", async () => {
      const code = `GL-C1-CNT-MGR-${Math.floor(Math.random() * 8999 + 1000)}`;
      await seedTestLevel({
        code,
        accessTier: "premium",
        status: "archived",
        contentVersion: 1,
      });
      await seedTestLevel({
        code,
        accessTier: "premium",
        status: "published",
        contentVersion: 2,
      });

      const event = mockEvent(
        "GET",
        mockManagerAuth(1),
        { code },
        { version: "1" }
      );

      const res = (await managerConfigHandler(event)) as any;
      expect(res.level_code).toBe(code);
      expect(res.content_version).toBe(1);
      expect(res.is_preview).toBe(true);
    });

    it("archived level returns 404 NOT_FOUND for new requests", async () => {
      const code = `GL-C1-CNT-ARCH-${Math.floor(Math.random() * 8999 + 1000)}`;
      await seedTestLevel({ code, status: "archived" });

      const event = mockEvent("GET", undefined, { code });
      try {
        await guestConfigHandler(event);
        expect.fail("Should throw 404");
      } catch (err: any) {
        expect(err.statusCode || err.status).toBe(404);
      }
    });
  });

  describe("Task 3 — Content Pack Validation & Error Handling (BR-CFG-03 / D-FS)", () => {
    it("returns 500 CONTENT_PACK_INVALID when content_pack in DB is invalid schema", async () => {
      const code = `GL-C1-CNT-BAD-${Math.floor(Math.random() * 8999 + 1000)}`;
      const corruptedPack = { invalid: "schema_without_required_fields" };
      await seedTestLevel({
        code,
        accessTier: "free",
        contentPack: corruptedPack,
      });

      const event = mockEvent("GET", undefined, { code });
      try {
        await guestConfigHandler(event);
        expect.fail("Should throw 500 CONTENT_PACK_INVALID");
      } catch (err: any) {
        expect(err.statusCode || err.status).toBe(500);
        expect(err.data?.code || err.statusMessage).toBe(
          "CONTENT_PACK_INVALID"
        );
      }
    });
  });

  describe("Task 4 — Minimum Session Row Creation (D-FR & BR-CFG-02)", () => {
    it("creates exactly one row in play_sessions table with content_version pinned", async () => {
      const code = `GL-C1-CNT-SESS-${Math.floor(Math.random() * 8999 + 1000)}`;
      await seedTestLevel({ code, accessTier: "free", contentVersion: 3 });

      const db = getOwnerDb();
      const initialCount = (await db.select().from(playSessions)).length;

      const event = mockEvent("GET", undefined, { code });
      const res = (await guestConfigHandler(event)) as any;

      expect(res.session.uuid).toBeDefined();
      expect(res.content_version).toBe(3);

      const newSessions = await db.select().from(playSessions);
      expect(newSessions.length).toBe(initialCount + 1);

      const created = newSessions.find(
        (s) => s.sessionUuid === res.session.uuid
      );
      expect(created).toBeDefined();
      expect(created?.contentVersion).toBe(3);
      expect(created?.isPreview).toBe(false);
    });

    it("creates session with is_preview = true for manager preview", async () => {
      const code = `GL-C1-CNT-PRV-${Math.floor(Math.random() * 8999 + 1000)}`;
      await seedTestLevel({ code, accessTier: "premium" });

      const event = mockEvent("GET", mockManagerAuth(1), { code });
      const res = (await managerConfigHandler(event)) as any;

      const db = getOwnerDb();
      const [sessionRow] = await db
        .select()
        .from(playSessions)
        .where(eq(playSessions.sessionUuid, res.session.uuid));

      expect(sessionRow.isPreview).toBe(true);
    });
  });

  describe("Task 5 — Dual Cache Modes (BR-CFG-04, BR-CFG-05, D-FT)", () => {
    it("sets Cache-Control: public, max-age=300 for free level (BR-CFG-05)", async () => {
      const code = `GL-C1-CNT-FREE-${Math.floor(Math.random() * 8999 + 1000)}`;
      await seedTestLevel({ code, accessTier: "free" });

      const event = mockEvent("GET", undefined, { code });
      await guestConfigHandler(event);

      const cacheHeader = event.__responseHeaders["cache-control"];
      expect(cacheHeader).toBe("public, max-age=300");
    });

    it("sets Cache-Control: private, no-store for login/premium level (BR-CFG-04)", async () => {
      const code = `GL-C1-CNT-NOST-${Math.floor(Math.random() * 8999 + 1000)}`;
      await seedTestLevel({ code, accessTier: "login" });

      const event = mockEvent("GET", mockManagerAuth(1), { code });
      await managerConfigHandler(event);

      const cacheHeader = event.__responseHeaders["cache-control"];
      expect(cacheHeader).toBe("private, no-store");
    });

    it("D-FT negative test 1: fails if premium level returns public cache", async () => {
      const code = `GL-C1-CNT-NEGA-${Math.floor(Math.random() * 8999 + 1000)}`;
      await seedTestLevel({ code, accessTier: "premium" });

      const event = mockEvent("GET", mockManagerAuth(1), { code });
      await managerConfigHandler(event);

      const cacheHeader = event.__responseHeaders["cache-control"];
      expect(cacheHeader).not.toContain("public");
    });

    it("D-FT negative test 2: fails if free level returns no-store", async () => {
      const code = `GL-C1-CNT-NEGB-${Math.floor(Math.random() * 8999 + 1000)}`;
      await seedTestLevel({ code, accessTier: "free" });

      const event = mockEvent("GET", undefined, { code });
      await guestConfigHandler(event);

      const cacheHeader = event.__responseHeaders["cache-control"];
      expect(cacheHeader).not.toContain("no-store");
    });
  });

  describe("Task 6 — Payload Budget & Preload (BR-CFG-08 & BR-CFG-01)", () => {
    it("BR-CFG-08: payload size is under 200 KB gzipped", async () => {
      const code = `GL-C1-CNT-BDGT-${Math.floor(Math.random() * 8999 + 1000)}`;
      await seedTestLevel({ code, accessTier: "free" });

      const event = mockEvent("GET", undefined, { code });
      const payload = await guestConfigHandler(event);

      const jsonStr = JSON.stringify(payload);
      const gzippedBuffer = gzipSync(Buffer.from(jsonStr));
      const sizeKb = gzippedBuffer.length / 1024;

      expect(sizeKb).toBeLessThanOrEqual(200);
    });

    it("BR-CFG-01: payload contains all details needed for full play session without mid-game fetches", async () => {
      const code = `GL-C1-CNT-FULL-${Math.floor(Math.random() * 8999 + 1000)}`;
      await seedTestLevel({ code, accessTier: "free" });

      const event = mockEvent("GET", undefined, { code });
      const payload = (await guestConfigHandler(event)) as any;

      expect(payload.content_pack).toBeDefined();
      expect(payload.difficulty_params).toBeDefined();
      expect(payload.scoring).toBeDefined();
      expect(payload.session.uuid).toBeDefined();
      expect(payload.assets).toBeDefined();
    });
  });
});
