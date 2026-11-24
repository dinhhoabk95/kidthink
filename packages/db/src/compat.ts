import type { DbExecutor } from "#src/client";

export async function runAtomic<T>(
  db: DbExecutor,
  fn: (tx: DbExecutor) => Promise<T>
): Promise<T> {
  return await db.transaction(async (tx) => await fn(tx));
}
