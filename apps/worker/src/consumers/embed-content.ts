import {
  activities,
  contentEmbeddings,
  contentTagMap,
  contentTags,
  gameLevels,
  getOwnerDb,
  lessons,
} from "@mindkid/db";
import type { JobPayloads } from "@mindkid/queue";
import {
  DEFAULT_EMBEDDING_DIMENSION,
  DEFAULT_EMBEDDING_MODEL,
} from "@mindkid/shared";
import { and, eq } from "drizzle-orm";
import { logJobDone } from "#src/log";
import type { Consumer } from "./types.js";

export type EmbedContentPayload = JobPayloads["embed:content"];

const WHITESPACE_SPLIT_RE = /\s+/;

export interface EmbeddingSourceInput {
  title: string;
  description?: string | null;
  instruction?: string | null;
  tagLabels?: string[];
}

export interface UpsertContentEmbeddingRecord {
  contentType: string;
  contentId: number;
  contentVersion: number;
  model: string;
  chunkIndex: number;
  chunkText: string;
  embedding: number[];
}

export interface EmbedContentDeps {
  loadSourceText: (payload: EmbedContentPayload) => Promise<string>;
  generateEmbedding: (text: string, model: string) => Promise<number[]>;
  upsertEmbedding: (record: UpsertContentEmbeddingRecord) => Promise<void>;
}

let activeDepsOverride: Partial<EmbedContentDeps> | null = null;

export function setEmbedContentDeps(
  deps: Partial<EmbedContentDeps> | null
): void {
  activeDepsOverride = deps;
}

export function composeEmbeddingSourceText(
  input: EmbeddingSourceInput
): string {
  const parts: string[] = [input.title.trim()];
  if (input.description?.trim()) {
    parts.push(input.description.trim());
  }
  if (input.instruction?.trim()) {
    parts.push(input.instruction.trim());
  }
  if (input.tagLabels && input.tagLabels.length > 0) {
    const cleanTags = input.tagLabels
      .map((label) => label.trim())
      .filter(Boolean);
    if (cleanTags.length > 0) {
      parts.push(`Thẻ nội dung: ${cleanTags.join(", ")}`);
    }
  }
  return parts.filter(Boolean).join("\n");
}

export function generateDeterministicEmbedding(
  text: string,
  dimensions: number = DEFAULT_EMBEDDING_DIMENSION
): number[] {
  const normalizedText = text.trim().toLowerCase();
  const vec = new Array<number>(dimensions).fill(0);
  if (!normalizedText) {
    vec[0] = 1;
    return vec;
  }

  const tokens = normalizedText.split(WHITESPACE_SPLIT_RE).filter(Boolean);
  for (const token of tokens) {
    let h1 = 2_166_136_261;
    let h2 = 16_777_619;
    for (let i = 0; i < token.length; i++) {
      const code = token.charCodeAt(i);
      h1 = Math.imul(h1 + code, 16_777_619);
      h2 = Math.imul(h2, 31) + code;
    }
    const idx1 = Math.abs(h1) % dimensions;
    const idx2 = Math.abs(h2) % dimensions;
    const sign = Math.abs(h1) % 2 === 0 ? 1 : -1;
    vec[idx1] = (vec[idx1] ?? 0) + sign * 1.0;
    vec[idx2] = (vec[idx2] ?? 0) + sign * 0.5;
  }

  let normSq = 0;
  for (const v of vec) {
    normSq += v * v;
  }
  const norm = Math.sqrt(normSq) || 1;
  for (let i = 0; i < dimensions; i++) {
    vec[i] = Number(((vec[i] ?? 0) / norm).toFixed(6));
  }
  return vec;
}

async function fetchTagLabelsFromDb(
  entityType: "game_level" | "lesson" | "activity",
  entityId: number
): Promise<string[]> {
  const db = getOwnerDb();
  const rows = await db
    .select({ label: contentTags.label })
    .from(contentTagMap)
    .innerJoin(contentTags, eq(contentTags.id, contentTagMap.tagId))
    .where(
      and(
        eq(contentTagMap.entityType, entityType),
        eq(contentTagMap.entityId, entityId)
      )
    );
  return rows.map((r) => r.label);
}

async function loadGameLevelSourceText(
  contentId: number,
  contentVersion: number
): Promise<string | null> {
  const db = getOwnerDb();
  const [row] = await db
    .select({
      entityId: gameLevels.entityId,
      title: gameLevels.title,
      description: gameLevels.description,
      instruction: gameLevels.instruction,
    })
    .from(gameLevels)
    .where(
      and(
        eq(gameLevels.entityId, contentId),
        eq(gameLevels.contentVersion, contentVersion)
      )
    )
    .limit(1);
  if (!row) {
    return null;
  }
  const tagLabels = await fetchTagLabelsFromDb("game_level", row.entityId);
  return composeEmbeddingSourceText({ ...row, tagLabels });
}

