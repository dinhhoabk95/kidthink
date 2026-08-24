/**
 * Worksheet Service for Content Operations & Entitlement-Gated Downloads (Task P4.3 / Task #64)
 *
 * Spec sở hữu: docs/specs/05-content/worksheet-model.md
 * Business rules: BR-WSM-01..08, D-P4I, D-P4J, D-P4L
 */

import type {
  AccessTier,
  ContentLifecycleStatus,
  WorksheetFormInput,
  WorksheetLayoutTemplate,
} from "@mindkid/shared";
import { validateWorksheetContent } from "@mindkid/shared";
import { and, desc, eq, ilike, or, type SQL, sql } from "drizzle-orm";
import { getOwnerDb } from "#src/client";
import { worksheets } from "#src/schema/content";
import { writeAudit } from "./audit.ts";
import {
  computeWorksheetRenderHash,
  inspectWorksheetPdf,
  renderWorksheetPdf,
  type WorksheetPhysicalInspectionResult,
} from "./worksheet-renderer.ts";

export class WorksheetServiceError extends Error {
  readonly statusCode: number;
  readonly details?: unknown;

  constructor(message: string, statusCode = 500, details?: unknown) {
    super(message);
    this.name = "WorksheetServiceError";
    this.statusCode = statusCode;
    this.details = details;
  }
}

export interface ListWorksheetsOptions {
  layoutTemplate?: string;
  status?: string;
  accessTier?: string;
  search?: string;
  limit?: number;
  offset?: number;
}

export function generateWorksheetCode(existingCount: number): string {
  const numStr = String(existingCount + 1).padStart(4, "0");
  return `WS-${numStr}`;
}

/**
 * Lists worksheets with optional filters
 */
export async function listWorksheets(options: ListWorksheetsOptions = {}) {
  const db = getOwnerDb();
  const conditions: SQL[] = [];

  if (options.layoutTemplate) {
    conditions.push(
      eq(
        worksheets.layoutTemplate,
        options.layoutTemplate as WorksheetLayoutTemplate
      )
    );
  }
  if (options.status) {
    conditions.push(
      eq(worksheets.status, options.status as ContentLifecycleStatus)
    );
  }
  if (options.accessTier) {
    conditions.push(
      eq(worksheets.accessTier, options.accessTier as AccessTier)
    );
  }
  if (options.search) {
    conditions.push(
      or(
        ilike(worksheets.code, `%${options.search}%`),
        ilike(worksheets.title, `%${options.search}%`)
      ) as SQL
    );
  }

  const query = db
    .select()
    .from(worksheets)
    .orderBy(desc(worksheets.updatedAt))
    .limit(options.limit || 50)
    .offset(options.offset || 0);

  if (conditions.length > 0) {
    return await query.where(and(...conditions));
  }
  return await query;
}

/**
 * Retrieves worksheet by code (latest version or specified version)
 */
export async function getWorksheetByCode(code: string, version?: number) {
  const db = getOwnerDb();
  const conditions = [eq(worksheets.code, code)];
  if (version !== undefined) {
    conditions.push(eq(worksheets.contentVersion, version));
  }

  const [ws] = await db
    .select()
    .from(worksheets)
    .where(and(...conditions))
    .orderBy(desc(worksheets.contentVersion))
    .limit(1);

  return ws || null;
}

/**
 * Retrieves currently published worksheet by code
 */
export async function getPublishedWorksheetByCode(code: string) {
  const db = getOwnerDb();
  const [ws] = await db
    .select()
    .from(worksheets)
    .where(and(eq(worksheets.code, code), eq(worksheets.status, "published")))
    .orderBy(desc(worksheets.contentVersion))
    .limit(1);

  return ws || null;
}

/**
 * Retrieves worksheet by DB primary key id
 */
export async function getWorksheetById(id: number) {
  const db = getOwnerDb();
  const [ws] = await db
    .select()
    .from(worksheets)
    .where(eq(worksheets.id, id))
    .limit(1);
  return ws || null;
}

/**
 * Creates a new draft worksheet
 */
