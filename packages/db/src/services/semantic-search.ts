import {
  AiSearchQuerySchema,
  CREDIT_COST_MAP,
  DEFAULT_EMBEDDING_MODEL,
} from "@mindkid/shared";
import { and, eq, sql } from "drizzle-orm";
import { getOwnerDb } from "#src/client";
import { aiUsageLog } from "#src/schema/ai";
import { lessons } from "#src/schema/content";
import { gameLevels } from "#src/schema/game";
import { debitAiCredits, refundAiCredits } from "./ai-credit.ts";
import { assertNoEgressViolation } from "./ai-egress-guard.ts";
import { aiProvider } from "./ai-provider.ts";
import { searchContentPublished } from "./content-search.ts";

export interface SemanticSearchResultItem {
  id: number;
  content_type: "game_level" | "lesson";
  code: string;
  title: string;
  instruction?: string;
  summary?: string;
  age_min: number;
  age_max: number;
  difficulty: number;
  access_tier: "free" | "login" | "standard" | "premium";
  content_pack?: unknown;
  is_locked: boolean;
  score: number;
}

export interface SemanticSearchResponse {
  query: string;
  total: number;
  fallback: boolean;
  credits_spent: number;
  items: SemanticSearchResultItem[];
}

const TIER_RANK: Record<string, number> = {
  free: 0,
  login: 1,
  standard: 2,
  premium: 3,
};

async function hydrateGameLevel(
  db: ReturnType<typeof getOwnerDb>,
  contentId: number,
  similarity: number,
  userRank: number
): Promise<SemanticSearchResultItem | null> {
  const [gl] = await db
    .select()
    .from(gameLevels)
    .where(
      and(eq(gameLevels.id, contentId), eq(gameLevels.status, "published"))
    )
    .limit(1);

  if (!gl) {
    return null;
  }

  const itemTier = gl.accessTier as "free" | "login" | "standard" | "premium";
  const isLocked = (TIER_RANK[itemTier] ?? 0) > userRank;

  return {
    id: gl.id,
    content_type: "game_level",
    code: gl.code,
    title: gl.title,
    instruction: gl.instruction ?? undefined,
    age_min:
      gl.ageMin !== null && gl.ageMin !== undefined ? Number(gl.ageMin) : 3,
    age_max:
      gl.ageMax !== null && gl.ageMax !== undefined ? Number(gl.ageMax) : 6,
    difficulty:
      gl.difficulty !== null && gl.difficulty !== undefined
        ? Number(gl.difficulty)
        : 1,
    access_tier: itemTier,
    content_pack: isLocked ? undefined : gl.contentPack,
    is_locked: isLocked,
    score: Number(similarity.toFixed(4)),
  };
}

async function hydrateLesson(
  db: ReturnType<typeof getOwnerDb>,
  contentId: number,
  similarity: number,
  userRank: number
): Promise<SemanticSearchResultItem | null> {
  const [ls] = await db
    .select()
    .from(lessons)
    .where(and(eq(lessons.id, contentId), eq(lessons.status, "published")))
    .limit(1);

  if (!ls) {
    return null;
  }

  const itemTier = ls.accessTier as "free" | "login" | "standard" | "premium";
  const isLocked = (TIER_RANK[itemTier] ?? 0) > userRank;

  return {
    id: ls.id,
    content_type: "lesson",
    code: ls.code,
    title: ls.title,
    instruction: ls.guide ?? undefined,
    age_min:
      ls.targetAgeMin !== null && ls.targetAgeMin !== undefined
        ? Number(ls.targetAgeMin)
        : 3,
    age_max:
      ls.targetAgeMax !== null && ls.targetAgeMax !== undefined
        ? Number(ls.targetAgeMax)
        : 6,
    difficulty: 1,
    access_tier: itemTier,
    content_pack: undefined,
    is_locked: isLocked,
    score: Number(similarity.toFixed(4)),
  };
}

async function executeFallback(
  userId: number,
  cleanQuery: string,
  searchLimit: number,
  creditCost: number,
  idempotencyKey: string
): Promise<SemanticSearchResponse> {
  await refundAiCredits({
    userId,
    amount: creditCost,
    refType: "search_query",
    refId: idempotencyKey,
    grantReason: "Refund for failed semantic search provider call",
  });

  const baseResult = await searchContentPublished(cleanQuery, {
    limit: searchLimit,
  });

  const fallbackItems: SemanticSearchResultItem[] = baseResult.items.map(
    (item) => ({
      id: item.id,
      content_type: item.contentType as "game_level" | "lesson",
      code: item.code,
      title: item.title,
      instruction: item.instruction ?? undefined,
      age_min: item.ageMin,
      age_max: item.ageMax,
      difficulty: item.difficulty,
      access_tier: item.accessTier as "free" | "login" | "standard" | "premium",
      is_locked: false,
      score: item.rank,
    })
  );

  return {
    query: cleanQuery,
    total: fallbackItems.length,
    fallback: true,
    credits_spent: 0,
    items: fallbackItems,
  };
}

