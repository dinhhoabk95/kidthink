import type { DbConnectionName } from "@mindkid/config";
import { sql } from "drizzle-orm";
import type { DbExecutor } from "#src/client";
import { runAtomic } from "#src/compat";
import { DB } from "#src/manager";

export type DbRepositoryTarget = DbExecutor | DbConnectionName;

export type {
  CursorPaginatedResult,
  CursorPaginationOptions,
  OffsetPaginationOptions,
  PaginatedResult,
} from "#src/repositories/utils";

export abstract class BaseRepository {
  protected readonly target: DbRepositoryTarget | undefined;

  constructor(target?: DbRepositoryTarget) {
    this.target = target;
  }

  protected get db(): DbExecutor {
    if (this.target === undefined) {
      return DB.connection();
    }
    if (typeof this.target === "string") {
      return DB.connection(this.target);
    }
    return this.target;
  }

  protected get ownerDb(): DbExecutor {
    if (this.target === undefined) {
      return DB.ownerConnection();
    }
    if (typeof this.target === "string") {
      return DB.ownerConnection(this.target);
    }
    return this.target;
  }

  async transaction<TResult>(
    fn: (tx: DbExecutor) => Promise<TResult>
  ): Promise<TResult> {
    return await runAtomic(this.db, fn);
  }

  async ping(): Promise<void> {
    await this.db.run(sql`SELECT 1`);
  }
}
