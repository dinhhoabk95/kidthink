import { randomBytes } from "node:crypto";
import { gzipSync } from "node:zlib";
import {
  gameLevelRounds,
  gameLevels,
  gameTemplates,
  getOwnerDb,
  playSessions,
} from "@mindkid/db";
import { resolveAssets } from "@mindkid/shared";
import { and, eq } from "drizzle-orm";
import { describe, expect, it } from "vitest";
import guestConfigHandler from "#server/api/guest/levels/[code]/config.get";
import managerConfigHandler from "#server/api/managers/levels/[code]/config.get";
import userConfigHandler from "#server/api/users/levels/[code]/config.get";

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
    path: url,
    url,
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
      params,
      ...(authContext?.user ? { user: authContext.user } : {}),
      ...(authContext?.manager ? { manager: authContext.manager } : {}),
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
    },
  };
}

function mockManagerAuth(managerId = 1) {
  return {
    manager: {
      manager_id: managerId,
      display_name: "Manager One",
      session_id: `mgr_sess_${managerId}`,
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
        name: "Chọn một đáp án",
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

  const contentVersion = options.contentVersion || 1;
  const existingLevels = await db
    .select({ id: gameLevels.id })
    .from(gameLevels)
    .where(
      and(
        eq(gameLevels.code, options.code),
        eq(gameLevels.contentVersion, contentVersion)
      )
    );

  for (const existing of existingLevels) {
    await db
      .delete(playSessions)
      .where(eq(playSessions.gameLevelId, existing.id));
    await db.delete(gameLevels).where(eq(gameLevels.id, existing.id));
  }

  const [level] = await db
    .insert(gameLevels)
    .values({
      entityId: Math.floor(Math.random() * 900_000) + 100_000,
      code: options.code,
      contentVersion,
      templateId: gt.id,
      title: "Level Test Config",
      instruction: "Hướng dẫn làm bài",
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

/**
 * Gieo `count` hàng `game_level_rounds` hợp lệ cho một level.
 *
 * Cần helper riêng vì không có chỗ nào trong repo ghi bảng này — seeder nội dung
 * insert bảy bảng và không có bảng vòng. Đó là lý do delivery chưa bao giờ thấy
 * một round set thật.
 */
async function seedTestRounds(gameLevelId: number, count: number) {
  const db = getOwnerDb();
  await db
    .delete(gameLevelRounds)
    .where(eq(gameLevelRounds.gameLevelId, gameLevelId));

  const rows = Array.from({ length: count }, (_, i) => ({
    gameLevelId,
    roundIndex: i,
    instruction: `Bé làm bước ${i + 1} nhé!`,
    contentPack: {
      prompt: "Bé hãy chọn quả táo đỏ",
      target_item: {
        item_id: `i${i}`,
        asset: { kind: "emoji", ref: "EMJ-red-apple" },
      },
      options: [
        {
          item_id: `i${i}`,
          asset: { kind: "emoji", ref: "EMJ-red-apple" },
          is_correct: true,
        },
        {
          item_id: `j${i}`,
          asset: { kind: "emoji", ref: "EMJ-green-apple" },
          is_correct: false,
        },
      ],
    },
    difficultyParams: {
      distractor_count: 1,
      hint_after_ms: 10_000,
      allow_retry: true,
      shuffle_items: true,
    },
    difficulty: Math.min(i + 1, 5),
  }));

  await db.insert(gameLevelRounds).values(rows);
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
      expect(res.layout_seed).toBeDefined();
      expect(typeof res.layout_seed).toBe("number");
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

      const event = mockEvent("GET", undefined, { code });
      const res = (await guestConfigHandler(event)) as any;

      expect(res.session.uuid).toBeDefined();
      expect(res.content_version).toBe(3);

      const db = getOwnerDb();
      const [created] = await db
        .select()
        .from(playSessions)
        .where(eq(playSessions.sessionUuid, res.session.uuid));

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

  /**
   * Ca âm của `BR-CFG-08`, thêm ở Task #167 WP167.0.
   *
   * Test "payload size is under 200 KB" ngay dưới đây đo **chính fixture nhỏ của
   * nó**, nên nó không bao giờ đỏ được dù server không có một dòng đo kích
   * thước nào. Đó là cổng xanh giả. `D-167A` nâng trần vòng lên 10, tức ngân
   * sách rơi về 20 KB một vòng, nên trần này phải có guard thật ở delivery.
   *
   * `item_id` của `GT-001` là `z.string()` không giới hạn, nên một pack vẫn
   * parse được mà vượt trần. Dùng base64 ngẫu nhiên vì gzip nén chuỗi lặp rất
   * tốt — một chuỗi 'a' dài 10 MB chỉ còn khoảng 10 KB.
   */
  describe("Task #167 WP167.0 — trần payload đo ở delivery (BR-CFG-08)", () => {
    it("chặn level có payload vượt 200 KB gzipped, kèm số byte đo được", async () => {
      const code = `GL-C1-CNT-OVER-${Math.floor(Math.random() * 8999 + 1000)}`;
      const incompressible = randomBytes(320 * 1024).toString("base64");

      await seedTestLevel({
        code,
        accessTier: "free",
        contentPack: {
          prompt: "Bé hãy chọn quả táo đỏ",
          target_item: {
            item_id: "i1",
            asset: { kind: "emoji", ref: "EMJ-red-apple" },
          },
          options: [
            {
              item_id: `i1-${incompressible}`,
              asset: { kind: "emoji", ref: "EMJ-red-apple" },
              is_correct: true,
            },
            {
              item_id: "i2",
              asset: { kind: "emoji", ref: "EMJ-green-apple" },
              is_correct: false,
            },
          ],
        },
      });

      const event = mockEvent("GET", undefined, { code });

      // `PAYLOAD_TOO_LARGE` đã có trong registry là **413**, không phải 422 —
      // mục 7 của `error-codes.md` để cột "Khi nào" rỗng vì nó là mã chung.
      await expect(guestConfigHandler(event)).rejects.toMatchObject({
        statusCode: 413,
        statusMessage: "PAYLOAD_TOO_LARGE",
      });
    });

    it("không tạo play_session khi chặn vì payload vượt trần", async () => {
      const code = `GL-C1-CNT-ORPH-${Math.floor(Math.random() * 8999 + 1000)}`;
      const incompressible = randomBytes(320 * 1024).toString("base64");

      const { level } = await seedTestLevel({
        code,
        accessTier: "free",
        contentPack: {
          prompt: "Bé hãy chọn quả táo đỏ",
          target_item: {
            item_id: "i1",
            asset: { kind: "emoji", ref: "EMJ-red-apple" },
          },
          options: [
            {
              item_id: `i1-${incompressible}`,
              asset: { kind: "emoji", ref: "EMJ-red-apple" },
              is_correct: true,
            },
            {
              item_id: "i2",
              asset: { kind: "emoji", ref: "EMJ-green-apple" },
              is_correct: false,
            },
          ],
        },
      });

      const event = mockEvent("GET", undefined, { code });
      await expect(guestConfigHandler(event)).rejects.toBeDefined();

      const db = getOwnerDb();
      const sessions = await db
        .select({ id: playSessions.id })
        .from(playSessions)
        .where(eq(playSessions.gameLevelId, level.id));

      expect(sessions).toHaveLength(0);
    });

    it("cho qua level dưới trần", async () => {
      const code = `GL-C1-CNT-UNDR-${Math.floor(Math.random() * 8999 + 1000)}`;
      await seedTestLevel({ code, accessTier: "free" });

      const event = mockEvent("GET", undefined, { code });
      await expect(guestConfigHandler(event)).resolves.toBeDefined();
    });
  });

  /**
   * `BR-RSM-09` tuyên set một vòng là **hợp lệ và là mặc định**, và `BR-RSP-02`
   * bắt phát `round_started` cho **mọi** set kể cả set một vòng. Nhưng tới
   * 2026-08-31 `game_level_rounds` không có writer nào trong repo, nên delivery
   * trả `rounds: []` cho mọi level, `scoring.mode` luôn là `attempts`, và nhánh
   * nhiều vòng ở `play/[code].vue` không bao giờ tới được.
   *
   * Đường sửa là dựng vòng mặc định ở delivery, để client chỉ còn **một** hình
   * dạng dữ liệu phải xử lý.
   */
  describe("Task #167 WP167.1 — rounds[] Cấm — NEVER rỗng", () => {
    it("dựng một vòng từ content_pack khi level không có hàng vòng nào", async () => {
      const code = `GL-C1-CNT-DFLT-${Math.floor(Math.random() * 8999 + 1000)}`;
      const { level } = await seedTestLevel({ code, accessTier: "free" });

      const event = mockEvent("GET", undefined, { code });
      const payload = (await guestConfigHandler(event)) as any;

      expect(payload.rounds).toHaveLength(1);
      expect(payload.rounds[0].round_index).toBe(0);
      expect(payload.rounds[0].content_pack).toEqual(level.contentPack);
      expect(payload.rounds[0].difficulty_params).toEqual(
        level.difficultyParams
      );
      expect(payload.rounds[0].instruction).toBe(level.instruction);
    });

    it("scoring.mode là rounds kể cả với set một vòng", async () => {
      const code = `GL-C1-CNT-MODE-${Math.floor(Math.random() * 8999 + 1000)}`;
      await seedTestLevel({ code, accessTier: "free" });

      const event = mockEvent("GET", undefined, { code });
      const payload = (await guestConfigHandler(event)) as any;

      expect(payload.scoring.mode).toBe("rounds");
    });

    it("giữ nguyên số vòng thật khi level đã có hàng vòng", async () => {
      const code = `GL-C1-CNT-REAL-${Math.floor(Math.random() * 8999 + 1000)}`;
      const { level } = await seedTestLevel({ code, accessTier: "free" });
      await seedTestRounds(level.id, 3);

      const event = mockEvent("GET", undefined, { code });
      const payload = (await guestConfigHandler(event)) as any;

      expect(payload.rounds).toHaveLength(3);
      expect(payload.rounds.map((r: any) => r.round_index)).toEqual([0, 1, 2]);
      expect(payload.rounds[1].instruction).toBe("Bé làm bước 2 nhé!");
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
