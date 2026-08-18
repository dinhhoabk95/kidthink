import {
  entitlementKeys,
  entitlements,
  getOwnerDb,
  managers,
  users,
  worksheets,
} from "@mindkid/db";
import { ENTITLEMENT_KEYS } from "@mindkid/shared";
import { eq } from "drizzle-orm";
import { beforeEach, describe, expect, it } from "vitest";
import getWorksheetByCodeHandler from "../../server/api/managers/worksheets/[code]/index.get.js";
import getWorksheetPreviewHandler from "../../server/api/managers/worksheets/[code]/preview.get.js";
import renderWorksheetHandler from "../../server/api/managers/worksheets/[code]/render.post.js";
import listWorksheetsHandler from "../../server/api/managers/worksheets/index.get.js";
import createWorksheetHandler from "../../server/api/managers/worksheets/index.post.js";
import userDownloadWorksheetPdfHandler from "../../server/api/users/worksheets/[code]/pdf.get.js";
import {
  invalidateUserEntitlementsCache,
  mutateUserEntitlements,
} from "../../server/utils/entitlements-runtime.js";

const CSRF_TOKEN =
  "0123456789abcdef0123456789abcdef0123456789abcdef0123456789abcdef";

let testManagerId = 1;
let testUserId = 1;

async function getUniqueWorksheetCode() {
  const db = getOwnerDb();
  while (true) {
    const candidate = `WS-${String(Math.floor(1000 + Math.random() * 8999))}`;
    const [existing] = await db
      .select({ id: worksheets.id })
      .from(worksheets)
      .where(eq(worksheets.code, candidate))
      .limit(1);
    if (!existing) {
      return candidate;
    }
  }
}

beforeEach(async () => {
  const db = getOwnerDb();
  if (testUserId) {
    await db.delete(entitlements).where(eq(entitlements.userId, testUserId));
  }

  // Ensure entitlement keys
  for (const k of ENTITLEMENT_KEYS) {
    await db
      .insert(entitlementKeys)
      .values({
        key: k.key,
        group: k.group as any,
        label: k.label,
        isMvp: k.is_mvp,
      })
      .onConflictDoNothing();
  }

  // Ensure test manager
  let [mgr] = await db
    .select({ id: managers.id })
    .from(managers)
    .where(eq(managers.email, "worksheet-tester@mindkid.edu.vn"));
  if (!mgr) {
    [mgr] = await db
      .insert(managers)
      .values({
        email: "worksheet-tester@mindkid.edu.vn",
        passwordHash: "hash",
        displayName: "Worksheet Studio Tester",
        role: "super_admin",
        isActive: true,
      })
      .onConflictDoUpdate({
        target: managers.email,
        set: { displayName: "Worksheet Studio Tester" },
      })
      .returning({ id: managers.id });
  }
  if (mgr) {
    testManagerId = mgr.id;
  }

  // Ensure test user
  let [u] = await db
    .select({ id: users.id })
    .from(users)
    .where(eq(users.email, "parent-worksheet-tester@mindkid.edu.vn"));
  if (!u) {
    [u] = await db
      .insert(users)
      .values({
        email: "parent-worksheet-tester@mindkid.edu.vn",
        passwordHash: "hash",
        displayName: "Parent Tester",
        isActive: true,
      })
      .onConflictDoUpdate({
        target: users.email,
        set: { displayName: "Parent Tester" },
      })
      .returning({ id: users.id });
  }
  if (u) {
    testUserId = u.id;
    await invalidateUserEntitlementsCache(testUserId);
  }
});

function mockManagerEvent(
  method: string,
  params: Record<string, string> = {},
  body?: unknown,
  query: Record<string, string> = {}
) {
  const headersMap: Record<string, string> = {};
  return {
    method,
    node: {
      req: {
        headers: {
          "user-agent": "VitestTestRunner/1.0",
          "x-csrf-token": CSRF_TOKEN,
          cookie: `tm_m_csrf=${CSRF_TOKEN}`,
        },
      },
      res: {
        setHeader: (k: string, v: string) => {
          headersMap[k.toLowerCase()] = v;
        },
        getHeader: (k: string) => headersMap[k.toLowerCase()],
      },
    },
    context: {
      manager: {
        id: testManagerId,
        manager_id: testManagerId,
        display_name: "Worksheet Studio Tester",
        session_id: "sess_mgr_ws",
        role: "super_admin",
      },
      params,
      body,
    },
    query,
    _body: body,
  } as any;
}

