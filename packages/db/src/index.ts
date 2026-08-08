import { drizzle } from "drizzle-orm/postgres-js";
import postgres from "postgres";

export * from "./schema/billing.ts";
export * from "./schema/game.ts";
export * from "./schema/identity.ts";
export * from "./schema/ops.ts";
export * from "./schema/tagging.ts";
export * from "./schema/taxonomy.ts";

let ownerDbInstance: ReturnType<typeof drizzle> | undefined;
let appDbInstance: ReturnType<typeof drizzle> | undefined;

/**
 * Returns Drizzle database instance connected with owner (postgres) role.
 * Used for migrations, DDL, and administrative scripts.
 * Lazy-initialized on first call to prevent side-effects on module import.
 */
export function getOwnerDb() {
  if (!ownerDbInstance) {
    const url =
      process.env.DATABASE_URL ??
      "postgres://postgres:postgres@localhost:5433/kidthink";
    const client = postgres(url);
    ownerDbInstance = drizzle(client);
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
    const url =
      process.env.DATABASE_URL_APP ??
      "postgres://kidthink_app:kidthink_app_password@localhost:5433/kidthink";
    const client = postgres(url);
    appDbInstance = drizzle(client);
  }
  return appDbInstance;
}
