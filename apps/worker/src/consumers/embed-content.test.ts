import {
  DEFAULT_EMBEDDING_DIMENSION,
  DEFAULT_EMBEDDING_MODEL,
} from "@mindkid/shared";
import { afterEach, beforeEach, describe, expect, it } from "vitest";
import {
  composeEmbeddingSourceText,
  embedContent,
  generateDeterministicEmbedding,
  runEmbedContentJob,
  setEmbedContentDeps,
  type UpsertContentEmbeddingRecord,
} from "./embed-content.js";
import { CONSUMERS } from "./index.js";
import type { JobContext } from "./types.js";

function createInMemoryEmbeddingStore(): {
  rows: Map<string, UpsertContentEmbeddingRecord>;
  upsertEmbedding: (record: UpsertContentEmbeddingRecord) => Promise<void>;
} {
  const rows = new Map<string, UpsertContentEmbeddingRecord>();
  return {
    rows,
    upsertEmbedding(record: UpsertContentEmbeddingRecord): Promise<void> {
      const key = `${record.contentType}:${record.contentId}:${record.contentVersion}:${record.model}:${record.chunkIndex}`;
      rows.set(key, { ...record, embedding: [...record.embedding] });
      return Promise.resolve();
    },
  };
}

function createFakeJobContext(): JobContext {
  return {
    jobId: "embed-job-1",
    attempt: 1,
    signal: new AbortController().signal,
  };
}

describe("Worker consumer embed:content (BR-SEM-03, BR-SEM-04)", () => {
  let store: ReturnType<typeof createInMemoryEmbeddingStore>;
  let currentText =
    "Bé đếm quả táo từ 1 đến 5\nHướng dẫn chạm từng quả táo\nThẻ nội dung: Đếm số, Quả táo";

  beforeEach(() => {
    store = createInMemoryEmbeddingStore();
    currentText =
      "Bé đếm quả táo từ 1 đến 5\nHướng dẫn chạm từng quả táo\nThẻ nội dung: Đếm số, Quả táo";
    setEmbedContentDeps({
      loadSourceText: () => Promise.resolve(currentText),
      upsertEmbedding: store.upsertEmbedding,
    });
  });

  afterEach(() => {
    setEmbedContentDeps(null);
  });

  it("tạo 1 hàng trong content_embeddings với đúng số chiều vector (1536 và 384)", async () => {
    const ctx = createFakeJobContext();

    await embedContent(
      {
        contentType: "game_level",
        contentId: 101,
        contentVersion: 1,
        model: DEFAULT_EMBEDDING_MODEL,
      },
      ctx
    );

    expect(store.rows.size).toBe(1);
    const savedDefault = store.rows.get(
      `game_level:101:1:${DEFAULT_EMBEDDING_MODEL}:0`
    );
    expect(savedDefault).toBeDefined();
    expect(savedDefault?.embedding).toHaveLength(DEFAULT_EMBEDDING_DIMENSION);

    await CONSUMERS["embed:content"](
      {
        contentType: "lesson",
        contentId: 202,
        contentVersion: 1,
        model: "all-MiniLM-L6-v2",
      },
      ctx
    );

    expect(store.rows.size).toBe(2);
    const savedMiniLm = store.rows.get("lesson:202:1:all-MiniLM-L6-v2:0");
    expect(savedMiniLm).toBeDefined();
    expect(savedMiniLm?.embedding).toHaveLength(384);
  });

  it("chạy lại lần 2 cùng (contentType, contentId, contentVersion, model) thì cập nhật idempotent không tạo bản sao", async () => {
    const payload = {
      contentType: "game_level",
      contentId: 303,
      contentVersion: 2,
      model: DEFAULT_EMBEDDING_MODEL,
    };

    await runEmbedContentJob(payload);
    expect(store.rows.size).toBe(1);
    const firstVector = store.rows.get(
      `game_level:303:2:${DEFAULT_EMBEDDING_MODEL}:0`
    )?.embedding;
    expect(firstVector).toBeDefined();

    currentText =
      "Bé học đếm nâng cao từ 1 đến 10\nThẻ nội dung: Đếm số nâng cao";
    await runEmbedContentJob(payload);

    expect(store.rows.size).toBe(1);
    const updatedVector = store.rows.get(
      `game_level:303:2:${DEFAULT_EMBEDDING_MODEL}:0`
    )?.embedding;
    expect(updatedVector).toBeDefined();
    expect(updatedVector).not.toEqual(firstVector);
  });

  it("ném lỗi khi embedding provider thất bại để BullMQ retry (không nuốt lỗi)", async () => {
    setEmbedContentDeps({
      loadSourceText: () => Promise.resolve(currentText),
      generateEmbedding: () =>
        Promise.reject(new Error("Embedding provider timeout")),
      upsertEmbedding: store.upsertEmbedding,
    });

    await expect(
      embedContent(
        {
          contentType: "activity",
          contentId: 404,
          contentVersion: 1,
          model: DEFAULT_EMBEDDING_MODEL,
        },
        createFakeJobContext()
      )
    ).rejects.toThrow("Embedding provider timeout");

    expect(store.rows.size).toBe(0);
  });

  it("composeEmbeddingSourceText ghép tiêu đề, mô tả, hướng dẫn và nhãn thẻ nội dung", () => {
    const composed = composeEmbeddingSourceText({
      title: "Bé học đếm",
      description: "Nhận biết số lượng từ 1 đến 5",
      instruction: "Chạm vào từng quả táo",
      tagLabels: ["Đếm 1-5", "Trái cây"],
    });

    expect(composed).toContain("Bé học đếm");
    expect(composed).toContain("Nhận biết số lượng từ 1 đến 5");
    expect(composed).toContain("Chạm vào từng quả táo");
    expect(composed).toContain("Thẻ nội dung: Đếm 1-5, Trái cây");

    const vec = generateDeterministicEmbedding(composed, 384);
    expect(vec).toHaveLength(384);
  });
});