function mockUserEvent(
  method: string,
  userId?: number,
  params: Record<string, string> = {},
  query: Record<string, string> = {}
) {
  const headersMap: Record<string, string> = {};
  return {
    method,
    node: {
      req: {
        headers: {
          "user-agent": "VitestTestRunner/1.0",
          "x-csrf-token": CSRF_TOKEN,
          cookie: `tm_u_csrf=${CSRF_TOKEN}`,
        },
      },
      res: {
        setHeader: (k: string, v: string) => {
          headersMap[k.toLowerCase()] = v;
        },
        getHeader: (k: string) => headersMap[k.toLowerCase()],
      },
    },
    context: {
      ...(userId
        ? {
            user: {
              id: userId,
              user_id: userId,
              display_name: "Parent Tester",
              session_id: "sess_user_ws",
            },
          }
        : {}),
      params,
    },
    query,
  } as any;
}

describe("Worksheet Studio & Download APIs (BR-WSM-01..08, Task #64 / P4.3)", () => {
  const sampleBlocks = {
    template: "pattern_coloring",
    rule_sequence: ["circle", "triangle"],
    rows: [
      {
        row_id: "r1",
        items: [
          { id: "1", shape: "circle", is_blank: false, size_mm: 25 },
          { id: "2", shape: "triangle", is_blank: false, size_mm: 25 },
          { id: "3", shape: "circle", is_blank: true, size_mm: 25 },
        ],
      },
    ],
    stroke_pt: 2.5,
  };

  it("POST /api/managers/worksheets tạo phiếu bài tập draft mới hợp lệ", async () => {
    const code = await getUniqueWorksheetCode();
    const event = mockManagerEvent(
      "POST",
      {},
      {
        code,
        title: "Phiếu tô màu quy luật",
        layout_template: "pattern_coloring",
        content_blocks: sampleBlocks,
        instructions:
          "Hướng dẫn người lớn: Giúp trẻ quan sát quy luật và dùng bút sáp tô màu vào hình còn trống.",
        learning_objective_ids: [1],
        access_tier: "standard",
      }
    );

    const res = (await createWorksheetHandler(event)) as any;
    expect(res).toBeDefined();
    expect(res.code).toBe(code);
    expect(res.contentVersion).toBe(1);
    expect(res.status).toBe("draft");
    expect(res.renderStatus).toBe("pending");
  });

  it("POST /api/managers/worksheets từ chối khi nội dung vi phạm schema", async () => {
    const event = mockManagerEvent(
      "POST",
      {},
      {
        code: "INVALID-CODE",
        title: "Sai mã",
        layout_template: "pattern_coloring",
        content_blocks: {},
      }
    );

    await expect(createWorksheetHandler(event)).rejects.toThrow();
  });

  it("GET /api/managers/worksheets và GET /api/managers/worksheets/[code] lấy danh sách và chi tiết", async () => {
    const code = await getUniqueWorksheetCode();
    await createWorksheetHandler(
      mockManagerEvent(
        "POST",
        {},
        {
          code,
          title: "Phiếu danh sách test",
          layout_template: "pattern_coloring",
          content_blocks: sampleBlocks,
          instructions: "Hướng dẫn người lớn.",
          learning_objective_ids: [1],
          access_tier: "free",
        }
      )
    );

    // List
    const listEvent = mockManagerEvent("GET", {}, undefined, { search: code });
    const listRes = (await listWorksheetsHandler(listEvent)) as any;
    expect(listRes.items.some((w: any) => w.code === code)).toBe(true);

    // Detail
    const detailEvent = mockManagerEvent("GET", { code });
    const detailRes = (await getWorksheetByCodeHandler(detailEvent)) as any;
    expect(detailRes.code).toBe(code);
    expect(detailRes.title).toBe("Phiếu danh sách test");
  });

  it("POST /api/managers/worksheets/[code]/render thực thi render PDF và lưu bằng chứng", async () => {
    const code = await getUniqueWorksheetCode();
    await createWorksheetHandler(
      mockManagerEvent(
        "POST",
        {},
        {
          code,
          title: "Phiếu render test",
          layout_template: "pattern_coloring",
          content_blocks: sampleBlocks,
          instructions: "Hướng dẫn người lớn quan sát.",
          learning_objective_ids: [1],
          access_tier: "standard",
        }
      )
    );

    const renderEvent = mockManagerEvent("POST", { code });
    const renderRes = (await renderWorksheetHandler(renderEvent)) as any;
    expect(renderRes.success).toBe(true);
    expect(renderRes.render_evidence.render_status).toBe("done");
    expect(renderRes.render_evidence.render_page_count).toBe(1);
    expect(renderRes.render_evidence.render_grayscale_passed).toBe(true);
    expect(renderRes.inspection.valid).toBe(true);
  });

  it("GET /api/managers/worksheets/[code]/preview trả về buffer vector PDF", async () => {
    const code = await getUniqueWorksheetCode();
    await createWorksheetHandler(
      mockManagerEvent(
        "POST",
        {},
        {
          code,
          title: "Phiếu preview test",
          layout_template: "pattern_coloring",
          content_blocks: sampleBlocks,
          instructions: "Hướng dẫn người lớn.",
          learning_objective_ids: [1],
          access_tier: "standard",
        }
      )
    );

    const previewEvent = mockManagerEvent("GET", { code });
    const buffer = (await getWorksheetPreviewHandler(previewEvent)) as any;
    expect(buffer).toBeInstanceOf(Buffer);
    expect(previewEvent.node.res.getHeader("content-type")).toBe(
      "application/pdf"
    );
  });

  it("GET /api/users/worksheets/[code]/pdf kiểm soát quyền tải và trả PDF cho user được cấp quyền", async () => {
    const db = getOwnerDb();
    const code = await getUniqueWorksheetCode();

    // 1. Tạo worksheet và render & transition sang published
    const created = (await createWorksheetHandler(
      mockManagerEvent(
        "POST",
        {},
        {
          code,
          title: "Phiếu tải về chuẩn",
          layout_template: "pattern_coloring",
          content_blocks: sampleBlocks,
          instructions: "Hướng dẫn người lớn chi tiết.",
          learning_objective_ids: [1],
          access_tier: "standard",
        }
      )
    )) as any;

    await renderWorksheetHandler(mockManagerEvent("POST", { code }));

    // Cập nhật trạng thái published để user có thể truy cập
    const { worksheets } = await import("@mindkid/db");
    await db
      .update(worksheets)
      .set({ status: "published", publishedAt: new Date() })
      .where(eq(worksheets.id, created.id));

    // 2. Chưa đăng nhập -> 401
    const anonEvent = mockUserEvent("GET", undefined, { code });
    await expect(userDownloadWorksheetPdfHandler(anonEvent)).rejects.toThrow();

    // 3. Đã đăng nhập nhưng chưa có quyền standard -> 403
    const userNoEntitlementEvt = mockUserEvent("GET", testUserId, { code });
    try {
      await userDownloadWorksheetPdfHandler(userNoEntitlementEvt);
      expect.fail("Should have thrown 403 TIER_LOCKED");
    } catch (err: any) {
      expect(err.statusCode || err.status).toBe(403);
    }

    // 4. Cấp gói standard cho user
    await mutateUserEntitlements({
      userId: testUserId,
      packageCode: "PKG-standard",
      durationDays: 30,
      source: "package_order",
      reason: "Mua gói standard thành công",
      actor: { type: "system" },
    });

    // 5. Tải thành công PDF 1 trang A4
    const userEntitledEvt = mockUserEvent("GET", testUserId, { code });
    const pdfResult = (await userDownloadWorksheetPdfHandler(
      userEntitledEvt
    )) as any;
    expect(pdfResult).toBeInstanceOf(Buffer);
    expect(userEntitledEvt.node.res.getHeader("content-type")).toBe(
      "application/pdf"
    );
    expect(userEntitledEvt.node.res.getHeader("cache-control")).toContain(
      "private, no-store"
    );
  });
});
