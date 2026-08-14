import { drizzle } from "drizzle-orm/postgres-js";
import postgres from "postgres";

let ownerDbInstance: ReturnType<typeof drizzle> | undefined;
let appDbInstance: ReturnType<typeof drizzle> | undefined;
let ownerSqlInstance: ReturnType<typeof postgres> | undefined;
let appSqlInstance: ReturnType<typeof postgres> | undefined;

export function getOwnerSql(): ReturnType<typeof postgres> {
  if (!ownerSqlInstance) {
    const url =
      process.env.DATABASE_URL ??
      "postgres://postgres:postgres@localhost:5433/kidthink";
    ownerSqlInstance = postgres(url, { max: 1 });
  }
  return ownerSqlInstance;
}

export function getAppSql(): ReturnType<typeof postgres> {
  if (!appSqlInstance) {
    const url =
      process.env.DATABASE_URL_APP ??
      "postgres://kidthink_app:kidthink_app_password@localhost:5433/kidthink";
    appSqlInstance = postgres(url, { max: 1 });
  }
  return appSqlInstance;
}

export function getOwnerDb() {
  if (!ownerDbInstance) {
    ownerDbInstance = drizzle(getOwnerSql());
  }
  return ownerDbInstance;
}

export function getAppDb() {
  if (!appDbInstance) {
    appDbInstance = drizzle(getAppSql());
  }
  return appDbInstance;
}

export const getDb = getOwnerDb;