export async function createWorksheetDraft(
  input: WorksheetFormInput,
  managerId: number
) {
  const validation = validateWorksheetContent({
    title: input.title,
    layout_template: input.layout_template,
    content_blocks: input.content_blocks,
    instructions: input.instructions,
    learning_objective_ids: input.learning_objective_ids,
  });

  if (!validation.ok) {
    throw new WorksheetServiceError(
      `VALIDATION_FAILED: ${validation.errors.join("; ")}`,
      422,
      validation.errors
    );
  }

  const db = getOwnerDb();
  return await db.transaction(async (tx) => {
    const countRes = await tx
      .select({ count: sql<number>`count(*)` })
      .from(worksheets);
    const totalCount = Number(countRes[0]?.count || 0);
    const code = input.code || generateWorksheetCode(totalCount);
    const entityId = Date.now();

    const [created] = await tx
      .insert(worksheets)
      .values({
        entityId,
        code,
        contentVersion: 1,
        title: input.title,
        layoutTemplate: input.layout_template,
        contentBlocks: input.content_blocks,
        instructions: input.instructions,
        learningObjectiveIds: input.learning_objective_ids,
        accessTier: input.access_tier,
        status: "draft",
        origin: "human",
        authoredIn: "studio",
        renderStatus: "pending",
        createdByManagerId: managerId,
      })
      .returning();

    if (!created) {
      throw new WorksheetServiceError("Failed to create worksheet", 500);
    }

    await writeAudit(tx, {
      actor_type: "manager",
      actor_id: managerId,
      action: "content_created",
      entity_type: "worksheet",
      entity_id: String(created.id),
      after_data: created,
      reason: "Manager created worksheet draft via Studio",
    });

    return created;
  });
}

/**
 * Updates a draft worksheet
 */
export async function updateWorksheetDraft(
  id: number,
  input: Partial<WorksheetFormInput>,
  managerId: number
) {
  const db = getOwnerDb();
  const existing = await getWorksheetById(id);
  if (!existing) {
    throw new WorksheetServiceError(`Worksheet with id ${id} not found`, 404);
  }

  if (existing.status !== "draft" && existing.status !== "rejected") {
    throw new WorksheetServiceError(
      `Cannot directly edit worksheet in '${existing.status}' state. Create a new version first.`,
      409
    );
  }

  const mergedTitle = input.title ?? existing.title;
  const mergedTemplate = input.layout_template ?? existing.layoutTemplate;
  const mergedBlocks = input.content_blocks ?? existing.contentBlocks;
  const mergedInstructions = input.instructions ?? existing.instructions;
  const mergedObjectives =
    input.learning_objective_ids ??
    (existing.learningObjectiveIds as number[]) ??
    [];

  const validation = validateWorksheetContent({
    title: mergedTitle,
    layout_template: mergedTemplate,
    content_blocks: mergedBlocks,
    instructions: mergedInstructions,
    learning_objective_ids: mergedObjectives,
  });

  if (!validation.ok) {
    throw new WorksheetServiceError(
      `VALIDATION_FAILED: ${validation.errors.join("; ")}`,
      422,
      validation.errors
    );
  }

  const patch: Record<string, unknown> = {
    title: mergedTitle,
    layoutTemplate: mergedTemplate,
    contentBlocks: mergedBlocks,
    instructions: mergedInstructions,
    learningObjectiveIds: mergedObjectives,
    accessTier: input.access_tier ?? existing.accessTier,
    updatedAt: new Date(),
  };

  // If content blocks or instructions changed, mark render as stale
  const currentHash = computeWorksheetRenderHash(
    mergedBlocks,
    mergedInstructions
  );
  if (existing.renderInputHash && existing.renderInputHash !== currentHash) {
    patch.renderStatus = "stale";
  }

  return await db.transaction(async (tx) => {
    const [updated] = await tx
      .update(worksheets)
      .set(patch)
      .where(eq(worksheets.id, id))
      .returning();

    if (!updated) {
      throw new WorksheetServiceError("Failed to update worksheet", 500);
    }

    await writeAudit(tx, {
      actor_type: "manager",
      actor_id: managerId,
      action: "content_submitted",
      entity_type: "worksheet",
      entity_id: String(id),
      before_data: existing,
      after_data: updated,
      reason: "Manager updated worksheet draft",
    });

    return updated;
  });
}

