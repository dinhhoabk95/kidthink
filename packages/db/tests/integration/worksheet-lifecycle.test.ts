import { eq, or } from "drizzle-orm";
import { afterEach, beforeEach, describe, expect, it } from "vitest";
import { getOwnerDb } from "#src/client";
import { activities, contentReviewLog, managers, worksheets } from "#src/index";
import { transitionContent } from "#src/services/content-lifecycle";
import {
  createNewWorksheetVersion,
  createWorksheetDraft,
  getWorksheetById,
  renderWorksheetArtifact,
} from "#src/services/worksheet";

const PUBLISH_CHECKLIST_FAILED_REGEX = /Publish checklist failed/;
const CANNOT_ARCHIVE_WORKSHEET_REGEX = /Không thể archive worksheet/;

describe("Worksheet Lifecycle & Render Evidence Integration Tests (Task #64 / P4.3)", () => {
  let managerId: number;

  const samplePatternColoring = {
    template: "pattern_coloring" as const,
    rule_sequence: ["circle", "square"],
    rows: [
      {
        row_id: "row_1",
        items: [
          { id: "1", shape: "circle" as const, is_blank: false, size_mm: 25 },
          { id: "2", shape: "square" as const, is_blank: false, size_mm: 25 },
          { id: "3", shape: "circle" as const, is_blank: true, size_mm: 25 },
        ],
      },
    ],
    stroke_pt: 2.5,
  };

  afterEach(async () => {
    const db = getOwnerDb();
    if (managerId) {
      await db
        .delete(contentReviewLog)
        .where(eq(contentReviewLog.actorManagerId, managerId))
        .catch(() => undefined);
      await db
        .delete(activities)
        .where(
          or(
            eq(activities.createdByManagerId, managerId),
            eq(activities.reviewedByManagerId, managerId)
          )
        )
        .catch(() => undefined);
      await db
        .delete(worksheets)
        .where(
          or(
            eq(worksheets.createdByManagerId, managerId),
            eq(worksheets.reviewedByManagerId, managerId)
          )
        )
        .catch(() => undefined);
      await db
        .delete(managers)
        .where(eq(managers.id, managerId))
        .catch(() => undefined);
    }
  });

  beforeEach(async () => {
    const db = getOwnerDb();
    // Create test manager
    const [mgr] = await db
      .insert(managers)
      .values({
        email: `worksheet_mgr_${Date.now()}_${Math.floor(Math.random() * 1_000_000)}@tinimath.test`,
        passwordHash: "dummy_hash_123",
        displayName: "Worksheet Reviewer",
        role: "super_admin",
      })
      .returning();
    managerId = mgr.id;
  });

  async function getUniqueWorksheetCode() {
    const db = getOwnerDb();
    while (true) {
      const code = `WS-${Math.floor(1000 + Math.random() * 8999)}`;
      const [existing] = await db
        .select({ id: worksheets.id })
        .from(worksheets)
        .where(eq(worksheets.code, code))
        .limit(1);
      if (!existing) {
        return code;
      }
    }
  }

  async function getUniqueActivityCode() {
    const db = getOwnerDb();
    while (true) {
      const code = `ACT-${Math.floor(1000 + Math.random() * 8999)}`;
      const [existing] = await db
        .select({ id: activities.id })
        .from(activities)
        .where(eq(activities.code, code))
        .limit(1);
      if (!existing) {
        return code;
      }
    }
  }

  it("triển khai quy trình trọn vẹn: Tạo draft -> Render -> Publish -> Tạo version mới -> Archive", async () => {
    // 1. Tạo draft worksheet
    const draftCode = await getUniqueWorksheetCode();
    const draft = await createWorksheetDraft(
      {
        code: draftCode,
        title: "Phiếu tô màu theo quy luật hình học",
        layout_template: "pattern_coloring",
        content_blocks: samplePatternColoring,
        instructions:
          "Hướng dẫn người lớn: Giúp trẻ quan sát quy luật và tô màu vào hình còn trống.",
        learning_objective_ids: [1],
        access_tier: "standard",
      },
      managerId
    );

    expect(draft.status).toBe("draft");
    expect(draft.contentVersion).toBe(1);
    expect(draft.renderStatus).toBe("pending");

    // 2. Chặn publish khi chưa render PDF (BR-WSM-06)
    // Chuyển draft -> in_review -> approved
    await transitionContent({
      entityType: "worksheet",
      entityDbId: draft.id,
      toStatus: "in_review",
      actorManagerId: managerId,
      actorRole: "super_admin",
    });
    await transitionContent({
      entityType: "worksheet",
      entityDbId: draft.id,
      toStatus: "approved",
      actorManagerId: managerId,
      actorRole: "super_admin",
    });

    // Thử publish khi chưa render -> chặn bởi Publish checklist failed (pdf_render_failed)
    await expect(
      transitionContent({
        entityType: "worksheet",
        entityDbId: draft.id,
        toStatus: "published",
        actorManagerId: managerId,
        actorRole: "super_admin",
      })
    ).rejects.toThrow(PUBLISH_CHECKLIST_FAILED_REGEX);

    // 3. Render vector PDF artifact và lưu evidence (D-P4J)
    const renderResult = await renderWorksheetArtifact(draft.id, managerId);
    expect(renderResult.worksheet.renderStatus).toBe("done");
    expect(renderResult.worksheet.renderPageCount).toBe(1);
    expect(renderResult.worksheet.renderGrayscalePassed).toBe(true);
    expect(renderResult.worksheet.renderInputHash).toBeTruthy();
    expect(renderResult.inspection.valid).toBe(true);

    // 4. Publish thành công sau khi có render evidence hợp lệ
    const publishResult = await transitionContent({
      entityType: "worksheet",
      entityDbId: draft.id,
      toStatus: "published",
      actorManagerId: managerId,
      actorRole: "super_admin",
    });
    expect(publishResult.success).toBe(true);
    expect(publishResult.status).toBe("published");

    const publishedWs = await getWorksheetById(draft.id);
    expect(publishedWs?.status).toBe("published");

    // 5. Tạo version v2 cho worksheet
    const v2Draft = await createNewWorksheetVersion(draft.code, managerId);
    expect(v2Draft.contentVersion).toBe(2);
    expect(v2Draft.status).toBe("draft");
    expect(v2Draft.renderStatus).toBe("pending");

    // 6. Render artifact cho version v2 & chuyển qua review/approved
    await renderWorksheetArtifact(v2Draft.id, managerId);
    await transitionContent({
      entityType: "worksheet",
      entityDbId: v2Draft.id,
      toStatus: "in_review",
      actorManagerId: managerId,
      actorRole: "super_admin",
    });
    await transitionContent({
      entityType: "worksheet",
      entityDbId: v2Draft.id,
      toStatus: "approved",
      actorManagerId: managerId,
      actorRole: "super_admin",
    });

    // 7. Publish version v2 -> bản v1 tự động chuyển sang 'archived'
    await transitionContent({
      entityType: "worksheet",
      entityDbId: v2Draft.id,
      toStatus: "published",
      actorManagerId: managerId,
      actorRole: "super_admin",
    });

    const oldVersion = await getWorksheetById(draft.id);
    expect(oldVersion?.status).toBe("archived");

    const newVersion = await getWorksheetById(v2Draft.id);
    expect(newVersion?.status).toBe("published");
  });

  it("chặn archive khi worksheet đang được sử dụng trong activity hoạt động (BR-WSM-06 / CONTENT_IN_USE)", async () => {
    const db = getOwnerDb();

    // 1. Tạo và publish worksheet
    const draftCode = await getUniqueWorksheetCode();
    const draft = await createWorksheetDraft(
      {
        code: draftCode,
        title: "Phiếu bài tập liên kết hoạt động",
        layout_template: "pattern_coloring",
        content_blocks: samplePatternColoring,
        instructions: "Hướng dẫn người lớn cho bài tập liên kết.",
        learning_objective_ids: [1],
        access_tier: "standard",
      },
      managerId
    );
    await renderWorksheetArtifact(draft.id, managerId);
    await transitionContent({
      entityType: "worksheet",
      entityDbId: draft.id,
      toStatus: "in_review",
      actorManagerId: managerId,
      actorRole: "super_admin",
    });
    await transitionContent({
      entityType: "worksheet",
      entityDbId: draft.id,
      toStatus: "approved",
      actorManagerId: managerId,
      actorRole: "super_admin",
    });
    await transitionContent({
      entityType: "worksheet",
      entityDbId: draft.id,
      toStatus: "published",
      actorManagerId: managerId,
      actorRole: "super_admin",
    });

    // 2. Tạo activity tham chiếu worksheet này
    const actCode = await getUniqueActivityCode();
    await db.insert(activities).values({
      entityId: Math.floor(100_000 + Math.random() * 800_000),
      code: actCode,
      contentVersion: 1,
      kind: "worksheet",
      title: "Hoạt động làm phiếu bài tập",
      instruction:
        'Cô hướng dẫn trẻ: "Con hãy quan sát hình và tô màu theo quy luật nhé!" Dễ hơn: Cô gợi ý hình tiếp theo. Khó hơn: Trẻ tự sáng tạo quy luật.',
      estimatedMinutes: 10,
      refType: "worksheet",
      refId: draft.id,
      accessTier: "standard",
      status: "published",
      createdByManagerId: managerId,
    });

    // 3. Cố gắng archive worksheet đang được dùng -> bị chặn bởi CONTENT_IN_USE (409)
    await expect(
      transitionContent({
        entityType: "worksheet",
        entityDbId: draft.id,
        toStatus: "archived",
        actorManagerId: managerId,
        actorRole: "super_admin",
      })
    ).rejects.toThrow(CANNOT_ARCHIVE_WORKSHEET_REGEX);
  });
});
