import { drizzle } from "drizzle-orm/postgres-js";
import postgres from "postgres";

export * from "./auth-reauth-methods.ts";
export * from "./auth-session-store.ts";

export * from "./purge.ts";
export * from "./schema/adaptive.ts";
export * from "./schema/billing.ts";
export * from "./schema/child.ts";
export * from "./schema/content.ts";
export * from "./schema/curriculum.ts";
export * from "./schema/game.ts";
export * from "./schema/identity.ts";
export * from "./schema/ops.ts";
export * from "./schema/play.ts";
export * from "./schema/tagging.ts";
export * from "./schema/taxonomy.ts";

let ownerDbInstance: ReturnType<typeof drizzle> | undefined;
let appDbInstance: ReturnType<typeof drizzle> | undefined;
let ownerSqlInstance: ReturnType<typeof postgres> | undefined;
let appSqlInstance: ReturnType<typeof postgres> | undefined;

export function getOwnerSql(): ReturnType<typeof postgres> {
  if (!ownerSqlInstance) {
    const url =
      process.env.DATABASE_URL ??
      "postgres://postgres:postgres@localhost:5433/kidthink";
    ownerSqlInstance = postgres(url);
  }
  return ownerSqlInstance;
}

export function getAppSql(): ReturnType<typeof postgres> {
  if (!appSqlInstance) {
    const url =
      process.env.DATABASE_URL_APP ??
      "postgres://kidthink_app:kidthink_app_password@localhost:5433/kidthink";
    appSqlInstance = postgres(url);
  }
  return appSqlInstance;
}

/**
 * Returns Drizzle database instance connected with owner (postgres) role.
 * Used for migrations, DDL, and administrative scripts.
 * Lazy-initialized on first call to prevent side-effects on module import.
 */
export function getOwnerDb() {
  if (!ownerDbInstance) {
    ownerDbInstance = drizzle(getOwnerSql());
  }
  return ownerDbInstance;
}

/**
 * Returns Drizzle database instance connected with app (kidthink_app) role.
 * Used for runtime application operations in apps/* with restricted permissions.
 * Lazy-initialized on first call to prevent side-effects on module import.
 */
export function getAppDb() {
  if (!appDbInstance) {
    appDbInstance = drizzle(getAppSql());
  }
  return appDbInstance;
}
