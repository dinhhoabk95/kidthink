import type {
  ObjectGetResult,
  ObjectPutInput,
  ObjectStorageDriver,
} from "#src/object-storage-driver";
import { MAX_IN_MEMORY_STORE_ENTRIES } from "#src/storage-common";

interface InMemoryEntry {
  readonly body: Uint8Array;
  readonly contentType: string;
  readonly expiresAt: Date | undefined;
}

/**
 * Driver mặc định cho dev/test khi chưa đặt driver nào (BR-IMG-11).
 * Giới hạn số mục để không tràn bộ nhớ; mục cũ nhất bị loại trước.
 */
export class InMemoryObjectStorageDriver implements ObjectStorageDriver {
  private readonly entries = new Map<string, InMemoryEntry>();

  private static slot(bucket: "public" | "private", key: string): string {
    return `${bucket}:${key}`;
  }

  putObject(input: ObjectPutInput): Promise<{ readonly key: string }> {
    const slot = InMemoryObjectStorageDriver.slot(input.bucket, input.key);
    if (
      !this.entries.has(slot) &&
      this.entries.size >= MAX_IN_MEMORY_STORE_ENTRIES
    ) {
      const oldest = this.entries.keys().next().value;
      if (oldest !== undefined) {
        this.entries.delete(oldest);
      }
    }
    this.entries.set(slot, {
      body: new Uint8Array(input.body),
      contentType: input.contentType,
      expiresAt: input.expiresAt,
    });
    return Promise.resolve({ key: input.key });
  }

  getObject(
    bucket: "public" | "private",
    key: string
  ): Promise<ObjectGetResult | undefined> {
    const slot = InMemoryObjectStorageDriver.slot(bucket, key);
    const entry = this.entries.get(slot);
    if (!entry) {
      return Promise.resolve(undefined);
    }
    if (entry.expiresAt && entry.expiresAt.getTime() <= Date.now()) {
      this.entries.delete(slot);
      return Promise.resolve(undefined);
    }
    return Promise.resolve({
      body: entry.body,
      contentType: entry.contentType,
    });
  }

  deleteObject(bucket: "public" | "private", key: string): Promise<boolean> {
    return Promise.resolve(
      this.entries.delete(InMemoryObjectStorageDriver.slot(bucket, key))
    );
  }
}