// biome-ignore lint/style/useConsistentTypeDefinitions: needed for drizzle query execution type
type EmbeddingSearchRow = {
  content_type: string;
  content_id: number;
  content_version: number;
  cosine_dist: number;
};

async function queryVectorDatabase(
  db: ReturnType<typeof getOwnerDb>,
  vectorStr: string,
  searchLimit: number
): Promise<EmbeddingSearchRow[]> {
  const result = await db.execute<EmbeddingSearchRow>(
    sql`
      SELECT 
        ce.content_type,
        ce.content_id,
        ce.content_version,
        (ce.embedding <=> ${vectorStr}::vector) as cosine_dist
      FROM content_embeddings ce
      WHERE ce.model = ${DEFAULT_EMBEDDING_MODEL}
        AND (
          (ce.content_type = 'game_level' AND EXISTS (
            SELECT 1 FROM game_levels gl 
            WHERE gl.id = ce.content_id 
              AND gl.status = 'published' 
              AND gl.content_version = ce.content_version
          ))
          OR
          (ce.content_type = 'lesson' AND EXISTS (
            SELECT 1 FROM lessons l 
            WHERE l.id = ce.content_id 
              AND l.status = 'published' 
              AND l.content_version = ce.content_version
          ))
        )
      ORDER BY ce.embedding <=> ${vectorStr}::vector ASC
      LIMIT ${searchLimit * 2}
    `
  );
  return Array.from(result);
}

async function hydrateItems(
  db: ReturnType<typeof getOwnerDb>,
  rows: EmbeddingSearchRow[],
  userRank: number
): Promise<SemanticSearchResultItem[]> {
  const items: SemanticSearchResultItem[] = [];

  for (const row of rows) {
    const similarity = Math.max(0, 1 - Number(row.cosine_dist));
    if (row.content_type === "game_level") {
      const item = await hydrateGameLevel(
        db,
        Number(row.content_id),
        similarity,
        userRank
      );
      if (item) {
        items.push(item);
      }
    } else if (row.content_type === "lesson") {
      const item = await hydrateLesson(
        db,
        Number(row.content_id),
        similarity,
        userRank
      );
      if (item) {
        items.push(item);
      }
    }
  }

  items.sort((a, b) => {
    if (a.is_locked !== b.is_locked) {
      return a.is_locked ? 1 : -1;
    }
    return b.score - a.score;
  });

  return items;
}

export async function performSemanticSearch(
  userId: number,
  query: string,
  limit = 10,
  userTier: "free" | "login" | "standard" | "premium" = "free"
): Promise<SemanticSearchResponse> {
  const db = getOwnerDb();
  const parsed = AiSearchQuerySchema.parse({ q: query, limit });
  const cleanQuery = parsed.q;
  const searchLimit = parsed.limit;

  assertNoEgressViolation(cleanQuery, "semantic_search_query");

  const creditCost = CREDIT_COST_MAP.semantic_search;
  const idempotencyKey = `sem_search_${userId}_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`;

  await debitAiCredits({
    userId,
    amount: creditCost,
    feature: "semantic_search",
    refType: "search_query",
    refId: idempotencyKey,
    idempotencyKey,
  });

  try {
    const queryVector = await aiProvider.generateEmbedding(
      cleanQuery,
      DEFAULT_EMBEDDING_MODEL
    );

    const vectorStr = `[${queryVector.join(",")}]`;
    const rows = await queryVectorDatabase(db, vectorStr, searchLimit);

    await db.insert(aiUsageLog).values({
      userId,
      feature: "semantic_search",
      creditsSpent: creditCost,
      model: DEFAULT_EMBEDDING_MODEL,
      promptVersion: "v1.0",
      inputTokens: Math.ceil(cleanQuery.length / 4),
      outputTokens: 0,
      costUsdMicros: 10,
      moderationPassed: true,
    });

    const userRank = TIER_RANK[userTier] ?? 0;
    const items = await hydrateItems(db, rows, userRank);

    return {
      query: cleanQuery,
      total: items.length,
      fallback: false,
      credits_spent: creditCost,
      items: items.slice(0, searchLimit),
    };
  } catch (_error) {
    return executeFallback(
      userId,
      cleanQuery,
      searchLimit,
      creditCost,
      idempotencyKey
    );
  }
}