/**
 * Creates a new version (N+1) of a published or archived worksheet
 */
export async function createNewWorksheetVersion(
  code: string,
  managerId: number
) {
  const db = getOwnerDb();
  const [latest] = await db
    .select()
    .from(worksheets)
    .where(eq(worksheets.code, code))
    .orderBy(desc(worksheets.contentVersion))
    .limit(1);

  if (!latest) {
    throw new WorksheetServiceError(
      `Worksheet with code ${code} not found`,
      404
    );
  }

  const newVersion = latest.contentVersion + 1;

  return await db.transaction(async (tx) => {
    const [created] = await tx
      .insert(worksheets)
      .values({
        entityId: latest.entityId,
        code: latest.code,
        contentVersion: newVersion,
        title: latest.title,
        layoutTemplate: latest.layoutTemplate,
        contentBlocks: latest.contentBlocks,
        instructions: latest.instructions,
        learningObjectiveIds: latest.learningObjectiveIds,
        accessTier: latest.accessTier,
        status: "draft",
        origin: "human",
        authoredIn: "studio",
        renderStatus: "pending",
        createdByManagerId: managerId,
      })
      .returning();

    if (!created) {
      throw new WorksheetServiceError("Failed to create new version", 500);
    }

    await writeAudit(tx, {
      actor_type: "manager",
      actor_id: managerId,
      action: "content_created",
      entity_type: "worksheet",
      entity_id: String(created.id),
      after_data: created,
      reason: `Created version v${newVersion} for worksheet ${code}`,
    });

    return created;
  });
}

/**
 * Renders vector PDF artifact for worksheet and stores render evidence (D-P4J, BR-WSM-06)
 */
export async function renderWorksheetArtifact(
  id: number,
  managerId: number
): Promise<{
  worksheet: typeof worksheets.$inferSelect;
  pdfBuffer: Buffer;
  inspection: WorksheetPhysicalInspectionResult;
}> {
  const db = getOwnerDb();
  const ws = await getWorksheetById(id);
  if (!ws) {
    throw new WorksheetServiceError(`Worksheet with id ${id} not found`, 404);
  }

  const renderResult = renderWorksheetPdf({
    code: ws.code,
    version: ws.contentVersion,
    title: ws.title,
    layout_template: ws.layoutTemplate,
    content_blocks: ws.contentBlocks,
    instructions: ws.instructions || "",
  });

  const inspection = inspectWorksheetPdf(renderResult.pdfBuffer);
  if (!inspection.valid) {
    throw new WorksheetServiceError(
      `PHYSICAL_INSPECTION_FAILED: ${inspection.errors.join("; ")}`,
      422,
      inspection.errors
    );
  }

  const pdfPath = `s3://tinimath-content/worksheets/${ws.code}/v${ws.contentVersion}.pdf`;
  const previewPath = `/api/managers/worksheets/${ws.code}/preview`;

  const updated = await db.transaction(async (tx) => {
    const [res] = await tx
      .update(worksheets)
      .set({
        pdfPath,
        previewPath,
        renderStatus: "done",
        renderJobId: `job_${Date.now()}`,
        renderInputHash: renderResult.inputHash,
        sourceContentVersion: ws.contentVersion,
        renderPageCount: renderResult.pageCount,
        renderGrayscalePassed: renderResult.grayscalePassed,
        updatedAt: new Date(),
      })
      .where(eq(worksheets.id, id))
      .returning();

    if (!res) {
      throw new WorksheetServiceError("Failed to update render status", 500);
    }

    await writeAudit(tx, {
      actor_type: "manager",
      actor_id: managerId,
      action: "content_submitted",
      entity_type: "worksheet",
      entity_id: String(id),
      after_data: {
        render_status: "done",
        pdf_path: pdfPath,
        render_input_hash: renderResult.inputHash,
        page_count: renderResult.pageCount,
      },
      reason: `Rendered vector PDF artifact for worksheet ${ws.code} v${ws.contentVersion}`,
    });

    return res;
  });

  return {
    worksheet: updated,
    pdfBuffer: renderResult.pdfBuffer,
    inspection,
  };
}
