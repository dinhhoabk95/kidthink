import { AsyncLocalStorage } from "node:async_hooks";
import {
  type DbConnectionName,
  getDbConnectionName,
  isCloudflareRuntime,
} from "@mindkid/config";
import { sql } from "drizzle-orm";
import type { D1BindingInput } from "#src/d1/types";
import { D1Driver } from "#src/drivers/d1-driver";
import { SqliteLocalDriver } from "#src/drivers/sqlite-local-driver";
import type { AppDb, DatabaseDriver, OwnerDb } from "#src/drivers/types";

export class DatabaseManager {
  private defaultConnectionOverride: DbConnectionName | undefined;
  private readonly scopedConnection = new AsyncLocalStorage<DbConnectionName>();
  private readonly sqliteDriver = new SqliteLocalDriver();
  private readonly d1Driver = new D1Driver();

  getDefaultConnection(): DbConnectionName {
    if (this.defaultConnectionOverride !== undefined) {
      return this.defaultConnectionOverride;
    }
    if (this.d1Driver.hasBindings() && isCloudflareRuntime()) {
      return "d1";
    }
    const configured = getDbConnectionName();
    return configured === "d1" ? "d1" : "sqlite";
  }

  setDefaultConnection(name: DbConnectionName): void {
    this.defaultConnectionOverride = name;
  }

  resetDefaultConnection(): void {
    this.defaultConnectionOverride = undefined;
  }

  private resolveTargetConnection(name?: DbConnectionName): DbConnectionName {
    if (name !== undefined) {
      return name;
    }
    const scoped = this.scopedConnection.getStore();
    if (scoped !== undefined) {
      return scoped;
    }
    return this.getDefaultConnection();
  }

  private resolveDriver(name?: DbConnectionName): DatabaseDriver {
    const target = this.resolveTargetConnection(name);
    if (target === "d1") {
      return this.d1Driver;
    }
    return this.sqliteDriver;
  }

  connection(name?: DbConnectionName): AppDb {
    return this.resolveDriver(name).getAppDb();
  }

  ownerConnection(name?: DbConnectionName): OwnerDb {
    return this.resolveDriver(name).getOwnerDb();
  }

  registerD1Bindings(binding: D1BindingInput): void {
    this.d1Driver.setBindings(binding);
  }

  enterCloudflareD1Binding(binding: D1BindingInput): void {
    this.d1Driver.enterRequestBinding(binding);
  }

  clearD1Bindings(): void {
    this.d1Driver.clearBindings();
  }

  configureSqlite(options: { dataDir: string }): void {
    this.sqliteDriver.configure({ dataDir: options.dataDir });
  }

  getSqliteDriver(): SqliteLocalDriver {
    return this.sqliteDriver;
  }

  getD1Driver(): D1Driver {
    return this.d1Driver;
  }

  async usingConnection<T>(
    name: DbConnectionName,
    fn: (db: AppDb) => Promise<T>
  ): Promise<T> {
    const db = this.connection(name);
    return await this.scopedConnection.run(name, async () => await fn(db));
  }

  async transaction<T>(
    fn: (tx: AppDb) => Promise<T>,
    name?: DbConnectionName
  ): Promise<T> {
    const db = this.connection(name);
    return await db.transaction(async (tx) => await fn(tx));
  }

  async ping(name?: DbConnectionName): Promise<void> {
    await this.ownerConnection(name).run(sql`SELECT 1`);
  }

  async disconnectAll(): Promise<void> {
    await Promise.all([
      this.sqliteDriver.disconnect(),
      this.d1Driver.disconnect(),
    ]);
  }
}

export const DB = new DatabaseManager();