async function loadLessonSourceText(
  contentId: number,
  contentVersion: number
): Promise<string | null> {
  const db = getOwnerDb();
  const [row] = await db
    .select({
      entityId: lessons.entityId,
      title: lessons.title,
      guide: lessons.guide,
      warmUp: lessons.warmUp,
    })
    .from(lessons)
    .where(
      and(
        eq(lessons.entityId, contentId),
        eq(lessons.contentVersion, contentVersion)
      )
    )
    .limit(1);
  if (!row) {
    return null;
  }
  const tagLabels = await fetchTagLabelsFromDb("lesson", row.entityId);
  return composeEmbeddingSourceText({
    title: row.title,
    description: row.guide,
    instruction: row.warmUp,
    tagLabels,
  });
}

async function loadActivitySourceText(
  contentId: number,
  contentVersion: number
): Promise<string | null> {
  const db = getOwnerDb();
  const [row] = await db
    .select({
      entityId: activities.entityId,
      title: activities.title,
      instruction: activities.instruction,
      materials: activities.materials,
    })
    .from(activities)
    .where(
      and(
        eq(activities.entityId, contentId),
        eq(activities.contentVersion, contentVersion)
      )
    )
    .limit(1);
  if (!row) {
    return null;
  }
  const tagLabels = await fetchTagLabelsFromDb("activity", row.entityId);
  return composeEmbeddingSourceText({
    title: row.title,
    description: row.materials,
    instruction: row.instruction,
    tagLabels,
  });
}

async function loadSourceTextFromDb(
  payload: EmbedContentPayload
): Promise<string> {
  let found: string | null = null;
  if (payload.contentType === "game_level") {
    found = await loadGameLevelSourceText(
      payload.contentId,
      payload.contentVersion
    );
  } else if (payload.contentType === "lesson") {
    found = await loadLessonSourceText(
      payload.contentId,
      payload.contentVersion
    );
  } else if (payload.contentType === "activity") {
    found = await loadActivitySourceText(
      payload.contentId,
      payload.contentVersion
    );
  }
  return (
    found ??
    `${payload.contentType}:${payload.contentId}:v${payload.contentVersion}`
  );
}

function resolveDimensionsForModel(model: string): number {
  if (model.includes("MiniLM") || model.includes("384")) {
    return 384;
  }
  return DEFAULT_EMBEDDING_DIMENSION;
}

function defaultGenerateEmbedding(
  text: string,
  model: string
): Promise<number[]> {
  const dimensions = resolveDimensionsForModel(model);
  return Promise.resolve(generateDeterministicEmbedding(text, dimensions));
}

async function upsertEmbeddingToDb(
  record: UpsertContentEmbeddingRecord
): Promise<void> {
  const db = getOwnerDb();
  await db
    .insert(contentEmbeddings)
    .values({
      contentType: record.contentType,
      contentId: record.contentId,
      contentVersion: record.contentVersion,
      model: record.model,
      chunkIndex: record.chunkIndex,
      chunkText: record.chunkText,
      embedding: record.embedding,
      updatedAt: new Date(),
    })
    .onConflictDoUpdate({
      target: [
        contentEmbeddings.contentType,
        contentEmbeddings.contentId,
        contentEmbeddings.contentVersion,
        contentEmbeddings.model,
        contentEmbeddings.chunkIndex,
      ],
      set: {
        chunkText: record.chunkText,
        embedding: record.embedding,
        updatedAt: new Date(),
      },
    });
}

export async function runEmbedContentJob(
  payload: EmbedContentPayload,
  overrides?: Partial<EmbedContentDeps>
): Promise<{
  contentType: string;
  contentId: number;
  contentVersion: number;
  model: string;
  dimensions: number;
}> {
  const loadSourceText =
    overrides?.loadSourceText ??
    activeDepsOverride?.loadSourceText ??
    loadSourceTextFromDb;
  const generateEmbedding =
    overrides?.generateEmbedding ??
    activeDepsOverride?.generateEmbedding ??
    defaultGenerateEmbedding;
  const upsertEmbedding =
    overrides?.upsertEmbedding ??
    activeDepsOverride?.upsertEmbedding ??
    upsertEmbeddingToDb;

  const model = payload.model || DEFAULT_EMBEDDING_MODEL;
  const sourceText = await loadSourceText(payload);
  const embedding = await generateEmbedding(sourceText, model);

  await upsertEmbedding({
    contentType: payload.contentType,
    contentId: payload.contentId,
    contentVersion: payload.contentVersion,
    model,
    chunkIndex: 0,
    chunkText: sourceText,
    embedding,
  });

  return {
    contentType: payload.contentType,
    contentId: payload.contentId,
    contentVersion: payload.contentVersion,
    model,
    dimensions: embedding.length,
  };
}

export const embedContent: Consumer<"embed:content"> = async (payload, ctx) => {
  const result = await runEmbedContentJob(payload);
  logJobDone("embed:content", ctx, result);
};
